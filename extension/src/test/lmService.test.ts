import * as assert from "assert";
import { requestJsonFromClient, runAgenticLoop, type ChatPart } from "../lm/agentic";
import { LmJsonError, extractJsonBlock, parseJsonLoose, stripCodeFences } from "../lm/json";
import { ScriptedChatClient, textPart, toolCallPart } from "./fakeLm";

describe("lm/json", () => {
	it("unwraps fenced JSON", () => {
		const raw = 'Sure thing!\n```json\n{ "a": 1 }\n```\nHope that helps.';
		assert.deepStrictEqual(parseJsonLoose(raw), { a: 1 });
	});

	it("unwraps an unlabelled fence", () => {
		assert.strictEqual(stripCodeFences('```\n{"a":1}\n```'), '{"a":1}');
	});

	it("survives an unterminated fence", () => {
		assert.strictEqual(stripCodeFences('```json\n{"a":1}'), '{"a":1}');
	});

	it("finds JSON with prose before and after it", () => {
		const raw = 'Here is the result: {"code":"AI-102","domains":[]} — let me know if you need more.';
		assert.deepStrictEqual(parseJsonLoose(raw), { code: "AI-102", domains: [] });
	});

	it("extracts the outermost balanced object, not the first closing brace", () => {
		const raw = 'noise {"outer":{"inner":{"deep":true}},"tail":1} noise';
		assert.strictEqual(extractJsonBlock(raw), '{"outer":{"inner":{"deep":true}},"tail":1}');
	});

	it("ignores braces inside strings and escapes", () => {
		const raw = '{"text":"a } and a \\" quote","n":2}';
		assert.deepStrictEqual(parseJsonLoose(raw), { text: 'a } and a " quote', n: 2 });
	});

	it("extracts a top-level array", () => {
		assert.deepStrictEqual(parseJsonLoose('Result:\n[1, 2, {"x": [3]}]'), [1, 2, { x: [3] }]);
	});

	it("skips an unbalanced opener and takes the next valid block", () => {
		assert.strictEqual(extractJsonBlock('{ oops\n["a","b"]'), '["a","b"]');
	});

	it("throws a typed error when there is no JSON at all", () => {
		assert.throws(() => parseJsonLoose("I could not find that page."), LmJsonError);
	});

	it("throws a typed error when the JSON is malformed", () => {
		assert.throws(() => parseJsonLoose('{"a": 1,}'), LmJsonError);
	});
});

describe("lm/agentic tool loop", () => {
	it("returns text without calling tools when the model does not ask", async () => {
		const client = new ScriptedChatClient([[textPart("All done.")]]);
		const result = await runAgenticLoop(client, { prompt: "hello" });

		assert.strictEqual(result.text, "All done.");
		assert.strictEqual(result.rounds, 1);
		assert.strictEqual(result.stoppedAtLimit, false);
		assert.strictEqual(client.invoked.length, 0);
	});

	it("invokes each requested tool and appends the results as tool-result parts", async () => {
		const client = new ScriptedChatClient([
			[toolCallPart("call-1", "fetch_page", { url: "https://example.com" }), toolCallPart("call-2", "search", {})],
			[textPart("Found it.")],
		]);
		const result = await runAgenticLoop(client, { prompt: "research", maxRounds: 4 });

		assert.deepStrictEqual(
			client.invoked.map((entry) => entry.name),
			["fetch_page", "search"]
		);
		assert.strictEqual(result.toolCalls.length, 2);
		assert.ok(result.toolCalls.every((call) => call.ok));

		const assistant = result.transcript.find((message) => message.role === "assistant");
		assert.ok(assistant, "assistant turn is appended");
		assert.strictEqual(assistant?.parts.filter((part) => part.kind === "tool-call").length, 2);

		const toolResults = result.transcript
			.flatMap((message) => message.parts)
			.filter((part) => part.kind === "tool-result");
		assert.deepStrictEqual(
			toolResults.map((part) => (part as { callId: string }).callId),
			["call-1", "call-2"]
		);
	});

	it("terminates at maxRounds when the model never stops asking for tools", async () => {
		const client = new ScriptedChatClient([[toolCallPart("c", "fetch_page", {})]]);
		const result = await runAgenticLoop(client, { prompt: "loop forever", maxRounds: 3 });

		assert.strictEqual(result.rounds, 3);
		assert.strictEqual(result.stoppedAtLimit, true);
		assert.strictEqual(client.invoked.length, 3);
	});

	it("records a failing tool without aborting the loop", async () => {
		const client = new ScriptedChatClient(
			[[toolCallPart("c", "fetch_page", {})], [textPart("Recovered.")]],
			() => new Error("404")
		);
		const result = await runAgenticLoop(client, { prompt: "research", maxRounds: 3 });

		assert.strictEqual(result.text, "Recovered.");
		assert.strictEqual(result.toolCalls[0].ok, false);
		assert.strictEqual(result.toolCalls[0].error, "404");
	});

	it("reports progress for every round", async () => {
		const client = new ScriptedChatClient([[toolCallPart("c", "fetch_page", {})], [textPart("Done.")]]);
		const rounds: number[] = [];
		await runAgenticLoop(client, {
			prompt: "go",
			maxRounds: 4,
			onProgress: (update) => rounds.push(update.round),
		});
		assert.deepStrictEqual(rounds, [1, 2]);
	});

	it("stops immediately when the token is already cancelled", async () => {
		const client = new ScriptedChatClient([[textPart("never")]]);
		await assert.rejects(
			runAgenticLoop(client, { prompt: "go", token: { isCancellationRequested: true } }),
			/cancelled/i
		);
		assert.strictEqual(client.sent.length, 0);
	});
});

describe("lm/agentic requestJson", () => {
	it("parses valid JSON on the first attempt", async () => {
		const client = new ScriptedChatClient([[textPart('```json\n{"ok":true}\n```')]]);
		assert.deepStrictEqual(await requestJsonFromClient(client, { prompt: "give me json" }), { ok: true });
		assert.strictEqual(client.sent.length, 1);
	});

	it("retries exactly once with the parse error fed back", async () => {
		const script: ChatPart[][] = [[textPart("Sorry, no JSON here.")], [textPart('{"ok":true}')]];
		const client = new ScriptedChatClient(script);

		const value = await requestJsonFromClient<{ ok: boolean }>(client, {
			prompt: "give me json",
			schemaHint: '{ "ok": true }',
		});

		assert.deepStrictEqual(value, { ok: true });
		assert.strictEqual(client.sent.length, 2);
		const repairPrompt = (client.sent[1][0].parts[0] as { value: string }).value;
		assert.ok(repairPrompt.includes("could not be parsed"), "the retry explains the failure");
		assert.ok(repairPrompt.includes("No JSON object or array found"), "the parser error is fed back");
	});

	it("throws LmJsonError when the retry also fails", async () => {
		const client = new ScriptedChatClient([[textPart("still prose")]]);
		await assert.rejects(requestJsonFromClient(client, { prompt: "json please" }), (error: unknown) => {
			assert.ok(error instanceof LmJsonError);
			assert.strictEqual(client.sent.length, 2);
			return true;
		});
	});

	it("appends the JSON-only instruction and schema hint to the prompt", async () => {
		const client = new ScriptedChatClient([[textPart("{}")]]);
		await requestJsonFromClient(client, { prompt: "list domains", schemaHint: '{ "domains": [] }' });
		const sent = (client.sent[0][0].parts[0] as { value: string }).value;
		assert.ok(sent.includes("list domains"));
		assert.ok(sent.includes('{ "domains": [] }'));
		assert.ok(sent.includes("Reply with raw JSON only."));
	});
});
