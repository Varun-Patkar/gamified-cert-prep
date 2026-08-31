/**
 * Pure quiz mechanics: normalising the on-disk question bank, choosing a day's set,
 * grading every question shape the banks actually contain, and summarising the run.
 * No fs, no vscode — this file is directly unit-testable.
 */

import type { PlanDay, Question, QuestionBank } from "../model/types";

export const MIN_QUESTIONS = 10;

export type QuestionKind = "single" | "multi" | "yesno" | "matching";

export interface QuizOption {
	key: string;
	label: string;
}

export interface QuizGroup {
	key: string;
	label: string;
	options: QuizOption[];
}

export interface ClientQuestion {
	id: string;
	kind: QuestionKind;
	prompt: string;
	domainId: string;
	domainName: string;
	topic: string;
	difficulty?: string;
	options: QuizOption[];
	groups: QuizGroup[];
}

export interface QuizQuestion extends ClientQuestion {
	/** Option keys for single/multi, or one key per group (in order) for yesno/matching. */
	answer: string[];
	explanation?: string;
	sourceUrl?: string;
	sourceLabel?: string;
}

export interface GradedAnswer {
	questionId: string;
	response: string[];
	expected: string[];
	correct: boolean;
}

export interface DomainScore {
	domainId: string;
	domainName: string;
	total: number;
	correct: number;
	accuracy: number;
}

export interface QuizOutcome {
	total: number;
	correct: number;
	accuracy: number;
	weakTopicIds: string[];
	missedQuestionIds: string[];
	domains: DomainScore[];
}

export interface QuizFeedback {
	questionId: string;
	correct: boolean;
	response: string[];
	expected: string[];
	explanation?: string;
	sourceUrl?: string;
	sourceLabel?: string;
	message: string;
}

export interface XpLine {
	label: string;
	value: number;
}

export interface QuizResults {
	accuracy: number;
	correct: number;
	total: number;
	missedCount: number;
	attempt: number;
	streak: number;
	xpLines: XpLine[];
	xpTotal: number;
	domains: DomainScore[];
	weakTopics: string[];
	headline: string;
	body: string;
	nextAction: string;
	mood: string;
	celebrate: boolean;
}

export interface QuizViewModel {
	examId: string;
	code: string;
	examTitle: string;
	day: number;
	dayTitle: string;
	kindLabel: string;
	attempt: number;
	retryMode: boolean;
	phase: "quiz" | "results" | "empty";
	total: number;
	index: number;
	answered: number;
	streak: number;
	bestStreak: number;
	question?: ClientQuestion;
	feedback?: QuizFeedback;
	results?: QuizResults;
	emptyMessage?: string;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const OPTION_PREFIX = /^\s*\(?([A-Za-z])[.):]\s+/;

export function toClientQuestion(question: QuizQuestion): ClientQuestion {
	const client: ClientQuestion = {
		id: question.id,
		kind: question.kind,
		prompt: question.prompt,
		domainId: question.domainId,
		domainName: question.domainName,
		topic: question.topic,
		options: question.options,
		groups: question.groups,
	};
	if (question.difficulty) {
		client.difficulty = question.difficulty;
	}
	return client;
}

function optionsFrom(raw: unknown): QuizOption[] {
	if (!Array.isArray(raw)) {
		return [];
	}
	return raw
		.map((entry, index) => {
			const text = typeof entry === "string" ? entry : String(entry ?? "");
			const prefix = OPTION_PREFIX.exec(text);
			return {
				key: prefix ? prefix[1].toUpperCase() : LETTERS[index] ?? String(index + 1),
				label: prefix ? text.slice(prefix[0].length).trim() : text.trim(),
			};
		})
		.filter((option) => option.label.length > 0);
}

/** Answer keys arrive as letters ("B") most of the time, but sometimes as the full option text. */
function keyFor(value: unknown, options: QuizOption[]): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return undefined;
	}
	const direct = options.find((option) => option.key.toUpperCase() === trimmed.toUpperCase());
	if (direct) {
		return direct.key;
	}
	const normalised = normalise(trimmed);
	const byLabel = options.find((option) => normalise(option.label) === normalised);
	return byLabel?.key;
}

