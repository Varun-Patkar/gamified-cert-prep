# Day 11: Agent Concepts — Create Custom Agents
**Date**: 2026-05-16
**Domain**: Domain 3: Implement an agentic solution (5–10%)
**Subtopics**: Agent role & use-cases, resource setup, Foundry Agent Service, Agent Framework, multi-agent orchestration, test/optimize/deploy
**Estimated study time**: 1 hr

---

## TL;DR (60-second skim)

- An **agent** = Model + Instructions + Tools. Unlike chatbots, agents reason across steps and call tools autonomously.
- **Three agent types** in Foundry: **Prompt agents** (no-code, portal), **Workflow agents** (multi-agent orchestration, YAML/visual), **Hosted agents** (your code in containers).
- **Prompt agents** → rapid prototyping, fully managed. **Workflow agents** → sequential/group-chat/human-in-the-loop patterns. **Hosted agents** → full control, any framework.
- Built-in tools: Web Search, Code Interpreter, File Search, Function Calling, Azure AI Search, Azure Functions. Custom tools: MCP servers, OpenAPI, A2A protocol.
- **Development lifecycle**: Create → Test (playground) → Trace → Evaluate → Publish (stable endpoint) → Monitor.
- **RBAC**: Foundry Account Owner to create projects; **Foundry User** to create/edit agents.
- **Setup modes**: Basic (managed storage), Standard (BYO Azure resources), Standard + BYO VNet (network isolation).
- Today's quiz is **mixed cross-domain** (NLP, Speech, Translation, Vision from prior sessions + new agent concepts). Refresh key traps below.

---

## Learning Objectives

After this session you should be able to:
1. Explain what an agent is and distinguish it from a chatbot
2. Identify the three agent types in Foundry and when to use each
3. List the resources and permissions required to build an agent
4. Describe the agent development lifecycle (create → publish → monitor)
5. Map tool categories (built-in vs custom) to scenarios
6. Explain multi-agent orchestration patterns (sequential, group chat, human-in-the-loop)
7. Describe how Hosted agents work (containers, sessions, protocols)
8. Answer cross-domain questions on NLP, Speech, Translation, and Vision from prior sessions

---

## Key Concepts

### 1. What Is an Agent?

An agent is an AI application that uses a **model** to reason about user requests and **take autonomous actions** to fulfill them. Unlike a simple chatbot:

| Chatbot | Agent |
|---------|-------|
| Generates text only | Calls tools, accesses data, makes decisions |
| Single-turn or scripted | Multi-step reasoning across turns |
| Fixed responses | Autonomous action selection |

Every agent has **three core components**:
- **Model**: From the Foundry model catalog (GPT-4o, Llama, DeepSeek, etc.). Swap models without changing code.
- **Instructions**: Define goals, constraints, behavior. Can be prompts, workflow YAML, or Hosted agent code.
- **Tools**: Provide access to data or actions (search, file ops, API calls).

**Trap**: The exam may describe a scenario and ask whether you need a chatbot or an agent. If the scenario requires calling external APIs, executing code, or multi-step reasoning → agent. If it's just Q&A → chatbot / prompt-based solution.

### 2. Agent Types in Foundry

| Feature | Prompt Agent | Workflow Agent (preview) | Hosted Agent (preview) |
|---------|-------------|------------------------|----------------------|
| Code required | No | No (YAML optional) | Yes |
| Hosting | Fully managed | Fully managed | Container-based, managed |
| Orchestration | Single agent | Multi-agent, branching | Custom logic |
| Best for | Prototyping, simple tasks | Multi-step automation | Full control, custom frameworks |
| Portal creation | Yes (Agents playground) | Yes (visual builder) | No (deploy via SDK/azd) |
| Framework | N/A | Power Fx for expressions | Agent Framework, LangGraph, Semantic Kernel, custom |

#### Prompt Agents
- Defined entirely through configuration — instructions, model, tools.
- Create in Foundry portal with **no code**, or via SDK/REST API.
- Agent Service handles orchestration and hosting automatically.
- **Trap**: Prompt agents are the simplest starting point. If a question asks for "minimum development effort" for a simple agent → prompt agent.

#### Workflow Agents
- Orchestrate sequences of actions or coordinate multiple agents.
- Built visually in Foundry portal or defined in **YAML** via VS Code.
- Support: **branching logic** (if/else), **human-in-the-loop** steps, **sequential** and **group-chat** patterns.
- Use **Power Fx** (Excel-like formulas) for data manipulation in workflows.
- **Trap**: Hosted agents are NOT supported in the workflow designer. If you need multi-agent orchestration within a Hosted agent, use Agent Framework workflows, not the portal workflow builder.

Three workflow orchestration patterns:

| Pattern | Description | Use Case |
|---------|------------|----------|
| **Sequential** | Passes result from one agent to next in order | Step-by-step pipelines, multi-stage processing |
| **Group chat** | Dynamically passes control between agents based on context | Escalation, fallback, expert handoff |
| **Human in the loop** | Asks user a question, awaits input to proceed | Approval workflows, clarification requests |

#### Hosted Agents
- Your code packaged as a **container image**, pushed to **Azure Container Registry (ACR)**.
- Agent Service pulls image, provisions compute, assigns **Microsoft Entra ID** (agent identity), exposes endpoint.
- **Per-session VM-isolated sandboxes**. Each session has persistent filesystem (`$HOME`, `/files`).
- **Session idle timeout**: 15 minutes. Session lifetime: up to 30 days.
- Supported languages: **Python** and **C#**.
- **Two protocols**: Responses (OpenAI-compatible, most agents) and Invocations (arbitrary JSON, webhooks).
- **Trap**: Start with Responses protocol unless you need raw HTTP control. A Hosted agent can support both simultaneously.

### 3. Resources Required to Build an Agent

**Permissions (RBAC)**:

| Action | Required Role |
|--------|--------------|
| Create account + project | **Foundry Account Owner** (subscription scope) |
| Assign RBAC for BYO resources (Standard setup) | **Role Based Access Control Administrator** |
| Create/edit agents | **Foundry User** (project scope) |

**Trap**: Foundry RBAC roles were recently **renamed** — Foundry User was "Azure AI User", Foundry Owner was "Azure AI Owner", etc. The role IDs and permissions are unchanged. Exam may use old or new names.

**Setup Modes**:

| Setup | Data Storage | CMK | VNet Isolation |
|-------|-------------|-----|----------------|
| **Basic** | Platform-managed | No | No |
| **Standard** | Your Azure resources (Storage, Cosmos DB, AI Search) | Yes | No |
| **Standard + BYO VNet** | Your Azure resources | Yes | Yes |

- Default model deployed: **GPT-4.1** (modelFormat: OpenAI, SKU: GlobalStandard).
- **Trap**: Standard setup requires BYO resources (Azure Storage, Cosmos DB, Azure AI Search) for data isolation. Basic setup stores data in platform-managed storage.

### 4. Tools

#### Built-in Tools
| Tool | Purpose |
|------|---------|
| **Web Search** | Real-time info from public web with inline citations |
| **Code Interpreter** | Run Python in sandboxed environment (data analysis, charts) |
| **File Search** | Vector search over uploaded files/documents |
| **Azure AI Search** | Ground agents with existing search indexes |
| **Azure Functions** | Call your own functions for custom actions |
| **Function Calling** | Define custom functions; your app executes and returns results |
| **Image Generation** (preview) | Generate images in conversations |
| **SharePoint** (preview) | Chat with private SharePoint documents |
| **Microsoft Fabric** (preview) | Connect to Fabric data agent |

#### Custom Tools
| Tool | Purpose |
|------|---------|
| **MCP (Model Context Protocol)** | Connect to tools on MCP server endpoints |
| **OpenAPI** | Connect to external HTTP APIs via OpenAPI 3.0/3.1 spec |
| **Agent-to-Agent (A2A)** (preview) | Cross-agent communication via A2A endpoints |
| **Toolbox** (preview) | Bundle multiple tools into single MCP-compatible endpoint |

**Trap**: Function Calling ≠ Azure Functions. Function Calling defines a schema; your app runs the function. Azure Functions is a built-in tool that invokes actual Azure Functions resources.

**Toolbox**: Define tools once, manage centrally, expose via single MCP endpoint. Supports versioning. Any MCP-compatible runtime can consume it (Agent Framework, LangGraph, GitHub Copilot SDK).

**Tool Authentication**:
- Built-in tools: auto-authenticate through Agent Service
- MCP servers: Key-based, Microsoft Entra, OAuth (OBO), or unauthenticated
- OpenAPI tools: Anonymous, API key, or managed identity
- **Trap**: Prefer Microsoft Entra authentication for MCP servers — eliminates secret management and provides auto token rotation.

### 5. Agent Development Lifecycle

1. **Create** — Define prompt agent in portal or build Hosted agent in code
2. **Test** — Chat in agents playground or run locally. MCP server integrations can be validated in playground.
3. **Trace** — Inspect every model call, tool invocation, and decision (Application Insights integration)
4. **Evaluate** — Run evaluations to measure quality and catch regressions
5. **Publish** — Promote to managed resource with stable endpoint
6. **Monitor** — Track performance with service metrics and dashboards

**Key Pitfalls**:
- Unsaved changes are **temporary** — lost if you leave portal. Save as versions.
- Tools must be **configured before saving** (auth, connections complete).
- Publishing **can require permission updates** — published agent identity ≠ project identity.
- Agent names are **immutable** after creation.

**Trap**: Permissions assigned to the project identity don't automatically transfer to the published agent. After publishing, reassign privileges to the agent application's identity.

### 6. Publishing & Sharing

- **Versioning**: Each save creates immutable version. Compare configs, chat outputs, YAML diffs between versions.
- **Publishing**: Promotes agent to managed resource with stable endpoint.
- **Distribution channels**: Microsoft 365 Copilot, Teams, Entra Agent Registry.
- **Protocols**: OpenResponses, Activity (Teams/M365), Invocations, A2A (agent-to-agent).

### 7. Enterprise Capabilities

- **Agent Identity**: Each agent gets dedicated Microsoft Entra ID. Supports OBO passthrough.
- **Private Networking**: VNet isolation for prompt and workflow agents. Hosted agents support BYO VNet.
- **Content Safety**: Integrated content filters, prompt injection protection (including XPIA).
- **BYO Resources**: Use your own Storage, AI Search, Cosmos DB for compliance.

---

## Decision Framework: Which Agent Type?

```
Need an agent?
├── Simple Q&A / single task / prototyping?
│   └── Prompt Agent (no code, portal)
├── Multi-step orchestration / multiple agents / approval flows?
│   ├── No custom code needed?
│   │   └── Workflow Agent (visual builder / YAML)
│   └── Need custom framework / full control?
│       └── Hosted Agent (container-based)
└── Need webhooks / non-OpenAI payloads / custom protocols?
    └── Hosted Agent with Invocations protocol
```

---

## Comparisons

### Agent Service vs Building Your Own

| Aspect | Foundry Agent Service | DIY (self-hosted) |
|--------|----------------------|-------------------|
| Hosting | Fully managed | You manage |
| Scaling | Automatic | You configure |
| Identity | Built-in Entra ID | Manual IAM |
| Tracing | Built-in App Insights | You instrument |
| Publishing | One-click to Teams/M365 | Custom integration |

### Responses vs Invocations Protocol (Hosted Agents)

| Aspect | Responses | Invocations |
|--------|-----------|-------------|
| Best for | Most agents | Webhooks, custom payloads |
| Payload | OpenAI-compatible | Arbitrary JSON |
| Session history | Platform-managed | You manage |
| Client SDK | Any OpenAI SDK | Custom client |
| Streaming | Platform-managed | Raw SSE |

---

## Important Details for Exam

