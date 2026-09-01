/**
 * Reconstructs `plan.json` / `progress.json` for the hand-written `<CODE> Prep/` folders.
 *
 * The study history for those exams only ever existed as prose (`plan.md`, `progress.md`,
 * `sessions/*.md`), and every exam was written in a slightly different dialect. Every parser
 * here is deliberately tolerant: anything it cannot read is skipped, never thrown.
 */

import type { Dirent } from "fs";
import * as fs from "fs/promises";
import * as path from "path";
import type { DayKind, DayResult, Domain, ExamMeta, Plan, PlanDay, Progress } from "../model/types";
import { examPaths, padDay } from "./paths";

const SESSION_FILE = /^day-(\d{1,3})-(.+)\.md$/i;
const DAY_HEADING = /^#{2,6}\s*(?:~~)?\s*Day\s+(\d{1,3})\b(.*)$/i;
const ISO_DATE = /\d{4}-\d{2}-\d{2}/;
const MONTHS = [
	"jan",
	"feb",
	"mar",
	"apr",
	"may",
	"jun",
	"jul",
	"aug",
	"sep",
	"oct",
	"nov",
	"dec",
];
const MONTH_DAY = new RegExp(`\\b(${MONTHS.join("|")})[a-z]*\\.?\\s+(\\d{1,2})\\b`, "i");

/** One day as recovered from a markdown log, before plan/progress are split apart. */
export interface LegacyDayEntry {
	day: number;
	date?: string;
	title?: string;
	completed: boolean;
	questionsAnswered?: number;
	correct?: number;
	accuracy?: number;
}

export interface LegacyImportInput {
	examId: string;
	planMarkdown?: string;
	progressMarkdown?: string;
	topicsMarkdown?: string;
	dayAssignments?: unknown;
	/** Bare file names found in `sessions/`. */
	sessionFiles?: readonly string[];
	/** Used only when no date at all can be recovered. */
	today?: string;
}

export interface LegacyMetaPatch {
	examDate?: string;
	domains?: Domain[];
	topicTitles?: Record<string, string>;
}

export interface LegacyImportResult {
	plan: Plan;
	progress: Progress;
	metaPatch: LegacyMetaPatch;
}

/* ------------------------------------------------------------------ parsing */

/** `- Exam Date: 2026-09-12`, `- **Exam Date:** ...`, `Target Exam Date: ...`. */
export function parseLabelledIsoDate(markdown: string | undefined, label: string): string | undefined {
	if (!markdown) {
		return undefined;
	}
	const pattern = new RegExp(`^[-*\\s]*\\**\\s*(?:target\\s+)?${label}\\s*:?\\**\\s*:?\\s*(\\d{4}-\\d{2}-\\d{2})`, "im");
	const match = pattern.exec(markdown);
	return match ? match[1] : undefined;
}

function firstYear(...sources: (string | undefined)[]): number | undefined {
	for (const source of sources) {
		const match = source ? /\b(20\d{2})\b/.exec(source) : undefined;
		if (match) {
			return Number(match[1]);
		}
	}
	return undefined;
}

function isoFromMonthDay(text: string, year: number | undefined): string | undefined {
	const match = MONTH_DAY.exec(text);
	if (!match || year === undefined) {
		return undefined;
	}
	const month = MONTHS.indexOf(match[1].slice(0, 3).toLowerCase());
	const day = Number(match[2]);
	if (month < 0 || !Number.isFinite(day) || day < 1 || day > 31) {
		return undefined;
	}
	return `${year}-${padDay(month + 1)}-${padDay(day)}`;
}

