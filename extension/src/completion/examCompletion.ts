/**
 * Pure core of the "how did it go?" flow: validation, normalisation and the copy that has to
 * land warmly whether the exam was passed or not. No fs, no vscode, no DOM.
 */

import type { ExamMeta, ExamResult } from "../model/types";

export type CompletionOutcome = "passed" | "failed" | "unsaid";

/** Everything the webview can send. All strings: the form is text boxes and radio buttons. */
export interface CompletionForm {
	outcome?: string;
	score?: string;
	maxScore?: string;
	passingScore?: string;
	credentialUrl?: string;
	/** Repo-relative, already copied into the exam folder by the host. */
	scoreReportFile?: string;
}

export interface CompletionPrompt {
	headline: string;
	body: string;
	ctaLabel: string;
}

export interface OutcomeChoice {
	value: CompletionOutcome;
	label: string;
	hint: string;
}

export interface CompletionModel {
	examId: string;
	code: string;
	title: string;
	vendor: string;
	examDate?: string;
	headline: string;
	body: string;
	outcomes: OutcomeChoice[];
	form: CompletionForm;
	scoreReportName?: string;
	prefillNote?: string;
	busy: boolean;
	busyLabel?: string;
	errors: string[];
	ctaLabel: string;
	reassurance: string;
}

export type BuiltExamResult =
	| { ok: true; result: ExamResult; warnings: string[] }
	| { ok: false; errors: string[] };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** A bare number with no max alongside it is almost always a percentage. */
const PERCENT_CEILING = 100;

export const OUTCOME_CHOICES: readonly OutcomeChoice[] = [
	{ value: "passed", label: "I passed", hint: "Let's get that on the wall." },
	{ value: "failed", label: "Not this time", hint: "Everything you learned still counts." },
	{ value: "unsaid", label: "Rather not say", hint: "Totally fine — we'll just close the campaign." },
];

/** True once the exam date has arrived and the campaign has not been closed out yet. */
export function shouldOfferCompletion(
	meta: Pick<ExamMeta, "status" | "examDate">,
	today: string
): boolean {
	if (meta.status !== "in-progress" || !meta.examDate) {
		return false;
	}
	if (!ISO_DATE.test(meta.examDate) || !ISO_DATE.test(today)) {
		return false;
	}
	return today >= meta.examDate;
}

export function completionPrompt(meta: Pick<ExamMeta, "code" | "examDate">, today: string): CompletionPrompt {
	const sameDay = meta.examDate === today;
	return {
		headline: sameDay ? "Exam day. How did it go?" : "How did it go?",
		body: sameDay
			? `Whenever you are ready, tell us how ${meta.code} went and we'll close the campaign out properly.`
			: `${meta.code} has come and gone. Record the result whenever you like — pass or not, the campaign deserves an ending.`,
		ctaLabel: "Record my result →",
	};
}

export function buildCompletionModel(input: {
	meta: Pick<ExamMeta, "id" | "code" | "title" | "vendor" | "examDate">;
	form?: CompletionForm;
	scoreReportName?: string;
	prefillNote?: string;
	busy?: boolean;
	busyLabel?: string;
	errors?: string[];
}): CompletionModel {
	const model: CompletionModel = {
		examId: input.meta.id,
		code: input.meta.code,
		title: input.meta.title,
		vendor: input.meta.vendor,
		headline: `${input.meta.code} is behind you`,
		body: "Tell us as much or as little as you want. Nothing here changes the work you already put in.",
		outcomes: [...OUTCOME_CHOICES],
		form: input.form ?? {},
		busy: input.busy === true,
		errors: input.errors ?? [],
		ctaLabel: "Close the campaign",
		reassurance: "Every field is optional except the first one. You can edit meta.json later if anything changes.",
	};
	if (input.meta.examDate) {
		model.examDate = input.meta.examDate;
	}
	if (input.scoreReportName) {
		model.scoreReportName = input.scoreReportName;
	}
	if (input.prefillNote) {
		model.prefillNote = input.prefillNote;
	}
	if (input.busyLabel) {
		model.busyLabel = input.busyLabel;
	}
	return model;
}

