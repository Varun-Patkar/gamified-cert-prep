/**
 * The sync engine. Nothing in here is allowed to throw or reject: a failed sync must never
 * interrupt a study session, so every failure is captured in `state` / `lastError` instead.
 */

import { execFile } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import { conflictsDir } from "../store/paths";

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_BUFFER_BYTES = 32 * 1024 * 1024;

/** Conflict markers in `git status --porcelain` short codes. */
const CONFLICT_CODES = ["DD", "AU", "UD", "UA", "DU", "AA", "UU"];

export interface GitResult {
	ok: boolean;
	code: number;
	stdout: string;
	stderr: string;
}

export interface GitStatusEntry {
	code: string;
	filePath: string;
}

export interface GitStatus {
	ok: boolean;
	clean: boolean;
	entries: GitStatusEntry[];
	conflicted: string[];
}

function gitEnv(): NodeJS.ProcessEnv {
	return {
		...process.env,
		GIT_TERMINAL_PROMPT: "0",
		GIT_ASKPASS: "echo",
		GIT_OPTIONAL_LOCKS: "0",
		GIT_PAGER: "cat",
		GIT_EDITOR: "true",
	};
}

/** Thin, non-throwing wrapper around the `git` CLI for a single working directory. */
export class GitRunner {
	constructor(
		public readonly cwd: string,
		private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS
	) {}

	run(args: string[]): Promise<GitResult> {
		return new Promise<GitResult>((resolve) => {
			execFile(
				"git",
				args,
				{ cwd: this.cwd, timeout: this.timeoutMs, maxBuffer: MAX_BUFFER_BYTES, env: gitEnv(), windowsHide: true },
				(error, stdout, stderr) => {
					const code = typeof (error as { code?: unknown } | null)?.code === "number" ? (error as { code: number }).code : error ? 1 : 0;
					resolve({ ok: !error, code, stdout: stdout ?? "", stderr: stderr ?? "" });
				}
			);
		});
	}

	/** Binary-safe read used to rescue the remote side of a conflict. */
	runBinary(args: string[]): Promise<{ ok: boolean; data: Buffer }> {
		return new Promise((resolve) => {
			execFile(
				"git",
				args,
				{
					cwd: this.cwd,
					timeout: this.timeoutMs,
					maxBuffer: MAX_BUFFER_BYTES,
					env: gitEnv(),
					windowsHide: true,
					encoding: "buffer",
				},
				(error, stdout) => {
					resolve({ ok: !error, data: Buffer.isBuffer(stdout) ? stdout : Buffer.alloc(0) });
				}
			);
		});
	}

	async isRepo(): Promise<boolean> {
		const result = await this.run(["rev-parse", "--is-inside-work-tree"]);
		return result.ok && result.stdout.trim() === "true";
	}

	async hasRemote(): Promise<boolean> {
		const result = await this.run(["remote"]);
		return result.ok && result.stdout.trim().length > 0;
	}

	async currentBranch(): Promise<string | undefined> {
		const result = await this.run(["rev-parse", "--abbrev-ref", "HEAD"]);
		const branch = result.stdout.trim();
		return result.ok && branch.length > 0 && branch !== "HEAD" ? branch : undefined;
	}

	async add(paths: string[]): Promise<GitResult> {
		const targets = paths.length > 0 ? paths : ["."];
		return this.run(["add", "-A", "--", ...targets]);
	}

	async commit(message: string): Promise<GitResult> {
		return this.run(["commit", "-m", message.length > 0 ? message : "Update study progress"]);
	}

	async pullRebaseAutostash(): Promise<GitResult> {
		return this.run(["pull", "--rebase", "--autostash"]);
	}

	/** Merge the remote in while local content wins every conflicting hunk. */
	async pullMergeOurs(): Promise<GitResult> {
		return this.run(["pull", "--no-rebase", "--no-edit", "-X", "ours"]);
	}

	async rebaseAbort(): Promise<GitResult> {
		return this.run(["rebase", "--abort"]);
	}

	async mergeAbort(): Promise<GitResult> {
		return this.run(["merge", "--abort"]);
	}

	async push(): Promise<GitResult> {
		const branch = await this.currentBranch();
		return branch ? this.run(["push", "-u", "origin", branch]) : this.run(["push"]);
	}

	async status(): Promise<GitStatus> {
		const result = await this.run(["status", "--porcelain"]);
		if (!result.ok) {
			return { ok: false, clean: false, entries: [], conflicted: [] };
		}
		const entries: GitStatusEntry[] = [];
		for (const line of result.stdout.split(/\r?\n/)) {
			if (line.trim().length === 0) {
				continue;
			}
			const code = line.slice(0, 2);
			const raw = line.slice(3).trim();
			const arrow = raw.indexOf(" -> ");
			const filePath = (arrow >= 0 ? raw.slice(arrow + 4) : raw).replace(/^"|"$/g, "");
			entries.push({ code, filePath });
		}
		return {
			ok: true,
			clean: entries.length === 0,
			entries,
			conflicted: entries.filter((entry) => CONFLICT_CODES.includes(entry.code)).map((entry) => entry.filePath),
		};
	}

	async revParse(ref: string): Promise<string | undefined> {
		const result = await this.run(["rev-parse", ref]);
		const value = result.stdout.trim();
		return result.ok && value.length > 0 ? value : undefined;
	}
}

