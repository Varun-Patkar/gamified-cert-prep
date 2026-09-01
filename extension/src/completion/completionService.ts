/**
 * Closing out a campaign: meta.json, the completion certificate, the README table and a sync.
 * Every step after the meta write is best effort — none of them may cost the user their result.
 */

import * as vscode from "vscode";
import type { ExamMeta, ExamResult } from "../model/types";
import { regenerateReadme } from "../readme/readmeService";
import type { ExtensionState } from "../state/extensionState";
import type { CertificateService } from "../certificates/certificateService";
import { completionToast } from "./examCompletion";

export interface CompletionServiceDeps {
	log?(message: string): void;
}

export class CompletionService {
	constructor(
		private readonly state: ExtensionState,
		private readonly certificates: CertificateService,
		private readonly deps: CompletionServiceDeps = {}
	) {}

	async complete(meta: ExamMeta, result: ExamResult): Promise<void> {
		const store = this.state.store;
		const root = this.state.root;
		if (!store || !root) {
			void vscode.window.showWarningMessage("Bind a prep repository before recording a result.");
			return;
		}

		const completed: ExamMeta = {
			...meta,
			status: "completed",
			completedAt: new Date().toISOString().slice(0, 10),
			result,
		};
		await store.writeMeta(completed);
		await this.state.refresh();

		try {
			await this.certificates.awardExamCompletion(completed.id);
		} catch (error) {
			this.deps.log?.(`Completion certificate skipped: ${describe(error)}`);
		}

		try {
			await regenerateReadme(root, await store.listExams());
		} catch (error) {
			this.deps.log?.(`README regeneration skipped: ${describe(error)}`);
		}

		await this.state.sync?.enqueue(`${completed.code}: exam completed`);
		await this.state.refresh();

		void vscode.window.showInformationMessage(completionToast(completed.code, result));
	}
}

function describe(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
