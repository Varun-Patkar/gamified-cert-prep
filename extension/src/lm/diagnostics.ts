import * as vscode from "vscode";

const WEB_TOOL_HINTS = ["fetch", "web", "browser", "search", "playwright", "url", "page"];

function looksLikeWebTool(tool: vscode.LanguageModelToolInformation): boolean {
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

/** 93 loose matches is too many to offer; put actual page-fetchers first. */
function rankWebTools(
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

/**
 * Answers the one question the whole research pipeline depends on: can the extension
 * reach the model AND the internet from a headless call, with no chat turn in flight?
 */
export async function runLanguageModelDiagnostics(channel: vscode.OutputChannel): Promise<string> {
	channel.clear();
	channel.show(true);
	const lines: string[] = [];
	const log = (line = "") => {
		lines.push(line);
		channel.appendLine(line);
	};

	log("Gamified Cert Prep — language model diagnostics");
	log(`VS Code ${vscode.version}`);
	log("=".repeat(60));

	const models = await vscode.lm.selectChatModels();
	log("");
	log(`Chat models visible: ${models.length}`);
	for (const model of models) {
		log(`  - ${model.vendor}/${model.family}  id=${model.id}  maxInput=${model.maxInputTokens}`);
	}
	if (models.length === 0) {
		log("");
		log("BLOCKER: no chat models. Sign in to a language model provider (e.g. Copilot).");
		return lines.join("\n");
	}

	const chosen = pickModel(models);
	if (!chosen) {
		log("");
		log("BLOCKER: no usable model (all reported maxInputTokens = 0).");
		return lines.join("\n");
	}
	log("");
	log(`Chosen model: ${chosen.vendor}/${chosen.family} (id=${chosen.id})`);

	const tools = vscode.lm.tools;
	const webTools = tools.filter(looksLikeWebTool);
	log("");
	log(`Tools visible to the extension: ${tools.length}`);
	for (const tool of tools) {
		log(`  · ${tool.name}`);
	}
	log(`Web-capable candidates: ${webTools.length}`);
	for (const tool of webTools) {
		log(`  - ${tool.name}: ${tool.description.slice(0, 120)}`);
	}

	await probeHeadlessToolCall(chosen, webTools, log);
	return lines.join("\n");
}

async function probeHeadlessToolCall(
	model: vscode.LanguageModelChat,
	webTools: readonly vscode.LanguageModelToolInformation[],
	log: (line?: string) => void
): Promise<void> {
	log("");
	log("-".repeat(60));
	log("Probe: can the model request a tool from a headless sendRequest?");

	if (webTools.length === 0) {
		log("  SKIPPED — no web tools registered. Research must fall back to a chat turn.");
		return;
	}

	const offered: vscode.LanguageModelChatTool[] = rankWebTools(webTools)
		.slice(0, 8)
		.map((tool) => ({
			name: tool.name,
			description: tool.description,
			inputSchema: tool.inputSchema,
		}));
	log(`  Offering tools: ${offered.map((t) => t.name).join(", ")}`);

	const cts = new vscode.CancellationTokenSource();
	try {
		const response = await model.sendRequest(
			[
				vscode.LanguageModelChatMessage.User(
					"Fetch https://example.com and tell me the page's heading. Use a tool to actually retrieve it."
				),
			],
			{ tools: offered, justification: "Cert Prep is verifying headless web research support." },
			cts.token
		);

		let toolCalls = 0;
		let text = "";
		for await (const part of response.stream) {
			if (part instanceof vscode.LanguageModelToolCallPart) {
				toolCalls++;
				log(`  Model requested tool: ${part.name} with input ${JSON.stringify(part.input)}`);
				await invokeToolHeadlessly(part, log);
			} else if (part instanceof vscode.LanguageModelTextPart) {
				text += part.value;
			}
		}

		log(`  Tool calls requested: ${toolCalls}`);
		if (text.trim()) {
			log(`  Model text: ${text.trim().slice(0, 300)}`);
		}
		log(
			toolCalls > 0
				? "  RESULT: PASS — headless research pipeline is viable."
				: "  RESULT: model answered without tools; retry or fall back to a chat turn."
		);
	} catch (err) {
		log(`  RESULT: FAIL — ${err instanceof Error ? err.message : String(err)}`);
	} finally {
		cts.dispose();
	}
}

async function invokeToolHeadlessly(
	call: vscode.LanguageModelToolCallPart,
	log: (line?: string) => void
): Promise<void> {
	const cts = new vscode.CancellationTokenSource();
	try {
		// toolInvocationToken is undefined outside a chat turn; this is the call that proves headless works.
		const result = await vscode.lm.invokeTool(
			call.name,
			{ input: call.input, toolInvocationToken: undefined },
			cts.token
		);
		const preview = result.content
			.map((part) => (part instanceof vscode.LanguageModelTextPart ? part.value : "[non-text]"))
			.join("")
			.trim()
			.slice(0, 200);
		log(`  invokeTool OK. Result preview: ${preview || "(empty)"}`);
	} catch (err) {
		log(`  invokeTool FAILED: ${err instanceof Error ? err.message : String(err)}`);
	} finally {
		cts.dispose();
	}
}
