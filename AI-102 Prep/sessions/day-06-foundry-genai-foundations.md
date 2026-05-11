# Day 6: Foundry GenAI Foundations
**Date**: 2026-05-11
**Domain**: Domain 2 – Implement generative AI solutions (15–20%)
**Subtopics**: 2.1 Build generative AI solutions with Microsoft Foundry
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)
- **Microsoft Foundry** = unified Azure PaaS for AI — replaces Azure AI Studio / Hub + Project model with a single **Foundry resource** that holds **projects**
- **Foundry resource** is the top-level Azure resource; **projects** organize work (agents, evals, files) underneath it
- **Prompt Flow** is a visual DAG-based orchestration tool for LLM apps — **retiring Apr 2027**, migrate to Agent Framework
- Three flow types: **Standard**, **Chat**, **Evaluation** — tools include LLM, Prompt, Python
- **Deployment types**: Global Standard (pay-per-token, highest quota), Provisioned (reserved PTU), Batch (50% discount, 24-hr), Data Zone (EU/US compliance), Standard (single region)
- **Evaluation**: 3 evaluator categories — **Agent**, **Quality** (AI-assisted: coherence, groundedness, relevance), **Safety** (no model needed)
- **Foundry SDK**: `azure-ai-projects>=2.0.0` — two client types: **Project client** (setup) + **OpenAI-compatible client** (agents, models, evals)
- **Connections** authenticate to external resources (AI Search, Storage, Cosmos DB, OpenAI, App Insights, etc.)

---

## Learning Objectives
After this session you should be able to:
1. Describe the Foundry resource → project hierarchy and when to use multiple projects
2. List the 3 prompt flow types and explain the DAG-based flow concept
3. Compare deployment types (Global Standard vs Provisioned vs Batch vs Data Zone)
4. Identify the 3 categories of built-in evaluators and their requirements
5. Write basic Foundry SDK code to create a project client and call a model
6. Explain connections and their role in Foundry projects

---

## Key Concepts

### 1. Microsoft Foundry Architecture
Foundry consolidates previous Azure AI services into one platform:

| Old Concept | New Concept |
|---|---|
| Azure AI Studio / Azure AI Foundry | **Microsoft Foundry** |
| Hub + Azure OpenAI + Azure AI Services | **Foundry resource** (single, with projects) |
| azure-ai-inference, azure-ai-generative, etc. | **azure-ai-projects 2.x** (unified SDK) |
| Assistants API (Agents v0.5/v1) | **Responses API (Agents v2)** |
| Threads, Messages, Runs | **Conversations, Items, Responses** |

**Foundry resource** is an Azure resource. **Projects** are child resources that organize agents, evals, files. The first project created is the "default" project (most capable). Multiple projects share parent resource's deployments, network security, and connections.

**Trap**: The old "Hub + Project" model from Azure AI Studio is now called **Foundry (classic)**. The new model is just **Foundry resource → Projects**. Exam questions may use either terminology.

**Key roles**: Azure AI User (least-privilege for dev), Azure AI Owner (manage), Contributor/Owner (subscription-level). To assign roles to team members → need Owner role.

### 2. Creating a Foundry Project
Portal: ai.azure.com → select project name → Create new project → name → Create.

SDK (Python):
```python
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential

client = AIProjectClient(
    endpoint="https://<resource>.services.ai.azure.com/api/projects/<project>",
    credential=DefaultAzureCredential()
)
```

**Trap**: The endpoint format is `https://<resource-name>.services.ai.azure.com/api/projects/<project-name>` — NOT a cognitiveservices.azure.com URL.

### 3. Model Deployment Types

