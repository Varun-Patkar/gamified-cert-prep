/**
 * The `@certprep` chat participant: a conversational front door onto the existing pipeline and
 * study material. Deliberately thin — intent detection lives in `routing.ts`, the setup interview
 * in `interview.ts`, and exam setup itself is still `runNewExamPipeline`.
 */

import * as vscode from "vscode";
import { createLmService, type LmFailure } from "../lm/lmService";
import type { ExamMeta, PlanDay, SourceRef } from "../model/types";
import { runNewExamPipeline, STEP_LABELS, type PipelineStep } from "../pipeline/newExamPipeline";
import { generateSessionMaterial } from "../research/examResearch";
import type { ExtensionState } from "../state/extensionState";
import type { ExamSnapshot } from "../views/sidebarModel";
import type { SourcesView } from "../views/sourcesView";
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
	sources: SourcesView;
	openDashboard(examId: string): Promise<void> | void;
	log?(message: string): void;
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
	const participant = vscode.chat.createChatParticipant(PARTICIPANT_ID, (request, chatContext, stream, token) =>
		handleRequest(request, chatContext, stream, token, deps)
	);
	participant.iconPath = vscode.Uri.joinPath(context.extensionUri, "media", "activity-bar.svg");
	return participant;
}

async function handleRequest(
	request: vscode.ChatRequest,
	chatContext: vscode.ChatContext,
	stream: vscode.ChatResponseStream,
	token: vscode.CancellationToken,
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
			await continueInterview(key, active, request.prompt, stream, token, deps);
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
			case "generate-session":
				await createSession(routed.subject ?? request.prompt, stream, deps);
				return;
			case "explain":
				await teach(routed.subject ?? request.prompt, stream, token, deps);
				return;
			default:
				break;
		}

		if (looksLikeBareExamCode(request.prompt) && !findActiveExam(deps)) {
			beginInterview(key, request.prompt.trim(), stream);
			return;
		}
		await teach(request.prompt, stream, token, deps);
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
	token: vscode.CancellationToken,
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
			await runSetup(conversation.interview, stream, token, deps);
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
	token: vscode.CancellationToken,
	deps: ChatDeps
): Promise<void> {
	const store = deps.state.store;
	if (!store) {
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

	const lm = await createLmService({
		justification: `Cert Prep is researching ${examQuery} to build your study campaign.`,
	});
	if (!lm.ok) {
		streamLmFailure(lm, stream);
		return;
	}
	deps.log?.(`Chat exam setup using ${lm.modelLabel}.`);

	const folder = uniqueFolder(suggestedFolder(interview), deps);
	stream.progress("Building your campaign…");
	const outcome = await runNewExamPipeline(
		{ examQuery, folder, config, ...(interview.answers.examCode ? { code: interview.answers.examCode } : {}) },
		{
			store,
			lm: lm.service,
			token,
			log: deps.log,
			report: (step: PipelineStep) => stream.progress(STEP_LABELS[step]),
			checkpoint: async (message) => {
				await deps.state.sync?.enqueue(message);
			},
			approveSources: ({ meta, candidates, rediscover }) =>
				deps.sources.approve({
					examId: meta.id,
					examQuery: meta.examQuery ?? examQuery,
					code: meta.code,
					candidates,
					rediscover,
				}),
		}
	);

	if (!outcome.ok) {
		stream.markdown(outcome.message);
		return;
	}

	if (interview.answers.gamified === false && outcome.meta.gamified) {
		await store.writeMeta({ ...outcome.meta, gamified: false });
	}
	await deps.state.refresh();

	stream.markdown(
		`**${outcome.meta.code} is ready.** ${outcome.plan.days.length} days, ${outcome.questions} questions, and Day 1 is waiting for you.\n`
	);
	stream.button({ command: "certPrep.openExam", arguments: [outcome.meta.id], title: "Open dashboard" });
	stream.button({ command: "certPrep.openDay", arguments: [outcome.meta.id, 1], title: "Start Day 1" });
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

async function createSession(
	request: string,
	stream: vscode.ChatResponseStream,
	deps: ChatDeps
): Promise<void> {
	const dayMatch = /\bday\s+(\d+)\b/i.exec(request);
	const requestedCode = /\b[A-Z]{2,4}-\d{2,4}\b/i.exec(request)?.[0];
	const snapshot =
		(requestedCode
			? deps.state.snapshots.find((entry) => entry.meta.code.toLowerCase() === requestedCode.toLowerCase())
			: undefined) ?? findActiveExam(deps);
	const store = deps.state.store;
	if (!snapshot || !store || !dayMatch) {
		stream.markdown("I need an exam and day number to build that session. Try **Create Day 22 session for AB-100**.");
		return;
	}
	const day = Number(dayMatch[1]);
	const planDay = snapshot.plan?.days.find((entry) => entry.day === day);
	if (!planDay) {
		stream.markdown(`I couldn't find Day ${day} in the ${snapshot.meta.code} plan.`);
		return;
	}
	const sources = await sessionSources(snapshot.meta, store);
	if (sources.length === 0) {
		stream.markdown(
			`I won't generate Day ${day} from thin air. Add or approve at least one official source for **${snapshot.meta.code}**, then ask me again.`
		);
		return;
	}
	const lm = await createLmService({
		justification: `Cert Prep is researching and writing Day ${day} for ${snapshot.meta.code}.`,
	});
	if (!lm.ok) {
		streamLmFailure(lm, stream);
		return;
	}
	stream.progress(`Researching current official sources for Day ${day}…`);
	try {
		const markdown = await generateSessionMaterial(
			{
				examMeta: snapshot.meta,
				planDay,
				domains: snapshot.meta.domains ?? [],
				sources,
				topicTitles: snapshot.meta.topicTitles,
			},
			{ lm: lm.service, log: deps.log }
		);
		await store.writeSources(snapshot.meta.folder, sources);
		await store.writeSessionMaterial(snapshot.meta.folder, day, planDay.title, markdown);
		await deps.state.sync?.enqueue(`Write source-backed Day ${day} session for ${snapshot.meta.code}`);
		stream.markdown(
			`**Day ${day} is ready.** I researched ${sources.length} real source${sources.length === 1 ? "" : "s"}, passed the session through the depth and citation checks, and wrote it to the repo.`
		);
		stream.button({ command: "certPrep.openDay", arguments: [snapshot.meta.id, day], title: `Open Day ${day}` });
	} catch (error) {
		stream.markdown(`I refused to save that draft: ${describe(error)} Add stronger official sources or ask me to try again.`);
	}
}

async function sessionSources(
	meta: ExamMeta,
	store: NonNullable<ExtensionState["store"]>
): Promise<SourceRef[]> {
	const recorded = (await store.readSources(meta.folder)).filter(validSource);
	if (recorded.length > 0) {
		return recorded;
	}
	const topics = (await store.readTopics(meta.folder)) ?? "";
	const urls = [...topics.matchAll(/https?:\/\/[^\s)\]>]+/g)].map((match) => match[0].replace(/[.,;]+$/, ""));
	return [...new Set(urls)].filter(validUrl).slice(0, 12).map((url, index) => ({
		id: `legacy-source-${index + 1}`,
		title: new URL(url).hostname,
		url,
		kind: "official-docs",
		trusted: true,
		rationale: "Recovered from the existing exam topic reference.",
	}));
}