function normalise(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function normalizeQuestion(
	raw: Question,
	domainId: string,
	domainName: string
): QuizQuestion | undefined {
	if (!raw || typeof raw.id !== "string" || typeof raw.question !== "string" || raw.ungraded === true) {
		return undefined;
	}

	const base = {
		id: raw.id,
		prompt: raw.question,
		domainId,
		domainName,
		topic: typeof raw.topic === "string" && raw.topic.trim().length > 0 ? raw.topic.trim() : domainName,
		...(typeof raw.difficulty === "string" ? { difficulty: raw.difficulty } : {}),
		...(typeof raw.explanation === "string" ? { explanation: raw.explanation } : {}),
		...(typeof raw.sourceUrl === "string" ? { sourceUrl: raw.sourceUrl } : {}),
		...(typeof raw.source === "string" ? { sourceLabel: raw.source } : {}),
	};

	const dropdowns = raw.dropdowns;
	if (Array.isArray(dropdowns) && dropdowns.length > 0) {
		const groups: QuizGroup[] = [];
		const answer: string[] = [];
		dropdowns.forEach((entry, groupIndex) => {
			const record = entry as { label?: unknown; options?: unknown; correctIndex?: unknown; correctAnswer?: unknown };
			const options = (Array.isArray(record.options) ? record.options : []).map((label, optionIndex) => ({
				key: `g${groupIndex}o${optionIndex}`,
				label: String(label ?? "").trim(),
			}));
			if (options.length === 0) {
				return;
			}
			const byIndex = Number(record.correctIndex);
			const correct = Number.isInteger(byIndex) && options[byIndex]
				? options[byIndex]
				: options.find((option) => normalise(option.label) === normalise(String(record.correctAnswer ?? "")));
			if (!correct) {
				return;
			}
			groups.push({ key: `g${groupIndex}`, label: String(record.label ?? `Item ${groupIndex + 1}`), options });
			answer.push(correct.key);
		});
		return groups.length > 0 ? { ...base, kind: "matching", options: [], groups, answer } : undefined;
	}

	const statements = raw.statements;
	const statementAnswers = raw.statementAnswers;
	if (Array.isArray(statements) && Array.isArray(statementAnswers) && statements.length > 0) {
		const groups: QuizGroup[] = [];
		const answer: string[] = [];
		statements.forEach((statement, index) => {
			const value = String(statementAnswers[index] ?? "").trim().toLowerCase();
			if (value !== "yes" && value !== "no") {
				return;
			}
			groups.push({
				key: `s${index}`,
				label: String(statement ?? "").trim(),
				options: [
					{ key: "Yes", label: "Yes" },
					{ key: "No", label: "No" },
				],
			});
			answer.push(value === "yes" ? "Yes" : "No");
		});
		return groups.length === statements.length && groups.length > 0
			? { ...base, kind: "yesno", options: [], groups, answer }
			: undefined;
	}

	const options = optionsFrom(raw.options);
	if (options.length < 2) {
		return undefined;
	}

	const multiSource = Array.isArray(raw.correctAnswers)
		? raw.correctAnswers
		: Array.isArray(raw.correctAnswer)
			? raw.correctAnswer
			: undefined;
	if (multiSource) {
		const answer = multiSource
			.map((entry) => keyFor(entry, options))
			.filter((key): key is string => key !== undefined);
		return answer.length > 0 ? { ...base, kind: "multi", options, groups: [], answer } : undefined;
	}

	const single = keyFor(raw.correctAnswer, options);
	return single ? { ...base, kind: "single", options, groups: [], answer: [single] } : undefined;
}

export function normalizeBank(bank: QuestionBank | undefined): QuizQuestion[] {
	if (!bank || !Array.isArray(bank.domains)) {
		return [];
	}
	const questions: QuizQuestion[] = [];
	for (const domain of bank.domains) {
		const domainId = String(domain?.domainId ?? "");
		const domainName = String(domain?.domainName ?? domainId);
		for (const raw of domain?.questions ?? []) {
			const normalized = normalizeQuestion(raw, domainId, domainName);
			if (normalized) {
				questions.push(normalized);
			}
		}
	}
	return questions;
}

export interface SelectionInput {
	bank?: QuestionBank;
	pool?: QuizQuestion[];
	day?: Pick<PlanDay, "domainId" | "topicIds" | "questionCount">;
	recentQuestionIds?: string[];
	onlyQuestionIds?: string[];
	limit?: number;
	seed?: number;
}

/** Deterministic PRNG so a given seed always yields the same set — repeatable in tests and on retries. */
function mulberry32(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function topicMatches(question: QuizQuestion, topicIds: string[]): boolean {
	if (topicIds.length === 0) {
		return false;
	}
	const topic = normalise(question.topic);
	return topicIds.some((raw) => {
		const candidate = normalise(String(raw ?? ""));
		return candidate.length > 0 && (topic.includes(candidate) || candidate.includes(topic));
	});
}

export function selectQuestions(input: SelectionInput): QuizQuestion[] {
	const all = input.pool ?? normalizeBank(input.bank);
	if (all.length === 0) {
		return [];
	}

	if (input.onlyQuestionIds && input.onlyQuestionIds.length > 0) {
		const wanted = new Set(input.onlyQuestionIds);
		return all.filter((question) => wanted.has(question.id));
	}

	const requested = input.limit ?? Math.max(MIN_QUESTIONS, input.day?.questionCount ?? 0);
	const desired = Math.min(all.length, Math.max(MIN_QUESTIONS, requested));

	const recent = new Set(input.recentQuestionIds ?? []);
	const topicIds = (input.day?.topicIds ?? []).filter((id) => typeof id === "string");
	const domainId = input.day?.domainId;
	const random = mulberry32(input.seed ?? 1);

	const ranked = all
		.map((question) => {
			let score = 0;
			if (domainId && question.domainId === domainId) {
				score += 4;
			}
			if (topicMatches(question, topicIds)) {
				score += 2;
			}
			if (!recent.has(question.id)) {
				score += 1;
			}
			return { question, score, jitter: random() };
		})
		.sort((a, b) => b.score - a.score || a.jitter - b.jitter);

	return ranked.slice(0, desired).map((entry) => entry.question);
}

function sameSet(a: string[], b: string[]): boolean {
	if (a.length !== b.length) {
		return false;
	}
	const left = [...a].map((value) => value.toUpperCase()).sort();
	const right = [...b].map((value) => value.toUpperCase()).sort();
	return left.every((value, index) => value === right[index]);
}

export function gradeQuestion(question: QuizQuestion, response: string[]): GradedAnswer {
	const answers = (response ?? []).filter((value) => typeof value === "string");
	let correct: boolean;

	switch (question.kind) {
		case "multi":
			// Partial credit would flatter the learner into a false sense of readiness.
			correct = answers.length > 0 && sameSet(answers, question.answer);
			break;
		case "yesno":
		case "matching":
			correct =
				answers.length === question.answer.length &&
				question.answer.every((expected, index) => (answers[index] ?? "").toUpperCase() === expected.toUpperCase());
			break;
		default:
			correct = answers.length === 1 && answers[0].toUpperCase() === question.answer[0].toUpperCase();
			break;
	}

	return { questionId: question.id, response: answers, expected: question.answer, correct };
}

export function summarizeQuiz(questions: QuizQuestion[], graded: GradedAnswer[]): QuizOutcome {
	const byId = new Map(questions.map((question) => [question.id, question]));
	const answered = graded.filter((entry) => byId.has(entry.questionId));
	const correct = answered.filter((entry) => entry.correct).length;
	const total = answered.length;

	const domains = new Map<string, DomainScore>();
	const topicHits = new Map<string, number>();
	const missedQuestionIds: string[] = [];

	for (const entry of answered) {
		const question = byId.get(entry.questionId);
		if (!question) {
			continue;
		}
		const row = domains.get(question.domainId) ?? {
			domainId: question.domainId,
			domainName: question.domainName,
			total: 0,
			correct: 0,
			accuracy: 0,
		};
		row.total += 1;
		if (entry.correct) {
			row.correct += 1;
		} else {
			missedQuestionIds.push(question.id);
			topicHits.set(question.topic, (topicHits.get(question.topic) ?? 0) + 1);
		}
		row.accuracy = row.total === 0 ? 0 : row.correct / row.total;
		domains.set(question.domainId, row);
	}

	const weakTopicIds = [...topicHits.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.map(([topic]) => topic);

	return {
		total,
		correct,
		accuracy: total === 0 ? 0 : correct / total,
		weakTopicIds,
		missedQuestionIds,
		domains: [...domains.values()].sort((a, b) => a.domainId.localeCompare(b.domainId)),
	};
}
