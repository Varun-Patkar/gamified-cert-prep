/** The full-tab battle pass. Derivation lives in battlePassModel.ts; rendering in media/battlepass.js. */

import * as vscode from "vscode";
import { gamificationEnabled } from "../certificates/certificateService";
import type { ExtensionState } from "../state/extensionState";
import { buildBattlePassModel, type BattlePassViewModel } from "./battlePassModel";
import { PanelHost } from "./panelHost";

export interface BattlePassDeps {
	openCertificate(examId: string, domainId: string): Promise<void> | void;
	openDashboard(examId: string): Promise<void> | void;
}

export class BattlePassView implements vscode.Disposable {
	private readonly host: PanelHost;
	private examId?: string;

	constructor(
		extensionUri: vscode.Uri,
		private readonly state: ExtensionState,
		private readonly deps: BattlePassDeps
	) {
		this.host = new PanelHost(extensionUri, { viewType: "certPrep.battlePass", script: "battlepass.js" });
	}

	async open(examId: string): Promise<void> {
		if (!gamificationEnabled()) {
			void vscode.window.showInformationMessage(
				"Gamification is turned off, so there is no battle pass to show. Turn on certPrep.gamification.enabled to bring the track back."
			);
			return;
		}
		const snapshot = this.state.findSnapshot(examId);
		if (!snapshot) {
			void vscode.window.showWarningMessage("That exam is not in the bound prep repo.");
			return;
		}
		this.examId = examId;
		this.host.reveal(
			`${snapshot.meta.code} — Battle pass`,
			(message) => void this.handle(message),
			() => {
				this.examId = undefined;
			}
		);
		await this.push();
	}

	dispose(): void {
		this.host.dispose();
	}

	private async push(): Promise<void> {
		const model = await this.model();
		if (!model) {
			return;
		}
		this.host.post({ type: "state/update", state: model });
		// Claim after posting so the burst plays exactly once, then never again.
		if (model.celebrate.length > 0) {
			await this.claim(model);
		}
	}

	private async model(): Promise<BattlePassViewModel | undefined> {
		const examId = this.examId;
		const store = this.state.store;
		const snapshot = examId ? this.state.findSnapshot(examId) : undefined;
		if (!examId || !store || !snapshot) {
			return undefined;
		}
		const questions = await store.readQuestions(snapshot.meta.folder);
		return buildBattlePassModel({
			meta: snapshot.meta,
			plan: snapshot.plan,
			progress: snapshot.progress,
			questions,
			enabled: gamificationEnabled(),
		});
	}

	private async claim(model: BattlePassViewModel): Promise<void> {
		const store = this.state.store;
		const snapshot = this.examId ? this.state.findSnapshot(this.examId) : undefined;
		if (!store || !snapshot) {
			return;
		}
		try {
			const progress = await store.readProgress(snapshot.meta.folder);
			const merged = new Set([...(progress.unlockedTiers ?? []), ...model.celebrate]);
			progress.unlockedTiers = [...merged].sort((a, b) => a - b);
			await store.writeProgress(snapshot.meta.folder, progress);
			await this.state.sync?.enqueue(`${snapshot.meta.code}: battle pass tier unlocked`);
			await this.state.refresh();
		} catch {
			// Failing to record the claim only means the burst plays again next time.
		}
	}

	private async handle(message: { type: string; domainId?: string }): Promise<void> {
		const examId = this.examId;
		if (!examId) {
			return;
		}
		switch (message.type) {
			case "webview/ready":
				await this.push();
				break;
			case "command/openCertificate":
				if (message.domainId) {
					await this.deps.openCertificate(examId, message.domainId);
				}
				break;
			case "command/backToDashboard":
				await this.deps.openDashboard(examId);
				break;
			default:
				break;
		}
	}
}
