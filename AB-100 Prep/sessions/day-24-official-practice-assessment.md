# Day 24: Official Practice Assessment (Attempt 1)

**Date**: 2026-09-04
**Prepared and source-verified**: 2026-09-02
**Domain**: Mixed assessment — Plan (25–30%), Design (25–30%), Deploy (40–45%)
**Subtopics**: Official practice attempt, evidence-based gap logging, mixed-domain remediation
**Estimated study time**: 1 hr
**Progress entering session**: Session 24 of 31 | Days completed: 23 | Local questions answered: 246 | Accuracy: 97.6%

---

## Session Order and Timebox

| Time | Activity | Rule |
| --- | --- | --- |
| 0–5 min | Read the briefing and no-spoiler strategy below | Stop before **Post-Assessment Concept Review** |
| 5–40 min | Take the official Microsoft Practice Assessment | No documentation lookup during Attempt 1 |
| 40–47 min | Capture the score and gaps | Record patterns, not copied question text |
| 47–55 min | Review only the relevant concept sections | Prioritize Domain 3 and repeated error patterns |
| 55–60 min | Start the 10-question local Day 24 gap check | q191–q200; complete it before marking Day 24 done |

If the official assessment itself consumes the full hour, stop after the gap log. The local check is the next action, not a reason to rush the official attempt.

---

## TL;DR (60-Second Skim)

