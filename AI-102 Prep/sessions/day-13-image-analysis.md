# Day 13: Image Analysis (OCR, Tags, Object Detection, Response Interpretation)
**Date**: 2026-05-18
**Domain**: Domain 4 — Implement computer vision solutions (10-15%)
**Subtopics**: OCR, tags, object outputs, response interpretation
**Estimated study time**: 1 hr

---

## TL;DR (60-second skim)

- **Image Analysis 4.0** is a synchronous, unified API — one call returns OCR + tags + objects + captions + people + smart crops. Use `VisualFeatures` enum to select what you need.
- **OCR (Read)** in v4.0 is synchronous and returns `readResult → blocks → lines → words`, each with `text`, `boundingPolygon`, and `confidence`. Handles both printed and handwritten text.
- **Tags** return a flat list of `{name, confidence}` pairs — no bounding boxes. **Objects** return `{tags[].name, boundingBox}` — they DO have bounding boxes.
- **Captions & Dense Captions** are only available in specific Azure regions (East US, West US, France Central, North Europe, West Europe, Southeast Asia, East Asia, Korea Central).
- **v3.2 vs v4.0**: v3.2 has brands, faces, color, landmarks, celebrities, adult content, image types. v4.0 drops those but adds synchronous OCR, people detection, dense captions, and multimodal embeddings.
- **Custom Vision model update flow**: Add new images + labels → Retrain model → Publish model. All three steps required.
- Many of today's quiz questions test **cross-domain** concepts: Content Moderator, Translator API geography endpoints, QnA Maker, Custom Speech, AI Search indexers, CLU utterances, and `RecognizeEntities`.

---

## Learning Objectives

After this session, you should be able to:
1. Select appropriate `VisualFeatures` for an Image Analysis 4.0 API call
2. Interpret the JSON response structure for OCR, tags, objects, captions, and people
3. Distinguish between tags (no bounding box) and objects (with bounding box)
4. Explain the OCR response hierarchy: `readResult.blocks[].lines[].words[]`
5. Know which features are v4.0-only vs v3.2-only
6. Update a Custom Vision classifier with new images (add → retrain → publish)
7. Answer cross-domain questions on Content Moderator, Translator, QnA Maker, Custom Speech, AI Search indexers, CLU, and Text Analytics

---

## Key Concepts

### 1. Image Analysis API Versions

| Aspect | v4.0 (GA) | v3.2 |
|--------|-----------|------|
| OCR | ✅ Synchronous `Read` | Async `Read` (separate API) |
| Tags | ✅ | ✅ |
| Objects | ✅ | ✅ |
| Captions | ✅ (region-limited) | ✅ (`Describe`) |
| Dense Captions | ✅ (region-limited) | ❌ |
| People detection | ✅ | ❌ |
| Smart Crops | ✅ | ✅ (thumbnail) |
| Brands | ❌ | ✅ |
| Faces | ❌ | ✅ |
| Color scheme | ❌ | ✅ |
| Landmarks/Celebrities | ❌ | ✅ |
| Adult content | ❌ | ✅ |
| Image type | ❌ | ✅ |
| Multimodal embeddings | ✅ | ❌ |

**Exam trap**: If a question asks about detecting brands, landmarks, celebrities, or adult content → answer is v3.2. If it asks about synchronous OCR, people, or dense captions → v4.0.

### 2. Visual Features Selection (v4.0)

In code, you combine features with bitwise OR:
```csharp
VisualFeatures visualFeatures =
    VisualFeatures.Caption |
    VisualFeatures.DenseCaptions |
    VisualFeatures.Objects |
    VisualFeatures.Read |       // OCR
    VisualFeatures.Tags |
    VisualFeatures.People |
    VisualFeatures.SmartCrops;
```

REST API uses query parameter: `?features=caption,denseCaptions,objects,read,tags,people,smartCrops`

### 3. OCR (Read) — Response Structure

OCR in v4.0 is part of the unified Analyze call. Include `Read` in visual features.

**Response hierarchy**: `readResult → blocks[] → lines[] → words[]`

