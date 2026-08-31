/** The vscode-facing wrapper around `newExamPipeline`: prompts, progress, approval UI, sync. */

import * as vscode from "vscode";
import { createLmService } from "../lm/lmService";
import type { DayPolicy, PlanConfig } from "../model/types";
import type { ExtensionState } from "../state/extensionState";
import { SourcesView } from "../views/sourcesView";
import { runNewExamPipeline, STEP_LABELS, type PipelineStep } from "./newExamPipeline";

export interface NewExamDeps {
	state: ExtensionState;
	sources: SourcesView;
	openDashboard(examId: string): Promise<void> | void;
	log?(message: string): void;
}

const DAY_POLICIES: { label: string; description: string; value: DayPolicy }[] = [
	{ label: "Every day", description: "Seven days a week", value: "all" },
	{ label: "Weekdays only", description: "Monday to Friday", value: "weekdays" },
	{ label: "Weekends only", description: "Saturday and Sunday", value: "weekends" },
];

export async function startNewExam(deps: NewExamDeps): Promise<void> {
	const store = deps.state.store;
	if (!store) {
		void vscode.window.showWarningMessage("Bind a prep repository first, then we can build your campaign.");
		return;
	}

	const examQuery = await vscode.window.showInputBox({
		title: "Which exam are you preparing for?",
		prompt: "Any vendor. A code and name work best, e.g. \"AI-102 Azure AI Engineer\" or \"AWS Solutions Architect Associate\".",
		placeHolder: "AI-102 Designing and Implementing a Microsoft Azure AI Solution",
		ignoreFocusOut: true,
		validateInput: (value) => (value.trim().length < 3 ? "Give me a little more to go on." : undefined),
	});
	if (!examQuery) {
		return;
	}

	const examDate = await vscode.window.showInputBox({
		title: "When is the exam?",
		prompt: "YYYY-MM-DD. Not booked yet? Pick the date you want to be ready by.",
		value: defaultExamDate(),
		ignoreFocusOut: true,
		validateInput: (value) =>
			/^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? undefined : "Use YYYY-MM-DD.",
	});
	if (!examDate) {
		return;
	}

	const policy = await vscode.window.showQuickPick(DAY_POLICIES, {
		title: "Which days will you study?",
		ignoreFocusOut: true,
	});
	if (!policy) {
		return;
	}

	const perDay = await vscode.window.showInputBox({
		title: "How many questions per study day?",
		value: "15",
		ignoreFocusOut: true,
		validateInput: (value) => (Number(value) >= 5 ? undefined : "Ten to twenty is a good rhythm."),
	});
	if (!perDay) {
		return;
	}

	const config: PlanConfig = {
		startDate: new Date().toISOString().slice(0, 10),
		examDate: examDate.trim(),
		hoursPerDay: 1,
		dayPolicy: policy.value,
		questionsPerDay: Math.floor(Number(perDay)),
		includeReviewDays: true,
		includeFinalMock: true,
	};

	const folder = await pickFolderName(examQuery, deps);
	if (!folder) {
		return;
	}

	const lm = await createLmService({
		justification: `Cert Prep is researching ${examQuery.trim()} to build your study campaign.`,
	});
	if (!lm.ok) {
		void vscode.window.showErrorMessage(lm.message);
		return;
	}
	deps.log?.(`Exam setup using ${lm.modelLabel}.`);

	const outcome = await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: `Building your ${examQuery.trim()} campaign`,
			cancellable: true,
		},
		(progress, token) =>
			runNewExamPipeline(
				{ examQuery, folder, config },
				{
					store,
					lm: lm.service,
					token,
					log: deps.log,
					report: (step: PipelineStep) => progress.report({ message: STEP_LABELS[step] }),
					checkpoint: async (message) => {
						await deps.state.sync?.enqueue(message);
					},
					approveSources: ({ meta, candidates, rediscover }) =>
						deps.sources.approve({
							examId: meta.id,
							examQuery: meta.examQuery ?? examQuery,
							code: meta.code,
							candidates,
							rediscover,
						}),
				}
			)
	);

	await deps.state.refresh();

	if (!outcome.ok) {
		const action = outcome.cancelled ? undefined : "Show log";
		const choice = await vscode.window.showWarningMessage(outcome.message, ...(action ? [action] : []));
		if (choice === action) {
			await vscode.commands.executeCommand("workbench.action.output.toggleOutput");
		}
		return;
	}

	void vscode.window.showInformationMessage(
		`${outcome.meta.code} is ready — ${outcome.plan.days.length} days and ${outcome.questions} questions. Day 1 is waiting.`
	);
	await deps.openDashboard(outcome.meta.id);
}

function defaultExamDate(): string {
	const date = new Date();
	date.setDate(date.getDate() + 30);
	return date.toISOString().slice(0, 10);
}

async function pickFolderName(examQuery: string, deps: NewExamDeps): Promise<string | undefined> {
	const code = examQuery.trim().split(/\s+/)[0] ?? "Exam";
	const suggested = `${code} Prep`;
	const taken = new Set(deps.state.snapshots.map((snapshot) => snapshot.meta.folder));
	const folder = await vscode.window.showInputBox({
		title: "Folder name in your prep repo",
		value: suggested,
		ignoreFocusOut: true,
		validateInput: (value) => {
			const trimmed = value.trim();
			if (!trimmed || /[\\/:*?"<>|]/.test(trimmed)) {
				return "Use a plain folder name.";
			}
			return undefined;
		},
	});
	if (!folder) {
		return undefined;
	}
	const trimmed = folder.trim();
	if (taken.has(trimmed)) {
		const resume = await vscode.window.showQuickPick(["Resume that setup", "Cancel"], {
			title: `"${trimmed}" already exists`,
			ignoreFocusOut: true,
		});
		if (resume !== "Resume that setup") {
			return undefined;
		}
	}
	return trimmed;
}
