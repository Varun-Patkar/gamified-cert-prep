# Progress Tracker: Agentic AI Business Solutions Architect (AB-100)

## Overall

- Exam Date: 2026-09-12 (Sat, 9:00 AM IST)
- Sessions Completed: 15 / 31
- Questions Answered: 166 / 150 (completed bank plus review and carryover questions)
- Accuracy: 97.0% (161/166)
- Current Day: Day 16 (next: 2026-08-27)

## Domain Confidence (self-rated 1–5)

| Domain                                   | Weight | Confidence           | Notes                                                                                                                                                                                    |
| ---------------------------------------- | ------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1: Plan AI-powered business solutions   | 25–30% | 4 (56/60 quiz)       | Strong overall; review multi-agent boundaries, managed identity, connector governance, and data-readiness sequencing                                                                     |
| D2: Design AI-powered business solutions | 25–30% | 4 (49/50 Days 6–10)  | Strong overall; review custom regex and closed-list entity collection for generative topic inputs                                                                                        |
| D3: Deploy AI-powered business solutions | 40–45% | 4 (56/56 Days 11–15) | Strong on monitoring, testing, ALM, agent/model identity boundaries, least privilege, grounding security trimming, DLP, and security validation; continue with governance and compliance |

## Daily Log

(Updated after each session)

### Day 1 — 2026-08-12 — Orientation & AI Strategy Foundations

- Status: Completed
- Covered: Exam orientation (domains/weights, 700 pass, Learn open in-exam); CAF AI adoption process (Strategy → Plan → Ready → Govern → Manage → Secure); build/buy/extend ladder (M365 Copilot → Copilot Studio → Foundry); overall AI strategy design
- Quiz: N/A (practice bank starts Day 2)
- Accuracy: N/A
- Lab: Optional (reading task)
- Weak spots: TBD (no quiz yet)
- Reference: sessions/day-01-orientation-ai-strategy.md
- Time Spent: ~1 hr

### Day 2 — 2026-08-13 — D1.1 Analyze Requirements

- Status: Completed
- Covered: AI use-case patterns (task automation / analytics / decision-making), grounding data quality dimensions (accuracy, relevance, timeliness, cleanliness, availability), data readiness gating before launch, requirement-to-platform alignment, SharePoint as grounded knowledge source for M365-style agents
- Quiz: 6 targeted Domain 1 questions on requirements and grounding
- Accuracy: 6 / 6 (100%) — perfect score
- Result logged: session result saved in session-results.json and study tracker updated
- Lab: N/A
- Weak spots: None on this set; keep reinforcing permission boundaries and data freshness checks
- Reference: sessions/day-02-analyze-requirements-grounding-data.md
- Time Spent: ~1 hr

### Day 3 — 2026-08-14 — D1.2 Multi-Agent Platform Strategy

- Status: Completed
- Covered: Microsoft 365 Copilot vs Copilot Studio vs Microsoft Foundry selection boundaries (productivity vs low-code business agent vs developer-controlled runtime); prebuilt agent use cases (Dynamics 365 Sales agents, Copilot Studio Agent Library); justified multi-agent design (trust/regulatory boundaries, separation of duties, domain ownership, context overload); orchestration patterns (sequential, parallel, router, supervisor, human checkpoint); least-privilege agent boundary checklist; start-small validation before scaling
- Quiz: N/A (no formally assigned Day 3 quiz; study/decision-pattern focus)
- Accuracy: N/A
- Lab: Optional (reading task)
- Weak spots: TBD — reinforce multi-agent justification vs weak reasons
- Reference: sessions/day-03-multi-agent-platform-strategy.md
- Time Spent: ~1 hr

### Day 4 — 2026-08-15 — D1.2 Custom vs Extend, SLMs, CoE

- Status: Completed
- Covered: extend (declarative agent) vs build (custom engine / Foundry) decision; build/buy/extend ladder; when to create/train custom models; SLM use cases (Phi family, Foundry Local / Phi Silica on-device) vs large models; prompt library & prompt management best practices (Prompt Gallery); AI Center of Excellence elements & operating model (CAF AI CoE)
- Quiz: 10 Domain 1 questions — q005, q026, q036, q044, q047, q048, q050, q056, q057, q059
- Accuracy: 10 / 10 (100%) — perfect score (time 5m 14s)
- Lab: N/A
- Weak spots: None on this set; keep reinforcing extend-vs-build boundaries and AI CoE operating model
- Reference: sessions/day-04-custom-vs-extend-slm-coe.md
- Time Spent: ~1 hr (study) + ~5 min (quiz)

### Day 5 — 2026-08-16 — D1.3 ROI, TCO, Model Router & Domain 1 Quiz

