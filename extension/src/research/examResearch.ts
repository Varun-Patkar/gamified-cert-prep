/**
 * Vendor-agnostic exam research. Everything arrives through `deps`, so the whole module runs
 * against a fake language model in plain mocha — no vscode import anywhere in this file.
 */

import type { JsonRequest, LmService } from "../lm/agentic";
import type { Domain, ExamMeta, PlanDay, Question, QuestionBank, SourceRef } from "../model/types";
import { apportion } from "../planning/planGenerator";
import { slugify } from "../store/paths";

export interface ResearchDeps {
	lm: LmService;
	log?(message: string): void;
	/** Injectable so generated ids are deterministic in tests. */
	now?(): Date;
}

/**
 * Non-negotiable: we build original practice material from published objectives. Anything the
 * vendor publishes as a sample, or the user hands us as a trusted source, may be used verbatim.
 */
export const INTEGRITY_RULE = [
	"Exam integrity rules you must follow without exception:",
	"- Synthesize ORIGINAL practice questions from the published objectives and official documentation.",
	"- You may reproduce an item verbatim ONLY when the vendor publishes it as an official sample or practice item, or when the user explicitly supplied it as a trusted source.",
	"- Never reproduce, reconstruct, or paraphrase leaked, dumped, or 'braindump' exam content, and never claim to know real exam items.",
	"- Every question must be answerable from the approved sources, and must cite which source grounds it.",
].join("\n");

const SOURCE_KINDS: readonly SourceRef["kind"][] = [
	"official-objectives",
	"official-docs",
	"official-practice",
	"community",
	"user-supplied",
];

function isTrustedKind(kind: SourceRef["kind"]): boolean {
	return kind !== "community";
}

