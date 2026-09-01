/** The full-tab exam dashboard. Derivation lives in dashboardModel.ts; rendering in media/dashboard.js. */

import * as vscode from "vscode";
import { gamificationEnabled } from "../certificates/certificateService";
import type { ExtensionState } from "../state/extensionState";
import { buildDashboardModel, type DashboardModel } from "./dashboardModel";
import { PanelHost, type PanelHostOptions } from "./panelHost";

export const DASHBOARD_PANEL: PanelHostOptions = { viewType: "certPrep.dashboard", script: "dashboard.js" };

export interface DashboardDeps {
	openSession(examId: string, day: number): Promise<void> | void;
	startQuiz(examId: string, day: number): Promise<void> | void;
	buildPlan(examId: string): Promise<void> | void;
	openBattlePass(examId: string): Promise<void> | void;
	openCertificate(examId: string, domainId: string): Promise<void> | void;
	openCompletion(examId: string): Promise<void> | void;
}

export class DashboardView implements vscode.Disposable {
	private readonly host: PanelHost;
	private examId?: string;

	constructor(
		extensionUri: vscode.Uri,
		private readonly state: ExtensionState,
		private readonly deps: DashboardDeps
	) {
		this.host = new PanelHost(extensionUri, DASHBOARD_PANEL);
	}

	get currentExamId(): string | undefined {
		return this.examId;
	}

	async open(examId: string): Promise<void> {
		const snapshot = this.state.findSnapshot(examId);
		if (!snapshot) {
			void vscode.window.showWarningMessage("That exam is not in the bound prep repo.");
			return;
		}
		this.examId = examId;
		this.host.reveal(
			`${snapshot.meta.code} — Campaign`,
			(message) => void this.handle(message),
			() => {
				this.examId = undefined;
			}
		);
		await this.refresh();
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

	private async model(): Promise<DashboardModel | undefined> {
		const examId = this.examId;
		const store = this.state.store;
		if (!examId || !store) {
			return undefined;
		}
		const snapshot = this.state.findSnapshot(examId);
		if (!snapshot) {
			return undefined;
		}
		const questions = await store.readQuestions(snapshot.meta.folder);
		return buildDashboardModel({
			meta: snapshot.meta,
			plan: snapshot.plan,
			progress: snapshot.progress,
			questions,
			gamificationEnabled: gamificationEnabled(),
		});
	}

	private async handle(message: { type: string; day?: number; domainId?: string }): Promise<void> {
		const examId = this.examId;
		if (!examId) {
			return;
		}
		switch (message.type) {
			case "webview/ready":
				await this.refresh();
				break;
			case "command/openSession":
			case "command/openDay":
				await this.deps.openSession(examId, Number(message.day));
				break;
			case "command/startQuiz":
				await this.deps.startQuiz(examId, Number(message.day));
				break;
			case "command/buildPlan":
				await this.deps.buildPlan(examId);
				break;
			case "command/openBattlePass":
				await this.deps.openBattlePass(examId);
				break;
			case "command/openCompletion":
				await this.deps.openCompletion(examId);
				break;
			case "command/openCertificate":
				if (message.domainId) {
					await this.deps.openCertificate(examId, message.domainId);
				}
				break;
			case "command/commitNow":
				await vscode.commands.executeCommand("certPrep.commitNow");
				break;
			default:
				break;
		}
	}
}
