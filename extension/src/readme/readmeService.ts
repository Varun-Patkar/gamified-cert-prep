/** Keeps the repo README's certification table in step with the exam folders. */

import * as fs from "fs/promises";
import * as path from "path";
import type { ExamMeta } from "../model/types";
import { renderCertTable, updateReadme } from "./readmeTable";

/** Returns true when the README actually changed, so callers only sync real edits. */
export async function regenerateReadme(root: string, exams: readonly ExamMeta[]): Promise<boolean> {
	const file = path.join(root, "README.md");
	let existing: string;
	try {
		existing = await fs.readFile(file, "utf8");
	} catch {
		return false;
	}
	const next = updateReadme(existing, renderCertTable(exams));
	if (next === existing) {
		return false;
	}
	await fs.writeFile(file, next, "utf8");
	return true;
}
