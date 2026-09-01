/*
 * Realistic webview state, derived from the actual prep repo next to this extension:
 * real question banks, real session markdown, real README trophy row.
 *
 * Everything here goes through the extension's own pure model builders (out/**), so a preview
 * renders exactly what the running extension would render for the same data.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const EXT_ROOT = path.resolve(__dirname, "..", "..");
const REPO_ROOT = path.resolve(EXT_ROOT, "..");
const OUT = (...parts) => require(path.join(EXT_ROOT, "out", ...parts));

const { buildSidebarModel } = OUT("views", "sidebarModel.js");
const { buildDashboardModel } = OUT("views", "dashboardModel.js");
const { buildSessionModel } = OUT("views", "sessionModel.js");
const { buildBattlePassModel } = OUT("views", "battlePassModel.js");
const { buildCompletionModel } = OUT("completion", "examCompletion.js");
const { generatePlan } = OUT("planning", "planGenerator.js");
const { normalizeBank, selectQuestions, toClientQuestion, gradeQuestion, summarizeQuiz } = OUT(
	"quiz",
	"quizEngine.js"
);
const { answerCopy, resultCopy, xpLineLabels } = OUT("copy", "tone.js");
const { hostOf } = OUT("views", "sourcesModel.js");

/** Frozen so every screenshot is byte-stable between runs. */
const TODAY = "2026-09-01";

function readJson(...parts) {
	return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, ...parts), "utf8"));
}

function readText(...parts) {
	return fs.readFileSync(path.join(REPO_ROOT, ...parts), "utf8");
}

function domainsFrom(bank) {
	const counts = bank.domains.map((domain) => domain.questions.length);
	const total = counts.reduce((sum, value) => sum + value, 0) || 1;
	return bank.domains.map((domain, index) => ({
		id: String(domain.domainId),
		title: domain.domainName,
		weight: Math.round((counts[index] / total) * 100),
		topicIds: uniqueTopics(domain),
	}));
}

function uniqueTopics(domain) {
	const seen = [];
	for (const question of domain.questions) {
		const topic = typeof question.topic === "string" ? question.topic.trim() : "";
		if (topic.length > 0 && !seen.includes(topic)) {
			seen.push(topic);
		}
	}
	return seen.length > 0 ? seen : [`${domain.domainId}-core`];
}

function meta(overrides) {
	return {
		schemaVersion: 1,
		status: "in-progress",
		legacy: false,
		gamified: true,
		createdAt: "2026-07-20",
		...overrides,
	};
}

function progress(examId, overrides) {
	return {
		schemaVersion: 1,
		examId,
		completedDays: [],
		results: [],
		xp: 0,
		streak: { current: 0, longest: 0, freezeTokens: 0 },
		badges: [],
		unlockedTiers: [],
		domainCertificates: [],
		...overrides,
	};
}

/** Deterministic per-day results so accuracy meters and focus areas have real numbers. */
function syntheticResults(plan, completedDays, weakTopics) {
	return completedDays.map((day, index) => {
		const accuracy = [0.6, 0.7, 0.8, 0.9, 0.75, 1, 0.85, 0.55][index % 8];
		const answered = plan.days.find((entry) => entry.day === day)?.questionCount ?? 10;
		const correct = Math.round(answered * accuracy);
		return {
			day,
			attempt: 1,
			completedAt: plan.days.find((entry) => entry.day === day)?.date ?? TODAY,
			questionsAnswered: answered,
			correct,
			accuracy: correct / answered,
			weakTopicIds: accuracy >= 0.9 ? [] : [weakTopics[index % weakTopics.length]],
			xpAwarded: 100 + Math.round(accuracy * 60),
		};
	});
}

/* ------------------------------------------------------------------ AI-102 */

const ai102Bank = readJson("AI-102 Prep", "questions.json");
const ai102Domains = domainsFrom(ai102Bank);

const ai102Meta = meta({
	id: "ai-102",
	vendor: "Microsoft",
	code: "AI-102",
	title: "Designing and Implementing a Microsoft Azure AI Solution",
	folder: "AI-102 Prep",
	examDate: "2026-09-19",
	domains: ai102Domains,
});

const ai102Plan = generatePlan({
	examId: "ai-102",
	domains: ai102Domains,
	config: {
		startDate: "2026-08-18",
		examDate: "2026-09-19",
		hoursPerDay: 2,
		dayPolicy: "all",
		questionsPerDay: 10,
		includeReviewDays: true,
		includeFinalMock: true,
	},
});

