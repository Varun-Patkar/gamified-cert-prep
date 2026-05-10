# Day 5: Domain 1 Consolidation — End-to-End AI Solution Lifecycle
**Date**: 2026-05-10
**Domain**: Domain 1 — Plan and manage an Azure AI solution (20-25%)
**Subtopics**: Cross-cutting review of 1.1 Service Selection, 1.2 Deployment Planning, 1.3 Security/Monitoring, 1.4 Responsible AI
**Estimated study time**: 1 hr

---

## TL;DR (60-second skim)
- The lifecycle is **Select → Deploy → Secure/Monitor → Responsible AI** — exam questions often span two phases
- Container deploy always requires three mandatory params: **Eula=accept, Billing={endpoint}, ApiKey={key}** — containers MUST phone home for billing
- Private connectivity to Azure AI Search = **Private Endpoint to VNet** — NOT public endpoint + NSG, NOT public + IP firewall, NOT public + Private Link to a *different* VNet
- VNet restriction on a Foundry resource = configure **virtual network settings on the resource itself** (not NSG, not Azure Firewall)
- Azure OpenAI SDK needs exactly **3 things**: deployment name, endpoint, key (or token) — NOT model name
- Responsible AI mnemonic: **FRIPT** — Fairness, Reliability & Safety, Inclusiveness, Privacy & Security, Transparency
- Anomaly Detector: **Batch** = scan entire dataset at once; **Streaming** = one point at a time; **Multivariate** = cross-correlated sensors
- Face API: **Detect** = find faces + attributes; **Identify** = match to enrolled person — detect is a prerequisite step for identify

---

## Learning Objectives
After this session you should be able to:
1. Trace a complete AI solution from requirements → service selection → deployment → securing → responsible AI governance
2. Instantly recognize exam traps from all 4 subdomains and avoid repeat mistakes
3. Map any scenario to the correct service, deployment model, security config, and RAI principle
4. Correctly sequence container deployment steps (including ACR, Dockerfile, LUIS export)

---

## Key Concepts — Cross-Cutting Consolidation

### The Solution Lifecycle (how all 4 subdomains connect)

```
Requirements → 1.1 Select Service → 1.2 Deploy (resource, model, container)
                                         ↓
                                  1.3 Secure & Monitor (keys, VNet, RBAC, cost)
                                         ↓
                                  1.4 Responsible AI (filters, shields, governance)
```

Every exam scenario walks through part of this pipeline. The question signals which phase it's testing:
- "Which service should you use?" → 1.1
- "You need to deploy / create / export" → 1.2
- "You need to ensure only / prevent access / monitor" → 1.3
- "Responsible AI principles / content moderation" → 1.4

### 1.1 Service Selection — Pattern Recognition

| Signal in Question | Correct Service |
|---|---|
| Time series + unusual values + single metric | **Univariate Anomaly Detector** |
| Multiple correlated sensors + root cause | **Metrics Advisor** (or Multivariate Anomaly Detector) |
| Detect face attributes / presence | **Face API — Detect** |
| Match face to enrolled person | **Face API — Identify** (requires Detect first) |
| Scan entire dataset for anomalies at once | **Batch detection** (Anomaly Detector) |
| Generate captions for images | **Computer Vision** (not Custom Vision) |
| Handwritten text extraction | **OCR** (Read API / Vision) |
| Inconsistent document layouts | **Custom Neural** model (Doc Intelligence) |
| Consistent/structured forms | **Custom Template** model (Doc Intelligence) |
| Speech → text for language detection | **Speech-to-Text** (not Text Analytics — input is audio) |
| Respond to callers in their language | **Text-to-Speech** |
| Chit-chat + KB + multilingual + sentiment + auto-select model | **LUIS + Text Analytics + QnA Maker** (Language unified these) |
| PPE compliance / detect removed masks | **Face API** (detect accessories attribute) |

**Trap**: Face detect vs identify — Detect finds faces and their attributes (age, glasses, mask). Identify matches a detected face against a PersonGroup. The endpoint URL contains `/detect` or `/identify` — the exam shows the URL to test if you know the difference.

**Trap**: Anomaly Detector vs Metrics Advisor — Single metric stream = Univariate Anomaly Detector. Multiple correlated metrics + root cause + incident alerts = Metrics Advisor. The word "correlated" or "root cause" is the giveaway.

