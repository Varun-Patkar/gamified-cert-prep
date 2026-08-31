import * as assert from "assert";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { GitRunner, GitSync } from "../sync/gitSync";
import type { GitResult } from "../sync/gitSync";

function gitAvailable(): boolean {
	try {
		execFileSync("git", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function git(cwd: string, args: string[]): string {
	return execFileSync("git", args, {
		cwd,
		encoding: "utf8",
		env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
	});
}

function identify(cwd: string): void {
	git(cwd, ["config", "user.email", "tester@example.com"]);
	git(cwd, ["config", "user.name", "Cert Prep Tester"]);
	git(cwd, ["config", "commit.gpgsign", "false"]);
	// A global autocrlf would rewrite checked-out content and skew the conflict assertions.
	git(cwd, ["config", "core.autocrlf", "false"]);
}

function readText(file: string): string {
	return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

const tempRoots: string[] = [];

function makeTempRoot(): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "certprep-git-"));
	tempRoots.push(root);
	return root;
}

function writeFile(dir: string, name: string, contents: string): void {
	fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
	fs.writeFileSync(path.join(dir, name), contents, "utf8");
}

interface Sandbox {
	root: string;
	remote: string;
	work: string;
}

function makeSandbox(): Sandbox {
	const root = makeTempRoot();
	const remote = path.join(root, "remote.git");
	const work = path.join(root, "work");
	fs.mkdirSync(remote, { recursive: true });
	fs.mkdirSync(work, { recursive: true });
	git(remote, ["init", "--bare"]);
	git(work, ["init"]);
	identify(work);
	writeFile(work, "README.md", "base\n");
	git(work, ["add", "-A", "--", "."]);
	git(work, ["commit", "-m", "initial"]);
	git(work, ["remote", "add", "origin", remote]);
	git(work, ["push", "-u", "origin", "HEAD"]);
	return { root, remote, work };
}

function cloneOf(sandbox: Sandbox, name: string): string {
	const target = path.join(sandbox.root, name);
	git(sandbox.root, ["clone", sandbox.remote, target]);
	identify(target);
	return target;
}

function listConflictCopies(work: string): string[] {
	const dir = path.join(work, ".certprep", "conflicts");
	if (!fs.existsSync(dir)) {
		return [];
	}
	const found: string[] = [];
	const walk = (current: string): void => {
		for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
			const full = path.join(current, entry.name);
			if (entry.isDirectory()) {
				walk(full);
			} else {
				found.push(full);
			}
		}
	};
	walk(dir);
	return found;
}

/** Records the exact command order so serialization can be asserted without touching disk. */
class RecordingRunner extends GitRunner {
	readonly calls: string[] = [];

	constructor() {
		super(process.cwd());
	}

	override async run(args: string[]): Promise<GitResult> {
		this.calls.push(args.join(" "));
		await new Promise((resolve) => setImmediate(resolve));
		const joined = args.join(" ");
		if (joined === "rev-parse --is-inside-work-tree") {
			return { ok: true, code: 0, stdout: "true\n", stderr: "" };
		}
		if (joined === "remote") {
			return { ok: true, code: 0, stdout: "origin\n", stderr: "" };
		}
		if (joined === "rev-parse --abbrev-ref HEAD") {
			return { ok: true, code: 0, stdout: "main\n", stderr: "" };
		}
		if (joined === "status --porcelain") {
			return { ok: true, code: 0, stdout: " M notes.md\n", stderr: "" };
		}
		return { ok: true, code: 0, stdout: "", stderr: "" };
	}
}

after(() => {
	for (const root of tempRoots) {
		try {
			fs.rmSync(root, { recursive: true, force: true, maxRetries: 5 });
		} catch {
			// Temp cleanup is best effort on Windows.
		}
	}
});

