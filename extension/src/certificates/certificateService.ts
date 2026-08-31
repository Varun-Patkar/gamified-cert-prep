/** Awards, stores and opens domain certificates. The only place that knows a domain just got cleared. */

import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";
import { completedDomainIds } from "../gamification/battlePass";
import type { Plan, Progress, QuestionBank } from "../model/types";
import type { ExtensionState } from "../state/extensionState";
import { examPaths } from "../store/paths";
import { CertificateRenderer } from "./certificateRenderer";
import { certificateFileBase } from "./certificateTemplate";

export class CertificateService {
	private readonly renderer = new CertificateRenderer();

	constructor(private readonly state: ExtensionState) {}

	/** Called after a day is banked: issues a certificate for any domain that is now fully cleared. */
	async awardNewlyCleared(examId: string): Promise<void> {
		if (!gamificationEnabled()) {
			return;
		}
		const snapshot = this.state.findSnapshot(examId);
		const store = this.state.store;
		const root = this.state.root;
		if (!snapshot || !store || !root) {
			return;
		}

		const progress = await store.readProgress(snapshot.meta.folder);
		const already = new Set(progress.domainCertificates ?? []);
		const cleared = completedDomainIds(snapshot.plan, progress.completedDays ?? []).filter((id) => !already.has(id));
		if (cleared.length === 0) {
			return;
		}

		const bank = await store.readQuestions(snapshot.meta.folder);
		const dir = examPaths(root, snapshot.meta.folder).certificatesDir;
		const profile = await store.readProfile();
		const issued: string[] = [];

		for (const domainId of cleared) {
			const stats = domainStats(snapshot.plan, progress, domainId);
			try {
				await this.renderer.issue(dir, {
					displayName: profile?.displayName ?? "A Determined Candidate",
					examCode: snapshot.meta.code,
					examTitle: snapshot.meta.title,
					vendor: snapshot.meta.vendor,
					domainId,
					domainName: domainNameFor(bank, snapshot.plan, domainId),
					date: new Date().toISOString().slice(0, 10),
					accuracy: stats.accuracy ?? 0,
					daysCompleted: stats.days,
				});
				issued.push(domainId);
			} catch {
				// A certificate is a reward, never a blocker.
			}
		}

		if (issued.length === 0) {
			return;
		}

		progress.domainCertificates = [...(progress.domainCertificates ?? []), ...issued];
		await store.writeProgress(snapshot.meta.folder, progress);
		await this.state.sync?.enqueue(`${snapshot.meta.code}: domain certificate (${issued.join(", ")})`);
		await this.state.refresh();

		const first = issued[0];
		const name = domainNameFor(bank, snapshot.plan, first);
		const choice = await vscode.window.showInformationMessage(
			issued.length === 1
				? `Domain cleared — "${name}" is signed, sealed and framed. That is a real milestone.`
				: `${issued.length} domains cleared at once. Certificates are in the repo and they look the part.`,
			"View certificate"
		);
		if (choice === "View certificate") {
			await this.open(examId, first);
		}
	}

	async open(examId: string, domainId: string): Promise<void> {
		const snapshot = this.state.findSnapshot(examId);
		const root = this.state.root;
		if (!snapshot || !root) {
			void vscode.window.showWarningMessage("That exam is not in the bound prep repo.");
			return;
		}
		const dir = examPaths(root, snapshot.meta.folder).certificatesDir;
		const base = certificateFileBase(domainId);
		const png = path.join(dir, `${base}.png`);
		const html = path.join(dir, `${base}.html`);
		const target = (await exists(png)) ? png : (await exists(html)) ? html : undefined;
		if (!target) {
			void vscode.window.showWarningMessage("That certificate has not been issued yet.");
			return;
		}
		await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(target));
	}
}

export function gamificationEnabled(): boolean {
	return vscode.workspace.getConfiguration("certPrep").get<boolean>("gamification.enabled", true);
}

function domainStats(
	plan: Plan | undefined,
	progress: Progress,
	domainId: string
): { days: number; accuracy?: number } {
	const days = (plan?.days ?? []).filter((day) => String(day.domainId ?? "") === domainId).map((day) => day.day);
	const dayIds = new Set(days);
	let answered = 0;
	let correct = 0;
	for (const result of progress.results ?? []) {
		if (!dayIds.has(result.day)) {
			continue;
		}
		answered += Math.max(0, result.questionsAnswered ?? 0);
		correct += Math.max(0, result.correct ?? 0);
	}
	return answered > 0 ? { days: days.length, accuracy: Math.min(1, correct / answered) } : { days: days.length };
}

function domainNameFor(bank: QuestionBank | undefined, plan: Plan | undefined, domainId: string): string {
	const fromBank = (bank?.domains ?? []).find((domain) => String(domain.domainId) === domainId)?.domainName;
	if (fromBank) {
		return fromBank;
	}
	const fromPlan = (plan?.days ?? []).find((day) => String(day.domainId ?? "") === domainId)?.title;
	return fromPlan ?? `Domain ${domainId}`;
}

async function exists(file: string): Promise<boolean> {
	try {
		await fs.access(file);
		return true;
	} catch {
		return false;
	}
}
