# Day 27: Full Timed Mock — All-Domain Pre-Mock Consolidation

**Date**: 2026-08-03 (plan date 2026-08-04, run early)
**Domain**: ALL — D1 through D6
**Subtopics**: Full-spectrum mock; pacing and flagging strategy; every historical repeat trap
**Estimated study time**: 2.5 hrs (read ~45 min, mock ~30–40 min, review ~45 min)
**Exam date**: 2026-08-08 — **5 days out**

---

## TL;DR (60-second skim)

- This is the **last full-spectrum mock before the exam.** 25 questions spanning D1, D2, D4, D5, D6.
- **Plan tiers are DIRECTIONAL.** Business = org admin controls, policies, seat management, usage reporting, audit logs, content exclusion. Enterprise = GHEC-scoped advanced compliance/identity + **GitHub.com repo-aware Chat** + enterprise proxy/network + enterprise-wide enforcement. Do not reflexively pick either one.
- **Three-control split**: content exclusion = **INPUT** context fence; code referencing = **similar OUTPUT shown with references**; duplication detection = **exact ~150+ char OUTPUT BLOCKED** (length-based, license-blind).
- **Cloud/coding agent** = ephemeral **GitHub Actions**-powered environment → branch → **draft PR**. Available on **all paid plans** (Pro, Pro+, Business, Enterprise). **Copilot Free has IDE agent mode but NOT the cloud agent.**
- **Edit mode** = targeted reviewable diffs on a small well-scoped change. **Agent mode** = multi-file, multi-step, runs commands, opens PR.
- **Copilot never overrides governance**: branch protections, required reviews, CODEOWNERS, and status checks always still apply.
- **Fairness ≠ Transparency.** "Prevent discrimination / unbiased / representative data" = **Fairness**. Transparency = explainability and disclosure.
- **Read every question and all four (or five) options fully.** Your two 100% runs came from that discipline, not from speed.

---

## Learning Objectives

After this session you should be able to, under timed pressure:

1. Map any responsible-AI scenario to the correct Microsoft RAI principle, including multi-principle combinations.
2. Select the correct Copilot plan tier from a stem, applying the directional rule in both directions.
3. Distinguish content exclusion, code referencing, and duplication detection by whether the stem is about input or output, and about similarity or exactness.
4. Pick the right Copilot surface/mode (inline, Chat, Edit mode, Agent mode, cloud agent, CLI) for a described task.
5. Identify high-quality prompts by their constraint density (audience, format, schema, version pinning, length caps).
6. Recognize governance boundaries Copilot cannot cross.
7. Pace a 25-question mock without skimming.

---

## Part 1 — Timed Mock Strategy (read this before you start)

### Pacing

- Real GH-300: ~60 questions in ~110 minutes ≈ **1 min 50 s per question**.
- This mock: **25 questions**. Target **20–25 minutes** if you use full deliberation. That is ~55 s/question.
- Your recent runs finished in 3m 41s and 4m 28s at 100%. That is _fine_ — speed is not the enemy. **Skimming is.** Your own logged insight: accuracy is highest when you read the stem AND all options fully.
- **Do not race your own previous times.** The stopwatch is not the score.

### The read protocol (non-negotiable)

For every question:

1. Read the stem **twice**. Underline mentally: _is this input or output? individual or org? similar or exact? small or multi-step?_
2. Read **all** options before selecting anything. Even when option A looks obviously right.
3. Check for **multi-select markers**: "_(Choose all that apply.)_", "Choose two". If present, count how many you selected.
4. Check for **negative phrasing**: "which is **not**", "should **not** be delegated", "which is **overkill**". These flip the answer.
5. Select. Move on.

### Flagging

- If you are genuinely torn between two options, pick the one that matches the **stem's strongest keyword**, note the question number, and move on.
- On the real exam, use the review flag. Do **not** camp on a question — a 4-minute stall costs you two easy questions at the end.

### No second-guessing without a concrete reason

- Change an answer **only** if you can name the specific fact you misread ("I missed that it said _exact_ match", "I missed the _(Choose all that apply)_ marker").
- "It just feels wrong now" is not a reason. Statistically, unreasoned changes cost you points.

### Fatigue management

- Mini-reset at question 13: breathe, sit up, re-focus. Mid-mock drift is where the Day 14 (81%) and Day 17 (86%) runs went wrong — both were logged as "distracted".
- Do the mock when you are alert, not at the tail end of a long workday.

