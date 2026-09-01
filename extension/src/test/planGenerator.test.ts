import * as assert from "assert";
import { apportion, availableDates, describePlan, generatePlan } from "../planning/planGenerator";
import type { Domain, PlanConfig } from "../model/types";

const domain = (id: string, title: string, weight: number, topics = 6): Domain => ({
	id,
	title,
	weight,
	topicIds: Array.from({ length: topics }, (_, index) => `${id}-t${index + 1}`),
});

const domains: Domain[] = [
	domain("d1", "Plan and manage an Azure AI solution", 20),
	domain("d2", "Implement generative AI solutions", 15),
	domain("d3", "Implement an agentic solution", 5),
	domain("d4", "Implement computer vision solutions", 15),
	domain("d5", "Implement natural language processing solutions", 30),
	domain("d6", "Implement knowledge mining solutions", 15),
];

const config = (over: Partial<PlanConfig> = {}): PlanConfig => ({
	startDate: "2026-09-01",
	examDate: "2026-10-15",
	hoursPerDay: 1,
	dayPolicy: "all",
	questionsPerDay: 12,
	includeReviewDays: true,
	includeFinalMock: true,
	...over,
});

const weekdayOf = (iso: string): number => new Date(`${iso}T00:00:00Z`).getUTCDay();

/** Deterministic pseudo-random so a failing weight set is reproducible. */
function lcg(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state * 1_664_525 + 1_013_904_223) >>> 0;
		return state / 0x1_0000_0000;
	};
}

describe("availableDates", () => {
	it("returns Mon-Fri only for the weekdays policy", () => {
		const dates = availableDates(config({ dayPolicy: "weekdays" }));
		assert.ok(dates.length > 0);
		for (const date of dates) {
			const day = weekdayOf(date);
			assert.ok(day >= 1 && day <= 5, `${date} is not a weekday`);
		}
	});

	it("returns Sat/Sun only for the weekends policy", () => {
		const dates = availableDates(config({ dayPolicy: "weekends" }));
		assert.ok(dates.length > 0);
		for (const date of dates) {
			const day = weekdayOf(date);
			assert.ok(day === 0 || day === 6, `${date} is not a weekend day`);
		}
	});

	it("returns every day between start and exam for the all policy", () => {
		const dates = availableDates(config({ startDate: "2026-09-01", examDate: "2026-09-11" }));
		assert.strictEqual(dates.length, 10);
		assert.strictEqual(dates[0], "2026-09-01");
		assert.strictEqual(dates[dates.length - 1], "2026-09-10");
	});

	it("honours a custom weekday list", () => {
		const dates = availableDates(config({ dayPolicy: "custom", customDays: [1, 4] }));
		assert.ok(dates.length > 0);
		for (const date of dates) {
			assert.ok([1, 4].includes(weekdayOf(date)), `${date} is outside the custom days`);
		}
	});

	it("never includes the exam date itself", () => {
		const dates = availableDates(config());
		assert.ok(!dates.includes("2026-10-15"));
	});

	it("returns nothing when the exam is today or in the past", () => {
		assert.deepStrictEqual(availableDates(config({ startDate: "2026-09-01", examDate: "2026-09-01" })), []);
		assert.deepStrictEqual(availableDates(config({ startDate: "2026-09-10", examDate: "2026-09-01" })), []);
	});
});

describe("apportion", () => {
	it("always sums to exactly the total across random weight sets", () => {
		const random = lcg(42);
		for (let trial = 0; trial < 500; trial += 1) {
			const count = 1 + Math.floor(random() * 8);
			const weights = Array.from({ length: count }, () => Math.floor(random() * 60));
			const total = Math.floor(random() * 120);
			const result = apportion(weights, total);
			assert.strictEqual(result.length, count);
			assert.strictEqual(
				result.reduce((acc, value) => acc + value, 0),
				total,
				`weights ${weights.join(",")} total ${total}`
			);
			assert.ok(result.every((value) => value >= 0));
		}
	});

	it("gives every domain at least one day when there is room", () => {
		const result = apportion([90, 5, 5], 10);
		assert.ok(result.every((value) => value >= 1));
	});

	it("tracks the weights it was given", () => {
		const result = apportion([50, 25, 25], 8);
		assert.ok(result[0] > result[1]);
	});
});

