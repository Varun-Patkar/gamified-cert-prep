import * as vscode from "vscode";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { CertificateService } from "./certificates/certificateService";
import { registerChatParticipant } from "./chat/participant";
import { CompletionService } from "./completion/completionService";
import { shouldOfferCompletion } from "./completion/examCompletion";
import { runLanguageModelDiagnostics } from "./lm/diagnostics";
import { pickLanguageModelSetting } from "./lm/lmService";
import { startNewExam } from "./pipeline/newExamCommand";
import { beginConsoleCapture, runSelfTest, type ConsoleCapture } from "./selftest/selfTest";
import { ExtensionState, findBoundFolder } from "./state/extensionState";
import { RepoStore } from "./store/repoStore";
import { BattlePassView } from "./views/battlePassView";
import { CompletionView } from "./views/completionView";
import { DashboardView } from "./views/dashboardView";
import { QuizView } from "./views/quizView";
import { SessionView } from "./views/sessionView";
import { SIDEBAR_VIEW_ID, SidebarView } from "./views/sidebarView";
import { SourcesView } from "./views/sourcesView";
import { WELCOME_VIEW_ID, WelcomeView } from "./views/welcomeView";

/** Env vars don't reach a dev host spawned by an already-running VS Code, so the spike signals via a file. */
const DIAGNOSTICS_REQUEST_FILE = path.join(os.tmpdir(), "certprep-diagnostics-request.json");

interface DiagnosticsRequest {
	outPath: string;
	mode?: "languageModel" | "selftest";
	repoPath?: string;
}

interface ActivationResult {
	channel: vscode.OutputChannel;
	state: ExtensionState;
	logLines: string[];
	chatRegistered: boolean;
	chatError?: unknown;
	ready: Promise<void>;
}

export function activate(context: vscode.ExtensionContext): void {
	// Read synchronously so console capture is installed before any other activation work.
	const request = readDiagnosticsRequest();
	const capture = request?.mode === "selftest" ? beginConsoleCapture() : undefined;

	let result: ActivationResult | undefined;
	let activationError: unknown;
	try {
		result = activateCore(context);
	} catch (error) {
		activationError = error;
	}

	if (request) {
		void runUnattended(request, context, result, activationError, capture);
		return;
	}
	capture?.stop();
	if (activationError) {
		throw activationError;
	}
}

function activateCore(context: vscode.ExtensionContext): ActivationResult {
	const channel = vscode.window.createOutputChannel("Cert Prep");
	context.subscriptions.push(channel);
	const logLines: string[] = [];
	const log = (message: string): void => {
		logLines.push(message);
		channel.appendLine(message);
	};

	const state = new ExtensionState({ log });
	context.subscriptions.push(state);

	// Declared up front so the four panels can hand off to one another.
	const views = {
		dashboard: undefined as DashboardView | undefined,
		session: undefined as SessionView | undefined,
		quiz: undefined as QuizView | undefined,
		battlePass: undefined as BattlePassView | undefined,
	};

	const certificates = new CertificateService(state);
	const completionService = new CompletionService(state, certificates, { log });
	const completion = new CompletionView(context.extensionUri, state, {
		complete: (meta, result) => completionService.complete(meta, result),
		log,
	});
	context.subscriptions.push(completion);
	const sources = new SourcesView(context.extensionUri);
	context.subscriptions.push(sources);

	const newExam = (): Promise<void> =>
		startNewExam({
			state,
			sources,
			openDashboard: (examId) => views.dashboard?.open(examId),
			log,
		});

	const dashboard = new DashboardView(context.extensionUri, state, {
		openSession: (examId, day) => views.session?.open(examId, day),
		startQuiz: (examId, day) => views.quiz?.open(examId, day),
		openBattlePass: (examId) => views.battlePass?.open(examId),
		openCertificate: (examId, domainId) => certificates.open(examId, domainId),
		openCompletion: (examId) => completion.open(examId),
		buildPlan: () => void newExam(),
	});
	const session = new SessionView(context.extensionUri, state, {
		startQuiz: (examId, day) => views.quiz?.open(examId, day),
		openDashboard: (examId) => dashboard.open(examId),
	});
	const quiz = new QuizView(context.extensionUri, state, {
		openDashboard: (examId) => dashboard.open(examId),
		onDayBanked: (examId) => certificates.awardNewlyCleared(examId),
	});
	const battlePass = new BattlePassView(context.extensionUri, state, {
		openCertificate: (examId, domainId) => certificates.open(examId, domainId),
		openDashboard: (examId) => dashboard.open(examId),
	});
	views.dashboard = dashboard;
	views.session = session;
	views.quiz = quiz;
	views.battlePass = battlePass;
	context.subscriptions.push(dashboard, session, quiz, battlePass);

	const sidebar = new SidebarView(context.extensionUri, state, (examId) => void dashboard.open(examId));
	const welcome = new WelcomeView(context.extensionUri, state, log);

	let chatRegistered = false;
	let chatError: unknown;
	try {
		context.subscriptions.push(
			registerChatParticipant(context, {
				state,
				sources,
				openDashboard: (examId) => dashboard.open(examId),
				log,
			})
		);
		chatRegistered = true;
	} catch (error) {
		chatError = error;
		log(`Chat participant unavailable: ${error instanceof Error ? error.message : String(error)}`);
	}

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
		vscode.commands.registerCommand("certPrep.selectLanguageModel", () => pickLanguageModelSetting()),
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
		vscode.commands.registerCommand("certPrep.openBattlePass", (examId?: string) =>
			battlePass.open(resolveExamId(state, examId))
		),
		vscode.commands.registerCommand("certPrep.openCertificate", (examId: string, domainId: string) =>
			certificates.open(resolveExamId(state, examId), String(domainId))
		),
		vscode.commands.registerCommand("certPrep.newExam", () => newExam()),
		vscode.commands.registerCommand("certPrep.completeExam", (examId?: string) =>
			completion.open(resolveCompletableExamId(state, examId))
		)
	);

	// Sequential so a slow bind can never be overtaken by the initial `false`.
	const ready = (async () => {
		await vscode.commands.executeCommand("setContext", "certPrep.bound", false);
		await bindOnStartup(state);
	})();

	return { channel, state, logLines, chatRegistered, chatError, ready };
}

