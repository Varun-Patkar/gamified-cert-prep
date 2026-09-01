/** Pure plan construction: no fs, no vscode, so the scheduler stays directly unit-testable. */

import type { DayKind, Domain, Plan, PlanConfig, PlanDay } from "../model/types";
import { dayFileName, slugify } from "../store/paths";

const MIN_QUESTIONS_PER_DAY = 10;
const MOCK_QUESTION_FLOOR = 40;
/** Stops a typo'd exam date ten years out from generating a nonsense plan. */
const MAX_PLAN_SPAN_DAYS = 3650;
/** Buffer is breathing room, not filler: one mid-plan and one before the mock is the most it earns. */
const MAX_BUFFER_DAYS = 2;
/** How much slack a plan needs before each buffer day is worth spending. */
const DAYS_PER_BUFFER = 6;
/** Roughly one spaced-repetition review for every this many days of new material. */
const REVIEW_SPACING = 4;
/** Ceiling on how far a heavy domain may stretch its per-topic depth past the baseline. */
const MAX_WEIGHT_BOOST = 2;

export interface GeneratePlanInput {
	examId: string;
	domains: Domain[];
	config: PlanConfig;
	weakDomainIds?: string[];
}

interface DraftDay {
	kind: DayKind;
	title: string;
	domainId?: string;
	topicIds: string[];
	questionCount: number;
}

function parseIsoDate(value: string | undefined): Date | undefined {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((value ?? "").trim());
	if (!match) {
		return undefined;
	}
	const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
	return Number.isNaN(date.getTime()) ? undefined : date;
}

function toIsoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 86_400_000);
}

function isAllowedWeekday(weekday: number, config: PlanConfig): boolean {
	switch (config.dayPolicy) {
		case "weekdays":
			return weekday >= 1 && weekday <= 5;
		case "weekends":
			return weekday === 0 || weekday === 6;
		case "custom": {
			const days = (config.customDays ?? []).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
			// An empty custom list would starve the plan, so fall back to every day.
			return days.length === 0 ? true : days.includes(weekday);
		}
		default:
			return true;
	}
}

/** Every study date from startDate up to but excluding examDate that the day policy allows. */
export function availableDates(config: PlanConfig): string[] {
	const start = parseIsoDate(config.startDate);
	const exam = parseIsoDate(config.examDate);
	if (!start || !exam || start.getTime() >= exam.getTime()) {
		return [];
	}
	const dates: string[] = [];
	let cursor = start;
	for (let i = 0; i < MAX_PLAN_SPAN_DAYS && cursor.getTime() < exam.getTime(); i += 1) {
		if (isAllowedWeekday(cursor.getUTCDay(), config)) {
			dates.push(toIsoDate(cursor));
		}
		cursor = addDays(cursor, 1);
	}
	return dates;
}

/** Largest-remainder apportionment: the returned counts always sum to exactly `total`. */
export function apportion(weights: number[], total: number): number[] {
	const count = weights.length;
	if (count === 0 || total <= 0) {
		return new Array<number>(count).fill(0);
	}
	const safe = weights.map((weight) => (Number.isFinite(weight) && weight > 0 ? weight : 0));
	const sum = safe.reduce((acc, weight) => acc + weight, 0);
	const shares = sum > 0 ? safe : safe.map(() => 1);
	const shareSum = sum > 0 ? sum : count;

	if (total < count) {
		const ranked = shares
			.map((weight, index) => ({ weight, index }))
			.sort((a, b) => b.weight - a.weight || a.index - b.index);
		const result = new Array<number>(count).fill(0);
		for (let i = 0; i < total; i += 1) {
			result[ranked[i].index] = 1;
		}
		return result;
	}

	const exact = shares.map((weight) => (total * weight) / shareSum);
	const result = exact.map((quota) => Math.floor(quota));
	const remaining = total - result.reduce((acc, value) => acc + value, 0);
	const byRemainder = exact
		.map((quota, index) => ({ remainder: quota - Math.floor(quota), index }))
		.sort((a, b) => b.remainder - a.remainder || a.index - b.index);
	for (let i = 0; i < remaining; i += 1) {
		result[byRemainder[i].index] += 1;
	}

	// Everyone gets at least one day, funded by whoever has the most.
	for (let index = 0; index < count; index += 1) {
		if (result[index] > 0) {
			continue;
		}
		let donor = -1;
		for (let candidate = 0; candidate < count; candidate += 1) {
			if (result[candidate] > 1 && (donor === -1 || result[candidate] > result[donor])) {
				donor = candidate;
			}
		}
		if (donor === -1) {
			break;
		}
		result[donor] -= 1;
		result[index] += 1;
	}
	return result;
}

