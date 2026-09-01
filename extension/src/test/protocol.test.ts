import * as assert from "assert";
import { isWebviewMessage, parseWebviewMessage } from "../webview/protocol";

describe("isWebviewMessage", () => {
	it("accepts anything shaped like a message", () => {
		assert.strictEqual(isWebviewMessage({ type: "webview/ready" }), true);
	});

	it("rejects non-objects and untyped payloads", () => {
		assert.strictEqual(isWebviewMessage(undefined), false);
		assert.strictEqual(isWebviewMessage(null), false);
		assert.strictEqual(isWebviewMessage("command/newExam"), false);
		assert.strictEqual(isWebviewMessage({ kind: "command/newExam" }), false);
	});
});

describe("parseWebviewMessage", () => {
	it("passes through payload-free commands", () => {
		for (const type of [
			"webview/ready",
			"command/newExam",
			"command/bindRepo",
			"command/cloneRepo",
			"command/useThisFolder",
			"command/commitNow",
		]) {
			assert.deepStrictEqual(parseWebviewMessage({ type }), { type });
		}
	});

	it("drops extra keys so a webview cannot smuggle fields in", () => {
		assert.deepStrictEqual(parseWebviewMessage({ type: "command/newExam", examId: "x" }), {
			type: "command/newExam",
		});
	});

	it("requires an examId for openExam", () => {
		assert.deepStrictEqual(parseWebviewMessage({ type: "command/openExam", examId: "az-104" }), {
			type: "command/openExam",
			examId: "az-104",
		});
		assert.strictEqual(parseWebviewMessage({ type: "command/openExam" }), undefined);
		assert.strictEqual(parseWebviewMessage({ type: "command/openExam", examId: 7 }), undefined);
	});

	it("coerces openDay to an integer day", () => {
		assert.deepStrictEqual(parseWebviewMessage({ type: "command/openDay", examId: "ai-102", day: "12" }), {
			type: "command/openDay",
			examId: "ai-102",
			day: 12,
		});
		assert.deepStrictEqual(parseWebviewMessage({ type: "command/openDay", examId: "ai-102", day: 3.7 }), {
			type: "command/openDay",
			examId: "ai-102",
			day: 3,
		});
	});

	it("rejects openDay without a usable day", () => {
		assert.strictEqual(parseWebviewMessage({ type: "command/openDay", examId: "ai-102" }), undefined);
		assert.strictEqual(
			parseWebviewMessage({ type: "command/openDay", examId: "ai-102", day: "soon" }),
			undefined
		);
	});

	it("rejects unknown message types", () => {
		assert.strictEqual(parseWebviewMessage({ type: "command/deleteEverything" }), undefined);
		assert.strictEqual(parseWebviewMessage(42), undefined);
	});
});
