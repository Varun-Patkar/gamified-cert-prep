import * as assert from "assert";
import * as zlib from "zlib";
import {
	buildCompletionModel,
	buildExamResult,
	completionPrompt,
	completionToast,
	normalizeOutcome,
	scoreReportFileName,
	shouldOfferCompletion,
} from "../completion/examCompletion";
import { decodePdfTextOperators, extractPdfText, heuristicPrefill } from "../completion/scoreReport";
import type { ExamMeta } from "../model/types";

const meta = (over: Partial<ExamMeta> = {}): ExamMeta => ({
	schemaVersion: 1,
	id: "ai-102",
	vendor: "Microsoft",
	code: "AI-102",
	title: "Microsoft Certified: Azure AI Engineer Associate",
	status: "in-progress",
	legacy: false,
	gamified: true,
	folder: "AI-102 Prep",
	createdAt: "2026-05-01",
	examDate: "2026-06-01",
	...over,
});

describe("shouldOfferCompletion", () => {
	it("offers on the exam date itself", () => {
		assert.strictEqual(shouldOfferCompletion(meta(), "2026-06-01"), true);
	});

	it("offers after the exam date", () => {
		assert.strictEqual(shouldOfferCompletion(meta(), "2026-07-14"), true);
	});

	it("stays quiet before the exam date", () => {
		assert.strictEqual(shouldOfferCompletion(meta(), "2026-05-31"), false);
	});

	it("stays quiet once the campaign is already closed", () => {
		assert.strictEqual(shouldOfferCompletion(meta({ status: "completed" }), "2026-07-01"), false);
		assert.strictEqual(shouldOfferCompletion(meta({ status: "abandoned" }), "2026-07-01"), false);
		assert.strictEqual(shouldOfferCompletion(meta({ status: "planning" }), "2026-07-01"), false);
	});

	it("stays quiet without a usable exam date", () => {
		assert.strictEqual(shouldOfferCompletion(meta({ examDate: undefined }), "2026-07-01"), false);
		assert.strictEqual(shouldOfferCompletion(meta({ examDate: "next tuesday" }), "2026-07-01"), false);
		assert.strictEqual(shouldOfferCompletion(meta(), "not-a-date"), false);
	});
});

describe("completionPrompt", () => {
	it("says exam day on the day itself", () => {
		const prompt = completionPrompt(meta(), "2026-06-01");
		assert.ok(prompt.headline.toLowerCase().includes("exam day"));
		assert.ok(prompt.ctaLabel.length > 0);
	});

	it("is gentler once the date has passed", () => {
		const prompt = completionPrompt(meta(), "2026-06-20");
		assert.strictEqual(prompt.headline, "How did it go?");
		assert.ok(prompt.body.includes("AI-102"));
	});
});

describe("buildExamResult", () => {
	it("records a straightforward pass", () => {
		const built = buildExamResult({ outcome: "passed", score: "812", maxScore: "1000", passingScore: "700" });
		assert.ok(built.ok);
		assert.deepStrictEqual(built.result, { passed: true, score: 812, maxScore: 1000, passingScore: 700 });
	});

	it("records a fail without editorialising", () => {
		const built = buildExamResult({ outcome: "failed", score: "640", maxScore: "1000" });
		assert.ok(built.ok);
		assert.strictEqual(built.result.passed, false);
	});

	it("leaves pass/fail unset when the user would rather not say", () => {
		const built = buildExamResult({ outcome: "unsaid" });
		assert.ok(built.ok);
		assert.strictEqual(built.result.passed, undefined);
	});

	it("infers pass/fail from the numbers even when the user says nothing", () => {
		const built = buildExamResult({ outcome: "unsaid", score: "800", maxScore: "1000", passingScore: "700" });
		assert.ok(built.ok);
		assert.strictEqual(built.result.passed, true);
	});

	it("needs an outcome to be picked", () => {
		const built = buildExamResult({ score: "800" });
		assert.ok(!built.ok);
		assert.strictEqual(built.errors.length, 1);
	});

	it("rejects a score larger than its maximum", () => {
		const built = buildExamResult({ outcome: "passed", score: "1200", maxScore: "1000" });
		assert.ok(!built.ok);
		assert.ok(built.errors[0].includes("1200"));
	});

	it("rejects a passing score larger than the maximum", () => {
		const built = buildExamResult({ outcome: "passed", score: "800", maxScore: "1000", passingScore: "1400" });
		assert.ok(!built.ok);
	});

	it("rejects non-numeric and negative scores", () => {
		assert.ok(!buildExamResult({ outcome: "passed", score: "eight hundred" }).ok);
		assert.ok(!buildExamResult({ outcome: "passed", score: "-10" }).ok);
	});

	it("reads a bare small number as a percentage and says so", () => {
		const built = buildExamResult({ outcome: "passed", score: "78" });
		assert.ok(built.ok);
		assert.strictEqual(built.result.score, 78);
		assert.strictEqual(built.result.maxScore, 100);
		assert.strictEqual(built.warnings.length, 1);
	});

	it("reads an explicit percentage the same way", () => {
		const built = buildExamResult({ outcome: "passed", score: "78%" });
		assert.ok(built.ok);
		assert.deepStrictEqual([built.result.score, built.result.maxScore], [78, 100]);
	});

	it("leaves a large bare score alone rather than inventing a maximum", () => {
		const built = buildExamResult({ outcome: "passed", score: "812" });
		assert.ok(built.ok);
		assert.strictEqual(built.result.maxScore, undefined);
	});

	it("normalises and keeps a sane credential url", () => {
		const built = buildExamResult({ outcome: "passed", credentialUrl: "  https://learn.microsoft.com/x?y=1 " });
		assert.ok(built.ok);
		assert.strictEqual(built.result.credentialUrl, "https://learn.microsoft.com/x?y=1");
	});

	it("rejects junk and non-http credential links", () => {
		assert.ok(!buildExamResult({ outcome: "passed", credentialUrl: "not a link" }).ok);
		assert.ok(!buildExamResult({ outcome: "passed", credentialUrl: "javascript:alert(1)" }).ok);
	});

	it("stores the score report as a repo-relative posix path", () => {
		const built = buildExamResult({
			outcome: "passed",
			scoreReportFile: "AI-102 Prep\\AI-102-score-report.pdf",
		});
		assert.ok(built.ok);
		assert.strictEqual(built.result.scoreReportFile, "AI-102 Prep/AI-102-score-report.pdf");
	});

	it("drops a score report path that tries to escape the repo", () => {
		const built = buildExamResult({ outcome: "passed", scoreReportFile: "../../etc/passwd" });
		assert.ok(built.ok);
		assert.strictEqual(built.result.scoreReportFile, undefined);
	});

	it("omits every field the user left blank", () => {
		const built = buildExamResult({ outcome: "passed", score: "", maxScore: "  ", credentialUrl: "" });
		assert.ok(built.ok);
		assert.deepStrictEqual(built.result, { passed: true });
	});
});

