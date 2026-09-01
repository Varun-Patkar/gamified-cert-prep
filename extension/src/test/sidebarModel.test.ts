import * as assert from "assert";
import type { ExamMeta, Plan, PlanDay, Progress, UserProfile } from "../model/types";
import { buildSidebarModel, type ExamSnapshot, type SidebarInput } from "../views/sidebarModel";

function meta(over: Partial<ExamMeta> = {}): ExamMeta {
	return {
		schemaVersion: 1,
		id: "az-104",
		vendor: "Microsoft",
		code: "AZ-104",
		title: "Azure Administrator",
		status: "in-progress",
		legacy: false,
		gamified: true,
		folder: "AZ-104 Prep",
		createdAt: "2026-01-01",
		...over,
	};
}

function progress(over: Partial<Progress> = {}): Progress {
	return {
		schemaVersion: 1,
		examId: "az-104",
		completedDays: [],
		results: [],
		xp: 0,
		streak: { current: 0, longest: 0, freezeTokens: 0 },
		badges: [],
		unlockedTiers: [],
		domainCertificates: [],
		...over,
	};
}

function plan(dayCount: number): Plan {
	const days: PlanDay[] = [];
	for (let day = 1; day <= dayCount; day += 1) {
		days.push({
			day,
			date: "2026-02-01",
			kind: "study",
			title: `Day ${day}`,
			topicIds: [],
			questionCount: 10,
			sessionFile: `sessions/day-0${day}-study.md`,
		});
	}
	return { schemaVersion: 1, examId: "az-104", generatedAt: "2026-01-01", config: planConfig(), days };
}

function planConfig() {
	return {
		startDate: "2026-02-01",
		examDate: "2026-03-01",
		hoursPerDay: 2,
		dayPolicy: "all" as const,
		questionsPerDay: 20,
		includeReviewDays: true,
		includeFinalMock: true,
	};
}

function profile(over: Partial<UserProfile> = {}): UserProfile {
	return { schemaVersion: 1, lifetimeXp: 0, badges: [], createdAt: "2026-01-01", ...over };
}

function input(over: Partial<SidebarInput> = {}): SidebarInput {
	return {
		snapshots: [],
		gamificationEnabled: true,
		syncState: "idle",
		today: "2026-02-10",
		...over,
	};
}

const snapshot = (over: Partial<ExamSnapshot> = {}): ExamSnapshot => ({
	meta: meta(),
	progress: progress(),
	...over,
});

describe("buildSidebarModel — header", () => {
	it("omits the header entirely when gamification is disabled", () => {
		const model = buildSidebarModel(input({ gamificationEnabled: false, profile: profile({ lifetimeXp: 900 }) }));
		assert.strictEqual(model.header, undefined);
	});

	it("derives level and next-level progress from lifetime xp", () => {
		const model = buildSidebarModel(input({ profile: profile({ lifetimeXp: 700 }) }));
		assert.ok(model.header);
		assert.strictEqual(model.header.lifetimeXp, 700);
		assert.strictEqual(model.header.level, 2);
		assert.ok(model.header.fraction > 0 && model.header.fraction < 1);
		assert.ok(model.header.rank.length > 0);
	});

	it("treats a missing profile as a level 1 fresh start", () => {
		const model = buildSidebarModel(input());
		assert.ok(model.header);
		assert.strictEqual(model.header.level, 1);
		assert.strictEqual(model.header.lifetimeXp, 0);
		assert.strictEqual(model.header.streak, 0);
	});

	it("shows the best streak across exams and caps freeze pips", () => {
		const model = buildSidebarModel(
			input({
				snapshots: [
					snapshot({ progress: progress({ streak: { current: 3, longest: 4, freezeTokens: 1 } }) }),
					snapshot({
						meta: meta({ id: "ai-102", code: "AI-102" }),
						progress: progress({ streak: { current: 9, longest: 12, freezeTokens: 9 } }),
					}),
				],
			})
		);
		assert.ok(model.header);
		assert.strictEqual(model.header.streak, 9);
		assert.strictEqual(model.header.longestStreak, 12);
		assert.strictEqual(model.header.freezeTokens, model.header.maxFreezeTokens);
	});

	it("writes encouraging, never shaming, greetings", () => {
		const cold = buildSidebarModel(input()).header;
		const hot = buildSidebarModel(
			input({ snapshots: [snapshot({ progress: progress({ streak: { current: 12, longest: 12, freezeTokens: 0 } }) })] })
		).header;
		assert.ok(cold && hot);
		assert.ok(cold.greeting.length > 0);
		assert.ok(hot.greeting.includes("12"));
	});
});

