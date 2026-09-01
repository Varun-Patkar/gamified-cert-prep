import type { StreakState } from "../model/types";

export interface LevelBand {
	minLevel: number;
	rank: string;
}

export const LEVELS: LevelBand[] = [
	{ minLevel: 1, rank: "Apprentice" },
	{ minLevel: 6, rank: "Practitioner" },
	{ minLevel: 12, rank: "Specialist" },
	{ minLevel: 20, rank: "Architect" },
	{ minLevel: 30, rank: "Grandmaster" },
];

const XP_PER_LEVEL_STEP = 500;

/** Cumulative XP needed to reach a level. Quadratic: early levels fly by, later ones earn their weight. */
export function xpForLevel(level: number): number {
	const n = Math.max(1, Math.floor(level)) - 1;
	return (XP_PER_LEVEL_STEP * n * (n + 1)) / 2;
}

export function levelForXp(xp: number): { level: number; rank: string } {
	const safeXp = Math.max(0, xp);
	let level = 1;
	while (xpForLevel(level + 1) <= safeXp) {
		level++;
	}
	const band = [...LEVELS].reverse().find((b) => level >= b.minLevel) ?? LEVELS[0];
	return { level, rank: band.rank };
}

export function progressToNextLevel(xp: number): {
	level: number;
	rank: string;
	current: number;
	needed: number;
	fraction: number;
} {
	const safeXp = Math.max(0, xp);
	const { level, rank } = levelForXp(safeXp);
	const floor = xpForLevel(level);
	const ceiling = xpForLevel(level + 1);
	const needed = ceiling - floor;
	const current = safeXp - floor;
	return { level, rank, current, needed, fraction: needed === 0 ? 0 : current / needed };
}

export interface DayXpInput {
	accuracy: number;
	attempt: number;
	streakAfter: number;
	isPerfect: boolean;
}

const BASE_DAY_XP = 100;
const PERFECT_BONUS = 50;
const MAX_STREAK_BONUS_DAYS = 10;
const STREAK_XP_PER_DAY = 5;
const RETAKE_MULTIPLIER = 0.25;

export function awardDayXp({ accuracy, attempt, streakAfter, isPerfect }: DayXpInput): number {
	const clamped = Math.min(1, Math.max(0, accuracy));
	const accuracyBonus = Math.round(clamped * 100);

	if (attempt > 1) {
		return Math.floor((BASE_DAY_XP + accuracyBonus) * RETAKE_MULTIPLIER);
	}

	const streakBonus = Math.min(streakAfter, MAX_STREAK_BONUS_DAYS) * STREAK_XP_PER_DAY;
	const perfectBonus = isPerfect ? PERFECT_BONUS : 0;
	return BASE_DAY_XP + accuracyBonus + streakBonus + perfectBonus;
}

const FREEZE_TOKEN_EVERY = 5;
const MAX_FREEZE_TOKENS = 3;

function daysBetween(fromIso: string, toIso: string): number {
	const from = Date.parse(`${fromIso}T00:00:00Z`);
	const to = Date.parse(`${toIso}T00:00:00Z`);
	return Math.round((to - from) / 86_400_000);
}

export function updateStreak(state: StreakState, studyDate: string): StreakState {
	if (!state.lastStudyDate) {
		return grantTokens({ ...state, current: 1, longest: Math.max(state.longest, 1), lastStudyDate: studyDate });
	}

	const gap = daysBetween(state.lastStudyDate, studyDate);

	if (gap <= 0) {
		return state;
	}

	if (gap === 1) {
		const current = state.current + 1;
		return grantTokens({ ...state, current, longest: Math.max(state.longest, current), lastStudyDate: studyDate });
	}

	// Exactly one missed day is what freeze tokens exist for; a longer gap is a genuine restart.
	if (gap === 2 && state.freezeTokens > 0) {
		const current = state.current + 1;
		return grantTokens({
			...state,
			current,
			longest: Math.max(state.longest, current),
			lastStudyDate: studyDate,
			freezeTokens: state.freezeTokens - 1,
		});
	}

	return { ...state, current: 1, longest: Math.max(state.longest, 1), lastStudyDate: studyDate };
}

function grantTokens(state: StreakState): StreakState {
	if (state.current % FREEZE_TOKEN_EVERY !== 0) {
		return state;
	}
	return { ...state, freezeTokens: Math.min(MAX_FREEZE_TOKENS, state.freezeTokens + 1) };
}
