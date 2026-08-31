import * as assert from "assert";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import type { JsonRequest } from "../lm/agentic";
import type { ExamMeta, PlanConfig, SourceRef } from "../model/types";
import {
	countQuestions,
	mergeBanks,
	plannedQuestionCount,
	runNewExamPipeline,
	type PipelineDeps,
	type PipelineStep,
} from "../pipeline/newExamPipeline";
import { examPaths } from "../store/paths";
import { RepoStore } from "../store/repoStore";
import { fakeLm, type FakeLm } from "./fakeLm";

const FOLDER = "AI-102 Prep";

function isoInDays(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return date.toISOString().slice(0, 10);
}

const CONFIG: PlanConfig = {
	startDate: isoInDays(0),
	examDate: isoInDays(12),
	hoursPerDay: 1,
	dayPolicy: "all",
	questionsPerDay: 10,
	includeReviewDays: true,
	includeFinalMock: true,
};

const SOURCES_JSON = {
	sources: [
		{
			title: "Skills measured",
			url: "https://vendor.example/objectives",
			kind: "official-objectives",
			rationale: "The vendor's own list.",
		},
		{ title: "Docs", url: "https://vendor.example/docs", kind: "official-docs" },
	],
};

const TOPICS_JSON = {
	title: "Designing and Implementing an AI Solution",
	vendor: "Contoso",
	code: "AI-102",
	domains: [
		{ title: "Plan", weight: 50, topics: [{ title: "Choose a service" }] },
		{ title: "Build", weight: 50, topics: [{ title: "Ground with RAG" }] },
	],
};

function questionsJson(): unknown {
	return {
		questions: Array.from({ length: 3 }, (_, index) => ({
			question: `Question ${index + 1}?`,
			options: ["A. One", "B. Two", "C. Three", "D. Four"],
			correctAnswer: "A",
			explanation: "Because A.",
			sourceRef: "src-skills-measured",
		})),
	};
}

function router(request: JsonRequest): unknown {
	const hint = request.schemaHint ?? "";
	if (hint.includes('"sources"')) {
		return SOURCES_JSON;
	}
	if (hint.includes('"domains"')) {
		return TOPICS_JSON;
	}
	return questionsJson();
}

interface Harness {
	root: string;
	store: RepoStore;
	deps: PipelineDeps;
	approvals: number;
	checkpoints: string[];
	steps: PipelineStep[];
}

async function makeHarness(overrides: Partial<PipelineDeps> = {}): Promise<Harness> {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), "certprep-pipeline-"));
	const store = new RepoStore(root);
	const harness: Harness = {
		root,
		store,
		approvals: 0,
		checkpoints: [],
		steps: [],
		deps: {} as PipelineDeps,
	};
	harness.deps = {
		store,
		lm: fakeLm({ json: (request) => router(request) }),
		approveSources: async ({ candidates }) => {
			harness.approvals += 1;
			return candidates;
		},
		report: (step) => harness.steps.push(step),
		checkpoint: (message) => {
			harness.checkpoints.push(message);
		},
		...overrides,
	};
	return harness;
}

async function readJson<T>(file: string): Promise<T> {
	return JSON.parse(await fs.readFile(file, "utf8")) as T;
}

async function exists(file: string): Promise<boolean> {
	try {
		await fs.access(file);
		return true;
	} catch {
		return false;
	}
}

