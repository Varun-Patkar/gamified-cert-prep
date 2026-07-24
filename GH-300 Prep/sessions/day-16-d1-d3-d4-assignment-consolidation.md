# Day 16: D1 + D3 + D4 Assignment Consolidation

**Date**: 2026-07-24  
**Exam**: GH-300 GitHub Copilot  
**Domains**: D1 Responsible AI (15-20%), D3 Data and Architecture (10-15%), D4 Prompt Engineering (10-15%)  
**Assigned questions**: 19  
**Estimated study time**: 2 hours

---

## Session Goals

By the end of this session, you should be able to:

- Select the Microsoft Responsible AI principle that most directly matches a scenario.
- Separate Fairness from Inclusiveness and Reliability and Safety from Privacy and Security.
- Decompose scenarios that deliberately combine several Responsible AI principles.
- Identify the first organization plan tier that supplies administrator-managed content exclusion.
- Turn an ambiguous coding request into a grounded, bounded, and verifiable prompt.
- Prompt for project style, performance, secure coding, supported APIs, and machine-readable output.
- Bound an agent task in a monorepo so unrelated packages remain outside the edit surface.
- Recognize safeguards that reduce risk but do not guarantee correctness or security.

## Important: Plan vs. Assignment Mismatch

The local `plan.md` labels Day 16 as **D5 + D6 Consolidation**. That label does **not** match the locked data in `day-assignments.json`.

The actual Day 16 assignment contains:

- **D1**: Responsible AI, privacy, safety, fairness, inclusiveness, transparency, and agent safety.
- **D3**: Copilot plan scope/content exclusion and dependency/API grounding.
- **D4**: Prompt engineering for quality, style, performance, security, and structured output.

Strict quiz alignment takes precedence. This session therefore teaches the actual D1/D3/D4 assignment. It does not silently replace the assigned questions with D5/D6 questions.

The exact assigned IDs are:

`q006`, `q045`, `q012`, `q107`, `q025`, `q108`, `q027`, `q001`, `q112`, `q028`, `q123`, `q020`, `q247`, `q118`, `q029`, `q014`, `q187`, `q128`, `q124`.

---

## TL;DR (60-Second Skim)

- **Fairness** means equitable treatment and outcomes; **Inclusiveness** means accessible participation across abilities, cultures, and languages.
- **Privacy and Security** protects data and confidentiality; **Reliability and Safety** keeps behavior dependable, validated, and non-harmful.
- **Transparency** makes AI involvement, reasoning, limitations, and risks understandable; **Accountability** keeps humans answerable.
- A scenario can test multiple principles: classify each required action, then choose the option that covers the whole scenario.
- Organization-managed content exclusion is available with **Copilot Business and Copilot Enterprise**; Business is the first relevant organization tier.
- Good prompts provide context, intent, constraints, examples, acceptance criteria, and a precise output shape.
- Reduce API hallucinations by pinning versions, grounding on official contracts, allowlisting APIs/endpoints, and verifying with types/tests.
- In monorepos, paths/packages, invariants, validation commands, and small reviewable diffs are safety boundaries.
- Copilot can suggest secure patterns, but human review, tests, scanners, and branch controls remain required.

---

## 1. Responsible AI Decision Framework

Microsoft's six Responsible AI principles are:

1. Fairness
2. Reliability and Safety
3. Privacy and Security
4. Inclusiveness
5. Transparency
6. Accountability

The exam usually gives you a concrete symptom or desired control rather than asking for a definition. Select the principle that most directly addresses the **primary harm or requirement**.

### Principle Decision Table

