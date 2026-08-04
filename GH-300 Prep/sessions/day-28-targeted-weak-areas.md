# Day 28: Phase 4 — Targeted Weak-Area Final Revision

**Date**: 2026-08-05
**Domain focus**: D6 Configure Privacy, Content Exclusions & Safeguards (10–15%, your weakest at 87.7%) + D2 plan-tier / three-control questions
**Type**: Targeted weak-area drill — NO day-lock (dayTargets["28"] = 0). Built around your actual repeat-miss patterns.
**Estimated study time**: ~1.5 hrs (read this file → run the ~25-question drill → review misses)

---

## TL;DR (60-second skim)

- **The Business vs Enterprise rule is DIRECTIONAL, not "always Business."** Default to **Business** for org admin/policy/audit/content-exclusion/seat/license stems. Pick **Enterprise ONLY** when the stem explicitly adds GHEC-scoped needs: **codebase-aware Chat on GitHub.com**, **PR summaries**, **knowledge bases**, **cross-org policy enforcement**, or advanced compliance/identity that names GitHub Enterprise Cloud. You have missed this **both ways** — don't over-correct.
- **Three controls are three different things:** Content exclusion = **INPUT** (what Copilot may read). Code referencing / "suggestions matching public code" = **OUTPUT shown WITH references** (similar match, ~150 chars). Duplication detection = the **block** side of that same filter (license-**blind**, length-based).
- **Content exclusion = Business/Enterprise only.** Configured in **Settings → Copilot → Content exclusion** at repo/org/enterprise level. Uses **fnmatch** paths, one per line, `#` comments. **There is NO `.copilotignore` file** — that is a wrong-answer trap.
- **Data/training:** Free/Pro/Pro+ interaction data _may_ train models (**opt-out** available). **Business/Enterprise = contractually excluded, no user action.** Private repo code **at rest is never used** on any plan.
- **Plan identity:** verified **students/teachers/OSS maintainers → Copilot Pro (free)**, NOT Copilot Free. Copilot is **cloud-only** — **not supported on GHES**; needs GitHub.com or GHEC.
- **Responsible AI:** "bias / representative training data / equitable outputs" = **Fairness**. "Explainability / know it's AI / disclosed limitations" = **Transparency**. "Works for all users/abilities" = **Inclusiveness**.
- **Read all four options fully before answering.** Your accuracy is measurably highest when you don't skim — the wrong answer is usually a _plausible-looking near-miss_.

---

## Learning Objectives

After this session you can, without hesitation:

1. Decide Business vs Enterprise from stem keywords in **both** directions.
2. Separate content exclusion vs code referencing vs duplication detection by input/output, exact/similar, and license-aware/license-blind.
3. State exactly where and how content exclusion is configured (and what it does NOT support).
4. State the training/telemetry/retention guarantees per plan tier.
5. Map any responsible-AI stem to the correct principle instantly.

---

## 1. Directional Business vs Enterprise — the #1 repeat trap

This single decision has cost you the most points across mocks — and you've erred in **both** directions:

- Picked **Enterprise when answer was Business**: q160, q165, q169, q139.
- Over-corrected to **Business when answer was Enterprise**: q053, q050.

So the fix is NOT "always pick Business." It's: **read the stem for the specific capability being asked, then map it.**

### Decision table — which keywords push which way

| If the stem is really asking about…                                               | Answer         | Why                                                                  |
| --------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------- |
| Org **admin controls**, **policy** management, **audit logs** of Copilot usage    | **Business**   | Baseline org governance — Business already has it                    |
| **Content exclusion** (which files/repos Copilot may read)                        | **Business**   | Available on Business **and** Enterprise → the _minimum_ is Business |
| **Seat / license management**, centralized billing, assign/revoke seats           | **Business**   | Org seat management is a Business feature                            |
| Blocking **suggestions matching public code** org-wide, no-training guarantee     | **Business**   | Policy + contractual no-train are Business-level                     |
| Restricting **which repos/code** Copilot can access at org scope                  | **Business**   | Org policy control                                                   |
| **Copilot Chat that knows your org's private codebase** (semantic index of repos) | **Enterprise** | Codebase-aware Chat is Enterprise-only                               |
| **Copilot on GitHub.com** with repo-aware answers, **knowledge bases / Spaces**   | **Enterprise** | GitHub.com Chat grounded in your repos = Enterprise                  |
| **PR summaries / PR review by Copilot**, Copilot Autofix positioning              | **Enterprise** | PR summarization is Enterprise-only                                  |
| **Cross-organization** policy enforcement across an **enterprise account** (GHEC) | **Enterprise** | Enterprise-wide inheritance across many orgs                         |
| **Fine-tuned model on your org's code**                                           | **Enterprise** | Enterprise (preview) capability                                      |

