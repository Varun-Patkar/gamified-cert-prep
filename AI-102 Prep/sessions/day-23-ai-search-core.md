# Day 23: AI Search Core — Index, Data Source, Indexer, Skillset Fundamentals

**Date**: 2026-05-28
**Domain**: Domain 6 — Implement knowledge mining and information extraction solutions (15–20%)
**Subtopics**: Index architecture, data sources, indexers, skillsets, knowledge store projections, query fundamentals
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)

- **Index** = your searchable content store. Defined by a schema of typed fields with attributes (searchable, filterable, sortable, facetable, retrievable). Key field must be `Edm.String`.
- **Data source** = connection object pointing to external data (Blob Storage, Cosmos DB, SQL, etc.). Independent of indexers — reusable.
- **Indexer** = crawler that pulls data from a data source into an index. 4 stages: document cracking → field mappings → skillset execution → output field mappings.
- **Skillset** = pipeline of AI skills (built-in or custom) attached to an indexer. Max 30 skills per skillset. Produces an enriched document tree.
- **Knowledge store** = optional Azure Storage output (tables, objects/blobs, files) for downstream analytics. Defined inside the skillset, not the indexer.
- **Query types**: full-text, vector, hybrid, agentic retrieval. Lucene syntax for fuzzy/wildcard/regex/proximity.
- **Custom skills** use `WebApiSkill` type — wrap external code (e.g., Azure Function) with the standard skill interface.
- Free tier: 3 indexes, 3 indexers, 50 MB storage, no SLA. S3 HD: optimized for multitenancy (3000 indexes) but **no indexer support**.

---

## Learning Objectives

After this session you should be able to:

1. Describe the four core objects (index, data source, indexer, skillset) and how they relate
2. Design an index schema with appropriate field attributes for a given scenario
3. Explain the four stages of indexer execution
4. Distinguish built-in skills from custom skills and know when each applies
5. Define knowledge store projections (table, object, file) and their storage targets
6. Choose the correct query syntax for filtering, sorting, wildcards, and fuzzy search
7. Know key service limits by tier (indexes, skillsets, indexer run times, storage)

---

## Key Concepts

### 1. Search Index

A search index is a **schema + data** stored on your search service. Conceptually like a database table — documents ≈ rows, fields ≈ columns.

**Field attributes** (these drive exam questions):

| Attribute     | Purpose                                              | Exam trap                                                      |
| ------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| `searchable`  | Full-text search (tokenized via analyzers)           | Only `Edm.String` / `Collection(Edm.String)` can be searchable |
| `filterable`  | Used in `$filter` expressions                        | Filterable strings are **exact match only** (no word-breaking) |
| `sortable`    | Used in `$orderby`                                   | `Collection(Edm.String)` fields **cannot** be sortable         |
| `facetable`   | Used for faceted navigation (hit counts by category) | `Edm.GeographyPoint` **cannot** be facetable                   |
| `key`         | Unique document identifier                           | **Must be `Edm.String`**, exactly one per index                |
| `retrievable` | Returned in search results                           | Can be `false` for fields used only for filtering/scoring      |

> **Exam trap**: Once an index is created, existing field definitions are **locked**. You cannot change a field's type or attributes — you must drop and rebuild the index. You _can_ add new fields.

**REST defaults**: searchable=true, retrievable=true for string fields. **.NET SDK defaults**: everything disabled unless explicitly set.

### 2. Data Source

A data source is an **independent connection object** that an indexer references. It stores:

- Connection string (or managed identity reference)
- Container/table/collection name
- Optional query to filter source data

**Supported data sources** (exam favorites):

| Source                    | Key notes                                         |
| ------------------------- | ------------------------------------------------- |
| Azure Blob Storage        | Most common for AI enrichment; PDFs, images, docs |
| Azure Cosmos DB (SQL API) | JSON documents; MongoDB/Gremlin APIs in preview   |
| Azure SQL Database        | Rows from tables/views                            |
| Azure Table Storage       | Key-value pairs                                   |
| Azure Data Lake Gen2      | Hierarchical namespace blobs                      |
| SharePoint Online         | Preview; supports user permission inheritance     |
| OneLake (Fabric)          | Preview                                           |

> **Exam trap**: One indexer can only consume **one data source** at a time. To combine multiple sources into one index, use multiple indexers targeting the same index.

### 3. Indexer

The indexer is the **execution engine** that orchestrates data ingestion. It runs on-demand or on a schedule (minimum every 5 minutes).

**Four stages of indexer execution:**

