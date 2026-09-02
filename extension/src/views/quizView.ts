/** The full-tab quiz. Grading lives in quiz/quizEngine.ts; every result string comes from copy/tone.ts. */

import * as vscode from "vscode";
import { answerCopy, resultCopy, xpLineLabels } from "../copy/tone";
import { awardDayXp, updateStreak } from "../gamification/engine";
import type { DayResult, StreakState } from "../model/types";
import {
	gradeQuestion,
	normalizeBank,
	selectQuestions,
	summarizeQuiz,
	toClientQuestion,
	type GradedAnswer,
	type QuizFeedback,
	type QuizQuestion,
	type QuizResults,
	type QuizViewModel,
} from "../quiz/quizEngine";
import { defaultProfile } from "../store/repoStore";
import type { ExtensionState } from "../state/extensionState";
import { PanelHost, type PanelHostOptions } from "./panelHost";

export const QUIZ_PANEL: PanelHostOptions = { viewType: "certPrep.quiz", script: "quiz.js" };

const BASE_DAY_XP = 100;
const PERFECT_BONUS = 50;
const MAX_STREAK_BONUS_DAYS = 10;
const STREAK_XP_PER_DAY = 5;
const CELEBRATION_THRESHOLD = 0.8;
const RECENT_MEMORY = 120;

const KIND_LABELS: Record<string, string> = {
	study: "Study",
	review: "Review",
	buffer: "Buffer",
	mock: "Mock exam",
	exam: "Exam day",
};

export interface QuizDeps {
	openDashboard(examId: string): Promise<void> | void;
	/** Fired after a day result is written, so a cleared domain can be certified. */
	onDayBanked?(examId: string): Promise<void> | void;
}

interface RunState {
	examId: string;
	day: number;
	questions: QuizQuestion[];
	graded: GradedAnswer[];
	index: number;
	streak: number;
	bestStreak: number;
	retryMode: boolean;
	feedback?: QuizFeedback;
	results?: QuizResults;
}

export class QuizView implements vscode.Disposable {
	private readonly host: PanelHost;
	private run?: RunState;
	private recentQuestionIds: string[] = [];

	constructor(
		extensionUri: vscode.Uri,
		private readonly state: ExtensionState,
		private readonly deps: QuizDeps
	) {
		this.host = new PanelHost(extensionUri, QUIZ_PANEL);
	}

	async open(examId: string, day: number, onlyQuestionIds?: string[]): Promise<void> {
		const snapshot = this.state.findSnapshot(examId);
		const store = this.state.store;
		if (!snapshot || !store) {
			void vscode.window.showWarningMessage("That exam is not in the bound prep repo.");
			return;
		}

		const bank = await store.readQuestions(snapshot.meta.folder);
		const pool = normalizeBank(bank);
		const planDay = snapshot.plan?.days.find((entry) => entry.day === day);
		const selectedQuestionIds = onlyQuestionIds ?? (await store.readDayQuestionIds(snapshot.meta.folder, day));
		const questions = selectQuestions({
			pool,
			...(planDay ? { day: planDay } : {}),
			recentQuestionIds: this.recentQuestionIds,
			...(selectedQuestionIds ? { onlyQuestionIds: selectedQuestionIds } : {}),
			seed: day * 7919 + this.recentQuestionIds.length,
		});

		this.run = {
			examId,
			day,
			questions,
			graded: [],
			index: 0,
			streak: 0,
			bestStreak: 0,
			retryMode: Boolean(onlyQuestionIds && onlyQuestionIds.length > 0),
		};
		this.remember(questions.map((question) => question.id));

		this.host.reveal(
			`${snapshot.meta.code} — Day ${day} quiz`,
			(message) => void this.handle(message),
			() => {
				this.run = undefined;
			}
		);
		this.push();
	}

	dispose(): void {
		this.host.dispose();
	}

	private push(): void {
		const model = this.viewModel();
		if (model) {
			this.host.post({ type: "state/update", state: model });
		}
	}

