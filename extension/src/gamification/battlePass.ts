/**
 * Per-exam battle pass. XP is lifetime; this track is not — it is scoped to one campaign
 * and always ends on exam day, like a seasonal pass ending on the season's last night.
 * Pure by design: the caller decides whether `certPrep.gamification.enabled` lets any of it show.
 */

import type { BattlePass, BattlePassReward, BattlePassTier, Plan, PlanDay, Progress } from "../model/types";

const MIN_TIERS = 10;
const MAX_TIERS = 14;
const PREFERRED_TIERS = 12;

interface CosmeticReward {
	kind: "theme" | "frame" | "milestone";
	id: string;
	name: string;
	icon: string;
	description: string;
}

/** Data-driven so adding a reward never means touching the tier maths. */
const COSMETICS: CosmeticReward[] = [
	{ kind: "milestone", id: "milestone-first-blood", name: "First Blood", icon: "⚡", description: "You opened the campaign. The hardest tier is behind you." },
	{ kind: "theme", id: "theme-ember-dusk", name: "Ember Dusk", icon: "🎨", description: "A warm amber wash for your campaign board." },
	{ kind: "frame", id: "frame-brass-rivet", name: "Brass Rivet", icon: "🖼️", description: "A riveted brass frame for your badge." },
	{ kind: "milestone", id: "milestone-steady-hand", name: "Steady Hand", icon: "🎯", description: "Consistency is the whole trick, and you have it." },
	{ kind: "theme", id: "theme-cyan-drift", name: "Cyan Drift", icon: "🌊", description: "Cool teal gradients for the long study nights." },
	{ kind: "frame", id: "frame-etched-glass", name: "Etched Glass", icon: "💠", description: "A frosted, hairline-etched badge frame." },
	{ kind: "milestone", id: "milestone-halfway", name: "Past the Ridge", icon: "🏔️", description: "More of this campaign is behind you than ahead." },
	{ kind: "theme", id: "theme-violet-vault", name: "Violet Vault", icon: "🔮", description: "Deep indigo with a violet corona." },
	{ kind: "frame", id: "frame-laurel", name: "Laurel", icon: "🌿", description: "A quiet laurel wreath around your badge." },
	{ kind: "milestone", id: "milestone-momentum", name: "Momentum", icon: "🚀", description: "You are no longer starting — you are finishing." },
	{ kind: "theme", id: "theme-gold-leaf", name: "Gold Leaf", icon: "✨", description: "Hammered gold accents across every surface." },
	{ kind: "frame", id: "frame-obsidian", name: "Obsidian", icon: "⬛", description: "A black-glass frame with a single gold hairline." },
	{ kind: "milestone", id: "milestone-final-stretch", name: "Final Stretch", icon: "🔥", description: "Close enough to smell the pass mark." },
	{ kind: "milestone", id: "milestone-exam-ready", name: "Exam Ready", icon: "🏁", description: "The whole campaign is cleared. Go and collect it." },
];

/** Aims for a 10-14 tier track that divides the plan as evenly as possible, whatever its length. */
export function tierCountFor(planLength: number): number {
	if (!Number.isFinite(planLength) || planLength <= 0) {
		return 0;
	}
	let best = PREFERRED_TIERS;
	let bestScore = Number.POSITIVE_INFINITY;
	for (let count = MIN_TIERS; count <= MAX_TIERS; count += 1) {
		// Even division dominates; ties break toward the middle of the band.
		const score = (planLength % count) * 100 + Math.abs(count - PREFERRED_TIERS);
		if (score < bestScore) {
			bestScore = score;
			best = count;
		}
	}
	return best;
}

/** Completed days needed for each tier, 1-based tier -> index. Monotonic, and the last entry is the whole plan. */
export function tierThresholds(planLength: number): number[] {
	const total = tierCountFor(planLength);
	const thresholds: number[] = [];
	for (let tier = 1; tier <= total; tier += 1) {
		const raw = Math.round((tier * planLength) / total);
		thresholds.push(Math.min(planLength, Math.max(1, raw)));
	}
	return thresholds;
}

/** Domain ids whose every planned day has been completed, in plan order. */
export function completedDomainIds(plan: Plan | undefined, completedDays: Iterable<number>): string[] {
	const days = plan?.days ?? [];
	const done = new Set(completedDays);
	const order: string[] = [];
	const outstanding = new Map<string, number>();
	for (const day of days) {
		const id = domainIdOf(day);
		if (!id) {
			continue;
		}
		if (!outstanding.has(id)) {
			outstanding.set(id, 0);
			order.push(id);
		}
		if (!done.has(day.day)) {
			outstanding.set(id, (outstanding.get(id) ?? 0) + 1);
		}
	}
	return order.filter((id) => outstanding.get(id) === 0);
}

