# Day 16: Document Intelligence, AI Search & Video/Spatial Analysis

**Date**: 2026-05-21
**Domain**: Domain 4 — Implement computer vision solutions (15–20%)
**Subtopics**: Document Intelligence models (prebuilt, custom template, custom neural), AI Search key management & knowledge store projections, Immersive Reader, Video Indexer & Spatial Analysis overview
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)

- **prebuilt-read** = OCR + handwriting extraction + barcode/QR code support; use `DocumentAnalysisClient` in Python
- **Custom template** = structured/fixed-layout forms; **Custom neural** = structured + semi-structured + unstructured docs (surveys, invoices, contracts)
- **healthInsuranceCard** model extracts US insurance card fields — NOT medical records; wrong model → empty `fields` object
- AI Search has **2 admin keys** (primary + secondary) for key rotation; **query keys** are read-only
- Knowledge store projections: **Table** → Azure Table Storage, **Object** → Blob (JSON), **File** → Blob (binary images)
- **Immersive Reader** = picture dictionary for common words (language learning)
- Business card model v2.1 lacks QR code support → use **prebuilt-read** model for barcode/QR extraction

---

## Learning Objectives

After this session you should be able to:

1. Select the correct Document Intelligence model (prebuilt vs custom template vs custom neural) for a given scenario
2. Write Python code using `DocumentAnalysisClient` for handwritten PDF analysis
3. Explain AI Search admin key rotation procedure to minimize downtime
4. Identify knowledge store projection types (Table, Object, File) and map them to data types
5. Know when to use Immersive Reader vs other Azure AI services
6. Interpret Document Intelligence API responses (empty fields, confidence scores)

---

## Key Concepts

### 1. Azure AI Document Intelligence — Model Taxonomy

#### Document Analysis Models (General Extraction)

| Model ID          | Purpose                                                      | Key Use Cases                                                |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `prebuilt-read`   | OCR — extract printed + handwritten text, barcodes, QR codes | Digitizing docs, handwriting recognition, barcode extraction |
| `prebuilt-layout` | Text + tables + selection marks + document structure         | Document indexing, report analysis                           |

#### Prebuilt Models (Domain-Specific)

| Model ID                          | Purpose                                          | Exam Relevance                                         |
| --------------------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| `prebuilt-invoice`                | Invoices: customer, vendor, amounts, line items  | **Q4, Q8**: supplier invoices → prebuilt invoice model |
| `prebuilt-receipt`                | Sales receipts: merchant, dates, totals          | —                                                      |
| `prebuilt-healthInsuranceCard.us` | US health insurance cards: coverage, member info | **Q3**: NOT for medical records!                       |
| `prebuilt-contract`               | Contracts: parties, jurisdictions, title         | —                                                      |
| `prebuilt-idDocument`             | Passports, driver's licenses                     | —                                                      |
| `prebuilt-tax.us.*`               | US tax forms (W-2, 1040, 1099, etc.)             | —                                                      |
| `prebuilt-businessCard`           | **DEPRECATED in v4.0** — business cards          | **Q9**: v2.1 lacks QR codes                            |

#### Custom Models

| Type                  | Build Mode              | Best For                                                                                                     | Training Data Limit  |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------- |
| **Custom template**   | `buildMode: "template"` | Structured forms with **fixed visual layout** (authorization forms, employment applications, tax-like forms) | 500 pages, 50 MB     |
| **Custom neural**     | `buildMode: "neural"`   | **Mixed**: structured (surveys) + semi-structured (invoices) + unstructured (contracts, letters)             | 50,000 pages, 1 GB   |
| **Custom composed**   | N/A                     | Combine up to 200 custom models under one model ID                                                           | —                    |
| **Custom classifier** | N/A                     | Identify document type before extraction; min 2 classes, 5 samples/class                                     | 10,000 pages, 1–2 GB |

### 2. prebuilt-read Model — Deep Dive

The **Read (OCR)** model is the most fundamental model:

- Extracts **printed and handwritten** text with word-level locations
- Detects **handwriting style** (handwritten vs printed classification)
- **Barcode/QR code extraction** — free add-on capability (`ocr.barcode`)
- Supports **searchable PDF** output (add-on, read model only)
- Language detection (free add-on)

