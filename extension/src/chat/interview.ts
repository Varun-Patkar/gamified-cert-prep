/**
 * The conversational front door to exam setup: a pure state machine that gathers a `PlanConfig`
 * one friendly question at a time. No `vscode` import, and no `new Date()` inside parsing — every
 * relative answer is resolved against an injected clock so the whole thing is deterministic.
 */

import type { DayPolicy, PlanConfig } from "../model/types";

export const MIN_QUESTIONS_PER_DAY = 10;
export const MAX_QUESTIONS_PER_DAY = 60;
export const MIN_HOURS_PER_DAY = 0.5;
export const MAX_HOURS_PER_DAY = 16;

export type InterviewField =
	| "exam"
	| "timing"
	| "hoursPerDay"
	| "dayPolicy"
	| "customDays"
	| "questionsPerDay"
	| "gamified";

const FIELD_ORDER: readonly InterviewField[] = [
	"exam",
	"timing",
	"hoursPerDay",
	"dayPolicy",
	"customDays",
	"questionsPerDay",
	"gamified",
];

export interface InterviewAnswers {
	examQuery?: string;
	examCode?: string;
	examDate?: string;
	/** Set when the user answered with a duration rather than a date; kept for the recap. */
	horizonDays?: number;
	hoursPerDay?: number;
	dayPolicy?: DayPolicy;
	customDays?: number[];
	questionsPerDay?: number;
	gamified?: boolean;
}

export interface InterviewState {
	answers: InterviewAnswers;
	/** Number of answers we could not use; drives slightly more explicit re-asks. */
	misses: number;
	/** Notes we surface once, e.g. when a count was clamped up to the floor. */
	notes: string[];
}

export interface InterviewQuestion {
	field: InterviewField;
	prompt: string;
	suggestions: string[];
}

export interface AnswerOutcome {
	state: InterviewState;
	accepted: boolean;
	/** Gentle nudge shown when the answer could not be used, or a confirmation when it could. */
	message?: string;
}

export function startInterview(seedExam?: string): InterviewState {
	const state: InterviewState = { answers: {}, misses: 0, notes: [] };
	const seed = (seedExam ?? "").trim();
	if (seed.length >= 2) {
		const seeded = applyExam(state, seed);
		if (seeded.accepted) {
			return seeded.state;
		}
	}
	return state;
}

export function isComplete(state: InterviewState): boolean {
	return pendingField(state) === undefined;
}

export function pendingField(state: InterviewState): InterviewField | undefined {
	const { answers } = state;
	for (const field of FIELD_ORDER) {
		switch (field) {
			case "exam":
				if (!answers.examQuery) return "exam";
				break;
			case "timing":
				if (!answers.examDate) return "timing";
				break;
			case "hoursPerDay":
				if (answers.hoursPerDay === undefined) return "hoursPerDay";
				break;
			case "dayPolicy":
				if (!answers.dayPolicy) return "dayPolicy";
				break;
			case "customDays":
				if (answers.dayPolicy === "custom" && (answers.customDays ?? []).length === 0) return "customDays";
				break;
			case "questionsPerDay":
				if (answers.questionsPerDay === undefined) return "questionsPerDay";
				break;
			case "gamified":
				if (answers.gamified === undefined) return "gamified";
				break;
		}
	}
	return undefined;
}

