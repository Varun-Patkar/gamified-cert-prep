# Day 2: Deployment Planning
**Date**: 2026-05-07
**Domain**: Domain 1 – Plan and manage an Azure AI solution (15-20%)
**Subtopics**: Resource creation, model choice, deployment options, Azure AI Foundry/project structure, ARM/Bicep/Terraform, pricing tiers, container deployment
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)
- **Multi-service resource** = one key + one endpoint for Vision, Language, Speech, etc. API kind = `AIServices`, provider = `Microsoft.CognitiveServices`
- **Foundry resource** is the next-gen multi-service resource. It adds agents, evaluations, and OpenAI. Hierarchy: **Foundry resource → Projects → Assets**
- **Deployment types**: Global Standard (highest quota, pay-per-token), Provisioned (reserved PTU capacity), Batch (50% cheaper, 24hr turnaround), Data Zone (EU/US compliance), Standard (single region), Developer (fine-tune eval only, no SLA)
- **Container deployment** requires 3 mandatory params: `Eula=accept`, `Billing={ENDPOINT_URI}`, `ApiKey={API_KEY}`. Containers still phone home for billing.
- **Pricing tiers**: F0 = free, S0 = standard. Multi-service resource has no free tier in most configurations.
- **Custom subdomain** is required for Azure AD/Entra token auth and private endpoints
- For Azure Search throttling: **add replicas** (not indexes, not partitions) to handle more query load

---

## Learning Objectives
After this session you should be able to:
1. Choose the correct resource type (multi-service vs. single-service vs. Foundry) for a given scenario
2. Create resources via REST API, Azure portal, CLI, and IaC (ARM/Bicep)
3. Identify when to use each deployment type (Global Standard, Provisioned, Batch, Data Zone, Standard)
4. Explain the Foundry resource hierarchy (resource → project → assets)
5. Describe container deployment requirements and the docker run parameters
6. Map pricing tiers (F0, S0) to service kinds and understand their limits

---

## Key Concepts

### 1. Azure AI Resource Types

There are three main resource patterns:

| Resource Type | Provider / Kind | Use Case |
|---|---|---|
| **Single-service** | `Microsoft.CognitiveServices/accounts` kind=`ComputerVision`, `Face`, `Speech`, etc. | Dedicated key/endpoint for one service. Has F0 (free) tier. |
| **Multi-service (legacy)** | `Microsoft.CognitiveServices/accounts` kind=`CognitiveServices` | Single key for Vision, Language, Speech, Decision. No free tier. Being replaced by Foundry. |
| **Foundry resource** | `Microsoft.CognitiveServices/accounts` kind=`AIServices` | Next-gen multi-service. Adds OpenAI, Agents, Evaluations. Recommended default. |

**Trap**: When a question says "single key and endpoint" for multiple services (e.g., sentiment analysis AND OCR), the answer is the **multi-service resource** (`Microsoft.CognitiveServices` provider, `CognitiveServices` kind). The REST API path uses `subscriptions/{subId}` (subscription ID, NOT tenant ID).

**Trap**: The exam still uses legacy names. "Azure Cognitive Services" = now "Foundry Tools." "Azure AI services" = the multi-service resource.

### 2. Creating Resources via REST API

The ARM REST endpoint for creating a Cognitive Services account:
```
PUT https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.CognitiveServices/accounts/{accountName}?api-version=2023-05-01
```

Key points tested:
- The URL uses **subscription ID** (not tenant ID)
- The provider namespace is `Microsoft.CognitiveServices`
- `regenerateKey` API with `{"keyName": "Key2"}` resets the **secondary** subscription key (not both keys, not a Key Vault key)

### 3. Creating Resources Programmatically (C#/Python)

When calling `create_resource(client, name, kind, sku, location)`:
- **Kind** maps to service: `ComputerVision`, `CustomVision.Prediction`, `CustomVision.Training`, `Face`, `Speech`, etc.
- **SKU** = pricing tier: `F0` (free), `S0` (standard), `S1`, etc.
- Image captioning → `ComputerVision` (not `CustomVision.Prediction`)
- Free tier → `F0` (not `S0`)

### 4. Foundry Resource Hierarchy

