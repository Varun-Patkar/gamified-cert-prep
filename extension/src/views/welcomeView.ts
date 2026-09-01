/** First-run onboarding: three big, warm choices instead of a form. */

import * as path from "path";
import * as vscode from "vscode";
import { RepoStore } from "../store/repoStore";
import { GitRunner } from "../sync/gitSync";
import type { ExtensionState } from "../state/extensionState";
import { configureWebview, onWebviewMessage, postToWebview, renderShell } from "../webview/host";
import type { WelcomeModel } from "../webview/protocol";

export const WELCOME_VIEW_ID = "certPrep.welcome";

export class WelcomeView implements vscode.WebviewViewProvider {
	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly state: ExtensionState,
		private readonly log: (message: string) => void
	) {}

	resolveWebviewView(view: vscode.WebviewView): void {
		configureWebview(view.webview, this.extensionUri);
		view.webview.html = renderShell(view.webview, this.extensionUri, {
			title: "Welcome to Cert Prep",
			script: "welcome.js",
			body: '<div id="root"></div>',
		});

		onWebviewMessage(view.webview, (message) => {
			switch (message.type) {
				case "webview/ready":
					postToWebview(view.webview, { type: "state/update", state: this.model() });
					break;
				case "command/cloneRepo":
					void this.cloneRepo();
					break;
				case "command/useThisFolder":
					void this.useThisFolder();
					break;
				case "command/bindRepo":
					void this.createHere();
					break;
				default:
					break;
			}
		});
	}

	private model(): WelcomeModel {
		const folder = vscode.workspace.workspaceFolders?.[0];
		const model: WelcomeModel = { hasWorkspace: Boolean(folder) };
		if (folder) {
			model.folderName = path.basename(folder.uri.fsPath);
		}
		return model;
	}

	private async cloneRepo(): Promise<void> {
		const url = await vscode.window.showInputBox({
			title: "Clone a prep repo",
			prompt: "Paste the git URL of your certification prep repository",
			placeHolder: "https://github.com/you/cert-prep.git",
			ignoreFocusOut: true,
		});
		if (!url) {
			return;
		}
		try {
			await vscode.commands.executeCommand("git.clone", url);
		} catch (error) {
			this.log(`git.clone unavailable (${describe(error)}); falling back to a manual clone.`);
			await this.manualClone(url);
		}
	}

	private async manualClone(url: string): Promise<void> {
		const target = await pickFolder("Clone into");
		if (!target) {
			return;
		}
		const result = await new GitRunner(target).run(["clone", url]);
		if (!result.ok) {
			void vscode.window.showErrorMessage(`Could not clone that repo: ${result.stderr.trim() || "git failed"}`);
			return;
		}
		await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(target), { forceNewWindow: false });
	}

	private async useThisFolder(): Promise<void> {
		const folder = vscode.workspace.workspaceFolders?.[0];
		if (!folder) {
			void vscode.window.showInformationMessage("Open a folder first, then we can set it up as your prep repo.");
			return;
		}
		await this.initAndBind(folder.uri.fsPath);
	}

	private async createHere(): Promise<void> {
		const target = await pickFolder("Create prep repo here");
		if (!target) {
			return;
		}
		const git = new GitRunner(target);
		if (!(await git.isRepo())) {
			await git.run(["init"]);
		}
		await this.initAndBind(target);
	}

	private async initAndBind(root: string): Promise<void> {
		await new RepoStore(root).initRepo();
		await this.state.bind(root);
		void vscode.window.showInformationMessage("Your prep repo is ready. Time to line up your first exam!");
	}
}

async function pickFolder(openLabel: string): Promise<string | undefined> {
	const picked = await vscode.window.showOpenDialog({
		canSelectFiles: false,
		canSelectFolders: true,
		canSelectMany: false,
		openLabel,
	});
	return picked?.[0]?.fsPath;
}

function describe(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
