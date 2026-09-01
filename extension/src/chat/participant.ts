/**
 * The `@certprep` chat participant: a conversational front door onto the existing pipeline and
 * study material. It never calls a model or invokes tools; intelligent work is handed to the
 * normal GitHub Copilot agent so the user's selected model and tools remain authoritative.
 */

import * as vscode from "vscode";
import type { ExamMeta, PlanDay } from "../model/types";
import type { ExtensionState } from "../state/extensionState";
import type { ExamSnapshot } from "../views/sidebarModel";
import {
	applyAnswer,
	isComplete,
	nextQuestion,
	startInterview,
	suggestedFolder,
	summarize,
	toPlanConfig,
	type InterviewState,
} from "./interview";
import {
	detectIntent,
	interviewKey,
	looksLikeBareExamCode,
	summarizeStatus,
	type StatusInput,
} from "./routing";

export const PARTICIPANT_ID = "certPrep.chat";

export interface ChatDeps {
	state: ExtensionState;
}

interface Conversation {
	interview: InterviewState;
	confirmed: boolean;
	running: boolean;
}

const conversations = new Map<string, Conversation>();

export function registerChatParticipant(
	context: vscode.ExtensionContext,
	deps: ChatDeps
): vscode.Disposable {
	const participant = vscode.chat.createChatParticipant(PARTICIPANT_ID, (request, chatContext, stream) =>
		handleRequest(request, chatContext, stream, deps)
	);
	participant.iconPath = vscode.Uri.joinPath(context.extensionUri, "media", "activity-bar.svg");
	return participant;
}

async function handleRequest(
	request: vscode.ChatRequest,
	chatContext: vscode.ChatContext,
	stream: vscode.ChatResponseStream,
	deps: ChatDeps
): Promise<void> {
	const key = interviewKey(firstPromptOf(chatContext), request.prompt);
	try {
		if (request.command === "new") {
			conversations.delete(key);
			const routed = detectIntent(request.prompt, "new");
			beginInterview(key, routed.subject, stream);
			return;
		}

		const active = conversations.get(key);
		if (active && !request.command) {
			await continueInterview(key, active, request.prompt, stream, deps);
			return;
		}

		const routed = detectIntent(request.prompt, request.command);
		switch (routed.intent) {
			case "new-exam":
				beginInterview(key, routed.subject, stream);
				return;
			case "plan":
				await showPlan(stream, deps);
				return;
			case "today":
				await showToday(stream, deps);
				return;
			case "status":
				showStatus(stream, deps);
				return;
			case "explain":
				await teach(routed.subject ?? request.prompt, stream, deps);
				return;
			default:
				break;
		}

		if (looksLikeBareExamCode(request.prompt) && !findActiveExam(deps)) {
			beginInterview(key, request.prompt.trim(), stream);
			return;
		}
		await teach(request.prompt, stream, deps);
	} catch (error) {
		stream.markdown(
			`\n\nSomething went sideways: ${describe(error)}\n\nNothing was lost — try again, or run **Cert Prep: Prepare for a New Exam** from the command palette.`
		);
	}
}

// ---------------------------------------------------------------------------
// Interview
// ---------------------------------------------------------------------------

function beginInterview(key: string, seed: string | undefined, stream: vscode.ChatResponseStream): void {
	const interview = startInterview(seed);
	conversations.set(key, { interview, confirmed: false, running: false });
	stream.markdown("Let's get you a campaign. I'll ask a few quick things — one at a time, no forms.\n\n");
	askNext(interview, stream);
}

async function continueInterview(
	key: string,
	conversation: Conversation,
	prompt: string,
	stream: vscode.ChatResponseStream,
	deps: ChatDeps
): Promise<void> {
	if (conversation.running) {
		stream.markdown("Still building that campaign — give me a moment.");
		return;
	}

	if (isComplete(conversation.interview) && !conversation.confirmed) {
		const yes = /\b(yes|yep|yeah|go|do it|build|ready|confirm|please|sure|ok|okay)\b/i.test(prompt);
		if (!yes) {
			conversations.delete(key);
			stream.markdown("No problem — nothing was built. Say **/new** whenever you want to start over.");
			return;
		}
		conversation.confirmed = true;
		conversation.running = true;
		try {
			await runSetup(conversation.interview, stream, deps);
		} finally {
			conversation.running = false;
			conversations.delete(key);
		}
		return;
	}

	const outcome = applyAnswer(conversation.interview, prompt, new Date());
	conversation.interview = outcome.state;
	if (!outcome.accepted) {
		stream.markdown(`${outcome.message ?? "I didn't quite catch that."}\n\n`);
		askNext(outcome.state, stream);
		return;
	}
	if (outcome.message) {
		stream.markdown(`${outcome.message}\n\n`);
	}

	if (isComplete(outcome.state)) {
		stream.markdown(`${summarize(outcome.state)}\n\nShall I build it? (**yes** to go, anything else to stop.)`);
		return;
	}
	askNext(outcome.state, stream);
}