- Status: Completed
- Covered: measurable ROI baselines; realized benefits and adoption factors; full-lifecycle TCO; scenario and sensitivity analysis; build/buy/extend economics; Microsoft Foundry Model Router modes, model subsets, limits, governance, and monitoring
- Quiz: 44 remaining practice-bank questions completed in two segments
- Accuracy: 40 / 44 (90.9%) — segment 1: 28/29 (96.6%); segment 2: 12/15 (80.0%)
- Overall practice bank: 56 / 60 (93.3%)
- Weak spots: complete and label source data before rollout; separate agents at security/trust boundaries while using sequential or parallel orchestration according to dependencies; prefer managed identities over stored service-principal secrets; distinguish where custom connectors can be created from whether governance permits their use
- Missed questions: q024, q039, q052, q053
- Reference: sessions/day-05-roi-tco-model-router.md
- Quiz time: 21m 13s total
- Next action: Day 6 — D2.1 Copilot in Dynamics 365 + Agent Types

### Day 6 — 2026-08-17 — D2.1 Copilot in Dynamics 365 + Agent Types

- Status: Completed
- Covered: Dynamics 365 Sales and Customer Service product boundaries; current Sales Agent and Service Agent terminology; Customer Service business-term and summary customization; CRM connectors, permissions, and data readiness; prompt-response, task, and autonomous agent selection; approval boundaries for consequential autonomous actions
- Quiz: 10 newly researched, Microsoft Learn-grounded questions — q061 through q070
- Accuracy: 10 / 10 (100%) — perfect score
- Time: 3m 57s
- Weak spots: None observed in this set; retain the distinction between multistep task agents and event-triggered autonomous agents
- Reference: sessions/day-06-copilot-dynamics-agent-types.md
- Next action: Day 7 — D2.1 Copilot Studio Design

### Day 7 — 2026-08-18 — D2.1 Copilot Studio Design

- Status: Completed
- Covered: classic topic orchestration and trigger phrases; fallback and escalation; standard NLU vs Azure AI Language CLU vs generative orchestration; capability descriptions and contracts; agent flows; prompt actions; deterministic approval and validation boundaries
- Quiz: 10 newly researched, Microsoft Learn-grounded questions — q071 through q080
- Accuracy: 10 / 10 (100%) — perfect score
- Time: 2m 11s
- Weak spots: None observed in this set; retain the custom regex entity input limitation and the distinction between probabilistic prompt transformation and deterministic flow control
- Reference: sessions/day-07-copilot-studio-design.md
- Next action: Day 8 — D2.2 Extensibility

### Day 8 — 2026-08-19 — D2.2 Extensibility

- Status: Completed
- Covered: Foundry fine-tuning versus grounding and tools; Copilot Studio extensibility with MCP; Computer Use selection, identity, security, and supervision; deep reasoning and real-time voice; Microsoft 365 Copilot, Teams, and SharePoint publishing and permission boundaries
- Quiz: 10 newly researched, Microsoft Learn-grounded questions — q081 through q090
- Accuracy: 10 / 10 (100%) — perfect score
- Time: 4m 29s
- Weak spots: None observed in this set; retain MCP's generative-orchestration requirement and the distinction between publishing, sharing, admin approval, and underlying data permissions
- Reference: sessions/day-08-extensibility.md
- Next action: Day 9 — D2.3 Orchestrate Prebuilt Agents

### Day 9 — 2026-08-20 — D2.3 Orchestrate Prebuilt Agents

- Status: Completed
- Covered: Dynamics 365 finance and operations generative help; custom and structured ERP knowledge sources; Microsoft 365 declarative agents for ERP scenarios; Supplier Communications Agent; Collections coordinator summary; Power Apps AI capabilities in Dynamics 365; Copilot for Sales versus Copilot for Service; Power Platform AI hub and AI Builder; knowledge versus transactional authority
- Quiz: 10 newly researched, Microsoft Learn-grounded questions — q091 through q100
- Accuracy: 10 / 10 (100%) — perfect score
- Time: 1m 0.8s
- Weak spots: None observed in this set; retain the distinction between knowledge-grounded Q&A and authenticated transactional actions
- Reference: sessions/day-09-orchestrate-prebuilt-agents.md
- Next action: Day 10 — Domain 2 Quiz + Review

### Day 10 — 2026-08-20 — Domain 2 Quiz + Review

- Status: Completed
- Covered: Domain 2 review of autonomous-agent approval boundaries, generative orchestration and capability contracts, agent flows, prompt validation, MCP, Computer Use, source permissions, finance knowledge precedence, and transactional authority
- Quiz: 10 assigned Domain 2 review questions — q070, q074, q076, q077, q080, q084, q086, q090, q099, q100
- Accuracy: 9 / 10 (90%)
- Time: 43.7s
- Missed question: q076 (answered A; correct B)
- Weak spot: Generative topic and tool inputs do not directly support custom regex or closed-list entities; collect and validate the value with a Question node in the topic
- Skipped/ungraded: 0 / 0
- Reference: sessions/day-10-domain2-review.md
- Next action: Day 11 — D3.1 Monitor & Tune

