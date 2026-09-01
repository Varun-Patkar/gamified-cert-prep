import * as assert from "assert";
import type { ExamMeta } from "../model/types";
import { encodeRelativePath, renderCertTable, updateReadme } from "../readme/readmeTable";

/** Copied verbatim from the repo README so the renderer is held to the real format. */
const REAL_README = `# Microsoft Certification Exam Prep

A VS Code agent-powered system for structured Microsoft certification exam preparation. Uses GitHub Copilot custom agents to orchestrate research, study planning, and daily drill sessions.

## 🏆 Certifications Earned with Help of Agent

These exams were passed using this prep system:

| Exam | Certification | Credential | Score Report |
|------|---------------|------------|--------------|
| **DP-800** | Microsoft Certified: SQL AI Developer Associate | [View credential](https://learn.microsoft.com/api/credentials/share/en-gb/VarunPatkar/2EC3461E6479548?sharingId=255AC49FFD10B95B) | [View PDF](DP-800%20Prep/DP-800-score-report.pdf) |
| **AI-102** | Microsoft Certified: Azure AI Engineer Associate | [View credential](https://learn.microsoft.com/api/credentials/share/en-gb/VarunPatkar/57E88FFE28157FDB?sharingId=255AC49FFD10B95B) | [View PDF](AI-102%20Prep/AI-102-score-report.pdf) |
| **GH-300** | GitHub Certified: GitHub Copilot | [View credential](https://learn.microsoft.com/api/credentials/share/en-gb/VarunPatkar/857C8CC1F8AB312A?sharingId=255AC49FFD10B95B) | [View PDF](GH-300%20Prep/GH-300-score-report.pdf) |

## How It Works

Three custom agents work together:

| Agent | Role |
|-------|------|
| **Microsoft Certification Preparator** | Main orchestrator — handles setup, planning, and session dispatch |

## Requirements

- VS Code with GitHub Copilot (agent mode)
- Python 3.7+ (for quiz runner)
`;

const exam = (over: Partial<ExamMeta>): ExamMeta => ({
	schemaVersion: 1,
	id: "dp-800",
	vendor: "Microsoft",
	code: "DP-800",
	title: "Microsoft Certified: SQL AI Developer Associate",
	status: "completed",
	legacy: true,
	gamified: false,
	folder: "DP-800 Prep",
	createdAt: "2026-04-26",
	...over,
});

const EXAMS: ExamMeta[] = [
	exam({
		completedAt: "2026-05-01",
		result: {
			passed: true,
			credentialUrl:
				"https://learn.microsoft.com/api/credentials/share/en-gb/VarunPatkar/2EC3461E6479548?sharingId=255AC49FFD10B95B",
			scoreReportFile: "DP-800 Prep/DP-800-score-report.pdf",
		},
	}),
	exam({
		id: "ai-102",
		code: "AI-102",
		title: "Microsoft Certified: Azure AI Engineer Associate",
		folder: "AI-102 Prep",
		createdAt: "2026-05-02",
		completedAt: "2026-06-01",
		result: {
			passed: true,
			credentialUrl:
				"https://learn.microsoft.com/api/credentials/share/en-gb/VarunPatkar/57E88FFE28157FDB?sharingId=255AC49FFD10B95B",
			scoreReportFile: "AI-102 Prep/AI-102-score-report.pdf",
		},
	}),
	exam({
		id: "gh-300",
		code: "GH-300",
		vendor: "GitHub",
		title: "GitHub Certified: GitHub Copilot",
		folder: "GH-300 Prep",
		createdAt: "2026-06-02",
		completedAt: "2026-07-01",
		result: {
			passed: true,
			credentialUrl:
				"https://learn.microsoft.com/api/credentials/share/en-gb/VarunPatkar/857C8CC1F8AB312A?sharingId=255AC49FFD10B95B",
			scoreReportFile: "GH-300 Prep/GH-300-score-report.pdf",
		},
	}),
];

describe("renderCertTable", () => {
	it("reproduces the table the readme already uses, byte for byte", () => {
		const expected = REAL_README.split(/\r?\n/)
			.filter((line) => line.startsWith("|"))
			.slice(0, 5)
			.join("\n");
		assert.strictEqual(renderCertTable(EXAMS), expected);
	});

	it("bolds the code and encodes spaces in the score report path", () => {
		const table = renderCertTable([EXAMS[0]]);
		assert.ok(table.includes("| **DP-800** |"));
		assert.ok(table.includes("[View PDF](DP-800%20Prep/DP-800-score-report.pdf)"));
		assert.ok(table.includes("[View credential](https://learn.microsoft.com/"));
	});

	it("only lists completed exams", () => {
		const table = renderCertTable([...EXAMS, exam({ id: "ab-100", code: "AB-100", status: "in-progress" })]);
		assert.ok(!table.includes("AB-100"));
	});

	it("keeps the header rows even with nothing earned yet", () => {
		assert.strictEqual(renderCertTable([]).split("\n").length, 2);
	});

	it("uses an em dash for a missing credential or score report", () => {
		const table = renderCertTable([exam({ result: { passed: true } })]);
		assert.ok(table.endsWith("| — | — |"));
	});

	it("orders by when they were earned, then by code", () => {
		const table = renderCertTable([...EXAMS].reverse());
		const codes = table
			.split("\n")
			.slice(2)
			.map((row) => row.split("|")[1].trim());
		assert.deepStrictEqual(codes, ["**DP-800**", "**AI-102**", "**GH-300**"]);
	});

	it("encodes each path segment without eating the separators", () => {
		assert.strictEqual(encodeRelativePath("DP-800 Prep/DP-800-score-report.pdf"), "DP-800%20Prep/DP-800-score-report.pdf");
		assert.strictEqual(encodeRelativePath("A B\\c d.png"), "A%20B/c%20d.png");
	});
});

describe("updateReadme", () => {
	it("is a no-op when the table is already correct", () => {
		assert.strictEqual(updateReadme(REAL_README, renderCertTable(EXAMS)), REAL_README);
	});

	it("is idempotent", () => {
		const once = updateReadme(REAL_README, renderCertTable([...EXAMS, exam({ id: "x", code: "MS-900", folder: "MS-900 Prep", completedAt: "2026-08-01", title: "Microsoft Certified: Fundamentals" })]));
		const twice = updateReadme(once, renderCertTable([...EXAMS, exam({ id: "x", code: "MS-900", folder: "MS-900 Prep", completedAt: "2026-08-01", title: "Microsoft Certified: Fundamentals" })]));
		assert.strictEqual(twice, once);
		assert.ok(once.includes("| **MS-900** |"));
	});

	it("leaves every other section verbatim", () => {
		const updated = updateReadme(REAL_README, renderCertTable([EXAMS[0]]));
		const untouched = REAL_README.slice(REAL_README.indexOf("## How It Works"));
		assert.ok(updated.endsWith(untouched), "everything after the table survives");
		assert.ok(updated.startsWith(REAL_README.slice(0, REAL_README.indexOf("| Exam |"))), "the intro survives");
		assert.ok(!updated.includes("AI-102"), "the removed row is gone");
	});

	it("keeps the prose sentence that sits between the heading and the table", () => {
		const updated = updateReadme(REAL_README, renderCertTable(EXAMS));
		assert.ok(updated.includes("These exams were passed using this prep system:"));
	});

	it("never touches the unrelated agents table", () => {
		const updated = updateReadme(REAL_README, renderCertTable([]));
		assert.ok(updated.includes("| **Microsoft Certification Preparator** | Main orchestrator"));
		assert.ok(updated.includes("| Agent | Role |"));
	});

	it("inserts the table when the heading exists but the table does not", () => {
		const source = "# Title\n\n## Certifications Earned\n\n## Next\n\nbody\n";
		const once = updateReadme(source, renderCertTable([EXAMS[0]]));
		assert.ok(once.includes("| **DP-800** |"));
		assert.ok(once.includes("## Next"));
		assert.strictEqual(updateReadme(once, renderCertTable([EXAMS[0]])), once);
	});

	it("inserts a whole section when the heading is missing", () => {
		const source = "# Title\n\nIntro prose.\n\n## How It Works\n\nbody\n";
		const once = updateReadme(source, renderCertTable([EXAMS[0]]));
		assert.ok(once.includes("## Certifications Earned"));
		assert.ok(once.indexOf("## Certifications Earned") < once.indexOf("## How It Works"));
		assert.ok(once.includes("Intro prose."));
		assert.strictEqual(updateReadme(once, renderCertTable([EXAMS[0]])), once);
	});

	it("appends the section to a readme with no subheadings at all", () => {
		const source = "# Title\n\nJust prose.\n";
		const once = updateReadme(source, renderCertTable([EXAMS[0]]));
		assert.ok(once.startsWith("# Title\n\nJust prose.\n"));
		assert.ok(once.includes("| **DP-800** |"));
		assert.strictEqual(updateReadme(once, renderCertTable([EXAMS[0]])), once);
	});

	it("preserves crlf line endings", () => {
		const source = REAL_README.replace(/\n/g, "\r\n");
		const updated = updateReadme(source, renderCertTable(EXAMS));
		assert.strictEqual(updated, source);
	});
});
