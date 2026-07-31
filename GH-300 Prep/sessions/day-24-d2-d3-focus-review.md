# Day 24: D2 / D3 Focus Review

**Date**: 2026-08-01 _(running early on 2026-07-31)_
**Domain**: Domain 2 — Copilot Features & Plans (25–30%) + Domain 3 — Data & Architecture (10–15%)
**Subtopics**: Plan tiers and entitlements, IDE surfaces, chat participants/slash commands, CLI, Edit vs Agent vs coding agent, MCP, code review & PR summaries, Spaces/Spark, org policies & audit, data flow pipeline, context building, LLM limitations
**Estimated study time**: 2 hrs
**Exam date**: 2026-08-08 (7 days out)

---

## TL;DR (60-second skim)

- **Tier rule is directional, not "always Business."** Business = org admin controls. Enterprise = GHEC-scoped, enterprise-wide, GitHub.com repo-aware Chat.
- **Free** = limited monthly completions + chat, individual, no org controls. **Pro** = individual paid **and free for verified students, teachers, and OSS maintainers**. **Pro+** = higher premium-request allowance + more models. **Business** = org seats, policies, exclusions, audit, IP indemnity. **Enterprise** = GHEC + repo-aware Chat on GitHub.com + enterprise-wide governance.
- **Copilot is cloud-only.** No GHES, no on-prem, no air-gapped. Enterprise means **GHEC**, never GHES.
- **Edit mode** = you name the files, you get reviewable diffs, no autonomous tool use. **Agent mode** = multi-step, runs commands/tools, self-corrects, still local + human-approved. **Coding agent (cloud)** = GitHub-side, works on an issue, opens a **draft PR**; requires a **paid** plan.
- **Content exclusion controls INPUT.** **Duplication detection / code referencing controls OUTPUT.** Never swap these.
- **Data flow**: IDE gathers context → **Copilot cloud service (proxy)** applies exclusions/filters → LLM → response filtered again → IDE. Nothing runs locally, nothing runs on CI runners, nothing runs on GHES.
- Copilot **does not train shared models on your private code by default** (Business/Enterprise never; individual has a toggle).

---

## Post-Quiz Result — 26/28 (93%), 6m 8s

Zero plan-tier misses. Both misses hit the **same** concept — the three public-code/privacy controls. Memorize this split:

| Trigger in the stem                                    | Control                   | Behavior                                 |
| ------------------------------------------------------ | ------------------------- | ---------------------------------------- |
| **Exact** match, **long** (~150+ chars) to public code | **Duplication detection** | **Blocks** the suggestion (when enabled) |
| **Similar but not exact** to public code               | **Code referencing**      | **Shows** references/links (or blocks)   |
| Files/paths Copilot may **read** as context            | **Content exclusion**     | Removes the file from the **input**      |

- q150 (**2nd miss** — also missed Day 14): correct = **C, duplication-detection filters block long exact matches**. Picked B ("shows links, never blocks") = that is **code referencing**, not duplication detection.
- q145: correct = **B, blocked by duplication-detection filters**. Picked D ("depends on the license file") — the filter does **no license analysis**; it is purely **length + exactness** based.

**Exam-day sentence:** _"Duplication detection is length-based and license-blind: long exact match → blocked. Code referencing is similarity-based: shows references. Content exclusion is input-side."_

---

## Learning Objectives

After this session you should be able to:

1. Pick the correct plan tier from any stem in under 5 seconds using the directional rule.
2. Choose between Edit mode, Agent mode, and the cloud coding agent for a given task.
3. Describe the end-to-end request pipeline and name what each hop does.
4. State exactly which context sources Copilot uses to build a prompt.
5. Separate content exclusion from code referencing, and telemetry from model training.
6. Recall CLI commands, chat participants, slash commands, and customization files.

---

## Part 1 — Plan Tiers (the highest-yield table on the exam)

| Capability                                          | Free    | Pro | Pro+ | Business | Enterprise |
| --------------------------------------------------- | ------- | --- | ---- | -------- | ---------- |
| Code completions                                    | Limited | ✅  | ✅   | ✅       | ✅         |
| Copilot Chat (IDE)                                  | Limited | ✅  | ✅   | ✅       | ✅         |
| Agent mode in IDE                                   | ✅      | ✅  | ✅   | ✅       | ✅         |
| Cloud **coding agent** (issue → draft PR)           | ❌      | ✅  | ✅   | ✅       | ✅         |
| Org-level **policy management**                     | ❌      | ❌  | ❌   | ✅       | ✅         |
| **Content exclusions** (repo/org level)             | ❌      | ❌  | ❌   | ✅       | ✅         |
| Org admin **public-code matching policy**           | ❌      | ❌  | ❌   | ✅       | ✅         |
| **Audit logs** for Copilot events                   | ❌      | ❌  | ❌   | ✅       | ✅         |
| IP **indemnity**                                    | ❌      | ❌  | ❌   | ✅       | ✅         |
| Seat management / usage metrics / REST API          | ❌      | ❌  | ❌   | ✅       | ✅         |
| **Repo-aware Chat on GitHub.com** (knowledge bases) | ❌      | ❌  | ❌   | ❌       | ✅         |
| **Enterprise-wide** governance across many orgs     | ❌      | ❌  | ❌   | ❌       | ✅         |
| Requires **GHEC**                                   | —       | —   | —    | —        | ✅         |

