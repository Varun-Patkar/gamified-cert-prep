import * as assert from "assert";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import type { ExamMeta } from "../model/types";
import {
	earliestIsoDate,
	migrateLegacyExams,
	parseReadmeCertifications,
	titleFromTopics,
} from "../store/migration";

const README = `# Microsoft Certification Exam Prep

## Certifications Earned with Help of Agent

| Exam | Certification | Credential | Score Report |
|------|---------------|------------|--------------|
| **DP-800** | Microsoft Certified: SQL AI Developer Associate | [View credential](https://learn.microsoft.com/api/credentials/share/en-gb/VarunPatkar/2EC3461E6479548) | [View PDF](DP-800%20Prep/DP-800-score-report.pdf) |
| **GH-300** | GitHub Certified: GitHub Copilot | [View credential](https://learn.microsoft.com/api/credentials/share/en-gb/VarunPatkar/857C8CC1F8AB312A) | [View PDF](GH-300%20Prep/GH-300-score-report.pdf) |

## How It Works

| Agent | Role |
|-------|------|
| **CertResearcher** | Subagent |
`;

describe("parseReadmeCertifications", () => {
	it("reads code, certification, credential and score report", () => {
		const rows = parseReadmeCertifications(README);
		const dp = rows.get("DP-800");
		assert.ok(dp);
		assert.strictEqual(dp.certification, "Microsoft Certified: SQL AI Developer Associate");
		assert.ok(dp.credentialUrl?.startsWith("https://learn.microsoft.com/"));
		assert.strictEqual(dp.scoreReportFile, "DP-800 Prep/DP-800-score-report.pdf");
	});

	it("derives the vendor from the certification name rather than the exam code", () => {
		const rows = parseReadmeCertifications(README);
		assert.strictEqual(rows.get("DP-800")?.vendor, "Microsoft");
		assert.strictEqual(rows.get("GH-300")?.vendor, "GitHub");
	});

	it("ignores table rows that are not exam rows", () => {
		const rows = parseReadmeCertifications(README);
		assert.deepStrictEqual([...rows.keys()].sort(), ["DP-800", "GH-300"]);
	});

	it("returns nothing for a readme without a table", () => {
		assert.strictEqual(parseReadmeCertifications("# Just prose\n").size, 0);
	});
});

describe("titleFromTopics", () => {
	it("strips the trailing topics suffix and the exam code", () => {
		assert.strictEqual(
			titleFromTopics("# Agentic AI Business Solutions Architect (AB-100) - Topics\n", "AB-100"),
			"Agentic AI Business Solutions Architect",
		);
	});

	it("handles an em dash separator", () => {
		assert.strictEqual(titleFromTopics("# GitHub Copilot (GH-300) — Topics\n", "GH-300"), "GitHub Copilot");
	});

	it("returns undefined when there is no heading", () => {
		assert.strictEqual(titleFromTopics("no heading here\n", "AI-102"), undefined);
	});
});

describe("earliestIsoDate", () => {
	it("finds the earliest iso date regardless of log layout", () => {
		const log = "### Day 2 — 2026-08-13 — foo\n### Day 1 (2026-08-12) - bar\n| 29 | 2026-09-05 | x |\n";
		assert.strictEqual(earliestIsoDate(log), "2026-08-12");
	});

	it("returns undefined for logs with no iso dates", () => {
		assert.strictEqual(earliestIsoDate("### Day 1, Session 1 — Sun Apr 26 (Objects)\n"), undefined);
	});
});

