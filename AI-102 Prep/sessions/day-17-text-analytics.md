# Day 17: Text Analytics — Entity Extraction, Sentiment, Language Detection, PII

**Date**: 2026-05-22
**Domain**: Domain 5 — Implement Natural Language Processing Solutions (15–20%)
**Subtopics**: Key phrase extraction, entity recognition, sentiment analysis, language detection, PII detection, translation basics
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)

- **Key Phrase Extraction** returns noun phrases (e.g., "food", "wonderful staff"), NOT articles/prepositions. No confidence scores on key phrases.
- **NER** (Named Entity Recognition) identifies people, places, organizations, quantities — use `RecognizeEntities`. Different from `ExtractKeyPhrases`.
- **Sentiment Analysis** returns positive/neutral/negative labels at both document and sentence level, with confidence scores 0–1.
- **PII Detection** finds SSNs, credit cards, phone numbers, etc. — can redact them. Uses `RecognizePiiEntities`.
- **Language Detection** returns ISO 639-1 language code + confidence score. Works even on ambiguous/mixed text.
- **Document Intelligence** custom models: add new format → add to existing training set + retrain (don't create new model).
- **AI Search indexers** support Azure SQL, Cosmos DB (SQL API), Table Storage, Blob, ADLS Gen2 — NOT on-premises SQL Server directly.

---

## Learning Objectives

After this session you should be able to:

1. Explain the difference between key phrase extraction, NER, sentiment analysis, and PII detection
2. Know the SDK method names and what each returns
3. Understand Document Intelligence custom model update workflow, file limits, ARM deployment, and prebuilt models
4. Explain AI Search API key types, rotation procedures, security trimming, knowledge store projections, and indexer-supported data sources

---

## Key Concepts

### 5.1.1 Key Phrase Extraction

**What it does**: Identifies main concepts/talking points in unstructured text. Returns a list of strings representing key phrases.

**Key behavior**:

- Input: `"The food was delicious and the staff were wonderful"` → Output: `["food", "wonderful staff"]`
- Input: `"the cat sat on the mat"` → Output: `["cat", "mat"]` — articles ("the"), prepositions ("on"), and verbs ("sat") are NOT key phrases
- **No confidence scores** are returned for key phrases (unlike NER or sentiment)
- Returns a flat list of strings, not categorized entities

**SDK method**: `ExtractKeyPhrases` / `extract_key_phrases`

**API endpoint**: `POST {endpoint}/language/:analyze-text?api-version=2023-04-01`

**Limits**: Up to 5,120 characters per document, 1,000 documents per request.

### 5.1.2 Named Entity Recognition (NER)

**What it does**: Identifies and categorizes entities in text — people, locations, organizations, dates, quantities, URLs, emails, etc.

**Key behavior**:

- Input: `"John went to Paris on January 5th"` → Entities: John (Person), Paris (Location), January 5th (DateTime)
- Returns entities with `text`, `category`, `subcategory`, and `confidenceScore`
- **Has confidence scores** (unlike key phrases)
- Prebuilt categories: Person, Location, Organization, DateTime, Quantity, URL, Email, IP Address, etc.

**SDK method**: `RecognizeEntities` / `recognize_entities`

**Exam trap**: Don't confuse `RecognizeEntities` (NER) with `ExtractKeyPhrases` (key phrases). They are different features with different outputs.

### 5.1.3 Sentiment Analysis

**What it does**: Evaluates text and returns sentiment labels (positive, neutral, negative) with confidence scores.

**Key behavior**:

- Returns sentiment at **both document level and sentence level**
- Confidence scores: three values (positive, neutral, negative) that sum to 1.0
- **Opinion mining** (aspect-based): can drill down to specific targets (e.g., "the food was great but service was slow" → food=positive, service=negative)

**SDK method**: `AnalyzeSentiment` / `analyze_sentiment`

- With opinion mining: pass `show_opinion_mining=True`

### 5.1.4 Language Detection

**What it does**: Detects the language of input text and returns ISO 639-1 code + confidence score.

**Key behavior**:

- Returns `name` (e.g., "English"), `iso6391Name` (e.g., "en"), and `confidenceScore`
- For ambiguous text, returns `"unknown"` with `iso6391Name = "(Unknown)"`
- Can handle mixed-language documents (returns dominant language)

**SDK method**: `DetectLanguage` / `detect_language`

### 5.1.5 PII Detection

**What it does**: Identifies and optionally redacts personally identifiable information — SSNs, credit card numbers, phone numbers, addresses, passport numbers, etc.

**Key behavior**:

- Returns both the entities detected AND a redacted version of the text
- Categories include: Person, PhoneNumber, Email, URL, IPAddress, DateTime, plus financial/government IDs
- Can specify categories to detect or use all defaults
- Domain parameter: `"phi"` for healthcare-specific PII

**SDK method**: `RecognizePiiEntities` / `recognize_pii_entities`

---

## Comparisons (X vs Y tables)

| Feature                  | Method                 | Returns                            | Confidence Score?           | Categories?                 |
| ------------------------ | ---------------------- | ---------------------------------- | --------------------------- | --------------------------- |
| Key Phrase Extraction    | `ExtractKeyPhrases`    | List of strings (noun phrases)     | **No**                      | No                          |
| Named Entity Recognition | `RecognizeEntities`    | Entities with category/subcategory | **Yes**                     | Person, Location, Org, etc. |
| Sentiment Analysis       | `AnalyzeSentiment`     | Positive/Neutral/Negative + scores | **Yes** (3 scores sum to 1) | N/A                         |
| PII Detection            | `RecognizePiiEntities` | Entities + redacted text           | **Yes**                     | SSN, CC#, Phone, etc.       |
| Language Detection       | `DetectLanguage`       | Language name + ISO code + score   | **Yes**                     | N/A                         |

---

## Important Details for Exam

- Key phrases are **noun phrases** — articles, prepositions, conjunctions, and verbs alone are excluded
- Key phrase extraction does **NOT** return confidence scores — this is a classic exam trap
- Sentiment analysis returns scores at both **document and sentence** level
- PII detection can return a **redacted text** version — useful for compliance
- All these features are part of the **Azure AI Language** service (formerly Text Analytics / Cognitive Services for Language)
- The unified endpoint pattern: `{endpoint}/language/:analyze-text`
- Container deployment available for: sentiment analysis, key phrase extraction, language detection (for on-prem/edge scenarios)

---

## Common Traps & Misconceptions

1. **"Key phrases have confidence scores"** — FALSE. Key phrases are returned as a flat list of strings with no scores.
2. **"'the' is a key phrase"** — FALSE. Articles, prepositions, and common verbs are not key phrases. Only meaningful noun phrases qualify.
3. **`RecognizeEntities` vs `ExtractKeyPhrases`** — They are different methods. NER returns categorized entities; key phrases returns topic strings.
4. **Sentiment returns a single label** — It returns labels AND three confidence scores (positive, neutral, negative) at both document and sentence level.
5. **PII = NER** — PII detection is specifically for personal data and includes redaction. NER is for general entity categories.

---

## Cross-Domain Quiz Question Refreshers

Most of today's 10 quiz questions test **Document Intelligence** and **AI Search** concepts. These are critical cross-domain topics:

### Document Intelligence (formerly Form Recognizer)

#### Custom Model Update Workflow (Q: IN3ZdM82mBhxh1qHSZ6h)

- To support a new document format: **add the new format to the existing training set and retrain the model**
- Do NOT create a brand new model (wastes effort, loses existing training)
- Do NOT lower confidence/accuracy thresholds (doesn't teach the model anything)
- Minimum 5 labeled samples to train; more = better accuracy

#### Layout Model for Tables (Q: R32JsMZ7630oar4khD86)

- Model ID: **`prebuilt-layout`** — used for extracting tables, text, selection marks, and document structure
- Authentication header: **`Ocp-Apim-Subscription-Key`** (NOT "Secret" or "Authorization")
- `prebuilt-layout` is the correct model for tabular data extraction (not `prebuilt-read` which is text-only, not `prebuilt-document`)
- Layout extracts: pages, paragraphs, tables, selection marks, figures, sections

#### File Size and Dimension Limits (Q: V53zHQhO3vu97NWJ9D7T)

| Constraint                   | Limit                                                 |
| ---------------------------- | ----------------------------------------------------- |
| Max file size (S0 paid tier) | **500 MB**                                            |
| Max file size (F0 free tier) | 4 MB                                                  |
| Min image dimensions         | **50 x 50 pixels**                                    |
| Max image dimensions         | 10,000 x 10,000 pixels                                |
| Max PDF pages (paid)         | 2,000 pages                                           |
| Max PDF pages (free)         | 2 pages                                               |
| Supported formats            | PDF, JPEG/JPG, PNG, BMP, TIFF, DOCX, XLSX, PPTX, HTML |

**Exam scenario**: Given files with various sizes/dimensions, determine which can be analyzed:

- File > 500 MB → **rejected** (exceeds S0 limit)
- Image < 50x50 pixels → **rejected** (below minimum)
- TIFF file within limits → **accepted**

#### ARM Template Deployment (Q: ZAomwNtp8WZ7LTJMSFp0)

- Resource type in ARM template: **`Microsoft.CognitiveServices/accounts`**
- Kind value: **`FormRecognizer`** (the API kind name, even though the service was renamed to Document Intelligence)
- The workflow to get an ARM template: Create resource in portal → Go to resource → Export Template under Automation → Review template

#### Prebuilt Receipt Model — Provisioning (Q: ZKxLxYAb5wJfeCHuo1eA)

- To scan receipts → use **Document Intelligence** (FormRecognizer)
- Standard tier = **S0** (not S1, not Standard — the SKU code is specifically "S0")
- `provision_resource("res1", "FormRecognizer", "S0", "eastus")` — FormRecognizer, not ComputerVision or CustomVision.Prediction
- Prebuilt receipt model ID: `prebuilt-receipt`

### Azure AI Search

#### Indexer-Supported Data Sources (Q: OBCNx6MCuGv5NKM0cLGD)

Natively supported data sources for AI Search indexers:
| Data Source | Supported? |
|---|---|
| Azure SQL Database | ✅ Yes |
| Azure Cosmos DB (SQL/Core API) | ✅ Yes |
| Azure Table Storage | ✅ Yes |
| Azure Blob Storage | ✅ Yes |
| Azure Data Lake Storage Gen2 | ✅ Yes |
| SQL Server on Azure VMs | ✅ Yes |
| Azure SQL Managed Instance | ✅ Yes |
| **On-premises SQL Server** | ❌ **NOT directly supported** |
| Cosmos DB MongoDB API | ✅ (preview) |
| Cosmos DB Gremlin API | ✅ (preview) |
| Cosmos DB Cassandra API | ❌ Not supported |

**Exam scenario**: Finance data is on on-premises SQL Server → must migrate/export to a supported source (e.g., Azure Data Lake Storage, Azure SQL) before indexing.

#### API Key Rotation — Compromised Query Key (Q: PlHlnMEuTmwkUnvOuLE8)

Two types of keys:
| Key Type | Access Level | Count | Purpose |
|---|---|---|---|
| **Admin keys** | Full read-write | 2 (primary + secondary) | Create/modify/delete indexes, indexers, data sources |
| **Query keys** | Read-only (documents only) | 1 default + up to 50 custom | Search queries from client apps |

**If a query key is compromised** (correct rotation procedure):

1. **Add a new query key** (create a replacement)
2. **Change the app to use the new query key**
3. **Delete the compromised query key**

**Trap**: Do NOT regenerate admin keys for a query key compromise. Query keys and admin keys are separate. Query keys can be created/deleted independently; admin keys can only be regenerated (primary/secondary rotation).

#### Security Trimming — Document-Level Filtering (Q: QRGeQeq2XTdAsHivPurV)

Three required actions for document-level security:

1. **Add allowed groups to each index entry** (D) — each document has a `group_ids` field of type `Collection(Edm.String)`, set to `filterable=true`, `retrievable=false`
2. **Retrieve group memberships of the user** (C) — at query time, look up the requesting user's group memberships
3. **Supply the groups as a filter in search requests** (F) — use `search.in()` filter: `group_ids/any(g:search.in(g, 'group1, group2'))`

**NOT needed**: Sending Azure AD access tokens (A), retrieving ALL groups (B), or creating one index per group (E).

#### Knowledge Store Table Projections (Q: RY5LC97H5trG6iDbaWMU)

Three required properties for a table projection node:

1. **`tableName`** — name of the Azure Table Storage table to create
2. **`generatedKeyName`** — column name for the auto-generated unique key per row
3. **`source`** — path to the enrichment tree node (e.g., `/document/tableprojection`)

Example JSON:

```json
{
	"tables": [
		{
			"tableName": "Hotels",
			"generatedKeyName": "HotelId",
			"source": "/document/tableprojection"
		}
	]
}
```

**NOT required**: `dataSource` and `dataSourceConnection` are indexer properties, not projection properties.

Knowledge store projection types:
| Type | Storage Target | Properties |
|---|---|---|
| Tables | Azure Table Storage | tableName, generatedKeyName, source |
| Objects | Azure Blob Storage (JSON) | storageContainer, generatedKeyName, source |
| Files | Azure Blob Storage (binary) | storageContainer, generatedKeyName, source |

---

## Quick Reference Card

| Concept                                   | Key Fact                                                     |
| ----------------------------------------- | ------------------------------------------------------------ |
| Key phrases from "the cat sat on the mat" | `["cat", "mat"]` — no articles/verbs                         |
| Key phrase confidence scores              | **None** — not returned                                      |
| NER method                                | `RecognizeEntities`                                          |
| Sentiment levels                          | Document + Sentence level                                    |
| PII redaction                             | `RecognizePiiEntities` returns redactedText                  |
| DI custom model update                    | Add to existing training set → retrain                       |
| DI file size limit (S0)                   | 500 MB                                                       |
| DI min image size                         | 50 × 50 pixels                                               |
| DI receipt model resource                 | FormRecognizer, SKU = S0                                     |
| DI layout model ID                        | `prebuilt-layout`                                            |
| DI API auth header                        | `Ocp-Apim-Subscription-Key`                                  |
| DI ARM template kind                      | `FormRecognizer`                                             |
| AI Search query key compromised           | Add new key → Update app → Delete old key                    |
| AI Search admin keys                      | 2 keys (primary + secondary), rotate by regenerating         |
| Security trimming fields                  | `Collection(Edm.String)`, filterable=true, retrievable=false |
| Security trimming filter                  | `search.in()` with group IDs                                 |
| Table projection properties               | tableName, generatedKeyName, source                          |
| Indexer: on-prem SQL                      | ❌ Not supported — migrate to Azure first                    |
| Indexer: Cosmos DB SQL API                | ✅ Supported                                                 |
| Indexer: Azure Table Storage              | ✅ Supported                                                 |

---

## Related Questions in questions.json

| ID                   | Summary                                                   |
| -------------------- | --------------------------------------------------------- |
| QSI1usinHgwraJUmnHGi | Key phrase extraction — "the cat sat on the mat" behavior |
| IN3ZdM82mBhxh1qHSZ6h | DI custom model — add new contract format (retrain)       |
| OBCNx6MCuGv5NKM0cLGD | AI Search indexer supported data sources                  |
| PlHlnMEuTmwkUnvOuLE8 | Query key rotation — 3-step procedure                     |
| QRGeQeq2XTdAsHivPurV | Security trimming — 3 actions for doc-level filtering     |
| R32JsMZ7630oar4khD86 | DI layout model for PDF table analysis                    |
| RY5LC97H5trG6iDbaWMU | Knowledge store table projection — 3 properties           |
| V53zHQhO3vu97NWJ9D7T | DI file size/dimension limits                             |
| ZAomwNtp8WZ7LTJMSFp0 | ARM template for Document Intelligence deployment         |
| ZKxLxYAb5wJfeCHuo1eA | Provision FormRecognizer resource, S0 tier                |

Quiz command:

```powershell
python quiz_runner.py questions.json --day-lock 17 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [Key Phrase Extraction Overview](https://learn.microsoft.com/en-us/azure/ai-services/language-service/key-phrase-extraction/overview)
- [Named Entity Recognition Overview](https://learn.microsoft.com/en-us/azure/ai-services/language-service/named-entity-recognition/overview)
- [Sentiment Analysis and Opinion Mining](https://learn.microsoft.com/en-us/azure/ai-services/language-service/sentiment-opinion-mining/overview)
- [Document Intelligence Custom Models](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/concept-custom?view=doc-intel-4.0.0)
- [Document Intelligence Layout Model](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/concept-layout?view=doc-intel-4.0.0)
- [Azure AI Search — API Keys](https://learn.microsoft.com/en-us/azure/search/search-security-api-keys)
- [Security Filters for Trimming Results](https://learn.microsoft.com/en-us/azure/search/search-security-trimming-for-azure-search)
- [Knowledge Store Projections](https://learn.microsoft.com/en-us/azure/search/knowledge-store-projections-examples)
- [Azure AI Search Indexer Overview](https://learn.microsoft.com/en-us/azure/search/search-indexer-overview)

---

## Notes (your own words — fill this in after studying)

_(Leave space for your own notes after going through it)_
