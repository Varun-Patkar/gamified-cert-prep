# Day 7: Domain 2 Catch-up & Overflow — Modes, Coding Agent & PR Governance

**Date**: 2026-07-15
**Domain**: Domain 2 — GitHub Copilot Features & Governance (25–30%)
**Subtopics (from plan)**: Slash commands (/explain, /fix, /test, /doc, /new); chat participants (@workspace, @github, @terminal, @vscode); prompt/instruction file reuse
**Actual assigned-question focus**: Edit mode vs Agent mode vs coding agent; coding-agent safety guardrails; PR summaries & review suggestions as advisory; branch protections & CODEOWNERS always apply; policy hierarchy (enforced vs default); input vs output governance; Enterprise repository-aware chat
**Estimated study time**: 2 hrs | **Questions**: 23 (`--day-lock 7`)

---

## TL;DR (60-second skim)

- **Three tiers of autonomy**: _Ask/Chat_ (drafts, answers) → _Edit mode_ (targeted, reviewable diffs on known files) → _Agent mode_ (multi-step: edits across files, runs commands, iterates on errors) → _Copilot coding agent_ (cloud, autonomous, opens a PR on a branch).
- **Match the tool to the task size**: tiny single-file change = Edit mode/inline; unknown scope + multi-step + run tests/commands = Agent mode or coding agent. Agent mode is _overkill_ for renaming one parameter.
- **Copilot never overrides governance.** Branch protections, required status checks, required reviewers, and **CODEOWNERS** apply to _everyone_ — including agent-authored PRs. Copilot suggestions do **not** count as an approving review and cannot bypass protections or auto-merge.
- **PR summaries & review suggestions are advisory**: they accelerate reviewer understanding (intent, risky areas, scope) but never replace required human review, security scanning, or CODEOWNERS.
- **Two different governance axes**: _Content exclusion_ governs what Copilot may **read as input** (incl. test files); _code referencing / "block matching public code"_ governs **output** similarity to public code.
- **Policy hierarchy = Enterprise → Org → Repo/User**. An **enforced** enterprise policy is a hard ceiling; lower scopes can only be _stricter_, never weaker. A **default** can be tightened downstream.
- **Repository-aware Copilot Chat on GitHub.com** (references org repos + docs in the browser) is a **Copilot Enterprise** capability — still obeys permissions, content exclusion, and policies.
- **Safe coding-agent pattern**: feature branch → small commits → run tests → PR for review → revert if needed. Never force-push to `main`, never disable checks, never skip tests.

---

## Learning Objectives

After this session you can:

1. Pick the correct interaction mode (Chat vs Edit vs Agent vs coding agent) for a given task and justify it by scope, autonomy, and control.
2. Describe the coding agent's default protections and the guardrails you layer on top (branch rulesets, required checks, CODEOWNERS).
3. Explain why PR summaries and review suggestions are _assistive_, not authoritative, and how they fit inside existing quality gates.
4. Distinguish input governance (content exclusion) from output governance (code referencing).
5. Apply the policy hierarchy and the enforced-vs-default distinction.
6. Recall the plan-topic mechanics: slash commands, chat participants, and reusable instruction/prompt files.

---

## Key Concepts

### 1. The autonomy ladder (the single most-tested idea today)

| Mode                     | Where                        | Autonomy               | Runs commands?                        | Opens a PR?                    | Best for                                                                                                        |
| ------------------------ | ---------------------------- | ---------------------- | ------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **Ask / Chat**           | IDE, GitHub.com, CLI, Mobile | None (advisory)        | No                                    | No                             | Questions, drafting tests/config, explanations                                                                  |
| **Edit mode**            | IDE (Copilot chat)           | Low — you drive        | No                                    | No                             | Targeted, **reviewable diffs** on a **small, well-scoped** change; known files; max control; fewer LLM requests |
| **Agent mode**           | IDE                          | High — autonomous loop | **Yes** (terminal, tests, build)      | It can push/prep a PR from IDE | **Multi-step** tasks, unknown scope, iterate on compile/lint/test errors until done; MCP tool use               |
| **Copilot coding agent** | Cloud (GitHub.com)           | Highest — asynchronous | Yes, in its own ephemeral environment | **Yes — draft PR on a branch** | Delegated multi-step work: run tests, fix lint across modules, update config, push branch + draft PR            |

