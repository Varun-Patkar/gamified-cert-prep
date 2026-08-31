import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import { runLanguageModelDiagnostics } from "./lm/diagnostics";

/** Env vars don't reach a dev host spawned by an already-running VS Code, so the spike signals via a file. */
const DIAGNOSTICS_REQUEST_FILE = path.join(os.tmpdir(), "certprep-diagnostics-request.json");

export function activate(context: vscode.ExtensionContext): void {
	const channel = vscode.window.createOutputChannel("Cert Prep");
	context.subscriptions.push(channel);

	context.subscriptions.push(
		vscode.commands.registerCommand("certPrep.diagnostics.languageModel", () =>
			runLanguageModelDiagnostics(channel)
		)
	);

	void maybeRunUnattendedDiagnostics(channel);
}

async function maybeRunUnattendedDiagnostics(channel: vscode.OutputChannel): Promise<void> {
	const requestUri = vscode.Uri.file(DIAGNOSTICS_REQUEST_FILE);
	let outPath: string;
	try {
		const raw = await vscode.workspace.fs.readFile(requestUri);
		outPath = JSON.parse(Buffer.from(raw).toString("utf8")).outPath;
		if (!outPath) {
			return;
		}
	} catch {
		return;
	}

	const outUri = vscode.Uri.file(outPath);
	const write = (body: string) => vscode.workspace.fs.writeFile(outUri, Buffer.from(body, "utf8"));

	await write("ACTIVATED — diagnostics starting\n");
	let report: string;
	try {
		report = await runLanguageModelDiagnostics(channel);
	} catch (err) {
		report = `DIAGNOSTICS THREW: ${err instanceof Error ? err.stack : String(err)}`;
	}

	try {
		await write(report);
		await vscode.workspace.fs.delete(requestUri);
	} finally {
		await vscode.commands.executeCommand("workbench.action.closeWindow");
	}
}

export function deactivate(): void {
	// nothing to tear down yet
}

