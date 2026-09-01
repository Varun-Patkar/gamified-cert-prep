/** Typed message contracts between the extension host and every webview. No vscode imports: pure data. */

import type { CompletionForm, CompletionModel } from "../completion/examCompletion";
import type { QuizFeedback, QuizResults, QuizViewModel } from "../quiz/quizEngine";
import type { BattlePassViewModel } from "../views/battlePassModel";
import type { DashboardModel } from "../views/dashboardModel";
import type { SessionModel } from "../views/sessionModel";
import type { SidebarModel } from "../views/sidebarModel";
import type { SourcesModel } from "../views/sourcesModel";

export type SyncIndicatorState = "idle" | "syncing" | "pending" | "offline";

export interface WelcomeModel {
	folderName?: string;
	hasWorkspace: boolean;
}

export type WebviewState =
	| SidebarModel
	| WelcomeModel
	| DashboardModel
	| SessionModel
	| QuizViewModel
	| BattlePassViewModel
	| CompletionModel
	| SourcesModel;

export type ExtensionToWebview =
	| { type: "state/update"; state: WebviewState }
	| { type: "quiz/feedback"; feedback: QuizFeedback }
	| { type: "quiz/results"; results: QuizResults }
	| { type: "sync/state"; state: SyncIndicatorState; error?: string };

export type WebviewToExtension =
	| { type: "webview/ready" }
	| { type: "command/openExam"; examId: string }
	| { type: "command/newExam" }
	| { type: "command/bindRepo" }
	| { type: "command/cloneRepo" }
	| { type: "command/useThisFolder" }
	| { type: "command/openDay"; examId: string; day: number }
	| { type: "command/buildPlan"; examId: string }
	| { type: "command/openSession"; examId: string; day: number }
	| { type: "command/startQuiz"; examId: string; day: number }
	| { type: "command/askAboutSession"; examId: string; day: number }
	| { type: "command/backToDashboard"; examId: string }
	| { type: "command/openBattlePass"; examId: string }
	| { type: "command/openCompletion"; examId: string }
	| { type: "command/pickScoreReport" }
	| { type: "command/submitCompletion"; form: CompletionForm }
	| { type: "command/openCertificate"; examId: string; domainId: string }
	| { type: "command/openSource"; url: string }
	| { type: "command/toggleSource"; id: string }
	| { type: "command/removeSource"; id: string }
	| { type: "command/addSourceUrl"; url: string; title?: string }
	| { type: "command/pickSourceFile" }
	| { type: "command/approveSources" }
	| { type: "command/rediscoverSources" }
	| { type: "quiz/answer"; questionId: string; response: string[] }
	| { type: "quiz/next" }
	| { type: "quiz/finish" }
	| { type: "quiz/retryMissed" }
	| { type: "command/commitNow" };

export function isWebviewMessage(value: unknown): value is WebviewToExtension {
	return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

const EXAM_DAY_COMMANDS: readonly string[] = [
	"command/openDay",
	"command/openSession",
	"command/startQuiz",
	"command/askAboutSession",
];

/** Narrows an untrusted webview payload; returns undefined for anything we don't serve. */
export function parseWebviewMessage(value: unknown): WebviewToExtension | undefined {
	if (!isWebviewMessage(value)) {
		return undefined;
	}
	const message = value as Record<string, unknown> & { type: string };
	switch (message.type) {
		case "webview/ready":
		case "command/newExam":
		case "command/bindRepo":
		case "command/cloneRepo":
		case "command/useThisFolder":
		case "command/commitNow":
		case "command/pickSourceFile":
		case "command/approveSources":
		case "command/rediscoverSources":
		case "command/pickScoreReport":
		case "quiz/next":
		case "quiz/finish":
		case "quiz/retryMissed":
			return { type: message.type } as WebviewToExtension;
		case "command/openExam":
		case "command/buildPlan":
		case "command/backToDashboard":
		case "command/openBattlePass":
		case "command/openCompletion":
			return typeof message.examId === "string"
				? ({ type: message.type, examId: message.examId } as WebviewToExtension)
				: undefined;
		case "command/submitCompletion":
			return { type: "command/submitCompletion", form: parseCompletionForm(message.form) };
		case "command/openCertificate":
			return typeof message.examId === "string" && typeof message.domainId === "string"
				? { type: "command/openCertificate", examId: message.examId, domainId: message.domainId }
				: undefined;
		case "command/openSource":
			return typeof message.url === "string" ? { type: "command/openSource", url: message.url } : undefined;
		case "command/addSourceUrl":
			return typeof message.url === "string"
				? {
						type: "command/addSourceUrl",
						url: message.url,
						title: typeof message.title === "string" ? message.title : undefined,
					}
				: undefined;
		case "command/toggleSource":
		case "command/removeSource":
			return typeof message.id === "string"
				? ({ type: message.type, id: message.id } as WebviewToExtension)
				: undefined;
		case "quiz/answer": {
			const response = Array.isArray(message.response)
				? message.response.filter((entry): entry is string => typeof entry === "string")
				: undefined;
			return typeof message.questionId === "string" && response
				? { type: "quiz/answer", questionId: message.questionId, response }
				: undefined;
		}
		default:
			break;
	}

	if (EXAM_DAY_COMMANDS.includes(message.type)) {
		const day = Number(message.day);
		return typeof message.examId === "string" && Number.isFinite(day)
			? ({ type: message.type, examId: message.examId, day: Math.floor(day) } as WebviewToExtension)
			: undefined;
	}
	return undefined;
}

const COMPLETION_FIELDS: readonly (keyof CompletionForm)[] = [
	"outcome",
	"score",
	"maxScore",
	"passingScore",
	"credentialUrl",
];

/** Only ever strings, and only the fields we serve — the file path is host-owned. */
function parseCompletionForm(value: unknown): CompletionForm {
	const source = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
	const form: CompletionForm = {};
	for (const field of COMPLETION_FIELDS) {
		const entry = source[field];
		if (typeof entry === "string") {
			form[field] = entry.slice(0, 2048);
		}
	}
	return form;
}