| Type | SKU Code | Where | Billing | Use Case |
|---|---|---|---|---|
| Global Standard | `GlobalStandard` | Any region | Pay-per-token | General, highest quota |
| Global Provisioned | `GlobalProvisionedManaged` | Any region | Reserved PTU | Predictable throughput |
| Global Batch | `GlobalBatch` | Any region | 50% discount, 24-hr | Large async jobs |
| Data Zone Standard | `DataZoneStandard` | US or EU zone | Pay-per-token | Data residency compliance |
| Standard | `Standard` | Single region | Pay-per-token | Regional compliance |
| Developer | `DeveloperTier` | Any region | Pay-per-token | Fine-tuned eval only, 24-hr lifetime |

**Trap**: Developer deployments auto-delete after 24 hours — no SLA, evaluation only.
**Trap**: Global Batch has a 24-hr *target* turnaround, not guaranteed SLA.
**Trap**: Data Zone = US or EU processing zone. Global = any Azure region worldwide.

### 4. Prompt Flow (Legacy — Retiring Apr 2027)
Prompt Flow is a visual DAG-based development tool for LLM applications.

**Three flow types**:
- **Standard flow** — general-purpose LLM app development with LLM/Prompt/Python tools
- **Chat flow** — adds chat history management and native conversation mode
- **Evaluation flow** — takes outputs of previous runs as inputs, measures performance metrics

**Built-in tools**: LLM tool, Prompt tool, Python tool. Custom tools supported via packages.

**Flow lifecycle**: Initialization → Experimentation → Evaluation & Refinement → Production

**Trap**: Prompt Flow feature development ended Apr 20, 2026. Retirement date is Apr 20, 2027 (read-only). Migrate to **Microsoft Agent Framework**. If the exam mentions prompt flow, it's still valid content but know the retirement status.

### 5. Evaluation in Foundry

**Evaluation targets** (what you evaluate):
- **Agent** — evaluates agent output from prompt/hosted agents
- **Model** — evaluates model output with a user-defined prompt
- **Dataset** — evaluates preexisting outputs from a test dataset
- **Traces** — evaluates agent interactions from Application Insights

**Three evaluator categories**:
1. **Agent evaluators** — task handling, tool usage, user intent adherence
2. **Quality evaluators** — coherence, fluency, groundedness, relevance (AI-assisted, need a GPT model as judge) + NLP metrics (mathematical, often need ground truth)
3. **Safety evaluators** — hate/unfairness, violence, protected materials (**no model deployment needed**)

**Trap**: Safety evaluators do NOT require a model deployment. Quality evaluators DO require a deployed GPT model as judge.

**Dataset formats**: CSV or JSONL. Supports multimodal (images as data URIs, audio as WAV base64).

### 6. Foundry SDK Integration
Package: `pip install "azure-ai-projects>=2.0.0"` (v2.x = new Foundry; v1.x = classic)

**Two client types**:
- **Project client** (`AIProjectClient`) — connections, project properties, tracing
- **OpenAI-compatible client** (`project.get_openai_client()`) — agents, evals, model calls via Responses API

```python
# Project client
project = AIProjectClient(endpoint=PROJECT_ENDPOINT, credential=DefaultAzureCredential())

# OpenAI-compatible client from project
openai = project.get_openai_client()
response = openai.responses.create(model="gpt-5-mini", input="Hello")
```

**Trap**: The OpenAI SDK endpoint (`/openai/v1`) supports embeddings. The Foundry SDK project endpoint does NOT route embedding requests — use the OpenAI SDK endpoint for embeddings.

### 7. Connections
Connections authenticate to external resources within Foundry projects.

**Key connection types** (exam favorites):
- **Azure AI Search** — required for Standard Agent deployment
- **Azure Storage** — required for Standard Agent deployment
- **Azure Cosmos DB** — required for Standard Agent deployment (code-only creation)
- **Azure OpenAI** — access GPT models with Azure security
- **Application Insights** — performance monitoring and diagnostics
- **Grounding with Bing Search** — real-time web grounding for queries

**Trap**: Cross-subscription connections for model deployment are NOT supported.
**Trap**: Only ONE Azure Key Vault connection per Foundry resource at a time.

