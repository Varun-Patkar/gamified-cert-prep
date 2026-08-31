import * as assert from "assert";
import type { SourceRef } from "../model/types";
import {
	addUserSource,
	approvedSources,
	buildSourcesModel,
	canApprove,
	hostOf,
	removeSource,
	toCandidates,
	toggleSource,
} from "../views/sourcesModel";

const DISCOVERED: SourceRef[] = [
	{
		id: "src-objectives",
		title: "Skills measured",
		url: "https://learn.example.com/objectives",
		kind: "official-objectives",
		trusted: true,
		rationale: "The vendor's own list.",
	},
	{
		id: "src-guide",
		title: "Community study guide",
		url: "https://www.blog.example/guide",
		kind: "community",
		trusted: false,
	},
];

describe("views/sourcesModel", () => {
	it("includes every discovered source by default", () => {
		const candidates = toCandidates(DISCOVERED);
		assert.ok(candidates.every((source) => source.included));
		assert.strictEqual(canApprove(candidates), true);
	});

	it("extracts a readable host, stripping www", () => {
		assert.strictEqual(hostOf({ url: "https://www.blog.example/guide?x=1" }), "blog.example");
		assert.strictEqual(hostOf({ url: "https://learn.example.com/objectives" }), "learn.example.com");
		assert.strictEqual(hostOf({ file: "C:\\packs\\practice-test.pdf" }), "practice-test.pdf");
		assert.strictEqual(hostOf({}), "no link");
	});

	it("marks user-added sources as trusted and user-supplied", () => {
		const list = addUserSource(toCandidates(DISCOVERED), { url: "https://mycorp.example/practice-pack" });
		const added = list[list.length - 1];

		assert.strictEqual(added.kind, "user-supplied");
		assert.strictEqual(added.trusted, true);
		assert.strictEqual(added.included, true);
		assert.strictEqual(added.url, "https://mycorp.example/practice-pack");
		assert.ok(added.rationale && added.rationale.length > 0);
	});

	it("trusts local files the user attaches", () => {
		const list = addUserSource([], { file: "D:\\packs\\official-practice.pdf" });
		assert.strictEqual(list.length, 1);
		assert.strictEqual(list[0].kind, "user-supplied");
		assert.strictEqual(list[0].trusted, true);
		assert.strictEqual(list[0].title, "official-practice.pdf");
	});

	it("gives every user-added source a distinct id", () => {
		let list = addUserSource([], { url: "https://a.example/one" });
		list = addUserSource(list, { url: "https://a.example/two" });
		list = addUserSource(list, { file: "notes.pdf" });
		assert.strictEqual(new Set(list.map((source) => source.id)).size, 3);
	});

	it("ignores empty and malformed urls", () => {
		const base = toCandidates(DISCOVERED);
		assert.strictEqual(addUserSource(base, {}).length, base.length);
		assert.strictEqual(addUserSource(base, { url: "   " }).length, base.length);
		assert.strictEqual(addUserSource(base, { url: "not a url" }).length, base.length);
		assert.strictEqual(addUserSource(base, { url: "javascript:alert(1)" }).length, base.length);
	});

	it("re-includes an existing source instead of duplicating it", () => {
		const base = toggleSource(toCandidates(DISCOVERED), "src-guide");
		assert.strictEqual(base.find((source) => source.id === "src-guide")?.included, false);

		const list = addUserSource(base, { url: "https://www.blog.example/guide" });
		assert.strictEqual(list.length, base.length);
		assert.strictEqual(list.find((source) => source.id === "src-guide")?.included, true);
	});

	it("toggles inclusion without mutating the input", () => {
		const base = toCandidates(DISCOVERED);
		const toggled = toggleSource(base, "src-objectives");

		assert.strictEqual(toggled.find((source) => source.id === "src-objectives")?.included, false);
		assert.strictEqual(base.find((source) => source.id === "src-objectives")?.included, true);
		assert.strictEqual(toggleSource(toggled, "src-objectives")[0].included, true);
	});

	it("removes a source entirely", () => {
		const list = removeSource(toCandidates(DISCOVERED), "src-guide");
		assert.strictEqual(list.length, 1);
		assert.strictEqual(list[0].id, "src-objectives");
	});

	it("approval keeps only included sources and stamps them", () => {
		const list = toggleSource(toCandidates(DISCOVERED), "src-guide");
		const approved = approvedSources(list, "2026-01-01T00:00:00.000Z");

		assert.strictEqual(approved.length, 1);
		assert.strictEqual(approved[0].id, "src-objectives");
		assert.strictEqual(approved[0].approvedAt, "2026-01-01T00:00:00.000Z");
		assert.ok(!("included" in approved[0]), "the ui-only flag is stripped before writing");
	});

	it("requires at least one source before approval is possible", () => {
		let list = toCandidates(DISCOVERED);
		for (const source of DISCOVERED) {
			list = toggleSource(list, source.id);
		}
		assert.strictEqual(canApprove(list), false);
		assert.strictEqual(approvedSources(list, "now").length, 0);
		assert.strictEqual(canApprove([]), false);
	});
});

describe("views/sourcesModel view model", () => {
	const input = { examId: "ai-102-prep", examQuery: "AI-102", code: "AI-102", sources: toCandidates(DISCOVERED) };

	it("labels kinds, hosts and trust for the cards", () => {
		const model = buildSourcesModel(input);
		const objectives = model.sources[0];

		assert.strictEqual(objectives.kindLabel, "Official objectives");
		assert.strictEqual(objectives.host, "learn.example.com");
		assert.strictEqual(objectives.trustLabel, "Used verbatim");
		assert.strictEqual(model.sources[1].trustLabel, "Paraphrased only");
	});

	it("sorts official sources above community ones", () => {
		const model = buildSourcesModel({ ...input, sources: toCandidates([...DISCOVERED].reverse()) });
		assert.deepStrictEqual(
			model.sources.map((source) => source.kind),
			["official-objectives", "community"]
		);
	});

	it("counts approvals and pluralises the call to action", () => {
		assert.strictEqual(buildSourcesModel(input).ctaLabel, "Approve 2 sources →");
		assert.strictEqual(
			buildSourcesModel({ ...input, sources: toggleSource(input.sources, "src-guide") }).ctaLabel,
			"Approve 1 source →"
		);
	});

	it("blocks the call to action while nothing is selected or work is in flight", () => {
		let sources = input.sources;
		for (const source of DISCOVERED) {
			sources = toggleSource(sources, source.id);
		}
		assert.strictEqual(buildSourcesModel({ ...input, sources }).canApprove, false);
		assert.strictEqual(buildSourcesModel({ ...input, busy: true }).canApprove, false);
	});

	it("always explains why approval matters", () => {
		const model = buildSourcesModel(input);
		assert.ok(model.why.length > 0);
		assert.ok(model.headline.length > 0);
		assert.ok(buildSourcesModel({ ...input, sources: [] }).headline.includes("add one you trust"));
	});
});