function boostWeakDomains(allocations: number[], domains: Domain[], weakDomainIds: string[]): void {
	for (const weakId of weakDomainIds) {
		const target = domains.findIndex((domain) => domain.id === weakId);
		if (target < 0 || allocations[target] === 0) {
			continue;
		}
		let donor = -1;
		for (let index = 0; index < allocations.length; index += 1) {
			if (index === target || allocations[index] <= 1) {
				continue;
			}
			if (donor === -1 || allocations[index] > allocations[donor]) {
				donor = index;
			}
		}
		if (donor === -1) {
			continue;
		}
		allocations[donor] -= 1;
		allocations[target] += 1;
	}
}

function chunk<T>(items: T[], parts: number): T[][] {
	const buckets: T[][] = Array.from({ length: Math.max(1, parts) }, () => []);
	items.forEach((item, index) => buckets[index % buckets.length].push(item));
	return buckets;
}

/** With more days than topics the extra days revisit topics in rotation instead of sitting empty. */
function splitTopics(topicIds: readonly string[], days: number): string[][] {
	const parts = Math.max(1, days);
	if (topicIds.length === 0) {
		return Array.from({ length: parts }, () => []);
	}
	if (topicIds.length >= parts) {
		return chunk([...topicIds], parts);
	}
	return Array.from({ length: parts }, (_, index) => [topicIds[index % topicIds.length]]);
}

/**
 * How many days a domain may spend: topic count x depth, where depth is how much calendar room
 * exists per topic, scaled by the domain's share of the exam so heavy domains can go deeper.
 */
function studyCaps(domains: readonly Domain[], studyTotal: number): number[] {
	const topicCounts = domains.map((domain) => Math.max(1, domain.topicIds.length));
	const totalTopics = topicCounts.reduce((acc, value) => acc + value, 0);
	const depth = Math.max(1, Math.ceil(studyTotal / Math.max(1, totalTopics)));
	const weights = domains.map((domain) => (Number.isFinite(domain.weight) && domain.weight > 0 ? domain.weight : 0));
	const weightSum = weights.reduce((acc, value) => acc + value, 0);
	const mean = weightSum > 0 ? weightSum / domains.length : 0;
	return domains.map((_, index) => {
		const share = mean > 0 ? weights[index] / mean : 1;
		return Math.max(1, Math.ceil(topicCounts[index] * depth * Math.min(MAX_WEIGHT_BOOST, Math.max(1, share))));
	});
}

/** Trims allocations to their caps and hands the freed days to domains that still have headroom. */
function applyCaps(allocations: number[], caps: readonly number[], domains: readonly Domain[]): number {
	let surplus = 0;
	for (let index = 0; index < allocations.length; index += 1) {
		if (allocations[index] > caps[index]) {
			surplus += allocations[index] - caps[index];
			allocations[index] = caps[index];
		}
	}
	const byWeight = domains
		.map((domain, index) => ({ weight: domain.weight, index }))
		.sort((a, b) => b.weight - a.weight || a.index - b.index);
	while (surplus > 0) {
		let placed = 0;
		for (const { index } of byWeight) {
			if (surplus === 0) {
				break;
			}
			if (allocations[index] > 0 && allocations[index] < caps[index]) {
				allocations[index] += 1;
				surplus -= 1;
				placed += 1;
			}
		}
		if (placed === 0) {
			break;
		}
	}
	return surplus;
}

function questionsPerDay(config: PlanConfig): number {
	const requested = Number.isFinite(config.questionsPerDay) ? Math.floor(config.questionsPerDay) : 0;
	return Math.max(MIN_QUESTIONS_PER_DAY, requested);
}

function examDayDraft(): DraftDay {
	return { kind: "exam", title: "Exam Day", topicIds: [], questionCount: 0 };
}

