# Day 25: Semantic and Vector Search

**Date**: 2026-05-30
**Domain**: Domain 6 — Implement knowledge mining and information extraction solutions (15-20%)
**Subtopics**: Semantic ranking, vector search, hybrid retrieval, Azure OpenAI "on your data" grounding
**Estimated study time**: 1 hr

---

## TL;DR (60-second skim)

- **Semantic ranker** reranks an existing BM25/RRF result set (top 50) using deep learning models from Bing — it does NOT re-query the entire corpus
- **Vector search** uses embeddings (e.g., `text-embedding-ada-002`) stored in `Collection(Edm.Single)` fields; algorithms are HNSW (approximate) or exhaustiveKnn (exact)
- **Hybrid search** = keyword (BM25) + vector search in parallel, merged via **Reciprocal Rank Fusion (RRF)**
- Best retrieval: **hybrid + semantic ranking** — benchmark-proven to outperform vector-only or keyword-only
- Semantic config needs: `titleField` (128 tokens), `prioritizedContentFields`, `prioritizedKeywordsFields` — query with `queryType=semantic`
- Vector fields: `type: Collection(Edm.Single)`, `dimensions` must match embedding model, `vectorSearchProfile` required, `searchable: true`, `filterable/facetable/sortable: false`
- Azure OpenAI "on your data" uses `AzureCognitiveSearch` as `data_sources.type` in the API body to ground responses on your index
- Most quiz questions today are **cross-domain Azure OpenAI** — see the refresher table below

---

## Learning Objectives

After this session you should be able to:

1. Explain how semantic ranking works (L2 reranking, captions, answers, query rewrite)
2. Configure a semantic configuration on an index (title, content, keyword fields)
3. Create a vector index with proper field definitions and algorithm configuration
4. Write hybrid queries combining `search` + `vectorQueries` with semantic ranking
5. Decide which retrieval strategy fits a given scenario (keyword vs vector vs hybrid ± semantic)
6. Describe how Azure OpenAI "on your data" grounds chat responses using Azure AI Search

---

## Key Concepts

### 1. Semantic Ranking

Semantic ranker is a **query-side** feature that reranks results using Microsoft's language understanding models (adapted from Bing).

**Three capabilities:**
1. **L2 Reranking** — takes the top 50 BM25/RRF results and reranks them by semantic relevance. Score: `@search.rerankerScore` (0.0–4.0)
2. **Captions & Highlights** — extracts verbatim passages from your content, with highlights over key terms
3. **Semantic Answers** — optional; returns a direct answer passage when query looks like a question
4. **Query Rewrite** (optional) — generates up to 10 query variants (spelling corrections, synonyms)

**How it processes:**
- Summarization model accepts up to **2,000 tokens** per document
- Fields fed in priority: `title` (128 tokens) → `keywords` (128 tokens) → `content` (remaining tokens)
- Important: list fields in priority order — lower-priority fields get truncated

**Semantic Configuration (index-level):**
```json
"semantic": {
  "configurations": [{
    "name": "my-semantic-config",
    "prioritizedFields": {
      "titleField": { "fieldName": "title" },
      "prioritizedContentFields": [
        { "fieldName": "description" },
        { "fieldName": "content" }
      ],
      "prioritizedKeywordsFields": [
        { "fieldName": "tags" },
        { "fieldName": "category" }
      ]
    }
  }]
}
```

**Query-side activation:** set `queryType=semantic` + `semanticConfiguration=my-semantic-config`

**Pricing:** Free plan available (monthly quota), then standard pay-as-you-go. Charged only when `queryType=semantic` AND search string is non-empty.

**Limitations:**
- Cannot re-query the entire corpus — only reranks existing top-50 result set
- Cannot create new text — captions/answers are **verbatim** from your index
- Works best on prose-like, information-rich content
- Requires Basic tier or higher

### 2. Vector Search

Vector search uses **embeddings** (numeric arrays from models like `text-embedding-ada-002`) to find semantically similar content.

**Index configuration requires:**
1. **Algorithm** — `hnsw` (Hierarchical Navigable Small World, approximate, fast) or `exhaustiveKnn` (exact, slower)
2. **Compression** (optional) — `scalarQuantization` (float → int8) or `binaryQuantization` (float → 1-bit)
3. **Profile** — combines algorithm + compression, referenced by vector fields

**Vector field definition:**
```json
{
  "name": "contentVector",
  "type": "Collection(Edm.Single)",
  "searchable": true,
  "retrievable": false,
  "stored": false,
  "dimensions": 1536,
  "vectorSearchProfile": "my-vector-profile"
}
```

**Critical field rules:**
- `type` = `Collection(Edm.Single)` (most common)
- `dimensions` must match the embedding model (ada-002 = 1536, embedding-3-small = up to 1536, embedding-3-large = up to 3072)
- `searchable` must be **true**
- `filterable`, `facetable`, `sortable` must be **false**
- `stored` controls whether raw vectors are persisted for retrieval (separate from `retrievable`)

**Similarity metrics:** `cosine` (Azure OpenAI default), `dotProduct`, `euclidean`, `hamming` (for binary data)

**HNSW parameters:**
- `m` (bi-directional links): 4–10, default 4
- `efConstruction` (indexing neighbors): 100–1000, default 400
- `efSearch` (query-time neighbors): 100–1000, default 500

**Two ways to get vectors in:**
1. **Push (external)** — generate embeddings yourself, upload via Documents-Index API
2. **Pull (integrated vectorization)** — use indexer + skillset with Azure OpenAI Embedding skill

### 3. Hybrid Search

Hybrid = keyword (full-text BM25) + vector search executed **in parallel**, merged via **Reciprocal Rank Fusion (RRF)**.

**Hybrid query structure:**
```json
{
  "search": "historic hotel walk to restaurants",
  "vectorQueries": [{
    "kind": "vector",
    "vector": [0.01, -0.02, ...],
    "k": 50,
    "fields": "contentVector"
  }],
  "queryType": "semantic",
  "semanticConfiguration": "my-semantic-config",
  "select": "HotelName, Description"
}
```

**Key points:**
- `search` = full-text query (BM25); `vectorQueries` = similarity search
- Multiple vector queries can target different vector fields
- Set `k=50` when using semantic ranker (maximizes reranker input)
- Don't use `orderby` — it overrides relevance-based ranking
- Filters, facets, and geospatial queries all work with hybrid
- `vectorFilterMode`: `preFilter` (filter before vector search) or `postFilter` (filter after)

### 4. Azure OpenAI "On Your Data" (Grounding with AI Search)

Grounds Azure OpenAI chat responses on your enterprise data via Azure AI Search.

**API pattern — the data_sources block:**
```json
{
  "data_sources": [{
    "type": "AzureCognitiveSearch",
    "parameters": {
      "endpoint": "https://mysearch.search.windows.net",
      "key": "<search-api-key>",
      "indexName": "my-index"
    }
  }],
  "messages": [
    { "role": "user", "content": "What is our refund policy?" }
  ]
}
```

**Exam trap:** The data source type is `AzureCognitiveSearch` (NOT `AzureAISearch` or `AzureSearch`). This is the legacy API name still used in the exam.

**Search type options:** keyword, semantic, vector, hybrid (vector + keyword), hybrid + semantic. Default intelligent search uses the best available.

**Runtime parameters:** `strictness` (1–5, default 3), `topNDocuments` (3/5/10/20, default 5), `inScope` (limit to your data, default true)

---

## Decision Frameworks

**Which retrieval strategy should I use?**

```
Need exact keyword matching (product codes, names)?
  └── YES → Keyword search (BM25)
  └── NO ↓
Need conceptual/semantic similarity?
  └── YES ↓
  Have embeddings available?
    └── YES → Hybrid (keyword + vector) + Semantic ranking ← BEST OVERALL
    └── NO → Keyword + Semantic ranking
  └── NO → Keyword search only
```

**When to add semantic ranking:**
- Rich prose content (documentation, articles, knowledge bases)
- User queries are natural language questions
- Need captions/answers in search results
- Willing to pay premium pricing (or within free tier quota)

**When to skip semantic ranking:**
- Structured/tabular data only
- Queries are exact-match filters (product IDs, dates)
- Latency-sensitive with very high QPS needs

---

## Comparisons (X vs Y)

| Feature | Keyword (BM25) | Vector | Hybrid | Semantic Ranking |
|---|---|---|---|---|
| **Matching** | Exact term/phrase | Conceptual similarity | Both | Reranks existing results |
| **Input** | Text query | Vector embedding | Both | Top 50 from BM25/RRF |
| **Scoring** | BM25 | HNSW/KNN distance | RRF merge | @search.rerankerScore (0–4) |
| **Best for** | Exact terms, codes | Meaning-based, multilingual | General purpose | Improving relevance |
| **Tier requirement** | Free+ | Free+ | Free+ | Basic+ |
| **Extra cost** | None | Embedding model calls | Embedding model calls | Semantic ranker billing |

| Algorithm | HNSW | Exhaustive KNN |
|---|---|---|
| **Type** | Approximate Nearest Neighbors | Exact Nearest Neighbors |
| **Speed** | Fast (logarithmic) | Slow (linear scan) |
| **Accuracy** | Near-exact (tunable via m, ef) | 100% exact |
| **Use case** | Production queries | Benchmarking, small datasets |

---

## Important Details for Exam

- Semantic ranker reranks **top 50 only** — does NOT re-query entire corpus
- Semantic ranker output: `@search.rerankerScore` (4.0 = highly relevant, 0.0 = irrelevant)
- Captions and answers are **verbatim** — no generative AI involved
- Semantic config allows up to **100 configurations** per index
- Vector field `dimensions` must exactly match your embedding model
- Azure OpenAI embeddings use **cosine** similarity
- `text-embedding-ada-002` = fixed **1536** dimensions
- Vector fields: `filterable`, `facetable`, `sortable` must ALL be **false**
- Hybrid query uses **RRF** to merge results — not simple score addition
- `queryType=semantic` triggers billing only when search string is non-empty (`search=*` is free)
- "On your data" uses `type: "AzureCognitiveSearch"` (exam still tests this legacy name)
- Azure OpenAI uses **deployment names** in API calls, NOT model names
- Azure OpenAI authenticates with **API key** (not tenant ID or subscription ID)

---

## Common Traps & Misconceptions

1. **"Semantic ranking searches the whole index"** — WRONG. It only reranks the top 50 results from the initial BM25/RRF query
2. **"Vector search replaces keyword search"** — WRONG. Hybrid (both) + semantic consistently outperforms either alone
3. **"AzureAISearch is the data source type"** — WRONG. The API uses `AzureCognitiveSearch` (legacy naming persists in exam questions and API)
4. **"Use model name in Azure OpenAI API calls"** — WRONG. Use the **deployment name** you created
5. **"Authenticate Azure OpenAI embeddings with subscription ID"** — WRONG. Use **API key** or managed identity
6. **"Vector fields can be filterable"** — WRONG. Only non-vector fields can be filterable; vector fields must have `filterable: false`
7. **"Semantic ranking generates new text"** — WRONG. Captions and answers are extracted verbatim from indexed content
8. **"Max tokens controls output quality"** — WRONG. `max_tokens` only limits response LENGTH, not quality or accuracy

---

## Quick Reference Card

| Setting | Value |
|---|---|
| Semantic ranker input limit | Top 50 results, 2,000 tokens per doc |
| Semantic config fields | title (128 tokens), keywords (128 tokens), content (remaining) |
| Reranker score range | 0.0 (irrelevant) – 4.0 (highly relevant) |
| `text-embedding-ada-002` dimensions | 1536 (fixed) |
| Vector field type | `Collection(Edm.Single)` |
| HNSW defaults | m=4, efConstruction=400, efSearch=500 |
| Similarity metrics | cosine (Azure OpenAI), dotProduct, euclidean, hamming |
| Hybrid merge algorithm | Reciprocal Rank Fusion (RRF) |
| "On your data" source type | `AzureCognitiveSearch` |
| Semantic ranking min tier | Basic |
| Semantic configs per index | Up to 100 |

---

## Cross-Domain Quiz Question Refreshers

Most Day 25 quiz questions are **Azure OpenAI cross-domain** from Domains 1–2. Review these:

| # | Concept | Key Fact | Trap |
|---|---|---|---|
| Q2 | Orchestrator for multi-service bots | Orchestrator dispatches between QnA Maker, LUIS, etc. in a single bot | Not "Language Understanding" or "Translator" — Orchestrator is the routing layer |
| Q3 | Fine-tuning data format | Training data (prompt-completion pairs) must be in **JSONL** format | Not JSON, CSV, or TXT — specifically JSON Lines (.jsonl) |
| Q4 | Azure OpenAI embeddings auth | Authenticate with **API key**; use **deployment name** (not model name) | Tenant ID and subscription ID are NOT used for API auth |
| Q5 | Azure OpenAI Studio deploy workflow | Create deployment (GPT-3.5-Turbo) → Apply system message template → Deploy to web app | Can't apply template before creating deployment |
| Q6 | Python SDK code ordering | Set `api_base` first → Create `ChatCompletion` → Use prompt in messages | API base URL must be configured before making calls |
| Q7 | Priming (prompt engineering) | System message setting role/persona = **Priming** | Few-shot = examples; Chain-of-thought = step-by-step; Affordance = capabilities |
| Q8 | CMK for Azure OpenAI (CLI) | `--kind OpenAI` + `--encryption` flag | Not `--assign-identity` — that's for managed identity, not CMK |
| Q9 | Temperature/Top_P/Max_tokens | Temp=1 → max randomness; Top_P=0.5 → nucleus sampling; Max=100 → length cap only | All three "does X improve quality/accuracy?" → **No** |
| Q10 | Azure OpenAI RBAC | **Cognitive Services OpenAI User** = view endpoints + models + generate content (least privilege) | Not Contributor or Reader — User role is the sweet spot |
| Q11 | Prevent hate speech | **Content filter** blocks harmful content in responses | Not abuse monitoring (that's logging), not frequency penalty or temperature |

---

## Lab: Choose Retrieval Strategy for Three Scenarios

**Scenario A:** E-commerce product catalog — users search by product codes, SKU numbers, and exact brand names.
→ **Keyword search (BM25)** — exact matching needed for codes/SKUs. Add filters for category/price.

**Scenario B:** Internal knowledge base with 10K policy documents — employees ask natural language questions like "what's our parental leave policy?"
→ **Hybrid (keyword + vector) + Semantic ranking** — natural language needs semantic understanding, keyword catches exact policy terms, semantic ranker promotes best answers.

**Scenario C:** Multilingual customer support docs in 8 languages — users query in any language.
→ **Vector search (with multilingual embeddings)** — embedding models encode meaning across languages. Add hybrid for same-language exact matches. Consider semantic ranking for supported languages.

---

## Related Questions in questions.json

| Question ID | Type | Topic |
|---|---|---|
| PFarcFliASzPdwk45Nn1 | HOTSPOT | Azure OpenAI "on your data" — ChatCompletion + AzureCognitiveSearch |
| Q9yZaZRalGtQmWjHR8mI | MCQ | Orchestrator for multi-service bots |
| RES6nlcOAb06feX7DCLJ | MCQ | Fine-tuning data format (JSONL) |
| S3VBMnLRwbzhMoIkXng1 | HOTSPOT | Embeddings auth (API key) + deployment name |
| aplZECeO20Fhs9ciwlKT | DRAG DROP | Azure OpenAI Studio deploy sequence |
| b3dBtUm3v75h2gV0tVz5 | HOTSPOT | Python SDK code ordering |
| dQW9QFpnTSXO3e9bGlKM | MCQ | Priming prompt technique |
| eznqeAhzqbvYsIiba0Ir | HOTSPOT | CMK via CLI (--kind OpenAI + --encryption) |
| fXlqR9VszBcmSZCwimj4 | HOTSPOT | Temperature/Top_P/Max_tokens parameters |
| gwsIQSZPu8cibMgPdECI | MCQ | RBAC — Cognitive Services OpenAI User |
| laB97ovDapKAs5foUrWN | MCQ | Content filter for hate speech |

Quiz command:

```powershell
cd "d:\Projects\microsoft-exam-prep\AI-102 Prep"; python quiz_runner.py questions.json --day-lock 25 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [Semantic ranking in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/semantic-search-overview)
- [Configure semantic ranker and return captions](https://learn.microsoft.com/en-us/azure/search/semantic-how-to-configure)
- [Vector search in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/vector-search-overview)
- [Create a vector index in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-create-index)
- [Hybrid search using vectors and full text](https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview)
- [Azure OpenAI On Your Data (classic)](https://learn.microsoft.com/en-us/azure/foundry-classic/openai/concepts/use-your-data)

---

## Notes (your own words — fill this in after studying)

_(Space for your own notes after reading through the material)_
