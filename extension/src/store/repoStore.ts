/**
 * All repo I/O. Deliberately uses node `fs/promises` rather than `vscode.workspace.fs`
 * so the store can be exercised in plain mocha without a VS Code host.
 */

import type { Dirent } from "fs";
import * as fs from "fs/promises";
import * as path from "path";
import type {
	DayResult,
	ExamMeta,
	Plan,
	Progress,
	QuestionBank,
	SourceRef,
	UserProfile,
} from "../model/types";
import {
	configFile,
	dayFileName,
	dayResultFile,
	examPaths,
	isSessionFileForDay,
	sessionFile,
} from "./paths";

function todayIso(): string {
	return new Date().toISOString().slice(0, 10);
}

export function emptyProgress(examId: string): Progress {
	return {
		schemaVersion: 1,
		examId,
		completedDays: [],
		results: [],
		xp: 0,
		streak: { current: 0, longest: 0, freezeTokens: 0 },
		badges: [],
		unlockedTiers: [],
		domainCertificates: [],
	};
}

export function defaultProfile(createdAt = todayIso()): UserProfile {
	return { schemaVersion: 1, lifetimeXp: 0, badges: [], createdAt };
}

export class RepoStore {
	constructor(public readonly root: string) {}

	async isCertPrepRepo(): Promise<boolean> {
		return exists(configFile(this.root));
	}

	async initRepo(): Promise<void> {
		if (await this.isCertPrepRepo()) {
			return;
		}
		await writeJson(configFile(this.root), defaultProfile());
	}

	async readProfile(): Promise<UserProfile | undefined> {
		return readJson<UserProfile>(configFile(this.root));
	}

	async writeProfile(profile: UserProfile): Promise<void> {
		await writeJson(configFile(this.root), profile);
	}

	async listExams(): Promise<ExamMeta[]> {
		const entries = await readDir(this.root);
		const metas: ExamMeta[] = [];
		for (const entry of entries) {
			if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "node_modules") {
				continue;
			}
			const meta = await this.readMeta(entry.name);
			if (meta) {
				metas.push(meta);
			}
		}
		return metas.sort((a, b) => a.code.localeCompare(b.code));
	}

	async readMeta(folder: string): Promise<ExamMeta | undefined> {
		const meta = await readJson<ExamMeta>(examPaths(this.root, folder).meta);
		return meta && typeof meta.code === "string" ? meta : undefined;
	}

	async writeMeta(meta: ExamMeta): Promise<void> {
		await writeJson(examPaths(this.root, meta.folder).meta, meta);
	}

	async readPlan(folder: string): Promise<Plan | undefined> {
		return readJson<Plan>(examPaths(this.root, folder).planJson);
	}

	async writePlan(folder: string, plan: Plan): Promise<void> {
		await writeJson(examPaths(this.root, folder).planJson, plan);
	}

	async readProgress(folder: string): Promise<Progress> {
		const stored = await readJson<Progress>(examPaths(this.root, folder).progressJson);
		if (!stored || !Array.isArray(stored.results) || !Array.isArray(stored.completedDays)) {
			const meta = await this.readMeta(folder);
			return emptyProgress(meta?.id ?? folder);
		}
		return stored;
	}

	async writeProgress(folder: string, progress: Progress): Promise<void> {
		await writeJson(examPaths(this.root, folder).progressJson, progress);
	}

	async readSources(folder: string): Promise<SourceRef[]> {
		const sources = await readJson<SourceRef[]>(examPaths(this.root, folder).sources);
		return Array.isArray(sources) ? sources : [];
	}

	async writeSources(folder: string, sources: SourceRef[]): Promise<void> {
		await writeJson(examPaths(this.root, folder).sources, sources);
	}

	async readTopics(folder: string): Promise<string | undefined> {
		return readText(examPaths(this.root, folder).topics);
	}

	async writeTopics(folder: string, markdown: string): Promise<void> {
		await writeText(examPaths(this.root, folder).topics, markdown.endsWith("\n") ? markdown : `${markdown}\n`);
	}

	async writePlanMarkdown(folder: string, markdown: string): Promise<void> {
		await writeText(
			examPaths(this.root, folder).planMarkdown,
			markdown.endsWith("\n") ? markdown : `${markdown}\n`
		);
	}

	async readQuestions(folder: string): Promise<QuestionBank | undefined> {
		const bank = await readJson<QuestionBank>(examPaths(this.root, folder).questions);
		return bank && Array.isArray(bank.domains) ? bank : undefined;
	}

	async writeQuestions(folder: string, questions: QuestionBank): Promise<void> {
		await writeJson(examPaths(this.root, folder).questions, questions);
	}

	async readSessionMaterial(folder: string, day: number): Promise<string | undefined> {
		const dir = examPaths(this.root, folder).sessionsDir;
		const entries = await readDir(dir);
		const match = entries.find((entry) => entry.isFile() && isSessionFileForDay(entry.name, day));
		if (!match) {
			return undefined;
		}
		return readText(path.join(dir, match.name));
	}

	async writeSessionMaterial(folder: string, day: number, slug: string, markdown: string): Promise<string> {
		const target = sessionFile(this.root, folder, day, slug);
		await writeText(target, markdown);
		return path.join("sessions", dayFileName(day, slug));
	}

	/** Appends the attempt to `results/day-NN.json` and folds it into `progress.json`. */
	async appendDayResult(folder: string, result: DayResult): Promise<DayResult[]> {
		const file = dayResultFile(this.root, folder, result.day);
		const existing = (await readJson<DayResult[]>(file)) ?? [];
		const attempts = Array.isArray(existing) ? [...existing, result] : [result];
		await writeJson(file, attempts);

		const progress = await this.readProgress(folder);
		progress.results = [...progress.results, result];
		if (!progress.completedDays.includes(result.day)) {
			progress.completedDays = [...progress.completedDays, result.day].sort((a, b) => a - b);
		}
		progress.xp += result.xpAwarded;
		await this.writeProgress(folder, progress);

		return attempts;
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

/** Never throws: a hand-edited or half-synced file must not take the extension down. */
async function readJson<T>(file: string): Promise<T | undefined> {
	const raw = await readText(file);
	if (raw === undefined) {
		return undefined;
	}
	try {
		const parsed = JSON.parse(raw) as T;
		return parsed === null ? undefined : parsed;
	} catch {
		return undefined;
	}
}

async function writeText(file: string, contents: string): Promise<void> {
	await fs.mkdir(path.dirname(file), { recursive: true });
	await fs.writeFile(file, contents, "utf8");
}

/** Pretty-printed with a trailing newline so git diffs stay reviewable. */
async function writeJson(file: string, value: unknown): Promise<void> {
	const indent = detectJsonIndent(await readText(file)) ?? 2;
	await writeText(file, `${JSON.stringify(value, null, indent)}\n`);
}

/**
 * Indentation of the first indented line of an existing JSON document. Hand-written banks in this
 * repo are tab-indented; rewriting them at two spaces would produce an enormous spurious diff.
 */
export function detectJsonIndent(raw: string | undefined): string | number | undefined {
	if (!raw) {
		return undefined;
	}
	const match = /\r?\n([ \t]+)\S/.exec(raw);
	if (!match) {
		return undefined;
	}
	return match[1].includes("\t") ? "\t" : match[1].length;
}
