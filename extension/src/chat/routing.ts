/**
 * Pure intent detection and copy for the chat participant, kept out of `participant.ts` so the
 * routing rules can be tested without a VS Code host.
 */

export type ChatIntent = "new-exam" | "plan" | "today" | "explain" | "status" | "ask";

export interface RoutedRequest {
	intent: ChatIntent;
	/** For "new-exam": the exam the user named, if they named one. For "explain": the topic. */
	subject?: string;
}

const SLASH_INTENTS: Record<string, ChatIntent> = {
	new: "new-exam",
	plan: "plan",
	today: "today",
	explain: "explain",
	status: "status",
};

/** Verbs that signal "set up a brand new campaign" rather than "answer my study question". */
const START_PATTERNS: readonly RegExp[] = [
	/\b(prep|prepare|prepping)\s+(me\s+)?(for|to)\b/i,
	/\bi\s+want\s+to\s+(study|prep|prepare|learn|take|sit|pass)\b/i,
	/\bi'?m\s+(studying|prepping|preparing)\s+for\b/i,
	/\b(study|studying|prep|prepping)\s+for\s+(the\s+)?[a-z0-9]/i,
	/\bhelp\s+me\s+(pass|prepare|prep|study)\b/i,
	/\b(new|another|next)\s+(exam|cert|certification|campaign|plan)\b/i,
	/\b(set\s*up|start|build|create|make)\s+(a\s+|me\s+a\s+)?(new\s+)?(exam|cert|certification|study\s+plan|campaign|prep)\b/i,
	/\bget\s+me\s+ready\s+for\b/i,
	/\bsign\s+me\s+up\s+for\b/i,
];

const STATUS_PATTERNS: readonly RegExp[] = [
	/\bhow\s+(am|are)\s+(i|we)\s+doing\b/i,
	/\b(my\s+)?(progress|streak|xp|stats)\b/i,
	/\bwhere\s+am\s+i\b/i,
];

const TODAY_PATTERNS: readonly RegExp[] = [
	/\bwhat('?s| is)\s+(on\s+)?(for\s+)?today\b/i,
	/\btoday'?s\s+(session|day|study|lesson)\b/i,
	/\bwhat\s+should\s+i\s+(study|do)\s+today\b/i,
];

const EXPLAIN_PATTERNS: readonly RegExp[] = [
	/^\s*explain\s+(.+)/i,
	/^\s*teach\s+me\s+(?:about\s+)?(.+)/i,
	/^\s*what\s+is\s+(.+)/i,
];

/** Strips the leading "prep me for" style verb so what remains is the exam itself. */
export function extractExamSubject(prompt: string): string | undefined {
	const cleaned = prompt
		.replace(/^@\S+\s*/, "")
		.replace(
			/^\s*(?:hi|hey|hello|ok|okay)?[,\s]*(?:i'?m\s+|i\s+want\s+to\s+|can\s+you\s+|please\s+|help\s+me\s+)?(?:prep(?:are|ping)?|study(?:ing)?|learn|take|sit|pass|get\s+me\s+ready)?\s*(?:me\s+)?(?:for|to\s+pass|about)?\s*/i,
			""
		)
		.replace(/^(the|a|an)\s+/i, "")
		.replace(/[?!.]+\s*$/, "")
		.trim();
	if (cleaned.replace(/[^A-Za-z0-9]/g, "").length < 2) {
		return undefined;
	}
	return cleaned;
}

export function detectIntent(prompt: string, command?: string): RoutedRequest {
	const slash = command ? SLASH_INTENTS[command] : undefined;
	if (slash) {
		const routed: RoutedRequest = { intent: slash };
		const subject = slash === "new-exam" ? extractExamSubject(prompt) : prompt.trim() || undefined;
		if (subject) {
			routed.subject = subject;
		}
		return routed;
	}

	const text = prompt.trim();
	if (!text) {
		return { intent: "ask" };
	}

	if (START_PATTERNS.some((pattern) => pattern.test(text))) {
		const subject = extractExamSubject(text);
		return subject ? { intent: "new-exam", subject } : { intent: "new-exam" };
	}
	if (TODAY_PATTERNS.some((pattern) => pattern.test(text))) {
		return { intent: "today" };
	}
	if (STATUS_PATTERNS.some((pattern) => pattern.test(text))) {
		return { intent: "status" };
	}
	for (const pattern of EXPLAIN_PATTERNS) {
		const match = pattern.exec(text);
		if (match) {
			return { intent: "explain", subject: match[1].replace(/[?]+$/, "").trim() };
		}
	}
	return { intent: "ask" };
}

/** A bare exam code with nothing else around it is a request to start that exam. */
export function looksLikeBareExamCode(prompt: string): boolean {
	return /^[A-Za-z]{2,4}[-\s]?\d{2,4}[?.!]?$/.test(prompt.trim());
}

/**
 * The interview has to survive across chat turns. VS Code hands us no session id, so we anchor on
 * the first user prompt in the history — stable for the life of a session, distinct between them.
 */
export function interviewKey(firstHistoryPrompt: string | undefined, currentPrompt: string): string {
	const anchor = (firstHistoryPrompt ?? currentPrompt).trim();
	return anchor.length > 0 ? anchor.slice(0, 200) : "certprep:new-session";
}

export interface StatusInput {
	code: string;
	title: string;
	totalDays: number;
	completedDays: number;
	xp: number;
	streak: number;
	longestStreak: number;
	/** 0-1, across every banked day. */
	accuracy?: number;
	daysUntilExam?: number;
	nextDay?: number;
}

/** Warm, specific, and always ends on something the reader can do next. */
export function summarizeStatus(input: StatusInput): string {
	const lines = [`**${input.code}** — ${input.title}`, ""];
	const total = input.totalDays > 0 ? `${input.completedDays} of ${input.totalDays}` : `${input.completedDays}`;
	lines.push(`- **Days banked:** ${total}`);
	if (input.accuracy !== undefined) {
		lines.push(`- **Accuracy:** ${Math.round(input.accuracy * 100)}%`);
	}
	lines.push(
		`- **Streak:** ${input.streak} day${input.streak === 1 ? "" : "s"}${
			input.longestStreak > input.streak ? ` (best: ${input.longestStreak})` : ""
		}`
	);
	lines.push(`- **XP:** ${input.xp}`);
	if (input.daysUntilExam !== undefined) {
		lines.push(
			input.daysUntilExam > 0
				? `- **Exam day:** ${input.daysUntilExam} day${input.daysUntilExam === 1 ? "" : "s"} away`
				: input.daysUntilExam === 0
					? "- **Exam day:** today — go get it"
					: "- **Exam day:** already behind you"
		);
	}
	lines.push("");
	lines.push(encouragementFor(input));
	return lines.join("\n");
}

function encouragementFor(input: StatusInput): string {
	if (input.completedDays === 0) {
		return "Nothing banked yet — Day 1 is the only hard one. Shall we?";
	}
	if (input.streak >= 5) {
		return `${input.streak} days in a row. That is not luck any more, that is a habit.`;
	}
	if ((input.accuracy ?? 1) < 0.5) {
		return "The accuracy will climb — early sessions are reconnaissance, not a verdict.";
	}
	if (input.totalDays > 0 && input.completedDays >= input.totalDays) {
		return "Every day is banked. You are as ready as the plan can make you.";
	}
	return input.nextDay
		? `Day ${input.nextDay} is queued up and waiting.`
		: "Keep going — the next session is the one that counts.";
}
