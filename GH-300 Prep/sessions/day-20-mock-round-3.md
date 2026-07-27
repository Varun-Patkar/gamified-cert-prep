# Day 20: Mock Round 3 — All Domains (D1–D6)

**Date**: 2026-07-28 (studied early on 2026-07-27)
**Type**: Mixed-domain MOCK / consolidation round — NOT new material
**Domains covered**: D1 Responsible AI, D2 Features, D3 Data & Architecture, D4 Prompt Engineering, D5 Developer Productivity, D6 Privacy & Config
**Estimated study time**: 1.5 hrs
**Exam date**: 2026-08-08

---

## TL;DR (60-second skim)

- **Fairness = "treat all people equally / prevent discrimination / unbiased & representative training data."** This is NOT Transparency. Force-correct your instinct.
- **Transparency = users can SEE/UNDERSTAND how & why the AI decided, and KNOW that AI is involved** (e.g., "tell users when Copilot is generating suggestions").
- **Inclusiveness = don't exclude anyone** — especially people with disabilities / accessibility.
- **Audit logs = Copilot Business AND Copilot Enterprise** (both), retained **180 days**; they do NOT capture local IDE/CLI prompts or responses.
- **Content/context exclusion = Business & Enterprise** (org/repo admins). It does **not** work in Edit/Agent chat modes, symlinks, or remote filesystems.
- **Code referencing** ("suggestions matching public code" / duplication detection filter) is configured at **user (individual)** and **organization/enterprise** scopes.
- **GHEC does NOT bundle Copilot** — 30-day trial only; Copilot is a separate paid add-on.
- **Edit mode = you name the specific files; targeted, reviewable diffs on a well-scoped change. Agent mode = Copilot decides scope, plans multi-step work, can create/run/iterate across the repo, may open a PR** — which you must still review before merge.
- **Where prompts go**: IDE/CLI → **Copilot cloud service relays prompt + context to the model** → response back. Not processed locally, not on GHES, not on CI runners.
- **CI-ready output prompt** must specify machine-readable **format + exact schema + "no prose."**

---

## Domain 1 — Responsible AI (the trap zone) 🎯

### The 6 Microsoft Responsible AI principles

| Principle | One-line test | Trigger words in questions |
| --- | --- | --- |
| **Fairness** | Treat all people **equally**; avoid discrimination/bias | "unbiased," "representative training data," "equally," "discrimination," "demographic," "one group disadvantaged" |
| **Reliability & Safety** | Perform consistently & safely; handle bad/harmful input; no toxic/offensive output | "offensive content," "unsafe," "consistent," "harmful," "operate as intended under stress" |
| **Privacy & Security** | Protect user data; consent; secure data | "data protection," "consent," "confidential," "secure the data" |
| **Inclusiveness** | Don't exclude anyone; **accessibility / disabilities** | "people with disabilities," "accessible," "everyone can use," "exclude" |
| **Transparency** | Users **understand HOW/WHY** it decided and **KNOW AI is involved** | "understand the decision," "challenge/appeal," "explain reasoning," "tell users AI is generating," "black box," "can't see why" |
| **Accountability** | Humans stay responsible; governance, oversight, human validation | "who is responsible," "human oversight," "governance," "audit the system" |

### ⚠️ HARD DRILL — Fairness vs Transparency (your 4× repeat miss)

This is the single most important axis to nail on exam day. You have historically picked **Transparency** when the answer was **Fairness** (q009, q019). Break the reflex now:

| If the question says… | Principle | Why |
| --- | --- | --- |
| "ensure the AI **treats all people equally**" | **Fairness** ✅ | Equality of treatment = fairness, full stop |
| "training data must be **representative / unbiased**" | **Fairness** ✅ | Bias in data → unfair outcomes |
| "prevent the model from **discriminating** against a group" | **Fairness** ✅ | Discrimination = fairness violation |
| "users get recommendations with **no way to understand or challenge** them" | **Transparency** ✅ | It's about *visibility/explainability of the decision*, not equality |
| "tell users **when Copilot is generating** suggestions in the IDE" | **Transparency** ✅ | Users must *know AI is involved* |
| "the model is a **black box**; we can't explain **why** it chose X" | **Transparency** ✅ | Explainability of reasoning |

**Mnemonic:** _Fairness = fair to PEOPLE (equal treatment). Transparency = clear to the EYE (you can see/understand the decision & know AI did it)._

