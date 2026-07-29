# Day 22: Mock Round 5 — All Domains (D1–D6)

**Date**: 2026-07-30
**Domain**: Full-spectrum mock (D1 Responsible AI, D2 Features, D3 Data & Architecture, D4 Prompt Engineering, D5 Developer Productivity, D6 Privacy & Config)
**Question count**: 25 (`--day-lock 22`)
**Estimated study time**: 1.5 hrs

---

## TL;DR (60-second skim)

- **"Business is the baseline."** Content exclusion, org-admin policy, repo/code access control, audit logs — all start at **Copilot Business**. Pick **Enterprise** ONLY when the stem says "across multiple organizations / enterprise-wide" or names an Enterprise-exclusive capability. This trap has cost 3 marks in the last 2 days.
- **GHEC does NOT bundle Copilot.** A GHEC subscription (paid or 30-day trial) never includes Copilot Enterprise for free. Copilot is a **separate per-seat purchase**.
- **Content exclusion is NOT universal.** It does **not** apply to Copilot CLI, Copilot cloud/coding agent, or Agent mode in IDE Chat. "Applies everywhere / all surfaces" is always wrong.
- **Fairness vs Transparency**: bias / representative data / prevent discrimination = **Fairness**. Communicate limitations, risks, explainability, disclose AI involvement = **Transparency**. Privacy & Security = confidentiality, protect data, prevent misuse.
- **Coding agent runs on GitHub Actions** in an ephemeral environment — it runs its own builds/tests there, opens a **draft PR**, cannot push to protected/default branches, and is subject to rulesets like any human.
- **Prompt engineering**: machine-consumable output must specify **format + exact schema + "no prose"**. Planning prompts must ask for the **plan/steps first, no code yet**.
- **Copilot drafts tests; it does not run your CI.** Coverage numbers are never guaranteed by Copilot.

---

## Learning Objectives

After this session you should be able to, under exam time pressure:

1. Map any governance/config capability to the **lowest** plan tier that provides it.
2. State exactly which Copilot surfaces content exclusion covers and which it does not.
3. Trace the path a prompt takes from IDE → Copilot service → model, and say where processing happens.
4. Classify a scenario into the correct Responsible AI principle in under 10 seconds.
5. Distinguish Ask / Edit(Edits) / Agent mode / coding agent by autonomy, scope, and where they execute.
6. Pick the best-written prompt from four near-identical options.

---

## SECTION A — THE THREE HARD DRILLS (do these first)

### DRILL 1 — "Business is the baseline" (repeat miss ×3)

This is your single most expensive trap. Burn this table in.

| Capability                                                       | Lowest plan that has it    | Enterprise adds                                           |
| ---------------------------------------------------------------- | -------------------------- | --------------------------------------------------------- |
| Content exclusion (repo, org, and enterprise level)              | **Copilot Business**       | Same feature, settable at enterprise scope                |
| Org admin sets Copilot policies for members                      | **Copilot Business**       | Enterprise owner sets a policy org owners cannot override |
| "Suggestions matching public code" (code referencing) org policy | **Copilot Business**       | Enterprise-wide enforcement                               |
| Control over **which repos / which code** Copilot can access     | **Copilot Business**       | Enterprise-wide enforcement                               |
| Audit logs for Copilot                                           | **Copilot Business**       | Enterprise-level aggregation                              |
| Copilot cloud (coding) agent                                     | Pro and above (paid plans) | —                                                         |
| Seat management / centralized license assignment                 | **Copilot Business**       | Assign Business or Enterprise per org                     |
| Prompts/suggestions excluded from model training by default      | **Business & Enterprise**  | —                                                         |
| Priority access to new models & features, larger AI-credit pool  | **Copilot Enterprise**     | This is genuinely Enterprise-only                         |
| Requires **GitHub Enterprise Cloud** to purchase                 | **Copilot Enterprise**     | Business works on GitHub Free/Team org **or** GHEC        |

