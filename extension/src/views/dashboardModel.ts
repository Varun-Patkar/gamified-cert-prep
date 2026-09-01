/** Pure view-model construction for the exam dashboard. No fs, no vscode, so it stays unit-testable. */

import { completionPrompt, shouldOfferCompletion, type CompletionPrompt } from "../completion/examCompletion";
import { buildBattlePass } from "../gamification/battlePass";
import type { DayKind, ExamMeta, Plan, Progress, QuestionBank } from "../model/types";

export type DayState = "completed" | "next" | "locked" | "unlockable-early";

export const TIER_NAMES = ["Recruit", "Scout", "Ranger", "Vanguard", "Legend"] as const;
/** How many days past the next one still read as "nearly unlocked" rather than far off. */
const EARLY_HORIZON = 3;
const MAX_FOCUS_AREAS = 6;

export interface DayCard {
	day: number;
	date: string;
	kind: DayKind;
	kindLabel: string;
	title: string;
	questionCount: number;
	state: DayState;
	locked: boolean;
	attempts: number;
	accuracy?: number;
	actionLabel: string;
	earlyLabel?: string;
	domainId?: string;
}

export interface DomainProgressRow {
	id: string;
	title: string;
	totalDays: number;
	completedDays: number;
	fraction: number;
	questionCount: number;
	accuracy?: number;
}

export interface FocusArea {
	topicId: string;
	hits: number;
}

export interface TierModel {
	index: number;
	total: number;
	label: string;
	nextLabel?: string;
	pips: boolean[];
}

/** The real per-exam track, summarised for the header. Absent when gamification is off. */
export interface BattlePassSummary {
	currentTier: number;
	totalTiers: number;
	fractionToNext: number;
	nextRewardName?: string;
	pips: boolean[];
}

export interface CertificateMedallion {
	domainId: string;
	domainName: string;
	accuracy?: number;
}

export interface DashboardModel {
	examId: string;
	folder: string;
	code: string;
	title: string;
	vendor: string;
	status: ExamMeta["status"];
	examDate?: string;
	daysUntilExam?: number;
	countdownLabel: string;
	hasPlan: boolean;
	totalDays: number;
	completedDays: number;
	fraction: number;
	answeredQuestions: number;
	overallAccuracy?: number;
	xp: number;
	streak: number;
	tier: TierModel;
	gamificationEnabled: boolean;
	battlePass?: BattlePassSummary;
	certificates: CertificateMedallion[];
	nextDay?: number;
	days: DayCard[];
	domains: DomainProgressRow[];
	focusAreas: FocusArea[];
	headline: string;
	encouragement: string;
	emptyHeadline: string;
	emptyBody: string;
	/** Set once the exam date has arrived: "How did it go?". */
	completionPrompt?: CompletionPrompt;
}

export interface DashboardInput {
	meta: ExamMeta;
	plan?: Plan;
	progress: Progress;
	questions?: QuestionBank;
	/** ISO date used for the countdown; defaults to today. */
	today?: string;
	/** Mirrors `certPrep.gamification.enabled`; when false the track and certificates stay hidden. */
	gamificationEnabled?: boolean;
}

const KIND_LABELS: Record<DayKind, string> = {
	study: "Study",
	review: "Review",
	buffer: "Buffer",
	mock: "Mock exam",
	exam: "Exam day",
};

