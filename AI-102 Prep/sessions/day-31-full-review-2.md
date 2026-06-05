# Day 31: Full Review 2 — Domains 3, 4, 6

**Date**: 2026-06-05
**Domains**: Domain 3 (5-10%), Domain 4 (10-15%), Domain 6 (15-20%)
**Focus**: Cross-domain rapid review targeting weak patterns and exam traps
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)

- **Azure OpenAI "on your data"**: Use `AzureSearchChatDataSource` (new SDK) / `AzureCognitiveSearchChatExtensionConfiguration` (old SDK) — NOT the generic `AzureChatExtensionConfiguration` base class
- **Doc Intelligence model selection**: `prebuilt-read` = handwriting + printed + QR/barcodes; `prebuilt-receipt` = receipt fields; `prebuilt-layout` = tables + structure; custom model = per-office variations
- **RBAC**: `Cognitive Services OpenAI User` = view + inference (least privilege); `Contributor` = deploy/manage models; `Reader` = list keys only
- **Entity Linking** returns **Wikipedia URLs** for disambiguation — NOT custom categories or entity types
- **Container deploy order**: Export app → Move package to input mount → Run container (NOT run-then-export)
- **AI Search custom skill**: type = `Microsoft.Skills.Custom.WebApiSkill`, requires `inputs` + `outputs` arrays + `outputFieldMappings` in indexer
- **Agent solutions**: Foundry Agent Service for simple agents; Microsoft Agent Framework (Bot Framework SDK) for complex multi-turn, multi-agent orchestration

---

## Learning Objectives

After this session, you should be able to:

1. Correctly identify the SDK class for Azure OpenAI "on your data" in code questions
2. Select the right Document Intelligence model for any document scenario
3. Assign the minimum-privilege RBAC role for Azure OpenAI operations
4. Distinguish Entity Linking from NER in API response questions
5. Order container deployment steps correctly
6. Configure custom Web API skills with correct input/output schema
7. Choose between Foundry Agent Service and Agent Framework for agent scenarios

---

## Domain 3: Implement an Agentic Solution (5-10%)

### Agent Service vs Agent Framework

| Aspect        | Foundry Agent Service          | Microsoft Agent Framework (Bot Framework SDK)     |
| ------------- | ------------------------------ | ------------------------------------------------- |
| Complexity    | Simple single-purpose agents   | Complex multi-turn, multi-agent workflows         |
| Hosting       | Managed (serverless)           | Self-hosted or Azure Bot Service                  |
| Code          | Low/no-code via portal + SDK   | Full code (C#, Python, JS, Java)                  |
| Orchestration | Built-in tool orchestration    | Custom orchestration, Semantic Kernel             |
| Multi-agent   | Limited                        | Full multi-agent with handoffs                    |
| Best for      | Quick RAG agents, tool-calling | Enterprise bots, Teams integration, complex flows |

### Agent Creation Flow (Foundry Agent Service)

1. Create Azure AI Foundry project
2. Deploy a model (GPT-4o, GPT-4)
3. Create agent with instructions + tools (code interpreter, file search, Azure AI Search, etc.)
4. Create thread → add messages → run agent
5. Poll run status → retrieve response

### Key Agent Concepts

- **Thread**: Conversation history container (persists across turns)
- **Run**: Single execution of agent against a thread
- **Tools**: Functions the agent can invoke (code interpreter, file search, custom functions)
- **Instructions**: System-level prompt defining agent behavior

### Exam Trap: LUIS Container Deployment Order

LUIS is retired (March 2026) but container questions may still appear:

**Correct order:**

1. **Export** the LUIS app (select export format for containers)
2. **Move** the exported package file to the container's input mount directory
3. **Run** the container with `docker run` (with Billing, ApiKey, Eula settings)

**Trap**: Running the container BEFORE placing the package in the input directory → container starts but has no model to serve.

**Required `docker run` settings** (all mandatory):

- `ApiKey` — billing authentication
- `Billing` — endpoint URI of the Azure resource
- `Eula=accept` — license acceptance
- `Mounts` — input mount for the exported package

### Voice Talent Profile

- **Speaker Profile** requires recording a voice sample
- For **Custom Neural Voice**: must upload voice talent consent statement (audio + written)
- Cannot create Custom Neural Voice without explicit consent documentation

---

## Domain 4: Implement Computer Vision Solutions (10-15%)

### Image Analysis — Azure Vision in Foundry Tools

#### Visual Features Selection

| Feature         | What it returns                       | Use case                     |
| --------------- | ------------------------------------- | ---------------------------- |
| `Tags`          | List of content tags with confidence  | Image categorization         |
| `Objects`       | Detected objects with bounding boxes  | Object location/counting     |
| `Caption`       | Single sentence description           | Alt text generation          |
| `DenseCaptions` | Multiple region descriptions          | Detailed image understanding |
| `Read` (OCR)    | Extracted text with bounding polygons | Document digitization        |
| `SmartCrops`    | Suggested crop regions                | Thumbnail generation         |
| `People`        | Detected people with bounding boxes   | People detection             |

### Custom Vision: Classification vs Object Detection

| Aspect     | Image Classification        | Object Detection                       |
| ---------- | --------------------------- | -------------------------------------- |
| Output     | Tags/labels for whole image | Bounding boxes + labels                |
| Min images | 5 per tag                   | 15 per tag                             |
| Use case   | "Is this a cat or dog?"     | "Where are the defects?"               |
| Training   | Faster                      | Slower, needs bounding box annotations |

**Custom Vision Retrain Flow:**

1. Add new training images with tags
2. Click "Train" (choose Quick or Advanced)
3. Evaluate performance (Precision, Recall, AP)
4. Publish iteration to prediction endpoint
5. Update client code to use new published iteration name

**Trap**: You must PUBLISH a new iteration before clients can use it. Training alone doesn't make it live.

### Content Moderator Text Categories (Deprecated but testable)

| Category   | Detects                              |
| ---------- | ------------------------------------ |
| Category 1 | Sexually explicit / adult content    |
| Category 2 | Sexually suggestive / mature content |
| Category 3 | Offensive / discriminatory language  |

**Trap**: Categories are numbered 1-3, NOT named. The exam uses category numbers.

### Video Indexer & Spatial Analysis

**Video Indexer extracts:**

- Transcripts, OCR, faces, topics, emotions, scenes, keyframes, labels, brands, named entities

**Spatial Analysis operations:**

- `cognitiveservices.vision.spatialanalysis-personcount` — count people in zone
- `cognitiveservices.vision.spatialanalysis-persondistance` — measure distance between people
- `cognitiveservices.vision.spatialanalysis-personcrossingline` — detect line crossing
- `cognitiveservices.vision.spatialanalysis-personcrossingpolygon` — detect zone entry/exit
- `cognitiveservices.vision.spatialanalysis-personzonecount` — count in zone over time

**Spatial Analysis requires**: Azure Stack Edge device or compatible edge device with NVIDIA GPU.

---

## Domain 6: Knowledge Mining & Information Extraction (15-20%)

### Azure AI Search Architecture

```
Data Source → Indexer → Skillset (built-in + custom skills) → Index
                                    ↓
                             Knowledge Store (projections)
```

### Custom Web API Skill — Schema Deep Dive

**Skill definition** (`@odata.type: Microsoft.Skills.Custom.WebApiSkill`):

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
	"inputs": [
		{
			"name": "text",
			"source": "/document/content"
		}
	],
	"outputs": [
		{
			"name": "customResult",
			"targetName": "enrichedData"
		}
	]
}
```

**Expected request payload** (sent to your API):

```json
{
	"values": [
		{
			"recordId": "1",
			"data": {
				"text": "the input text..."
			}
		}
	]
}
```

**Expected response payload** (from your API):

```json
{
	"values": [
		{
			"recordId": "1",
			"data": {
				"customResult": "enriched value"
			},
			"errors": [],
			"warnings": []
		}
	]
}
```

**Critical**: After defining the skill, you MUST add `outputFieldMappings` in the **indexer** to map the enriched output to index fields:

```json
"outputFieldMappings": [
  {
    "sourceFieldName": "/document/enrichedData",
    "targetFieldName": "myIndexField"
  }
]
```

**Trap**: `fieldMappings` map source data → index fields. `outputFieldMappings` map enrichment tree nodes → index fields. Custom skill outputs go through `outputFieldMappings`, NOT `fieldMappings`.

### Document Intelligence Model Selection

| Model                 | Endpoint                                      | Best For                | Key Capabilities                                                                     |
| --------------------- | --------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| `prebuilt-read`       | `/documentModels/prebuilt-read:analyze`       | General text extraction | Printed text, **handwriting**, paragraphs, language detection, **barcodes/QR codes** |
| `prebuilt-layout`     | `/documentModels/prebuilt-layout:analyze`     | Structured documents    | Tables, selection marks, figures, sections, **document structure**                   |
| `prebuilt-receipt`    | `/documentModels/prebuilt-receipt:analyze`    | Receipts                | Merchant name, date, total, items, tax, tip                                          |
| `prebuilt-invoice`    | `/documentModels/prebuilt-invoice:analyze`    | Invoices                | Vendor, customer, line items, amounts, PO numbers                                    |
| `prebuilt-idDocument` | `/documentModels/prebuilt-idDocument:analyze` | IDs/passports           | Name, DOB, document number, expiry, MRZ                                              |
| Custom model          | `/documentModels/{modelId}:analyze`           | Domain-specific         | Per-office layouts, unique form structures                                           |
| Composed model        | `/documentModels/{composedId}:analyze`        | Mixed doc types         | Routes to best custom sub-model automatically                                        |

**Decision rules:**

- Handwritten notes → `prebuilt-read`
- QR codes or barcodes in documents → `prebuilt-read`
- Tables and structure → `prebuilt-layout`
- Standard receipts → `prebuilt-receipt`
- Each office has different form layout → custom model per office, then compose
- Need fields from a prebuilt PLUS custom fields → NOT possible in one call; use prebuilt + custom separately

**Trap**: `prebuilt-read` does NOT extract tables (use `prebuilt-layout`). `prebuilt-receipt` does NOT handle handwriting.

### Azure OpenAI "On Your Data" — SDK Classes

The API has evolved through multiple versions. The exam may test ANY of these:

**Current SDK (2024+):**

| Language | Class                                                       | Package                   |
| -------- | ----------------------------------------------------------- | ------------------------- |
| .NET     | `AzureSearchChatDataSource`                                 | Azure.AI.OpenAI           |
| Python   | Data source in `extra_body` or `AzureChatExtensionsOptions` | openai                    |
| Java     | `AzureSearchChatExtensionConfiguration`                     | com.azure:azure-ai-openai |

**Key naming evolution:**

- Old (pre-2024): `AzureCognitiveSearchChatExtensionConfiguration` → **specific** (Azure Cognitive Search)
- Old base class: `AzureChatExtensionConfiguration` → **generic base** (DO NOT USE directly)
- Current: `AzureSearchChatDataSource` (renamed after Cognitive Search → AI Search rebrand)

**Trap (missed TWICE)**: When the question asks "which class configures Azure Cognitive Search as a data source for Azure OpenAI", the answer is `AzureCognitiveSearchChatExtensionConfiguration` (old) or `AzureSearchChatDataSource` (new) — NOT `AzureChatExtensionConfiguration` (that's the abstract base class).

**Data source type values:**

- Old API: `AzureCognitiveSearch`
- New API (2024-02-15-preview+): `azure_search`

**Required parameters for Azure Search data source:**

- `endpoint` — Azure AI Search endpoint URL
- `index_name` — name of the search index
- `authentication` — API key or managed identity

### Cognitive Services RBAC Roles

| Role                                      | Can View/List      | Can Infer/Generate                        | Can Deploy Models          | Can Manage Keys    |
| ----------------------------------------- | ------------------ | ----------------------------------------- | -------------------------- | ------------------ |
| **Cognitive Services OpenAI User**        | ✅ View resource   | ✅ Create completions, embeddings, images | ❌                         | ❌                 |
| **Cognitive Services OpenAI Contributor** | ✅ View resource   | ✅ Create completions, embeddings, images | ✅ Create/edit deployments | ❌                 |
| **Cognitive Services Contributor**        | ✅ Full management | ✅                                        | ✅                         | ✅ Regenerate keys |
| **Cognitive Services User**               | ✅                 | ✅ All Cognitive Services inference       | ❌                         | ✅ List keys       |
| **Cognitive Services Usages Reader**      | ✅ View usage      | ❌                                        | ❌                         | ❌                 |

**Decision rule**: "Least privilege to use Azure OpenAI" → **Cognitive Services OpenAI User**
**Decision rule**: "Need to deploy models" → **Cognitive Services OpenAI Contributor**

**Trap**: `Cognitive Services User` (no "OpenAI" in name) is a DIFFERENT role — it's broader, covering all Cognitive Services, and includes list-keys permission. For LEAST PRIVILEGE on Azure OpenAI specifically, always pick the "OpenAI User" variant.

### Entity Linking vs NER vs PII

| Feature         | Entity Linking                                | NER                                             | PII Detection                          |
| --------------- | --------------------------------------------- | ----------------------------------------------- | -------------------------------------- |
| What it does    | Disambiguates entities against knowledge base | Classifies entities into categories             | Identifies sensitive personal data     |
| Output          | Entity name + **Wikipedia URL** + data source | Entity text + category (Person, Location, etc.) | Entity text + category + redacted text |
| Knowledge base  | Wikipedia                                     | None (classification only)                      | None                                   |
| Method (.NET)   | `RecognizeLinkedEntities`                     | `RecognizeEntities`                             | `RecognizePiiEntities`                 |
| Method (Python) | `recognize_linked_entities`                   | `recognize_entities`                            | `recognize_pii_entities`               |
| Use case        | "Does 'Mars' mean planet or god?"             | "Find all people/places/orgs in text"           | "Redact SSNs and emails"               |

**Entity Linking response structure:**

```json
{
	"entities": [
		{
			"name": "Microsoft",
			"matches": [{ "text": "Microsoft", "offset": 0, "length": 9 }],
			"language": "en",
			"dataSourceEntityId": "Microsoft",
			"url": "https://en.wikipedia.org/wiki/Microsoft",
			"dataSource": "Wikipedia"
		}
	]
}
```

**Trap**: Entity Linking returns `url` (Wikipedia link) and `dataSource` = "Wikipedia". NER returns `category` (Person, Organization, etc.) with NO URL. If the question mentions Wikipedia or disambiguation, it's Entity Linking.

### Knowledge Store Projections

| Type   | Stores to           | Format                   | Use case                  |
| ------ | ------------------- | ------------------------ | ------------------------- |
| Table  | Azure Table Storage | Rows/columns             | Analytics, Power BI       |
| Object | Azure Blob Storage  | JSON documents           | Complex nested structures |
| File   | Azure Blob Storage  | Binary/normalized images | Image enrichment outputs  |

### Semantic & Vector Search

| Feature      | Semantic Search                    | Vector Search                             |
| ------------ | ---------------------------------- | ----------------------------------------- |
| How it works | BM25 + language model re-ranking   | Embedding similarity (cosine/dot product) |
| Requires     | Semantic configuration on index    | Vector field + embedding model            |
| Best for     | Natural language queries over text | Conceptual/semantic similarity            |
| Pricing      | Premium tier feature               | Standard tier (but need embedding model)  |
| Query param  | `queryType=semantic`               | `vector` in query body                    |

---

## Trap Patterns Summary (Cross-Domain)

### Pattern 1: "Which class/type to use?"

- Azure OpenAI on your data → `AzureSearchChatDataSource` / `AzureCognitiveSearchChatExtensionConfiguration` (NOT the base class)
- Custom skill → `Microsoft.Skills.Custom.WebApiSkill`
- Entity Linking → returns Wikipedia URLs

### Pattern 2: "What order?"

- LUIS container: Export → Move package → Run container
- Custom Vision: Tag images → Train → Evaluate → Publish → Consume
- AI Search: Create data source → Create skillset → Create index → Create indexer

### Pattern 3: "Least privilege role?"

- Use Azure OpenAI → `Cognitive Services OpenAI User`
- Deploy models → `Cognitive Services OpenAI Contributor`
- Full management → `Cognitive Services Contributor`

### Pattern 4: "Which model/endpoint?"

- Handwriting → `prebuilt-read`
- QR codes → `prebuilt-read`
- Receipt fields → `prebuilt-receipt`
- Tables/structure → `prebuilt-layout`
- Different form per office → custom model

### Pattern 5: "Which API/method?"

- Disambiguate entities → `recognize_linked_entities` (returns Wikipedia URLs)
- Classify entities → `recognize_entities` (returns categories)
- Redact sensitive data → `recognize_pii_entities`
- Key phrases → `extract_key_phrases`

### Pattern 6: "Field mappings confusion"

- `fieldMappings` → source data columns to index fields (before enrichment)
- `outputFieldMappings` → enrichment tree nodes to index fields (after skillset)
- Custom skill outputs ALWAYS need `outputFieldMappings`

---

## Quick Reference Card

### Domain 3 Cheat Sheet

| Concept                       | Key Fact                                               |
| ----------------------------- | ------------------------------------------------------ |
| Agent thread                  | Persists conversation across multiple runs             |
| Code interpreter tool         | Runs Python in sandbox, can generate files             |
| File search tool              | Searches uploaded files using vector search            |
| LUIS container settings       | ApiKey, Billing, Eula, Mounts (all required)           |
| Document Translation glossary | Place in Azure Blob Storage, reference via glossaryUrl |
| Custom Neural Voice           | Requires voice talent consent (audio + written)        |

### Domain 4 Cheat Sheet

| Concept                      | Key Fact                                                       |
| ---------------------------- | -------------------------------------------------------------- |
| Multi-service resource       | One resource for multiple AI services, single key/endpoint     |
| Custom Vision min images     | 5 per tag (classification), 15 per tag (detection)             |
| Content Moderator categories | 1=sexual explicit, 2=suggestive, 3=offensive                   |
| Spatial Analysis             | Requires NVIDIA GPU on edge device                             |
| prebuilt-read                | Handwriting + printed + barcodes + QR codes                    |
| Entity Linking               | Returns Wikipedia URLs for disambiguation                      |
| LUIS phrase list             | Boosts recognition (interchangeable or non-interchangeable)    |
| LUIS entity vs phrase list   | Entity = structured extraction; phrase list = recognition hint |

### Domain 6 Cheat Sheet

| Concept              | Key Fact                                                    |
| -------------------- | ----------------------------------------------------------- |
| Custom Web API skill | HTTPS only, expects `values` array in request/response      |
| outputFieldMappings  | Required to persist custom skill output to index            |
| Knowledge Store      | Table (analytics), Object (JSON blobs), File (images)       |
| Semantic search      | Requires semantic configuration; Premium tier               |
| Vector search        | Needs embedding model + vector field in index               |
| Composed model       | Routes documents to best-matching custom sub-model          |
| ScoreThreshold (QnA) | Minimum confidence to return answer (0-100)                 |
| RankerType (QnA)     | `QuestionOnly` vs `Default` (question + answer)             |
| Azure OpenAI on data | `azure_search` type (new API), `AzureCognitiveSearch` (old) |

---

## Architecture Reasoning Drill (20 minutes)

### Scenario 1: Multi-Office Form Processing

**Setup**: A company has 12 regional offices, each using slightly different invoice layouts. They need to extract vendor, amount, and date from all invoices and store results in Azure AI Search for querying.

**Questions**:

1. Which Document Intelligence approach handles per-office layout variations?
2. How do you avoid deploying 12 separate endpoints?
3. What AI Search component maps extracted fields to index fields?

**Answers**:

1. Train a **custom extraction model** per office layout
2. Create a **composed model** — it auto-routes to the correct sub-model based on document structure
3. **outputFieldMappings** in the indexer (since extraction happens in a custom skill calling Doc Intelligence)

---

### Scenario 2: Customer Support Agent with Knowledge Base

**Setup**: A telecom company wants an AI agent that answers customer questions using their product manuals (stored as PDFs in Azure Blob Storage). The agent should cite sources and only answer from the company's data.

**Questions**:

1. Which Azure service grounds the agent's responses in company data?
2. What class configures this data source in the .NET SDK?
3. What's the minimum RBAC role for the app's service principal to call the completion API?

**Answers**:

1. **Azure OpenAI "On Your Data"** backed by **Azure AI Search** (PDFs indexed via AI Search)
2. `AzureSearchChatDataSource` (current SDK) — NOT `AzureChatExtensionConfiguration`
3. **Cognitive Services OpenAI User** (least privilege for inference)

---

### Scenario 3: Retail Product Image Analysis Pipeline

**Setup**: A retail company wants to: (a) detect product defects in manufacturing images, (b) extract handwritten inspection notes, (c) auto-categorize product photos.

**Questions**:

1. Which Custom Vision model type for defect detection?
2. Which Document Intelligence model for handwritten inspection notes?
3. Which Image Analysis feature for auto-categorization?

**Answers**:

1. **Object Detection** (need bounding boxes around defects, not just "defective or not")
2. **prebuilt-read** (handles handwritten text extraction)
3. **Tags** feature (returns content tags with confidence scores)

---

### Scenario 4: Cross-Domain Pipeline

**Setup**: A legal firm processes contracts. They need to: (a) extract entities (people, organizations) from contract text, (b) link entity mentions to their canonical Wikipedia entries for disambiguation, (c) index everything in AI Search with a custom skill that calls their compliance API.

**Questions**:

1. Which NLP feature for entity classification vs disambiguation?
2. What does Entity Linking return that NER does not?
3. What must the indexer include for the compliance custom skill output?

**Answers**:

1. **NER** (`recognize_entities`) for classification; **Entity Linking** (`recognize_linked_entities`) for disambiguation
2. **Wikipedia URL** (`url` field) and `dataSource: "Wikipedia"`
3. **outputFieldMappings** — mapping the custom skill's enrichment node to the index field

---

## Related Questions

This review covers questions across Domains 3, 4, and 6. Run the quiz with:

```powershell
python quiz_runner.py questions.json --cross 3,4,6 --limit 20 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [AzureSearchChatExtensionConfiguration Class (Java)](https://learn.microsoft.com/en-us/java/api/com.azure.ai.openai.models.azuresearchchatextensionconfiguration)
- [Azure OpenAI On Your Data API Reference](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/references/on-your-data)
- [Azure.AI.OpenAI.Chat Namespace (.NET)](https://learn.microsoft.com/en-us/dotnet/api/azure.ai.openai.chat)
- [Using your data with Azure OpenAI Service](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/use-your-data)
- [Choose the best Document Intelligence model](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/concept/choose-model-feature)
- [Document Processing Models overview](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/model-overview)
- [Role-based access control for Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/role-based-access-control)
- [Custom Web API Skill in Skillsets](https://learn.microsoft.com/en-us/azure/search/cognitive-search-custom-skill-web-api)
- [Map enriched output to index fields (outputFieldMappings)](https://learn.microsoft.com/en-us/azure/search/cognitive-search-output-field-mapping)
- [Entity Linking cognitive skill (v3)](https://learn.microsoft.com/en-us/azure/search/cognitive-search-skill-entity-linking-v3)
- [How to use Entity Linking API](https://learn.microsoft.com/en-us/azure/ai-services/language-service/entity-linking/how-to/call-api)
- [LinkedEntity interface (JS SDK)](https://learn.microsoft.com/en-us/javascript/api/@azure/ai-language-text/linkedentity)
- [LUIS Container Configuration](https://learn.microsoft.com/en-us/azure/ai-services/luis/luis-container-configuration)

---

## Notes (your own words — fill this in after studying)

_(Space for your personal notes after reviewing this material)_
