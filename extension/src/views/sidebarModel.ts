/** Pure view-model construction for the sidebar. No fs, no vscode, so it stays directly unit-testable. */

import { completionPrompt, shouldOfferCompletion, type CompletionPrompt } from "../completion/examCompletion";
import { progressToNextLevel } from "../gamification/engine";
import type { ExamMeta, Plan, Progress, UserProfile } from "../model/types";
import type { SyncIndicatorState } from "../webview/protocol";

export interface ExamSnapshot {
	meta: ExamMeta;
	plan?: Plan;
	progress: Progress;
}

export interface SidebarInput {
	snapshots: ExamSnapshot[];
	profile?: UserProfile;
	gamificationEnabled: boolean;
	syncState: SyncIndicatorState;
	syncError?: string;
	/** ISO date used for the exam countdown; defaults to today. */
	today?: string;
}

export interface HeaderModel {
	level: number;
	rank: string;
	currentXp: number;
	neededXp: number;
	fraction: number;
	lifetimeXp: number;
	streak: number;
	longestStreak: number;
	freezeTokens: number;
	maxFreezeTokens: number;
	greeting: string;
}

export interface ActiveExamCard {
	examId: string;
	folder: string;
	code: string;
	title: string;
	vendor: string;
	currentDay: number;
	totalDays: number;
	completedDays: number;
	fraction: number;
	examDate?: string;
	daysUntilExam?: number;
	countdownLabel?: string;
	lastAccuracy?: number;
	started: boolean;
	ctaLabel: string;
	encouragement: string;
	/** Set once the exam date has arrived: "How did it go?". */
	completionPrompt?: CompletionPrompt;
}

export interface TrophyCard {
	examId: string;
	folder: string;
	code: string;
	title: string;
	vendor: string;
	legacy: boolean;
	passed?: boolean;
	score?: number;
	maxScore?: number;
	scoreLabel?: string;
	credentialUrl?: string;
	scoreReportFile?: string;
	completedAt?: string;
	xp?: number;
}

export interface SyncModel {
	state: SyncIndicatorState;
	label: string;
	canCommit: boolean;
	error?: string;
}

export interface SidebarModel {
	header?: HeaderModel;
	active: ActiveExamCard[];
	trophies: TrophyCard[];
	hasAnyExam: boolean;
	emptyHeadline: string;
	emptyBody: string;
	sync: SyncModel;
}

const MAX_FREEZE_TOKENS = 3;

export function buildSidebarModel(input: SidebarInput): SidebarModel {
	const today = input.today ?? new Date().toISOString().slice(0, 10);
	const active = input.snapshots
		.filter((snapshot) => snapshot.meta.status === "in-progress")
		.map((snapshot) => buildActiveCard(snapshot, today));
	const trophies = input.snapshots
		.filter((snapshot) => snapshot.meta.status === "completed")
		.map(buildTrophy)
		.sort(byCompletionDesc);

	const model: SidebarModel = {
		active,
		trophies,
		hasAnyExam: input.snapshots.length > 0,
		emptyHeadline: "Your campaign starts here",
		emptyBody: "Pick an exam, tell us when you sit it, and we will lay out a day-by-day quest line for you.",
		sync: buildSync(input.syncState, input.syncError),
	};

	if (input.gamificationEnabled) {
		model.header = buildHeader(input.snapshots, input.profile);
	}

	return model;
}

function buildHeader(snapshots: ExamSnapshot[], profile?: UserProfile): HeaderModel {
	const lifetimeXp = Math.max(0, profile?.lifetimeXp ?? 0);
	const { level, rank, current, needed, fraction } = progressToNextLevel(lifetimeXp);
	const streaks = snapshots.map((snapshot) => snapshot.progress.streak);
	const streak = Math.max(0, ...streaks.map((s) => s?.current ?? 0));
	const longestStreak = Math.max(0, ...streaks.map((s) => s?.longest ?? 0));
	const freezeTokens = Math.max(0, ...streaks.map((s) => s?.freezeTokens ?? 0));

	return {
		level,
		rank,
		currentXp: current,
		neededXp: needed,
		fraction: clamp01(fraction),
		lifetimeXp,
		streak,
		longestStreak,
		freezeTokens: Math.min(freezeTokens, MAX_FREEZE_TOKENS),
		maxFreezeTokens: MAX_FREEZE_TOKENS,
		greeting: greetingFor(streak, lifetimeXp),
	};
}

function greetingFor(streak: number, lifetimeXp: number): string {
	if (streak >= 10) {
		return `${streak} days straight. You are unstoppable.`;
	}
	if (streak >= 3) {
		return `${streak}-day streak burning bright — keep it lit!`;
	}
	if (streak === 1) {
		return "Day one of a brand new streak. Nice.";
	}
	if (lifetimeXp > 0) {
		return "Welcome back. One session is all it takes to restart the flame.";
	}
	return "Ready when you are. Your first XP is one session away.";
}