| Principle              | Core question                                                        | Strong stem signals                                                                                     | Typical engineering controls                                                                | Do not confuse with                                                    |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Fairness               | Are comparable people treated equitably?                             | bias, discrimination, equal treatment, unequal outcomes, representative evaluation                      | group-wise evaluation, bias metrics, representative data, mitigation, monitoring            | Inclusiveness, which concerns access and participation                 |
| Reliability and Safety | Does the system behave dependably and avoid harm?                    | unsafe output, offensive output, incorrect behavior, robustness, validation, outdated/insecure patterns | tests, safety evaluations, guardrails, code review, scanners, monitoring, rollback          | Privacy and Security, unless the central harm is data exposure         |
| Privacy and Security   | Is sensitive information protected from exposure or misuse?          | personal data, secrets, confidentiality, consent, unauthorized access, data leakage                     | minimization, access control, encryption, secret handling, redaction, retention rules       | Reliability and Safety, which focuses on dependable and safe operation |
| Inclusiveness          | Can the full range of intended users participate?                    | disability, accessibility, assistive technology, cultures, languages, global teams                      | accessible design, WCAG testing, localization, inclusive research, alternative input/output | Fairness, which focuses on equitable treatment or outcomes             |
| Transparency           | Can people understand AI involvement, output basis, and limitations? | no explanation, opaque recommendation, disclosure, limitations, rationale                               | AI disclosure, documentation, traceability, known-limitations notices, explanations         | Accountability, which assigns ownership and remediation duties         |
| Accountability         | Is a person or organization answerable for outcomes?                 | owner, sign-off, oversight, audit, escalation, remediation, documented action                           | named owners, approval gates, audit records, incident response, human override              | Transparency, which makes behavior understandable                      |

Read the scenario's primary harm in this order: sensitive data, unequal treatment, access barriers, unsafe behavior, opacity, then ownership. This is a priority heuristic, not a claim that only one principle ever applies.

### Fairness vs. Inclusiveness

This is the most common terminology trap.

| Scenario cue                                                  | Fairness lens                                          | Inclusiveness lens                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| Hiring recommendations differ by demographic group            | Compare outcomes and mitigate bias                     | Ensure the interface and process are usable by all applicants      |
| Copilot-like assistance performs worse for one language group | Measure parity and correct systematic performance gaps | Support the language and cultural context so users can participate |
| UI is unusable with a screen reader                           | Not primarily an outcome-parity problem                | Remove the accessibility barrier                                   |
| Similar users receive different risk decisions                | Test equal treatment and comparable outcomes           | Relevant only if access or usability also excludes a group         |
| Global rollout                                                | Monitor group outcomes                                 | Localize language, formats, input methods, and accessibility       |

**Memory rule**:

- Fairness: **same/equitable treatment and outcomes**.
- Inclusiveness: **everyone can use and participate**.

Disability and accessibility wording usually points first to Inclusiveness. Bias, discrimination, and unequal treatment usually point first to Fairness.

### Privacy and Security vs. Reliability and Safety

Both can involve the word “security,” so identify the object being protected.

| Primary concern                                      | Best first lens        | Why                                                   |
| ---------------------------------------------------- | ---------------------- | ----------------------------------------------------- |
| Personal data appears in a completion                | Privacy and Security   | The harm is disclosure of protected information       |
| A token is hard-coded or written to logs             | Privacy and Security   | A secret crosses a confidentiality boundary           |
| Generated code uses an obsolete vulnerable pattern   | Reliability and Safety | The output is unsafe and must be validated before use |
| Generated content is offensive or harmful            | Reliability and Safety | Safety guardrails and evaluation failed               |
| Service behaves unpredictably under expected load    | Reliability and Safety | Dependability and safe operation are central          |
| Unauthorized user can read prompts or source context | Privacy and Security   | Access control and confidentiality failed             |

Security review can support both principles. In exam questions, choose based on the **stated consequence**, not a single overloaded word.

### Transparency vs. Accountability

| Transparency                         | Accountability                                               |
| ------------------------------------ | ------------------------------------------------------------ |
| Explains what the AI does            | Identifies who owns what the AI does                         |
| Discloses AI involvement             | Requires approval or sign-off                                |
| Documents limitations and risks      | Requires escalation and remediation                          |
| Makes recommendations understandable | Maintains audit records and human override                   |
| Helps users calibrate trust          | Prevents humans from outsourcing responsibility to the model |

A system that gives recommendations with no understandable process presents a Transparency problem. A team that refuses to own or remediate bad outcomes presents an Accountability problem.

### Combined-Principle Scenarios

Some questions bundle several policies. Do not force the whole scenario into one label.

Use this decomposition:

1. Underline every required action.
2. Map each action to a principle.
3. Eliminate options that cover only one action.
4. Prefer the option that covers all explicit duties without inventing unrelated ones.

Example decomposition:

| Required action                                                           | Principle indicated    |
| ------------------------------------------------------------------------- | ---------------------- |
| Validate generated code and run safety/security checks before merge       | Reliability and Safety |
| Correct keyboard, contrast, screen-reader, or other accessibility defects | Inclusiveness          |
| Require a developer to review, approve, and record remediation            | Accountability         |
| Prevent PII or secrets from reaching prompts, logs, or completions        | Privacy and Security   |
| Explain known limits and disclose AI assistance                           | Transparency           |
| Evaluate performance across demographic or language groups                | Fairness               |

### Responsible Use Workflow for Generated Code

Treat generated code as an untrusted draft:

1. **Inspect**: read the code and identify assumptions, data flows, and dependency/API usage.
2. **Ground**: compare APIs and security patterns with authoritative documentation and locked dependencies.
3. **Validate**: compile, lint, test normal and edge cases, and run security/static analysis.
4. **Review**: use human review, especially for authentication, authorization, cryptography, data handling, and accessibility.
5. **Contain**: apply changes on a branch, preserve required checks, and keep the edit scope small.
6. **Monitor**: watch for regressions, dependency advisories, and newly obsolete patterns.
7. **Document**: record material decisions and remediation when policy requires it.

If Copilot produces outdated or insecure code, the responsible response is not merely to re-prompt. Strengthen the workflow: update constraints, consult current docs, scan dependencies, test, review, and prevent unsafe code from merging.

---

## 2. Copilot Plans and Content Exclusion

### Current Terminology as of 2026-07-24

GitHub's current plans page lists more individual tiers than older GH-300 material may show:

- Copilot Free
- Copilot Student
- Copilot Pro
- Copilot Pro+
- Copilot Max
- Copilot Business
- Copilot Enterprise

The exam question is not asking you to memorize every 2026 individual tier. Its key distinction is **individual entitlement vs. organization-managed governance**.

GitHub also notes that, beginning April 22, 2026, new self-serve Copilot Business sign-ups for organizations on GitHub Free and GitHub Team are temporarily paused. This commercial availability note does not change the feature classification: current official content-exclusion documentation still identifies Business and Enterprise as the supported organization plans.

### Exam-Relevant Plan-Tier Comparison

| Plan family                       | Intended scope                   | Organization admin policies                    | Admin-managed content exclusion             | Enterprise-level capabilities                                           |
| --------------------------------- | -------------------------------- | ---------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| Free / Student / Pro / Pro+ / Max | Individual developer entitlement | No organization-wide governance baseline       | Not the organization-managed exclusion tier | No                                                                      |
| Business                          | Organizations and teams          | Yes                                            | Yes; first relevant organization tier       | Organization governance, not the full enterprise layer                  |
| Enterprise                        | Enterprise use                   | Yes, including inherited enterprise governance | Yes                                         | Adds enterprise-level management and integrated enterprise capabilities |

**Decision rule**: If the stem asks for the first plan that introduces organization-admin policies, exclusions, or reporting without requiring enterprise-only capabilities, identify the **organization baseline**, not the most expensive tier.

Enterprise generally inherits organization capabilities. “Enterprise also has it” does not mean Enterprise is the first tier that introduces it.

### What Content Exclusion Does

Content exclusion lets authorized administrators configure Copilot to ignore specified files or paths as context.

Current GitHub documentation says excluded content can affect:

- Inline suggestions in an excluded file.
- Whether excluded content informs suggestions in other files.
- Whether excluded content informs Copilot Chat responses on supported surfaces.
- Whether affected files are reviewed by Copilot code review on supported surfaces.

Authorized roles can include repository administrators, organization owners, and enterprise owners, with scope depending on where exclusions are configured.

### What Content Exclusion Does Not Mean

Content exclusion is not:

- A deletion mechanism.
- An access-control substitute for repository permissions.
- A guarantee that similar semantic information cannot appear elsewhere.
- An output copyright or public-code matching control.
- A replacement for secret scanning, branch protection, or review.
- Universally supported across all Copilot surfaces.

### Current Surface Limitation

Current GitHub documentation warns that content exclusion support varies by surface. The configuration guide specifically notes limitations for Copilot CLI, Copilot cloud agent, and IDE Agent mode.

This matters for two reasons:

1. For the plan-tier exam question, remember **Business/Enterprise availability**.
2. For real administration, verify the current supported-surfaces table; do not assume an exclusion policy automatically constrains every agent or tool surface.