describe("GitSync serialization", () => {
	it("runs queued jobs strictly in order without interleaving", async () => {
		const runner = new RecordingRunner();
		const sync = new GitSync(runner);
		await Promise.all([sync.enqueue("first"), sync.enqueue("second"), sync.enqueue("third")]);

		const commits = runner.calls.filter((call) => call.startsWith("commit -m "));
		assert.deepStrictEqual(commits, ["commit -m first", "commit -m second", "commit -m third"]);

		for (let index = 0; index < runner.calls.length; index += 1) {
			if (!runner.calls[index].startsWith("commit -m ")) {
				continue;
			}
			const rest = runner.calls.slice(index + 1);
			const nextPush = rest.findIndex((call) => call.startsWith("push"));
			const nextCommit = rest.findIndex((call) => call.startsWith("commit -m "));
			assert.ok(nextPush >= 0, "every commit must be followed by a push");
			assert.ok(nextCommit === -1 || nextPush < nextCommit, "a job must finish before the next one commits");
		}
	});

	it("reports state changes to listeners", async () => {
		const runner = new RecordingRunner();
		const sync = new GitSync(runner);
		const seen: string[] = [];
		const subscription = sync.onDidChangeState((state) => seen.push(state));
		await sync.enqueue("stateful");
		subscription.dispose();
		assert.ok(seen.includes("syncing"));
		assert.strictEqual(sync.state, "idle");
	});
});

describe("GitSync against real repositories", function () {
	this.timeout(60_000);

	before(function () {
		if (!gitAvailable()) {
			this.skip();
		}
	});

	it("commits and pushes the happy path", async () => {
		const sandbox = makeSandbox();
		writeFile(sandbox.work, "progress.json", '{"xp":10}\n');
		const sync = new GitSync(new GitRunner(sandbox.work));
		await sync.enqueue("Day 1 complete");

		assert.strictEqual(sync.state, "idle", sync.lastError);
		const remoteLog = git(sandbox.remote, ["log", "--format=%s", "-n", "1"]).trim();
		assert.strictEqual(remoteLog, "Day 1 complete");
	});

	it("is a silent no-op outside a git repository", async () => {
		const root = makeTempRoot();
		writeFile(root, "progress.json", "{}\n");
		const sync = new GitSync(new GitRunner(root));
		await sync.enqueue("nothing here");

		assert.strictEqual(sync.state, "idle");
		assert.strictEqual(fs.existsSync(path.join(root, ".git")), false);
	});

	it("is a silent no-op when the repo has no remote", async () => {
		const root = makeTempRoot();
		const work = path.join(root, "solo");
		fs.mkdirSync(work, { recursive: true });
		git(work, ["init"]);
		identify(work);
		writeFile(work, "progress.json", "{}\n");

		const sync = new GitSync(new GitRunner(work));
		await sync.enqueue("no remote");

		assert.strictEqual(sync.state, "idle");
		assert.strictEqual(await new GitRunner(work).revParse("HEAD"), undefined);
	});

	it("does not error when there is nothing to commit", async () => {
		const sandbox = makeSandbox();
		const sync = new GitSync(new GitRunner(sandbox.work));
		await sync.enqueue("no changes");

		assert.strictEqual(sync.state, "idle", sync.lastError);
		const count = git(sandbox.work, ["rev-list", "--count", "HEAD"]).trim();
		assert.strictEqual(count, "1");
	});

	it("pulls remote work without a conflict", async () => {
		const sandbox = makeSandbox();
		const other = cloneOf(sandbox, "other");
		writeFile(other, "remote-only.md", "from the other machine\n");
		git(other, ["add", "-A", "--", "."]);
		git(other, ["commit", "-m", "remote work"]);
		git(other, ["push"]);

		const sync = new GitSync(new GitRunner(sandbox.work));
		await sync.pull();

		assert.strictEqual(sync.state, "idle", sync.lastError);
		assert.ok(fs.existsSync(path.join(sandbox.work, "remote-only.md")));
	});

	it("resolves a real conflict with local winning and keeps the remote copy", async () => {
		const sandbox = makeSandbox();
		const other = cloneOf(sandbox, "other");
		writeFile(other, "notes.md", "remote change\n");
		git(other, ["add", "-A", "--", "."]);
		git(other, ["commit", "-m", "remote edit"]);
		git(other, ["push"]);

		writeFile(sandbox.work, "notes.md", "local change\n");
		const sync = new GitSync(new GitRunner(sandbox.work));
		await sync.enqueue("local edit");

		assert.strictEqual(readText(path.join(sandbox.work, "notes.md")), "local change\n");
		const copies = listConflictCopies(sandbox.work);
		assert.strictEqual(copies.length, 1, "expected the remote version to be preserved");
		assert.strictEqual(readText(copies[0]), "remote change\n");
		assert.ok(copies[0].endsWith(`${path.sep}notes.md`));
		assert.strictEqual(sync.state, "idle", sync.lastError);
	});

	it("marks state pending and never throws when the remote is unreachable", async () => {
		const root = makeTempRoot();
		const work = path.join(root, "offline");
		fs.mkdirSync(work, { recursive: true });
		git(work, ["init"]);
		identify(work);
		writeFile(work, "progress.json", "{}\n");
		git(work, ["remote", "add", "origin", path.join(root, "does-not-exist.git")]);

		const sync = new GitSync(new GitRunner(work, 15_000));
		await sync.enqueue("offline day");

		assert.strictEqual(sync.state, "pending");
		assert.ok((sync.lastError ?? "").length > 0);
		const subject = git(work, ["log", "--format=%s", "-n", "1"]).trim();
		assert.strictEqual(subject, "offline day", "the commit must survive so it can be pushed later");
	});

	it("retries the pending push on the next enqueue", async () => {
		const sandbox = makeSandbox();
		const detached = path.join(sandbox.root, "moved.git");
		fs.renameSync(sandbox.remote, detached);

		writeFile(sandbox.work, "day-01.md", "first\n");
		const sync = new GitSync(new GitRunner(sandbox.work, 15_000));
		await sync.enqueue("day one");
		assert.strictEqual(sync.state, "pending");

		fs.renameSync(detached, sandbox.remote);
		writeFile(sandbox.work, "day-02.md", "second\n");
		await sync.enqueue("day two");

		assert.strictEqual(sync.state, "idle", sync.lastError);
		const subjects = git(sandbox.remote, ["log", "--format=%s"]).trim().split(/\r?\n/);
		assert.ok(subjects.includes("day one"));
		assert.ok(subjects.includes("day two"));
	});
});