describe("completion copy", () => {
	it("normalises the three outcomes and nothing else", () => {
		assert.strictEqual(normalizeOutcome("Passed"), "passed");
		assert.strictEqual(normalizeOutcome(" unsaid "), "unsaid");
		assert.strictEqual(normalizeOutcome("maybe"), undefined);
		assert.strictEqual(normalizeOutcome(undefined), undefined);
	});

	it("celebrates a pass and stays kind about a fail", () => {
		assert.ok(completionToast("AI-102", { passed: true }).includes("trophy case"));
		const failed = completionToast("AI-102", { passed: false });
		assert.ok(!/fail/i.test(failed), "the fail toast never uses the word");
		assert.ok(completionToast("AI-102", {}).includes("AI-102"));
	});

	it("names the score report after the exam code", () => {
		assert.strictEqual(scoreReportFileName("ai-102", ".PDF"), "AI-102-score-report.pdf");
		assert.strictEqual(scoreReportFileName("GH-300", "png"), "GH-300-score-report.png");
		assert.strictEqual(scoreReportFileName("", ""), "EXAM-score-report.pdf");
	});

	it("builds a model that always offers all three outcomes", () => {
		const model = buildCompletionModel({ meta: meta(), form: { outcome: "passed" } });
		assert.strictEqual(model.examId, "ai-102");
		assert.deepStrictEqual(
			model.outcomes.map((choice) => choice.value),
			["passed", "failed", "unsaid"],
		);
		assert.strictEqual(model.busy, false);
		assert.deepStrictEqual(model.errors, []);
	});
});

describe("score report extraction", () => {
	it("reads text out of Tj and TJ operators", () => {
		const content = "BT /F1 12 Tf (Score: 812) Tj T* [(Passing) -250 (score: 700)] TJ ET";
		const text = decodePdfTextOperators(content);
		assert.ok(text.includes("Score: 812"));
		assert.ok(text.includes("Passing"));
	});

	it("unescapes pdf string escapes", () => {
		assert.strictEqual(decodePdfTextOperators("(a\\(b\\)c) Tj").trim(), "a(b)c");
	});

	it("returns nothing for a stream with no text operators", () => {
		assert.strictEqual(decodePdfTextOperators("0 0 100 100 re f"), "");
	});

	it("inflates a compressed content stream", () => {
		const stream = zlib.deflateSync(Buffer.from("BT (You passed. Score: 900/1000) Tj ET", "latin1"));
		const pdf = Buffer.concat([
			Buffer.from("%PDF-1.4\n4 0 obj\n<< /Length 1 >>\nstream\n", "latin1"),
			stream,
			Buffer.from("\nendstream\nendobj\n", "latin1"),
		]);
		assert.ok(extractPdfText(pdf).includes("Score: 900/1000"));
	});

	it("reads an uncompressed content stream", () => {
		const pdf = Buffer.from("stream\nBT (Result: PASS) Tj ET\nendstream\n", "latin1");
		assert.ok(extractPdfText(pdf).includes("Result: PASS"));
	});

	it("never throws on bytes that are not a pdf at all", () => {
		assert.strictEqual(extractPdfText(Buffer.from([0, 1, 2, 3, 4])), "");
	});

	it("pulls score, maximum and passing score out of report text", () => {
		const form = heuristicPrefill("Your score: 812 / 1000\nPassing score: 700\nCongratulations, you passed.");
		assert.strictEqual(form.score, "812");
		assert.strictEqual(form.maxScore, "1000");
		assert.strictEqual(form.passingScore, "700");
		assert.strictEqual(form.outcome, "passed");
	});

	it("recognises a non-pass without guessing a pass", () => {
		assert.strictEqual(heuristicPrefill("Result: you did not pass this exam.").outcome, "failed");
	});

	it("picks up a credential link", () => {
		const form = heuristicPrefill("Share it: https://learn.microsoft.com/api/credentials/share/ABC123 today.");
		assert.strictEqual(form.credentialUrl, "https://learn.microsoft.com/api/credentials/share/ABC123");
	});

	it("returns an empty form rather than guessing from unrelated prose", () => {
		assert.deepStrictEqual(heuristicPrefill("Thank you for testing with us."), {});
	});

	it("feeds straight into buildExamResult", () => {
		const built = buildExamResult(heuristicPrefill("Score: 812 out of 1000. Passing score: 700. You passed."));
		assert.ok(built.ok);
		assert.deepStrictEqual(built.result, { passed: true, score: 812, maxScore: 1000, passingScore: 700 });
	});
});