```json
{
  "readResult": {
    "blocks": [
      {
        "lines": [
          {
            "text": "You must be the change you",
            "boundingPolygon": [{"x":251,"y":265}, {"x":673,"y":260}, ...],
            "words": [
              {
                "text": "You",
                "boundingPolygon": [{"x":252,"y":267}, ...],
                "confidence": 0.996
              }
            ]
          }
        ]
      }
    ]
  }
}
```

Key facts:
- Each **word** has its own `boundingPolygon` and `confidence` score
- Each **line** has aggregated `text` and its own `boundingPolygon`
- Lines are grouped into **blocks** (text regions)
- Handles both **printed and handwritten** text
- **Synchronous** — no polling needed (unlike v3.2 Read which was async)

### 4. Tags — Response Structure

Tags return a flat list — **no bounding boxes**.

```json
{
  "tagsResult": {
    "values": [
      { "name": "outdoor", "confidence": 0.9876 },
      { "name": "building", "confidence": 0.9432 },
      { "name": "sky", "confidence": 0.8901 }
    ]
  }
}
```

- Tags describe the whole image (scene, objects, actions, settings)
- Each tag has `name` and `confidence` (0-1)
- Tags cover foreground AND background elements

### 5. Object Detection — Response Structure

Objects return **bounding boxes** — this is the key difference from tags.

```json
{
  "objectsResult": {
    "values": [
      {
        "tags": [
          { "name": "laptop", "confidence": 0.912 }
        ],
        "boundingBox": {
          "x": 100, "y": 50, "w": 300, "h": 200
        }
      }
    ]
  }
}
```

- Each object has a `boundingBox` (x, y, width, height in pixels)
- Objects can appear multiple times (e.g., 3 people = 3 separate object entries)
- Object's `tags` array contains the classification label(s)

### 6. Captions and Dense Captions

**Caption**: Single sentence describing the whole image.
```json
{
  "captionResult": {
    "text": "a person standing in front of a building",
    "confidence": 0.8523
  }
}
```

**Dense Captions**: Multiple captions for different regions of the image.
```json
{
  "denseCaptionsResult": {
    "values": [
      {
        "text": "a laptop on a desk",
        "confidence": 0.9012,
        "boundingBox": { "x": 100, "y": 50, "w": 300, "h": 200 }
      }
    ]
  }
}
```

**Region-limited**: Only available in East US, West US, France Central, North Europe, West Europe, Southeast Asia, East Asia, Korea Central.

### 7. People Detection

Returns bounding boxes for detected people — **no identity info**.
```json
{
  "peopleResult": {
    "values": [
      {
        "boundingBox": { "x": 10, "y": 20, "w": 100, "h": 300 },
        "confidence": 0.9545
      }
    ]
  }
}
```

### 8. Custom Vision — Updating a Model

When you receive new images for an existing Custom Vision classifier:
1. **Add** new images with labels to the existing project
2. **Retrain** the model
3. **Publish** the model

All three steps are mandatory. You cannot skip retraining or republishing.

---

## Input Requirements & Limits (v4.0)

| Constraint | Value |
|-----------|-------|
| Supported formats | JPEG, PNG, GIF, BMP, WEBP, ICO, TIFF, MPO |
| Max file size | 20 MB |
| Min dimensions | 50 × 50 pixels |
| Max dimensions | 16,000 × 16,000 pixels |

---

## Comparisons

### Tags vs Objects

| Aspect | Tags | Objects |
|--------|------|---------|
| Bounding box | ❌ No | ✅ Yes |
| Multiple instances | Single tag entry | Separate entry per instance |
| Scope | Whole image (scene + elements) | Individual objects in image |
| Use case | Categorization, search indexing | Localization, counting, spatial analysis |

### OCR: v4.0 Read vs v3.2 Read vs Document Intelligence

| Aspect | v4.0 Read (Image Analysis) | v3.2 Read API | Document Intelligence Read |
|--------|---------------------------|---------------|---------------------------|
| Sync/Async | Synchronous | Asynchronous (poll) | Asynchronous |
| Best for | In-the-wild images, labels, signs | General images | PDFs, Office docs, scanned docs |
| Single API call | ✅ (with other features) | Separate endpoint | Separate service |
| Handwritten | ✅ | ✅ | ✅ |

