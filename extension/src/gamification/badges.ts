/** Badge evaluation. Pure and idempotent: given the same history it always returns the same set. */

import type { BadgeAward, DayResult, Progress } from "../model/types";

const PERFECT = 1;
const COMEBACK_LOW = 0.5;
const COMEBACK_HIGH = 0.85;
const CLEARED_ACCURACY = 0.8;
const CENTURION_QUESTIONS = 200;

const CATALOG: Record<string, BadgeAward> = {
	"first-steps": {
		id: "first-steps",
		name: "First Steps",
		icon: "👣",
		description: "Finished your first day of the campaign.",
	},
	"first-perfect": {
		id: "first-perfect",
		name: "Flawless",
		icon: "💯",
		description: "Answered every question in a quiz correctly.",
	},
	"weak-spot-cleared": {
		id: "weak-spot-cleared",
		name: "Weak Spot Cleared",
		icon: "🛠️",
		description: "Turned a topic that used to catch you out into a clean run.",
	},
	comeback: {
		id: "comeback",
		name: "Comeback",
		icon: "📈",
		description: "Followed a rough session with a genuinely strong one.",
	},
	"streak-7": { id: "streak-7", name: "Seven Days", icon: "🔥", description: "Studied seven days in a row." },
	"streak-14": { id: "streak-14", name: "Fortnight", icon: "🔥🔥", description: "Studied fourteen days in a row." },
	"streak-30": { id: "streak-30", name: "Thirty Days", icon: "🏵️", description: "Studied thirty days in a row." },
	centurion: {
		id: "centurion",
		name: "Centurion",
		icon: "🎖️",
		description: `Answered ${CENTURION_QUESTIONS} questions across the campaign.`,
	},
};

export function badgeById(id: string): BadgeAward | undefined {
	return CATALOG[id];
}

export function evaluateBadges(progress: Progress, results: DayResult[] = progress?.results ?? []): BadgeAward[] {
	const history = [...(results ?? [])].sort(byChronology);
	const earned = new Set<string>();

	if ((progress?.completedDays ?? []).length > 0 || history.length > 0) {
		earned.add("first-steps");
	}

	let answered = 0;
	for (const result of history) {
		answered += Math.max(0, result.questionsAnswered ?? 0);
		if ((result.questionsAnswered ?? 0) > 0 && (result.accuracy ?? 0) >= PERFECT) {
			earned.add("first-perfect");
		}
	}
	if (answered >= CENTURION_QUESTIONS) {
		earned.add("centurion");
	}

	if (hasComeback(history)) {
		earned.add("comeback");
	}
	if (hasClearedWeakSpot(history)) {
		earned.add("weak-spot-cleared");
	}

	const longest = Math.max(0, progress?.streak?.longest ?? 0);
	for (const days of [7, 14, 30]) {
		if (longest >= days) {
			earned.add(`streak-${days}`);
		}
	}

	return [...earned].map((id) => CATALOG[id]).filter((badge): badge is BadgeAward => Boolean(badge));
}

export function newlyEarnedBadges(previous: readonly string[], current: readonly BadgeAward[]): BadgeAward[] {
	const seen = new Set(previous);
	return current.filter((badge) => !seen.has(badge.id));
}

function hasComeback(history: DayResult[]): boolean {
	let sawRough = false;
	for (const result of history) {
		if ((result.questionsAnswered ?? 0) === 0) {
			continue;
		}
		if (sawRough && (result.accuracy ?? 0) >= COMEBACK_HIGH) {
			return true;
		}
		if ((result.accuracy ?? 0) < COMEBACK_LOW) {
			sawRough = true;
		}
	}
	return false;
}

/** A topic that once landed on the weak list, later survived a strong session untouched. */
function hasClearedWeakSpot(history: DayResult[]): boolean {
	const flagged = new Set<string>();
	for (const result of history) {
		const weak = new Set((result.weakTopicIds ?? []).map((topic) => String(topic).trim()).filter(Boolean));
		if ((result.accuracy ?? 0) >= CLEARED_ACCURACY && (result.questionsAnswered ?? 0) > 0) {
			for (const topic of flagged) {
				if (!weak.has(topic)) {
					return true;
				}
			}
		}
		for (const topic of weak) {
			flagged.add(topic);
		}
	}
	return false;
}

function byChronology(a: DayResult, b: DayResult): number {
	const left = String(a.completedAt ?? "");
	const right = String(b.completedAt ?? "");
	if (left !== right) {
		return left < right ? -1 : 1;
	}
	return a.day - b.day || a.attempt - b.attempt;
}