/** Accepts an exam id or the on-disk folder name, so command palette callers can use either. */
function resolveExamId(state: ExtensionState, value?: string): string {
	if (!value) {
		return state.snapshots[0]?.meta.id ?? "";
	}
	const byFolder = state.snapshots.find((snapshot) => snapshot.meta.folder === value);
	return byFolder ? byFolder.meta.id : value;
}

/** From the palette there is no argument, so prefer the campaign whose exam date has arrived. */
function resolveCompletableExamId(state: ExtensionState, value?: string): string {
	if (value) {
		return resolveExamId(state, value);
	}
	const today = new Date().toISOString().slice(0, 10);
	const due = state.snapshots.find((snapshot) => shouldOfferCompletion(snapshot.meta, today));
	return due?.meta.id ?? resolveExamId(state, value);
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

function readDiagnosticsRequest(): DiagnosticsRequest | undefined {
	try {
		const parsed = JSON.parse(fs.readFileSync(DIAGNOSTICS_REQUEST_FILE, "utf8")) as DiagnosticsRequest;
		return parsed.outPath ? parsed : undefined;
	} catch {
		return undefined;
	}
}

async function runUnattended(
	request: DiagnosticsRequest,
	context: vscode.ExtensionContext,
	result: ActivationResult | undefined,
	activationError: unknown,
	capture: ConsoleCapture | undefined
): Promise<void> {
	const outUri = vscode.Uri.file(request.outPath);
	const write = (body: string) => vscode.workspace.fs.writeFile(outUri, Buffer.from(body, "utf8"));

	await write("ACTIVATED — unattended run starting\n");
	let report: string;
	try {
		await result?.ready;
		report =
			request.mode === "selftest"
				? await runSelfTest({
						context,
						...(result?.state ? { state: result.state } : {}),
						activationError,
						...(result?.chatError ? { chatError: result.chatError } : {}),
						chatRegistered: result?.chatRegistered ?? false,
						logLines: result?.logLines ?? [],
						...(request.repoPath ? { repoPath: request.repoPath } : {}),
						...(capture ? { console: capture } : {}),
					})
				: await runLanguageModelDiagnostics(result?.channel ?? vscode.window.createOutputChannel("Cert Prep"));
	} catch (err) {
		report = `UNATTENDED RUN THREW: ${err instanceof Error ? err.stack : String(err)}`;
	}
	capture?.stop();

	try {
		await write(report);
		await vscode.workspace.fs.delete(vscode.Uri.file(DIAGNOSTICS_REQUEST_FILE));
	} finally {
		await vscode.commands.executeCommand("workbench.action.closeWindow");
	}
}

export function deactivate(): void {
	// nothing to tear down yet
}

