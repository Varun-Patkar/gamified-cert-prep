import * as assert from "assert";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import type { ExamMeta, Plan, Progress } from "../model/types";
import {
	buildLegacyImport,
	importLegacyExam,
	inferDayKind,
	inferDomainId,
	parseDayHeadings,
	parseDayTable,
	parseTopicsDomains,
} from "../store/legacyImport";

/** AB-100 dialect: em-dash heading, `- Status:` and `- Accuracy: 6 / 6 (100%)`. */
const AB_PROGRESS = `# Progress Tracker: Agentic AI (AB-100)

## Overall

- Exam Date: 2026-09-12 (Sat, 9:00 AM IST)
- Sessions Completed: 2 / 3

## Daily Log

### Day 1 — 2026-08-12 — Orientation & AI Strategy Foundations

- Status: Completed
- Quiz: N/A (practice bank starts Day 2)
- Accuracy: N/A

### Day 2 — 2026-08-13 — D1.1 Analyze Requirements

- Status: Completed
- Quiz: 6 targeted Domain 1 questions
- Accuracy: 6 / 6 (100%) — perfect score

### Day 3 — 2026-08-14 — D1.2 Multi-Agent Platform Strategy

- Status: Planned
`;

const AB_PLAN = `# Study Plan (AB-100)

## Summary

- Start Date: 2026-08-12 (Wednesday)
- Target Exam Date: 2026-09-12 (Saturday)

## Daily Schedule

#### Day 1 (2026-08-12, Wed) — Orientation & AI Strategy Foundations

- [x] Read topics.md

#### Day 2 (2026-08-13, Thu) — D1.1 Analyze Requirements

#### Day 3 (2026-08-14, Fri) — D1.2 Multi-Agent Platform Strategy
`;

/** AI-102 dialect: parenthesised date, hyphen separator, `- Correct: 12 / 14 (85.7%)`. */
const AI_PROGRESS = `# Progress Tracker (AI-102)

## Daily Log

### Day 1 (2026-05-06) - Domain 1: Service Selection

- Status: Completed
- Questions Attempted: 14 (graded) + 2 skipped
- Correct: 12 / 14 (85.7%)

### Day 2 (2026-05-07) - Domain 2: Deployment Planning

- Status: Completed
- Correct: 10 / 10 (100%)
`;

/** GH-300 dialect: the daily log is a table. */
const GH_PROGRESS = `# Progress Tracker (GH-300)

## Daily Log

| Day | Date       | Topic                     | Q   | Correct | Accuracy | Notes            |
| --- | ---------- | ------------------------- | --- | ------- | -------- | ---------------- |
| 1   | 2026-07-09 | D1 Responsible AI         | 29  | 28      | 96.6%    | Wrong: q027      |
| 2   | 2026-07-10 | D2 Copilot Plans          | 23  | 22      | 95.7%    | Wrong: q053      |
| 3   | 2026-07-11 | Mock Round 1              | 26  | 23      | 88.5%    | Solid            |
| 4   | 2026-07-12 | Rest Day / Exam Logistics | —   | —       | —        | No quiz          |
`;

/** DP-800 dialect: no ISO dates in the log, several sessions per day. */
const DP_PLAN = `# Study Plan: DP-800

## Summary
- **Start Date:** 2026-04-26 (Sunday)
- **Exam Date:** 2026-05-04 (Monday)

## Daily Schedule

### Day 1 — Sunday, Apr 26 (4 hrs) — Domain 1: Core SQL Refresh

### Day 2 — Monday, Apr 27 (1 hr) — 2.1 Data Security & Compliance
`;

const DP_PROGRESS = `# Progress Tracker: DP-800

## Daily Log

### Day 1, Session 1 — Sun Apr 26 (Database Objects + Programmability)
- **Questions:** 8 answered, 2 skipped
- **Result:** 8/8 correct (100%)

### Day 1, Session 2 — Sun Apr 26 (Advanced T-SQL)
- **Result:** 11/11 correct (100%)

### Day 2, Session 1 — Sun Apr 27 (Data Security & Compliance)
- **Result:** 9/9 correct (100%)
`;

const TOPICS = `# Exam Topics

## Domain 1: Plan AI-powered business solutions (25–30%)

### 1.1 Analyze requirements
- bullet

### 1.2 Design overall AI strategy
- bullet

## Domain 2: Deploy AI-powered business solutions (40–45%)

### 2.1 Monitor and tune
- bullet
`;