function validSource(source: SourceRef): boolean {
	return Boolean(source.url && validUrl(source.url));
}

function validUrl(url: string): boolean {
	try {
		const host = new URL(url).hostname.toLowerCase();
		return (url.startsWith("https://") || url.startsWith("http://")) && host !== "example.com" && !host.endsWith(".example.com");
	} catch {
		return false;
	}
}

// ---------------------------------------------------------------------------
// Grounded teaching
// ---------------------------------------------------------------------------

const TEACHING_SYSTEM = [
	"You are Cert Prep, a warm, concise certification study coach embedded in VS Code.",
	"Answer only from the approved sources and topic list supplied below; if they do not cover it, say so plainly and point at the official documentation instead of guessing.",
	"Never reproduce, reconstruct or claim knowledge of real exam items.",
	"Prefer short paragraphs, concrete examples and a one-line 'why the exam cares'. End with one thing the reader can do next.",
].join("\n");

async function teach(
	subject: string,
	stream: vscode.ChatResponseStream,
	token: vscode.CancellationToken,
	deps: ChatDeps
): Promise<void> {
	const snapshot = requireActive(stream, deps);
	if (!snapshot) {
		return;
	}
	const store = deps.state.store;
	if (!store) {
		return;
	}

	const lm = await createLmService({
		justification: "Cert Prep is answering a study question about your active exam.",
	});
	if (!lm.ok) {
		streamLmFailure(lm, stream);
		return;
	}

	stream.progress(`Checking your ${snapshot.meta.code} sources…`);
	const topics = (await store.readTopics(snapshot.meta.folder)) ?? "";
	const sources = await store.readSources(snapshot.meta.folder);
	const prompt = [
		`Exam: ${describeExam(snapshot.meta)}`,
		"",
		"Approved sources:",
		sources.length > 0
			? sources.map((source) => `- ${source.title}${source.url ? ` (${source.url})` : ""} [${source.kind}]`).join("\n")
			: "- (none recorded)",
		"",
		"Exam topics:",
		topics.slice(0, 12_000) || "(no topics file yet)",
		"",
		`The learner asks: ${subject}`,
	].join("\n");

	try {
		const result = await lm.service.runAgenticTurn({
			system: TEACHING_SYSTEM,
			prompt,
			token,
			maxRounds: 3,
		});
		stream.markdown(result.text.trim() || "I couldn't put an answer together for that one — try rephrasing it?");
	} catch (error) {
		stream.markdown(`I couldn't reach the model just then: ${describe(error)}`);
		return;
	}

	const day = nextPlanDay(snapshot);
	if (day) {
		stream.button({
			command: "certPrep.openDay",
			arguments: [snapshot.meta.id, day.day],
			title: `Open Day ${day.day}`,
		});
	}
}

function describeExam(meta: ExamMeta): string {
	return `${meta.code} — ${meta.title}${meta.vendor && meta.vendor !== "Unknown" ? ` (${meta.vendor})` : ""}`;
}

function streamLmFailure(failure: LmFailure, stream: vscode.ChatResponseStream): void {
	stream.markdown(`${failure.message}\n\nYour progress is safe on disk either way.`);
	if (failure.reason === "not-signed-in" || failure.reason === "no-model") {
		stream.button({ command: "certPrep.diagnostics.languageModel", title: "Run model diagnostics" });
	}
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
