import * as assert from "assert";
import type { ExamMeta, Plan, PlanDay, Progress, QuestionBank } from "../model/types";
import {
	buildDashboardModel,
	focusAreasFrom,
	stateFor,
	tierFor,
	TIER_NAMES,
} from "../views/dashboardModel";

function meta(overrides: Partial<ExamMeta> = {}): ExamMeta {
	return {
		schemaVersion: 1,
		id: "ab-100",
		vendor: "Microsoft",
		code: "AB-100",
		title: "Agentic AI Business Solutions Architect",
		status: "in-progress",
		legacy: false,
		gamified: true,
		folder: "AB-100 Prep",
		createdAt: "2026-08-01",
		examDate: "2026-09-12",
		...overrides,
	};
}

function day(number: number, overrides: Partial<PlanDay> = {}): PlanDay {
	return {
		day: number,
		date: `2026-08-${String(number).padStart(2, "0")}`,
		kind: "study",
		title: `Day ${number} topic`,
		domainId: "1",
		topicIds: [`t${number}`],
		questionCount: 10,
		sessionFile: `sessions/day-0${number}-topic.md`,
		...overrides,
	};
}

function plan(days: PlanDay[]): Plan {
	return {
		schemaVersion: 1,
		examId: "ab-100",
		generatedAt: "2026-08-01T00:00:00.000Z",
		config: {
			startDate: "2026-08-01",
			examDate: "2026-09-12",
			hoursPerDay: 1,
			dayPolicy: "all",
			questionsPerDay: 10,
			includeReviewDays: true,
			includeFinalMock: true,
		},
		days,
	};
}