function text(value: unknown, fallback = ""): string {
	return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
	return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function coerceKind(value: unknown): SourceRef["kind"] {
	const kind = text(value).toLowerCase().replace(/[\s_]+/g, "-");
	return (SOURCE_KINDS as readonly string[]).includes(kind) ? (kind as SourceRef["kind"]) : "community";
}

function uniqueId(prefix: string, seed: string, taken: Set<string>): string {
	const base = `${prefix}-${slugify(seed).slice(0, 48)}`;
	let id = base;
	let counter = 2;
	while (taken.has(id)) {
		id = `${base}-${counter}`;
		counter += 1;
	}
	taken.add(id);
	return id;
}

function jsonCall<T>(deps: ResearchDeps, request: JsonRequest): Promise<T> {
	return deps.lm.requestJson<T>(request);
}

// ---------------------------------------------------------------------------
// 1. Source discovery
// ---------------------------------------------------------------------------

const SOURCE_SCHEMA = `{
  "sources": [
    {
      "title": "string",
      "url": "https://…",
      "kind": "official-objectives | official-docs | official-practice | community",
      "rationale": "one line on why this source is worth trusting"
    }
  ]
}`;

export interface DiscoverSourcesOptions {
	maxSources?: number;
}

/** Finds the objectives page, official docs, an official practice assessment, and a few study guides. */
export async function discoverSources(
	examQuery: string,
	deps: ResearchDeps,
	options: DiscoverSourcesOptions = {}
): Promise<SourceRef[]> {
	const query = examQuery.trim();
	if (!query) {
		return [];
	}
	const limit = Math.max(3, Math.min(12, options.maxSources ?? 8));

	const payload = await jsonCall<{ sources?: unknown }>(deps, {
		system: [
			"You are a certification research assistant. You work for ANY vendor — Microsoft, AWS, Google, GitHub, Anthropic, Cisco, CompTIA, Kubernetes/CNCF, and anyone else.",
			"Never assume a vendor: identify it from the exam the user names, then find that vendor's own pages first.",
			"Use the tools available to actually open pages and confirm each URL resolves and is about this exam. Do not invent URLs.",
		].join("\n"),
		prompt: [
			`Research the certification exam: "${query}".`,
			"",
			"Find, in priority order:",
			"1. The official exam objectives / skills-measured / exam-guide page from the vendor (kind: official-objectives).",
			"2. The vendor's official documentation or learning path for the technology (kind: official-docs).",
			"3. The vendor's official practice assessment or sample questions, if one exists (kind: official-practice).",
			"4. Two to four reputable community study guides, written by named practitioners or well-known publications (kind: community).",
			"",
			"Exclude exam dumps, 'real exam questions' sites, and anything selling leaked items — they are useless to us and we will not use them.",
			`Return at most ${limit} sources. Every entry needs a one-line rationale explaining why this source earns a place.`,
		].join("\n"),
		schemaHint: SOURCE_SCHEMA,
		tools: deps.lm.selectWebTools(),
		maxRounds: 10,
	});

	const taken = new Set<string>();
	const seenUrls = new Set<string>();
	const sources: SourceRef[] = [];
	for (const entry of asArray(payload?.sources)) {
		const record = asRecord(entry);
		const url = text(record.url);
		const title = text(record.title, url);
		if (!title || (url && seenUrls.has(url.toLowerCase()))) {
			continue;
		}
		if (url) {
			seenUrls.add(url.toLowerCase());
		}
		const kind = coerceKind(record.kind);
		sources.push({
			id: uniqueId("src", title, taken),
			title,
			url: url || undefined,
			kind,
			trusted: isTrustedKind(kind),
			rationale: text(record.rationale) || undefined,
		});
		if (sources.length >= limit) {
			break;
		}
	}
	deps.log?.(`Discovered ${sources.length} candidate source(s) for "${query}".`);
	return sources;
}

// ---------------------------------------------------------------------------
// 2. Topic extraction
// ---------------------------------------------------------------------------

export interface ExtractedTopic {
	id: string;
	title: string;
	summary?: string;
}

export interface TopicExtraction {
	title: string;
	vendor: string;
	code: string;
	domains: Domain[];
	topics: ExtractedTopic[];
	topicsMarkdown: string;
}

const TOPICS_SCHEMA = `{
  "title": "full exam name",
  "vendor": "issuing organisation",
  "code": "exam code, e.g. AI-102",
  "domains": [
    {
      "title": "domain name exactly as the vendor words it",
      "weight": 25,
      "topics": [{ "title": "measurable skill", "summary": "one line" }]
    }
  ]
}`;

function describeSources(sources: readonly SourceRef[]): string {
	return sources
		.map(
			(source, index) =>
				`${index + 1}. [${source.kind}${source.trusted ? ", trusted" : ""}] ${source.title}${
					source.url ? ` — ${source.url}` : source.file ? ` — local file: ${source.file}` : ""
				}`
		)
		.join("\n");
}

/** Rebalances model-reported weights so they sum to exactly 100 without losing their ordering. */
export function normalizeWeights(weights: number[]): number[] {
	if (weights.length === 0) {
		return [];
	}
	return apportion(
		weights.map((weight) => (Number.isFinite(weight) && weight > 0 ? weight : 0)),
		100
	);
}

export async function extractTopics(
	examQuery: string,
	sources: readonly SourceRef[],
	deps: ResearchDeps
): Promise<TopicExtraction> {
	const payload = await jsonCall<Record<string, unknown>>(deps, {
		system: [
			"You turn a certification's published objectives into a structured syllabus.",
			"Work from the approved sources only, preferring the official objectives page for domain names and weights.",
			"Stay vendor-neutral: use whatever wording the issuing organisation uses.",
		].join("\n"),
		prompt: [
			`Exam: "${examQuery.trim()}".`,
			"",
			"Approved sources:",
			describeSources(sources),
			"",
			"Open the official objectives page and transcribe its structure:",
			"- every domain / functional group, in the vendor's own wording",
			"- the published percentage weight of each domain (best estimate if the vendor gives a range)",
			"- the measurable skills listed under each domain, one entry each, with a one-line summary",
			"",
			"Weights should total roughly 100.",
		].join("\n"),
		schemaHint: TOPICS_SCHEMA,
		tools: deps.lm.selectWebTools(),
		maxRounds: 10,
	});

	const rawDomains = asArray(payload.domains).map(asRecord);
	const weights = normalizeWeights(rawDomains.map((domain) => Number(domain.weight)));
	const topicIds = new Set<string>();
	const topics: ExtractedTopic[] = [];

	const domains: Domain[] = rawDomains.map((domain, index) => {
		const title = text(domain.title, `Domain ${index + 1}`);
		const domainTopics = asArray(domain.topics).map((entry) => {
			const record = asRecord(entry);
			const topicTitle = text(record.title, text(entry as string));
			const id = uniqueId("t", topicTitle || `${title}-${index}`, topicIds);
			const topic: ExtractedTopic = { id, title: topicTitle || `Skill ${topicIds.size}` };
			const summary = text(record.summary);
			if (summary) {
				topic.summary = summary;
			}
			topics.push(topic);
			return topic;
		});
		return {
			id: String(index + 1),
			title,
			weight: weights[index] ?? 0,
			topicIds: domainTopics.map((topic) => topic.id),
		};
	});

	const extraction: TopicExtraction = {
		title: text(payload.title, examQuery.trim()),
		vendor: text(payload.vendor, "Unknown"),
		code: text(payload.code, examQuery.trim().split(/\s+/)[0] ?? "EXAM"),
		domains,
		topics,
		topicsMarkdown: "",
	};
	extraction.topicsMarkdown = renderTopicsMarkdown(extraction, sources);
	deps.log?.(`Extracted ${domains.length} domain(s) and ${topics.length} topic(s).`);
	return extraction;
}

/** The `topics.md` body: readable in a diff, and the reference the session writer works from. */
export function renderTopicsMarkdown(extraction: TopicExtraction, sources: readonly SourceRef[]): string {
	const byId = new Map(extraction.topics.map((topic) => [topic.id, topic]));
	const lines: string[] = [
		`# ${extraction.code} — ${extraction.title}`,
		"",
		`Issued by **${extraction.vendor}**. ${extraction.domains.length} domain${
			extraction.domains.length === 1 ? "" : "s"
		}, weighted as published.`,
		"",
	];

	for (const domain of extraction.domains) {
		lines.push(`## ${domain.id}. ${domain.title} — ${domain.weight}%`, "");
		for (const topicId of domain.topicIds) {
			const topic = byId.get(topicId);
			if (!topic) {
				continue;
			}
			lines.push(`- **${topic.title}**${topic.summary ? ` — ${topic.summary}` : ""}`);
		}
		lines.push("");
	}

	if (sources.length > 0) {
		lines.push("## Sources", "");
		for (const source of sources) {
			const target = source.url ? `[${source.title}](${source.url})` : source.title;
			lines.push(`- ${target} — _${source.kind}_${source.rationale ? `. ${source.rationale}` : ""}`);
		}
		lines.push("");
	}
	return lines.join("\n");
}

// ---------------------------------------------------------------------------
// 3. Question generation
// ---------------------------------------------------------------------------

export interface GenerateQuestionsInput {
	examMeta: Pick<ExamMeta, "code" | "title">;
	domains: readonly Domain[];
	sources: readonly SourceRef[];
	count: number;
	targetDomainIds?: string[];
	/** Topic titles by id, so prompts can name skills instead of opaque ids. */
	topicTitles?: Record<string, string>;
}

const QUESTION_SCHEMA = `{
  "questions": [
    {
      "question": "stem, self-contained",
      "options": ["A. …", "B. …", "C. …", "D. …"],
      "correctAnswer": "A",
      "explanation": "why the key is right and each distractor is wrong",
      "topic": "topic title",
      "difficulty": "easy | medium | hard",
      "sourceRef": "id of the approved source that grounds this item"
    }
  ]
}`;

/** Batches per domain so each response stays small enough to come back as valid JSON. */
export async function generateQuestions(
	input: GenerateQuestionsInput,
	deps: ResearchDeps
): Promise<QuestionBank> {
	const targets = input.targetDomainIds?.length
		? input.domains.filter((domain) => input.targetDomainIds?.includes(domain.id))
		: [...input.domains];
	const total = Math.max(0, Math.floor(input.count));
	const allocation = apportion(
		targets.map((domain) => domain.weight),
		total
	);

	const bank: QuestionBank = {
		examCode: input.examMeta.code,
		examName: input.examMeta.title,
		totalQuestions: 0,
		sources: input.sources.map((source) => source.url ?? source.file ?? source.title),
		domains: [],
	};

	const ids = new Set<string>();
	for (let index = 0; index < targets.length; index += 1) {
		const domain = targets[index];
		const wanted = allocation[index] ?? 0;
		if (wanted <= 0) {
			continue;
		}
		const questions = await generateForDomain(input, domain, wanted, ids, deps);
		bank.domains.push({ domainId: domain.id, domainName: domain.title, questions });
	}
	bank.totalQuestions = bank.domains.reduce((sum, domain) => sum + domain.questions.length, 0);
	deps.log?.(`Generated ${bank.totalQuestions} question(s) across ${bank.domains.length} domain(s).`);
	return bank;
}

async function generateForDomain(
	input: GenerateQuestionsInput,
	domain: Domain,
	wanted: number,
	ids: Set<string>,
	deps: ResearchDeps
): Promise<Question[]> {
	const topicList = domain.topicIds
		.map((id) => input.topicTitles?.[id] ?? id)
		.slice(0, 40)
		.map((title) => `- ${title}`)
		.join("\n");

	const payload = await jsonCall<{ questions?: unknown }>(deps, {
		system: [
			"You write high-quality certification practice questions.",
			INTEGRITY_RULE,
			"Every item must have exactly one defensible key unless you explicitly mark it as multi-select, four plausible options, and an explanation that teaches.",
		].join("\n\n"),
		prompt: [
			`Exam: ${input.examMeta.code} — ${input.examMeta.title}.`,
			`Domain ${domain.id}: ${domain.title} (${domain.weight}% of the exam).`,
			"",
			"Skills to cover:",
			topicList || "- (use the domain title)",
			"",
			"Approved sources (cite one per question by its id):",
			describeSources(input.sources),
			input.sources
				.map((source) => `${source.id} = ${source.title}${source.trusted ? " (trusted, verbatim allowed)" : ""}`)
				.join("\n"),
			"",
			`Write ${wanted} original scenario-style questions. Spread difficulty: roughly a third easy, half medium, the rest hard.`,
			"Prefix options with 'A. ', 'B. ', and so on, and give correctAnswer as the matching letter (or an array of letters for multi-select).",
		].join("\n"),
		schemaHint: QUESTION_SCHEMA,
		tools: deps.lm.selectWebTools(),
		maxRounds: 6,
	});

	const questions: Question[] = [];
	for (const entry of asArray(payload?.questions)) {
		const question = normalizeQuestion(entry, domain, ids, input);
		if (question) {
			questions.push(question);
		}
		if (questions.length >= wanted) {
			break;
		}
	}
	return questions;
}

function normalizeQuestion(
	entry: unknown,
	domain: Domain,
	ids: Set<string>,
	input: GenerateQuestionsInput
): Question | undefined {
	const record = asRecord(entry);
	const stem = text(record.question);
	const options = asArray(record.options)
		.map((option) => text(option))
		.filter((option) => option.length > 0);
	if (!stem || options.length < 2) {
		return undefined;
	}
	const rawAnswer = record.correctAnswer;
	const correctAnswer = Array.isArray(rawAnswer)
		? rawAnswer.map((value) => text(value)).filter((value) => value.length > 0)
		: text(rawAnswer);
	if (!correctAnswer || (Array.isArray(correctAnswer) && correctAnswer.length === 0)) {
		return undefined;
	}

	const sourceId = text(record.sourceRef);
	const source = input.sources.find((candidate) => candidate.id === sourceId) ?? input.sources[0];
	const question: Question = {
		id: uniqueId(`q${domain.id}`, stem.slice(0, 40), ids),
		question: stem,
		options,
		correctAnswer,
		explanation: text(record.explanation) || undefined,
		topic: text(record.topic, domain.title),
		difficulty: text(record.difficulty, "medium").toLowerCase(),
		type: Array.isArray(correctAnswer) && correctAnswer.length > 1 ? "multi" : "mc",
		ungraded: false,
		domainId: domain.id,
		sourceRef: source?.id,
		sourceUrl: source?.url,
		source: source?.title,
		generatedBy: "cert-prep-research",
	};
	return question;
}

// ---------------------------------------------------------------------------
// 4. Session material
// ---------------------------------------------------------------------------

export interface SessionMaterialInput {
	examMeta: Pick<ExamMeta, "code" | "title">;
	planDay: Pick<PlanDay, "day" | "title" | "kind" | "topicIds" | "questionCount" | "domainId">;
	domains: readonly Domain[];
	sources: readonly SourceRef[];
	topicTitles?: Record<string, string>;
}

/** Teaching markdown for one plan day: concepts, a comparison table, traps, recap. */
export async function generateSessionMaterial(
	input: SessionMaterialInput,
	deps: ResearchDeps
): Promise<string> {
	const domain = input.domains.find((candidate) => candidate.id === input.planDay.domainId);
	const topics = input.planDay.topicIds.map((id) => input.topicTitles?.[id] ?? id);

	const result = await deps.lm.runAgenticTurn({
		system: [
			"You are a warm, precise instructor writing a study session for a working professional.",
			"Ground every claim in the approved sources; open them with your tools when you need detail.",
			"Write GitHub-flavoured markdown only. No preamble, no closing chatter, no code fences around the whole document.",
			INTEGRITY_RULE,
		].join("\n\n"),
		prompt: [
			`Exam: ${input.examMeta.code} — ${input.examMeta.title}.`,
			`Day ${input.planDay.day}: "${input.planDay.title}" (${input.planDay.kind} day).`,
			domain ? `Domain ${domain.id}: ${domain.title} — ${domain.weight}% of the exam.` : "",
			topics.length > 0 ? `Skills in scope:\n${topics.map((topic) => `- ${topic}`).join("\n")}` : "",
			"",
			"Approved sources:",
			describeSources(input.sources),
			"",
			"Write the session with exactly these sections:",
			`# Day ${input.planDay.day} — ${input.planDay.title}`,
			"## What you'll learn — three to five bullets, second person, encouraging.",
			"## The concepts — a `###` subsection per skill: explain it plainly, then a concrete worked example.",
			"## Side by side — a markdown table comparing the options that are easy to confuse. Skip only if nothing here is comparable.",
			"## Exam traps — the specific misreadings that cost people marks, as a bulleted list.",
			"## Recap — five short lines someone can reread the morning of the exam.",
			"",
			`End with one encouraging sentence. Aim for a fifteen minute read.${
				input.planDay.questionCount > 0
					? ` Mention that ${input.planDay.questionCount} questions are waiting at the end.`
					: ""
			}`,
		]
			.filter(Boolean)
			.join("\n"),
		tools: deps.lm.selectWebTools(),
		maxRounds: 8,
	});

	const markdown = stripDocumentFence(result.text);
	deps.log?.(`Wrote ${markdown.length} characters of session material for day ${input.planDay.day}.`);
	return markdown;
}

/** Models sometimes wrap a whole document in ```markdown; unwrap only when the fence spans everything. */
function stripDocumentFence(value: string): string {
	const trimmed = value.trim();
	const match = /^```(?:markdown|md)?\s*\n([\s\S]*)\n```$/.exec(trimmed);
	return (match ? match[1] : trimmed).trim();
}