describe("migrateLegacyExams", () => {
	let root: string;

	const readMeta = async (folder: string): Promise<ExamMeta> =>
		JSON.parse(await fs.readFile(path.join(root, folder, "meta.json"), "utf8")) as ExamMeta;

	beforeEach(async () => {
		root = await fs.mkdtemp(path.join(os.tmpdir(), "certprep-migrate-"));
		await fs.writeFile(path.join(root, "README.md"), README, "utf8");

		await fs.mkdir(path.join(root, "DP-800 Prep"), { recursive: true });
		await fs.writeFile(
			path.join(root, "DP-800 Prep", "topics.md"),
			"# Developing AI-Enabled Database Solutions (DP-800) - Topics\n",
			"utf8",
		);
		await fs.writeFile(
			path.join(root, "DP-800 Prep", "progress.md"),
			"### Day 1 (2026-04-26) - Objects\n### Day 2 (2026-04-27) - More\n",
			"utf8",
		);

		await fs.mkdir(path.join(root, "AB-100 Prep"), { recursive: true });
		await fs.writeFile(
			path.join(root, "AB-100 Prep", "topics.md"),
			"# Agentic AI Business Solutions Architect (AB-100) - Topics\n",
			"utf8",
		);
		await fs.writeFile(
			path.join(root, "AB-100 Prep", "progress.md"),
			"### Day 1 — 2026-08-12 — Orientation\n",
			"utf8",
		);

		await fs.mkdir(path.join(root, "extension"), { recursive: true });
	});

	afterEach(async () => {
		await fs.rm(root, { recursive: true, force: true });
	});

	it("marks an exam listed in the readme as a completed legacy trophy", async () => {
		await migrateLegacyExams(root);
		const dp = await readMeta("DP-800 Prep");

		assert.strictEqual(dp.code, "DP-800");
		assert.strictEqual(dp.folder, "DP-800 Prep");
		assert.strictEqual(dp.vendor, "Microsoft");
		assert.strictEqual(dp.title, "Microsoft Certified: SQL AI Developer Associate");
		assert.strictEqual(dp.status, "completed");
		assert.strictEqual(dp.legacy, true);
		assert.strictEqual(dp.gamified, false);
		assert.strictEqual(dp.result?.passed, true);
		assert.ok(dp.result?.credentialUrl);
		assert.strictEqual(dp.result?.scoreReportFile, "DP-800 Prep/DP-800-score-report.pdf");
		assert.strictEqual(dp.createdAt, "2026-04-26");
	});

	it("treats an exam missing from the readme as in-progress and gamified", async () => {
		await migrateLegacyExams(root);
		const ab = await readMeta("AB-100 Prep");

		assert.strictEqual(ab.status, "in-progress");
		assert.strictEqual(ab.legacy, false);
		assert.strictEqual(ab.gamified, true);
		assert.strictEqual(ab.vendor, "Unknown");
		assert.strictEqual(ab.title, "Agentic AI Business Solutions Architect");
		assert.strictEqual(ab.result, undefined);
		assert.strictEqual(ab.createdAt, "2026-08-12");
	});

	it("only touches folders named '<something> Prep'", async () => {
		const migrated = await migrateLegacyExams(root);
		assert.deepStrictEqual(
			migrated.map((m) => m.code),
			["AB-100", "DP-800"],
		);
		await assert.rejects(fs.access(path.join(root, "extension", "meta.json")));
	});

	it("falls back to today when the log has no parseable date", async () => {
		await fs.writeFile(path.join(root, "AB-100 Prep", "progress.md"), "### Day 1, Session 1 — Sun Apr 26\n", "utf8");
		await migrateLegacyExams(root);
		const ab = await readMeta("AB-100 Prep");
		assert.strictEqual(ab.createdAt, new Date().toISOString().slice(0, 10));
	});

	it("is idempotent: a second run does not overwrite an existing meta.json", async () => {
		await migrateLegacyExams(root);
		const first = await readMeta("DP-800 Prep");

		const edited = { ...first, title: "Hand edited title", gamified: true };
		const editedRaw = `${JSON.stringify(edited, null, 2)}\n`;
		await fs.writeFile(path.join(root, "DP-800 Prep", "meta.json"), editedRaw, "utf8");

		const second = await migrateLegacyExams(root);
		const after = await fs.readFile(path.join(root, "DP-800 Prep", "meta.json"), "utf8");

		assert.strictEqual(after, editedRaw);
		assert.strictEqual(second.length, 2);
		assert.strictEqual(second.find((m) => m.code === "DP-800")?.title, "Hand edited title");
	});

	it("does not clobber a meta.json it cannot parse", async () => {
		await fs.writeFile(path.join(root, "AB-100 Prep", "meta.json"), "{ broken", "utf8");
		const migrated = await migrateLegacyExams(root);

		assert.strictEqual(await fs.readFile(path.join(root, "AB-100 Prep", "meta.json"), "utf8"), "{ broken");
		assert.deepStrictEqual(
			migrated.map((m) => m.code),
			["DP-800"],
		);
	});

	it("writes pretty-printed json with a trailing newline", async () => {
		await migrateLegacyExams(root);
		const raw = await fs.readFile(path.join(root, "AB-100 Prep", "meta.json"), "utf8");
		assert.ok(raw.endsWith("}\n"));
		assert.ok(raw.includes('\n  "code": "AB-100"'));
	});

	it("survives a repo with no readme at all", async () => {
		await fs.rm(path.join(root, "README.md"));
		const migrated = await migrateLegacyExams(root);
		assert.strictEqual(migrated.length, 2);
		assert.ok(migrated.every((m) => m.vendor === "Unknown"));
	});
});