**Decision rule — read the stem, then:**

```
Does the stem mention "enterprise-wide", "across multiple organizations",
"enterprise owner enforcing for all orgs", or "GHEC + advanced compliance/audit/identity"?
   YES → Copilot Enterprise
   NO  → Copilot Business
Does the stem say "individual developer", "no org features", "personal use"?
   → Copilot Free / Pro / Pro+ / Max (individual tier)
```

**But note the counter-drill for q053:** the stem _"enterprises using GitHub Enterprise Cloud, providing advanced compliance, audit, and identity features"_ explicitly names GHEC + enterprise-grade capabilities → this one **is Enterprise**. You got this wrong on Day 2 by picking Business. The rule is symmetric: **don't over-correct either way.** Read whether the stem is describing _a single org's admin controls_ (Business) or _a GHEC enterprise-grade offering_ (Enterprise).

Cheat phrase pairs:

| Stem phrase                                                       | Answer                                              |
| ----------------------------------------------------------------- | --------------------------------------------------- |
| "organization owners can configure…"                              | **Business**                                        |
| "repository-level content exclusion"                              | **Business**                                        |
| "org admin sets the public-code matching policy"                  | **Business**                                        |
| "control which repositories Copilot can access in the org"        | **Business**                                        |
| "for enterprises on GHEC with advanced compliance/audit/identity" | **Enterprise**                                      |
| "enforce a policy across every organization in the enterprise"    | **Enterprise**                                      |
| "individual developer, no organizational features needed"         | **Copilot Pro** (or Free if "no cost / try it out") |

### DRILL 2 — CI-ready / machine-consumable output prompts (repeat miss ×4)

When a question asks for the best prompt whose output feeds a **script, pipeline, or tool**, the winning option contains **all three**:

1. **An explicit machine-readable format** — "return JSON" / "return CSV" / "return YAML".
2. **The exact schema** — the field names, types, and structure (e.g. "a JSON array of objects with `file`, `line`, `severity`").
3. **A suppression clause** — "no prose", "no explanation", "no markdown fences", "output only the JSON".

Distractors that LOSE:

- "Give me a nicely formatted report" → human-readable, not CI-ready.
- "Return JSON" with **no schema** → underspecified; downstream parser breaks.
- "Return JSON and explain your reasoning" → prose contaminates the output.
- Longest option ≠ best option. Check for the three ingredients, not word count.

**Same discipline applies to the "configurable CLI tool" prompt (q129).** The best option specifies: the **flags/arguments and their defaults**, **input/output contract**, **exit codes / error behaviour**, and **the language/runtime**. A vague "write me a CLI tool" or one that omits configuration surface loses.

### DRILL 3 — Responsible AI principle classifier (Fairness streak, now broken — keep it broken)

GitHub follows **Microsoft's six Responsible AI principles**: Fairness, Reliability & Safety, Privacy & Security, Inclusiveness, Transparency, Accountability.

| Keyword in the stem                                                                                            | Principle                |
| -------------------------------------------------------------------------------------------------------------- | ------------------------ |
| bias, discrimination, representative/diverse training data, equitable treatment of groups                      | **Fairness**             |
| consistent, dependable, safe under unexpected input, offensive/harmful output, red teaming, testing            | **Reliability & Safety** |
| **confidentiality, protect data, prevent misuse of data, personal information, secure**                        | **Privacy & Security**   |
| accessible to people with disabilities, works for all abilities/languages, no one excluded                     | **Inclusiveness**        |
| **communicate limitations, disclose risks, explainability, users know it's AI, documentation of intended use** | **Transparency**         |
| human oversight, someone answerable, governance, review before merge, audit trail                              | **Accountability**       |

Three of today's 25 questions are pure principle-matching (protect data/confidentiality; confidentiality of personal info + prevent misuse; communicate limitations & risks), plus one on the _key responsibility under Transparency_.

