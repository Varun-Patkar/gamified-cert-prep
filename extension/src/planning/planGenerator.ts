/** Pure plan construction: no fs, no vscode, so the scheduler stays directly unit-testable. */

import type { DayKind, Domain, Plan, PlanConfig, PlanDay } from "../model/types";
import { dayFileName, slugify } from "../store/paths";

const MIN_QUESTIONS_PER_DAY = 10;
const MOCK_QUESTION_FLOOR = 40;
/** Stops a typo'd exam date ten years out from generating a nonsense plan. */
const MAX_PLAN_SPAN_DAYS = 3650;

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

function questionsPerDay(config: PlanConfig): number {
	const requested = Number.isFinite(config.questionsPerDay) ? Math.floor(config.questionsPerDay) : 0;
	return Math.max(MIN_QUESTIONS_PER_DAY, requested);
}

function examDayDraft(): DraftDay {
	return { kind: "exam", title: "Exam Day", topicIds: [], questionCount: 0 };
}

function buildDrafts(input: GeneratePlanInput, total: number): DraftDay[] {
	const { config, domains } = input;
	const perDay = questionsPerDay(config);
	const drafts: DraftDay[] = [];
	const mockCount = config.includeFinalMock && total > domains.length ? 1 : 0;
	const afterMock = total - mockCount;
	const reviewBudget = config.includeReviewDays
		? Math.max(0, Math.min(domains.length, afterMock - domains.length))
		: 0;
	const studyTotal = afterMock - reviewBudget;

	const allocations = apportion(
		domains.map((domain) => domain.weight),
		studyTotal
	);
	boostWeakDomains(allocations, domains, input.weakDomainIds ?? []);

	let reviewsLeft = reviewBudget;
	let studyUsed = 0;
	const seenTopicIds: string[] = [];
	const seenDomainTitles: string[] = [];

	domains.forEach((domain, index) => {
		// More study days than topics adds nothing, so the surplus becomes buffer instead.
		const days = Math.min(allocations[index], Math.max(1, domain.topicIds.length));
		if (days <= 0) {
			return;
		}
		studyUsed += days;
		const slices = chunk(domain.topicIds, days);
		for (let part = 0; part < days; part += 1) {
			drafts.push({
				kind: "study",
				title: days > 1 ? `${domain.title} — Part ${part + 1}` : domain.title,
				domainId: domain.id,
				topicIds: slices[part],
				questionCount: perDay,
			});
		}
		for (const topicId of domain.topicIds) {
			if (!seenTopicIds.includes(topicId)) {
				seenTopicIds.push(topicId);
			}
		}
		seenDomainTitles.push(domain.title);
		if (reviewsLeft > 0) {
			reviewsLeft -= 1;
			drafts.push({
				kind: "review",
				title: `Review: ${seenDomainTitles.join(", ")}`,
				topicIds: [...seenTopicIds],
				questionCount: perDay,
			});
		}
	});

	for (let i = 0; i < studyTotal - studyUsed; i += 1) {
		drafts.push({ kind: "buffer", title: "Buffer & Catch-up", topicIds: [], questionCount: 0 });
	}
	// Any review budget the domain loop could not place still has to fill a day.
	for (let i = 0; i < reviewsLeft; i += 1) {
		drafts.push({
			kind: "review",
			title: seenDomainTitles.length > 0 ? `Review: ${seenDomainTitles.join(", ")}` : "Review",
			topicIds: [...seenTopicIds],
			questionCount: perDay,
		});
	}
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
