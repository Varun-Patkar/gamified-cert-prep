# Day 16: D3.4 Governance & Responsible AI

**Date**: 2026-08-27
**Domain**: Deploy AI-powered business solutions (40-45%)
**Subtopics**: Governance for agents; Microsoft Responsible AI principles; AI vulnerabilities and mitigations, especially prompt manipulation and injection
**Estimated study time**: 1 hr

---

## TL;DR (60-second skim)

- Govern agents as an estate: maintain a centralized inventory, assign accountable owners, record runtime protection and connector dependencies, and review, retire, or transfer orphaned agents.
- Microsoft's six Responsible AI principles are **fairness, reliability and safety, privacy and security, inclusiveness, transparency, and accountability**.
- A direct attack arrives in the user's prompt; an indirect or document attack is embedded in third-party content such as a retrieved page, email, or uploaded file.
- Prompt Shields detects user-prompt and document attacks, but it is one layer. Separate untrusted content, minimize tool authority, validate actions deterministically, and require approval for consequential operations.
- Content harm controls cover hate and fairness, sexual, violence, and self-harm risks; they do not provide identity, authorization, data, connector, or tool security.
- Release evaluation needs representative and adversarial data plus explicit thresholds across quality, groundedness, safety/security, and agent behavior, not just happy-path completion.
- Red teaming is iterative. Track evidence such as attack success rate, combine automation with human scenario testing, remediate, and retest after material changes.
- Accountability requires preserved incident evidence and versioned records that correlate prompts, data, models, guardrails, tools, approvals, evaluations, deployments, rollback, and outcomes.

---

## Learning Objectives

After this session, you should be able to:

1. Design inventory, ownership, review, deployment, and retirement governance for an agent estate.
2. Apply all six Microsoft Responsible AI principles to an agent solution.
3. Distinguish direct prompt attacks from indirect attacks carried by documents or tool-retrieved content.
4. Select layered mitigations for prompt injection and consequential tool use.
5. Separate content-safety controls from security, authorization, data, and business-policy boundaries.
6. Define release evaluation, red teaming, incident recovery, and versioned governance evidence.

---

## Key Concepts

### 1. Govern the agent estate, not just each prompt

Governance makes every deployed agent **discoverable, accountable, controlled, reviewable, and retireable**. Inventory the stable ID, environment, channels, lifecycle state, purpose, users, data classification, risk tier, named business/technical owners, runtime protection, scans, knowledge, tools, connectors, identities, dependencies, review/exception dates, versions, approvals, evaluations, deployment, and rollback. This reveals stale assets, privilege/data movement, impact, and who accepts risk.

Current Copilot Studio documentation describes maker-visible runtime protection, connector dependency insights, data policies, audit logs, and auditable deploy-from-Git history. It also describes **Microsoft Agent 365** as complementing Copilot Studio with centralized agent inventory, ownership telemetry, lifecycle context, and unified governance telemetry for onboarded organizations.

A shared maker account is not accountable ownership. It weakens attribution, creates a broad credential boundary, and leaves the real business owner unknown. A policy sentence in a system prompt is also not governance: prompts cannot inventory assets, enforce connector policy, transfer ownership, expire exceptions, or retire abandoned deployments.

**Lifecycle control loop**:

`discover -> classify -> assign owner -> assess -> approve -> deploy -> monitor -> review -> change/retire`

Review on a schedule and on events such as an owner leaving, a connector or model changing, a new channel being added, risk-tier escalation, prolonged inactivity, or an incident.

### 2. Microsoft's six Responsible AI principles

| Principle | Agent-design implication |
| --- | --- |
| **Fairness** | Test representative groups and relevant slices; investigate materially different quality, refusal, or outcome rates. |
| **Reliability and safety** | Define intended behavior and safe failure; test edge, degraded, adversarial, and recovery conditions. |
| **Privacy and security** | Apply purpose limitation, data minimization, least privilege, secure identities, retention controls, and incident response. |
| **Inclusiveness** | Include diverse users and accessibility needs in design and testing; avoid preventable exclusion. |
| **Transparency** | Disclose AI use, capabilities, limitations, data/tool behavior, and when human review is required. |
| **Accountability** | Name owners and approvers, keep meaningful human control, preserve evidence, and provide remediation and appeal paths. |

These are sociotechnical principles, not a list of performance metrics or commercial goals. Accuracy, latency, availability, adoption, ROI, profitability, scalability, and extensibility may be important requirements, but they do not replace the six principle names.

