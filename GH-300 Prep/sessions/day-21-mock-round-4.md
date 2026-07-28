# Day 21: Mock Round 4 — All Domains

**Date**: 2026-07-28 (running a day ahead; plan slot 2026-07-29)
**Type**: Mixed all-domains mock (self-test, NO-SPOILER)
**Domains covered by the 25 assigned questions**: D1 Responsible AI, D2 Copilot Features/Plans, D4 Prompt Engineering, D5 Developer Use Cases/Testing, D6 Privacy & Config
**Estimated study time**: 1.5 hrs (read this file → run the 25-question quiz)

> This is a **mock revision reference**, not an answer key. It re-teaches the concepts, decision rules, and traps behind the 25 assigned questions so you can self-test cleanly. It does **not** state which option letter is correct for any specific quiz item.

---

## TL;DR (60-second skim)

- **Responsible AI principle triggers** are the #1 D1 trap. "Prevent discrimination / unbiased / representative data" = **Fairness** (NOT Transparency). "Inform users AI is involved / explain limitations" = **Transparency**. "Human owns the outcome / escalation / kill switch" = **Accountability**.
- **Plan tiers: Business is the baseline** for org governance. Org-admin policies, content exclusion, usage reporting, seat management, audit logs → start at **Copilot Business**. Only jump to **Enterprise** for enterprise-wide integrations, SSO reliance, GitHub.com repo-aware Chat, or enterprise proxy/network controls.
- **CI-ready prompt output** = specify **format + exact schema (field names) + "no prose."**
- **Content exclusion** = controls **inputs** (what Copilot can _see_). **Code referencing / matching-public-code** = controls **outputs** (what Copilot may _suggest_). Public-code matching window ≈ **150 characters**.
- **Coding agent** = autonomous, multi-step, runs in an **ephemeral GitHub Actions environment**, opens a **PR**. Available on paid plans (**Pro, Pro+, Business, Enterprise**), **not Copilot Free** (Free has IDE agent mode only).
- **Accepting an inline suggestion** just inserts text into your editor — it is NOT commit/merge/approve. Human review + CI still gate merges.
- **Copilot never auto-runs your test framework** and **never auto-merges PRs**. It drafts/scaffolds; you run, review, and merge.

---

## Learning Objectives

After this session you should be able to, under exam time pressure:

1. Map any Responsible AI scenario stem to exactly one of the 6 Microsoft principles.
2. Pick the correct Copilot plan tier from governance/compliance cues, defaulting to Business unless enterprise-scope words appear.
3. Distinguish Copilot capabilities: inline suggestions vs Chat vs Edit mode vs Agent mode / coding agent.
4. Separate **input controls** (content exclusion) from **output controls** (code referencing / duplication detection) and recall the ~150-char threshold.
5. Recognize what Copilot does and does **not** do for testing and PRs.
6. Identify strong vs weak prompts (CI-ready, secure, scoped).

---

## Section 1 — Responsible AI (Domain 1)

### The 6 Microsoft Responsible AI principles — trigger words

| Principle                | Trigger words / scenario cues                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fairness**             | prevent **discrimination**, **bias**, **representative/diverse/unbiased** training data, equitable outcomes, workload skew, parity across languages/groups |
| **Reliability & Safety** | testing, validation, **risk assessment**, robust/consistent performance, unsafe/offensive output, guardrails, secure-coding review                         |
| **Privacy & Security**   | protect **personal/sensitive data**, confidentiality, **consent**, data minimization, leak prevention, secrets/credentials, encryption                     |
| **Inclusiveness**        | **accessibility**, disabilities, assistive tech, languages/cultures, barrier removal, WCAG                                                                 |
| **Transparency**         | **inform/disclose** that AI is involved, explain **how it works**, communicate **limitations & risks**, model cards, auditable docs                        |
| **Accountability**       | **humans own outcomes**, oversight, escalation, governance, review boards, **audit logs**, incident response, **kill switch / roll back**                  |

### Accountability deep note

Accountability = **people, not machines, are answerable**. Human oversight exists to **maintain responsibility for outcomes and correct harmful results** — using governance, escalation, and remediation. It complements the other principles by ensuring action is taken when risks materialize (kill switches, review boards, audit logs, incident response).

### Combined / multi-principle scenarios

Real exam stems often mix two:

- PII leaked in generated code **+** custom extension trained on customer data without consent → **Accountability** (own it, escalate, document, update policy, keep an auditable record) **+** **Privacy & Security** (remove identifiers, require consent, data minimization).
- Copilot works better for English than non-English **+** auto-assignment overloads some devs → **Fairness** (parity + rebalance logic) **+** **Inclusiveness** (serve diverse languages).
- Secure-coding review before merge **+** fix accessibility in generated UI + document it → **Reliability & Safety** + **Inclusiveness** + **Accountability**.

### Safety/toxicity content filters

Copilot's **content safety filters** block **harmful categories**: **hate speech / discriminatory language** and **sexually explicit content** (applied to both input prompts and output). They do **NOT** catch logical errors, code style, or "strong personal opinions." Safety filtering is separate from **public-code / code-referencing** (output IP control) and from **content exclusion** (input control).

---

## Section 2 — Copilot Plans & Features (Domain 2)

### Current plan taxonomy (2026)

- **Individual:** Copilot **Free** (limited; auto model selection; ~2,000 completions/mo; CLI + IDE agent mode; **no cloud agent**), Copilot **Pro** ($10/mo), Copilot **Pro+** ($39/mo, premium models + audit logs), Copilot **Max** ($100/mo). **Copilot Student** = free for verified students.
- **Organization/Enterprise:** Copilot **Business** ($19/user/mo), Copilot **Enterprise** ($39/user/mo).
- Verified **students, teachers, and popular open-source maintainers** get **Copilot Pro** free (this is Pro, not "Free").

### The governance staircase (memorize this)

| Capability                                                                                                                                                                | Starts at                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Chat + completions, personal use, no org controls                                                                                                                         | **Pro / Pro+ (Individual)** |
| Seat/license management, org policy controls, usage reporting, **content exclusion**, **audit logs**, public-code filtering policy                                        | **Business**                |
| Enterprise-wide integrations, **GitHub.com repo-aware Chat**, reliance on org **SSO/IdP**, enterprise **proxy/network routing/allowlisting**, advanced compliance posture | **Enterprise**              |

Key clarifications the exam loves:

- **Audit logs are NOT Enterprise-only** — Business already surfaces Copilot events in the org audit log. Use **SSO + enterprise integrations + repo-aware Chat** to distinguish Enterprise from Business.
- **SSO is a GitHub Enterprise Cloud capability**, not a Copilot-plan feature. Copilot Enterprise _relies on_ the org's SSO; it doesn't "include" it.
- **Premium Support with SLAs** is a **separate paid** purchase — not bundled with any Copilot plan.
- **Copilot Enterprise is NOT free with GHEC** — it's a separate paid subscription; being a GHEC org means you're _eligible_ to buy it.
- **GHES (Enterprise Server) does NOT support Copilot** — Copilot is cloud-hosted; requires GitHub.com / GHEC.
- A **GitHub Enterprise Cloud 30-day trial includes Copilot Business** (not Enterprise) by default.

### Copilot surfaces for Chat

GitHub.com, VS Code, Visual Studio, JetBrains IDEs, Eclipse, Xcode, GitHub Mobile, **Windows Terminal**, and the standalone **GitHub Copilot desktop app**. **GitHub Desktop is a distractor** (it has Copilot _features_ like commit-message generation, but is not a full Chat surface).

### Capability ladder — control vs autonomy

| Capability                    | What it does                                                                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inline suggestions**        | Ghost text near cursor; accept with Tab/Enter. Accepting = **insert into editor buffer only** — not staged/committed/pushed/merged.                         |
| **Copilot Chat**              | Conversational Q&A: explain code, generate tests, debug errors, draft docs. Uses selection/file context.                                                    |
| **Copilot Edits – Edit mode** | **User-scoped diffs**: you pick files, review diffs, apply incrementally.                                                                                   |
| **Agent mode / coding agent** | **Autonomous, multi-step**: plans, edits multiple files, runs tools/tests, and **opens a PR**. Runs in an **ephemeral GitHub Actions–powered environment**. |

Coding agent facts:

- **Plan availability:** all **paid** plans — Pro, Pro+, Business, Enterprise. **NOT Copilot Free** (Free has _IDE agent mode_ but not the cloud/coding agent).
- **Good tasks:** well-scoped, non-critical, testable (UI component update across repo + run tests + PR; improve test coverage; small refactor with existing tests).
- **Bad tasks (keep human-owned):** brand-new architecture from scratch, **live production incidents involving PII / auth / security tradeoffs**, vague "rewrite everything."
- **Speed/reliability tip:** add a **`copilot-setup-steps.yml`** to pre-install dependencies in the agent's environment (don't disable tests, don't rely on local dev machines).
- In a **monorepo**, scope the task to specific **paths/packages** and request **reviewable per-package diffs** — task scoping is a safety control.
- Agent-opened PRs are reviewed like any other: inspect diffs, run tests, verify security/compliance. **No auto-merge**; branch protections still apply.

