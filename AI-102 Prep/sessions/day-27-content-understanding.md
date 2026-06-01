# Day 27 — Domain 6: Content Understanding & Content Safety

**Date**: 2026-06-01
**Domain**: Domain 6 — Implement content understanding solutions (5–10%)
**Subtopics**: OCR pipelines, multimodal extraction, Azure AI Content Safety (text/image moderation, blocklists, jailbreak/prompt shields, SDK, REST API, Studio features)
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)

- **Azure Content Understanding** is a Foundry Tool for multimodal ingestion (docs, images, video, audio) into structured output via **Analyzers** that perform OCR, field extraction, classification, and segmentation
- **Azure AI Content Safety** detects harmful content across 4 categories: **Hate, Sexual, SelfHarm, Violence** with severity 0/2/4/6
- SDK key classes: `ContentSafetyClient` + `AnalyzeTextOptions` (Python: `azure.ai.contentsafety`)
- REST endpoint for text analysis: `POST <endpoint>/contentsafety/text:analyze`
- REST endpoint for prompt shields: `POST <endpoint>/contentsafety/text:shieldPrompt`
- **Blocklists** = custom term lists (max 10,000 terms, 128 chars per item); specify `blocklistNames` in analyze request
- **Prompt Shields** (formerly "Jailbreak risk detection") detect **User Prompt attacks** (jailbreak) AND **Document attacks** (indirect injection)
- Content Safety Studio: **"Moderate text content"** = test text moderation filters; **Safety metaprompt** = guides safe LLM responses, does NOT test filters

---

## 1. Azure Content Understanding in Foundry Tools

### 1.1 What It Is

A **GA service** (API `2025-11-01`) under the Microsoft Foundry Resource. It uses generative AI to process **documents, images, video, and audio** into user-defined structured output.

### 1.2 Key Components (Pipeline Flow)

| Stage                  | What It Does                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inputs**             | Documents, images, video, audio                                                                                                              |
| **Analyzer**           | Core config: content extraction settings, field schema, model deployments. Prebuilt or custom                                                |
| **Content Extraction** | OCR, selection marks, barcodes, formulas, layout (paragraphs, sections, tables). Audio/video: transcription                                  |
| **Segmentation**       | Splits content into logical sections (by doc type, video scenes). Enabled via `enableSegment`                                                |
| **Field Extraction**   | Three methods: **Extract** (verbatim from source, docs only), **Classify** (predefined categories), **Generate** (free-form, e.g. summarize) |
| **Confidence Scores**  | 0–1 reliability score per field. Enabled via `estimateFieldSourceAndConfidence`                                                              |
| **Grounding**          | Maps extracted values back to source regions for verification                                                                                |
| **Structured Output**  | Markdown (for RAG/search) or JSON (for automation)                                                                                           |

### 1.3 OCR Pipelines

- Content Understanding performs OCR as part of **Content Extraction**
- Extracts text, identifies selection marks, detects barcodes and formulas, recognizes layout elements
- For audio/video: transcribes speech and identifies key visual elements

### 1.4 Use Cases

- **IDP** (Intelligent Document Processing): invoices, contracts, claims
- **RAG ingestion**: figure descriptions, layout preservation, annotation detection
- **Agentic apps**: clean markdown for reasoning workflows
- **RPA**: structured data for automation
- **Classification routing**: classify document type → route to correct analyzer

---

## 2. Azure AI Content Safety

### 2.1 Resource & Architecture

- Create a **Content Safety resource** in Azure portal (F0 free tier or S0 paid)
- Endpoint + key for API calls; supports Managed Identity and Entra ID
- Package: `pip install azure-ai-contentsafety`

### 2.2 Text Moderation (SDK + REST)

**Python SDK pattern:**

```python
from azure.ai.contentsafety import ContentSafetyClient
from azure.ai.contentsafety.models import AnalyzeTextOptions

client = ContentSafetyClient(endpoint, AzureKeyCredential(key))
request = AnalyzeTextOptions(text="Text to analyze")
response = client.analyze_text(request)
# response.categories_analysis → Hate, Sexual, SelfHarm, Violence
```

**REST API:**

```
POST <endpoint>/contentsafety/text:analyze?api-version=2024-09-01
Header: Ocp-Apim-Subscription-Key: <key>
Body: { "text": "...", "categories": ["Hate","Sexual","SelfHarm","Violence"] }
```

- Severity levels: **0** (safe), **2** (low), **4** (medium), **6** (high)
- Text max length: **10,000 characters**

### 2.3 Image Moderation

- Same 4 categories, same severity scale
- Max file size: **4 MB**, dimensions **50×50 to 7200×7200**
- Formats: JPEG, PNG, GIF, BMP, TIFF, WEBP
- Both **Content Safety** and **Azure AI Vision** have built-in image moderation capabilities

### 2.4 Blocklists

- Custom term screening on top of AI classifiers
- **Max 10,000 terms** across all lists; max **100 items per request**; max **128 chars** per item
- CRUD operations: `PATCH .../text/blocklists/<name>`, `POST .../addOrUpdateBlocklistItems`
- Use in analysis: include `"blocklistNames": ["myList"]` in the analyze request body
- `"haltOnBlocklistHit": true/false` — stop analysis on match or continue with categories
- Response includes `blocklistsMatch` array with matched items
- Delay after add/edit: up to **5 minutes** before effective

### 2.5 Jailbreak Detection / Prompt Shields