---

## Part 2 — Domain 1: Responsible AI (15–20%)

### The six principles — one-line discriminators

| Principle                | Trigger keywords in the stem                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **Fairness**             | bias, discrimination, equitable outcomes, **unbiased/representative training data**, demographic parity                  |
| **Reliability & Safety** | robustness, unsafe/offensive/harmful output, testing, validation, secure-coding review, guardrails, predictable behavior |
| **Privacy & Security**   | consent, confidentiality, PII, data minimization, encryption, least privilege, "not used to train"                       |
| **Inclusiveness**        | **accessibility**, ARIA, assistive tech, languages, cultures, abilities, localization                                    |
| **Transparency**         | explainability, disclosure, "users know AI was involved", documenting how the system decides                             |
| **Accountability**       | human ownership, sign-off, escalation, incident reporting, auditable record, "who is responsible"                        |

### THE #1 REPEAT TRAP — Fairness vs Transparency

Missed on **q009 and q019 across three separate sessions**. Force-correct it:

> **"Prevent discrimination" / "unbiased" / "representative and diverse training data" = FAIRNESS.**
> Transparency is about **explaining and disclosing**, never about removing bias.

If a stem mentions bias or representative data and Transparency is an option, Transparency is the **distractor**. Reject it consciously.

### Multi-principle combination questions

Some stems bundle several policies and ask which **combination** is reflected. Decompose clause by clause:

- "must pass **secure-coding review and validation tests** before merge" → **Reliability & Safety**
- "must fix **accessibility** issues in generated UI code" → **Inclusiveness**
- "and **document that they have done so**" → **Accountability**

Anything with "only" in a combination question (e.g. "Fairness only", "Transparency only") is almost always wrong when the stem describes multiple distinct policies.

### Safety filters vs public-code filters

- **Content safety filters** block harmful categories: hate/discriminatory speech, sexually explicit content. They do **not** catch logical errors, bad style, or opinions.
- **Public-code filtering / code referencing** governs similarity to public code and licensing — a completely separate mechanism.

---

## Part 3 — Domain 2: Copilot Features, Plans & Agents (25–30%)

This is the largest domain and **16 of today's 25 questions** sit here.

### 3.1 The plan catalog

| Plan                   | Scope        | Key identity                                                                                                                                                                                           |
| ---------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Copilot Free**       | Individual   | No-cost, **limited** completions/chat, usage caps, **no org governance**. Includes CLI and **IDE agent mode** — but **not the cloud agent**.                                                           |
| **Copilot Pro**        | Individual   | Paid, unlimited completions, model selection, **cloud agent**. **Free for verified students, teachers, and popular OSS maintainers.**                                                                  |
| **Copilot Pro+**       | Individual   | Pro + premium models + higher credit allowance                                                                                                                                                         |
| **Copilot Business**   | Organization | **The org governance starter pack**: seat/license management, policy controls, usage reporting, **audit logs**, **content exclusion**, public-code filtering policy                                    |
| **Copilot Enterprise** | GHEC org     | Everything in Business **plus** GHEC-scoped advanced compliance/identity, **GitHub.com repository-aware Chat**, enterprise integrations, enterprise proxy/network routing, enterprise-wide enforcement |

> Note: GitHub's live catalog has since added **Copilot Student** and **Copilot Max** tiers. The GH-300 bank still uses the classic framing — for exam purposes, **verified student/teacher/OSS maintainer → Copilot Pro at no cost**.

### 3.2 THE DIRECTIONAL TIER RULE (repeat trap — both directions)

You have missed this trap in **both directions**: picking Enterprise when Business was right (q160, q165, q169), and picking Business when Enterprise was right (q053, q050).

**Pick Business when the stem says:**

- organization admins manage **licenses/seats**
- org **policy controls** for how suggestions are generated
- **usage reporting** / usage metrics for the org
- **audit logs** (Business HAS audit logs — this is the classic over-attribution to Enterprise)
- **content exclusion**, including **repository-level** exclusions
- "no enterprise integrations needed"
- the base org plan is **GitHub Team**

**Pick Enterprise when the stem says:**

- **GitHub.com repository-aware Chat** (chat that reads repo files/docs on the website) — the single cleanest Enterprise signal
- **GHEC** + advanced compliance / identity / SSO usage
- **enterprise proxy / network routing / allowlisting** for secure environments
- **enterprise-wide** enforcement across multiple orgs
- **enterprise integrations**

