# Day 1: Orientation & AI Strategy Foundations

**Date**: 2026-08-12
**Domain**: Domain 1 — Plan AI-powered business solutions (25–30%)
**Subtopics**: Exam orientation; Cloud Adoption Framework (CAF) AI adoption process; build vs. buy vs. extend basics; designing the overall AI strategy
**Estimated study time**: 1 hr

---

## TL;DR (60-second skim)

- **AB-100 is Expert-level**: 3 domains, passing score **700/1000**. Domain 3 (Deploy, **40–45%**) is the heaviest — prioritize it across the plan. Domains 1 and 2 are 25–30% each.
- **MS Learn is available during the exam.** Study for **decision-pattern recognition** (which service, which stage, build/buy/extend), not doc memorization.
- The **CAF AI adoption process** has a repeatable sequence: **Strategy → Plan → Ready → Govern → Manage → Secure**. Each stage feeds constraints into the next.
- **AI Strategy** is built by working four decisions **in sequence**: (1) AI **use case identification**, (2) AI **technology strategy** (build/buy), (3) **Responsible AI** strategy, (4) **Data** strategy.
- **Microsoft build/buy/extend ladder**: **Buy/Use SaaS** = Microsoft 365 Copilot → **Extend** = Copilot Studio (agents, connectors, knowledge) → **Build** = Microsoft Foundry (custom agents/models, PaaS).
- Default toward **buy → extend → build** (least effort/cost first). Build custom only when prebuilt/extend can't meet a real requirement.
- The **AI Center of Excellence (CoE)** provides strategic oversight; **GenAIOps** (generative) vs **MLOps** (traditional ML) are the operational frameworks introduced in the **Manage** stage.

---

## Learning Objectives

After this session you should be able to:

- Describe the AB-100 exam structure, domains, weights, and passing bar, and set the right study mindset.
- Sequence and explain each stage of the **CAF AI adoption process** and the key decisions/artifacts of each.
- Apply the **build vs. buy vs. extend** decision using Microsoft's product ladder (M365 Copilot → Copilot Studio → Foundry).
- Describe how an **overall AI strategy** is designed (use cases → technology → responsible AI → data).

---

## Exam Orientation

| Attribute                                 | Value                                                    |
| ----------------------------------------- | -------------------------------------------------------- |
| Exam code                                 | AB-100                                                   |
| Title                                     | Agentic AI Business Solutions Architect                  |
| Level                                     | **Expert**                                               |
| Passing score                             | **700** (scaled 1–1000)                                  |
| Price                                     | $165 USD                                                 |
| Language                                  | English                                                  |
| Format (third-party estimate, unofficial) | ~40–60 questions, ~100–120 min, likely ≥1 **case study** |

**Domains & weights:**

| Domain                                       | Weight     | Focus                                                                      |
| -------------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| D1: **Plan** AI-powered business solutions   | 25–30%     | Requirements, AI strategy, ROI/TCO, build-buy-extend                       |
| D2: **Design** AI-powered business solutions | 25–30%     | Agents, Copilot Studio, extensibility (MCP, Computer Use), prebuilt agents |
| D3: **Deploy** AI-powered business solutions | **40–45%** | Monitor/tune, testing, **ALM**, responsible AI/security/governance         |

**Mindset (critical):** MS Learn docs are open during the exam. Questions test **judgment** — "which stage / which service / build-buy-or-extend / which orchestration type." Memorizing exact UI steps is low-value; recognizing the **correct decision pattern** is high-value.

---

## Key Concepts

### 1. The CAF AI adoption process (Strategy → Plan → Ready → Govern → Manage → Secure)

Microsoft's **Cloud Adoption Framework (CAF)** has an **AI adoption** scenario. It is a repeatable, sequenced process. Each stage sets constraints for the next.

**① Strategy** — _Decide what value AI should create and how you'll pursue it._ Built from four decisions in order:

1. **AI use case identification** — surface where AI improves business outcomes; find the highest-value opportunities first (list need not be exhaustive).
2. **AI technology strategy** — the **build vs. buy** decision (see next section).
3. **Responsible AI strategy** — commit to Microsoft's Responsible AI principles up front.
4. **Data strategy** — ensure the data needed to ground/train AI is available and fit for purpose.

**② Plan** — _Turn strategy into an actionable adoption plan._ Bridges vision and execution:

- **Assess AI skills** using the **skills & data readiness framework** (AI maturity **Levels 1–3**). Level 1 = basic AI concepts + any Copilot/quickstart; Level 2 = model selection, deployment, data cleaning + custom analytical workloads; Level 3 = advanced/custom model work.
- **Acquire AI skills** (training, hiring, partners).
- **Access AI resources** (compute, services, budget).
- **Prioritize AI use cases** against value and feasibility.

**③ Ready** — _Prepare the environment/landing zone for AI at scale._

- **AI governance boundaries**: separate **management groups** for **internet-facing ("online")** vs **internal ("corporate")** AI workloads to keep sensitive internal data isolated.
- **AI networking**, **AI reliability**, and the **AI foundation** (Azure landing zone baseline + AI-specific Azure Policy for Foundry, Foundry Tools, Azure AI Search).

**④ Govern** — _Manage AI organizational risk._ Follows the **NIST AI Risk Management Framework (AI RMF)**:

1. Assess AI organizational risks (map each workload's purpose, data, outcomes; use Responsible AI principles to find risks).
2. Document AI governance policies.
3. Enforce policies (Azure Policy, guardrails).
4. Monitor AI organizational risks over time.

**⑤ Manage** — _Operate AI workloads across their lifecycle._

- Stand up an **AI Center of Excellence (CoE)** for strategic oversight/standards.
- Choose the operational framework: **MLOps** for traditional ML, **GenAIOps** for generative AI.
- Manage operations, deployment, models, and **costs**; standardize tooling.

**⑥ Secure** — _Protect AI systems, data, and models_ (security posture, access controls, threat protection for AI). Runs alongside Govern/Manage.

> Exam cue: If a question describes _"deciding where AI adds value and which tech to use,"_ that's **Strategy**. _"Skills gaps and timelines"_ → **Plan**. _"Landing zone / management groups / networking"_ → **Ready**. _"NIST / risk policies"_ → **Govern**. _"MLOps/GenAIOps, CoE, cost management"_ → **Manage**. _"Threat protection / securing models & data"_ → **Secure**.

---

### 2. Build vs. Buy vs. Extend (the Microsoft product ladder)

This is the **AI technology strategy** decision inside CAF Strategy — and a recurring AB-100 theme. Default to the **least-effort option that meets the requirement**, escalating only when needed:

| Option               | Microsoft product                                                                            | Use when…                                                                                     | Effort/Cost |
| -------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------- |
| **Buy / Use (SaaS)** | **Microsoft 365 Copilot**, Copilot for Sales/Service, Dynamics 365 Copilot, prebuilt agents  | A ready-made capability already covers the need; fastest time-to-value; no custom logic       | Lowest      |
| **Extend**           | **Copilot Studio** (topics, agents, custom connectors, knowledge sources, MCP, Computer Use) | The prebuilt experience is close but needs org-specific data, actions, or new agent behaviors | Medium      |
| **Build (custom)**   | **Microsoft Foundry** (Foundry Agents, custom/fine-tuned models, SLMs, Foundry Tools) — PaaS | No prebuilt/extended option fits; need bespoke models, deep control, or specialized workflows | Highest     |

**Decision guidance:**

- Start by asking **"Is there a prebuilt Microsoft agent/Copilot for this?"** → if yes, **buy/use**.
- If it's close but missing data/actions → **extend** with Copilot Studio (add knowledge sources, connectors, custom topics/agents; extend M365 Copilot).
- Only **build custom** (Foundry, custom models/SLMs) when a genuine requirement can't be met by buy or extend — e.g., proprietary model behavior, strict latency/cost via a small language model, or domain-specific fine-tuning.
- **Build custom models** specifically when prebuilt models can't deliver required accuracy/domain fit and you have the **data + skills** (maturity Level 2–3).

---

### 3. Designing the overall AI strategy for business solutions

The overall strategy = the CAF **Strategy** stage applied to _business solutions_, then handed to Plan/Ready:

1. **Identify use cases** — agents for **task automation**, **data analytics**, and **decision-making**; rank by value.
2. **Choose technology** — apply build/buy/extend across **M365 Copilot + Copilot Studio + Microsoft Foundry** (often a **multi-agent** mix).
3. **Commit to Responsible AI** — bake principles in from the start (not bolted on later).
4. **Establish the data strategy** — grounding data must be **accurate, relevant, timely, clean, and available** (Day 2 goes deep on this).
5. Fold in the **AI Center of Excellence**, a **prompt library**, and **prompt-engineering guidelines** as organizational enablers.

---

## Decision Frameworks

**Which CAF stage?**

- Deciding value + tech + responsible AI + data → **Strategy**
- Skills, resources, timelines, prioritization → **Plan**
- Landing zone, mgmt groups, networking, policy baseline → **Ready**
- Risk assessment, NIST AI RMF, policy enforcement → **Govern**
- MLOps/GenAIOps, CoE, model/cost ops → **Manage**
- Securing models, data, access, threats → **Secure**

**Build / Buy / Extend:**

```
Need an AI capability?
 ├─ Prebuilt Copilot/agent already does it?  → BUY/USE (M365 Copilot / D365 Copilot)
 ├─ Close, but needs org data/actions/new agent behavior? → EXTEND (Copilot Studio)
 └─ Nothing fits; need custom model/agent/SLM? → BUILD (Microsoft Foundry)
```

---

## Comparisons (X vs Y)

|          | Microsoft 365 Copilot      | Copilot Studio                                     | Microsoft Foundry                             |
| -------- | -------------------------- | -------------------------------------------------- | --------------------------------------------- |
| Category | SaaS (buy/use)             | Low-code extend                                    | Pro-code build (PaaS)                         |
| Best for | Ready productivity Copilot | Extend Copilot, custom agents/knowledge/connectors | Custom agents, custom/fine-tuned models, SLMs |
| Audience | End users / makers         | Makers / citizen devs                              | Developers / data scientists                  |
| Effort   | Lowest                     | Medium                                             | Highest                                       |

|                     | MLOps                 | GenAIOps                |
| ------------------- | --------------------- | ----------------------- |
| For                 | Traditional ML models | Generative AI workloads |
| Introduced in stage | Manage                | Manage                  |

---

## Important Details for Exam

- Passing score is **700**; exam is **Expert** level.
- CAF AI adoption **sequence**: **Strategy → Plan → Ready → Govern → Manage → Secure** (know the order and what each owns).
- AI **Strategy** decisions in order: **use cases → technology (build/buy) → responsible AI → data**.
- **Plan** uses the **skills & data readiness framework** with **AI maturity Levels 1–3**.
- **Ready** separates **online (internet-facing)** vs **corporate (internal)** AI workloads via **management groups**.
- **Govern** aligns to the **NIST AI RMF** (assess → document → enforce → monitor).
- **Manage** distinguishes **MLOps vs GenAIOps** and establishes the **AI CoE**.
- Product ladder mapping to build/buy/extend: **M365 Copilot = buy**, **Copilot Studio = extend**, **Microsoft Foundry = build**.
- There is currently **no official MS Learn learning path** for AB-100 — study via docs + the free official practice assessment.

---

## Common Traps & Misconceptions

| Trap                                     | What the wrong answer looks like                        | Reality                                                                      |
| ---------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Jumping straight to "build custom model" | Picking Foundry/custom model for every AI need          | Default **buy → extend → build**; build only when nothing else fits          |
| Confusing Strategy vs Plan               | Putting skills/timelines in "Strategy"                  | Skills, resources, timelines = **Plan**; value+tech decisions = **Strategy** |
| CAF order guesses                        | Assuming Govern comes before Ready                      | Order is Strategy → Plan → **Ready → Govern** → Manage → Secure              |
| MLOps vs GenAIOps                        | Using MLOps for a generative/agent workload             | Generative → **GenAIOps**                                                    |
| Extend vs build                          | Choosing Foundry when only org data/actions are missing | Missing data/connectors/actions → **extend with Copilot Studio**             |
| "Memorize the docs"                      | Cramming exact steps                                    | Learn is open in-exam; recognize the **decision pattern**                    |

---

## Real-World Scenarios

1. **Retailer wants a productivity assistant for email/docs across staff, fast, no custom logic** → **Buy/Use Microsoft 365 Copilot**.
2. **Bank has M365 Copilot but needs it to answer from internal policy documents and file tickets** → **Extend with Copilot Studio** (add knowledge sources + connector/actions).
3. **Manufacturer needs a domain-specific defect-classification model with proprietary data** → **Build in Microsoft Foundry** (custom/fine-tuned model, maturity Level 2–3).
4. **Org keeps building conflicting AI pilots with little ROI** → establish an **AI Center of Excellence** (Manage) and run the **Strategy** stage to align on high-value use cases.
5. **Security team worries external users could reach internal data via an AI app** → in **Ready**, separate **online vs corporate** workloads with distinct **management groups**.

---

## Quick Reference Card

- **CAF AI order**: Strategy → Plan → Ready → Govern → Manage → Secure.
- **Strategy 4 decisions**: use cases → technology (build/buy) → responsible AI → data.
- **Ladder**: M365 Copilot (buy) → Copilot Studio (extend) → Foundry (build).
- **Plan** = skills/resources/timelines + maturity Levels 1–3.
- **Ready** = landing zone, online vs corporate mgmt groups.
- **Govern** = NIST AI RMF (assess/document/enforce/monitor).
- **Manage** = CoE + MLOps vs GenAIOps + cost/model ops.
- **Grounding data quality** (Day 2): accurate, relevant, timely, clean, available.

---

## Hands-On Lab (optional bonus)

No setup/cost required — a 5-minute reading + note task:

1. Open the CAF AI adoption landing page (link below) and locate each of the six stages.
2. In your own words, write one sentence per stage answering _"what decision does this stage own?"_
3. For three business needs you can think of, tag each as **buy / extend / build** and name the Microsoft product.

---

## Related Questions in questions.json

**No quiz today (Day 1).** The practice bank quizzes begin **Day 2** (first Domain 1 questions on requirements analysis + grounding data quality).

When quizzes start, run:

```powershell
python quiz_runner.py questions.json --day-lock 2 --carryover 3 --shuffle
```

---

## Sources (verified during this session)

- [AI adoption (CAF scenario landing)](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/scenarios/ai/)
- [AI strategy — CAF](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai/strategy)
- [Plan for AI adoption — CAF](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai/plan)
- [AI Ready — CAF](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai/ready)
- [Govern AI (NIST AI RMF) — CAF](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai/govern)
- [Manage AI (MLOps/GenAIOps, CoE) — CAF](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai/manage)
- [AB-100 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-100)
- [Microsoft Foundry](https://learn.microsoft.com/en-us/azure/ai-foundry/) · [Copilot Studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/) · [M365 Copilot extensibility](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/)

---

## Notes (your own words — fill this in after studying)

_(Leave space for the user to add their own notes after going through it)_
