# Day 29: Buffer / Catch-up — Weakest Subdomain Remediation

**Date**: 2026-06-03  
**Focus**: Remediation of weakest subdomains from Days 1-28  
**Targets**: Day 7 (RAG Fundamentals, 66.7%), Day 16 (Video/Spatial/Doc Intelligence, 75%), Day 18 (Translation/Knowledge Mining, 75%)  
**Estimated study time**: 0.5 hrs  
**Exam date**: 2026-06-07 (4 days away)

---

## TL;DR (60-second skim)

- **TranslationRecognizer** (not SpeechRecognizer) for speech translation; target languages list must **exclude** the source language
- Video Indexer supports **all common formats** (WMV, AVI, MOV, MP4, FLV, MKV); upload limit is **2 GB from device**, **30 GB from URL**; use **Customize Person model** within VI — do NOT create a separate Face API group
- Face API Free tier: **1,000 person groups × 1,000 persons = 1M faces max**; `AddFaceFromUrlAsync` takes a URL (matches URI-based source)
- **prebuilt-read** is the ONLY Document Intelligence model that detects **handwriting style** and extracts **barcodes/QR codes** — not prebuilt-contract, not business-card
- Knowledge store projections: **object** = JSON blobs, **table** = Azure Table Storage rows, **file** = binary images; empty `files: []` means **no image projection**
- Custom Web API skill requires **output field mappings** to map enriched fields to index; skill type is `Microsoft.Skills.Custom.WebApiSkill`

---

## Remediation Focus Area 1: Speech Translation API (Day 7)

### TranslationRecognizer vs SpeechRecognizer

| Aspect               | SpeechRecognizer                   | TranslationRecognizer                                              |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| **Purpose**          | Speech-to-text only                | Speech-to-text + translation                                       |
| **Config class**     | `SpeechConfig`                     | `SpeechTranslationConfig`                                          |
| **Key method**       | `RecognizeOnceAsync()`             | `RecognizeOnceAsync()`                                             |
| **Output**           | Recognized text in source language | Source transcription + translated text in target language(s)       |
| **Target languages** | N/A                                | Set via `AddTargetLanguage("de")`                                  |
| **Voice synthesis**  | N/A                                | Optional: `SetVoiceName("de-DE-KatjaNeural")` for speech-to-speech |

### Critical Exam Traps

1. **Target languages must exclude source**: If source is `en-GB`, you add target languages like `de`, `fr`, `es` — you do NOT add `en` as a target
2. **Class name**: The exam tests whether you know to use `TranslationRecognizer` (not `SpeechRecognizer`) when the scenario says "translate speech"
3. **SpeechTranslationConfig**: Created with `SpeechTranslationConfig.FromSubscription(key, region)`, then you set `SpeechRecognitionLanguage` and call `AddTargetLanguage()` for each target
4. **Multiple targets**: You can translate to multiple languages simultaneously — each target language appears in the result dictionary

### Code Pattern (C#)

```csharp
var config = SpeechTranslationConfig.FromSubscription(key, region);
config.SpeechRecognitionLanguage = "en-US";  // source
config.AddTargetLanguage("de");  // target 1
config.AddTargetLanguage("fr");  // target 2
// Do NOT add "en" as target when source is English

using var recognizer = new TranslationRecognizer(config);
var result = await recognizer.RecognizeOnceAsync();
// result.Translations["de"] → German text
// result.Translations["fr"] → French text
```

---

## Remediation Focus Area 2: Video Indexer (Day 7 & Day 16)

### Supported File Formats & Upload Limits

| Constraint            | Value                                                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Supported formats     | All Azure Media Services formats: **MP4, AVI, WMV, MOV, FLV, MKV, WebM, 3GP, ASF, M4A, M4V, MPEG, MXF, OGV, TS, WAV, WMA** and many more |
| Upload from device    | **2 GB max**                                                                                                                             |
| Upload from URL       | **30 GB max**                                                                                                                            |
| File name length      | **80 characters max**                                                                                                                    |
| Batch upload          | Up to **10 files at a time**                                                                                                             |
| Streaming source URLs | **Cannot** use YouTube or streaming service URLs                                                                                         |

**Exam trap**: When a question asks "which of these files can be uploaded?", the answer is almost always **ALL of them** — VI supports virtually every common video format. Don't second-guess WMV or AVI — they are supported.

### Person Model Customization