export function nextQuestion(state: InterviewState): InterviewQuestion | undefined {
	const field = pendingField(state);
	if (!field) {
		return undefined;
	}
	const insistent = state.misses > 0;
	switch (field) {
		case "exam":
			return {
				field,
				prompt: insistent
					? "No problem — just give me the exam code or its full name, like \"AZ-104\" or \"AWS Solutions Architect Associate\"."
					: "Brilliant, let's build you a campaign. Which exam are we conquering?",
				suggestions: ["AZ-104", "AI-102 Azure AI Engineer", "AWS Solutions Architect Associate"],
			};
		case "timing":
			return {
				field,
				prompt: insistent
					? "Either a date (\"2026-03-14\" or \"March 14\") or a stretch of time (\"6 weeks\") works — whichever you have."
					: "When do you sit it? Give me a date, or tell me how long you want to prepare for.",
				suggestions: ["In 6 weeks", "30 days", "2026-03-14"],
			};
		case "hoursPerDay":
			return {
				field,
				prompt: insistent
					? "Roughly how many hours a day? A plain number is perfect — \"1\", \"1.5\", \"2\"."
					: "How much time can you give it on a study day? Be honest rather than heroic — consistency wins.",
				suggestions: ["1 hour", "A couple of hours", "30 minutes"],
			};
		case "dayPolicy":
			return {
				field,
				prompt: insistent
					? "Which days work? Try \"weekdays\", \"weekends only\", \"every day\", or name them like \"mon wed fri\"."
					: "Which days are you studying? Rest days are part of the plan, not a failure of it.",
				suggestions: ["Weekdays", "Weekends only", "Every day", "Mon Wed Fri"],
			};
		case "customDays":
			return {
				field,
				prompt: "Name the days you want to study and I'll build the calendar around them.",
				suggestions: ["Mon Wed Fri", "Tue Thu Sat", "Sat Sun"],
			};
		case "questionsPerDay":
			return {
				field,
				prompt: insistent
					? `Just a number, and I'll never go below ${MIN_QUESTIONS_PER_DAY} a day.`
					: `How many practice questions per day? ${MIN_QUESTIONS_PER_DAY} is the floor, 15 is a nice rhythm.`,
				suggestions: ["10", "15", "20"],
			};
		case "gamified":
			return {
				field,
				prompt: "Last one: want XP, streaks and a battle pass along the way, or a plain no-frills plan?",
				suggestions: ["Yes, gamify it", "No frills"],
			};
	}
}

export function applyAnswer(state: InterviewState, rawText: string, today: Date): AnswerOutcome {
	const field = pendingField(state);
	if (!field) {
		return { state, accepted: true };
	}
	return applyAnswerTo(state, field, rawText, today);
}

function applyAnswerTo(
	state: InterviewState,
	field: InterviewField,
	rawText: string,
	today: Date
): AnswerOutcome {
	const text = (rawText ?? "").trim();
	switch (field) {
		case "exam":
			return applyExam(state, text);
		case "timing":
			return applyTiming(state, text, today);
		case "hoursPerDay":
			return applyHours(state, text);
		case "dayPolicy":
		case "customDays":
			return applyPolicy(state, text, field);
		case "questionsPerDay":
			return applyQuestions(state, text);
		case "gamified":
			return applyGamified(state, text);
	}
}

function accept(state: InterviewState, answers: InterviewAnswers, note?: string): AnswerOutcome {
	const notes = note ? [...state.notes, note] : state.notes;
	return {
		state: { answers: { ...state.answers, ...answers }, misses: 0, notes },
		accepted: true,
		message: note,
	};
}

function reject(state: InterviewState, message: string): AnswerOutcome {
	return { state: { ...state, misses: state.misses + 1 }, accepted: false, message };
}

// ---------------------------------------------------------------------------
// Field parsers
// ---------------------------------------------------------------------------

const EXAM_CODE = /\b([A-Za-z]{2,4}[-\s]?\d{2,4})\b/;