**Neutral facts that trip people:**

- **SSO is a GitHub Enterprise Cloud org capability**, not a Copilot plan feature. Copilot Enterprise _relies on_ your org's SSO.
- **GitHub Premium Support with SLAs is a separate paid purchase.** Never bundled with any Copilot plan.
- **GHEC does not bundle Copilot by default.** A GHEC **30-day trial includes Copilot Business** for evaluation.
- Purchasing/seat assignment: **Business → org owners; Enterprise → enterprise owners** (never repo admins, never "any member").
- **Business + Enterprise** both have: usage reporting, audit logs, seat management, content exclusion, org policy controls. Multi-select questions about these are almost always **B and C**.

### 3.3 Copilot Chat surfaces

Chat runs on: **GitHub.com**, **VS Code**, **Visual Studio**, **JetBrains IDEs**, **Eclipse**, **Xcode**, **GitHub Mobile**, **Windows Terminal / CLI**, and the standalone **GitHub Copilot desktop app**.

- **GitHub Desktop is the classic distractor.** It has some Copilot _features_ (commit-message generation, conflict help) but is not a full Chat surface.
- Careful: this bank has **two different surface questions** with different option sets. Answer from **the options actually printed**, not from memory of the other question. Select every listed surface that is genuinely supported.
- **Copilot is NOT supported on GHES / on-prem / air-gapped.** It is a cloud service requiring GitHub.com or GHEC sign-in. Any "self-hosted Copilot", "GHES-only Chat", or "runs entirely on-premises" option is wrong.

### 3.4 Copilot in the CLI

- Can **draft and explain** shell and Git commands and their flags.
- Does **not** auto-execute commands, does not replace man pages, does not provision cloud infra.
- Note: **CLI and Agent mode do not support content exclusion** (a real documented gap).

### 3.5 Modes — pick by scope

| Mode                          | Use when                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| **Inline completions**        | Small local completions at the cursor                                                            |
| **Chat**                      | Ask/explain/draft; exploring unfamiliar APIs; generating a first draft of tests                  |
| **Edit mode (Copilot Edits)** | **Targeted, reviewable diffs on a small, well-scoped change** in files _you_ name                |
| **Agent mode**                | Multi-file, multi-step, runs commands, iterates on failures, opens a PR                          |
| **Cloud / coding agent**      | Async task delegated from GitHub.com or an issue; works in a GitHub-hosted env, opens a draft PR |

**Repeat trap (q235):** when asked _when to choose Edit mode instead of Agent mode_, the correct answer describes **targeted, reviewable diffs on a small well-scoped change**. The options describing autonomous multi-file work with commands and PRs are **Agent-mode descriptions planted as distractors**. Also reject any option claiming Copilot can bypass branch protections.

**Inverse trap:** when asked when Agent mode is **overkill**, the answer is the tiny single-file change (rename a parameter, update one docstring).

**Chat vs Agent split:** Chat drafts tests/config; Agent runs the commands, iterates on failures, and opens the PR.

### 3.6 Cloud / coding agent — architecture and limits

- Runs in an **ephemeral development environment powered by GitHub Actions** — _not_ your IDE, _not_ a manually provisioned VM, _not_ GHES.
- Can clone the repo, explore, edit, **build, run tests and linters**, then push to a **branch** and open/update a **draft PR**.
- **Never auto-merges.** Branch protections, required reviews, and status checks all still apply.
- **Availability: Pro, Pro+, Business, Enterprise — all paid plans. NOT Copilot Free.**
  - Repeat trap (q196/q206): an option saying "available on all Copilot plans, **including Copilot Free**" is **too broad → wrong**. Options saying "Enterprise only" or "Business and Enterprise only" are **too narrow → wrong**.
  - Copilot Free's **IDE agent mode** is a different thing and is not evidence that Free has the cloud agent.
- **Customize the environment** with `.github/workflows/copilot-setup-steps.yml` — a workflow that pre-installs runtimes, tools, and dependencies. Local dev containers, dotfiles, and personal shell scripts are **not** picked up.

### 3.7 What to delegate to the agent — and what NOT to

**Good candidates** (well-scoped, testable, PR-driven):

