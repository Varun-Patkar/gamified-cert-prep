/**
 * Renders and splices the README's "Certifications Earned" table.
 * Pure: no fs, no vscode. Every operation here must be idempotent.
 */

import type { ExamMeta } from "../model/types";

export const CERT_TABLE_HEADING = "Certifications Earned";

const HEADING = /^#{1,6}\s+.*Certifications Earned/i;
const ANY_HEADING = /^#{1,6}\s/;

const HEADER_ROWS = [
	"| Exam | Certification | Credential | Score Report |",
	"|------|---------------|------------|--------------|",
];

export function renderCertTable(exams: readonly ExamMeta[]): string {
	const rows = exams
		.filter((exam) => exam.status === "completed")
		.slice()
		.sort(byEarnedThenCode)
		.map(renderRow);
	return [...HEADER_ROWS, ...rows].join("\n");
}

/** Spaces in folder names must be percent-encoded or the markdown link silently breaks. */
export function encodeRelativePath(file: string): string {
	return file
		.split(/[\\/]/)
		.filter((segment) => segment.length > 0)
		.map((segment) => encodeURIComponent(segment))
		.join("/");
}

/**
 * Replaces only the table under the "Certifications Earned" heading; every other byte survives.
 * When the heading is missing the section is inserted before the first other `##` heading.
 */
export function updateReadme(existing: string, table: string): string {
	const newline = existing.includes("\r\n") ? "\r\n" : "\n";
	const lines = existing.split(/\r?\n/);
	const tableLines = table.split(/\r?\n/);

	const headingIndex = lines.findIndex((line) => HEADING.test(line));
	if (headingIndex < 0) {
		return insertSection(lines, tableLines, newline);
	}

	const sectionEnd = endOfSection(lines, headingIndex);
	const start = firstTableLine(lines, headingIndex + 1, sectionEnd);
	if (start < 0) {
		const pad = sectionEnd > 0 && lines[sectionEnd - 1].trim().length > 0 ? [""] : [];
		return splice(lines, sectionEnd, sectionEnd, [...pad, ...tableLines, ""], newline);
	}

	let end = start;
	while (end < sectionEnd && isTableLine(lines[end])) {
		end += 1;
	}
	return splice(lines, start, end, tableLines, newline);
}

function renderRow(exam: ExamMeta): string {
	const credential = exam.result?.credentialUrl
		? `[View credential](${exam.result.credentialUrl})`
		: "—";
	const report = exam.result?.scoreReportFile
		? `[View PDF](${encodeRelativePath(exam.result.scoreReportFile)})`
		: "—";
	return `| **${exam.code}** | ${exam.title} | ${credential} | ${report} |`;
}

function byEarnedThenCode(a: ExamMeta, b: ExamMeta): number {
	const left = a.completedAt ?? a.createdAt ?? "";
	const right = b.completedAt ?? b.createdAt ?? "";
	return left.localeCompare(right) || a.code.localeCompare(b.code);
}

function isTableLine(line: string): boolean {
	return line.trimStart().startsWith("|");
}

function firstTableLine(lines: string[], from: number, to: number): number {
	for (let index = from; index < to; index += 1) {
		if (isTableLine(lines[index])) {
			return index;
		}
	}
	return -1;
}

function endOfSection(lines: string[], headingIndex: number): number {
	for (let index = headingIndex + 1; index < lines.length; index += 1) {
		if (ANY_HEADING.test(lines[index])) {
			return index;
		}
	}
	return lines.length;
}

function insertSection(lines: string[], tableLines: string[], newline: string): string {
	const block = [`## ${CERT_TABLE_HEADING}`, "", ...tableLines, ""];
	const anchor = lines.findIndex((line) => ANY_HEADING.test(line) && !/^#\s/.test(line));
	if (anchor >= 0) {
		return splice(lines, anchor, anchor, block, newline);
	}
	const trimmed = lines.length > 0 && lines[lines.length - 1].trim().length === 0 ? lines.slice(0, -1) : lines;
	return [...trimmed, "", ...block].join(newline);
}

function splice(lines: string[], start: number, end: number, replacement: string[], newline: string): string {
	return [...lines.slice(0, start), ...replacement, ...lines.slice(end)].join(newline);
}