Microsoft's operating pattern is **Identify** potential harms and affected people; **Measure** frequency/severity with metrics, datasets, and iterative tests; **Mitigate** with layered controls and remeasurement; then **Operate** with review, telemetry, feedback, incident response, and rollback.

### 3. Direct versus indirect prompt attacks

| Attack path | Where the instruction originates | Typical risk |
| --- | --- | --- |
| User prompt attack | Directly from the user or caller | Attempts to override system rules, extract hidden instructions, change role, or bypass safeguards |
| Document attack / indirect prompt injection | Third-party content processed by the model, such as a page, email, document, search result, or tool output | Treats untrusted data as instructions, potentially causing disclosure, manipulation, or unintended actions |

A malicious instruction in retrieved content is a security attack path, not merely poor grounding. Groundedness asks whether a response is supported by source material; indirect injection asks whether source material can seize control of behavior. Neither attack needs to change model weights.

Microsoft's current Prompt Shields page uses **User Prompt attacks** and **Document attacks**. Foundry red-team documentation also uses **indirect prompt injection** and **XPIA** (cross-domain prompt injected attacks). Recognize these as related terms while preserving the direct/indirect distinction.

### 4. Layered mitigation for prompt injection

No single control is sufficient. Build independent layers so one miss does not become a high-impact action.

1. **Inspect both paths**: apply Prompt Shields to user prompts and to third-party documents/content before generation.
2. **Separate trust domains**: clearly delimit system instructions, user requests, and retrieved data. Treat retrieved text and tool output as untrusted data, never as policy.
3. **Reduce authority**: use least-privilege identities, narrow connector scopes, allowlisted tools, limited records/operations, short-lived tokens, and bounded inputs.
4. **Constrain tool contracts**: expose small typed functions rather than generic HTTP, shell, database, or administrative capability. Reject extra fields and unsafe targets.
5. **Validate deterministically**: enforce schemas, business rules, thresholds, authorization, destination allowlists, and state transitions in code outside the model.
6. **Add human approval**: require an authorized reviewer for high-impact, irreversible, regulated, financial, medical, legal, or privilege-changing operations.
7. **Control outputs and data**: apply appropriate harm filters, DLP, source authorization, secret/PII handling, and egress controls.
8. **Observe and respond**: trace model/tool flow, alert on abnormal or denied actions, preserve evidence, and test incident and rollback procedures.

System prompts improve behavior but are probabilistic instructions, not authorization or enforcement boundaries. Broader permissions increase the blast radius of a successful injection.

### 5. Content safety is not complete security

Azure AI Content Safety classifies four core harm categories:

- **Hate and Fairness** (API term: `Hate`)
- **Sexual**
- **Violence**
- **Self-Harm**

Text classification includes severity. Category guardrails reduce specified input/output content risks. They do **not** authenticate a user, authorize a refund, preserve source ACLs, stop every prompt injection, validate a tool argument, restrict network egress, or investigate an incident.

Match each requirement to its boundary: harm categories/guardrails detect harmful content; Prompt Shields/adversarial tests target malicious instructions; Entra ID, RBAC/scopes, ACLs, and runtime checks authorize data/tools; deterministic code enforces business rules; least privilege, constrained tools, limits, and approval reduce impact; traces, alerts, response, rollback, and regression tests support recovery.

### 6. Human oversight must be an enforceable gate

For consequential actions, let the model gather evidence or recommend, then enforce the decision outside natural language:

`proposal -> schema/auth validation -> deterministic threshold -> authorized approval -> execution -> outcome log`

Evaluate amount, risk tier, jurisdiction, sensitivity, and reversibility in code. The approver needs the correct role and context. Retrospective sampling detects trends but cannot prevent an individual action; prompt caution does not enforce policy.

### 7. Evaluation and release thresholds

A high task-completion score on a small happy-path set is not release evidence.

| Dimension | Examples |
| --- | --- |
| General quality | Coherence, fluency, relevance, correctness, domain criteria |
| RAG | Groundedness, retrieval relevance, citation/support quality |
| Safety and security | Harm categories, protected material, prompt attack resistance, leakage, prohibited actions |
| Agent behavior | Task adherence/completion, tool-call accuracy, argument validity, unnecessary calls, escalation |
| Representative slices | User groups, languages, accessibility needs, high-impact cohorts, edge conditions |
| Operations | Latency, errors, cost, dependency failure, denied operations, recovery |