const AI102_DONE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const AI102_WEAK = [
	"Azure AI Search indexers",
	"Prompt flow evaluation",
	"Custom Vision publishing",
	"Speech SDK containers",
];
const ai102Progress = progress("ai-102", {
	completedDays: AI102_DONE,
	results: syntheticResults(ai102Plan, AI102_DONE, AI102_WEAK),
	xp: 2140,
	streak: { current: 9, longest: 12, lastStudyDate: TODAY, freezeTokens: 2 },
	badges: ["first-blood", "perfect-run", "week-one"],
	unlockedTiers: [1, 2, 3],
	domainCertificates: ["1", "2"],
});

/* ------------------------------------------------------------------ AB-100 */

const ab100Bank = readJson("AB-100 Prep", "questions.json");
const ab100Domains = domainsFrom(ab100Bank);

const ab100Meta = meta({
	id: "ab-100",
	vendor: "Microsoft",
	code: "AB-100",
	title: "Microsoft Agentic Business Solutions Architect",
	folder: "AB-100 Prep",
	examDate: "2026-09-24",
	domains: ab100Domains,
});

const ab100Plan = generatePlan({
	examId: "ab-100",
	domains: ab100Domains,
	config: {
		startDate: "2026-08-11",
		examDate: "2026-09-24",
		hoursPerDay: 1.5,
		dayPolicy: "all",
		questionsPerDay: 10,
		includeReviewDays: true,
		includeFinalMock: true,
	},
});

const AB100_DONE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const ab100Progress = progress("ab-100", {
	completedDays: AB100_DONE,
	results: syntheticResults(ab100Plan, AB100_DONE, [
		"Copilot Studio extensibility",
		"Model router economics",
		"Responsible AI governance",
	]),
	xp: 3260,
	streak: { current: 11, longest: 11, lastStudyDate: TODAY, freezeTokens: 3 },
	badges: ["first-blood", "comeback", "streak-10"],
	unlockedTiers: [1, 2, 3, 4, 5, 6],
	domainCertificates: ["1"],
});

/* ------------------------------------------------- legacy trophies (README) */

function trophy(id, code, title, vendor, completedAt, result) {
	return {
		meta: meta({
			id,
			vendor,
			code,
			title,
			folder: `${code} Prep`,
			status: "completed",
			legacy: true,
			gamified: false,
			completedAt,
			result,
		}),
		progress: progress(id, { xp: 0 }),
	};
}

const TROPHIES = [
	trophy("dp-800", "DP-800", "Microsoft Certified: SQL AI Developer Associate", "Microsoft", "2026-06-18", {
		passed: true,
		score: 847,
		maxScore: 1000,
		passingScore: 700,
		credentialUrl:
			"https://learn.microsoft.com/api/credentials/share/en-gb/VarunPatkar/2EC3461E6479548?sharingId=255AC49FFD10B95B",
		scoreReportFile: "DP-800 Prep/DP-800-score-report.pdf",
	}),
	trophy("ai-102-done", "AI-102", "Microsoft Certified: Azure AI Engineer Associate", "Microsoft", "2026-05-02", {
		passed: true,
		score: 912,
		maxScore: 1000,
		passingScore: 700,
		credentialUrl:
			"https://learn.microsoft.com/api/credentials/share/en-gb/VarunPatkar/57E88FFE28157FDB?sharingId=255AC49FFD10B95B",
		scoreReportFile: "AI-102 Prep/AI-102-score-report.pdf",
	}),
	trophy("gh-300", "GH-300", "GitHub Certified: GitHub Copilot", "GitHub", "2026-03-14", {
		passed: true,
		score: 88,
		maxScore: 100,
		passingScore: 70,
		credentialUrl:
			"https://learn.microsoft.com/api/credentials/share/en-gb/VarunPatkar/857C8CC1F8AB312A?sharingId=255AC49FFD10B95B",
		scoreReportFile: "GH-300 Prep/GH-300-score-report.pdf",
	}),
];

const PROFILE = {
	schemaVersion: 1,
	displayName: "Varun Patkar",
	lifetimeXp: 5400,
	badges: ["first-blood", "perfect-run", "streak-10"],
	createdAt: "2026-01-08",
};

/* ---------------------------------------------------------------- the quiz */

const ai102Pool = normalizeBank(ai102Bank);
/** A short, well-formed single-answer question so the option list is readable in a screenshot. */
const quizQuestions = pickReadable(ai102Pool, 12);

function pickReadable(pool, count) {
	const scored = pool
		.filter((question) => question.kind === "single" && question.options.length >= 4)
		.filter((question) => question.prompt.length > 90 && question.prompt.length < 340)
		.filter((question) => question.options.every((option) => option.label.length < 130));
	if (scored.length < count) {
		return pool.slice(0, count);
	}
	// Round-robin the domains so the results screen has a real breakdown rather than one bar.
	const byDomain = new Map();
	for (const question of scored) {
		const bucket = byDomain.get(question.domainId) ?? [];
		bucket.push(question);
		byDomain.set(question.domainId, bucket);
	}
	const buckets = [...byDomain.values()];
	const chosen = [];
	for (let round = 0; chosen.length < count; round += 1) {
		let added = false;
		for (const bucket of buckets) {
			if (bucket[round] && chosen.length < count) {
				chosen.push(bucket[round]);
				added = true;
			}
		}
		if (!added) {
			break;
		}
	}
	return chosen;
}

