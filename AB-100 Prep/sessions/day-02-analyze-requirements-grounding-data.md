# Day 2: D1.1 Analyze Requirements for AI-Powered Business Solutions

**Date**: 2026-08-13
**Domain**: Domain 1 — Plan AI-powered business solutions (25–30%)
**Subtopics**: Analyze requirements for AI-powered business solutions; agents for task automation, data analytics, and decision-making; grounding data quality (accuracy, relevance, timeliness, cleanliness, availability); organizing business solution data for AI systems
**Estimated study time**: 1 hr

---

## TL;DR (60-second skim)

- The exam is testing whether you can map a business problem to the right AI pattern: **task automation**, **data analytics**, or **decision support**.
- Start by clarifying the **business outcome** and the **decision to be improved** before selecting an agent, model, or workflow.
- Grounding data quality is not optional: if the source data is stale, noisy, incomplete, or inaccessible, the AI answer will be unreliable even if the model is strong.
- The key grounding data dimensions are: **accuracy**, **relevance**, **timeliness**, **cleanliness**, and **availability**.
- Business solution data should be **organized, governed, discoverable, and permission-aware** so other AI systems can use it safely.
- The most common exam pattern is: **business need → use case → data readiness → platform choice**. If data is weak, do not launch the agent yet.
- Default pattern for enterprise AI: use **buy/extend/build** in order, but only after the data and controls are confirmed.

---

## Learning Objectives

After this session you should be able to:

- Identify the right AI pattern for a business requirement: task automation, analytics, or decision-making.
- Evaluate an AI scenario for business value, operational fit, and required data flow.
- Explain the five grounding data quality dimensions and why each matters for agent reliability.
- Recognize when a data problem is a launch blocker rather than a post-launch tuning issue.
- Recommend how to structure and expose business data so it is consumable by other AI systems safely and consistently.

---

## Key Concepts

### 1) Requirements analysis for AI business solutions

The first step is not “What model should we use?” It is: 

1. What is the business problem? 
2. What decision or workflow is being supported? 
3. What is the expected user outcome? 
4. What data is needed to ground the response or action? 
5. What guardrails, access controls, and compliance rules apply?

AB-100 frames AI use cases in three practical categories:

- **Task automation**: repetitive, deterministic work such as summarizing case notes, creating tasks from messages, routing service requests, or filling forms.
- **Data analytics**: interpreting large amounts of enterprise data, surfacing trends, comparing performance, summarizing reports, or generating insight from historical records.
- **Decision-making**: helping staff evaluate options, weigh risk, or choose next actions based on policy rules and grounding data.

Exam logic: if a requirement is highly repeatable and rule-based, favor automation. If it depends on context and historical evidence, use grounded retrieval or analytics. If it requires judgment under uncertainty, ensure human review and controlled data access.

### 2) The business-solution data pattern decision

A strong AI solution requires the right data architecture pattern. In AB-100, you may be asked to choose the pattern that best supports a business requirement.

Common data patterns:

- **Operational data**: live transactional records from CRM, ERP, service systems, or case management. Best for real-time task automation and agent action.
- **Reference data**: policy tables, product catalogs, customer master data, and standard definitions. Best for grounded business context and consistency.
- **Analytical data**: aggregated reporting, trend data, historical metrics, and warehouse data. Best for dashboards and analytics tasks.
- **Knowledge content**: SharePoint policy docs, standard operating procedures, FAQs, and articles. Best for retrieval-based assistants and copilots.
- **Event/stream data**: logs, workflow events, sensor feeds, or transaction events. Best for near-real-time monitoring, alerts, and operational insight.

The right pattern is not always “more data.” It is “appropriate, governed data at the right freshness.”

### 3) Grounding data quality dimensions

AB-100 explicitly highlights the core grounding data dimensions that affect reliability.

#### a) Accuracy

The data must be correct enough to support business decisions.

- Wrong or stale product prices create incorrect recommendations.
- Incorrect policy guidance can expose legal or compliance risk.
- High model fluency does not compensate for wrong source data.

**Exam cue**: if a scenario says the data is outdated, inconsistent, or contradictory, the likely answer is “do not launch until data quality is remediated.”

#### b) Relevance

The information should be useful for the stated task and context.

- A legal policy document may be relevant to a case summary agent but not to a pricing assistant.
- General internet knowledge may be useful for generic questions but not for regulated or internal domain questions.
- Data that is too broad often produces low signal and poor actionability.