	private viewModel(): QuizViewModel | undefined {
		const run = this.run;
		const snapshot = run ? this.state.findSnapshot(run.examId) : undefined;
		if (!run || !snapshot) {
			return undefined;
		}
		const planDay = snapshot.plan?.days.find((entry) => entry.day === run.day);
		const model: QuizViewModel = {
			examId: run.examId,
			code: snapshot.meta.code,
			examTitle: snapshot.meta.title,
			day: run.day,
			dayTitle: planDay?.title ?? `Day ${run.day}`,
			kindLabel: KIND_LABELS[planDay?.kind ?? "study"] ?? "Study",
			attempt: this.attemptNumber(),
			retryMode: run.retryMode,
			phase: run.results ? "results" : run.questions.length === 0 ? "empty" : "quiz",
			total: run.questions.length,
			index: run.index,
			answered: run.graded.length,
			streak: run.streak,
			bestStreak: run.bestStreak,
		};

		const question = run.questions[run.index];
		if (question) {
			model.question = toClientQuestion(question);
		}
		if (run.feedback) {
			model.feedback = run.feedback;
		}
		if (run.results) {
			model.results = run.results;
		}
		if (run.questions.length === 0) {
			model.emptyMessage =
				"There are no gradable questions in this bank yet. Add questions.json entries and the quiz will light up.";
		}
		return model;
	}

	private attemptNumber(): number {
		const run = this.run;
		const snapshot = run ? this.state.findSnapshot(run.examId) : undefined;
		if (!run || !snapshot) {
			return 1;
		}
		return (snapshot.progress.results ?? []).filter((result) => result.day === run.day).length + 1;
	}

	private async handle(message: { type: string; questionId?: string; response?: string[] }): Promise<void> {
		const run = this.run;
		if (!run) {
			return;
		}
		switch (message.type) {
			case "webview/ready":
				this.push();
				break;
			case "quiz/answer":
				this.answer(message.questionId, message.response ?? []);
				break;
			case "quiz/next":
				this.advance();
				break;
			case "quiz/finish":
				await this.finish();
				break;
			case "quiz/retryMissed":
				await this.retryMissed();
				break;
			case "command/backToDashboard":
				await this.deps.openDashboard(run.examId);
				break;
			default:
				break;
		}
	}

	private answer(questionId: string | undefined, response: string[]): void {
		const run = this.run;
		const question = run?.questions[run.index];
		if (!run || !question || question.id !== questionId || run.feedback) {
			return;
		}
		const graded = gradeQuestion(question, response);
		run.graded.push(graded);
		run.streak = graded.correct ? run.streak + 1 : 0;
		run.bestStreak = Math.max(run.bestStreak, run.streak);

		const feedback: QuizFeedback = {
			questionId: question.id,
			correct: graded.correct,
			response: graded.response,
			expected: graded.expected,
			message: answerCopy(graded.correct, run.streak),
		};
		if (question.explanation) {
			feedback.explanation = question.explanation;
		}
		if (question.sourceUrl) {
			feedback.sourceUrl = question.sourceUrl;
		}
		if (question.sourceLabel) {
			feedback.sourceLabel = question.sourceLabel;
		}
		run.feedback = feedback;

		this.host.post({ type: "quiz/feedback", feedback });
		this.push();
	}

	private advance(): void {
		const run = this.run;
		if (!run || !run.feedback) {
			return;
		}
		run.feedback = undefined;
		run.index = Math.min(run.questions.length - 1, run.index + 1);
		this.push();
	}

	private async retryMissed(): Promise<void> {
		const run = this.run;
		if (!run || !run.results) {
			return;
		}
		const missed = summarizeQuiz(run.questions, run.graded).missedQuestionIds;
		if (missed.length === 0) {
			await this.deps.openDashboard(run.examId);
			return;
		}
		await this.open(run.examId, run.day, missed);
	}