describe("parseDayHeadings", () => {
	it("reads the AB-100 em-dash dialect with status and accuracy lines", () => {
		const entries = parseDayHeadings(AB_PROGRESS);
		assert.strictEqual(entries.length, 3);
		assert.deepStrictEqual(
			entries.map((entry) => [entry.day, entry.date, entry.title, entry.completed]),
			[
				[1, "2026-08-12", "Orientation & AI Strategy Foundations", true],
				[2, "2026-08-13", "D1.1 Analyze Requirements", true],
				[3, "2026-08-14", "D1.2 Multi-Agent Platform Strategy", false],
			],
		);
		assert.strictEqual(entries[1].correct, 6);
		assert.strictEqual(entries[1].questionsAnswered, 6);
		assert.strictEqual(entries[1].accuracy, 1);
	});

	it("reads the AI-102 parenthesised-date dialect with a Correct line", () => {
		const entries = parseDayHeadings(AI_PROGRESS);
		assert.deepStrictEqual(
			entries.map((entry) => [entry.day, entry.date, entry.title]),
			[
				[1, "2026-05-06", "Domain 1: Service Selection"],
				[2, "2026-05-07", "Domain 2: Deployment Planning"],
			],
		);
		assert.strictEqual(entries[0].correct, 12);
		assert.strictEqual(entries[0].questionsAnswered, 14);
		assert.ok(Math.abs((entries[0].accuracy ?? 0) - 12 / 14) < 1e-9);
	});

	it("reads the DP-800 month-name dialect and merges sessions of the same day", () => {
		const entries = parseDayHeadings(DP_PROGRESS, 2026);
		assert.strictEqual(entries.length, 2);
		assert.strictEqual(entries[0].day, 1);
		assert.strictEqual(entries[0].date, "2026-04-26");
		assert.strictEqual(entries[0].title, "Database Objects + Programmability");
		assert.strictEqual(entries[0].questionsAnswered, 19);
		assert.strictEqual(entries[0].correct, 19);
		assert.strictEqual(entries[0].completed, true);
	});

	it("reads a struck-through plan heading with an inline score", () => {
		const entries = parseDayHeadings(
			"### ~~Day 4 (2026-07-12) — Domain 2: Agent Mode, Edit Mode, MCP~~ ✅ 24/26 (92.3%)\n",
		);
		assert.strictEqual(entries.length, 1);
		assert.strictEqual(entries[0].title, "Domain 2: Agent Mode, Edit Mode, MCP");
		assert.strictEqual(entries[0].correct, 24);
		assert.strictEqual(entries[0].completed, true);
	});

	it("returns nothing rather than throwing for junk input", () => {
		assert.deepStrictEqual(parseDayHeadings(undefined), []);
		assert.deepStrictEqual(parseDayHeadings("### Day banana (nope)\n#### Day\n| | |\n"), []);
		assert.deepStrictEqual(parseDayHeadings("\u0000\u0001 ### Day -3 —\n"), []);
	});
});

describe("parseDayTable", () => {
	it("reads the GH-300 table log", () => {
		const entries = parseDayTable(GH_PROGRESS);
		assert.strictEqual(entries.length, 4);
		assert.deepStrictEqual(entries.map((entry) => entry.day), [1, 2, 3, 4]);
		assert.strictEqual(entries[0].date, "2026-07-09");
		assert.strictEqual(entries[0].title, "D1 Responsible AI");
		assert.strictEqual(entries[0].correct, 28);
		assert.strictEqual(entries[0].questionsAnswered, 29);
		assert.ok(entries.every((entry) => entry.completed));
	});

	it("keeps a dashed row as completed with no score", () => {
		const rest = parseDayTable(GH_PROGRESS)[3];
		assert.strictEqual(rest.questionsAnswered, undefined);
		assert.strictEqual(rest.correct, undefined);
	});

	it("ignores tables that are not a daily log", () => {
		assert.deepStrictEqual(parseDayTable("| Domain | Weight |\n| --- | --- |\n| D1 | 20% |\n"), []);
		assert.deepStrictEqual(parseDayTable(undefined), []);
	});
});

describe("parseTopicsDomains", () => {
	it("keeps numeric domain ids and normalises weights to 100", () => {
		const { domains, topicTitles } = parseTopicsDomains(TOPICS);
		assert.deepStrictEqual(domains.map((domain) => domain.id), ["1", "2"]);
		assert.strictEqual(domains[0].title, "Plan AI-powered business solutions");
		assert.ok(Math.abs(domains[0].weight + domains[1].weight - 100) < 0.2);
		assert.deepStrictEqual(domains[0].topicIds, ["t-1-1", "t-1-2"]);
		assert.strictEqual(topicTitles["t-2-1"], "Monitor and tune");
	});

	it("survives markdown with no domains", () => {
		assert.deepStrictEqual(parseTopicsDomains("# nothing here\n"), { domains: [], topicTitles: {} });
	});
});

