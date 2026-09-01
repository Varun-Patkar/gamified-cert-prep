/** The full-tab session reader. Markdown is rendered host-side by markdown/render.ts. */

import * as vscode from "vscode";
import { normalizeBank } from "../quiz/quizEngine";
import type { ExtensionState } from "../state/extensionState";
import { PanelHost, type PanelHostOptions } from "./panelHost";
import { buildSessionModel, type SessionModel } from "./sessionModel";

export const SESSION_PANEL: PanelHostOptions = { viewType: "certPrep.session", script: "session.js" };

export interface SessionDeps {
	startQuiz(examId: string, day: number): Promise<void> | void;
	openDashboard(examId: string): Promise<void> | void;
}

export class SessionView implements vscode.Disposable {
	private readonly host: PanelHost;
	private examId?: string;
	private day = 0;
	private readonly preparing = new Set<string>();

	constructor(
		extensionUri: vscode.Uri,
		private readonly state: ExtensionState,
		private readonly deps: SessionDeps
	) {
		this.host = new PanelHost(extensionUri, SESSION_PANEL);
	}

	async open(examId: string, day: number): Promise<void> {
		const snapshot = this.state.findSnapshot(examId);
		if (!snapshot) {
			void vscode.window.showWarningMessage("That exam is not in the bound prep repo.");
			return;
		}
		this.examId = examId;
		this.day = day;
		this.host.reveal(
			`${snapshot.meta.code} — Day ${day}`,
			(message) => void this.handle(message),
			() => {
				this.examId = undefined;
			}
		);
		await this.refresh();
		await this.prepare(examId, day);
	}

	async refresh(): Promise<void> {
		const model = await this.model();
		if (model) {
			this.host.post({ type: "state/update", state: model });
		}
	}

	dispose(): void {
		this.host.dispose();
	}

	/** Missing material is delegated to chat so research and source use stay visible. */
	private async prepare(examId: string, day: number): Promise<void> {
		const store = this.state.store;
		const snapshot = this.state.findSnapshot(examId);
		const planDay = snapshot?.plan?.days.find((entry) => entry.day === day);
		if (!store || !snapshot || !planDay || snapshot.meta.legacy) {
			return;
		}
		const existing = await store.readSessionMaterial(snapshot.meta.folder, day);
		if (existing && existing.trim()) {
			return;
		}

		const key = `${examId}:${day}`;
		if (this.preparing.has(key)) {
			return;
		}
		this.preparing.add(key);
		try {
			const query = `@certprep Create Day ${day} session for ${snapshot.meta.code}: "${planDay.title}". Research current official sources, write it to the session file, and match the depth and source quality of my completed sessions.`;
			await vscode.commands.executeCommand("workbench.action.chat.open", { query });
		} catch (error) {
			void vscode.window.showWarningMessage(
				`Day ${day} notes could not be written: ${error instanceof Error ? error.message : String(error)}`
			);
		} finally {
			this.preparing.delete(key);
		}
	}

	private async model(): Promise<SessionModel | undefined> {
		const examId = this.examId;
		const store = this.state.store;
		if (!examId || !store) {
			return undefined;
		}
		const snapshot = this.state.findSnapshot(examId);
		if (!snapshot) {
			return undefined;
		}
		const markdown = await store.readSessionMaterial(snapshot.meta.folder, this.day);
		const bank = await store.readQuestions(snapshot.meta.folder);
		return buildSessionModel({
			meta: snapshot.meta,
			day: this.day,
			planDay: snapshot.plan?.days.find((entry) => entry.day === this.day),
			markdown,
			progress: snapshot.progress,
			availableQuestions: normalizeBank(bank).length,
		});
	}

	private async handle(message: { type: string; url?: string }): Promise<void> {
		const examId = this.examId;
		if (!examId) {
			return;
		}
		switch (message.type) {
			case "webview/ready":
				await this.refresh();
				break;
			case "command/startQuiz":
				await this.deps.startQuiz(examId, this.day);
				break;
			case "command/backToDashboard":
				await this.deps.openDashboard(examId);
				break;
			case "command/askAboutSession":
				await this.askAboutSession();
				break;
			case "command/openSource":
				await openExternal(message.url);
				break;
			default:
				break;
		}
	}

	private async askAboutSession(): Promise<void> {
		const snapshot = this.examId ? this.state.findSnapshot(this.examId) : undefined;
		const planDay = snapshot?.plan?.days.find((entry) => entry.day === this.day);
		const topic = planDay?.title ?? `Day ${this.day}`;
		const query = `@certprep I'm on Day ${this.day} of ${snapshot?.meta.code ?? "my exam"} ("${topic}"). Explain the trickiest ideas in this session and quiz me on them.`;
		try {
			await vscode.commands.executeCommand("workbench.action.chat.open", { query });
		} catch {
			void vscode.window.showInformationMessage("Chat is not available in this window.");
		}
	}
}

async function openExternal(url: string | undefined): Promise<void> {
	if (!url || !/^https?:\/\//i.test(url)) {
		return;
	}
	await vscode.env.openExternal(vscode.Uri.parse(url));
}
