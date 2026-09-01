/**
 * Setup for a brand new exam, start to finish. Resumable: every step checks the disk first, so a
 * crashed or cancelled run picks up at the first missing artefact instead of starting over.
 *
 * Deliberately free of `vscode` — `pipeline/newExamCommand.ts` supplies progress, approval UI and sync.
 */

import type { CancellationLike, LmService } from "../lm/agentic";
import type { Domain, ExamMeta, Plan, PlanConfig, PlanDay, QuestionBank, SourceRef } from "../model/types";
import { describePlan, generatePlan } from "../planning/planGenerator";
import {
	discoverSources,
	extractTopics,
	generateQuestions,
	generateSessionMaterial,
	type ResearchDeps,
	type TopicExtraction,
} from "../research/examResearch";
import { slugify } from "../store/paths";
import type { RepoStore } from "../store/repoStore";

export type PipelineStep = "meta" | "sources" | "topics" | "plan" | "questions" | "finalize";

export const PIPELINE_STEPS: readonly PipelineStep[] = [
	"meta",
	"sources",
	"topics",
	"plan",
	"questions",
	"finalize",
];

export const STEP_LABELS: Record<PipelineStep, string> = {
	meta: "Setting up the exam folder",
	sources: "Finding sources worth trusting",
	topics: "Reading the objectives",
	plan: "Laying out your campaign",
	questions: "Writing your question bank",
	finalize: "Opening your dashboard",
};

export class PipelineCancelled extends Error {
	constructor() {
		super("Setup was cancelled.");
		this.name = "PipelineCancelled";
	}
}

export interface PipelineDeps {
	store: RepoStore;
	lm: LmService;
	/** Resolves with the approved list, or undefined when the user backs out. */
	approveSources(input: { meta: ExamMeta; candidates: SourceRef[]; rediscover(): Promise<SourceRef[]> }): Promise<
		SourceRef[] | undefined
	>;
	report?(step: PipelineStep, message: string): void;
	/** Called after every step so a crash never loses finished work. */
	checkpoint?(message: string): Promise<void> | void;
	log?(message: string): void;
	token?: CancellationLike;
	now?(): Date;
}

export interface NewExamRequest {
	examQuery: string;
	folder: string;
	code?: string;
	title?: string;
	vendor?: string;
	config: PlanConfig;
	/** Total questions to write; defaults to the plan's own demand. */
	questionCount?: number;
}

export type PipelineOutcome =
	| { ok: true; meta: ExamMeta; plan: Plan; questions: number; skipped: PipelineStep[] }
	| { ok: false; step: PipelineStep; message: string; cancelled: boolean; meta?: ExamMeta };

