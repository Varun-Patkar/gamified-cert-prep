/**
 * Unattended activation self-test. Only ever reached when the diagnostics sentinel file asks
 * for `{ "mode": "selftest" }`; nothing here is wired into a production code path.
 */

import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import * as vm from "vm";
import * as vscode from "vscode";
import { PARTICIPANT_ID } from "../chat/participant";
import type { ExtensionState } from "../state/extensionState";
import { findBoundFolder } from "../state/extensionState";
import { migrateLegacyExams } from "../store/migration";
import { BattlePassView, BATTLE_PASS_PANEL } from "../views/battlePassView";
import { COMPLETION_PANEL, CompletionView } from "../views/completionView";
import { DASHBOARD_PANEL, DashboardView } from "../views/dashboardView";
import { PanelHost, type PanelHostOptions } from "../views/panelHost";
import { QUIZ_PANEL, QuizView } from "../views/quizView";
import { SESSION_PANEL, SessionView } from "../views/sessionView";
import { SIDEBAR_VIEW_ID, SidebarView } from "../views/sidebarView";
import { SOURCES_PANEL, SourcesView } from "../views/sourcesView";
import { WELCOME_VIEW_ID, WelcomeView } from "../views/welcomeView";

export interface ConsoleCapture {
	readonly entries: string[];
	stop(): void;
}

/** Installed before anything else in activation so host-side console noise is attributable. */
export function beginConsoleCapture(): ConsoleCapture {
	const entries: string[] = [];
	const original = { error: console.error, warn: console.warn };
	const hook = (level: string, inner: (...args: unknown[]) => void) => (...args: unknown[]) => {
		entries.push(`${level}: ${args.map((arg) => stringify(arg)).join(" ")}`);
		inner(...args);
	};
	console.error = hook("error", original.error.bind(console));
	console.warn = hook("warn", original.warn.bind(console));
	return {
		entries,
		stop(): void {
			console.error = original.error;
			console.warn = original.warn;
		},
	};
}

export interface SelfTestInput {
	context: vscode.ExtensionContext;
	state?: ExtensionState;
	activationError?: unknown;
	chatError?: unknown;
	chatRegistered: boolean;
	logLines: readonly string[];
	console?: ConsoleCapture;
	/** Falls back to this when the host opened no folder. */
	repoPath?: string;
}

interface Line {
	pass: boolean;
	text: string;
}