function buildActiveCard(snapshot: ExamSnapshot, today: string): ActiveExamCard {
	const { meta, plan, progress } = snapshot;
	const planDays = plan?.days ?? [];
	const totalDays = planDays.length;
	const completed = new Set(progress.completedDays ?? []);
	const completedDays = totalDays > 0 ? planDays.filter((day) => completed.has(day.day)).length : completed.size;

	const nextPlanned = planDays.find((day) => !completed.has(day.day));
	const currentDay = totalDays > 0 ? (nextPlanned ? nextPlanned.day : totalDays) : completedDays + 1;
	const fraction = totalDays > 0 ? clamp01(completedDays / totalDays) : 0;

	const daysUntilExam = daysBetween(today, meta.examDate);
	const lastAccuracy = lastAccuracyOf(progress);
	const started = completedDays > 0;

	const card: ActiveExamCard = {
		examId: meta.id,
		folder: meta.folder,
		code: meta.code,
		title: meta.title,
		vendor: meta.vendor,
		currentDay,
		totalDays,
		completedDays,
		fraction,
		started,
		ctaLabel: started ? `Continue Day ${currentDay} →` : "Start Day 1 →",
		encouragement: encouragementFor(fraction, started),
	};

	if (meta.examDate) {
		card.examDate = meta.examDate;
	}
	if (daysUntilExam !== undefined) {
		card.daysUntilExam = daysUntilExam;
		card.countdownLabel = countdownLabel(daysUntilExam);
	}
	if (lastAccuracy !== undefined) {
		card.lastAccuracy = lastAccuracy;
	}
	if (shouldOfferCompletion(meta, today)) {
		card.completionPrompt = completionPrompt(meta, today);
	}
	return card;
}

function encouragementFor(fraction: number, started: boolean): string {
	if (!started) {
		return "Fresh campaign — the first day is always the easiest to win.";
	}
	if (fraction >= 1) {
		return "Every day cleared. Go and ace it.";
	}
	if (fraction >= 0.75) {
		return "Final stretch. You can see the finish line from here.";
	}
	if (fraction >= 0.4) {
		return "Past halfway soon — momentum is on your side.";
	}
	return "Great start. Small daily wins add up fast.";
}

function countdownLabel(days: number): string {
	if (days < 0) {
		return "exam date passed";
	}
	if (days === 0) {
		return "exam is today";
	}
	if (days === 1) {
		return "1 day to go";
	}
	return `${days} days to go`;
}

function buildTrophy(snapshot: ExamSnapshot): TrophyCard {
	const { meta, progress } = snapshot;
	const result = meta.result;
	const trophy: TrophyCard = {
		examId: meta.id,
		folder: meta.folder,
		code: meta.code,
		title: meta.title,
		vendor: meta.vendor,
		legacy: meta.legacy === true,
	};

	if (result) {
		if (typeof result.passed === "boolean") {
			trophy.passed = result.passed;
		}
		if (typeof result.score === "number") {
			trophy.score = result.score;
			trophy.scoreLabel =
				typeof result.maxScore === "number" ? `${result.score} / ${result.maxScore}` : String(result.score);
		}
		if (typeof result.maxScore === "number") {
			trophy.maxScore = result.maxScore;
		}
		if (result.credentialUrl) {
			trophy.credentialUrl = result.credentialUrl;
		}
		if (result.scoreReportFile) {
			trophy.scoreReportFile = result.scoreReportFile;
		}
	}
	if (meta.completedAt) {
		trophy.completedAt = meta.completedAt;
	}
	// Pre-campaign certifications are celebrated but never credited with XP.
	if (!trophy.legacy) {
		trophy.xp = Math.max(0, progress.xp ?? 0);
	}
	return trophy;
}

function byCompletionDesc(a: TrophyCard, b: TrophyCard): number {
	return (b.completedAt ?? "").localeCompare(a.completedAt ?? "") || a.code.localeCompare(b.code);
}

function buildSync(state: SyncIndicatorState, error?: string): SyncModel {
	const labels: Record<SyncIndicatorState, string> = {
		idle: "Progress saved",
		syncing: "Syncing…",
		pending: "Changes waiting to sync",
		offline: "Working offline",
	};
	const sync: SyncModel = { state, label: labels[state], canCommit: state === "pending" };
	if (error) {
		sync.error = error;
	}
	return sync;
}

function lastAccuracyOf(progress: Progress): number | undefined {
	const results = progress.results ?? [];
	if (results.length === 0) {
		return undefined;
	}
	const last = results[results.length - 1];
	return typeof last.accuracy === "number" ? clamp01(last.accuracy) : undefined;
}

function daysBetween(fromIso: string, toIso?: string): number | undefined {
	if (!toIso) {
		return undefined;
	}
	const from = Date.parse(`${fromIso}T00:00:00Z`);
	const to = Date.parse(`${toIso}T00:00:00Z`);
	if (Number.isNaN(from) || Number.isNaN(to)) {
		return undefined;
	}
	return Math.round((to - from) / 86_400_000);
}

function clamp01(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}
	return Math.min(1, Math.max(0, value));
}