export function buildDashboardModel(input: DashboardInput): DashboardModel {
	const { meta, plan, progress } = input;
	const today = input.today ?? new Date().toISOString().slice(0, 10);
	const planDays = plan?.days ?? [];
	const completed = new Set(progress.completedDays ?? []);

	const nextDay = planDays.find((day) => !completed.has(day.day))?.day;
	const days = planDays.map((day) => buildDayCard(day, completed, nextDay, progress));

	const completedDays = planDays.filter((day) => completed.has(day.day)).length;
	const totalDays = planDays.length;
	const fraction = totalDays > 0 ? clamp01(completedDays / totalDays) : 0;

	const answeredQuestions = (progress.results ?? []).reduce(
		(sum, result) => sum + Math.max(0, result.questionsAnswered ?? 0),
		0
	);
	const correctQuestions = (progress.results ?? []).reduce((sum, result) => sum + Math.max(0, result.correct ?? 0), 0);

	const gamificationEnabled = input.gamificationEnabled !== false;
	const domains = buildDomainRows(input, completed);

	const model: DashboardModel = {
		examId: meta.id,
		folder: meta.folder,
		code: meta.code,
		title: meta.title,
		vendor: meta.vendor,
		status: meta.status,
		countdownLabel: "no exam date set",
		hasPlan: totalDays > 0,
		totalDays,
		completedDays,
		fraction,
		answeredQuestions,
		xp: Math.max(0, progress.xp ?? 0),
		streak: Math.max(0, progress.streak?.current ?? 0),
		tier: tierFor(fraction),
		gamificationEnabled,
		certificates: gamificationEnabled ? medallionsFor(progress, domains) : [],
		days,
		domains,
		focusAreas: focusAreasFrom(progress),
		headline: headlineFor(meta, nextDay, totalDays),
		encouragement: encouragementFor(fraction, completedDays > 0),
		emptyHeadline: "No campaign laid out yet",
		emptyBody:
			"Tell us when you sit this one and we will carve it into daily sessions, each with its own quiz and XP.",
	};

	if (meta.examDate) {
		model.examDate = meta.examDate;
		const until = daysBetween(today, meta.examDate);
		if (until !== undefined) {
			model.daysUntilExam = until;
			model.countdownLabel = countdownLabel(until);
		}
	}
	if (nextDay !== undefined) {
		model.nextDay = nextDay;
	}
	if (gamificationEnabled && totalDays > 0) {
		model.battlePass = battlePassSummary(plan, progress, domains);
	}
	if (answeredQuestions > 0) {
		model.overallAccuracy = clamp01(correctQuestions / answeredQuestions);
	}
	if (shouldOfferCompletion(meta, today)) {
		model.completionPrompt = completionPrompt(meta, today);
	}
	return model;
}

function buildDayCard(
	day: Plan["days"][number],
	completed: Set<number>,
	nextDay: number | undefined,
	progress: Progress
): DayCard {
	const results = (progress.results ?? []).filter((result) => result.day === day.day);
	const state = stateFor(day.day, completed, nextDay);
	const card: DayCard = {
		day: day.day,
		date: day.date,
		kind: day.kind,
		kindLabel: KIND_LABELS[day.kind] ?? day.kind,
		title: day.title,
		questionCount: Math.max(0, day.questionCount ?? 0),
		state,
		locked: state === "locked" || state === "unlockable-early",
		attempts: results.length,
		actionLabel: actionLabelFor(state, day.day),
	};

	// Nothing is ever hard-blocked: a locked day still offers a way in.
	// The ghost action is always the quiz, so it must not repeat the primary (session) label.
	if (state === "locked" || state === "unlockable-early") {
		card.earlyLabel = "Quiz me early";
	}

	const latest = results[results.length - 1];
	if (latest && typeof latest.accuracy === "number") {
		card.accuracy = clamp01(latest.accuracy);
	}
	if (day.domainId) {
		card.domainId = day.domainId;
	}
	return card;
}

export function stateFor(day: number, completed: Set<number>, nextDay: number | undefined): DayState {
	if (completed.has(day)) {
		return "completed";
	}
	if (nextDay === undefined || day === nextDay) {
		return "next";
	}
	if (day < nextDay) {
		return "next";
	}
	return day - nextDay <= EARLY_HORIZON ? "unlockable-early" : "locked";
}

function actionLabelFor(state: DayState, day: number): string {
	switch (state) {
		case "completed":
			return "Revisit";
		case "next":
			return `Start Day ${day} →`;
		case "unlockable-early":
			return "Get ahead →";
		default:
			return "Read ahead";
	}
}

export function tierFor(fraction: number): TierModel {
	const total = TIER_NAMES.length;
	const index = Math.min(total, Math.ceil(clamp01(fraction) * total));
	const tier: TierModel = {
		index,
		total,
		label: index === 0 ? "Unranked" : TIER_NAMES[index - 1],
		pips: TIER_NAMES.map((_name, position) => position < index),
	};
	if (index < total) {
		tier.nextLabel = TIER_NAMES[index];
	}
	return tier;
}

function battlePassSummary(
	plan: Plan | undefined,
	progress: Progress,
	domains: DomainProgressRow[]
): BattlePassSummary {
	const pass = buildBattlePass(plan, progress);
	const summary: BattlePassSummary = {
		currentTier: pass.currentTier,
		totalTiers: pass.totalTiers,
		fractionToNext: pass.fractionToNext,
		pips: pass.tiers.map((tier) => tier.unlocked),
	};
	if (pass.nextTier) {
		// Certificate rewards are named after a plan day; prefer the domain's real title.
		const domainId = pass.nextTier.reward.domainId;
		const title = domainId ? domains.find((row) => row.id === String(domainId))?.title : undefined;
		summary.nextRewardName = title ? `${title} certificate` : pass.nextTier.reward.name;
	}
	return summary;
}

