import * as assert from "assert";
import {
	LEVELS,
	awardDayXp,
	levelForXp,
	progressToNextLevel,
	updateStreak,
} from "../gamification/engine";
import type { StreakState } from "../model/types";

const streak = (over: Partial<StreakState> = {}): StreakState => ({
	current: 0,
	longest: 0,
	freezeTokens: 0,
	...over,
});

describe("levelForXp", () => {
	it("starts everyone at level 1", () => {
		assert.strictEqual(levelForXp(0).level, 1);
		assert.strictEqual(levelForXp(0).rank, LEVELS[0].rank);
	});

	it("never decreases as xp grows", () => {
		let previous = 0;
		for (let xp = 0; xp < 200_000; xp += 137) {
			const { level } = levelForXp(xp);
			assert.ok(level >= previous, `level dropped at ${xp}`);
			previous = level;
		}
	});

	it("assigns a rank name at every level", () => {
		for (const xp of [0, 900, 5_000, 40_000, 500_000]) {
			assert.ok(levelForXp(xp).rank.length > 0);
		}
	});

	it("treats negative xp as zero rather than throwing", () => {
		assert.strictEqual(levelForXp(-50).level, 1);
	});
});

describe("progressToNextLevel", () => {
	it("reports a fraction between 0 and 1", () => {
		for (const xp of [0, 123, 4_567, 98_765]) {
			const { fraction } = progressToNextLevel(xp);
			assert.ok(fraction >= 0 && fraction <= 1, `fraction out of range at ${xp}: ${fraction}`);
		}
	});

	it("is exactly 0 at a level boundary", () => {
		const boundary = progressToNextLevel(0);
		assert.strictEqual(boundary.fraction, 0);
	});
});

describe("awardDayXp", () => {
	it("gives base xp plus an accuracy bonus and the streak bonus", () => {
		const xp = awardDayXp({ accuracy: 0.8, attempt: 1, streakAfter: 1, isPerfect: false });
		assert.strictEqual(xp, 100 + 80 + 5);
	});

	it("adds a perfect-score bonus", () => {
		const perfect = awardDayXp({ accuracy: 1, attempt: 1, streakAfter: 1, isPerfect: true });
		const near = awardDayXp({ accuracy: 0.99, attempt: 1, streakAfter: 1, isPerfect: false });
		assert.ok(perfect > near + 40);
	});

	it("scales a streak bonus but caps it", () => {
		const at10 = awardDayXp({ accuracy: 0.5, attempt: 1, streakAfter: 10, isPerfect: false });
		const at50 = awardDayXp({ accuracy: 0.5, attempt: 1, streakAfter: 50, isPerfect: false });
		assert.strictEqual(at10, at50, "streak bonus must be capped so long streaks can't farm xp");
	});

	it("pays much less for a retake so quizzes can't be farmed", () => {
		const first = awardDayXp({ accuracy: 1, attempt: 1, streakAfter: 3, isPerfect: true });
		const second = awardDayXp({ accuracy: 1, attempt: 2, streakAfter: 3, isPerfect: true });
		assert.ok(second > 0, "review should still be rewarded");
		assert.ok(second < first / 2, "but far less than the first attempt");
	});

	it("still awards something for a bad day", () => {
		const xp = awardDayXp({ accuracy: 0, attempt: 1, streakAfter: 1, isPerfect: false });
		assert.ok(xp >= 100, "showing up counts");
	});

	it("never returns a fraction", () => {
		const xp = awardDayXp({ accuracy: 0.333, attempt: 2, streakAfter: 7, isPerfect: false });
		assert.strictEqual(xp, Math.floor(xp));
	});
});

describe("updateStreak", () => {
	it("starts a streak on the first study day", () => {
		const next = updateStreak(streak(), "2026-09-01");
		assert.strictEqual(next.current, 1);
		assert.strictEqual(next.longest, 1);
		assert.strictEqual(next.lastStudyDate, "2026-09-01");
	});

	it("increments on consecutive days", () => {
		const next = updateStreak(streak({ current: 4, longest: 4, lastStudyDate: "2026-09-01" }), "2026-09-02");
		assert.strictEqual(next.current, 5);
	});

	it("does not double-count two sessions on the same day", () => {
		const next = updateStreak(streak({ current: 4, longest: 6, lastStudyDate: "2026-09-01" }), "2026-09-01");
		assert.strictEqual(next.current, 4);
		assert.strictEqual(next.longest, 6);
	});

	it("spends a freeze token to survive a single missed day", () => {
		const next = updateStreak(
			streak({ current: 30, longest: 30, lastStudyDate: "2026-09-01", freezeTokens: 2 }),
			"2026-09-03"
		);
		assert.strictEqual(next.current, 31, "a 30-day streak must survive one bad day");
		assert.strictEqual(next.freezeTokens, 1);
	});

	it("resets when a day is missed with no token", () => {
		const next = updateStreak(
			streak({ current: 30, longest: 30, lastStudyDate: "2026-09-01", freezeTokens: 0 }),
			"2026-09-03"
		);
		assert.strictEqual(next.current, 1);
		assert.strictEqual(next.longest, 30, "longest is a record and must never shrink");
	});

	it("resets on a long gap even with tokens available", () => {
		const next = updateStreak(
			streak({ current: 30, longest: 30, lastStudyDate: "2026-09-01", freezeTokens: 3 }),
			"2026-09-20"
		);
		assert.strictEqual(next.current, 1);
		assert.strictEqual(next.freezeTokens, 3, "tokens are not burned on a hopeless gap");
	});

	it("earns a freeze token every five consecutive days, capped", () => {
		let state = streak();
		const day = (n: number) => `2026-09-${String(n).padStart(2, "0")}`;
		for (let i = 1; i <= 30; i++) {
			state = updateStreak(state, day(i));
		}
		assert.strictEqual(state.current, 30);
		assert.ok(state.freezeTokens > 0);
		assert.ok(state.freezeTokens <= 3, "tokens must be capped");
	});
});