Video Indexer has its **own built-in Person model** system — you do NOT need to create a separate Face API resource for face recognition within VI.

| Feature                   | Detail                                                               |
| ------------------------- | -------------------------------------------------------------------- |
| Person models per account | **50 max**                                                           |
| Persons per model         | **1,000,000 max**                                                    |
| Default model             | Every account has one; used when no model ID specified               |
| Custom models             | Create via portal or API; associate with video at upload time        |
| Training                  | Happens when you add a face image to a person; updates are automatic |

**Exam trap**: "To search for a specific person across videos" → use **Customize Person model** in Video Indexer, NOT "create a Face API person group". VI has its own person recognition pipeline.

### Workflow for Person Recognition

1. Create a Person model in VI (or use default)
2. Add persons with name + face images
3. Upload/reindex video with that Person model ID
4. VI automatically recognizes and tags the person in the video

---

## Remediation Focus Area 3: Face API Tier Limits (Day 7)

### Free vs Standard Tier Limits

| Feature                 | Free (F0)              | Standard (S0)                  |
| ----------------------- | ---------------------- | ------------------------------ |
| Transactions per second | 20                     | 10 TPS (default, can increase) |
| Person groups           | 1,000 max              | 1,000 max                      |
| Persons per PersonGroup | 1,000                  | 10,000                         |
| **Total faces**         | **1,000 × 1,000 = 1M** | 1,000 × 10,000 = 10M           |
| LargePersonGroup        | Not available          | Up to 1M persons each          |
| FaceList                | 1,000 faces max        | 1,000 faces max                |
| LargeFaceList           | Not available          | Up to 1M faces                 |

### Key API Methods

| Method                   | Purpose                             | Input                                |
| ------------------------ | ----------------------------------- | ------------------------------------ |
| `DetectAsync`            | Find faces in image                 | URL or binary stream                 |
| `AddFaceFromUrlAsync`    | Add face to person group            | URL of image                         |
| `AddFaceFromStreamAsync` | Add face to person group            | Binary stream                        |
| `IdentifyAsync`          | Match detected face to person group | Face IDs + PersonGroup ID            |
| `VerifyAsync`            | 1:1 comparison                      | Two face IDs, or face ID + person ID |

**Exam trap (hotspot)**: Question says "Can the code store 1M faces on Free tier?" — YES, because 1,000 groups × 1,000 persons = 1,000,000 max. Question says "Code uses `AddFaceFromUrlAsync` — does this match a URI-based source?" — YES, URL = URI.

---

## Remediation Focus Area 4: Document Intelligence prebuilt-read (Day 16)

### prebuilt-read Unique Capabilities

The `prebuilt-read` model is the **foundational OCR engine** for all other Document Intelligence models. It has exclusive capabilities:

| Capability                      | prebuilt-read | prebuilt-layout | prebuilt-contract | Business card |
| ------------------------------- | :-----------: | :-------------: | :---------------: | :-----------: |
| Print text extraction           |      ✅       |       ✅        |        ✅         |      ✅       |
| **Handwriting style detection** |      ✅       |       ❌        |        ❌         |      ❌       |
| **Barcode/QR code extraction**  |      ✅       |    ✅ (v4.0)    |        ❌         |      ❌       |
| Table extraction                |      ❌       |       ✅        |        ✅         |      ❌       |
| Key-value pairs                 |      ❌       |       ✅        |        ✅         |      ❌       |
| Language detection              |      ✅       |       ✅        |        ❌         |      ❌       |
| Paragraph detection             |      ✅       |       ✅        |        ❌         |      ❌       |

### Supported Input Formats (v4.0)

PDF, JPEG, JPG, PNG, BMP, TIFF, HEIF, **DOCX, XLSX, PPTX, HTML**

### Key Exam Facts

- **Handwriting style**: `prebuilt-read` returns a `style` property with `isHandwritten: true/false` and a confidence score. NO other prebuilt model provides this.
- **Barcode/QR extraction**: `prebuilt-read` extracts barcode values and types (QR, Code128, etc.). The **business card model was deprecated** and never supported QR codes.
- **Min pixel dimension (S0)**: 50 × 50 pixels minimum for documents
- **Max file size**: 500 MB for standard tier, 4 MB for free tier
- **Max pages**: 2,000 pages per document

**Exam trap**: "Which model should you use to detect handwriting?" → `prebuilt-read`. NOT prebuilt-contract, NOT prebuilt-layout. The `style.isHandwritten` property is exclusive to the read model.