**Exam cue**: an agent that retrieves everything without targeted grounding is likely to be noisy and low quality.

#### c) Timeliness

The data must be fresh enough for the decision cycle.

- A price recommendation agent using a four-week-old catalog is not credible.
- A compliance agent using static policies without update monitoring may be outdated.
- Real-time or near-real-time data matters for operations, inventory, collections, and service processes.

**Exam cue**: “freshness” is often treated as an operational requirement, not an afterthought.

#### d) Cleanliness

The data should be structured, normalized, and free from contradictory or messy values.

- Missing fields, duplicate records, inconsistent labels, and unparsed documents create noisy responses.
- Data in legacy systems may require cleaning or transformation before it is a safe grounding source.
- A clean source is easier to govern, query, and trust.

**Exam cue**: “inconsistent data in Azure Data Lake” or “legacy system records with duplicates” is a classic data readiness problem.

#### e) Availability

The data must be accessible to the AI system with the right permissions and integration path.

- If the data is locked in a system without access or API connectivity, the agent cannot use it.
- If the data is accessible only to the wrong audience, the agent violates permission boundaries.
- Availability also means the data is discoverable and connected to the AI workflow.

**Exam cue**: “make sure data is accessible and permission-aware” often appears in requirement-analysis and security questions.

### 4) Designing the solution around data access and permissions

Grounding is not just about the content; it is about access and boundaries.

- The AI system should use **validated internal sources** when the business requirement is regulated or sensitive.
- Agents must not bypass the user’s permissions or security boundaries.
- If the business requires a public-facing or external-facing workflow, the architecture must separate data sources, controls, and model access appropriately.
- For regulated workloads, the architecture often needs explicit governance and human review.

Key exam idea: requirement analysis includes **data governance and access design**, not just the prompt or model.

### 5) Solution selection: build, buy, or extend depends on the requirement

The AB-100 requirement-analysis mindset still leans on the broader AI strategy ladder:

- **Buy / use**: Microsoft 365 Copilot or prebuilt productivity experiences when a ready-made capability meets the need.
- **Extend**: Copilot Studio when the organization needs custom prompts, knowledge sources, connectors, workflows, or agent actions.
- **Build**: Microsoft Foundry for custom models, deeper control, specialized pipelines, and custom compliance patterns.

This matters because the right data pattern often determines the right platform choice.

---

## Decision Frameworks

### Which AI pattern fits the requirement?

```
Business requirement identified
  ├─ Is this about repetitive workflow execution? → Task automation
  │   Example: create tasks, summarize cases, route tickets
  ├─ Is this about summarizing or analyzing patterns in data? → Data analytics
  │   Example: reports, trends, forecast, operational insight
  ├─ Is this about recommending a next action or risk-aware choice? → Decision-making
  │   Example: approvals, triage, exception handling, policy-based support
  └─ None fit cleanly? Reframe the requirement before building
```

### Does the data quality pass the launch gate?

```
Grounding data available?
  ├─ No → fix data access/integration before launch
  ├─ Yes, but stale/inconsistent/irrelevant → remediate before launch
  ├─ Yes, but not permission-safe → add governance boundaries before launch
  ├─ Yes, clean + relevant + current + permission-aware → proceed to design and test
  └─ If not, do not treat it as a model problem; treat it as a data readiness problem
```

### When should solution design move to a more custom platform?

```
Need a business capability?
  ├─ Already exists as SaaS or native Copilot feature? → Buy / use
  ├─ Close, but needs org knowledge, workflows, actions, or agents? → Extend with Copilot Studio
  └─ Custom logic, regulated data handling, custom model or pipeline needed? → Build in Microsoft Foundry
```

---

## Comparisons (X vs Y)

| Scenario | Better pattern | Why |
| --- | --- | --- |
| Customer service agents summarizing case records and creating follow-up tasks | **Task automation** | High-repeatability and rule-based workflow |
| Sales or operations dashboards with trend analysis across historical records | **Data analytics** | Needs aggregation, summarization, and trend detection |
| Loan approval or case triage support that weighs policy and risk | **Decision-making** | Requires context + policy + human-safe constraints |
| Knowledge assistant pulling from SharePoint or policy docs | **Grounded retrieval** | Response quality depends on source relevance and freshness |