export async function runSelfTest(input: SelfTestInput): Promise<string> {
	const lines: Line[] = [];
	const detail: string[] = [];

	checkActivation(input, lines, detail);
	await checkContextKey(input, lines, detail);
	await checkCommands(input, lines, detail);
	checkChat(input, lines, detail);
	await checkManifestConsistency(input, lines, detail);
	const migrated = await checkMigration(input, lines, detail);
	await checkWebviews(input, migrated, lines, detail);
	await checkMediaScripts(input, lines, detail);
	checkConsole(input, lines, detail);

	const failures = lines.filter((line) => !line.pass).length;
	const header = [
		"CERT PREP SELF-TEST",
		`generated: ${new Date().toISOString()}`,
		`result: ${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`} (${lines.length} checks)`,
		"",
	];
	const body = lines.map((line) => `${line.pass ? "PASS" : "FAIL"} — ${line.text}`);
	return [...header, ...body, "", "--- detail ---", ...detail, ""].join("\n");
}

// 1. Activation
function checkActivation(input: SelfTestInput, lines: Line[], detail: string[]): void {
	if (input.activationError) {
		lines.push({ pass: false, text: `1. activate() threw: ${describe(input.activationError)}` });
		detail.push(`activation stack:\n${stack(input.activationError)}`);
		return;
	}
	lines.push({ pass: true, text: "1. activate() completed without throwing" });
}

// 2. certPrep.bound context key
async function checkContextKey(input: SelfTestInput, lines: Line[], detail: string[]): Promise<void> {
	const folders = (vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri.fsPath);
	let boundFolder: string | undefined;
	try {
		boundFolder = await findBoundFolder();
	} catch (error) {
		detail.push(`findBoundFolder threw: ${describe(error)}`);
	}
	const stateBound = input.state?.bound ?? false;
	const consistent = stateBound === Boolean(boundFolder);
	// The key is write-only from an extension, so the check is that the value we push is the
	// value the state actually holds, and that pushing it does not throw.
	let pushed = true;
	try {
		await vscode.commands.executeCommand("setContext", "certPrep.bound", stateBound);
	} catch (error) {
		pushed = false;
		detail.push(`setContext threw: ${describe(error)}`);
	}
	lines.push({
		pass: consistent && pushed,
		text: `2. certPrep.bound resolved to ${stateBound} (bound=${stateBound ? "yes" : "no"}; workspace has no .certprep/ ⇒ not bound is expected)`,
	});
	detail.push(`workspace folders: ${folders.join(", ") || "(none)"}`);
	detail.push(`findBoundFolder(): ${boundFolder ?? "(undefined)"}`);
}

// 3. Declared vs registered commands
async function checkCommands(input: SelfTestInput, lines: Line[], detail: string[]): Promise<void> {
	let declared: string[] = [];
	let viewIds: string[] = [];
	try {
		const raw = await fs.readFile(path.join(input.context.extensionPath, "package.json"), "utf8");
		const manifest = JSON.parse(raw) as {
			contributes?: {
				commands?: { command: string }[];
				views?: Record<string, { id: string }[]>;
				viewsContainers?: Record<string, { id: string }[]>;
			};
		};
		declared = (manifest.contributes?.commands ?? []).map((entry) => entry.command);
		viewIds = [
			...Object.values(manifest.contributes?.views ?? {}).flatMap((views) => views.map((view) => view.id)),
			...Object.values(manifest.contributes?.viewsContainers ?? {}).flatMap((containers) =>
				containers.map((container) => container.id)
			),
		];
	} catch (error) {
		lines.push({ pass: false, text: `3. could not read package.json: ${describe(error)}` });
		return;
	}
	const all = new Set(await vscode.commands.getCommands(true));
	const missing = declared.filter((id) => !all.has(id));
	// VS Code synthesises `<viewId>.focus`, `.open`, etc. for every contributed view.
	const synthesised = (id: string): boolean =>
		viewIds.some((viewId) => id.startsWith(`${viewId}.`) && !id.slice(viewId.length + 1).includes("."));
	const orphans = [...all].filter(
		(id) => id.startsWith("certPrep.") && !declared.includes(id) && !synthesised(id)
	);
	lines.push({
		pass: missing.length === 0 && orphans.length === 0,
		text:
			missing.length === 0 && orphans.length === 0
				? `3. all ${declared.length} declared commands are registered, with no undeclared certPrep.* commands`
				: `3. command mismatch — missing: [${missing.join(", ") || "none"}]; registered but undeclared: [${orphans.join(", ") || "none"}]`,
	});
	detail.push(`declared commands: ${declared.join(", ")}`);
}

// 4. Chat participant
function checkChat(input: SelfTestInput, lines: Line[], detail: string[]): void {
	if (input.chatError) {
		lines.push({ pass: false, text: `4. chat participant registration threw: ${describe(input.chatError)}` });
		detail.push(`chat stack:\n${stack(input.chatError)}`);
		return;
	}
	lines.push({
		pass: input.chatRegistered,
		text: input.chatRegistered
			? "4. chat participant certPrep.chat registered without throwing"
			: "4. chat participant was never registered",
	});
}

// 4b. package.json contributions must line up with the ids the code actually uses
async function checkManifestConsistency(input: SelfTestInput, lines: Line[], detail: string[]): Promise<void> {
	interface Manifest {
		contributes?: {
			commands?: { command: string }[];
			views?: Record<string, { id: string; type?: string }[]>;
			viewsContainers?: Record<string, { id: string; icon?: string }[]>;
			menus?: Record<string, { command?: string }[]>;
			chatParticipants?: { id: string }[];
		};
	}
	let manifest: Manifest;
	try {
		manifest = JSON.parse(await fs.readFile(path.join(input.context.extensionPath, "package.json"), "utf8"));
	} catch (error) {
		lines.push({ pass: false, text: `4b. could not read package.json: ${describe(error)}` });
		return;
	}
	const contributes = manifest.contributes ?? {};
	const problems: string[] = [];

	const declaredCommands = new Set((contributes.commands ?? []).map((entry) => entry.command));
	for (const [menu, items] of Object.entries(contributes.menus ?? {})) {
		for (const item of items) {
			if (item.command && !declaredCommands.has(item.command)) {
				problems.push(`menu ${menu} references undeclared command ${item.command}`);
			}
		}
	}

	const declaredViews = new Set(
		Object.values(contributes.views ?? {}).flatMap((views) => views.map((view) => view.id))
	);
	for (const id of [WELCOME_VIEW_ID, SIDEBAR_VIEW_ID]) {
		if (!declaredViews.has(id)) {
			problems.push(`code registers view provider "${id}" which contributes.views does not declare`);
		}
	}
	for (const id of declaredViews) {
		if (id !== WELCOME_VIEW_ID && id !== SIDEBAR_VIEW_ID) {
			problems.push(`contributes.views declares "${id}" which no provider registers`);
		}
	}

	const containers = new Set(
		Object.values(contributes.viewsContainers ?? {}).flatMap((entries) => entries.map((entry) => entry.id))
	);
	for (const container of Object.keys(contributes.views ?? {})) {
		if (!containers.has(container)) {
			problems.push(`contributes.views targets container "${container}" which is not declared`);
		}
	}
	for (const entry of Object.values(contributes.viewsContainers ?? {}).flat()) {
		if (entry.icon) {
			try {
				await vscode.workspace.fs.stat(vscode.Uri.joinPath(input.context.extensionUri, entry.icon));
			} catch {
				problems.push(`view container "${entry.id}" icon ${entry.icon} is missing on disk`);
			}
		}
	}

	const participants = (contributes.chatParticipants ?? []).map((entry) => entry.id);
	if (!participants.includes(PARTICIPANT_ID)) {
		problems.push(
			`createChatParticipant uses "${PARTICIPANT_ID}" but the manifest declares [${participants.join(", ")}]`
		);
	}

	lines.push({
		pass: problems.length === 0,
		text:
			problems.length === 0
				? "4b. package.json contributions are internally consistent with the ids used in code"
				: `4b. ${problems.length} manifest inconsistency(ies)`,
	});
	detail.push(...problems.map((entry) => `  manifest: ${entry}`));
}

interface MigrationOutcome {
	root?: string;
	exams: { code: string; vendor: string; status: string; folder: string }[];
}

// 5. Legacy migration against a throwaway copy of the real repo
async function checkMigration(input: SelfTestInput, lines: Line[], detail: string[]): Promise<MigrationOutcome> {
	const source = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? input.repoPath;
	if (!source) {
		lines.push({ pass: false, text: "5. no workspace folder to copy for the migration test" });
		return { exams: [] };
	}
	const target = path.join(os.tmpdir(), `certprep-selftest-${Date.now()}`);
	try {
		await copyTree(source, target);
		const metas = await migrateLegacyExams(target);
		const exams = metas.map((meta) => ({
			code: meta.code,
			vendor: meta.vendor,
			status: meta.status,
			folder: meta.folder,
		}));
		lines.push({
			pass: exams.length > 0,
			text: `5. legacy migration discovered ${exams.length} exam(s): ${exams.map((exam) => exam.code).join(", ") || "none"}`,
		});
		for (const exam of exams) {
			detail.push(`  exam ${exam.code}: vendor=${exam.vendor} status=${exam.status} folder="${exam.folder}"`);
		}
		detail.push(`migration sandbox: ${target}`);
		return { root: target, exams };
	} catch (error) {
		lines.push({ pass: false, text: `5. legacy migration threw: ${describe(error)}` });
		detail.push(`migration stack:\n${stack(error)}`);
		return { exams: [] };
	}
}

// 6. Every webview kind renders, and every media asset it references exists
async function checkWebviews(
	input: SelfTestInput,
	migrated: MigrationOutcome,
	lines: Line[],
	detail: string[]
): Promise<void> {
	const extensionUri = input.context.extensionUri;
	const results: string[] = [];
	let failed = 0;

	const record = async (kind: string, script: string, html: string | undefined, error?: unknown): Promise<void> => {
		if (error || html === undefined) {
			failed += 1;
			results.push(`  ${kind}: THREW ${describe(error ?? new Error("no html produced"))}`);
			detail.push(`${kind} stack:\n${stack(error)}`);
			return;
		}
		const missing = await missingResources(html, extensionUri);
		const shell = shellProblems(html, script);
		if (missing.length > 0 || shell.length > 0) {
			failed += 1;
		}
		const notes = [
			missing.length === 0 ? "all media assets resolve" : `MISSING assets: ${missing.join(", ")}`,
			shell.length === 0 ? "shell/CSP ok" : `SHELL PROBLEMS: ${shell.join("; ")}`,
		];
		results.push(`  ${kind}: html ok, ${Buffer.byteLength(html, "utf8")} bytes, ${notes.join(", ")}`);
	};

	// Views resolve through their real providers against a borrowed, hidden webview.
	for (const view of [
		{
			kind: "welcome",
			id: WELCOME_VIEW_ID,
			script: "welcome.js",
			make: () => new WelcomeView(extensionUri, input.state!, () => undefined),
		},
		{
			kind: "sidebar",
			id: SIDEBAR_VIEW_ID,
			script: "sidebar.js",
			make: () => new SidebarView(extensionUri, input.state!, () => undefined),
		},
	]) {
		const panel = createHiddenPanel(view.id, view.kind, extensionUri);
		try {
			view.make().resolveWebviewView(stubWebviewView(panel, view.id));
			await record(view.kind, view.script, panel.webview.html);
		} catch (error) {
			await record(view.kind, view.script, undefined, error);
		} finally {
			panel.dispose();
		}
	}

	// Panels render through the shared PanelHost, using the very descriptors production uses.
	const panels: { kind: string; options: PanelHostOptions }[] = [
		{ kind: "dashboard", options: DASHBOARD_PANEL },
		{ kind: "session", options: SESSION_PANEL },
		{ kind: "quiz", options: QUIZ_PANEL },
		{ kind: "battlePass", options: BATTLE_PASS_PANEL },
		{ kind: "sources", options: SOURCES_PANEL },
		{ kind: "completion", options: COMPLETION_PANEL },
	];
	for (const entry of panels) {
		const host = new PanelHost(extensionUri, entry.options);
		try {
			host.reveal(`${entry.kind} self-test`, () => undefined);
			await record(entry.kind, entry.options.script, host.html);
		} catch (error) {
			await record(entry.kind, entry.options.script, undefined, error);
		} finally {
			host.dispose();
		}
	}

	lines.push({
		pass: failed === 0,
		text: `6. webview HTML for ${panels.length + 2} kinds — ${failed === 0 ? "all generated and all assets resolve" : `${failed} problem(s)`}`,
	});
	detail.push(...results);

	await openRealViews(input, migrated, lines, detail);
}

/** 6b. Drive the real view classes end-to-end against the migrated sandbox repo. */
async function openRealViews(
	input: SelfTestInput,
	migrated: MigrationOutcome,
	lines: Line[],
	detail: string[]
): Promise<void> {
	const state = input.state;
	if (!state || !migrated.root || migrated.exams.length === 0) {
		lines.push({ pass: false, text: "6b. no migrated sandbox to drive the real views against" });
		return;
	}
	const extensionUri = input.context.extensionUri;
	const disposables: vscode.Disposable[] = [];
	const problems: string[] = [];
	try {
		await state.bind(migrated.root);
		const examId = state.snapshots[0]?.meta.id;
		if (!examId) {
			lines.push({ pass: false, text: "6b. binding the sandbox produced no exam snapshots" });
			return;
		}
		detail.push(`sandbox snapshots: ${state.snapshots.map((snapshot) => snapshot.meta.id).join(", ")}`);

		const dashboard = new DashboardView(extensionUri, state, {
			openSession: () => undefined,
			startQuiz: () => undefined,
			buildPlan: () => undefined,
			openBattlePass: () => undefined,
			openCertificate: () => undefined,
			openCompletion: () => undefined,
		});
		const session = new SessionView(extensionUri, state, {
			startQuiz: () => undefined,
			openDashboard: () => undefined,
		});
		const quiz = new QuizView(extensionUri, state, { openDashboard: () => undefined });
		const battlePass = new BattlePassView(extensionUri, state, {
			openCertificate: () => undefined,
			openDashboard: () => undefined,
		});
		const completion = new CompletionView(extensionUri, state, { complete: async () => undefined });
		const sources = new SourcesView(extensionUri);
		disposables.push(dashboard, session, quiz, battlePass, completion, sources);

		const steps: { name: string; run: () => Promise<unknown> | unknown }[] = [
			{ name: "dashboard.open", run: () => dashboard.open(examId) },
			{ name: "session.open", run: () => session.open(examId, 1) },
			{ name: "quiz.open", run: () => quiz.open(examId, 1) },
			{ name: "battlePass.open", run: () => battlePass.open(examId) },
			{ name: "completion.open", run: () => completion.open(examId) },
			{
				name: "sources.approve",
				run: () => {
					void sources.approve({
						examId,
						examQuery: "self test",
						code: "AB-100",
						candidates: [
							{
								id: "selftest-1",
								title: "Docs",
								url: "https://learn.microsoft.com",
								kind: "official-docs",
								trusted: true,
							},
						],
					});
				},
			},
		];
		for (const step of steps) {
			try {
				await step.run();
			} catch (error) {
				problems.push(`${step.name}: ${describe(error)}`);
				detail.push(`${step.name} stack:\n${stack(error)}`);
			}
		}
	} catch (error) {
		problems.push(`bind: ${describe(error)}`);
		detail.push(`bind stack:\n${stack(error)}`);
	} finally {
		for (const disposable of disposables) {
			disposable.dispose();
		}
	}
	lines.push({
		pass: problems.length === 0,
		text:
			problems.length === 0
				? "6b. every real view opened against the migrated sandbox without throwing"
				: `6b. view open failures — ${problems.join(" | ")}`,
	});
}

// 6c. Shipped webview client scripts must at least parse; nothing else ever loads them.
async function checkMediaScripts(input: SelfTestInput, lines: Line[], detail: string[]): Promise<void> {
	const dir = path.join(input.context.extensionPath, "media");
	const broken: string[] = [];
	let checked = 0;
	for (const name of (await fs.readdir(dir)).filter((file) => file.endsWith(".js"))) {
		checked += 1;
		try {
			new vm.Script(await fs.readFile(path.join(dir, name), "utf8"), { filename: name });
		} catch (error) {
			broken.push(`${name}: ${describe(error)}`);
		}
	}
	lines.push({
		pass: broken.length === 0 && checked > 0,
		text:
			broken.length === 0
				? `6c. all ${checked} media/*.js webview scripts parse`
				: `6c. ${broken.length} media script(s) failed to parse`,
	});
	detail.push(...broken.map((entry) => `  broken script ${entry}`));
}

// 7. Console noise during activation
function checkConsole(input: SelfTestInput, lines: Line[], detail: string[]): void {
	const captured = input.console?.entries ?? [];
	const logged = input.logLines.filter((line) => /fail|error|unavailable|threw/i.test(line));
	lines.push({
		pass: captured.length === 0 && logged.length === 0,
		text:
			captured.length === 0 && logged.length === 0
				? "7. no console errors or error-level output-channel lines during activation"
				: `7. ${captured.length} console error/warn line(s) and ${logged.length} error-ish channel line(s) during activation`,
	});
	for (const entry of captured) {
		detail.push(`  console ${entry}`);
	}
	for (const entry of logged) {
		detail.push(`  channel ${entry}`);
	}
	detail.push(`full activation log (${input.logLines.length} lines):`);
	for (const entry of input.logLines) {
		detail.push(`    ${entry}`);
	}
}

function createHiddenPanel(viewType: string, kind: string, extensionUri: vscode.Uri): vscode.WebviewPanel {
	return vscode.window.createWebviewPanel(
		viewType,
		`${kind} self-test`,
		{ viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
		{ enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")] }
	);
}

function stubWebviewView(panel: vscode.WebviewPanel, viewType: string): vscode.WebviewView {
	const disposed = new vscode.EventEmitter<void>();
	const visibility = new vscode.EventEmitter<void>();
	return {
		viewType,
		webview: panel.webview,
		visible: true,
		title: viewType,
		onDidDispose: disposed.event,
		onDidChangeVisibility: visibility.event,
		show: () => undefined,
	} as unknown as vscode.WebviewView;
}

/** Structural expectations the media scripts rely on, plus the nonce-only CSP contract. */
function shellProblems(html: string, script: string): string[] {
	const problems: string[] = [];
	const nonce = /<meta http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(html)?.[1];
	if (!nonce) {
		problems.push("no CSP meta tag");
	} else {
		if (!/script-src 'nonce-[A-Za-z0-9]{32}'/.test(nonce)) {
			problems.push("script-src is not a 32-char nonce");
		}
		if (!nonce.startsWith("default-src 'none'")) {
			problems.push("CSP does not default-deny");
		}
	}
	for (const tag of html.matchAll(/<script([^>]*)>/g)) {
		if (!/nonce="[A-Za-z0-9]{32}"/.test(tag[1])) {
			problems.push("a <script> tag carries no nonce");
		}
	}
	if (!/<div id="root">/.test(html)) {
		problems.push('missing <div id="root"> mount point');
	}
	if (!html.includes("/media/webview.js")) {
		problems.push("shared webview.js runtime not loaded");
	}
	if (!html.includes(`/media/${script}`)) {
		problems.push(`kind script ${script} not loaded`);
	}
	return problems;
}


async function missingResources(html: string, extensionUri: vscode.Uri): Promise<string[]> {
	const missing: string[] = [];
	for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
		const raw = match[1];
		const index = raw.lastIndexOf("/media/");
		if (index < 0) {
			continue;
		}
		const relative = decodeURIComponent(raw.slice(index + "/media/".length).split(/[?#]/)[0]);
		try {
			await vscode.workspace.fs.stat(vscode.Uri.joinPath(extensionUri, "media", ...relative.split("/")));
		} catch {
			missing.push(relative);
		}
	}
	return missing;
}

const SKIP_DIRS = new Set([".git", "node_modules", "extension", "dist", "out", ".vscode"]);

async function copyTree(source: string, target: string): Promise<void> {
	await fs.mkdir(target, { recursive: true });
	for (const entry of await fs.readdir(source, { withFileTypes: true })) {
		if (SKIP_DIRS.has(entry.name)) {
			continue;
		}
		const from = path.join(source, entry.name);
		const to = path.join(target, entry.name);
		if (entry.isDirectory()) {
			await copyTree(from, to);
		} else if (entry.isFile()) {
			await fs.copyFile(from, to);
		}
	}
}

function describe(error: unknown): string {
	return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function stack(error: unknown): string {
	return error instanceof Error && error.stack ? error.stack : String(error);
}

function stringify(value: unknown): string {
	if (typeof value === "string") {
		return value;
	}
	if (value instanceof Error) {
		return stack(value);
	}
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}
