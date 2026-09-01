import * as assert from "assert";
import type { PlanDay, Question, QuestionBank } from "../model/types";
import {
	gradeQuestion,
	MIN_QUESTIONS,
	normalizeBank,
	normalizeQuestion,
	selectQuestions,
	summarizeQuiz,
	toClientQuestion,
	type QuizQuestion,
} from "../quiz/quizEngine";

function mc(overrides: Partial<Question> = {}): Question {
	return {
		id: "q001",
		type: "mc",
		question: "Which pillar is violated?",
		options: ["A. Reliability", "B. Security", "C. Cost", "D. Performance"],
		correctAnswer: "A",
		explanation: "Retries are a reliability control.",
		topic: "Well-Architected / Reliability",
		...overrides,
	};
}

function normalize(raw: Question): QuizQuestion {
	const question = normalizeQuestion(raw, "1", "Plan");
	assert.ok(question, `expected ${raw.id} to normalize`);
	return question;
}

describe("normalizeQuestion", () => {
	it("reads letter-prefixed single choice options", () => {
		const question = normalize(mc());
		assert.strictEqual(question.kind, "single");
		assert.deepStrictEqual(
			question.options.map((option) => option.key),
			["A", "B", "C", "D"]
		);
		assert.strictEqual(question.options[0].label, "Reliability");
		assert.deepStrictEqual(question.answer, ["A"]);
		assert.strictEqual(question.domainName, "Plan");
	});

	it("reads multi-select answers", () => {
		const question = normalize(
			mc({ id: "q039", type: "multi", correctAnswer: undefined, correctAnswers: ["A", "C"] })
		);
		assert.strictEqual(question.kind, "multi");
		assert.deepStrictEqual(question.answer, ["A", "C"]);
	});

	it("reads yes/no statement blocks", () => {
		const question = normalize({
			id: "q068",
			type: "yesno",
			question: "For each statement, select Yes if true:",
			options: [],
			correctAnswer: "",
			statements: ["One", "Two", "Three"],
			statementAnswers: ["No", "Yes", "Yes"],
		} as unknown as Question);
		assert.strictEqual(question.kind, "yesno");
		assert.strictEqual(question.groups.length, 3);
		assert.deepStrictEqual(question.answer, ["No", "Yes", "Yes"]);
		assert.deepStrictEqual(
			question.groups[0].options.map((option) => option.key),
			["Yes", "No"]
		);
	});

	it("reads dropdown/matching blocks", () => {
		const question = normalize({
			id: "q021",
			type: "dropdown",
			question: "Match each item.",
			options: [],
			correctAnswer: "",
			dropdowns: [
				{ label: "First:", options: ["alpha", "beta"], correctIndex: 1, correctAnswer: "beta" },
				{ label: "Second:", options: ["gamma", "delta"], correctIndex: 0, correctAnswer: "gamma" },
			],
		} as unknown as Question);
		assert.strictEqual(question.kind, "matching");
		assert.deepStrictEqual(question.answer, ["g0o1", "g1o0"]);
		assert.strictEqual(question.groups[0].label, "First:");
	});

	it("matches an answer given as full option text", () => {
		const question = normalize(mc({ correctAnswer: "Security" }));
		assert.deepStrictEqual(question.answer, ["B"]);
	});

	it("skips ungraded or answerless questions", () => {
		assert.strictEqual(normalizeQuestion(mc({ ungraded: true }), "1", "Plan"), undefined);
		assert.strictEqual(normalizeQuestion(mc({ correctAnswer: "Z" }), "1", "Plan"), undefined);
		assert.strictEqual(normalizeQuestion(mc({ options: ["A. only"] }), "1", "Plan"), undefined);
	});

	it("hides the answer key from the client payload", () => {
		const client = toClientQuestion(normalize(mc())) as unknown as Record<string, unknown>;
		assert.strictEqual(client.answer, undefined);
		assert.strictEqual(client.explanation, undefined);
	});
});

describe("gradeQuestion", () => {
	it("grades single choice", () => {
		const question = normalize(mc());
		assert.strictEqual(gradeQuestion(question, ["A"]).correct, true);
		assert.strictEqual(gradeQuestion(question, ["a"]).correct, true);
		assert.strictEqual(gradeQuestion(question, ["B"]).correct, false);
		assert.strictEqual(gradeQuestion(question, []).correct, false);
	});

	it("requires the exact multi-select set — partial answers are wrong", () => {
		const question = normalize(mc({ type: "multi", correctAnswer: undefined, correctAnswers: ["A", "C", "D"] }));
		assert.strictEqual(gradeQuestion(question, ["A", "C", "D"]).correct, true);
		assert.strictEqual(gradeQuestion(question, ["D", "A", "C"]).correct, true);
		assert.strictEqual(gradeQuestion(question, ["A", "C"]).correct, false);
		assert.strictEqual(gradeQuestion(question, ["A", "B", "C", "D"]).correct, false);
	});

	it("grades yes/no per statement", () => {
		const question = normalize({
			id: "y1",
			type: "yesno",
			question: "?",
			options: [],
			correctAnswer: "",
			statements: ["One", "Two"],
			statementAnswers: ["Yes", "No"],
		} as unknown as Question);
		assert.strictEqual(gradeQuestion(question, ["Yes", "No"]).correct, true);
		assert.strictEqual(gradeQuestion(question, ["Yes", "Yes"]).correct, false);
		assert.strictEqual(gradeQuestion(question, ["Yes"]).correct, false);
	});

	it("grades matching per row", () => {
		const question = normalize({
			id: "d1",
			type: "dropdown",
			question: "?",
			options: [],
			correctAnswer: "",
			dropdowns: [
				{ label: "a", options: ["x", "y"], correctIndex: 0 },
				{ label: "b", options: ["x", "y"], correctIndex: 1 },
			],
		} as unknown as Question);
		assert.strictEqual(gradeQuestion(question, ["g0o0", "g1o1"]).correct, true);
		assert.strictEqual(gradeQuestion(question, ["g0o1", "g1o1"]).correct, false);
	});
});