---

## Common Traps & Misconceptions

1. **"Tags have bounding boxes"** — WRONG. Tags are image-level labels with confidence only. Objects have bounding boxes.
2. **"OCR in v4.0 requires polling"** — WRONG. v4.0 OCR is synchronous. Only v3.2 Read was async with polling.
3. **"Dense captions are available everywhere"** — WRONG. Region-limited (East US, West US, France Central, etc.).
4. **"v4.0 can detect brands/celebrities"** — WRONG. Those are v3.2-only features.
5. **"To update a Custom Vision model, just add images"** — WRONG. Must add images, retrain, AND publish.
6. **"People detection identifies who they are"** — WRONG. It only returns bounding boxes + confidence, no identity.

---

## Cross-Domain Quiz Question Refreshers

These concepts appear in today's quiz questions but come from other domains. Review carefully — the quiz WILL test them.

| # | Concept | Key Fact | Trap |
|---|---------|----------|------|
| 1 | **Content Moderator Text Moderation API** | Returns: (1) Profanity terms, (2) Classification (Category1=sexually explicit, Category2=suggestive, Category3=offensive), (3) Personal data (PII: email, SSN, IP, phone, address), (4) Autocorrected text. The question asks which **two** responses to use for content moderation — answer is **Classification + Personal data** (options may phrase as "text classification" and "personal data"). | "Adult classification score" and "racy classification score" are distractors — the API uses Category1/Category2/Category3, not "adult"/"racy" labels. OCR is NOT a content moderation response field. |
| 2 | **Azure AI Search Indexer Data Sources** | Supported built-in data sources: Azure SQL Database, Azure Cosmos DB (SQL API), Azure Blob Storage, Azure Table Storage, Azure Data Lake Storage Gen2, SharePoint Online, Azure Files, MySQL. **On-premises SQL Server is NOT directly supported** — you must export data to a supported source (e.g., Data Lake Storage). | The question says Finance is on-prem SQL Server. To make it searchable, export to Azure Data Lake Storage (ADLS). Don't be tricked by migrating HR (already Azure SQL) — it's already supported. |
| 3 | **Custom Vision Model Update** | Add new images + labels → Retrain → Publish. All three steps required. | If solution says "retrain without adding labels" or "add images without retraining" → wrong. |
| 4 | **QnA Maker Chatbot — Improving Accuracy** | When a chatbot doesn't match alternative phrasings: (1) Add alternative phrasing to the QnA pair, (2) Retrain/Save the model, (3) Republish. Order matters! | Don't retrain first — you must add the alternative phrasing BEFORE retraining. |
| 5 | **Translator API — Geographic Endpoints** | To keep data within Americas: use `api-nam.cognitive.microsofttranslator.com`. Europe: `api-eur`. Asia Pacific: `api-apc`. Global (default): `api.cognitive.microsofttranslator.com`. The translate endpoint path: `/translator/text/v3.0/translate?to=en`. | Two quiz questions test this: both need `api-nam` for US data sovereignty + `/translate` endpoint. The `?to=` parameter specifies target language. |
| 6 | **Custom Speech — Building Transcription Service** | 5-step workflow for custom speech models: (1) Create Custom Speech project, (2) Create speech-to-text model, (3) Upload training datasets, (4) Train model, (5) Deploy model. | Order matters! Create project first, then model definition, then upload data, then train, then deploy. |
| 7 | **CLU (Conversational Language Understanding) — Utterances vs Entities** | To implement training phrases for an intent: create utterances for each phrase in the intent. Creating a new entity for the domain does NOT implement phrase lists — entities are for extracting structured data, not for training intent recognition. | Series questions: "Create entity for domain" → **No**. "Create utterance for each phrase in intent" → **Yes**. |
| 8 | **Text Analytics — RecognizeEntities** | `RecognizeEntities` extracts named entities (people, locations, organizations, etc.) from text. For "Our tour of London included a visit to Buckingham Palace" → returns **London** and **Buckingham Palace** (location entities). Does NOT return common nouns like "tour" or "visit". | `RecognizeEntities` ≠ `ExtractKeyPhrases`. Entities = proper nouns/named things. Key phrases = important terms including common nouns. |