Use normal, edge, adversarial, degraded-dependency, and relevant user-slice cases. Set release thresholds and stop conditions; preserve dataset/evaluator versions, configuration, results, exceptions, and approval. Foundry observability combines evaluations, traces, and production monitoring. Traces expose model calls, tool invocations, decisions, and dependencies. Continuous/scheduled evaluation, scheduled red teaming, dashboards, and alerts complement preproduction gates.

### 8. Red teaming is iterative evidence

The Microsoft Foundry AI Red Teaming Agent automates adversarial probing using Microsoft PyRIT capabilities and risk/safety evaluators. Its key metric is:

`ASR = successful attacks / total attempted attacks`

Use scorecards/logs to compare releases. Combine automation with expert, business-specific testing because current docs note synthetic/mock-tool limits, adversarial-only populations, nondeterminism, and false positives. Repeat after prompt, model, data, guardrail, tool, identity, connector, or orchestration changes:

`plan abuse cases -> probe -> review evidence -> prioritize -> remediate -> regression test -> re-probe -> approve/hold`

A one-time scan is a point-in-time observation, not a permanent certification.

### 9. Accountable incident handling after containment

Containment stops immediate harm; recovery still requires an accountable owner; controlled preservation and correlation of traces/configurations/tool evidence; scope and root-cause analysis; required notifications; corrective controls; targeted regression/adversarial tests; restoration approval; and monitored recovery. A blocklist can help contain but is brittle against paraphrase. Deleting traces before scoping destroys evidence.

### 10. Versioned governance evidence

Treat a release as a correlated bundle, not “the current prompt.” Version prompts/orchestration; grounding data/indexes/permissions; model and tuning assets; guardrails/Prompt Shields/policies; and tools/connectors/identities/permissions. Each change record needs **owner, approver, reason, affected versions, risk assessment, evaluation evidence, deployment, rollback path, and production outcome**. Current-state-only evidence cannot explain an incident or identify the correct rollback.

---

## Decision Frameworks

### Which control should you choose?

- Harmful content: harm categories, severity thresholds, and guardrails.
- Adversarial user/document instructions: Prompt Shields plus untrusted-content separation.
- Unauthorized data/action: identity, least privilege, ACLs, and constrained tools.
- Business threshold/consequential action: deterministic validation plus authorized approval.
- Unknown/changing attack paths: automated and human red teaming.
- Operational failure/incident: tracing, alerts, evidence, response, rollback, and retest.

### Can the agent execute autonomously?

- **Bounded autonomy:** low impact, reversible, narrowly authorized, deterministically validated, and monitored.
- **Human gate:** high value, irreversible, regulated, safety-relevant, or rights-affecting.
- **Fail closed/escalate:** missing identity, policy context, evidence, or dependency.

---

## Comparisons

- **Prompt vs boundary:** prompts guide behavior; identity, permissions, policy, and code enforce it. **Harm filter vs Prompt Shields:** one classifies harmful content; the other targets adversarial instructions.
- **Grounding vs injection:** one concerns source support; the other concerns untrusted content attempting control. **Point metric vs assurance:** completion, monitoring, scans, or current state are partial evidence, not responsible release proof.

---

## Important Details for Exam

- Memorize the six Responsible AI principle names exactly; do not substitute business metrics.
- Microsoft Learn currently labels the first Content Safety category **Hate and Fairness**, with API term `Hate`.
- Prompt Shields is a unified Azure AI Content Safety API for adversarial user prompts and third-party documents/content.
- Foundry evaluators span quality, RAG, safety/security, and agent measures; traces capture model calls, tools, decisions, and dependencies.
- ASR is successful attacks divided by attempts; automated results may be nondeterministic and require review.
- Material changes invalidate “tested once” assumptions and trigger risk-based reevaluation.
- **Time-sensitive terminology (verified 2026-08-26):** Learn uses **Microsoft Foundry**, **AI Red Teaming Agent**, **Prompt Shields**, **Guardrails (previously content filters)**, and **Agent 365** for centralized governance capabilities. Recheck during final revision.

---

## Common Traps & Misconceptions

- **Trap:** A strong prompt/shared account governs the estate. **Reality:** governance needs inventory, named accountability, policy, dependencies, review, evidence, and retirement.
- **Trap:** Retrieved attacks are grounding defects and filters secure everything. **Reality:** indirect injection, identity, authorization, data, and tool boundaries require separate controls.
- **Trap:** Later sampling or happy-path completion proves control/readiness. **Reality:** use pre-execution gates plus representative, edge, adversarial, multidimensional threshold tests.
- **Trap:** One scan certifies safety or one blocklist restores service. **Reality:** preserve evidence, remediate, and iteratively regression/red-team test.
- **Trap:** The latest prompt documents the release. **Reality:** prompts, data, models, guardrails, tools, permissions, approvals, and outcomes all need correlated versions.

