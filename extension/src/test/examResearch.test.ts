import * as assert from "assert";
import type { JsonRequest } from "../lm/agentic";
import type { Domain, SourceRef } from "../model/types";
import {
	assessSessionQuality,
	INTEGRITY_RULE,
	discoverSources,
	extractTopics,
	generateQuestions,
	generateSessionMaterial,
	normalizeWeights,
} from "../research/examResearch";

describe("research/session quality", () => {
	it("rejects short generic material and placeholder sources", () => {
		const quality = assessSessionQuality(
			"# Day 22\n\n## The concepts\nGeneric monitoring advice.\n\nhttps://example.com/docs",
			APPROVED
		);
		assert.strictEqual(quality.acceptable, false);
		assert.ok(quality.problems.includes("contains a placeholder URL"));
		assert.ok(quality.problems.includes("fewer than 900 words"));
	});
});
import { fakeLm } from "./fakeLm";

const SOURCE_PAYLOAD = {
	sources: [
		{
			title: "Exam AI-102: Skills measured",
			url: "https://learn.microsoft.com/credentials/ai-102/",
			kind: "official-objectives",
			rationale: "The vendor's own objective list.",
		},
		{
			title: "Azure AI services documentation",
			url: "https://learn.microsoft.com/azure/ai-services/",
			kind: "official-docs",
			rationale: "Primary product documentation.",
		},
		{
			title: "Official practice assessment",
			url: "https://learn.microsoft.com/practice/ai-102",
			kind: "official-practice",
			rationale: "Vendor-published sample items.",
		},
		{
			title: "A practitioner's study guide",
			url: "https://example.dev/ai-102-guide",
			kind: "community",
			rationale: "Named engineer, cites the docs throughout.",
		},
		{
			title: "Duplicate docs link",
			url: "https://learn.microsoft.com/azure/ai-services/",
			kind: "official-docs",
		},
		{ title: "Nonsense kind", url: "https://example.dev/other", kind: "totally-made-up" },
	],
};

const TOPICS_PAYLOAD = {
	title: "Designing and Implementing a Microsoft Azure AI Solution",
	vendor: "Microsoft",
	code: "AI-102",
	domains: [
		{
			title: "Plan and manage an Azure AI solution",
			weight: 30,
			topics: [
				{ title: "Select the right service", summary: "Match workload to service." },
				{ title: "Plan deployment", summary: "Regions, SKUs, quotas." },
			],
		},
		{
			title: "Implement generative AI solutions",
			weight: 30,
			topics: [{ title: "Ground models with RAG", summary: "Index, retrieve, cite." }],
		},
		{
			title: "Implement computer vision solutions",
			weight: 30,
			topics: [{ title: "Analyze images", summary: "Tags, captions, OCR." }],
		},
	],
};

function questionPayload(count: number): unknown {
	return {
		questions: Array.from({ length: count }, (_, index) => ({
			question: `Scenario ${index + 1}: which service fits?`,
			options: ["A. One", "B. Two", "C. Three", "D. Four"],
			correctAnswer: "B",
			explanation: "B is the only managed option in this scenario.",
			topic: "Select the right service",
			difficulty: "medium",
			sourceRef: "src-exam-ai-102-skills-measured",
		})),
	};
}

const APPROVED: SourceRef[] = [
	{
		id: "src-objectives",
		title: "Skills measured",
		url: "https://vendor.example/objectives",
		kind: "official-objectives",
		trusted: true,
	},
	{
		id: "src-guide",
		title: "Community guide",
		url: "https://example.dev/guide",
		kind: "community",
		trusted: false,
	},
];