### What Copilot does / doesn't do for testing

- **Does:** generate test templates/scaffolds, suggest assertions & example inputs, support **TDD** (tests first), parameterized/table-driven tests, mocks/stubs, unit-test generation for selected code.
- **Does NOT:** **run your test framework automatically** or report pass/fail — that's your IDE/CLI/**CI** (GitHub Actions). Copilot doesn't guarantee coverage or correctness.

---

## Section 3 — Prompt Engineering (Domain 4)

Strong prompts pin down constraints; weak prompts are vague. Patterns to recognize:

| Goal                                        | Prompt must specify                                                                                                  |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **CI-ready / machine-consumable output**    | **format** (JSON/YAML/CSV) + **exact schema/field names** + **"no prose"** (optionally a tiny example object)        |
| **Secure secrets handling**                 | no hardcoding; read from env var / secrets manager; **fail-fast** if missing; **log-safe** (no secrets in logs)      |
| **Secure HTTP**                             | HTTPS; **validate TLS certs**; timeouts + retries; **backoff on 429/5xx**; redact secrets in logs                    |
| **Scoped refactor (avoid overbroad edits)** | name the **single function**; **keep public behavior**; list specific changes only                                   |
| **Migration plan before code**              | fixed **N-step plan** + **risks** + **rollback** + **backward-compatibility**; separate planning from implementation |
| **Configurable CLI**                        | language + library (e.g., `argparse`); flags + types + allowed values; validation; **exit codes**; usage examples    |
| **SQL**                                     | **dialect + version**; schema (tables/columns); time window; **exact output columns** + ordering                     |

**Copilot dev use cases** = code, docs/comments, tests, refactors, debugging, PR review help. **Off-scope distractor:** marketing slogans / non-technical advertising copy — NOT a Copilot developer use case.

---

## Section 4 — Developer Productivity & Testing (Domain 5)

- After Copilot generates tests → **review assertions/fixtures, add missing edge cases, run the suite and measure coverage.** Don't merge blindly, don't disable branch protection, don't delete-and-rewrite everything by hand.
- Best way to get **parameterized/table-driven tests**: **select the target function** and ask for them in your framework's idiom (e.g., `pytest.mark.parametrize`, JUnit `@MethodSource`).
- **Coverage & assertion quality remain human responsibilities** — Copilot is a starting point, not a guarantee. PR summaries don't replace real test-quality work.

---

## Section 5 — Privacy, Content Exclusions & Safeguards (Domain 6)

### Input control vs Output control — the master distinction

| Control                                     | Governs                                        | Key facts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Content exclusion**                       | **INPUTS** — what Copilot can _see_ as context | Repo admins, org owners, enterprise owners can **manage**; **Maintain role = view only**; outside collaborators = none. **Business & Enterprise** only. Targets: **repositories, paths/directories, file types, glob patterns**. Applies **across supported surfaces** (service-side enforcement), but **NOT supported** in Copilot **CLI**, **cloud agent**, or **Edit/Agent mode** of Chat in IDEs. Different from `.gitignore` (which controls what Git tracks). Does not delete files or rewrite history. |
| **Code referencing / matching-public-code** | **OUTPUTS** — what Copilot may _suggest_       | Checks a suggestion + ~**150 characters** of surrounding code against public GitHub code. Policy: **Block** (suppress the match) or **Allow + show references** (show suggestion with links to source repos + license). Configurable at **individual** and **org/enterprise** scopes.                                                                                                                                                                                                                         |
| **Duplication-detection filter**            | Long **exact** public-code matches             | Minimum window ≈ **150 characters**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Toxicity / safety filters**               | Harmful content                                | Hate speech + sexually explicit (input & output).                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

### Policy hierarchy

**Enterprise → Organization → Repository/User.** Higher scopes can only be made **stricter**, never weaker. If an enterprise **enforces** "Block matching public code," an org or repo **cannot** switch it to Allow. "Enforced" = hard ceiling; "default" = lower scopes may tighten.

