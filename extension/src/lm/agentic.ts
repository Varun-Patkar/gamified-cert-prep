/**
 * The tool-calling loop, expressed over a tiny `ChatClient` port so it can be driven by a fake
 * in plain mocha. `lm/lmService.ts` supplies the real vscode-backed implementation.
 */

import { LmJsonError, parseJsonLoose } from "./json";

export interface CancellationLike {
	isCancellationRequested: boolean;
	onCancellationRequested?(listener: () => void): { dispose(): void };
}

export interface ToolSpec {
	name: string;
	description: string;
	inputSchema?: unknown;
}

export type ChatPart =
	| { kind: "text"; value: string }
	| { kind: "tool-call"; callId: string; name: string; input: unknown };

export type MessagePart = ChatPart | { kind: "tool-result"; callId: string; content: unknown };

export interface ChatMessage {
	role: "user" | "assistant";
	parts: MessagePart[];
}

export interface ChatClient {
	send(messages: ChatMessage[], tools: ToolSpec[], token?: CancellationLike): Promise<ChatPart[]>;
	invokeTool(name: string, input: unknown, token?: CancellationLike): Promise<unknown>;
}

export interface AgenticProgress {
	round: number;
	text: string;
	toolNames: string[];
}

export interface AgenticRequest {
	system?: string;
	prompt: string;
	tools?: ToolSpec[];
	maxRounds?: number;
	token?: CancellationLike;
	onProgress?(update: AgenticProgress): void;
}

export interface JsonRequest extends AgenticRequest {
	schemaHint?: string;
}

export interface ToolCallRecord {
	round: number;
	name: string;
	input: unknown;
	ok: boolean;
	error?: string;
}

export interface AgenticResult {
	text: string;
	toolCalls: ToolCallRecord[];
	rounds: number;
	/** True when the loop was still requesting tools when it ran out of rounds. */
	stoppedAtLimit: boolean;
	transcript: ChatMessage[];
}

export interface LmService {
	runAgenticTurn(request: AgenticRequest): Promise<AgenticResult>;
	requestJson<T>(request: JsonRequest): Promise<T>;
	selectWebTools(): ToolSpec[];
}

export class LmCancelledError extends Error {
	constructor() {
		super("The request was cancelled.");
		this.name = "LmCancelledError";
	}
}

const DEFAULT_MAX_ROUNDS = 6;
const MAX_ROUNDS_CEILING = 24;

function clampRounds(value: number | undefined): number {
	const rounds = Number.isFinite(value) ? Math.floor(value as number) : DEFAULT_MAX_ROUNDS;
	return Math.max(1, Math.min(MAX_ROUNDS_CEILING, rounds));
}

function throwIfCancelled(token?: CancellationLike): void {
	if (token?.isCancellationRequested) {
		throw new LmCancelledError();
	}
}

function composePrompt(request: AgenticRequest): string {
	return request.system ? `${request.system.trim()}\n\n---\n\n${request.prompt.trim()}` : request.prompt.trim();
}

function describe(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export async function runAgenticLoop(client: ChatClient, request: AgenticRequest): Promise<AgenticResult> {
	const maxRounds = clampRounds(request.maxRounds);
	const tools = request.tools ?? [];
	const messages: ChatMessage[] = [
		{ role: "user", parts: [{ kind: "text", value: composePrompt(request) }] },
	];
	const toolCalls: ToolCallRecord[] = [];
	let text = "";
	let rounds = 0;

	while (rounds < maxRounds) {
		throwIfCancelled(request.token);
		rounds += 1;

		const parts = await client.send(messages, tools, request.token);
		const calls = parts.filter(
			(part): part is Extract<ChatPart, { kind: "tool-call" }> => part.kind === "tool-call"
		);
		const roundText = parts
			.filter((part): part is Extract<ChatPart, { kind: "text" }> => part.kind === "text")
			.map((part) => part.value)
			.join("");
		if (roundText.trim()) {
			text = text ? `${text}\n${roundText}` : roundText;
		}
		request.onProgress?.({ round: rounds, text: roundText, toolNames: calls.map((call) => call.name) });

		if (calls.length === 0) {
			return { text: text.trim(), toolCalls, rounds, stoppedAtLimit: false, transcript: messages };
		}

		const assistantParts: MessagePart[] = roundText.trim()
			? [{ kind: "text", value: roundText }, ...calls]
			: [...calls];
		messages.push({ role: "assistant", parts: assistantParts });

		const results: MessagePart[] = [];
		for (const call of calls) {
			throwIfCancelled(request.token);
			try {
				const content = await client.invokeTool(call.name, call.input, request.token);
				results.push({ kind: "tool-result", callId: call.callId, content });
				toolCalls.push({ round: rounds, name: call.name, input: call.input, ok: true });
			} catch (error) {
				const message = describe(error);
				results.push({ kind: "tool-result", callId: call.callId, content: `Tool failed: ${message}` });
				toolCalls.push({ round: rounds, name: call.name, input: call.input, ok: false, error: message });
			}
		}
		messages.push({ role: "user", parts: results });
	}

	return { text: text.trim(), toolCalls, rounds, stoppedAtLimit: true, transcript: messages };
}

const JSON_RULES = [
	"Reply with raw JSON only.",
	"No prose before or after, no markdown fences, no trailing commas.",
	"Use double quotes for every key and string value.",
].join(" ");

function jsonPrompt(request: JsonRequest): string {
	const hint = request.schemaHint ? `\n\nMatch this shape exactly:\n${request.schemaHint.trim()}` : "";
	return `${request.prompt.trim()}${hint}\n\n${JSON_RULES}`;
}

/** One agentic loop, then a single repair round with the parse error fed back to the model. */
export async function requestJsonFromClient<T>(client: ChatClient, request: JsonRequest): Promise<T> {
	const first = await runAgenticLoop(client, { ...request, prompt: jsonPrompt(request) });
	try {
		return parseJsonLoose<T>(first.text);
	} catch (error) {
		const reason = error instanceof LmJsonError ? error.message : describe(error);
		const repair = await runAgenticLoop(client, {
			system: request.system,
			prompt: [
				"Your previous reply could not be parsed as JSON.",
				`Parser error: ${reason}`,
				"",
				"Previous reply:",
				first.text.slice(0, 4000),
				"",
				"Return the same content as valid JSON.",
				JSON_RULES,
				request.schemaHint ? `\nShape:\n${request.schemaHint.trim()}` : "",
			].join("\n"),
			maxRounds: 1,
			token: request.token,
			onProgress: request.onProgress,
		});
		try {
			return parseJsonLoose<T>(repair.text);
		} catch (retryError) {
			throw new LmJsonError(
				`The model did not return valid JSON after a retry (${
					retryError instanceof LmJsonError ? retryError.message : describe(retryError)
				}).`,
				repair.text || first.text
			);
		}
	}
}

/** Wraps a `ChatClient` in the `LmService` surface the research layer depends on. */
export function createLmServiceFromClient(client: ChatClient, webTools: ToolSpec[] = []): LmService {
	return {
		runAgenticTurn: (request) => runAgenticLoop(client, request),
		requestJson: (request) => requestJsonFromClient(client, request),
		selectWebTools: () => [...webTools],
	};
}