describe("pipeline/newExamPipeline", () => {
	const cleanups: string[] = [];

	afterEach(async () => {
		for (const root of cleanups.splice(0)) {
			await fs.rm(root, { recursive: true, force: true });
		}
	});

	async function harness(overrides: Partial<PipelineDeps> = {}): Promise<Harness> {
		const created = await makeHarness(overrides);
		cleanups.push(created.root);
		return created;
	}

	it("writes every artefact and flips the exam to in-progress", async () => {
		const { root, deps, checkpoints } = await harness();
		const outcome = await runNewExamPipeline(
			{ examQuery: "AI-102 AI Engineer", folder: FOLDER, config: CONFIG },
			deps
		);

		assert.strictEqual(outcome.ok, true, outcome.ok ? "" : outcome.message);
		if (!outcome.ok) {
			return;
		}

		const paths = examPaths(root, FOLDER);
		for (const file of [paths.meta, paths.sources, paths.topics, paths.planJson, paths.planMarkdown, paths.questions]) {
			assert.ok(await exists(file), `${path.basename(file)} was written`);
		}

		const meta = await readJson<ExamMeta>(paths.meta);
		assert.strictEqual(meta.status, "in-progress");
		assert.strictEqual(meta.code, "AI-102");
		assert.strictEqual(meta.vendor, "Contoso");
		assert.strictEqual(meta.domains?.length, 2);
		assert.strictEqual(
			meta.domains?.reduce((sum, domain) => sum + domain.weight, 0),
			100
		);

		assert.ok(outcome.plan.days.length > 1);
		assert.ok(outcome.questions > 0);
		assert.deepStrictEqual(outcome.skipped, []);
		assert.ok(checkpoints.length >= 5, "each step is checkpointed for sync");
	});

	it("reports each step in order", async () => {
		const { deps, steps } = await harness();
		await runNewExamPipeline({ examQuery: "AI-102", folder: FOLDER, config: CONFIG }, deps);
		assert.deepStrictEqual(steps, ["meta", "sources", "topics", "plan", "questions", "finalize"]);
	});

	it("resumes from the first missing artefact and skips finished steps", async () => {
		const first = await harness();
		await runNewExamPipeline({ examQuery: "AI-102", folder: FOLDER, config: CONFIG }, first.deps);

		// Second run over the same folder: nothing left to do.
		const second = await harness({ store: first.store });
		const outcome = await runNewExamPipeline(
			{ examQuery: "AI-102", folder: FOLDER, config: CONFIG },
			second.deps
		);

		assert.strictEqual(outcome.ok, true);
		if (outcome.ok) {
			assert.deepStrictEqual(outcome.skipped, ["meta", "sources", "topics", "plan", "questions"]);
		}
		assert.strictEqual(second.approvals, 0, "an approved source list is never re-approved");
		assert.strictEqual((second.deps.lm as FakeLm).jsonRequests.length, 0, "no model calls");
	});

	it("picks up mid-way when only the early artefacts exist", async () => {
		const context = await harness();
		const { root, store, deps } = context;
		const seedMeta: ExamMeta = {
			schemaVersion: 1,
			id: "ai-102-prep",
			vendor: "Contoso",
			code: "AI-102",
			title: "Seeded",
			status: "planning",
			legacy: false,
			gamified: true,
			folder: FOLDER,
			createdAt: new Date().toISOString(),
			domains: [
				{ id: "1", title: "Plan", weight: 60, topicIds: ["t-plan"] },
				{ id: "2", title: "Build", weight: 40, topicIds: ["t-build"] },
			],
		};
		const seedSources: SourceRef[] = [
			{ id: "src-a", title: "Objectives", url: "https://vendor.example/o", kind: "official-objectives", trusted: true },
		];
		await store.writeMeta(seedMeta);
		await store.writeSources(FOLDER, seedSources);
		await store.writeTopics(FOLDER, "# Seeded topics\n");

		const outcome = await runNewExamPipeline(
			{ examQuery: "AI-102", folder: FOLDER, config: CONFIG },
			deps
		);

		assert.strictEqual(outcome.ok, true, outcome.ok ? "" : outcome.message);
		if (outcome.ok) {
			assert.deepStrictEqual(outcome.skipped, ["meta", "sources", "topics"]);
			assert.strictEqual(outcome.meta.title, "Seeded", "seeded metadata is left alone");
		}
		assert.strictEqual(context.approvals, 0);
		assert.ok(await exists(examPaths(root, FOLDER).planJson));
		assert.strictEqual(await fs.readFile(examPaths(root, FOLDER).topics, "utf8"), "# Seeded topics\n");
	});

	it("leaves coherent on-disk state and an actionable message when a step fails", async () => {
		const { root, deps } = await harness({
			lm: fakeLm({
				json: (request) => {
					if ((request.schemaHint ?? "").includes('"domains"')) {
						throw new Error("the objectives page would not load");
					}
					return router(request);
				},
			}),
		});

		const outcome = await runNewExamPipeline(
			{ examQuery: "AI-102", folder: FOLDER, config: CONFIG },
			deps
		);

		assert.strictEqual(outcome.ok, false);
		if (outcome.ok) {
			return;
		}
		assert.strictEqual(outcome.step, "topics");
		assert.strictEqual(outcome.cancelled, false);
		assert.ok(outcome.message.includes("the objectives page would not load"));
		assert.ok(outcome.message.includes("resumes"), "the message tells the user re-running is safe");

		const paths = examPaths(root, FOLDER);
		const meta = await readJson<ExamMeta>(paths.meta);
		assert.strictEqual(meta.status, "planning", "the exam stays in planning until setup completes");
		assert.strictEqual((await readJson<SourceRef[]>(paths.sources)).length, 2);
		assert.strictEqual(await exists(paths.planJson), false);
		assert.strictEqual(await exists(paths.questions), false);
	});

	it("treats a declined source approval as a pause, not a crash", async () => {
		const { root, deps } = await harness({ approveSources: async () => undefined });
		const outcome = await runNewExamPipeline(
			{ examQuery: "AI-102", folder: FOLDER, config: CONFIG },
			deps
		);

		assert.strictEqual(outcome.ok, false);
		if (!outcome.ok) {
			assert.strictEqual(outcome.step, "sources");
			assert.strictEqual(outcome.cancelled, true);
			assert.ok(outcome.message.includes("saved"));
		}
		assert.ok(await exists(examPaths(root, FOLDER).meta));
		assert.strictEqual(await exists(examPaths(root, FOLDER).sources), false);
	});

	it("stops immediately on a cancelled token", async () => {
		const { deps } = await harness({ token: { isCancellationRequested: true } });
		const outcome = await runNewExamPipeline(
			{ examQuery: "AI-102", folder: FOLDER, config: CONFIG },
			deps
		);
		assert.strictEqual(outcome.ok, false);
		if (!outcome.ok) {
			assert.strictEqual(outcome.cancelled, true);
			assert.strictEqual(outcome.step, "meta");
		}
	});

	it("fails clearly when the sources yield no domains", async () => {
		const { deps } = await harness({
			lm: fakeLm({
				json: (request) =>
					(request.schemaHint ?? "").includes('"domains"') ? { domains: [] } : router(request),
			}),
		});
		const outcome = await runNewExamPipeline(
			{ examQuery: "Mystery Exam", folder: FOLDER, config: CONFIG },
			deps
		);
		assert.strictEqual(outcome.ok, false);
		if (!outcome.ok) {
			assert.strictEqual(outcome.step, "topics");
			assert.ok(outcome.message.includes("official objectives"));
		}
	});
});