### The directional tier rule (drill this — 4 repeat misses live here)

Read the stem and find the **scope word**:

- "An **organization admin** wants to control policy / restrict which repos or code Copilot can access / turn on exclusions / see audit logs" → **Business**. Business is the _first_ tier with org controls; Enterprise merely inherits them.
- "Across **multiple organizations** / **enterprise-wide** / **GHEC** / advanced compliance + identity / **repo-aware Chat on GitHub.com** / knowledge bases" → **Enterprise**.
- "**Individual** developer, personal account, no org" → **Pro** (or Free if the stem stresses _no cost_ + _limited usage_).
- "Verified **student / teacher / open-source maintainer**, free" → **Copilot Pro** (free of charge). ❗ Not "Copilot Free" — that is a separate limited tier available to everyone.
- "**30-day GHEC trial**" → includes **Copilot Business**. GHEC itself does **not** bundle Copilot permanently; seats are purchased.
- "GHES / on-prem / air-gapped / self-hosted" → **Copilot is not supported at all**. Cloud-only.

> ⚠️ Both failure directions have burned you. Do **not** reflexively answer Business, and do **not** reflexively answer Enterprise. Find the scope word first.

---

## Part 2 — Surfaces & Features (D2)

### IDE surfaces

- **Inline (ghost text) completions** — Tab accept, Esc dismiss, `Alt+]` / `Alt+[` next/previous, `Alt+\` trigger, `Ctrl+Enter` open completions panel.
- **Inline chat** (`Ctrl+I`) — in-place, scoped to the current selection/file.
- **Chat panel** — conversational, multi-turn, keeps history.
- **Plan mode** — Copilot drafts a step-by-step plan you approve before edits.
- **Next edit suggestions** — predicts the _next_ place you'll edit, not just the next characters.

### Chat participants and commands

- Participants: `@workspace` (whole project), `@github` (GitHub knowledge / web search / repo data), `@terminal`, `@vscode`.
- Slash commands: `/explain`, `/fix`, `/tests`, `/doc`, `/new`, `/newNotebook`, `/help`, `/clear`.
- Variables: `#file`, `#selection`, `#editor`, `#terminalLastCommand`, `#codebase`.
- Customization: `.github/copilot-instructions.md` (repo-wide), `*.instructions.md` with `applyTo`, `*.prompt.md` (reusable prompts), `AGENTS.md`.

### GitHub Copilot CLI

- `gh copilot suggest "…"` — get a shell/gh/git command for a described task.
- `gh copilot explain "…"` — explain what an existing command does.
- `gh copilot config` — settings; `gh extension install github/gh-copilot` to install.
- Requires the `gh` CLI plus an **active Copilot subscription**. It **suggests** commands; it never executes destructive commands without confirmation.

### Edit vs Agent vs coding agent (classic distractor cluster)

|                        | Edit mode            | Agent mode (IDE)               | Coding agent (cloud)           |
| ---------------------- | -------------------- | ------------------------------ | ------------------------------ |
| Scope                  | Files **you** pick   | Agent decides files            | GitHub-hosted, whole repo      |
| Tool/terminal use      | ❌                   | ✅ runs commands, tests, tools | ✅ in its own environment      |
| Iterates/self-corrects | ❌                   | ✅                             | ✅                             |
| Output                 | Reviewable **diffs** | Multi-step edits + diffs       | **Draft pull request**         |
| Trigger                | You describe change  | You state a goal               | Assign an **issue** to Copilot |
| Plan needed            | Any                  | Any (incl. Free)               | **Paid plan**                  |

Pick **Edit mode** when the stem says _small, well-scoped, targeted, reviewable change_. Pick **Agent mode** when it says _multi-file, run tests, install deps, figure out the steps_. Pick **coding agent** when the work should happen **on GitHub** and end in a **PR**.

### MCP (Model Context Protocol)