	private async finish(): Promise<void> {
		const run = this.run;
		const store = this.state.store;
		const snapshot = run ? this.state.findSnapshot(run.examId) : undefined;
		if (!run || !store || !snapshot) {
			return;
		}

		const outcome = summarizeQuiz(run.questions, run.graded);
		const attempt = this.attemptNumber();
		const today = new Date().toISOString().slice(0, 10);
		const streakBefore: StreakState = snapshot.progress.streak ?? { current: 0, longest: 0, freezeTokens: 0 };
		// Retakes must not inflate a streak that was already banked for the day.
		const streakAfter = attempt === 1 ? updateStreak(streakBefore, today) : streakBefore;
		const isPerfect = outcome.total > 0 && outcome.correct === outcome.total;
		const xp = awardDayXp({
			accuracy: outcome.accuracy,
			attempt,
			streakAfter: streakAfter.current,
			isPerfect,
		});

		const result: DayResult = {
			day: run.day,
			attempt,
			completedAt: new Date().toISOString(),
			questionsAnswered: outcome.total,
			correct: outcome.correct,
			accuracy: outcome.accuracy,
			weakTopicIds: outcome.weakTopicIds,
			xpAwarded: xp,
		};

		try {
			await store.appendDayResult(snapshot.meta.folder, result);
			const progress = await store.readProgress(snapshot.meta.folder);
			progress.streak = streakAfter;
			await store.writeProgress(snapshot.meta.folder, progress);

			const profile = (await store.readProfile()) ?? defaultProfile();
			profile.lifetimeXp = Math.max(0, profile.lifetimeXp ?? 0) + xp;
			await store.writeProfile(profile);

			await this.state.sync?.enqueue(`${snapshot.meta.code}: Day ${run.day} quiz (${outcome.correct}/${outcome.total})`);
		} catch (error) {
			void vscode.window.showWarningMessage(
				`Your score is on screen but could not be written to the repo: ${error instanceof Error ? error.message : String(error)}`
			);
		}

		const copy = resultCopy({
			accuracy: outcome.accuracy,
			correct: outcome.correct,
			total: outcome.total,
			attempt,
			streak: streakAfter.current,
			weakTopics: outcome.weakTopicIds,
		});

		run.results = {
			accuracy: outcome.accuracy,
			correct: outcome.correct,
			total: outcome.total,
			missedCount: outcome.missedQuestionIds.length,
			attempt,
			streak: streakAfter.current,
			xpLines: xpBreakdown(outcome.accuracy, attempt, streakAfter.current, isPerfect, xp),
			xpTotal: xp,
			domains: outcome.domains,
			weakTopics: outcome.weakTopicIds,
			headline: copy.headline,
			body: copy.body,
			nextAction: copy.nextAction,
			mood: copy.mood,
			celebrate: outcome.accuracy >= CELEBRATION_THRESHOLD,
		};
		run.feedback = undefined;

		this.host.post({ type: "quiz/results", results: run.results });
		await this.state.refresh();
		this.push();
		try {
			await this.deps.onDayBanked?.(run.examId);
		} catch {
			// Rewards are never allowed to break the results screen.
		}
	}

	private remember(ids: string[]): void {
		this.recentQuestionIds = [...ids, ...this.recentQuestionIds].slice(0, RECENT_MEMORY);
	}
}

/** Mirrors gamification/engine.ts so the tally on screen adds up to exactly the XP awarded. */
function xpBreakdown(
	accuracy: number,
	attempt: number,
	streakAfter: number,
	isPerfect: boolean,
	total: number
): { label: string; value: number }[] {
	const labels = xpLineLabels();
	const accuracyBonus = Math.round(Math.min(1, Math.max(0, accuracy)) * 100);

	if (attempt > 1) {
		return [
			{ label: labels.base, value: BASE_DAY_XP },
			{ label: labels.accuracy, value: accuracyBonus },
			{ label: labels.retake, value: total - BASE_DAY_XP - accuracyBonus },
		];
	}

	const lines = [
		{ label: labels.base, value: BASE_DAY_XP },
		{ label: labels.accuracy, value: accuracyBonus },
	];
	const streakBonus = Math.min(streakAfter, MAX_STREAK_BONUS_DAYS) * STREAK_XP_PER_DAY;
	if (streakBonus > 0) {
		lines.push({ label: labels.streak, value: streakBonus });
	}
	if (isPerfect) {
		lines.push({ label: labels.perfect, value: PERFECT_BONUS });
	}
	return lines;
}
