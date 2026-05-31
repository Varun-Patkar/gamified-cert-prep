# Day 26: Document Intelligence — Prebuilt, Custom, and Composed Models

**Date**: 2026-05-31
**Domain**: Domain 6 — Implement knowledge mining and document intelligence solutions (10-15%)
**Subtopics**: Prebuilt models, custom template/neural models, composed models, Document Intelligence API, layout vs read, training requirements
**Estimated study time**: 1 hr

---

## TL;DR (60-second skim)

- **Azure Document Intelligence** (formerly Form Recognizer) extracts structured data from documents using prebuilt, custom, or composed models.
- **Prebuilt models** cover invoice, receipt, ID, health insurance card, W-2, business card (deprecated in v4.0), bank statements, checks, mortgage forms, etc.
- **Custom template** models need consistent visual layout (fixed-form); **custom neural** models handle varied layouts (semi-structured/unstructured). Start with neural if it meets your needs.
- **Composed models** (v4.0) combine a trained classifier + multiple custom extraction models with explicit routing. Up to 500 models per composed model.
- API pattern: call `POST /documentModels/{modelId}:analyze` → poll with `GET` using `Operation-Location` header → get results.
- **Training minimums**: 5 labeled docs for template, custom neural also starts at 5 but benefits from more. Max training data: 500 pages / 50 MB template; 50,000 pages / 1 GB neural.
- **Read model** = OCR text extraction only. **Layout model** = text + tables + selection marks + structure. Layout subsumes the old General Document model.
- Today's **quiz questions are ALL cross-domain** (Topics 7-8: Azure OpenAI params, Content Safety, QnA Maker). Study the refresher table carefully.

---

## Learning Objectives

After this session you should be able to:

1. Select the correct prebuilt model for a given document type (invoice vs receipt vs ID vs layout)
2. Decide between custom template and custom neural models based on document structure
3. Explain how composed models work in v4.0 (explicit classifier + conditional routing)
4. Describe the Document Intelligence API async polling pattern
5. State training data requirements (min docs, max pages, max size) for each model type
6. List supported input formats and size limits
7. Answer cross-domain quiz questions on Azure OpenAI parameters, Content Safety, and QnA Maker RBAC

---

## Key Concepts

### 1. Document Intelligence Overview

Azure Document Intelligence (formerly Azure Form Recognizer) is a cloud-based AI service for extracting text, key-value pairs, tables, and structure from documents. It supports:

- **Document analysis models**: Read, Layout
- **Prebuilt models**: Invoice, Receipt, ID, Health Insurance Card, Tax forms, Mortgage forms, Contract, Bank Statement, Check, Pay Stub, Credit Card, Marriage Certificate, Business Card (deprecated v4.0)
- **Custom models**: Template, Neural, Composed, Classifier
- **Add-on capabilities**: High-resolution OCR, formula extraction, font extraction, barcode extraction, language detection, query fields, searchable PDF, key-value pairs

**API versions**:
- v4.0 `2024-11-30` (current GA)
- v3.1 (GA, legacy)
- v3.0 (retiring)
- v2.1 (retiring — end of support Sep 2027)

### 2. Document Analysis Models

#### Read Model (`prebuilt-read`)
- **Purpose**: Pure OCR — extracts printed and handwritten text, lines, words, detected languages, handwriting style
- **Does NOT extract**: Tables, selection marks, key-value pairs, document structure
- **Unique capability**: Searchable PDF output (add-on)
- **Use when**: You only need raw text extraction / digitization

#### Layout Model (`prebuilt-layout`)
- **Purpose**: Extracts text + tables + selection marks + document structure (titles, section headings, headers, footers, page numbers, figures)
- **Subsumes**: The old General Document model (deprecated — all its capabilities are now in Layout)
- **Use when**: You need structured extraction (tables, checkboxes, headings) but don't need domain-specific fields
- **Supports**: Key-value pairs (as add-on via `keyValuePairs` feature)

**Exam trap**: Read vs Layout — Read is text-only; Layout adds tables, selection marks, and structure. If a question mentions extracting tables, you need Layout, not Read.