Decision rules the exam hammers:

- **Small, known, high-control edit → Edit mode.** You want a clean diff you can eyeball and accept. (q235)
- **Task needs to run commands / iterate on failures / span many files → Agent mode.** This is what Edit mode _cannot_ do. (q236, q237)
- **Tiny single-file change (rename a parameter, fix one docstring) → NOT Agent mode.** Use Edit mode / inline / Chat. Agent mode is overkill. (q240)
- **Delegated, asynchronous, "go do this and bring me a PR" → coding agent.** Multi-file edits + commands + a branch + draft PR. (q245, q248)
- **Chat vs Agent split**: Chat _drafts_ tests/config; Agent _runs_ the commands, _iterates_ on failures, and _opens_ the PR. (q237)

### 2. Copilot coding agent — behavior & built-in protections

The coding agent works autonomously in a cloud environment, then pushes to a **branch** and opens a **draft pull request**. By design it:

- **Cannot push to the default branch** and **cannot merge** its own PRs.
- Is **subject to branch rulesets** exactly like a human developer.
- Runs its own security check on generated code (uses CodeQL; does **not** require GitHub Advanced Security / Code Security license) and gets a second opinion via Copilot code review before completing the PR.
- Note (governance gap to remember): **content exclusions, custom models (BYO LLM keys), and private MCP registries do NOT apply to the cloud/coding agent.**

Safe expectation when you say "run the test suite and fix failing tests": the agent runs tests, proposes **minimal diffs**, and pushes to a **branch for PR review** — it does **not** auto-merge, does **not** make repo-wide edits, and does **not** bypass protections. (q250)

### 3. Coding-agent safety guardrails (the pattern to memorize)

Safe boundary pattern for letting an agent run terminal commands / make changes:

- Work on a **feature branch** (never the default branch).
- Keep changes **small**, commit in **small commits**.
- **Run tests** (required status checks) before merge.
- Have a **rollback plan** — be ready to **revert the PR** if a fix goes wrong.
- **No force-push to `main`**, **no disabling checks**, **no skipping tests**, **no protection bypass**. (q238, q241, q249)

Rollback specifics: use small commits on a feature branch and **revert the PR** if needed. Do **not** squash to hide intermediate states, do **not** work directly on `main`, do **not** force-push. (q249)

### 4. Governance always applies (branch protections + CODEOWNERS)

- **Branch protections** — required reviewers, required status checks, block force pushes — still apply to Copilot/agent work. Copilot suggestions **do not override** protections and **do not count as an approving review**. (q242, q246)
- **CODEOWNERS**: to _mandate expert review for specific paths_, use a **CODEOWNERS** file paired with a branch protection rule that **requires review from code owners**. This is the canonical answer for "certain files must be reviewed by a specific team." (q244)
- PRs opened by the **coding agent** still obey branch protections, required checks, and CODEOWNERS — **no admin bypass, no auto-merge.** (q246)
- After Copilot suggests a change _during PR review_: **apply it to the PR branch, rerun the checks, and request the required reviewers to re-review.** (q243)

### 5. Copilot in code review / PR summaries — advisory, not authoritative

- Copilot in PR review generates **natural-language PR summaries** and **review suggestions**. It does **NOT** auto-approve, auto-merge, disable protections, or rewrite history. (q228)
- **Primary value of PR summaries**: help reviewers quickly grasp **intent, risky areas, and scope of change** → review _acceleration_. It is **not** auto-approval, **not** a correctness guarantee, and does **not** replace CODEOWNERS. (q251)
- Review suggestions are **helpful input that does not replace required reviews/protections** — advisory, not authoritative. (q239)
- In a **security-sensitive repo**, treat Copilot review suggestions as **assistive input only**: human review plus security scanning/governance are still required. Do not blindly trust; do not bypass controls. (q252)