**Exam trap**: "Which model extracts QR codes?" → `prebuilt-read`. The business card model does NOT extract QR codes (it was deprecated in late 2024).

---

## Remediation Focus Area 5: AI Search Custom Skill Schema (Day 16)

### Custom Web API Skill Structure

```json
{
	"@odata.type": "#Microsoft.Skills.Custom.WebApiSkill",
	"name": "myCustomSkill",
	"description": "Custom enrichment",
	"uri": "https://myfunction.azurewebsites.net/api/enrich",
	"httpMethod": "POST",
	"timeout": "PT30S",
	"batchSize": 1,
	"context": "/document",
	"inputs": [{ "name": "text", "source": "/document/content" }],
	"outputs": [{ "name": "enrichedData", "targetName": "customEnriched" }]
}
```

### Three Key Schema Facts (Y/Y/N pattern → actually Y/N/Y depending on question)

| Statement                                                                  | Answer  | Why                                                                                                         |
| -------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| Output field mappings are required for skillset outputs to reach the index | **Yes** | Skillset outputs go to enrichment tree nodes; `outputFieldMappings` on the indexer map them to index fields |
| A custom skill uses the Web API skill type                                 | **Yes** | `@odata.type` = `Microsoft.Skills.Custom.WebApiSkill`                                                       |
| Entity recognition is a built-in skill, not a custom skill                 | **Yes** | `EntityRecognitionSkill` is a built-in cognitive skill                                                      |

### Field Mapping Flow

```
Source document → Indexer (fieldMappings) → Enrichment tree
    → Skillset processes → Enrichment tree updated
    → Indexer (outputFieldMappings) → Search index fields
```

**Exam trap**: `fieldMappings` map source fields TO the enrichment tree. `outputFieldMappings` map enriched fields FROM the skillset TO the index. Both exist on the indexer definition, not the skillset.

---

## Remediation Focus Area 6: Knowledge Store Projections (Day 18)

### Three Projection Types

| Projection Type | Storage Target      | Content Type       | Use Case                                 |
| --------------- | ------------------- | ------------------ | ---------------------------------------- |
| **table**       | Azure Table Storage | Structured rows    | Analytics, Power BI, tabular reporting   |
| **object**      | Azure Blob Storage  | **JSON documents** | Full enrichment trees, downstream apps   |
| **file**        | Azure Blob Storage  | **Binary images**  | Normalized images from document cracking |

### Knowledge Store Definition Requirements

```json
"knowledgeStore": {
  "storageConnectionString": "DefaultEndpointsProtocol=https;...",
  "projections": [
    {
      "tables": [ { "tableName": "docs", "source": "/document/tableprojection" } ],
      "objects": [ { "storageContainer": "enriched", "source": "/document" } ],
      "files": [ { "storageContainer": "images", "source": "/document/normalized_images/*" } ]
    }
  ]
}
```

**Two required properties**: `storageConnectionString` + `projections`

### Critical Exam Traps

1. **Object projections store JSON** — NOT binary images. If the question says "store enriched JSON documents," the answer is `objects`, not `files`.
2. **File projections store binary images** — normalized images extracted during document cracking.
3. **Empty `files: []`** means **no image projection** is created — images won't be stored even if document cracking normalizes them.
4. **Table projections** flatten the enrichment tree into rows. Each table is a separate Azure Table Storage table.
5. **storageConnectionString is mandatory** — without it, the knowledge store won't be created even if projections are defined.

---

## Key Traps & Exam Gotchas Summary

| #   | Trap                            | Wrong Answer                    | Correct Answer                                             |
| --- | ------------------------------- | ------------------------------- | ---------------------------------------------------------- |
| 1   | Speech translation class        | `SpeechRecognizer`              | `TranslationRecognizer` with `SpeechTranslationConfig`     |
| 2   | Target languages include source | Add `en` when source is `en-US` | Target list must EXCLUDE source language                   |
| 3   | Video Indexer file support      | "WMV/AVI not supported"         | ALL common formats supported (WMV, AVI, MOV, MP4, etc.)    |
| 4   | VI upload limit from device     | 30 GB                           | **2 GB** (30 GB is URL-only limit)                         |
| 5   | Person recognition in VI        | Create Face API PersonGroup     | Use VI's built-in **Customize Person model**               |
| 6   | Face API Free tier total faces  | "Not enough for 1M"             | 1,000 groups × 1,000 persons = **1M faces**                |
| 7   | Handwriting detection model     | prebuilt-contract               | **prebuilt-read** (only model with `style.isHandwritten`)  |
| 8   | QR code extraction              | Business card model             | **prebuilt-read** (business card deprecated, never had QR) |
| 9   | Custom skill type in AI Search  | Custom code skill               | `Microsoft.Skills.Custom.WebApiSkill`                      |
| 10  | outputFieldMappings location    | On the skillset                 | On the **indexer** definition                              |
| 11  | Object projections store...     | Binary images                   | **JSON documents**                                         |
| 12  | Knowledge store required props  | Just projections                | `storageConnectionString` + `projections`                  |
| 13  | Empty `files: []`               | Still stores images             | **No image projection** — nothing stored                   |