function applyExam(state: InterviewState, text: string): AnswerOutcome {
	const cleaned = text.replace(/^(i(')?m\s+)?(prep(ping|are|aring)?|stud(y|ying)|learning)\s+(for|to\s+pass)\s+/i, "").trim();
	const query = cleaned.replace(/[?!.]+$/, "").trim();
	if (query.replace(/[^A-Za-z0-9]/g, "").length < 2) {
		return reject(state, "I didn't catch an exam in there.");
	}
	const code = EXAM_CODE.exec(query)?.[1];
	const answers: InterviewAnswers = { examQuery: query };
	if (code) {
		answers.examCode = code.replace(/\s+/g, "-").toUpperCase();
	}
	return accept(state, answers);
}

function applyTiming(state: InterviewState, text: string, today: Date): AnswerOutcome {
	const start = startOfDay(today);
	const explicit = parseExplicitDate(text, start);
	if (explicit) {
		if (explicit.getTime() <= start.getTime()) {
			return reject(state, "That date has already been and gone — give me one in the future.");
		}
		return accept(state, { examDate: isoDate(explicit), horizonDays: daysBetween(start, explicit) });
	}
	const days = parseDurationDays(text);
	if (days !== undefined) {
		if (days < 1) {
			return reject(state, "That's not quite enough runway — give me at least a day.");
		}
		return accept(state, { examDate: isoDate(addDays(start, days)), horizonDays: days });
	}
	return reject(state, "I couldn't read that as a date or a length of time.");
}

function applyHours(state: InterviewState, text: string): AnswerOutcome {
	const hours = parseHours(text);
	if (hours === undefined) {
		return reject(state, "I couldn't turn that into a number of hours.");
	}
	const clamped = clamp(hours, MIN_HOURS_PER_DAY, MAX_HOURS_PER_DAY);
	const note =
		clamped !== hours
			? `I'll book ${formatHours(clamped)} a day — anything outside ${formatHours(MIN_HOURS_PER_DAY)}–${MAX_HOURS_PER_DAY} hours stops being a plan and starts being a hostage situation.`
			: undefined;
	return accept(state, { hoursPerDay: clamped }, note);
}

function applyPolicy(state: InterviewState, text: string, field: InterviewField): AnswerOutcome {
	const parsed = parseDayPolicy(text);
	if (!parsed) {
		return reject(state, "I couldn't work out which days you meant.");
	}
	if (field === "customDays" && parsed.policy !== "custom") {
		// The user answered the follow-up with a broader phrase; take it and drop the custom list.
		return accept(state, { dayPolicy: parsed.policy, customDays: undefined });
	}
	const answers: InterviewAnswers = { dayPolicy: parsed.policy };
	answers.customDays = parsed.policy === "custom" ? parsed.days : undefined;
	return accept(state, answers);
}

function applyQuestions(state: InterviewState, text: string): AnswerOutcome {
	const count = parseCount(text);
	if (count === undefined) {
		return reject(state, "I couldn't find a number in there.");
	}
	const clamped = clamp(Math.round(count), MIN_QUESTIONS_PER_DAY, MAX_QUESTIONS_PER_DAY);
	const note =
		clamped > count
			? `Nudging that up to ${clamped} — fewer than ${MIN_QUESTIONS_PER_DAY} a day doesn't move the needle.`
			: clamped < count
				? `Capping that at ${clamped} a day so the sessions stay finishable.`
				: undefined;
	return accept(state, { questionsPerDay: clamped }, note);
}

function applyGamified(state: InterviewState, text: string): AnswerOutcome {
	const yes = parseYesNo(text);
	if (yes === undefined) {
		return reject(state, "Was that a yes or a no?");
	}
	return accept(state, { gamified: yes });
}

// ---------------------------------------------------------------------------
// Natural language parsing
// ---------------------------------------------------------------------------

const NUMBER_WORDS: Record<string, number> = {
	a: 1,
	an: 1,
	one: 1,
	couple: 2,
	two: 2,
	few: 3,
	three: 3,
	four: 4,
	five: 5,
	six: 6,
	seven: 7,
	eight: 8,
	nine: 9,
	ten: 10,
	eleven: 11,
	twelve: 12,
};

const MONTHS = [
	"january",
	"february",
	"march",
	"april",
	"may",
	"june",
	"july",
	"august",
	"september",
	"october",
	"november",
	"december",
];

function monthIndex(word: string): number | undefined {
	const needle = word.toLowerCase();
	const index = MONTHS.findIndex((month) => month.startsWith(needle.slice(0, 3)) && needle.length >= 3);
	return index >= 0 ? index : undefined;
}

export function parseExplicitDate(text: string, today: Date): Date | undefined {
	const iso = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
	if (iso) {
		return utc(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
	}

	const monthFirst = /\b([a-z]{3,9})\.?\s+(\d{1,2})(?!\d)(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?/i.exec(text);
	if (monthFirst) {
		const month = monthIndex(monthFirst[1]);
		if (month !== undefined) {
			return resolveYear(month, Number(monthFirst[2]), monthFirst[3], today);
		}
	}

	const dayFirst = /\b(\d{1,2})(?!\d)(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]{3,9})\.?(?:,?\s*(\d{4}))?/i.exec(text);
	if (dayFirst) {
		const month = monthIndex(dayFirst[2]);
		if (month !== undefined) {
			return resolveYear(month, Number(dayFirst[1]), dayFirst[3], today);
		}
	}
	return undefined;
}

/** A bare "March 14" always means the next March 14, never one in the past. */
function resolveYear(month: number, day: number, yearText: string | undefined, today: Date): Date | undefined {
	if (day < 1 || day > 31) {
		return undefined;
	}
	if (yearText) {
		return utc(Number(yearText), month, day);
	}
	const thisYear = utc(today.getUTCFullYear(), month, day);
	return thisYear.getTime() > today.getTime() ? thisYear : utc(today.getUTCFullYear() + 1, month, day);
}

const UNIT_DAYS: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };

export function parseDurationDays(text: string): number | undefined {
	const lower = text.toLowerCase();
	if (/\btomorrow\b/.test(lower)) {
		return 1;
	}
	const next = /\bnext\s+(day|week|month|year)\b/.exec(lower);
	if (next) {
		return UNIT_DAYS[next[1]];
	}
	const match = /(\d+(?:\.\d+)?|[a-z]+)\s*(?:of\s+)?(day|week|month|year)s?\b/.exec(lower);
	if (!match) {
		return undefined;
	}
	const amount = /^\d/.test(match[1]) ? Number(match[1]) : NUMBER_WORDS[match[1]];
	if (amount === undefined || !Number.isFinite(amount)) {
		return undefined;
	}
	return Math.round(amount * UNIT_DAYS[match[2]]);
}

export function parseHours(text: string): number | undefined {
	const lower = text.toLowerCase();
	if (/half\s+(an?\s+)?hour/.test(lower)) {
		return 0.5;
	}
	const minutes = /(\d+(?:\.\d+)?)\s*(?:min|mins|minutes)\b/.exec(lower);
	if (minutes) {
		return Number(minutes[1]) / 60;
	}
	const numeric = /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)?\b/.exec(lower);
	if (numeric && /\d/.test(numeric[1])) {
		return Number(numeric[1]);
	}
	const worded = /\b(a|an|one|couple|two|few|three|four|five|six)\b(?:\s+of)?\s*(?:hour|hours|h|hrs)/.exec(lower);
	if (worded) {
		return NUMBER_WORDS[worded[1]];
	}
	return undefined;
}

export function parseCount(text: string): number | undefined {
	const numeric = /(\d+)/.exec(text);
	if (numeric) {
		return Number(numeric[1]);
	}
	const worded = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i.exec(text);
	return worded ? NUMBER_WORDS[worded[1].toLowerCase()] : undefined;
}

export function parseYesNo(text: string): boolean | undefined {
	const lower = text.toLowerCase();
	if (/\b(no|nope|nah|off|plain|skip|without|none|boring|don'?t)\b/.test(lower)) {
		return false;
	}
	if (/\b(yes|yep|yeah|yup|sure|ok|okay|please|on|absolutely|definitely|gamif\w*|of course|go on)\b/.test(lower)) {
		return true;
	}
	return undefined;
}

const DAY_PATTERNS: readonly { pattern: RegExp; day: number }[] = [
	{ pattern: /\bsun(?:day)?s?\b/g, day: 0 },
	{ pattern: /\bmon(?:day)?s?\b/g, day: 1 },
	{ pattern: /\btues?(?:day)?s?\b/g, day: 2 },
	{ pattern: /\bweds?(?:nesday)?s?\b/g, day: 3 },
	{ pattern: /\bthur?s?(?:day)?s?\b/g, day: 4 },
	{ pattern: /\bfri(?:day)?s?\b/g, day: 5 },
	{ pattern: /\bsat(?:urday)?s?\b/g, day: 6 },
];

export interface ParsedPolicy {
	policy: DayPolicy;
	days?: number[];
}

export function parseDayPolicy(text: string): ParsedPolicy | undefined {
	const lower = text.toLowerCase();
	if (
		/\b(no|not|never|except|apart from|skip)\b[^.]*\bweekend/.test(lower) ||
		/\b(week ?days?|work(?:ing)? days?|office days?)\b/.test(lower)
	) {
		return { policy: "weekdays" };
	}
	if (/\b(every ?day|all days?|all week|all of them|all|daily|7 days|seven days|any day|each day)\b/.test(lower)) {
		return { policy: "all" };
	}
	if (/weekend/.test(lower)) {
		return { policy: "weekends" };
	}
	const days = namedDays(lower);
	if (days.length === 0) {
		return undefined;
	}
	return normalizeDays(days);
}

function namedDays(lower: string): number[] {
	const found = new Set<number>();
	const range = /\b(sun|mon|tues?|weds?|thur?s?|fri|sat)[a-z]*\s*(?:-|–|to|through|thru|until)\s*(sun|mon|tues?|weds?|thur?s?|fri|sat)[a-z]*\b/.exec(
		lower
	);
	if (range) {
		const from = dayOf(range[1]);
		const to = dayOf(range[2]);
		if (from !== undefined && to !== undefined) {
			for (let step = 0; step < 7; step += 1) {
				const day = (from + step) % 7;
				found.add(day);
				if (day === to) {
					break;
				}
			}
			return [...found].sort((a, b) => a - b);
		}
	}
	for (const { pattern, day } of DAY_PATTERNS) {
		pattern.lastIndex = 0;
		if (pattern.test(lower)) {
			found.add(day);
		}
	}
	return [...found].sort((a, b) => a - b);
}

function dayOf(token: string): number | undefined {
	for (const { pattern, day } of DAY_PATTERNS) {
		pattern.lastIndex = 0;
		if (pattern.test(token)) {
			return day;
		}
	}
	return undefined;
}

/** A named list that happens to be Mon–Fri is just "weekdays", and reads better everywhere. */
function normalizeDays(days: number[]): ParsedPolicy {
	const key = days.join(",");
	if (key === "0,1,2,3,4,5,6") {
		return { policy: "all" };
	}
	if (key === "1,2,3,4,5") {
		return { policy: "weekdays" };
	}
	if (key === "0,6") {
		return { policy: "weekends" };
	}
	return { policy: "custom", days };
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export function toPlanConfig(state: InterviewState, today: Date): PlanConfig | undefined {
	const { answers } = state;
	if (!isComplete(state) || !answers.examDate || answers.hoursPerDay === undefined || !answers.dayPolicy) {
		return undefined;
	}
	const config: PlanConfig = {
		startDate: isoDate(startOfDay(today)),
		examDate: answers.examDate,
		hoursPerDay: clamp(answers.hoursPerDay, MIN_HOURS_PER_DAY, MAX_HOURS_PER_DAY),
		dayPolicy: answers.dayPolicy,
		questionsPerDay: Math.max(MIN_QUESTIONS_PER_DAY, answers.questionsPerDay ?? MIN_QUESTIONS_PER_DAY),
		includeReviewDays: true,
		includeFinalMock: true,
	};
	if (answers.dayPolicy === "custom" && (answers.customDays ?? []).length > 0) {
		config.customDays = [...(answers.customDays as number[])];
	}
	return config;
}

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function describePolicy(policy: DayPolicy, customDays?: number[]): string {
	switch (policy) {
		case "all":
			return "every day";
		case "weekdays":
			return "weekdays";
		case "weekends":
			return "weekends";
		case "custom":
			return (customDays ?? []).length > 0
				? (customDays as number[]).map((day) => DAY_LABELS[day]).join(", ")
				: "days you choose";
	}
}

/** The recap shown before setup runs, so nothing is a surprise. */
export function summarize(state: InterviewState): string {
	const { answers } = state;
	const lines = [`**${answers.examQuery ?? "Your exam"}** — here's the campaign I'll build:`, ""];
	if (answers.examDate) {
		const horizon = answers.horizonDays !== undefined ? ` (${answers.horizonDays} days from today)` : "";
		lines.push(`- **Exam date:** ${answers.examDate}${horizon}`);
	}
	if (answers.hoursPerDay !== undefined) {
		lines.push(`- **Time per study day:** ${formatHours(answers.hoursPerDay)}`);
	}
	if (answers.dayPolicy) {
		lines.push(`- **Study days:** ${describePolicy(answers.dayPolicy, answers.customDays)}`);
	}
	if (answers.questionsPerDay !== undefined) {
		lines.push(`- **Questions per day:** ${answers.questionsPerDay}`);
	}
	if (answers.gamified !== undefined) {
		lines.push(`- **Gamification:** ${answers.gamified ? "on — XP, streaks and a battle pass" : "off — plain plan"}`);
	}
	return lines.join("\n");
}

/** Default folder name for the prep repo, e.g. "AZ-104 Prep". */
export function suggestedFolder(state: InterviewState): string {
	const code = state.answers.examCode ?? (state.answers.examQuery ?? "Exam").trim().split(/\s+/)[0];
	return `${code.replace(/[\\/:*?"<>|]/g, "").trim() || "Exam"} Prep`;
}

// ---------------------------------------------------------------------------
// Date helpers (UTC throughout so an injected clock behaves the same everywhere)
// ---------------------------------------------------------------------------

function utc(year: number, month: number, day: number): Date {
	return new Date(Date.UTC(year, month, day));
}

export function startOfDay(date: Date): Date {
	return utc(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 86_400_000);
}

function daysBetween(from: Date, to: Date): number {
	return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export function isoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function formatHours(hours: number): string {
	if (hours < 1) {
		return `${Math.round(hours * 60)} minutes`;
	}
	return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hour${hours === 1 ? "" : "s"}`;
}