describe("buildSidebarModel — active exams", () => {
	it("computes Day X of Y from the plan and completed days", () => {
		const model = buildSidebarModel(
			input({ snapshots: [snapshot({ plan: plan(20), progress: progress({ completedDays: [1, 2, 3] }) })] })
		);
		const card = model.active[0];
		assert.strictEqual(card.totalDays, 20);
		assert.strictEqual(card.completedDays, 3);
		assert.strictEqual(card.currentDay, 4);
		assert.ok(Math.abs(card.fraction - 0.15) < 1e-9);
		assert.strictEqual(card.started, true);
		assert.strictEqual(card.ctaLabel, "Continue Day 4 →");
	});

	it("points at the first gap rather than the highest completed day", () => {
		const model = buildSidebarModel(
			input({ snapshots: [snapshot({ plan: plan(10), progress: progress({ completedDays: [1, 2, 4, 5] }) })] })
		);
		assert.strictEqual(model.active[0].currentDay, 3);
	});

	it("invites a start when nothing is done yet", () => {
		const model = buildSidebarModel(input({ snapshots: [snapshot({ plan: plan(14) })] }));
		const card = model.active[0];
		assert.strictEqual(card.currentDay, 1);
		assert.strictEqual(card.started, false);
		assert.strictEqual(card.ctaLabel, "Start Day 1 →");
		assert.strictEqual(card.fraction, 0);
	});

	it("clamps to the last day once every day is cleared", () => {
		const model = buildSidebarModel(
			input({ snapshots: [snapshot({ plan: plan(5), progress: progress({ completedDays: [1, 2, 3, 4, 5] }) })] })
		);
		const card = model.active[0];
		assert.strictEqual(card.currentDay, 5);
		assert.strictEqual(card.fraction, 1);
	});

	it("survives an exam with no plan yet", () => {
		const model = buildSidebarModel(input({ snapshots: [snapshot({ progress: progress({ completedDays: [1] }) })] }));
		const card = model.active[0];
		assert.strictEqual(card.totalDays, 0);
		assert.strictEqual(card.currentDay, 2);
		assert.strictEqual(card.fraction, 0);
	});

	it("counts down to the exam date", () => {
		const model = buildSidebarModel(
			input({ snapshots: [snapshot({ meta: meta({ examDate: "2026-02-13" }) })] })
		);
		assert.strictEqual(model.active[0].daysUntilExam, 3);
		assert.strictEqual(model.active[0].countdownLabel, "3 days to go");
	});

	it("has no countdown when the exam date is missing or unparseable", () => {
		assert.strictEqual(buildSidebarModel(input({ snapshots: [snapshot()] })).active[0].daysUntilExam, undefined);
		const bad = buildSidebarModel(input({ snapshots: [snapshot({ meta: meta({ examDate: "soon" }) })] }));
		assert.strictEqual(bad.active[0].countdownLabel, undefined);
	});

	it("reports the most recent accuracy", () => {
		const model = buildSidebarModel(
			input({
				snapshots: [
					snapshot({
						progress: progress({
							completedDays: [1, 2],
							results: [
								{ day: 1, attempt: 1, completedAt: "2026-02-01", questionsAnswered: 10, correct: 5, accuracy: 0.5, weakTopicIds: [], xpAwarded: 100 },
								{ day: 2, attempt: 1, completedAt: "2026-02-02", questionsAnswered: 10, correct: 9, accuracy: 0.9, weakTopicIds: [], xpAwarded: 150 },
							],
						}),
					}),
				],
			})
		);
		assert.strictEqual(model.active[0].lastAccuracy, 0.9);
	});
});

