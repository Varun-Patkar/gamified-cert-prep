# Day 24: Query and Enrichment (Azure AI Search)

**Date**: 2026-05-29
**Domain**: Domain 6 — Implement knowledge mining and information extraction (Query + Enrichment portion)
**Subtopics**: Query syntax (filters, sorting, wildcard), enrichment pipeline, skillsets, custom skills
**Estimated study time**: ~0.5 hrs

---

## TL;DR (60-second skim)

- **Wildcard `*` / `?`, fuzzy `~`, regex, proximity, term boosting** all require `queryType=full` (Full Lucene). Simple syntax does **not** support them.
- **`$filter` uses OData syntax** and is **NOT analyzed** — it's a verbatim, case-sensitive exact match. Field must be **filterable**.
- Field attributes are independent: **filterable, sortable, facetable, searchable, retrievable, key**. A field can be retrievable but not searchable, etc.
- **Enrichment pipeline = data source + skillset + index + indexer.** Indexer ties them together; skillset holds the AI skills.
- **Custom Web API skill** (`#Microsoft.Skills.Custom.WebApiSkill`) gets a JSON `values[]` payload (each with `recordId` + `data`) and **must return** `values[]` each with `recordId`, `data`, `errors`, `warnings`.
- **Knowledge store** = optional secondary storage in Azure Storage with **3 projection types: tables, objects (JSON blobs), files (images)**.
- **Embeddings models** turn text into numeric vectors for **cosine similarity** comparison — minimal dev effort, no training.

---

## Learning Objectives

After this session you can:

1. Choose simple vs full Lucene syntax and know which features need full.
2. Build OData `$filter`/`$orderby` queries and know required field attributes.
3. Design a built-in skillset enrichment pipeline for PDFs/images/multi-language.
4. Implement the custom Web API skill input/output contract.
5. Explain knowledge store projections and enrichment caching.
6. (Cross-domain) Pick embeddings models, set chat playground params, choose least-privilege OpenAI roles, and ground chatbots with RAG.

---

## Core Concepts Deep-Dive

### 1. Query syntax: simple vs full Lucene

- **Simple** (default, `queryType=simple`): `+ | - " * ( )` term operators, prefix `*` only at end of term. Good for typical search box.
- **Full** (`queryType=full`): full Apache Lucene. **Required** for: fuzzy `~`, proximity `"term1 term2"~N`, term boosting `term^3`, regex `/pattern/`, wildcard `*` and `?` mid/anywhere, fielded search `fieldName:term`.
- **`searchMode`**: `any` (default, OR across terms) vs `all` (AND — every term must match). Switching to `all` narrows results.

### 2. Filters, sorting, paging (OData)

- **`$filter`** — OData expression on **filterable** fields. **Text is NOT analyzed**: exact, case-sensitive match. Operators: `eq ne gt lt ge le and or not`. Functions: `search.in(field,'a,b,c')`, `search.ismatch`, `geo.distance`, collection lambdas `any()/all()`.
- **`$orderby`** — sort on **sortable** fields, `asc`/`desc`. Can sort by `geo.distance` or `search.score()`.
- **`$top`** = max results returned; **`$skip`** = paging offset; **`$select`** = which (retrievable) fields to return; **`$count=true`** = total matching count.
- Wildcard/fuzzy live in the **`search`** parameter, not `$filter`.

### 3. Field attributes (memorize the matrix)

| Attribute   | Meaning              | Notes                                               |
| ----------- | -------------------- | --------------------------------------------------- |
| searchable  | full-text searchable | only string/Collection(string); incurs tokenization |
| filterable  | usable in `$filter`  | not analyzed (verbatim)                             |
| sortable    | usable in `$orderby` | not for collections                                 |
| facetable   | usable in facets     | drives faceted navigation                           |
| retrievable | returned in results  | turn off to hide but keep indexed                   |
| key         | document ID          | exactly one per index, string                       |

**Trap:** changing most attributes requires a **rebuild** of the index.

### 4. Faceted navigation, scoring profiles, term boosting

- **Facets** = self-service drill-down; each facet click adds a `$filter`. Field must be **facetable**.
- **Scoring profiles** boost relevance by field weights, freshness (`freshness`), magnitude, distance, tag. Defined in index schema.
- **Term boosting** (`term^N`) is a query-time relevance bump — full syntax only.

### 5. Enrichment pipeline & skillsets

Pipeline components: **data source → skillset → index → indexer**.