### Day 11 — 2026-08-22 — D3.1 Monitor & Tune

- Status: Completed
- Covered: balanced monitoring metrics and baselines; Copilot Studio Analytics versus Application Insights; production telemetry filtering with `designMode`; feedback and transcript drill-down; Themes and answer-quality analysis; autonomous run, trigger, and tool metrics; Foundry distributed tracing; continuous and scheduled evaluation; cluster analysis and Prompt Optimizer safeguards
- Quiz: 10 newly researched, Microsoft Learn-grounded questions — q101 through q110
- Accuracy: 10 / 10 (100%) — perfect score
- Time: 47.2s
- Weak spots: None observed in this set; retain the distinction between dashboards, traces, and evaluations, and treat AI-assisted tuning as decision support requiring human validation
- Skipped/ungraded: 0 / 0
- Reference: sessions/day-11-monitor-tune.md
- Next action: Day 12 — D3.2 Testing

### Day 12 — 2026-08-23 — D3.2 Testing

- Status: Completed
- Covered: structured agent testing processes and balanced metrics; Copilot Studio test chat versus repeatable agent evaluation; single-response versus conversational evaluation; custom-model validation with held-out data and business error costs; leakage and overfitting controls; prompt batch validation; multi-app Dynamics 365 end-to-end testing; governed Copilot-assisted test-case creation
- Quiz: 10 newly researched D3.2 questions (q111 through q120) plus 3 D3.1 carryover questions (q108 through q110)
- Accuracy: 13 / 13 (100%) — perfect score
- Time: 56.2s
- Weak spots: None observed; retain the distinction between interactive debugging and regression evaluation, and never treat aggregate model scores or AI-generated tests as sufficient release evidence
- Skipped/ungraded: 0 / 0
- Reference: sessions/day-12-testing.md
- Next action: Day 13 — D3.3 ALM (Data + Copilot Studio)

### Day 13 — 2026-08-24 — D3.3 ALM (Data + Copilot Studio)

- Status: Completed
- Covered: environment variables for portable AI data configuration; secret separation; definition/default/current value precedence; connectors, connections, and connection references; governed pipeline prevalidation; Copilot Studio solution packaging; dependency and custom-connector import order; import-log diagnosis; post-import authentication, testing, publishing, and sharing
- Quiz: 10 newly researched D3.3 questions — q121 through q130
- Accuracy: 10 / 10 (100%) — perfect score
- Time: 2m 45.6s
- Weak spots: None observed; retain the distinction between portable configuration and target-owned identity/secrets, and remember that successful import still requires target validation, authentication, publishing, and sharing
- Skipped/ungraded: 0 / 0
- Reference: sessions/day-13-alm-data-copilot-studio.md
- Next action: Day 14 — D3.3 ALM (Foundry + Models + D365)

### Day 14 — 2026-08-25 — D3.3 ALM (Foundry + Models + D365)

- Status: Completed
- Covered: Foundry agent versioning, evaluation gates, rollback, hosted-agent endpoints and runtime identities; fine-tuned model inference deployment and cross-environment prerequisites; AI Builder solution packaging and managed promotion; Dynamics 365 Finance feature and role validation; Customer Service Copilot per-environment enablement
- Quiz: 10 newly researched D3.3 questions — q131 through q140
- Accuracy: 10 / 10 (100%) — perfect score
- Time: 16.5s
- Weak spots: None observed; retain the separation between artifacts, deployment endpoints, target configuration, runtime identity/RBAC, and release evidence
- Skipped/ungraded: 0 / 0
- Reference: sessions/day-14-alm-foundry-models-d365.md
- Next action: Day 15 — D3.4 Agent & Model Security

### Day 15 — 2026-08-26 — D3.4 Agent & Model Security

- Status: Completed
- Covered: author, runtime agent, end-user, and underlying-data identity boundaries; delegated access versus maker credentials; managed identity and least-privilege RBAC; deterministic tool authorization; Copilot Studio DLP; grounding security trimming; Foundry control-plane and data-plane access; model endpoint defense in depth; fine-tuning data isolation; negative security tests and audit evidence
- Quiz: 10 new D3.4 questions (q141 through q150) plus 3 D3.3 carryover questions (q138 through q140)
- Accuracy: 13 / 13 (100%) — perfect score
- Time: 14.0s
- Weak spots: None observed; retain that agent sharing, authentication, tool identity, and source authorization are separate gates, and that private networking or managed identity does not replace least-privilege authorization
- Skipped/ungraded: 0 / 0
- Reference: sessions/day-15-agent-model-security.md
- Next action: Day 16 — D3.4 Governance & Responsible AI

<!-- Example entry:
### Day 1 — 2026-08-12
- Covered: Orientation, CAF AI adoption, build/buy/extend
- Quiz: n/a
- Accuracy: n/a
- Weak spots:
- Notes:
-->