If a question mentions bias, representativeness, or equal treatment → it is **Fairness**, never Transparency — even if the wording sounds like "the system should be clear about not discriminating."

### Fairness vs Transparency vs Inclusiveness — decision table

| Scenario keyword | Answer |
| --- | --- |
| Equal treatment / no bias / representative data | **Fairness** |
| Understand/challenge/explain the decision; disclose AI is being used | **Transparency** |
| Accessibility / disabilities / nobody left out / usable by all | **Inclusiveness** |

**Assigned Qs on this axis:** q001 (equal treatment → Fairness), q020 (no way to understand/challenge → Transparency), q014 (don't exclude people with disabilities → Inclusiveness), q018 (tell users WHEN Copilot generates → Transparency).

---

## Domain 2 — Features, Plans, Modes (largest domain, 25–30%)

### Copilot plan tiers (2026)

**Individual:** Free, Pro, Pro+ (and Student). **Organizational:** Business, Enterprise.

| Capability | Free | Pro | Business | Enterprise |
| --- | --- | --- | --- | --- |
| Best for | Casual/light use | **Individual developer** wanting full AI features | Teams/orgs needing admin controls | Large orgs; deep GitHub.com integration |
| Org-admin **policy management** (code-suggestion policy) | ❌ | ❌ | ✅ (**baseline**) | ✅ (inherits + extends) |
| **Content/context exclusion** | ❌ | ❌ | ✅ | ✅ |
| **Repository-level content exclusions** | ❌ | ❌ | ✅ | ✅ |
| **Audit log** of Copilot activity | ❌ | ❌ | ✅ | ✅ |
| **SSO / enterprise IdP** integration (exam answer) | ❌ | ❌ | (dedicated ent. acct can) | ✅ **Enterprise** |
| Included by default with GHEC | — | — | — | ❌ **No — 30-day trial only** |

**Exam mappings from today's set:**

- q043 — "individual developer wanting AI features" → **Pro**.
- q045 — "plan that **introduces** content/context exclusion policies for admins" → **Business** (it's the first tier to add org admin controls; Enterprise inherits them).
- q165 — "plan allowing org admins to set **policy for code suggestions**" → **Business** (baseline for org-admin matching/suggestion policy).
- q169 — "plan allowing **repository-level content exclusions**" → **Business/Enterprise** (both support it).
- q170 — "enterprises requiring **SSO / enterprise IdP** integration" → **Enterprise** (exam-expected).
- q061 — "plan(s) that surface Copilot activity in the **org audit log**" → **Business & Enterprise** (both — verified GitHub Docs).
- q070 — "plan included by default with **GHEC**" → **trap: GHEC does NOT bundle Copilot**; it's a separate paid product with a 30-day trial.

> ⚠️ Repeated exam trap you missed before (q053, Day 2): audit logs are **NOT Enterprise-only**. Business has them too.

### Edit mode vs Agent mode (Copilot Edits / Copilot Coding Agent)

| | **Edit mode** | **Agent mode** |
| --- | --- | --- |
| Scope | **You specify the files**; small, well-scoped change | Copilot **determines the scope**, plans multi-step work |
| Behavior | Produces **targeted, reviewable diffs** you approve | Can create/edit **across many files**, run commands/tools, iterate, self-correct |
| Autonomy | Low — you drive | High — it drives, may open a **PR** |
| Best when | You know exactly what/where to change | Task spans many files or is exploratory (e.g., "standardize error handling everywhere via a shared helper") |

**Exam mappings:**

- q093 — "difference between Edit mode vs Agent mode" → Edit = targeted diffs on files you name; Agent = autonomous multi-step across repo.
- q209 — "standardize error handling via a shared `handleError` helper **across files**" → **Agent mode** (cross-file, multi-step scope, not a single targeted diff).
- q193 — "after **Agent Mode opens a PR**, the developer's responsibility" → **review/validate the PR before merging** (human accountability; Copilot never auto-merges trusted).
- q067 — "accurate statement about **AI models in Copilot**" → Copilot uses large language models hosted as a service; model choice/behavior is provider-managed (not trained on your private code by default, not running locally).

---

## Domain 3 — Data & Architecture (10–15%)

### Where does your prompt actually go?

IDE / CLI → **GitHub Copilot cloud service** (relay/proxy) → **AI model** → response back to you.

- **NOT** processed on your local machine only, **NOT** on GHES, **NOT** on your CI runners.
- q064 — "where prompts are processed" → **Copilot cloud service relays prompt + context to the model** (answer B). This is the same fact you missed as q214 on Day 8 — locked in now.

### Grounding / context at inference

- q113 — "what Copilot relies on during inference" → the **context/prompt you provide** (open files, selection, chat history, instructions). It does not "know" your intent beyond the supplied context.
- q128 — "prompt that best **avoids unsupported library calls**" → the prompt that **pins the allowed libraries/framework and version** and forbids others (constrains Copilot to a known dependency set). Vague prompts invite hallucinated/unsupported APs.

---

## Domain 4 — Prompt Engineering (10–15%)

### Principles the exam rewards

- **Specific > vague**: name the language, framework, versions, constraints, and expected output.
- **Provide context**: relevant code, data shapes, examples.
- **Constrain the output format** when the result feeds another system.

### CI-ready / machine-readable output (your repeat miss — q124 pattern) ⚠️

When a prompt's output will be consumed by a pipeline/tool, the **best** prompt explicitly demands:

1. a **machine-readable format** (JSON, JUnit XML, SARIF, CSV…),
2. the **exact schema / field names**, and
3. **"no prose / no explanation / output only the <format>."**

A prompt missing the schema OR still allowing prose is the wrong answer even if it "sounds" structured.

**Exam mappings:**

- q119 — "best prompt for **table-driven unit tests**" → the prompt that asks for a **parameterized/table-driven test with explicit input→expected rows** covering edge cases (structured, exhaustive), not a single ad-hoc test.
- (Reinforce q124) — CI-ready output = **format + exact schema + "no prose."**

---

## Domain 5 — Developer Productivity (10–15%)

Copilot **drafts and accelerates**; humans **validate**; the **pipeline executes**.

| Task | How Copilot helps | The trap |
| --- | --- | --- |
| **TDD** (q179) | Helps **write the failing test first**, then generate code to make it pass (supports red→green→refactor) | It doesn't replace the TDD discipline; you still drive the cycle |
| **Unit testing** (q151) | **Drafts test cases** (happy path + edge cases) from the code/spec | Copilot **does not run** the tests — CI/GitHub Actions does |
| **Unfamiliar APIs/libraries** (q172) | **Explains usage, suggests idiomatic calls, scaffolds examples** so you learn faster | Still **validate against official docs**; it may hallucinate members |
| **Code review & PR summaries on GitHub.com** (q094) | Provides **automated review comments + a natural-language summary of the diff** to speed human review | It **augments**, not replaces, human reviewers |
| **Compliance validation** (q173) | You must **validate output** because Copilot can produce insecure, non-compliant, or licensed/near-public-code output | Trusting output blindly = risk; human + policy gates required |

**Key phrasing to pick on exam:** answers that say Copilot **assists/drafts/suggests and the human validates** are almost always correct; answers claiming Copilot **guarantees, auto-runs, or replaces review** are traps.

---

## Domain 6 — Privacy & Configuration (10–15%) — your weakest domain (88.2%)

### Content exclusion (a.k.a. content/context exclusion)

- **Purpose:** stop Copilot from using specified files/paths as **input context** (no inline suggestions in matched files, kept out of Chat context).
- **Configured by:** org owners / repo admins on **Business & Enterprise**; set at **org level or per-repository**.
- **Known gaps (verified):** does **not** apply to **symlinks** or **remote filesystems**, and is **not supported in Edit & Agent modes** of Copilot Chat.
- **Not the same as code referencing**: exclusion controls **input**; code referencing / "suggestions matching public code" controls **output that matches public code**.

**Exam mappings:**

- q169 — repository-level content exclusions → **Business/Enterprise**.
- q165 — org admins set **policy for code suggestions** → **Business** (baseline).
- q045 — plan that introduces content/context exclusion → **Business**.

### Audit logs (verified — GitHub Docs)

- Available on **Copilot Business & Copilot Enterprise**.
- Records **plan/policy/setting changes, license assignment, content-exclusion changes, and agent activity on GitHub.com**.
- **Retained 180 days**; stream to a SIEM for longer.
- Does **NOT** contain local **prompts, responses, generated code, or CLI session content**.
- Filters: `action:copilot` (plan/policy events), `actor:Copilot` (agent activity).

### Code referencing / duplication detection

- The **"suggestions matching public code"** filter (a.k.a. duplication detection) blocks or flags completions matching public code.
- Configurable at **individual (user)** scope **and organization/enterprise** scope.
- q083 — "scopes where code referencing can be configured" → **user + org/enterprise** (answer B).

---

## Master Trap Table (all domains)

| # | Trap it sets | The correct instinct |
| --- | --- | --- |
| 1 | "Treat everyone equally / unbiased data" sounds like Transparency | It's **Fairness** |
| 2 | Audit logs feel Enterprise-only | **Business AND Enterprise** (180-day retention) |
| 3 | GHEC "includes" Copilot | **No — 30-day trial only**, separate paid product |
| 4 | "Copilot runs my tests / merges the PR" | Copilot **drafts/suggests**; **CI runs**, **human merges** after review |
| 5 | Content exclusion works everywhere | **Not** in Edit/Agent modes, symlinks, or remote filesystems |
| 6 | Prompts processed locally / on CI runners | **Copilot cloud service relays** prompt+context to the model |
| 7 | Structured-output prompt without schema is "good enough" | Must have **format + exact schema + no prose** |
| 8 | Content exclusion == code referencing | Exclusion = **input**; code referencing = **public-code output** |
| 9 | Enterprise is the "first" tier for admin controls | **Business** is the baseline; Enterprise **inherits + extends** |
| 10 | Agent mode = do a single tidy diff | That's **Edit mode**; Agent = autonomous multi-step, may open a PR |

---

## Quick Reference Card

- **6 principles:** Fairness, Reliability & Safety, Privacy & Security, Inclusiveness, Transparency, Accountability.
- **Fairness** = equal treatment / unbiased data. **Transparency** = understand-the-decision + know-AI-is-involved. **Inclusiveness** = accessibility.
- **Plans:** Free < Pro (individual) < Business (org admin baseline) < Enterprise (SSO/IdP, deep GitHub.com).
- **Audit + content exclusion + code-suggestion policy = Business & Enterprise.** Business is the entry point.
- **Audit log:** 180 days; no local prompt/response content.
- **Code referencing:** user + org/enterprise scopes.
- **Prompt path:** IDE/CLI → Copilot cloud service → model → back.
- **Edit mode** = you scope files, small reviewable diff. **Agent mode** = Copilot scopes, multi-step, may open PR (you review before merge).
- **CI-ready prompt:** format + exact schema + "no prose."
- **Copilot drafts, human validates, pipeline executes.**

---

## Assigned Questions for Day 20 (25 total — no answers here, self-test via quiz)

| Domain | Question IDs |
| --- | --- |
| D1 Responsible AI | q020, q001, q014, q018 |
| D2 Features/Plans/Modes | q083, q209, q061, q043, q070, q170, q193, q067, q093 |
| D3 Data & Architecture | q045, q128 |
| D4 Prompt Engineering | q113, q119 |
| D5 Developer Productivity | q179, q151, q172, q094, q173 |
| D6 Privacy & Config | q169, q165, q064 |

**Quiz command:**

```powershell
python quiz_runner.py questions.json --day-lock 20
```

---

## Sources (verified 2026-07-27)

- [Responsible AI in Azure workloads — Microsoft Learn (Well-Architected)](https://learn.microsoft.com/en-us/azure/well-architected/ai/responsible-ai)
- [Reviewing audit logs for GitHub Copilot — GitHub Docs](https://docs.github.com/copilot/managing-github-copilot-in-your-organization/reviewing-audit-logs-for-copilot-business)
- [About enterprise accounts for Copilot Business — GitHub Docs](https://docs.github.com/copilot/concepts/about-enterprise-accounts-for-copilot-business)
- [Setting up a dedicated enterprise for Copilot Business — GitHub Docs](https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/enable-copilot/set-up-a-dedicated-enterprise-for-copilot-business)
- [About SAML for enterprise IAM — GitHub Enterprise Cloud Docs](https://docs.github.com/enterprise-cloud@latest/admin/identity-and-access-management/using-saml-for-enterprise-iam/about-saml-for-enterprise-iam)
- Governing GitHub Copilot in the Enterprise (2026) — content exclusion gaps & 180-day audit retention corroboration

---

## Notes (your own words — fill in after the quiz)

_(Leave space. After the run, jot any Fairness-vs-Transparency slip, any plan-tier confusion, and any CI-output-schema miss here for exam-eve review.)_