```
1. Document Cracking  →  Open files, extract text + images
2. Field Mappings     →  Map source fields to index fields (rename, type convert)
3. Skillset Execution →  Run AI enrichment pipeline (optional)
4. Output Field Mappings → Map enriched document nodes to index fields
```

Key facts:

- Indexer detects changes automatically for Blob Storage; other sources need change detection configured
- Max running time: **2 hours** (public environment) or 24 hours (private)
- Free tier: 1–3 min for blobs, 1 min for others
- Max 30 skills per skillset
- S3 HD tier: **no indexer support** — must use push API
- Max document size for push API: **16 MB**

### 4. Skillset

A skillset is a **collection of AI skills** that process content during indexer execution. It produces an **enrichment tree** — a hierarchical in-memory document.

**Built-in skill categories:**

| Category    | Skills                                                              | Backed by             |
| ----------- | ------------------------------------------------------------------- | --------------------- |
| Vision      | OCR, Image Analysis                                                 | Azure Vision          |
| Language    | Entity Recognition, Key Phrases, Sentiment, PII, Language Detection | Azure Language        |
| Translation | Text Translation                                                    | Translator            |
| Utility     | Text Split (chunking), Shaper, Conditional, Text Merge              | N/A (no billable API) |
| Embedding   | Azure OpenAI Embedding, Azure Vision Multimodal Embedding           | Azure OpenAI / Vision |

**Custom skills** (`#Microsoft.Skills.Custom.WebApiSkill`):

- Wrap external code (typically an Azure Function) behind the standard skill interface
- Same structure: type, context, inputs, outputs
- URI points to your function endpoint
- Used for any processing not covered by built-in skills

**Skill context**: determines at what level the skill operates

- `/document` — once per document (default)
- `/document/pages/*` — once per page/chunk
- `/document/normalized_images/*` — once per image

**Billing**: Built-in skills that call Foundry Tools APIs require attaching a **Foundry resource key** in the skillset definition (`cognitiveServices`). Utility skills are free.

### 5. Knowledge Store

A knowledge store is an **optional Azure Storage destination** for skillset output. Defined inside the skillset (not the indexer).

**Three projection types:**

| Type    | Storage target      | Use case                                                |
| ------- | ------------------- | ------------------------------------------------------- |
| Tables  | Azure Table Storage | Rows/columns for Power BI, data frames, normalized data |
| Objects | Azure Blob Storage  | Full JSON documents (one blob per document)             |
| Files   | Azure Blob Storage  | Normalized binary image files                           |

> **Exam trap**: Projections within the **same group** are automatically related (share generated keys). Projections in **different groups** are mutually exclusive. The Shaper skill is commonly used to define the structure of table projections.

### 6. Query Fundamentals

| Query type    | Syntax / parameter | Notes                                                        |
| ------------- | ------------------ | ------------------------------------------------------------ |
| Simple search | `queryType=simple` | Default; supports `+`, `-`, `""`, `*`, `()`                  |
| Full Lucene   | `queryType=full`   | Fuzzy (`~`), wildcard (`*`, `?`), regex, proximity, boosting |
| Filter        | `$filter=`         | OData syntax; exact match on filterable fields               |
| Orderby       | `$orderby=`        | Sorting; max 32 fields                                       |
| Facets        | `facets=`          | Returns category counts for facetable fields                 |
| Select        | `$select=`         | Limits returned fields                                       |

> **Exam trap**: `$filter` text comparisons are **case-sensitive** and **exact match** (no tokenization). `$filter=field eq 'sunny'` ≠ `$filter=field eq 'sunny day'`.

---

## Decision Framework: When to Use What

```
Need to get data into an index?
├── Data in supported Azure source? → Use INDEXER (pull model)
│   ├── Need AI processing? → Attach SKILLSET
│   └── Just raw data? → Indexer with field mappings only
└── Data not in supported source / need real-time sync? → Use PUSH API

Need to store enriched output outside the index?
├── For Power BI / analytics → Knowledge store TABLE projections
├── For downstream JSON processing → Knowledge store OBJECT projections
└── For binary images → Knowledge store FILE projections
```

---

## Comparisons (Exam Favorites)

| Concept   | Field Mappings                      | Output Field Mappings             |
| --------- | ----------------------------------- | --------------------------------- |
| When      | Stage 2 (before skillset)           | Stage 4 (after skillset)          |
| Source    | Source data fields                  | Enrichment tree nodes             |
| Required? | Optional (auto-maps matching names) | Required for any enriched content |

| Concept       | Push API                  | Pull (Indexer)             |
| ------------- | ------------------------- | -------------------------- |
| Trigger       | Your code sends JSON docs | Indexer crawls data source |
| Real-time     | Yes                       | Minimum 5-min schedule     |
| AI enrichment | No (pre-process yourself) | Yes (via skillset)         |
| S3 HD support | Yes (only option)         | No                         |

---

## Important Details for Exam

- **Free tier**: 3 indexes, 3 indexers, 3 skillsets, 50 MB storage, no SLA
- **Basic**: 5 or 15 indexes (post-2017), 15 GB–160 GB storage
- **S3 HD**: 1000 indexes/partition, 3000/service — but **NO indexer support**
- **Max skills per skillset**: 30
- **Max fields per index**: 1000 (Basic: 100)
- **Max suggesters per index**: 1
- **Max document size (push API)**: 16 MB JSON
- **Max documents per index**: 24 billion (Basic/S1/S2/S3)
- **API keys**: 2 admin keys + up to 50 query keys per service
- **SLA requires**: 2+ replicas for queries, 3+ replicas for queries+indexing
- **Existing field definitions are locked** — cannot modify, only add new fields
- **Index aliases**: allow swapping indexes without changing app code

---

## Common Traps & Misconceptions

1. **"Skillsets are defined in the indexer"** — No! Skillsets are top-level resources. The indexer _references_ a skillset but doesn't contain it.
2. **"Knowledge store is defined in the indexer"** — No! It's defined **inside the skillset** definition.
3. **"S3 HD supports indexers"** — No! S3 HD only supports push API.
4. **"You can modify existing field types"** — No! Field definitions are locked after creation. Drop and rebuild.
5. **"Filter expressions are tokenized"** — No! `$filter` uses exact, case-sensitive matching.
6. **"Output field mappings and field mappings are the same"** — No! Field mappings map source → index. Output field mappings map enrichment tree → index.
7. **"Free tier has SLA"** — No! SLA only on billable tiers with 2+ replicas.

---

## Quick Reference Card

| Object          | What it is                  | Created via             | Key relationship              |
| --------------- | --------------------------- | ----------------------- | ----------------------------- |
| Index           | Schema + searchable content | REST / SDK / Portal     | Target of indexer             |
| Data source     | Connection to external data | REST / SDK / Portal     | Input for indexer             |
| Indexer         | Crawler/orchestrator        | REST / SDK / Portal     | Connects data source → index  |
| Skillset        | AI enrichment pipeline      | REST / SDK / Portal     | Referenced by indexer         |
| Knowledge store | Azure Storage output        | Defined within skillset | Uses skillset enrichment tree |

**Enrichment pipeline order**: Data Source → Indexer → [Document Cracking → Field Mappings → Skillset → Output Field Mappings] → Index + Knowledge Store

---

## Hands-On Lab (optional): Design Index Schema for RAG Use-Case

**Scenario**: You're building a RAG solution for an internal knowledge base of technical documentation stored in Azure Blob Storage (PDFs + Word docs).

Design exercise — answer these questions:

1. **What data source type?** → Azure Blob Storage
2. **What skills do you need in the skillset?**
   - OCR skill (for scanned PDFs)
   - Text Split skill (chunking for vector search)
   - Azure OpenAI Embedding skill (vectorization)
   - Language Detection skill (multilingual docs)
3. **What fields in the index?**
   - `id` (Edm.String, key)
   - `content` (Edm.String, searchable)
   - `content_vector` (Collection(Edm.Single), vector field)
   - `title` (Edm.String, searchable, filterable, retrievable)
   - `language` (Edm.String, filterable)
   - `metadata_storage_path` (Edm.String, retrievable)
4. **Do you need output field mappings?** → Yes, for enriched fields (chunks, vectors, detected language)
5. **Knowledge store needed?** → Optional; table projections if you want Power BI analytics on content

---

## Cross-Domain Quiz Question Refreshers

All 11 Day 23 quiz questions are actually Bot Framework / chatbot carryover from Domain 5. Here's what each tests:

| #   | Concept                                                  | Key Fact                                                                                                                           | Trap                                                                                                                               |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Bot Framework `.chat` file syntax                        | Order: **Typing** activity → **carousel** layout → **adaptivecard** attachment                                                     | Carousel = horizontally scrollable collection of cards, not a card type                                                            |
| 2   | `OnMembersAddedAsync` in Teams                           | Bot greets **only the new member**, not all existing members                                                                       | Don't confuse with broadcast — it iterates `membersAdded` collection                                                               |
| 3   | Content Moderator Text API                               | Sexually explicit content = **Classification** section, **Category 1**                                                             | Category 1 = sexually explicit; Category 2 = suggestive; Category 3 = offensive. Section is "Classification", not "Terms" or "PII" |
| 4   | Bot Emulator auth settings                               | Three settings: (1) **ngrok path**, (2) **Run ngrok on start**, (3) **Use v1.0 auth tokens**                                       | All three needed for credential-prompted testing; v1.0 auth tokens is the one people forget                                        |
| 5   | Multilingual chatbot APIs                                | **Sentiment Analysis** (positive/negative) + **Detect Language** (multilingual). Answer: BD                                        | Key Phrases extracts topics, not sentiment. Entity Recognition doesn't detect language                                             |
| 6   | Bot card types                                           | Card with image + structured layout = **Adaptive Card**                                                                            | Hero Card also shows images but Adaptive Card is the flexible JSON-template card                                                   |
| 7   | Composer dialog memory scopes                            | `dialog.` scope = properties tied to **active dialog**, disposed when dialog ends                                                  | `user.` persists across conversations; `conversation.` persists for session; `turn.` dies after single turn                        |
| 8   | Q&A alternative phrasing                                 | Creating an **entity for "cost"** does NOT fix variant question phrasing. Answer: **No**                                           | Fix = add alternative phrasing to the Q&A pair, not create entities                                                                |
| 9   | Q&A chitchat source for "spurious" (off-topic) questions | Changing to `qna_chitchat_friendly.tsv` does NOT add formality. Answer: **No**                                                     | "Friendly" ≠ "formal". Need `qna_chitchat_professional.tsv` for formal tone                                                        |
| 10  | Bot Channels Registration                                | Required: **Microsoft App ID** (C) + **Microsoft App Password/Secret** (E)                                                         | Not botId, tenantId, or objectId                                                                                                   |
| 11  | Composer multi-bot dispatch                              | Combine 5 bots: **Change Recognizer/Dispatch type** (B) + **Create Orchestrator model** (C) + **Install Orchestrator package** (F) | Don't confuse with creating a custom recognizer JSON or Composer extension                                                         |

### Composer Memory Scopes (Exam Cheat Sheet)

| Scope           | Lifetime                        | Access pattern              |
| --------------- | ------------------------------- | --------------------------- |
| `turn.`         | Single turn only                | `turn.propertyName`         |
| `dialog.`       | Active dialog (disposed at end) | `dialog.propertyName`       |
| `conversation.` | Entire conversation session     | `conversation.propertyName` |
| `user.`         | Persists across conversations   | `user.propertyName`         |

### Content Moderator Classification Categories

| Category | Content type        |
| -------- | ------------------- |
| 1        | Sexually explicit   |
| 2        | Sexually suggestive |
| 3        | Offensive           |

---

## Related Questions in questions.json

| ID                     | Summary                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `temJP5Y9l1JojFO1UqeW` | .chat file: Typing → carousel → adaptivecard                 |
| `tggEkigssu3zb844Wo2G` | OnMembersAddedAsync — greets new member only                 |
| `tjlYJPVxlCDht5zQeb94` | Content Moderator: Classification section, Category 1        |
| `u6d41sICKKr2wzNRrr0u` | Emulator: ngrok path + run ngrok + v1.0 auth                 |
| `vCT7L6F6K27noaZ2qQch` | Multilingual bot: Sentiment Analysis + Detect Language (BD)  |
| `vWWq8vBrtX3SgSzR6PyZ` | Card with image = Adaptive Card                              |
| `w6j5wnsNOpRiUQOqSbRr` | Composer memory: dialog scope for active dialog              |
| `x0H5iHo7VyhU65lwCy3c` | Q&A: entity for "cost" ≠ alternative phrasing (No)           |
| `xVjO016awwViRJcIZqc7` | Q&A chitchat: friendly ≠ formal (No)                         |
| `yp8jQkEl96qBXAb8Bg48` | Bot Channels Registration: App ID + App Password (CE)        |
| `yqEfHvMsBeVx1CZL2jtI` | Composer dispatch: BCF (recognizer + orchestrator + package) |

Quiz command:

```powershell
python quiz_runner.py questions.json --day-lock 23 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [What is Azure AI Search?](https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search)
- [Search indexes in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-what-is-an-index)
- [Indexers in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-indexer-overview)
- [AI enrichment in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/cognitive-search-concept-intro)
- [Create a skillset in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/cognitive-search-defining-skillset)
- [Knowledge store projections](https://learn.microsoft.com/en-us/azure/search/knowledge-store-projection-overview)
- [Querying in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-query-overview)
- [Service limits in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-limits-quotas-capacity)
- [Choose a service tier](https://learn.microsoft.com/en-us/azure/search/search-sku-tier)

---

## Notes (your own words — fill this in after studying)

_(Space for your own notes after going through the material)_