### 1.2 Deployment Planning — Critical Sequences

#### Container Deployment Mandatory Parameters
Every `docker run` for an AI services container requires:
```
docker run --rm -it -p 5000:5000 \
  mcr.microsoft.com/azure-cognitive-services/<category>/<service>:latest \
  Eula=accept \
  Billing={ENDPOINT_URI} \
  ApiKey={API_KEY}
```
- **Eula** — must be `accept` (not `true`)
- **Billing** — the Foundry resource endpoint URL (e.g., `https://contoso.cognitiveservices.azure.com`)
- **ApiKey** — subscription key from the Azure resource
- Container won't start without ALL THREE

**Trap**: The Billing parameter points to the **Azure resource endpoint**, not a blob storage URL. If an option shows `http://contoso.blob.core.windows.net`, that's wrong.

#### Container Image Paths
The image path encodes the service:
- Sentiment: `mcr.microsoft.com/azure-cognitive-services/textanalytics/sentiment`
- Key Phrases: `.../textanalytics/keyphrase`
- Language Detection: `.../textanalytics/language`
- LUIS: `.../luis`
- Anomaly Detector: `.../decision/anomaly-detector`

**Trap**: If the question asks for sentiment analysis, the image path must contain `sentiment`, not `keyphrase`.

#### Container Deployment with ACR (for RBAC + no secrets in CLI history)
When the requirement is "control access with RBAC" and "prevent billing/API info in command history":
1. Create a custom Dockerfile (embed secrets as build args, not CLI params)
2. Pull the container image from MCR (in the Dockerfile)
3. Build the image
4. Push to Azure Container Registry (ACR provides RBAC)

#### LUIS Container Export Sequence
1. Select the correct version (e.g., v1.1 — must be a **trained** version)
2. Export for containers (GZIP format) — NOT "Export as JSON"
3. Run container with the model file mounted + set as environment variable

**Trap**: "Export as JSON" is for portal backup, not container deployment. Container export produces GZIP.

#### Custom Vision Model Export for Offline
1. Change domain to **General (compact)** — only compact domains are exportable
2. **Retrain** the model (domain change requires retraining)
3. Export the model

#### Azure OpenAI SDK Connection
To connect an app to Azure OpenAI, you need exactly 3 things:
- **Deployment name** (what YOU named the deployment — not the model name like "gpt-4o")
- **Endpoint** (the resource URL)
- **Key** (API key or Entra ID token)

**Trap**: The exam offers "model name" as a distractor. You need the *deployment* name, not the underlying model name.

#### Creating Resources Programmatically
- Multi-service resource: kind = `CognitiveServices` (single key for Vision, Language, etc.)
- Computer Vision only: kind = `ComputerVision`
- Free tier = `F0`, Standard = `S0`
- HTTP method for creating = **PUT** (not POST, not PATCH)
- URL uses **Subscription ID** (not Tenant ID)

### 1.3 Security & Monitoring — Network Access Patterns

#### Private Connectivity Decision Tree
```
Need to prevent public internet access to service?
  ├── Azure AI Search → Deploy with Private Endpoint to VNet
  │     ✗ Public endpoint + NSG → NO (still public)
  │     ✗ Public endpoint + IP firewall → NO (still routes over internet)
  │     ✗ Public endpoint + Private Link on different VNet → NO (wrong VNet)
  │     ✓ Private endpoint on SAME VNet → YES
  │
  └── Foundry resource (Language, Vision, etc.)
        → Configure virtual network settings ON THE RESOURCE
        → Enable service endpoint for the resource in the VNet
        → Set default action to DENY (or network rules have no effect!)
```

**Trap**: To restrict a Language service to VNet only → configure **virtual network settings for the resource** (option "C" in exam). Not NSG, not Azure Firewall, not a Language container.

**Trap**: Default network action must be **Deny** — if you leave it as "Allow all networks," your VNet rules have no effect.

#### Key Management
- `regenerateKey` API with `"keyName": "Key2"` → resets the **secondary** subscription key
- This does NOT rotate both keys, does NOT generate a Key Vault key, does NOT create a query key
- Best practice: use **Managed Identity** instead of keys

