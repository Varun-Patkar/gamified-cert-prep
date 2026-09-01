/** Pure state for the source-approval screen. No vscode, no fs. */

import type { SourceRef } from "../model/types";

export interface SourceCandidate extends SourceRef {
	included: boolean;
}

export interface SourceCard extends SourceCandidate {
	kindLabel: string;
	host: string;
	trustLabel: string;
}

export interface SourcesModel {
	examId: string;
	examQuery: string;
	code: string;
	headline: string;
	why: string;
	sources: SourceCard[];
	approvedCount: number;
	canApprove: boolean;
	ctaLabel: string;
	busy: boolean;
	error?: string;
}

const KIND_LABELS: Record<SourceRef["kind"], string> = {
	"official-objectives": "Official objectives",
	"official-docs": "Official docs",
	"official-practice": "Official practice",
	community: "Community guide",
	"user-supplied": "Yours",
};

const KIND_ORDER: SourceRef["kind"][] = [
	"official-objectives",
	"official-practice",
	"official-docs",
	"user-supplied",
	"community",
];

/** Bare host for the card subtitle: "learn.microsoft.com", or the file name for local uploads. */
export function hostOf(source: Pick<SourceRef, "url" | "file">): string {
	if (source.url) {
		const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(source.url.trim());
		if (match) {
			return match[1].replace(/^www\./i, "");
		}
	}
	if (source.file) {
		return source.file.split(/[\\/]/).pop() ?? source.file;
	}
	return "no link";
}

export function toCandidates(sources: readonly SourceRef[]): SourceCandidate[] {
	return sources.map((source) => ({ ...source, included: true }));
}

export function toggleSource(list: readonly SourceCandidate[], id: string): SourceCandidate[] {
	return list.map((source) => (source.id === id ? { ...source, included: !source.included } : source));
}

export function removeSource(list: readonly SourceCandidate[], id: string): SourceCandidate[] {
	return list.filter((source) => source.id !== id);
}

export interface UserSourceInput {
	url?: string;
	file?: string;
	title?: string;
	rationale?: string;
}

function nextUserId(list: readonly SourceCandidate[]): string {
	let counter = list.filter((source) => source.id.startsWith("user-")).length + 1;
	const taken = new Set(list.map((source) => source.id));
	while (taken.has(`user-${counter}`)) {
		counter += 1;
	}
	return `user-${counter}`;
}

/** Anything the user hands us is trusted and used verbatim — that is the whole point of the affordance. */
export function addUserSource(
	list: readonly SourceCandidate[],
	input: UserSourceInput
): SourceCandidate[] {
	const url = input.url?.trim();
	const file = input.file?.trim();
	if (!url && !file) {
		return [...list];
	}
	if (url && !/^https?:\/\/\S+$/i.test(url)) {
		return [...list];
	}
	const duplicate = list.find(
		(source) =>
			(url && source.url?.toLowerCase() === url.toLowerCase()) ||
			(file && source.file?.toLowerCase() === file.toLowerCase())
	);
	if (duplicate) {
		return list.map((source) => (source.id === duplicate.id ? { ...source, included: true } : source));
	}
	const candidate: SourceCandidate = {
		id: nextUserId(list),
		title: input.title?.trim() || (url ? hostOf({ url }) : hostOf({ file })),
		url: url || undefined,
		file: file || undefined,
		kind: "user-supplied",
		trusted: true,
		rationale: input.rationale?.trim() || "You added this, so it is used verbatim.",
		included: true,
	};
	return [...list, candidate];
}

export function approvedSources(list: readonly SourceCandidate[], approvedAt: string): SourceRef[] {
	return list
		.filter((source) => source.included)
		.map(({ included: _included, ...source }) => ({ ...source, approvedAt }));
}

export function canApprove(list: readonly SourceCandidate[]): boolean {
	return list.some((source) => source.included);
}

function sortForDisplay(list: readonly SourceCandidate[]): SourceCandidate[] {
	return [...list].sort((a, b) => {
		const rank = KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
		return rank !== 0 ? rank : a.title.localeCompare(b.title);
	});
}

export interface SourcesModelInput {
	examId: string;
	examQuery: string;
	code: string;
	sources: readonly SourceCandidate[];
	busy?: boolean;
	error?: string;
}

export function buildSourcesModel(input: SourcesModelInput): SourcesModel {
	const sources = sortForDisplay(input.sources).map<SourceCard>((source) => ({
		...source,
		kindLabel: KIND_LABELS[source.kind],
		host: hostOf(source),
		trustLabel: source.trusted ? "Used verbatim" : "Paraphrased only",
	}));
	const approvedCount = sources.filter((source) => source.included).length;
	return {
		examId: input.examId,
		examQuery: input.examQuery,
		code: input.code,
		headline: input.busy
			? "Reading the web for your exam…"
			: sources.length > 0
				? "Here is what I found. You have the final say."
				: "No sources yet — add one you trust and we'll go from there.",
		why: "Everything in your plan, your notes and your questions is built from these pages, so it is worth thirty seconds of your time.",
		sources,
		approvedCount,
		canApprove: approvedCount > 0 && !input.busy,
		ctaLabel: approvedCount > 0 ? `Approve ${approvedCount} source${approvedCount === 1 ? "" : "s"} →` : "Pick at least one source",
		busy: Boolean(input.busy),
		error: input.error,
	};
}