### The mental rule

> Default to **Business** for _governance / control / exclusion / seats / audit_.
> Escalate to **Enterprise** ONLY when the stem **names** GHEC OR asks for **codebase-aware Chat, GitHub.com repo-aware answers, PR summaries, knowledge bases, cross-org enforcement, or fine-tuned models**.
> If Business already satisfies the requirement, Business is correct — do NOT upsell to Enterprise just because "enterprise" sounds bigger. That's the exact trap in q160/q165/q169/q139.
> Conversely, if the stem clearly needs codebase-aware Chat / PR summaries / cross-org (q053, q050), Business is a trap — pick Enterprise.

**Facts to anchor it (2026):** Business **$19**/user/mo, Enterprise **$39**/user/mo and **requires an active GitHub Enterprise Cloud subscription**. Enterprise = "everything in Business **plus** codebase awareness + GitHub.com Chat + PR summaries + knowledge bases + governance depth."

---

## 2. The three-control split (D6/D2 recurring miss — q140, q145, q150)

These three get deliberately blended in question stems. Keep them in separate mental boxes.

| Control                                                                    | Side       | What it does                                                                                                                                           | Exact vs similar                                  | License-aware?                                                               | Plan                                  |
| -------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------- |
| **Content exclusion**                                                      | **INPUT**  | Stops Copilot **reading** specified files/repos → no inline suggestions in them, they don't inform other suggestions/Chat, not reviewed in code review | n/a                                               | n/a                                                                          | Business/Enterprise only              |
| **Code referencing** ("suggestions matching public code" = **Allow**)      | **OUTPUT** | When a suggestion **matches public code**, it is **shown WITH references** — repo URLs + license info so you can attribute/decide                      | **Similar** match (~150 char surrounding context) | **Yes** — surfaces license/source                                            | All plans (policy-managed on org/ent) |
| **Duplication detection** ("suggestions matching public code" = **Block**) | **OUTPUT** | **Blocks/discards** a suggestion that matches public code (the same ~150-char filter, set to Block)                                                    | **Exact / near-exact** long match                 | **No — license-blind.** Pure length/text match; does **no license analysis** | All plans (policy-managed)            |

### Nail these distinctions

- **Input vs output:** Content exclusion = _what goes in_. Code referencing & duplication = _what comes out_.
- **Similar vs exact:** Code referencing surfaces _similar/matching_ code with attribution. Duplication detection **blocks** the _exact/long_ (~150+ char) match.
- **License-aware vs license-blind:** Code referencing **tells you the license**. Duplication detection **does NOT analyze licenses at all** — it just checks whether text matches public code and blocks it. If a question says "blocks based on license type," that's **wrong** — it's length/text-based.
- **Same underlying filter, two settings:** "Suggestions matching public code" = **Allow** → code referencing view; **Block** → duplication is filtered out. IP indemnity (Business/Enterprise) requires the filter set to **Block/enabled**.
- **Only accepted, unaltered suggestions are checked** for matches. Code you wrote or edited is not checked. Matches happen in **<1%** of suggestions.

---

## 3. D6 deep-dive — Privacy, Content Exclusions & Safeguards (your weakest domain)

### 3.1 Content exclusion — scope & configuration