/** Strips the decoration a human left around a day title until something readable remains. */
function cleanTitle(rest: string): string | undefined {
	let text = rest
		.replace(/~~/g, "")
		.replace(/^\s*,\s*(?:session\s+\d+|mock\s+exam)/i, " —")
		.replace(/_\([^)]*\)_/g, "")
		.replace(/\*\*/g, "");
	// Anything after a status emoji is a score annotation, not part of the title.
	const emoji = /[\u2705\u{1F3AF}\u{1F3C6}]/u.exec(text);
	if (emoji) {
		text = text.slice(0, emoji.index);
	}
	text = text.replace(/\([^)]*\b(?:hrs?|hours?|min)\b[^)]*\)/gi, "");
	const iso = ISO_DATE.exec(text);
	if (iso) {
		text = text.replace(/\(?\s*\d{4}-\d{2}-\d{2}[^)—–|]*\)?/, " — ");
	} else {
		const monthDay = MONTH_DAY.exec(text);
		if (monthDay) {
			// Also drop the weekday that usually precedes it ("Sunday, Apr 26").
			text = text.replace(
				new RegExp(`\\b[A-Za-z]{3,9},?\\s*${monthDay[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
				" — ",
			);
			text = text.replace(monthDay[0], " — ");
		}
	}
	const segments = text
		.split(/\s*[—–|]\s*|\s+-\s+/)
		.map((segment) => segment.trim())
		.filter((segment) => segment.length > 0);
	let title = segments.length > 0 ? segments[segments.length - 1] : "";
	if (/^\(.*\)$/.test(title)) {
		title = title.slice(1, -1).trim();
	}
	title = title.replace(/^[)\s,:-]+|[(\s,:-]+$/g, "").trim();
	return title.length > 0 ? title : undefined;
}

function parseFraction(text: string): { correct: number; answered: number } | undefined {
	const match = /(\d{1,4})\s*\*?\s*\/\s*(\d{1,4})/.exec(text);
	if (!match) {
		return undefined;
	}
	const correct = Number(match[1]);
	const answered = Number(match[2]);
	if (!Number.isFinite(correct) || !Number.isFinite(answered) || answered <= 0 || correct > answered) {
		return undefined;
	}
	return { correct, answered };
}

function parsePercent(text: string): number | undefined {
	const match = /(\d{1,3}(?:\.\d+)?)\s*%/.exec(text);
	if (!match) {
		return undefined;
	}
	const value = Number(match[1]) / 100;
	return Number.isFinite(value) && value >= 0 && value <= 1 ? value : undefined;
}

/**
 * Reads any `### Day N ...` daily log, in every dialect the four legacy exams use.
 * A day counts as completed when it says so, or when it recorded a score.
 */
export function parseDayHeadings(markdown: string | undefined, year?: number): LegacyDayEntry[] {
	if (!markdown) {
		return [];
	}
	const lines = markdown.split(/\r?\n/);
	const entries = new Map<number, LegacyDayEntry>();
	const inferredYear = year ?? firstYear(markdown);

	for (let index = 0; index < lines.length; index += 1) {
		const heading = DAY_HEADING.exec(lines[index]);
		if (!heading) {
			continue;
		}
		const day = Number(heading[1]);
		if (!Number.isFinite(day) || day <= 0) {
			continue;
		}
		const rest = heading[2] ?? "";
		const body: string[] = [];
		for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
			if (/^#{1,6}\s/.test(lines[cursor])) {
				break;
			}
			body.push(lines[cursor]);
		}
		const block = body.join("\n");
		const entry: LegacyDayEntry = { day, completed: false };

		const iso = ISO_DATE.exec(rest);
		const date = iso ? iso[0] : isoFromMonthDay(rest, inferredYear);
		if (date) {
			entry.date = date;
		}
		const title = cleanTitle(rest);
		if (title) {
			entry.title = title;
		}

		const scoreLine =
			pickLine(block, /^[-*\s]*\**\s*(?:accuracy|correct|result|score)\b/i) ??
			(/\d\s*\/\s*\d/.test(rest) ? rest : undefined);
		const fraction = scoreLine ? parseFraction(scoreLine) : undefined;
		if (fraction) {
			entry.correct = fraction.correct;
			entry.questionsAnswered = fraction.answered;
			entry.accuracy = fraction.answered > 0 ? fraction.correct / fraction.answered : 0;
		} else if (scoreLine) {
			const percent = parsePercent(scoreLine);
			if (percent !== undefined) {
				entry.accuracy = percent;
			}
		}

		const status = pickLine(block, /^[-*\s]*\**\s*status\b/i);
		entry.completed =
			(status !== undefined && /\b(completed?|done)\b/i.test(status)) ||
			entry.correct !== undefined ||
			entry.accuracy !== undefined ||
			/~~/.test(rest);

		const previous = entries.get(day);
		entries.set(day, previous ? mergeEntries(previous, entry) : entry);
	}

	return [...entries.values()].sort((a, b) => a.day - b.day);
}

function pickLine(block: string, pattern: RegExp): string | undefined {
	return block.split(/\r?\n/).find((line) => pattern.test(line));
}

/** DP-800 splits a day across several sessions; sum the questions, keep the first title. */
function mergeEntries(base: LegacyDayEntry, extra: LegacyDayEntry): LegacyDayEntry {
	const merged: LegacyDayEntry = { ...base, completed: base.completed || extra.completed };
	if (merged.date === undefined && extra.date) {
		merged.date = extra.date;
	}
	if (merged.title === undefined && extra.title) {
		merged.title = extra.title;
	}
	if (extra.questionsAnswered !== undefined) {
		merged.questionsAnswered = (merged.questionsAnswered ?? 0) + extra.questionsAnswered;
		merged.correct = (merged.correct ?? 0) + (extra.correct ?? 0);
	}
	if (merged.questionsAnswered && merged.questionsAnswered > 0) {
		merged.accuracy = (merged.correct ?? 0) / merged.questionsAnswered;
	} else if (merged.accuracy === undefined && extra.accuracy !== undefined) {
		merged.accuracy = extra.accuracy;
	}
	return merged;
}

/** GH-300 logs days as a markdown table: `| Day | Date | Topic | Q | Correct | Accuracy | Notes |`. */
export function parseDayTable(markdown: string | undefined): LegacyDayEntry[] {
	if (!markdown) {
		return [];
	}
	const entries = new Map<number, LegacyDayEntry>();
	let columns: string[] | undefined;

	for (const line of markdown.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed.startsWith("|")) {
			columns = undefined;
			continue;
		}
		const cells = splitRow(trimmed);
		if (cells.length < 3) {
			continue;
		}
		const header = cells.map((cell) => cell.toLowerCase());
		if (header[0] === "day" || header[0] === "#") {
			columns = header;
			continue;
		}
		if (!columns || /^[-:\s]+$/.test(cells[0])) {
			continue;
		}
		const day = Number(cells[0].replace(/[^\d]/g, ""));
		if (!Number.isFinite(day) || day <= 0 || cells[0].trim().length === 0) {
			continue;
		}
		const entry: LegacyDayEntry = { day, completed: true };
		const at = (name: string): string | undefined => {
			const index = columns?.findIndex((column) => column.startsWith(name));
			return index !== undefined && index >= 0 ? cells[index] : undefined;
		};
		const date = at("date");
		const iso = date ? ISO_DATE.exec(date) : undefined;
		if (iso) {
			entry.date = iso[0];
		}
		const title = at("topic") ?? at("focus") ?? at("session");
		const cleaned = title ? cleanTitle(` — ${title}`) : undefined;
		if (cleaned) {
			entry.title = cleaned;
		}
		const answered = numberFrom(at("q"));
		const correct = numberFrom(at("correct"));
		if (answered !== undefined && correct !== undefined && answered > 0 && correct <= answered) {
			entry.questionsAnswered = answered;
			entry.correct = correct;
			entry.accuracy = correct / answered;
		} else {
			const accuracy = parsePercent(at("accuracy") ?? "");
			if (accuracy !== undefined) {
				entry.accuracy = accuracy;
			}
		}
		entries.set(day, entry);
	}

	return [...entries.values()].sort((a, b) => a.day - b.day);
}

function splitRow(row: string): string[] {
	const body = row.replace(/^\|/, "").replace(/\|$/, "");
	return body.split("|").map((cell) => cell.trim());
}

function numberFrom(cell: string | undefined): number | undefined {
	if (!cell) {
		return undefined;
	}
	const match = /\d+/.exec(cell.replace(/\\/g, ""));
	if (!match) {
		return undefined;
	}
	const value = Number(match[0]);
	return Number.isFinite(value) ? value : undefined;
}

/**
 * `## Domain 1: Title (25–30%)` with `### 1.1 Sub-skill` beneath.
 * Domain ids stay numeric so they line up with the ids already used in `questions.json`.
 */
export function parseTopicsDomains(markdown: string | undefined): {
	domains: Domain[];
	topicTitles: Record<string, string>;
} {
	const domains: Domain[] = [];
	const topicTitles: Record<string, string> = {};
	if (!markdown) {
		return { domains, topicTitles };
	}

	let current: Domain | undefined;
	const rawWeights: number[] = [];
	for (const line of markdown.split(/\r?\n/)) {
		const domainMatch = /^##\s+Domain\s+(\d{1,2})\s*[:.\-—]?\s*(.*)$/i.exec(line);
		if (domainMatch) {
			const title = domainMatch[2].replace(/\(([^)]*%)[^)]*\)\s*$/, "").trim();
			const weight = /(\d{1,3})(?:\s*[–-]\s*(\d{1,3}))?\s*%/.exec(domainMatch[2]);
			rawWeights.push(weight ? averageOf(weight[1], weight[2]) : 0);
			current = {
				id: String(Number(domainMatch[1])),
				title: title.length > 0 ? title : `Domain ${domainMatch[1]}`,
				weight: 0,
				topicIds: [],
			};
			domains.push(current);
			continue;
		}
		const topicMatch = /^###\s+(\d{1,2}\.\d{1,2})\s+(.*)$/.exec(line);
		if (topicMatch && current) {
			const id = `t-${topicMatch[1].replace(".", "-")}`;
			const title = topicMatch[2].trim();
			if (!current.topicIds.includes(id)) {
				current.topicIds.push(id);
			}
			topicTitles[id] = title.length > 0 ? title : id;
		}
	}

	const total = rawWeights.reduce((sum, weight) => sum + weight, 0);
	domains.forEach((domain, index) => {
		domain.weight = total > 0 ? Math.round((rawWeights[index] / total) * 1000) / 10 : 0;
	});
	return { domains, topicTitles };
}