- **Prompt Shields** (formerly "Jailbreak risk detection") — unified API for detecting adversarial inputs
- Two types:
  - **User Prompt attacks**: user deliberately tries to bypass LLM safety (role-play, encoding, conversation mockup)
  - **Document attacks**: hidden instructions in third-party documents (indirect injection)
- REST: `POST <endpoint>/contentsafety/text:shieldPrompt?api-version=2024-09-01`
- Body: `{ "userPrompt": "...", "documents": ["..."] }`
- Response: `{ "userPromptAnalysis": { "attackDetected": true/false }, "documentsAnalysis": [...] }`
- **When user tries to circumvent built-in safety** → Prompt Shields / Jailbreak risk detection is the answer

### 2.6 Content Safety Studio Features

| Feature                     | Purpose                                                                                      | Tests content filters?         |
| --------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------ |
| **Moderate Text Content**   | Run test text through moderation, adjust severity thresholds, manage blocklists, export code | **YES**                        |
| **Moderate Image Content**  | Same for images                                                                              | YES                            |
| **Monitor Online Activity** | Dashboard for API usage, category distribution, latency                                      | N/A                            |
| **Prompt Shields**          | Test prompt attack detection                                                                 | YES (for jailbreak)            |
| **Safety metaprompt**       | Guides LLM to produce safe responses; it's a system prompt template                          | **NO — does NOT test filters** |

---

## 3. Key API Reference

| Item                                                        | Value                                                     |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| Python package                                              | `azure-ai-contentsafety`                                  |
| Client class                                                | `ContentSafetyClient`                                     |
| Text analysis options                                       | `AnalyzeTextOptions`                                      |
| Categories enum                                             | `TextCategory.HATE`, `.SEXUAL`, `.SELF_HARM`, `.VIOLENCE` |
| Text analyze endpoint                                       | `POST /contentsafety/text:analyze`                        |
| Image analyze endpoint                                      | `POST /contentsafety/image:analyze`                       |
| Prompt shields endpoint                                     | `POST /contentsafety/text:shieldPrompt`                   |
| Blocklist CRUD                                              | `PATCH /contentsafety/text/blocklists/<name>`             |
| API version                                                 | `2024-09-01`                                              |
| First resource to create for objectionable content checking | **Content Safety resource**                               |

---

## 4. Cross-Domain Quiz Question Refreshers

| Topic                          | Key Concept                                                         | Quick Reminder                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Computer Vision Captioning** | Use `VisualFeatureTypes.Description` to get auto-generated captions | Access result via `results.Description.Captions[0].Text`; this is the Computer Vision SDK (not Content Understanding) |
| **Video Indexer Pipeline**     | 4-step workflow for video analysis with translation                 | **Upload blob → Index with Video Indexer → Extract transcript → Translate** — must be in this order                   |
| **Form Recognizer Labeling**   | Custom model training via labeling tool                             | **Create project → Label documents → Train model** — labeling must happen before training                             |

---

## 5. Common Traps & Exam Tips

1. **Safety metaprompt ≠ filter testing**: The safety metaprompt is a system-level instruction template that guides LLM behavior. It does NOT test content filters. "Moderate text content" in Studio is what tests filters.
2. **Blocklist ≠ Custom text classifier**: Blocklists are exact-match term lists. Custom categories (preview) use AI classification. For "custom dictionary of offensive terms" → **blocklist**.
3. **Prompt Shields vs Content Safety**: Content Safety (Analyze Text) detects harmful content in text. Prompt Shields specifically detects adversarial manipulation attempts (jailbreak/injection). Different endpoints, different purposes.
4. **ContentSafetyClient vs other clients**: Don't confuse with `TextAnalyticsClient` (Language service) or `ComputerVisionClient` (Vision). Content Safety has its own dedicated client class.
5. **REST path structure**: The endpoint path uses `contentsafety/` prefix (not `cognitive/` or `language/`), and actions use colon syntax: `text:analyze`, `text:shieldPrompt`.
6. **Image moderation dual options**: Both **Content Safety** (Analyze Image API) and **Azure AI Vision** can moderate images. Content Safety is the dedicated service; Vision has built-in adult content detection.
7. **Ordering questions**: Watch for sequencing traps — Video Indexer requires upload BEFORE indexing; Form Recognizer requires labeling BEFORE training.

---

## 6. Quick Self-Check (Mental Review)

- What Python class do you instantiate to analyze text for harmful content? → `ContentSafetyClient`
- What class wraps the text input for analysis? → `AnalyzeTextOptions`
- What REST path analyzes text for hate content? → `/contentsafety/text:analyze`
- How do you detect jailbreak attempts? → Prompt Shields (`text:shieldPrompt`)
- What Content Safety feature uses a custom dictionary? → Blocklists
- Does the Safety metaprompt test content filters? → No
- Does "Moderate text content" in Studio test filters? → Yes
- What are the four harm categories? → Hate, Sexual, SelfHarm, Violence

---

## Sources (verified 2026-06-01)

- [Azure AI Content Safety overview](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview)
- [Content Safety text quickstart (Python)](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/quickstart-text?pivots=programming-language-python)
- [Blocklist how-to](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/how-to/use-blocklist)
- [Prompt Shields concepts](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection)
- [Prompt Shields quickstart](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/quickstart-jailbreak)
- [Azure Content Understanding overview](https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/overview)

---

## Notes (your own words — fill this in after studying)

_(Space for your personal notes after reviewing)_