### 6. Quality gates — Copilot sits _inside_ existing gates

Quality-gate workflow for Copilot-generated changes (q229):

1. Accept suggestions →
2. Run tests / coverage in **CI** →
3. Code review using **PR summaries** →
4. (optional) **code scanning** →
5. Merge.

Copilot never _replaces_ a gate; it operates within the pipeline you already have.

### 7. Input governance vs output governance (don't confuse these)

| Axis                                                | What it controls                                                                      | Scope                                           | Example                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| **Content exclusion**                               | What Copilot may **read as INPUT** (files/paths it ignores) — **includes test files** | Repo / org config                               | Exclude `secrets/**`, `*.env` so Copilot never uses them as context |
| **Code referencing** ("Block matching public code") | Similarity of Copilot **OUTPUT** to public code; filters/attributes matches           | **User** and **organization/enterprise** scopes | Block or flag suggestions matching public repos                     |

Key trap: **tests are treated as code** for governance — content exclusion can hide test files from input, and referencing rules apply to test output too. (q233)

### 8. Policy hierarchy — Enterprise → Org → Repo/User

- Policies flow **Enterprise → Organization → Repository/User**.
- An **enforced** enterprise policy (e.g., "Block suggestions matching public code" set to enforced) is a **hard ceiling** — orgs and repos **cannot override or weaken it**; they can only be **equal or stricter**. (q222)
- A policy left as a **default** _can_ be tightened by a lower scope.
- Mnemonic: **enforced = ceiling you can't raise; default = starting point you can lower (tighten).**

### 9. Repository-aware Copilot Chat on GitHub.com = Copilot Enterprise

- Chatting with Copilot **in the browser on GitHub.com** with the ability to **reference your organization's repositories and docs/knowledge bases** is a **Copilot Enterprise** capability (semantic code search / repository indexing powers it). (q221)
- It still **obeys permissions, content exclusion, and organization policies**.
- It is **not** available on all plans, **not** a GHES-only feature, and **not** an offline/IDE feature.

---

## Decision Framework — "Which mode do I use?"

```
Is it just a question / draft?              → Chat (Ask mode)
Small, known-file, want a clean diff?       → Edit mode
Multi-step, run tests/commands, iterate?    → Agent mode (in IDE)
Delegate it, want a PR back asynchronously? → Copilot coding agent (cloud)
Renaming one param / one docstring?         → Edit mode / inline (NOT Agent — overkill)
```

Governance overlay (always true regardless of mode):

```
Any change → PR → [required checks + required reviewers + CODEOWNERS] → merge
Copilot suggestion ≠ approval.  Agent PR ≠ bypass.  Force-push to main = never.
```

---

## Comparisons the exam loves to confuse