function medallionsFor(progress: Progress, domains: DomainProgressRow[]): CertificateMedallion[] {
	const byId = new Map(domains.map((row) => [row.id, row]));
	return (progress.domainCertificates ?? []).map((domainId) => {
		const row = byId.get(String(domainId));
		const medallion: CertificateMedallion = {
			domainId: String(domainId),
			domainName: row?.title ?? `Domain ${domainId}`,
		};
		if (row && typeof row.accuracy === "number") {
			medallion.accuracy = row.accuracy;
		}
		return medallion;
	});
}

function buildDomainRows(input: DashboardInput, completed: Set<number>): DomainProgressRow[] {
	const bankDomains = input.questions?.domains ?? [];
	const titles = new Map(bankDomains.map((domain) => [String(domain.domainId), domain.domainName]));
	const counts = new Map(bankDomains.map((domain) => [String(domain.domainId), (domain.questions ?? []).length]));

	const planDays = (input.plan?.days ?? []).filter((day) => Boolean(day.domainId));
	const resultsByDay = new Map((input.progress.results ?? []).map((result) => [result.day, result]));

	const rows = new Map<string, DomainProgressRow>();
	for (const day of planDays) {
		const id = String(day.domainId);
		const row = rows.get(id) ?? {
			id,
			title: titles.get(id) ?? day.title,
			totalDays: 0,
			completedDays: 0,
			fraction: 0,
			questionCount: counts.get(id) ?? 0,
		};
		row.totalDays += 1;
		if (completed.has(day.day)) {
			row.completedDays += 1;
		}
		rows.set(id, row);
	}

	// A bank domain the plan never touches still deserves a row, so nothing quietly disappears.
	for (const domain of bankDomains) {
		const id = String(domain.domainId);
		if (!rows.has(id)) {
			rows.set(id, {
				id,
				title: domain.domainName,
				totalDays: 0,
				completedDays: 0,
				fraction: 0,
				questionCount: counts.get(id) ?? 0,
			});
		}
	}

	for (const [id, row] of rows) {
		row.fraction = row.totalDays > 0 ? clamp01(row.completedDays / row.totalDays) : 0;
		let answered = 0;
		let correct = 0;
		for (const day of planDays) {
			if (String(day.domainId) !== id) {
				continue;
			}
			const result = resultsByDay.get(day.day);
			if (result) {
				answered += Math.max(0, result.questionsAnswered ?? 0);
				correct += Math.max(0, result.correct ?? 0);
			}
		}
		if (answered > 0) {
			row.accuracy = clamp01(correct / answered);
		}
	}

	return [...rows.values()].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

export function focusAreasFrom(progress: Progress): FocusArea[] {
	const hits = new Map<string, number>();
	for (const result of progress.results ?? []) {
		for (const topicId of result.weakTopicIds ?? []) {
			const key = String(topicId ?? "").trim();
			if (key.length === 0) {
				continue;
			}
			hits.set(key, (hits.get(key) ?? 0) + 1);
		}
	}
	return [...hits.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.slice(0, MAX_FOCUS_AREAS)
		.map(([topicId, count]) => ({ topicId, hits: count }));
}

function headlineFor(meta: ExamMeta, nextDay: number | undefined, totalDays: number): string {
	if (totalDays === 0) {
		return `${meta.code} is waiting for a battle plan`;
	}
	if (nextDay === undefined) {
		return "Every day cleared — you are exam ready";
	}
	return `Day ${nextDay} of ${totalDays} is up next`;
}

function encouragementFor(fraction: number, started: boolean): string {
	if (!started) {
		return "Day one is always the cheapest win on the board. Take it.";
	}
	if (fraction >= 1) {
		return "The whole campaign is cleared. Go and collect the certificate.";
	}
	if (fraction >= 0.75) {
		return "Final stretch — you can see the finish line from here.";
	}
	if (fraction >= 0.4) {
		return "Momentum is doing the heavy lifting now. Keep showing up.";
	}
	return "Small daily wins compound faster than you think.";
}

function countdownLabel(days: number): string {
	if (days < 0) {
		return "exam date passed";
	}
	if (days === 0) {
		return "exam is today";
	}
	return days === 1 ? "1 day to go" : `${days} days to go`;
}

function daysBetween(fromIso: string, toIso: string): number | undefined {
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
