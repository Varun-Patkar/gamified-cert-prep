import * as assert from "assert";
import {
	buildBattlePass,
	completedDomainIds,
	newlyUnlocked,
	tierCountFor,
	tierThresholds,
	unlockedTiers,
} from "../gamification/battlePass";
import type { Plan, PlanDay, Progress } from "../model/types";

const PLAN_LENGTHS = [5, 10, 30, 60, 120];

function planOf(days: number, domainFor: (day: number) => string | undefined = () => undefined): Plan {
	const list: PlanDay[] = [];
	for (let day = 1; day <= days; day += 1) {
		const domainId = domainFor(day);
		list.push({
			day,
			date: `2026-01-${String(day).padStart(2, "0")}`,
			kind: day === days ? "exam" : "study",
			title: `Day ${day}`,
			topicIds: [],
			questionCount: 10,
			sessionFile: `sessions/day-${day}.md`,
			...(domainId ? { domainId } : {}),
		});
	}
	return {
		schemaVersion: 1,
		examId: "az-104",
		generatedAt: "2026-01-01T00:00:00.000Z",
		config: {
			startDate: "2026-01-01",
			examDate: `2026-01-${String(days).padStart(2, "0")}`,
			hoursPerDay: 1,
			dayPolicy: "all",
			questionsPerDay: 10,
			includeReviewDays: false,
			includeFinalMock: false,
		},
		days: list,
	};
}

function progressOf(completedDays: number[], unlocked: number[] = []): Progress {
	return {
		schemaVersion: 1,
		examId: "az-104",
		completedDays,
		results: [],
		xp: 0,
		streak: { current: 0, longest: 0, freezeTokens: 0 },
		badges: [],
		unlockedTiers: unlocked,
		domainCertificates: [],
	};
}

describe("tierCountFor", () => {
	it("stays inside the 10-14 band for every plan length", () => {
		for (const length of PLAN_LENGTHS) {
			const count = tierCountFor(length);
			assert.ok(count >= 10 && count <= 14, `plan of ${length} days produced ${count} tiers`);
		}
	});

	it("has no track at all without a plan", () => {
		assert.strictEqual(tierCountFor(0), 0);
		assert.strictEqual(tierCountFor(-4), 0);
	});

	it("prefers a count that divides the plan evenly", () => {
		assert.strictEqual(tierCountFor(10), 10);
		assert.strictEqual(tierCountFor(60), 12);
	});
});

describe("tierThresholds", () => {
	it("never decreases", () => {
		for (const length of PLAN_LENGTHS) {
			const thresholds = tierThresholds(length);
			for (let i = 1; i < thresholds.length; i += 1) {
				assert.ok(thresholds[i] >= thresholds[i - 1], `thresholds dipped at tier ${i + 1} for ${length} days`);
			}
		}
	});

	it("needs at least one day for tier 1 and the whole plan for the last tier", () => {
		for (const length of PLAN_LENGTHS) {
			const thresholds = tierThresholds(length);
			assert.strictEqual(thresholds[0] >= 1, true);
			assert.strictEqual(thresholds[thresholds.length - 1], length);
		}
	});
});