**Transparency responsibilities (memorize):** disclose that AI is involved; document **intended uses, capabilities, and limitations**; publish/communicate known risks and failure modes (e.g. hallucination, insecure code); explain how outputs are produced at an appropriate level; give users what they need to make informed decisions about trusting output. GitHub operationalizes this via **Application Cards / Platform Cards**.

**Not Transparency:** "ensure the training data is representative" (Fairness), "make sure a human approves the merge" (Accountability), "encrypt the data in transit" (Privacy & Security).

---

## SECTION B — D6 / D2 CONTENT EXCLUSION (three questions today)

### What it is

Content exclusion lets you specify files and paths that Copilot must **not use as context** and must **not offer completions inside**.

### Plan requirement

- **Copilot Business** or **Copilot Enterprise** only.
- Not available on Free, Pro, Pro+, Max, or Student.

### Who can configure it and at what scope

| Scope            | Who                       | What you enter                                                      |
| ---------------- | ------------------------- | ------------------------------------------------------------------- |
| **Repository**   | Repository administrators | `- "/path/to/file"` list; fnmatch patterns; case-insensitive        |
| **Organization** | Organization owners       | `REPOSITORY-REFERENCE:` + paths, or `"*":` for any location on disk |
| **Enterprise**   | Enterprise owners         | Applies down to member organizations                                |

People with the **Maintain** role can **view but not edit** repository content exclusion settings. Inherited exclusions from the parent org/enterprise appear as read-only grey boxes.

Pattern syntax examples:

```yaml
- "/src/some-dir/kernel.rs" # one specific file
- "secrets.json" # that filename anywhere in the repo
- "secret*" # any file starting with "secret"
- "*.cfg" # any .cfg file
- "/scripts/**" # everything under /scripts
```

Manageable via the **REST API** as well as the UI.

### ⚠️ Where content exclusion does NOT apply (this is the trap)

Per GitHub Docs, content exclusion is **not supported** by:

- **GitHub Copilot CLI**
- **Copilot cloud agent (coding agent)**
- **Agent mode in Copilot Chat in IDEs**

So any answer claiming exclusions are enforced **uniformly across every Copilot surface** is **false**. Also false: "content exclusion is available on all plans", "it's configured by individual developers in their IDE settings", and "it deletes the files".

### Content exclusion vs code referencing — never confuse these

| Concern                                                   | Feature                                                          |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| Stop Copilot **reading** your sensitive files as context  | **Content exclusion**                                            |
| Copilot **outputs** something matching public code        | **Code referencing / "suggestions matching public code"** policy |
| Long exact match against public repos → block or annotate | Duplication detection + code referencing                         |

Content exclusion governs **input context**. Code referencing governs **output similarity**. Your Day 13/14 misses (q140, q150) were exactly this confusion.

Note also: content exclusion is a **best-effort context control, not a security boundary**. It doesn't encrypt anything, doesn't revoke repo permissions, and doesn't retroactively affect anything already generated.

---

## SECTION C — D2 PLANS, LICENSING & GHEC (four questions today)

### The plan lineup (current)

| Plan                   | Audience                                              | Notable                                                                                                                             |
| ---------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Copilot Free**       | Individuals with no org/enterprise Copilot access     | ~2,000 completions/month, limited chat, auto model selection only                                                                   |
| **Copilot Student**    | Verified students                                     | Unlimited completions, free                                                                                                         |
| **Copilot Pro**        | **Individual developers who don't need org features** | Unlimited completions, cloud agent, AI credits, $10/mo                                                                              |
| **Copilot Pro+**       | Individual power users                                | Premium models, higher credit allowance, $39/mo                                                                                     |
| **Copilot Max**        | High-volume individuals                               | Highest credit allowance, priority access, $100/mo                                                                                  |
| **Copilot Business**   | Orgs on GitHub Free/Team **or** enterprises on GHEC   | Centralized management, **policy control**, **content exclusion**, audit; $19/seat/mo                                               |
| **Copilot Enterprise** | Enterprises on **GitHub Enterprise Cloud**            | Everything in Business + priority model/feature access, larger credit pool, enterprise-grade compliance/audit/identity; $39/seat/mo |