The question bank uses “coding agent” in one scenario. Current GitHub pages increasingly use **Copilot cloud agent** in headings and feature descriptions, while other materials may still say **coding agent**. Read these as terminology evolution and focus on the behavioral control being tested.

---

## 3. Prompt Engineering Patterns

### The High-Signal Prompt Model

A dependable prompt specifies:

```text
Context + Intent + Scope + Constraints + Evidence + Acceptance Criteria + Output Format
```

| Component           | Question it answers                | Example information                                            |
| ------------------- | ---------------------------------- | -------------------------------------------------------------- |
| Context             | Where and under what environment?  | selected file, package, language, runtime, dependency versions |
| Intent              | What should change or be produced? | implement, explain, test, refactor, diagnose                   |
| Scope               | What may and may not be touched?   | exact paths, symbols, packages, public API invariants          |
| Constraints         | What non-functional rules apply?   | performance, security, accessibility, compatibility            |
| Evidence            | What should ground the answer?     | official API spec, existing code example, tests, schema        |
| Acceptance criteria | How will success be checked?       | commands pass, edge cases covered, benchmark target            |
| Output format       | What exact artifact is required?   | patch, JSON schema, table, code only, no prose                 |

A short prompt can be excellent if it has high signal density. A long prompt can still be ambiguous.

### Improving an Ambiguous Prompt

Refinement sequence:

1. Add target: `packages/billing/src/client.ts`.
2. Add intent: replace blocking retries with bounded exponential backoff.
3. Add environment: Node.js 22, TypeScript, existing `fetch` wrapper.
4. Add invariants: no public API changes; no edits outside `packages/billing`.
5. Add edge cases: 429, 5xx, timeout, abort.
6. Add acceptance criteria: existing tests pass; add focused retry tests.
7. Add output requirement: show a reviewable diff and list commands run.

**Exam rule**: retrying the same vague prompt does not remove ambiguity. More relevant context and concrete requirements do.

### Using Examples to Improve Quality

Examples are pattern anchors. They can demonstrate:

- Naming conventions.
- Error-handling style.
- Test layout and assertion conventions.
- Expected input/output shape.
- Logging and documentation style.

Prefer a small, accurate project example over generic prose. An irrelevant or outdated example can anchor the wrong behavior, so examples must be trustworthy.

### Matching Project Style

Use three layers:

1. **Local context**: open or reference representative files near the change.
2. **Prompt exemplar**: include a short idiomatic snippet and say which properties to match.
3. **Persistent instructions**: record stable repository or path-specific conventions in supported custom-instruction files.

Ask for observable conventions, not subjective adjectives:

For example, identify the expected export style, error type, logger fields, and test framework by name.

“Make it clean” is not a style specification.

### Performance-Aware Prompts

“Make it fast” is under-specified. A performance-aware prompt includes:

- Runtime/language.
- Workload size and data shape.
- Latency, throughput, or complexity target.
- Memory limit or streaming requirement.
- Concurrency and backpressure behavior.
- Benchmark or measurement method.
- Correctness invariants.

Exam distractors often mention only one vague adjective such as “fast” or only the input size. Prefer the prompt that converts performance into measurable design constraints.

### API Grounding and Hallucination Reduction

Copilot can combine patterns from different library or API versions. Reduce unsupported calls by constraining the contract.

Include:

- Exact language and runtime.
- Package/library and locked version.
- Official API/specification reference or repository-local interface.
- Allowed constructors, methods, endpoints, and fields.
- Explicit ban on deprecated or undocumented members.
- Error, timeout, authentication, and retry requirements.
- Type-check, compile, contract-test, or schema-validation command.

Grounding reduces hallucination risk; it does not eliminate it. Always verify generated calls against the installed package or current official docs.

### Secure Coding Prompts

Copilot can support secure coding by generating patterns such as:

- Input validation and allowlists.
- Parameterized queries.
- Correct authentication and authorization checks.
- Secret retrieval from environment or managed stores.
- TLS certificate validation.
- Bounded timeouts and retry/backoff.
- Sensitive-data redaction in logs.
- Safe error handling that does not expose internals.

A secure prompt should name threats and required controls, including input validation, parameterized queries, no hard-coded secrets, redacted logs, preserved authorization, fail-closed behavior, and negative tests.

Do not infer that a generated secure-looking pattern is proven safe. Security constraints in the prompt are the first layer; review, tests, scanning, dependency checks, and policy gates are the remaining layers.

### Machine-Consumable CI Output

For direct pipeline use, specify:

- Serialization format: JSON, YAML, CSV, SARIF, JUnit XML, etc.
- Top-level shape: object, array, or stream.
- Exact field names and types.
- Required/optional fields.
- Null and empty-result behavior.
- Ordering if deterministic output matters.
- “No Markdown, comments, code fences, or prose.”
- Schema validation requirement.

“Return JSON plus an explanation” is not directly machine-consumable because the explanation breaks strict parsing.

---

## 4. Coding-Agent Safety in a Monorepo

An agent can search broadly and make multi-file changes. In a monorepo, broad context is useful for understanding dependencies, but broad write scope increases blast radius.

### Task Scoping as a Safety Control

A strong task defines:

- **Allowed paths**: packages/directories the agent may edit.
- **Read-only context**: nearby packages it may inspect but not change.
- **Forbidden paths**: generated files, lockfiles, shared packages, infrastructure, or unrelated apps.
- **Public invariants**: APIs, schemas, events, and compatibility that must remain unchanged.
- **Validation**: package-local tests, type checks, lint, and affected-dependency checks.
- **Diff size**: small, package-scoped, reviewable changes.
- **Stop conditions**: ask before crossing a boundary or changing a shared dependency.

Example task contract:

```text
Change only packages/checkout/**.
You may read packages/shared-types/** but must not edit it.
Do not modify workspace config, lockfiles, or other packages.
Preserve CheckoutClient's public API.
Run the checkout unit tests and package typecheck.
Show the package-scoped diff; stop and report if a shared contract must change.
```

### Defense in Depth

Prompt boundaries are helpful but are not hard authorization controls. Reinforce them with:

- Repository and path-specific custom instructions.
- Restricted tool sets for specialized agents where supported.
- Branch-based work and pull requests.
- CODEOWNERS and required reviewers.
- Required status checks and package-level test matrices.
- Protected branches and least-privilege credentials.
- Diff review before merge.

Current GitHub guidance for cloud-agent tasks emphasizes a clear problem statement, complete acceptance criteria, and directions about which files need changing. Repository custom instructions can encode project structure, conventions, and build/test commands. Path-specific instructions can tailor guidance to parts of a monorepo.

### Monorepo Trap

“Let the agent inspect the repository” and “let the agent modify the repository” are different permissions. Broad read context can improve reasoning; write scope should remain as narrow as the task allows.

Never remove tests, bypass review, force-push to a protected branch, or accept a large cross-package diff merely to make the agent finish faster.

---

## 5. Cross-Domain Quiz Question Refreshers

This Day 16 session intentionally spans three domains because the locked assignment does.

| Domain                   | Concept                | Key fact                                                                             | Trap                                                                |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| D1 Responsible AI        | Fairness               | Focuses on equitable treatment, bias, and outcomes                                   | Accessibility wording usually indicates Inclusiveness instead       |
| D1 Responsible AI        | Inclusiveness          | Removes barriers across abilities, cultures, and languages                           | Do not reduce it to equal statistical outcomes                      |
| D1 Responsible AI        | Privacy and Security   | Protects personal data, secrets, confidentiality, and consent                        | Unsafe code quality may instead be Reliability and Safety           |
| D1 Responsible AI        | Reliability and Safety | Requires validation, dependable behavior, and mitigation of harmful output           | “Security” in a stem does not automatically mean data privacy       |
| D1 Responsible AI        | Transparency           | Makes AI involvement, decisions, limitations, and risks understandable               | Human ownership is Accountability                                   |
| D1 Responsible AI        | Combined principles    | Map each explicit action separately, then cover all actions                          | Choosing the first plausible single principle misses bundled duties |
| D1 Agent safety          | Monorepo boundaries    | Limit writable paths/packages and require small reviewable diffs                     | Broad repository awareness does not require broad edits             |
| D3 Data and Architecture | Plan tier              | Business is the organization governance baseline; Enterprise inherits and extends it | Picking the highest tier when asked for the first tier              |
| D3 Data and Architecture | Content exclusion      | Business/Enterprise admins can exclude supported content from context                | Not universal across CLI/cloud agent/IDE Agent mode surfaces        |
| D3 Data and Architecture | Dependency grounding   | Pin runtime, package version, and supported API members                              | “Use a standard/latest client” leaves version ambiguity             |
| D4 Prompt Engineering    | Ambiguity              | Add relevant context, intent, constraints, and acceptance criteria                   | Shortening or retrying unchanged does not resolve missing facts     |
| D4 Prompt Engineering    | Examples and style     | Small, accurate exemplars anchor structure and conventions                           | Vague adjectives do not define project style                        |
| D4 Prompt Engineering    | Performance            | Specify workload, complexity/memory, mechanisms, and measurement                     | “Fast” is not a measurable requirement                              |
| D4 Prompt Engineering    | API hallucination      | Pin version and allowlist documented endpoints/fields                                | Asking the model to guess “latest” invites fabrication              |
| D4 Prompt Engineering    | Secure coding          | State controls explicitly and retain review/tests/scanning                           | Prompting for security does not guarantee security                  |
| D4 Prompt Engineering    | CI output              | Fix format, schema, and no-prose rule                                                | JSON mixed with explanation is not strict JSON                      |

