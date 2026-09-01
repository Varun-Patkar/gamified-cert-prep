/**
 * Rasterizes a certificate without any headless-browser dependency: the document is loaded into a
 * short-lived webview which draws itself through `<svg><foreignObject>` -> `Image` -> `canvas`
 * and posts the PNG data URL back. If any step fails we still keep the HTML — never throw.
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";
import {
	CERTIFICATE_HEIGHT,
	CERTIFICATE_WIDTH,
	certificateFileBase,
	certificateNode,
	renderCertificateHtml,
	type CertificateInput,
} from "./certificateTemplate";

const RASTERIZE_TIMEOUT_MS = 15_000;
const NONCE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export interface IssuedCertificate {
	domainId: string;
	htmlPath: string;
	pngPath?: string;
}

export class CertificateRenderer {
	/** Writes `<dir>/domain-<id>.html` always, and the PNG beside it when rasterization works. */
	async issue(dir: string, input: CertificateInput): Promise<IssuedCertificate> {
		const base = certificateFileBase(input.domainId);
		const htmlPath = path.join(dir, `${base}.html`);
		const html = renderCertificateHtml(input);

		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(htmlPath, html, "utf8");

		const issued: IssuedCertificate = { domainId: input.domainId, htmlPath };
		const png = await this.rasterize(input);
		if (png) {
			const pngPath = path.join(dir, `${base}.png`);
			try {
				await fs.writeFile(pngPath, png);
				issued.pngPath = pngPath;
			} catch {
				// Keeping the HTML is enough; a failed PNG write must not lose the award.
			}
		}
		return issued;
	}

	private async rasterize(input: CertificateInput): Promise<Buffer | undefined> {
		let panel: vscode.WebviewPanel | undefined;
		try {
			panel = vscode.window.createWebviewPanel(
				"certPrep.certificateRasterizer",
				"Issuing certificate…",
				{ viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
				{ enableScripts: true, retainContextWhenHidden: true }
			);
			const target = panel;
			target.webview.html = rasterizerHtml(target.webview, input);

			const dataUrl = await new Promise<string | undefined>((resolve) => {
				const timer = setTimeout(() => resolve(undefined), RASTERIZE_TIMEOUT_MS);
				const settle = (value?: string) => {
					clearTimeout(timer);
					resolve(value);
				};
				target.webview.onDidReceiveMessage((message: unknown) => {
					const payload = message as { type?: unknown; dataUrl?: unknown };
					if (payload?.type === "certificate/png" && typeof payload.dataUrl === "string") {
						settle(payload.dataUrl);
					} else if (payload?.type === "certificate/failed") {
						settle(undefined);
					}
				});
				target.onDidDispose(() => settle(undefined));
			});

			return decodePng(dataUrl);
		} catch {
			return undefined;
		} finally {
			panel?.dispose();
		}
	}
}

function decodePng(dataUrl: string | undefined): Buffer | undefined {
	const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl ?? "");
	if (!match) {
		return undefined;
	}
	const buffer = Buffer.from(match[1], "base64");
	return buffer.length > 0 ? buffer : undefined;
}

function createNonce(): string {
	let nonce = "";
	for (let i = 0; i < 32; i += 1) {
		nonce += NONCE_ALPHABET[Math.floor(Math.random() * NONCE_ALPHABET.length)];
	}
	return nonce;
}

function rasterizerHtml(webview: vscode.Webview, input: CertificateInput): string {
	const nonce = createNonce();
	const csp = [
		"default-src 'none'",
		`style-src ${webview.cspSource} 'unsafe-inline'`,
		"img-src data:",
		`script-src 'nonce-${nonce}'`,
	].join("; ");

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="${csp}" />
<style id="cert-style">${certificateCssFor()}</style>
</head>
<body>
${certificateNode(input)}
<script nonce="${nonce}">${RASTERIZE_SCRIPT}</script>
</body>
</html>`;
}

/** The template owns the CSS; we re-extract it from a rendered document so there is one source of truth. */
function certificateCssFor(): string {
	const document = renderCertificateHtml({
		displayName: "",
		examCode: "",
		examTitle: "",
		domainId: "",
		domainName: "",
		date: "",
		accuracy: 0,
	});
	const match = /<style id="cert-style">([\s\S]*?)<\/style>/.exec(document);
	return match ? match[1] : "";
}

const RASTERIZE_SCRIPT = `
(function () {
	"use strict";
	var vscode = acquireVsCodeApi();
	var W = ${CERTIFICATE_WIDTH};
	var H = ${CERTIFICATE_HEIGHT};

	function fail(reason) {
		vscode.postMessage({ type: "certificate/failed", reason: String(reason) });
	}

	function run() {
		var node = document.getElementById("cert");
		var style = document.getElementById("cert-style");
		if (!node || !style) {
			fail("certificate node missing");
			return;
		}

		var wrapper = document.createElement("div");
		wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
		var styleClone = document.createElement("style");
		styleClone.textContent = style.textContent;
		wrapper.appendChild(styleClone);
		wrapper.appendChild(node.cloneNode(true));

		var serialized = new XMLSerializer().serializeToString(wrapper);
		var svg =
			'<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">' +
			'<foreignObject x="0" y="0" width="' + W + '" height="' + H + '">' +
			serialized +
			"</foreignObject></svg>";

		var image = new Image();
		image.width = W;
		image.height = H;
		image.onload = function () {
			try {
				var canvas = document.createElement("canvas");
				canvas.width = W;
				canvas.height = H;
				var ctx = canvas.getContext("2d");
				ctx.fillStyle = "#05030f";
				ctx.fillRect(0, 0, W, H);
				ctx.drawImage(image, 0, 0, W, H);
				vscode.postMessage({ type: "certificate/png", dataUrl: canvas.toDataURL("image/png") });
			} catch (error) {
				fail(error && error.message ? error.message : error);
			}
		};
		image.onerror = function () {
			fail("svg image failed to decode");
		};
		image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
	}

	try {
		if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === "function") {
			document.fonts.ready.then(run, run);
		} else {
			run();
		}
	} catch (error) {
		fail(error && error.message ? error.message : error);
	}
})();
`;