| Confusion                                      | Correct distinction                                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Edit mode vs Agent mode                        | Edit = targeted diffs, no command execution, max control; Agent = autonomous loop, runs commands/tests, multi-file |
| Agent mode vs coding agent                     | Agent mode = in IDE, interactive; coding agent = cloud, asynchronous, opens draft PR on a branch                   |
| Content exclusion vs code referencing          | Exclusion = INPUT it can read; referencing = OUTPUT similarity to public code                                      |
| PR summary vs approval                         | Summary = advisory acceleration; approval = required human/CODEOWNERS review                                       |
| Enforced vs default policy                     | Enforced = hard ceiling (can't weaken); default = can be tightened downstream                                      |
| Repository-aware chat (Enterprise) vs IDE chat | Enterprise browser chat indexes org repos/docs; still bound by permissions/exclusion                               |

---

## Important Details for Exam

- Coding agent **cannot push to default branch or merge PRs** — hard limits.
- Coding-agent security validation uses **CodeQL** and needs **no** GHAS/Code Security license.
- **Content exclusions, custom models, private MCP registries do NOT apply to the cloud/coding agent.**
- **CODEOWNERS + "require review from code owners"** branch rule = mandatory path-based expert review.
- Rulesets: enable **"Require a pull request before merging"** (≥1 approval) and **"Block force pushes"** for safe agent operation.
- Code referencing has **user** and **organization/enterprise** scopes (from Day 3 carryover).
- Repository-aware chat on GitHub.com is a **Copilot Enterprise** feature backed by repository indexing / semantic code search.

---

## Common Traps & Misconceptions

- ❌ "Agent mode auto-approves/merges PRs." → No mode auto-approves; governance still applies.
- ❌ "Copilot suggestions during review count as an approval." → They never satisfy required reviews.
- ❌ "The coding agent can bypass branch protections because it's automated." → It is subject to rulesets like a human.
- ❌ "Use Agent mode to rename one parameter." → Overkill; use Edit/inline.
- ❌ "Content exclusion stops Copilot from producing public-matching code." → That's _code referencing_; exclusion controls _input_.
- ❌ "An org can loosen an enforced enterprise policy." → Enforced = hard ceiling; lower scopes only get stricter.
- ❌ "Repository-aware browser chat is on all plans." → It's Copilot **Enterprise**.
- ❌ "Just disable failing checks so the agent can finish." → Never; run tests, keep protections, revert if needed.

---

## Real-World Scenarios

1. _"A team wants Copilot to run the test suite, fix failures across 4 modules, update snapshots, refresh docs, and open a PR."_ → **Copilot coding agent / Agent mode** orchestrating edits + commands + a draft PR; still hits required checks + CODEOWNERS. (q245)
2. _"Certain compliance files must always be reviewed by the security team."_ → **CODEOWNERS** entry for those paths + branch rule requiring code-owner review. (q244)
3. _"A reviewer wants to understand a large PR fast."_ → Copilot **PR summary** highlights intent/risk/scope — advisory only. (q251)
4. _"Security-sensitive repo, Copilot suggests a review fix."_ → Treat as assistive; keep human review + security scanning. Apply to PR branch, rerun checks, request re-review. (q252, q243)
5. _"Just rename `usr` to `user` in one file and fix its docstring."_ → **Edit mode / inline**, not Agent. (q240)

---

## Plan Topics Refresher (supplementary — slash commands, participants, instruction files)

**Slash commands** (Copilot Chat shortcuts for common intents):
| Command | Does |
| --- | --- |
| `/explain` | Explain the selected code / active file |
| `/fix` | Propose a fix for a problem or diagnostic in the selection |
| `/test` (a.k.a. `/tests`) | Generate unit tests for the selection |
| `/doc` | Add documentation/comments for the selection |
| `/new` | Scaffold a new project/file/workspace |

**Chat participants** (`@` — scope Copilot to a context/tool):
| Participant | Scope |
| --- | --- |
| `@workspace` | Reasons over your whole project/workspace to answer with repo context |
| `@github` | GitHub-specific skills (search repos, issues/PRs, web/knowledge from GitHub) |
| `@terminal` | Context of the integrated terminal / shell commands |
| `@vscode` | Questions about VS Code itself (settings, commands, features) |

Combine them: `@workspace /explain how is auth handled?` scopes `/explain` to the whole workspace.

**Reusable instruction & prompt files** (persist standards so you don't re-type context):

- **`.github/copilot-instructions.md`** — repo-wide custom instructions automatically added to Chat context; encode conventions, stack, do/don't rules.
- **`*.instructions.md`** — scoped instruction files; can target paths via an `applyTo` glob in front matter.
- **`*.prompt.md`** — reusable prompt files you invoke on demand for repeatable workflows (e.g., "generate a REST endpoint following our pattern").
- Benefit: consistent, governed prompting across the team; complements (does not replace) org policies and content exclusion.

---

## Quiz Question Refreshers (concept → key fact → trap)

| Concept cluster                          | Key fact                                                              | Trap                                                 |
| ---------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| Enterprise repo-aware chat (q221)        | Browser chat referencing org repos/docs = **Copilot Enterprise**      | Not all-plans / not GHES / not offline               |
| Policy hierarchy (q222)                  | Ent→Org→Repo; **enforced** = hard ceiling                             | Lower scope can only be _stricter_, never weaker     |
| Copilot in PR review (q228)              | Generates **summaries + suggestions**                                 | Does NOT auto-approve/merge or rewrite history       |
| Quality gates (q229)                     | Copilot sits _inside_ CI/review/scan/merge                            | It doesn't replace any gate                          |
| Input vs output governance (q233)        | Exclusion = **input**; referencing = **output**; tests count as code  | Don't swap the two                                   |
| BDD/TDD tests (q234)                     | Give BDD spec + framework → scaffold **failing** tests first          | Spec-first, not implementation-first                 |
| Edit mode (q235)                         | Small, known files, reviewable diff, max control                      | Not for multi-step command running                   |
| Agent mode (q236, q237)                  | Runs commands, iterates on errors, multi-file, opens PR               | Chat drafts; Agent executes                          |
| Coding-agent safety (q238, q241, q249)   | Feature branch + small commits + tests + revert                       | No force-push/main, no disabling checks              |
| PR summaries advisory (q239, q251)       | Accelerate reviewer understanding of intent/risk/scope                | Not approval, not correctness guarantee              |
| Mode overkill (q240)                     | One-file rename/docstring → Edit/inline                               | Agent mode is overkill                               |
| Branch protection + Copilot (q242, q246) | Protections + CODEOWNERS apply to agent PRs                           | Suggestions ≠ approving review; no bypass/auto-merge |
| Post-review suggestion (q243)            | Apply to PR branch → rerun checks → request re-review                 | Don't merge without required reviewers               |
| CODEOWNERS (q244)                        | Path-based mandatory expert review + branch rule                      | Not achieved by content exclusion or policies        |
| Multi-step delegation (q245, q248)       | Coding agent = edits+commands+branch+draft PR                         | Not Edit mode; not Chat alone                        |
| Coding-agent PR governance (q246, q250)  | Obeys protections/checks/CODEOWNERS; minimal diffs; PR not auto-merge | No admin bypass, no repo-wide edits                  |
| Security-sensitive review (q252)         | Assistive input; human review + scanning required                     | Don't blindly trust or bypass controls               |

---

## Related Questions in questions.json

q221, q222, q228, q229, q233, q234, q235, q236, q237, q238, q239, q240, q241, q242, q243, q244, q245, q246, q248, q249, q250, q251, q252 (23 total)

Quiz command (run from the `GH-300 Prep` folder):

```powershell
python quiz_runner.py questions.json --day-lock 7
```

---

## Sources (verified during this session)

- [Introducing GitHub Copilot agent mode (VS Code blog)](https://code.visualstudio.com/blogs/2025/02/24/introducing-copilot-agent-mode)
- [Agent mode: available to all users and supports MCP (VS Code blog)](https://code.visualstudio.com/blogs/2025/04/07/agentMode)
- [Asking GitHub Copilot questions in your IDE (Agent/Ask/Plan modes)](https://docs.github.com/copilot/github-copilot-chat/copilot-chat-in-ides)
- [GitHub Copilot features (assistive vs agentic)](https://docs.github.com/copilot/about-github-copilot/github-copilot-features)
- [Maintaining codebase standards in a Copilot rollout (rulesets, PRs, reviews)](https://docs.github.com/en/copilot/tutorials/roll-out-at-scale/govern-at-scale/maintain-codebase-standards)
- [Building guardrails for GitHub Copilot cloud agent](https://docs.github.com/en/copilot/tutorials/cloud-agent/build-guardrails)
- [Risks and mitigations for GitHub Copilot coding agent](https://docs.github.com/en/enterprise-cloud@latest/copilot/concepts/agents/coding-agent/risks-and-mitigations)
- [Indexing repositories for GitHub Copilot (repo-aware chat)](https://docs.github.com/copilot/managing-copilot/managing-github-copilot-in-your-organization/customizing-copilot-for-your-organization/indexing-repositories-for-copilot-chat)
- [GitHub Copilot code referencing](https://docs.github.com/en/enterprise-cloud@latest/copilot/concepts/completions/code-referencing)

---

## Notes (your own words — fill this in after studying)

_(Leave space for the user to add their own notes after going through it.)_