describe("summarizeQuiz", () => {
	const questions = [
		normalize(mc({ id: "a", topic: "Security" })),
		normalize(mc({ id: "b", topic: "Security" })),
		normalize(mc({ id: "c", topic: "ALM" })),
		normalize(mc({ id: "d", topic: "Governance" })),
	];

	it("computes accuracy and the missed list", () => {
		const graded = [
			gradeQuestion(questions[0], ["A"]),
			gradeQuestion(questions[1], ["B"]),
			gradeQuestion(questions[2], ["C"]),
			gradeQuestion(questions[3], ["A"]),
		];
		const outcome = summarizeQuiz(questions, graded);
		assert.strictEqual(outcome.total, 4);
		assert.strictEqual(outcome.correct, 2);
		assert.strictEqual(outcome.accuracy, 0.5);
		assert.deepStrictEqual(outcome.missedQuestionIds, ["b", "c"]);
	});

	it("extracts weak topics most frequent first", () => {
		const graded = questions.map((question) => gradeQuestion(question, ["B"]));
		const outcome = summarizeQuiz(questions, graded);
		assert.deepStrictEqual(outcome.weakTopicIds, ["Security", "ALM", "Governance"]);
	});

	it("breaks the score down per domain", () => {
		const other = normalizeQuestion(mc({ id: "e" }), "2", "Design");
		assert.ok(other);
		const all = [...questions, other];
		const graded = all.map((question, index) => gradeQuestion(question, [index === 0 ? "A" : "B"]));
		const outcome = summarizeQuiz(all, graded);
		assert.deepStrictEqual(
			outcome.domains.map((row) => `${row.domainId}:${row.correct}/${row.total}`),
			["1:1/4", "2:0/1"]
		);
	});

	it("returns zero accuracy for an empty run", () => {
		assert.strictEqual(summarizeQuiz([], []).accuracy, 0);
	});
});

function bankOf(count: number, domainId = "1"): QuestionBank {
	return {
		examCode: "AB-100",
		domains: [
			{
				domainId,
				domainName: `Domain ${domainId}`,
				questions: Array.from({ length: count }, (_value, index) =>
					mc({ id: `${domainId}-q${index}`, topic: index % 2 === 0 ? "Security" : "ALM" })
				),
			},
		],
	};
}

function planDay(overrides: Partial<PlanDay> = {}): PlanDay {
	return {
		day: 3,
		date: "2026-08-14",
		kind: "study",
		title: "Security",
		domainId: "1",
		topicIds: ["Security"],
		questionCount: 5,
		sessionFile: "sessions/day-03.md",
		...overrides,
	};
}

describe("selectQuestions", () => {
	it("honours the ten question minimum even when the plan asks for fewer", () => {
		const selected = selectQuestions({ bank: bankOf(40), day: planDay({ questionCount: 5 }) });
		assert.strictEqual(selected.length, MIN_QUESTIONS);
	});

	it("honours a larger requested count", () => {
		const selected = selectQuestions({ bank: bankOf(40), day: planDay({ questionCount: 25 }) });
		assert.strictEqual(selected.length, 25);
	});

	it("never asks for more than the bank holds", () => {
		const selected = selectQuestions({ bank: bankOf(4), day: planDay({ questionCount: 30 }) });
		assert.strictEqual(selected.length, 4);
	});

	it("prefers the day's domain", () => {
		const bank: QuestionBank = {
			examCode: "AB-100",
			domains: [...bankOf(12, "1").domains, ...bankOf(12, "2").domains],
		};
		const selected = selectQuestions({ bank, day: planDay({ domainId: "2", questionCount: 10 }) });
		assert.ok(selected.every((question) => question.domainId === "2"));
	});

	it("avoids recently used questions when it can", () => {
		const bank = bankOf(20);
		const recent = ["1-q0", "1-q1", "1-q2"];
		const selected = selectQuestions({ bank, day: planDay({ questionCount: 10, topicIds: [] }), recentQuestionIds: recent });
		assert.ok(selected.every((question) => !recent.includes(question.id)));
	});

	it("falls back to recent questions rather than short-changing the set", () => {
		const bank = bankOf(10);
		const recent = bank.domains[0].questions.map((question) => question.id);
		const selected = selectQuestions({ bank, day: planDay({ questionCount: 10 }), recentQuestionIds: recent });
		assert.strictEqual(selected.length, 10);
	});

	it("restricts to an explicit id list for retries", () => {
		const selected = selectQuestions({ bank: bankOf(20), onlyQuestionIds: ["1-q3", "1-q7"] });
		assert.deepStrictEqual(
			selected.map((question) => question.id),
			["1-q3", "1-q7"]
		);
	});

	it("is deterministic for a given seed", () => {
		const first = selectQuestions({ bank: bankOf(30), day: planDay(), seed: 42 });
		const second = selectQuestions({ bank: bankOf(30), day: planDay(), seed: 42 });
		assert.deepStrictEqual(first.map((q) => q.id), second.map((q) => q.id));
	});
});

describe("normalizeBank", () => {
	it("flattens every domain and tolerates a missing bank", () => {
		assert.strictEqual(normalizeBank(bankOf(6)).length, 6);
		assert.deepStrictEqual(normalizeBank(undefined), []);
	});
});