describe("research/discoverSources", () => {
	it("returns well-formed SourceRefs with unique ids and trust flags", async () => {
		const lm = fakeLm({ json: () => SOURCE_PAYLOAD });
		const sources = await discoverSources("AI-102 Azure AI Engineer", { lm });

		assert.ok(sources.length >= 4);
		assert.strictEqual(new Set(sources.map((source) => source.id)).size, sources.length);
		for (const source of sources) {
			assert.ok(source.id && source.title, "id and title are always present");
			assert.ok(
				["official-objectives", "official-docs", "official-practice", "community", "user-supplied"].includes(
					source.kind
				)
			);
		}
		const objectives = sources.find((source) => source.kind === "official-objectives");
		assert.strictEqual(objectives?.trusted, true);
		assert.strictEqual(objectives?.rationale, "The vendor's own objective list.");
		assert.strictEqual(sources.find((source) => source.kind === "community")?.trusted, false);
	});

	it("drops duplicate urls and coerces unknown kinds to community", async () => {
		const lm = fakeLm({ json: () => SOURCE_PAYLOAD });
		const sources = await discoverSources("AI-102", { lm });

		const docsCount = sources.filter(
			(source) => source.url === "https://learn.microsoft.com/azure/ai-services/"
		).length;
		assert.strictEqual(docsCount, 1);
		assert.strictEqual(sources.find((source) => source.title === "Nonsense kind")?.kind, "community");
	});

	it("respects the max-sources cap", async () => {
		const lm = fakeLm({ json: () => SOURCE_PAYLOAD });
		const sources = await discoverSources("AI-102", { lm }, { maxSources: 3 });
		assert.strictEqual(sources.length, 3);
	});

	it("returns nothing for an empty query without calling the model", async () => {
		const lm = fakeLm({ json: () => SOURCE_PAYLOAD });
		assert.deepStrictEqual(await discoverSources("   ", { lm }), []);
		assert.strictEqual(lm.jsonRequests.length, 0);
	});

	it("is vendor agnostic: no vendor is baked into the prompt", async () => {
		const requests: JsonRequest[] = [];
		const lm = fakeLm({
			json: (request) => {
				requests.push(request);
				return SOURCE_PAYLOAD;
			},
		});

		await discoverSources("AWS Certified Solutions Architect - Associate", { lm });
		await discoverSources("GitHub Actions certification", { lm });

		for (const request of requests) {
			const blob = `${request.system ?? ""}\n${request.prompt}`.toLowerCase();
			assert.ok(!blob.includes("learn.microsoft.com"), "no Microsoft URL is hardcoded");
			assert.ok(blob.includes("vendor"), "the prompt talks about the vendor generically");
		}
		assert.ok(requests[0].prompt.includes("AWS Certified Solutions Architect"));
		assert.ok(requests[1].prompt.includes("GitHub Actions certification"));
	});

	it("asks the model to avoid dumps", async () => {
		const lm = fakeLm({ json: () => SOURCE_PAYLOAD });
		await discoverSources("CKA", { lm });
		assert.ok(lm.jsonRequests[0].prompt.toLowerCase().includes("dump"));
	});
});

describe("research/normalizeWeights", () => {
	it("normalises to exactly 100", () => {
		assert.strictEqual(
			normalizeWeights([30, 30, 30]).reduce((a, b) => a + b, 0),
			100
		);
		assert.strictEqual(
			normalizeWeights([1, 1, 1, 1, 1, 1, 1]).reduce((a, b) => a + b, 0),
			100
		);
		assert.strictEqual(
			normalizeWeights([55, 20, 15, 10]).reduce((a, b) => a + b, 0),
			100
		);
	});

	it("survives garbage weights", () => {
		const weights = normalizeWeights([Number.NaN, -4, 0]);
		assert.strictEqual(
			weights.reduce((a, b) => a + b, 0),
			100
		);
	});

	it("returns an empty array for no domains", () => {
		assert.deepStrictEqual(normalizeWeights([]), []);
	});
});