export function buildBattlePass(plan: Plan | undefined, progress: Progress | undefined): BattlePass {
	const days = plan?.days ?? [];
	const examId = plan?.examId ?? progress?.examId ?? "";
	const completedSet = new Set(progress?.completedDays ?? []);
	const claimed = new Set(progress?.unlockedTiers ?? []);
	const completedDays = days.filter((day) => completedSet.has(day.day)).length;

	const thresholds = tierThresholds(days.length);
	if (thresholds.length === 0) {
		return { examId, totalTiers: 0, totalDays: 0, completedDays: 0, currentTier: 0, fractionToNext: 0, tiers: [] };
	}

	const rewards = assignRewards(days, thresholds);
	const tiers: BattlePassTier[] = thresholds.map((requiredDays, index) => {
		const tierNumber = index + 1;
		const planDay = days[requiredDays - 1];
		const tier: BattlePassTier = {
			tier: tierNumber,
			requiredDays,
			day: planDay?.day ?? requiredDays,
			label: `Tier ${tierNumber}`,
			reward: rewards[index],
			unlocked: completedDays >= requiredDays,
			claimed: claimed.has(tierNumber),
			final: tierNumber === thresholds.length,
		};
		if (planDay?.date) {
			tier.date = planDay.date;
		}
		return tier;
	});

	const currentTier = tiers.filter((tier) => tier.unlocked).length;
	const nextTier = tiers[currentTier];
	const floor = currentTier === 0 ? 0 : thresholds[currentTier - 1];
	const ceiling = nextTier ? nextTier.requiredDays : floor;
	const span = ceiling - floor;

	const pass: BattlePass = {
		examId,
		totalTiers: tiers.length,
		totalDays: days.length,
		completedDays,
		currentTier,
		fractionToNext: span > 0 ? clamp01((completedDays - floor) / span) : nextTier ? 0 : 1,
		tiers,
	};
	if (nextTier) {
		pass.nextTier = nextTier;
	}
	return pass;
}

export function unlockedTiers(plan: Plan | undefined, progress: Progress | undefined): number[] {
	return buildBattlePass(plan, progress)
		.tiers.filter((tier) => tier.unlocked)
		.map((tier) => tier.tier);
}

/** Only the delta, so the UI celebrates a transition exactly once. */
export function newlyUnlocked(previous: readonly number[], current: readonly number[]): number[] {
	const seen = new Set(previous);
	return [...new Set(current)].filter((tier) => !seen.has(tier)).sort((a, b) => a - b);
}

function assignRewards(days: PlanDay[], thresholds: number[]): BattlePassReward[] {
	const rewards: (BattlePassReward | undefined)[] = new Array(thresholds.length).fill(undefined);

	// Certificates are the anchors: each domain's last day decides its tier, cosmetics fill in around them.
	for (const [domainId, lastIndex] of lastDayIndexByDomain(days)) {
		const wanted = tierForDayIndex(lastIndex, thresholds);
		const slot = firstFreeSlot(rewards, wanted - 1);
		if (slot === undefined) {
			continue;
		}
		rewards[slot] = {
			kind: "certificate",
			id: `certificate-${domainId}`,
			name: `${titleOfDomain(days, domainId)} certificate`,
			icon: "📜",
			description: "A printable certificate for clearing every day in this domain.",
			domainId,
		};
	}

	let cosmetic = 0;
	return rewards.map((reward, index) => {
		if (reward) {
			return reward;
		}
		if (index === thresholds.length - 1) {
			return { ...COSMETICS[COSMETICS.length - 1] };
		}
		const pick = COSMETICS[cosmetic % (COSMETICS.length - 1)];
		cosmetic += 1;
		return { ...pick };
	});
}

/** The tier a 0-based plan-day index falls inside. */
export function tierForDayIndex(dayIndex: number, thresholds: number[]): number {
	const needed = dayIndex + 1;
	for (let tier = 1; tier <= thresholds.length; tier += 1) {
		if (thresholds[tier - 1] >= needed) {
			return tier;
		}
	}
	return thresholds.length;
}

function firstFreeSlot(rewards: (BattlePassReward | undefined)[], from: number): number | undefined {
	for (let index = from; index < rewards.length; index += 1) {
		if (!rewards[index]) {
			return index;
		}
	}
	for (let index = from - 1; index >= 0; index -= 1) {
		if (!rewards[index]) {
			return index;
		}
	}
	return undefined;
}

function lastDayIndexByDomain(days: PlanDay[]): Map<string, number> {
	const last = new Map<string, number>();
	days.forEach((day, index) => {
		const id = domainIdOf(day);
		if (id) {
			last.set(id, index);
		}
	});
	return last;
}

function titleOfDomain(days: PlanDay[], domainId: string): string {
	const first = days.find((day) => domainIdOf(day) === domainId);
	return first ? first.title : `Domain ${domainId}`;
}

function domainIdOf(day: PlanDay): string | undefined {
	const id = String(day.domainId ?? "").trim();
	return id.length > 0 ? id : undefined;
}

function clamp01(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}
	return Math.min(1, Math.max(0, value));
}
