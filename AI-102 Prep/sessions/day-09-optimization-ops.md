# Day 9: Optimization and Ops

**Date**: 2026-05-14
**Domain**: Domain 2 – Implement generative AI solutions (15–20%)
**Subtopics**: Section 2.3 – Optimize and operationalize a generative AI solution
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)

- **Temperature** (0–2) controls randomness; **top_p** controls token pool size. Change one at a time, never both.
- **Deployment types**: Global Standard (highest quota, pay-per-token), Provisioned (reserved PTU), Global Batch (50% discount, 24-hr), Data Zone (EU/US residency), Developer (fine-tune eval only, 24-hr lifetime).
- **Tracing** uses OpenTelemetry → Azure Monitor Application Insights. Packages: `azure-monitor-opentelemetry` + `opentelemetry-instrumentation-openai-v2`. Set `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true` to capture prompts/responses.
- **Fine-tuning** requires JSONL in chat format, min 10 examples (recommend 50+), uses LoRA. Methods: SFT, DPO, RFT. Inactive fine-tuned deployments auto-deleted after 15 days.
- **Prompt engineering**: few-shot > zero-shot; chain-of-thought for reasoning; recency bias = info at end weighs more; grounding context reduces hallucinations.
- **Container deployment** for on-premises: still requires billing endpoint (Eula=accept, Billing=, ApiKey=). Custom Vision compact domains required for mobile/edge export.
- **Model reflection** = model evaluates its own output for accuracy/completeness before returning.

---

## Learning Objectives

After this session you should be able to:

1. Configure temperature, top_p, max_tokens, and frequency/presence penalty to control generative behavior
2. Explain deployment types and when to use each (Global Standard vs Provisioned vs Batch)
3. Set up tracing with OpenTelemetry and Application Insights
4. Describe fine-tuning workflow, data format, and customization methods (SFT, DPO, RFT)
5. Apply prompt engineering techniques (few-shot, chain-of-thought, grounding, system messages)
6. Understand container deployment requirements for on-premises/edge scenarios
7. Explain model reflection and feedback collection patterns

---

## Key Concepts

### 1. Parameters That Control Generative Behavior

| Parameter           | Range   | Effect                                                             | Use Case                                                       |
| ------------------- | ------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| `temperature`       | 0–2     | Higher = more random/creative, Lower = more focused/deterministic  | Legal docs → 0.1–0.3; Stories → 0.7–1.0                        |
| `top_p`             | 0–1     | Nucleus sampling: considers tokens within cumulative probability p | Alternative to temperature; 0.1 = only top 10% probable tokens |
| `max_tokens`        | varies  | Hard cap on output length                                          | Control cost and response size                                 |
| `frequency_penalty` | -2 to 2 | Penalizes repeated tokens proportional to frequency                | Reduce repetition                                              |
| `presence_penalty`  | -2 to 2 | Penalizes tokens that have appeared at all                         | Encourage topic diversity                                      |
| `stop`              | array   | Stop sequences to end generation                                   | Control output boundaries                                      |

**Trap**: The exam tests whether you know to change temperature OR top_p, never both simultaneously. Microsoft's recommendation is clear: alter one at a time.

**Trap**: Temperature range is 0–2 (not 0–1). Most people assume max is 1.

### 2. Deployment Types for Foundry Models

| Type                 | SKU Name                   | Data Processing  | Billing                    | Best For                                                     |
| -------------------- | -------------------------- | ---------------- | -------------------------- | ------------------------------------------------------------ |
| Global Standard      | `GlobalStandard`           | Any Azure region | Pay-per-token              | General workloads, highest quota                             |
| Global Provisioned   | `GlobalProvisionedManaged` | Any region       | Reserved PTU               | Predictable high-throughput                                  |
| Global Batch         | `GlobalBatch`              | Any region       | 50% discount, 24-hr target | Large async jobs                                             |
| Data Zone Standard   | `DataZoneStandard`         | Within US or EU  | Pay-per-token              | Data residency compliance                                    |
| Standard             | `Standard`                 | Single region    | Pay-per-token              | Regional compliance, low volume                              |
| Regional Provisioned | `ProvisionedManaged`       | Single region    | Reserved PTU               | Region compliance + throughput                               |
| Developer            | `DeveloperTier`            | Any region       | Pay-per-token              | Fine-tuned model eval only; **24-hr lifetime, auto-deleted** |

**Decision flow**:

- Need data residency? → Data Zone or Standard (single region)
- Bursty traffic? → Standard/Global Standard (pay-per-token)
- Consistent high volume? → Provisioned (reserved PTU)
- Large batch, not time-sensitive? → Global Batch (50% savings)
- Just testing fine-tuned model? → Developer (no SLA, cheapest)

**Trap**: Provisioned types guarantee throughput + lower latency variance. Standard types are best-effort. Developer has NO SLA and auto-deletes after 24 hours.

### 3. Tracing and Feedback Collection

**Setup flow**:

1. Associate Azure Application Insights with your Foundry resource (Foundry portal → Tracing → Connect)
2. Install packages: `pip install azure-ai-projects azure-monitor-opentelemetry opentelemetry-instrumentation-openai-v2`
3. Optional: set `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true` to capture full prompts/responses
4. In code:
   ```python
   from azure.monitor.opentelemetry import configure_azure_monitor
   from opentelemetry.instrumentation.openai_v2 import OpenAIInstrumentor
   configure_azure_monitor(connection_string=conn_string)
   OpenAIInstrumentor().instrument()
   ```
5. Use `@tracer.start_as_current_span("method_name")` decorator for custom spans
6. View traces in Foundry portal → Tracing (shows trace ID, duration, status, operations)

**Feedback loops**: Collect user feedback (thumbs up/down, ratings) and correlate with trace IDs to identify which prompts/responses perform well. Feed this back into prompt refinement or fine-tuning datasets.

**Trap**: You need the **Log Analytics Reader** role on the Application Insights resource to view traces. Contributor role on Foundry resource to connect App Insights.

### 4. Fine-Tuning a Generative Model

**When to fine-tune** (vs prompt engineering):

- Prompt engineering insufficient for quality
- Need to train on more examples than fit in context window
- Want shorter prompts (token savings, lower latency)
- Need consistent style/format the model can't achieve with instructions alone

**Data format**: JSONL with chat completion format. UTF-8 with BOM. Max 512 MB per file. Min 10 examples, recommend 50+ well-crafted examples.

**Customization methods**:
| Method | Description | Models |
|--------|-------------|--------|
| **SFT** (Supervised Fine-Tuning) | Labeled input/output pairs | All supported models |
| **DPO** (Direct Preference Optimization) | Aligns with human-preferred responses | gpt-4o, gpt-4.1, gpt-4.1-mini, gpt-4.1-nano |
| **RFT** (Reinforcement Fine-Tuning) | Reward signals from model graders | o4-mini, gpt-5 (preview) |

**Hyperparameters**: `batch_size`, `learning_rate_multiplier` (0.02–0.2 range), `n_epochs`

**Training tiers**: Standard (data stays in region), Global (cheaper, data may move), Developer (cheapest, may be preempted, no SLA)

**Trap**: Inactive fine-tuned deployments auto-deleted after 15 continuous days of no API calls. The model itself is NOT deleted — only the deployment. You can redeploy.

**Trap**: System message used in production MUST match the system message used during training. Different system messages = degraded performance.

**Trap**: Use `"weight": 0` on assistant messages you don't want to train on (in multi-turn conversations).

### 5. Prompt Engineering Techniques

| Technique         | Description                        | When to Use                       |
| ----------------- | ---------------------------------- | --------------------------------- |
| Zero-shot         | No examples, just instructions     | Simple tasks, powerful models     |
| Few-shot          | Include example input/output pairs | Classification, formatting, style |
| Chain-of-thought  | "Take a step-by-step approach"     | Complex reasoning, math, logic    |
| Grounding context | Provide source material in prompt  | Factual Q&A, reduce hallucination |
| System message    | Role + boundaries + output format  | All chat scenarios                |
| Cue/prime         | Start the answer for the model     | Control output format             |

**Best practices**:

- Put instructions BEFORE content (start with clear instructions)
- Repeat key instructions at end (recency bias)
- Use separators (`---`, XML tags) for clear syntax
- Break complex tasks into steps
- Give the model an "out" ("say 'not found' if answer isn't present")

**Trap**: Chain-of-thought prompting is NOT for reasoning models (o-series, gpt-5). For those, use the reasoning summary parameter instead.

### 6. Container Deployment for On-Premises/Edge

**Key pattern**: Azure AI Services containers run locally but STILL require an Azure billing endpoint.

```bash
docker run --rm -it -p 5000:5000 --memory 10g --cpus 2 \
  mcr.microsoft.com/azure-cognitive-services/textanalytics/sentiment \
  Eula=accept Billing={ENDPOINT_URI} ApiKey={API_KEY}
```

- `http://localhost:5000/status` → validates API key against Azure
- `http://localhost:5000/swagger` → endpoint documentation
- Container logging requires `-v /host/logs:/output` volume mount — without it, no logs persist