### 3. Prebuilt Models

Pre-trained by Microsoft, no custom training needed. Key prebuilt models:

| Model ID | Extracts | Use Case |
|---|---|---|
| `prebuilt-invoice` | Customer/vendor, amounts, line items, due date | Accounts payable |
| `prebuilt-receipt` | Merchant, date, items, totals, tax | Expense management |
| `prebuilt-idDocument` | US driver's license, international passport bio pages | KYC, identity verification |
| `prebuilt-healthInsuranceCard.us` | Member ID, group #, plan, insurer | Coverage verification |
| `prebuilt-tax.us.w2` | Employer, employee, wages, tax withheld | Tax processing |
| `prebuilt-tax.us` | Unified — auto-detects US tax form type (W-2, 1040, 1098, 1099) | Universal tax extraction |
| `prebuilt-contract` | Parties, jurisdictions, contract ID, title | Legal processing |
| `prebuilt-bankStatement` | Account #, transactions, balances | Financial processing |
| `prebuilt-check.us` | Check amount, payee, account, routing | Check processing |
| `prebuilt-payStub.us` | Pay period, earnings, deductions | Payroll verification |
| `prebuilt-creditCard` | Card number, expiry, cardholder | Payment processing |
| `prebuilt-marriageCertificate.us` | Names, date, location | Personal identification |
| `prebuilt-mortgage.us.*` | 1003, 1004, 1005, 1008, Closing Disclosure | Mortgage processing |

**Business Card model**: Deprecated in v4.0 (was available in v3.1 and earlier).

### 4. Custom Models

When prebuilt models don't cover your document type, train a custom model.

#### Custom Template Model (`buildMode: "template"`)
- **Best for**: Fixed-layout forms — surveys, questionnaires, standardized applications
- **Requires**: Consistent visual template (same positions for fields across all documents)
- **Training time**: 1-5 minutes
- **Extracts**: Key-value pairs, tables, selection marks, coordinates, signatures
- **Does NOT support**: Overlapping fields
- **Max training data**: 500 pages, 50 MB
- **Language**: Broadest language support

#### Custom Neural Model (`buildMode: "neural"`)
- **Best for**: Variable-layout documents — different versions of the same form (e.g., W-2s from different employers)
- **Handles**: Structured, semi-structured, AND unstructured documents
- **Training time**: 30 min to 12 hours (default 30 min; paid training available for longer)
- **Extracts**: Key-value pairs, selection marks, tables
- **Supports**: Overlapping fields (v4.0), signature detection (v4.0), table/row/cell confidence (v4.0)
- **Max training data**: 50,000 pages, 1 GB
- **Recommendation**: Start with neural if it meets your needs — it's more flexible and generally higher accuracy

#### Custom Classifier
- Identifies document type BEFORE extraction
- Available since `2023-07-31` GA
- Requires: Minimum 2 classes, minimum 5 samples per class
- v4.0 supports incremental training and Office document types for classification
- Max training data: 1 GB / 10,000 pages (v4.0: 2 GB / 10,000 pages)

### 5. Composed Models

A composed model groups multiple custom extraction models under a single model ID.

#### v4.0 Composed Models (Current)
- **Explicit classification**: Requires a trained classifier model for routing
- **Conditional routing**: You define confidence thresholds and which doc types map to which extraction models
- **Benefits**:
  - Incremental improvement of classifier independently
  - Can ignore certain document types (skip extraction)
  - `splitMode` parameter: `none`, `perPage`, `auto` — handles multiple documents in one file
  - Supports add-on features (query fields, barcodes)
  - Up to **500** custom models per composed model
- **Billing**: Classification charges + extraction charges per page

#### Legacy Composed Models (v3.1 and earlier)
- **Implicit classification**: System auto-selects best model based on confidence
- Up to **200** custom models per composed model
- No confidence threshold control

**Exam trap**: v4.0 composed = explicit classifier + routing. v3.1 composed = implicit auto-selection. If a question mentions "composed model" without version context, know both behaviors.

### 6. Document Intelligence API Pattern