describe("pipeline helpers", () => {
	it("sizes the bank from the whole plan", () => {
		const plan = {
			schemaVersion: 1 as const,
			examId: "x",
			generatedAt: "",
			config: CONFIG,
			days: [
				{ day: 1, date: "", kind: "study" as const, title: "a", topicIds: [], questionCount: 10, sessionFile: "" },
				{ day: 2, date: "", kind: "mock" as const, title: "b", topicIds: [], questionCount: 40, sessionFile: "" },
				{ day: 3, date: "", kind: "exam" as const, title: "c", topicIds: [], questionCount: 0, sessionFile: "" },
			],
		};
		assert.strictEqual(plannedQuestionCount(plan), 50);
	});

	it("merges a top-up into an existing bank without duplicating ids", () => {
		const base = {
			examCode: "X",
			domains: [
				{
					domainId: "1",
					domainName: "Plan",
					questions: [{ id: "q1", question: "a", options: ["A", "B"], correctAnswer: "A" }],
				},
			],
		};
		const addition = {
			examCode: "X",
			domains: [
				{
					domainId: "1",
					domainName: "Plan",
					questions: [
						{ id: "q1", question: "a", options: ["A", "B"], correctAnswer: "A" },
						{ id: "q2", question: "b", options: ["A", "B"], correctAnswer: "B" },
					],
				},
				{
					domainId: "2",
					domainName: "Build",
					questions: [{ id: "q3", question: "c", options: ["A", "B"], correctAnswer: "A" }],
				},
			],
		};

		const merged = mergeBanks(base, addition, { code: "X", title: "X" });
		assert.strictEqual(countQuestions(merged), 3);
		assert.deepStrictEqual(
			merged.domains.map((domain) => domain.domainId),
			["1", "2"]
		);
		assert.strictEqual(merged.totalQuestions, 3);
	});

	it("builds a bank from scratch when there is nothing on disk", () => {
		const merged = mergeBanks(
			undefined,
			{
				examCode: "X",
				domains: [
					{
						domainId: "1",
						domainName: "Plan",
						questions: [{ id: "q1", question: "a", options: ["A", "B"], correctAnswer: "A" }],
					},
				],
			},
			{ code: "X", title: "Exam X" }
		);
		assert.strictEqual(merged.examName, "Exam X");
		assert.strictEqual(countQuestions(merged), 1);
	});
});