- Take the official assessment **before** reading the concept review so Attempt 1 remains diagnostic.
- Launch it from the [AB-100 exam page](https://learn.microsoft.com/en-us/credentials/certifications/exams/ab-100/) or use the [direct assessment link](https://learn.microsoft.com/credentials/certifications/exams/ab-100/practice/assessment); sign in to Microsoft Learn.
- Treat the result as a skills map, not an exam prediction. Microsoft says practice items are examples and do not reproduce exam length, complexity, case studies, or labs.
- Domain 3 carries 40–45%, so deployment, monitoring, testing, ALM, security, governance, risk, and compliance gaps get first remediation priority.
- Classify every miss as a knowledge gap, decision-pattern gap, wording error, or confidence/time error.
- Do not copy assessment questions into this repository. Record the objective, mistaken assumption, official rationale, source URL, and a rule in your own words.
- After targeted review, run the extension’s Day 24 local quiz for q191–q200.
- Do not mark Day 24 complete until both the official assessment and local quiz are finished.

---

## Learning Objectives

By the end of this session, you should be able to:

1. Establish a cold baseline against the current official assessment.
2. Turn the score report into a ranked remediation backlog tied to AB-100 skills.
3. Recognize mixed-domain decisions and validate remediation with the ten new Day 24 local questions.

---

## Official Assessment: Attempt Instructions

1. Open the [official AB-100 Practice Assessment](https://learn.microsoft.com/credentials/certifications/exams/ab-100/practice/assessment).
2. If that URL redirects to the Credentials home page, open the [AB-100 exam page](https://learn.microsoft.com/en-us/credentials/certifications/exams/ab-100/) and select **Take a free practice assessment**.
3. Sign in to Microsoft Learn. The assessment is free, can be retaken without limit, and may offer multiple languages.
4. Take Attempt 1 without Learn documentation, prior notes, or the review sections below.
5. Read qualifiers carefully: *first*, *best*, *most important*, *before*, *real time*, *current*, *consequential*, and *representative* usually identify the tested boundary.
6. For select-N items, choose exactly the requested number. Practice scoring requires all requested choices and no extras; actual exam scoring can differ.
7. Finish and retain the score report, which includes an answer, rationale, and further-reading URL for each item. Log concepts only, not proprietary item text or choices.

### No-Spoiler Pre-Assessment Strategy

Use this four-pass reasoning loop without searching for memorized phrases:

1. **Name the lifecycle stage**: plan, design, deploy/operate, or govern.
2. **Name the object**: use case, prompt asset, model route, UI experience, voice turn, connector/tool, session, test conversation, agent version, or consequential action.
3. **Name the boundary**: business outcome, data freshness, user/workload authority, channel, environment, version, trust, or approval.
4. **Choose evidence before intervention**: diagnose before broad tuning; evaluate before promotion; authorize before action; measure value before selecting technology.

When two choices seem plausible, prefer the one that addresses the stated failure at the correct boundary and produces verifiable evidence. Avoid broad global changes when the scenario describes a narrow cohort or component.

---

## Weighted Domain Reminders

| Domain | Weight | What the architect is usually deciding |
| --- | ---: | --- |
| Plan AI-powered business solutions | 25–30% | Outcomes, data readiness, feasibility, portfolio priority, platform pattern, prompt/model strategy, ROI/TCO |
| Design AI-powered business solutions | 25–30% | Agent behavior, user experience, grounding, tools/connectors, authorization, orchestration, extensibility |
| Deploy AI-powered business solutions | 40–45% | Monitoring, evaluation, ALM, versions, release gates, rollback, security, governance, compliance, auditability |

**Triage rule**: remediate a repeated misconception first; otherwise prioritize Domain 3, then the lowest-scoring domain, then isolated low-confidence items.

---

## Gap Log Template

Fill one row per **concept gap**, not necessarily one row per question.

### Attempt Summary

- Official assessment date/time:
- Score or percentage:
- Time used:
- Lowest domain/skill area:
- Number of flagged low-confidence answers:
- Local Day 24 result (complete later):

### Gap Details

| Domain / objective | Concept in my own words | My mistaken assumption | Official rationale distilled | Evidence URL | Gap type | Priority | One-sentence replacement rule | Retest status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  | Knowledge / Decision / Wording / Confidence | High / Medium / Low |  | Not tested |
|  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |

> Stop here until the official assessment is complete. The remaining sections are post-assessment remediation material.

---

## Post-Assessment Concept Review

### 1. Use-Case Portfolio Before Platform Selection

AI strategy begins with business problems and measurable outcome gaps. Express each candidate as an activity, affected users/process, baseline, target measure, and expected value. Then test feasibility: required data exists, is accessible and fit for grounding; skills and integrations are available; costs are supportable; and operational, autonomy, security, compliance, and Responsible AI risks have owners and controls.

A useful portfolio record includes outcome metric, business owner, frequency/scale, data readiness, technical feasibility, expected benefit, TCO drivers, risk tier, human-control requirement, dependencies, and recommended build/buy/extend pattern. A proof of concept is appropriate for a specific high-value uncertainty, not as a substitute for screening every idea.

### 2. Governed Prompt Assets

“Prompt library” is an AB-100 operating-model objective, not a magic product feature. Treat a reusable prompt as a governed solution asset with:

- Identity and use: stable ID, purpose, intended/prohibited uses, owner, approver, and consumers.
- Contracts: typed inputs, constraints, trust boundaries, sample inputs, output schema, grounding, refusal, and escalation.
- Dependencies and policy: model/runtime, tools, knowledge, safety controls, and data classification.
- Lifecycle evidence: immutable version, status, change history, approved examples, evaluation set/metrics/results, limitations, promotion, and deprecation.

Prompt text alone is not enough to prove ownership, compatibility, quality, or approval.

### 3. Model Router as an Evaluated Optimization Layer

Microsoft Foundry model router is deployed as a model and performs per-request routing among eligible underlying models. It analyzes prompt attributes such as complexity, reasoning, and task type. Current routing modes are **Balanced** (default), **Cost**, and **Quality**; custom model subsets can constrain the eligible pool for cost, compliance, or performance needs.

Treat routing as a candidate architecture, not an assumed win. Replay representative production traffic and compare task-quality measures, tail latency, token/transaction cost, failure/fallback behavior, regional/data-zone constraints, and safety outcomes against a baseline. Model updates or pool changes can alter behavior and cost, so monitor and reevaluate material changes.

### 4. Code-First Generative Pages and Agent Feed Experiences

Separate the **primary interactive workspace** from the **agent activity/recommendation stream**. Generative pages accelerate creation of data-driven model-driven app pages from natural-language requirements; code-first extensions add complex rules, custom controls, APIs, performance handling, and security-aware data pipelines. Agent feeds surface contextual insights, summaries, recommended actions, and automation triggers inside the app.

Computer Use addresses automation through an existing UI when a suitable API or native integration is unavailable. It is not a generic replacement for application UX architecture.

### 5. Voice Is a Behavioral Modality

A voice-enabled Copilot Studio agent uses Speech & DTMF behavior and voice-specific system topics. Design for short, speakable turns; recognition errors and domain vocabulary; silence and reprompt behavior; barge-in/interruption; DTMF where appropriate; fallback/escalation; and explicit confirmation for consequential actions.

Long-running operations need progress/latency messaging rather than unexplained silence. Current basic-voice settings include a default 500 ms delay before a latency message and a 5,000 ms minimum playback time; validate current settings for the chosen harness. Test with real calls because telephony, speech recognition, timing, background noise, and interruption behavior are not visible in text-only tests.

### 6. Governed Real-Time Tools and Authorization

Current transactional facts belong behind a stable API exposed through an appropriate connector or agent tool. Give the operation a precise purpose, narrow inputs, typed/validated schema, bounded output, clear side effects, useful errors, timeouts, retry/idempotency behavior, and telemetry.

Authentication proves identity; authorization grants a permitted operation. Use delegated/on-behalf-of authority when results or actions must reflect the current user’s permissions. Use a dedicated workload identity for bounded unattended work. In either case, scope the API separately: access to a CRM or the agent does not automatically grant access to another pricing or refund system. Static prompts, grounding snapshots, and model tuning are poor stores for volatile authorization-sensitive facts.

### 7. Segment Monitor Evidence Before Tuning

Copilot Studio Monitor moves from aggregate KPIs to detailed component and session evidence. Start with the reported cohort: time range, channel, conversation outcome, topic/plan, tool/component, agent version, user segment, latency, and handoff/escalation path. Then inspect recent session details and transcripts where permissions permit.

Current documentation states that Monitor data is available for up to 360 days, while session details and transcript information are available for the last 28 days; timestamps are UTC. Test-panel activity is not included. Transcript access additionally requires the Bot Transcript Viewer role. Use evidence to tune the affected path and run regression checks on unaffected cohorts.

### 8. Test the Conversation, Not Only the Final Text

Keep focused single-response tests for component-level meaning, grounding, exact/keyword behavior, and tool expectations. Add representative conversational tests when behavior depends on earlier turns, correction, clarification, state, tool selection, authorization, confirmation, recovery, or multi-step completion.

Copilot Studio conversational evaluation is intended to test context maintenance, clarifying questions, and multi-step tasks. Current limits are up to 20 test cases per conversation test set and up to 12 total messages per case (six question/answer pairs). Evaluate the sequence and business outcome as well as response quality; a polished final sentence can conceal the wrong tool, skipped confirmation, or incorrect state transition.

### 9. Versioned Foundry Agent Release

Treat instructions, model, tools, knowledge/configuration references, guardrails, and evaluation evidence as a release candidate. Create a new agent version, evaluate it, select the intended active version, pass release gates, expose it through the stable endpoint, and roll out under monitoring. Retain a prior validated version and its configuration/evidence so rollback is operationally possible.

Foundry documentation distinguishes mutable development from consumers: publishing exposes a stable endpoint, and the active version served by that endpoint can change without forcing every consumer to adopt a new endpoint. Avoid “always latest” where controlled production promotion is required. Development endpoints and direct production editing weaken reproducibility and rollback.

### 10. Layered Defense for Indirect Prompt Manipulation

Retrieved documents, emails, web pages, uploads, and tool output are untrusted content even when they are useful grounding. Indirect attacks hide instructions in third-party content to gain unauthorized control or trigger unintended commands. Prompt Shields can inspect user prompts and documents, but detection and harmful-content filtering are only layers.

Constrain impact with trust-boundary separation, least-privilege identity and tool scopes, narrow typed operations, server-side schema and business-rule validation, record ownership checks, transaction limits, approval/confirmation for consequential actions, Power Platform data policies/DLP, network/egress controls, audit logs, anomaly monitoring, incident response, and adversarial regression tests. Hidden instructions do not replace deterministic authorization.

---

## Decision Patterns

| Scenario signal | Decision questions to ask | Common category error |
| --- | --- | --- |
| Many proposed initiatives | Outcome? data? feasibility? value? risk? owner? | Choosing one platform before validating use cases |
| Reused prompts | Which version, owner, contract, evidence, consumers, changes? | Treating shared text as a governed asset |
| Mixed request complexity | Does representative evaluation support managed routing? | Equal/random routing without workload evidence |
| App needs page plus ongoing AI guidance | Which surface is interactive workspace; which is insight/activity stream? | Substituting an automation mechanism for UX design |
| Text agent moves to phone | How do timing, recognition, interruption, silence, and confirmation change? | Assuming speech synthesis completes voice design |
| Current secured external facts | Which tool contract and which acting identity/authorization? | Putting volatile facts in prompts or model weights |
| Aggregate KPI hides complaint | Which cohort/component/session evidence isolates the regression? | Global tuning before diagnosis |
| Single-turn tests pass, production journeys fail | Which turn sequence, state, tool, and outcome must be evaluated? | Scoring only final wording |
| Shared production agent changes | Which immutable version, gates, stable endpoint, rollout, rollback? | Editing production in place |
| Untrusted grounding plus powerful tool | How are content, authority, inputs, approval, policy, and monitoring layered? | Treating content filtering as authorization |

---

## Common Traps and Misconceptions

- **Selection traps**: product-first portfolios, round-robin routing, or UX mechanisms used for unrelated problems.
- **Governance traps**: text-only prompt galleries, inherited cross-system authorization, or production edits without versions.
- **Channel traps**: treating voice as text read aloud or ignoring timing, recognition, interruption, and confirmation.
- **Evidence traps**: using aggregate KPIs or final-answer fluency as proof that the full path works.
- **Security traps**: treating content filtering as an ACL, tool validator, DLP policy, transaction limit, or approval control.

---

## Cross-Domain Quiz Question Refreshers

| ID | Domain | Topic / service | Concept to review | Trap pattern |
| --- | --- | --- | --- | --- |
| q191 | D1 | Cloud Adoption Framework AI strategy | Portfolio prioritization by measurable value, feasibility, data readiness, cost, and risk | Platform-first mandate or undirected POCs |
| q192 | D1 | Prompt-library governance | Owner, purpose, contracts, versions, examples, evaluations, lineage, consumers | Text-only gallery or independent production copies |
| q193 | D1 | Microsoft Foundry model router | Per-request suitability plus representative quality/latency/cost evaluation | Round robin or unevaluated user choice |
| q194 | D2 | Power Apps generative pages / agent feed | Contextual app workspace versus in-app insight/activity stream | Confusing UX with Computer Use or model selection |
| q195 | D2 | Copilot Studio voice | Speakable turns, timing, interruption, recognition, fallback, confirmation, live-call tests | Treating voice as text-to-speech only |
| q196 | D2 | Dynamics 365 Sales connector / agent tool | Fresh external facts, explicit contract, delegated or workload authorization | Static knowledge or assumed cross-system authority |
| q197 | D3 | Copilot Studio Monitor | Segment cohort, inspect metrics/sessions/transcripts/components, then tune | Global changes from aggregate KPIs |
| q198 | D3 | Copilot Studio agent evaluation | Representative multi-turn state, clarification, tool, confirmation, and outcome tests | Testing only isolated or final text |
| q199 | D3 | Microsoft Foundry Agent Service ALM | Evaluated versions, active version, stable endpoint, gates, rollout, rollback | In-place overwrite or development endpoint reuse |
| q200 | D3 | Prompt Shields / Copilot Studio governance | Untrusted content plus least privilege, validation, approval, DLP, and monitoring | Relying on filtering or hidden instructions alone |

---

## Post-Assessment Triage

1. Add every incorrect **and guessed-correct** concept to the gap log.
2. Merge duplicates into one misconception and count recurrence.
3. Rank: confident misconception > repeated gap > Domain 3 gap > other isolated gap.
4. Read the official rationale/source, write a replacement rule, and review only the matching section above.
5. Run the local quiz; log any miss for Day 26, and complete Day 24 only after both attempts are recorded.

---

## Quick Reference Card

`Outcome -> evidence -> architecture -> authorization -> evaluation -> version -> monitor -> improve`

- **Plan**: measurable business outcome, usable data, feasibility, value/TCO, risk, owner, then solution pattern.
- **Design**: correct experience, current grounding, explicit tool contract, correct identity, least authority, voice/channel behavior.
- **Deploy**: segmented telemetry, representative single- and multi-turn tests, immutable version, gates, stable endpoint, rollback.
- **Secure**: untrusted content, least privilege, typed validation, approval for consequences, DLP/egress, monitoring and audit.

---

## Run the Local Day 24 Quiz

Use the repository’s VS Code extension after completing the official assessment and targeted review:

1. Open Copilot Chat and run `@certprep /today`.
2. Confirm it shows **Day 24 — Official Practice Assessment (Attempt 1)**.
3. Open Day 24 and select **Start the quiz**, or select **Straight to the quiz**.
4. The Day 24 assignment is q191–q200: ten new mixed-domain questions weighted 3 D1 / 3 D2 / 4 D3.
5. Complete all ten in the extension so `progress.json`, XP, streak, results, and sync follow the repository’s normal workflow.

Do not use a Python command for this repository: no `quiz_runner.py` exists here. Do not manually edit progress or mark plan checkboxes before the extension records completion.

---

## Sources (Verified Live During This Session)

- [AB-100 exam page](https://learn.microsoft.com/en-us/credentials/certifications/exams/ab-100/)
- [AB-100 official Practice Assessment](https://learn.microsoft.com/credentials/certifications/exams/ab-100/practice/assessment)
- [Prepare for a Microsoft certification exam](https://learn.microsoft.com/en-us/credentials/certifications/prepare-exam#take-a-practice-assessment)
- [Practice Assessment FAQs](https://learn.microsoft.com/en-us/credentials/certifications/frequently-asked-questions#practice-assessments-frequently-asked-questions)
- [AB-100 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-100)
- [Cloud Adoption Framework: AI strategy](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai/strategy)
- [Model router concepts](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-router)
- [Design AI agents for business solutions](https://learn.microsoft.com/en-us/training/modules/design-ai-agents-business-solutions/)
- [Code-first generative pages and agent feed applications](https://learn.microsoft.com/en-us/training/modules/design-ai-agents-business-solutions/11-propose-code-first-generative-pages-agent-feed-applications)
- [Configure basic voice agents](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-configuration)
- [Design connectors for Copilot in Dynamics 365 Sales](https://learn.microsoft.com/en-us/training/modules/design-ai-agents-business-solutions/5-design-connectors-copilot-dynamics-365-sales)
- [Copilot Studio Monitor overview](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-overview)
- [Monitor conversational agents](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-improve-agent-effectiveness)
- [Choose agent evaluation methods](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-overview)
- [Create a conversational test set](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-multi-turn)
- [Microsoft Foundry Agent Service overview](https://learn.microsoft.com/en-us/azure/foundry/agents/overview)
- [Publish Foundry agents to Microsoft 365 Copilot and Teams](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/publish-copilot)
- [Copilot Studio security and governance](https://learn.microsoft.com/en-us/microsoft-copilot-studio/security-and-governance)
- [Prompt Shields in Azure AI Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection)

---

## Notes (Your Own Words — Fill This In After Studying)

- The decision pattern I most often miss:
- Highest-priority topic for Day 26 remediation:
