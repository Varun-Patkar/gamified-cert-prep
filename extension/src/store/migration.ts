/**
 * One-off upgrade of the hand-written `<CODE> Prep/` folders that predate the extension
 * into folders carrying a machine-readable `meta.json`.
 */

import type { Dirent } from "fs";
import * as fs from "fs/promises";
import * as path from "path";
import type { ExamMeta } from "../model/types";
import { importLegacyExam } from "./legacyImport";
import { examPaths, slugify } from "./paths";

const LEGACY_FOLDER = /^(.+?)\s+Prep$/;

export interface ReadmeCertRow {
	code: string;
	certification: string;
	vendor: string;
	credentialUrl?: string;
	scoreReportFile?: string;
}

/**
 * Parses the "Certifications Earned" table. Vendor is read out of the certification
 * column ("Microsoft Certified: ...", "GitHub Certified: ...") rather than hardcoded.
 */
export function parseReadmeCertifications(markdown: string): Map<string, ReadmeCertRow> {
	const rows = new Map<string, ReadmeCertRow>();
	for (const line of markdown.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
			continue;
		}
		const cells = trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
		if (cells.length < 2) {
			continue;
		}
		const code = cells[0].replace(/\*/g, "").trim();
		if (!/^[A-Za-z]{2,4}-\d{3}$/.test(code)) {
			continue;
		}
		const certification = cells[1].replace(/\*/g, "").trim();
		const row: ReadmeCertRow = {
			code: code.toUpperCase(),
			certification,
			vendor: vendorFromCertification(certification),
		};
		const credentialUrl = firstLinkTarget(cells[2]);
		if (credentialUrl) {
			row.credentialUrl = credentialUrl;
		}
		const scoreReport = firstLinkTarget(cells[3]);
		if (scoreReport) {
			row.scoreReportFile = decodeUriPath(scoreReport);
		}
		rows.set(row.code, row);
	}
	return rows;
}

function vendorFromCertification(certification: string): string {
	const match = /^([A-Za-z0-9 ]+?)\s+Certified\b/.exec(certification);
	return match ? match[1].trim() : "Unknown";
}

/**
 * Exam-code prefixes we can attribute with confidence, checked in order.
 * Extend this table rather than special-casing a vendor anywhere else.
 */
export const VENDOR_CODE_PREFIXES: readonly { readonly match: RegExp; readonly vendor: string }[] = [
	{ match: /^GH-/, vendor: "GitHub" },
	{ match: /^(AI|AZ|DP|MS|PL|SC|MB|AB|MD)-/, vendor: "Microsoft" },
	{ match: /^(AWS|SAA|DVA|SOA|CLF)/, vendor: "AWS" },
];

/** Last-resort vendor when the README says nothing about this exam. */
export function vendorFromCode(code: string): string {
	const normalized = code.trim().toUpperCase();
	for (const entry of VENDOR_CODE_PREFIXES) {
		if (entry.match.test(normalized)) {
			return entry.vendor;
		}
	}
	return "Unknown";
}

/** A README-derived vendor always wins; the code prefix only fills the gap. */
export function resolveVendor(fromReadme: string | undefined, code: string): string {
	return fromReadme && fromReadme !== "Unknown" ? fromReadme : vendorFromCode(code);
}

function firstLinkTarget(cell: string | undefined): string | undefined {
	if (!cell) {
		return undefined;
	}
	const match = /\[[^\]]*\]\(([^)\s]+)\)/.exec(cell);
	return match ? match[1] : undefined;
}

function decodeUriPath(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

/** `# Foo Bar (AB-100) - Topics` -> `Foo Bar`. */
export function titleFromTopics(markdown: string, code: string): string | undefined {
	const match = /^#\s+(.+)$/m.exec(markdown);
	if (!match) {
		return undefined;
	}
	const title = match[1]
		.replace(/\s*[-—–]\s*Topics\s*$/i, "")
		.replace(new RegExp(`\\s*\\(${code}\\)\\s*$`, "i"), "")
		.replace(/\s*[-—–:]\s*$/, "")
		.trim();
	return title.length > 0 ? title : undefined;
}

/** Earliest `YYYY-MM-DD` anywhere in the daily log; legacy logs are wildly inconsistent otherwise. */
export function earliestIsoDate(markdown: string): string | undefined {
	const dates = markdown.match(/\d{4}-\d{2}-\d{2}/g);
	if (!dates || dates.length === 0) {
		return undefined;
	}
	return [...dates].sort()[0];
}

export async function migrateLegacyExams(root: string): Promise<ExamMeta[]> {
	const readme = (await readText(path.join(root, "README.md"))) ?? "";
	const certRows = parseReadmeCertifications(readme);
	const today = new Date().toISOString().slice(0, 10);

	const entries = await readDir(root);
	const migrated: ExamMeta[] = [];

	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue;
		}
		const match = LEGACY_FOLDER.exec(entry.name);
		if (!match) {
			continue;
		}
		const folder = entry.name;
		const paths = examPaths(root, folder);

		const existing = await readJson<ExamMeta>(paths.meta);
		if (existing) {
			// An already-migrated folder can still be missing plan.json/progress.json.
			await importLegacyExam(root, existing);
			migrated.push((await readJson<ExamMeta>(paths.meta)) ?? existing);
			continue;
		}
		// A meta.json we cannot parse is still the user's file; never clobber it.
		if (await exists(paths.meta)) {
			continue;
		}

		const code = match[1].trim().toUpperCase();
		const row = certRows.get(code);
		const topics = (await readText(paths.topics)) ?? "";
		const progress = (await readText(paths.progressMarkdown)) ?? "";
		const earned = Boolean(row?.credentialUrl);

		const meta: ExamMeta = {
			schemaVersion: 1,
			id: slugify(code),
			vendor: resolveVendor(row?.vendor, code),
			code,
			title: row?.certification ?? titleFromTopics(topics, code) ?? code,
			status: earned ? "completed" : "in-progress",
			legacy: earned,
			gamified: !earned,
			folder,
			createdAt: earliestIsoDate(progress) ?? today,
		};

		if (row && earned) {
			meta.result = {
				passed: true,
				...(row.credentialUrl ? { credentialUrl: row.credentialUrl } : {}),
				...(row.scoreReportFile ? { scoreReportFile: row.scoreReportFile } : {}),
			};
		}

		await fs.mkdir(path.dirname(paths.meta), { recursive: true });
		await fs.writeFile(paths.meta, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
		await importLegacyExam(root, meta);
		migrated.push((await readJson<ExamMeta>(paths.meta)) ?? meta);
	}

	return migrated.sort((a, b) => a.code.localeCompare(b.code));
}

async function readDir(dir: string): Promise<Dirent[]> {
	try {
		return await fs.readdir(dir, { withFileTypes: true });
	} catch {
		return [];
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
