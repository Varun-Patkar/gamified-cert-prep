# Progress Tracker: Agentic AI Business Solutions Architect (AB-100)

## Overall

- Exam Date: 2026-09-12 (Sat, 9:00 AM IST)
- Sessions Completed: 9 / 31
- Questions Answered: 100 / 100 (completed bank plus new daily questions)
- Accuracy: 96.0% (96/100)
- Current Day: Day 10 (next: 2026-08-21)

## Domain Confidence (self-rated 1–5)

| Domain                                   | Weight | Confidence         | Notes                                                                                                                |
| ---------------------------------------- | ------ | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| D1: Plan AI-powered business solutions   | 25–30% | 4 (56/60 quiz)     | Strong overall; review multi-agent boundaries, managed identity, connector governance, and data-readiness sequencing |
| D2: Design AI-powered business solutions | 25–30% | 4 (40/40 Days 6–9) | Strong on agent types, extensibility, prebuilt Dynamics 365 agents, ERP knowledge, AI Builder, and action boundaries |
| D3: Deploy AI-powered business solutions | 40–45% | –                  | Highest weight — prioritize                                                                                          |

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

<!-- Example entry:
### Day 1 — 2026-08-12
- Covered: Orientation, CAF AI adoption, build/buy/extend
- Quiz: n/a
- Accuracy: n/a
- Weak spots:
- Notes:
-->