---

## Comparisons (X vs Y)

| Feature | Foundry SDK (azure-ai-projects) | OpenAI SDK |
|---|---|---|
| Endpoint | `/api/projects/<name>` | `/openai/v1` |
| Agents & Evals | ✅ | ❌ |
| Embeddings | ❌ (route not supported) | ✅ |
| Foundry direct models | Responses API | Chat Completions API |
| Auth | DefaultAzureCredential | API key or token |

---

## Common Traps & Misconceptions
1. **"Hub" is not "Foundry resource"** — Hub is the old Foundry (classic) concept. New = Foundry resource.
2. **Safety evaluators need no model** — only quality evaluators need a GPT judge model.
3. **Prompt Flow is being retired** — don't confuse it with Agent Framework (the replacement).
4. **Developer deployment = 24-hr auto-delete** — it's for fine-tuned model eval only.
5. **Embeddings → use OpenAI SDK endpoint**, not the Foundry project endpoint.
6. **Default project is the most capable** — some features (batch, fine-tuning, speech fine-tuning) only work on the default project.

---

## Lab: Design a Prompt Flow with Two Connected Nodes (Paper Exercise)

**Scenario**: Build a customer support Q&A flow that takes a user question, retrieves relevant docs, and generates an answer.

**Design your flow on paper:**

1. **Node 1: "retrieve_docs" (Python tool)**
   - Input: `${inputs.question}` (user's question string)
   - Logic: Call Azure AI Search index to retrieve top-3 relevant documents
   - Output: `retrieved_context` (concatenated doc snippets)

2. **Node 2: "generate_answer" (LLM tool)**
   - Input: `${retrieve_docs.retrieved_context}` + `${inputs.question}`
   - System prompt: "Answer the user's question based only on the provided context. If unsure, say 'I don't know.'"
   - Output: `answer` (the generated response)

**Connection**: Node 2 depends on Node 1 (DAG arrow from retrieve_docs → generate_answer).

**Questions to answer on paper**:
- What flow type is this? → **Standard flow** (general-purpose, not chat-specific)
- What would you add for production? → An **Evaluation flow** to measure groundedness
- How would you make it a Chat flow? → Add chat history management and use Chat flow type

---

## Quiz Questions in questions.json
Day 6 assigned IDs cover a mix of Domain 2 (Computer Vision, Face API, OCR, Video Indexer, Form Recognizer) and cross-topic Domain 3 questions. These test vision/OCR fundamentals alongside today's Foundry study material.

Quiz command:
```powershell
cd "d:\Projects\microsoft-exam-prep\AI-102 Prep"
python quiz_runner.py questions.json --day-lock 6 --carryover 3 --shuffle --open-images
```

Optional browser mode:
```powershell
cd "d:\Projects\microsoft-exam-prep\AI-102 Prep"
python quiz_runner.py questions.json --day-lock 6 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)
- [What is Microsoft Foundry?](https://learn.microsoft.com/en-us/azure/foundry/what-is-foundry)
- [Create a project for Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/how-to/create-projects)
- [Prompt flow in Microsoft Foundry portal (classic)](https://learn.microsoft.com/en-us/azure/foundry-classic/concepts/prompt-flow)
- [Run evaluations from the Foundry portal](https://learn.microsoft.com/en-us/azure/foundry/how-to/evaluate-generative-ai-app)
- [Observability in generative AI](https://learn.microsoft.com/en-us/azure/foundry/concepts/observability)
- [Deployment types for Microsoft Foundry Models](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types)
- [Microsoft Foundry SDKs and Endpoints](https://learn.microsoft.com/en-us/azure/foundry/how-to/develop/sdk-overview)
- [Add a new connection to your project](https://learn.microsoft.com/en-us/azure/foundry/how-to/connections-add)

---

## Notes (your own words — fill this in after studying)
_(Space for your own notes after going through the material)_