/** Late review days cover everything seen so far, which is far too long to sit on a card. */
const MAX_REVIEW_TITLES = 2;

function reviewTitle(seenDomainTitles: readonly string[]): string {
	if (seenDomainTitles.length === 0) {
		return "Review";
	}
	if (seenDomainTitles.length <= MAX_REVIEW_TITLES) {
		return `Review: ${seenDomainTitles.join(", ")}`;
	}
	const shown = seenDomainTitles.slice(0, MAX_REVIEW_TITLES).join(", ");
	return `Review: ${shown} +${seenDomainTitles.length - MAX_REVIEW_TITLES} more`;
}

/**
 * Rotates which earlier domains a review targets so back-to-back reviews are never the same card;
 * every third one sweeps everything seen so far.
 */
function reviewFocus(seen: readonly Domain[], rotation: number): Domain[] {
	if (seen.length <= MAX_REVIEW_TITLES || rotation % 3 === 2) {
		return [...seen];
	}
	const start = rotation % seen.length;
	return [seen[start], seen[(start + 1) % seen.length]];
}

function reviewDraft(seen: readonly Domain[], rotation: number, perDay: number): DraftDay {
	const focus = reviewFocus(seen, rotation);
	const topicIds: string[] = [];
	for (const domain of focus) {
		for (const topicId of domain.topicIds) {
			if (!topicIds.includes(topicId)) {
				topicIds.push(topicId);
			}
		}
	}
	return {
		kind: "review",
		title: reviewTitle(focus.map((domain) => domain.title)),
		topicIds,
		questionCount: perDay,
	};
}

function bufferDraft(): DraftDay {
	return { kind: "buffer", title: "Buffer & Catch-up", topicIds: [], questionCount: 0 };
}

function buildDrafts(input: GeneratePlanInput, total: number): DraftDay[] {
	const { config, domains } = input;
	const perDay = questionsPerDay(config);
	const mockCount = config.includeFinalMock && total > domains.length ? 1 : 0;
	const afterMock = total - mockCount;
	// Slack is everything past the one-day-per-domain minimum; only that can fund buffer and review.
	const slack = Math.max(0, afterMock - domains.length);
	const bufferCount = Math.min(MAX_BUFFER_DAYS, Math.floor(slack / DAYS_PER_BUFFER));
	const afterBuffer = afterMock - bufferCount;
	const reviewBudget = config.includeReviewDays
		? Math.max(0, Math.min(Math.floor(afterBuffer / REVIEW_SPACING), afterBuffer - domains.length))
		: 0;
	const studyTotal = afterBuffer - reviewBudget;

	const allocations = apportion(
		domains.map((domain) => domain.weight),
		studyTotal
	);
	boostWeakDomains(allocations, domains, input.weakDomainIds ?? []);
	const unplaced = applyCaps(allocations, studyCaps(domains, studyTotal), domains);

	const studyDrafts: DraftDay[] = [];
	/** Index into studyDrafts of each domain's first day, so a review knows what has been covered. */
	const domainStartsAt: number[] = [];
	domains.forEach((domain, index) => {
		const days = allocations[index];
		if (days <= 0) {
			return;
		}
		domainStartsAt[index] = studyDrafts.length;
		const slices = splitTopics(domain.topicIds, days);
		for (let part = 0; part < days; part += 1) {
			studyDrafts.push({
				kind: "study",
				title: days > 1 ? `${domain.title} — Part ${part + 1}` : domain.title,
				domainId: domain.id,
				topicIds: slices[part],
				questionCount: perDay,
			});
		}
	});

	// Days the caps could not absorb still have to fill the calendar; review beats idle buffer.
	const reviews = reviewBudget + (config.includeReviewDays ? unplaced : 0);
	const extraBuffer = config.includeReviewDays ? 0 : unplaced;

	const drafts = interleaveReviews(studyDrafts, domains, domainStartsAt, reviews, perDay);
	placeBuffers(drafts, bufferCount + extraBuffer);

	if (mockCount > 0) {
		drafts.push({
			kind: "mock",
			title: "Full Mock Exam",
			topicIds: domains.flatMap((domain) => domain.topicIds),
			questionCount: Math.max(perDay, MOCK_QUESTION_FLOOR),
		});
	}
	return drafts;
}

