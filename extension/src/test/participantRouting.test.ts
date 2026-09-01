import * as assert from "assert";
import {
	detectIntent,
	extractExamSubject,
	interviewKey,
	looksLikeBareExamCode,
	summarizeStatus,
	type ChatIntent,
} from "../chat/routing";

describe("detectIntent", () => {
	const starting = [
		"prep me for AZ-104",
		"I want to study for the Claude cert",
		"help me pass the AWS Solutions Architect Associate",
		"studying for GH-300",
		"set up a new exam",
		"get me ready for CKA",
		"I'm prepping for DP-600",
	];

	for (const prompt of starting) {
		it(`treats "${prompt}" as a new exam`, () => {
			assert.strictEqual(detectIntent(prompt).intent, "new-exam");
		});
	}

	const asking: [string, ChatIntent][] = [
		["what's the difference between a managed identity and a service principal?", "ask"],
		["how does RAG grounding work again", "ask"],
		["what is a virtual network peering", "explain"],
		["explain conditional access", "explain"],
		["teach me about blob lifecycle policies", "explain"],
		["how am I doing?", "status"],
		["show me my streak", "status"],
		["what's on today?", "today"],
		["what should I study today", "today"],
	];

	for (const [prompt, intent] of asking) {
		it(`routes "${prompt}" to ${intent}`, () => {
			assert.strictEqual(detectIntent(prompt).intent, intent);
		});
	}

	it("lets slash commands win outright", () => {
		assert.strictEqual(detectIntent("anything at all", "plan").intent, "plan");
		assert.strictEqual(detectIntent("", "today").intent, "today");
		assert.strictEqual(detectIntent("kubernetes networking", "explain").subject, "kubernetes networking");
	});

	it("pulls the exam out of a /new prompt", () => {
		assert.strictEqual(detectIntent("AZ-104 Azure Administrator", "new").subject, "AZ-104 Azure Administrator");
	});

	it("keeps the named exam as the subject when starting", () => {
		assert.strictEqual(detectIntent("prep me for AZ-104").subject, "AZ-104");
		assert.strictEqual(detectIntent("I want to study for the Claude cert").subject, "Claude cert");
	});

	it("falls back to a plain question", () => {
		assert.strictEqual(detectIntent("").intent, "ask");
		assert.strictEqual(detectIntent("hello").intent, "ask");
	});
});

describe("extractExamSubject", () => {
	it("strips the leading intent verb", () => {
		assert.strictEqual(extractExamSubject("prep me for the AZ-104"), "AZ-104");
		assert.strictEqual(extractExamSubject("help me pass AWS SAA"), "AWS SAA");
	});

	it("returns undefined when nothing useful is left", () => {
		assert.strictEqual(extractExamSubject("prep me for"), undefined);
		assert.strictEqual(extractExamSubject("???"), undefined);
	});
});

describe("looksLikeBareExamCode", () => {
	it("recognises a code on its own", () => {
		assert.strictEqual(looksLikeBareExamCode("AZ-104"), true);
		assert.strictEqual(looksLikeBareExamCode(" ai-102 "), true);
		assert.strictEqual(looksLikeBareExamCode("AZ-104?"), true);
	});

	it("ignores codes buried in a sentence", () => {
		assert.strictEqual(looksLikeBareExamCode("what does AZ-104 cover"), false);
		assert.strictEqual(looksLikeBareExamCode("hello"), false);
	});
});

describe("interviewKey", () => {
	it("anchors on the first prompt of the session", () => {
		const first = interviewKey(undefined, "prep me for AZ-104");
		const second = interviewKey("prep me for AZ-104", "in 6 weeks");
		assert.strictEqual(first, second);
	});

	it("separates different sessions", () => {
		assert.notStrictEqual(interviewKey(undefined, "prep me for AZ-104"), interviewKey(undefined, "prep me for AI-102"));
	});

	it("never returns an empty key", () => {
		assert.ok(interviewKey(undefined, "   ").length > 0);
	});
});

describe("summarizeStatus", () => {
	it("mentions days, accuracy, streak, XP and the countdown", () => {
		const text = summarizeStatus({
			code: "AZ-104",
			title: "Azure Administrator",
			totalDays: 30,
			completedDays: 12,
			xp: 2400,
			streak: 6,
			longestStreak: 9,
			accuracy: 0.83,
			daysUntilExam: 18,
			nextDay: 13,
		});
		assert.match(text, /AZ-104/);
		assert.match(text, /12 of 30/);
		assert.match(text, /83%/);
		assert.match(text, /6 days/);
		assert.match(text, /best: 9/);
		assert.match(text, /2400/);
		assert.match(text, /18 days away/);
	});

	it("is encouraging rather than shaming on a rough start", () => {
		const text = summarizeStatus({
			code: "AI-102",
			title: "Azure AI Engineer",
			totalDays: 20,
			completedDays: 0,
			xp: 0,
			streak: 0,
			longestStreak: 0,
		});
		assert.match(text, /Day 1/);
		assert.doesNotMatch(text, /fail|behind|bad|lazy/i);
	});

	it("handles exam day and the day after", () => {
		const base = { code: "X", title: "Y", totalDays: 1, completedDays: 1, xp: 1, streak: 1, longestStreak: 1 };
		assert.match(summarizeStatus({ ...base, daysUntilExam: 0 }), /today/i);
		assert.match(summarizeStatus({ ...base, daysUntilExam: -2 }), /behind you/i);
	});
});