describe("buildBattlePass", () => {
	it("keeps the tier count in band and the numbering monotonic", () => {
		for (const length of PLAN_LENGTHS) {
			const pass = buildBattlePass(planOf(length), progressOf([]));
			assert.ok(pass.totalTiers >= 10 && pass.totalTiers <= 14);
			pass.tiers.forEach((tier, index) => {
				assert.strictEqual(tier.tier, index + 1);
				if (index > 0) {
					assert.ok(tier.requiredDays >= pass.tiers[index - 1].requiredDays);
					assert.ok(tier.day >= pass.tiers[index - 1].day);
				}
			});
		}
	});

	it("lands the final tier on exam day", () => {
		for (const length of PLAN_LENGTHS) {
			const plan = planOf(length);
			const pass = buildBattlePass(plan, progressOf([]));
			const last = pass.tiers[pass.tiers.length - 1];
			const examDay = plan.days[plan.days.length - 1];
			assert.strictEqual(last.final, true);
			assert.strictEqual(last.day, examDay.day);
			assert.strictEqual(last.date, examDay.date);
			assert.strictEqual(last.requiredDays, length);
		}
	});

	it("unlocks proportionally as days are cleared", () => {
		const plan = planOf(12);
		assert.strictEqual(buildBattlePass(plan, progressOf([])).currentTier, 0);
		assert.strictEqual(buildBattlePass(plan, progressOf([1, 2, 3])).currentTier, 3);
		assert.strictEqual(
			buildBattlePass(plan, progressOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).currentTier,
			12
		);
	});

	it("marks previously recorded tiers as claimed and the rest as fresh", () => {
		const pass = buildBattlePass(planOf(12), progressOf([1, 2, 3], [1, 2]));
		assert.deepStrictEqual(
			pass.tiers.filter((tier) => tier.claimed).map((tier) => tier.tier),
			[1, 2]
		);
		assert.deepStrictEqual(
			pass.tiers.filter((tier) => tier.unlocked && !tier.claimed).map((tier) => tier.tier),
			[3]
		);
	});

	it("reports progress toward the next tier", () => {
		const pass = buildBattlePass(planOf(24), progressOf([1, 2]));
		assert.ok(pass.nextTier);
		assert.ok(pass.fractionToNext >= 0 && pass.fractionToNext <= 1);
	});

	it("survives a missing plan without throwing", () => {
		const pass = buildBattlePass(undefined, progressOf([1, 2]));
		assert.strictEqual(pass.totalTiers, 0);
		assert.deepStrictEqual(pass.tiers, []);
		assert.strictEqual(pass.currentTier, 0);
	});

	it("slots a domain certificate at the tier holding that domain's last day", () => {
		const plan = planOf(12, (day) => (day <= 6 ? "1" : "2"));
		const pass = buildBattlePass(plan, progressOf([]));
		const thresholds = tierThresholds(12);

		const first = pass.tiers.find((tier) => tier.reward.domainId === "1");
		const second = pass.tiers.find((tier) => tier.reward.domainId === "2");
		assert.strictEqual(first?.tier, 6, "domain 1 ends on day 6, which lives in tier 6");
		assert.strictEqual(second?.tier, 12, "domain 2 ends on exam day");
		assert.strictEqual(first?.reward.kind, "certificate");
		assert.strictEqual(thresholds[5] >= 6, true);
	});

	it("gives every other tier a cosmetic reward", () => {
		const pass = buildBattlePass(planOf(30), progressOf([]));
		for (const tier of pass.tiers) {
			assert.ok(tier.reward.name.length > 0);
			assert.ok(tier.reward.icon.length > 0);
			assert.ok(["theme", "frame", "milestone", "certificate"].includes(tier.reward.kind));
		}
	});
});

describe("unlockedTiers", () => {
	it("returns exactly the tiers earned so far", () => {
		const plan = planOf(12);
		assert.deepStrictEqual(unlockedTiers(plan, progressOf([1, 2, 3])), [1, 2, 3]);
		assert.deepStrictEqual(unlockedTiers(plan, progressOf([])), []);
	});

	it("ignores completed days that are not in the plan", () => {
		assert.deepStrictEqual(unlockedTiers(planOf(12), progressOf([98, 99])), []);
	});
});

describe("newlyUnlocked", () => {
	it("returns only the delta, sorted", () => {
		assert.deepStrictEqual(newlyUnlocked([1, 2], [1, 2, 3, 4]), [3, 4]);
		assert.deepStrictEqual(newlyUnlocked([], [2, 1]), [1, 2]);
	});

	it("returns nothing when nothing changed", () => {
		assert.deepStrictEqual(newlyUnlocked([1, 2, 3], [1, 2, 3]), []);
		assert.deepStrictEqual(newlyUnlocked([1, 2, 3], [1]), []);
	});

	it("de-duplicates a repeated current list", () => {
		assert.deepStrictEqual(newlyUnlocked([], [1, 1, 2]), [1, 2]);
	});
});

describe("completedDomainIds", () => {
	const plan = planOf(12, (day) => (day <= 6 ? "1" : "2"));

	it("reports nothing until every day of a domain is done", () => {
		assert.deepStrictEqual(completedDomainIds(plan, [1, 2, 3, 4, 5]), []);
	});

	it("reports a domain once its last day is cleared", () => {
		assert.deepStrictEqual(completedDomainIds(plan, [1, 2, 3, 4, 5, 6]), ["1"]);
	});

	it("keeps plan order for several cleared domains", () => {
		const all = plan.days.map((day) => day.day);
		assert.deepStrictEqual(completedDomainIds(plan, all), ["1", "2"]);
	});

	it("ignores days with no domain at all", () => {
		assert.deepStrictEqual(completedDomainIds(planOf(6), [1, 2, 3, 4, 5, 6]), []);
	});
});