- Domain 3 weight: **5–10%** (smallest domain, but guaranteed questions)
- Agents (classic) are **deprecated**, will retire March 31, 2027. New exam tests **Foundry Agent Service**.
- **Foundry User** role = create/edit agents. **Foundry Account Owner** = create projects.
- Hosted agents available in: East US 2, North Central US, Sweden Central, Canada Central, and more.
- Hosted agent sandbox sizes: 0.25 vCPU / 0.5 GiB to 2 vCPU / 4 GiB.
- Max concurrent sessions per subscription per region: **50** (preview).
- Agent names are **immutable** after creation.
- Default autodeploy model: **GPT-4.1** (modelFormat: OpenAI).
- ACR must remain **publicly accessible** for Hosted agents (private ACR not supported yet).
- Workflow expressions use **Power Fx** (Excel-like), not Python.
- Toolbox exposes **MCP-compatible endpoint** — any MCP client can consume it.

---

## Common Traps & Misconceptions

1. **"Workflow agent" ≠ "Hosted agent with workflows"**: Workflow agents are no-code/YAML in the portal builder. Hosted agents use code-based frameworks. You can't use Hosted agents inside the workflow designer.
2. **Role confusion**: Foundry User creates agents; Foundry Account Owner creates projects. Don't mix them up.
3. **Function Calling vs Azure Functions**: Function Calling is a schema definition + your app executes. Azure Functions is a built-in tool that calls actual Azure Functions.
4. **Publishing doesn't inherit permissions**: After publishing, the agent application identity needs its own RBAC assignments.
5. **"Agents (classic)" distractor**: Old API deprecated. If an answer mentions "Azure OpenAI Assistants API" for agent creation, it's the legacy path.

---

## Cross-Domain Quiz Question Refreshers

Today's quiz includes **mixed questions from prior domains** (NLP, Speech, Translation, Vision). Key traps to remember:

| Concept | Key Fact | Trap |
|---------|----------|------|
| Sentiment analysis | Use **Language service** (not Content Moderator) | Content Moderator detects offensive content, not sentiment |
| Intent identification package (Python) | `azure-ai-language-conversations` (not textanalytics) | textanalytics is for entity recognition/sentiment, not intents |
| LUIS container deploy | Export → Move package to Docker input dir → Run container | Must export FIRST, then move, then run |
| Custom NER vs PII | Custom NER = domain-specific entities (product codes). PII detection = built-in (credit cards, SSN) | PII detection is pre-built; Custom NER requires labeled training data |
| Active learning in CLU | Add `log=true` to prediction endpoint query | Not speech priming or sentiment analysis |
| Multi-turn conversations | **Follow-up prompts** (not active learning, not chit-chat) | Active learning improves suggestions; follow-up prompts enable branching |
| Document translation + glossary | Upload glossary → Define translation spec → Perform async translation | Glossary upload comes FIRST |
| LUIS list entity | Use **list entity** for known sets (airport names/codes) | Pattern.any is for free-form extraction; list is for enumerated values |
| Custom Neural Voice profile | Upload **consent recording** (.wav/.mp3) of voice talent | Profile = consent; Training data = separate step (audio samples + transcripts) |
| Custom Neural Voice creation | **Speech Studio portal** to create, **Text-to-speech** service to generate | Don't confuse creation portal with generation service |
| Spatial Analysis | Detect presence/movement of people in video | Even though retired (March 2025), still tested on exam |

---

## Lab Exercise: Define Planner/Executor Split for a Workflow

**Scenario**: A retail company wants to automate customer order processing:
1. Customer submits order via chat
2. System validates inventory availability
3. If in stock → process payment → confirm order
4. If out of stock → suggest alternatives → get customer approval → reprocess

**Task**: Design the agent workflow by mapping each step to an agent type and pattern.

### Solution

```
Workflow Pattern: Sequential + Human-in-the-Loop

Agent 1: "Order Intake" (Prompt Agent)
  - Instructions: Extract order details from customer message
  - Tools: Function Calling (parse structured order JSON)
  - Output: { product_id, quantity, customer_id }

Agent 2: "Inventory Checker" (Prompt Agent)
  - Instructions: Check stock levels for requested items
  - Tools: Azure Functions (call inventory API)
  - Output: { in_stock: boolean, alternatives: [] }

Decision Node (If/Else):
  ├── in_stock == true → Agent 3
  └── in_stock == false → Agent 4

Agent 3: "Payment Processor" (Prompt Agent)
  - Instructions: Process payment and generate confirmation
  - Tools: OpenAPI tool (payment gateway)
  - Output: { order_confirmed: true, confirmation_number }

Agent 4: "Alternative Suggester" (Prompt Agent)
  - Instructions: Present alternatives to customer
  - Tools: File Search (product catalog)
  - Human-in-the-loop: Ask customer to approve alternative
  - On approval → route back to Agent 3
  - On rejection → end with apology message

Orchestration: Workflow Agent (visual builder in Foundry portal)
Reason: No custom code needed; sequential + branching + human-in-the-loop
```