Copilot is **not available for GitHub Enterprise Server**.

### The GHEC bundling trap (q162, q050 — and you missed q070 on Day 3)

- A **GHEC subscription does not include Copilot Enterprise at no additional cost.** Copilot is licensed and billed **separately, per seat**.
- A **free 30-day GHEC trial** likewise does **not** hand you Copilot Enterprise. What you get is a **Copilot trial** — and the plan associated with a GHEC trial is the **Business-tier trial**, not Enterprise. If an option says "Copilot Enterprise is included free with GHEC", it's wrong.
- Related distractor from Day 3: **"Copilot Premium" is not a real plan.** Neither is "Copilot Team" or "Copilot Ultimate". Only the plans in the table above exist.

### Individual vs organizational

- "Individual developer who does **not** need organizational features" → **Copilot Pro** (the paid individual plan). If the stem stresses "no cost / just trying it out", that's Free.
- Copilot Free is explicitly **for personal use only**, not for users managed by an org or enterprise.

---

## SECTION D — D2 AGENTS, MODES, CLI & REVIEW (eight questions today)

### The four ways to use Copilot to change code

| Surface                          | Where it runs                                          | Autonomy                                                                                                                                                     | Best for                                                                 |
| -------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| **Ask / Chat**                   | IDE or github.com                                      | Answers questions; you apply changes                                                                                                                         | Explanations, "how do I…", quick Q&A                                     |
| **Edit mode (Copilot Edits)**    | IDE, **you supply the working set**                    | Multi-file edits **within the files you nominated**; reviewable diffs                                                                                        | Well-scoped, known-file changes; fast turnaround; fewer LLM calls        |
| **Agent mode**                   | IDE, **your local workspace**                          | **Determines relevant files itself**, runs **terminal commands**, monitors compile/lint/test output, **self-corrects in a loop**, uses **MCP servers/tools** | Multi-step tasks where scope is unclear; needs tool/external integration |
| **Copilot cloud (coding) agent** | **GitHub Actions runner, ephemeral env, in the cloud** | Works async off a GitHub issue/task; opens a **draft PR**                                                                                                    | Background/well-scoped backlog work while you do something else          |

**q236 — what Agent mode does that Copilot Edits does not:** decide _which_ files need changing on its own, **execute terminal/build/test commands**, react to errors and iterate autonomously, and invoke external tools via MCP. Copilot Edits stays inside the working set you gave it and does not run commands or loop.

**q211 — coding agent vs IDE Chat:** choose the **coding agent** when the work is a **well-scoped task you want done asynchronously without you sitting in the editor** — e.g. assign an issue, let it work in the cloud, come back to a draft PR to review. Choose **IDE Chat/agent mode** when you want interactive, in-the-loop work on your local machine right now. The coding agent is **not** for "I need an instant answer" or "I want to iterate line-by-line with it".

### How the coding agent executes builds and tests (q205)

- It works in **its own ephemeral development environment powered by GitHub Actions**, on a fresh VM (GitHub-hosted runners recommended; self-hosted should be ephemeral).
- You pre-install tools/dependencies via a **`copilot-setup-steps.yml`** workflow file so it can build, test, and validate reliably.
- It runs builds/tests **in that environment**, not on your laptop and not on the model's servers.
- Secrets: normal **Actions secrets/variables are NOT accessible** to the agent. To give it credentials you configure dedicated **Agents secrets and variables** at org/repo level.
- Its code is automatically **scanned for vulnerable patterns and secrets**.
- **By default, workflows are blocked from running on the agent's PRs until someone with write access approves them.**
- Wrong answers to avoid: "runs tests on your local machine", "the LLM simulates the test run", "it merges once tests pass".

### Branch protections & rulesets vs Copilot review (q242)

