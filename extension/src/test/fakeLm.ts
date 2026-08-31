/** Shared fakes so the research, pipeline and loop suites never touch a real model. */

import type {
	AgenticRequest,
	AgenticResult,
	ChatClient,
	ChatMessage,
	ChatPart,
	JsonRequest,
	LmService,
	ToolSpec,
} from "../lm/agentic";

export interface FakeLm extends LmService {
	jsonRequests: JsonRequest[];
	turnRequests: AgenticRequest[];
}

export interface FakeLmHandlers {
	json?(request: JsonRequest, index: number): unknown;
	text?(request: AgenticRequest, index: number): string;
	tools?: ToolSpec[];
}

export function fakeLm(handlers: FakeLmHandlers = {}): FakeLm {
	const jsonRequests: JsonRequest[] = [];
	const turnRequests: AgenticRequest[] = [];
	return {
		jsonRequests,
		turnRequests,
		selectWebTools: () => handlers.tools ?? [{ name: "fake_fetch", description: "fetch a web page" }],
		async requestJson<T>(request: JsonRequest): Promise<T> {
			const index = jsonRequests.length;
			jsonRequests.push(request);
			if (!handlers.json) {
				throw new Error("fakeLm: no json handler configured");
			}
			return handlers.json(request, index) as T;
		},
		async runAgenticTurn(request: AgenticRequest): Promise<AgenticResult> {
			const index = turnRequests.length;
			turnRequests.push(request);
			return {
				text: handlers.text ? handlers.text(request, index) : "",
				toolCalls: [],
				rounds: 1,
				stoppedAtLimit: false,
				transcript: [],
			};
		},
	};
}

/** Replays a script of model turns and records everything it was sent. */
export class ScriptedChatClient implements ChatClient {
	readonly sent: ChatMessage[][] = [];
	readonly invoked: { name: string; input: unknown }[] = [];
	private cursor = 0;

	constructor(
		private readonly script: ChatPart[][],
		private readonly toolResult: (name: string, input: unknown) => unknown = (name) => ({ tool: name })
	) {}

	async send(messages: ChatMessage[]): Promise<ChatPart[]> {
		this.sent.push(messages.map((message) => ({ role: message.role, parts: [...message.parts] })));
		const next = this.script[Math.min(this.cursor, this.script.length - 1)];
		this.cursor += 1;
		return next ?? [];
	}

	async invokeTool(name: string, input: unknown): Promise<unknown> {
		this.invoked.push({ name, input });
		const result = this.toolResult(name, input);
		if (result instanceof Error) {
			throw result;
		}
		return result;
	}
}

export function textPart(value: string): ChatPart {
	return { kind: "text", value };
}

export function toolCallPart(callId: string, name: string, input: unknown = {}): ChatPart {
	return { kind: "tool-call", callId, name, input };
}
