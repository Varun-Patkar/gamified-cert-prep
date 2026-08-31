/**
 * Every user-facing quiz result string lives here.
 * Bubbly by default; lightly snarky under 40%; never shaming, and always ending on a concrete action.
 */

export const SNARK_THRESHOLD = 0.4;
export const TRIUMPH_THRESHOLD = 0.9;

export type ToneMood = "triumph" | "solid" | "wobble";

export interface ToneInput {
	accuracy: number;
	correct: number;
	total: number;
	attempt: number;
	streak: number;
	weakTopics?: string[];
}

export interface ToneCopy {
	mood: ToneMood;
	headline: string;
	body: string;
	nextAction: string;
}

const TRIUMPH_HEADLINES = [
	"Flawless run.",
	"That was a clinic.",
	"Chef's kiss.",
	"Absolutely dialled in.",
];

const SOLID_HEADLINES = [
	"Solid session.",
	"That'll do nicely.",
	"Good ground covered.",
	"Steady progress banked.",
];

const WOBBLE_HEADLINES = [
	"Well. That was a warm-up.",
	"The question bank won that round.",
	"Bold strategy, mixed results.",
	"Consider that one reconnaissance.",
];

const TRIUMPH_BODIES = [
	"You are reading these questions faster than they can hide the answer.",
	"Nothing in that set touched you. Bank it and keep the momentum.",
	"That is exam-day shape, right there.",
];

const SOLID_BODIES = [
	"The shape of the material is clearly landing — a couple of edges left to sand.",
	"Most of that was instinct already. The rest is just repetition.",
	"You are trending in the right direction and the numbers agree.",
];

const WOBBLE_BODIES = [
	"Good news: every one of those has a right answer, and now you know where they live.",
	"Early sessions are meant to be lumpy. This is data, not a verdict.",
	"Nobody speed-runs a new domain. You now have a very specific list to attack.",
];

/** Deterministic so tests (and re-renders) never flicker between phrasings. */
function pick(options: string[], seed: number): string {
	const index = Math.abs(Math.floor(seed)) % options.length;
	return options[index];
}

function seedOf(input: ToneInput): number {
	return input.correct * 31 + input.total * 7 + input.attempt * 3;
}

export function moodFor(accuracy: number): ToneMood {
	const safe = clamp01(accuracy);
	if (safe >= TRIUMPH_THRESHOLD) {
		return "triumph";
	}
	return safe >= SNARK_THRESHOLD ? "solid" : "wobble";
}

export function resultCopy(input: ToneInput): ToneCopy {
	const mood = moodFor(input.accuracy);
	const seed = seedOf(input);
	const headline =
		mood === "triumph"
			? pick(TRIUMPH_HEADLINES, seed)
			: mood === "solid"
				? pick(SOLID_HEADLINES, seed)
				: pick(WOBBLE_HEADLINES, seed);
	const body =
		mood === "triumph"
			? pick(TRIUMPH_BODIES, seed)
			: mood === "solid"
				? pick(SOLID_BODIES, seed)
				: pick(WOBBLE_BODIES, seed);

	return {
		mood,
		headline,
		body: input.attempt > 1 ? `${body} (Retake — partial XP, full credit for the learning.)` : body,
		nextAction: nextAction(input, mood),
	};
}

/** Always names something the reader can do in the next five minutes. */
export function nextAction(input: ToneInput, mood: ToneMood = moodFor(input.accuracy)): string {
	const missed = Math.max(0, input.total - input.correct);
	const topic = (input.weakTopics ?? []).find((entry) => entry.trim().length > 0);

	if (mood === "triumph" && missed === 0) {
		return "Open the next day and keep the streak alive.";
	}
	if (mood === "triumph") {
		return `Skim the explanation for the ${missed === 1 ? "single one" : `${missed}`} you missed, then move to the next day.`;
	}
	if (mood === "solid") {
		return topic
			? `Re-read "${topic}" in today's session, then hit "Retry the ones I missed".`
			: `Hit "Retry the ones I missed" — ${missed} question${missed === 1 ? "" : "s"} and you are clear.`;
	}
	return topic
		? `Start with "${topic}": re-read that section, then run "Retry the ones I missed".`
		: `Re-read today's session top to bottom, then run "Retry the ones I missed".`;
}

/** Inline copy shown the instant an answer is graded. */
export function answerCopy(correct: boolean, streak: number): string {
	if (!correct) {
		return "Not this time — here is the one that works.";
	}
	if (streak >= 8) {
		return `${streak} in a row. Genuinely showing off now.`;
	}
	if (streak >= 4) {
		return `${streak} straight — you are in the pocket.`;
	}
	return "Correct.";
}

export function xpLineLabels(): { base: string; accuracy: string; streak: string; perfect: string; retake: string } {
	return {
		base: "Session completed",
		accuracy: "Accuracy bonus",
		streak: "Streak bonus",
		perfect: "Perfect run bonus",
		retake: "Retake rate",
	};
}

function clamp01(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}
	return Math.min(1, Math.max(0, value));
}