/** Spreads the review days evenly through the study sequence instead of stacking them at the end. */
function interleaveReviews(
	studyDrafts: readonly DraftDay[],
	domains: readonly Domain[],
	domainStartsAt: readonly number[],
	reviews: number,
	perDay: number
): DraftDay[] {
	const studyCount = studyDrafts.length;
	if (reviews <= 0 || studyCount === 0) {
		const tail = Array.from({ length: Math.max(0, reviews) }, (_, index) =>
			reviewDraft(domains, index, perDay)
		);
		return [...studyDrafts, ...tail];
	}
	const afterIndex = new Map<number, number>();
	for (let r = 1; r <= reviews; r += 1) {
		const position = Math.min(studyCount - 1, Math.max(0, Math.round((r * studyCount) / (reviews + 1)) - 1));
		afterIndex.set(position, (afterIndex.get(position) ?? 0) + 1);
	}

	const drafts: DraftDay[] = [];
	const seen: Domain[] = [];
	let rotation = 0;
	for (let index = 0; index < studyCount; index += 1) {
		drafts.push(studyDrafts[index]);
		domains.forEach((domain, domainIndex) => {
			if (domainStartsAt[domainIndex] === index) {
				seen.push(domain);
			}
		});
		const pending = afterIndex.get(index) ?? 0;
		for (let i = 0; i < pending; i += 1) {
			drafts.push(reviewDraft(seen.length > 0 ? seen : domains, rotation, perDay));
			rotation += 1;
		}
	}
	return drafts;
}

/** One buffer day mid-plan and one just before the mock; anything more would read as filler. */
function placeBuffers(drafts: DraftDay[], count: number): void {
	if (count <= 0) {
		return;
	}
	let trailing = count;
	if (count >= 2) {
		drafts.splice(Math.floor(drafts.length / 2), 0, bufferDraft());
		trailing -= 1;
	}
	for (let i = 0; i < trailing; i += 1) {
		drafts.push(bufferDraft());
	}
}

export function generatePlan(input: GeneratePlanInput): Plan {
	const dates = availableDates(input.config);
	const drafts = dates.length > 0 ? buildDrafts(input, dates.length) : [];
	drafts.push(examDayDraft());

	const examDate = parseIsoDate(input.config.examDate);
	const dateFor = (index: number): string =>
		index < dates.length ? dates[index] : examDate ? toIsoDate(examDate) : input.config.examDate;

	const days: PlanDay[] = drafts.map((draft, index) => {
		const day = index + 1;
		return {
			day,
			date: dateFor(index),
			kind: draft.kind,
			title: draft.title,
			domainId: draft.domainId,
			topicIds: draft.topicIds,
			questionCount: draft.questionCount,
			sessionFile: dayFileName(day, slugify(draft.title)),
		};
	});

	return {
		schemaVersion: 1,
		examId: input.examId,
		generatedAt: new Date().toISOString(),
		config: input.config,
		days,
	};
}

function countKind(plan: Plan, kind: DayKind): number {
	return plan.days.filter((day) => day.kind === kind).length;
}

function escapeCell(text: string): string {
	return text.replace(/\|/g, "\\|");
}

/** The markdown mirror written to `plan.md` so the plan is reviewable in a diff. */
export function describePlan(plan: Plan): string {
	const studyDays = plan.days.length - countKind(plan, "exam");
	const summary = [
		`${studyDays} planned day${studyDays === 1 ? "" : "s"} from ${plan.config.startDate} to ${plan.config.examDate}`,
		`${countKind(plan, "study")} study, ${countKind(plan, "review")} review, ${countKind(plan, "buffer")} buffer, ${countKind(plan, "mock")} mock`,
		`policy: ${plan.config.dayPolicy}, ${questionsPerDay(plan.config)} questions/day`,
	].join(" — ");

	const rows = plan.days.map(
		(day) =>
			`| ${day.day} | ${day.date} | ${day.kind} | ${escapeCell(day.title)} | ${day.questionCount > 0 ? day.questionCount : "—"} |`
	);

	return [
		`# Study Plan: ${plan.examId}`,
		"",
		summary,
		"",
		"| Day | Date | Kind | Focus | Questions |",
		"| --- | --- | --- | --- | --- |",
		...rows,
		"",
	].join("\n");
}