```
Foundry Resource (top-level governance)
├── Model Deployments (shared across projects)
├── Security Settings (networking, CMK, RBAC)
├── Connections (to Storage, Key Vault, AI Search)
├── Project A (dev boundary)
│   ├── Agents
│   ├── Evaluations
│   └── Files
└── Project B (dev boundary)
    ├── Agents
    └── Evaluations
```

Key exam facts:
- **Connected resources** (Storage, Key Vault, AI Search) are separate Azure resources with their own governance boundaries — you manage their networking separately
- **RBAC**: Control plane (create deployments, projects) vs. data plane (build agents, run evals) are distinct
- **Azure Owner/Contributor roles do NOT include development permissions** — you need `Azure AI User` or `Azure AI Owner`
- Projects are like folders inside a resource, not separate Azure resources

### 5. Deployment Types (Azure OpenAI / Foundry Models)

| Deployment Type | SKU Name | Data Processing | Billing | Best For |
|---|---|---|---|---|
| **Global Standard** | `GlobalStandard` | Any Azure region | Pay-per-token | General workloads, highest default quota |
| **Global Provisioned** | `GlobalProvisionedManaged` | Any Azure region | Reserved PTU (hourly) | Predictable high-throughput |
| **Global Batch** | `GlobalBatch` | Any Azure region | 50% discount, 24hr target | Large async jobs |
| **Data Zone Standard** | `DataZoneStandard` | Within US or EU zone | Pay-per-token | Data residency compliance |
| **Data Zone Provisioned** | `DataZoneProvisionedManaged` | Within data zone | Reserved PTU | Data zone + throughput |
| **Standard** | `Standard` | Single region only | Pay-per-token | Regional compliance |
| **Regional Provisioned** | `ProvisionedManaged` | Single region | Reserved PTU | Regional + guaranteed throughput |
| **Developer** | `DeveloperTier` | Any region (no guarantee) | Pay-per-token | Fine-tuned model eval only, 24hr lifetime, NO SLA |

**Decision tree**:
- Need guaranteed throughput? → Provisioned (PTU)
- Need lowest cost for big async jobs? → Batch (50% savings)
- Need EU/US data residency? → Data Zone variants
- Need single-region data processing? → Standard or Regional Provisioned
- No restrictions, want highest quota? → Global Standard

**Trap**: Global Standard has highest default quota but may have latency variability at scale. Provisioned types have lower and more consistent latency.

**Trap**: Batch deployments target 24-hour completion but **may take longer** — no real-time SLA.

**Trap**: Developer deployments auto-delete after 24 hours and have NO SLA.

### 6. Container Deployment

Containers let you run AI services on-premises or at the edge while still billing through Azure.