- Open standard letting Copilot's agent talk to **external tools and data sources** (databases, issue trackers, browsers, internal APIs).
- Servers expose **tools, resources, and prompts**; Copilot acts as the **client**.
- Configured per repo/user (`.vscode/mcp.json` or user settings). Org admins can **govern which MCP servers are allowed**.
- Security: MCP servers run with your credentials — treat server output as untrusted input (prompt-injection surface).

### Code review, PR summaries, Spaces, Spark

- **Copilot code review** — request Copilot as a reviewer on a PR; leaves **advisory** comments and suggested edits. It does **not** approve, merge, or bypass branch protection or CODEOWNERS.
- **PR summaries** — Copilot drafts the description from the diff; author edits and owns it.
- **Copilot Spaces** — curated bundles of context (repos, files, docs, free text) you can chat against for a recurring task.
- **Spark** — build and deploy a small full-stack app from a natural-language description.
- **Knowledge bases** (Enterprise) — curated markdown collections used by repo-aware Chat on GitHub.com.

### Governance & telemetry

- Org policies toggle: Copilot in the IDE, Copilot in the CLI, coding agent, public-code matching, content exclusions, MCP, model choice.
- **Audit log** records Copilot events (seat assigned/removed, policy changed, exclusion changed).
- **REST API** manages seats: list/add/remove seats, read usage metrics.
- Policy hierarchy: **enterprise setting can enforce and lock**; org setting applies where not locked; user setting applies last where permitted.

---

## Part 3 — Data & Architecture (D3)

### The request pipeline

```
IDE / editor
  └─ gather context (current file, cursor position, neighboring open tabs,
     selection, file type/language, symbols, chat history, referenced files)
        └─ apply CONTENT EXCLUSIONS (blocked paths never leave the machine)
              └─ GitHub Copilot cloud service / proxy
                   • auth + entitlement check
                   • policy enforcement
                   • prompt assembly, toxicity/secret filtering
                        └─ LLM (selected model)
                             └─ response
                                  • post-processing: duplication/public-code filter,
                                    safety filter, relevance check
                                       └─ back to IDE as a suggestion
```

Key facts to memorize:

- Processing happens in the **Copilot cloud service**, not locally, not on CI runners, not on GHES.
- Prompts and suggestions are **transient** for Business/Enterprise — not retained to train shared models.
- **Content exclusion is enforced before the request leaves the client**; excluded files also stop being used as context for other files.
- Exclusion path rules use **`fnmatch`** patterns configured at repo or org level. **`.copilotignore` is not a supported mechanism.**
- The **duplication detection / "suggestions matching public code"** filter runs on the **output**, blocking suggestions matching public code (~150 characters of context).

### How context is built

Copilot considers: the code before and after the cursor, the current file's language and path, comments and function/variable names, **neighboring open tabs**, explicitly referenced files, selected text, chat history, and repo custom instructions. It does **not** silently read your whole disk, your whole repo, or your private repos it hasn't been given.

### LLM limitations (exam loves these)

- **Nondeterministic** — same prompt can yield different suggestions.
- **Token/context window limits** — long files get truncated; that is why scoping matters.
- **Hallucination** — invented APIs, packages, parameters. Always verify.
- **Training cutoff** — unaware of the newest library versions.
- **No guarantee of correctness, security, or license cleanliness** — human review is mandatory.
- Copilot **cannot execute or test code** by itself in completion/chat; execution belongs to agent tooling or your CI (e.g., GitHub Actions).

---

## Part 4 — Repeat-Miss Drill Card (say these out loud)

1. Org admin controls which repos/code Copilot can access → **Business**. (Missed 3×.)
2. GHEC + advanced compliance/identity + GitHub.com repo-aware Chat → **Enterprise**. (Missed 2×.)
3. Free 30-day GHEC trial → includes **Copilot Business**.
4. Verified student / teacher / OSS maintainer → **Copilot Pro**, free.
5. GHES / on-prem → **Copilot not supported**.
6. CI-ready output prompt → specify **format + exact schema + "no prose"**. (Missed ~4×.)
7. Bias / representative data / discrimination → **Fairness**, never Transparency.
8. Near-match to public code → **code referencing / duplication detection** (output), not content exclusion (input).
9. Free plan **includes** IDE agent mode; the **cloud coding agent needs a paid plan**.
10. Copilot drafts tests; **CI runs them**.

---

## Practice

- 25 questions, `--day-lock 24`
- Command: `python quiz_runner.py questions.json --day-lock 24`

## Post-session

- [ ] Record score in `progress.md`
- [ ] Tick Day 24 checkboxes in `plan.md`
- [ ] Log any new miss patterns into the drill card above