describe("research/extractTopics", () => {
	it("returns domains whose weights sum to 100", async () => {
		const lm = fakeLm({ json: () => TOPICS_PAYLOAD });
		const extraction = await extractTopics("AI-102", APPROVED, { lm });

		assert.strictEqual(extraction.code, "AI-102");
		assert.strictEqual(extraction.vendor, "Microsoft");
		assert.strictEqual(extraction.domains.length, 3);
		assert.strictEqual(
			extraction.domains.reduce((sum, domain) => sum + domain.weight, 0),
			100
		);
	});

	it("gives every domain a sequential id and every topic a unique id", async () => {
		const lm = fakeLm({ json: () => TOPICS_PAYLOAD });
		const extraction = await extractTopics("AI-102", APPROVED, { lm });

		assert.deepStrictEqual(
			extraction.domains.map((domain) => domain.id),
			["1", "2", "3"]
		);
		const topicIds = extraction.domains.flatMap((domain: Domain) => domain.topicIds);
		assert.strictEqual(new Set(topicIds).size, topicIds.length);
		assert.strictEqual(topicIds.length, extraction.topics.length);
	});

	it("renders topics.md with every domain, weight and source", async () => {
		const lm = fakeLm({ json: () => TOPICS_PAYLOAD });
		const { topicsMarkdown } = await extractTopics("AI-102", APPROVED, { lm });

		assert.ok(topicsMarkdown.startsWith("# AI-102"));
		assert.ok(topicsMarkdown.includes("## 1. Plan and manage an Azure AI solution — "));
		assert.ok(topicsMarkdown.includes("**Ground models with RAG**"));
		assert.ok(topicsMarkdown.includes("https://vendor.example/objectives"));
	});

	it("falls back gracefully when the model returns nothing useful", async () => {
		const lm = fakeLm({ json: () => ({}) });
		const extraction = await extractTopics("Some Exam 900", [], { lm });

		assert.deepStrictEqual(extraction.domains, []);
		assert.strictEqual(extraction.title, "Some Exam 900");
		assert.strictEqual(extraction.code, "Some");
	});
});

describe("research/generateQuestions", () => {
	const domains: Domain[] = [
		{ id: "1", title: "Plan", weight: 50, topicIds: ["t-plan"] },
		{ id: "2", title: "Build", weight: 50, topicIds: ["t-build"] },
	];

	it("produces a bank in the on-disk questions.json shape", async () => {
		const lm = fakeLm({ json: () => questionPayload(3) });
		const bank = await generateQuestions(
			{
				examMeta: { code: "AI-102", title: "Azure AI Engineer" },
				domains,
				sources: APPROVED,
				count: 6,
				topicTitles: { "t-plan": "Planning", "t-build": "Building" },
			},
			{ lm }
		);

		assert.strictEqual(bank.examCode, "AI-102");
		assert.strictEqual(bank.examName, "Azure AI Engineer");
		assert.ok(Array.isArray(bank.sources));
		assert.strictEqual(bank.domains.length, 2);
		assert.strictEqual(bank.totalQuestions, 6);

		for (const domain of bank.domains) {
			assert.ok(typeof domain.domainId === "string" && domain.domainId.length > 0);
			assert.ok(typeof domain.domainName === "string" && domain.domainName.length > 0);
			for (const question of domain.questions) {
				assert.ok(typeof question.id === "string" && question.id.length > 0);
				assert.ok(typeof question.question === "string" && question.question.length > 0);
				assert.ok(Array.isArray(question.options) && question.options.length >= 2);
				assert.ok(typeof question.correctAnswer === "string" || Array.isArray(question.correctAnswer));
				assert.ok(typeof question.explanation === "string");
				assert.ok(typeof question.sourceRef === "string");
			}
		}
	});

	it("gives every question a unique id", async () => {
		const lm = fakeLm({ json: () => questionPayload(4) });
		const bank = await generateQuestions(
			{ examMeta: { code: "X", title: "X" }, domains, sources: APPROVED, count: 8 },
			{ lm }
		);
		const ids = bank.domains.flatMap((domain) => domain.questions.map((question) => question.id));
		assert.strictEqual(new Set(ids).size, ids.length);
	});

	it("apportions the count across domains by weight", async () => {
		const lm = fakeLm({ json: () => questionPayload(10) });
		const bank = await generateQuestions(
			{
				examMeta: { code: "X", title: "X" },
				domains: [
					{ id: "1", title: "Big", weight: 80, topicIds: [] },
					{ id: "2", title: "Small", weight: 20, topicIds: [] },
				],
				sources: APPROVED,
				count: 10,
			},
			{ lm }
		);
		assert.strictEqual(bank.domains[0].questions.length, 8);
		assert.strictEqual(bank.domains[1].questions.length, 2);
	});

	it("only asks for the domains it was told to target", async () => {
		const lm = fakeLm({ json: () => questionPayload(5) });
		const bank = await generateQuestions(
			{
				examMeta: { code: "X", title: "X" },
				domains,
				sources: APPROVED,
				count: 5,
				targetDomainIds: ["2"],
			},
			{ lm }
		);
		assert.strictEqual(lm.jsonRequests.length, 1);
		assert.deepStrictEqual(
			bank.domains.map((domain) => domain.domainId),
			["2"]
		);
	});

	it("encodes the exam integrity rule in the system prompt", async () => {
		const lm = fakeLm({ json: () => questionPayload(2) });
		await generateQuestions(
			{ examMeta: { code: "X", title: "X" }, domains, sources: APPROVED, count: 2 },
			{ lm }
		);
		const system = lm.jsonRequests[0].system ?? "";
		assert.ok(system.includes(INTEGRITY_RULE));
		assert.ok(system.toLowerCase().includes("braindump"));
	});

	it("skips malformed questions instead of writing junk", async () => {
		const lm = fakeLm({
			json: () => ({
				questions: [
					{ question: "", options: ["A. x", "B. y"], correctAnswer: "A" },
					{ question: "No options", options: [], correctAnswer: "A" },
					{ question: "No key", options: ["A. x", "B. y"] },
					{ question: "Good one", options: ["A. x", "B. y"], correctAnswer: "A" },
				],
			}),
		});
		const bank = await generateQuestions(
			{ examMeta: { code: "X", title: "X" }, domains: [domains[0]], sources: APPROVED, count: 4 },
			{ lm }
		);
		assert.strictEqual(bank.totalQuestions, 1);
		assert.strictEqual(bank.domains[0].questions[0].question, "Good one");
	});
});