describe("inferDayKind / inferDomainId", () => {
	it("classifies day kinds from the title", () => {
		assert.strictEqual(inferDayKind("D1.1 Analyze Requirements"), "study");
		assert.strictEqual(inferDayKind("Domain 2 Review"), "review");
		assert.strictEqual(inferDayKind("Full Mock Simulation"), "mock");
		assert.strictEqual(inferDayKind("Rest Day / Exam Logistics"), "buffer");
		assert.strictEqual(inferDayKind("EXAM DAY"), "exam");
		assert.strictEqual(inferDayKind(undefined), "study");
	});

	it("reads the leading domain number only when the domain exists", () => {
		const domains = parseTopicsDomains(TOPICS).domains;
		assert.strictEqual(inferDomainId("D1.1 Analyze Requirements", domains), "1");
		assert.strictEqual(inferDomainId("Domain 2: Design", domains), "2");
		assert.strictEqual(inferDomainId("2.1 Data Security & Compliance", domains), "2");
		assert.strictEqual(inferDomainId("Domain 6: Nope", domains), undefined);
		assert.strictEqual(inferDomainId("Mock Round 1 (All Domains)", domains), undefined);
	});
});

describe("buildLegacyImport", () => {
	it("builds a plan sized by day-assignments and completed days from the log", () => {
		const { plan, progress, metaPatch } = buildLegacyImport({
			examId: "ab-100",
			planMarkdown: AB_PLAN,
			progressMarkdown: AB_PROGRESS,
			topicsMarkdown: TOPICS,
			dayAssignments: { totalDays: 5, dayTargets: { "2": 6 } },
			sessionFiles: ["day-01-orientation-ai-strategy.md", "day-02-analyze-requirements.md"],
			today: "2026-09-01",
		});

		assert.strictEqual(plan.days.length, 5);
		assert.deepStrictEqual(progress.completedDays, [1, 2]);
		assert.strictEqual(plan.days[0].sessionFile, "sessions/day-01-orientation-ai-strategy.md");
		assert.strictEqual(plan.days[0].date, "2026-08-12");
		assert.strictEqual(plan.days[1].title, "D1.1 Analyze Requirements");
		assert.strictEqual(plan.days[1].domainId, "1");
		assert.strictEqual(plan.days[1].questionCount, 6);
		// Days past the log still get a sequential date and a session file name.
		assert.strictEqual(plan.days[4].date, "2026-08-16");
		assert.ok(plan.days[4].sessionFile.startsWith("sessions/day-05-"));
		assert.strictEqual(plan.config.startDate, "2026-08-12");
		assert.strictEqual(plan.config.examDate, "2026-09-12");
		assert.strictEqual(metaPatch.examDate, "2026-09-12");
		assert.strictEqual(metaPatch.domains?.length, 2);
	});

	it("awards no XP and no badges for imported history", () => {
		const { progress } = buildLegacyImport({
			examId: "ai-102",
			progressMarkdown: AI_PROGRESS,
			today: "2026-09-01",
		});
		assert.strictEqual(progress.xp, 0);
		assert.deepStrictEqual(progress.badges, []);
		assert.deepStrictEqual(progress.unlockedTiers, []);
		assert.deepStrictEqual(progress.domainCertificates, []);
		assert.ok(progress.results.every((result) => result.xpAwarded === 0));
		assert.ok(progress.results.every((result) => result.attempt === 1));
		assert.strictEqual(progress.streak.current, 0);
		assert.strictEqual(progress.streak.longest, 2);
	});

	it("handles the GH-300 table format end to end", () => {
		const { plan, progress } = buildLegacyImport({
			examId: "gh-300",
			progressMarkdown: GH_PROGRESS,
			dayAssignments: { totalDays: 4 },
			sessionFiles: ["day-01-responsible-ai.md"],
			today: "2026-09-01",
		});
		assert.strictEqual(plan.days.length, 4);
		assert.deepStrictEqual(progress.completedDays, [1, 2, 3, 4]);
		assert.strictEqual(plan.days[2].kind, "mock");
		assert.strictEqual(plan.days[3].kind, "buffer");
		assert.strictEqual(progress.results[0].correct, 28);
		assert.strictEqual(progress.results[3].questionsAnswered, 0);
	});

	it("handles the DP-800 format with no ISO dates in the log", () => {
		const { plan, progress } = buildLegacyImport({
			examId: "dp-800",
			planMarkdown: DP_PLAN,
			progressMarkdown: DP_PROGRESS,
			today: "2026-09-01",
		});
		assert.strictEqual(plan.days.length, 2);
		assert.strictEqual(plan.config.startDate, "2026-04-26");
		assert.strictEqual(plan.days[0].date, "2026-04-26");
		assert.strictEqual(plan.days[0].title, "Domain 1: Core SQL Refresh");
		assert.deepStrictEqual(progress.completedDays, [1, 2]);
		assert.strictEqual(progress.results[0].questionsAnswered, 19);
	});

	it("produces an empty but valid result when there is nothing to read", () => {
		const { plan, progress } = buildLegacyImport({ examId: "x-000", today: "2026-09-01" });
		assert.deepStrictEqual(plan.days, []);
		assert.deepStrictEqual(progress.completedDays, []);
		assert.strictEqual(plan.config.startDate, "2026-09-01");
	});

	it("does not throw on wildly malformed markdown", () => {
		assert.doesNotThrow(() =>
			buildLegacyImport({
				examId: "x-000",
				planMarkdown: "### Day\n#### Day ---- (((\n| | | |\n",
				progressMarkdown: "### Day 1 — — —\n- Status:\n- Accuracy: /\n",
				topicsMarkdown: "## Domain\n### 1.\n",
				dayAssignments: "not an object",
				sessionFiles: ["notes.md", "day-xx-foo.md"],
				today: "2026-09-01",
			}),
		);
	});
});