#### CMK Encryption in Azure AI Search
Enabling Customer-Managed Keys (CMK) for AI Search has three implications:
1. **Index size increases** (~10-20% overhead for encryption metadata)
2. **Query times increase** (decryption overhead on every query)
3. **Azure Key Vault is required** (to store the CMK)

Does NOT: decrease index size, decrease query times, require X.509 certificate.

#### Cognitive Search Throttling Solutions
- ✓ Add **replicas** → handles more query load
- ✓ Migrate to **higher tier** → more capacity
- ✗ Add indexes → makes it WORSE (more data to search)
- ✗ Enable CMK encryption → unrelated to throttling

### 1.4 Responsible AI — Principle Matching

| Principle | Key Signal Words |
|---|---|
| **Transparency** | "notify users," "explain decisions," "users know their data is processed" |
| **Fairness** | "equitable results," "regardless of background," "no bias" |
| **Inclusiveness** | "regardless of location," "accessible to all," "diverse users" |
| **Reliability & Safety** | "perform reliably," "consistent results," "safe behavior" |
| **Privacy & Security** | "protect data," "GDPR," "data residency" |
| **Accountability** | "human review," "approval step," "oversight" |

**Trap**: "Equitable results regardless of background" tests **Fairness + Inclusiveness** (two principles together).

**Trap**: "Notify users data was processed" = **Transparency** (not Reliability).

**Trap**: AI making decisions affecting someone's financial situation → requires **human review and approval** (Accountability principle in action).

---

## End-to-End Architecture Walkthrough

**Scenario**: A multinational bank wants to analyze customer feedback letters (handwritten, scanned as JPEG), detect sentiment, identify anomalous complaint spikes, and ensure data stays on-premises for compliance.

### Step 1 — Service Selection (1.1)
- Handwritten letters → **OCR** (Read API) to extract text
- Sentiment on extracted text → **Language Service — Sentiment Analysis**
- Anomalous complaint spikes (single metric over time) → **Univariate Anomaly Detector — Batch detection**

### Step 2 — Deployment (1.2)
- Data must stay on-prem → **Container deployment**
- Provision Language resource in Azure (for billing)
- Pull sentiment container: `mcr.microsoft.com/azure-cognitive-services/textanalytics/sentiment`
- `docker run` with Eula, Billing, ApiKey

### Step 3 — Security (1.3)
- Restrict Azure resource to internal network → **VNet rules + default deny**
- Container on-prem still needs internet for **billing only** (port 443 to `*.cognitiveservices.azure.com`)
- Rotate keys regularly or use Managed Identity

### Step 4 — Responsible AI (1.4)
- Notify customers their letters are being analyzed → **Transparency**
- Ensure analysis is equitable across languages/regions → **Fairness + Inclusiveness**
- Human review before acting on sentiment scores for staffing decisions → **Accountability**

---

## Mini Architecture Review Lab

**Scenario**: A hospital wants to:
1. Monitor 50 IoT sensors from medical equipment for anomalies (correlated readings)
2. Use Face API to verify staff identity at restricted areas
3. Keep all patient data within the hospital network
4. Comply with responsible AI principles

**Your task** — answer these:
- Q1: Which anomaly detection approach? (A: **Multivariate Anomaly Detection** — multiple correlated sensors)
- Q2: Face detect or identify for staff verification? (A: **Identify** — matching against enrolled PersonGroup; Detect runs first automatically)
- Q3: How to keep data on-prem? (A: **Container deployment** with Billing param for metering)
- Q4: What's the mandatory docker run param order? (A: Eula=accept, Billing={endpoint}, ApiKey={key} — all three required)
- Q5: Which RAI principle applies to biometric staff verification? (A: **Privacy & Security** + **Transparency** — notify staff about facial recognition)

---

## Quick Reference Card

