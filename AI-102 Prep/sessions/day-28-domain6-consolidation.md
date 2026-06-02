# Day 28: Domain 6 Consolidation — Full Knowledge Mining Architecture Recap

**Date**: 2026-06-02
**Domain**: Implement knowledge mining and document intelligence solutions (15-20%)
**Subtopics**: AI Search architecture, suggesters, synonym maps, skillsets, indexers, Document Intelligence, Translator API, Video Indexer, QnA Maker RBAC, Adaptive Cards
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)

- **AI Search pipeline**: Data source → Indexer → Skillset (enrichment) → Index → Query. Indexer picks data source type (Blob for files, Cosmos DB for JSON docs). Document extraction skill is for files only — NOT Cosmos DB.
- **Suggesters**: One per index, multiple source fields. Use `analyzer` (not `searchAnalyzer`) on fields. Query the `autocomplete` endpoint with `suggesterName`.
- **Synonym maps**: Top-level resource, assigned to searchable string fields via `synonymMaps` property. Comma-delimited equivalency or `=>` explicit mapping.
- **Entity Recognition Skill v3**: `categories` array defines entity types (Person, Location, etc.). Outputs include `namedEntities` with confidence scores. `includeTypelessEntities` was v2 only.
- **Document Intelligence**: Confidence 0-1 per field. Use wildcard `fields.*.confidence < 0.7` to flag ANY field below threshold for manual review. Custom model endpoint: `/formrecognizer/v2.0/custom/models/{modelId}/analyze`. Prebuilt receipt: `/formrecognizer/v2.0/prebuilt/receipt/analyze`.
- **Translator API**: Global URL `api.cognitive.microsofttranslator.com`, path `/translate`. Regional endpoints for data residency: `api-nam` (Americas), `api-eur` (Europe), `api-apc` (Asia Pacific).
- **QnA Maker RBAC**: Editor = edit Q&As (read/write); Contributor = all except add members (includes publish); Owner = everything (too permissive for least privilege).

---

## Learning Objectives

After this session you should be able to:

1. Trace an end-to-end AI Search pipeline from data source to query result
2. Configure suggesters, synonym maps, and skillsets correctly
3. Choose the right indexer data source (Blob vs Cosmos DB) and matching skills
4. Select correct Document Intelligence API endpoints for custom vs prebuilt models
5. Construct Translator REST URIs including regional endpoints for data residency
6. Assign QnA Maker RBAC roles using least-privilege principles
7. Build Adaptive Cards with data binding, conditional rendering, and multilingual templates

---

## Key Concepts

### 1. AI Search End-to-End Architecture

```
Data Sources (Blob, Cosmos DB, SQL, etc.)
        ↓
    Indexer (schedules, maps fields)
        ↓
    Skillset (enrichment pipeline)
    ├── Language Detection
    ├── Entity Recognition
    ├── Text Translation
    ├── Document Extraction (files only!)
    ├── Custom Web API Skill
    └── OCR / Image Analysis
        ↓
    Index (searchable fields, suggesters, synonym maps)
        ↓
    Queries (search, suggest, autocomplete)
```

**Key rules**:

- Each indexer targets ONE data source and ONE index
- Skillsets are optional — attached to indexers for AI enrichment
- Field mappings (indexer-level) map source fields → index fields
- Output field mappings map enrichment outputs → index fields

### 2. Suggesters & Autocomplete

**One suggester per index** with multiple source fields:

```json
"suggesters": [{
  "name": "sg",
  "searchMode": "analyzingInfixMatching",
  "sourceFields": ["productName_en", "productName_es", "productName_fr"]
}]
```

**Critical rules**:

- Use `analyzer` property (e.g., language analyzer) on the field — NOT `searchAnalyzer`
- `searchAnalyzer` is for search-time analysis of queries, not for suggester tokenization
- Suggester fields must be `searchable: true` and type `Edm.String`
- Must define suggester BEFORE indexing (or rebuild index)
- Query the **autocomplete endpoint** with `suggesterName`:
  ```
  POST /indexes/{index}/docs/autocomplete?api-version=2024-07-01
  { "search": "minecr", "suggesterName": "sg" }
  ```
- Do NOT use the search endpoint for autocomplete — it won't produce typeahead behavior

**Trap**: One suggester with multiple source fields ≠ one suggester per field. You add ALL relevant fields to ONE suggester's `sourceFields` array.

### 3. Synonym Maps

A top-level resource (not part of an index definition):

```json
POST /synonymmaps?api-version=2024-07-01
{
  "name": "product-synonyms",
  "format": "solr",
  "synonyms": "laptop, notebook, portable computer\nphone, mobile, cell\n"
}
```

**Assign to a field**:

```json
{
	"name": "description",
	"type": "Edm.String",
	"searchable": true,
	"synonymMaps": ["product-synonyms"]
}
```

**Rules**:

- Only applies to free-text search queries — NOT filters, facets, autocomplete, or suggestions
- Equivalency: `USA, United States, United States of America` (bidirectional)
- Explicit mapping: `Washington, Wash., WA => WA` (one-directional)
- Up to 5,000 rules (free tier) or 20,000 rules (paid tiers)
- Each field can have only ONE synonym map
- No reindexing needed — takes effect on next query

### 4. Skillsets — Entity Recognition & Document Extraction

**Entity Recognition Skill v3** (`Microsoft.Skills.Text.V3.EntityRecognitionSkill`):

```json
{
	"@odata.type": "#Microsoft.Skills.Text.V3.EntityRecognitionSkill",
	"categories": ["Person", "Email", "Organization"],
	"defaultLanguageCode": "en",
	"minimumPrecision": 0.5,
	"inputs": [{ "name": "text", "source": "/document/content" }],
	"outputs": [
		{ "name": "persons", "targetName": "people" },
		{ "name": "namedEntities", "targetName": "namedEntities" }
	]
}
```

- `categories` array: "Person", "Location", "Organization", "Email", "URL", "DateTime", "Quantity", etc.
- If no categories specified, ALL types returned
- Outputs: `persons`, `locations`, `organizations`, `emails`, `urls`, `namedEntities` (rich objects with confidence)
- **`includeTypelessEntities`** was a parameter in v2 (`EntityRecognitionSkill`) — in v3, typed entities are the default

**Exam trap on skill JSON structure**: The question tests which property goes where:

- `categories` array → defines what entity types to extract (input config)
- output name `"entities"` or `"namedEntities"` → the enriched output
- `includeTypelessEntities` → v2 parameter (true/false)

**Document Extraction Skill** (`Microsoft.Skills.Util.DocumentExtractionSkill`):

- Extracts content from **files** (PDF, DOCX, HTML, etc.)
- Requires `file_data` input — tied to blob/file-based data sources
- **Does NOT work with Cosmos DB** — Cosmos DB stores JSON documents, not files
- Use this for Blob Storage indexers when you need to control extraction parameters

### 5. Indexer Data Sources — Blob vs Cosmos DB

| Feature                   | Azure Blob Storage                           | Azure Cosmos DB                                                  |
| ------------------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| Content type              | Files (PDF, DOCX, images)                    | JSON documents                                                   |
| Document extraction skill | Yes — extracts text from files               | No — data is already structured JSON                             |
| Typical skillset          | OCR, document extraction, entity recognition | Language detection, text translation, entity recognition         |
| When to use               | Binary files, scanned documents              | Structured/semi-structured data (wiki content, product catalogs) |

**Exam trap**: When the scenario says "wiki content stored in Cosmos DB" and needs multilingual support → use Cosmos DB indexer + language detection + text translation skills. Do NOT use document extraction skill (that's for files, not Cosmos DB documents).

### 6. Document Intelligence / Form Recognizer

**API Endpoints**:
| Use Case | Endpoint |
|---|---|
| Custom model | `/formrecognizer/v2.0/custom/models/{modelId}/analyze` |
| Prebuilt receipt | `/formrecognizer/v2.0/prebuilt/receipt/analyze` |
| Prebuilt invoice | `/formrecognizer/v2.1/prebuilt/invoice/analyze` |
| Prebuilt read (handwriting) | `/formrecognizer/v2.1/prebuilt/read/analyze` |

**NOT valid endpoints** (exam traps):

- `/vision/v3.1/describe` — Computer Vision describe, not Form Recognizer
- `/vision/v3.1/read/analyze` — Computer Vision Read API, not Document Intelligence

**Confidence threshold for manual review**:

- Each extracted field has a `confidence` value (0 to 1)
- To trigger manual review when ANY field is low: `fields.*.confidence < 0.7`
- The wildcard `*` matches all field names — catches any field below the threshold
- `fields.MerchantName.confidence < 0.7` only checks one specific field (too narrow)
- `fields.ReceiptType.confidence > 0.7` checks if high (wrong direction for triggering review)

---

## Comparisons (X vs Y tables)

### Suggester vs Synonym Map

| Feature             | Suggester                               | Synonym Map                                 |
| ------------------- | --------------------------------------- | ------------------------------------------- |
| Purpose             | Autocomplete / search-as-you-type       | Expand search terms with equivalents        |
| Scope               | Per-index (one only)                    | Top-level resource, assigned to fields      |
| Query API           | `/docs/autocomplete` or `/docs/suggest` | Transparent — applied during regular search |
| Requires reindex?   | Yes (must exist before first index)     | No — immediate                              |
| Works with filters? | N/A                                     | No — free-text search only                  |

### analyzer vs searchAnalyzer vs indexAnalyzer

| Property         | When Used                      | For Suggesters?                          |
| ---------------- | ------------------------------ | ---------------------------------------- |
| `analyzer`       | Both index-time and query-time | Yes — set this                           |
| `indexAnalyzer`  | Index-time only                | N/A for suggesters                       |
| `searchAnalyzer` | Query-time only                | No — don't set this for suggester fields |

### Form Recognizer vs Computer Vision Read API

| Feature               | Form Recognizer (Document Intelligence) | Computer Vision Read API |
| --------------------- | --------------------------------------- | ------------------------ |
| Structured extraction | Key-value pairs, tables, fields         | Plain text only          |
| Custom models         | Yes — train on your document layout     | No                       |
| Prebuilt models       | Receipt, invoice, ID, business card     | N/A                      |
| Endpoint prefix       | `/formrecognizer/`                      | `/vision/`               |

---

## Common Traps & Misconceptions

1. **"One suggester per field"** — WRONG. One suggester per index, with multiple `sourceFields` in one array.

2. **`searchAnalyzer` for suggesters** — WRONG. Use `analyzer` property. `searchAnalyzer` is for query-time analysis only and doesn't affect suggester tokenization.

3. **Search endpoint for autocomplete** — WRONG. Use the autocomplete endpoint (`/docs/autocomplete`), not the search endpoint (`/docs/search`).

4. **Document extraction skill with Cosmos DB** — WRONG. Document extraction is for files (Blob Storage). Cosmos DB stores JSON — use language detection and text translation skills directly.

5. **`fields.MerchantName.confidence < 0.7` for general review** — TOO NARROW. Use `fields.*.confidence < 0.7` to catch ANY field below threshold.

6. **Owner role for QnA Maker publish** — TOO PERMISSIVE. Contributor can publish and do everything except add role members. Owner adds unnecessary permissions.

7. **`api.cognitive.microsofttranslator.com` is always correct** — DEPENDS. For data residency (e.g., US processing), use regional endpoint `api-nam.cognitive.microsofttranslator.com`. The global endpoint routes to nearest datacenter.

8. **Entity Recognition v3 has `includeTypelessEntities`** — NO. That's v2 only. v3 uses `categories` array and outputs typed entities by default.

---

## Cross-Domain Quiz Question Refreshers

| Concept                                            | Key Fact                                                                                                                                                                             | Trap                                                                                                                                |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Video Indexer custom language model** (Domain 4) | Upload adaptation text files with domain-specific jargon → train → select when uploading/reindexing video. Fixes misrecognized words like "Kubernetes" → "communities"               | Not audio indexing, not multi-language detection, not Person model — those serve different purposes                                 |
| **Translator API REST URI** (Domain 5)             | Base: `api.cognitive.microsofttranslator.com`, Path: `/translate`, API version: `3.0`. For US data residency: `api-nam.cognitive.microsofttranslator.com`                            | Don't swap Box 1 and Box 2 — base URL comes first, then path                                                                        |
| **QnA Maker RBAC** (Domain 1/5)                    | AllUsers → **QnA Maker Editor** (edit Q&As, no publish). LeadershipTeam → **Contributor** (publish + everything except add role members)                                             | Owner is too permissive — grants ability to manage role assignments. Contributor is least privilege for publish                     |
| **Adaptive Card templating** (Domain 3/5)          | Data binding: `${name.en}` or `${name[language]}` for multilingual. Conditional: `"$when": "${stockLevel != 'OK'}"`. Alt text: `${image.altText.en}` or `${image.altText[language]}` | Box order: name → $when condition → image.altText. Don't confuse `.en` (dot notation) with `[language]` (bracket/variable notation) |

---

## Adaptive Cards Deep Dive (Quiz Questions 10-11)

Given product JSON:

```json
{
	"sku": "b1",
	"name": { "en": "Bicycle", "es": "Bicicleta" },
	"stockLevel": "Out of Stock",
	"image": {
		"uri": "https://...",
		"altText": { "en": "A bicycle", "es": "Una bicicleta" }
	}
}
```

**Pattern 1 — Dot notation (`.en`)**:

- Box 1 (product name): `name.en`
- Box 2 (show warning when not OK): `"$when": "${stockLevel != 'OK'}"`
- Box 3 (image alt text): `image.altText.en`

**Pattern 2 — Bracket notation (`[language]`)**:

- Box 1 (product name): `name[language]` — dynamic language variable
- Box 2 (conditional warning): `"$when": "${stockLevel != 'OK'}"`
- Box 3 (image alt text): `image.altText[language]`

**Key rule**: The `$when` property controls conditional rendering. An element with `"$when": "${stockLevel != 'OK'}"` only renders when stock level is NOT "OK" — perfect for showing warnings on low/out-of-stock items.

---

## Quick Reference Card

### AI Search Pipeline

```
Data Source → Indexer → [Skillset] → Index → Query
                                      ↓
                              Suggesters (1 per index)
                              Synonym Maps (per field)
```

### Suggester Checklist

- [ ] One suggester, multiple sourceFields
- [ ] Fields are `searchable: true`, type `Edm.String`
- [ ] Set `analyzer` (NOT `searchAnalyzer`)
- [ ] Query: POST `/docs/autocomplete` with `suggesterName`

### Synonym Map Checklist

- [ ] Create as top-level resource (`POST /synonymmaps`)
- [ ] Format: `"solr"` with newline-delimited rules
- [ ] Assign via field's `synonymMaps` array in index definition
- [ ] Only works with free-text search (not filters/facets/autocomplete)

### Document Intelligence Endpoints

| Model            | Endpoint                                               |
| ---------------- | ------------------------------------------------------ |
| Custom           | `/formrecognizer/v2.0/custom/models/{modelId}/analyze` |
| Receipt          | `/formrecognizer/v2.0/prebuilt/receipt/analyze`        |
| Confidence check | `fields.*.confidence < 0.7` (wildcard)                 |

### Translator REST URI

```
POST https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=fr
POST https://api-nam.cognitive.microsofttranslator.com/translate?api-version=3.0&to=fr  (US residency)
```

### QnA Maker Roles (Least Privilege)

| Need                           | Role                        |
| ------------------------------ | --------------------------- |
| Edit Q&As only                 | QnA Maker Editor            |
| Publish KB                     | Contributor                 |
| Everything including role mgmt | Owner (avoid unless needed) |

---

## Related Questions in questions.json

| #   | ID                   | Topic | Tests                                                                               |
| --- | -------------------- | ----- | ----------------------------------------------------------------------------------- |
| 1   | l2zlMTc56FgsfnTbf05H | T10   | Video Indexer custom language model for jargon                                      |
| 2   | SR2xMgYCGQKsm6JNkKG3 | T11   | Translator API REST URI construction                                                |
| 3   | uuJ4GqKtlV57PuyfAbtb | T12   | Form Recognizer confidence wildcard expression                                      |
| 4   | 9f1dU6JmdvlbRkAZfqb6 | T13   | AI Search autocomplete — 3 actions (suggester + analyzer + autocomplete endpoint)   |
| 5   | MjSWjHmpS3B0PzzepA7t | T14   | Synonym map for equivalent terms                                                    |
| 6   | P4nMr5NK2YJrJJeM7imu | T14   | Document Intelligence API endpoints (custom + receipt)                              |
| 7   | TIRfo1NkZiPklmEauSnC | T14   | Cosmos DB indexer + language detection + text translation (NOT document extraction) |
| 8   | y9Zi9GjzdrqTnPW8taVo | T14   | Entity Recognition skill JSON structure                                             |
| 9   | MPgzeUdDCGnnoCGtkeGe | T15   | QnA Maker RBAC — Editor vs Contributor                                              |
| 10  | Z0bXFl0VstaAKFmiPykK | T15   | Adaptive Card — name.en, $when, image.altText.en                                    |
| 11  | cmfzGsVPqHQibIyHSCyd | T15   | Adaptive Card — name[language], $when, image.altText[language]                      |

Quiz command:

```powershell
python quiz_runner.py questions.json --day-lock 28 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [Configure a suggester for autocomplete and suggestions](https://learn.microsoft.com/en-us/azure/search/index-add-suggesters)
- [Add synonyms in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-synonyms)
- [Entity Recognition cognitive skill (v3)](https://learn.microsoft.com/en-us/azure/search/cognitive-search-skill-entity-recognition-v3)
- [Document Extraction cognitive skill](https://learn.microsoft.com/en-us/azure/search/cognitive-search-skill-document-extraction)
- [Translator v3.0: Translate API reference](https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/v3/translate)
- [Translator v3.0: Base URLs and regional endpoints](https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/v3/reference)
- [Customize a language model with Azure AI Video Indexer](https://learn.microsoft.com/en-us/azure/azure-video-indexer/customize-language-model-overview)
- [QnA Maker RBAC — Collaborate with authors and editors](https://learn.microsoft.com/en-us/previous-versions/azure/ai-services/qnamaker/concepts/role-based-access-control)
- [Document Intelligence confidence scores](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/concept/accuracy-confidence)

---

## Notes (your own words — fill this in after studying)

_(Review the traps section carefully — the quiz tests several "which property goes where" and "which endpoint" patterns.)_
