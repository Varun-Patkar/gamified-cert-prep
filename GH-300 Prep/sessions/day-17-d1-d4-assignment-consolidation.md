# Day 17: D1 + D4 Assignment Consolidation

**Date**: 2026-07-25
**Exam**: GH-300 GitHub Copilot
**Domains**: D1 Responsible AI (15-20%), D4 Prompt Engineering (10-15%), D3 Data and Architecture (10-15%)
**Assigned questions**: 19
**Estimated study time**: 2 hours

---

## Important: Plan vs. Assignment Mismatch

The local `plan.md` labels Day 17 as **D2 Deep Review**. That label does **not** match the locked data in `day-assignments.json`, which is the source of truth for the quiz.

The actual Day 17 assignment is:

- **D1 Responsible AI (11 questions)**: principle identification, human oversight, safety filters.
- **D4 Prompt Engineering (7 questions)**: crafting precise, bounded, verifiable prompts.
- **D3 Data and Architecture (1 question)**: private-code training and telemetry boundaries.

Strict quiz alignment takes precedence. This session therefore teaches the actual D1/D4/D3 assignment rather than a D2 feature review. (This is the same plan/label mismatch seen on Day 16.)

The exact assigned IDs are:

`q015`, `q116`, `q129`, `q004`, `q074`, `q106`, `q007`, `q215`, `q113`, `q008`, `q127`, `q010`, `q016`, `q017`, `q019`, `q119`, `q003`, `q009`, `q109`.

---

## Session Goals

By the end of this session, you should be able to:

- Map a scenario to the single most-direct Microsoft Responsible AI principle.
- Distinguish Accountability from Transparency, and Fairness from Inclusiveness.
- Explain why Reliability and Safety owns pre-deployment risk assessment and testing.
- Describe what Copilot content-safety filters block — and what they do **not**.
- State whether private code is used to train shared Copilot models by default.
- Turn a vague coding request into a grounded, constrained, verifiable prompt.
- Explain why few-shot examples and explicit output shape improve results.

---

## TL;DR (60-Second Skim)

- Six principles: **Fairness, Reliability and Safety, Privacy and Security, Inclusiveness, Transparency, Accountability**.
- **Accountability** = humans/orgs stay answerable; governance, oversight, escalation, human override.
- **Reliability and Safety** = dependable, tested, validated behavior; owns pre-deployment risk assessment.
- **Fairness** = equitable treatment/outcomes; representative data; bias measurement and mitigation.
- **Inclusiveness** = everyone can access and participate (abilities, cultures, languages).
- **Transparency** = people understand AI involvement, basis, and limitations.
- **Safety filters** block harmful categories (hate/discrimination, sexually explicit) — **not** logic errors or style.
- **Private code is not used to train shared models by default** (Business/Enterprise); training ≠ telemetry.
- **Good prompts** fix language, task, method/constraints, output shape, and acceptance criteria; **examples** show the target pattern.

---

## 1. Responsible AI Principle Decision Table (D1)

| Principle | Core question | Strong stem signals | Do not confuse with |
| --------- | ------------- | ------------------- | ------------------- |
| Fairness | Are comparable people treated equitably? | bias, discrimination, unrepresentative data, unequal outcomes | Inclusiveness (access/participation) |
| Reliability and Safety | Does it behave dependably and avoid harm? | testing, validation, pre-deployment risk, robustness, unsafe output | Privacy and Security (data exposure) |
| Privacy and Security | Is sensitive data protected? | personal data, secrets, consent, unauthorized access, leakage | Reliability and Safety (dependable operation) |
| Inclusiveness | Can the full range of users participate? | disability, accessibility, cultures, languages, assistive tech | Fairness (equitable outcomes) |
| Transparency | Can people understand the AI's involvement/basis/limits? | disclosure, explanation, opacity, known limitations | Accountability (ownership) |
| Accountability | Is a person/org answerable? | human oversight, sign-off, governance, escalation, remediation, override | Transparency (understandability) |

### Key exam traps embedded in today's assignment

- **Pre-deployment risk assessment / testing before release → Reliability and Safety** (q004, q015, q017). Even though governance sounds like Accountability, the *testing and validation* action is Reliability and Safety.
- **Humans remain answerable / human oversight to intervene → Accountability** (q003, q010, q016). The cue is *who is responsible* and *who can intervene*, not *how it is tested*.
- **Biased or unrepresentative training data → Fairness** (q009, q019). Representative datasets and bias mitigation are Fairness controls.
- **Accessible and usable across abilities/cultures → Inclusiveness** (q007).
- **Making AI operation understandable to stakeholders → Transparency** (q008).

### Accountability vs. Reliability and Safety (today's most likely confusion)

| If the scenario emphasizes... | Choose |
| ----------------------------- | ------ |
| Testing, validation, risk mitigation *before deploy* | Reliability and Safety |
| A named human/org owning the outcome and able to intervene | Accountability |

Both can appear together (governance *processes*), but pick the principle that matches the **primary action** in the stem.

## 2. Copilot Content-Safety Filters (q074)

Copilot requests and responses pass through **content-safety filters** that block **harmful categories**:

- ✅ Blocked: **hate speech / discriminatory language**, **sexually explicit content**.
- ❌ Not the job of safety filters: **logical errors**, **code style/quality**, **strong opinions in comments**.

Separately, **code referencing / "suggestions matching public code"** governs output *similarity* to public code and licensing — that is a different control from safety filtering.

## 3. Private Code and Model Training (q215, D3)

- By default, **private code from Copilot Business/Enterprise is NOT used to train shared Copilot models**.
- **Model training ≠ telemetry.** Telemetry/usage settings are a separate, configurable concern.
- The safe exam answer: private code is not used to train the shared model by default.

## 4. Prompt Engineering Patterns (D4)

A strong prompt supplies: **language/library + task + method/constraints + output shape + acceptance criteria**. Weak prompts leave the model to guess.

| Q | Pattern tested | Winning prompt shape |
| - | -------------- | -------------------- |
| q106 | Prompt quality | Names language + task + method: "Write a Python function to reverse a string using slicing." |
| q109 | Few-shot value | Examples show desired style/structure/tone so output matches your pattern. |
| q113 | What Copilot uses at inference | Contextual prediction from prompts + file contents + surrounding code — **not** runtime execution or web search. |
| q116 | Output specification | Fix audience + length/structure + required fields: "Summarize in 3 bullets for junior devs; include inputs, outputs, one caveat." |
| q119 | Test generation | Fix language (Go) + style (table-driven) + target function + required cases (empty, invalid, edge lengths). |
| q127 | Security in prompts | Make safety explicit: HTTPS, TLS validation, timeouts, retries/backoff, secret redaction. |
| q129 | Configurable CLI spec | Fix language/library + enumerate flags/types + validation + exit codes + request examples. |

**Rule of thumb:** the best option is almost always the one that is **most specific and most verifiable**, not the longest or the most "thorough-sounding" unbounded one.

---

## How to Run Today's Quiz

From the `GH-300 Prep` folder:

```powershell
python quiz_runner.py questions.json --day-lock 17
```

Answer each question in the terminal. Results are saved to `session-results.json`, and I will update `progress.md` afterward.
