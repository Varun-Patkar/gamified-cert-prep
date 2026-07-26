# Day 18: Mock Round 1 — All Domains (D1–D6)

**Date**: 2026-07-26
**Domain**: MIXED — full-exam simulation (Phase 3, Mock Round 1)
**Subtopics**: Responsible AI principles, plans & governance, features (Chat/Edit/Agent/Cloud agent), data & architecture, prompt engineering, developer productivity, privacy & content exclusions
**Estimated study time**: ~2 hrs (read + 25-question mock + review)
**Exam date**: 2026-08-08 · Overall accuracy so far: 93.5% (17 sessions)

---

## TL;DR (60-second skim)

- **This is a real-exam simulation.** No topic hint per question — read carefully and identify which domain each question is really testing.
- **Fairness = bias / representative training data / no demographic discrimination.** (Your #1 repeat miss — q019/q009. Do NOT pick Transparency.)
- **Reliability & Safety = dependable/consistent operation + pre-release safety testing + handling offensive/unsafe content.**
- **Plan hierarchy: Business = baseline org governance** (content exclusion, public-code matching policy, org-wide repo controls). **Enterprise inherits Business + adds SSO, Knowledge Bases, audit/compliance, centralized governance.**
- **Two different "public code" concepts:** *Content exclusion* bounds **INPUT** context; *suggestions matching public code / duplication detection (~150 chars)* governs **OUTPUT** matching public code.
- **Copilot is NOT available on GHES self-hosted** (needs GitHub Enterprise Cloud). **Cloud/coding agent = paid plans only**, runs in **ephemeral GitHub Actions** environments.
- **Edit mode = targeted, reviewable diffs on a well-scoped change. Agent mode = multi-step, cross-file, uses tools.**
- **Usage metrics/telemetry = activity trends, NOT raw repository code.**

---

## Learning Objectives

By the end of this session you should be able to, under exam pressure:

- Instantly disambiguate the 6 Responsible AI principles from a one-line scenario.
- Map a governance/feature requirement to the correct Copilot plan tier (Free / Pro / Business / Enterprise).
- Distinguish input-side (content exclusion) vs output-side (code referencing / duplication detection) controls.
- Pick the right feature mode (Chat / Edit / Agent / Cloud agent) for a described task.
- Recognize prompt-engineering patterns (few-shot, TDD, Given-When-Then, prototyping).
- Correctly classify what telemetry/usage data captures.

---

## Domain 1 — Responsible AI Principles (Quick Refresher)

Microsoft's **six** Responsible AI principles. Memorize the one-line trigger for each; the exam tests by scenario, not by name.

| Principle | Core idea | Trigger words in a question | Tested by today |
| --- | --- | --- | --- |
| **Fairness** | Treat all people equitably; avoid bias; use **representative/unbiased training data**; no demographic discrimination | "bias", "representative data", "different groups treated equally", "discrimination", "demographics" | **q019** |
| **Reliability & Safety** | Operate **dependably and consistently**; **pre-release safety testing**; handle harmful/offensive/unsafe content; safe response to unexpected input | "tested before release", "dependable", "consistent", "operate safely", "offensive content", "fail safely" | **q017, q004** |
| **Privacy & Security** | Protect personal data; secure by design; respect data-use consent | "protect data", "consent", "secure handling of PII" | — |
| **Inclusiveness** | Empower everyone; accessibility; serve people of **all abilities** | "accessibility", "all abilities", "empower everyone", "disabilities" | — |
| **Transparency** | Systems are **understandable/explainable**; people know how/why a decision was made; disclose AI use | "explainable", "understand how it works", "disclose it's AI", "interpretability" | (distractor for q019) |
| **Accountability** | Humans remain **responsible/answerable**; governance & oversight; human accountability for outcomes | "who is responsible", "human oversight", "governance", "answerable" | **q005** |

> **DRILL — Fairness vs Transparency (your repeat miss):**
> - **Fairness** answers *"Is the system biased against a group?"* → about **outcomes/data representation**.
> - **Transparency** answers *"Can we understand/explain how it works?"* → about **explainability/disclosure**.
> - Any mention of **bias, training data representativeness, or demographic discrimination = Fairness. Always.**

> **q005 trap (6 official principles):** The valid six are Fairness, Reliability & Safety, Privacy & Security, Inclusiveness, Transparency, Accountability. **Invalid distractors** the exam invents: "Sustainability", "Efficiency", "Profitability", "Scalability", "Autonomy", "Explainability" (a *facet* of Transparency, not a standalone principle). Reject any option that isn't one of the six.

---

## Domain 2 — Features, Plans & Governance (Quick Refresher)

### Plan matrix (governance-relevant view)

| Capability | Free | Pro / Pro+ / Max | **Business** | **Enterprise** |
| --- | --- | --- | --- | --- |
| Code completions & Chat | Limited | Yes | Yes | Yes |
| IDE **Agent mode** (local) | Yes | Yes | Yes | Yes |
| **Cloud / coding agent** (background, PRs) | **No** | Yes (paid) | Yes | Yes |
| **Content exclusion** (org-level) | No | No | **Yes (baseline)** | Yes (inherits) |
| **Public-code matching policy** (org admin) | No | No | **Yes (baseline)** | Yes (inherits) |
| Org-wide repo/code controls | No | No | **Yes (baseline)** | Yes (inherits) |
| **SSO / enterprise-grade auth** | No | No | Partial (org) | **Yes** |
| **Audit logs / compliance / centralized governance** | No | No | Some org logging | **Yes (full)** |
| **Knowledge Bases** (curated org docs) | No | No | No | **Yes (Enterprise-only)** |
| Data used to train shared models? | Possible (opt-out) | Possible (opt-out) | **No (DPA-protected)** | **No (DPA-protected)** |

> **Plan hierarchy rule (your q133/q160 miss):** Organization-level governance controls — **content exclusion, public-code matching policy, org-wide repository controls — START at Business.** Enterprise **inherits** all of them and **adds** SSO, Knowledge Bases, audit/compliance, and centralized governance. So "org-level content exclusion" → **Business** is the correct baseline answer; "SSO / Knowledge Bases / audit logs / centralized governance" → **Enterprise**.

### Feature modes — which one to pick

| Mode | What it does | Pick it when the question says... | Tested by today |
| --- | --- | --- | --- |
| **Copilot Chat** | Conversational Q&A, explain, generate docs/comments | "generate documentation/docstrings/inline comments", "ask about code" | **q101** |
| **Repository-aware Chat (GitHub.com)** | Reasons across the **entire codebase** on GitHub.com | "reason across the whole repo/codebase on GitHub.com" | **q088** |
| **Edit mode (Copilot Edits)** | **Targeted, user-specified** multi-file edits producing **reviewable diffs** on a **well-scoped** change | "targeted change I specify", "reviewable diff", "scoped edit" | **q199** |
| **Agent mode (IDE, local)** | **Multi-step, cross-cutting** tasks across directories; uses tools; iterates autonomously in the IDE | "multi-step", "across multiple files/directories", "plans and executes", "uses tools" | **q192** |
| **Cloud / coding agent** | Runs **in the background in ephemeral cloud (GitHub Actions)**; assigned to issues; opens PRs | "background", "assign to an issue", "opens a PR", "autonomous cloud task" | **q200** |

> **Edit vs Agent (your q235 miss):** *Edit mode* = you specify exactly what to change → small, scoped, reviewable diff. *Agent mode* = broad goal → many steps, many files, tool use. If the scenario is "I know the exact change and want a reviewable diff" → **Edit**. If it's "figure it out across the project" → **Agent**.

### Other D2 facts tested today

- **q077 — GHES:** Copilot is **not available on GitHub Enterprise Server (self-hosted)**. It requires **GitHub Enterprise Cloud**. Any "self-hosted GHES + Copilot" option is the wrong/unsupported one.
- **q086 — Knowledge Bases:** **Enterprise-only** feature to curate organizational documentation as grounded context for Chat. (Note: *Copilot Spaces* is available to any license and is a distractor — Knowledge Bases specifically = Enterprise.)
- **q080 — Enterprise policy precedence:** Policies **enforced at the enterprise level cannot be overridden at the org level.** Enterprise wins; org can only be more restrictive where allowed, never loosen an enterprise-enforced setting.
- **q164 — Enterprise auth:** Copilot **Enterprise** is the plan associated with **enterprise-grade authentication / SSO**.
- **q036 — Enterprise governance:** Centralized governance, **audit logs**, and compliance → **Enterprise**.
- **q200 — Coding agent architecture:** Runs in **ephemeral, isolated cloud environments powered by GitHub Actions**. Not your local machine, not GHES, not CI runners you manage.
- **q239 — PR summaries:** Copilot's PR summaries are **assistive drafts**, NOT an authoritative reviewer approval. A human reviewer still approves. Treat Copilot output as **input**, never as sign-off.
- **q066 — Usage data / telemetry:** Copilot usage/telemetry is designed for **activity monitoring** (adoption, acceptance trends), **not** for storing your repository code.
- **q233 — Governance on file patterns:** Content exclusion (a governance policy) can be applied to **file patterns** such as unit-test files (e.g., `*_test.py`, `**/tests/**`).

---

## Domain 3 — Data Flow & Architecture (Quick Refresher)

- **Prompt + context → Copilot cloud service → AI model → suggestion back.** The **Copilot cloud service relays** prompt + surrounding context to the model. Processing is **not** on your local machine, **not** on GHES, **not** on your CI runners. (Your q214 miss.)
- **By default, your private/business code is NOT used to train the shared models** (Business/Enterprise protected by the **Data Protection Agreement**). (q215.)
- **Coding agent compute = ephemeral GitHub Actions** environment, isolated per task. (q200 overlaps here.)

*No standalone D3 question is assigned today, but the architecture underpins q066, q200, q224.*

---

## Domain 4 — Prompt Engineering (Quick Refresher)

| Pattern | What it is | Trigger in a question | Tested today |
| --- | --- | --- | --- |
| **Few-shot / examples** | Provide **example input→output pairs** to guide **shape/format** of the response | "give examples so output matches this format", "sample pairs" | **q109** |
| **TDD loop** | Ask Copilot to generate **tests first**, before implementation, then code to pass them | "write tests before implementation", "red-green loop" | **q103** |
| **Given-When-Then (BDD)** | Provide **behavioral specs + target framework** to draft **Given-When-Then** test templates | "behavioral spec", "Given/When/Then", "target test framework" | **q234** |
| **Prototyping from description** | Turn a **high-level description** into a **runnable draft** quickly | "rapidly prototype", "high-level idea → draft code" | **q181** (also D5) |

> **Few-shot (q109):** The purpose of including examples is to **constrain the output's structure/format**, not just to explain. If a question asks "why include sample input/output pairs?" → to **guide the shape/format** of Copilot's output.

> **Prompt quality reminders from prior misses:** A good "explain a file" or "CI-ready output" prompt fixes **audience + sections + a length cap** and, for machine consumption, specifies **exact format/schema + "no prose."** Vague prompts that omit the length cap or schema are the wrong choice.

---

## Domain 5 — Developer Productivity (Quick Refresher)

- **q181 — Prototyping:** Copilot excels at turning **high-level descriptions into runnable draft code** fast — accelerating early prototyping/exploration. (Overlaps D4.)
- **q224 — Usage metrics:** Copilot usage metrics capture **activity trends** (suggestions shown/accepted, active users), **not raw repository code**. (Twin of q066.)
- **Scope reminder (q138):** Copilot's productivity sweet spots are **coding tasks** — exploring unfamiliar APIs/libraries, drafting tests, boilerplate, refactors. **HR/legal/administrative automation is out of scope.**
- **Test execution boundary (q227):** Copilot **drafts and refines** tests; **running** tests belongs to the **automation pipeline (GitHub Actions/CI)**, not Copilot itself.

---

## Domain 6 — Privacy & Content Exclusions (Quick Refresher)

This is your **weakest domain (87.9%)** — read this section twice.

| Control | Governs | Direction | Key fact | Tested today |
| --- | --- | --- | --- | --- |
| **Content exclusion** | Which files/paths Copilot may **read as context** | **INPUT** | Excluded files are **not used as prompt context**; configurable by **file patterns**, repo, org | **q114** |
| **Suggestions matching public code / code referencing** | Whether **generated output** matching public code is shown | **OUTPUT** | Checks a suggestion against public code using **~150 characters of surrounding context**; if match/near-match → blocked (in Block mode) | **q079** |

> **THE key D6 disambiguation (your q140/q150 misses):**
> - **"Prevent this file from being seen/used as context"** → **Content exclusion** (INPUT).
> - **"Prevent output that duplicates public code" / "~150 chars" / "matches public repositories"** → **suggestions matching public code / duplication detection** (OUTPUT).
> - They are **different mechanisms**. Don't answer "content exclusion" when the question is about output matching public code.

- **q114 — Content exclusion:** Prevents specified files from being **used as prompt context** (and blocks completions in those files). Input-side only.
- **q079 — Public-code matching:** When "block suggestions matching public code" is on, Copilot compares a suggestion with **~150 characters** of surrounding code against public GitHub code and suppresses matches/near-matches. This is **duplication detection on OUTPUT**.

---

## Master Map — All 25 Questions → Concept That Answers It

| ID | Domain | What it tests | The concept/answer anchor |
| --- | --- | --- | --- |
| q066 | D2 | Telemetry purpose | Usage data = **activity monitoring**, not code storage |
| q017 | D1 | Pre-release safety testing | **Reliability & Safety** |
| q239 | D2 | PR summaries authority | Assistive **input**, not reviewer approval |
| q133 | D2 | Baseline org governance plan | **Business** = baseline content-exclusion controls |
| q224 | D5 | Usage metrics content | Activity trends, **not raw code** |
| q181 | D5/D4 | Prototyping | High-level description → **runnable draft code** |
| q004 | D1 | Dependable/consistent operation | **Reliability & Safety** |
| q233 | D2 | Governance on test file patterns | **Content exclusion** applied to file patterns |
| q077 | D2 | Copilot on GHES | **Not available on self-hosted GHES** |
| q101 | D2 | Docs/docstrings/comments | **Copilot Chat** generates documentation |
| q086 | D2 | Curated org documentation | **Knowledge Bases = Enterprise-only** |
| q080 | D2 | Policy precedence | **Enterprise policies can't be overridden at org level** |
| q192 | D2 | Multi-step cross-directory task | **Agent mode** |
| q164 | D2 | Enterprise-grade auth / SSO | **Copilot Enterprise** |
| q036 | D2 | Governance, audit logs, compliance | **Copilot Enterprise** |
| q005 | D1 | The 6 official RAI principles | Fairness, Reliability & Safety, Privacy & Security, Inclusiveness, Transparency, Accountability |
| q200 | D2 | Coding agent runtime | **Ephemeral cloud env via GitHub Actions** |
| q114 | D6 | Exclude files from context | **Content exclusion (INPUT)** |
| q079 | D6 | Output matching public code | **~150-char duplication detection (OUTPUT)** |
| q199 | D2 | Targeted user-specified edits | **Edit mode (reviewable diffs)** |
| q019 | D1 | Unbiased/representative data | **Fairness** (NOT Transparency) |
| q103 | D2/D4 | Tests before implementation | **TDD loop** |
| q234 | D2/D4 | Behavioral specs + framework | **Given-When-Then** test templates |
| q088 | D2 | Reason across whole codebase on GitHub.com | **Repository-aware Copilot Chat** |
| q109 | D4 | Examples guide output format | **Few-shot prompting** |

---

## Common Traps & Misconceptions (mock-specific)

1. **Fairness ≠ Transparency.** Bias/representative data = **Fairness**. Explainability/disclosure = Transparency. (q019 — your repeat miss.)
2. **Business vs Enterprise.** Org-level content exclusion & public-code policy start at **Business**; SSO, Knowledge Bases, audit logs, centralized governance = **Enterprise**. Don't over-assign to Enterprise. (q133, q164, q036, q086.)
3. **Input vs Output controls.** Content exclusion = INPUT context; ~150-char matching = OUTPUT duplication. (q114 vs q079.)
4. **Copilot ≠ approver / ≠ test runner.** PR summaries are assistive input (q239); test execution is CI's job, not Copilot's.
5. **GHES self-hosted = no Copilot.** Requires Enterprise Cloud. (q077.)
6. **Cloud agent runtime = ephemeral GitHub Actions**, not local, not managed CI runners. (q200.)
7. **Edit vs Agent.** Scoped reviewable diff = Edit (q199); multi-step cross-file = Agent (q192).
8. **Invalid principles.** "Explainability", "Sustainability", "Efficiency" are NOT standalone RAI principles. (q005.)
9. **Telemetry stores activity, not code.** (q066, q224 — twin questions; same answer.)

---

## Exam-Simulation Strategy (use this during the mock)

- **Identify the domain first.** One line in, ask: is this a *principle* (D1), *plan/feature* (D2), *architecture* (D3), *prompt pattern* (D4), *productivity* (D5), or *privacy/exclusion* (D6) question?
- **Watch the twin traps.** If you see "bias/data" think Fairness; if "~150 chars/public code output" think duplication detection; if "org content exclusion" think Business.
- **Eliminate invalid options** (fake principles, fake plans like "Copilot Premium", "Copilot on GHES").
- **Don't over-think plan questions** — match the single distinguishing feature (SSO/Knowledge Bases/audit = Enterprise; baseline governance = Business).
- **Time-box**: ~40–50 sec/question for 25. Flag-and-move if stuck.

---

## Quick Reference Card (last-glance before the mock)

- 6 principles: **F**airness · **R**eliability & Safety · **P**rivacy & Security · **I**nclusiveness · **T**ransparency · **A**ccountability.
- Bias/data → Fairness. Tested-before-release/dependable/offensive-content → Reliability & Safety. Explainable → Transparency. Who's responsible/oversight → Accountability.
- Baseline org governance = **Business**. SSO + Knowledge Bases + audit/compliance + centralized governance = **Enterprise**.
- Content exclusion = **INPUT**. ~150-char public-code matching / duplication detection = **OUTPUT**.
- Copilot: **no GHES self-hosted**; **cloud/coding agent = paid only, ephemeral GitHub Actions**.
- Chat = docs/Q&A · Edit = scoped reviewable diffs · Agent = multi-step cross-file · Cloud agent = background PRs.
- Few-shot = examples shape output format · TDD = tests first · GWT = behavioral spec + framework.
- Telemetry = activity trends, not raw code. PR summaries = assistive input, not approval.

---

## Related Questions in questions.json

25 assigned (mixed all-domains): q066, q017, q239, q133, q224, q181, q004, q233, q077, q101, q086, q080, q192, q164, q036, q005, q200, q114, q079, q199, q019, q103, q234, q088, q109.

Quiz command:

```powershell
python quiz_runner.py --day-lock 18
```

*(No-spoiler policy: answers/explanations are NOT in chat. Review them in the runner's feedback after you finish; results save to `session-results.json`.)*

---

## Sources (verified during this session, 2026-07-26)

- [Plans for GitHub Copilot — GitHub Docs](https://docs.github.com/copilot/about-github-copilot/plans-for-github-copilot)
- [Choosing your enterprise's plan for GitHub Copilot — GitHub Docs](https://docs.github.com/copilot/get-started/choosing-your-enterprises-plan-for-github-copilot)
- [Managing GitHub Copilot policies as an individual subscriber — GitHub Docs](https://docs.github.com/en/copilot/how-tos/manage-your-account/manage-policies) (public-code ~150-char matching; cloud agent = paid plans; model training)
- [About GitHub Copilot cloud agent — GitHub Docs](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent)
- [Creating GitHub Copilot Spaces — GitHub Enterprise Cloud Docs](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-on-github/customize-copilot/copilot-spaces/create-copilot-spaces)
- Microsoft Responsible AI Standard — six principles (Fairness, Reliability & Safety, Privacy & Security, Inclusiveness, Transparency, Accountability)

---

## Notes (your own words — fill this in after the mock)

_(After the mock, jot down: every question you missed, the domain, and the one-line rule that would have gotten it right. Pay special attention to any Fairness/Transparency or Business/Enterprise slips.)_