### Where prompts are processed

Prompts + allowed context go to the **GitHub Copilot cloud service**, which relays to the selected model per GitHub's data pipeline. Org/enterprise policies (content exclusion, public-code filtering) limit what context is sent. In **Business/Enterprise**, private code, prompts, and completions are **not used to train the base models**.

### Secrets storage (Privacy & Security best practice)

Store keys in **Azure Key Vault / Managed HSM** with RBAC, rotation, encryption at rest/in transit, auditability — never plaintext, email, local shared files, or version control.

---

## Hard-Drill: The 3 Recurring Traps (force-correct these NOW)

### TRAP 1 — Fairness vs Transparency (missed 4× before Day 19)

> "Prevent discrimination / unbiased / representative training data / avoid bias / equitable outcomes" → **FAIRNESS**. Full stop.
>
> Transparency is only about **disclosure and explanation** (telling users AI is involved, explaining how it works and its limitations). If the stem is about **bias in data or outcomes**, it is **Fairness**, never Transparency. Kill the Transparency reflex.

### TRAP 2 — "Business is the baseline" plan-tier trap (missed 2× on Day 20)

> Org-admin policies, **content exclusion**, org-wide code-suggestion/matching policy, seat management, usage reporting, audit logs → **START at Copilot Business.**
>
> Only choose **Enterprise** when the stem explicitly says **"enforce across multiple orgs / enterprise-wide," SSO reliance, GitHub.com repo-aware Chat, or enterprise proxy/network controls.** Default to Business; escalate only on enterprise-scope keywords.

### TRAP 3 — CI-ready output prompt (repeat miss)

> A prompt that produces machine-consumable / CI-ready output must specify **format + exact schema (field names) + "no prose."**
>
> A JSON request that still allows an explanation, or omits field names, is weaker. The winning prompt locks the serialization format, names every field, and forbids prose.

---

## Cross-Domain Quiz Question Refreshers

Each assigned question's underlying concept + the trap it probes (no answer letters given).

| Q    | Domain | Concept it tests                                                | Trap / key fact to recall                                                                                                   |
| ---- | ------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| q010 | D1     | Accountability & human oversight                                | Oversight exists to **own outcomes and correct harmful results**, not to remove humans or guarantee bug-free code           |
| q023 | D2/D1  | Accountability + Privacy remediation (multi)                    | Remove PII **and** escalate/document/enforce consent policy + auditable record; "public/anonymized later" doesn't excuse it |
| q040 | D2     | Enterprise + Premium Support SLAs                               | Enterprise integrations/compliance; **SLAs are a separate paid purchase**, not bundled                                      |
| q041 | D2     | Business — usage reporting + policy, no enterprise integrations | Business is the org-governance baseline; no repo-aware Chat                                                                 |
| q051 | D6     | Who manages content exclusion (multi)                           | **Repo admins + org owners + enterprise owners**; Maintain = view-only; outside collaborators = none                        |
| q060 | D2     | Centralized seat/license management (multi)                     | Starts at **Business**, continues in Enterprise; Pro/Free = no central seats                                                |
| q098 | D2     | Inline vs Chat invocation                                       | Inline = accept near cursor; Chat = open panel + prompt (supports selections). Same trust level                             |
| q099 | D2     | Copilot generates unit tests                                    | Yes — via Chat/context prompts (`/tests`) for selected code                                                                 |
| q104 | D2     | Accepting an inline suggestion                                  | Inserts into editor buffer only — **not** auto-commit/merge/approve; no guaranteed audit entry                              |
| q124 | D4     | CI-ready output prompt                                          | **Format + schema + "no prose"** (see TRAP 3)                                                                               |
| q132 | D2     | Enterprise proxy + advanced compliance                          | Enterprise network routing/proxy/allowlisting → **Copilot Enterprise**                                                      |
| q135 | D2     | Edit mode vs Agent mode                                         | Edit = user-scoped diffs; Agent = autonomous multi-step, may culminate in a PR                                              |
| q136 | D6     | Duplication-detection minimum length                            | ≈ **150 characters** (not 50/500/1000)                                                                                      |
| q141 | D6     | Code referencing "Allow + show references"                      | Copilot may show the suggestion **with links to public sources**; filter & exclusion still apply                            |
| q148 | D2     | Multi-step changes + open a PR                                  | That's the **coding agent (Agent mode)** — not inline, exclusion, or code referencing                                       |
| q160 | D2     | Control which repos/code Copilot can access                     | Content exclusion / org control **starts at Business**                                                                      |
| q161 | D2     | Chat + completions, no org management                           | **Individual (Pro/Pro+)** — not Free (too limited), not Business/Enterprise                                                 |
| q177 | D5     | NOT a Copilot dev use case                                      | **Marketing slogans / non-technical copy** is off-scope                                                                     |
| q185 | D2/D5  | NOT a valid testing behavior                                    | Copilot does **not run test frameworks automatically**                                                                      |
| q194 | D2     | Appropriate coding-agent task                                   | Well-scoped repo-wide UI update + tests + PR; avoid architecture-from-scratch / live PII incidents / vague rewrites         |
| q196 | D2     | Coding agent plan availability                                  | Paid plans (**Pro, Pro+, Business, Enterprise**); **not Free**                                                              |
| q219 | D6     | Content exclusion across surfaces                               | It's a **service-side input boundary** across surfaces (note CLI/agent-mode exceptions)                                     |
| q226 | D5     | Next step after Copilot generates tests                         | **Review assertions/fixtures, add edge cases, run + measure coverage**                                                      |
| q230 | D5     | Generating parameterized/table-driven tests                     | Select target function + ask in your framework's idiom (`parametrize` / `@MethodSource`)                                    |
| q002 | D6     | Toxicity filter categories (multi)                              | **Sexually explicit + hate/discriminatory** — not logic errors or opinions                                                  |