/** Validates and normalises the form into the shape `meta.json` stores. */
export function buildExamResult(form: CompletionForm): BuiltExamResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	const outcome = normalizeOutcome(form.outcome);
	if (!outcome) {
		errors.push("Pick one of the three options so we know how to word things.");
	}

	const score = parseScore(form.score, "Score", errors);
	let maxScore = parseScore(form.maxScore, "Max score", errors);
	const passingScore = parseScore(form.passingScore, "Passing score", errors);

	// A lone "72" is a percentage far more often than it is a raw score out of nothing.
	if (score !== undefined && maxScore === undefined) {
		if (looksLikePercent(form.score) || score <= PERCENT_CEILING) {
			maxScore = PERCENT_CEILING;
			warnings.push(`Read ${score} as a percentage. Change the max score if it was out of something else.`);
		}
	}

	if (score !== undefined && maxScore !== undefined && score > maxScore) {
		errors.push(`A score of ${score} cannot be out of ${maxScore}.`);
	}
	if (passingScore !== undefined && maxScore !== undefined && passingScore > maxScore) {
		errors.push(`A passing score of ${passingScore} cannot be out of ${maxScore}.`);
	}

	const credentialUrl = normalizeUrl(form.credentialUrl, errors);
	const scoreReportFile = normalizeRelativeFile(form.scoreReportFile);

	if (errors.length > 0) {
		return { ok: false, errors };
	}

	const result: ExamResult = {};
	if (outcome === "passed" || outcome === "failed") {
		result.passed = outcome === "passed";
	} else if (score !== undefined && passingScore !== undefined) {
		// They would rather not say, but the numbers already answered the question.
		result.passed = score >= passingScore;
	}
	if (score !== undefined) {
		result.score = score;
	}
	if (maxScore !== undefined) {
		result.maxScore = maxScore;
	}
	if (passingScore !== undefined) {
		result.passingScore = passingScore;
	}
	if (credentialUrl) {
		result.credentialUrl = credentialUrl;
	}
	if (scoreReportFile) {
		result.scoreReportFile = scoreReportFile;
	}
	return { ok: true, result, warnings };
}

/** The toast after the campaign is closed. Celebratory when earned, never hollow when not. */
export function completionToast(code: string, result: ExamResult): string {
	if (result.passed === true) {
		return `${code} is in the trophy case. Certificate issued, README updated — go and enjoy that.`;
	}
	if (result.passed === false) {
		return `${code} campaign closed. Every day you banked is still yours, and the next attempt starts from a much higher floor.`;
	}
	return `${code} campaign closed and filed. Whatever happened, the work was real.`;
}

export function normalizeOutcome(value: string | undefined): CompletionOutcome | undefined {
	const trimmed = (value ?? "").trim().toLowerCase();
	return OUTCOME_CHOICES.some((choice) => choice.value === trimmed)
		? (trimmed as CompletionOutcome)
		: undefined;
}

/** `<CODE>-score-report.pdf`, matching the names the README already links to. */
export function scoreReportFileName(code: string, extension: string): string {
	const ext = extension.replace(/^\.+/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
	const safeCode = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "") || "EXAM";
	return `${safeCode}-score-report.${ext.length > 0 ? ext : "pdf"}`;
}

function looksLikePercent(raw: string | undefined): boolean {
	return typeof raw === "string" && raw.trim().endsWith("%");
}

function parseScore(raw: string | undefined, label: string, errors: string[]): number | undefined {
	const trimmed = (raw ?? "").trim().replace(/%$/, "").trim();
	if (trimmed.length === 0) {
		return undefined;
	}
	const value = Number(trimmed);
	if (!Number.isFinite(value)) {
		errors.push(`${label} needs to be a number — "${trimmed}" is not one.`);
		return undefined;
	}
	if (value < 0) {
		errors.push(`${label} cannot be negative.`);
		return undefined;
	}
	return Math.round(value * 100) / 100;
}

function normalizeUrl(raw: string | undefined, errors: string[]): string | undefined {
	const trimmed = (raw ?? "").trim();
	if (trimmed.length === 0) {
		return undefined;
	}
	let parsed: URL;
	try {
		parsed = new URL(trimmed);
	} catch {
		errors.push("That credential link does not look like a URL. Paste the full https:// address.");
		return undefined;
	}
	if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
		errors.push("Credential links have to be http or https.");
		return undefined;
	}
	return parsed.toString();
}

/** Repo-relative, forward slashes, never escaping the repo. */
function normalizeRelativeFile(raw: string | undefined): string | undefined {
	const trimmed = (raw ?? "").trim().replace(/\\/g, "/").replace(/^\.\//, "");
	if (trimmed.length === 0) {
		return undefined;
	}
	const segments = trimmed.split("/").filter((segment) => segment.length > 0 && segment !== ".");
	if (segments.length === 0 || segments.includes("..")) {
		return undefined;
	}
	return segments.join("/");
}