function askNext(interview: InterviewState, stream: vscode.ChatResponseStream): void {
	const question = nextQuestion(interview);
	if (!question) {
		return;
	}
	stream.markdown(`${question.prompt}\n`);
	if (question.suggestions.length > 0) {
		stream.markdown(`\n_e.g. ${question.suggestions.map((entry) => `\`${entry}\``).join(" · ")}_`);
	}
}

async function runSetup(
	interview: InterviewState,
	stream: vscode.ChatResponseStream,
	deps: ChatDeps
): Promise<void> {
	if (!deps.state.store) {
		stream.markdown("I need a prep repository first.");
		stream.button({ command: "certPrep.bindRepo", title: "Bind a prep repo" });
		return;
	}
	const config = toPlanConfig(interview, new Date());
	const examQuery = interview.answers.examQuery;
	if (!config || !examQuery) {
		stream.markdown("I lost the thread of that setup. Say **/new** and we'll run it again.");
		return;
	}

	const folder = uniqueFolder(suggestedFolder(interview), deps);
	const prompt = [
		`Set up a complete certification campaign for ${examQuery} in "${folder}".`,
		"Use the model and tools currently selected in GitHub Copilot Agent mode; research current official sources yourself.",
		`Preferences: start ${config.startDate}, exam ${config.examDate}, ${config.hoursPerDay} hours/day, ${config.dayPolicy}, ${config.questionsPerDay} questions/day, gamification ${interview.answers.gamified === false ? "off" : "on"}.`,
		"First inspect this repository's existing exam folders and extension data model. Match their quality and structure.",
		"Find official objectives, documentation, and legitimate practice sources; never use example.com, invented URLs, or exam dumps.",
		"Create the meta, approved source list, topics, weighted day plan, and original cited question bank in the repository. Validate files before finishing.",
	].join(" ");
	await handOffToCopilot(prompt, stream);
}

/** Never silently resume someone else's half-built folder from chat. */
function uniqueFolder(suggested: string, deps: ChatDeps): string {
	const taken = new Set(deps.state.snapshots.map((snapshot) => snapshot.meta.folder));
	if (!taken.has(suggested)) {
		return suggested;
	}
	for (let counter = 2; counter < 50; counter += 1) {
		const candidate = `${suggested} ${counter}`;
		if (!taken.has(candidate)) {
			return candidate;
		}
	}
	return `${suggested} ${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Commands against the active exam
// ---------------------------------------------------------------------------

function findActiveExam(deps: ChatDeps): ExamSnapshot | undefined {
	const snapshots = deps.state.snapshots;
	return snapshots.find((snapshot) => snapshot.meta.status === "in-progress") ?? snapshots[0];
}

function requireActive(stream: vscode.ChatResponseStream, deps: ChatDeps): ExamSnapshot | undefined {
	const snapshot = findActiveExam(deps);
	if (!snapshot) {
		stream.markdown(
			deps.state.bound
				? "There's no exam in your prep repo yet. Tell me which one you're chasing and I'll build the campaign."
				: "Bind a prep repository first and I'll have something to work with."
		);
		if (!deps.state.bound) {
			stream.button({ command: "certPrep.bindRepo", title: "Bind a prep repo" });
		}
		return undefined;
	}
	return snapshot;
}

function nextPlanDay(snapshot: ExamSnapshot): PlanDay | undefined {
	const completed = new Set(snapshot.progress.completedDays ?? []);
	const days = snapshot.plan?.days ?? [];
	return days.find((day) => !completed.has(day.day)) ?? days[days.length - 1];
}

async function showPlan(stream: vscode.ChatResponseStream, deps: ChatDeps): Promise<void> {
	const snapshot = requireActive(stream, deps);
	if (!snapshot) {
		return;
	}
	const days = snapshot.plan?.days ?? [];
	if (days.length === 0) {
		stream.markdown(
			`**${snapshot.meta.code}** has no plan on disk yet. Say **/new** and I'll build one, or open the dashboard to finish setup.`
		);
		stream.button({ command: "certPrep.openExam", arguments: [snapshot.meta.id], title: "Open dashboard" });
		return;
	}
	const completed = new Set(snapshot.progress.completedDays ?? []);
	stream.markdown(
		`**${snapshot.meta.code}** — ${days.length} days${snapshot.meta.examDate ? `, exam on ${snapshot.meta.examDate}` : ""}.\n\n`
	);
	for (const day of days.slice(0, 30)) {
		stream.markdown(`${completed.has(day.day) ? "✅" : "▫️"} **Day ${day.day}** (${day.date}) — ${day.title}\n`);
	}
	if (days.length > 30) {
		stream.markdown(`\n_…and ${days.length - 30} more days on the dashboard._\n`);
	}
	stream.button({ command: "certPrep.openExam", arguments: [snapshot.meta.id], title: "Open dashboard" });
}

async function showToday(stream: vscode.ChatResponseStream, deps: ChatDeps): Promise<void> {
	const snapshot = requireActive(stream, deps);
	if (!snapshot) {
		return;
	}
	const day = nextPlanDay(snapshot);
	if (!day) {
		stream.markdown(`**${snapshot.meta.code}** has no plan days yet. Say **/new** to build the campaign.`);
		return;
	}
	const banked = (snapshot.progress.completedDays ?? []).includes(day.day);
	stream.markdown(
		banked
			? `Every day of **${snapshot.meta.code}** is banked. Day ${day.day} ("${day.title}") was the last one — worth a re-run before exam day.\n`
			: `Today is **Day ${day.day} — ${day.title}** (${day.questionCount} questions).\n`
	);
	stream.button({ command: "certPrep.openDay", arguments: [snapshot.meta.id, day.day], title: `Open Day ${day.day}` });
	stream.button({ command: "certPrep.startQuiz", arguments: [snapshot.meta.id, day.day], title: "Straight to the quiz" });
}

function showStatus(stream: vscode.ChatResponseStream, deps: ChatDeps): void {
	const snapshot = requireActive(stream, deps);
	if (!snapshot) {
		return;
	}
	stream.markdown(summarizeStatus(statusInput(snapshot, deps)));
	const day = nextPlanDay(snapshot);
	if (day) {
		stream.button({
			command: "certPrep.openDay",
			arguments: [snapshot.meta.id, day.day],
			title: `Open Day ${day.day}`,
		});
	}
	stream.button({ command: "certPrep.openExam", arguments: [snapshot.meta.id], title: "Open dashboard" });
}

function statusInput(snapshot: ExamSnapshot, deps: ChatDeps): StatusInput {
	const results = snapshot.progress.results ?? [];
	const answered = results.reduce((sum, result) => sum + result.questionsAnswered, 0);
	const correct = results.reduce((sum, result) => sum + result.correct, 0);
	const input: StatusInput = {
		code: snapshot.meta.code,
		title: snapshot.meta.title,
		totalDays: snapshot.plan?.days.length ?? 0,
		completedDays: (snapshot.progress.completedDays ?? []).length,
		xp: deps.state.profile?.lifetimeXp ?? snapshot.progress.xp ?? 0,
		streak: snapshot.progress.streak?.current ?? 0,
		longestStreak: snapshot.progress.streak?.longest ?? 0,
	};
	if (answered > 0) {
		input.accuracy = correct / answered;
	}
	const until = daysUntil(snapshot.meta.examDate);
	if (until !== undefined) {
		input.daysUntilExam = until;
	}
	const next = nextPlanDay(snapshot);
	if (next) {
		input.nextDay = next.day;
	}
	return input;
}

function daysUntil(examDate: string | undefined): number | undefined {
	if (!examDate || !/^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
		return undefined;
	}
	const today = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
	const target = Date.parse(`${examDate}T00:00:00Z`);
	if (!Number.isFinite(target)) {
		return undefined;
	}
	return Math.round((target - today) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Grounded teaching
// ---------------------------------------------------------------------------

async function teach(
	subject: string,
	stream: vscode.ChatResponseStream,
	deps: ChatDeps
): Promise<void> {
	const snapshot = requireActive(stream, deps);
	if (!snapshot) {
		return;
	}
	const prompt = [
		`Answer this study question for ${describeExam(snapshot.meta)}: ${subject}`,
		`Use GitHub Copilot Agent mode with the currently selected model and tools. Read "${snapshot.meta.folder}/topics.md" and "${snapshot.meta.folder}/sources.json" when present, then browse current official documentation as needed.`,
		"Ground the answer in real sources, never invent URLs, and end with one concrete next action.",
	].join(" ");
	await handOffToCopilot(prompt, stream);
}

function describeExam(meta: ExamMeta): string {
	return `${meta.code} — ${meta.title}${meta.vendor && meta.vendor !== "Unknown" ? ` (${meta.vendor})` : ""}`;
}

async function handOffToCopilot(prompt: string, stream: vscode.ChatResponseStream): Promise<void> {
	stream.markdown("Handing this to GitHub Copilot Agent using your selected model and tools…");
	await vscode.commands.executeCommand("workbench.action.chat.newChat");
	await vscode.commands.executeCommand("workbench.action.chat.open", { query: prompt });
}

function firstPromptOf(chatContext: vscode.ChatContext): string | undefined {
	for (const turn of chatContext.history) {
		if (turn instanceof vscode.ChatRequestTurn) {
			return turn.prompt;
		}
	}
	return undefined;
}

function describe(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
