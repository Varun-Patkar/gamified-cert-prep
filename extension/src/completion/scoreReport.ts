/**
 * Best-effort reading of a score report so the completion form arrives pre-filled.
 *
 * PDFs are cracked open with node's own zlib — no npm dependency, and no pretence of being a
 * real PDF engine: we pull text out of `Tj`/`TJ` operators in the content streams and stop there.
 * Images are not OCR'd at all. Anything that fails degrades to "user types it themselves"; this
 * module never throws and never blocks the flow.
 */

import * as fs from "fs/promises";
import * as zlib from "zlib";
import type { LmService } from "../lm/agentic";
import type { CompletionForm } from "./examCompletion";

const MAX_REPORT_BYTES = 12 * 1024 * 1024;
const MAX_TEXT_CHARS = 20_000;
const MAX_PROMPT_CHARS = 6_000;

export const SUPPORTED_REPORT_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp"] as const;

export interface Prefill {
	form: CompletionForm;
	/** One line explaining what we filled in and why, or why we could not. */
	note?: string;
}

/** Returns undefined for images and for PDFs we cannot make sense of. */
export async function readScoreReportText(file: string): Promise<string | undefined> {
	if (!/\.pdf$/i.test(file)) {
		return undefined;
	}
	try {
		const stat = await fs.stat(file);
		if (stat.size > MAX_REPORT_BYTES) {
			return undefined;
		}
		const text = extractPdfText(await fs.readFile(file));
		return text.trim().length > 0 ? text : undefined;
	} catch {
		return undefined;
	}
}

/** Concatenated text of every content stream we could inflate and parse. */
export function extractPdfText(buffer: Buffer): string {
	const chunks: string[] = [];
	let cursor = 0;
	let budget = MAX_TEXT_CHARS;

	while (budget > 0) {
		const start = buffer.indexOf("stream", cursor);
		if (start < 0) {
			break;
		}
		const bodyStart = skipEol(buffer, start + "stream".length);
		const end = buffer.indexOf("endstream", bodyStart);
		if (end < 0) {
			break;
		}
		cursor = end + "endstream".length;

		const body = buffer.subarray(bodyStart, end);
		const decoded = inflate(body) ?? body;
		const text = decodePdfTextOperators(decoded.toString("latin1"));
		if (text.length > 0) {
			chunks.push(text.slice(0, budget));
			budget -= text.length;
		}
	}
	return chunks.join("\n");
}

/** Pulls the literal strings out of `(...) Tj` and `[...] TJ` operators. */
export function decodePdfTextOperators(content: string): string {
	if (!/\bTj\b|\bTJ\b/.test(content)) {
		return "";
	}
	const out: string[] = [];
	const operator = /\((?:\\.|[^\\()])*\)|\bT[Jj]\b|\bT[Dd*]\b|\bETB?\b/g;
	let pending: string[] = [];

	for (let match = operator.exec(content); match; match = operator.exec(content)) {
		const token = match[0];
		if (token.startsWith("(")) {
			pending.push(unescapePdfString(token.slice(1, -1)));
		} else if (token === "Tj" || token === "TJ") {
			out.push(pending.join(""));
			pending = [];
		} else {
			// Positioning operators end a visual line.
			if (pending.length > 0) {
				out.push(pending.join(""));
				pending = [];
			}
			out.push("\n");
		}
	}
	if (pending.length > 0) {
		out.push(pending.join(""));
	}
	return out
		.join(" ")
		.replace(/[ \t]+/g, " ")
		.replace(/\s*\n\s*/g, "\n")
		.trim();
}

/**
 * Regex pass over the extracted text. Cheap, deterministic and good enough on the Microsoft and
 * GitHub report layouts, so a missing language model never costs the user the pre-fill.
 */
export function heuristicPrefill(text: string): CompletionForm {
	const form: CompletionForm = {};
	const flat = text.replace(/\s+/g, " ");

	const outOf = /\b(\d{2,4})\s*(?:\/|out of)\s*(\d{3,4})\b/i.exec(flat);
	if (outOf) {
		form.score = outOf[1];
		form.maxScore = outOf[2];
	} else {
		const labelled = /\b(?:your\s+)?(?:final\s+)?score\b[^0-9]{0,20}(\d{1,4})/i.exec(flat);
		if (labelled) {
			form.score = labelled[1];
		}
	}

	const passing = /\b(?:passing|required)\s+score\b[^0-9]{0,20}(\d{1,4})/i.exec(flat);
	if (passing) {
		form.passingScore = passing[1];
	}

	if (/\b(did not pass|not pass(ed)?|unsuccessful|fail(ed)?)\b/i.test(flat)) {
		form.outcome = "failed";
	} else if (/\b(pass(ed)?|congratulations|successful)\b/i.test(flat)) {
		form.outcome = "passed";
	}

	const credential = /https?:\/\/\S*credentials?\/\S*[^\s.,)\]]/i.exec(text);
	if (credential) {
		form.credentialUrl = credential[0];
	}
	return form;
}

