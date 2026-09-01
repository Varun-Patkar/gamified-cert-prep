/** Pure view-model for the session reader. Markdown is rendered here so the view only ships HTML. */

import { readingMinutes, renderMarkdown } from "../markdown/render";
import type { DayKind, ExamMeta, PlanDay, Progress } from "../model/types";

const KIND_LABELS: Record<DayKind, string> = {
	study: "Study",
	review: "Review",
	buffer: "Buffer",
	mock: "Mock exam",
	exam: "Exam day",
};

export interface SessionModel {
	examId: string;
	code: string;
	examTitle: string;
	day: number;
	date: string;
	title: string;
	kindLabel: string;
	questionCount: number;
	html: string;
	found: boolean;
	revisit: boolean;
	attempts: number;
	lastAccuracy?: number;
	readingMinutes: number;
	quizAvailable: boolean;
	ctaLabel: string;
	revisitNote: string;
	missingBody: string;
}

export interface SessionInput {
	meta: ExamMeta;
	day: number;
	planDay?: PlanDay;
	markdown?: string;
	progress: Progress;
	availableQuestions: number;
}

export function buildSessionModel(input: SessionInput): SessionModel {
	const { meta, planDay, progress } = input;
	const markdown = input.markdown ?? "";
	const attempts = (progress.results ?? []).filter((result) => result.day === input.day);
	const latest = attempts[attempts.length - 1];
	const revisit = (progress.completedDays ?? []).includes(input.day);

	const model: SessionModel = {
		examId: meta.id,
		code: meta.code,
		examTitle: meta.title,
		day: input.day,
		date: planDay?.date ?? "",
		title: planDay?.title ?? `Day ${input.day}`,
		kindLabel: planDay ? KIND_LABELS[planDay.kind] ?? planDay.kind : "Study",
		questionCount: Math.max(0, planDay?.questionCount ?? 0),
		html: markdown.trim().length > 0 ? renderMarkdown(markdown) : "",
		found: markdown.trim().length > 0,
		revisit,
		attempts: attempts.length,
		readingMinutes: readingMinutes(markdown),
		quizAvailable: input.availableQuestions > 0 && planDay?.kind !== "exam",
		ctaLabel: revisit ? "Run the quiz again →" : "Start the quiz →",
		revisitNote: revisit
			? `You cleared this one already${latest ? ` at ${Math.round(clamp01(latest.accuracy) * 100)}%` : ""}. Read on — nothing here can be un-earned.`
			: "",
		missingBody:
			"There is no session note on disk for this day yet. Generate the plan material and it will appear here.",
	};

	if (latest && typeof latest.accuracy === "number") {
		model.lastAccuracy = clamp01(latest.accuracy);
	}
	return model;
}

function clamp01(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}
	return Math.min(1, Math.max(0, value));
}
