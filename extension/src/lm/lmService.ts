/** The single place the extension talks to a language model headlessly. */

import * as vscode from "vscode";
import {
	createLmServiceFromClient,
	type CancellationLike,
	type ChatClient,
	type ChatMessage,
	type ChatPart,
	type LmService,
	type ToolSpec,
} from "./agentic";

export type { LmService, ToolSpec } from "./agentic";

const WEB_TOOL_HINTS = ["fetch", "web", "browser", "search", "playwright", "url", "page"];
const MAX_WEB_TOOLS = 8;

export function looksLikeWebTool(tool: vscode.LanguageModelToolInformation): boolean {
	const haystack = `${tool.name} ${tool.description}`.toLowerCase();
	return WEB_TOOL_HINTS.some((hint) => haystack.includes(hint));
}

/** `selectChatModels()` can lead with unusable stubs (maxInputTokens 0), so pick deliberately. */
export function pickModel(models: readonly vscode.LanguageModelChat[]): vscode.LanguageModelChat | undefined {
	const usable = models.filter((m) => m.maxInputTokens > 0);
	const preferred = ["gpt-4o", "gpt-4.1", "claude-sonnet"];
	for (const family of preferred) {
		const hit = usable.find((m) => m.vendor === "copilot" && m.family.startsWith(family));
		if (hit) {
			return hit;
		}
	}
	return usable.find((m) => m.vendor === "copilot") ?? usable[0];
}

/** Dozens of tools match loosely; put actual page-fetchers first. */
export function rankWebTools(
	tools: readonly vscode.LanguageModelToolInformation[]
): vscode.LanguageModelToolInformation[] {
	const score = (tool: vscode.LanguageModelToolInformation): number => {
		const name = tool.name.toLowerCase();
		if (name.includes("fetch") && name.includes("webpage")) return 0;
		if (name.includes("fetch")) return 1;
		if (name.includes("web") && name.includes("search")) return 2;
		if (name.includes("navigate")) return 3;
		return 4;
	};
	return [...tools].sort((a, b) => score(a) - score(b));
}

export function selectWebTools(
	all: readonly vscode.LanguageModelToolInformation[] = vscode.lm.tools,
	limit = MAX_WEB_TOOLS
): ToolSpec[] {
	return rankWebTools(all.filter(looksLikeWebTool))
		.slice(0, Math.max(1, limit))
		.map((tool) => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema }));
}

export type LmUnavailableReason = "no-model" | "not-signed-in" | "quota" | "blocked" | "unknown";

export interface LmFailure {
	ok: false;
	reason: LmUnavailableReason;
	message: string;
}

export type LmServiceResult = { ok: true; service: LmService; modelLabel: string } | LmFailure;

/** Maps raw provider errors onto something a study-app user can act on. */
export function describeLmFailure(error: unknown): LmFailure {
	const raw = error instanceof Error ? error.message : String(error);
	const text = raw.toLowerCase();
	if (text.includes("quota") || text.includes("rate limit") || text.includes("429")) {
		return {
			ok: false,
			reason: "quota",
			message: "Your language model quota is used up right now. Try again a little later — your progress is safe.",
		};
	}
	if (text.includes("consent") || text.includes("permission") || text.includes("not allowed")) {
		return {
			ok: false,
			reason: "blocked",
			message: "Language model access was declined. Allow Cert Prep to use the model and try again.",
		};
	}
	if (text.includes("sign in") || text.includes("unauthorized") || text.includes("401")) {
		return {
			ok: false,
			reason: "not-signed-in",
			message: "Sign in to a language model provider (for example GitHub Copilot) and try again.",
		};
	}
	return { ok: false, reason: "unknown", message: `The language model call failed: ${raw}` };
}

export interface CreateLmServiceOptions {
	justification?: string;
	tools?: readonly vscode.LanguageModelToolInformation[];
}