export type SyncState = "idle" | "syncing" | "pending" | "offline";

export interface SyncOptions {
	/** Where `.certprep/conflicts` lives. Defaults to the runner's working directory. */
	root?: string;
	log?: (message: string) => void;
	now?: () => Date;
}

export interface SyncDisposable {
	dispose(): void;
}

/** Colons are illegal in Windows file names, so the timestamp folder uses a flattened ISO form. */
function timestampFolder(now: Date): string {
	return now.toISOString().replace(/[:.]/g, "-");
}

function looksLikeNothingToCommit(result: GitResult): boolean {
	const text = `${result.stdout} ${result.stderr}`.toLowerCase();
	return text.includes("nothing to commit") || text.includes("no changes added") || text.includes("working tree clean");
}

export class GitSync {
	private currentState: SyncState = "idle";
	private queue: Promise<void> = Promise.resolve();
	private readonly listeners: ((state: SyncState) => void)[] = [];

	lastError?: string;

	constructor(
		private readonly git: GitRunner,
		private readonly options: SyncOptions = {}
	) {}

	get state(): SyncState {
		return this.currentState;
	}

	onDidChangeState(listener: (state: SyncState) => void): SyncDisposable {
		this.listeners.push(listener);
		return {
			dispose: () => {
				const index = this.listeners.indexOf(listener);
				if (index >= 0) {
					this.listeners.splice(index, 1);
				}
			},
		};
	}

	/** Serialized: queued jobs run strictly in order and never interleave git commands. */
	enqueue(message: string, paths?: string[]): Promise<void> {
		const job = this.queue.then(() => this.runSync(message, paths ?? ["."]));
		this.queue = job.catch(() => undefined);
		return this.queue;
	}

	pull(): Promise<void> {
		const job = this.queue.then(() => this.runPull());
		this.queue = job.catch(() => undefined);
		return this.queue;
	}

	private setState(state: SyncState, error?: string): void {
		this.lastError = error;
		if (this.currentState === state) {
			return;
		}
		this.currentState = state;
		for (const listener of [...this.listeners]) {
			try {
				listener(state);
			} catch {
				// A misbehaving listener must not break sync.
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

	private async usable(): Promise<boolean> {
		return (await this.git.isRepo()) && (await this.git.hasRemote());
	}

	private async runSync(message: string, paths: string[]): Promise<void> {
		try {
			if (!(await this.usable())) {
				this.setState("idle");
				return;
			}
			this.setState("syncing");

			const added = await this.git.add(paths);
			if (!added.ok) {
				this.setState("pending", added.stderr.trim() || "git add failed");
				return;
			}
			const status = await this.git.status();
			if (!status.clean) {
				const committed = await this.git.commit(message);
				if (!committed.ok && !looksLikeNothingToCommit(committed)) {
					this.setState("pending", committed.stderr.trim() || "git commit failed");
					return;
				}
			}

			if (!(await this.integrate())) {
				return;
			}
			await this.pushOrDefer();
		} catch (error) {
			this.setState("pending", error instanceof Error ? error.message : String(error));
		}
	}

	private async runPull(): Promise<void> {
		try {
			if (!(await this.usable())) {
				this.setState("idle");
				return;
			}
			this.setState("syncing");
			const integrated = await this.integrate();
			if (integrated && this.currentState === "syncing") {
				this.setState("idle");
			}
		} catch (error) {
			this.setState("offline", error instanceof Error ? error.message : String(error));
		}
	}

	/** Brings the remote in. Returns false when the caller should stop and leave the state as set. */
	private async integrate(): Promise<boolean> {
		const pulled = await this.git.pullRebaseAutostash();
		if (pulled.ok) {
			return true;
		}
		const status = await this.git.status();
		if (status.conflicted.length === 0) {
			// Nothing to merge (unborn upstream) still lets a first push through.
			this.setState("offline", pulled.stderr.trim() || "git pull failed");
			return true;
		}

		await this.preserveRemoteVersions(status.conflicted);
		await this.git.rebaseAbort();
		const merged = await this.git.pullMergeOurs();
		if (!merged.ok) {
			await this.git.mergeAbort();
			this.setState("pending", merged.stderr.trim() || "conflict resolution failed");
			return false;
		}
		this.log(`Resolved ${status.conflicted.length} conflict(s) in favour of local content.`);
		return true;
	}

	private async pushOrDefer(): Promise<void> {
		const pushed = await this.git.push();
		if (pushed.ok) {
			this.setState("idle");
			return;
		}
		this.setState("pending", pushed.stderr.trim() || "git push failed");
	}

	/** Copies the incoming (remote) side of each conflict aside so local-wins never loses data. */
	private async preserveRemoteVersions(files: string[]): Promise<void> {
		const now = (this.options.now ?? (() => new Date()))();
		const target = path.join(conflictsDir(this.options.root ?? this.git.cwd), timestampFolder(now));
		for (const file of files) {
			// During a rebase stage 2 is the upstream side, i.e. what the remote had.
			const shown = await this.git.runBinary(["show", `:2:${file}`]);
			if (!shown.ok) {
				continue;
			}
			const destination = path.join(target, file);
			try {
				await fs.mkdir(path.dirname(destination), { recursive: true });
				await fs.writeFile(destination, shown.data);
			} catch (error) {
				this.log(`Could not preserve remote copy of ${file}: ${String(error)}`);
			}
		}
	}
}