```
# Step 1: Submit document for analysis
POST {endpoint}/documentintelligence/documentModels/{modelId}:analyze?api-version=2024-11-30
Content-Type: application/json
Body: { "urlSource": "https://..." }  OR  multipart/form-data with file

# Step 2: Get Operation-Location header from 202 response
Operation-Location: {endpoint}/documentintelligence/documentModels/{modelId}/analyzeResults/{resultId}

# Step 3: Poll until status = "succeeded"
GET {endpoint}/documentintelligence/documentModels/{modelId}/analyzeResults/{resultId}

# Step 4: Parse JSON results
```

Key points:
- **Asynchronous**: POST returns 202 Accepted, not results
- **Polling**: Use `Operation-Location` header URL
- **Status values**: `notStarted`, `running`, `succeeded`, `failed`
- Results include: `content` (full text), `pages`, `tables`, `keyValuePairs`, `documents` (extracted fields)

### 7. Input Requirements

| Requirement | Detail |
|---|---|
| File formats | PDF, JPEG/JPG, PNG, BMP, TIFF, DOCX/XLSX/PPTX (v4.0) |
| Max file size | 500 MB (S0 paid), 4 MB (F0 free) |
| Image dimensions | 50×50 to 10,000×10,000 pixels |
| PDF pages | Up to 2,000 (free tier: first 2 only) |
| PDF size | Up to 17×17 inches (Legal/A3) |
| Password-locked PDFs | Must remove lock before submission |
| Min text height | 12 pixels for 1024×768 image (~8pt at 150 DPI) |
| Office file max | 8 million characters |

---

## Decision Frameworks

### Which Model to Use?

```
Is your document a standard type (invoice, receipt, ID, tax form, etc.)?
├── YES → Use the matching PREBUILT model
└── NO → Is your document layout fixed/consistent?
    ├── YES → Custom TEMPLATE model
    └── NO → Does your document have variable layouts?
        ├── YES → Custom NEURAL model
        └── Do you have multiple document types arriving together?
            └── YES → COMPOSED model (classifier + extraction models)
```

### Read vs Layout vs Prebuilt?

```
Do you need ONLY raw text?
├── YES → prebuilt-read
└── NO → Do you need tables, checkboxes, structure?
    ├── YES, but no domain-specific fields → prebuilt-layout
    └── YES, and I need domain-specific fields (invoice amounts, receipt items) → Prebuilt domain model
```

---

## Comparisons (X vs Y tables)

| Feature | Custom Template | Custom Neural |
|---|---|---|
| Document type | Fixed layout / static forms | Variable layout / mixed |
| Build mode | `template` | `neural` |
| Training time | 1-5 minutes | 30 min - 12 hours |
| Min training docs | 5 | 5 |
| Max training pages | 500 | 50,000 |
| Max training size | 50 MB | 1 GB |
| Overlapping fields | No | Yes (v4.0) |
| Signatures | Yes | Yes (v4.0) |
| Cross-page tables | Yes | Yes |
| One model per variation? | Yes | No — single model handles variations |
| Recommended first? | No | Yes — start here |

| Feature | Read | Layout |
|---|---|---|
| Text extraction | Yes | Yes |
| Tables | No | Yes |
| Selection marks | No | Yes |
| Key-value pairs | No | Yes (add-on) |
| Document structure | No | Yes (titles, headings, headers/footers) |
| Figures | No | Yes |
| Searchable PDF | Yes (add-on) | No |

| Feature | Composed v4.0 | Composed v3.1 |
|---|---|---|
| Classification | Explicit (trained classifier) | Implicit (auto-select) |
| Max models | 500 | 200 |
| Confidence control | Yes (thresholds) | No |
| Split mode | Yes (none/perPage/auto) | No |
| Skip doc types | Yes | No |
| Add-on features | Yes | No |

---

## Important Details for Exam