---

## 6. Common Exam Traps and Misconceptions

1. **Fairness vs. Inclusiveness**: equal treatment/outcomes is Fairness; access across disability/language/culture is Inclusiveness.
2. **Privacy vs. Safety**: data leakage is Privacy and Security; harmful, obsolete, vulnerable, or unvalidated behavior is Reliability and Safety.
3. **Transparency vs. Accountability**: understandable decisions are Transparency; named ownership and remediation are Accountability.
4. **Single principle for a multi-action scenario**: map every policy clause before selecting an option.
5. **Most expensive plan bias**: Enterprise may include a feature, but a “first plan” question often tests the Business baseline.
6. **Old plan list**: 2026 docs include Student, Pro+, and Max; those additions do not move organization-admin content exclusion into individual tiers.
7. **Content exclusion as universal enforcement**: support differs across surfaces; verify current official matrices.
8. **Content exclusion as output filtering**: it controls supported input context, not every property of generated output.
9. **More words equals better prompt**: signal density, evidence, constraints, and acceptance criteria matter more than length.
10. **Examples are automatically good**: an outdated example can anchor an outdated API.
11. **“Latest API” is grounding**: without a version/specification, the model may blend versions.
12. **Security suggestion equals secure code**: Copilot assists; human and automated verification decide.
13. **Machine-readable-looking output**: code fences or prose around JSON can break CI parsing.
14. **Agent read scope equals edit scope**: permit broad inspection when useful, but explicitly bound writes.
15. **Tests as optional speed cost**: removing tests increases agent risk and weakens the evidence needed to review changes.

---

## 7. Coverage Matrix for All 19 Assigned Questions

This matrix identifies where each tested concept is taught without reproducing options or an answer key.

| ID   | Domain            | Tested concept                                              | Primary section                              |
| ---- | ----------------- | ----------------------------------------------------------- | -------------------------------------------- |
| q006 | D1                | Data protection, confidentiality, and security              | Principle Decision Table; Privacy vs. Safety |
| q045 | D3                | First organization plan tier with admin content exclusion   | Copilot Plans and Content Exclusion          |
| q012 | D1                | Preventing personal-data exposure in completions            | Privacy vs. Safety; Responsible Use Workflow |
| q107 | D4                | Improving ambiguous prompts                                 | Improving an Ambiguous Prompt                |
| q025 | D1                | Secure validation, accessibility remediation, and ownership | Combined-Principle Scenarios                 |
| q108 | D4                | Instructions plus examples as quality anchors               | Using Examples to Improve Quality            |
| q027 | D1                | Offensive or unsafe generated content                       | Principle Decision Table; Privacy vs. Safety |
| q001 | D1                | Equal treatment and bias                                    | Fairness vs. Inclusiveness                   |
| q112 | D4                | Matching established project style                          | Matching Project Style                       |
| q028 | D1                | Global teams, cultures, abilities, and languages            | Fairness vs. Inclusiveness                   |
| q123 | D4                | Performance-aware implementation requirements               | Performance-Aware Prompts                    |
| q020 | D1                | Opaque recommendations and understandable decisions         | Transparency vs. Accountability              |
| q247 | D1 / agent safety | Preventing unintended cross-package edits                   | Coding-Agent Safety in a Monorepo            |
| q118 | D4                | Reducing API hallucinations with a constrained contract     | API Grounding and Hallucination Reduction    |
| q029 | D1                | Responding to outdated or insecure generated patterns       | Responsible Use Workflow                     |
| q014 | D1                | Avoiding exclusion of people with disabilities              | Fairness vs. Inclusiveness                   |
| q187 | D4                | Copilot support for secure coding                           | Secure Coding Prompts                        |
| q128 | D3                | Avoiding unsupported library calls                          | API Grounding and Hallucination Reduction    |
| q124 | D4                | Strict output format for direct CI use                      | Machine-Consumable CI Output                 |

