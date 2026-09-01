/*
 * Preview harness: renders every webview kind as a standalone page you can open in a browser.
 *
 * The shell comes from the extension's own renderShell(); only the resource URIs are rewritten
 * to relative paths and a recording acquireVsCodeApi() shim is injected, so what you screenshot
 * is the same DOM the extension host produces.
 *
 *   node scripts/preview/build.js        -> scripts/preview/out/*.html
 */
"use strict";

const fs = require("fs");
const path = require("path");

const { install, Uri } = require("./vscodeStub");
install();

const { views } = require("./fixtures");

const EXT_ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.join(__dirname, "out");
const MEDIA_DIR = path.join(EXT_ROOT, "media");
const MEDIA_REL = path.relative(OUT_DIR, MEDIA_DIR).replace(/\\/g, "/");

const { renderShell } = require(path.join(EXT_ROOT, "out", "webview", "host.js"));
const { renderCertificateHtml, CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT } = require(
	path.join(EXT_ROOT, "out", "certificates", "certificateTemplate.js")
);

/** Stands in for vscode.Webview: file-relative media URIs and a CSP source that works off disk. */
const previewWebview = {
	cspSource: "'self' file:",
	options: {},
	asWebviewUri(uri) {
		return `${MEDIA_REL}/${path.basename(uri.fsPath)}`;
	},
};

/* VS Code injects these on the webview body; without them every fallback in the design system
   would be exercised instead of the real theme values. Dark+ is the default we design against. */
const THEME = `
:root {
	--vscode-foreground: #cccccc;
	--vscode-font-family: "Segoe WPC", "Segoe UI", system-ui, sans-serif;
	--vscode-font-size: 13px;
	--vscode-editor-font-family: "Cascadia Mono", Consolas, "Courier New", monospace;
	--vscode-focusBorder: #0078d4;
	color-scheme: dark;
}
html, body { min-height: 100%; }
`;

function shim(view) {
	return `
window.__CP_PREVIEW = { posted: [] };
window.acquireVsCodeApi = function () {
	return {
		postMessage: function (message) {
			window.__CP_PREVIEW.posted.push(message);
			var rules = ${JSON.stringify(view.rules ?? [])};
			for (var i = 0; i < rules.length; i += 1) {
				if (rules[i].when === message.type) {
					rules[i].send.forEach(function (reply) {
						window.setTimeout(function () { window.postMessage(reply, "*"); }, 0);
					});
				}
			}
		},
		getState: function () { return undefined; },
		setState: function () {}
	};
};
window.addEventListener("load", function () {
	window.setTimeout(function () { window.postMessage(${JSON.stringify({ type: "state/update", state: view.state })}, "*"); }, 0);
	${
		view.autoClick
			? `window.setTimeout(function () {
		var target = document.querySelector(${JSON.stringify(view.autoClick)});
		if (target) { target.click(); } else { console.error("preview: autoClick target not found"); }
	}, 260);`
			: ""
	}
});
`;
}

function build(kind, view) {
	const html = renderShell(previewWebview, Uri.file(EXT_ROOT), {
		title: `Cert Prep — ${kind}`,
		script: view.script,
		body: '<div id="root"></div>',
	});
	const nonce = /nonce-([A-Za-z0-9]+)/.exec(html)?.[1];
	if (!nonce) {
		throw new Error(`could not read the CSP nonce out of the ${kind} shell`);
	}
	// The shim has to define acquireVsCodeApi before webview.js grabs its handle.
	const injected = html
		.replace("</head>", `<style nonce="${nonce}">${THEME}</style>\n</head>`)
		.replace("<body>", '<body class="vscode-dark vscode-body">')
		.replace('<script nonce=', `<script nonce="${nonce}">${shim(view)}</script>\n<script nonce=`);

	fs.writeFileSync(path.join(OUT_DIR, `${kind}.html`), injected, "utf8");
	return injected.length;
}

function buildCertificate() {
	const html = renderCertificateHtml({
		displayName: "Varun Patkar",
		examCode: "AI-102",
		examTitle: "Designing and Implementing a Microsoft Azure AI Solution",
		domainId: "2",
		domainName: "Implement generative AI solutions",
		date: "2026-09-01",
		accuracy: 0.92,
		daysCompleted: 6,
		vendor: "Microsoft",
	});
	fs.writeFileSync(path.join(OUT_DIR, "certificate.html"), html, "utf8");
	return { bytes: html.length, width: CERTIFICATE_WIDTH, height: CERTIFICATE_HEIGHT };
}

function main() {
	fs.rmSync(OUT_DIR, { recursive: true, force: true });
	fs.mkdirSync(OUT_DIR, { recursive: true });

	for (const [kind, factory] of Object.entries(views)) {
		const bytes = build(kind, factory());
		console.log(`${kind.padEnd(18)} ${String(bytes).padStart(7)} bytes`);
	}
	const certificate = buildCertificate();
	console.log(
		`${"certificate".padEnd(18)} ${String(certificate.bytes).padStart(7)} bytes  (${certificate.width}x${certificate.height})`
	);
	console.log(`\nwrote ${OUT_DIR}`);
}

main();