- bug fixes, incremental features from a well-defined issue with acceptance criteria
- improving test coverage, updating docs, technical-debt cleanup
- accessibility improvements (ARIA) with snapshot updates
- deduplicating helper functions where test coverage exists

**Do NOT delegate** (GitHub explicitly calls these out):

- **live production incidents** / incident response
- anything involving **leaked tokens, PII, authentication failures, security trade-offs**
- rotating production credentials, live schema changes, ad-hoc prod shell access
- configuring enterprise SSO / audit logging / security-admin settings without oversight
- multi-month cross-org architecture strategy; training/teaching humans

> Keyword detector: "**production incident**", "**leaked tokens**", "**auth failures**", "**PII**" → _don't delegate_.

### 3.8 Safe operating pattern for agent-run commands

The safe answer always contains the same four ingredients:

1. Work on a **feature branch** (never the default branch)
2. Keep changes **small and reviewable**, commit in small steps
3. **Run tests / keep required status checks**
4. Have a **rollback / revert plan**

Any option proposing force-push to main, disabling protections, disabling required checks, or skipping tests "to save time" is wrong by construction.

**Monorepo variant:** scope the task to explicit **paths/packages** and request **per-package reviewable diffs**. Task scoping is a safety control.

### 3.9 Governance boundaries Copilot cannot cross

- Copilot **PR summaries and review suggestions are advisory input**. They do not count as approving reviews, do not satisfy required reviewers, do not auto-pass status checks.
- **Branch protections always apply.** Copilot cannot dismiss CODEOWNERS or required reviewers.
- After applying a Copilot review suggestion: apply it **on the PR branch**, **re-run checks**, **request re-review**.
- **CODEOWNERS** is the mechanism for path-based mandatory expert review (pair with branch protection to make it required). Not repository secrets, not PR summaries, not agent inference.

### 3.10 Troubleshooting & telemetry

- VS Code Command Palette: **"GitHub Copilot: Collect Diagnostics"** gathers environment details and extension logs. That is the standard first step.
  - Distractors: "Export Telemetry", "Reset Extension Cache", "Developer: Open Runtime Console" — none of these are the Copilot diagnostics action.
  - Then check sign-in, **proxy/firewall/allowlisting**, and Output → GitHub Copilot. Most enterprise connection failures are network egress policy.
- **Telemetry / usage metrics** = activity and feature usage (completions, chat, agents) for **reporting**. It does **not** include your source code contents, and it is not "Enterprise only".
- **Multiple models** are supported with different capability/latency/cost trade-offs. Governance controls (public-code filtering, content exclusion, code referencing) apply **regardless of model choice**.

---

## Part 4 — Domain 3: Data & Architecture (10–15%)

- Copilot is a **cloud service**. Prompts + context are relayed by the **Copilot cloud service** to the model. Not processed locally, not on GHES, not on CI runners.
- **Private code, prompts, and completions are not used to train the base models** for Business/Enterprise (and by default generally).
- Copilot **does not execute your code** and **does not perform web search** at inference. It infers from **prompts + file contents + surrounding code context** (plus repo index where available).
- Because context quality drives output quality: open the relevant files, use selections, and include type/interface information.

---

## Part 5 — Domain 4: Prompt Engineering (10–15%)

### The universal rule

**The best prompt is the one with the most constraints that are still relevant.** When comparing prompt options, count the constraints. Highest signal density wins.

Constraint checklist: **Language + Action + Object + Technique + Format + Length + Audience + Edge cases + Compatibility guarantees.**

### Pattern library