function averageOf(low: string, high?: string): number {
	const first = Number(low);
	const second = high === undefined ? first : Number(high);
	if (!Number.isFinite(first)) {
		return 0;
	}
	return Number.isFinite(second) ? (first + second) / 2 : first;
}

/* ---------------------------------------------------------------- assembling */

export function inferDayKind(title: string | undefined): DayKind {
	const text = (title ?? "").toLowerCase();
	if (/\bexam day\b|\bexam\s*🎯|\bsit the exam\b/.test(text)) {
		return "exam";
	}
	if (/\bmock\b|\bsimulation\b|\bpractice assessment\b/.test(text)) {
		return "mock";
	}
	if (/\breview\b|\brevision\b|\bconsolidation\b|\bdeep dive\b|\bremediation\b/.test(text)) {
		return "review";
	}
	if (/\brest\b|\bbuffer\b|\bcatch-?up\b|\blogistics\b|\boverflow\b/.test(text)) {
		return "buffer";
	}
	return "study";
}

/** `D3.1 Monitor & Tune`, `Domain 2: Design`, `2.1 Data Security` -> the leading domain number. */
export function inferDomainId(title: string | undefined, known: readonly Domain[]): string | undefined {
	const text = title ?? "";
	const match = /\bD(?:omain)?\s*(\d{1,2})\b/i.exec(text) ?? /^\s*(\d{1,2})\.\d{1,2}\b/.exec(text);
	if (!match) {
		return undefined;
	}
	const id = String(Number(match[1]));
	if (known.length > 0 && !known.some((domain) => domain.id === id)) {
		return undefined;
	}
	return id;
}

