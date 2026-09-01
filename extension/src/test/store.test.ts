import * as assert from "assert";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import type { DayResult, ExamMeta, Plan, QuestionBank, SourceRef, UserProfile } from "../model/types";
import {
	certPrepDir,
	configFile,
	conflictsDir,
	dayFileName,
	dayResultFile,
	examPaths,
	isSessionFileForDay,
	padDay,
	sessionFile,
	slugify,
} from "../store/paths";
import { RepoStore, defaultProfile, detectJsonIndent, emptyProgress } from "../store/repoStore";

describe("paths", () => {
	const root = path.join("/tmp", "repo");

	it("slugifies prose into a file-safe slug", () => {
		assert.strictEqual(slugify("Domain 1: Service Selection"), "domain-1-service-selection");
		assert.strictEqual(slugify("  RAG & Grounding!  "), "rag-grounding");
		assert.strictEqual(slugify("ALM/Foundry — Models"), "alm-foundry-models");
	});

	it("never produces an empty slug", () => {
		assert.strictEqual(slugify(""), "untitled");
		assert.strictEqual(slugify("!!!"), "untitled");
	});

	it("zero-pads day numbers to two digits without truncating longer ones", () => {
		assert.strictEqual(padDay(1), "01");
		assert.strictEqual(padDay(7), "07");
		assert.strictEqual(padDay(10), "10");
		assert.strictEqual(padDay(123), "123");
	});

	it("clamps nonsense day numbers instead of throwing", () => {
		assert.strictEqual(padDay(-3), "00");
		assert.strictEqual(padDay(Number.NaN), "00");
		assert.strictEqual(padDay(3.7), "03");
	});

	it("builds day file names", () => {
		assert.strictEqual(dayFileName(7, "foo"), "day-07-foo.md");
		assert.strictEqual(dayFileName(21, "Domain 2 Review"), "day-21-domain-2-review.md");
	});

	it("matches session files for a day regardless of slug", () => {
		assert.ok(isSessionFileForDay("day-07-anything-here.md", 7));
		assert.ok(!isSessionFileForDay("day-17-other.md", 7));
		assert.ok(!isSessionFileForDay("day-07-notes.txt", 7));
	});

	it("lays out every exam artefact under the exam folder", () => {
		const p = examPaths(root, "AI-102 Prep");
		assert.strictEqual(p.meta, path.join(root, "AI-102 Prep", "meta.json"));
		assert.strictEqual(p.sources, path.join(root, "AI-102 Prep", "sources.json"));
		assert.strictEqual(p.topics, path.join(root, "AI-102 Prep", "topics.md"));
		assert.strictEqual(p.planJson, path.join(root, "AI-102 Prep", "plan.json"));
		assert.strictEqual(p.planMarkdown, path.join(root, "AI-102 Prep", "plan.md"));
		assert.strictEqual(p.questions, path.join(root, "AI-102 Prep", "questions.json"));
		assert.strictEqual(p.progressJson, path.join(root, "AI-102 Prep", "progress.json"));
		assert.strictEqual(p.progressMarkdown, path.join(root, "AI-102 Prep", "progress.md"));
		assert.strictEqual(p.sessionsDir, path.join(root, "AI-102 Prep", "sessions"));
		assert.strictEqual(p.resultsDir, path.join(root, "AI-102 Prep", "results"));
		assert.strictEqual(p.certificatesDir, path.join(root, "AI-102 Prep", "certificates"));
	});

	it("places session notes and day results predictably", () => {
		assert.strictEqual(
			sessionFile(root, "GH-300 Prep", 3, "Prompt Crafting"),
			path.join(root, "GH-300 Prep", "sessions", "day-03-prompt-crafting.md"),
		);
		assert.strictEqual(
			dayResultFile(root, "GH-300 Prep", 3),
			path.join(root, "GH-300 Prep", "results", "day-03.json"),
		);
	});

	it("keeps extension state under .certprep", () => {
		assert.strictEqual(certPrepDir(root), path.join(root, ".certprep"));
		assert.strictEqual(configFile(root), path.join(root, ".certprep", "config.json"));
		assert.strictEqual(conflictsDir(root), path.join(root, ".certprep", "conflicts"));
	});
});