export async function createLmService(options: CreateLmServiceOptions = {}): Promise<LmServiceResult> {
	let models: readonly vscode.LanguageModelChat[];
	try {
		models = await vscode.lm.selectChatModels();
	} catch (error) {
		return describeLmFailure(error);
	}
	if (models.length === 0) {
		return {
			ok: false,
			reason: "not-signed-in",
			message: "No language model is available. Sign in to a provider such as GitHub Copilot, then try again.",
		};
	}
	const model = pickModel(models);
	if (!model) {
		return {
			ok: false,
			reason: "no-model",
			message: "No usable language model was offered (every candidate reported a zero token budget).",
		};
	}
	const justification = options.justification ?? "Cert Prep is researching your exam so it can build your study plan.";
	const webTools = selectWebTools(options.tools ?? vscode.lm.tools);
	return {
		ok: true,
		modelLabel: `${model.vendor}/${model.family}`,
		service: createLmServiceFromClient(new VscodeChatClient(model, justification), webTools),
	};
}

class VscodeChatClient implements ChatClient {
	constructor(
		private readonly model: vscode.LanguageModelChat,
		private readonly justification: string
	) {}

	async send(messages: ChatMessage[], tools: ToolSpec[], token?: CancellationLike): Promise<ChatPart[]> {
		const bridge = bridgeToken(token);
		try {
			const response = await this.model.sendRequest(
				messages.map(toLmMessage),
				{
					justification: this.justification,
					tools: tools.map((tool) => ({
						name: tool.name,
						description: tool.description,
						inputSchema: tool.inputSchema as object | undefined,
					})),
				},
				bridge.token
			);
			const parts: ChatPart[] = [];
			for await (const part of response.stream) {
				if (part instanceof vscode.LanguageModelToolCallPart) {
					parts.push({ kind: "tool-call", callId: part.callId, name: part.name, input: part.input });
				} else if (part instanceof vscode.LanguageModelTextPart) {
					parts.push({ kind: "text", value: part.value });
				}
			}
			return parts;
		} finally {
			bridge.dispose();
		}
	}

	async invokeTool(name: string, input: unknown, token?: CancellationLike): Promise<unknown> {
		const bridge = bridgeToken(token);
		try {
			// toolInvocationToken is undefined outside a chat turn — this is what makes research headless.
			return await vscode.lm.invokeTool(
				name,
				{ input: (input ?? {}) as object, toolInvocationToken: undefined },
				bridge.token
			);
		} finally {
			bridge.dispose();
		}
	}
}

function toLmMessage(message: ChatMessage): vscode.LanguageModelChatMessage {
	const content = message.parts.map(toLmPart);
	return message.role === "assistant"
		? vscode.LanguageModelChatMessage.Assistant(content as never)
		: vscode.LanguageModelChatMessage.User(content as never);
}

function toLmPart(part: ChatMessage["parts"][number]): unknown {
	switch (part.kind) {
		case "text":
			return new vscode.LanguageModelTextPart(part.value);
		case "tool-call":
			return new vscode.LanguageModelToolCallPart(part.callId, part.name, (part.input ?? {}) as object);
		default: {
			// Tool results arrive as prompt-tsx parts, not text, so they are forwarded untouched.
			const raw = part.content;
			const inner =
				raw instanceof vscode.LanguageModelToolResult
					? raw.content
					: [new vscode.LanguageModelTextPart(typeof raw === "string" ? raw : JSON.stringify(raw ?? null))];
			return new vscode.LanguageModelToolResultPart(part.callId, inner as never);
		}
	}
}

function bridgeToken(token?: CancellationLike): { token: vscode.CancellationToken; dispose(): void } {
	const source = new vscode.CancellationTokenSource();
	if (token?.isCancellationRequested) {
		source.cancel();
	}
	const subscription = token?.onCancellationRequested?.(() => source.cancel());
	return {
		token: source.token,
		dispose: () => {
			subscription?.dispose();
			source.dispose();
		},
	};
}