function describe(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function throwIfCancelled(token?: CancellationLike): void {
	if (token?.isCancellationRequested) {
		throw new PipelineCancelled();
	}
}

function researchDeps(deps: PipelineDeps): ResearchDeps {
	return { lm: deps.lm, log: deps.log, now: deps.now };
}

/** Older meta.json files predate `topicTitles`; ids read well enough as prompt hints. */
function fallbackTopicTitles(domains: readonly Domain[]): Record<string, string> {
	const titles: Record<string, string> = {};
	for (const domain of domains) {
		for (const id of domain.topicIds) {
			titles[id] = id;
		}
	}
	return titles;
}

/** Plan-wide question demand, so the bank covers every quiz day at least once. */
export function plannedQuestionCount(plan: Plan): number {
	return plan.days.reduce((sum, day) => sum + Math.max(0, day.questionCount), 0);
}

export async function runNewExamPipeline(
	request: NewExamRequest,
	deps: PipelineDeps
): Promise<PipelineOutcome> {
	const skipped: PipelineStep[] = [];
	let step: PipelineStep = "meta";
	let meta: ExamMeta | undefined;

	const report = (next: PipelineStep) => {
		step = next;
		deps.report?.(next, STEP_LABELS[next]);
	};

	try {
		// 1. Folder + meta.json
		report("meta");
		throwIfCancelled(deps.token);
		const existing = await deps.store.readMeta(request.folder);
		if (existing) {
			meta = existing;
			skipped.push("meta");
		} else {
			meta = newMeta(request, deps);
			await deps.store.writeMeta(meta);
			await deps.checkpoint?.(`Start ${meta.code} prep`);
		}

		// 2. Sources
		report("sources");
		throwIfCancelled(deps.token);
		let sources = await deps.store.readSources(request.folder);
		if (sources.length > 0) {
			skipped.push("sources");
		} else {
			const rediscover = () => discoverSources(request.examQuery, researchDeps(deps));
			const candidates = await rediscover();
			const approved = await deps.approveSources({ meta, candidates, rediscover });
			if (!approved) {
				throw new PipelineCancelled();
			}
			sources = approved;
			await deps.store.writeSources(request.folder, sources);
			await deps.checkpoint?.(`Approve ${sources.length} sources for ${meta.code}`);
		}

		// 3. Topics + domains
		report("topics");
		throwIfCancelled(deps.token);
		const existingTopics = await deps.store.readTopics(request.folder);
		let domains = meta.domains ?? [];
		let topicTitles = meta.topicTitles ?? fallbackTopicTitles(domains);
		if (existingTopics && domains.length > 0) {
			skipped.push("topics");
		} else {
			const extraction = await extractTopics(request.examQuery, sources, researchDeps(deps));
			domains = extraction.domains;
			topicTitles = titlesOf(extraction);
			meta = {
				...meta,
				title: request.title ?? extraction.title,
				code: request.code ?? extraction.code,
				vendor: request.vendor ?? extraction.vendor,
				domains,
				topicTitles,
			};
			await deps.store.writeTopics(request.folder, extraction.topicsMarkdown);
			await deps.store.writeMeta(meta);
			await deps.checkpoint?.(`Add topics for ${meta.code}`);
		}
		if (domains.length === 0) {
			throw new Error("No exam domains could be read from the approved sources. Try adding the official objectives page.");
		}

		// 4. Plan
		report("plan");
		throwIfCancelled(deps.token);
		let plan = await deps.store.readPlan(request.folder);
		if (plan && plan.days.length > 0) {
			skipped.push("plan");
		} else {
			plan = generatePlan({ examId: meta.id, domains, config: request.config });
			await deps.store.writePlan(request.folder, plan);
			await deps.store.writePlanMarkdown(request.folder, describePlan(plan));
			meta = { ...meta, planConfig: request.config };
			await deps.store.writeMeta(meta);
			await deps.checkpoint?.(`Add study plan for ${meta.code}`);
		}

		// 5. Question bank
		report("questions");
		throwIfCancelled(deps.token);
		let bank = await deps.store.readQuestions(request.folder);
		if (bank && countQuestions(bank) > 0) {
			skipped.push("questions");
		} else {
			bank = await generateQuestions(
				{
					examMeta: meta,
					domains,
					sources,
					count: request.questionCount ?? plannedQuestionCount(plan),
					topicTitles,
				},
				researchDeps(deps)
			);
			await deps.store.writeQuestions(request.folder, bank);
			await deps.checkpoint?.(`Add question bank for ${meta.code}`);
		}

		// 6. Go live
		report("finalize");
		meta = { ...meta, status: "in-progress" };
		await deps.store.writeMeta(meta);
		await deps.checkpoint?.(`${meta.code} campaign ready`);

		return { ok: true, meta, plan, questions: countQuestions(bank), skipped };
	} catch (error) {
		const cancelled = error instanceof PipelineCancelled;
		deps.log?.(`Exam setup stopped during "${step}": ${describe(error)}`);
		return {
			ok: false,
			step,
			cancelled,
			message: cancelled
				? "Setup paused. Everything finished so far is saved — run it again to pick up where you left off."
				: `${STEP_LABELS[step]} failed: ${describe(error)} Everything finished so far is saved, so re-running resumes from here.`,
			meta,
		};
	}
}

function titlesOf(extraction: TopicExtraction): Record<string, string> {
	const titles: Record<string, string> = {};
	for (const topic of extraction.topics) {
		titles[topic.id] = topic.title;
	}
	return titles;
}

function newMeta(request: NewExamRequest, deps: PipelineDeps): ExamMeta {
	const now = (deps.now?.() ?? new Date()).toISOString();
	const code = request.code ?? request.examQuery.trim().split(/\s+/)[0] ?? "EXAM";
	return {
		schemaVersion: 1,
		id: slugify(request.folder),
		vendor: request.vendor ?? "Unknown",
		code,
		title: request.title ?? request.examQuery.trim(),
		status: "planning",
		legacy: false,
		gamified: true,
		folder: request.folder,
		createdAt: now,
		examDate: request.config.examDate,
		examQuery: request.examQuery.trim(),
		planConfig: request.config,
	};
}

export function countQuestions(bank: QuestionBank | undefined): number {
	return (bank?.domains ?? []).reduce((sum, domain) => sum + domain.questions.length, 0);
}

// ---------------------------------------------------------------------------
// Lazy, per-day work: written the first time a day is opened rather than up front.
// ---------------------------------------------------------------------------

export interface EnsureDayDeps {
	store: RepoStore;
	lm: LmService;
	log?(message: string): void;
	checkpoint?(message: string): Promise<void> | void;
}

/** Writes `sessions/day-NN-*.md` on first open. Returns the markdown either way. */
export async function ensureSessionMaterial(
	meta: ExamMeta,
	planDay: PlanDay,
	deps: EnsureDayDeps
): Promise<string | undefined> {
	const existing = await deps.store.readSessionMaterial(meta.folder, planDay.day);
	if (existing && existing.trim().length > 0) {
		return existing;
	}
	const domains = meta.domains ?? [];
	if (domains.length === 0) {
		return undefined;
	}
	const sources = await deps.store.readSources(meta.folder);
	const markdown = await generateSessionMaterial(
		{ examMeta: meta, planDay, domains, sources, topicTitles: meta.topicTitles },
		{ lm: deps.lm, log: deps.log }
	);
	if (!markdown.trim()) {
		return undefined;
	}
	await deps.store.writeSessionMaterial(meta.folder, planDay.day, slugify(planDay.title), markdown);
	await deps.checkpoint?.(`Add day ${planDay.day} session for ${meta.code}`);
	return markdown;
}

/** Tops the bank up when a day would otherwise run short of its `questionCount`. */
export async function topUpQuestions(
	meta: ExamMeta,
	planDay: PlanDay,
	deps: EnsureDayDeps
): Promise<QuestionBank | undefined> {
	const bank = await deps.store.readQuestions(meta.folder);
	const domains = meta.domains ?? [];
	if (domains.length === 0 || planDay.questionCount <= 0) {
		return bank;
	}
	const domainId = planDay.domainId;
	const available = domainId
		? (bank?.domains.find((domain) => domain.domainId === domainId)?.questions.length ?? 0)
		: countQuestions(bank);
	const shortfall = planDay.questionCount - available;
	if (shortfall <= 0) {
		return bank;
	}

	const sources = await deps.store.readSources(meta.folder);
	const topUp = await generateQuestions(
		{
			examMeta: meta,
			domains,
			sources,
			count: shortfall,
			targetDomainIds: domainId ? [domainId] : undefined,
			topicTitles: meta.topicTitles,
		},
		{ lm: deps.lm, log: deps.log }
	);
	const merged = mergeBanks(bank, topUp, meta);
	await deps.store.writeQuestions(meta.folder, merged);
	await deps.checkpoint?.(`Top up questions for ${meta.code} day ${planDay.day}`);
	return merged;
}

export function mergeBanks(
	base: QuestionBank | undefined,
	addition: QuestionBank,
	meta: Pick<ExamMeta, "code" | "title">
): QuestionBank {
	const merged: QuestionBank = base
		? { ...base, domains: base.domains.map((domain) => ({ ...domain, questions: [...domain.questions] })) }
		: { examCode: meta.code, examName: meta.title, domains: [], sources: addition.sources };

	const seen = new Set<string>();
	for (const domain of merged.domains) {
		for (const question of domain.questions) {
			seen.add(question.id);
		}
	}

	for (const incoming of addition.domains) {
		const target = merged.domains.find((domain) => domain.domainId === incoming.domainId);
		const fresh = incoming.questions.filter((question) => !seen.has(question.id));
		for (const question of fresh) {
			seen.add(question.id);
		}
		if (target) {
			target.questions.push(...fresh);
		} else {
			merged.domains.push({ ...incoming, questions: fresh });
		}
	}
	merged.totalQuestions = countQuestions(merged);
	return merged;
}
