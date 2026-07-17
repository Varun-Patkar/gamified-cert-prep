# Day 9: Domain 4 — Prompt Engineering & Context Crafting (Part 1)

**Date**: 2026-07-17
**Domain**: Domain 4 — Apply Prompt Engineering and Context Crafting (10–15%)
**Subtopics (from plan)**: Prompt structure (instruction, context, input data, output indicator); zero-shot vs. one-shot vs. few-shot prompting; how Copilot determines context (open tabs, file type, comments, surrounding code)
**Actual assigned-question focus**: What prompt engineering buys you (and what it does NOT change); anatomy of a high-signal prompt (language + action + object + constraint); fixing ambiguity/irrelevance by adding context; why examples work (few-shot); teaching project style with snippets; what Copilot relies on at inference; specifying output targets (format/length/audience/fields); safe-refactor prompts (change structure, preserve contract); reducing hallucinations in API code (pin version + allowlist endpoints)
**Estimated study time**: ~1.5 hrs | **Questions**: 11 (`--day-lock 9`)

---

## TL;DR (60-second skim)

- **Prompt engineering raises suggestion quality via clarity + specificity.** It does **NOT** change policy — duplication detection, code referencing, and content exclusions still apply. It does not guarantee license-compliant output, reduce CPU, or disable filters. (q068)
- **Signal density beats verbosity.** The best prompt packs **Language + Action + Object + Constraint** into one concise sentence: _"Python function to reverse a string using slicing."_ (q106)
- **Fix ambiguity by ADDING context/details** — never by shortening, retrying unchanged, or omitting the language. (q107, q111)
- **Most reliable quality boost = detailed instructions WITH examples.** Examples "show, don't tell": they anchor style/pattern (few-shot). (q108, q109)
- **Match project style by pasting real snippets/style examples** — teach style with code, not prose. (q112)
- **At inference Copilot relies on: your prompt + current file contents + surrounding code context** (and allowed context like chat history/repo index). It does **NOT** execute your code, browse Bing/the web, or use pre-stored templates. (q113)
- **Clear output target = format + length + audience + required fields.** _"Summarize in 3 bullets for junior devs; include inputs, outputs, one caveat."_ (q116)
- **Safe refactor prompt = change structure, preserve contract.** Keep same public API/behavior; add style goals + guardrails; existing tests must still pass. Never "rewrite completely." (q117)
- **Reduce API hallucinations: pin the API version, allowlist endpoints, forbid undocumented fields, name language/tooling, require 4xx/5xx error handling.** (q118)

---

## Learning Objectives

After this session you can:

1. State the **primary benefit** of prompt engineering and the **policy guarantees it does NOT override**.
2. Recognize a high-signal prompt using the **Language + Action + Object + Constraint** checklist.
3. Improve ambiguous or irrelevant output by **adding intent, context, and constraints** (not by shortening).
4. Explain **why examples work** and pick the **instructions + examples** answer for "most reliable" questions.
5. Teach Copilot **project style** using code snippets/examples.
6. State exactly **what Copilot relies on at inference** and reject execution / web-search / template distractors.
7. Write prompts that define a **clear output target** (format, length, audience, must-include fields).
8. Write **safe refactor** prompts (change structure, preserve the public contract).
9. Write **hallucination-resistant API** prompts (version pin + endpoint allowlist + forbid undocumented fields).
10. Describe **zero-shot vs one-shot vs few-shot** prompting and how Copilot builds context (open tabs, file type, comments, surrounding code).

---

## Key Concepts

### 1. Prompt anatomy — the four building blocks