---

## Quick Reference Card (last-glance before the quiz)

- **Fairness = bias/representative data.** Transparency = disclosure/limitations. Accountability = human ownership/escalation. Reliability&Safety = testing/unsafe output. Privacy&Security = data/consent/secrets. Inclusiveness = accessibility/languages.
- **Business baseline**: seats, policies, content exclusion, usage reporting, **audit logs**. **Enterprise adds**: repo-aware Chat, SSO reliance, enterprise proxy, multi-org governance.
- **Audit logs ≠ Enterprise-only.** **SSO = GHEC capability.** **Premium Support SLAs = separate purchase.** **Copilot Enterprise ≠ free with GHEC.** **GHES = no Copilot.**
- **Inline accept = insert only.** **Agent = ephemeral Actions env + PR.** **Coding agent = paid plans, not Free.**
- **Content exclusion = inputs** (Business/Enterprise; repo admin/org/enterprise owners manage; Maintain view-only). **Code referencing = outputs, ~150 chars, Block or Allow+references.**
- **Policy hierarchy: Enterprise-enforced wins; lower scopes can only be stricter.**
- **Copilot never auto-runs tests or auto-merges PRs.**
- **CI-ready prompt = format + schema + no prose.**

---

## Related Questions in questions.json

Assigned IDs (25): q132, q194, q010, q051, q160, q098, q002, q226, q177, q161, q219, q196, q185, q041, q104, q124, q135, q148, q230, q136, q099, q040, q023, q060, q141.

Run the mock (self-test, day-locked, no spoilers here):

```powershell
python quiz_runner.py questions.json --day-lock 21
```

Results save to `session-results.json` for review after you finish.

---

## Sources (verified during this session, 2026-07-28)

- [Content exclusion for GitHub Copilot — GitHub Docs](https://docs.github.com/copilot/concepts/context/content-exclusion)
- [Excluding content from GitHub Copilot (how-to, roles) — GitHub Docs](https://docs.github.com/copilot/managing-copilot/managing-github-copilot-in-your-organization/managing-github-copilot-features-in-your-organization/configuring-content-exclusions-for-github-copilot)
- [GitHub Copilot code referencing — GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/copilot/concepts/completions/code-referencing)
- [Introducing code referencing (~150 characters) — GitHub Blog](https://github.blog/news-insights/product-news/introducing-code-referencing-for-github-copilot/)
- [Managing Copilot policies as an individual subscriber (matching public code) — GitHub Docs](https://docs.github.com/en/copilot/how-tos/manage-your-account/manage-policies)
- [Plans for GitHub Copilot — GitHub Docs](https://docs.github.com/copilot/get-started/plans)
- [GitHub Copilot Plans & pricing — GitHub](https://github.com/features/copilot/plans)

---

## Notes (your own words — fill this in after the quiz)

_(After finishing, jot any question that tripped you up and why. Flag Fairness-vs-Transparency and Business-vs-Enterprise misses for spaced repetition.)_