---

## Quick Reference Card

### Image Analysis 4.0 — Response Field Mapping

| Visual Feature | Response Key | Returns |
|---------------|-------------|---------|
| Caption | `captionResult` | `{text, confidence}` |
| Dense Captions | `denseCaptionsResult.values[]` | `{text, confidence, boundingBox}` |
| Tags | `tagsResult.values[]` | `{name, confidence}` |
| Objects | `objectsResult.values[]` | `{tags[{name,confidence}], boundingBox}` |
| Read (OCR) | `readResult.blocks[].lines[].words[]` | `{text, boundingPolygon, confidence}` |
| People | `peopleResult.values[]` | `{boundingBox, confidence}` |
| Smart Crops | `smartCropsResult.values[]` | `{aspectRatio, boundingBox}` |

### Translator Geographic Endpoints

| Geography | Base URL |
|-----------|----------|
| Global | `api.cognitive.microsofttranslator.com` |
| Americas | `api-nam.cognitive.microsofttranslator.com` |
| Europe | `api-eur.cognitive.microsofttranslator.com` |
| Asia Pacific | `api-apc.cognitive.microsofttranslator.com` |

### Content Moderator Text API — Response Components

| Component | What It Returns |
|-----------|----------------|
| Profanity | Matched terms with index positions |
| Classification | Category1 (sexual), Category2 (suggestive), Category3 (offensive) + ReviewRecommended |
| Personal data | PII: email, SSN, IP, phone, address |
| Autocorrection | Corrected text |

---

## Related Questions in questions.json

| # | ID | Topic Summary |
|---|-----|--------------|
| 1 | `YS1qtqZ1dPmy2vbweB2F` | Content Moderator Text Moderation — which two responses for content moderation |
| 2 | `YfyJsjeWPomEUhNoeI08` | Azure AI Search — making on-prem SQL Server data searchable (export to ADLS) |
| 3 | `aCHdNf0PVlynzAYcV2ik` | Custom Vision — add new images + labels, retrain, publish (Yes) |
| 4 | `aKN9Ao5SwgVK8cF9hZ40` | QnA Maker — add alternative phrasing → retrain → republish |
| 5 | `bg7ZNwoZiyLNsOYVGC6Q` | Translator — use `api-nam` + `?to=en` for Americas data sovereignty |
| 6 | `bwWWpOkpYUh7Wo3xepka` | Translator — `api-nam.cognitive.microsofttranslator.com` + `translate` |
| 7 | `eX3GiXn72tAVapys4i82` | Custom Speech — 5-step workflow (project → model → upload → train → deploy) |
| 8 | `fZ7ZKmvCNfsqYYE4RP5F` | CLU series — creating entity for domain does NOT implement phrase list (No) |
| 9 | `fz3fww1MUnrii1z8LheP` | CLU series — creating utterance for each phrase in intent DOES work (Yes) |
| 10 | `g39TSJoLWuN0q8nacAQp` | Text Analytics — `RecognizeEntities` returns London & Buckingham Palace |

Quiz command:
```powershell
cd "d:\Projects\microsoft-exam-prep\AI-102 Prep" ; python quiz_runner.py questions.json --day-lock 13 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [What is Image Analysis? (v4.0)](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/overview-image-analysis?tabs=4-0)
- [Call the Image Analysis 4.0 Analyze API](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/how-to/call-analyze-image-40?tabs=csharp)
- [OCR for images (version 4.0)](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/concept-ocr)
- [Content Moderator Text Moderation API](https://learn.microsoft.com/en-us/azure/ai-services/content-moderator/text-moderation-api)
- [Translator v3.0 Reference — Base URLs](https://learn.microsoft.com/en-us/azure/ai-services/translator/reference/v3-0-reference)
- [Azure AI Search data source gallery](https://learn.microsoft.com/en-us/azure/search/search-data-sources-gallery)

---

## Notes (your own words — fill this in after studying)

_(Space for your own notes after going through the material)_