describe("research/generateSessionMaterial", () => {
	it("returns the model's markdown, unwrapped from a document fence", async () => {
		const lm = fakeLm({ text: () => "```markdown\n# Day 1 — Planning\n\nHello.\n```" });
		const markdown = await generateSessionMaterial(
			{
				examMeta: { code: "AI-102", title: "Azure AI Engineer" },
				planDay: {
					day: 1,
					title: "Planning",
					kind: "study",
					topicIds: ["t-plan"],
					questionCount: 15,
					domainId: "1",
				},
				domains: [{ id: "1", title: "Plan", weight: 100, topicIds: ["t-plan"] }],
				sources: APPROVED,
				topicTitles: { "t-plan": "Planning workloads" },
			},
			{ lm }
		);

		assert.strictEqual(markdown, "# Day 1 — Planning\n\nHello.");
	});

	it("asks for the teaching sections and mentions the queued questions", async () => {
		const lm = fakeLm({ text: () => "# Day 2" });
		await generateSessionMaterial(
			{
				examMeta: { code: "CKA", title: "Certified Kubernetes Administrator" },
				planDay: { day: 2, title: "Scheduling", kind: "study", topicIds: [], questionCount: 12 },
				domains: [{ id: "1", title: "Workloads", weight: 100, topicIds: [] }],
				sources: APPROVED,
			},
			{ lm }
		);

		const request = lm.turnRequests[0];
		assert.ok(request.prompt.includes("What you'll learn"));
		assert.ok(request.prompt.includes("Side by side"));
		assert.ok(request.prompt.includes("Exam traps"));
		assert.ok(request.prompt.includes("Recap"));
		assert.ok(request.prompt.includes("12 questions"));
		assert.ok((request.system ?? "").includes(INTEGRITY_RULE));
	});
});