describe("buildSidebarModel — trophies and empty state", () => {
	it("splits in-progress from completed exams", () => {
		const model = buildSidebarModel(
			input({
				snapshots: [
					snapshot(),
					snapshot({ meta: meta({ id: "sc-900", code: "SC-900", status: "completed" }) }),
					snapshot({ meta: meta({ id: "ms-900", code: "MS-900", status: "abandoned" }) }),
				],
			})
		);
		assert.deepStrictEqual(model.active.map((card) => card.code), ["AZ-104"]);
		assert.deepStrictEqual(model.trophies.map((item) => item.code), ["SC-900"]);
	});

	it("never credits legacy certifications with xp", () => {
		const model = buildSidebarModel(
			input({
				snapshots: [
					snapshot({
						meta: meta({ id: "dp-900", code: "DP-900", status: "completed", legacy: true }),
						progress: progress({ xp: 4000 }),
					}),
					snapshot({
						meta: meta({ id: "gh-300", code: "GH-300", status: "completed", legacy: false }),
						progress: progress({ xp: 1200 }),
					}),
				],
			})
		);
		const legacy = model.trophies.find((item) => item.code === "DP-900");
		const earned = model.trophies.find((item) => item.code === "GH-300");
		assert.ok(legacy && earned);
		assert.strictEqual(legacy.legacy, true);
		assert.strictEqual(legacy.xp, undefined);
		assert.strictEqual(earned.xp, 1200);
	});

	it("surfaces score and credential links", () => {
		const model = buildSidebarModel(
			input({
				snapshots: [
					snapshot({
						meta: meta({
							status: "completed",
							completedAt: "2026-01-20",
							result: {
								passed: true,
								score: 872,
								maxScore: 1000,
								credentialUrl: "https://learn.microsoft.com/cred",
								scoreReportFile: "AZ-104 Prep/certificates/report.pdf",
							},
						}),
					}),
				],
			})
		);
		const trophy = model.trophies[0];
		assert.strictEqual(trophy.scoreLabel, "872 / 1000");
		assert.strictEqual(trophy.passed, true);
		assert.strictEqual(trophy.credentialUrl, "https://learn.microsoft.com/cred");
		assert.strictEqual(trophy.scoreReportFile, "AZ-104 Prep/certificates/report.pdf");
	});

	it("orders the trophy case newest first", () => {
		const model = buildSidebarModel(
			input({
				snapshots: [
					snapshot({ meta: meta({ id: "a", code: "AA-100", status: "completed", completedAt: "2025-05-01" }) }),
					snapshot({ meta: meta({ id: "b", code: "BB-100", status: "completed", completedAt: "2026-01-01" }) }),
				],
			})
		);
		assert.deepStrictEqual(model.trophies.map((item) => item.code), ["BB-100", "AA-100"]);
	});

	it("offers a warm empty state when there are no exams at all", () => {
		const model = buildSidebarModel(input());
		assert.strictEqual(model.hasAnyExam, false);
		assert.deepStrictEqual(model.active, []);
		assert.deepStrictEqual(model.trophies, []);
		assert.ok(model.emptyHeadline.length > 0);
		assert.ok(model.emptyBody.length > 0);
	});
});

describe("buildSidebarModel — sync", () => {
	it("only offers a commit affordance while changes are pending", () => {
		assert.strictEqual(buildSidebarModel(input({ syncState: "idle" })).sync.canCommit, false);
		assert.strictEqual(buildSidebarModel(input({ syncState: "syncing" })).sync.canCommit, false);
		assert.strictEqual(buildSidebarModel(input({ syncState: "offline" })).sync.canCommit, false);
		assert.strictEqual(buildSidebarModel(input({ syncState: "pending" })).sync.canCommit, true);
	});

	it("labels every sync state and passes the error through", () => {
		for (const state of ["idle", "syncing", "pending", "offline"] as const) {
			assert.ok(buildSidebarModel(input({ syncState: state })).sync.label.length > 0);
		}
		assert.strictEqual(buildSidebarModel(input({ syncState: "pending", syncError: "boom" })).sync.error, "boom");
	});
});