- **Who can set it:** Repository admins (their repo), Organization owners (seats their org assigned), Enterprise owners (all users in the enterprise). "Maintain" role can **view but not edit**.
- **Where:** **Settings → Copilot → Content exclusion** (repo, org, or enterprise settings). **NOT** a file in the repo.
- **Format:** paths one per line, `#` for comments, **fnmatch** glob patterns (e.g., `**/*.env`, `secrets/**`).
- **⚠️ TRAP:** There is **no `.copilotignore` file**. Some third-party blogs claim one exists — it does **not**. Exclusion is settings-based only.
- **The three levels combine (union):** a file excluded at **any** level is excluded for all applicable users. Org-level is the **only** level that can also exclude **local files not under Git control**.
- **Effect of exclusion:** no inline suggestions in the file; the file's content won't inform suggestions in **other** files; won't inform **Chat** responses; won't be reviewed in **Copilot code review**.
- **NOT supported by:** **Copilot CLI**, **Copilot cloud/coding agent**, and **Agent mode / Edit mode of Copilot Chat in IDEs**. (These can still see excluded files — key limitation.)
- **Limitation:** semantic info from an excluded file _may_ still surface if provided via another (non-excluded) path/context. Exclusion is best-effort context blocking, not an airtight secret store — **still don't put real secrets in code.**
- **Plan gate:** **Business or Enterprise only.** Not available on Free/Pro/Pro+.

### 3.2 Telemetry / training / data retention (per plan)

| Dimension                          | Free / Pro / Pro+                                                              | Business                            | Enterprise                          |
| ---------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------- | ----------------------------------- |
| Interaction data used for training | **Yes unless you opt out** (personal settings; opt-out default since Apr 2026) | **No — contractually excluded**     | **No — contractually excluded**     |
| Private repo code **at rest**      | Never used                                                                     | Never used                          | Never used                          |
| Content exclusions                 | ❌ Not available                                                               | ✅ Repo + Org level                 | ✅ Enterprise-wide inheritance      |
| IP indemnity                       | ❌                                                                             | ✅ (with duplication filter **on**) | ✅ (with duplication filter **on**) |
| Admin / policy controls            | Individual only                                                                | Org-level policies                  | Enterprise-wide policy inheritance  |

- **Opt-out lever (individual):** personal privacy setting "Allow GitHub to use my data for product improvements / model training." **User-level** on individual plans.
- **Org-level:** admins set policy; Business/Enterprise contractually **never** train on interaction data — no per-user opt-out needed.
- **Interaction data** = prompts/inputs, outputs (and accept/reject), surrounding code context, metadata (file names, repo structure, navigation), and thumbs-up/down feedback.

### 3.3 GHES non-support (identity trap)

- **Copilot is cloud-only.** It requires **GitHub.com** or **GitHub Enterprise Cloud (GHEC)**.
- **Copilot is NOT supported on GitHub Enterprise Server (GHES)** — self-hosted/on-prem GHES cannot run Copilot. If a stem says "on-prem / air-gapped / GHES," Copilot **can't be deployed there**.

### 3.4 Plan-identity facts

- **Copilot Free** — individuals with no org/enterprise access; limited completions & chat, auto model selection only.
- **Copilot Pro** — paid individual; **verified students, teachers, and popular OSS maintainers get Pro for FREE** (not "Copilot Free"). Watch this exact swap.
- **Copilot Pro+ / Max** — higher AI-credit allowances, premium/priority model access.
- **Business $19** / **Enterprise $39** (Enterprise needs GHEC).
- **Toxicity / content filters** (input + output) block **sexual content** and **hate speech/discriminatory language** — they do **not** fix logic errors or filter "opinions," and are **separate** from content exclusion and license/duplication policy.

---

## 4. Responsible AI — Fairness vs Transparency vs Inclusiveness

| Principle                | Trigger words in the stem                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| **Fairness**             | bias, representative/diverse **training data**, equitable outputs, no group disadvantaged    |
| **Transparency**         | explainability, disclose it's **AI**, communicate limitations, users understand how it works |
| **Inclusiveness**        | works for people of **all abilities/backgrounds**, accessibility, empower everyone           |
| **Reliability & Safety** | consistent, safe under expected conditions, handles edge cases, human oversight              |
| **Privacy & Security**   | protect data, secure handling, content exclusion, no unauthorized data use                   |
| **Accountability**       | humans responsible/answerable for the system's outcomes, governance ownership                |

⚠️ Your specific miss: **"bias / representative data" → Fairness** (not Transparency). Transparency is about _disclosure/explainability_, not about balanced data.

---

## 5. Exam-day drills (your specific repeat-miss patterns)

Drill these until reflexive:

1. **"Org needs audit logs / policy / content exclusion / seat mgmt"** → **Business**. Don't jump to Enterprise (q160/q165/q169/q139).
2. **"Copilot Chat that understands our private codebase / PR summaries / knowledge base / GitHub.com repo-aware / cross-org"** → **Enterprise** (q053/q050). Don't downgrade to Business.
3. **"Blocks exact long match to public code, no license check"** → **Duplication detection** (license-blind). (q140/q145/q150)
4. **"Shows matching code with source repo + license so I can attribute"** → **Code referencing** (Allow).
5. **"Stops Copilot reading these files"** → **Content exclusion** (input side, Business/Ent, settings-based, no `.copilotignore`).
6. **"Students/teachers/OSS maintainers get free Copilot"** → **Copilot Pro**, not Free.
7. **"On-prem / GHES"** → Copilot **not supported** (cloud-only).
8. **"Representative training data / bias"** → **Fairness**.
9. **Duplication/content-exclusion NOT working in CLI or Agent mode?** → correct: those features **aren't supported** in CLI / cloud agent / Agent+Edit chat modes.

---

## 6. Read-every-option discipline (your own insight)

Your logged data shows accuracy is **highest when you read all four options fully** before answering. The GH-300 distractors are engineered to look right at a glance:

- One option is the _correct-adjacent_ tier (Business↔Enterprise).
- One swaps _input↔output_ (content exclusion vs duplication).
- One flips _license-aware↔license-blind_.
- One uses a real feature name for the wrong scenario.

**Protocol per question:** (1) read the full stem, underline the _actual capability asked_; (2) read **all four** options; (3) eliminate the two near-misses by naming _why_ they're wrong; (4) confirm the survivor matches the stem's exact scope. Don't lock in on the first plausible option.

---

## Quiz command (run from inside the `GH-300 Prep` folder)

Day 28 has **no day-lock** (`dayTargets["28"] = 0`), so this is a weak-area targeted drill.

**Primary — the weak domain (D6, 27 questions ≈ your ~25 target):**

```powershell
python quiz_runner.py questions.json --domain 6 --shuffle
```

**Optional blended run — D6 + D2 plan-tier / three-control questions, capped at 25:**

```powershell
python quiz_runner.py questions.json --cross 6,2 --shuffle --limit 25
```

Verified flags (from `quiz_runner.py`): `--domain`, `--cross a,b`, `--limit N`, `--shuffle`, `--ids q001,q002`. Results save to `session-results.json`.

> **NO-SPOILER policy:** self-administer in the terminal. I will **not** reveal answers until your results are saved. Ping me when done (or mid-read if a concept is fuzzy) and I'll review your misses.

---

## Sources (verified 2026-08-04)

- [Plans for GitHub Copilot — GitHub Docs](https://docs.github.com/copilot/about-github-copilot/subscription-plans-for-github-copilot)
- [Choosing your enterprise's plan for GitHub Copilot — GitHub Docs](https://docs.github.com/copilot/get-started/choose-enterprise-plan)
- [Content exclusion for GitHub Copilot (concept) — GitHub Docs](https://docs.github.com/en/copilot/concepts/context/content-exclusion)
- [Excluding content from GitHub Copilot (how-to) — GitHub Docs](https://docs.github.com/copilot/managing-copilot/managing-github-copilot-in-your-organization/managing-github-copilot-features-in-your-organization/configuring-content-exclusions-for-github-copilot)
- [GitHub Copilot code referencing — GitHub Docs](https://docs.github.com/copilot/concepts/completions/code-referencing)
- [Introducing code referencing for GitHub Copilot — The GitHub Blog (150-char filter)](https://github.blog/news-insights/product-news/introducing-code-referencing-for-github-copilot/)
- [Managing Copilot policies as an individual subscriber — GitHub Docs](https://docs.github.com/en/copilot/how-tos/manage-your-account/manage-policies)
- [GitHub Copilot Privacy: Safeguards & Troubleshooting — DataCamp](https://www.datacamp.com/blog/github-copilot-privacy-and-troubleshooting)

---

## Notes (your own words — fill in after the drill)

_(Jot the exact stem wording of any Business/Enterprise or three-control miss here, plus which of the 4-option traps fooled you.)_