| Task                    | What the winning prompt contains                                                                                                                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Basic generation        | **language + task + method** ("Python function to reverse a string **using slicing**") — beats "write a function"                                                                                                                      |
| Fixing bad output       | **refine/rephrase with more context and clearer intent**. Not "use shorter prompts", not "stop using Copilot", not "retry unchanged"                                                                                                   |
| Explaining a file       | **audience + explicit sections + hard length cap** ("for a new backend hire: purpose, key data flows, external dependencies, risks; **5 bullets max**"). An option missing the length cap or the audience is the near-miss distractor. |
| Summarizing a function  | audience + format (3 bullets) + must-include fields (inputs, outputs, one caveat)                                                                                                                                                      |
| Refactoring             | what **may change** (structure/style) + what **must not change** (public API, behavior, tests still pass)                                                                                                                              |
| Tests                   | language + **test style** (table-driven) + target function + **edge cases** + field names (`name`, `wantErr`)                                                                                                                          |
| Avoiding hallucinations | **pin the API version** + **allowlist specific endpoints** + language/tooling + **"no undocumented fields"** + error handling for 4xx/5xx                                                                                              |
| **CI-ready output**     | **machine-readable format + exact schema/fields + "no prose"** — see repeat trap below                                                                                                                                                 |
| Performance work        | explicit complexity/space bounds, input size, backpressure, benchmark stub                                                                                                                                                             |
| Security                | state security constraints explicitly: **input validation**, no hardcoded secrets (env vars / secret manager), fail fast, **redacted logging** (no tokens/PII in logs)                                                                 |
| Style matching          | paste a **short real snippet** from your codebase and say "match this style" — code teaches style better than prose                                                                                                                    |
| Multi-step              | ask for **"plan → code"**                                                                                                                                                                                                              |

### REPEAT TRAP — CI-ready output (q124, missed ~4 times)

> If a prompt's output is going to be **consumed by CI/automation**, the correct prompt specifies a **machine-readable format (JSON/array), the exact field schema, and explicitly says "no prose."**

The seductive wrong answer is the well-organized **human-readable report**. Human-readable ≠ CI-ready. Machines need a parseable contract.

### Copilot and secure coding

- Copilot **can** be prompted to produce input validation, allowlists, safe secret handling, and clear failure behavior.
- Security posture is **promptable but not automatic** — you must state the requirements and verify in review/testing.
- Any option describing hardcoded secrets, bypassing security libraries, or vague unvalidated code is wrong.

---

## Part 6 — Domain 5: Developer Productivity (10–15%)

- Copilot's value: **automating repetitive coding tasks, generating boilerplate, scaffolding tests, accelerating prototyping**, and freeing time for design/architecture.
- **Exploring unfamiliar APIs and libraries** is a flagship advanced use case — **Copilot Chat** with natural-language questions. (Distractors in these items are always non-coding domains: payroll/HR, legal, business plans, or unrelated infrastructure like CI/CD pipelines and proxy configuration.)
- Copilot **drafts and refines tests**; **executing** tests in CI belongs to your automation pipeline (GitHub Actions), not Copilot.
- Copilot does **not** replace IDEs, tooling, tests, reviews, or governance. Productivity comes from **reducing routine work**, not from skipping quality gates.
- Treat all suggestions as **drafts** to review, refactor, and test.

---

## Part 7 — Domain 6: Privacy & Configuration (10–15%) — weakest domain, 87.3%

### THE THREE-CONTROL SPLIT (drill this — it was a repeat miss on q140/q145/q150)

| Control                   | Governs    | Trigger in stem                                                                 | Behavior                                                                                                                                                                   |
| ------------------------- | ---------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Content exclusion**     | **INPUT**  | "prevent files/repos from being **used as context**", secrets, proprietary code | Copilot cannot see it. No inline suggestions in those files; content doesn't inform suggestions elsewhere or Chat responses; excluded files skipped in Copilot code review |
| **Code referencing**      | **OUTPUT** | suggestion is **similar / near-matching** public code                           | **Shown** with references: source URLs + license info (when "Allow" is configured or the surface lacks Block mode)                                                         |
| **Duplication detection** | **OUTPUT** | **exact/near-exact** match, **~150+ characters**                                | **BLOCKED.** Length-and-similarity based, **license-blind** — no license analysis at all                                                                                   |

**Decision flow:**

```
Is the stem about what Copilot can SEE?           → Content exclusion
Is it about what Copilot OUTPUTS?
   ├─ exact long match (~150+ chars) → BLOCKED    → Duplication detection
   └─ similar / near-matching, shown with links   → Code referencing
```

**Killer distractors:** "depends on the repository's license file" (the filter does no license analysis) and "always shows with links, never blocks" (that describes code referencing, not duplication detection).

Extra verified facts:

- The filter compares the suggestion **plus ~150 characters of surrounding context** against an index of **public** code on GitHub.com. **Private repos and non-GitHub code are not in that index.**
- Matches to public code occur in **less than ~1%** of suggestions.
- Code referencing only applies to **accepted, unaltered** Copilot suggestions — not code you wrote yourself.
- Configurable at **individual account level AND via org/enterprise policies**. Hierarchy: **Enterprise → Organization → User**; stricter enforcement at a higher scope wins and **cannot be loosened downward**.