| Service | Best Use Case | Key Gotcha |
|---|---|---|
| Face API — Detect | Find faces, attributes, accessories | Returns faceRectangle (top, left, width, height) |
| Face API — Identify | Match face to person | Requires PersonGroup + prior Detect call |
| Computer Vision | Image captions, tags, OCR | Kind = `ComputerVision`, Free = F0 |
| Custom Vision | Classification/detection with your data | Must use **compact** domain for export |
| Anomaly Detector (Univariate) | Single time series anomalies | Batch = entire dataset; Streaming = real-time |
| Anomaly Detector (Multivariate) | Correlated multi-sensor anomalies | Up to 300 signals |
| Metrics Advisor | Multi-metric + root cause + alerts | Best when you need incident management |
| Language (Sentiment) | Positive/negative text analysis | Container: `textanalytics/sentiment` |
| LUIS | Intent + entity recognition | Export for containers = GZIP, not JSON |
| Doc Intelligence | Structured/unstructured documents | Neural = inconsistent layouts; Template = consistent |
| Azure AI Search | Full-text + AI enrichment | Replicas fix throttling; CMK adds overhead |
| Azure OpenAI | GPT models via API | Need deployment name, NOT model name |

---

## Quiz Prep Reminders (facts easy to forget under pressure)
1. `az cognitiveservices account show` — identifies a created AI services account
2. Container Billing param = resource endpoint URL, not blob storage
3. Private Endpoint = only way to avoid public internet for Azure AI Search
4. VNet restriction on Foundry resource = configure on the **resource**, not the VNet's NSG
5. `regenerateKey` with `Key2` = resets secondary key only
6. PUT (not POST) to create resources via REST API
7. CognitiveServices kind = multi-service single-key resource
8. OCR skill in indexer skillset = enables queries on handwritten letter content
9. QnA Maker auto-creates: Azure AI Search + App Service
10. Transparency ≠ Reliability — notifying users = transparency

---

## Related Questions in questions.json
| ID | One-Line Summary |
|---|---|
| 2lSTcaMwyoJOtv0EluLZ | CLI command to identify AI services account (`az cognitiveservices account show`) |
| 4mMVRmDGey7qlFgEQSgk | Face detect vs identify vs Speech for learner monitoring |
| BvCh84ZyJjgrbCleR46P | Container deploy with ACR + Dockerfile for RBAC + no CLI history secrets |
| G9SeGxe4WWmgLfK4zAYL | Mandatory `Billing` parameter in docker run for Anomaly Detector |
| KFk8c9vFTM20bKqIXlfO | Sentiment container image path + Billing endpoint |
| NdCsDI1uszqJX4BX9P3v | Responsible AI: Fairness + Inclusiveness for equitable results |
| Ur2GmJJc6Priqo605azQ | Anomaly Detector batch vs streaming detection |
| XNK3yPJE6Dy9NbzqLrKt | Chatbot: LUIS + Text Analytics + QnA Maker integration |
| aGJiW4WYxjQ4zbNz8qOa | Programmatic resource creation: ComputerVision + F0 |
| c65aBgnNpT2fxESA9C3N | CMK encryption implications: size ↑, speed ↓, Key Vault required |
| e6OgFHpKYvzeqzH12GgH | VNet restriction: configure virtual network settings on the resource |
| gPJwCxtvixcvekZRkQoC | Azure OpenAI SDK: deployment name + endpoint + key |
| qWpuh2tSs662ljnZf58w | Transparency principle: notify users of data processing |
| y0sdIRaGx2ICrqHN54cD | Search private access: public endpoint + IP firewall = NO |
| 5F54ROmfScX6mUGNOKeZ | OCR skill in indexer for handwritten letter content |

Quiz command:
```powershell
cd "d:\Projects\microsoft-exam-prep\AI-102 Prep"; python quiz_runner.py --day 5
```

---

## Sources (verified during this session)
- [What are Azure containers?](https://learn.microsoft.com/en-us/azure/ai-services/cognitive-services-container-support)
- [Configure Foundry Tools virtual networks](https://learn.microsoft.com/en-us/azure/ai-services/cognitive-services-virtual-networks)
- [Create a private endpoint for Azure AI Search](https://learn.microsoft.com/en-us/azure/search/service-create-private-endpoint)
- [Anomaly Detector overview](https://learn.microsoft.com/en-us/azure/ai-services/anomaly-detector/overview)
- [Azure OpenAI Responses API quickstart](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/responses)
- [Responsible AI for Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/responsible-use-of-ai-overview)

---

## Notes (your own words — fill this in after studying)
_(Space for your own notes after going through the material)_