**Mandatory docker run parameters** (all three required or container won't start):
```bash
docker run --rm -it -p 5000:5000 \
  mcr.microsoft.com/azure-cognitive-services/<service>/<model> \
  Eula=accept \
  Billing={ENDPOINT_URI} \
  ApiKey={API_KEY}
```

**Trap**: The `Billing` parameter points to your **Azure resource endpoint** (e.g., `https://contoso.cognitiveservices.azure.com`), NOT a billing page. The container phones home for metering.

**Trap**: Containers have **no built-in security** on their API by default. You must add your own auth layer (e.g., Istio, Nginx) if needed.

Available containers: Language (Sentiment, NER, PII, Key Phrases, Language Detection, CLU), Speech (STT, TTS, Custom STT), Vision (Read OCR, Spatial Analysis), LUIS, Anomaly Detector, Translator, Document Intelligence, Content Safety.

**LUIS container deployment steps** (tested in quiz):
1. Select the correct version (latest *trained* version)
2. Export for containers (GZIP format, not JSON)
3. Run docker container and mount the model file

**For limited connectivity / minimize costs**: Use Docker Engine locally (not AKS, not ACI, not Azure Stack). Docker Engine is the cheapest option for on-premises.

### 7. Pricing Tiers & Capacity

| Tier | Code | Cost | Use Case |
|---|---|---|---|
| Free | `F0` | $0 (limited calls) | Dev/test, 20 calls/min typical |
| Standard | `S0` | Pay-per-call | Production workloads |
| Premium | `S1`+ | Higher rate limits | High-volume production |

**Trap**: Not every service supports F0. The multi-service resource typically does NOT have a free tier. Single-service resources usually do.

### 8. Authentication & Networking

**Azure AD / Entra token authentication** requires:
1. **Custom subdomain** on the resource (e.g., `contoso.cognitiveservices.azure.com`)
2. **Private endpoint** for network-isolated access

**Trap**: Both custom subdomain AND private endpoint are needed for Entra auth with Speech service. Just one isn't enough.

**Private endpoints vs. service endpoints**:
- **Private endpoint** = private IP within your VNet, prevents internet routing → required for "connect without routing over public internet"
- **Service endpoint** = optimized routing over Azure backbone, but traffic still goes through public endpoint
- Public endpoint + IP firewall ≠ "without routing over public internet" (this is a trap scenario)

**Securing AI resources to specific VNet resources**:
- Enable **service endpoint** in VNet for the resource
- Modify **virtual network settings** in the AI resource itself
- Use **virtual network rules** (not IPsec, not Azure Firewall, not VPN gateway) for minimal admin effort

### 9. Azure AI Search Scaling

| Action | Handles |
|---|---|
| **Add replicas** | More query throughput (reduces throttling from high query volume) |
| **Add partitions** | More storage / index size |
| **Add indexes** | Does NOT reduce throttling (more indexes = more load) |
| **Higher tier** | More resources overall (also works for throttling) |

**Trap series** (3 questions with same scenario): Cognitive Search throttling from increased query volume:
- "Add replicas" → **Yes** ✓ (replicas handle query load)
- "Add indexes" → **No** ✗ (more indexes = more work)
- "Migrate to higher tier" → **Yes** ✓ (higher tier = more capacity)

---

## Comparisons (X vs Y)

### Resource Types
| Feature | Single-Service | Multi-Service | Foundry Resource |
|---|---|---|---|
| Free tier (F0) | ✅ Most services | ❌ Usually not | ❌ |
| Single key/endpoint | For one service | For all supported services | For all + OpenAI |
| Agents support | ❌ | ❌ | ✅ |
| Evaluations | ❌ | ❌ | ✅ |
| Projects | ❌ | ❌ | ✅ |

### Private Endpoint vs Service Endpoint vs IP Firewall
| Method | Prevents public internet routing? | Use case |
|---|---|---|
| Private endpoint | ✅ Yes | "No public internet" requirement |
| Service endpoint + VNet rules | ❌ Traffic uses public endpoint (optimized path) | Restrict to specific VNets |
| IP firewall | ❌ Still public endpoint | Restrict to known IPs |

### FormRecognizerClient Methods
| Method | Purpose |
|---|---|
| `StartRecognizeContentFromUri` | Extract layout/text (no prebuilt model) |
| `StartRecognizeReceiptsFromUri` | **Prebuilt receipt** model |
| `StartRecognizeInvoicesFromUri` | Prebuilt invoice model |

**Trap**: "Prebuilt model" + "receipts" → `FormRecognizerClient.StartRecognizeReceiptsFromUri` (not FormTrainingClient, not StartRecognizeContentFromUri)

---

## Common Traps & Misconceptions

1. **Subscription ID vs. Tenant ID**: REST API resource creation uses subscription ID in the URL path, not tenant ID
2. **Custom subdomain is not optional** for Entra token auth — it's a hard requirement
3. **Adding indexes doesn't reduce Search throttling** — it increases load. Add replicas instead.
4. **Multi-service resource has no free tier** — if question says "free" (F0), it must be a single-service resource
5. **Docker `Billing` param** ≠ billing page. It's the Azure resource endpoint URL.
6. **Public endpoint + Private Link** is a trap — deploying to a NEW VNet with a public endpoint doesn't help if app is on a DIFFERENT VNet. You need private endpoint on the SAME VNet (or peered).
7. **ComputerVision vs CustomVision.Prediction**: Image captioning/describe = ComputerVision. Object detection training = CustomVision.
8. **describeImageInStreamAsync** returns complete sentences. `tagImageInStreamAsync` returns tags. `readInStreamAsync` does OCR.
9. **Document Intelligence custom models**: Inconsistent layouts → **Custom neural**. Consistent layouts → **Custom template**. Storage → Azure Storage account (not Cosmos DB, not Azure Files).
10. **Object Detection + General (compact)** for edge/offline scenarios needing location info + intermittent connectivity.

---

## Quick Reference Card

### docker run essentials
```
Eula=accept | Billing={ENDPOINT_URI} | ApiKey={API_KEY}
```
All three mandatory. Container MCR path: `mcr.microsoft.com/azure-cognitive-services/<category>/<service>`

### Resource creation REST path
```
PUT .../subscriptions/{subId}/.../Microsoft.CognitiveServices/accounts/{name}
```

### Key SKU names for deployment
- `GlobalStandard` → pay-per-token, global routing, highest quota
- `ProvisionedManaged` → regional provisioned, reserved PTU
- `GlobalBatch` → 50% discount, 24hr async

### Connecting to Azure OpenAI via SDK
You need: **deployment name** + **endpoint** + **key** (not model name, not model type)

### Search scaling formula
- More queries → add **replicas**
- More data → add **partitions**
- Both → higher **tier**

---

## Lab: Production Deployment Checklist

Draft a checklist for deploying an Azure AI solution to production. Fill in the blanks:

```
□ Resource Type: ______________ (Foundry / single-service / multi-service)
□ Region: ______________ (check model availability + data residency)
□ Deployment Type: ______________ (Global Standard / Provisioned / etc.)
□ Pricing Tier: ______________ (F0 / S0 / PTU count)
□ Authentication: ______________ (API key / Entra token / Managed Identity)
□ Custom Subdomain: ______________ (required for Entra auth? Y/N)
□ Networking: ______________ (public / private endpoint / VNet service endpoint)
□ Container needed: ______________ (on-prem / edge / cloud-only)
□ If container: Eula=accept, Billing=___, ApiKey=___
□ RBAC Roles: ______________ (Azure AI User / Contributor / Owner)
□ Monitoring: ______________ (Azure Monitor / diagnostic logs / token metrics)
□ Content Safety: ______________ (content filters configured? guardrails?)
□ Backup/DR: ______________ (multi-region? separate Foundry resources?)
```

---

## Related Questions in questions.json

| ID | Summary |
|---|---|
| `XsMszscqvUA8H6Da7mPL` | REST API resource creation — subscription ID + Microsoft.CognitiveServices |
| `b9PEYZiBtHB1ZHH7N5zI` | Speech service Entra auth — custom subdomain + private endpoint |
| `VVHIPl8XJVJbnGznFpLi` | Form Recognizer SDK — FormRecognizerClient + StartRecognizeReceiptsFromUri |
| `OWqtloLHfijmINONOyTN` | Document Intelligence — Azure Storage + Custom neural model |
| `2ADaD5eHzSBt1onOPAMc` | Speech SDK streaming MP3 — AudioConfig.SetProperty |
| `5GIFjxU1yKRvyE5jGeGN` | Search throttling — adding indexes doesn't help (No) |
| `D1Rx0tlrEoPXJbirGNbM` | LUIS API — AddPhraseListAsync + PhraselistCreateObject |
| `MqUDpUhbyY1lpBh7FrEj` | Anomaly Detector for IoT time series |
| `ctrRAi5eAWUqh06GgIAs` | Univariate Anomaly Detection for single sensor stream |
| `fXDxfcOzrMhn9iUTBCVJ` | LUIS container deployment steps |
| `mw1OgwdVFn3NzasQPet8` | Computer Vision — describeImageInStreamAsync for sentences |
| `w9WTAoHtpOmehNAdvzDY` | Knowledge store — table projection for Power BI |
| `0loncNLBL5EonWMa0n5x` | Custom Vision — Object Detection + General (compact) for edge |

Quiz command:
```powershell
cd "d:\Projects\microsoft-exam-prep\AI-102 Prep"
python quiz_runner.py questions.json --day-lock 2 --carryover 3 --shuffle --open-images
```

Or web mode:
```powershell
cd "d:\Projects\microsoft-exam-prep\AI-102 Prep"
python quiz_runner.py questions.json --day-lock 2 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)
- [Microsoft Foundry architecture](https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/architecture)
- [Deployment types for Foundry Models](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/deployment-types)
- [Quickstart: Set up your first Foundry resource](https://learn.microsoft.com/en-us/azure/ai-services/multi-service-resource)
- [Azure AI containers overview](https://learn.microsoft.com/en-us/azure/ai-services/cognitive-services-container-support)

---

## Notes (your own words — fill this in after studying)
_(Write your own notes here after going through the material)_