### Content exclusion — permissions and mechanics

- **Who can configure**: **repository administrators, organization owners, and enterprise owners.**
- People with the **Maintain** role can **view but not edit** content exclusion settings.
- Outside collaborators and general contributors: **no rights.**
- **Plans**: **Copilot Business and Copilot Enterprise only.** Not Pro, not Free.
- **Targets**: repositories, directories/paths, **glob patterns**, file types. **Not branches.**
- **Scope of enforcement**: enforced in the **Copilot service**, so it applies across supported surfaces (IDEs, GitHub.com, Mobile) — it is a **global input fence**, not a per-IDE setting.
- **Documented gaps**: **GitHub Copilot CLI** and **Edit/Agent modes of Copilot Chat in VS Code and other editors** do **not** support content exclusion. Copilot may still infer semantic information about an excluded file from other sources.
- Repos inherit exclusions from the parent org/enterprise; inherited rules appear read-only at the repo level.

---

## Cross-Domain Quiz Question Refreshers

Today's set spans D1, D2, D4, D5, D6. Quick-fire refreshers for concepts outside the mock's "main" area:

| Concept                        | Key fact                                                                                                | Trap                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Multi-principle RAI stems      | Secure-coding tests → Reliability & Safety; accessibility → Inclusiveness; documenting → Accountability | "Fairness only" / "Transparency only" options in a multi-policy stem                 |
| Fairness vs Transparency       | bias / representative data = **Fairness**                                                               | Transparency planted as a plausible option                                           |
| Copilot Chat surfaces          | GitHub.com + VS Code + Visual Studio + JetBrains + Eclipse + Xcode + Mobile + Terminal + desktop app    | **GitHub Desktop** is not a Chat surface; answer from the printed options            |
| Copilot Free                   | free, limited completions, personal use, **no org governance**; has IDE agent mode + CLI                | Confusing it with the free-for-students/teachers/maintainers **Pro** benefit         |
| Copilot Business identity      | seats, policies, usage reporting, **audit logs**, **content exclusion**                                 | Over-attributing audit logs / exclusions to Enterprise-only                          |
| Content exclusion (feature ID) | The feature that stops secrets/proprietary code being **used as context**                               | Confusing with code referencing (output) or with a plan name                         |
| Content exclusion (plans)      | **Business + Enterprise** (multi-select B and C)                                                        | Including Pro or Free                                                                |
| Org-wide policy controls       | **Business + Enterprise** (multi-select B and C)                                                        | Picking only one when it says _choose all that apply_                                |
| Duplication detection          | **~150+ char exact match → blocked**, license-blind                                                     | "Based on the license" / "always shows references"                                   |
| Content exclusion roles        | repo admins + org owners + enterprise owners; **Maintain = view-only**                                  | "Any contributor", "Maintain role", "outside collaborators"                          |
| Cloud agent environment        | **Ephemeral GitHub Actions**-powered env; branch + draft PR                                             | "runs locally in your IDE", "fixed manual VM", "cannot run tests", GHES              |
| Cloud agent plans              | Pro, Pro+, Business, Enterprise — **all paid**                                                          | "including Copilot Free" (too broad); "Enterprise only" (too narrow)                 |
| Agent don't-delegate list      | prod incidents, leaked tokens, auth failures, PII, credential rotation                                  | Routine refactors/tests/a11y look "risky" but are fine                               |
| Safe agent command boundary    | feature branch + small commits + status checks/tests + rollback plan                                    | "disable protections to go faster", "run on default branch", "skip tests"            |
| Edit mode vs Agent mode        | Edit = **targeted reviewable diffs, small well-scoped change**                                          | Agent-mode descriptions listed as options for an Edit-mode question                  |
| CODEOWNERS                     | path-based mandatory expert review                                                                      | "repository secrets", "Copilot PR summaries route reviews", "agent infers reviewers" |
| VS Code diagnostics            | **"GitHub Copilot: Collect Diagnostics"**                                                               | "Export Telemetry", "Reset Extension Cache", "Runtime Console"                       |
| Best-crafted prompt            | language + task + **technique**                                                                         | Short vague prompts that "sound clean"                                               |
| Irrelevant suggestions         | **refine/rephrase with more context**                                                                   | "use shorter prompts", "disable duplication detection", "stop using Copilot"         |
| Explain-a-file prompt          | audience + sections + **hard length cap**                                                               | The near-identical option missing the cap or the audience                            |
| Anti-hallucination prompt      | pin version + allowlist endpoints + **no undocumented fields** + 4xx/5xx handling                       | "Use the Foo API" / "guess the latest endpoints"                                     |
| Secure coding support          | Copilot generating **input validation** and safe patterns when prompted                                 | Hardcoded secrets, bypassing security libraries                                      |
| Unfamiliar APIs                | **Copilot Chat**, natural-language questions                                                            | Payroll automation, GitHub Actions CI/CD, enterprise proxy config                    |