- **Document cracking**: indexer extracts text + images from source files (PDF, DOCX, images, blobs).
- **Built-in skills**: OCR, Image Analysis, Entity Recognition, Key Phrase Extraction, Language Detection, **Text Translation**, Sentiment, PII Detection, Document Extraction, Text Split (chunking), Azure OpenAI Embedding, Shaper, Conditional, Merge.
- **Enriched document / enrichment tree**: skills read from and write nodes onto an in-memory tree (`/document/...`).
- **Field mappings** = source field → index field (before enrichment). **Output field mappings** = enrichment-tree node → index field (after enrichment). Different things; the exam tests this.
- **Enrichment cache / incremental enrichment**: persists cracked docs + skill outputs in Azure Storage so edits reuse unchanged enrichments (saves OCR/Image cost).

### 6. Custom Web API skill contract (CRITICAL)

- `@odata.type`: `#Microsoft.Skills.Custom.WebApiSkill`; `uri` must be **https**; `httpMethod` PUT/POST; `batchSize` default 1000; `timeout` default 30s (max 230s); `degreeOfParallelism` default 5 (max 10).
- **Input payload** the indexer sends:
  ```json
  {
  	"values": [{ "recordId": "0", "data": { "text": "...", "language": "en" } }]
  }
  ```
- **Output your API must return** (same count, correlated by `recordId`):
  ```json
  {
  	"values": [
  		{
  			"recordId": "0",
  			"data": { "myOutput": "..." },
  			"errors": null,
  			"warnings": null
  		}
  	]
  }
  ```
- `errors` and `warnings` are **required properties** (may be `null`). Records with missing/duplicate `recordId` are discarded.

### 7. Knowledge store

- Optional secondary output in **Azure Storage**, defined **inside the skillset** (`knowledgeStore` with `storageConnectionString` + `projections`).
- **Projection types**: `tables` (Table Storage, for Power BI), `objects` (JSON blobs), `files` (extracted images to Blob). Use a **Shaper skill** to build the shape before projecting.
- No query API — consume via Storage Explorer, Power BI, Data Factory.

---

## Query Syntax Cheat-Sheet

| Need              | Parameter / syntax                          | queryType |
| ----------------- | ------------------------------------------- | --------- |
| Plain term search | `search=hotel`                              | simple    |
| AND all terms     | `searchMode=all`                            | both      |
| Filter (exact)    | `$filter=Rating ge 4 and City eq 'Seattle'` | n/a       |
| In list           | `$filter=search.in(Tag,'wifi,pool')`        | n/a       |
| Sort              | `$orderby=Rating desc`                      | n/a       |
| Paging            | `$top=10&$skip=20`                          | n/a       |
| Pick fields       | `$select=Name,Rating`                       | n/a       |
| Total count       | `$count=true`                               | n/a       |
| Wildcard          | `search=surf*` / `se?rch`                   | **full**  |
| Fuzzy             | `search=blue~`                              | **full**  |
| Proximity         | `search="hotel airport"~5`                  | **full**  |
| Term boost        | `search=luxury^3 budget`                    | **full**  |
| Regex             | `search=/[mh]otel/`                         | **full**  |

---

## Custom Skill WebApi Contract (quick recall)

- IN: `values[] → {recordId, data{}}`
- OUT: `values[] → {recordId, data{}, errors, warnings}`
- Map skill output to index via **output field mapping**, not field mapping.

---

## Cross-Domain Quiz Question Refreshers

| #   | Topic | Concept                                                | Key fact                                                                                                                                         | Trap                                                                                                  |
| --- | ----- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 1   | T5    | QnA Maker **active learning**                          | Order: show suggestions → accept/reject → **Save and Train** → **Publish**. Clusters 5+ similar queries every 30 min.                            | Must Save+Train before Publish; publish is last.                                                      |
| 2   | T6    | **Anomaly Detector container** offline deploy          | Order: install Docker → `docker pull` image → `docker run` with billing/ApiKey/EULA → query.                                                     | Container still needs Azure billing connectivity even when "offline"; can't skip ApiKey/Billing args. |
| 3   | T6    | **Skillset for PDFs** (e-commerce)                     | Pipeline: Blob (data source) → **Computer Vision / OCR Read** (text+images from PDF) → **Translator** (EN/ES/PT) → Azure Files (store enriched). | **Custom Vision is wrong** — that's classification/training, not OCR/extraction.                      |
| 4   | T7    | Semantic similarity → numeric vectors, min effort      | Use an **embeddings** model.                                                                                                                     | Not GPT-3.5/4 (generation) or DALL-E (images).                                                        |
| 5   | T7    | LLM response reasoning (prompt context/tokens)         | Consensus pattern No/Yes/Yes — about how prompt context + token limits shape output.                                                             | Watch how added context changes the deterministic vs varying answers.                                 |
| 6   | T7    | Chat playground params                                 | Reduce **word repetition** → raise **Frequency penalty**. Reduce randomness → lower **Temperature**.                                             | **Presence penalty** ≠ frequency penalty (presence = new-topic nudge).                                |
| 7   | T7    | 10k ASCII files, find phrases by **cosine similarity** | **text-embedding-ada-002**.                                                                                                                      | Vector/math comparison = embeddings, not a completion model.                                          |
| 8   | T7    | Upload datasets + **fine-tune**, least privilege       | **Cognitive Services OpenAI Contributor**.                                                                                                       | OpenAI **User** = inference only (can't fine-tune); generic **Contributor** = too broad.              |
| 9   | T7    | "On your data" code completion                         | `ChatCompletionsOptions()` + `AzureCognitiveSearchChatExtensionConfiguration`.                                                                   | Azure OpenAI On Your Data wires AI Search as a data source.                                           |
| 10  | T7    | Travel chatbot accuracy of reservations                | **Ground the model with the travel DB (RAG)**.                                                                                                   | Lowering temperature alone doesn't add facts; grounding beats it.                                     |
| 11  | T7    | Console app calling Azure OpenAI                       | `OpenAIClient client = ...` + `GetCompletions`; read `response.Value.Choices[0].Text`.                                                           | Use Completions (not ChatCompletions) for the legacy completion pattern.                              |

---

## Exam Traps & Gotchas

- Wildcard/fuzzy/regex/proximity/boost = **Full Lucene only**. Simple syntax silently treats `~` etc. as literals.
- `$filter` is **not analyzed** → case-sensitive, exact. Field must be **filterable**.
- A field's attributes are independent — being **retrievable** doesn't make it **searchable** or **filterable**.
- **Field mapping vs output field mapping**: source→index vs enrichment-tree→index.
- Custom skill response **must** include `errors` and `warnings` keys (even if null) and echo each `recordId`.
- **Knowledge store** has no query API; it's storage for downstream tools. Don't confuse with the search index.
- Enrichment cache saves money on **OCR/image** reprocessing; needs Azure Storage.
- OpenAI **User vs Contributor vs Cognitive Services OpenAI Contributor** — fine-tuning/upload needs the OpenAI **Contributor** role (least privilege among options).

---

## Hands-On Lab: Define enrichment pipeline + custom skill role (~5 min, thought exercise)

Scenario: multilingual product PDFs in Blob storage; you need searchable English text + custom part-number tagging.

1. **Data source** → Azure Blob container of PDFs.
2. **Skillset** (ordered):
   - OCR / Document Extraction (crack PDF, get text + images)
   - Language Detection → Text Translation (to English)
   - Key Phrase + Entity Recognition
   - **Custom Web API skill** → calls your Azure Function that regex-extracts part numbers. Define `inputs` (`/document/content`) and `outputs` (`partNumbers`).
3. **Index** → fields: `id` (key), `content` (searchable), `language` (filterable), `partNumbers` (searchable+facetable).
4. **Indexer** → wire data source + skillset + index; add **output field mapping** `/document/partNumbers → partNumbers`; enable **enrichment cache**.
5. **Query check**: `search=valve~&queryType=full&$filter=language eq 'en'&$orderby=search.score() desc`.

Write one sentence: _What does the custom skill role do in this pipeline?_ (Answer: runs your external code as an enrichment step, receiving `values[]` and returning `values[]` with `data/errors/warnings`.)

---

## Quick Self-Check

1. Which queryType is needed for `surf*`?
2. Is `$filter` text analyzed?
3. Name the 3 knowledge store projection types.
4. What two keys must a custom skill response include besides `recordId` and `data`?
5. Which role lets a user upload data + fine-tune with least privilege?

---

## Related Questions in questions.json (Day 24)

zwQBjm9u1hnxtKdieK3F, Pt3w9pCNGVFFUtiGLZf7, ZTLM4w1yBMNDQ8ZVvn3p, 0j6GKRoKuswn0kRX12b3, 1sqHO0HzcRd1Nlv4wHaG, AGD750zD5ne6CzR1MRfD, CKOb0dLaxqj4TbVz74zy, DqDWHYUiK2rmyAC0QnzZ, ICzikIAERFRO4FU8OhEA, IlpzdeGWFEkeTSU5mXzL, NMI2S8rZcFiDHGEvawvI

Quiz command:

```powershell
python quiz_runner.py questions.json --day-lock 24 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [Querying in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-query-overview)
- [OData filter / orderby syntax](https://learn.microsoft.com/en-us/azure/search/query-odata-filter-orderby-syntax)
- [AI enrichment concepts](https://learn.microsoft.com/en-us/azure/search/cognitive-search-concept-intro)
- [Custom Web API skill](https://learn.microsoft.com/en-us/azure/search/cognitive-search-custom-skill-web-api)
- [Knowledge store concepts](https://learn.microsoft.com/en-us/azure/search/knowledge-store-concept-intro)

---

## Notes (your own words — fill this in after studying)

_(Leave space for the user to add their own notes after going through it)_
