# Day 26: D6 Focus + Config Review (Privacy, Content Exclusion, Policy Precedence)

**Date**: 2026-08-03
**Domain**: D6 — Privacy Fundamentals & Context Exclusions (10–15%) + heavy D2 plan-tier carryover
**Subtopics**: Privacy settings matrix; content exclusion gotchas; code referencing vs duplication detection; policy inheritance & precedence; telemetry; coding-agent responsibilities
**Estimated study time**: 2 hrs
**Exam date**: 2026-08-08 (5 days out)

---

## TL;DR (60-second skim)

- **Three different controls, three different jobs.** Content exclusion = **INPUT** (what Copilot may read). Code referencing / "matching public code" = **OUTPUT, similar** (shows suggestion + public-code references). Duplication-detection filter = **OUTPUT, exact** (blocks long verbatim matches, ~150+ chars, length-based, license-blind).
- **Plan tiers are DIRECTIONAL, not "always Business."** Business = org admin controls, policies, audit logs, repo-level content exclusion. Enterprise = GHEC-scoped advanced compliance/identity + **repository-aware Chat on GitHub.com** + enterprise integrations.
- **Enterprise policy beats org policy. Always.** An org owner cannot loosen an enterprise-**enforced** setting. Orgs only choose when the enterprise says "Let organizations decide."
- **Content exclusion targets are path-based**: repositories, paths/directories, glob patterns, file types — configured at repo, org, and enterprise level. Not "branches."
- **Content exclusion does NOT cover everything**: Copilot CLI, Copilot cloud/coding agent, and Agent mode in IDE Chat do **not** support content exclusion.
- **Telemetry aggregates usage** (suggestions, chat, agent activity, acceptance) — it is **not** a dump of your source code, and it is not Enterprise-only.
- **Business/Enterprise: your prompts, suggestions, and private code are NOT used to train the base models.**
- **The human stays accountable.** For the coding agent: define scoped tasks, review/approve the PR, make tests + linters + security scans pass. Never auto-merge to production.

---

## Learning Objectives

After this session you should be able to:

1. Pick the correct control (exclusion vs referencing vs duplication detection) from a one-line scenario stem.
2. State exactly which plan supplies a given governance or context feature, in **both directions** (don't over-pick Business, don't over-pick Enterprise).
3. Explain enterprise → organization → repository policy inheritance and who wins.
4. Describe what Copilot telemetry does and does not contain.
5. Name the developer responsibilities that survive delegation to the coding agent.
6. Apply prompt-engineering and productivity principles (context, refactor prompts, TDD, testing limits) that appear as carryover today.

---

## Part 1 — The Privacy & Config Settings Matrix (D6 core)

### 1.1 The three controls — memorize this table verbatim

| Control                                            | Side       | Trigger                                          | Behavior                                                            | Configurable at                                     | Plans                |
| -------------------------------------------------- | ---------- | ------------------------------------------------ | ------------------------------------------------------------------- | --------------------------------------------------- | -------------------- |
| **Content exclusion**                              | **INPUT**  | Files/paths an admin marked off-limits           | Copilot **cannot see** those files as context; no inline suggestions in them | Repository, Organization, Enterprise                | Business, Enterprise |
| **Code referencing** ("suggestions matching public code") | **OUTPUT** | Suggestion **resembles** public code             | Suggestion may be **shown with references** (repo, license, link) OR blocked if policy is "Block" | User (individual), Organization, Enterprise         | All (policy at org/ent for Business/Ent) |
| **Duplication-detection filter**                   | **OUTPUT** | Suggestion is a **long exact match** (~150+ chars) to public code | Suggestion is **suppressed/blocked**                                | Same "matching public code" policy switch           | All                  |

**The one-line decoder that has cost you points twice:**

- Stem says _"which files/repos Copilot may read / access as context"_ → **Content exclusion**.
- Stem says _"similar to / resembles / near-match public code"_ → **Code referencing (matching public code)**.
- Stem says _"identical / verbatim / ~150–200 characters exactly matching public code"_ → **Duplication-detection filter → BLOCKED**.

**Two hard sub-facts you have missed before:**

- The duplication-detection filter is **length-based, not license-based**. It performs **no license analysis**. "It depends on the repo's LICENSE file" is always wrong.
- "Shows the suggestion with links and never blocks" describes **code referencing**, not duplication detection. Duplication detection **does** block.

### 1.2 Content exclusion — the details GH-300 asks

**What it does when a file is excluded:**

- Inline suggestions are **not available** in the affected files.
- The content of the affected files **will not inform inline suggestions in other files**.
- The content **will not inform Copilot Chat responses**.
- Affected files **will not be reviewed** in a Copilot code review.

**What you can target** (q087 territory):

- Whole repositories (`"*"` for everything in a repo)
- Paths / directories (`/src/some-dir/kernel.rb`)
- File types / extensions (`**/*.env`, `**/secrets/**`)
- Glob / pattern-based rules (fnmatch-style, like `.gitignore` syntax)
- At org/enterprise level, rules are keyed by **repository URI** and then a list of paths

You do **not** target branches. "Repositories and branches" is a distractor.

**Who can configure it:**

| Scope            | Who                                          | Effect                                                                    |
| ---------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| **Repository**   | Repository administrators                    | Applies to any Copilot user working in that repo                          |
| **Organization** | Organization owners                          | Applies to users holding a Copilot seat assigned through that org, across repos (including repos outside the org, by URI) |
| **Enterprise**   | Enterprise owners                            | Applies enterprise-wide                                                    |
| **Read-only**    | Users with the "Maintain" role               | Can **view** repo exclusions but not edit them                            |

Inherited exclusions appear as **greyed-out, non-editable boxes** in the repo settings page. A repo admin **cannot remove** an inherited org/enterprise exclusion — inheritance is additive and restrictive-only.

**Availability gotchas (very examinable):**

- Requires **Copilot Business or Copilot Enterprise**. Not available on Free/Pro/Pro+ individual plans.
- **NOT supported by**: Copilot CLI, Copilot cloud/coding agent, **Agent mode in Copilot Chat in IDEs**.
- Supported across VS Code, Visual Studio, JetBrains, Vim/Neovim (inline only), Xcode, Eclipse, Azure Data Studio (inline only), plus GitHub.com and GitHub Mobile for Chat.
- Changes can take a short time to propagate; there is a "test changes / review changes" flow and a **REST API** for managing exclusions.
- It is a **productivity/leak-reduction control, not a security boundary**. It does not encrypt, does not stop a developer pasting the file into Chat manually, and does not stop other tools reading the file.

### 1.3 Policy inheritance & precedence (q222 — drill this)

```
Enterprise (AI controls tab)
        │  enforce ON  /  enforce OFF  /  "Let organizations decide"
        ▼
Organization (org settings → Copilot → Policies)
        │  only free to choose when enterprise said "Let organizations decide"
        ▼
Repository
        │  content exclusion only (additive); cannot loosen anything above
        ▼
Individual developer
        │  personal toggles only where nothing above enforces
```

**Rules:**