- **Copilot code review produces suggestions/comments — it is advisory.** It does **not** satisfy a required-review rule, does **not** count as an approving human reviewer, and does **not** bypass anything.
- **Copilot cloud agent is subject to rulesets exactly like a human developer.** It is already restricted from pushing to the default branch and from merging PRs.
- Recommended guardrails: **Require a pull request before merging** (≥1 approval), **Block force pushes**, **Dismiss stale approvals on new commits**, **Require review from Code Owners**, **Require workflows to pass before merging**, **Require code scanning results**.
- Enterprise-level rulesets set a **baseline**; org/repo rulesets **add to it and never override it**.

### Copilot CLI (q155)

- Available with **all Copilot plans**; if you get Copilot from an org, the **Copilot CLI policy must be enabled** in org settings.
- Runs on Linux, macOS, and Windows (PowerShell / WSL).
- Two interfaces: **interactive** (`copilot`) and **programmatic** (`copilot -p "prompt"`, exits when done).
- Interactive has a default ask/execute mode plus a **plan mode** (Shift+Tab to cycle) that builds a structured implementation plan and asks clarifying questions before writing code.
- It can answer questions, **write and debug code, run shell commands (with approval), and interact with GitHub.com** — including making changes and **opening a pull request**.
- `--allow-all-tools` / `--allow-tool=` skip manual approval — flagged as a security caution because Copilot then has the same access you do.
- **Content exclusion does not apply to the CLI.**
- Wrong answers to avoid: "replaces your shell", "only explains commands and cannot act", "requires Copilot Enterprise".

### Rollback pattern for iterative agent fixes (q249)