**Custom Vision compact domains**: To export a model for mobile (iOS/Android), you MUST use a compact domain (e.g., General (compact), Retail (compact)). Non-compact domains cannot be exported.

- Change domain → Retrain → Export (or Publish)
- For iOS: General (compact) domain recommended

**Trap**: Without `-v` volume mount for logs, the container logging provider will NOT write log data. The exam tests this with Yes/No questions.

**Trap**: Azure OpenAI is cloud-only — no container option. Other Cognitive Services (Speech, Language, Vision) do support containers.

### 7. Model Reflection

Model reflection = the model evaluates or critiques its own output before returning the final answer. Patterns include:

- **Self-check**: Generate answer → ask model to verify → refine if needed
- **Multi-step verification**: Break into sub-tasks, verify each step
- **Confidence scoring**: Model assigns confidence to its own response

Used in production to improve accuracy, reduce hallucinations, and catch errors before they reach the user. Often implemented as a second LLM call or within prompt flow.

### 8. Monitoring and Diagnostics

**Observability stack**: Evaluation + Monitoring + Tracing (all integrated in Foundry)

**Key monitoring metrics**:

- Token consumption (input/output)
- Latency (time-to-first-token, total duration)
- Error rates (4xx, 5xx, throttling)
- Quality scores (coherence, groundedness, relevance)
- Safety scores (hate, violence, protected materials)

**Post-production monitoring includes**:

- Continuous evaluation of production traffic at sampled rate
- Scheduled red teaming for safety/security vulnerabilities
- Azure Monitor alerts when quality thresholds are breached

**Data privacy**: `loggingOptOut` query parameter controls whether input data is persisted after analysis. Set `loggingOptOut=true` to prevent data retention. **Trap**: `loggingOptOut=true` means data is NOT kept — the naming is counterintuitive.

---

## Comparisons

### Prompt Engineering vs Fine-Tuning

| Aspect           | Prompt Engineering             | Fine-Tuning                       |
| ---------------- | ------------------------------ | --------------------------------- |
| Cost             | Low (no training)              | High (training compute + hosting) |
| Speed to deploy  | Immediate                      | Hours to days                     |
| Data needed      | 0–few examples                 | 50–thousands of examples          |
| Best for         | Quick iteration, general tasks | Domain-specific behavior, style   |
| Token efficiency | Lower (long prompts)           | Higher (shorter prompts)          |
| Model updates    | Survives model upgrades        | Must retrain on new base model    |

### Standard vs Provisioned Deployment

| Aspect     | Standard                  | Provisioned             |
| ---------- | ------------------------- | ----------------------- |
| Billing    | Pay-per-token             | Reserved PTU            |
| Latency    | Variable                  | Consistent, lower       |
| Throughput | Best-effort               | Guaranteed              |
| SLA        | Standard SLA              | Enhanced SLA            |
| Best for   | Bursty, low-medium volume | Predictable high volume |

---

## Common Traps & Misconceptions

1. **Temperature range**: 0–2, not 0–1. The exam may show options like "set temperature to 1.5" as valid.
2. **Temperature vs top_p**: Never set both. Alter one, leave the other at default.
3. **Fine-tuned model system message**: Must match training. If you change it, expect degraded output.
4. **15-day inactive deployment deletion**: Applies to fine-tuned model deployments. Model weights are preserved; only the deployment is removed.
5. **Developer deployment**: 24-hour lifetime, auto-deleted, no SLA. Only for fine-tune evaluation.
6. **Container billing**: On-premises containers STILL need `Billing` and `ApiKey` parameters pointing to Azure.
7. **Container logging**: No `-v` volume mount = no log output. The exam tests this in hotspot questions.
8. **Compact domains for mobile**: Must change to compact domain THEN retrain THEN export. Order matters.
9. **loggingOptOut**: `true` = data NOT persisted (counterintuitive naming).
10. **Chain-of-thought**: Not for reasoning models (o-series). Use reasoning summary parameter instead.

---

## Quick Reference Card

| Concept                 | Key Fact                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------- |
| Temperature             | 0–2; lower = deterministic, higher = creative                                      |
| top_p                   | 0–1; nucleus sampling; don't combine with temperature                              |
| Fine-tune min data      | 10 examples (recommend 50+)                                                        |
| Fine-tune data format   | JSONL, UTF-8 with BOM, ≤512 MB                                                     |
| Fine-tune methods       | SFT, DPO, RFT                                                                      |
| Tracing packages        | `azure-monitor-opentelemetry` + `opentelemetry-instrumentation-openai-v2`          |
| Capture content env var | `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true`                          |
| Container endpoints     | `:5000/status` (validate key), `:5000/swagger` (docs)                              |
| Batch discount          | 50% off, 24-hr target turnaround                                                   |
| PTU                     | Provisioned Throughput Unit — reserved capacity                                    |
| Data Zone               | US or EU only — no per-region granularity                                          |
| loggingOptOut=true      | Input data NOT stored after analysis                                               |
| Compact domain          | Required for ONNX/CoreML/TensorFlow export to mobile                               |
| Smart Labeler           | Can't suggest tags for NEW/untrained tag categories                                |
| Face liveness           | Call detect repeatedly, check HeadPose changes                                     |
| TranslationRecognizer   | Use `AddTargetLanguage()` for target langs, `SpeechRecognitionLanguage` for source |
| Translator REST headers | Ocp-Apim-Subscription-Key + Ocp-Apim-Subscription-Region + Content-Type            |

---

## Hands-On Lab: Define Production Telemetry KPI List

Define a KPI dashboard for a production generative AI application. For each KPI, specify the metric, measurement method, threshold, and alert action.

| KPI               | Metric                      | Source              | Threshold       | Alert Action             |
| ----------------- | --------------------------- | ------------------- | --------------- | ------------------------ |
| Latency P95       | Time-to-first-token (ms)    | App Insights traces | > 3000ms        | Page on-call             |
| Error Rate        | HTTP 5xx / total requests   | App Insights        | > 2% over 5 min | Slack alert              |
| Token Cost        | Total tokens/hr             | Azure Monitor       | > budget cap    | Auto-scale or throttle   |
| Groundedness      | Groundedness score          | Foundry evaluator   | < 3.0/5.0       | Flag for review          |
| Safety Violations | Content filter triggers/day | Content Safety logs | > 10/day        | Investigate prompts      |
| Throughput        | Requests/minute             | Azure Monitor       | > 80% of quota  | Scale or upgrade tier    |
| User Satisfaction | Thumbs-up ratio             | Custom feedback API | < 70% positive  | Prompt refinement sprint |

**Exercise**: Adapt this table for YOUR specific use case. Consider: What's acceptable latency for your scenario? What safety metrics matter most? What's your token budget?

---

## Related Questions in questions.json

| ID                   | One-line Summary                                                                      |
| -------------------- | ------------------------------------------------------------------------------------- |
| DRvM1txk3iBQ5X7Lit7f | Container deployment for on-premises OCR (answer: host in container)                  |
| InafH60aKv8ilod7fM8e | Video Indexer widget URL configuration (people, keywords; true, en-US)                |
| OKxtdhztVhLf8ifCYbEW | Custom Vision project config: Classification → Multiclass → General (compact for iOS) |
| YTfOQmLl8kzvTJd4dxOh | Face API liveness detection via repeated HeadPose checks                              |
| lbvU8kjpmEBbth3PjpoY | Computer Vision smart cropping API URL (generateThumbnail endpoint)                   |
| pWW3izxoiIZyGvxma83Q | Custom Vision mobile: change domain to compact → retrain → export                     |
| uTtfqlE1Tfe8q3sNxyQO | OCR async pattern: loop + delay + check status (answers: B, D)                        |
| 0M8IwPG4SyDF0AKpNc9G | Smart Labeler can't suggest for NEW/untrained species (answer: No)                    |
| 7Hye3xeqMSLD2OHttyOr | loggingOptOut parameter prevents data persistence (answer: D)                         |
| AagodIBFPznYqH3RCQGv | SSML effect attribute optimizes voice output for devices (answer: B)                  |
| D55Rs3hlVca41j8BmjuH | Speech translation: {fr, de, es} targets + TranslationRecognizer                      |
| FNqXvBTpApS1GE0FHvY7 | Translator REST headers: subscription key + region + content-type (answer: D)         |

Quiz command:

```powershell
python quiz_runner.py questions.json --day-lock 9 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [Deployment types for Foundry Models](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types)
- [Trace AI applications using OpenAI SDK](https://learn.microsoft.com/en-us/azure/foundry-classic/how-to/develop/trace-application)
- [Customize a model with fine-tuning](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/fine-tuning)
- [Prompt engineering techniques](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering)
- [System message design](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/advanced-prompt-engineering)
- [Observability in generative AI](https://learn.microsoft.com/en-us/azure/foundry/concepts/observability)

---

## Notes (your own words — fill this in after studying)

_(Space for your notes after reading through the material)_