function quizModel(overrides) {
	const question = quizQuestions[3];
	return {
		examId: "ai-102",
		code: "AI-102",
		examTitle: ai102Meta.title,
		day: 15,
		dayTitle: ai102Plan.days[14]?.title ?? "Day 15",
		kindLabel: "Study",
		attempt: 1,
		retryMode: false,
		phase: "quiz",
		total: quizQuestions.length,
		index: 3,
		answered: 3,
		streak: 3,
		bestStreak: 3,
		question: toClientQuestion(question),
		...overrides,
	};
}

/** The wrong answer we click in the preview, so the feedback screen is genuinely driven. */
function wrongOptionKey() {
	const question = quizQuestions[3];
	return (question.options.find((option) => !question.answer.includes(option.key)) ?? question.options[0]).key;
}

function quizFeedbackModel() {
	const question = quizQuestions[3];
	const response = [wrongOptionKey()];
	const graded = gradeQuestion(question, response);
	const feedback = {
		questionId: question.id,
		correct: graded.correct,
		response: graded.response,
		expected: graded.expected,
		message: answerCopy(graded.correct, 0),
	};
	if (question.explanation) {
		feedback.explanation = question.explanation.slice(0, 420);
	}
	if (question.sourceUrl) {
		feedback.sourceUrl = question.sourceUrl;
	}
	if (question.sourceLabel) {
		feedback.sourceLabel = question.sourceLabel;
	}
	return quizModel({ feedback, streak: 0, answered: 4 });
}

function quizResultsModel() {
	const graded = quizQuestions.map((question, index) =>
		gradeQuestion(question, index % 4 === 0 ? ["Z"] : question.answer)
	);
	const outcome = summarizeQuiz(quizQuestions, graded);
	const labels = xpLineLabels();
	const copy = resultCopy({
		accuracy: outcome.accuracy,
		correct: outcome.correct,
		total: outcome.total,
		attempt: 1,
		streak: 10,
		weakTopics: outcome.weakTopicIds,
	});
	const xpLines = [
		{ label: labels.base, value: 100 },
		{ label: labels.accuracy, value: Math.round(outcome.accuracy * 60) },
		{ label: labels.streak, value: 50 },
	];
	return quizModel({
		phase: "results",
		index: quizQuestions.length - 1,
		answered: quizQuestions.length,
		streak: 10,
		bestStreak: 10,
		question: undefined,
		results: {
			accuracy: outcome.accuracy,
			correct: outcome.correct,
			total: outcome.total,
			missedCount: outcome.missedQuestionIds.length,
			attempt: 1,
			streak: 10,
			xpLines,
			xpTotal: xpLines.reduce((sum, line) => sum + line.value, 0),
			domains: outcome.domains,
			weakTopics: outcome.weakTopicIds.slice(0, 6),
			headline: copy.headline,
			body: copy.body,
			nextAction: copy.nextAction,
			mood: copy.mood,
			celebrate: outcome.accuracy >= 0.8,
		},
	});
}

/* ------------------------------------------------------------------ sources */

const SOURCE_CARDS = [
	{
		id: "src-1",
		title: "Study guide for Exam AI-102: Designing and Implementing a Microsoft Azure AI Solution",
		url: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-102",
		kind: "official-objectives",
		trusted: true,
		rationale: "The published skills-measured list. Every domain weight in your plan comes from this page.",
	},
	{
		id: "src-2",
		title: "Azure AI Foundry documentation",
		url: "https://learn.microsoft.com/en-us/azure/ai-foundry/",
		kind: "official-docs",
		trusted: true,
		rationale: "First-party reference for the generative AI and agent domains.",
	},
	{
		id: "src-3",
		title: "Microsoft Practice Assessment — AI-102",
		url: "https://learn.microsoft.com/en-us/credentials/certifications/practice-assessments-for-microsoft-certifications",
		kind: "official-practice",
		trusted: true,
		rationale: "Official practice questions, closest in shape to the real thing.",
	},
	{
		id: "src-4",
		title: "Azure AI Search: vector and hybrid retrieval deep dive",
		url: "https://techcommunity.microsoft.com/category/azure/blog/azure-ai-services-blog",
		kind: "community",
		trusted: false,
		rationale: "Useful for domain 6, but paraphrased only — community posts are never quoted verbatim.",
	},
	{
		id: "user-1",
		title: "AI-102 revision pack (my notes).pdf",
		file: "AI-102 Prep/sources/ai-102-revision-pack.pdf",
		kind: "user-supplied",
		trusted: true,
		rationale: "You added this, so it is used verbatim.",
	},
];