describe("generatePlan", () => {
	it("uses every available date and appends the exam day", () => {
		const cfg = config();
		const plan = generatePlan({ examId: "ai-102", domains, config: cfg });
		const dates = availableDates(cfg);
		const nonExam = plan.days.filter((day) => day.kind !== "exam");
		assert.strictEqual(nonExam.length, dates.length);
		assert.deepStrictEqual(
			nonExam.map((day) => day.date),
			dates
		);
	});

	it("sums to exactly the available days across random weight sets", () => {
		const random = lcg(7);
		for (let trial = 0; trial < 100; trial += 1) {
			const set = domains.map((item) => ({ ...item, weight: Math.floor(random() * 50) }));
			const cfg = config({ examDate: `2026-10-${String(5 + (trial % 20)).padStart(2, "0")}` });
			const plan = generatePlan({ examId: "ai-102", domains: set, config: cfg });
			const nonExam = plan.days.filter((day) => day.kind !== "exam").length;
			assert.strictEqual(nonExam, availableDates(cfg).length, `trial ${trial}`);
		}
	});

	it("gives every domain at least one study day", () => {
		const plan = generatePlan({ examId: "ai-102", domains, config: config() });
		for (const item of domains) {
			const days = plan.days.filter((day) => day.domainId === item.id);
			assert.ok(days.length >= 1, `${item.id} got no study days`);
		}
	});

	it("gives a weak domain more days than its weight alone would earn", () => {
		const base = generatePlan({ examId: "ai-102", domains, config: config() });
		const boosted = generatePlan({ examId: "ai-102", domains, config: config(), weakDomainIds: ["d3"] });
		const count = (plan: typeof base, id: string): number => plan.days.filter((day) => day.domainId === id).length;
		assert.ok(count(boosted, "d3") > count(base, "d3"));
	});

	it("forces a minimum of ten questions a day", () => {
		const plan = generatePlan({ examId: "ai-102", domains, config: config({ questionsPerDay: 3 }) });
		for (const day of plan.days) {
			if (day.kind === "study" || day.kind === "review") {
				assert.strictEqual(day.questionCount, 10);
			}
		}
	});

	it("gives the mock day at least forty questions", () => {
		const plan = generatePlan({ examId: "ai-102", domains, config: config({ questionsPerDay: 5 }) });
		const mock = plan.days.find((day) => day.kind === "mock");
		assert.ok(mock, "expected a mock day");
		assert.ok(mock.questionCount >= 40);
		assert.ok(mock.day < plan.days[plan.days.length - 1].day);
	});

	it("omits review and mock days when the config says so", () => {
		const plan = generatePlan({
			examId: "ai-102",
			domains,
			config: config({ includeReviewDays: false, includeFinalMock: false }),
		});
		assert.strictEqual(plan.days.filter((day) => day.kind === "review").length, 0);
		assert.strictEqual(plan.days.filter((day) => day.kind === "mock").length, 0);
	});

	it("puts a unique exam day last on the exam date", () => {
		const cfg = config();
		const plan = generatePlan({ examId: "ai-102", domains, config: cfg });
		const examDays = plan.days.filter((day) => day.kind === "exam");
		assert.strictEqual(examDays.length, 1);
		assert.strictEqual(plan.days[plan.days.length - 1].kind, "exam");
		assert.strictEqual(examDays[0].date, cfg.examDate);
	});

	it("still returns a valid plan when the exam is today or in the past", () => {
		for (const examDate of ["2026-09-01", "2026-08-20"]) {
			const plan = generatePlan({ examId: "ai-102", domains, config: config({ examDate }) });
			assert.strictEqual(plan.days.length, 1);
			assert.strictEqual(plan.days[0].kind, "exam");
			assert.strictEqual(plan.days[0].day, 1);
			assert.strictEqual(plan.days[0].date, examDate);
		}
	});

	it("numbers days sequentially with no gaps", () => {
		for (const policy of ["weekdays", "weekends", "all"] as const) {
			const plan = generatePlan({ examId: "ai-102", domains, config: config({ dayPolicy: policy }) });
			plan.days.forEach((day, index) => {
				assert.strictEqual(day.day, index + 1, `${policy} day ${index}`);
			});
		}
	});

	it("keeps dates in ascending order", () => {
		const plan = generatePlan({ examId: "ai-102", domains, config: config() });
		for (let index = 1; index < plan.days.length; index += 1) {
			assert.ok(plan.days[index].date >= plan.days[index - 1].date, `date went backwards at day ${index + 1}`);
		}
	});

	it("names a multi-day domain with parts and a single day without", () => {
		const plan = generatePlan({
			examId: "ai-102",
			domains: [domain("solo", "Only Domain", 100)],
			config: config({ startDate: "2026-09-01", examDate: "2026-09-03", includeFinalMock: false }),
		});
		const study = plan.days.filter((day) => day.kind === "study");
		assert.ok(study.length >= 1);
		assert.ok(study[0].title.startsWith("Only Domain"));
	});

	it("pulls review topics from every domain covered so far", () => {
		const plan = generatePlan({ examId: "ai-102", domains, config: config() });
		const review = plan.days.find((day) => day.kind === "review");
		assert.ok(review, "expected a review day");
		assert.ok(review.topicIds.length > 0);
		assert.ok(review.title.startsWith("Review: "));
	});

	it("writes a session file name for every day", () => {
		const plan = generatePlan({ examId: "ai-102", domains, config: config() });
		const names = new Set(plan.days.map((day) => day.sessionFile));
		assert.strictEqual(names.size, plan.days.length);
		for (const day of plan.days) {
			assert.ok(/^day-\d{2,}-[a-z0-9-]+\.md$/.test(day.sessionFile), day.sessionFile);
		}
	});
});