1. **Enterprise-enforced policy wins.** If the enterprise enforces "Block suggestions matching public code," an org owner **cannot** set it to Allow, and a repo admin **cannot** override it for their repos. Public vs private repository makes no difference.
2. Policies can only be **tightened** going down, never loosened.
3. "Let organizations decide" is the only path that delegates the choice downward.
4. Multi-license edge case: if a user gets Copilot from two orgs in the same enterprise with conflicting policies, the **least restrictive** applicable policy applies to that user. (Different question from "can an org override enforcement" — that's still No.)
5. Enterprise-assigned users (licensed directly by the enterprise, not via an org) are governed by a separate "Policies for enterprise-assigned users" default.

**Things an org owner can toggle** (when not enterprise-enforced): Copilot in GitHub.com, Copilot Chat in the IDE, Copilot Chat in GitHub Mobile, Copilot in the CLI / Windows Terminal, editor preview features, **Suggestions matching public code**, access to alternative models (Claude/Gemini/OpenAI), Copilot Extensions, premium request allowances.

### 1.4 Data handling & privacy matrix (q012, q024)

| Question                                                | Free / Pro / Pro+ (individual)                        | Business / Enterprise                          |
| ------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| Are prompts/suggestions retained for model training?     | User-controllable setting; **opt-out available**       | **No** — never used to train base models       |
| Is private repo code used to train shared models?        | No (with the setting off)                             | **No, by default and by contract**              |
| Prompt/suggestion retention                              | Transient for completions; Chat retained for the session/history | Transient for completions; not used for training |
| Content exclusion available?                             | No                                                    | Yes                                             |
| Audit logs                                               | Pro+ has audit logs (individual)                       | Yes (org/enterprise audit log)                  |
| IP indemnity (with public-code filter enabled)           | Individual plans: limited                              | Yes                                             |

**Responsible-AI mapping for privacy stems (q012):**

- "Personal data must not leak into completions / PII must not be exposed" → **Privacy and Security**.
- "Users must know they're interacting with AI / how it works / its limits" → **Transparency**.
- "Treat all people equally, unbiased & representative data, no discriminatory outcomes" → **Fairness**. ← **your historical repeat miss; force-correct the Transparency instinct.**
- "Doesn't crash, doesn't emit harmful/offensive output, behaves predictably" → **Reliability and Safety**.
- "Accessible to people of all abilities/backgrounds" → **Inclusiveness**.
- "Humans remain answerable; governance, oversight, audit" → **Accountability**.

**q024-style conflict resolution:** when Fairness improvement would require collecting sensitive attributes **beyond user consent**, **Privacy and Security takes precedence**. The right answer both (a) protects consent and (b) notes Business/Enterprise code/prompts/completions are not used to retrain base models, and (c) improves fairness via **synthetic or privacy-preserving methods**. "Document it and move on" (Transparency) is not sufficient; "Inclusiveness overrides privacy" is wrong.

### 1.5 Telemetry & usage metrics (q218)

- Copilot telemetry / the **Copilot Metrics API** and usage reports aggregate **activity and feature usage**: number of suggestions shown/accepted, acceptance rate, active users, chat turns, agent/PR activity, language and editor breakdowns.
- It is **not a dump of source code**. Raw file contents are **not** shipped as telemetry.
- "Copilot collects no usage data" is false. "Telemetry always includes raw file contents" is false. "Only Enterprise customers get telemetry" is false — Business gets usage metrics/reports too (and enterprises can additionally route OTel data via managed settings).
- Business/Enterprise admins get the **usage metrics dashboard/API + audit log events**; individual users get personal usage data in billing/settings.

### 1.6 Coding agent — what stays with the human (q201, multi-select)

Delegating work to the Copilot coding agent does **not** delegate accountability. Retained developer/team responsibilities:

- ✅ **Defining safe, well-scoped tasks/issues** for the agent to work on.
- ✅ **Reviewing and approving the pull request before merge** — the agent's PR is a draft proposal, and the agent cannot approve its own PR.
- ✅ **Ensuring tests, linters, and security scans pass** for the change.
- ❌ **Not** "let the agent auto-merge into production branches as long as tests pass" — that removes the human checkpoint and is always the wrong option in a multi-select.

Supporting facts: the coding agent works on a branch in an ephemeral sandbox, opens a **draft PR**, respects branch protections and required reviews, its Actions workflows require approval on first run, and it **does not support content exclusion** (so scope its repo access instead).

---

## Part 2 — Plan tiers, the directional rule (heavy carryover today: q039, q058, q096, q134, q146)

### 2.1 The directional rule — say it out loud twice

> **Business** = the **baseline for organizational governance**: org admin controls, policy management, seat management, **repository-level content exclusion**, audit logs, usage metrics, IP indemnity, no training on your code.
>
> **Enterprise** = **GHEC-scoped**, adds on top: **repository-aware / repo-context Copilot Chat on GitHub.com**, knowledge bases, enterprise-wide policy management across multiple orgs, **advanced compliance + identity/SSO integration**, enterprise-grade integrations, PR summaries on GitHub.com, fine-tuned/enterprise context features.

**Do not over-correct.** The correct answer is Business when the stem says _"an organization owner wants to control which repos/code Copilot can access"_ or _"set an org-wide code suggestion policy."_ The correct answer is **Enterprise** when the stem says any of:

- "repository-level context awareness **on GitHub.com**" / "Chat that can reference repo files and docs on GitHub.com" (q039, q146)
- "enterprise-grade integrations, SSO (org-configured), advanced compliance" (q058)
- "advanced compliance controls" alongside audit logs, in a GHEC context (q134)
- "enforce across multiple organizations / enterprise-wide"

**About q134 specifically** — this is the trap that bit you on Day 2 (q053). When a question offers Free / Individual / Business / Enterprise and asks for **"audit logs AND advanced compliance controls"**, the phrase **"advanced compliance"** is the tell that pushes it above Business. Business has audit logs; **Enterprise** is the plan characterized by audit logs **plus advanced compliance controls**. Read the whole option, not just "audit logs."

### 2.2 Who buys and assigns seats (q096)

| Plan                     | Purchased by                                      | Seats assigned by                                            |
| ------------------------ | ------------------------------------------------- | ------------------------------------------------------------ |
| Free / Pro / Pro+ / Max  | The individual developer (github.com billing)     | N/A (self)                                                    |
| **Business**             | **Organization owners** (org billing settings)     | **Org owners / billing managers** assign to org members/teams |
| **Enterprise**           | **Enterprise owners** (enterprise account, GHEC)   | Enterprise owners manage enterprise subscriptions; can allocate to orgs, which then assign to members |

Wrong-answer patterns: "developers purchase directly in the IDE," "repository admins purchase both," "students purchase Enterprise."

### 2.3 Plan identity facts you have missed before

- Verified **students, teachers, and popular OSS maintainers** → free **Copilot Pro** (a Student plan also exists). **Not** "Copilot Free" — Free is a separate limited tier available to anyone.
- **Copilot is not supported on GHES.** It is a cloud service requiring GitHub.com or GHEC. No on-prem/air-gapped/self-hosted Copilot. "Copilot Enterprise" means **GHEC**, never GHES.
- A **GHEC free 30-day trial includes Copilot Business.**
- There is no plan called "Copilot Premium."
- **Free includes IDE agent mode and Copilot CLI**, but the **cloud/coding agent requires a paid plan**.

### 2.4 Feature-vs-plan quick grid

| Capability                                     | Free | Pro/Pro+ | Business | Enterprise |
| ---------------------------------------------- | ---- | -------- | -------- | ---------- |
| Code completions                               | Limited | ✅    | ✅       | ✅         |
| Copilot Chat (IDE)                             | Limited | ✅    | ✅       | ✅         |
| Copilot CLI                                    | ✅   | ✅       | ✅       | ✅         |
| Agent mode in IDE                              | ✅   | ✅       | ✅       | ✅         |
| Copilot cloud/coding agent                     | ❌   | ✅       | ✅       | ✅         |
| **Content exclusion**                          | ❌   | ❌       | ✅       | ✅         |
| Org policy management / seat management        | ❌   | ❌       | ✅       | ✅         |
| Audit logs (org-level)                         | ❌   | Pro+ personal | ✅  | ✅         |
| Usage metrics / Metrics API                    | ❌   | ❌       | ✅       | ✅         |
| **Repo-aware Chat on GitHub.com**              | ❌   | ❌       | ❌       | ✅         |
| Knowledge bases                                | ❌   | ❌       | ❌       | ✅         |
| Enterprise-wide policy across orgs, advanced compliance/identity | ❌ | ❌ | ❌ | ✅ |
| Code/prompts not used for training             | opt-out | opt-out | ✅ default | ✅ default |

---

## Part 3 — Feature & productivity carryover (D2/D3/D4/D5 questions today)

### 3.1 Agent Mode vs Chat vs inline (q189, q156, q102, q186)

| Surface           | What it is                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------- |
| **Inline suggestions** | **Cursor-local completions** as you type; ghost text; no conversation                     |
| **Copilot Chat**  | **Multi-turn reasoning** with selectable context (files, selections, `#`/`@` references); explains, proposes, answers |
| **Edit mode**     | Targeted, reviewable **multi-file diffs** on a small, well-scoped change                       |
| **Agent Mode**    | **Autonomous multi-step execution** from a high-level goal: edits files, runs commands/terminal/tools, iterates on errors, can open PRs |

- Inline and Chat **coexist**; enabling Chat does not deprecate inline. Chat does not write to the repo without user review. Both run in IDEs (Chat also on GitHub.com/Mobile).
- **Debugging support (q102, q186):** paste the error/stack trace into Chat → it **explains the error and proposes fixes or alternative implementations**. It does **not** auto-fix at build time, does not run your pipelines for you, and does not replace QA.

### 3.2 Copilot CLI (q081)

- Yes, Copilot is available in the command line — **GitHub Copilot CLI** (and Copilot in Windows Terminal).
- It **explains commands** ("what does this do?") and **suggests/drafts commands** from natural language; newer versions run agentic tasks in the terminal.
- Not IDE-only, not Enterprise-only, and **GHES is irrelevant** (Copilot doesn't run on GHES).
- Governed by the "Copilot in the CLI" org/enterprise policy. **Does not honor content exclusion.**

### 3.3 Prompt engineering (q110, q068, q117)

- **Why context matters:** more relevant, accurate, grounded suggestions. Context = open files, selection, comments, explicit file/symbol references, custom instructions. It does not slow responses meaningfully, prevent completions, or reduce security.
- **Primary benefit of prompt engineering:** clarity + specificity → better, more relevant suggestions. It does **not** guarantee license compliance, reduce CPU, or disable duplication detection.
- **Best refactor prompt = bounded + constrained.** Good prompts name: the target shape ("pure functions, no side effects"), an invariant to preserve ("keep the same public API"), extras ("add docstrings"), and edge behavior ("return early on invalid input"). Vague ("improve this," "make it cleaner") and unbounded ("rewrite completely") are always wrong.
- **CI-ready output prompt rule (your 4×-repeat miss):** the winning option specifies a **machine-readable format + the exact schema/fields + "no prose."** A "human-readable report" answer is wrong even if it sounds thorough.

### 3.4 Testing & productivity (q225, q178, q232, q138)

- **TDD support (red→green→refactor):** Copilot drafts **test stubs/cases from a selection or spec**, then assists with targeted code changes until the tests pass. Anything about auto-merging, disabling failing tests, or removing assertions is wrong.
- **Testing limitation:** generated tests **may require developer review and validation** — coverage may be incomplete, assertions may be shallow or wrong. Copilot can absolutely generate tests; it just isn't authoritative. **Copilot does not execute the suite** — CI (e.g. GitHub Actions) does.
- **Flaky Copilot-generated tests:** fix the **root cause** — isolate external dependencies with mocks/fakes, add deterministic fixtures, remove timing sensitivity. Retries, blanket timeout increases, disabling tests, or re-running until green are all wrong.
- **Advanced developer use case:** exploring **unfamiliar APIs and libraries** (also: legacy code comprehension, migration, scaffolding). HR/payroll automation, legal contracts, and calendar/scheduling are outside a coding assistant's scope.

---

## Cross-Domain Quiz Question Refreshers

| Concept                                    | Key fact                                                                                   | Trap                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Telemetry (q218)                           | Aggregated activity/feature usage; no raw source code                                       | "Includes raw file contents" / "Enterprise-only" / "collects nothing" |
| Copilot CLI (q081)                         | Available in CLI; drafts + explains commands                                                 | "IDE-only" / "Enterprise-only" / "requires GHES"                     |
| Privacy principle (q012)                   | PII not exposed in completions → **Privacy and Security**                                    | Picking Transparency or Accountability                                |
| Seat purchasing (q096)                     | Org owners buy/assign Business; enterprise owners manage Enterprise                          | "Developers buy in the IDE" / "repo admins buy"                       |
| Agent Mode (q189)                          | Autonomous multi-step: edits, runs commands, opens PRs                                       | "Agent mode is Q&A only" / "identical to Chat, just UI"               |
| Advanced use case (q138)                   | Exploring unfamiliar APIs/libraries                                                          | HR/payroll, legal contracts, scheduling                               |
| Flaky tests (q232)                          | Mocks/fakes + deterministic fixtures; kill timing sensitivity                                 | Retries, global timeouts, disabling tests, re-running CI              |
| Refactor prompt (q117)                     | Bounded: shape + invariant + edge behavior                                                    | "Improve this" / "Make it cleaner" / "Rewrite completely"             |
| Business privacy (q024)                    | Privacy wins over consent-violating fairness fix; use synthetic/privacy-preserving methods    | "Fairness first" / "documenting is enough" / "Inclusiveness overrides" |
| Debugging (q102, q186)                     | Chat explains errors/traces and proposes fixes                                                | "Auto-fixes at build time" / "runs all pipelines" / "replaces QA"     |
| Enterprise policy override (q222)          | Enterprise-enforced policies take precedence; orgs and repos cannot loosen                    | "Org owner can always change to Allow" / "repo admins can override" / "only for public repos" |
| Context in prompts (q110)                  | Improves relevance and accuracy                                                               | "Slows responses" / "reduces security"                                |
| Repo-aware Chat on GitHub.com (q039, q146) | **Copilot Enterprise**                                                                       | Over-correcting to Business                                           |
| Enterprise integrations/SSO/compliance (q058) | **Copilot Enterprise**                                                                     | Over-correcting to Business                                           |
| Audit logs + advanced compliance (q134)    | **Copilot Enterprise** — "advanced compliance" is the tell                                    | Picking Business because "audit logs = Business"                      |
| Prompt engineering benefit (q068)          | Clarity/specificity → better suggestions                                                      | "Guarantees license compliance" / "disables duplication detection"    |
| TDD (q225)                                 | Draft test stubs from spec, then iterate code until green                                     | Auto-merge, disabling tests, removing assertions                      |
| Testing limitation (q178)                  | Generated tests need review/validation                                                        | "Can't generate tests at all" / "always perfect coverage"             |
| Inline vs Chat (q156)                      | Inline = cursor-local completions; Chat = multi-turn with selectable context                  | "Inline is browser-only" / "Chat writes straight to repo" / "inline deprecated" |
| Exclusion vs referencing (q223, q140, q087)| Exclusion = input context; referencing = output resembling public code; targets = repos/paths/globs/file types | "Both are identical output filters" / "branches" / picking exclusion for similar-output |

---

## Common Traps & Misconceptions (exam-day checklist)

1. **Don't reflexively answer "Business."** Read for the GHEC/GitHub.com/advanced-compliance/enterprise-wide signals — those mean **Enterprise**.
2. **Don't reflexively answer "Enterprise" either.** "Org owner sets a policy," "repo-level exclusion," "control which repos Copilot can access" = **Business**.
3. **Exact + long → duplication detection BLOCKS. Similar → code referencing SHOWS. Input → content exclusion.** Never mix.
4. **The duplication filter reads no licenses.** Any option mentioning license analysis is wrong.
5. **Fairness ≠ Transparency.** Bias / equal treatment / representative data = **Fairness**.
6. **CI-ready output = format + exact schema + "no prose."**
7. **Enforced enterprise policies cannot be relaxed downward** — not by orgs, not by repo admins, not "for private repos only."
8. **Content exclusion has holes**: CLI, cloud agent, and IDE Agent mode do not honor it.
9. **Multi-select questions**: the "let it auto-merge / remove the human review" option is never correct.
10. **Read all four options fully.** Your own Day 25 note: accuracy tracks with reading discipline, not speed.

---

## Quick Reference Card

```
INPUT  → Content exclusion         → Business/Enterprise → repo/paths/globs/file types → repo, org, enterprise
OUTPUT (similar)  → Code referencing / matching public code → shows references (or blocks if policy = Block)
OUTPUT (exact ~150+ chars) → Duplication-detection filter → BLOCKS, length-based, license-blind

Enterprise enforce > Org choose > Repo exclusions (additive) > User settings
"Let organizations decide" is the ONLY delegation path.
Multiple orgs, same enterprise, conflicting policy → least restrictive applies to that user.

Business    : org controls, policies, seats, audit logs, usage metrics, repo content exclusion, no training on your code, IP indemnity
Enterprise  : ALL of Business + GHEC repo-aware Chat on GitHub.com, knowledge bases, PR summaries,
              enterprise-wide policy across orgs, advanced compliance + identity/SSO integrations

Telemetry   = aggregated usage, NOT source code, NOT Enterprise-only
Coding agent: human defines scope, human reviews/approves PR, human ensures tests+lint+security pass
Student/teacher/OSS maintainer → free Copilot Pro | GHES → Copilot NOT supported | GHEC trial → includes Business
```

---

## Related Questions in questions.json (today's 25)

D6: q223, q087, q140, q201 · D6/D2 policy: q222
D2: q218, q081, q096, q189, q102, q186, q039, q058, q146, q134
D1: q012, q024
D3: q232, q110
D4: q117, q068
D5: q138, q225, q178, q156

Quiz command (run from the exam folder):

```powershell
python quiz_runner.py --day-lock 26
```

---

## Sources (verified 2026-08-02)

- [Content exclusion for GitHub Copilot](https://docs.github.com/en/copilot/concepts/context/content-exclusion)
- [Excluding content from GitHub Copilot (how-to)](https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/exclude-content-from-copilot)
- [GitHub Copilot policies for enterprises and organizations](https://docs.github.com/en/copilot/concepts/policies)
- [Managing policies and features for Copilot in your enterprise](https://docs.github.com/enterprise-cloud@latest/copilot/managing-copilot/managing-copilot-for-your-enterprise/managing-policies-and-features-for-copilot-in-your-enterprise)
- [Managing policies for Copilot in your organization](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/manage-policies)
- [Plans for GitHub Copilot](https://docs.github.com/en/copilot/get-started/plans)
- [About individual GitHub Copilot plans and benefits](https://docs.github.com/en/copilot/concepts/billing/individual-plans)
- [GitHub Copilot plans & pricing](https://github.com/features/copilot/plans)
- [Enterprise managed settings reference](https://docs.github.com/en/copilot/reference/enterprise-managed-settings-reference)

---

## Notes (your own words — fill this in after studying)

_(Space for your own notes.)_
