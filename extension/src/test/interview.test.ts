import * as assert from "assert";
import {
	applyAnswer,
	describePolicy,
	isComplete,
	MIN_QUESTIONS_PER_DAY,
	nextQuestion,
	parseDayPolicy,
	parseDurationDays,
	parseExplicitDate,
	parseHours,
	pendingField,
	startInterview,
	suggestedFolder,
	summarize,
	toPlanConfig,
	type InterviewField,
	type InterviewState,
} from "../chat/interview";
import type { PlanConfig } from "../model/types";

const TODAY = new Date(Date.UTC(2026, 8, 1)); // 2026-09-01

function answer(state: InterviewState, text: string): InterviewState {
	return applyAnswer(state, text, TODAY).state;
}

function run(state: InterviewState, texts: string[]): InterviewState {
	return texts.reduce(answer, state);
}

function completed(overrides: string[] = []): InterviewState {
	const script = ["AZ-104 Azure Administrator", "in 6 weeks", "2 hours", "weekdays", "15", "yes"];
	return run(startInterview(), overrides.length > 0 ? overrides : script);
}

describe("interview state machine", () => {
	it("asks for every field and eventually completes", () => {
		let state = startInterview();
		const asked: InterviewField[] = [];
		const script = ["AZ-104 Azure Administrator", "March 14", "1.5", "mon wed fri", "20", "yes"];

		for (const reply of script) {
			const question = nextQuestion(state);
			assert.ok(question, "expected a question before every answer");
			asked.push(question.field);
			assert.ok(question.prompt.length > 10, "prompts should be conversational");
			assert.ok(question.suggestions.length > 0);
			state = answer(state, reply);
		}

		assert.deepStrictEqual(asked, ["exam", "timing", "hoursPerDay", "dayPolicy", "questionsPerDay", "gamified"]);
		assert.strictEqual(isComplete(state), true);
		assert.strictEqual(nextQuestion(state), undefined);
	});

	it("asks a follow-up only when the policy is genuinely custom", () => {
		const state = run(startInterview(), ["AZ-104", "30 days", "1", "custom days"]);
		// "custom days" names no day, so the parser rejects it and we stay on the policy question.
		assert.strictEqual(pendingField(state), "dayPolicy");

		const named = answer(state, "tue thu");
		assert.strictEqual(pendingField(named), "questionsPerDay");
		assert.deepStrictEqual(named.answers.customDays, [2, 4]);
	});

	it("seeds the exam when the user already named it", () => {
		const state = startInterview("prep me for AZ-104 Azure Administrator");
		assert.strictEqual(pendingField(state), "timing");
		assert.strictEqual(state.answers.examCode, "AZ-104");
		assert.strictEqual(suggestedFolder(state), "AZ-104 Prep");
	});
});

describe("date parsing", () => {
	const cases: [string, string][] = [
		["2027-03-14", "2027-03-14"],
		["March 14", "2027-03-14"],
		["march 14 2027", "2027-03-14"],
		["14 March 2027", "2027-03-14"],
		["Dec 1", "2026-12-01"],
		["in 6 weeks", "2026-10-13"],
		["30 days", "2026-10-01"],
		["six weeks", "2026-10-13"],
		["in 3 months", "2026-11-30"],
		["next month", "2026-10-01"],
		["next week", "2026-09-08"],
		["a couple of weeks", "2026-09-15"],
	];

	for (const [input, expected] of cases) {
		it(`reads "${input}" as ${expected}`, () => {
			const state = answer(run(startInterview(), ["AZ-104"]), input);
			assert.strictEqual(state.answers.examDate, expected);
		});
	}

	it("resolves 2026-03-14 as itself when it is still ahead of today", () => {
		const earlier = new Date(Date.UTC(2026, 0, 5));
		const state = applyAnswer(run(startInterview(), ["AZ-104"]), "2026-03-14", earlier).state;
		assert.strictEqual(state.answers.examDate, "2026-03-14");
	});

	it("parses explicit dates without touching the wall clock", () => {
		assert.strictEqual(parseExplicitDate("2030-01-02", TODAY)?.toISOString().slice(0, 10), "2030-01-02");
		assert.strictEqual(parseExplicitDate("nonsense", TODAY), undefined);
	});

	it("parses durations independently of dates", () => {
		assert.strictEqual(parseDurationDays("6 weeks"), 42);
		assert.strictEqual(parseDurationDays("tomorrow"), 1);
		assert.strictEqual(parseDurationDays("banana"), undefined);
	});

	it("both the duration and the explicit-date branch yield a usable examDate", () => {
		const byDuration = completed(["AZ-104", "6 weeks", "1", "all", "10", "yes"]);
		const byDate = completed(["AZ-104", "2027-01-05", "1", "all", "10", "yes"]);
		for (const state of [byDuration, byDate]) {
			const config = toPlanConfig(state, TODAY);
			assert.ok(config);
			assert.match(config.examDate, /^\d{4}-\d{2}-\d{2}$/);
			assert.ok(config.examDate > config.startDate);
		}
	});

	it("rejects a past exam date with a re-ask rather than an exception", () => {
		const before = run(startInterview(), ["AZ-104"]);
		const outcome = applyAnswer(before, "2020-01-01", TODAY);
		assert.strictEqual(outcome.accepted, false);
		assert.match(outcome.message ?? "", /future|been and gone/i);
		assert.strictEqual(pendingField(outcome.state), "timing");
		assert.strictEqual(outcome.state.answers.examDate, undefined);
		assert.ok(nextQuestion(outcome.state));
	});
});

