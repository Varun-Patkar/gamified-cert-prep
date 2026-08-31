/** Pulling JSON back out of a chatty model. Pure: no vscode, directly unit-testable. */

export class LmJsonError extends Error {
	readonly raw: string;

	constructor(message: string, raw: string) {
		super(message);
		this.name = "LmJsonError";
		this.raw = raw;
	}
}

/** Removes ```json fences, leading "Here you go:" prose, and stray backticks. */
export function stripCodeFences(text: string): string {
	const trimmed = text.trim();
	const fenced = /```[a-zA-Z0-9_-]*\s*\n?([\s\S]*?)```/.exec(trimmed);
	if (fenced) {
		return fenced[1].trim();
	}
	// An unterminated fence still means "everything after the opener is the payload".
	const opener = /```[a-zA-Z0-9_-]*\s*\n?/.exec(trimmed);
	if (opener) {
		return trimmed.slice(opener.index + opener[0].length).replace(/```\s*$/, "").trim();
	}
	return trimmed;
}

const OPENERS: Record<string, string> = { "{": "}", "[": "]" };

/** Scans forward from `start` honouring strings and escapes; returns the index after the match. */
function scanBalanced(text: string, start: number): number | undefined {
	const stack: string[] = [];
	let inString = false;
	let escaped = false;

	for (let i = start; i < text.length; i += 1) {
		const char = text[i];
		if (inString) {
			if (escaped) {
				escaped = false;
			} else if (char === "\\") {
				escaped = true;
			} else if (char === '"') {
				inString = false;
			}
			continue;
		}
		if (char === '"') {
			inString = true;
			continue;
		}
		if (OPENERS[char]) {
			stack.push(OPENERS[char]);
			continue;
		}
		if (char === "}" || char === "]") {
			if (stack.pop() !== char) {
				return undefined;
			}
			if (stack.length === 0) {
				return i + 1;
			}
		}
	}
	return undefined;
}

/** The outermost balanced object or array in `text`, ignoring anything wrapped around it. */
export function extractJsonBlock(text: string): string | undefined {
	const source = stripCodeFences(text);
	for (let i = 0; i < source.length; i += 1) {
		if (!OPENERS[source[i]]) {
			continue;
		}
		const end = scanBalanced(source, i);
		if (end !== undefined) {
			return source.slice(i, end);
		}
	}
	return undefined;
}

/** Parses model output that is *supposed* to be JSON. Throws `LmJsonError`, never a bare SyntaxError. */
export function parseJsonLoose<T>(text: string): T {
	const block = extractJsonBlock(text);
	if (block === undefined) {
		throw new LmJsonError("No JSON object or array found in the model response.", text);
	}
	try {
		return JSON.parse(block) as T;
	} catch (error) {
		throw new LmJsonError(error instanceof Error ? error.message : String(error), text);
	}
}
