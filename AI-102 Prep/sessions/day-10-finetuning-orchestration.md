# Day 10: Fine-tuning Decisions & Multi-Model Orchestration
**Date**: 2026-05-15
**Domain**: Domain 2 – Implement generative AI solutions (15–20%)
**Subtopics**: Fine-tuning decisions (when vs prompt engineering vs RAG), multi-model orchestration patterns
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)

- **When to fine-tune**: prompt engineering hits a ceiling (too many examples in system message, need consistent style/format/schema, distilling a large model into a smaller one). Fine-tuning is NOT for teaching the model new knowledge — that's RAG.
- **Decision ladder**: Prompt engineering first → RAG for knowledge → Fine-tuning for behavior/style/format → DPO for alignment → RFT for complex reasoning.
- **Data**: JSONL chat format, UTF-8 with BOM, < 512 MB per file, minimum 10 examples (recommend 50+), quality > quantity.
- **Supported models for fine-tuning**: gpt-4o, gpt-4o-mini, gpt-4.1, gpt-4.1-mini, gpt-4.1-nano (SFT/DPO); o4-mini (RFT only). Open-source: Ministral-3B, Qwen-32B, Llama-3.3-70B.
- **Deployment types for fine-tuned models**: Standard (regional, pay-per-token), Global Standard (cost savings, cross-region), Developer (no SLA, no hosting fee, eval only), Provisioned Throughput (PTU, predictable latency).
- **15-day auto-delete**: Inactive fine-tuned deployments deleted after 15 continuous days of no API calls. Model itself is NOT deleted.
- **Orchestration** = coordinating multiple models/tools in a pipeline. Tools: Prompt Flow (classic, being retired Apr 2027), Semantic Kernel (recommended), Microsoft Agent Framework.
- **Orchestration patterns**: routing (send to right model), chaining (sequential), fan-out/fan-in (parallel), ensemble (majority vote), fallback (retry with different model).

---

## Learning Objectives

After this session you should be able to:

1. Apply the decision framework: prompt engineering → RAG → fine-tuning
2. Choose between SFT, DPO, and RFT for a given scenario
3. Describe the end-to-end fine-tuning workflow in Azure OpenAI / Microsoft Foundry
4. State data format requirements (JSONL, BOM, 512 MB, min 10 examples)
5. Identify which models support fine-tuning and which methods they support
6. Explain deployment types and cost implications for fine-tuned models
7. Describe multi-model orchestration patterns and when to use each
8. Compare orchestration tools: Prompt Flow, Semantic Kernel, Microsoft Agent Framework

---

## Key Concepts

### 1. When to Fine-Tune vs Prompt Engineer vs RAG

This is the most exam-critical decision framework in Domain 2.

| Approach | Best For | Limitations |
|---|---|---|
| **Prompt engineering** (few-shot, system message) | Quick iteration, low cost, no training data needed | Limited by context window; long prompts increase cost & latency |
| **RAG** (Retrieval-Augmented Generation) | Grounding in up-to-date / proprietary knowledge | Doesn't change model behavior/style; retrieval quality depends on index |
| **Fine-tuning (SFT)** | Consistent style/tone, specific output format/schema, reducing prompt length, distillation | Requires quality training data; adds training and hosting costs |
| **DPO** | Aligning model with human preferences (preferred vs non-preferred responses) | Needs paired preference data |
| **RFT** | Complex reasoning tasks where many valid paths exist | Only o4-mini currently; needs grader model |

**Trap**: The exam loves to present scenarios where RAG is the right answer but fine-tuning is a distractor. Remember: **fine-tuning doesn't teach new facts** — it changes behavior. If the question says "the model needs access to current company data," the answer is RAG, not fine-tuning.

**Trap**: If the question mentions "reduce token usage" or "shorter prompts," fine-tuning IS a valid answer — it embeds learned patterns so you don't need long system messages.

#### When fine-tuning is the RIGHT choice (per Microsoft Learn):
- Reducing prompt engineering overhead (too many few-shot examples)
- Modifying style and tone consistently
- Generating outputs in specific formats or schemas
- Enhancing tool-calling accuracy
- Enhancing retrieval-based performance (fine-tune + RAG together)
- Optimizing for efficiency / model distillation (large model → smaller model)

#### When fine-tuning is the WRONG choice:
- Teaching the model new domain knowledge → use RAG
- One-off tasks → use prompt engineering
- You have < 50 high-quality examples → probably not enough
- You need real-time data → RAG

### 2. Fine-Tuning Methods: SFT vs DPO vs RFT

| Method | Full Name | Training Data Format | Best For | Key Difference |
|---|---|---|---|---|
| **SFT** | Supervised Fine-Tuning | Input/output pairs (JSONL chat format) | Most scenarios: task specialization, format, style | Trains on labeled correct answers |
| **DPO** | Direct Preference Optimization | Preferred + non-preferred response pairs | Alignment with human preferences | Binary preference training, no reward model needed; lighter than RLHF |
| **RFT** | Reinforcement Fine-Tuning | Prompts + model grader for reward signals | Complex reasoning with many valid solutions | Grader rewards incremental improvements; model explores solution space |

**Stacking techniques**: You can SFT first → then DPO to align. SFT for task competence, DPO for preference alignment.

**Trap**: DPO is NOT the same as RLHF. DPO is computationally lighter — it doesn't need a separate reward model. The exam may present RLHF as an option; DPO is the Azure implementation.

### 3. Fine-Tuning Workflow End-to-End

```
1. Prepare data (JSONL, chat format, UTF-8 BOM, < 512 MB)
        ↓
2. Upload to Foundry project (or use existing dataset)
        ↓
3. Create fine-tuning job (select base model, method, hyperparameters)
        ↓
4. Monitor training (train_loss ↓, token_accuracy ↑, watch for overfitting)
        ↓
5. Review checkpoints (3 most recent saved; can pause and resume)
        ↓
6. Deploy fine-tuned model (Standard / Global Standard / PTU / Developer)
        ↓
7. Use in application (same API as base model, keep same system message!)
```

#### Data Requirements
- **Format**: JSONL with `{"messages": [{"role": "system", ...}, {"role": "user", ...}, {"role": "assistant", ...}]}`
- **Encoding**: UTF-8 with BOM (byte-order mark)
- **File size**: < 512 MB per file
- **Minimum examples**: 10 (but Microsoft recommends 50+ for noticeable improvement)
- **Quality**: High-quality > high-quantity. Bad data = bad model.
- **Multi-turn**: Supported — multiple user/assistant turns in a single JSONL line
- **Weight field**: Optional `"weight": 0` or `1` on assistant messages to skip training on specific responses
- **Vision fine-tuning**: Supported for gpt-4o and gpt-4.1 — include `image_url` in user content

#### Hyperparameters
| Parameter | Description | Guidance |
|---|---|---|
| `n_epochs` | Full cycles through training data | -1 = auto; more epochs risk overfitting |
| `batch_size` | Examples per training step | -1 = auto (0.2% of dataset, max 256) |
| `learning_rate_multiplier` | Multiplied with pre-training LR | 0.02–0.2 range; smaller = less overfitting |

#### Training Metrics to Watch
- `train_loss` → should decrease over time
- `full_valid_loss` → validated at end of each epoch; diverging from train_loss = overfitting
- `train_mean_token_accuracy` → should increase
- `full_valid_mean_token_accuracy` → should increase

**Trap**: If train loss keeps decreasing but validation loss starts increasing, you're **overfitting**. Fix: fewer epochs or lower learning rate multiplier.

### 4. Supported Models for Fine-Tuning (Azure OpenAI)

| Model | Regions | SFT | DPO | RFT | Modality |
|---|---|---|---|---|---|
| gpt-4o-mini (2024-07-18) | North Central US, Sweden Central | ✅ | — | — | Text → Text |
| gpt-4o (2024-08-06) | East US2, North Central US, Sweden Central | ✅ | ✅ | — | Text+Vision → Text |
| gpt-4.1 (2025-04-14) | North Central US, Sweden Central | ✅ | ✅ | — | Text+Vision → Text |
| gpt-4.1-mini (2025-04-14) | North Central US, Sweden Central | ✅ | ✅ | — | Text → Text |
| gpt-4.1-nano (2025-04-14) | North Central US, Sweden Central | ✅ | ✅ | — | Text → Text |
| o4-mini (2025-04-16) | East US2, Sweden Central | — | — | ✅ | Text → Text |

Open-source (Foundry only, SFT only): Ministral-3B, Qwen-32B, Llama-3.3-70B-Instruct

**Trap**: o4-mini supports ONLY RFT — not SFT or DPO. If the exam asks about fine-tuning a reasoning model, RFT is the answer.

**Continuous fine-tuning**: You can fine-tune a previously fine-tuned model (name format: `base-model.ft-{jobid}`). OpenAI models only.

### 5. Deployment Considerations for Fine-Tuned Models

| Deployment Type | Hosting Fee | SLA | Data Residency | Use Case |
|---|---|---|---|---|
| **Standard** | Hourly + per-token | ✅ | Regional | Production with data residency requirements |
| **Global Standard** | Hourly + per-token (cheaper) | ✅ | Cross-region possible | Production, cost-sensitive, no data residency restriction |
| **Developer** | No hosting fee | ❌ | Cross-region | Evaluation/testing only, not production |
| **Provisioned (PTU)** | Reserved capacity | ✅ | Regional | Low-latency, predictable performance |

**Trap**: Fine-tuned models incur **hourly hosting costs** regardless of usage (except Developer tier). The 15-day inactivity auto-delete is a cost-saving mechanism.

**Trap**: The system message used during inference MUST match the system message used in training data. Different system message → unpredictable results.

### 6. Training Tiers (Training Cost, Not Deployment)

| Training Tier | Description | Data Residency | SLA |
|---|---|---|---|
| **Standard** | Train in resource's region | ✅ Regional | ✅ |
| **Global** | Uses capacity across regions, cheaper | ❌ | ✅ |
| **Developer (preview)** | Uses idle capacity, cheapest | ❌ | ❌ (can be preempted) |

### 7. Multi-Model Orchestration

Orchestration = coordinating multiple AI models, tools, and data sources in a unified pipeline to solve complex tasks.

#### Orchestration Patterns

| Pattern | Description | Example |
|---|---|---|
| **Routing** | Classify input → send to appropriate specialized model | Simple queries → gpt-4o-mini; Complex → gpt-4o; Code → gpt-4.1 |
| **Chaining** | Output of model A feeds into model B sequentially | Extract entities (model 1) → Summarize (model 2) → Format (model 3) |
| **Fan-out / Fan-in** | Send same input to multiple models in parallel, aggregate results | Ask 3 models for translation, pick best via scoring |
| **Ensemble / Voting** | Multiple models answer, take majority/best | Reliability-critical tasks: legal, medical |
| **Fallback** | Try primary model, fall back to secondary on failure/low confidence | gpt-4o timeout → retry with gpt-4o-mini |
| **Judge / Evaluator** | One model evaluates another's output | gpt-4o grades gpt-4o-mini responses for quality |

#### Orchestration Tools in Azure

| Tool | Status | Language Support | Key Feature |
|---|---|---|---|
| **Prompt Flow** (classic) | Retiring Apr 2027 | Python (+ visual DAG in portal) | Visual node-based orchestration with LLM, Python, Prompt nodes |
| **Semantic Kernel** | Active, v1.0+ | C#, Python, Java | Enterprise-grade middleware; plugin architecture; OpenAPI integration |
| **Microsoft Agent Framework** | Active | C#, Python | Full agent lifecycle; recommended migration target from Prompt Flow |
| **LangChain** | Third-party, supported | Python, JS | Popular open-source; works with Azure OpenAI but not Microsoft-native |

**Trap**: Prompt Flow is being **retired** (read-only Apr 2027). Microsoft recommends migrating to **Microsoft Agent Framework**. The exam may still test Prompt Flow concepts but be aware of the migration path.

**Trap**: Semantic Kernel is the recommended SDK for building orchestration in production code. It's NOT a no-code tool — it's a code-first SDK.

#### Prompt Flow Key Concepts (still exam-relevant)
- Three flow types: **Standard**, **Chat**, **Evaluation**
- `flow.dag.yaml` defines the flow structure
- Nodes can be: LLM, Prompt, Python, or custom tools
- **Conditional control**: nodes can have "activate config" (when-conditions) to skip execution
- Flow inputs use `${inputs.name}` syntax; node outputs use `${node_name.output}`
- Chat flows require `chat_history` (auto-managed list of inputs/outputs)
- **Variants**: different prompt versions compared side-by-side for evaluation

#### Semantic Kernel Key Concepts
- **Kernel** = central orchestrator that connects AI services, plugins, and memory
- **Plugins** = reusable functions (native code or prompts) the AI can call
- **Planners** = AI-driven execution planning (decides which plugins to call)
- Uses **OpenAPI specs** for plugin interoperability (same as M365 Copilot)
- Supports telemetry via OpenTelemetry
- Future-proof: swap models without rewriting code

### 8. Cross-Topic Review: Key Concepts from Days 1-9

The quiz today includes carryover questions from prior sessions. Quick refreshers:

- **Computer Vision imageType**: Use `POST /vision/v3.2/analyze/?visualFeatures=imageType` to detect if an image is a photograph, clipart, or line drawing. Returns `clipArtType` (0-3) and `lineDrawingType` (0-1).
- **Image descriptions / captions**: `visualFeatures=Description` generates alt text. Part of Computer Vision (not Custom Vision).
- **Custom Vision workflow**: Create project → Upload and tag images → Train → Evaluate → Publish → Consume. Don't create a NEW model when adding new images — extend existing one.
- **Video Indexer upload limits**: Direct upload from device ≤ 2 GB. Via URL ≤ 30 GB. For a 20 GB file, upload to OneDrive/YouTube first, then provide URL.
- **CLU model evaluation**: Before deployment, use (A) REST API model evaluation summary or (C) Language Studio > Model performance. NOT Active Learning (requires deployed model first).
- **Key phrase extraction**: Returns meaningful noun phrases. "the quick brown fox jumps over the lazy dog" → "quick brown fox", "lazy dog".
- **Azure.AI.Language.Conversations**: C# package for CLU (intent recognition from text input).

---

## Decision Framework: Prompt Engineering → RAG → Fine-Tuning

```
START: "I need to improve my AI model's outputs"
    │
    ├─ Does the model need access to specific/current data?
    │   ├─ YES → Use RAG (ground in your data)
    │   │         Can fine-tune + RAG together for better retrieval use
    │   └─ NO ↓
    │
    ├─ Can you solve it with a better prompt / few-shot examples?
    │   ├─ YES → Prompt engineering (cheapest, fastest)
    │   └─ NO ↓
    │
    ├─ Is the system message getting too long (many examples)?
    │   ├─ YES → Fine-tune with SFT (embed examples into weights)
    │   └─ NO ↓
    │
    ├─ Do you need consistent style/tone/format/schema?
    │   ├─ YES → Fine-tune with SFT
    │   └─ NO ↓
    │
    ├─ Do you want to align with human preferences?
    │   ├─ YES → DPO (after SFT)
    │   └─ NO ↓
    │
    ├─ Is the task complex reasoning with many valid paths?
    │   ├─ YES → RFT (o4-mini only)
    │   └─ NO ↓
    │
    └─ Do you need a smaller/cheaper model with similar quality?
        ├─ YES → Distillation: collect outputs from large model,
        │         fine-tune smaller model (e.g., o1 → gpt-4o-mini)
        └─ NO → Reassess requirements
```

---

## Common Traps & Misconceptions

1. **"Fine-tuning teaches the model new knowledge"** — NO. Fine-tuning changes behavior/style. For new knowledge, use RAG.
2. **"You need thousands of examples"** — Minimum is 10, recommended 50+. Quality matters more than quantity.
3. **"Fine-tuned model is free to store"** — Yes, storing the model is free. But **deploying** it incurs hourly hosting costs (except Developer tier).
4. **"15-day auto-delete removes the model"** — No, it only removes the **deployment**. The model remains and can be redeployed.
5. **"DPO requires a reward model"** — No, DPO is specifically designed to NOT need a reward model (unlike RLHF).
6. **"o4-mini supports SFT"** — No, o4-mini supports only RFT.
7. **"Prompt Flow is the recommended orchestration tool"** — It's being retired (Apr 2027). Migrate to Microsoft Agent Framework or use Semantic Kernel.
8. **"You should change the system message after fine-tuning"** — No, use the SAME system message from training data.
9. **"Custom Vision: create a new model for new images"** — No, add images to the EXISTING project/model and retrain.
10. **"Video Indexer can handle 20 GB direct uploads"** — No, 2 GB limit for direct device uploads. Upload to OneDrive first.

---

## Lab Exercise: Decision Tree for Prompt-Only vs Fine-Tune

**Instructions**: For each scenario below, decide: (A) Prompt engineering only, (B) RAG, (C) Fine-tuning (SFT), (D) DPO, (E) RFT, or (F) Combination. Write your reasoning.

1. **Scenario**: A law firm wants their chatbot to always respond in formal legal language with specific citation formatting.
   > _Your answer:_ ___

2. **Scenario**: An e-commerce company needs their model to answer questions about current product inventory and pricing.
   > _Your answer:_ ___

3. **Scenario**: A startup wants to reduce API costs by using gpt-4o-mini instead of gpt-4o but maintaining similar quality for their customer support task.
   > _Your answer:_ ___

4. **Scenario**: A content moderation team wants the model to prefer safe, measured responses over aggressive ones when discussing controversial topics.
   > _Your answer:_ ___

5. **Scenario**: A developer is building a prototype and wants to test different response formats quickly.
   > _Your answer:_ ___

<details>
<summary>Answers</summary>

1. **C (SFT)** — Consistent style and specific output format. Fine-tuning embeds the citation formatting into weights.
2. **B (RAG)** — Current/changing data needs retrieval, not fine-tuning. Index the product catalog.
3. **C (SFT) / Distillation** — Collect gpt-4o outputs for the support task, fine-tune gpt-4o-mini on them.
4. **D (DPO)** — Preference alignment: preferred (safe) vs non-preferred (aggressive) response pairs.
5. **A (Prompt engineering)** — Quick iteration, no training data needed, prototype phase.

</details>

---

## Quick Reference Card

### Fine-Tuning at a Glance
| Item | Value |
|---|---|
| Data format | JSONL, chat completion format |
| Encoding | UTF-8 with BOM |
| Max file size | 512 MB |
| Min training examples | 10 |
| Recommended examples | 50+ |
| Training methods | SFT, DPO, RFT |
| Checkpoints saved | 3 most recent per job |
| Auto-delete inactive deployment | 15 days |
| Roles required | Azure AI Owner (for deployment) |
| Continuous fine-tuning | Supported (OpenAI models only) |
| Vision fine-tuning | gpt-4o, gpt-4.1 |
| LoRA | Used internally to reduce complexity |

### Orchestration at a Glance
| Tool | Type | Status |
|---|---|---|
| Prompt Flow | Visual DAG + Python | Retiring Apr 2027 |
| Semantic Kernel | Code SDK (C#/Python/Java) | Active, v1.0+ |
| Agent Framework | Agent lifecycle | Active, recommended |
| LangChain | Open-source SDK | Supported, not Microsoft-native |

---

## Related Questions in questions.json

| ID | Summary |
|---|---|
| EH8BmOGVUw2vc2YL9gd0 | OCR text extraction + profanity detection service selection |
| MTFOjEdBHLPDUkzh5tLy | Parallel indexing in Azure Cognitive Search for speed |
| PG5k7O7oULcHCyhigbIM | Custom Vision API workflow: Create → Upload/Tag → Train |
| biGTrsccoCIkhWC8AQzq | Video Indexer 20 GB file upload: OneDrive first (2 GB device limit) |
| mC3blqdCnayyXTHxfRjx | Image type detection + image descriptions (Computer Vision) |
| pXuYh0rkOhAEmlouUoKX | Computer Vision analyze images + imageType property |
| wJsz2eoOtd9CfW1uz9zR | Alt text (descriptions) + adult content detection (Computer Vision) |
| 2fT4VARgeB04H2dLoTq6 | Azure.AI.Language.Conversations package for CLU (intent) |
| 7sFQtADIFMcWg46v11aZ | Key phrase extraction Python output |
| BGndDDffZvK9bNVU2oBN | CLU model evaluation: REST endpoint + Language Studio Model performance |
| D76miQugR8VC8r7pHszD | Custom Vision: don't create new model; extend existing and retrain |

Quiz command:
```powershell
cd "d:\Projects\microsoft-exam-prep\AI-102 Prep"; python quiz_runner.py --day 10
```

---

## Sources (verified during this session)

- [Customize a model with fine-tuning](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/fine-tuning)
- [Microsoft Foundry fine-tuning considerations](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/fine-tuning-considerations)
- [Deploy a fine-tuned model for inferencing](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/fine-tuning-deploy)
- [Introduction to Semantic Kernel](https://learn.microsoft.com/en-us/semantic-kernel/overview/)
- [Develop a prompt flow (classic)](https://learn.microsoft.com/en-us/azure/foundry-classic/how-to/flow-develop)

---

## Notes (your own words — fill this in after studying)

_(Space for your notes after going through the material)_
