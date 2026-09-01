/** The campaign sidebar. Rendering lives in media/sidebar.js; this side only supplies the model. */

import * as path from "path";
import * as vscode from "vscode";
import type { ExtensionState } from "../state/extensionState";
import { configureWebview, onWebviewMessage, postToWebview, renderShell } from "../webview/host";
import { buildSidebarModel, type SidebarModel } from "./sidebarModel";

export const SIDEBAR_VIEW_ID = "certPrep.sidebar";

export class SidebarView implements vscode.WebviewViewProvider {
	private view?: vscode.WebviewView;

	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly state: ExtensionState,
		private readonly openDashboard: (examId: string) => void
	) {}

	resolveWebviewView(view: vscode.WebviewView): void {
		this.view = view;
		configureWebview(view.webview, this.extensionUri);
		view.webview.html = renderShell(view.webview, this.extensionUri, {
			title: "Cert Prep",
			script: "sidebar.js",
			body: '<div id="root"></div>',
		});

		onWebviewMessage(view.webview, (message) => {
			switch (message.type) {
				case "webview/ready":
					this.push();
					break;
				case "command/openDay":
					this.openDashboard(message.examId);
					break;
				case "command/openExam":
					void this.openExam(message.examId);
					break;
				case "command/newExam":
					void vscode.commands.executeCommand("certPrep.newExam");
					break;
				case "command/openCompletion":
					void vscode.commands.executeCommand("certPrep.completeExam", message.examId);
					break;
				case "command/commitNow":
					void vscode.commands.executeCommand("certPrep.commitNow");
					break;
				default:
					break;
			}
		});

		view.onDidDispose(() => {
			this.view = undefined;
		});
	}

	push(): void {
		if (this.view) {
			postToWebview(this.view.webview, { type: "state/update", state: this.model() });
		}
	}

	private model(): SidebarModel {
		return buildSidebarModel({
			snapshots: this.state.snapshots,
			profile: this.state.profile,
			gamificationEnabled: vscode.workspace
				.getConfiguration("certPrep")
				.get<boolean>("gamification.enabled", true),
			syncState: this.state.syncState,
			syncError: this.state.syncError,
		});
	}

	private async openExam(examId: string): Promise<void> {
		const snapshot = this.state.findSnapshot(examId);
		const root = this.state.root;
		if (!snapshot || !root) {
			return;
		}
		// Trophies point at the score report; anything still in flight opens the campaign board.
		const file = snapshot.meta.result?.scoreReportFile;
		if (!file) {
			this.openDashboard(examId);
			return;
		}
		await openPath(path.join(root, file));
	}
}

async function openPath(target: string): Promise<void> {
	const uri = vscode.Uri.file(target);
	try {
		if (/\.(pdf|png|jpe?g)$/i.test(target)) {
			await vscode.env.openExternal(uri);
			return;
		}
		await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri), { preview: false });
	} catch {
		void vscode.window.showWarningMessage(`Could not open ${path.basename(target)} — it may not exist yet.`);
	}
}
