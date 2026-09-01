import * as assert from "assert";
import { badgeById, evaluateBadges, newlyEarnedBadges } from "../gamification/badges";
import type { DayResult, Progress, StreakState } from "../model/types";

function result(over: Partial<DayResult> & { day: number }): DayResult {
	return {
		attempt: 1,
		completedAt: `2026-01-${String(over.day).padStart(2, "0")}T10:00:00.000Z`,
		questionsAnswered: 10,
		correct: 7,
		accuracy: 0.7,
		weakTopicIds: [],
		xpAwarded: 100,
		...over,
	};
}

function progressOf(results: DayResult[], streak: Partial<StreakState> = {}): Progress {
	return {
		schemaVersion: 1,
		examId: "az-104",
		completedDays: results.map((entry) => entry.day),
		results,
		xp: 0,
		streak: { current: 0, longest: 0, freezeTokens: 0, ...streak },
		badges: [],
		unlockedTiers: [],
		domainCertificates: [],
	};
}

const ids = (progress: Progress) => evaluateBadges(progress).map((badge) => badge.id);

describe("evaluateBadges", () => {
	it("awards nothing before the first day is cleared", () => {
		assert.deepStrictEqual(ids(progressOf([])), []);
	});

	it("awards first steps once a day is banked", () => {
		assert.ok(ids(progressOf([result({ day: 1 })])).includes("first-steps"));
	});

	it("awards a perfect run only when every question landed", () => {
		const perfect = progressOf([result({ day: 1, correct: 10, accuracy: 1 })]);
		const nearly = progressOf([result({ day: 1, correct: 9, accuracy: 0.9 })]);
		assert.ok(ids(perfect).includes("first-perfect"));
		assert.ok(!ids(nearly).includes("first-perfect"));
	});

	it("ignores an empty quiz claiming perfect accuracy", () => {
		const empty = progressOf([result({ day: 1, questionsAnswered: 0, correct: 0, accuracy: 1 })]);
		assert.ok(!ids(empty).includes("first-perfect"));
	});

	it("awards a comeback when a rough day is followed by a strong one", () => {
		const comeback = progressOf([
			result({ day: 1, correct: 3, accuracy: 0.3 }),
			result({ day: 2, correct: 9, accuracy: 0.9 }),
		]);
		assert.ok(ids(comeback).includes("comeback"));
	});

	it("does not award a comeback for a strong day followed by a bad one", () => {
		const slide = progressOf([
			result({ day: 1, correct: 9, accuracy: 0.9 }),
			result({ day: 2, correct: 3, accuracy: 0.3 }),
		]);
		assert.ok(!ids(slide).includes("comeback"));
	});

	it("awards a cleared weak spot when a flagged topic survives a strong later session", () => {
		const cleared = progressOf([
			result({ day: 1, correct: 5, accuracy: 0.5, weakTopicIds: ["identity"] }),
			result({ day: 2, correct: 9, accuracy: 0.9, weakTopicIds: [] }),
		]);
		assert.ok(ids(cleared).includes("weak-spot-cleared"));
	});

	it("keeps the weak spot badge locked while the topic is still being missed", () => {
		const stillWeak = progressOf([
			result({ day: 1, correct: 5, accuracy: 0.5, weakTopicIds: ["identity"] }),
			result({ day: 2, correct: 9, accuracy: 0.9, weakTopicIds: ["identity"] }),
		]);
		assert.ok(!ids(stillWeak).includes("weak-spot-cleared"));
	});

	it("awards streak badges at 7, 14 and 30 days", () => {
		assert.deepStrictEqual(
			ids(progressOf([result({ day: 1 })], { longest: 7 })).filter((id) => id.startsWith("streak-")),
			["streak-7"]
		);
		assert.deepStrictEqual(
			ids(progressOf([result({ day: 1 })], { longest: 30 })).filter((id) => id.startsWith("streak-")),
			["streak-7", "streak-14", "streak-30"]
		);
		assert.deepStrictEqual(
			ids(progressOf([result({ day: 1 })], { longest: 6 })).filter((id) => id.startsWith("streak-")),
			[]
		);
	});

	it("awards the centurion badge on volume alone", () => {
		const many = Array.from({ length: 20 }, (_value, index) => result({ day: index + 1 }));
		assert.ok(ids(progressOf(many)).includes("centurion"));
		assert.ok(!ids(progressOf(many.slice(0, 5))).includes("centurion"));
	});

	it("is idempotent and never returns duplicates", () => {
		const progress = progressOf([
			result({ day: 1, correct: 10, accuracy: 1 }),
			result({ day: 2, correct: 10, accuracy: 1 }),
		]);
		const first = ids(progress);
		assert.deepStrictEqual(first, ids(progress));
		assert.strictEqual(new Set(first).size, first.length);
	});

	it("reads the history in completion order, not array order", () => {
		const outOfOrder = progressOf([
			result({ day: 2, completedAt: "2026-02-02T10:00:00.000Z", correct: 9, accuracy: 0.9 }),
			result({ day: 1, completedAt: "2026-02-01T10:00:00.000Z", correct: 2, accuracy: 0.2 }),
		]);
		assert.ok(ids(outOfOrder).includes("comeback"));
	});

	it("describes every badge it hands out", () => {
		for (const badge of evaluateBadges(progressOf([result({ day: 1, correct: 10, accuracy: 1 })], { longest: 30 }))) {
			assert.ok(badge.name.length > 0);
			assert.ok(badge.icon.length > 0);
			assert.ok(badge.description.length > 0);
			assert.strictEqual(badgeById(badge.id)?.id, badge.id);
		}
	});
});

describe("newlyEarnedBadges", () => {
	it("returns only badges the user has not seen", () => {
		const current = evaluateBadges(progressOf([result({ day: 1, correct: 10, accuracy: 1 })]));
		const fresh = newlyEarnedBadges(["first-steps"], current);
		assert.deepStrictEqual(
			fresh.map((badge) => badge.id),
			["first-perfect"]
		);
	});

	it("returns nothing when everything is already known", () => {
		const current = evaluateBadges(progressOf([result({ day: 1 })]));
		assert.deepStrictEqual(newlyEarnedBadges(current.map((badge) => badge.id), current), []);
	});
});
