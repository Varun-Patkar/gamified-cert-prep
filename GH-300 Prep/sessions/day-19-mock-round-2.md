# Day 19: Mock Round 2 + Review — All Domains

**Date**: 2026-07-27
**Phase**: 3 — Mock Exam Rounds
**Target Exam Date**: 2026-08-08 (12 days out)
**Scope**: Full-domain mock (D1 Responsible AI, D2 Features, D3 Data/Architecture, D4 Prompt Engineering, D6 Privacy/Config)
**Assigned questions**: 25 — D1 ×4, D2 ×14, D3 ×1, D4 ×3, D6 ×1
**Estimated study time**: ~1 hr (read file → take quiz → review)

---

## 🚨🚨 #1 PRIORITY — FAIRNESS vs TRANSPARENCY DRILL (q009 is a 4th-time REPEAT MISS) 🚨🚨

> **STOP. Read this three times before the quiz.**
>
> You have now picked **Transparency** when the answer was **Fairness** on **FOUR** separate occasions (q009 Day 17, q019 Day 17 + Day 18, and this repeat). This is your single biggest exam risk. Burn this pattern in:

| If the question mentions…                                                                                                                                            | The answer is…                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **bias**, **unrepresentative / representative training data**, **prevent discrimination**, **equitable outcomes**, parity across groups, "treats all users the same" | ✅ **FAIRNESS** — _never_ Transparency |
| explainability, "how did it reach this answer", disclosure that AI was used, documentation of behavior, understandability                                            | Transparency                           |
| serves people of different **cultures / abilities / languages**, accessibility, localization                                                                         | Inclusiveness                          |
| harmful / offensive / insecure / unsafe output, guardrails, reliability under stress                                                                                 | Reliability & Safety                   |

**Memory hook:** _"Bad DATA → unFAIR."_ Data quality/representativeness bugs are always **Fairness**. Transparency is about **explaining**, not about **data balance**.

- **q009**: "Which principle addresses biased or unrepresentative training data?" → **FAIRNESS**. (If you even _think_ Transparency, force-correct to Fairness.)
- **q019** (seen before, same trap): "prevent discrimination / unbiased & representative data" → **FAIRNESS**.

---

## TL;DR (60-second skim)