describe("importLegacyExam", () => {
	let root: string;

	const meta: ExamMeta = {
		schemaVersion: 1,
		id: "ab-100",
		vendor: "Microsoft",
		code: "AB-100",
		title: "Agentic AI",
		status: "in-progress",
		legacy: false,
		gamified: true,
		folder: "AB-100 Prep",
		createdAt: "2026-08-12",
	};

	beforeEach(async () => {
		root = await fs.mkdtemp(path.join(os.tmpdir(), "legacy-import-"));
		const dir = path.join(root, meta.folder);
		await fs.mkdir(path.join(dir, "sessions"), { recursive: true });
		await fs.writeFile(path.join(dir, "plan.md"), AB_PLAN, "utf8");
		await fs.writeFile(path.join(dir, "progress.md"), AB_PROGRESS, "utf8");
		await fs.writeFile(path.join(dir, "topics.md"), TOPICS, "utf8");
		await fs.writeFile(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2), "utf8");
		await fs.writeFile(path.join(dir, "sessions", "day-01-orientation.md"), "# Day 1\n", "utf8");
	});

	afterEach(async () => {
		await fs.rm(root, { recursive: true, force: true });
	});

	const read = async <T>(name: string): Promise<T> =>
		JSON.parse(await fs.readFile(path.join(root, meta.folder, name), "utf8")) as T;

	it("writes plan.json and progress.json from the markdown history", async () => {
		const outcome = await importLegacyExam(root, meta);
		assert.ok(outcome);
		assert.strictEqual(outcome.wrotePlan, true);
		assert.strictEqual(outcome.wroteProgress, true);

		const plan = await read<Plan>("plan.json");
		const progress = await read<Progress>("progress.json");
		assert.strictEqual(plan.days.length, 3);
		assert.deepStrictEqual(progress.completedDays, [1, 2]);
		assert.strictEqual(progress.xp, 0);
	});

	it("fills examDate and domains on meta.json", async () => {
		await importLegacyExam(root, meta);
		const written = await read<ExamMeta>("meta.json");
		assert.strictEqual(written.examDate, "2026-09-12");
		assert.deepStrictEqual(written.domains?.map((domain) => domain.id), ["1", "2"]);
		assert.strictEqual(written.topicTitles?.["t-1-1"], "Analyze requirements");
	});

	it("never overwrites an existing plan.json or progress.json", async () => {
		const dir = path.join(root, meta.folder);
		await fs.writeFile(path.join(dir, "plan.json"), '{"mine":true}', "utf8");
		await fs.writeFile(path.join(dir, "progress.json"), '{"mine":true}', "utf8");

		assert.strictEqual(await importLegacyExam(root, meta), undefined);
		assert.strictEqual(await fs.readFile(path.join(dir, "plan.json"), "utf8"), '{"mine":true}');
		assert.strictEqual(await fs.readFile(path.join(dir, "progress.json"), "utf8"), '{"mine":true}');
	});

	it("fills only the missing half when one file already exists", async () => {
		const dir = path.join(root, meta.folder);
		await fs.writeFile(path.join(dir, "plan.json"), '{"mine":true}', "utf8");

		const outcome = await importLegacyExam(root, meta);
		assert.ok(outcome);
		assert.strictEqual(outcome.wrotePlan, false);
		assert.strictEqual(outcome.wroteProgress, true);
		assert.strictEqual(await fs.readFile(path.join(dir, "plan.json"), "utf8"), '{"mine":true}');
	});

	it("imports nothing for a folder with no legacy history", async () => {
		const empty = { ...meta, folder: "ZZ-999 Prep" };
		await fs.mkdir(path.join(root, empty.folder), { recursive: true });
		assert.strictEqual(await importLegacyExam(root, empty), undefined);
	});
});