---

## 8. No-Spoiler Readiness Checklist

Before launching the quiz, confirm you can do each item without looking up an answer:

- [ ] Distinguish equal treatment from accessible participation.
- [ ] Distinguish data confidentiality from safe/dependable behavior.
- [ ] Explain why harmful output and obsolete insecure code need a validation workflow.
- [ ] Separate understandable AI decisions from human ownership of outcomes.
- [ ] Decompose a scenario containing security review, accessibility repair, and documented responsibility.
- [ ] Identify individual-plan features versus organization-admin governance.
- [ ] Explain content exclusion's purpose and its surface limitations.
- [ ] Strengthen a vague prompt using context, constraints, and acceptance criteria.
- [ ] Use examples and persistent instructions to communicate project style.
- [ ] Express performance as measurable constraints rather than “fast.”
- [ ] Ground generated API code in versions, allowlists, types, and official contracts.
- [ ] Specify secure coding controls while retaining independent verification.
- [ ] Require strict schema-only output for CI.
- [ ] Bound agent edits to intended monorepo packages and keep the diff reviewable.

---

## 9. Quiz Command

Run from the `GH-300 Prep` directory after reading this session file:

```powershell
python quiz_runner.py questions.json --day-lock 16 --carryover 0 --shuffle --open-images --web --port 8765
```

`--carryover 0` is intentional: it keeps this run aligned to the exact 19 Day 16 assignments. Do not run a D5/D6 substitute set merely because the plan heading is stale.

The quiz is not run as part of creating this reference. `progress.md` must remain unchanged until the quiz is complete.

---

## Sources (Verified During This Session)

Official sources were researched on **2026-07-24**. Product names, plan availability, preview status, and supported surfaces can change; re-check these pages near the exam date.

- [Plans for GitHub Copilot](https://docs.github.com/en/copilot/get-started/plans)
- [Content exclusion for GitHub Copilot](https://docs.github.com/en/copilot/concepts/context/content-exclusion)
- [Excluding content from GitHub Copilot](https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/exclude-content-from-copilot)
- [Supported surfaces for GitHub Copilot policies](https://docs.github.com/en/copilot/reference/supported-surfaces-for-policies)
- [Prompt engineering for GitHub Copilot Chat](https://docs.github.com/en/copilot/concepts/prompting/prompt-engineering)
- [Best practices for using GitHub Copilot](https://docs.github.com/en/copilot/get-started/best-practices)
- [Best practices for using GitHub Copilot to work on tasks](https://docs.github.com/en/copilot/tutorials/cloud-agent/get-the-best-results)
- [Adding repository custom instructions for GitHub Copilot](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions)
- [About custom agents](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-custom-agents)
- [Apply responsible AI](https://learn.microsoft.com/en-us/agents/center-of-excellence/responsible-ai)
- [What is Responsible AI?](https://learn.microsoft.com/en-us/azure/machine-learning/concept-responsible-ai?view=azureml-api-2)
- [Responsible AI in Azure workloads](https://learn.microsoft.com/en-us/azure/well-architected/ai/responsible-ai)

---

## Notes (Your Own Words)

After studying, add:

- One sentence distinguishing Fairness from Inclusiveness:

- One sentence distinguishing Privacy and Security from Reliability and Safety:

- Your preferred high-signal prompt template:

- One monorepo boundary you will always state explicitly:

- Any terminology or plan details to re-check before the exam:
