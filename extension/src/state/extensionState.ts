/** Owns the bound repo and everything derived from it. The only mutable state in the extension. */

import * as fs from "fs/promises";
import * as vscode from "vscode";
import type { UserProfile } from "../model/types";
import { migrateLegacyExams } from "../store/migration";
import { configFile } from "../store/paths";
import { RepoStore } from "../store/repoStore";
import { GitRunner, GitSync, type SyncState } from "../sync/gitSync";
import type { ExamSnapshot } from "../views/sidebarModel";

export interface ExtensionStateOptions {
	log?: (message: string) => void;
}

export class ExtensionState implements vscode.Disposable {
	private readonly listeners: (() => void)[] = [];
	private readonly disposables: vscode.Disposable[] = [];
	private pullTimer?: NodeJS.Timeout;
	private syncSubscription?: { dispose(): void };

	root?: string;
	store?: RepoStore;
	sync?: GitSync;
	snapshots: ExamSnapshot[] = [];
	profile?: UserProfile;

	constructor(private readonly options: ExtensionStateOptions = {}) {}

	get bound(): boolean {
		return this.root !== undefined;
	}

	get syncState(): SyncState {
		return this.sync?.state ?? "idle";
	}

	get syncError(): string | undefined {
		return this.sync?.lastError;
	}

	onDidChange(listener: () => void): vscode.Disposable {
		this.listeners.push(listener);
		return new vscode.Disposable(() => {
			const index = this.listeners.indexOf(listener);
			if (index >= 0) {
				this.listeners.splice(index, 1);
			}
		});
	}

	async bind(root: string): Promise<void> {
		this.teardownSync();
		this.root = root;
		this.store = new RepoStore(root);
		this.sync = new GitSync(new GitRunner(root), { root, log: (message) => this.log(message) });
		this.syncSubscription = this.sync.onDidChangeState(() => this.emit());

		try {
			await migrateLegacyExams(root);
		} catch (error) {
			this.log(`Legacy migration skipped: ${describe(error)}`);
		}

		await this.refresh();
		void this.sync.pull().then(() => this.refresh());
		this.startPullTimer();
	}

	unbind(): void {
		this.teardownSync();
		this.root = undefined;
		this.store = undefined;
		this.sync = undefined;
		this.snapshots = [];
		this.profile = undefined;
		this.emit();
	}

	async refresh(): Promise<void> {
		const store = this.store;
		if (!store) {
			return;
		}
		try {
			this.profile = await store.readProfile();
			const exams = await store.listExams();
			const snapshots: ExamSnapshot[] = [];
			for (const meta of exams) {
				snapshots.push({
					meta,
					plan: await store.readPlan(meta.folder),
					progress: await store.readProgress(meta.folder),
				});
			}
			this.snapshots = snapshots;
		} catch (error) {
			this.log(`Refresh failed: ${describe(error)}`);
		}
		this.emit();
	}

	async commitNow(message = "Update study progress"): Promise<void> {
		if (!this.sync) {
			return;
		}
		await this.sync.enqueue(message);
		this.emit();
	}

	findSnapshot(examId: string): ExamSnapshot | undefined {
		return this.snapshots.find((snapshot) => snapshot.meta.id === examId);
	}

	dispose(): void {
		this.teardownSync();
		for (const disposable of this.disposables.splice(0)) {
			disposable.dispose();
		}
		this.listeners.length = 0;
	}

	private startPullTimer(): void {
		const minutes = vscode.workspace.getConfiguration("certPrep").get<number>("sync.pullIntervalMinutes", 15);
		if (!Number.isFinite(minutes) || minutes <= 0) {
			return;
		}
		this.pullTimer = setInterval(() => {
			void this.sync?.pull().then(() => this.refresh());
		}, minutes * 60_000);
	}

	private teardownSync(): void {
		if (this.pullTimer) {
			clearInterval(this.pullTimer);
			this.pullTimer = undefined;
		}
		this.syncSubscription?.dispose();
		this.syncSubscription = undefined;
	}

	private emit(): void {
		for (const listener of [...this.listeners]) {
			try {
				listener();
			} catch (error) {
				this.log(`Listener failed: ${describe(error)}`);
			}
		}
	}

	private log(message: string): void {
		try {
			this.options.log?.(message);
		} catch {
			// Logging is best effort.
		}
	}
}

function describe(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/** The first workspace folder that already carries `.certprep/config.json`. */
export async function findBoundFolder(): Promise<string | undefined> {
	for (const folder of vscode.workspace.workspaceFolders ?? []) {
		const root = folder.uri.fsPath;
		try {
			await fs.access(configFile(root));
			return root;
		} catch {
			// Not a cert prep repo; keep looking.
		}
	}
	return undefined;
}