**Python SDK Pattern:**

```python
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential

# Create client
client = DocumentIntelligenceClient(
    endpoint="<endpoint>",
    credential=AzureKeyCredential("<key>")
)

# Analyze document — note: older SDK uses DocumentAnalysisClient
with open("handwritten.pdf", "rb") as f:
    poller = client.begin_analyze_document("prebuilt-read", body=f)
result = poller.result()

# Filter by confidence
for page in result.pages:
    for word in page.words:
        if word.confidence >= 0.8:  # confidence threshold
            print(word.content)
```

> **EXAM NOTE**: The older Python SDK (azure-ai-formrecognizer) uses `DocumentAnalysisClient`. The newer SDK (azure-ai-documentintelligence) uses `DocumentIntelligenceClient`. Both appear in exam questions — Q5 and Q7 use `DocumentAnalysisClient`.

### 3. Document Intelligence Response Structure

A typical response includes:

- `analyzeResult.content` — full extracted text
- `analyzeResult.pages[]` — per-page words, lines, selection marks
- `analyzeResult.documents[].fields` — **extracted field key-value pairs** (prebuilt/custom models)
- `analyzeResult.tables[]` — extracted tables

**Critical for Q3**: If the `fields` object is **empty** (`{}`), it means:

- The model did NOT recognize any fields in the document
- This typically indicates the **wrong model was used** for the document type
- Example: using `prebuilt-healthInsuranceCard.us` on medical records → empty fields

### 4. Azure AI Search — Key Management

#### Key Types

| Key Type       | Count                   | Access Level                                   | Purpose                           |
| -------------- | ----------------------- | ---------------------------------------------- | --------------------------------- |
| **Admin keys** | 2 (primary + secondary) | Full read-write (create/modify/delete indexes) | Index management, data operations |
| **Query keys** | Up to 50                | Read-only (search documents)                   | Client-side queries               |

#### Key Rotation Procedure (Compromised Primary Key) — Q1

The correct order to **minimize downtime**:

```
1. Regenerate the SECONDARY admin key (get a fresh key)
2. Update the app to use the new SECONDARY key
3. Regenerate the PRIMARY key (the compromised one)
```

**Why this order?**