describe("hours parsing", () => {
	const cases: [string, number][] = [
		["2", 2],
		["2h", 2],
		["2 hours", 2],
		["1.5", 1.5],
		["a couple of hours", 2],
		["an hour", 1],
		["30 minutes", 0.5],
		["half an hour", 0.5],
	];

	for (const [input, expected] of cases) {
		it(`reads "${input}" as ${expected} hours`, () => {
			const state = answer(run(startInterview(), ["AZ-104", "30 days"]), input);
			assert.strictEqual(state.answers.hoursPerDay, expected);
		});
	}

	it("clamps absurd answers into a sane range", () => {
		const long = answer(run(startInterview(), ["AZ-104", "30 days"]), "40 hours");
		assert.strictEqual(long.answers.hoursPerDay, 16);
		const tiny = answer(run(startInterview(), ["AZ-104", "30 days"]), "5 minutes");
		assert.strictEqual(tiny.answers.hoursPerDay, 0.5);
	});

	it("returns undefined for unparseable hours", () => {
		assert.strictEqual(parseHours("whenever"), undefined);
	});
});

describe("day policy parsing", () => {
	const cases: [string, string, number[] | undefined][] = [
		["weekends only", "weekends", undefined],
		["just weekends", "weekends", undefined],
		["no weekends", "weekdays", undefined],
		["weekdays", "weekdays", undefined],
		["mon to fri", "weekdays", undefined],
		["every day", "all", undefined],
		["daily", "all", undefined],
		["7 days a week", "all", undefined],
		["mon wed fri", "custom", [1, 3, 5]],
		["tue thu sat", "custom", [2, 4, 6]],
		["sat and sun", "weekends", undefined],
	];

	for (const [input, policy, days] of cases) {
		it(`maps "${input}" to ${policy}`, () => {
			const parsed = parseDayPolicy(input);
			assert.ok(parsed, `expected "${input}" to parse`);
			assert.strictEqual(parsed.policy, policy);
			assert.deepStrictEqual(parsed.days, days);
		});
	}

	it("stores customDays on the state and describes them", () => {
		const state = run(startInterview(), ["AZ-104", "30 days", "1", "mon wed fri"]);
		assert.strictEqual(state.answers.dayPolicy, "custom");
		assert.deepStrictEqual(state.answers.customDays, [1, 3, 5]);
		assert.strictEqual(describePolicy("custom", [1, 3, 5]), "Monday, Wednesday, Friday");
	});

	it("returns undefined for a phrase with no days in it", () => {
		assert.strictEqual(parseDayPolicy("whenever I feel like it"), undefined);
	});
});

