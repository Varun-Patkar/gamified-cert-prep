/*
 * Minimal `vscode` module stand-in so the preview harness can require the extension's REAL
 * view code (out/webview/host.js) outside an extension host. Only the surface renderShell
 * touches is implemented.
 */
"use strict";

const path = require("path");
const Module = require("module");

const Uri = {
	file(fsPath) {
		const normalized = String(fsPath);
		return {
			scheme: "file",
			fsPath: normalized,
			path: normalized.replace(/\\/g, "/"),
			toString() {
				return `file:///${this.path.replace(/^\/+/, "")}`;
			},
		};
	},
	joinPath(base, ...parts) {
		return Uri.file(path.join(base.fsPath, ...parts));
	},
};

const stub = {
	Uri,
	ViewColumn: { Active: -1 },
	window: {},
	workspace: {},
	commands: {},
	Disposable: class {
		dispose() {}
	},
};

let installed = false;

/** Routes every `require("vscode")` in the compiled output to the stub above. */
function install() {
	if (installed) {
		return stub;
	}
	installed = true;
	const load = Module._load;
	Module._load = function (request, parent, isMain) {
		if (request === "vscode") {
			return stub;
		}
		return load.call(this, request, parent, isMain);
	};
	return stub;
}

module.exports = { install, stub, Uri };