- **Fairness** = bias / representative data / no discrimination. **Never** Transparency. (See warning box — this is your #1 miss.)
- **q021** = Fairness **+** Inclusiveness (language parity + rebalancing uneven auto-assignment). Documentation-only = Transparency = wrong.
- **Premium Support with SLAs is a separate PAID add-on** for Enterprise — _not bundled_ in any Copilot plan (q048).
- **Coding agent** = autonomous, multi-step, opens a PR (q085, q245, q248). **Edit mode** = targeted reviewable diffs. **Chat** = explain/ask.
- **Seat assignment**: Business = **org owners**; Enterprise = **enterprise owners** (q147). Not repo admins.
- **Customize coding agent env** = `.github/workflows/copilot-setup-steps.yml`; secrets go in **Actions secrets**; local dev containers/dotfiles are NOT auto-reused (q202).
- **Content exclusion** limits what Copilot uses as **INPUT context**; **.gitignore** controls what **Git tracks**; **code referencing** governs output similarity to public code (q082).
- Copilot does **NOT** train on your private code/prompts/completions (q065) — true for Individual/Business/Enterprise.
- Enterprise policy is **enforced** top-down: Enterprise → Org (within bounds) → Repo. No override where enforced (q084).

---

## Learning Objectives

After this session you can, across all six domains: map any responsible-AI scenario to the correct principle (especially Fairness vs Transparency); pick the right plan tier and know who owns purchasing/seats and what is _not_ bundled; distinguish coding agent vs edit mode vs chat; configure the coding-agent environment correctly; and separate content exclusion, code referencing, and .gitignore.

---

## Cross-Domain Quiz Question Refreshers

### Domain 1 — Responsible AI (q009, q021, q028, q029)

| Q    | Scenario                                                                      | Answer                                      | Trap                                                                               |
| ---- | ----------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| q009 | Principle for biased / unrepresentative training data                         | **Fairness**                                | ⚠️ 4th repeat: NOT Transparency. Bad data = unfair.                                |
| q021 | Copilot better in English than other langs + AI auto-assigns reviews unevenly | **Fairness + Inclusiveness**                | Documentation alone = Transparency = wrong. Need parity testing + rebalance logic. |
| q028 | Why Inclusiveness matters for global teams                                    | Serves diverse cultures/abilities/languages | Don't confuse with Fairness (bias) — this is accessibility/localization.           |
| q029 | Copilot generates outdated / insecure code patterns                           | **Reliability and Safety**                  | Not Privacy, not Transparency — it's about safe, dependable output + guardrails.   |

**Prose:** Fairness = _equitable outcomes across groups; no bias from data_. Inclusiveness = _usable by people of all abilities, languages, cultures_. Reliability & Safety = _consistent, secure, safe behavior even in edge cases_. Transparency = _users understand and can explain what the AI did_. q021 is the classic "two-principle" question: the **language gap** triggers **Inclusiveness/Fairness** and the **uneven auto-assignment** triggers **Fairness** — writing a doc about it (Transparency) does not _fix_ the imbalance.

### Domain 2 — Features / Plans / Agent / Chat / Review (14 questions)

| Q    | Concept                                                          | Key fact / answer                                                                                                                                                           |
| ---- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| q048 | Support SLAs                                                     | **GitHub Premium Support w/ SLAs = separate PAID add-on** (Enterprise). NOT bundled with any Copilot plan.                                                                  |
| q084 | Enterprise policy restricts allowed models/surfaces              | Orgs configure only **within** the enterprise-allowed set. Enterprise (enforced) → Org → Repo. Enforced = no override.                                                      |
| q085 | Autonomous multi-step changes + opens a PR                       | **Copilot coding agent**.                                                                                                                                                   |
| q091 | Run "GitHub Copilot: Collect Diagnostics"                        | **Ctrl/Cmd+Shift+P → Command Palette → type "Collect Diagnostics"** (connectivity/reachability troubleshooting).                                                            |
| q092 | Copilot Chat surfaces                                            | GitHub.com, VS Code, Visual Studio, JetBrains, Eclipse, Xcode, GitHub Mobile, Windows Terminal. Repo-aware chat on GitHub.com = Enterprise.                                 |
| q105 | Understand an unfamiliar file                                    | Use **selection/file prompts in Chat** to summarize purpose, dependencies, risks.                                                                                           |
| q147 | Purchasing / seat assignment                                     | **Business = org owners; Enterprise = enterprise owners.** Not repo admins, not any member.                                                                                 |
| q152 | Enterprise proxy support for secure environments                 | **Copilot Enterprise** (proxy/allowlisting + compliance).                                                                                                                   |
| q167 | Usage reporting/mgmt but NOT enterprise integrations             | **Copilot Business** (Enterprise overshoots with identity/compliance).                                                                                                      |
| q188 | Productivity in large projects                                   | Suggestions across multiple files using **workspace context** (scoped + test-backed).                                                                                       |
| q202 | Customize coding agent's environment                             | Add **`.github/workflows/copilot-setup-steps.yml`**; job must be named `copilot-setup-steps`; secrets → **Actions secrets**. Local dev containers/dotfiles NOT auto-reused. |
| q228 | Copilot in PR reviews on GitHub.com                              | Generates NL **PR summaries + review suggestions**. Does NOT auto-merge/approve/bypass protections.                                                                         |
| q229 | Best quality gates for Copilot changes                           | Accept → run tests/coverage in CI → code review w/ PR summaries → (optional) code scanning → merge.                                                                         |
| q245 | Run tests, update snapshots, edit 4 files, refresh docs, open PR | **Copilot coding agent (Agent mode)** — orchestrates edits + commands + PR.                                                                                                 |
| q248 | Task best leveraging coding agent vs Chat                        | Multi-step end-to-end: run tests, fix lint across modules, update config, push branch w/ draft PR.                                                                          |
| q251 | Primary value of PR summaries                                    | Help reviewers grasp intent, risky areas, scope quickly — **acceleration, not substitution**.                                                                               |

### Domain 3 — Data & Architecture (q065)

| Q    | Concept                          | Key fact                                                                                                                                                |
| ---- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| q065 | Does Copilot train on your code? | **No.** Private code, prompts, and completions are **not used to train** Copilot models. True for Individual/Business/Enterprise. Telemetry ≠ training. |

### Domain 4 — Prompt Engineering (q123, q126, q127)

| Q    | Goal                                      | Winning prompt characteristics                                                                                                                                            |
| ---- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| q123 | Performance-aware prompt                  | Specifies **runtime + complexity target (e.g., O(1) space) + workload size (10MB+) + mechanism (streaming/backpressure) + benchmark stub**. Vague "fast/efficient" loses. |
| q126 | Reduce overbroad refactors in large files | **"Modify ONLY function X; keep public behavior; add bounds checks; return detailed errors."** Tight scope + behavior invariants.                                         |
| q127 | Secure HTTP handling prompt               | **HTTPS + validate TLS certs + timeouts/retries + redact secrets in logs + handle 429/5xx with backoff.** Never skip cert validation; never log full bodies/secrets.      |

**Prompt scoring rule of thumb:** the _best_ prompt is the one that is **specific, constrained, and verifiable** — names the exact target, states invariants ("keep public behavior"), gives measurable criteria (complexity, size, format), and bakes in safety (TLS, redaction, backoff). Vague adjectives ("make it fast", "make it secure") always lose to concrete constraints.

### Domain 6 — Privacy & Config (q082)

| Q    | Concept                         | Mapping                                                                                                                                                                |
| ---- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| q082 | Content exclusion vs .gitignore | **Content exclusion → limits INPUT context Copilot uses.** **.gitignore → controls what Git TRACKS.** **Code referencing → governs output similarity to public code.** |

Three easy-to-confuse controls: **input** = Content exclusion; **output** = code referencing / duplication detection; **source control** = .gitignore. They are independent.

---

## Exam-Day Plan Boundary Cheat Sheet

| Capability                                     | Free         | Pro / Pro+ (Individual) | Business       | Enterprise                                    |
| ---------------------------------------------- | ------------ | ----------------------- | -------------- | --------------------------------------------- |
| Code completion + Chat (IDE)                   | Limited      | ✅                      | ✅             | ✅                                            |
| Agent mode in IDE                              | ✅ (limited) | ✅                      | ✅             | ✅                                            |
| **Coding agent (cloud, opens PRs)**            | ❌           | Pro/Pro+ ✅ (paid)      | ✅             | ✅                                            |
| Org-wide policy management / usage reporting   | ❌           | ❌                      | ✅             | ✅                                            |
| Content exclusion (repo/org)                   | ❌           | ❌                      | ✅             | ✅                                            |
| Enterprise proxy / allowlisting                | ❌           | ❌                      | ❌             | ✅ (q152)                                     |
| Repo-aware Chat on GitHub.com, knowledge bases | ❌           | ❌                      | ❌             | ✅                                            |
| **Who assigns seats**                          | —            | the user                | **Org owners** | **Enterprise owners** (q147)                  |
| **Premium Support w/ SLAs**                    | ❌           | ❌                      | ❌             | **Separate PAID add-on** (q048) — not bundled |

**Traps:**

- Support SLAs are an **add-on**, never a plan feature (q048).
- Business already provides org policy/reporting/content exclusion; **Enterprise "overshoots"** with identity, compliance, proxy, repo-aware chat. If a scenario says "NOT enterprise integrations" → **Business** (q167).
- Policy hierarchy is **enforced** top-down; where the enterprise enforces a setting, orgs/repos **cannot override** (q084).

---

## Coding Agent vs Edit Mode vs Chat — Decision Matrix

| Signal in the question                                                                                      | Pick                                             |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| "autonomously", "multi-step", "run tests + edit N files + open a PR", "draft PR", "push branch"             | **Coding agent (Agent mode)** — q085, q245, q248 |
| "targeted change", "small well-scoped edit", "reviewable diff" on a known spot                              | **Edit mode**                                    |
| "explain this file", "summarize purpose/dependencies/risks", "ask a question", "understand unfamiliar code" | **Chat** — q105                                  |
| "generate a PR summary / review suggestions on GitHub.com"                                                  | **Copilot code review** — q228, q251             |

**Environment for the cloud coding agent (q202):**

- File: `.github/workflows/copilot-setup-steps.yml`. The job **must** be named `copilot-setup-steps` or Copilot ignores it.
- Runs in an **ephemeral GitHub Actions environment** — pre-install tools/deps, choose larger/self-hosted runners, Windows instead of Ubuntu, enable Git LFS.
- **Secrets → GitHub Actions secrets** (not committed, not dotfiles). Local dev containers and personal dotfiles are **NOT** auto-reused.
- Same file also configures Copilot **code review** env by default (or use a dedicated `copilot-code-review.yml`).

---

## Prompt Engineering Constraint Checklist

When judging "which prompt is best," check for these — the more present, the stronger:

- **Scope**: names the exact function/file; "modify ONLY X"; "keep public behavior/signature." (q126)
- **Performance**: complexity target (O(1) space), workload size, mechanism (streaming/backpressure), benchmark. (q123)
- **Security**: HTTPS, validate TLS certs, timeouts/retries, backoff on 429/5xx, redact secrets in logs, never hardcode/leak. (q127)
- **Output format**: machine-readable + exact schema + "no prose" when CI-consumed. (recurring q124-style miss — remember it.)
- **Verifiability**: measurable acceptance criteria, tests, bounds checks, detailed errors.

Vague adjectives ("fast", "secure", "clean") are the wrong answer whenever a more specific option exists.

---

## Most-Likely-To-Miss (personal watchlist)

1. **q009 / Fairness** — 4th repeat. Bias/representative data = **Fairness**, never Transparency. (See top box.)
2. **q021** — two principles: **Fairness + Inclusiveness**; documentation ≠ fixing bias.
3. **q048** — Premium Support SLAs = paid **add-on**, not bundled.
4. **q167 vs q152** — "not enterprise integrations" = **Business**; "proxy/allowlisting" = **Enterprise**.
5. **q082** — input=content exclusion, output=code referencing, SCM=.gitignore.
6. **q202** — `copilot-setup-steps.yml`; secrets in Actions secrets; no dotfile reuse.
7. CI-ready output (q124-style) = **format + exact schema + "no prose."**

---

## Quiz Instructions (no spoilers — self-test)

Run from the `GH-300 Prep` directory:

```powershell
python quiz_runner.py --day-lock 19
```

Browser UI with inline images:

```powershell
python quiz_runner.py --day-lock 19 --web
```

Day-lock 19 serves the 25 assigned mock questions across D1/D2/D3/D4/D6. Results save to `session-results.json`. Ping me after you finish and I'll review misses (no answers before then).

---

## Sources (verified 2026-07-27)

- [Configure the development environment — GitHub Docs](https://docs.github.com/copilot/how-tos/agents/copilot-coding-agent/customizing-the-development-environment-for-copilot-coding-agent)
- [microsoft/vscode copilot-setup-steps.yml](https://github.com/microsoft/vscode/blob/main/.github/workflows/copilot-setup-steps.yml)
- [github/docs — customizing the development environment for Copilot coding agent](https://github.com/github/docs/blob/main/content/copilot/customizing-copilot/customizing-the-development-environment-for-copilot-coding-agent.md)
- GitHub Copilot plans (Free/Pro/Business/Enterprise), responsible AI principles, and content-exclusion/code-referencing docs on docs.github.com and learn.microsoft.com.

---

## Notes (your own words — fill in after studying)

_(Leave space here for post-study notes and any wrong-answer reflections.)_