- You can't switch to secondary and THEN regenerate it — the app would break
- You regenerate secondary first (it wasn't in use), switch the app, then safely regenerate the compromised primary
- Answer: **C** — Regenerate secondary → switch app to secondary → regenerate primary

> **TRAP**: Option A says "Regenerate primary first" — this would immediately break the app since it's currently using the primary key!

### 5. AI Search Knowledge Store Projections — Q6

Knowledge stores output enrichment pipeline results to Azure Storage:

| Projection Type | Storage Target      | Use Case                                         | Data Format                                         |
| --------------- | ------------------- | ------------------------------------------------ | --------------------------------------------------- |
| **Table**       | Azure Table Storage | Rows/columns, structured data, Power BI analysis | Schematized with Shaper skill                       |
| **Object**      | Azure Blob Storage  | Full JSON representation of enrichments          | JSON documents                                      |
| **File**        | Azure Blob Storage  | Normalized binary image files                    | Binary (images from `normalized_images` collection) |

**Q6 Mapping:**

- Unstructured JSON data → **Object projection** (JSON → Blob Storage)
- Scanned PDF documents with text → **File projection** (binary files → Blob Storage)

> **KEY DETAIL**: File projections work ONLY with the `normalized_images` collection — they store binary image content extracted during document cracking.

### 6. Azure AI Immersive Reader — Q2

Immersive Reader is a reading accessibility tool with key features:

- **Picture Dictionary** — displays pictures for commonly used words/phrases
- Parts of speech highlighting
- Text-to-speech (read aloud)
- Real-time translation
- Syllable splitting
- Content isolation for readability

**Q2 Mapping:**

- Extract key fields from lesson plans → **Azure AI Document Intelligence**
- Provide students with pictures for common words → **Azure AI Immersive Reader** (Picture Dictionary feature)

---

## Decision Frameworks

### Which Document Intelligence Model to Use?

```
Is there a prebuilt model for this document type?
├── YES: Invoices, receipts, IDs, tax forms, insurance cards, contracts
│   └── Use the prebuilt model (minimize dev effort)
├── NO: Organization-specific documents
│   ├── Fixed, consistent layout (forms, applications)?
│   │   └── Custom TEMPLATE model
│   ├── Mixed structured + unstructured content?
│   │   └── Custom NEURAL model
│   └── Multiple document types in one pipeline?
│       └── Custom COMPOSED model (combine up to 200 models)
└── Just need text/OCR/handwriting/barcodes?
    └── prebuilt-read
```

### Custom Template vs Custom Neural — Quick Decision

| Question                                      | Template         | Neural             |
| --------------------------------------------- | ---------------- | ------------------ |
| Document has **fixed visual layout**?         | ✅ Best choice   | Works but overkill |
| Document layout **varies across sources**?    | ❌ Poor accuracy | ✅ Best choice     |
| Need to handle **structured + unstructured**? | ❌               | ✅                 |
| Maximum training pages?                       | 500              | 50,000             |
| Maximum training data size?                   | 50 MB            | 1 GB               |
| Available since?                              | v2.0+            | v3.0+              |
| Supports signature detection?                 | ✅               | ✅ (v4.0+)         |
| Supports overlapping fields?                  | ❌               | ✅ (v4.0+)         |
| Training time limit (v4.0)?                   | Fast             | Up to 10 hrs free  |

---

## Common Traps & Misconceptions

### Trap 1: healthInsuranceCard ≠ Medical Records

The `prebuilt-healthInsuranceCard.us` model extracts fields from **US health insurance cards** (member ID, group number, coverage). It does NOT analyze medical records, pharmaceutical dosages, or clinical documents. Wrong model → empty `fields` in response.

### Trap 2: Key Rotation Order

When the PRIMARY admin key is compromised:

- ❌ DON'T regenerate primary first (breaks the app immediately)
- ❌ DON'T switch to query key for management (query keys are read-only)
- ✅ DO regenerate secondary → switch app → regenerate primary

### Trap 3: Business Card Model v2.1 and QR Codes

- Business card model v2.1 does NOT support QR/barcode extraction
- The `prebuilt-read` model supports barcode/QR extraction as a free add-on
- **Q9 answer**: Implement the read model (B), not upgrade business card to v3.0

### Trap 4: Custom Template for Variable Layouts

- Custom template relies on **fixed visual templates** — variations kill accuracy
- If the same form type comes from different sources with different layouts → use **custom neural**
- For template models with variations: split dataset, train multiple models, then **compose** them

### Trap 5: Object vs File Projections

- **Object** projection = JSON documents (any enriched content as JSON)
- **File** projection = binary image files ONLY (from `normalized_images`)
- Table projection = tabular/relational data in Azure Table Storage
- Don't confuse: "scanned PDFs" → File projection (binary), "JSON data" → Object projection

### Trap 6: Confidence Threshold in Code

- When checking handwriting confidence, use `>= 0.8` (80%) as threshold
- Confidence of `1.0` means absolute certainty — too strict for handwriting
- The `prebuilt-read` model classifies text style as `handwritten` vs `printed`

### Trap 7: DocumentAnalysisClient vs DocumentIntelligenceClient

- Older SDK (`azure-ai-formrecognizer`): uses `DocumentAnalysisClient`
- Newer SDK (`azure-ai-documentintelligence`): uses `DocumentIntelligenceClient`
- Exam may reference either — both are valid. Q5/Q7 reference `DocumentAnalysisClient`.

---

## Quick Reference Card

### Document Intelligence Model Selection Matrix

| Document Type                            | Recommended Model                    | Build Mode             |
| ---------------------------------------- | ------------------------------------ | ---------------------- |
| Internal expense authorization forms     | Custom template                      | `template`             |
| Supplier invoices                        | **Prebuilt invoice**                 | N/A                    |
| Expenditure request forms (fixed layout) | Custom template                      | `template`             |
| Structured + unstructured survey forms   | **Custom neural**                    | `neural`               |
| Structured employment applications       | Custom template                      | `template`             |
| Medical records                          | Custom model (no prebuilt)           | `neural` or `template` |
| US health insurance cards                | `prebuilt-healthInsuranceCard.us`    | N/A                    |
| Handwritten PDFs                         | `prebuilt-read`                      | N/A                    |
| Business cards + QR codes                | `prebuilt-read` (not businessCard)   | N/A                    |
| Invoices in AI Search pipeline           | Custom skill → Document Intelligence | N/A                    |

### AI Search Keys Cheat Sheet

| Property                   | Admin Keys                                | Query Keys              |
| -------------------------- | ----------------------------------------- | ----------------------- |
| Count                      | 2 (primary + secondary)                   | Up to 50                |
| Access                     | Full read-write                           | Read-only (documents)   |
| Can create/modify indexes? | ✅                                        | ❌                      |
| Can search documents?      | ✅                                        | ✅                      |
| Rotation strategy          | Regen unused → switch → regen compromised | Create new → delete old |

### Knowledge Store Projections Cheat Sheet

| Data Type                         | Projection | Storage             |
| --------------------------------- | ---------- | ------------------- |
| Structured/tabular data           | Table      | Azure Table Storage |
| Unstructured JSON                 | Object     | Azure Blob Storage  |
| Binary images / normalized images | File       | Azure Blob Storage  |
| Scanned PDFs (as binary)          | File       | Azure Blob Storage  |

---

## Related Questions in questions.json

| #   | Question ID            | Topic                               | One-line Summary                                                                     |
| --- | ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| Q1  | `1wlFhtfttoGKYNuLRg5I` | AI Search keys                      | Compromised primary admin key → regen secondary first                                |
| Q2  | `2uw9VHkHTDj5U3qXNcKK` | Doc Intelligence + Immersive Reader | Lesson plans → Doc Intelligence; word pictures → Immersive Reader                    |
| Q3  | `3jzO8zUYBnRoAHI4tGQw` | Doc Intelligence response           | Empty fields + healthInsuranceCard for medical records = wrong model                 |
| Q4  | `5uq0tU3cFRatKHLoyhuH` | Custom vs prebuilt selection        | Internal forms → custom model; supplier invoices → prebuilt invoice                  |
| Q5  | `6Yhnv8wKOgYiJfdBwybv` | prebuilt-read + confidence          | prebuilt-read for handwriting, confidence ≥ 0.8                                      |
| Q6  | `8oGuS9x97g5BDmgktKrW` | Knowledge store projections         | JSON → Object projection; scanned PDFs → File projection                             |
| Q7  | `9FyXH8exsY5DWDAUUD9t` | SDK code completion                 | DocumentAnalysisClient + prebuilt-read for handwritten PDFs                          |
| Q8  | `CEvHk7owhHHgTYSqzyTJ` | AI Search custom skill              | Invoice properties in AI Search → Document Intelligence                              |
| Q9  | `CfFks5HxPpiEE92s4r87` | QR code support                     | Business card v2.1 → implement read model for QR codes                               |
| Q10 | `Fehdvw29Zl3poyyKYjCn` | Model selection matrix              | Expenditure → custom template; surveys → custom neural; employment → custom template |

Quiz command:

```powershell
cd "c:\Users\v-vpatkar\OneDrive - Microsoft\Desktop\microsoft-exam-prep\AI-102 Prep"
python quiz_runner.py questions.json --day-lock 16 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [Document Intelligence model overview](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/concept-model-overview?view=doc-intel-4.0.0)
- [What is Document Intelligence?](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/overview?view=doc-intel-4.0.0)
- [Custom neural model](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/train/custom-neural?view=doc-intel-4.0.0)
- [Custom template model](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/train/custom-template?view=doc-intel-4.0.0)
- [Connect to Azure AI Search using keys](https://learn.microsoft.com/en-us/azure/search/search-security-api-keys)
- [Knowledge store projections overview](https://learn.microsoft.com/en-us/azure/search/knowledge-store-projection-overview)
- [What is Azure AI Immersive Reader?](https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/overview)

---

## Notes (your own words — fill this in after studying)

_(Space for your notes after reading through the material and completing the quiz)_