function progress(overrides: Partial<Progress> = {}): Progress {
	return {
		schemaVersion: 1,
		examId: "ab-100",
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

describe("stateFor", () => {
	const completed = new Set([1, 2]);

	it("marks completed days", () => {
		assert.strictEqual(stateFor(1, completed, 3), "completed");
	});

	it("marks the lowest incomplete day as next", () => {
		assert.strictEqual(stateFor(3, completed, 3), "next");
	});

	it("offers the near future as unlockable early and the rest as locked", () => {
		assert.strictEqual(stateFor(4, completed, 3), "unlockable-early");
		assert.strictEqual(stateFor(6, completed, 3), "unlockable-early");
		assert.strictEqual(stateFor(7, completed, 3), "locked");
	});

	it("treats every day as next when nothing is incomplete ahead", () => {
		assert.strictEqual(stateFor(9, completed, undefined), "next");
	});
});

describe("tierFor", () => {
	it("starts unranked and climbs to the final tier", () => {
		assert.strictEqual(tierFor(0).label, "Unranked");
		assert.strictEqual(tierFor(0).index, 0);
		assert.strictEqual(tierFor(1).label, TIER_NAMES[TIER_NAMES.length - 1]);
		assert.strictEqual(tierFor(1).nextLabel, undefined);
	});

	it("lights one pip per unlocked tier", () => {
		const tier = tierFor(0.5);
		assert.strictEqual(tier.pips.filter(Boolean).length, tier.index);
		assert.strictEqual(tier.pips.length, TIER_NAMES.length);
	});

	it("clamps nonsense fractions", () => {
		assert.strictEqual(tierFor(Number.NaN).index, 0);
		assert.strictEqual(tierFor(4).index, TIER_NAMES.length);
	});
});

describe("focusAreasFrom", () => {
	it("orders weak topics by frequency then alphabetically", () => {
		const areas = focusAreasFrom(
			progress({
				results: [
					result(1, ["Security", "ALM"]),
					result(2, ["Security", "Governance"]),
					result(3, ["Security", "ALM"]),
				],
			})
		);
		assert.deepStrictEqual(
			areas.map((area) => `${area.topicId}:${area.hits}`),
			["Security:3", "ALM:2", "Governance:1"]
		);
	});

	it("ignores blank topic ids", () => {
		assert.deepStrictEqual(focusAreasFrom(progress({ results: [result(1, ["", "  "])] })), []);
	});

	it("caps the list at six", () => {
		const topics = ["a", "b", "c", "d", "e", "f", "g", "h"];
		assert.strictEqual(focusAreasFrom(progress({ results: [result(1, topics)] })).length, 6);
	});
});

function result(dayNumber: number, weakTopicIds: string[]) {
	return {
		day: dayNumber,
		attempt: 1,
		completedAt: "2026-08-10T00:00:00.000Z",
		questionsAnswered: 10,
		correct: 8,
		accuracy: 0.8,
		weakTopicIds,
		xpAwarded: 180,
	};
}

describe("buildDashboardModel", () => {
	const bank: QuestionBank = {
		examCode: "AB-100",
		domains: [
			{ domainId: "1", domainName: "Plan", questions: [{ id: "q1", question: "?", options: [], correctAnswer: "A" }] },
			{ domainId: "2", domainName: "Design", questions: [] },
		],
	};

	it("derives the day board, next day and completion", () => {
		const model = buildDashboardModel({
			meta: meta(),
			plan: plan([day(1), day(2), day(3), day(4), day(5), day(6)]),
			progress: progress({ completedDays: [1, 2], results: [result(1, ["Security"]), result(2, [])] }),
			today: "2026-09-01",
		});

		assert.strictEqual(model.hasPlan, true);
		assert.strictEqual(model.totalDays, 6);
		assert.strictEqual(model.completedDays, 2);
		assert.strictEqual(model.nextDay, 3);
		assert.deepStrictEqual(
			model.days.map((card) => card.state),
			["completed", "completed", "next", "unlockable-early", "unlockable-early", "unlockable-early"]
		);
		assert.strictEqual(model.days[0].accuracy, 0.8);
		assert.strictEqual(model.days[2].actionLabel, "Start Day 3 →");
	});

	it("always offers a way into a locked day", () => {
		const days = Array.from({ length: 12 }, (_value, index) => day(index + 1));
		const model = buildDashboardModel({ meta: meta(), plan: plan(days), progress: progress(), today: "2026-08-01" });
		const locked = model.days.filter((card) => card.state === "locked");
		assert.ok(locked.length > 0);
		assert.ok(locked.every((card) => card.earlyLabel !== undefined));
	});

	it("counts down to the exam date", () => {
		const model = buildDashboardModel({ meta: meta(), progress: progress(), today: "2026-09-10" });
		assert.strictEqual(model.daysUntilExam, 2);
		assert.strictEqual(model.countdownLabel, "2 days to go");
	});

	it("computes overall accuracy across every attempt", () => {
		const model = buildDashboardModel({
			meta: meta(),
			progress: progress({
				results: [
					{ ...result(1, []), questionsAnswered: 10, correct: 10 },
					{ ...result(2, []), questionsAnswered: 10, correct: 5 },
				],
			}),
			today: "2026-09-01",
		});
		assert.strictEqual(model.answeredQuestions, 20);
		assert.strictEqual(model.overallAccuracy, 0.75);
	});

	it("builds domain rows from the plan and keeps untouched bank domains visible", () => {
		const model = buildDashboardModel({
			meta: meta(),
			plan: plan([day(1), day(2, { domainId: "1" })]),
			progress: progress({ completedDays: [1], results: [result(1, [])] }),
			questions: bank,
			today: "2026-09-01",
		});
		assert.deepStrictEqual(
			model.domains.map((row) => row.id),
			["1", "2"]
		);
		assert.strictEqual(model.domains[0].title, "Plan");
		assert.strictEqual(model.domains[0].totalDays, 2);
		assert.strictEqual(model.domains[0].completedDays, 1);
		assert.strictEqual(model.domains[0].accuracy, 0.8);
		assert.strictEqual(model.domains[1].totalDays, 0);
	});

	it("falls back to an empty state when there is no plan", () => {
		const model = buildDashboardModel({ meta: meta(), progress: progress(), today: "2026-09-01" });
		assert.strictEqual(model.hasPlan, false);
		assert.strictEqual(model.days.length, 0);
		assert.ok(model.emptyHeadline.length > 0);
		assert.ok(model.emptyBody.length > 0);
	});
});