const KIND_LABELS = {
	"official-objectives": "Official objectives",
	"official-docs": "Official docs",
	"official-practice": "Official practice",
	community: "Community guide",
	"user-supplied": "Yours",
};

function sourcesModel() {
	const sources = SOURCE_CARDS.map((card, index) => ({
		...card,
		included: index !== 3,
		kindLabel: KIND_LABELS[card.kind],
		host: hostOf(card),
		trustLabel: card.trusted ? "Verbatim" : "Paraphrase only",
	}));
	const approvedCount = sources.filter((source) => source.included).length;
	return {
		examId: "ai-102",
		examQuery: "AI-102 Azure AI Engineer Associate",
		code: "AI-102",
		headline: "These are the sources we will build your campaign from",
		why: "Everything in your plan, your session notes and your quizzes is grounded in what you approve here. Drop anything you do not trust, and add anything we missed.",
		sources,
		approvedCount,
		canApprove: approvedCount > 0,
		ctaLabel: `Build my campaign from ${approvedCount} sources →`,
		busy: false,
	};
}

/* ------------------------------------------------------------------ session */

function sessionModel() {
	const day = 15;
	return buildSessionModel({
		meta: ai102Meta,
		day,
		planDay: ai102Plan.days[day - 1],
		markdown: readText("AI-102 Prep", "sessions", "day-15-training-publishing.md"),
		progress: ai102Progress,
		availableQuestions: 12,
	});
}

/* -------------------------------------------------------------------- views */

const views = {
	welcome: () => ({ script: "welcome.js", state: { hasWorkspace: true, folderName: "microsoft-exam-prep" } }),

	sidebar: () => ({
		script: "sidebar.js",
		state: buildSidebarModel({
			snapshots: [{ meta: ab100Meta, plan: ab100Plan, progress: ab100Progress }, ...TROPHIES],
			profile: PROFILE,
			gamificationEnabled: true,
			syncState: "idle",
			today: TODAY,
		}),
	}),

	"sidebar-nogame": () => ({
		script: "sidebar.js",
		state: buildSidebarModel({
			snapshots: [{ meta: ab100Meta, plan: ab100Plan, progress: ab100Progress }, ...TROPHIES],
			profile: PROFILE,
			gamificationEnabled: false,
			syncState: "pending",
			today: TODAY,
		}),
	}),

	"sidebar-empty": () => ({
		script: "sidebar.js",
		state: buildSidebarModel({
			snapshots: [],
			gamificationEnabled: true,
			syncState: "offline",
			syncError: "No git remote configured — your progress is still saved locally.",
			today: TODAY,
		}),
	}),

	dashboard: () => ({
		script: "dashboard.js",
		state: buildDashboardModel({
			meta: ai102Meta,
			plan: ai102Plan,
			progress: ai102Progress,
			questions: ai102Bank,
			gamificationEnabled: true,
			today: TODAY,
		}),
	}),

	"dashboard-noplan": () => ({
		script: "dashboard.js",
		state: buildDashboardModel({
			meta: { ...ai102Meta, examDate: undefined },
			progress: progress("ai-102"),
			questions: ai102Bank,
			gamificationEnabled: true,
			today: TODAY,
		}),
	}),

	session: () => ({ script: "session.js", state: sessionModel() }),

	"quiz-question": () => ({ script: "quiz.js", state: quizModel() }),

	"quiz-feedback": () => ({
		script: "quiz.js",
		state: quizModel(),
		// Drive the real flow: click a wrong option, then answer the resulting quiz/answer post.
		rules: [{ when: "quiz/answer", send: [{ type: "state/update", state: quizFeedbackModel() }] }],
		autoClick: `[data-action="pick"][data-key="${wrongOptionKey()}"]`,
	}),

	"quiz-results": () => ({ script: "quiz.js", state: quizResultsModel() }),

	battlepass: () => ({
		script: "battlepass.js",
		state: buildBattlePassModel({
			meta: ai102Meta,
			plan: ai102Plan,
			progress: { ...ai102Progress, unlockedTiers: [1, 2] },
			questions: ai102Bank,
			enabled: true,
		}),
	}),

	sources: () => ({ script: "sources.js", state: sourcesModel() }),

	completion: () => ({
		script: "completion.js",
		state: buildCompletionModel({
			meta: ai102Meta,
			form: { outcome: "passed", score: "912", maxScore: "1000", passingScore: "700" },
			scoreReportName: "AI-102-score-report.pdf",
			prefillNote: "We read 912 / 1000 off the report. Correct anything that looks off.",
		}),
	}),
};

module.exports = { views, TODAY, ai102Meta, ai102Plan, ai102Progress, EXT_ROOT, REPO_ROOT };