A well-formed prompt has up to four parts (the exam's mental model):

| Part                 | Role                           | Example                                                                      |
| -------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| **Instruction**      | The task/action verb           | "Write a function to…", "Refactor…", "Summarize…"                            |
| **Context**          | Background the model needs     | file/selection, domain facts, library, API version, style                    |
| **Input data**       | The specific thing to act on   | the string, the function, the dataset, the endpoints                         |
| **Output indicator** | The shape/format of the answer | "in 3 bullets", "as pytest tests", "TypeScript interface", "return an array" |

> **Signal density > verbosity.** A short prompt that names _language, action, object, and constraint_ beats a long, vague paragraph. (q106, q116)

The one-sentence checklist the exam rewards: **Language + Action + Object + Constraint.**

- _"Python (language) function to reverse (action) a string (object) using slicing (constraint)."_ → q106 correct answer.

### 2. What prompt engineering actually does (and does NOT do) — q068

**Does:** improves **clarity and specificity** → better, more relevant suggestions → less rework. Iterate: refine, add acceptance criteria, request alternatives.

**Does NOT:**

- ❌ Guarantee license-compliant output.
- ❌ Reduce IDE CPU usage.
- ❌ Disable duplication detection / public-code matching.
- ❌ Turn off code referencing or content/context exclusions.

> **Exam reflex:** Any option claiming prompt engineering _changes a policy or filter_ is wrong. Prompt engineering changes **output quality only** — governance still applies. (q068)

### 3. Zero-shot vs one-shot vs few-shot prompting

| Style         | # of examples in prompt | When to use                                   | Trade-off                                                            |
| ------------- | ----------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| **Zero-shot** | 0                       | Simple, well-known tasks ("reverse a string") | Model relies purely on instruction + context; more variance in style |
| **One-shot**  | 1                       | You want output to match one specific pattern | Anchors format cheaply                                               |
| **Few-shot**  | 2+                      | Style/structure matters; subtle conventions   | Highest control; costs prompt tokens                                 |

- **Few-shot = "show, don't tell."** Examples demonstrate naming, layout, docstrings, error handling, test shape — so Copilot **generalizes from the pattern** instead of inventing style. (q108, q109, q112)
- A **good vs. bad pair** is a powerful few-shot trick when style distinctions are subtle.
- **Tiny but high-fidelity** examples outperform paragraphs of prose describing "clean code." (q112)

### 4. How Copilot determines context (open tabs, file type, comments, surrounding code)

At inference, Copilot assembles a prompt from **local signals** plus your instruction:

- **Surrounding code** near the cursor (before and after).
- **Current file** contents and its **file type/language** (drives language + idioms).
- **Open tabs / neighboring files** — open the relevant files, **close irrelevant ones** to reduce noise.
- **Comments** written in natural language (a comment can _be_ the prompt for ghost text).
- **Cursor position** (Copilot predicts what comes next / next-edit location).
- In Chat: **chat history/threads**, selection, and context keywords like `@workspace` (VS Code) / `@project` (JetBrains).

> Copilot does **prediction, not execution**. Richer, closer, relevant context → better suggestions. This is why "indicate relevant code" and "open the right files" are official best practices. (q113)

**What Copilot relies on at inference (q113):** your **prompt + file contents + surrounding code context** (and allowed context such as chat history / repo index).
**Distractors to reject:** runtime execution of your code, Bing/web search, pre-stored templates.

### 5. Iteration loop — fixing ambiguous / irrelevant output

Ambiguity forces the model to guess. Irrelevant suggestions mean **missing or misaligned signals**. The fix is always the same shape — **add signal**, don't subtract:

1. **Add context (where):** scope to a selection/file; name the library/framework/API version.
2. **Add intent (what):** state the goal, inputs/outputs, acceptance criteria.
3. **Add constraints (how/limits):** language/tooling, complexity, style, security, format.

- q107: ambiguous prompt → **"provide more context and details."** (Not shorter; not omit language; not retry unchanged.)
- q111: irrelevant suggestions → **"refine or rephrase the prompt with more context."** (Not stop using Copilot; not just shorter; not disable duplication detection.)

> Each refinement should intentionally **remove one known ambiguity**. Shorter prompts rarely fix irrelevance — **richer** prompts do.

### 6. Defining a clear output target — q116

Use the pattern: **do X, in Y format, for Z audience, include fields A/B/C.**

- ✅ _"Summarize this function in 3 bullets for junior devs; include inputs, outputs, and one caveat."_
  - **Format** = bullets, **Length** = 3, **Audience** = junior devs, **Required content** = inputs/outputs/caveat.
- ❌ "Summarize this." / "Explain code." / "Write notes." → open-ended, high variance.

### 7. Safe refactor prompts — q117

The golden rule of refactoring: **structure may change; observable behavior must not.** Existing tests must still pass.

- ✅ _"Refactor to pure functions; no side effects; keep same public API; add docstrings; return early on invalid input."_
  - Names what **changes** (structure/style) and what must **not** change (public API/behavior) + guardrails.
- ❌ "Improve this." / "Make it cleaner." (vague) / "Rewrite completely." (breaks the contract).

> Always lock **compatibility**: "keep signatures and behavior unchanged; existing tests must still pass."

### 8. Reducing hallucinations in API code — q118

LLMs invent endpoints, fields, and deprecated methods. Constrain them into a **verifiable contract**:

- **Pin the API version** ("Foo API v3").
- **Allowlist endpoints** ("only /users/{id}, /users/search").
- **Forbid undocumented fields/endpoints** ("no undocumented fields").
- **Name language + tooling** ("TypeScript; fetch").
- **Require error handling** ("handle 4xx/5xx"), and ask for **types/interfaces** so hallucinated fields fail fast.

- ✅ _"Use Foo API v3; only endpoints /users/{id}, /users/search; TypeScript; fetch; no undocumented fields; include error handling for 4xx/5xx."_
- ❌ "Use the Foo API." / "Write users code." / "Guess the latest endpoints." (invites speculation)

> This is the same **version-lock + allowlist** technique from Day 8's LLM-limitations section — output becomes a testable stub you can compile immediately.

---

## Decision Frameworks

**"Which prompt is best?" (q106, q116, q117, q118, q119-style)**

```
Does the prompt name LANGUAGE + ACTION + OBJECT + CONSTRAINT?
├─ No  → too vague ("write a function", "improve this", "summarize this") → REJECT
└─ Yes → Does it specify OUTPUT SHAPE (format/length/fields) when the Q asks about output?
          ├─ Yes → likely correct
          └─ For refactor: does it PRESERVE the contract (same API/behavior)? → must be Yes
          └─ For API code: does it PIN version + ALLOWLIST endpoints + FORBID undocumented? → must be Yes
```

**"My output is bad — what do I do?" (q107, q111)**

```
Bad output → ADD signal (context + intent + constraints)
             NOT: shorten it, retry unchanged, drop the language, or give up.
```

---

## Comparisons (exam loves to confuse these)

| Confusion                                        | Correct framing                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Prompt engineering **vs** policy                 | PE changes **output quality**; policy (dup detection, code referencing, exclusions) is **unchanged**. (q068) |
| Shorter prompt **vs** richer prompt              | For ambiguity/irrelevance, **richer** wins. Brevity ≠ clarity. (q107, q111)                                  |
| Instructions only **vs** instructions + examples | **Instructions + examples** is the most reliable quality boost. (q108)                                       |
| Prose style description **vs** code snippet      | **Code snippets** teach style far better than prose. (q112)                                                  |
| Inference inputs **vs** distractors              | Inputs = **prompt + file + surrounding code**; NOT execution / Bing / templates. (q113)                      |
| Refactor **vs** rewrite                          | Refactor = preserve behavior/API; "rewrite completely" is wrong for refactor. (q117)                         |

---

## Important Details for Exam

- Prompt engineering never disables filters or guarantees compliance — **quality lever only**. (q068)
- The best-prompt answer almost always **names the language, task, and technique** explicitly. (q106)
- For ambiguity/irrelevance, the correct verb is **"add / provide more context"** — memorize this. (q107, q111)
- "Most reliable" quality technique → **detailed instructions WITH examples**. (q108)
- Examples work because they **align output to a desired style/pattern** (few-shot "show don't tell"). (q109)
- Project-style matching → **paste snippets/style examples**, not vague instructions. (q112)
- Inference inputs = **prompts + file contents + surrounding code**; reject runtime execution and web search. (q113)
- Clear output = **format + length + audience + required fields**. (q116)
- Refactor prompt must **preserve public API/behavior** while changing structure; tests still pass. (q117)
- API hallucination control = **pin version + allowlist endpoints + forbid undocumented fields + error handling**. (q118)
- Copilot uses **open tabs, file type, comments, cursor position, surrounding code** to build context — open relevant files, close irrelevant ones.

---

## Common Traps & Misconceptions

- **Trap:** "Prompt engineering guarantees license-compliant output / disables duplication detection." → **Wrong.** It's a quality lever; policy still applies. (q068)
- **Trap:** "Fix a bad prompt by making it shorter / retrying unchanged / removing the language." → **Wrong.** Add context. (q107, q111)
- **Trap:** "Copilot runs your code / searches Bing / uses stored templates at inference." → **Wrong.** It predicts from prompt + file + surrounding code. (q113)
- **Trap:** "Describe your style in prose." → **Weaker.** Provide a real snippet. (q112)
- **Trap:** "Rewrite completely" chosen for a **refactor** question → **Wrong.** Refactor preserves the contract. (q117)
- **Trap:** "Use the Foo API" (no version/endpoints) for a hallucination question → **Wrong.** Pin + allowlist + forbid undocumented. (q118)
- **Trap:** Choosing "Summarize this." over the option that specifies bullets/audience/fields. → The **specific** one is correct. (q116)

---

## Real-World Scenarios

1. **Onboarding a new microservice repo:** paste an existing handler + test as a **few-shot** example and say "match this style" → Copilot mirrors naming, logging, and test layout. (q109, q112)
2. **Flaky, off-topic completions:** the file lacks type info. Add interfaces/data shapes to the file and re-prompt with a selection → suggestions snap into relevance. (q111, q113)
3. **Docs for a PR:** "Summarize `chargeCard()` in 3 bullets for junior devs; include inputs, outputs, one caveat" → consistent, review-ready output. (q116)
4. **Legacy cleanup:** "Refactor to pure functions; keep the same public API; add docstrings; return early on invalid input; existing tests must pass" → safe structural change. (q117)
5. **Third-party API client:** pin "Stripe API v1; only /charges, /customers; TypeScript; fetch; no undocumented fields; handle 4xx/5xx" → no invented endpoints. (q118)

---

## Quick Reference Card

- **Prompt = Instruction + Context + Input data + Output indicator.**
- **Best prompt checklist: Language + Action + Object + Constraint.**
- **Bad output → add context/intent/constraints** (never shorten/retry-unchanged).
- **Reliable boost = instructions + examples** (few-shot "show don't tell").
- **Teach style with code snippets**, not prose.
- **Inference inputs = prompt + file + surrounding code** (not execution/Bing/templates).
- **Clear output = format + length + audience + required fields.**
- **Refactor = change structure, keep public API/behavior; tests still pass.**
- **API code = pin version + allowlist endpoints + forbid undocumented fields + error handling.**
- **PE improves quality, never overrides policy** (dup detection, code referencing, exclusions).
- **Context signals: open tabs, file type, comments, cursor, surrounding code.**

---

## Hands-On Lab (optional)

Pick any function in a real repo and run this A/B:

1. Prompt Copilot Chat vaguely: _"improve this."_ Note the drift.
2. Re-prompt with the full pattern: _"Refactor `X` to pure functions; keep the same public API; add docstrings; return early on invalid input; keep existing tests green."_
3. Compare diffs. Then add a **few-shot** style snippet and ask it to "match this style" — observe how naming/structure converges.

This directly rehearses q107, q108, q112, q116, q117.

---

## Related Questions in questions.json

- **q068** — Primary benefit of prompt engineering (clarity/specificity; does NOT change policy).
- **q106** — Best-crafted prompt (Language + Action + Object + Constraint).
- **q107** — Improve ambiguous prompts (add context/details).
- **q108** — Most reliable quality boost (detailed instructions + examples).
- **q109** — Why examples help (align output to style/pattern).
- **q111** — Irrelevant suggestions → refine/rephrase with more context.
- **q112** — Match project style (snippets + style examples).
- **q113** — What Copilot relies on at inference (prompt + file + surrounding code).
- **q116** — Clearest output target (format + length + audience + fields).
- **q117** — Best refactor prompt (preserve API/behavior, change structure).
- **q118** — Reduce API hallucinations (pin version + allowlist endpoints + forbid undocumented fields).

Quiz command (run from the `GH-300 Prep` folder):

```powershell
python quiz_runner.py --day-lock 9
```

Browser UI variant (image-friendly):

```powershell
python quiz_runner.py --day-lock 9 --web --port 8765
```

---

## Sources (verified during this session)

- [Prompt engineering for GitHub Copilot Chat — GitHub Docs](https://docs.github.com/en/copilot/concepts/prompting/prompt-engineering)
- [GitHub Copilot code suggestions in your IDE — GitHub Docs](https://docs.github.com/en/copilot/concepts/completions/code-suggestions)
- [How to use GitHub Copilot: Prompts, tips, and use cases — GitHub Blog](https://github.blog/developer-skills/github/how-to-write-better-prompts-for-github-copilot/)
- [A developer's guide to prompt engineering and LLMs — GitHub Blog](https://github.blog/ai-and-ml/generative-ai/a-developers-guide-to-prompt-engineering-and-llms/)

---

## Notes (your own words — fill this in after studying)

_(Leave space for the user to add their own notes after going through it)_