---

## Common Traps & Misconceptions — the full exam-day list

1. **Fairness ↔ Transparency.** Bias/representative data = Fairness.
2. **Tier rule is directional.** Business for org admin controls/audit logs/exclusions; Enterprise for GHEC compliance + GitHub.com repo-aware Chat + enterprise proxy + enterprise-wide enforcement.
3. **Audit logs exist in Business.** Do not treat them as an Enterprise-only differentiator.
4. **CI-ready = machine-readable format + exact schema + "no prose."** Not a nice human report.
5. **Three-control split.** Input → exclusion. Similar output → code referencing (shown). Exact ~150+ char output → duplication detection (blocked, license-blind).
6. **GHES / on-prem / air-gapped → Copilot NOT supported.**
7. **Verified students / teachers / OSS maintainers → Copilot Pro free** (not Copilot Free).
8. **Copilot Free has IDE agent mode but no cloud/coding agent.**
9. **Edit mode = small reviewable diffs; Agent mode = multi-step autonomous.**
10. **GHEC does not bundle Copilot;** the 30-day GHEC trial includes **Copilot Business**.
11. **SSO and Premium Support/SLAs are not Copilot plan features.**
12. **Copilot never bypasses branch protections, required reviews, CODEOWNERS, or status checks.**
13. **The cloud agent runs on GitHub Actions**, never in your IDE, never on GHES, never auto-merging.
14. **`copilot-setup-steps.yml`** is the only supported way to prep the agent's environment.
15. **Maintain role = view-only** for content exclusion.
16. **Multi-select markers.** "_(Choose all that apply.)_" and "Choose two" — count your selections before moving on.
17. **Negative stems.** "not", "should not", "overkill", "least appropriate" — reread before answering.
18. **Any option that says "disable tests", "disable protections", "force-push", "bypass review" is wrong.** Every single time.

---

## Quick Reference Card (last-glance before the mock)

**Plan grid**

| Capability                     |     Free     | Pro | Business | Enterprise |
| ------------------------------ | :----------: | :-: | :------: | :--------: |
| Inline completions             | ✅ (limited) | ✅  |    ✅    |     ✅     |
| Chat                           | ✅ (limited) | ✅  |    ✅    |     ✅     |
| IDE agent mode                 |      ✅      | ✅  |    ✅    |     ✅     |
| **Cloud / coding agent**       |      ❌      | ✅  |    ✅    |     ✅     |
| Seat/license management        |      ❌      | ❌  |    ✅    |     ✅     |
| Org policy controls            |      ❌      | ❌  |    ✅    |     ✅     |
| Usage reporting                |      ❌      | ❌  |    ✅    |     ✅     |
| Audit logs                     |      ❌      | ❌  |    ✅    |     ✅     |
| Content exclusion              |      ❌      | ❌  |    ✅    |     ✅     |
| **GitHub.com repo-aware Chat** |      ❌      | ❌  |    ❌    |     ✅     |
| Enterprise proxy / network     |      ❌      | ❌  |    ❌    |     ✅     |

**Mode selector**

```
Small local completion ................ inline
Ask / explain / draft / explore API ... Chat
Small well-scoped diff, files I name .. Edit mode
Multi-file + run commands + PR ........ Agent mode
Delegate async from GitHub/issue ...... Cloud agent (Actions env → branch → draft PR)
```

**Three controls**

```
INPUT context fence ............ Content exclusion   (Business/Enterprise; admins/owners)
SIMILAR output, shown w/ links .. Code referencing    (user + org/enterprise scopes)
EXACT ~150+ chars, BLOCKED ...... Duplication detection (license-blind)
```

**Governance constants**