describe("GitRunner", function () {
	this.timeout(60_000);

	before(function () {
		if (!gitAvailable()) {
			this.skip();
		}
	});

	it("reports repo, remote and branch facts without throwing", async () => {
		const sandbox = makeSandbox();
		const runner = new GitRunner(sandbox.work);
		assert.strictEqual(await runner.isRepo(), true);
		assert.strictEqual(await runner.hasRemote(), true);
		assert.ok((await runner.currentBranch())?.length);
		assert.ok(((await runner.revParse("HEAD")) ?? "").length >= 40);
	});

	it("returns a structured failure instead of throwing for a bad command", async () => {
		const root = makeTempRoot();
		const runner = new GitRunner(root);
		const result = await runner.run(["log", "--format=%s"]);
		assert.strictEqual(result.ok, false);
		assert.ok(result.code !== 0);
		assert.strictEqual(await runner.isRepo(), false);
		assert.strictEqual(await runner.revParse("HEAD"), undefined);
	});

	it("reports a dirty working tree in status", async () => {
		const sandbox = makeSandbox();
		writeFile(sandbox.work, "dirty.md", "changed\n");
		const status = await new GitRunner(sandbox.work).status();
		assert.strictEqual(status.ok, true);
		assert.strictEqual(status.clean, false);
		assert.ok(status.entries.some((entry) => entry.filePath === "dirty.md"));
		assert.deepStrictEqual(status.conflicted, []);
	});
});