function addDays(iso: string, days: number): string {
	const parsed = Date.parse(`${iso}T00:00:00Z`);
	if (!Number.isFinite(parsed)) {
		return iso;
	}
	return new Date(parsed + days * 86_400_000).toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number | undefined {
	const a = Date.parse(`${from}T00:00:00Z`);
	const b = Date.parse(`${to}T00:00:00Z`);
	if (!Number.isFinite(a) || !Number.isFinite(b)) {
		return undefined;
	}
	return Math.round((b - a) / 86_400_000);
}

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

/** Reconstructs plan + progress + the extra meta fields from whatever markdown survives. */
export function buildLegacyImport(input: LegacyImportInput): LegacyImportResult {
	const today = input.today ?? new Date().toISOString().slice(0, 10);
	const assignments = asRecord(input.dayAssignments);
	const dayTargets = asRecord(assignments.dayTargets);

	const year = firstYear(input.planMarkdown, input.progressMarkdown);
	const planEntries = parseDayHeadings(input.planMarkdown, year);
	const logEntries = [
		...parseDayHeadings(input.progressMarkdown, year),
		...parseDayTable(input.progressMarkdown),
	];

	const sessionsByDay = new Map<number, { file: string; slug: string }>();
	for (const name of [...(input.sessionFiles ?? [])].sort()) {
		const match = SESSION_FILE.exec(name);
		if (!match) {
			continue;
		}
		const day = Number(match[1]);
		if (!Number.isFinite(day) || day <= 0 || sessionsByDay.has(day)) {
			continue;
		}
		sessionsByDay.set(day, { file: name, slug: match[2] });
	}

	const planByDay = new Map(planEntries.map((entry) => [entry.day, entry]));
	const logByDay = new Map<number, LegacyDayEntry>();
	for (const entry of logEntries) {
		const previous = logByDay.get(entry.day);
		logByDay.set(entry.day, previous ? mergeEntries(previous, entry) : entry);
	}

	const declaredTotal = Number(assignments.totalDays);
	const maxDay = Math.max(
		0,
		...sessionsByDay.keys(),
		...planByDay.keys(),
		...logByDay.keys(),
	);
	const totalDays = Number.isFinite(declaredTotal) && declaredTotal > 0 ? Math.max(declaredTotal, maxDay) : maxDay;

	const { domains, topicTitles } = parseTopicsDomains(input.topicsMarkdown);

	const startDate =
		parseLabelledIsoDate(input.planMarkdown, "start date") ??
		planByDay.get(1)?.date ??
		logByDay.get(1)?.date ??
		[...planByDay.values(), ...logByDay.values()].map((entry) => entry.date).filter(Boolean).sort()[0] ??
		today;

	const days: PlanDay[] = [];
	for (let day = 1; day <= totalDays; day += 1) {
		const fromPlan = planByDay.get(day);
		const fromLog = logByDay.get(day);
		const session = sessionsByDay.get(day);
		const title =
			fromPlan?.title ?? fromLog?.title ?? (session ? titleFromSlug(session.slug) : undefined) ?? `Day ${day}`;
		const date = fromPlan?.date ?? fromLog?.date ?? addDays(startDate, day - 1);
		const questionCount =
			numberFrom(String(dayTargets[String(day)] ?? "")) ??
			fromLog?.questionsAnswered ??
			fromPlan?.questionsAnswered ??
			0;
		const planDay: PlanDay = {
			day,
			date,
			kind: inferDayKind(title),
			title,
			topicIds: [],
			questionCount,
			sessionFile: `sessions/${session?.file ?? `day-${padDay(day)}-${slugFromTitle(title)}.md`}`,
		};
		const domainId = inferDomainId(title, domains);
		if (domainId) {
			planDay.domainId = domainId;
		}
		days.push(planDay);
	}

	const examDate =
		parseLabelledIsoDate(input.progressMarkdown, "exam date") ??
		parseLabelledIsoDate(input.planMarkdown, "exam date") ??
		(days.length > 0 ? addDays(days[days.length - 1].date, 1) : startDate);

	const plan: Plan = {
		schemaVersion: 1,
		examId: input.examId,
		generatedAt: today,
		config: {
			startDate,
			examDate,
			hoursPerDay: 1,
			dayPolicy: "all",
			questionsPerDay: medianOf(days.map((day) => day.questionCount).filter((count) => count > 0)),
			includeReviewDays: days.some((day) => day.kind === "review"),
			includeFinalMock: days.some((day) => day.kind === "mock"),
		},
		days,
	};

	const completed = [...logByDay.values()]
		.filter((entry) => entry.completed && entry.day <= Math.max(totalDays, entry.day))
		.sort((a, b) => a.day - b.day);
	const dateByDay = new Map(days.map((day) => [day.day, day.date]));
	const results: DayResult[] = completed.map((entry) => ({
		day: entry.day,
		attempt: 1,
		completedAt: entry.date ?? dateByDay.get(entry.day) ?? today,
		questionsAnswered: entry.questionsAnswered ?? 0,
		correct: entry.correct ?? 0,
		accuracy: entry.accuracy ?? 0,
		weakTopicIds: [],
		// Legacy study history is history: it never pays into the gamification economy.
		xpAwarded: 0,
	}));

	const progress: Progress = {
		schemaVersion: 1,
		examId: input.examId,
		completedDays: completed.map((entry) => entry.day),
		results,
		xp: 0,
		streak: { current: 0, longest: longestStreak(results.map((result) => result.completedAt)), freezeTokens: 0 },
		badges: [],
		unlockedTiers: [],
		domainCertificates: [],
	};

	const metaPatch: LegacyMetaPatch = {};
	if (parseLabelledIsoDate(input.progressMarkdown, "exam date") ?? parseLabelledIsoDate(input.planMarkdown, "exam date")) {
		metaPatch.examDate = examDate;
	}
	if (domains.length > 0) {
		metaPatch.domains = domains;
		metaPatch.topicTitles = topicTitles;
	}

	return { plan, progress, metaPatch };
}

function titleFromSlug(slug: string): string {
	return slug
		.split("-")
		.filter((word) => word.length > 0)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function slugFromTitle(title: string): string {
	const slug = title
		.normalize("NFKD")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return slug.length > 0 ? slug : "session";
}

function medianOf(values: number[]): number {
	if (values.length === 0) {
		return 0;
	}
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.floor(sorted.length / 2)];
}

function longestStreak(dates: readonly string[]): number {
	const unique = [...new Set(dates.filter((date) => ISO_DATE.test(date)))].sort();
	let longest = 0;
	let run = 0;
	let previous: string | undefined;
	for (const date of unique) {
		run = previous !== undefined && daysBetween(previous, date) === 1 ? run + 1 : 1;
		longest = Math.max(longest, run);
		previous = date;
	}
	return longest;
}

/* -------------------------------------------------------------------- I/O */

export interface LegacyImportOutcome {
	folder: string;
	wrotePlan: boolean;
	wroteProgress: boolean;
	totalDays: number;
	completedDays: number;
}

/**
 * Writes the missing `plan.json` / `progress.json` for one legacy folder.
 * Existing files are read but never rewritten, and any failure yields "nothing imported".
 */
export async function importLegacyExam(root: string, meta: ExamMeta): Promise<LegacyImportOutcome | undefined> {
	const paths = examPaths(root, meta.folder);
	const hasPlan = await exists(paths.planJson);
	const hasProgress = await exists(paths.progressJson);
	if (hasPlan && hasProgress) {
		return undefined;
	}

	let outcome: LegacyImportOutcome;
	try {
		const input: LegacyImportInput = {
			examId: meta.id,
			sessionFiles: (await readDir(paths.sessionsDir)).filter((entry) => entry.isFile()).map((entry) => entry.name),
		};
		const planMarkdown = await readText(paths.planMarkdown);
		if (planMarkdown !== undefined) {
			input.planMarkdown = planMarkdown;
		}
		const progressMarkdown = await readText(paths.progressMarkdown);
		if (progressMarkdown !== undefined) {
			input.progressMarkdown = progressMarkdown;
		}
		const topicsMarkdown = await readText(paths.topics);
		if (topicsMarkdown !== undefined) {
			input.topicsMarkdown = topicsMarkdown;
		}
		const dayAssignments = await readJson<unknown>(path.join(paths.dir, "day-assignments.json"));
		if (dayAssignments !== undefined) {
			input.dayAssignments = dayAssignments;
		}

		const imported = buildLegacyImport(input);
		if (imported.plan.days.length === 0 && imported.progress.completedDays.length === 0) {
			return undefined;
		}

		if (!hasPlan) {
			await writeJson(paths.planJson, imported.plan);
		}
		if (!hasProgress) {
			await writeJson(paths.progressJson, imported.progress);
		}
		await patchMeta(paths.meta, meta, imported.metaPatch);

		outcome = {
			folder: meta.folder,
			wrotePlan: !hasPlan,
			wroteProgress: !hasProgress,
			totalDays: imported.plan.days.length,
			completedDays: imported.progress.completedDays.length,
		};
	} catch {
		return undefined;
	}
	return outcome;
}

/** Only fills gaps: a field the user already has always wins. */
async function patchMeta(file: string, meta: ExamMeta, patch: LegacyMetaPatch): Promise<void> {
	const updated: ExamMeta = { ...meta };
	let changed = false;
	if (!updated.examDate && patch.examDate) {
		updated.examDate = patch.examDate;
		changed = true;
	}
	if ((!updated.domains || updated.domains.length === 0) && patch.domains && patch.domains.length > 0) {
		updated.domains = patch.domains;
		changed = true;
	}
	if (!updated.topicTitles && patch.topicTitles && Object.keys(patch.topicTitles).length > 0) {
		updated.topicTitles = patch.topicTitles;
		changed = true;
	}
	if (changed) {
		await writeJson(file, updated);
	}
}

async function exists(file: string): Promise<boolean> {
	try {
		await fs.access(file);
		return true;
	} catch {
		return false;
	}
}

async function readDir(dir: string): Promise<Dirent[]> {
	try {
		return await fs.readdir(dir, { withFileTypes: true });
	} catch {
		return [];
	}
}

async function readText(file: string): Promise<string | undefined> {
	try {
		return await fs.readFile(file, "utf8");
	} catch {
		return undefined;
	}
}

async function readJson<T>(file: string): Promise<T | undefined> {
	const raw = await readText(file);
	if (raw === undefined) {
		return undefined;
	}
	try {
		return JSON.parse(raw) as T;
	} catch {
		return undefined;
	}
}

async function writeJson(file: string, value: unknown): Promise<void> {
	await fs.mkdir(path.dirname(file), { recursive: true });
	await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
