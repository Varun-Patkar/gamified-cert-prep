/**
 * The "how did it go?" panel. Everything derivable lives in completion/examCompletion.ts;
 * this shell only owns the file picker, the pre-fill attempt, and the panel lifecycle.
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";
import {
	buildCompletionModel,
	buildExamResult,
	scoreReportFileName,
	type CompletionForm,
} from "../completion/examCompletion";
import { prefillFromScoreReport, SUPPORTED_REPORT_EXTENSIONS } from "../completion/scoreReport";
import { createLmService } from "../lm/lmService";
import type { ExamMeta, ExamResult } from "../model/types";
import type { ExtensionState } from "../state/extensionState";
import type { WebviewToExtension } from "../webview/protocol";
import { PanelHost, type PanelHostOptions } from "./panelHost";

export const COMPLETION_PANEL: PanelHostOptions = { viewType: "certPrep.completion", script: "completion.js" };

export interface CompletionDeps {
	complete(meta: ExamMeta, result: ExamResult): Promise<void>;
	log?(message: string): void;
}

export class CompletionView implements vscode.Disposable {
	private readonly host: PanelHost;
	private meta?: ExamMeta;
	private form: CompletionForm = {};
	private scoreReportName?: string;
	private prefillNote?: string;
	private busy = false;
	private busyLabel?: string;
	private errors: string[] = [];

	constructor(
		extensionUri: vscode.Uri,
		private readonly state: ExtensionState,
		private readonly deps: CompletionDeps
	) {
		this.host = new PanelHost(extensionUri, COMPLETION_PANEL);
	}

	async open(examId: string): Promise<void> {
		const snapshot = this.state.findSnapshot(examId);
		if (!snapshot) {
			void vscode.window.showWarningMessage("That exam is not in the bound prep repo.");
			return;
		}
		this.meta = snapshot.meta;
		this.form = { ...(snapshot.meta.result ? formFromResult(snapshot.meta.result) : {}) };
		this.scoreReportName = undefined;
		this.prefillNote = undefined;
		this.errors = [];
		this.busy = false;

		this.host.reveal(`${snapshot.meta.code} — How did it go?`, (message) => void this.handle(message), () => {
			this.meta = undefined;
		});
		this.push();
	}

	dispose(): void {
		this.host.dispose();
	}

	private push(): void {
		if (!this.meta) {
			return;
		}
		this.host.post({
			type: "state/update",
			state: buildCompletionModel({
				meta: this.meta,
				form: this.form,
				scoreReportName: this.scoreReportName,
				prefillNote: this.prefillNote,
				busy: this.busy,
				busyLabel: this.busyLabel,
				errors: this.errors,
			}),
		});
	}

	private async handle(message: WebviewToExtension): Promise<void> {
		switch (message.type) {
			case "webview/ready":
				this.push();
				break;
			case "command/pickScoreReport":
				await this.pickScoreReport();
				break;
			case "command/submitCompletion":
				await this.submit(message.form);
				break;
			default:
				break;
		}
	}

	private async pickScoreReport(): Promise<void> {
		const meta = this.meta;
		const root = this.state.root;
		if (!meta || !root || this.busy) {
			return;
		}
		const picked = await vscode.window.showOpenDialog({
			canSelectMany: false,
			openLabel: "Use as score report",
			filters: { "Score report": [...SUPPORTED_REPORT_EXTENSIONS] },
		});
		const source = picked?.[0]?.fsPath;
		if (!source) {
			return;
		}

		const fileName = scoreReportFileName(meta.code, path.extname(source));
		const target = path.join(root, meta.folder, fileName);
		try {
			await fs.mkdir(path.dirname(target), { recursive: true });
			await fs.copyFile(source, target);
		} catch (error) {
			this.errors = ["We could not copy that file into your prep folder. Try another one."];
			this.deps.log?.(`Score report copy failed: ${describe(error)}`);
			this.push();
			return;
		}

		this.scoreReportName = fileName;
		this.form = { ...this.form, scoreReportFile: `${meta.folder}/${fileName}` };
		this.errors = [];
		this.busy = true;
		this.busyLabel = "Reading your score report…";
		this.push();

		try {
			const prefill = await prefillFromScoreReport(target, meta.code, {
				lm: await this.maybeLm(meta.code),
				log: this.deps.log,
			});
			// Anything the user already typed wins over anything we guessed.
			this.form = { ...(prefill.form ?? {}), ...stripEmpty(this.form) };
			this.prefillNote = prefill.note;
		} catch (error) {
			this.deps.log?.(`Score report pre-fill failed: ${describe(error)}`);
			this.prefillNote = "Saved your score report. Fill the numbers in below and we are done.";
		} finally {
			this.busy = false;
			this.busyLabel = undefined;
			this.push();
		}
	}

	private async maybeLm(code: string) {
		try {
			const lm = await createLmService({
				justification: `Cert Prep is reading your ${code} score report so it can fill the form in for you.`,
			});
			return lm.ok ? lm.service : undefined;
		} catch {
			return undefined;
		}
	}

	private async submit(form: CompletionForm): Promise<void> {
		const meta = this.meta;
		if (!meta || this.busy) {
			return;
		}
		this.form = { ...form, ...(this.form.scoreReportFile ? { scoreReportFile: this.form.scoreReportFile } : {}) };
		const built = buildExamResult(this.form);
		if (!built.ok) {
			this.errors = built.errors;
			this.push();
			return;
		}
		this.errors = [];
		this.host.dispose();
		this.meta = undefined;
		await this.deps.complete(meta, built.result);
	}
}

function formFromResult(result: ExamResult): CompletionForm {
	const form: CompletionForm = {};
	if (typeof result.passed === "boolean") {
		form.outcome = result.passed ? "passed" : "failed";
	}
	if (typeof result.score === "number") {
		form.score = String(result.score);
	}
	if (typeof result.maxScore === "number") {
		form.maxScore = String(result.maxScore);
	}
	if (typeof result.passingScore === "number") {
		form.passingScore = String(result.passingScore);
	}
	if (result.credentialUrl) {
		form.credentialUrl = result.credentialUrl;
	}
	if (result.scoreReportFile) {
		form.scoreReportFile = result.scoreReportFile;
	}
	return form;
}

function stripEmpty(form: CompletionForm): CompletionForm {
	const out: CompletionForm = {};
	for (const [key, value] of Object.entries(form)) {
		if (typeof value === "string" && value.trim().length > 0) {
			out[key as keyof CompletionForm] = value;
		}
	}
	return out;
}

function describe(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