| Data quality issue | Example | Business impact |
| --- | --- | --- |
| Inaccurate | Wrong policy wording or stale price | Bad recommendations and trust erosion |
| Irrelevant | Broad web search used instead of internal policy docs | Low signal and confusion |
| Untimely | Old inventory or claimant data | Wrong action or delayed response |
| Unclean | Duplicate records, malformed files | Noise and unreliable answers |
| Unavailable | Data behind permission boundaries or inaccessible API | Agent cannot access required information |

---

## Important Details for Exam

- The exam often tests **requirement analysis first**, not solution implementation first.
- AI use cases typically fall into: **task automation**, **data analytics**, and **decision-making**.
- Good grounding data must be **accurate, relevant, timely, clean, and available**.
- A model is not a substitute for missing or poor-quality data.
- Data readiness issues should be treated as **architecture/design blockers** before launch.
- Agents must respect **user permissions and security boundaries**; do not assume a service account or admin override is acceptable.
- For regulated environments, narrow the grounding source to **validated internal knowledge** unless a formal risk review approves broader access.
- The safest exam pattern is: **clarify the business need → assess the data → choose the proper platform → test and govern**.

---

## Common Traps & Misconceptions

| Trap | What it looks like | Correct view |
| --- | --- | --- |
| “The model is the problem” | Choose a different model to compensate for bad data | Bad data is the root problem; fix data quality first |
| “If it answers fast, it is good” | Speed is treated as the main KPI | Reliability and groundedness matter more |
| “General knowledge is always fine” | Use web or open knowledge for internal regulated tasks | Restrict to validated internal data unless risk assessment approves otherwise |
| “More data means better outcomes” | Add every dataset to the agent | Better to have relevant, governed, quality-controlled data |
| “Launch first, improve later” | Ship with stale or inconsistent knowledge | Data quality and readiness should gate launch |
| “Access is same as suitability” | Permission boundary ignored | Access, relevance, and governance all matter |

---

## Real-World Scenarios

1. **A support team wants an agent to summarize case notes and create tasks from email traffic.**
   - Best pattern: **task automation**.
   - Requirement: structured, current case data and workflow integration.

2. **A leadership team needs monthly insight into churn, backlog, and service quality across regions.**
   - Best pattern: **data analytics**.
   - Requirement: aggregated historical and operational data with quality checks.

3. **A loan processing team wants guidance on exceptions and risk-based next steps.**
   - Best pattern: **decision-making**.
   - Requirement: policy grounding, user permissions, human review, and traceability.

4. **A manufacturer wants to launch an agent that answers procurement questions from internal policy docs.**
   - Data condition matters: if policy docs are outdated, inconsistent, or inaccessible, the launch should be delayed until remediated.

5. **A regulated healthcare or financial workflow wants a broad LLM answer set instead of validated internal docs.**
   - Correct approach: restrict to controlled internal knowledge and perform risk review before enabling broader grounding.

---

## Quick Reference Card

- **Task automation** = repetitive workflow support and action execution.
- **Data analytics** = insight generation from historical or current data.
- **Decision-making** = policy-guided advice or recommendation under controlled conditions.
- **Grounding data quality** = accuracy, relevance, timeliness, cleanliness, availability.
- **If the data is stale, messy, or inaccessible, fix data before launch.**
- **AI success depends on data readiness and governance, not just model quality.**
- **Platform choice**: buy/use → extend → build, if the requirement and data justify it.

---

## Related Questions in questions.json

- q003 — knowledge source readiness before publish
- q019 — SharePoint as primary grounded knowledge source for Teams workflows
- q038 — restrict Copilot to validated internal knowledge in regulated audit workflows
- q040 — identify AI scenarios after objectives are set
- q049 — defer agent launch when grounding data is stale or inconsistent
- q054 — delay general knowledge enablement without risk assessment

Quiz command:

```powershell
cd "d:\Projects\microsoft-exam-prep\AB-100 Prep"
python quiz_runner.py questions.json --ids q003,q019,q038,q040,q049,q054 --shuffle
```

---

## Sources (verified during this session)

- [Microsoft Learn: AI adoption overview and strategy](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/innovate/ai)
- [Microsoft Learn: Microsoft Copilot Studio documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/)
- [Microsoft Learn: Azure AI Foundry overview](https://learn.microsoft.com/en-us/azure/ai-foundry/overview)
- [AB-100 exam study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-100)
- [AB-100 exam page](https://learn.microsoft.com/en-us/credentials/certifications/exams/ab-100/)

---

## Notes (your own words — fill this in after studying)

_(Add your revision notes here after completing the Day 2 quiz and reviewing misses.)_
