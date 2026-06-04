# Day 30: Full Review 1 — Domains 1, 2 & 5 Rapid Review

**Date**: 2026-06-04
**Domains**: D1 (Plan & Manage, 20-25%), D2 (Generative AI, 15-20%), D5 (NLP, 15-20%)
**Combined weight**: ~50-60% of exam
**Estimated study time**: 0.5 hrs (rapid review — you've studied all of this before)

---

## TL;DR (60-second skim)

- **D1 lifecycle**: Select → Deploy → Secure/Monitor → Responsible AI. Every exam Q maps to one phase.
- **Container deploy always needs 3 params**: `Eula=accept`, `Billing={endpoint}`, `ApiKey={key}` — containers phone home for billing.
- **`az cognitiveservices account show`** (not `list`) to inspect a specific created resource. `list` returns ALL resources.
- **Responsible AI = FRIPT**: Fairness, Reliability & Safety, Inclusiveness, Privacy & Security, Transparency. "Equitable results" = Fairness + Inclusiveness (exactly 2).
- **Fine-tuning ≠ new knowledge** — that's RAG. Fine-tuning = behavior/style/format. Decision ladder: Prompt eng → RAG → Fine-tune → DPO → RFT.
- **TranslationRecognizer** for speech translation (not SpeechRecognizer). Target languages EXCLUDE source language.
- **Knowledge store**: Object projections = JSON in tables. File projections = binary images in blob. Empty `files: []` = images NOT projected.
- **Bot debugging order**: Code/build first, THEN tooling (Emulator). Never open Emulator before bot is running.

---

## Domain 1: Plan & Manage an Azure AI Solution (20-25%)

### Service Selection Decision Tree

```
Need to analyze TEXT?
├── Sentiment/opinion → Text Analytics (Sentiment Analysis)
├── Named entities (people, places, orgs) → Text Analytics (NER / Entity Recognition)
├── Key phrases → Text Analytics (Key Phrase Extraction)
├── PII detection/redaction → Text Analytics (PII)
├── Language detection → Text Analytics (Language Detection)
├── Entity linking (Wikipedia URLs) → Text Analytics (Entity Linking)
└── Translation → Translator service

Need to analyze IMAGES?
├── General captions/tags/objects → Computer Vision (Image Analysis 4.0)
├── OCR / handwritten text → Vision Read API (prebuilt-read)
├── Face detection + attributes → Face API — Detect
├── Face identification (match to person) → Face API — Identify (requires Detect first)
├── Custom classification → Custom Vision (classification project)
├── Custom object detection → Custom Vision (detection project)
└── Smart cropping → Computer Vision (smart crop feature)

Need to analyze SPEECH?
├── Speech → Text → SpeechRecognizer (Speech-to-Text)
├── Text → Speech → SpeechSynthesizer (Text-to-Speech)
├── Speech → Translated text → TranslationRecognizer
├── Intent from speech → IntentRecognizer (+ CLU/LUIS model)
├── Keyword activation → KeywordRecognizer
└── Custom voice → Custom Neural Voice (consent .wav required first)

Need to analyze DOCUMENTS?
├── Invoices/receipts/ID docs → Doc Intelligence prebuilt models
├── Handwriting detection → prebuilt-read (ONLY model with handwriting style)
├── QR/barcode extraction → prebuilt-read (ONLY model with barcode support)
├── Consistent structured forms → Custom Template model
├── Inconsistent/complex layouts → Custom Neural model
└── Mixed model types → Composed model

Need GENERATIVE AI?
├── Chat/completion/code → Azure OpenAI (GPT-4o/4.1)
├── Image generation → Azure OpenAI (DALL-E)
├── Grounding in your data → RAG pattern (Azure AI Search + OpenAI)
├── Consistent style/format → Fine-tuning (SFT)
├── Knowledge mining → Azure AI Search (index + skillset + indexer)
└── Multi-model orchestration → Semantic Kernel / Prompt Flow
```

### Key CLI Commands (YOUR WEAK AREA)

| Command                                                        | What It Does                          | Trap                                                                   |
| -------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `az cognitiveservices account show -n <name> -g <rg>`          | Show details of ONE specific resource | Use `show` not `list` for a specific resource                          |
| `az cognitiveservices account list`                            | List ALL AI resources in subscription | Returns array, not single resource                                     |
| `az cognitiveservices account list -g <rg>`                    | List resources in a resource group    | Filters by RG                                                          |
| `az cognitiveservices account keys list`                       | Get keys for a resource               | `keys list` not `keys show`                                            |
| `az cognitiveservices account keys regenerate --key-name key1` | Rotate a specific key                 | Always rotate key1 first, switch apps, then key2                       |
| `az cognitiveservices account create --kind CognitiveServices` | Create multi-service resource         | `CognitiveServices` = multi-service; `ComputerVision` = single-service |
| `az cognitiveservices account create --kind OpenAI`            | Create Azure OpenAI resource          | `OpenAI` kind, not `AzureOpenAI`                                       |

### Container Deployment Checklist

**Always required (3 mandatory params):**

```bash
docker run --rm -it -p 5000:5000 \
  mcr.microsoft.com/azure-cognitive-services/<service> \
  Eula=accept \
  Billing=https://<resource>.cognitiveservices.azure.com/ \
  ApiKey=<key>
```

**LUIS container specific sequence:**

1. Export LUIS app for containers (select app version → Export for containers)
2. Move exported package to input mount directory on host
3. Run container with `--mount` pointing to the package directory

**Trap**: You CANNOT run the LUIS container before the package is in the input directory. Export → Move → Run. Always.

**Azure OpenAI**: Cloud-only. NO container option. If exam asks about "deploying OpenAI to edge/container," it's a distractor.

### Security & Monitoring Quick Reference

| Concept          | Key Fact                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Key rotation     | Add new key → Switch apps → Delete old key. For query keys (AI Search): add → switch → delete                                                      |
| Managed Identity | Always prefer over keys. System-assigned = tied to resource lifecycle                                                                              |
| VNet restriction | Configure on the resource itself (Networking blade), NOT via NSG or Azure Firewall                                                                 |
| Private Endpoint | For private connectivity to AI Search or AI Services from VNet                                                                                     |
| RBAC roles       | `Cognitive Services User` = call APIs. `Cognitive Services Contributor` = manage but not call. `OpenAI User` = least privilege for view + generate |
| Diagnostic logs  | Azure Monitor → Diagnostic settings → Send to Log Analytics / Storage / Event Hub                                                                  |
| Cost management  | Set budget alerts. Use Azure Advisor for recommendations. TPM = tokens per minute (throttling metric)                                              |

### Responsible AI — FRIPT Framework (YOUR WEAK AREA)

| Principle                | Means                                              | Exam Signal Words                                    |
| ------------------------ | -------------------------------------------------- | ---------------------------------------------------- |
| **Fairness**             | Equal treatment, no bias, equitable outcomes       | "bias," "equitable results," "discrimination"        |
| **Reliability & Safety** | Works correctly, handles errors, safe under stress | "reliable," "safe," "expected conditions"            |
| **Inclusiveness**        | Accessible to all, diverse perspectives            | "accessible," "diverse," "all users"                 |
| **Privacy & Security**   | Data protection, consent, secure processing        | "data protection," "consent," "GDPR"                 |
| **Transparency**         | Understandable, explainable, disclosures           | "explain," "understand," "disclose," "interpretable" |

**Trap**: "Equitable results" = **Fairness + Inclusiveness** (exactly 2 principles, not 3). The exam gives you 3+ options; pick only these two.

**Content Safety stack:**

| Layer            | Tool                                             | Purpose                                                  |
| ---------------- | ------------------------------------------------ | -------------------------------------------------------- |
| Input filtering  | Content filters (hate/sexual/violence/self-harm) | Block harmful prompts (severity levels: low/medium/high) |
| Input filtering  | Prompt shields                                   | Detect jailbreak / indirect injection attempts           |
| Input filtering  | Blocklists                                       | Custom term lists (exact match / regex)                  |
| Output filtering | Content filters                                  | Block harmful generated content                          |
| Output filtering | Groundedness detection                           | Flag ungrounded (hallucinated) responses                 |
| Governance       | Azure AI Content Safety Studio                   | Dashboard for policy creation & testing                  |

---

## Domain 2: Implement Generative AI Solutions (15-20%)

### Decision Framework: Prompt Eng → RAG → Fine-tune

| Approach               | Use When                                                            | NOT For                                        |
| ---------------------- | ------------------------------------------------------------------- | ---------------------------------------------- |
| **Prompt engineering** | Quick iteration, few-shot examples fit in context, no training data | Long prompts eating tokens; inconsistent style |
| **RAG**                | Model needs current/proprietary knowledge; grounding in docs        | Changing model behavior/tone/format            |
| **Fine-tuning (SFT)**  | Consistent style/format, reduce prompt length, model distillation   | Teaching new knowledge (use RAG)               |
| **DPO**                | Align with human preferences (preferred vs non-preferred pairs)     | Task specialization                            |
| **RFT**                | Complex reasoning, many valid solution paths                        | Only o4-mini; needs grader model               |

**Fine-tuning data requirements:**

- Format: JSONL chat format, UTF-8 with BOM
- Size: < 512 MB per file
- Minimum: 10 examples (recommend 50+)
- Quality > quantity

**Fine-tuned deployment auto-delete**: 15 days of no API calls → deployment deleted. Model itself preserved.

### Azure OpenAI "On Your Data" (YOUR REPEAT MISS)

When using Azure OpenAI with your own data (RAG via AI Search), the SDK requires:

```python
# CORRECT — use the SPECIFIC Search extension class
from openai.types.chat import AzureCognitiveSearchChatExtensionConfiguration

extension_config = AzureCognitiveSearchChatExtensionConfiguration(
    search_endpoint="https://<search>.search.windows.net",
    search_key="<key>",
    index_name="<index>"
)
```

**Trap**: Do NOT pick `AzureChatExtensionConfiguration` (generic base class). The correct answer is always `AzureCognitiveSearchChatExtensionConfiguration` (specific Search class). You missed this on Day 24 AND Day 25.

**Data source type**: When configuring "on your data" grounding, the data source type is `AzureCognitiveSearch` — NOT `AzureDocumentIntelligence` or `AzureBlobStorage`.

### Model Parameters

| Parameter           | Effect                                         | Exam Tip                                   |
| ------------------- | ---------------------------------------------- | ------------------------------------------ |
| `temperature`       | Randomness (0 = deterministic, 2 = creative)   | **temperature=0** for accuracy/consistency |
| `top_p`             | Nucleus sampling (lower = fewer token choices) | Don't set both temperature AND top_p       |
| `max_tokens`        | Max output length                              | Does NOT affect input processing           |
| `frequency_penalty` | Reduce repetition of frequent tokens           | 0–2 range                                  |
| `presence_penalty`  | Encourage topic diversity                      | 0–2 range                                  |
| `stop`              | Stop sequences to end generation               | Up to 4 sequences                          |

### Deployment Types

| Type                  | Use Case                               | Key Fact                       |
| --------------------- | -------------------------------------- | ------------------------------ |
| **Standard**          | Regional, pay-per-token                | Most common deployment         |
| **Global Standard**   | Cross-region, cost savings             | Data may leave region          |
| **Provisioned (PTU)** | Predictable latency, reserved capacity | Pre-purchased throughput units |
| **Developer**         | Testing/eval only                      | No SLA, no hosting fee         |

### RBAC for Azure OpenAI (YOUR WEAK AREA)

| Role                                    | Can Do                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `Cognitive Services OpenAI User`        | View endpoints + View models + Generate content (LEAST PRIVILEGE for using) |
| `Cognitive Services OpenAI Contributor` | Above + create deployments + manage models                                  |
| `Cognitive Services Contributor`        | Full management but NOT call APIs (confusing name!)                         |

**Trap**: "Least privilege to generate completions" = `OpenAI User`, NOT `OpenAI Contributor`. You missed this on Day 25.

### Prompt Flow & Evaluation

- **Prompt Flow**: Visual DAG of LLM calls, tools, and Python nodes
- **Being retired April 2027** → Semantic Kernel is the recommended replacement
- **Evaluation metrics**: Groundedness, Relevance, Coherence, Fluency, Similarity (built-in)
- **Custom evaluators**: Write Python functions, return score dict

### Orchestration Patterns

| Pattern            | Description                                        | When                        |
| ------------------ | -------------------------------------------------- | --------------------------- |
| **Routing**        | Direct to correct model/tool based on intent       | Multiple specialized models |
| **Chaining**       | Sequential: output of model A → input of model B   | Multi-step reasoning        |
| **Fan-out/Fan-in** | Parallel: send to multiple models, combine results | Speed + diversity           |
| **Fallback**       | Try model A → if fail → try model B                | Resilience                  |
| **Ensemble**       | Multiple models vote, take majority                | High-stakes decisions       |

---

## Domain 5: Implement NLP Solutions (15-20%)

### Text Analytics API Methods

| Method                    | Returns                                                | Use When                                           |
| ------------------------- | ------------------------------------------------------ | -------------------------------------------------- |
| `RecognizeEntities`       | Named entities (person, location, org, date, quantity) | Extract structured entities from unstructured text |
| `RecognizePiiEntities`    | PII entities (SSN, credit card, email, phone)          | Compliance / redaction                             |
| `RecognizeLinkedEntities` | Entities + Wikipedia URLs                              | Need disambiguation / external knowledge links     |
| `ExtractKeyPhrases`       | Important phrases (not entities)                       | Summarize topics, tag content                      |
| `AnalyzeSentiment`        | Positive/negative/neutral + confidence scores          | Customer feedback, reviews                         |
| `DetectLanguage`          | ISO 639-1 language code + confidence                   | Route to correct language model                    |

**Trap**: `RecognizeEntities` returns entities (structured data). `ExtractKeyPhrases` returns phrases (topics). They are NOT interchangeable. The method name in code may differ from the conceptual description.

**Entity Linking**: Returns Wikipedia URLs. Does NOT return custom entity categories. If asked "does entity linking provide URLs?" → Yes. "Does it return custom categories?" → No.

### Speech SDK Classes (YOUR WEAK AREA)

| Class                   | Purpose                                       | Key Config                                                            |
| ----------------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| `SpeechRecognizer`      | Speech → Text (single language)               | `SpeechRecognitionLanguage` = source language                         |
| `TranslationRecognizer` | Speech → Translated text (multiple languages) | `SpeechRecognitionLanguage` = source; `AddTargetLanguage()` = outputs |
| `SpeechSynthesizer`     | Text → Speech                                 | `SpeechSynthesisLanguage` / `SpeechSynthesisVoiceName`                |
| `IntentRecognizer`      | Speech → Intent (uses CLU/LUIS model)         | Requires language model ID                                            |
| `KeywordRecognizer`     | Detect wake word/keyword                      | Requires keyword model (.table file)                                  |

**Critical traps:**

- **TranslationRecognizer** for speech translation, NOT SpeechRecognizer. You missed this on Day 7.
- `SpeechRecognitionLanguage` sets the SOURCE language (e.g., `fr-FR`), NOT the output
- `AddTargetLanguage()` adds OUTPUT languages. Target languages EXCLUDE source language (if source = en-GB, don't add en-GB as target)
- `SpeechSynthesisLanguage` is for TTS, NOT for setting recognition source. Exam swaps these.

### SSML Key Tags

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="en-US-JennyNeural">
    <prosody rate="slow" pitch="+10%">Slower and higher.</prosody>
    <break time="500ms"/>
    <emphasis level="strong">Important!</emphasis>
    <say-as interpret-as="date" format="mdy">3/5/2026</say-as>
    <phoneme alphabet="ipa" ph="təˈmeɪtoʊ">tomato</phoneme>
  </voice>
</speak>
```

### Custom Speech & Custom Neural Voice

| Feature       | Custom Speech (STT)                                    | Custom Neural Voice (TTS)                                              |
| ------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| Purpose       | Improve recognition accuracy for domain-specific terms | Create unique branded voice                                            |
| Training data | Audio + transcripts (.wav + .txt)                      | Audio recordings of voice talent                                       |
| Consent       | Not required                                           | **Required**: Upload .wav/.mp3 of talent consenting (verbal statement) |
| Deployment    | Custom endpoint                                        | Custom voice model                                                     |

**Trap**: Voice talent consent = upload a recording (.wav/.mp3) of the talent CONSENTING, NOT training data (.zip of samples). You missed this on Day 11.

### Translation Services

| Service                  | Input → Output                  | Key Facts                                                          |
| ------------------------ | ------------------------------- | ------------------------------------------------------------------ |
| **Translator (Text)**    | Text → Translated text          | 100+ languages, dictionary lookup, transliteration                 |
| **Document Translation** | Docs → Translated docs (batch)  | Source container + target container + glossary in TARGET container |
| **Speech Translation**   | Speech → Translated text/speech | Uses TranslationRecognizer SDK class                               |

**Trap**: Document Translation glossary goes in the TARGET language container, NOT the source. You missed this on Day 12.

### Custom Language Understanding (CLU) / LUIS Migration

| Concept                  | Key Fact                                                                  |
| ------------------------ | ------------------------------------------------------------------------- |
| **Intents**              | User's goal (BookFlight, GetWeather). Minimum 1 + None                    |
| **Entities**             | Data to extract (city, date). Types: learned, list, prebuilt, regex       |
| **Utterances**           | Example phrases for each intent. Quality > quantity                       |
| **None intent**          | Required, non-deletable. Add false-positive examples. Set score threshold |
| **Active learning**      | Enable logs → Review utterances → Retrain & republish                     |
| **LUIS → CLU migration** | LUIS retired March 2026. CLU replaces it. Same concepts, different portal |

### Question Answering & Knowledge Base

| Feature                  | Details                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Sources**              | URLs, PDFs, .docx, .xlsx, editorial QnA pairs, chit-chat                                                      |
| **Multi-turn**           | Follow-up prompts create conversation tree. Define in KB editor                                               |
| **Alternative phrasing** | Add synonyms/rephrasings to improve matching. NOT chit-chat                                                   |
| **Chit-chat**            | Handles pleasantries (greetings, jokes). 5 personalities: Professional, Friendly, Witty, Caring, Enthusiastic |
| **Confidence threshold** | Set minimum confidence. Below threshold → default "no answer found"                                           |
| **Precise answering**    | Enable to return exact span, not full QnA passage                                                             |

**Trap**: "How much does X cost?" vs "What is the price of X?" → These are ALTERNATIVE PHRASINGS, not chit-chat. Chit-chat = "How are you?" / "Tell me a joke."

### Bot Framework Ordering (YOUR WEAK AREA)

**Bot Emulator local testing order:**

1. **Build & Run** the bot on localhost
2. **Open** Bot Framework Emulator
3. **Connect** to `http://localhost:<port>/api/messages`

**Trace debugging order:**

1. **Create** a trace activity (in code)
2. **Send** the trace activity
3. **Run** bot on localhost → Emulator shows trace

**Pattern**: Always **code/build first, then tooling**. Never open Emulator before the bot is running. You missed both on Day 22.

### Knowledge Store Projections (YOUR WEAK AREA)

| Projection Type | Storage             | Content                                                 |
| --------------- | ------------------- | ------------------------------------------------------- |
| **Table**       | Azure Table Storage | Structured data as rows/columns (entities, key phrases) |
| **Object**      | Azure Blob Storage  | Full enriched JSON documents                            |
| **File**        | Azure Blob Storage  | Binary images extracted during enrichment               |

**Trap**: Object projections store JSON (not images). File projections store binary images. If `files: []` is empty, images are NOT projected — even if the pipeline extracts them. You missed this on Day 18.

**Knowledge store definition requires**: `storageConnectionString` + `projections` array.

### Doc Intelligence Limits (YOUR WEAK AREA)

| Constraint          | S0 Tier                   | Free Tier  |
| ------------------- | ------------------------- | ---------- |
| Min pixel dimension | **50 × 50 px**            | 50 × 50 px |
| Max file size       | 500 MB                    | 4 MB       |
| Max pages           | 2000                      | 2          |
| Image formats       | JPEG, PNG, BMP, TIFF, PDF | Same       |

**Trap**: A 25×25 px image is REJECTED (below 50×50 minimum). You missed this on Day 18 — File2.jpg (25×25) was rejected, only File3.tiff was valid.

---

## Cross-Domain Integration Patterns (D1 + D2 + D5)

### Pattern 1: RAG-Powered Multilingual Chatbot

```
User speech (any language)
  → TranslationRecognizer (D5: Speech Translation)
  → Translated text query
  → Azure AI Search retrieval (D1: Knowledge Mining selection)
  → Azure OpenAI GPT-4o completion (D2: GenAI)
  → SpeechSynthesizer (D5: TTS) → spoken response
Security: Managed Identity (D1), Content Filters (D1/D2)
```

### Pattern 2: Document Processing Pipeline

```
Incoming documents
  → Doc Intelligence prebuilt-read (D1: Service Selection)
  → Extracted text → Text Analytics PII detection (D5: NLP)
  → Redacted text → Translator (D5: Translation)
  → Translated text → Azure OpenAI summarization (D2: GenAI)
  → Knowledge store (Object projections = JSON, File projections = images)
Governance: Responsible AI review (D1), Content Safety (D1)
```

### Pattern 3: Content Moderation + Generation

```
User prompt
  → Prompt Shield (D1: jailbreak detection)
  → Content filter (D1: hate/sexual/violence/self-harm)
  → Blocklist check (D1: custom terms)
  → Azure OpenAI generation (D2)
  → Output content filter (D1)
  → Groundedness check (D1/D2)
  → Response to user
```

---

## Scenario Drill (5 Architecture Scenarios)

### Scenario 1: Global Customer Support Bot

> A retail company wants a chatbot that takes customer voice input in 10 languages, searches an internal product FAQ, and responds in the customer's language via speech.

**Walk-through**: TranslationRecognizer (speech → English text) → Azure AI Search (FAQ index) → Azure OpenAI (generate answer with RAG) → Translator (text → target language) → SpeechSynthesizer (TTS in target language). Deploy with Managed Identity. Content filters on both input and output.

### Scenario 2: Compliance Document Scanner

> A bank needs to scan uploaded PDF contracts for PII, redact sensitive data, extract key entities, and store enriched results for auditing.

**Walk-through**: Doc Intelligence prebuilt-read (OCR) → minimum 50×50 px check → Text Analytics PII (detect + redact) → NER (extract entities) → AI Search skillset with knowledge store (table projections for entities, object projections for full JSON). S0 tier for 500 MB / 2000 pages.

### Scenario 3: Fine-tuning vs RAG Decision

> A legal firm wants their AI to generate contracts in a specific legal writing style, using clauses from their clause library.

**Walk-through**: This needs BOTH. Fine-tune (SFT) a model on examples of their legal writing style (behavior change). THEN use RAG to ground in their clause library (knowledge). Fine-tuning alone won't give access to specific clauses. RAG alone won't enforce consistent legal style.

### Scenario 4: Responsible AI Incident Response

> A healthcare chatbot generated harmful medical advice. The team needs to prevent recurrence.

**Walk-through**: Add blocklist for dangerous medical terms → Increase content filter severity for self-harm category → Enable prompt shields for injection attempts → Add groundedness detection to flag ungrounded medical claims → Review with Azure AI Content Safety Studio → Update governance framework (FRIPT: Reliability & Safety + Transparency principles apply).

### Scenario 5: Speech-Enabled Kiosk with Intent Recognition

> An airport deploys kiosks where travelers speak requests ("Where is Gate B12?", "Book a taxi") and the system routes to the correct service.

**Walk-through**: KeywordRecognizer (wake word) → IntentRecognizer with CLU model (classify intent: directions vs booking vs info) → Route: directions → static lookup, booking → Azure OpenAI agent, info → QnA knowledge base. Custom Speech model trained on airport-specific terms (gate numbers, airline names). SpeechSynthesizer for responses.

---

## Final Exam Traps Checklist (from YOUR history)

| #   | Trap                                             | Correct Answer                                                | Day Missed |
| --- | ------------------------------------------------ | ------------------------------------------------------------- | ---------- |
| 1   | `az cognitiveservices account show` vs `list`    | `show` for one resource, `list` for all                       | Day 5      |
| 2   | Equitable results = which 2 principles?          | Fairness + Inclusiveness (not 3)                              | Day 5      |
| 3   | Read API vs Image Analysis 4.0 for bulk OCR      | Read API for production OCR                                   | Day 6      |
| 4   | Face API `largeFaceListId` vs `faceListId`       | `largeFaceListId` for >1K faces (up to 1M)                    | Day 6      |
| 5   | TranslationRecognizer vs SpeechRecognizer        | TranslationRecognizer for speech translation                  | Day 7      |
| 6   | Target languages exclude source language         | Don't add en-GB if source is en-GB                            | Day 7      |
| 7   | `AzureCognitiveSearchChatExtensionConfiguration` | Specific class, NOT generic `AzureChatExtensionConfiguration` | Day 24, 25 |
| 8   | OpenAI User vs Contributor role                  | User = least privilege to generate                            | Day 25     |
| 9   | Knowledge store: object vs file projections      | Object = JSON, File = binary images                           | Day 18     |
| 10  | Doc Intelligence S0 min pixels                   | 50×50 px minimum — 25×25 rejected                             | Day 18     |
| 11  | Bot debug order                                  | Code first → then Emulator tooling                            | Day 22     |
| 12  | Voice talent consent recording                   | Upload .wav/.mp3 of talent CONSENTING, not training data      | Day 11     |
| 13  | Document Translation glossary placement          | Glossary in TARGET container, not source                      | Day 12     |
| 14  | LUIS container deploy                            | Export → Move package → Run container                         | Day 11     |

---

## Quick Reference Card

### D1 Mnemonics

- **FRIPT** = Fairness, Reliability & Safety, Inclusiveness, Privacy & Security, Transparency
- **Container 3**: Eula, Billing, ApiKey (always required)
- **Key rotation**: Add → Switch → Delete
- **Security preference**: Managed Identity > Keys

### D2 Mnemonics

- **Decision ladder**: Prompt → RAG → Fine-tune → DPO → RFT
- **Fine-tune data**: JSONL, UTF-8 BOM, <512 MB, ≥10 examples
- **15-day rule**: No calls for 15 days → deployment auto-deleted (model preserved)
- **temp=0**: For accuracy. Don't set both temp AND top_p.

### D5 Mnemonics

- **Speech classes**: Recognizer = STT, Synthesizer = TTS, Translation = TranslationRecognizer, Intent = IntentRecognizer
- **Active learning**: Log → Review → Retrain
- **Bot order**: Build → Open → Connect (code before tools)
- **Chit-chat ≠ synonyms**: Chit-chat = pleasantries, alternative phrasing = synonyms

---

## Sources (verified during this session)

- [AI-102 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-engineer/study-guide)
- [Azure AI Services containers](https://learn.microsoft.com/en-us/azure/ai-services/cognitive-services-container-support)
- [Azure OpenAI on your data](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/use-your-data)
- [Content Safety overview](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview)
- [Text Analytics NER](https://learn.microsoft.com/en-us/azure/ai-services/language-service/named-entity-recognition/overview)
- [Speech SDK classes](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-translation)
- [CLU overview](https://learn.microsoft.com/en-us/azure/ai-services/language-service/conversational-language-understanding/overview)
- [Fine-tuning Azure OpenAI models](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/fine-tuning-considerations)

---

## Notes (your own words — fill this in after studying)

_(Spend 5 minutes after reading to jot down anything that surprised you or that you want to drill one more time)_
