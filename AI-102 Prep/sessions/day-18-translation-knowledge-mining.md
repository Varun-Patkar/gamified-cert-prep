# Day 18: Translation Workloads + Knowledge Mining & Document Intelligence Deep Dive

**Date**: 2026-05-23
**Domain**: Domain 5 (Implement NLP Solutions — 15-20%) + Domain 4 cross-domain review
**Subtopics**: Azure Translator patterns, Azure AI Search (indexer data sources, knowledge store projections, index field attributes), Azure AI Document Intelligence (prebuilt models, custom model training, file limits, REST API workflow), Text Analytics key phrases
**Estimated study time**: 1 hr

---

## TL;DR (60-second skim)

- **Azure AI Search indexers** natively support: Azure Blob, Cosmos DB (SQL), Azure SQL, Azure Table Storage, ADLS Gen2, SQL Managed Instance, SQL Server on Azure VMs, OneLake. **On-premises SQL Server is NOT directly supported** — must be mirrored to Azure SQL.
- **Knowledge store** definition requires `storageConnectionString` + `projections` array with `tables`, `objects`, and/or `files`. Files are for **binary normalized images only** (stored in Blob Storage, not Azure Files).
- **Projection groups**: each `{ tables: [], objects: [], files: [] }` element in the projections array is one group. Items in the same group share keys for cross-referencing.
- **Document Intelligence prebuilt models**: Use **receipt** for expense claims (merchant, date, tax, total). Use **invoice** for billing/shipping address, amount due, due date, subtotal, total tax.
- **Custom model training** (Studio): Create project → Link storage → Upload samples (min 5) → Apply labels → Train and test.
- **Custom model training** (REST API): Upload forms + JSON to blob → Create SAS URL → Call Build Model API → Call Get Model API.
- **S0 tier file limits**: 500 MB max file size, supported formats are JPEG/JPG, PNG, BMP, TIFF, PDF. **No XLSX, DOCX for custom extraction models** (only Read/Layout/Classification support Office files).
- **Search index field attributes**: **Searchable** = full-text search with analysis/tokenization; **Retrievable** = can be returned in results; **Filterable** = used in $filter; **Sortable** = used in $orderby; **Facetable** = used for hit-count grouping.

---

## Learning Objectives

After this session you should be able to:

1. Identify which data sources Azure AI Search can index natively vs. which require workarounds
2. Define a knowledge store with proper JSON schema and choose the right projection type
3. Distinguish between projection groups and understand cross-referencing
4. Select the correct Document Intelligence prebuilt model for a given scenario
5. Order the steps for custom model training via Studio and via REST API
6. Know the file format and size limits for Document Intelligence S0 tier
7. Choose the correct Text Analytics endpoint for a given NLP task
8. Understand search index field attributes and when to use each
9. Describe basic Azure Translator text and document translation patterns

---

## Key Concepts

### 1. Azure AI Search — Supported Indexer Data Sources

Azure AI Search indexers can pull data from these sources **natively**:

| Data Source | Notes |
|---|---|
| Azure Blob Storage | Most common; supports PDF, Office, images with document cracking |
| Azure Cosmos DB (SQL API) | Core SQL API is GA. MongoDB and Gremlin APIs are preview |
| Azure SQL Database | Full GA support |
| Azure SQL Managed Instance | GA |
| SQL Server on Azure VMs | GA — note this is SQL on Azure VMs, NOT on-premises |
| Azure Table Storage | GA |
| Azure Data Lake Storage Gen2 | GA |
| Microsoft OneLake | GA |
| Azure Files | Preview |
| Azure MySQL | Preview |
| SharePoint Online | Preview |

**NOT natively supported:**
- **On-premises SQL Server** — must mirror/replicate to Azure SQL Database first
- Azure Cosmos DB for Cassandra — explicitly not supported
- Third-party databases (Oracle, PostgreSQL on-prem, etc.)

**Key exam trap**: On-premises SQL Server is NOT the same as SQL Server on Azure VMs. The question may describe "Finance: On-premises Microsoft SQL Server database" — this requires mirroring to Azure SQL before indexing.

---

### 2. Knowledge Store — Definition & Projections

A knowledge store is defined inside a **skillset** and has two required components:

```json
"knowledgeStore": {
    "storageConnectionString": "<connection-string>",
    "projections": [
        {
            "tables": [ ... ],
            "objects": [ ... ],
            "files": [ ... ]
        }
    ]
}
```

**Required fields for the definition:**
- `storageConnectionString` — connection to Azure Storage account
- `projections` — array of projection groups, each containing `tables`, `objects`, and/or `files`

**NOT valid fields:** `storageContainer` (that's a property within object/file projections, not the knowledge store definition itself).

#### Projection Types

| Type | Storage Destination | Content Type | Use Case |
|---|---|---|---|
| **Tables** | Azure Table Storage | Structured rows/columns from enrichments | Power BI reporting, analytics, data frames |
| **Objects** | Azure Blob Storage | JSON documents (hierarchical) | Downstream apps consuming JSON, data science |
| **Files** | Azure Blob Storage | Binary normalized images only | Image extraction, visual analysis |

**Critical distinctions:**
- **Objects** = JSON blobs in Blob Storage (NOT Azure Files storage)
- **Files** = binary images in Blob Storage (NOT Azure Files storage)
- Despite the name "files", file projections go to **Blob Storage**, not Azure Files
- File projections source is always `/document/normalized_images/*`
- Object projections cannot be sliced; table projections can be sliced into related tables

#### Projection Groups

Each element in the `projections` array is a **projection group**. Tables, objects, and files within the **same group** share generated keys that enable cross-referencing.

```json
"projections": [
    {   // Group 1
        "tables": [ { "tableName": "Documents" }, { "tableName": "KeyPhrases" } ],
        "objects": [ { "storageContainer": "docs" } ],
        "files": []
    },
    {   // Group 2 — independent, separate keys
        "tables": [ { "tableName": "Summaries" } ],
        "objects": [],
        "files": []
    }
]
```

This example has **two projection groups**. Items in Group 1 share keys; Group 2 is independent.

---

### 3. Azure AI Document Intelligence — Prebuilt Models

#### Receipt vs. Invoice — When to Use Which

| Scenario | Correct Model | Key Fields Extracted |
|---|---|---|
| **Expense claims** (merchant info, transaction date/time, taxes, total) | `prebuilt-receipt` | MerchantName, MerchantAddress, MerchantPhoneNumber, TransactionDate, TransactionTime, Items, Tax, Total, Subtotal, Tip |
| **Billing documents** (shipping/billing address, customer ID, amount due, due date, tax, subtotal) | `prebuilt-invoice` | VendorName, CustomerName, CustomerID, ShippingAddress, BillingAddress, InvoiceDate, DueDate, AmountDue, TotalTax, SubTotal, InvoiceTotal, LineItems |
| General text extraction | `prebuilt-read` | Text, pages, lines, words |
| Tables, structure, layout | `prebuilt-layout` | Tables, selection marks, text, structure |

**Decision rule**: If the question mentions "expense claims" or "receipts" with merchant/transaction/tax/total → **receipt model**. If it mentions invoices, purchase orders, billing/shipping addresses, amount due, due date → **invoice model**.

#### Other Prebuilt Models

| Model ID | Use Case |
|---|---|
| `prebuilt-idDocument` | Passports, ID cards, driver's licenses |
| `prebuilt-healthInsuranceCard.us` | US health insurance cards |
| `prebuilt-tax.us.w2` | US W-2 tax forms |
| `prebuilt-contract` | Legal contracts and agreements |
| `prebuilt-bankStatement` | Bank statements |
| `prebuilt-creditCard` | Credit/debit cards |

---

### 4. Document Intelligence — Custom Model Training

#### Via Document Intelligence Studio (Visual/Interactive)

The correct order:

1. **Create a custom model project** and link to the storage account
2. **Upload sample documents** (minimum 5 for template models)
3. **Apply labels** to the sample documents (tag fields you want to extract)
4. **Train and test** the model

**Trap**: You must create the project FIRST before uploading. You can't upload documents before the project exists — there's nowhere to put them.

#### Via REST API (Programmatic)

The correct order:

1. **Upload forms and JSON files to a blob container** (e.g., blob1)
2. **Create a SAS URL** for the blob container (for authenticated access)
3. **Call the Build Model REST API** (POST to start training, returns an operation ID)
4. **Call the Get Model REST API** (GET to retrieve the trained model ID)

**Key distinction**: REST API uses blob storage + SAS authentication, NOT Azure Files shares. The Get Model API retrieves the model details/ID after training completes, while Get Info is not the correct call.

---

### 5. Document Intelligence — File Format & Size Limits

#### Supported File Formats by Model Type

| Model Type | PDF/TIFF | JPEG/JPG/PNG/BMP | Office (DOCX/XLSX/PPTX) |
|---|---|---|---|
| Read | ✔ | ✔ | ✔ |
| Layout | ✔ | ✔ | ✔ |
| Custom Extraction | ✔ | ✔ | ✗ |
| Custom Classification | ✔ | ✔ | ✔ |
| Prebuilt models | ✔ | ✔ | ✗ |

#### Size Limits

| Tier | Max File Size | Notes |
|---|---|---|
| **S0 (paid)** | **500 MB** | Up to 2,000 pages for PDF/TIFF |
| F0 (free) | 4 MB | Only first 2 pages processed |

#### Image Dimensions
- Minimum: 50 × 50 pixels
- Maximum: 10,000 × 10,000 pixels
- Minimum text height: 12 pixels (at 1024×768 resolution)

**Exam trap scenario**: Given a table of files with different formats and sizes:
- A JPG file at 400 MB → **Supported** (JPG is valid, under 500 MB for S0)
- A PDF at 200 MB → **Supported**
- An XLSX file → **NOT supported** for custom extraction models
- A DOCX file → **NOT supported** for custom extraction models
- A PNG at 600 MB → **NOT supported** (exceeds 500 MB limit)

---

### 6. Text Analytics API Endpoints

| Endpoint | Purpose | When to Use |
|---|---|---|
| `/text/analytics/v3.x/keyPhrases` | Extract key phrases | **Word clouds**, topic summarization, content tagging |
| `/text/analytics/v3.x/sentiment` | Detect sentiment (positive/negative/neutral/mixed) | Customer feedback analysis, review scoring |
| `/text/analytics/v3.x/languages` | Detect language of text | Routing to language-specific processing |
| `/text/analytics/v3.x/entities/recognition/general` | Named entity recognition (NER) | Extracting people, places, organizations, dates |
| `/text/analytics/v3.x/entities/linking` | Entity linking to Wikipedia | Disambiguating entities |
| `/text/analytics/v3.x/entities/recognition/pii` | PII detection and redaction | Compliance, data protection |

**Word cloud use case**: The `keyPhrases` endpoint extracts the most important phrases from text. These phrases can be visualized as a word cloud where frequency/importance determines size. **NOT** sentiment (gives scores, not words) and **NOT** entity recognition (gives named entities, not key topics).

---

### 7. Search Index Field Attributes

| Attribute | Purpose | Effect |
|---|---|---|
| **Searchable** | Full-text search with analysis (tokenization, stemming) | Field is analyzed and included in the inverted index. Queries like `search=sunny` match individual tokens. |
| **Filterable** | Exact-match filtering via `$filter` | No word-breaking — `$filter=f eq 'sunny day'` is exact. |
| **Sortable** | Ordering results via `$orderby` | Only single-valued simple fields. Collections cannot be sorted. |
| **Facetable** | Hit-count grouping for faceted navigation | Used for category drill-down in UI (e.g., "Brand: Nike (42)"). |
| **Retrievable** | Field value returned in search results | If false, field can still be used for search/filter/sort but isn't shown to users. Useful for scoring fields like "margin". |

**Common exam scenario**: "Users will perform full text searches against the MessageCopy field, and the values of the field will be shown to the users."
- Full text search → **Searchable**
- Shown to users → **Retrievable**
- Answer: **Searchable and Retrievable**

**Traps:**
- Filterable is for exact match ($filter), not for full-text search
- Sortable is for ordering, not for searching
- Facetable is for aggregation/drill-down, not for text search
- Searchable consumes extra index space for tokenized versions

---

### 8. Azure Translator — Text & Document Translation (Domain 5 Topic)

#### Text Translation

- **Endpoint**: `POST https://api.cognitive.microsofttranslator.com/translate`
- Translates text strings in real-time
- Supports 100+ languages with auto-detect
- Key parameters: `from` (optional, auto-detect), `to` (required, can be multiple), `textType` (plain/html)
- Can transliterate between scripts (e.g., Japanese Kanji → Latin)

#### Document Translation

- **Endpoint**: Asynchronous batch operation via Azure Blob Storage
- Translates entire documents (PDF, DOCX, PPTX, etc.) preserving formatting
- Workflow: Upload source docs to blob → Submit translation job → Poll for completion → Download from target blob
- Supports glossaries for domain-specific terminology

#### Key Translator Features

| Feature | Description |
|---|---|
| Auto-detect language | `from` parameter is optional |
| Multiple target languages | Single request can translate to multiple `to` languages |
| Custom Translator | Train custom models for domain-specific terminology |
| Dictionary lookup | Get alternative translations for a word |
| Transliteration | Convert text between scripts |
| Document translation | Batch processing with format preservation |

---

## Comparisons (X vs Y tables)

### Receipt Model vs Invoice Model

| Feature | Receipt | Invoice |
|---|---|---|
| Model ID | `prebuilt-receipt` | `prebuilt-invoice` |
| Primary use | Expense management, retail transactions | Accounts payable, billing |
| Merchant info | ✔ (MerchantName, Address, Phone) | ✔ (VendorName, VendorAddress) |
| Customer info | ✗ | ✔ (CustomerName, CustomerID, BillingAddress, ShippingAddress) |
| Transaction date/time | ✔ | ✔ (InvoiceDate, DueDate) |
| Tax | ✔ (Tax) | ✔ (TotalTax) |
| Line items | ✔ (basic) | ✔ (detailed with description, quantity, unit price) |
| Amount due | ✗ | ✔ |
| Subtotal | ✔ | ✔ |
| Total | ✔ | ✔ (InvoiceTotal) |
| Tips | ✔ | ✗ |

### Custom Template vs Custom Neural Models

| Feature | Custom Template | Custom Neural |
|---|---|---|
| Build mode | `template` | `neural` |
| Best for | Static layouts, consistent visual templates | Variable layouts, mixed document types |
| Training time | 1-5 minutes | 30 min to 12 hours |
| Min training docs | 5 | 5 |
| Overlapping fields | Not supported | Supported (v4.0) |
| Signature detection | ✔ | ✔ (v4.0) |
| Document variations | Separate model per variation | Single model handles variations |
| Max training pages | 500 | 50,000 |
| Max training data size | 50 MB | 1 GB |

### Studio Training vs REST API Training

| Step | Studio | REST API |
|---|---|---|
| 1 | Create project + link storage | Upload forms + JSON to blob |
| 2 | Upload sample documents | Create SAS URL for blob |
| 3 | Apply labels interactively | Call Build Model API |
| 4 | Train and test | Call Get Model API |

---

## Important Details for Exam

- **Knowledge store definition** requires exactly two things: `storageConnectionString` and the `projections` array. Not `storageContainer` — that's inside object/file projections.
- **File projections** source is always `/document/normalized_images/*` — you cannot project arbitrary binary files.
- **Object projections** produce JSON in Blob Storage, not Azure Files. Despite the "files" projection name, files also go to Blob Storage.
- **S0 tier** file size limit is **500 MB** (not 50 MB, not 100 MB).
- **Custom extraction models** do NOT support Office formats (DOCX, XLSX, PPTX). Only Read, Layout, and Classification models support Office files.
- **SAS URL** is needed for REST API training; not an access key (though access keys also work for some operations, the exam tests SAS URL specifically).
- **keyPhrases** endpoint is for word clouds; **sentiment** is for positive/negative scoring.
- **Searchable** means full-text search with tokenization; **Filterable** means exact-match with `$filter`.
- On-premises SQL Server requires **mirroring to Azure SQL** before Azure AI Search can index it.

---

## Common Traps & Misconceptions

1. **"On-premises SQL Server" vs "SQL Server on Azure VMs"**: These are different. Azure VMs are supported; on-prem is NOT.

2. **"Object projection = Azure Files"**: WRONG. Object projections go to **Azure Blob Storage** as JSON. File projections ALSO go to Blob Storage (as binary images). Nothing goes to Azure Files.

3. **"storageContainer is a knowledge store definition field"**: WRONG. It's a property INSIDE object/file projections, not at the knowledge store level. The definition uses `storageConnectionString` and `projections`.

4. **"Upload documents before creating the project"**: WRONG for Studio workflow. You must create the project first, then upload.

5. **"Use the invoice model for expense receipts"**: WRONG. Expense claims with merchant/transaction/tax → receipt model. Invoice model is for formal invoices with billing/shipping addresses.

6. **"XLSX files can be used for custom extraction training"**: WRONG. Custom extraction models only support PDF, JPEG/JPG, PNG, BMP, TIFF.

7. **"Filterable = full-text search"**: WRONG. Filterable is for exact-match comparisons (`$filter=field eq 'value'`). Searchable is for full-text with tokenization.

8. **"sentiment endpoint for word clouds"**: WRONG. Sentiment returns scores (positive/negative/neutral), not extractable words. Use keyPhrases.

9. **"Projection groups count = number of tables"**: WRONG. A projection group is a `{ tables, objects, files }` object in the array. Multiple tables within the same group count as ONE group.

10. **"Get Info API to retrieve model after training"**: The correct call is **Get Model** API, not "Get Info".

---

## Quick Reference Card

### Knowledge Store JSON Schema
```
storageConnectionString + projections: [ { tables: [], objects: [], files: [] } ]
```

### Supported Search Data Sources (GA)
Blob, Cosmos DB (SQL), Azure SQL, SQL MI, SQL on Azure VMs, Table Storage, ADLS Gen2, OneLake

### Doc Intelligence Model Selection
- Expense receipt → `prebuilt-receipt`
- Invoice/PO → `prebuilt-invoice`
- Custom forms → `custom template` or `custom neural`
- Just text → `prebuilt-read`

### Custom Training Order
- **Studio**: Create project → Upload (5+) → Label → Train
- **REST**: Upload to blob → SAS URL → Build Model → Get Model

### File Limits (S0)
- Size: 500 MB | Formats: PDF, TIFF, JPEG, PNG, BMP
- No DOCX/XLSX for custom extraction

### Index Field Attributes
- Full-text search = **Searchable**
- Show in results = **Retrievable**
- Exact filter = **Filterable**
- Sort results = **Sortable**
- Category counts = **Facetable**

---

## Related Questions in questions.json

| Question ID | Summary |
|---|---|
| ZRozOMC4CpeLhv863SbU | Supported indexer data sources — on-prem SQL needs mirroring |
| aEglPFeC8t9sKQMqo0gH | HOTSPOT: Knowledge store projection groups & types |
| aZOuG3d0QOgjERlaXN0m | Knowledge store definition fields (storageConnectionString + objects/tables) |
| cpForodyaZTfmVSs3DZ5 | DRAG DROP: Custom model training workflow order (Studio) |
| cvkyVDbw7DNBg19NfNt0 | Doc Intelligence file types & size limits (S0 tier) |
| e8riRt8sYIs0SCr6nFOW | Text Analytics keyPhrases endpoint for word cloud |
| mZpBN9wd5zAvjgOrSxNI | Prebuilt receipt model for expense claims |
| nX2cFe3YbUPnmwhQJhek | DRAG DROP: REST API training workflow order |
| uPwH0HTq4bH157ecIiRg | Prebuilt invoice model fields |
| ukrDyL2qENKSnoxsY82M | Search index field attributes (Searchable + Retrievable) |

Quiz command:

```powershell
python quiz_runner.py questions.json --day-lock 18 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [Indexers in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-indexer-overview)
- [Knowledge store in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/knowledge-store-concept-intro)
- [Define projections in a knowledge store](https://learn.microsoft.com/en-us/azure/search/knowledge-store-projections-examples)
- [What is Azure Document Intelligence](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/overview?view=doc-intel-4.0.0)
- [Document Intelligence custom models](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/concept-custom?view=doc-intel-4.0.0)
- [Document Intelligence receipt model](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/receipt?view=doc-intel-4.0.0)
- [Document Intelligence invoice model](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/invoice?view=doc-intel-4.0.0)
- [Indexes - Create or Update (REST API)](https://learn.microsoft.com/en-us/rest/api/searchservice/indexes/create-or-update)

---

## Notes (your own words — fill this in after studying)

_(Space for your personal notes after reviewing the material)_
