/** Full-tab source approval. Nothing is generated until the user says these pages are good. */

import * as vscode from "vscode";
import type { SourceRef } from "../model/types";
import type { WebviewToExtension } from "../webview/protocol";
import { PanelHost } from "./panelHost";
import {
	addUserSource,
	approvedSources,
	buildSourcesModel,
	removeSource,
	toCandidates,
	toggleSource,
	type SourceCandidate,
} from "./sourcesModel";

export interface SourcesRequest {
	examId: string;
	examQuery: string;
	code: string;
	candidates: readonly SourceRef[];
	/** Re-run discovery when the user asks for a different set. */
	rediscover?(): Promise<SourceRef[]>;
}

export class SourcesView implements vscode.Disposable {
	private readonly host: PanelHost;
	private candidates: SourceCandidate[] = [];
	private request?: SourcesRequest;
	private busy = false;
	private error?: string;
	private resolve?: (sources: SourceRef[] | undefined) => void;

	constructor(extensionUri: vscode.Uri) {
		this.host = new PanelHost(extensionUri, { viewType: "certPrep.sources", script: "sources.js" });
	}

	/** Resolves with the approved list, or `undefined` if the user closed the tab. */
	approve(request: SourcesRequest): Promise<SourceRef[] | undefined> {
		this.request = request;
		this.candidates = toCandidates(request.candidates);
		this.busy = false;
		this.error = undefined;

		return new Promise<SourceRef[] | undefined>((resolve) => {
			this.resolve = resolve;
			this.host.reveal(
				`${request.code} — Approve sources`,
				(message) => void this.handle(message),
				() => this.settle(undefined)
			);
			this.push();
		});
	}

	dispose(): void {
		this.settle(undefined);
		this.host.dispose();
	}

	private push(): void {
		if (!this.request) {
			return;
		}
		this.host.post({
			type: "state/update",
			state: buildSourcesModel({
				examId: this.request.examId,
				examQuery: this.request.examQuery,
				code: this.request.code,
				sources: this.candidates,
				busy: this.busy,
				error: this.error,
			}),
		});
	}

	private settle(value: SourceRef[] | undefined): void {
		const resolve = this.resolve;
		this.resolve = undefined;
		resolve?.(value);
	}

	private async handle(message: WebviewToExtension): Promise<void> {
		switch (message.type) {
			case "webview/ready":
				this.push();
				break;
			case "command/toggleSource":
				this.candidates = toggleSource(this.candidates, message.id);
				this.push();
				break;
			case "command/removeSource":
				this.candidates = removeSource(this.candidates, message.id);
				this.push();
				break;
			case "command/addSourceUrl":
				this.candidates = addUserSource(this.candidates, { url: message.url, title: message.title });
				this.push();
				break;
			case "command/pickSourceFile":
				await this.pickFile();
				break;
			case "command/openSource":
				await openExternal(message.url);
				break;
			case "command/rediscoverSources":
				await this.rediscover();
				break;
			case "command/approveSources": {
				const approved = approvedSources(this.candidates, new Date().toISOString());
				if (approved.length === 0) {
					this.error = "Pick at least one source so there is something to learn from.";
					this.push();
					return;
				}
				this.settle(approved);
				this.host.dispose();
				break;
			}
			default:
				break;
		}
	}

	private async pickFile(): Promise<void> {
		const picked = await vscode.window.showOpenDialog({
			canSelectMany: true,
			openLabel: "Use as source",
			filters: { "Study material": ["pdf", "md", "txt", "json", "docx", "html"], "All files": ["*"] },
		});
		for (const uri of picked ?? []) {
			this.candidates = addUserSource(this.candidates, { file: uri.fsPath });
		}
		this.push();
	}

	private async rediscover(): Promise<void> {
		const rediscover = this.request?.rediscover;
		if (!rediscover || this.busy) {
			return;
		}
		this.busy = true;
		this.error = undefined;
		this.push();
		try {
			const found = await rediscover();
			const mine = this.candidates.filter((source) => source.kind === "user-supplied");
			this.candidates = [...toCandidates(found), ...mine];
		} catch (error) {
			this.error = error instanceof Error ? error.message : String(error);
		} finally {
			this.busy = false;
			this.push();
		}
	}
}

async function openExternal(url: string | undefined): Promise<void> {
	if (!url || !/^https?:\/\//i.test(url)) {
		return;
	}
	await vscode.env.openExternal(vscode.Uri.parse(url));
}
