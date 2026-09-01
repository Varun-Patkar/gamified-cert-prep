/** One reusable WebviewPanel per kind: revealing an already-open panel instead of stacking duplicates. */

import * as vscode from "vscode";
import { configureWebview, onWebviewMessage, postToWebview, renderShell } from "../webview/host";
import type { ExtensionToWebview, WebviewToExtension } from "../webview/protocol";

export interface PanelHostOptions {
	viewType: string;
	script: string;
	iconGlyph?: string;
}

export class PanelHost implements vscode.Disposable {
	private panel?: vscode.WebviewPanel;
	private handler?: (message: WebviewToExtension) => void;
	private onClose?: () => void;

	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly options: PanelHostOptions
	) {}

	get isOpen(): boolean {
		return this.panel !== undefined;
	}

	get html(): string | undefined {
		return this.panel?.webview.html;
	}

	reveal(title: string, handler: (message: WebviewToExtension) => void, onClose?: () => void): void {
		this.handler = handler;
		this.onClose = onClose;

		if (this.panel) {
			this.panel.title = title;
			this.panel.reveal(this.panel.viewColumn ?? vscode.ViewColumn.Active, false);
			return;
		}

		const panel = vscode.window.createWebviewPanel(this.options.viewType, title, vscode.ViewColumn.Active, {
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")],
		});
		configureWebview(panel.webview, this.extensionUri);
		panel.webview.html = renderShell(panel.webview, this.extensionUri, {
			title,
			script: this.options.script,
			body: '<div id="root"></div>',
		});
		onWebviewMessage(panel.webview, (message) => this.handler?.(message));
		panel.onDidDispose(() => {
			this.panel = undefined;
			const close = this.onClose;
			this.onClose = undefined;
			close?.();
		});
		this.panel = panel;
	}

	post(message: ExtensionToWebview): void {
		if (this.panel) {
			postToWebview(this.panel.webview, message);
		}
	}

	dispose(): void {
		this.panel?.dispose();
		this.panel = undefined;
	}
}