---

## Cross-Topic Quick Review

| Domain      | Concept                      | Key Fact                                                                                  | Links To              |
| ----------- | ---------------------------- | ----------------------------------------------------------------------------------------- | --------------------- |
| D2 (GenAI)  | RAG pipeline                 | Retrieval → Augmentation → Generation; index must exist first                             | AI Search indexing    |
| D4 (Vision) | Document Intelligence models | prebuilt-read → OCR base; prebuilt-layout → tables/structure; prebuilt-invoice → invoices | Custom models         |
| D4 (Vision) | Video Indexer vs Face API    | VI has own person model; Face API is separate service                                     | Person recognition    |
| D5 (NLP)    | Translation services         | Translator API (text) vs Speech Translation (audio)                                       | TranslationRecognizer |
| D6 (Search) | Skillset → Index flow        | fieldMappings (source→enrichment) + outputFieldMappings (enrichment→index)                | Custom skills         |
| D6 (Search) | Knowledge store              | Secondary output of skillset; stored in Azure Storage                                     | Projections           |

---

## Quick Reference Card

### Speech Translation Cheat Sheet

- Config: `SpeechTranslationConfig.FromSubscription(key, region)`
- Set source: `.SpeechRecognitionLanguage = "en-US"`
- Add target: `.AddTargetLanguage("de")` (NOT the source language)
- Create: `new TranslationRecognizer(config)`
- Result: `result.Translations["de"]`

### Video Indexer Cheat Sheet

- Formats: Virtually all (MP4, AVI, WMV, MOV, MKV, FLV, WebM, etc.)
- Device upload: ≤ 2 GB | URL upload: ≤ 30 GB
- Person models: 50/account, 1M persons/model
- Person search: Use VI Person model, NOT Face API

### Face API Cheat Sheet

- Free: 1K groups × 1K persons = 1M faces
- Standard: 1K groups × 10K persons = 10M faces
- LargePersonGroup: Standard only, up to 1M persons each
- `AddFaceFromUrlAsync` = URL input; `AddFaceFromStreamAsync` = binary

### Document Intelligence Cheat Sheet

- prebuilt-read: OCR + handwriting style + barcodes/QR + paragraphs
- prebuilt-layout: tables + key-value pairs + selection marks
- Min pixels (S0): 50 × 50
- Max file: 500 MB (S0) / 4 MB (F0)
- Business card: DEPRECATED — no QR code support

### Knowledge Store Cheat Sheet

- Requires: `storageConnectionString` + `projections`
- Tables → Azure Table Storage (structured rows)
- Objects → Blob Storage (JSON)
- Files → Blob Storage (binary images)
- Empty `files: []` → no images stored

---

## Sources (verified 2026-06-03)

- [Speech translation overview](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-translation)
- [Upload and index media with Video Indexer](https://learn.microsoft.com/en-us/azure/azure-video-indexer/upload-index-videos)
- [Customize a Person model in Video Indexer](https://learn.microsoft.com/en-us/azure/azure-video-indexer/customize-person-model-overview)
- [Document Intelligence Read model](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/concept-read)
- [Custom Web API skill in AI Search](https://learn.microsoft.com/en-us/azure/search/cognitive-search-custom-skill-web-api)
- [Knowledge store concepts](https://learn.microsoft.com/en-us/azure/search/knowledge-store-concept-intro)
- [Face API Detect](https://learn.microsoft.com/en-us/azure/ai-services/face/how-to/identity-detect-faces)

---

## Notes (your own words — fill this in after studying)

_(Review each trap above. For each one you got wrong, write in your own words WHY the correct answer is correct.)_