**Why not Hosted Agent?** This scenario doesn't require custom frameworks or raw HTTP control. Workflow agent handles sequential/branching/human-in-the-loop natively.

---

## Quick Reference Card

| Item | Value |
|------|-------|
| Agent 3 components | Model + Instructions + Tools |
| Prompt agent | No code, portal, rapid prototyping |
| Workflow agent | Multi-agent orchestration, YAML/visual, Power Fx |
| Hosted agent | Container-based, Python/C#, any framework |
| Create projects | Foundry Account Owner |
| Create agents | Foundry User |
| Basic setup | Managed storage, quick start |
| Standard setup | BYO Storage + Cosmos DB + AI Search |
| Dev lifecycle | Create → Test → Trace → Evaluate → Publish → Monitor |
| Built-in tools | Web Search, Code Interpreter, File Search, Function Calling, Azure AI Search, Azure Functions |
| Custom tools | MCP, OpenAPI, A2A, Toolbox |
| Hosted agent idle timeout | 15 min |
| Hosted agent session lifetime | 30 days |
| Max concurrent sessions | 50/subscription/region |
| Default model | GPT-4.1 |
| Workflow patterns | Sequential, Group Chat, Human-in-the-Loop |
| Agent names | Immutable after creation |
| Agents (classic) | Deprecated, retires March 31, 2027 |

---

## Related Questions in questions.json

| ID | One-Line Summary |
|----|-----------------|
| HMXIWeGlWtybmSxvX5FY | Sentiment analysis → Language service |
| J6H7b5cSJAURakx6trDW | Intent model Python package → azure-ai-language-conversations |
| Kr0tXN44ovjHPcXJpl8H | LUIS container deploy sequence (export → move → run) |
| LrVoIFW7NYkqWJin5TGe | Custom NER vs PII detection in chatbot |
| MzfIUXsxoAMUexLknZmK | NER entity recognition behavior (hotspot) |
| OhWUpZGbKALICpxFGKKI | Speech-to-text + Translator for multilingual call handling |
| Raj8Orehh2zVqoCgy3K1 | Multi-turn conversations → follow-up prompts |
| S97WPPZCW5GDdXus0OwQ | Active learning → log=true on prediction endpoint |
| UR9i2oGHAMwESr4thHvy | Document translation with glossary (upload → define → translate) |
| URg3iik67Pte9LNkEHhu | LUIS list entity for airport names/codes |
| VMHYZXsnql9NJTG2Vixd | Custom Neural Voice profile → consent recording |
| X3C2GHY19fpNu3kwMWZ1 | Custom Neural Voice → Speech Studio + Text-to-speech |
| XVXLKy70MTcoDjhA2IfF | Spatial Analysis for monitoring user isolation |

Quiz command:
```powershell
cd "d:\Projects\microsoft-exam-prep\AI-102 Prep"; python quiz_runner.py --day 11
```

---

## Sources (verified during this session)

- [What is Microsoft Foundry Agent Service?](https://learn.microsoft.com/en-us/azure/foundry/agents/overview) — updated 2026-04-29
- [What are Hosted Agents?](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/hosted-agents) — updated 2026-05-15
- [Build a workflow in Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/workflow) — updated 2026-04-29
- [Agent tools overview (Tool catalog)](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/tool-catalog) — updated 2026-04-23
- [Agent development lifecycle](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/development-lifecycle) — updated 2026-04-24
- [Set up your environment](https://learn.microsoft.com/en-us/azure/foundry/agents/environment-setup) — updated 2026-04-15

---

## Notes (your own words — fill this in after studying)

_(Space for your notes after reading through the material)_