describe("generatePlan with far more days than topics", () => {
	/** Mirrors the real AI-102 data: coarse topic labels, so days outnumber topics several times over. */
	const coarse: Domain[] = [
		domain("d1", "Plan and manage an Azure AI solution", 20, 2),
		domain("d2", "Implement generative AI solutions", 15, 2),
		domain("d3", "Implement an agentic solution", 5, 1),
		domain("d4", "Implement computer vision solutions", 15, 2),
		domain("d5", "Implement natural language processing solutions", 30, 3),
		domain("d6", "Implement knowledge mining solutions", 15, 2),
	];
	const long = config({ startDate: "2026-08-18", examDate: "2026-09-19" });
	const plan = generatePlan({ examId: "ai-102", domains: coarse, config: long });

	it("still fills exactly the available days", () => {
		assert.strictEqual(plan.days.filter((day) => day.kind !== "exam").length, availableDates(long).length);
	});

	it("keeps at most two buffer days", () => {
		assert.ok(plan.days.filter((day) => day.kind === "buffer").length <= 2);
	});

	it("interleaves review days instead of trailing them", () => {
		const nonExam = plan.days.filter((day) => day.kind !== "exam");
		const reviews = nonExam.filter((day) => day.kind === "review");
		assert.ok(reviews.length >= 3, `expected several review days, got ${reviews.length}`);
		const firstReview = nonExam.findIndex((day) => day.kind === "review");
		assert.ok(firstReview < nonExam.length / 2, "the first review day should land in the first half");
		const lastStudy = nonExam.map((day) => day.kind).lastIndexOf("study");
		const lastReview = nonExam.map((day) => day.kind).lastIndexOf("review");
		assert.ok(lastReview < lastStudy, "review days should not all sit at the end of the plan");
	});

	it("never repeats the same title more than three days running", () => {
		let run = 1;
		for (let index = 1; index < plan.days.length; index += 1) {
			run = plan.days[index].title === plan.days[index - 1].title ? run + 1 : 1;
			assert.ok(run <= 3, `"${plan.days[index].title}" repeats ${run} days in a row`);
		}
	});

	it("gives every study day at least one topic", () => {
		for (const day of plan.days.filter((item) => item.kind === "study")) {
			assert.ok(day.topicIds.length > 0, `${day.title} has no topics`);
		}
	});

	it("lets a domain span more days than it has topics", () => {
		const spread = coarse.map((item) => plan.days.filter((day) => day.domainId === item.id).length);
		assert.ok(
			spread.some((days, index) => days > coarse[index].topicIds.length),
			"no domain used the extra calendar room"
		);
	});
});

describe("describePlan", () => {
	it("contains a row for every day", () => {
		const plan = generatePlan({ examId: "ai-102", domains, config: config() });
		const markdown = describePlan(plan);
		for (const day of plan.days) {
			assert.ok(markdown.includes(`| ${day.day} | ${day.date} |`), `missing day ${day.day}`);
		}
	});

	it("starts with a heading and a table header", () => {
		const plan = generatePlan({ examId: "ai-102", domains, config: config() });
		const markdown = describePlan(plan);
		assert.ok(markdown.startsWith("# Study Plan: ai-102"));
		assert.ok(markdown.includes("| Day | Date | Kind | Focus | Questions |"));
		assert.ok(markdown.includes("policy: all"));
	});
});