The good pattern is: **let the agent work on an isolated branch, commit in small reviewable increments, and revert cleanly** — e.g. work on a feature branch off main, make each agent iteration its own commit (or use the IDE's **undo/revert-to-last-checkpoint**, which reverts changes up to the last edit-file tool call), review the diff at each step, and `git revert`/reset the branch or close the draft PR if the direction is wrong. Never let the agent commit directly to `main`, and never rely on "just ask the agent to undo it" as the recovery mechanism.

### VS Code inline suggestion settings (q089)

- **UI path:** File → Preferences → **Settings** → **Extensions** → **Copilot** → toggle **"Inline Suggest: Enable"**. (Or the title-bar Copilot icon → **Configure Inline Suggestions** → Enable/Disable Completions.)
- **Per-language:** under "Enable or disable Copilot for specified languages", click **Edit in settings.json** and set `github.copilot.enable`:

```json
{
	"editor.inlineSuggest.enabled": true,
	"github.copilot.enable": {
		"*": true,
		"yaml": false,
		"plaintext": false,
		"markdown": true,
		"python": true
	}
}
```

`"*"` is the **global default**; each language key overrides it. Next edit suggestions are a separate setting: `github.copilot.nextEditSuggestions.enabled`.

Wrong answers to avoid: "on github.com in your account settings", "only an org owner can do it", "you must uninstall the extension".

---

## SECTION E — D3 DATA & ARCHITECTURE (q214)

Where Copilot prompts and allowed context are processed:

```
Your IDE / CLI
   │  builds a prompt: your typed input + allowed local context
   │  (open files, selection, repo name — minus anything content-excluded)
   ▼
GitHub Copilot cloud service   ←── the answer to q214
   │  pre-processing, proxy/filtering, prompt assembly, adds repo context
   ▼
Large language model (hosted by GitHub/Microsoft/partner)
   │  generates a response
   ▼
Content filters on the response
   │
   ▼
Back to your IDE / CLI
```

Key facts:

- Prompts and allowed context are **transmitted to and processed by the Copilot cloud service**, which relays them to the model. Processing is **not** local, **not** on your CI runners, and **not** on GitHub Enterprise Server (Copilot isn't available on GHES).
- **Both input prompts and output completions are run through content filters.**
- For **Business and Enterprise**, prompts and suggestions are **not used to train shared models** by default; private code is not used to train foundation models.
- Prompts/context are used to produce the response and are not retained as part of your repository.

**Your Day 8 miss on this exact question:** you picked "processed on CI runners". The correct framing is always **the Copilot cloud service relays prompts + context to the AI model**.

---

## SECTION F — D1 SAFETY FILTERS (q074, multi-select)

Copilot applies a **content filtering safety system that scans both prompts and responses**. Categories that can be blocked include:

- **Hate speech, harassment, discriminatory or offensive content**
- **Sexual / adult content**
- **Violence, threats, self-harm content**
- **Off-topic / non-coding content** (Copilot Chat is explicitly not designed for general non-coding questions)
- **Prompts seeking harmful, abusive, or malicious code** (e.g. malware, exploitation tooling)
- **Content that would expose personal data**
- Output matching public code, when the **"suggestions matching public code"** policy is set to block

Things filters **do not** do (common distractors): they don't guarantee the code is bug-free, don't guarantee secure code, don't block "code that's badly formatted", don't enforce your team's style guide, and don't replace code scanning/secret scanning. Multi-select questions here reward picking **all the genuine harm/abuse/off-topic categories** and rejecting the "quality/style" ones.

---

## SECTION G — D4 PROMPT ENGINEERING (q129, q125)

### The scoring rubric for "best prompt" questions

A winning prompt option almost always has more of these than its rivals:

1. **Role/context** — the stack, language, framework, runtime version.
2. **Explicit task** — one clear verb, bounded scope.
3. **Constraints** — what must not change, performance/security requirements, dependencies allowed.
4. **Output contract** — format, structure, section list, **and a length cap** where relevant.
5. **Ordering** — "do X before Y", "don't write code until the plan is approved".

Your Day 15 miss (q122) was losing the option that added the **audience + section list + length cap**. Length caps and audience are tie-breakers — don't dismiss them as fluff.

### Migration-plan prompt (q125)

The stem says **"you need a migration plan before code."** The correct option therefore must:

- Explicitly ask for a **plan / ordered phases / steps**, not an implementation.
- **Forbid or defer code generation** ("do not write code yet", "plan only").
- Include the **source and target** (from what, to what version/framework), **constraints** (downtime, backward compatibility, data migration), and ideally **risks/rollback**.

Losing options: ones that jump straight to "rewrite the module in X", ones that ask for both plan _and_ full implementation at once, and ones that omit the source/target specifics.

### Configurable CLI tool prompt (q129)

Winning option specifies: **language/runtime**, the **exact flags/options and their defaults**, **positional args**, **input source and output format**, **error handling and exit codes**, and **help text**. "Make a CLI tool that does X" without the configuration surface loses. Watch for options that describe a _library_ or a _web service_ instead of a CLI — instant elimination.

---

## SECTION H — D5 PRODUCTIVITY & TESTING (q231, q069, q176)

### Copilot and tests — the honest framing

- Copilot **drafts, scaffolds, and refines tests**: unit tests, edge cases, table-driven cases, mocks/fixtures, and it can suggest missing cases for uncovered branches.
- Copilot **does not execute your test suite or produce coverage metrics**. Running tests and measuring coverage is the job of your **CI/CD pipeline (e.g. GitHub Actions)**. (Your Day 12 miss, q227.)
- **Coverage/quality claims (q231):** Copilot **does not guarantee high coverage or correctness**. Generated tests may be shallow, may assert on implementation detail, may miss edge cases, and can even encode a bug as expected behaviour. **Human review + running the tests is mandatory.** Any option promising "guaranteed coverage", "eliminates the need for review", or "ensures all edge cases are handled" is wrong.
- **Good testing scenario (q176):** Copilot generating unit tests for an existing function including boundary/error cases, which the developer then reviews and runs — or Copilot helping fix flaky tests **at the root cause** (deterministic fixtures, mocked time/network) rather than adding retries/sleeps.

### Common vs non-use cases (q069)

**Genuine developer use cases:** writing boilerplate, generating unit tests, explaining unfamiliar code, **exploring unfamiliar APIs/libraries**, refactoring, writing docs/docstrings, debugging, translating between languages, writing regexes/SQL, drafting commit messages and PR descriptions.

**Not Copilot's scope (distractors):** HR processes, legal contract review, financial forecasting, general administrative automation, running the business's payroll, replacing code review, guaranteeing production reliability. (Your Day 11 miss, q138.)

---

## Quick Reference Card

| Question type                                                   | Instant heuristic                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| "Which plan lets an **org owner** configure X?"                 | **Business**                                                                               |
| "Which plan for **GHEC + advanced compliance/audit/identity**?" | **Enterprise**                                                                             |
| "Which plan for an **individual, no org features**?"            | **Copilot Pro**                                                                            |
| "Is Copilot included with GHEC / a GHEC trial?"                 | **No** — separate per-seat purchase; trial gives a Copilot **Business** trial              |
| "Content exclusion on all surfaces?"                            | **No** — not CLI, not cloud agent, not IDE agent mode                                      |
| "Where are prompts processed?"                                  | **Copilot cloud service**, which relays to the model                                       |
| "bias / representative data"                                    | **Fairness**                                                                               |
| "communicate limitations & risks"                               | **Transparency**                                                                           |
| "confidentiality / protect data / prevent misuse"               | **Privacy & Security**                                                                     |
| "offensive or harmful output"                                   | **Reliability & Safety** (filters); the _filter_ itself blocks it                          |
| "human must approve / answerable"                               | **Accountability**                                                                         |
| "Agent mode only, not Edits"                                    | Picks files itself + runs terminal commands + iterates on errors + MCP tools               |
| "Coding agent builds/tests"                                     | **Ephemeral GitHub Actions environment**, `copilot-setup-steps.yml`, draft PR              |
| "Copilot review + branch protection"                            | Advisory only; **does not satisfy required review**; agent obeys rulesets                  |
| "Best CI-ready prompt"                                          | format **+** exact schema **+** "no prose"                                                 |
| "Best planning prompt"                                          | plan/phases first, **explicitly no code yet**, source+target+constraints                   |
| "Copilot and coverage"                                          | Drafts tests; **CI runs them**; **no coverage guarantee**                                  |
| "VS Code enable/disable per language"                           | Settings → Extensions → Copilot → `github.copilot.enable` in settings.json, `"*"` = global |
| "Rollback for agent iterations"                                 | Isolated branch + small commits/checkpoints + revert; never direct to `main`               |

---

## Exam-Day Micro-Checklist (read this 60 seconds before the quiz)

1. Plan-tier question → say "**Business is the baseline**" out loud before choosing. Only escalate to Enterprise if the stem says enterprise-wide/GHEC-compliance.
2. "All surfaces / everywhere / always" in an answer about content exclusion → almost certainly **wrong**.
3. Principle question → find the keyword, don't reason from vibes. **"Limitations & risks" is Transparency; "bias" is Fairness.** Force-correct the Transparency reflex.
4. Prompt question → count the ingredients (format, schema, no-prose / plan-first, no-code-yet). Longest ≠ best.
5. Any "Copilot guarantees / eliminates / ensures" phrasing → wrong.
6. GHEC + Copilot → **not bundled**.

---

## Related Questions in questions.json

Day 22 assignment (25 questions, `--day-lock 22`):

| ID   | Domain | Tests                                                       |
| ---- | ------ | ----------------------------------------------------------- |
| q006 | D1     | Principle: protecting data, confidentiality, security       |
| q008 | D1     | Key responsibility under Transparency                       |
| q013 | D1     | Principle: communicating limitations and risks              |
| q026 | D1     | Principle: confidentiality of personal info, prevent misuse |
| q074 | D1     | What safety filters can block (multi-select)                |
| q050 | D2     | Copilot plan included with a free 30-day GHEC trial         |
| q053 | D2     | Plan for GHEC enterprises with advanced compliance          |
| q089 | D2     | VS Code inline suggestions: global vs per-language          |
| q155 | D2     | What Copilot Chat in the CLI can do                         |
| q157 | D2     | Do content exclusions apply across all surfaces             |
| q162 | D2     | Is Copilot Enterprise free with GHEC                        |
| q168 | D2     | Plan for individual developers, no org features             |
| q205 | D2     | How the coding agent executes builds and tests              |
| q211 | D2     | Coding agent vs Copilot Chat in IDE                         |
| q236 | D2     | Agent mode capabilities vs Copilot Edits                    |
| q242 | D2     | Branch protections vs Copilot review suggestions            |
| q249 | D2     | Rollback pattern for agent iterative fixes                  |
| q214 | D3     | Where prompts and allowed context are processed             |
| q125 | D4     | Best prompt for a migration plan before code                |
| q129 | D4     | Best prompt for a configurable CLI tool                     |
| q069 | D5     | Common developer use case                                   |
| q176 | D5     | Scenario where Copilot helps with testing                   |
| q231 | D5     | Coverage and quality claims when using Copilot for tests    |
| q115 | D6     | Which plans include content exclusion                       |
| q143 | D6     | Accurate statement about content exclusion                  |

Domain mix: D1 ×5, D2 ×12, D3 ×1, D4 ×2, D5 ×3, D6 ×2.

Quiz command (run from inside the `GH-300 Prep` folder):

```powershell
python quiz_runner.py --day-lock 22
```

Browser mode (nicer for long stems and multi-select):

```powershell
python quiz_runner.py --day-lock 22 --web --port 8765
```

---

## Sources (verified 2026-07-29)

- [Plans for GitHub Copilot](https://docs.github.com/copilot/get-started/plans)
- [About individual GitHub Copilot plans and benefits](https://docs.github.com/en/copilot/concepts/billing/individual-plans)
- [Excluding content from GitHub Copilot](https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/exclude-content-from-copilot)
- [Content exclusion for GitHub Copilot (concept)](https://docs.github.com/copilot/concepts/context/content-exclusion)
- [Managing policies and features for Copilot in your organization](https://docs.github.com/copilot/managing-copilot/managing-github-copilot-in-your-organization/setting-policies-for-copilot-in-your-organization/managing-policies-for-copilot-in-your-organization)
- [Configure the development environment for Copilot cloud agent](https://docs.github.com/copilot/how-tos/agents/copilot-coding-agent/customizing-the-development-environment-for-copilot-coding-agent)
- [Building guardrails for GitHub Copilot cloud agent](https://docs.github.com/en/enterprise-cloud@latest/copilot/tutorials/cloud-agent/build-guardrails)
- [Maintaining codebase standards in a GitHub Copilot rollout](https://docs.github.com/en/copilot/tutorials/roll-out-at-scale/govern-at-scale/maintain-codebase-standards)
- [About GitHub Copilot CLI](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-copilot-cli)
- [Configuring GitHub Copilot in your environment (VS Code)](https://docs.github.com/copilot/configuring-github-copilot/configuring-github-copilot-in-visual-studio-code?tool=vscode)
- [GitHub Copilot code suggestions in your IDE](https://docs.github.com/en/copilot/concepts/completions/code-suggestions?tool=vscode)
- [Application card: GitHub Copilot Chat](https://docs.github.com/en/copilot/responsible-use/chat)
- [Responsible use of GitHub Copilot features](https://docs.github.com/en/copilot/responsible-use)
- [Responsible use of GitHub Copilot Chat in your IDE](https://docs.github.com/copilot/github-copilot-chat/copilot-chat-in-ides/about-github-copilot-chat-in-your-ide)
- [VS Code — Agent mode: available to all users and supports MCP](https://code.visualstudio.com/blogs/2025/04/07/agentMode)

---

## Notes (your own words — fill this in after studying)

_(Space for your own notes after the run. Especially: write the Business-vs-Enterprise rule in your own phrasing.)_
