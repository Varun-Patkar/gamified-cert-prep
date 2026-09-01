import * as assert from "assert";
import {
	answerCopy,
	moodFor,
	nextAction,
	resultCopy,
	SNARK_THRESHOLD,
	TRIUMPH_THRESHOLD,
	type ToneInput,
} from "../copy/tone";

const SHAMING = [
	"stupid",
	"dumb",
	"idiot",
	"pathetic",
	"embarrassing",
	"hopeless",
	"worthless",
	"loser",
	"shame",
	"ashamed",
	"disappoint",
	"terrible",
	"awful",
	"failure",
	"failed",
	"bad at",
	"useless",
	"lazy",
];

function input(overrides: Partial<ToneInput> = {}): ToneInput {
	return { accuracy: 0.8, correct: 8, total: 10, attempt: 1, streak: 3, ...overrides };
}

function allStrings(copy: { headline: string; body: string; nextAction: string }): string[] {
	return [copy.headline, copy.body, copy.nextAction];
}

describe("moodFor", () => {
	it("bands by accuracy", () => {
		assert.strictEqual(moodFor(TRIUMPH_THRESHOLD), "triumph");
		assert.strictEqual(moodFor(0.6), "solid");
		assert.strictEqual(moodFor(SNARK_THRESHOLD), "solid");
		assert.strictEqual(moodFor(SNARK_THRESHOLD - 0.01), "wobble");
		assert.strictEqual(moodFor(Number.NaN), "wobble");
	});
});

describe("resultCopy", () => {
	it("is celebratory on a high score", () => {
		const copy = resultCopy(input({ accuracy: 1, correct: 10, total: 10 }));
		assert.strictEqual(copy.mood, "triumph");
		assert.ok(copy.headline.length > 0);
		assert.ok(copy.nextAction.toLowerCase().includes("next day"));
	});

	it("is lightly snarky but still actionable on a low score", () => {
		const copy = resultCopy(input({ accuracy: 0.2, correct: 2, total: 10, weakTopics: ["Governance"] }));
		assert.strictEqual(copy.mood, "wobble");
		assert.ok(copy.nextAction.includes("Governance"));
		assert.ok(copy.nextAction.includes("Retry the ones I missed"));
	});

	it("names a concrete next action in every band", () => {
		for (const accuracy of [0, 0.1, 0.39, 0.4, 0.7, 0.89, 0.9, 1]) {
			const copy = resultCopy(input({ accuracy, correct: Math.round(accuracy * 10) }));
			assert.ok(copy.nextAction.trim().length > 0, `no action for ${accuracy}`);
			assert.ok(/re-?read|retry|next day|skim|session/i.test(copy.nextAction), `vague action for ${accuracy}`);
		}
	});

	it("is deterministic for identical input", () => {
		assert.deepStrictEqual(resultCopy(input()), resultCopy(input()));
	});

	it("flags a retake without penalising the reader", () => {
		const copy = resultCopy(input({ attempt: 2 }));
		assert.ok(copy.body.includes("Retake"));
		assert.ok(SHAMING.every((word) => !copy.body.toLowerCase().includes(word)));
	});

	it("never shames the reader at any accuracy", () => {
		for (let correct = 0; correct <= 10; correct += 1) {
			for (const attempt of [1, 2]) {
				const copy = resultCopy(input({ accuracy: correct / 10, correct, attempt }));
				for (const text of allStrings(copy)) {
					const lower = text.toLowerCase();
					for (const word of SHAMING) {
						assert.ok(!lower.includes(word), `"${text}" contains "${word}"`);
					}
				}
			}
		}
	});
});

describe("nextAction", () => {
	it("mentions the weak topic when one is known", () => {
		assert.ok(nextAction(input({ accuracy: 0.5, weakTopics: ["ALM"] })).includes("ALM"));
	});

	it("falls back to a count when no topic is available", () => {
		const action = nextAction(input({ accuracy: 0.5, correct: 6, total: 10, weakTopics: [] }));
		assert.ok(action.includes("4"));
	});

	it("ignores blank topics", () => {
		assert.ok(!nextAction(input({ accuracy: 0.2, weakTopics: ["", "  "] })).includes('""'));
	});
});

describe("answerCopy", () => {
	it("stays kind on a wrong answer and points at the right one", () => {
		const text = answerCopy(false, 0);
		assert.ok(SHAMING.every((word) => !text.toLowerCase().includes(word)));
		assert.ok(text.length > 0);
	});

	it("escalates with the streak", () => {
		assert.strictEqual(answerCopy(true, 1), "Correct.");
		assert.ok(answerCopy(true, 5).includes("5"));
		assert.ok(answerCopy(true, 9).includes("9"));
	});
});