- **Model IDs follow pattern**: `prebuilt-invoice`, `prebuilt-receipt`, `prebuilt-idDocument`, `prebuilt-layout`, `prebuilt-read`
- **Unified tax model** `prebuilt-tax.us` auto-detects the specific US tax form type
- **Business card model is DEPRECATED** in v4.0
- **General Document model** is deprecated — its capabilities are merged into Layout
- **Custom neural default training** is 30 minutes; paid training extends beyond 30 min
- **Custom classifier minimum**: 2 classes, 5 samples per class
- **Composed model v4.0**: requires explicit classifier + explicit mapping
- **File size**: 500 MB paid, 4 MB free
- **PDF pages**: 2,000 max (free: 2 pages only)
- **API is async**: POST → 202 → poll with GET → succeeded
- **v4.0 GA API version string**: `2024-11-30`
- **SDK languages**: C#, Python, Java, JavaScript
- **Bounding box** in v3.0+ uses `polygon` (array of coordinate pairs)
- **Add-on features incur extra cost**: highResolution, formulas, fonts, queryFields, searchablePDF
- **Free add-ons**: barcode extraction, language detection, key-value pairs

---

## Common Traps & Misconceptions

1. **"Read model can extract tables"** — WRONG. Read is OCR text only. You need Layout for tables.
2. **"General Document model is available in v4.0"** — WRONG. It's deprecated; use Layout instead.
3. **"Business card model works in v4.0"** — WRONG. Deprecated. Only in v3.1 and earlier.
4. **"Custom template handles variable layouts"** — WRONG. Template requires consistent visual layout. Use neural for variable.
5. **"Composed models in v4.0 auto-select the best model"** — WRONG. v4.0 requires explicit classifier. Auto-selection was v3.1 behavior.
6. **"You need 10 documents minimum for custom template"** — WRONG. Minimum is 5 for both template and neural.
7. **"Free tier can process entire PDFs"** — WRONG. Free tier processes only the first 2 pages.
8. **"Custom neural training is instant"** — WRONG. Default 30 minutes; can take up to 12 hours with paid training.
9. **"Composed model max is 200 models"** — That's v3.1. In v4.0 it's 500.
10. **"Password-locked PDFs are supported"** — WRONG. You must remove the lock first.

---

## Real-World Scenarios

**Scenario 1**: A hospital needs to digitize patient intake forms that all follow the same layout.
→ **Custom template model** — fixed visual layout, fast training.

**Scenario 2**: An insurance company receives claims from 50 different providers, each with different form layouts but containing the same information.
→ **Custom neural model** — handles variable layouts with a single model.

**Scenario 3**: A law firm receives mixed document packages (contracts, invoices, ID cards). They need to automatically sort and extract.
→ **Composed model** with classifier — classify first, then route to appropriate extraction model (prebuilt-contract, prebuilt-invoice, prebuilt-idDocument).

**Scenario 4**: A retail company wants to automate expense reports by extracting receipt details.
→ **prebuilt-receipt** — pre-trained for merchant, date, items, totals.

**Scenario 5**: A government agency needs to process US driver's licenses for identity verification.
→ **prebuilt-idDocument** — extracts driver's license fields including endorsements and restrictions.

---

## Quick Reference Card

| Item | Value |
|---|---|
| Service name | Azure Document Intelligence (formerly Form Recognizer) |
| Current GA API | `2024-11-30` (v4.0) |
| Analyze endpoint | `POST .../documentModels/{modelId}:analyze` |
| Polling | `GET` the `Operation-Location` URL |
| Max file size (paid) | 500 MB |
| Max file size (free) | 4 MB |
| Max PDF pages | 2,000 (free: 2) |
| Image dimensions | 50×50 to 10,000×10,000 px |
| Custom template training | 1-5 min, max 500 pages / 50 MB |
| Custom neural training | 30 min-12 hr, max 50,000 pages / 1 GB |
| Custom classifier minimum | 2 classes, 5 samples/class |
| Composed model max (v4.0) | 500 models |
| Composed model max (v3.1) | 200 models |
| SDKs | C#, Python, Java, JavaScript |
| Build mode property | `template` or `neural` |

---

## Cross-Domain Quiz Question Refreshers

**CRITICAL**: All 11 quiz questions today are from Topics 7-8 (Azure OpenAI / Content Safety / QnA Maker). Study this section thoroughly — it determines your quiz score.

### Azure OpenAI Parameters (Questions: mEVcvTytKZwXGRdPqtBa, q9xO7eM4Zny5B4Xy1zwc, ySc713rLrB2m1vOp3N1F)

| Parameter | Range | Effect | For DETERMINISTIC | For CREATIVE |
|---|---|---|---|---|
| **Temperature** | 0-2 | Controls randomness. Lower = more focused/deterministic. Higher = more random/creative | Set LOW (e.g., 0) | Set HIGH (e.g., 1.5-2) |
| **Top P** (nucleus sampling) | 0-1 | Controls token pool. Lower = fewer tokens considered. Higher = more diverse | Set LOW (e.g., 0.1) | Set HIGH (e.g., 0.9) |
| **Frequency penalty** | 0-2 | Penalizes repeated tokens. Higher = less repetition | Not primary control | Higher for variety |
| **Presence penalty** | 0-2 | Penalizes tokens that appeared at all. Higher = more novel topics | Not primary control | Higher for novelty |
| **Max response** (max_tokens) | Varies | Maximum tokens in response | Doesn't affect creativity | Doesn't affect creativity |
| **Stop sequences** | Strings | Tokens that stop generation | Doesn't affect creativity | Doesn't affect creativity |

**Exam trap**: For "more deterministic, less creative" → lower Temperature AND lower Top P. For "more creative, less deterministic" → higher Temperature. The exam tests you know which parameters control creativity vs. which control length/stopping.

**Key**: Temperature and Top P are the TWO parameters that control creativity/determinism. Max tokens, stop sequences, frequency/presence penalty are NOT the primary controls for this.

### ChatRole Enum in Azure OpenAI SDK (Questions: q9xO7eM4Zny5B4Xy1zwc, ySc713rLrB2m1vOp3N1F)

```csharp
// C# SDK
var chatMessages = new List<ChatMessage>
{
    new ChatMessage(ChatRole.System, "You are a helpful assistant."),   // System instruction
    new ChatMessage(ChatRole.User, "What is Azure?"),                   // User's question
    new ChatMessage(ChatRole.Assistant, "Azure is Microsoft's cloud.") // Prior assistant response
};

var options = new ChatCompletionsOptions
{
    Temperature = 1.5f,  // Higher = more creative
    // ... other options
};
```

| ChatRole | Purpose |
|---|---|
| `ChatRole.System` | Sets assistant behavior/persona (system prompt) |
| `ChatRole.User` | Represents the human user's input |
| `ChatRole.Assistant` | Represents prior AI responses (for context/few-shot) |

**Exam trap**: When code asks "which role for the user's message?" → `ChatRole.User`. When code asks "which property for creativity?" → `Temperature`. The question may show garbled option labels — focus on the concept.

### QnA Maker Integration & RBAC (Questions: qB2JbI6mQxYp6LeEH510, 7U635sBPXBJl2yUHep7f)

#### QnAMakerOptions (Bot Framework SDK)

```csharp
var options = new QnAMakerOptions
{
    ScoreThreshold = 0.70f,  // Only return answers with ≥70% confidence
    Top = 3,                  // Return top 3 answers
    StrictFilters = new[] { new Metadata("category", "billing") },
    RankerType = "QuestionOnly" // or "AutoSuggestQuestion"
};
```

**Key property**: `ScoreThreshold` — float between 0 and 1. Set to 0.70 for 70% confidence minimum. Answers below this threshold are NOT returned.

#### QnA Maker RBAC Roles

| Role | Permissions |
|---|---|
| **Cognitive Services User** | Approve/publish knowledge base, query endpoint |
| **QnA Maker Editor** | Create, amend, edit knowledge base content |
| **QnA Maker Reader** | Browse/read knowledge base (read-only) |

**Exam pattern**: Match the action to the correct role. "Create and amend" = Editor. "Approve and publish" = Cognitive Services User. "Browse" = Reader.

### OpenAI Fine-Tuning Data Preparation (Question: yWTIgbDzuiXoM1HDn2SP)

The OpenAI CLI data preparation tool accepts these formats:

| Format | Supported? |
|---|---|
| **CSV** | ✅ Yes |
| **TSV** | ✅ Yes |
| **XLSX** | ✅ Yes |
| **JSON / JSONL** | ✅ Yes |
| **XML** | ❌ No |
| **PDF** | ❌ No |

**Exam trap**: TSV and XLSX are valid. XML and PDF are NOT valid for the data preparation tool. The question may present a list of files and ask which can be used.

### Chatbot Response Quality Improvement (Question: z9c19TtPfhX4hjy6DFk3)

| Approach | Effort Level | Description |
|---|---|---|
| **Grounding content** | LOW / MINIMAL | Add relevant context/data alongside the prompt to improve response accuracy |
| **Sample request/response pairs** | LOW / MINIMAL | Provide few-shot examples in the prompt to guide the model's behavior |
| **Fine-tuning** | HIGH | Requires curated training dataset, compute time, cost |
| **Custom LLM** | VERY HIGH | Building/hosting your own model — maximum effort |

**Answer**: For "improve quality with MINIMAL effort" → Grounding content (B) + Sample request/response pairs (C). Fine-tuning and custom LLMs are high-effort approaches.

### Azure AI Content Safety (Questions: 2rI4Ikz80dALOWvMdPcR, 8AyoQ3NA0S2HTGyKMKSy, BjIQLORvTg8FRrjRQpSL, HvqiyXrVHQh9iTubV6sS)

#### Severity Scale
- **Range**: 0, 2, 4, 6 (integers, not floats — mapped to 0-7 conceptual range)
- **0** = benign / no harmful content detected
- **2** = low severity
- **4** = medium severity
- **6** = high severity
- A benign image (e.g., a circle) returns severity **0** (integer, not 0.0 float)

#### Content Safety SDK Code Pattern

```csharp
// Step 1: Create client
var client = new ContentSafetyClient(
    new Uri(endpoint),
    new AzureKeyCredential(key));

// Step 2: Create request for image analysis
var request = new AnalyzeImageOptions(
    new ContentSafetyImageData(BinaryData.FromBytes(imageBytes)));

// Step 3: Analyze
AnalyzeImageResult result = client.AnalyzeImage(request);

// Step 4: Read results — each category has a severity integer
int hateSeverity = result.CategoriesAnalysis
    .First(c => c.Category == ImageCategory.Hate).Severity;
```

**Key classes**:
- `ContentSafetyClient` — the client class (NOT `ContentModeratorClient`, NOT `ContentFilterClient`)
- `client.AnalyzeImage(request)` — for images
- `client.AnalyzeText(request)` — for text

#### Content Safety Studio Features

| Feature | Purpose | Use for Testing Sample Questions? |
|---|---|---|
| **Moderate Text Content** | Test text moderation with samples, configure filters | Can test sample content ✅ |
| **Moderate Image Content** | Test image moderation with samples, configure filters | Can test sample content ✅ |
| **Protected Material Detection** | Detect known copyrighted text (songs, articles, recipes) in AI outputs | Tests for **copyrighted content**, NOT objectionable content ❌ |
| **Monitor Online Activity** | Dashboard for tracking moderation API usage, trends, latency, errors | Real-time **monitoring/analytics**, NOT for testing samples ❌ |

**Exam traps**:
1. **"Can Protected Material Detection be used to test objectionable content?"** → **NO**. Protected material = copyrighted/known text content. For objectionable content, use Moderate Text/Image.
2. **"Can Monitor Online Activity be used to test sample questions?"** → **NO**. It's a monitoring dashboard for API usage metrics, not a content testing tool.
3. **Severity output for benign image**: Returns **0** as an **integer**, not a float (not 0.0).

---

## Cross-Domain Quiz Question Refreshers (Summary Table)

| Concept | Key Fact | Trap |
|---|---|---|
| Temperature parameter | 0-2 range; lower = deterministic, higher = creative | Max tokens and stop sequences do NOT control creativity |
| Top P parameter | 0-1 range; lower = fewer tokens considered = more deterministic | Often paired with Temperature in exam questions |
| ChatRole.User | Represents the human user's message in chat completion | Not ChatRole.System (that's the system prompt) |
| ChatRole.System | Sets behavior/persona of the assistant | Not used for user queries |
| QnAMakerOptions.ScoreThreshold | Float 0-1; filters answers below confidence threshold | Property name is `ScoreThreshold`, not `ConfidenceThreshold` |
| QnA Maker Editor role | Create and amend KB content | Cannot publish — that requires Cognitive Services User |
| QnA Maker Reader role | Browse/read KB only | Cannot edit or publish |
| Cognitive Services User role | Approve and publish KB | Cannot create/edit content directly |
| OpenAI data prep: valid formats | CSV, TSV, XLSX, JSON/JSONL | XML and PDF are NOT valid |
| Grounding content | Add context to prompt — minimal effort quality boost | Not the same as fine-tuning |
| Sample request/response pairs | Few-shot prompting — minimal effort | Not the same as building custom LLM |
| ContentSafetyClient | Client class for Content Safety SDK | Not ContentModeratorClient |
| client.AnalyzeImage() | Method for image analysis | Not client.ModerateImage() |
| Severity scale | Integers 0, 2, 4, 6 (benign = 0) | NOT floats; benign circle image = 0 |
| Protected material detection | Detects known copyrighted text in AI output | Does NOT detect objectionable content |
| Monitor online activity | API usage dashboard / analytics | NOT for testing sample content |

---

## Related Questions in questions.json

All 11 questions are **cross-domain carryover** from Topics 7-8:

| # | Question ID | Topic | Tests |
|---|---|---|---|
| 1 | `mEVcvTytKZwXGRdPqtBa` | Azure OpenAI | Temperature + Top P for deterministic responses |
| 2 | `q9xO7eM4Zny5B4Xy1zwc` | Azure OpenAI | ChatRole.User + temperature property in code |
| 3 | `qB2JbI6mQxYp6LeEH510` | QnA Maker | QnAMakerOptions.ScoreThreshold for 70% confidence |
| 4 | `ySc713rLrB2m1vOp3N1F` | Azure OpenAI | ChatRole.User + temperature (duplicate scenario) |
| 5 | `yWTIgbDzuiXoM1HDn2SP` | Azure OpenAI | Valid fine-tuning data formats (TSV, XLSX yes; XML, PDF no) |
| 6 | `z9c19TtPfhX4hjy6DFk3` | Azure OpenAI | Grounding content + samples = minimal effort quality improvement |
| 7 | `2rI4Ikz80dALOWvMdPcR` | Content Safety | Protected material ≠ objectionable content filter |
| 8 | `7U635sBPXBJl2yUHep7f` | Content Safety | QnA Maker RBAC roles (User/Editor/Reader) |
| 9 | `8AyoQ3NA0S2HTGyKMKSy` | Content Safety | Severity 0 (integer) for benign image |
| 10 | `BjIQLORvTg8FRrjRQpSL` | Content Safety | ContentSafetyClient + AnalyzeImage SDK code |
| 11 | `HvqiyXrVHQh9iTubV6sS` | Content Safety | Monitor online activity ≠ testing tool |

Quiz command:

```powershell
cd "d:\Projects\microsoft-exam-prep\AI-102 Prep"; python quiz_runner.py --day 26
```

Or web mode (recommended for hotspot questions with images):

```powershell
cd "d:\Projects\microsoft-exam-prep\AI-102 Prep"; python quiz_runner.py --day 26 --web
```

---

## Sources (verified during this session)

- [What is Azure Document Intelligence?](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/overview?view=doc-intel-4.0.0)
- [Document processing models (model overview)](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/model-overview?view=doc-intel-4.0.0)
- [Document Intelligence custom models](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/train/custom-model?view=doc-intel-4.0.0)
- [Composed custom models](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/train/composed-models?view=doc-intel-4.0.0)
- [What is Azure AI Content Safety?](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview)

---

## Notes (your own words — fill this in after studying)

_(Use this space to add your own notes, mnemonics, or observations after reading through the material and completing the quiz)_