---

## Real-World Scenarios

- **Before release:** inventory/assign owners; scan user and retrieved inputs; constrain tools; add deterministic approval gates; evaluate representative, edge, and adversarial cases against thresholds.
- **After misuse:** contain; preserve/correlate evidence; scope, root-cause, and notify; correct the failed layer; regression-test/red-team; approve and monitor restoration.

---

## Quick Reference Card

Use this sequence: **inventory and own -> identify risks -> measure broadly -> layer mitigations -> gate consequential actions -> red-team and release by threshold -> trace and monitor -> preserve, remediate, retest, and version evidence**. For per-question cues, use the readiness map below.

---

## Quiz Readiness Map

This map identifies the concept and likely distractor pattern without reproducing question wording, options, or answer keys.

| ID | Concept to recognize | Trap to reject |
| --- | --- | --- |
| q151 | Estate-wide inventory, accountable ownership, runtime/connector visibility, lifecycle review and retirement | Prompt-only governance or attribution through a shared account |
| q152 | The exact six Microsoft Responsible AI principle names | Metrics, platform qualities, or business goals presented as principles |
| q153 | Attack classification by instruction origin: caller versus third-party content | Reversing direct/indirect labels or calling malicious content an ordinary grounding issue |
| q154 | Defense in depth across detection, trust separation, least privilege, deterministic validation, and approval | Treating a system prompt or broader authority as sufficient defense |
| q155 | Scope of harm-category guardrails versus security, authorization, tool, and data controls | Assuming content filtering enforces every application boundary |
| q156 | Enforceable policy threshold and meaningful authorized human control before a consequential action | Prompt caution or retrospective review as prevention |
| q157 | Representative/adversarial evaluation with multidimensional metrics and release thresholds | Happy-path task completion as the only release criterion |
| q158 | Repeatable automated red teaming, ASR evidence, expert human scenarios, remediation, and retest | A one-time scan as permanent proof |
| q159 | Accountable post-containment investigation, evidence, notification, corrective controls, and verified recovery | Blocklist-only restoration or evidence destruction |
| q160 | Correlated, versioned evidence across every independently changing agent asset and decision | Current-state-only documentation |

---

## Cross-Domain Quiz Question Refreshers

All ten assigned questions for Day 16 are within **D3.4 Governance & Responsible AI**. There are **no outside-domain carryovers** in this quiz because the command uses `--carryover 0`.

| Concept | Key fact | Trap |
| --- | --- | --- |
| Cross-domain coverage | None for Day 16; q151-q160 are all D3.4 | Adding prior-day questions would exceed the required ten |

---

## Hands-On Lab (optional)

**Bonus thought exercise (5-10 min):** choose one agent you know and create a one-page release record containing owner, risk tier, data/tools, least-privilege identity, prompt/document defenses, consequential-action gate, evaluation thresholds, incident owner, and rollback reference. Then simulate one indirect-injection incident and identify the exact evidence needed to scope it. No Azure subscription is required.

---

## Related Questions in questions.json

Assigned IDs: `q151` through `q160`. They cover estate governance, the six principles, attack classification and mitigation, content-safety scope, consequential-action gates, evaluation, red teaming, incident recovery, and versioned evidence. See **Quiz Readiness Map** above for the per-ID mapping.

Quiz command (exactly the ten Day 16 assignments, with no carryover):

```powershell
python quiz_runner.py questions.json --day-lock 16 --carryover 0 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [Security and governance - Microsoft Copilot Studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/security-and-governance)
- [Embrace Responsible AI principles and practices](https://learn.microsoft.com/en-us/training/modules/embrace-responsible-ai-principles-practices/)
- [Identify guiding principles for Responsible AI](https://learn.microsoft.com/en-us/training/modules/embrace-responsible-ai-principles-practices/3-identify-guiding-principles-responsible-ai)
- [Prompt Shields in Azure AI Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection)
- [Harm categories in Azure AI Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/harm-categories)
- [Responsible AI practices for Azure OpenAI in Foundry Models](https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/openai/overview)
- [Observability in Generative AI - Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/concepts/observability)
- [AI Red Teaming Agent - Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/concepts/ai-red-teaming-agent)

---

## Notes (your own words - fill this in after studying)

- 
