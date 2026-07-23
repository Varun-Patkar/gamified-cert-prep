# Day 15: Cross-Domain Consolidation — Responsible AI (D1) + Data & Architecture (D3) + Prompt Engineering (D4)

**Date**: 2026-07-23
**Domains**: D1 Responsible AI (15-20%), D3 Data & Architecture (10-15%), D4 Prompt Engineering (10-15%)
**Subtopics**: Six RAI principles & disambiguation, Copilot data pipeline / where prompts are processed, private-code/training guarantees, prompt-engineering patterns (context, scope, structure, plan→code, security/privacy prompts)
**Estimated study time**: ~1.5–2 hrs (19 cross-domain questions)

---

## TL;DR (60-second skim)

- **Six RAI principles only**: Fairness, Reliability & Safety, Privacy & Security, Inclusiveness, Transparency, Accountability. Anything else (e.g., "Maximizing Profit") is a distractor.
- **Transparency** = *disclosure/explanation* (users know AI is involved, know its limits/risks). This is the most-tested D1 principle today (q011, q013, q018, q022).
- **Privacy & Security** = *confidentiality, consent, data-use limits*. When privacy vs. fairness conflict, privacy wins — improve fairness with privacy-preserving methods (q024, q026).
- **Fairness + Inclusiveness** often appear together: Fairness = equitable outcomes / no bias; Inclusiveness = accessible to diverse people/languages/abilities (q021).
- **Copilot is a cloud-backed service**: prompts + allowed context leave the IDE, go to the **GitHub Copilot service**, which relays to the selected **AI model**. NOT local-only, NOT GHES-only, NOT CI-runner (q214 — prior weak area).
- **Private code, prompts, completions are NOT used to train Copilot's models** (Business/Enterprise and individual). Telemetry ≠ training (q065).
- **Flaky tests → fix the root cause** (mocks/fakes, deterministic fixtures, reduce timing sensitivity). Never mask with retries/timeouts/disabling (q232 — prior weak area).
- **Good prompts** = context + intent + constraints + examples + scope. Best refactor/explain/migration/logging prompts are the *most constrained, bounded* ones.

---

## Learning Objectives

After this session you should be able to:

1. Map a scenario stem to exactly one of the six Microsoft Responsible AI principles, and distinguish the commonly-confused pairs (Transparency vs. Accountability; Fairness vs. Inclusiveness; Privacy & Security vs. Reliability & Safety).
2. State precisely **where** Copilot processes prompts and context, and **what data is / is not** used for model training.
3. Recognize the "best prompt" among distractors by scoring signal density: context, scope, constraints, examples, output format, and behavior invariants.
4. Apply the plan→code, bounded-refactor, and secure/privacy-aware prompting patterns.

---

## Part 1 — Domain 1: Responsible AI (Principle Disambiguation)

### The Six Principles (memorize the trigger words)

| Principle | Core idea | Trigger words in the stem |
| --- | --- | --- |
| **Fairness** | Equitable outcomes, no systematic bias; representative data | bias, discrimination, representative datasets, similar people treated similarly, uneven performance across groups |
| **Reliability & Safety** | Predictable, robust, safe; tested before release; fails safely | testing, validation, risk assessment, **offensive/unsafe/harmful output**, robustness, guardrails |
| **Privacy & Security** | Confidentiality, data protection, consent, misuse prevention | confidentiality, personal data, consent, data-use limits, encryption, access control, leak prevention |
| **Inclusiveness** | Accessible & usable by diverse people/abilities/cultures/languages | accessibility, disabilities, diverse users, non-English, barrier removal, WCAG |
| **Transparency** | Users understand how it works, its **limitations & risks**; disclose AI involvement | disclosure, explanation, "inform users", limitations, risks, model card, "know AI is assisting" |
| **Accountability** | Humans/orgs answerable; governance, oversight, escalation | ownership, oversight, governance, escalation, audit, "who is responsible", human-in-the-loop |

> Not a principle: **Maximizing Profit** (or any business/financial goal), "open-source code", "never malfunction". These are distractors. (q005)

### Deep disambiguation — the traps this quiz targets

**Transparency (4 of today's D1 questions test this — highest weight):**
- Requires **proactively informing users** when AI makes/affects decisions (q011).
- Requires **communicating limitations and potential risks** so people don't over-rely (q013).
- Applies to disclosing that **Copilot is generating suggestions** in the IDE (q018).
- Transparency *documentation* = publish how the system works, intended use, known limitations, high-level data sources & validation — **while protecting sensitive/proprietary data** (q022). It does **not** mean dumping personal data, all source, or full training sets. Transparency *enables* Accountability/audits.
- Distinguish from **Accountability** (human responsibility/ownership) and **Privacy & Security** (protecting data). Disclosure = Transparency; protecting data = Privacy.

**Privacy & Security (q024, q026):**
- Confidentiality of personal info + prevent misuse of data (q026).
- **Consent & data-use limits scenario (q024):** When a proposal to add sensitive attributes to training data would *exceed user consent*, **Privacy & Security takes precedence over Fairness**. Product fact: with Copilot **Business/Enterprise, private repos, prompts, and completions are NOT used to retrain base models**. Improve fairness via **synthetic / privacy-preserving** techniques that respect consent — never by expanding sensitive-attribute collection.

**Fairness + Inclusiveness together (q021):**
- Two symptoms → two principles: (a) Copilot works better for English than non-English → language parity = **Fairness + Inclusiveness**; (b) auto-assignment overloads a few developers → uneven outcomes = **Fairness**. Correct approach = *systemic fixes*: expand non-English training data, test parity across languages, rebalance assignment logic. Documentation-only (Transparency) or manual-fix-only (Accountability) do **not** correct the unequal outcomes.

**Reliability & Safety (prior weak area from q027):**
- **Offensive/unsafe/harmful content = Reliability & Safety** (not Transparency, not Inclusiveness). Mitigate with pre-deployment evaluation, safety guardrails, content filters, live monitoring.

### D1 quick decision flow

```
Is the stem about... 
  data protection / consent / confidentiality?        → Privacy & Security
  bias / representative data / equitable outcomes?     → Fairness
  accessibility / diverse users / non-English?         → Inclusiveness
  disclosure / explaining limits / "inform users"?     → Transparency
  harmful/unsafe output / testing / robustness?        → Reliability & Safety
  ownership / governance / escalation / audit?         → Accountability
```

---

## Part 2 — Domain 3: Data & Architecture

### Where are Copilot prompts & context processed? (q214 — PRIOR WEAK AREA)

**The documented pipeline:**

```
IDE / GitHub.com client
   │  (prompt + allowed context, shaped by content exclusion + org/enterprise policy)
   ▼
GitHub Copilot cloud service   ← content filtering, public-code match check, policy enforcement
   │
   ▼
Selected AI model (OpenAI / Anthropic / Google / etc., hosted on GitHub's Azure infra & provider clouds)
   │
   ▼
Suggestion returned to client
```

- **Correct:** prompts and allowed context are processed **in the GitHub Copilot (cloud) service, which relays requests to the selected AI model**.
- **Wrong distractors to reject:**
  - "Only on the local IDE; nothing leaves the machine" ❌ (Copilot is cloud-backed).
  - "On GitHub Enterprise Server only, no Copilot cloud service" ❌.
  - "Inside your CI runners, stored as part of builds" ❌.
- **Governance levers on the input side:** *content exclusion* controls which repos/paths can be sent as context; *code referencing / duplication detection* governs what can be suggested on the output side; org/enterprise **policies** gate features.
- **Data commitments (grounding):** GitHub maintains **zero data retention** agreements with model providers; providers do not train on customer business data; all input/output passes through Copilot's content-filtering systems (public-code match + harmful-content blocking).

### Does Copilot train on your private code? (q065)

- **No.** Your **private code, prompts, and completions are not used to train Copilot's AI models** — this holds for Business/Enterprise *and* individual plans.
- **Telemetry ≠ training.** Product telemetry/metrics summarize activity and are governed by separate data-handling/retention practices; they are not code contents fed into model learning.
- Distractor patterns to reject: "Yes, always", "Yes unless you disable telemetry", "Only for Enterprise". All false.

### Why context matters in prompts (q110)

- Copilot does **contextual prediction, not execution**. It conditions on your **prompt + current file + surrounding code** (and allowed context like chat history / repo index).
- Richer, closer context → more relevant, accurate suggestions. Work from a selection or the right open file; include interfaces, types, data shapes, and non-obvious constraints.
- Exam cue: prefer answers mentioning **nearby code / selections / file context** over "ask Copilot from scratch with no context." Reject "slows responses / prevents completions / reduces security."

### Flaky tests after accepting Copilot's suggestions (q232 — PRIOR WEAK AREA)

- **Correct next step:** *stabilize at the root* — isolate external dependencies with **mocks/fakes**, add **deterministic fixtures**, minimize timing sensitivity.
- **Wrong (symptom-masking) distractors:** increase global timeouts / add blanket retries; disable flaky tests to keep CI green; rerun CI until it passes once then merge. A flaky test is a **quality problem**, not a signal to weaken the suite.

---

## Part 3 — Domain 4: Prompt Engineering & Context Crafting

### GitHub's official prompt-engineering strategies (grounding)

From GitHub Docs "Prompt engineering for Copilot Chat":
1. **Start general, then get specific** — broad goal first, then specific requirements.
2. **Give examples** — input/output/implementation examples; unit tests can serve as examples.
3. **Break complex tasks into simpler tasks** — decompose; plan → code.
4. **Avoid ambiguity** — add project context, clear goals, specific requirements.
5. **Indicate relevant code** — open the right file / select the relevant code.
6. **Experiment and iterate** — refine when suggestions drift.
7. **Keep history relevant** — remove stale chat context.
8. **Follow good coding practices** — consistent style, meaningful names, tests.

### The scoring heuristic for "which prompt is best?"

Best prompt = **highest signal density**: names *Language + Action + Object + Constraint*, defines *scope*, sets *behavior invariants* (what must NOT change), specifies *output format*, and lists *edge cases*. Vague "improve this / make it cleaner / rewrite completely / write tests" answers are almost always wrong.

### Pattern-by-pattern (mapped to today's questions)

| Scenario | Winning pattern | Question |
| --- | --- | --- |
| Primary benefit of prompt engineering | Improves **clarity & specificity → better, more relevant suggestions**. It does NOT change policy (duplication detection, code referencing, exclusions still apply); does NOT reduce CPU or guarantee licensing. | q068 |
| Irrelevant suggestions | **Refine/rephrase with more context & clearer intent** (add selection/file, inputs/outputs, language, constraints). Not "stop using", not "shorter prompts", not "disable duplication detection". | q111 |
| Refactor | Bound it: "**Refactor to pure functions; no side effects; keep same public API; add docstrings; return early on invalid input.**" Name what changes (structure) and what must NOT (contract/behavior). | q117 |
| Reduce overbroad refactors in large files | **Scope to one named symbol**: "Modify only function `parseHeader`; keep public behavior; add bounds checks; return detailed errors." Smaller edit surface + explicit invariants = safer. | q126 |
| Explain a file to a new teammate | Fix **audience + sections + length**: "Explain for a new backend hire: purpose, key data flows, external dependencies, risks; 5 bullets max." Beats open-ended "explain in detail / no length limit". | q122 |
| Migration plan before code | **Plan→code**, bounded, with risks & rollback & compatibility: "Create a 5-step plan to migrate Flask → FastAPI; list risks, roll-back steps, keep routes backward-compatible." Separate planning from implementation. | q125 |
| Privacy-aware logging | Structure + schema + redaction: "Add structured JSON logs: level, event, requestId; no PII; redact tokens; include error stack; single line per event." Reject "log full request/response", "include tokens in debug", "filter later". | q131 |

### Reusable prompt templates

- **Refactor (safe):** `Edit only <symbol>; keep public API & behavior; existing tests must pass; apply: <specific changes>.`
- **Explain (onboarding):** `Explain <file> for <audience>: <sections>; <length cap>.`
- **Plan→code:** `Create an N-step plan to <goal>; list risks, rollback, compatibility. Then stop — I'll ask you to implement step 1.`
- **Secure/privacy:** `... no hardcoded secrets (use env/secret store); validate input; redact tokens/PII in logs; handle errors explicitly.`

---

## Common Traps & Misconceptions

- **Transparency vs. Accountability:** "inform users / explain limitations" = Transparency. "who is answerable / oversight / escalation" = Accountability.
- **Privacy vs. Reliability & Safety:** protecting *data* = Privacy & Security. Preventing *harmful/unsafe output* = Reliability & Safety.
- **Fairness vs. Inclusiveness:** *equitable outcomes / bias* = Fairness. *accessible to diverse users / abilities / languages* = Inclusiveness. Language-parity scenarios often need BOTH.
- **"Nothing leaves my machine"** is wrong — Copilot is a cloud service (q214).
- **"Copilot trains on my private code"** is wrong; telemetry ≠ training (q065).
- **Flaky tests:** never mask with retries/timeouts/disable — fix at root (q232).
- **Prompt engineering does NOT change policy** — duplication detection, code referencing, content/context exclusions still apply (q068).
- **Best-prompt questions:** the winner is the *most constrained/bounded* option; "improve this / rewrite completely / write tests" are distractors.

---

## Cross-Domain Quiz Question Refreshers

All 19 assigned questions live within the D1/D3/D4 focus, but several bridge into adjacent domains (D5 testing, D6 privacy/config). Quick refreshers:

| Concept | Key fact | Trap |
| --- | --- | --- |
| Private code & training (q024, q065) | Business/Enterprise + individual: private code/prompts/completions not used to train base models | Bridges D1↔D3↔D6; "Enterprise-only" or "unless telemetry disabled" are false |
| Flaky tests (q232) | Root-cause fix: mocks/fakes + deterministic fixtures | Bridges D3↔D5; masking (retries/timeouts/disable) is wrong |
| Content exclusion vs. code referencing (q214 context) | Exclusion controls *input* context; code referencing/duplication detection controls *output* matches | D3↔D6; don't conflate input governance with output governance |
| Secure/privacy prompting (q131) | Security & privacy are *promptable, not automatic*: state "no PII, redact tokens, no hardcoded secrets" | D4↔D6; Copilot won't add safety unless asked |
| Prompt engineering ≠ policy change (q068) | Better prompts raise quality only; policies (dup detection, referencing, exclusions) unaffected | D4↔D6; "guarantees license-compliant output" is false |

---

## Quick Reference Card

- **6 principles:** Fairness · Reliability & Safety · Privacy & Security · Inclusiveness · Transparency · Accountability.
- **Pipeline:** IDE → **Copilot cloud service** (filters + policy) → **AI model** → back. Zero data retention with providers.
- **Training:** private code/prompts/completions **NOT** used to train models. Telemetry ≠ training.
- **Flaky tests:** mocks + deterministic fixtures (root cause).
- **Prompt scoring:** context + scope + constraints + examples + output format + behavior invariants. Bounded > vague.
- **8 prompt strategies:** general→specific, give examples, break down tasks, avoid ambiguity, indicate relevant code, iterate, keep history relevant, good coding practices.

---

## Hands-On Lab (optional bonus)

Take one vague prompt and rewrite it four ways applying today's patterns:
1. `"clean up this parser"` → bounded single-symbol refactor prompt (q126 pattern).
2. `"explain this file"` → audience + sections + length-capped prompt (q122 pattern).
3. `"migrate to FastAPI"` → 5-step plan→code with risks/rollback (q125 pattern).
4. `"add logging"` → structured JSON, no-PII, redact-tokens prompt (q131 pattern).

Compare Copilot's outputs for the vague vs. bounded versions in your IDE — notice how scope and constraints collapse the ambiguity.

---

## Related Questions in questions.json (assigned to Day 15)

- **D1 (8):** q005, q011, q013, q018, q021, q022, q024, q026
- **D3 (4):** q065, q110, q214, q232
- **D4 (7):** q068, q111, q117, q122, q125, q126, q131

Quiz command (run from inside `GH-300 Prep`):

```powershell
python quiz_runner.py questions.json --day-lock 15
```

---

## Sources (verified during this session, 2026-07-23)

- [What is Responsible AI — Azure Machine Learning](https://learn.microsoft.com/en-us/azure/machine-learning/concept-responsible-ai) (six principles)
- [Apply responsible AI — Microsoft Learn](https://learn.microsoft.com/en-us/agents/center-of-excellence/responsible-ai) (principle definitions)
- [Responsible AI for agent design — Microsoft Learn](https://learn.microsoft.com/en-us/agents/design-guidelines/responsible-ai)
- [Hosting of models for GitHub Copilot — GitHub Docs](https://docs.github.com/copilot/reference/ai-models/how-copilot-serves-ai-models) (cloud service, model hosting, zero data retention, content filtering)
- [Prompt engineering for GitHub Copilot Chat — GitHub Docs](https://docs.github.com/en/copilot/concepts/prompting/prompt-engineering) (8 strategies)
- [Best practices for using GitHub Copilot — GitHub Docs](https://docs.github.com/en/copilot/get-started/best-practices)
- [About customizing GitHub Copilot responses — GitHub Docs](https://docs.github.com/en/copilot/concepts/prompting/response-customization)

---

## Notes (your own words — fill this in after studying)

_(Leave space for the user to add their own notes after going through it.)_