export interface PrefillDeps {
	lm?: LmService;
	log?(message: string): void;
}

/**
 * Heuristics first, then one optional language model pass to fill whatever is still blank.
 * Always resolves; the caller treats the result as a suggestion, never as truth.
 */
export async function prefillFromScoreReport(
	file: string,
	code: string,
	deps: PrefillDeps = {}
): Promise<Prefill> {
	const text = await readScoreReportText(file);
	if (!text) {
		return {
			form: {},
			note: /\.pdf$/i.test(file)
				? "Saved your score report. We could not read the text out of it, so fill the numbers in yourself."
				: "Saved your score report. Images can't be read automatically — pop the numbers in below.",
		};
	}

	const form = heuristicPrefill(text);
	const fromModel = await askModel(text, code, deps);
	const merged: CompletionForm = { ...fromModel, ...stripEmpty(form) };
	const filled = Object.keys(stripEmpty(merged)).length;

	return {
		form: merged,
		note:
			filled > 0
				? "We read your score report and filled in what we could — check it over before saving."
				: "Saved your score report, but nothing readable came out of it. Fill the numbers in below.",
	};
}

async function askModel(text: string, code: string, deps: PrefillDeps): Promise<CompletionForm> {
	if (!deps.lm) {
		return {};
	}
	try {
		const payload = await deps.lm.requestJson<Record<string, unknown>>({
			system: "You read certification score reports and return only what the document actually states.",
			prompt: [
				`This is the text of a ${code} score report.`,
				"Return the candidate's result. Use null for anything the document does not state.",
				"",
				text.slice(0, MAX_PROMPT_CHARS),
			].join("\n"),
			schemaHint: `{
  "outcome": "passed" | "failed" | null,
  "score": number | null,
  "maxScore": number | null,
  "passingScore": number | null,
  "credentialUrl": "string" | null
}`,
			maxRounds: 1,
		});
		return {
			...pickString(payload, "outcome"),
			...pickNumber(payload, "score"),
			...pickNumber(payload, "maxScore"),
			...pickNumber(payload, "passingScore"),
			...pickString(payload, "credentialUrl"),
		};
	} catch (error) {
		deps.log?.(`Score report pre-fill skipped: ${error instanceof Error ? error.message : String(error)}`);
		return {};
	}
}

function pickString(payload: Record<string, unknown>, key: keyof CompletionForm): CompletionForm {
	const value = payload[key];
	return typeof value === "string" && value.trim().length > 0 ? { [key]: value.trim() } : {};
}

function pickNumber(payload: Record<string, unknown>, key: keyof CompletionForm): CompletionForm {
	const value = payload[key];
	return typeof value === "number" && Number.isFinite(value) ? { [key]: String(value) } : {};
}

function stripEmpty(form: CompletionForm): CompletionForm {
	const out: CompletionForm = {};
	for (const [key, value] of Object.entries(form)) {
		if (typeof value === "string" && value.trim().length > 0) {
			out[key as keyof CompletionForm] = value;
		}
	}
	return out;
}

function skipEol(buffer: Buffer, index: number): number {
	let at = index;
	if (buffer[at] === 0x0d) {
		at += 1;
	}
	if (buffer[at] === 0x0a) {
		at += 1;
	}
	return at;
}

function inflate(body: Buffer): Buffer | undefined {
	for (const attempt of [zlib.inflateSync, zlib.inflateRawSync]) {
		try {
			return attempt(body);
		} catch {
			// Not this encoding — try the next, then fall back to the raw bytes.
		}
	}
	return undefined;
}

function unescapePdfString(value: string): string {
	return value.replace(/\\(n|r|t|b|f|\(|\)|\\|[0-7]{1,3})/g, (_match, escape: string) => {
		switch (escape) {
			case "n":
				return "\n";
			case "r":
				return "\r";
			case "t":
				return "\t";
			case "b":
			case "f":
				return " ";
			case "(":
				return "(";
			case ")":
				return ")";
			case "\\":
				return "\\";
			default:
				return String.fromCharCode(parseInt(escape, 8));
		}
	});
}
