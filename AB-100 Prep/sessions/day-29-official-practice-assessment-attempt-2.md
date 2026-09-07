# Day 29: Official Practice Assessment (Attempt 2)

**Date**: 2026-09-07
**Scheduled plan date**: 2026-09-09 (working ahead)
**Domain**: Mixed assessment - Plan (25-30%), Design (25-30%), Deploy (40-45%)
**Subtopics**: Official practice assessment, timed decision-making, domain-weighted gap analysis, targeted remediation
**Estimated study time**: 1 hr
**Progress entering session**: Session 29 of 31 | Days 1-28 complete | Day 28: 10/10

> **Status:** Preparation only. Attempt 2 has not been taken, no official score is recorded, and Day 29 is not complete.
>
> The local Day 29 assignment contains exactly ten questions, q211-q220. Do not edit assignment or progress files manually.

---

## TL;DR (60-second skim)

- Take Official Practice Assessment Attempt 2 as a fresh readiness check: no notes, no session files, and no documentation during the first pass.
- Use a 35-minute assessment target, then spend 20 minutes reviewing incorrect and guessed-correct items and 5 minutes capturing next actions.
- Treat the result as diagnostic evidence, not a pass prediction; Microsoft says practice assessments do not reproduce the exam's length, complexity, case studies, or possible labs.
- Weight gaps by the live AB-100 blueprint: D1 Plan 25-30%, D2 Design 25-30%, and D3 Deploy 40-45%.
- On the real expert role-based exam, Microsoft Learn is available, but the timer continues and no extra time is added. Use it only for narrow fact checks after answering what you know.
- Look for boundaries: trust versus authority, experience sharing versus source access, authentication versus DLP, and compute lifecycle versus identity lifecycle.
- Review every miss and every guess. Convert each into a one-sentence decision rule and a Microsoft Learn source.
- Day 29 is complete only after the official attempt, score/gap capture, targeted review, and the ten-question local mixed check are finished.

---

## Learning Objectives

By the end of the session, you should be able to:

1. Execute Attempt 2 under consistent, exam-like conditions.
2. Allocate attention according to the current AB-100 domain weights.
3. Apply ten recurring architecture decision patterns without relying on memorized answer wording.
4. Distinguish knowledge gaps from boundary, wording, and time-management errors.
5. Turn the score report into a small, ranked remediation plan for Days 30-31.

---

## Pre-Attempt Setup

Complete this checklist before selecting **Start assessment**:

- [ ] Open the [AB-100 exam page](https://learn.microsoft.com/en-us/credentials/certifications/exams/ab-100/) and select **Take a free practice assessment**.
- [ ] Sign in to the Microsoft Learn profile used for the first attempt so the experience can retain its normal history.
- [ ] Close this reference, prior session notes, search tabs, and question files.
- [ ] Silence notifications and reserve one uninterrupted hour.
- [ ] Keep only a blank scratch area for question numbers, confidence, and domain tags; do not write product facts in advance.
- [ ] Set a visible 35-minute assessment target and a 55-minute hard stop for review.
- [ ] Record the start time below, but leave score fields blank until submission.

**Attempt start time:**  
**Assessment version/language, if shown:**  

Microsoft states that Practice Assessments are free, require a Learn profile, and can be taken repeatedly. Their value is the score report: each item includes an answer, rationale, and further-reading URL. Repetition is useful only when you reason from requirements rather than recognize remembered wording.

---

## Timebox

| Time | Activity | Output |
| --- | --- | --- |
| 0-5 min | Setup and reset | Closed notes, blank confidence log, assessment open |
| 5-40 min | No-notes first pass | Completed official attempt with confidence marks |
| 40-50 min | Review misses and guesses | Gap rows with official rationale and source URL |
| 50-55 min | Domain-weighted triage | Top three remediation priorities |
| 55-60 min | Recall and next step | Replacement rules; local mixed check queued |

If the assessment takes longer than 35 minutes, finish it without rushing. Preserve the diagnostic attempt and move the detailed review to the next focused block rather than fabricating a result or marking the day complete.

---

## No-Notes First-Pass Strategy

For each item, use this sequence:

1. **Name the domain and lifecycle stage.** Is the architect planning value, designing behavior/integration, or deploying/operating/governing?
2. **Identify the actor and object.** User, maker, workload, agent, connector, model, environment value, telemetry event, or knowledge source.
3. **Underline the decisive constraint.** Examples: untrusted input, privileged action, current-user permissions, replaceable host, regex validation, or production-only telemetry.
4. **Name the control layer.** Orchestration, deterministic validation, authentication, authorization, data policy, RBAC, ALM, or monitoring.
5. **Choose the least-complex supported design that satisfies every stated requirement.** Reject extra models, custom code, privileges, or agents without evidence.
6. **Record confidence:** `H` if you can explain why alternatives fail, `M` if two choices remain plausible, and `L` if you are guessing.

Do not spend more than about 75 seconds on a first-pass item. Select the best current answer, flag it, and move on. Revisit flagged items only after every question has an answer.

### Qualifier Scan

Watch for words that change the architecture:

- **first / before**: sequence and prerequisite
- **best / most appropriate**: all constraints, not merely one true statement
- **current user / on their behalf**: delegated user authorization
- **stable / replaceable / recycled**: lifecycle boundary
- **production only**: telemetry scope
- **custom regex / constrained**: deterministic validation
- **published dynamically**: capability discovery rather than static authoring
- **restricted / sensitivity label**: source authorization remains active

---

## Microsoft Learn Strategy for the Real Exam

AB-100 is an expert role-based exam. Current Microsoft exam guidance says Microsoft Learn is available inside associate and expert exams. It is a lookup resource, not an answer-everything workflow:

- The exam timer continues while Learn is open, and no extra time is added.
- Access is limited to `learn.microsoft.com`; external domains are blocked.
- Q&A, Practice Assessments, and your Learn profile are unavailable.
- Learn opens beside the exam in split screen and supports multiple Learn tabs.
- `Ctrl+F` searches the current Learn page, not the exam question.

Use Learn only after a closed-book answer when one exact fact could change it: a current limitation, supported capability, configuration precedence, or precise telemetry field. Search with product plus discriminating noun, such as `Copilot Studio regex entity input`, `designMode test canvas`, or `managed identity recycled resources`. Stop after roughly 90 seconds if the source does not resolve the decision.

For Attempt 2, deliberately do **not** use Learn on the first pass. This gives a cleaner readiness signal. During review, open the URLs supplied by the official score report and verify the rule in your own words.

---

## Domain-Weight Checklist

The live study guide lists skills measured as of **July 22, 2026**.

| Domain | Weight | Before submission, verify you considered |
| --- | ---: | --- |
| D1 Plan AI-powered business solutions | 25-30% | Business outcome, data readiness, build-buy-extend, multi-agent boundaries, model suitability, ROI/TCO |
| D2 Design AI-powered business solutions | 25-30% | Agent behavior, topics, tools, knowledge, orchestration, extensibility, user experience, source authorization |
| D3 Deploy AI-powered business solutions | 40-45% | Monitoring, testing, ALM, release controls, identity, security, governance, Responsible AI, compliance, audit |

### Domain 1 Recall

- [ ] Can I justify a multi-agent boundary with distinct trust, authority, ownership, or failure containment?
- [ ] Did I start with requirements and existing supported capabilities before proposing custom development?
- [ ] Did representative evaluation prove the selected model meets quality and nonfunctional constraints?

### Domain 2 Recall

- [ ] Does probabilistic orchestration need a deterministic collection or validation step?
- [ ] Is the integration static, or should published tools/resources be discovered dynamically?
- [ ] Did I separate access to the agent experience from authorization to its source content?

### Domain 3 Recall

- [ ] Is telemetry scoped to production rather than maker/test activity?
- [ ] Are publisher-owned definitions/defaults separated from target-owned current values?
- [ ] Did I distinguish the acting identity from connector/data-movement policy?
- [ ] Does the identity lifecycle match the workload rather than a replaceable compute host?

---

## Scenario and Decision-Pattern Refreshers

### Trust and Authority

Split responsibilities when one stage consumes untrusted content and another can perform a consequential privileged action. The useful boundary is enforceable: separate identity/permissions, structured handoff, validation, reauthorization, approval where needed, and audit. Multiple agents are not automatically better; coordination overhead must be justified by specialization or security requirements.

### Build, Buy, Extend

Use a requirements-first ladder: adopt a supported product when it satisfies the commodity need; extend it for a specific supported gap; build when material differentiated behavior or unsupported control remains. Include licensing, implementation, integration, evaluation, monitoring, security, upgrades, and support in lifecycle TCO.

### Model Selection

Parameter count is not an acceptance criterion. Evaluate representative tasks against quality thresholds plus latency, memory/compute, deployment, safety, and cost constraints. If a catalog SLM meets them, deploy under monitoring. Fine-tune or move to a larger model only for a persistent measured deficit.

### Generative Orchestration and Constrained Values

Generative orchestration can choose topics, tools, agents, and knowledge and can request ordinary missing inputs. Microsoft currently documents that custom closed-list and regex entities are not supported directly as topic or tool input parameters. Collect and validate them with a Question node in a topic, store the value, then pass it onward.

### MCP Capability Discovery

Copilot Studio supports MCP tools and resources. A connected server publishes names, descriptions, inputs, and outputs; additions, updates, and removals are reflected dynamically. MCP requires generative orchestration. Dynamic discovery does not remove authentication, authorization, DLP, schema validation, approval, or supplier-risk controls.

### SharePoint Grounding

Sharing an agent controls discoverability and use of the experience. It does not grant access to SharePoint or OneDrive content. Referenced sources continue to respect existing permissions and sensitivity labels, so retrieval is security-trimmed for the current user.

### Production Telemetry

Application Insights receives Copilot Studio test-canvas events as well as production activity. For a production-only Kusto view, use the explicit custom dimension rather than guessing from channel names:

```kusto
customEvents
| extend isDesignMode = customDimensions['designMode']
| where isDesignMode == "False"
```

### Environment-Variable Servicing

The definition and optional default are publisher metadata; the current value is the environment-specific value. A current value is used when present. Separating them lets a publisher update a definition/default without overwriting a customer's current value. Provide target values during deployment instead of packaging environment-specific values casually.

### Tool Identity and Data Policy

User authentication for a tool lets the downstream service restrict data or actions to the current user. Agent-author authentication represents shared maker-provided authority and suits only intentionally shared, governed access. Power Platform data policies separately govern connector combinations and data paths through Business, Non-business, and Blocked groups. Authentication does not replace DLP, and DLP does not grant record-level authorization.

### Managed Identity Lifecycle

A system-assigned identity is tied to one Azure resource and is deleted with it. A user-assigned identity is a standalone resource, can attach to multiple supported resources, and retains its principal when compute is recycled. Stable permissions across blue-green or replaceable hosts therefore require an identity independent of those hosts, plus explicit least-privilege RBAC at the narrowest practical target scope.

---

## Cross-Domain Quiz Question Refreshers

| ID | Domain | Concept | Decisive clue | Common trap |
| --- | --- | --- | --- | --- |
| q211 | D1.2 | Multi-agent trust/authority boundary | Untrusted external content feeds a privileged high-impact action | One broad identity; model size treated as authorization |
| q212 | D1.2/D1.3 | Build-buy-extend | Existing licensed product covers the core need; one supported gap remains | Rebuild everything because any gap exists |
| q213 | D1.2 | Evidence-based SLM selection | Representative quality and device latency/memory/cost criteria are already met | Fine-tune by default or choose by parameter count |
| q214 | D2.1 | Constrained generative input | A custom regex value must be validated before a tool call | Assuming orchestration directly enforces every custom entity |
| q215 | D2.2 | MCP plus generative orchestration | Server-published tools/resources change frequently | Static prompt copies or one manually authored topic per operation |
| q216 | D2.2 | SharePoint source permissions | User can invoke the agent but lacks source-folder permission | Agent sharing or builder access mistaken for source authorization |
| q217 | D3.1 | Application Insights production filtering | Test canvas inflates conversation counts | Filtering by channel instead of the explicit design-mode dimension |
| q218 | D3.3 | Current versus default value servicing | Publisher updates a default while production has a customer current value | Treating a managed upgrade as ownership of target configuration |
| q219 | D3.4 | User tool authentication plus DLP | Per-user record access and a forbidden connector path are separate requirements | Expecting either identity or policy to solve both layers |
| q220 | D3.4 | User-assigned managed identity | Principal and RBAC must survive blue-green host replacement | Host-bound identity assumed to keep the same principal after deletion |

No answer letters are included. Explain each row as a control-boundary decision before taking the local check.

---

## Answer-Review Workflow

After submission, review every incorrect item and every `M` or `L` item that happened to be correct:

1. Read the official rationale before opening documentation.
2. State the tested boundary in one phrase: `identity lifecycle`, `source authorization`, `publisher vs target ownership`, and so on.
3. Classify the cause: knowledge, decision pattern, wording, confidence, or time.
4. Open the official source URL and locate the exact sentence or table that resolves the item.
5. Write a one-sentence replacement rule without copying the question or options.
6. Add one contrasting scenario where the rejected feature would be appropriate.
7. Rank remediation by recurrence, confidence of the misconception, domain weight, and exam proximity.

Do not copy official assessment question text into this repository. Capture concepts, rationale distilled in your own words, and public Microsoft Learn URLs.

### Priority Formula

Use this simple ranking, not false precision:

- **High:** confident wrong answer, repeated misconception, or a Domain 3 control boundary.
- **Medium:** low-confidence correct answer or isolated D1/D2 gap.
- **Low:** wording slip with a rule you can immediately explain and reapply.

---

## Score and Gap Capture Template

### Attempt Summary

- Official assessment date/time:
- Official score/percentage:
- Time used:
- D1 result or observed gaps:
- D2 result or observed gaps:
- D3 result or observed gaps:
- Incorrect items:
- Guessed-correct items:
- Highest-priority boundary:
- Comparison with Attempt 1, if available:

> Leave unavailable fields blank. Do not infer domain scores or fabricate an official passing threshold for the practice assessment.

### Gap Log

| Domain/objective | Confidence | Cause | Mistaken assumption | Official rationale distilled | Microsoft Learn URL | Replacement rule | Priority | Retest |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | H/M/L | Knowledge/Decision/Wording/Time |  |  |  |  | High/Medium/Low | Pending |
|  | H/M/L |  |  |  |  |  |  |  |
|  | H/M/L |  |  |  |  |  |  |  |

### Three Actions for Days 30-31

1. 
2. 
3. 

---

## Common Traps and Misconceptions

- **More capability is not automatically better:** extra agents, larger models, custom code, and broad permissions add cost and risk.
- **Probabilistic selection is not deterministic validation:** orchestration can choose a capability while a workflow node enforces a constrained input.
- **Availability is not authorization:** sharing an agent does not broaden SharePoint ACLs.
- **Authentication is not authorization or DLP:** each control answers a different question.
- **Managed identity is not automatic access:** the principal still needs target authorization.
- **Host-bound is not workload-stable:** deletion of a system-assigned host identity changes the principal.
- **Default is not current:** target configuration takes precedence when a current value exists.
- **Dashboard mismatch is not automatically data loss:** first reconcile test traffic and scope.
- **Practice score is not exam probability:** use it to prioritize learning, not to declare readiness alone.

---

## Quick Reference Card

```text
Different trust/privilege       -> enforce a boundary and reauthorize
Core product fits + one gap     -> adopt and extend the validated gap
SLM meets measured criteria     -> use under monitoring before customization
Custom regex input              -> collect and validate explicitly in a topic
Dynamic MCP capabilities        -> MCP with generative orchestration
Agent shared broadly            -> source permissions and labels still apply
Production-only App Insights    -> designMode == "False"
Customer current value exists   -> it overrides publisher default
Per-user records + risky path   -> user tool auth plus data policy
Replaceable equivalent hosts    -> identity lifecycle independent of compute
```

---

## Related Questions in questions.json

Day 29 assigns exactly **q211-q220**. They form a balanced mixed review of the ten concepts in the refresher table. Do not modify `questions.json` or `day-assignments.json`, and do not treat this list as an answer key.

After the official assessment and targeted review, launch Day 29 through the repository's normal `@certprep /today` workflow once the assignment is available. Complete all ten questions before recording Day 29 as complete.

---

## Completion Criteria

Day 29 is complete only when all statements are true:

- [ ] Official Practice Assessment Attempt 2 was submitted under no-notes first-pass conditions.
- [ ] The actual score and elapsed time were captured without inference.
- [ ] Every incorrect and guessed-correct item was reviewed using its official rationale and source URL.
- [ ] Gaps were tagged by domain and cause, then ranked with Domain 3 weight considered.
- [ ] At least one replacement rule was written for each genuine gap.
- [ ] The assigned q211-q220 ten-question local mixed check was completed.
- [ ] Only the normal session workflow, not manual edits, updated progress and plan state.

Until these are satisfied, keep Day 29 **in progress**.

---

## Hands-On Lab

N/A for this mock session. The assessment, evidence capture, and focused local check are the practical exercise.

---

## Sources (Verified Live During This Session)

- [AB-100 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-100)
- [AB-100 exam page and official Practice Assessment entry](https://learn.microsoft.com/en-us/credentials/certifications/exams/ab-100/)
- [Prepare for a Microsoft certification exam](https://learn.microsoft.com/en-us/credentials/certifications/prepare-exam#take-a-practice-assessment)
- [Practice Assessment FAQs](https://learn.microsoft.com/en-us/credentials/certifications/frequently-asked-questions#practice-assessments-frequently-asked-questions)
- [Exam duration and exam experience](https://learn.microsoft.com/en-us/credentials/support/exam-duration-exam-experience)
- [AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- [Microsoft Foundry Models overview (classic)](https://learn.microsoft.com/en-us/azure/foundry-classic/concepts/foundry-models-overview)
- [Generative orchestration custom entity support](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-generative-actions#custom-entity-support-for-topic-and-tool-input-parameters)
- [Extend an agent with Model Context Protocol](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agent-extend-action-mcp)
- [Add SharePoint and OneDrive knowledge to a declarative agent](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/agent-builder-add-knowledge#sharepoint-and-onedrive-content)
- [Copilot Studio Application Insights telemetry](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-bot-framework-composer-capture-telemetry#exclude-telemetry-from-test-conversations-in-your-queries)
- [Power Platform environment variables](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/environmentvariables#current-value)
- [Configure user authentication for Copilot Studio tools](https://learn.microsoft.com/en-us/microsoft-copilot-studio/configure-enduser-authentication)
- [Configure data policies for Copilot Studio agents](https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-data-loss-prevention)
- [Managed identities for Azure resources](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview#managed-identity-types)

---

## Notes (Your Own Words - Fill This In After Studying)

- My most persistent boundary error:
- The Learn page I need to locate quickly:
- My final replacement rule before Day 30:
