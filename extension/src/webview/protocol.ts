/** Typed message contracts between the extension host and every webview. No vscode imports: pure data. */

import type { SidebarModel } from "../views/sidebarModel";

export type SyncIndicatorState = "idle" | "syncing" | "pending" | "offline";

export interface WelcomeModel {
	folderName?: string;
	hasWorkspace: boolean;
}

export type ExtensionToWebview =
	| { type: "state/update"; state: SidebarModel | WelcomeModel }
	| { type: "sync/state"; state: SyncIndicatorState; error?: string };

export type WebviewToExtension =
	| { type: "webview/ready" }
	| { type: "command/openExam"; examId: string }
	| { type: "command/newExam" }
	| { type: "command/bindRepo" }
	| { type: "command/cloneRepo" }
	| { type: "command/useThisFolder" }
	| { type: "command/openDay"; examId: string; day: number }
	| { type: "command/commitNow" };

export function isWebviewMessage(value: unknown): value is WebviewToExtension {
	return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

/** Narrows an untrusted webview payload; returns undefined for anything we don't serve. */
export function parseWebviewMessage(value: unknown): WebviewToExtension | undefined {
	if (!isWebviewMessage(value)) {
		return undefined;
	}
	const message = value as Record<string, unknown> & { type: string };
	switch (message.type) {
		case "webview/ready":
		case "command/newExam":
		case "command/bindRepo":
		case "command/cloneRepo":
		case "command/useThisFolder":
		case "command/commitNow":
			return { type: message.type } as WebviewToExtension;
		case "command/openExam":
			return typeof message.examId === "string" ? { type: "command/openExam", examId: message.examId } : undefined;
		case "command/openDay": {
			const day = Number(message.day);
			return typeof message.examId === "string" && Number.isFinite(day)
				? { type: "command/openDay", examId: message.examId, day: Math.floor(day) }
				: undefined;
		}
		default:
			return undefined;
	}
}