describe("RepoStore", () => {
	let root: string;
	let store: RepoStore;

	beforeEach(async () => {
		root = await fs.mkdtemp(path.join(os.tmpdir(), "certprep-store-"));
		store = new RepoStore(root);
	});

	afterEach(async () => {
		await fs.rm(root, { recursive: true, force: true });
	});

	const meta = (over: Partial<ExamMeta> = {}): ExamMeta => ({
		schemaVersion: 1,
		id: "ai-102",
		vendor: "Microsoft",
		code: "AI-102",
		title: "Azure AI Engineer Associate",
		status: "in-progress",
		legacy: false,
		gamified: true,
		folder: "AI-102 Prep",
		createdAt: "2026-05-06",
		...over,
	});

	const result = (over: Partial<DayResult> = {}): DayResult => ({
		day: 1,
		attempt: 1,
		completedAt: "2026-05-06T10:00:00.000Z",
		questionsAnswered: 10,
		correct: 8,
		accuracy: 0.8,
		weakTopicIds: ["1.1"],
		xpAwarded: 185,
		...over,
	});

	it("reports a plain folder as not a cert prep repo until initialised", async () => {
		assert.strictEqual(await store.isCertPrepRepo(), false);
		await store.initRepo();
		assert.strictEqual(await store.isCertPrepRepo(), true);
	});

	it("writes a default profile on init and does not reset it on re-init", async () => {
		await store.initRepo();
		const created = await store.readProfile();
		assert.ok(created);
		assert.strictEqual(created.lifetimeXp, 0);

		await store.writeProfile({ ...created, lifetimeXp: 900, displayName: "Varun" });
		await store.initRepo();

		const after = await store.readProfile();
		assert.strictEqual(after?.lifetimeXp, 900);
		assert.strictEqual(after?.displayName, "Varun");
	});

	it("round-trips a profile", async () => {
		const profile: UserProfile = { ...defaultProfile("2026-01-01"), lifetimeXp: 4_200, badges: ["first-blood"] };
		await store.writeProfile(profile);
		assert.deepStrictEqual(await store.readProfile(), profile);
	});

	it("round-trips meta, plan, sources and questions", async () => {
		const m = meta();
		await store.writeMeta(m);
		assert.deepStrictEqual(await store.readMeta(m.folder), m);

		const plan: Plan = {
			schemaVersion: 1,
			examId: m.id,
			generatedAt: "2026-05-01T00:00:00.000Z",
			config: {
				startDate: "2026-05-06",
				examDate: "2026-06-10",
				hoursPerDay: 1,
				dayPolicy: "all",
				questionsPerDay: 12,
				includeReviewDays: true,
				includeFinalMock: true,
			},
			days: [
				{
					day: 1,
					date: "2026-05-06",
					kind: "study",
					title: "Service Selection",
					domainId: "1",
					topicIds: ["1.1"],
					questionCount: 12,
					sessionFile: "sessions/day-01-service-selection.md",
				},
			],
		};
		await store.writePlan(m.folder, plan);
		assert.deepStrictEqual(await store.readPlan(m.folder), plan);

		const sources: SourceRef[] = [
			{
				id: "objectives",
				title: "AI-102 study guide",
				url: "https://learn.microsoft.com/",
				kind: "official-objectives",
				trusted: true,
			},
		];
		await store.writeSources(m.folder, sources);
		assert.deepStrictEqual(await store.readSources(m.folder), sources);

		const bank: QuestionBank = {
			examCode: "AI-102",
			examName: "Azure AI",
			totalQuestions: 1,
			domains: [
				{
					domainId: "1",
					domainName: "Plan and manage",
					questions: [
						{ id: "q1", question: "Which service?", options: ["A. One", "B. Two"], correctAnswer: "A" },
					],
				},
			],
		};
		await store.writeQuestions(m.folder, bank);
		assert.deepStrictEqual(await store.readQuestions(m.folder), bank);
	});

	it("round-trips progress and returns a zeroed one when missing", async () => {
		await store.writeMeta(meta());

		const fresh = await store.readProgress("AI-102 Prep");
		assert.deepStrictEqual(fresh, emptyProgress("ai-102"));

		fresh.xp = 500;
		fresh.badges = ["streak-5"];
		await store.writeProgress("AI-102 Prep", fresh);
		assert.deepStrictEqual(await store.readProgress("AI-102 Prep"), fresh);
	});

	it("pretty-prints json with a trailing newline", async () => {
		await store.writeMeta(meta());
		const raw = await fs.readFile(examPaths(root, "AI-102 Prep").meta, "utf8");
		assert.ok(raw.endsWith("}\n"));
		assert.ok(raw.includes('\n  "code": "AI-102"'));
	});

	it("returns a missing plan as undefined rather than throwing", async () => {
		assert.strictEqual(await store.readPlan("Nope Prep"), undefined);
		assert.strictEqual(await store.readMeta("Nope Prep"), undefined);
		assert.strictEqual(await store.readQuestions("Nope Prep"), undefined);
		assert.deepStrictEqual(await store.readSources("Nope Prep"), []);
		assert.strictEqual(await store.readProfile(), undefined);
	});

	it("survives malformed json everywhere", async () => {
		const paths = examPaths(root, "Broken Prep");
		await fs.mkdir(paths.dir, { recursive: true });
		for (const file of [paths.meta, paths.planJson, paths.progressJson, paths.sources, paths.questions]) {
			await fs.writeFile(file, "{ this is not json ", "utf8");
		}
		await fs.mkdir(certPrepDir(root), { recursive: true });
		await fs.writeFile(configFile(root), "<<<", "utf8");

		assert.strictEqual(await store.readMeta("Broken Prep"), undefined);
		assert.strictEqual(await store.readPlan("Broken Prep"), undefined);
		assert.strictEqual(await store.readQuestions("Broken Prep"), undefined);
		assert.deepStrictEqual(await store.readSources("Broken Prep"), []);
		assert.deepStrictEqual(await store.readProgress("Broken Prep"), emptyProgress("Broken Prep"));
		assert.strictEqual(await store.readProfile(), undefined);
	});

	it("rejects a meta.json that is valid json but not an exam", async () => {
		const paths = examPaths(root, "Weird Prep");
		await fs.mkdir(paths.dir, { recursive: true });
		await fs.writeFile(paths.meta, '{"hello":"world"}\n', "utf8");
		assert.strictEqual(await store.readMeta("Weird Prep"), undefined);
	});

	it("round-trips session material and finds it by day alone", async () => {
		const relative = await store.writeSessionMaterial("AI-102 Prep", 7, "RAG Fundamentals", "# Day 7\n");
		assert.strictEqual(relative, path.join("sessions", "day-07-rag-fundamentals.md"));
		assert.strictEqual(await store.readSessionMaterial("AI-102 Prep", 7), "# Day 7\n");
		assert.strictEqual(await store.readSessionMaterial("AI-102 Prep", 8), undefined);
	});

	it("accumulates attempts and folds each one into progress", async () => {
		await store.writeMeta(meta());

		const first = await store.appendDayResult("AI-102 Prep", result());
		assert.strictEqual(first.length, 1);

		const second = await store.appendDayResult(
			"AI-102 Prep",
			result({ attempt: 2, correct: 10, accuracy: 1, xpAwarded: 50 }),
		);
		assert.strictEqual(second.length, 2);
		assert.deepStrictEqual(
			second.map((r) => r.attempt),
			[1, 2],
		);

		const stored = JSON.parse(await fs.readFile(dayResultFile(root, "AI-102 Prep", 1), "utf8")) as DayResult[];
		assert.strictEqual(stored.length, 2);

		const progress = await store.readProgress("AI-102 Prep");
		assert.deepStrictEqual(progress.completedDays, [1]);
		assert.strictEqual(progress.results.length, 2);
		assert.strictEqual(progress.xp, 235);
	});

	it("keeps completed days unique and sorted across days", async () => {
		await store.writeMeta(meta());
		await store.appendDayResult("AI-102 Prep", result({ day: 3 }));
		await store.appendDayResult("AI-102 Prep", result({ day: 1 }));
		await store.appendDayResult("AI-102 Prep", result({ day: 3, attempt: 2 }));

		const progress = await store.readProgress("AI-102 Prep");
		assert.deepStrictEqual(progress.completedDays, [1, 3]);
	});

	it("lists only folders that carry a meta.json", async () => {
		await store.writeMeta(meta());
		await store.writeMeta(meta({ id: "gh-300", code: "GH-300", folder: "GH-300 Prep", vendor: "GitHub" }));
		await fs.mkdir(path.join(root, "Nothing Prep"), { recursive: true });
		await fs.mkdir(path.join(root, ".git"), { recursive: true });
		await fs.writeFile(path.join(root, "README.md"), "# hi\n", "utf8");

		const exams = await store.listExams();
		assert.deepStrictEqual(
			exams.map((e) => e.code),
			["AI-102", "GH-300"],
		);
	});

	it("lists nothing for a directory that does not exist", async () => {
		const missing = new RepoStore(path.join(root, "does-not-exist"));
		assert.deepStrictEqual(await missing.listExams(), []);
	});

	describe("json indentation", () => {
		const bank = (): QuestionBank => ({
			examCode: "AI-102",
			domains: [
				{
					domainId: "1",
					domainName: "Plan and manage",
					questions: [{ id: "q001", question: "Why?", options: ["a", "b"], correctAnswer: "a" }],
				},
			],
		});

		const write = async (indent: string | number): Promise<string> => {
			const file = examPaths(root, "AI-102 Prep").questions;
			await fs.mkdir(path.dirname(file), { recursive: true });
			await fs.writeFile(file, `${JSON.stringify(bank(), null, indent)}\n`, "utf8");
			await store.writeQuestions("AI-102 Prep", bank());
			return fs.readFile(file, "utf8");
		};

		it("preserves tab indentation when rewriting a hand-formatted bank", async () => {
			const raw = await write("\t");
			assert.ok(raw.includes('\n\t"examCode": "AI-102"'), raw.slice(0, 80));
			assert.ok(!raw.includes('\n  "examCode"'));
		});

		it("preserves two-space indentation", async () => {
			const raw = await write(2);
			assert.ok(raw.includes('\n  "examCode": "AI-102"'));
			assert.ok(!raw.includes("\n\t"));
		});

		it("preserves four-space indentation", async () => {
			const raw = await write(4);
			assert.ok(raw.includes('\n    "examCode": "AI-102"'));
		});

		it("defaults to two spaces for a brand new file", async () => {
			await store.writeQuestions("New Prep", bank());
			const raw = await fs.readFile(examPaths(root, "New Prep").questions, "utf8");
			assert.ok(raw.includes('\n  "examCode": "AI-102"'));
			assert.ok(raw.endsWith("\n"));
		});

		it("reads the indent of the first indented line, or nothing at all", () => {
			assert.strictEqual(detectJsonIndent('{\n\t"a": 1\n}\n'), "\t");
			assert.strictEqual(detectJsonIndent('{\n  "a": 1\n}\n'), 2);
			assert.strictEqual(detectJsonIndent('{\r\n    "a": 1\r\n}\r\n'), 4);
			assert.strictEqual(detectJsonIndent('{"a":1}'), undefined);
			assert.strictEqual(detectJsonIndent(""), undefined);
			assert.strictEqual(detectJsonIndent(undefined), undefined);
		});
	});
});