```
Branch protections   → always apply
Required reviews     → Copilot cannot satisfy or dismiss
CODEOWNERS           → path-based mandatory expert review
Status checks        → Copilot summaries never auto-pass them
Safe agent pattern   → feature branch + small commits + tests/checks + rollback plan
```

---

## Mock Run — Instructions

Run from the `GH-300 Prep` directory:

```powershell
python quiz_runner.py --day-lock 27
```

Browser UI variant (better for long option lists):

```powershell
python quiz_runner.py --day-lock 27 --web --port 8765
```

**Before you start:**

- Close Slack/Teams. Full screen. No second monitor distractions.
- Start a timer but **do not look at it** until you finish.
- Target: 25/25. Realistic target: 24/25.
- Read the stem twice. Read all options. Check for multi-select markers. Then answer.

**After you finish:** ping me and I will read `session-results.json`, analyze weak areas, and update `progress.md` and `plan.md`.

---

## Related Questions in questions.json

25 questions assigned to Day 27 (no answers listed — no-spoiler policy):

| ID   | Domain | Topic area                                                        |
| ---- | ------ | ----------------------------------------------------------------- |
| q025 | D1     | Multi-principle responsible AI combination                        |
| q035 | D2     | Feature that blocks sensitive data from being context             |
| q047 | D2     | Which plans provide content/context exclusion (multi)             |
| q055 | D2     | Plan for org admins to enforce suggestion policy                  |
| q059 | D2     | Copilot Chat environments (multi)                                 |
| q062 | D2     | Org-wide policy controls: exclusions + public-code filter (multi) |
| q071 | D2     | Who benefits most from Copilot Free                               |
| q075 | D2     | VS Code action for Copilot logs/diagnostics                       |
| q106 | D4     | Best-crafted prompt                                               |
| q111 | D4     | Fixing irrelevant suggestions                                     |
| q118 | D4     | Prompt that reduces API hallucinations                            |
| q122 | D4     | Best prompt to explain a complex file to a new teammate           |
| q139 | D2     | Plan with license management + content exclusion                  |
| q144 | D6     | Roles that can manage content exclusion                           |
| q158 | D2     | Free plan with limited features                                   |
| q163 | D5     | Feature useful for exploring unfamiliar APIs                      |
| q187 | D4     | Copilot supporting secure coding practices                        |
| q195 | D2     | Where/how the coding agent runs your code changes                 |
| q206 | D2     | Who can use the coding agent (plan availability)                  |
| q208 | D2     | Task that should NOT be delegated to the coding agent             |
| q217 | D6     | Handling exact matches to long segments of public code            |
| q235 | D2     | When to choose Edit mode instead of Agent mode                    |
| q238 | D2     | Safest workflow for agent-run terminal steps                      |
| q241 | D2     | Safe boundary pattern for agent commands                          |
| q244 | D2     | Ensuring SMEs always review changes in specific paths             |

Domain spread: **D1 ×1, D2 ×16, D4 ×5, D5 ×1, D6 ×2**.

---

## Sources (verified during this session, 2026-08-03)

- [About GitHub Copilot cloud agent — GitHub Docs](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent)
- [Plans for GitHub Copilot — GitHub Docs](https://docs.github.com/copilot/about-github-copilot/subscription-plans-for-github-copilot)
- [GitHub Copilot Plans & pricing](https://github.com/features/copilot/plans)
- [Content exclusion for GitHub Copilot — GitHub Docs](https://docs.github.com/en/copilot/concepts/context/content-exclusion)
- [Excluding content from GitHub Copilot — GitHub Docs](https://docs.github.com/copilot/managing-copilot/managing-github-copilot-in-your-organization/managing-github-copilot-features-in-your-organization/configuring-content-exclusions-for-github-copilot)
- [GitHub Copilot code referencing — GitHub Docs](https://docs.github.com/copilot/concepts/completions/code-referencing)
- [Finding public code that matches GitHub Copilot suggestions — GitHub Docs](https://docs.github.com/copilot/using-github-copilot/finding-public-code-that-matches-github-copilot-suggestions)
- [Introducing code referencing for GitHub Copilot — GitHub Blog (≈150-character context window)](https://github.blog/news-insights/product-news/introducing-code-referencing-for-github-copilot/)

---

## Notes (your own words — fill this in after the mock)

_(Write down every question you hesitated on, even the ones you got right. Those are your Day 28 targets.)_
