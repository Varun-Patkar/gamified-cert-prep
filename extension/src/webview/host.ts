/** Shared plumbing for every webview: nonce'd CSP, media URIs, and typed message wrappers. */

import * as vscode from "vscode";
import { parseWebviewMessage, type ExtensionToWebview, type WebviewToExtension } from "./protocol";

const NONCE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function createNonce(): string {
	let nonce = "";
	for (let i = 0; i < 32; i += 1) {
		nonce += NONCE_ALPHABET[Math.floor(Math.random() * NONCE_ALPHABET.length)];
	}
	return nonce;
}

export interface ShellOptions {
	title: string;
	/** File name inside `media/`, e.g. "sidebar.js". */
	script: string;
	body: string;
}

export function mediaUri(webview: vscode.Webview, extensionUri: vscode.Uri, ...parts: string[]): vscode.Uri {
	return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", ...parts));
}

export function configureWebview(webview: vscode.Webview, extensionUri: vscode.Uri): void {
	webview.options = {
		enableScripts: true,
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
	};
}

export function renderShell(
	webview: vscode.Webview,
	extensionUri: vscode.Uri,
	options: ShellOptions
): string {
	const nonce = createNonce();
	const css = mediaUri(webview, extensionUri, "design-system.css");
	const runtime = mediaUri(webview, extensionUri, "webview.js");
	const script = mediaUri(webview, extensionUri, options.script);
	const csp = [
		"default-src 'none'",
		`style-src ${webview.cspSource}`,
		`img-src ${webview.cspSource} https: data:`,
		`font-src ${webview.cspSource}`,
		`script-src 'nonce-${nonce}'`,
	].join("; ");

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="${csp}" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="stylesheet" href="${css}" />
<title>${escapeHtml(options.title)}</title>
</head>
<body>
${options.body}
<script nonce="${nonce}" src="${runtime}"></script>
<script nonce="${nonce}" src="${script}"></script>
</body>
</html>`;
}

export function postToWebview(webview: vscode.Webview, message: ExtensionToWebview): void {
	void webview.postMessage(message);
}

export function onWebviewMessage(
	webview: vscode.Webview,
	handler: (message: WebviewToExtension) => void
): vscode.Disposable {
	return webview.onDidReceiveMessage((raw: unknown) => {
		const message = parseWebviewMessage(raw);
		if (message) {
			handler(message);
		}
	});
}

export function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => {
		switch (char) {
			case "&":
				return "&amp;";
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case '"':
				return "&quot;";
			default:
				return "&#39;";
		}
	});
}
