/** Pure path helpers for the on-disk repo layout. No fs access, so this stays unit-testable. */

import * as path from "path";

export const CERT_PREP_DIR = ".certprep";

export interface ExamPaths {
	root: string;
	folder: string;
	dir: string;
	meta: string;
	sources: string;
	topics: string;
	planJson: string;
	planMarkdown: string;
	questions: string;
	progressJson: string;
	progressMarkdown: string;
	sessionsDir: string;
	resultsDir: string;
	certificatesDir: string;
}

export function certPrepDir(root: string): string {
	return path.join(root, CERT_PREP_DIR);
}

export function configFile(root: string): string {
	return path.join(certPrepDir(root), "config.json");
}

export function conflictsDir(root: string): string {
	return path.join(certPrepDir(root), "conflicts");
}

export function examDir(root: string, folder: string): string {
	return path.join(root, folder);
}

export function examPaths(root: string, folder: string): ExamPaths {
	const dir = examDir(root, folder);
	return {
		root,
		folder,
		dir,
		meta: path.join(dir, "meta.json"),
		sources: path.join(dir, "sources.json"),
		topics: path.join(dir, "topics.md"),
		planJson: path.join(dir, "plan.json"),
		planMarkdown: path.join(dir, "plan.md"),
		questions: path.join(dir, "questions.json"),
		progressJson: path.join(dir, "progress.json"),
		progressMarkdown: path.join(dir, "progress.md"),
		sessionsDir: path.join(dir, "sessions"),
		resultsDir: path.join(dir, "results"),
		certificatesDir: path.join(dir, "certificates"),
	};
}

/** Zero-padded to at least two digits: 7 -> "07", 123 -> "123". */
export function padDay(day: number): string {
	const safe = Math.max(0, Math.floor(Number.isFinite(day) ? day : 0));
	return String(safe).padStart(2, "0");
}

export function slugify(text: string): string {
	const slug = text
		.normalize("NFKD")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return slug.length > 0 ? slug : "untitled";
}

export function dayFileName(day: number, slug: string): string {
	return `day-${padDay(day)}-${slugify(slug)}.md`;
}

export function sessionFile(root: string, folder: string, day: number, slug: string): string {
	return path.join(examPaths(root, folder).sessionsDir, dayFileName(day, slug));
}

/** Matches any session note for a day regardless of its slug. */
export function isSessionFileForDay(fileName: string, day: number): boolean {
	return fileName.startsWith(`day-${padDay(day)}-`) && fileName.endsWith(".md");
}

export function dayResultFileName(day: number): string {
	return `day-${padDay(day)}.json`;
}

export function dayResultFile(root: string, folder: string, day: number): string {
	return path.join(examPaths(root, folder).resultsDir, dayResultFileName(day));
}
