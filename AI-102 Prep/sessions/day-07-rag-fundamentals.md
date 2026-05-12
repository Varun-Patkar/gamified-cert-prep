# Day 7: RAG Fundamentals

**Date**: 2026-05-12
**Domain**: Domain 2 — Implement generative AI solutions (15-20%)
**Subtopics**: Grounding data, retrieval flow, context design
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)

- **RAG = Retrieve → Augment → Generate**: query an index, inject grounding data into the prompt, let the LLM generate a cited answer.
- **Azure AI Search** is the recommended index store. It supports keyword, semantic, vector, and hybrid search. **Hybrid + semantic** gives best RAG quality.
- **Chunking** splits docs into token-sized pieces (default 1,024 tokens; options: 256, 512, 1,024, 1,536). Smaller = more granular, larger = more context.
- **Azure OpenAI "On Your Data"** is the classic (now deprecated) RAG shortcut. Microsoft is migrating to **Foundry Agent Service + Foundry IQ** as the modern approach.
- **Agentic retrieval** (preview) uses an LLM to decompose complex queries into focused sub-queries, executes them in parallel, and returns structured grounding data with citations.
- Quiz questions today also cover **Computer Vision APIs** (brand detection, bounding boxes, imageType, detection models), **Face API** (PersonGroup, detection models, AddFaceFromStreamAsync), **Video Indexer** (file limits, person models, custom brands), **Key Phrase Extraction**, **Immersive Reader**, **Speech SDK translation**, and **Bot Framework debugging**.

---

## Learning Objectives

After this session you should be able to:

1. Explain how RAG works and why grounding matters for GenAI solutions
2. Choose the right search type (keyword vs semantic vs vector vs hybrid) for a given scenario
3. Describe how Azure OpenAI On Your Data implements the RAG pattern
4. Configure chunking, strictness, and retrieved-document count for quality tuning
5. Use the Index Lookup tool in prompt flow for RAG
6. Answer quiz questions on Computer Vision, Face API, Video Indexer, NLP, and Speech SDK

---

## Key Concepts

### 1. What Is RAG and Why It Matters

LLMs are trained on public data at a point in time. RAG extends them by:

- **Retrieving** relevant content from your private data (via an index)
- **Augmenting** the prompt with that content as grounding data
- **Generating** a response that cites the retrieved sources

**Trap**: RAG does NOT retrain or fine-tune the model. It adds context to the prompt at inference time. The exam will try to confuse RAG with fine-tuning.

**When to use RAG vs fine-tuning**:
| Scenario | Use RAG | Use Fine-tuning |
|---|---|---|
| Need up-to-date private data | ✅ | ❌ |
| Need to change model behavior/style | ❌ | ✅ |
| Data changes frequently | ✅ | ❌ |
| Want citations back to source | ✅ | ❌ |

### 2. RAG Architecture in Azure

The RAG pipeline has these components:

```
User Query → [Intent Generation] → [Index Query] → [Filter & Rerank] → [LLM + Grounding Data] → Response with Citations
```

Azure OpenAI On Your Data makes **two LLM calls**:

1. **Intent call**: Determines search intent from the user's question + conversation history
2. **Generation call**: Combines retrieved chunks + question + system message → generates final answer

**Trap**: The system message only affects the generation step, NOT the retrieval step. If you want to influence retrieval, include instructions in the user query itself.

### 3. Azure AI Search — The Retrieval Engine

Azure AI Search is the recommended index store. Key search types:

| Search Type                   | How It Works                             | Cost                               | Best For                                      |
| ----------------------------- | ---------------------------------------- | ---------------------------------- | --------------------------------------------- |
| **Keyword**                   | Lucene full-text matching                | No extra cost                      | Exact term matching, structured queries       |
| **Semantic**                  | AI reranker re-scores results by meaning | Extra pricing; requires Basic+ SKU | Better relevance for natural language queries |
| **Vector**                    | Cosine similarity on embeddings          | Embedding model cost               | Cross-lingual, concept matching               |
| **Hybrid (vector + keyword)** | Both in parallel, merged results         | Embedding cost                     | Best recall — recommended baseline            |
| **Hybrid + semantic**         | Hybrid + semantic reranker               | Both costs                         | **Best overall RAG quality** — recommended    |

**Trap**: Semantic search and vector search both require **Basic SKU or higher**. Free tier doesn't support them. The exam tests this.

**Trap**: For cross-lingual retrieval (e.g., query in English, docs in Japanese), use **vector search**. Keyword and semantic search require same-language queries and documents.

### 4. Data Ingestion & Chunking

**Supported file types**: `.txt`, `.md`, `.html`, `.docx`, `.pptx`, `.pdf`

**Chunking** splits documents into smaller pieces for the index. Key parameters:

| Chunk Size | Tokens | When to Use                                        |
| ---------- | ------ | -------------------------------------------------- |
| Small      | 256    | Direct facts, granular retrieval, lower token cost |
| Medium     | 512    | Balanced — good starting point for factual docs    |
| Default    | 1,024  | General purpose (default)                          |
| Large      | 1,536  | Contextual information, narrative documents        |

**Trap**: Changing chunk size requires **re-ingestion** of all documents. It's expensive. Try adjusting runtime parameters (strictness, topNDocuments) first before changing chunk size.

**Integrated vectorization** (since Sept 2024): Azure AI Search handles chunking and embedding via built-in skills. Assets created: `{job-id}-index`, `{job-id}-indexer`, `{job-id}-datasource`.

### 5. Runtime Parameters (Tuning Without Re-ingestion)

| Parameter                               | Range        | Default | Effect                                                                         |
| --------------------------------------- | ------------ | ------- | ------------------------------------------------------------------------------ |
| **Strictness**                          | 1–5          | 3       | Higher = more aggressive filtering of low-relevance chunks                     |
| **Retrieved documents (topNDocuments)** | 3, 5, 10, 20 | 5       | More docs = more context but higher token cost                                 |
| **Limit responses to data (inScope)**   | true/false   | true    | true = only answer from your data; false = model can use its own knowledge too |

**Trap**: If users report "I don't know" responses for questions that should be answerable, try:

1. First: Lower strictness (closer to 1)
2. Second: Increase topNDocuments
3. Last resort: Reduce chunk size to 256/512 and re-ingest

### 6. Azure OpenAI On Your Data (Classic — Deprecated)

**Important**: Azure OpenAI On Your Data is **deprecated** and approaching retirement. Only GPT-4o and GPT-4o-mini are still supported. Microsoft recommends migrating to **Foundry Agent Service + Foundry IQ**.

The API uses a `data_sources` parameter in the chat completions call:

```json
{
	"data_sources": [
		{
			"type": "AzureCognitiveSearch",
			"parameters": {
				"endpoint": "$AZURE_AI_SEARCH_ENDPOINT",
				"key": "$AZURE_AI_SEARCH_API_KEY",
				"indexName": "$AZURE_AI_SEARCH_INDEX"
			}
		}
	],
	"messages": [{ "role": "user", "content": "What is..." }]
}
```

**Trap**: If both `tools` (function calling) and `data_sources` are in the same request:

- `tool_choice = none` → tools ignored, data sources used
- `tool_choice = auto/object/not specified` → **data sources ignored**, tools used
- These two features are mutually exclusive in a single request!

### 7. Agentic Retrieval (Modern RAG — Preview)

The evolution from classic RAG:

- LLM decomposes complex queries into multiple **sub-queries**
- Sub-queries execute in **parallel**
- Returns **structured responses** with citations and execution metadata
- Built-in **semantic ranking**
- Optional **answer synthesis** directly in the query response

Requires new objects: **knowledge sources** → **knowledge base** → **retrieve action**

### 8. RAG in Prompt Flow

In Microsoft Foundry portal (classic):

1. Create/open a prompt flow
2. Add an **Index Lookup** tool node
3. Configure `mlindex_content` to point to your Azure AI Search index
4. Set `queries` and `query_types`
5. Connect the output to a prompt node → LLM node

This creates the classic RAG pattern: **Retrieval node → Prompt node → LLM node**

### 9. RAG Evaluation Metrics

When evaluating RAG solutions, focus on:

- **Groundedness**: Does the answer come from retrieved content (not hallucinated)?
- **Relevance**: Is the answer relevant to the user's question?
- **Coherence**: Is the answer logically structured and readable?
- **Fluency**: Is the language natural and grammatically correct?
- **Citation accuracy**: Are citations correct and traceable to source chunks?

### 10. Security Considerations

- **Document-level access control**: Azure AI Search security filters trim results based on Microsoft Entra ID group membership
- Prefer **managed identity** over API keys for production
- Treat retrieved content as **untrusted input** (prompt injection risk from documents)

---

## Quiz Topic Coverage

Today's 12 quiz questions cover a mix of Domain 2 and Domain 3 topics (assigned by round-robin). Key concepts tested:

### Computer Vision API

- **Brand/logo detection**: `brands` collection returns brand name, confidence score, and bounding rectangle (`x`, `y` = top-left corner; `w`, `h` = width/height). Bounding box does NOT directly include bottom-right coordinates — you must calculate them from x+w, y+h. **Trap**: Confidence > 0.75 doesn't mean ALL brands pass that threshold.
- **imageType property**: Use `POST /vision/v3.2/analyze/?visualFeatures=imageType` to detect if image is photograph, clipart, or line drawing. The response property is `imageType`, not `tags` or `description`.
- **Detection models**: If face detection fails on blurred/sideways faces → **change the detection model** (e.g., from `detection_01` to `detection_03`). Different models are optimized for different conditions.

### Face API

- **PersonGroup vs LargePersonGroup**: PersonGroup supports up to 1,000 persons; **LargePersonGroup** supports up to 1,000,000. Free tier: 1,000 person groups × 1,000 persons each.
- **AddFaceFromStreamAsync**: To add faces to a person group, use `Stream` + `AddFaceFromStreamAsync` (from Step 5 of the MS docs workflow).
- **Face detection code**: When using the Face Recognition API with PersonGroup, remember subscription tier limits affect how many groups/persons you can create.

### Video Indexer

- **Supported formats**: WMV, AVI, MOV, MP4. **Size limit**: 2 GB from device upload, 30 GB from URL. **Duration**: up to 6 hrs (basic) / 12 hrs (audio).
- **Custom brands**: To exclude a brand, set `enabled: false` in the REST API request body. `enabled: true` = Include list; `enabled: false` = Exclude list.
- **Person models**: To search videos by who appears → create a **person model** and associate it with videos.

### Key Phrase Extraction

- Calling key phrase extraction on "the quick brown fox jumps over the lazy dog" returns: `quick brown fox` and `lazy dog` (stop words and connectors are stripped).

### Immersive Reader

- For users with **dyslexia** or reduced comprehension → **Azure AI Immersive Reader** (supports text highlighting, syllable breakdown, picture dictionary, read-aloud, translation).

### Speech SDK Translation

- Source language: set `SpeechRecognitionLanguage` property (e.g., `"fr"`)
- Target languages: call `AddTargetLanguage()` for each (e.g., `"de"`, `"es"`)
- Use `TranslationRecognizer` class for speech translation

### Bot Framework Debugging

- To debug a bot endpoint **remotely**: install **Bot Framework Emulator** + **ngrok** (creates a tunnel to your local machine).

---

## Quick Reference Card

| Concept                | Key Fact                                                       |
| ---------------------- | -------------------------------------------------------------- |
| RAG pattern            | Retrieve → Augment → Generate                                  |
| Best search for RAG    | Hybrid + Semantic                                              |
| Default chunk size     | 1,024 tokens                                                   |
| Default topNDocuments  | 5                                                              |
| Default strictness     | 3                                                              |
| Chunk change           | Requires re-ingestion                                          |
| Strictness change      | No re-ingestion needed                                         |
| On Your Data status    | **Deprecated** — migrate to Foundry Agent Service + Foundry IQ |
| Supported file types   | .txt, .md, .html, .docx, .pptx, .pdf                           |
| Vector search benefit  | Cross-lingual matching                                         |
| Semantic search SKU    | Basic or higher                                                |
| inScope default        | true (only answer from data)                                   |
| System message affects | Generation only, NOT retrieval                                 |
| tools + data_sources   | Mutually exclusive per request                                 |

---

## Related Questions in questions.json

| ID                   | Topic                                          |
| -------------------- | ---------------------------------------------- |
| AoosNJk84baOnwbHJttB | Computer Vision brand detection / bounding box |
| IJvXqrBcH0GCuOhthbmc | Face Recognition API / PersonGroup tiers       |
| NNHl7NoSfresoj4xVUp9 | Face detection model selection                 |
| S9rNdftxfn0keGXHkEsu | Azure AI Vision client library code            |
| ix34tYoG4cvNiIGOnSzU | Video Indexer custom brands exclusion          |
| oCFmiVxvr7ipOakyGXeS | Video Indexer person model                     |
| tNooLCK4iuVfCGQYLp66 | Video Indexer file format/size limits          |
| zskqGkWLFqxuSnoJ494y | Face API AddFaceFromStreamAsync                |
| 42zs4RAoOPbBjunT2VPf | Key phrase extraction output                   |
| ABebvW3QPVovA36cGpwI | Bot Framework Emulator + ngrok                 |
| Bm0JwMRgiJLpgJetUcU9 | Immersive Reader for accessibility             |
| ECBJJD5Byf6A3kLWSsab | Speech SDK translation config                  |

Quiz command:

```powershell
cd "c:\Users\v-vpatkar\OneDrive - Microsoft\Desktop\microsoft-exam-prep\AI-102 Prep"
python quiz_runner.py questions.json --day-lock 7 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [RAG and indexes in Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/concepts/retrieval-augmented-generation)
- [Azure OpenAI On Your Data (classic)](https://learn.microsoft.com/en-us/azure/foundry-classic/openai/concepts/use-your-data)
- [RAG in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview)
- [Build and consume vector indexes in Foundry portal](https://learn.microsoft.com/en-us/azure/foundry-classic/how-to/index-add)
- [Azure OpenAI quickstart (Foundry)](https://learn.microsoft.com/en-us/azure/foundry/quickstarts/get-started-code)

---

## Notes (your own words — fill this in after studying)

_(Write key takeaways in your own words here after reading through the material)_