describe("questions per day", () => {
	it("clamps 5 up to the floor of 10", () => {
		const outcome = applyAnswer(run(startInterview(), ["AZ-104", "30 days", "1", "all"]), "5 questions", TODAY);
		assert.strictEqual(outcome.accepted, true);
		assert.strictEqual(outcome.state.answers.questionsPerDay, MIN_QUESTIONS_PER_DAY);
		assert.match(outcome.message ?? "", /10/);
	});

	it("keeps a sensible answer as written", () => {
		const state = answer(run(startInterview(), ["AZ-104", "30 days", "1", "all"]), "15 questions");
		assert.strictEqual(state.answers.questionsPerDay, 15);
	});

	it("caps a wildly optimistic answer", () => {
		const state = answer(run(startInterview(), ["AZ-104", "30 days", "1", "all"]), "500");
		assert.strictEqual(state.answers.questionsPerDay, 60);
	});
});

describe("gamification answer", () => {
	it("reads yes and no", () => {
		const base = run(startInterview(), ["AZ-104", "30 days", "1", "all", "10"]);
		assert.strictEqual(answer(base, "yes please").answers.gamified, true);
		assert.strictEqual(answer(base, "no frills").answers.gamified, false);
	});
});

describe("garbage input", () => {
	const stages: [string[], InterviewField][] = [
		[[], "exam"],
		[["AZ-104"], "timing"],
		[["AZ-104", "30 days"], "hoursPerDay"],
		[["AZ-104", "30 days", "1"], "dayPolicy"],
		[["AZ-104", "30 days", "1", "all"], "questionsPerDay"],
		[["AZ-104", "30 days", "1", "all", "10"], "gamified"],
	];

	for (const [script, field] of stages) {
		it(`re-asks "${field}" without advancing`, () => {
			const before = run(startInterview(), script);
			const outcome = applyAnswer(before, "!!! ???", TODAY);
			assert.strictEqual(outcome.accepted, false);
			assert.ok(outcome.message && outcome.message.length > 0);
			assert.strictEqual(pendingField(outcome.state), field);
			assert.deepStrictEqual(outcome.state.answers, before.answers);
			assert.strictEqual(nextQuestion(outcome.state)?.field, field);
		});
	}

	it("gets more explicit the second time it asks", () => {
		const first = nextQuestion(startInterview());
		const second = nextQuestion(applyAnswer(startInterview(), "!!!", TODAY).state);
		assert.notStrictEqual(first?.prompt, second?.prompt);
		assert.strictEqual(second?.field, "exam");
	});
});

describe("toPlanConfig", () => {
	it("produces a valid PlanConfig", () => {
		const state = completed();
		const config = toPlanConfig(state, TODAY);
		assert.ok(config);
		const typed: PlanConfig = config;
		assert.strictEqual(typed.startDate, "2026-09-01");
		assert.strictEqual(typed.examDate, "2026-10-13");
		assert.strictEqual(typed.hoursPerDay, 2);
		assert.strictEqual(typed.dayPolicy, "weekdays");
		assert.strictEqual(typed.customDays, undefined);
		assert.strictEqual(typed.questionsPerDay, 15);
		assert.strictEqual(typed.includeReviewDays, true);
		assert.strictEqual(typed.includeFinalMock, true);
	});

	it("carries customDays through for a custom policy", () => {
		const config = toPlanConfig(completed(["AZ-104", "30 days", "1", "mon wed fri", "10", "yes"]), TODAY);
		assert.deepStrictEqual(config?.customDays, [1, 3, 5]);
	});

	it("returns undefined while the interview is unfinished", () => {
		assert.strictEqual(toPlanConfig(run(startInterview(), ["AZ-104"]), TODAY), undefined);
	});

	it("never emits fewer than the floor of questions per day", () => {
		const config = toPlanConfig(completed(["AZ-104", "30 days", "1", "all", "1", "yes"]), TODAY);
		assert.ok((config?.questionsPerDay ?? 0) >= MIN_QUESTIONS_PER_DAY);
	});
});

describe("summarize", () => {
	it("mentions every answer the user gave", () => {
		const recap = summarize(completed());
		assert.match(recap, /AZ-104 Azure Administrator/);
		assert.match(recap, /2026-10-13/);
		assert.match(recap, /2 hours/);
		assert.match(recap, /weekdays/i);
		assert.match(recap, /15/);
		assert.match(recap, /XP|streak|battle pass/i);
	});

	it("says so when gamification is switched off", () => {
		const recap = summarize(completed(["AZ-104", "30 days", "1", "all", "10", "no frills"]));
		assert.match(recap, /off/i);
	});
});
