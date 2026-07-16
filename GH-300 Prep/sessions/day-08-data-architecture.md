# Day 8: Domain 3 — How Copilot Uses Data & Its Architecture

**Date**: 2026-07-16
**Domain**: Domain 3 — Data & Architecture (10–15%)
**Subtopics (from plan)**: How Copilot builds prompts (surrounding code, open files, cursor position); proxy filtering + post-processing pipeline; data flow (user input → proxy → LLM → response → IDE); LLM limitations (nondeterminism, token limits, hallucination)
**Actual assigned-question focus**: Where prompts/context are processed (cloud service → model); private code is NOT used to train models (telemetry ≠ training); why context matters; version-locking prompts to avoid hallucinated/unsupported APIs; content exclusions as the input-governance lever; handling flaky Copilot-generated tests
**Estimated study time**: 2 hrs | **Questions**: 7 (`--day-lock 8`)

---

## TL;DR (60-second skim)

- **Copilot is a cloud-backed service.** Prompts + allowed context leave the IDE, go to the **GitHub Copilot service** (proxy), which relays the request to the selected **AI model**, and the response streams back to the IDE. It is **not** purely local, **not** GHES-only, **not** processed in CI runners. (q214)
- **Prompt = surrounding code + current file + open tabs + cursor position + your instruction.** Copilot does **prediction, not execution**, so richer, closer context yields more relevant, accurate suggestions. (q110)
- **Your private code, prompts, and completions are NOT used to train Copilot's shared models.** This is true across plans by default. **Telemetry ≠ training** — product metrics measure activity, not code contents for model learning. (q065, q215)
- **LLMs hallucinate and are nondeterministic.** To avoid unsupported/deprecated API calls, **version-lock + allowlist** in the prompt: pin runtime, library version, allowed constructors, forbid deprecated APIs, require timeouts/health checks — then compile immediately. (q128)
- **Content exclusion** is the **input-governance** lever: it constrains what Copilot may _read as context_, reducing sensitive-data exposure. Introduced at the **Business** plan (Enterprise adds integrations + repo-aware Chat). (q045)
- **Flaky generated tests are a quality problem, not a "make CI green" problem.** Fix root cause: isolate external deps (mocks/fakes), deterministic fixtures, minimize timing sensitivity — don't mask with retries/timeouts/disabling. (q232)

---

## Learning Objectives

After this session you can:

1. Trace the end-to-end data flow: **IDE/client → Copilot cloud service (proxy) → AI model → response → IDE**, and reject "purely local / GHES-only / CI-only" answers.
2. Explain how Copilot assembles a prompt from local signals (surrounding code, open files, cursor position) and why context is a top-impact signal.
3. State GitHub's data guarantee: **private code/prompts/completions are not used to train the shared models**, and distinguish **telemetry** from **training**.
4. Recall LLM limitations (nondeterminism, token limits, hallucination) and the **version-lock + allowlist** prompting technique that mitigates unsupported API suggestions.
5. Identify **content exclusion** as input governance and the plan tier where it starts.
6. Respond correctly to quality issues in generated code/tests (fix root cause, don't mask).

---

## Key Concepts

### 1. The data-flow pipeline (most-tested idea today)

```
[IDE / GitHub.com client]
   │  prompt + allowed context (surrounding code, open files, cursor)
   ▼
[GitHub Copilot service — cloud proxy]     ← content exclusion + org/enterprise policy applied here
   │  routes request to configured model
   ▼
[AI model (LLM)]
   │  generated suggestion
   ▼
[Copilot service post-processing]          ← duplication/public-code filtering, code referencing
   │
   ▼
[IDE renders suggestion]
```

- Copilot is **cloud-backed**: prompts **do leave the IDE** and go to GitHub + an AI model. (q214)
- What may be **included as context** is shaped by **content exclusion** and **org/enterprise policies**.
- Reject these traps: "nothing leaves the machine," "GHES-only, no Copilot cloud," "processed inside CI runners." (q214)

### 2. How Copilot builds a prompt (local signals)

Copilot conditions on:

- **Surrounding code** near the cursor,
- The **current file**,
- **Open tabs / related files**,
- **Cursor position**,
- Your **instruction / comment / selection**.

Because Copilot does **prediction, not execution**, the closer and richer the context, the more relevant the output. Best practice: work **from a selection or the right open file**, include **interfaces, data shapes, domain facts, and non-obvious constraints** (perf, style, APIs). Prefer answers mentioning **nearby code / selections / file context** over "ask from scratch with no context." (q110)

### 3. Data privacy — private code is NOT training data

- **Your private code, prompts, and completions are not used to train Copilot's shared AI models** — true by default across plans. (q065, q215)
- **Telemetry ≠ training.** Telemetry/product metrics summarize **activity**, not code contents for model learning. Answers tying training to a telemetry toggle are wrong. (q215)
- Custom model training (if ever) is a **separate, explicit** opt-in flow — never automatic inclusion of all private repos.
- Exam reflex: any option saying "always trains on your private code" or "trains unless you disable telemetry" is **wrong**. Correct = **"No, private code is not used to train Copilot models."** (q065, q215)

### 4. LLM limitations & the version-lock + allowlist technique

LLMs are **nondeterministic**, have **token limits**, and **hallucinate** (invent APIs, use deprecated/changed methods).

To avoid unsupported library calls, the strongest prompt **pins and constrains**:

- **Runtime** (e.g., "Python 3.11"),
- **Library + version** (e.g., "redis-py v5 only"),
- **Allowed constructor/API** (e.g., "use `Redis.from_url`"),
- **Forbid deprecated APIs**,
- **Require** connection timeout + health check,
- Then **compile immediately** to catch hallucinated symbols early. (q128)

Trap: "use any compatible version" / "use a standard client library" invites Copilot to **guess from mixed-version training data**. The correct answer is the **version-locked, verifiable** prompt. (q128)

### 5. Content exclusion = input governance

- **Content exclusion** controls **what Copilot may read as context** (files/paths it must ignore) → reduces **sensitive-data exposure** during generation.
- Starts at **Copilot Business** (policy controls + exclusions + usage reporting, **no** enterprise-only integrations). **Enterprise** also supports exclusions **plus** enterprise integrations and **GitHub.com repo-aware Chat**. (q045)
- Mnemonic: **"policy + exclusions + reporting" → Business.**
- (Cross-domain link to Day 7: content exclusion = **input** governance; code referencing / "block matching public code" = **output** governance.)

### 6. Quality of generated code/tests — fix root cause

- **Flaky generated tests** signal real problems: dependency on external systems, nondeterministic timing, shared mutable state, weak setup/teardown.
- Correct response: make tests **deterministic and isolated** — **mocks/fakes** for external deps, **stable fixtures**, minimize timing-sensitive assertions. (q232)
- **Wrong** responses (all just _mask_ the symptom): global timeout bumps/retries, disabling flaky tests, rerunning CI until it passes once then merging. (q232)
- Principle: a flaky test is a **quality problem**, not a signal to weaken the suite until it turns green.

---

## Common Traps Recap

| Trap answer                                               | Reality                                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| "Nothing leaves the IDE / fully local"                    | Copilot is a **cloud service**; prompts + context go to GitHub + model (q214)                          |
| "Processed in GHES-only / CI runners"                     | Routed through the **Copilot cloud service** to an AI model (q214)                                     |
| "Private code trains the models" / "unless telemetry off" | **No** — private code/prompts/completions **not** used for training; telemetry ≠ training (q065, q215) |
| "Use any compatible library version"                      | **Version-lock + allowlist** to avoid hallucinated/deprecated APIs (q128)                              |
| Content exclusion is Enterprise-only                      | Starts at **Business** (q045)                                                                          |
| Disable/retry flaky tests to keep CI green                | Fix root cause: **mocks/fakes + deterministic fixtures** (q232)                                        |

---

## Quiz

Run the 7 assigned questions:

```powershell
python quiz_runner.py questions.json --day-lock 8
```

Questions: q045, q065, q110, q128, q214, q215, q232

---

## Post-Quiz Notes

**Result: 9/10 (90%)** — carryover q250/q251/q252 (D2) all correct; D3 core 6/7.

**Miss — q214** (chose D = "processed inside CI runners"; correct **B**):
Copilot prompts + allowed context are processed by the **GitHub Copilot cloud service**, which relays the request to the selected AI model per GitHub's data pipeline (shaped by content-exclusion + org/enterprise policy). It is **not** local-only, **not** GHES-only, **not** CI-runner processing. Fix the mental model: **client → Copilot cloud service (proxy) → AI model → response.**
