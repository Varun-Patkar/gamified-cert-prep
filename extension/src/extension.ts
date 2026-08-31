import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import { runLanguageModelDiagnostics } from "./lm/diagnostics";
import { ExtensionState, findBoundFolder } from "./state/extensionState";
import { RepoStore } from "./store/repoStore";
import { DashboardView } from "./views/dashboardView";
import { QuizView } from "./views/quizView";
import { SessionView } from "./views/sessionView";
import { SIDEBAR_VIEW_ID, SidebarView } from "./views/sidebarView";
import { WELCOME_VIEW_ID, WelcomeView } from "./views/welcomeView";

/** Env vars don't reach a dev host spawned by an already-running VS Code, so the spike signals via a file. */
const DIAGNOSTICS_REQUEST_FILE = path.join(os.tmpdir(), "certprep-diagnostics-request.json");

export function activate(context: vscode.ExtensionContext): void {
	const channel = vscode.window.createOutputChannel("Cert Prep");
	context.subscriptions.push(channel);

	const state = new ExtensionState({ log: (message) => channel.appendLine(message) });
	context.subscriptions.push(state);

	// Declared up front so the three panels can hand off to one another.
	const views = {
		dashboard: undefined as DashboardView | undefined,
		session: undefined as SessionView | undefined,
		quiz: undefined as QuizView | undefined,
	};

	const dashboard = new DashboardView(context.extensionUri, state, {
		openSession: (examId, day) => views.session?.open(examId, day),
		startQuiz: (examId, day) => views.quiz?.open(examId, day),
		buildPlan: () => {
			void vscode.window.showInformationMessage(
				"The plan builder lands in the next update — your campaign generator is on its way!"
			);
		},
	});
	const session = new SessionView(context.extensionUri, state, {
		startQuiz: (examId, day) => views.quiz?.open(examId, day),
		openDashboard: (examId) => dashboard.open(examId),
	});
	const quiz = new QuizView(context.extensionUri, state, {
		openDashboard: (examId) => dashboard.open(examId),
	});
	views.dashboard = dashboard;
	views.session = session;
	views.quiz = quiz;
	context.subscriptions.push(dashboard, session, quiz);

	const sidebar = new SidebarView(context.extensionUri, state, (examId) => void dashboard.open(examId));
	const welcome = new WelcomeView(context.extensionUri, state, (message) => channel.appendLine(message));

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SIDEBAR_VIEW_ID, sidebar, {
			webviewOptions: { retainContextWhenHidden: true },
		}),
		vscode.window.registerWebviewViewProvider(WELCOME_VIEW_ID, welcome),
		state.onDidChange(() => {
			void vscode.commands.executeCommand("setContext", "certPrep.bound", state.bound);
			sidebar.push();
			void dashboard.refresh();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("certPrep.diagnostics.languageModel", () =>
			runLanguageModelDiagnostics(channel)
		),
		vscode.commands.registerCommand("certPrep.refresh", () => state.refresh()),
		vscode.commands.registerCommand("certPrep.commitNow", () => state.commitNow()),
		vscode.commands.registerCommand("certPrep.bindRepo", () => bindRepo(state)),
		vscode.commands.registerCommand("certPrep.openExam", (examId?: string) =>
			dashboard.open(resolveExamId(state, examId))
		),
		vscode.commands.registerCommand("certPrep.openDay", (examId: string, day: number) =>
			session.open(resolveExamId(state, examId), Number(day))
		),
		vscode.commands.registerCommand("certPrep.startQuiz", (examId: string, day: number) =>
			quiz.open(resolveExamId(state, examId), Number(day))
		),
		vscode.commands.registerCommand("certPrep.newExam", () =>
			vscode.window.showInformationMessage(
				"Exam setup lands in the next update — your campaign builder is on its way!"
			)
		)
	);

	void vscode.commands.executeCommand("setContext", "certPrep.bound", false);
	void bindOnStartup(state);
	void maybeRunUnattendedDiagnostics(channel);
}

/** Accepts an exam id or the on-disk folder name, so command palette callers can use either. */
function resolveExamId(state: ExtensionState, value?: string): string {
	if (!value) {
		return state.snapshots[0]?.meta.id ?? "";
	}
	const byFolder = state.snapshots.find((snapshot) => snapshot.meta.folder === value);
	return byFolder ? byFolder.meta.id : value;
}

async function bindOnStartup(state: ExtensionState): Promise<void> {
	const root = await findBoundFolder();
	if (root) {
		await state.bind(root);
	}
}

async function bindRepo(state: ExtensionState): Promise<void> {
	const picked = await vscode.window.showOpenDialog({
		canSelectFiles: false,
		canSelectFolders: true,
		canSelectMany: false,
		openLabel: "Use as prep repo",
	});
	const root = picked?.[0]?.fsPath;
	if (!root) {
		return;
	}
	await new RepoStore(root).initRepo();
	await state.bind(root);
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

