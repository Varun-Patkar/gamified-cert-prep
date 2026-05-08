# Day 3: Security and Monitoring

**Date**: 2026-05-08
**Domain**: Domain 1 — Plan and manage an Azure AI solution (20-25%)
**Subtopics**: Monitor an Azure AI resource · Manage costs · Manage and protect account keys · Manage authentication
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)

- Azure AI services have **two subscription keys** (KEY1 & KEY2) — always having two allows zero-downtime key rotation.
- **Microsoft Entra ID (Azure AD) authentication requires a custom subdomain** on the resource; regional endpoints do NOT support it.
- **Cognitive Services User** = read + list keys + all data-plane operations. **Cognitive Services Contributor** = full control-plane (create/delete/manage keys) but **NO data-plane** actions via Entra ID.
- **Private endpoints** = traffic stays on Azure backbone (Private Link). **Service endpoints** = traffic stays on Azure backbone but still uses the public IP. Both require setting default network rule to **deny**.
- **Virtual network rules** on the AI resource itself restrict which subnets can reach the endpoint — configured on the resource's Networking blade, not via NSG.
- Containers still need **billing endpoint + API key** even when running on-prem; the container must have internet connectivity for billing.
- Diagnostic logging → **Azure Monitor** → send to **Log Analytics** (Kusto queries) or **Storage Account** (archival). Log categories: `Audit`, `RequestResponse`, `AllMetrics`.
- **regenerateKey API**: `POST .../regenerateKey` with `"keyName": "Key2"` resets only that specific secondary key.

---

## Learning Objectives

After this session you should be able to:

1. Configure and rotate subscription keys safely with zero downtime.
2. Set up Microsoft Entra ID (Azure AD) authentication with RBAC roles for AI services.
3. Explain the difference between service endpoints, private endpoints, VNet rules, and NSGs.
4. Enable diagnostic logging and create alerts in Azure Monitor.
5. Describe cost management options: pricing tiers, commitment tiers, budgets.
6. Design an RBAC + Managed Identity architecture for a multi-app AI solution.

---

## Key Concepts

### 1. Authentication Methods

| Method                               | Header                                                                         | When to Use                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| **Single-service key**               | `Ocp-Apim-Subscription-Key`                                                    | Simple dev/test; one key per service                                 |
| **Multi-service (Foundry) key**      | `Ocp-Apim-Subscription-Key` + `Ocp-Apim-Subscription-Region` (Translator only) | Single key for multiple services                                     |
| **Access token** (from key exchange) | `Authorization: Bearer <TOKEN>`                                                | Token valid 10 min; used by Speech STT/TTS, Translator               |
| **Microsoft Entra ID**               | `Authorization: Bearer <TOKEN>` via MSAL/DefaultAzureCredential                | Production; eliminates key management; **requires custom subdomain** |

**Trap**: Entra ID auth always needs a **custom subdomain**. Regional endpoints (`westus.api.cognitive.microsoft.com`) do NOT support Entra auth. If the exam says "authenticate with Azure AD," check whether a custom subdomain is configured. If not → it won't work.

**Trap**: `Cognitive Services Contributor` can view/copy/regenerate keys but **cannot make inference API calls via Entra ID** — it has no DataActions. For Entra ID inference calls, you need `Cognitive Services User` or `Cognitive Services OpenAI User`.

### 2. Account Keys & Key Rotation

- Every Azure AI resource gets **two keys** (KEY1, KEY2).
- Use `KEY1` in production. When rotating: regenerate `KEY2` → update apps to use `KEY2` → regenerate `KEY1`.
- **regenerateKey REST API**: `POST /accounts/{name}/regenerateKey` with body `{"keyName": "Key2"}` → resets **only** Key2 (secondary key). This does NOT rotate both keys simultaneously.

**Trap**: The exam tests this exact API. "What is the result of `POST .../regenerateKey` with `keyName: Key2`?" → Answer: the secondary subscription key was reset. Not "both keys rotated" and not "a Key Vault key was generated."

**Key Vault Integration**: Store keys in Azure Key Vault, reference them via Key Vault secret URI. Use managed identity to access Key Vault → eliminates keys in code entirely.

### 3. Azure RBAC Roles for AI Services

| Role                                      | Control Plane                 | Data Plane                               | Can Manage Keys? | Can Call API via Entra? |
| ----------------------------------------- | ----------------------------- | ---------------------------------------- | ---------------- | ----------------------- |
| **Cognitive Services Contributor**        | Full (create, delete, manage) | ❌ None                                  | ✅ Yes           | ❌ No                   |
| **Cognitive Services User**               | Read-only                     | ✅ All (`Microsoft.CognitiveServices/*`) | ✅ List keys     | ✅ Yes                  |
| **Cognitive Services OpenAI User**        | Read-only                     | ✅ OpenAI only                           | ❌ No            | ✅ Yes                  |
| **Cognitive Services OpenAI Contributor** | Read + deploy/fine-tune       | ✅ OpenAI only                           | ❌ No            | ✅ Yes                  |
| **Cognitive Services Usages Reader**      | Quota viewing only            | ❌ None                                  | ❌ No            | ❌ No                   |

**Trap**: `Cognitive Services Contributor` has **no DataActions** — it cannot make inference calls via Entra ID. The exam loves this distinction. "User has Contributor role but gets 403 on API call" → they need `Cognitive Services User` too.

**Trap**: For adding contributors to a LUIS authoring resource, you use the **IAM page of the authoring resource** (not the prediction resource).

**Azure role assignments can take up to 5 minutes to propagate.**

### 4. Managed Identities

| Type                | Lifecycle                                              | Use Case                                                          |
| ------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| **System-assigned** | Tied to the resource; deleted when resource is deleted | Single-resource access; 1:1 mapping                               |
| **User-assigned**   | Independent; can be shared across resources            | Multiple resources need same identity; survives resource deletion |

**How it works**: Enable managed identity on your app (VM, App Service, Function) → Assign RBAC role on the AI resource → App uses `DefaultAzureCredential` to get token automatically. No secrets in code.

**Speech service special case**: When using private endpoints with Speech, you need a **separate endpoint** configuration (unlike other services that just resolve via DNS).

### 5. Network Security

#### Service Endpoints vs Private Endpoints

| Feature                       | Service Endpoint                      | Private Endpoint                |
| ----------------------------- | ------------------------------------- | ------------------------------- |
| **Traffic path**              | Azure backbone                        | Azure backbone via Private Link |
| **Public IP used?**           | Yes (still uses public IP of service) | No (private IP from your VNet)  |
| **Prevents internet access?** | Only when combined with deny rule     | Yes, fully private              |
| **DNS**                       | No DNS change                         | Creates privatelink.\* DNS zone |
| **Cost**                      | Free                                  | Azure Private Link pricing      |

**Trap**: NSGs alone do NOT restrict access to Azure AI services. You must configure **virtual network rules on the AI resource itself** (Resource → Networking → Selected Networks). NSGs filter traffic within/between VNets but don't control PaaS service access.

**Trap**: "Ensure app connects to service without routing over public internet" → Answer is **private endpoint**, not public endpoint + NSG, not public endpoint + IP firewall, not public endpoint + Private Link on a new VNet.

**Virtual Network Rules configuration**:

1. On the AI resource: Networking → "Selected Networks and Private Endpoints"
2. Add existing VNet/subnet (this enables service endpoint automatically)
3. Set default rule to **Deny**
4. Up to **100 VNet rules + 100 IP rules** per resource

**Trusted Azure Services**: Azure OpenAI can grant bypass to trusted services (Azure ML, Azure Search, Cognitive Services) via `networkAcls.bypass = "AzureServices"`.

### 6. Monitoring an Azure AI Resource

**Diagnostic Settings** (Resource → Monitoring → Diagnostic settings):

- **Log categories**: `Audit`, `RequestResponse`, `AllMetrics`
- **Destinations**: Storage Account, Log Analytics workspace, Event Hub
- Storage account can be in a different subscription
- Takes up to **2 hours** before logging data is queryable

**Key Kusto Queries** (Log Analytics):

```kusto
// All Cognitive Services logs
AzureDiagnostics
| where ResourceProvider == "MICROSOFT.COGNITIVESERVICES"

// Average response time by operation
AzureDiagnostics
| where ResourceProvider == "MICROSOFT.COGNITIVESERVICES"
| summarize avg(DurationMs) by OperationName

// Operations over time (10-second bins)
AzureDiagnostics
| where ResourceProvider == "MICROSOFT.COGNITIVESERVICES"
| summarize count() by bin(TimeGenerated, 10s), OperationName
| render areachart kind=unstacked
```

**Metrics available**: Total Calls, Total Errors, Latency, Data In/Out, Successful Calls.

**Alerts**: Configure in Azure Monitor → metric alerts (e.g., error rate > threshold) or log alerts (Kusto query-based).

### 7. Cost Management

**Pricing Models**:

- **Pay-as-you-go (Serverless API)**: Billed per transaction/token
- **Commitment Tiers**: Fixed monthly fee for predictable workloads; overage billed at PAYG rates
- **Free Tier (F0)**: Limited transactions/month; good for dev/test

**Cost Tools**:

- **Azure Pricing Calculator**: Estimate before deployment
- **Cost Analysis** (Azure portal → Cost Management): View actual costs by resource, service, time
- **Budgets**: Set spending limits with alerts at % thresholds
- **Cost Export**: Export to storage account for analysis in Excel/Power BI

**Trap**: CMK encryption does NOT reduce throttling. If queries are throttled → increase replicas (for search), migrate to higher tier, or scale up. CMK only adds encryption overhead (index size ↑, query time ↑).

**Resources that accrue cost after deletion**: Container Registry, Blob Storage, Key Vault, Application Insights (if enabled).

---

## Comparisons (X vs Y tables)

### Private Endpoint vs Service Endpoint vs IP Firewall

|                                      | Private Endpoint | Service Endpoint   | IP Firewall       |
| ------------------------------------ | ---------------- | ------------------ | ----------------- |
| Keeps traffic off public internet    | ✅               | ✅ (backbone only) | ❌ (still public) |
| Uses private IP                      | ✅               | ❌                 | ❌                |
| Works from on-premises               | ✅ (via VPN/ER)  | ❌                 | ✅                |
| Prevents public exposure             | ✅               | Partial            | ❌                |
| Exam answer for "no public internet" | ✅ **This one**  | ❌                 | ❌                |

### Cognitive Services Contributor vs User vs OpenAI User

| Capability                  | CS Contributor | CS User        | CS OpenAI User   |
| --------------------------- | -------------- | -------------- | ---------------- |
| Create/delete resources     | ✅             | ❌             | ❌               |
| View/regenerate keys        | ✅             | ✅ (list)      | ❌               |
| Make API calls via Entra ID | ❌             | ✅             | ✅ (OpenAI only) |
| Deploy models               | ❌             | ❌             | ❌               |
| Configure diagnostics       | ✅             | ❌ (read only) | ❌               |

---

## Common Traps & Misconceptions

1. **"NSG for vnet1" restricts AI service access** → Wrong. You configure network rules **on the AI resource's Networking blade**, not via NSGs.

2. **"Public endpoint + IP firewall = no public internet"** → Wrong. Traffic still traverses the public internet; IP firewall just filters by source IP.

3. **"Cognitive Services Contributor can call APIs via Entra ID"** → Wrong. Contributor has zero DataActions. You need `Cognitive Services User` for data-plane access.

4. **"regenerateKey regenerates both keys"** → Wrong. It regenerates only the key specified in `keyName` (Key1 or Key2).

5. **"CMK encryption reduces throttling"** → Wrong. CMK adds overhead. To reduce throttling: add replicas, scale tier, or optimize queries.

6. **"Containers run fully offline"** → Wrong. Containers still need internet for **billing**. They send usage telemetry to the Azure endpoint. The data stays on-prem; only billing info goes out.

7. **"Speech service uses the same endpoint with private endpoints as other services"** → Wrong. Speech requires a **separate endpoint** when using private endpoints.

---

## Quick Reference Card

| Item                                  | Value                                     |
| ------------------------------------- | ----------------------------------------- |
| Keys per resource                     | 2 (KEY1, KEY2)                            |
| Token validity (key exchange)         | 10 minutes                                |
| Role propagation time                 | Up to 5 minutes                           |
| VNet rules per resource               | 100 max                                   |
| IP rules per resource                 | 100 max                                   |
| Logging availability delay            | Up to 2 hours                             |
| Auth header (key)                     | `Ocp-Apim-Subscription-Key`               |
| Auth header (token)                   | `Authorization: Bearer <TOKEN>`           |
| Translator multi-service extra header | `Ocp-Apim-Subscription-Region`            |
| Entra ID requirement                  | Custom subdomain on resource              |
| Container requirement                 | Internet for billing (endpoint + API key) |
| CLI to identify AI resource           | `az cognitiveservices account show`       |

---

## Hands-On Lab: RBAC + Managed Identity Design Exercise

**Scenario**: You're designing security for a company with three applications accessing Azure AI services:

| App       | Environment       | Service Used                 | Requirements                            |
| --------- | ----------------- | ---------------------------- | --------------------------------------- |
| WebApp1   | Azure App Service | Azure OpenAI                 | Must call chat completions via Entra ID |
| Function1 | Azure Functions   | Language service (sentiment) | Must process sensitive data on VNet     |
| BatchApp1 | On-prem VM        | Speech STT                   | Must keep audio data on-premises        |

**Exercise — Fill in your answers**:

1. **WebApp1**: Which identity type? Which RBAC role? How does it authenticate?
   - _Identity_: System-assigned managed identity (single resource)
   - _Role_: Cognitive Services OpenAI User (least privilege for inference)
   - _Auth_: DefaultAzureCredential → Bearer token → custom subdomain endpoint

2. **Function1**: How do you ensure only this Function can access the Language service?
   - _Network_: Enable service endpoint on Function's subnet; add VNet rule on Language resource; set default to Deny
   - _Identity_: System-assigned managed identity
   - _Role_: Cognitive Services User

3. **BatchApp1**: How do you keep audio on-prem while still using the service?
   - _Solution_: Deploy Speech container on-prem via Docker
   - _Requirements_: Still needs internet for billing (endpoint URI + API key)
   - _Container image_: `mcr.microsoft.com/azure-cognitive-services/speechservices/speech-to-text`

4. **Key Rotation Plan**: How do you rotate keys without downtime?
   - Step 1: All apps use KEY1
   - Step 2: Regenerate KEY2
   - Step 3: Update all apps to use KEY2
   - Step 4: Regenerate KEY1
   - Step 5: (Optional) Update apps back to KEY1
   - _Better_: Use managed identity + Entra ID → no keys to rotate

---

## Related Questions in questions.json

| Question ID            | Topic                                                            |
| ---------------------- | ---------------------------------------------------------------- |
| `2SHOdRImHWCBoijQ6oNR` | Container Docker run: billing endpoint + API key + correct image |
| `4TQwVtvve90s7b25vP3W` | CMK encryption does NOT reduce throttling                        |
| `9r8xgk94cdnGf4FlAFFN` | Private endpoint + Azure roles to secure Cognitive Search        |
| `IIIB9cMxZWFR8jubZtLT` | QnA Maker auto-creates Azure Cognitive Search + App Service      |
| `Ms0zxLZZWc1ITofs9t4L` | Metrics Advisor for multi-sensor anomaly detection               |
| `Os2wR3py1ERVrND5H2CX` | Anomaly Detector for time series                                 |
| `WxSbqCGundmsouEDuMYf` | Multivariate Anomaly Detection for correlated sensors            |
| `bGbJPMjNRmWzEps23mDW` | Docker Engine for limited connectivity (minimize costs)          |
| `dUuu3WSVUXpTXWS7mNlX` | regenerateKey API → secondary key reset                          |
| `fqN5oofCnZtWJ55XAd1k` | Virtual network rules to restrict Language service               |
| `nmGHgOAQOLcfpxOHSPih` | Direct Line Speech for inclusiveness                             |
| `1IhMIusZQjm3PHw6CiTC` | Object detection metrics (precision/recall)                      |

Quiz command:

```powershell
cd "c:\Users\v-vpatkar\OneDrive - Microsoft\Desktop\microsoft-exam-prep\AI-102 Prep"
python quiz_runner.py questions.json --day-lock 3 --carryover 3 --shuffle --open-images
```

---

## Sources (verified during this session)

- [Authenticate requests to Foundry Tools](https://learn.microsoft.com/en-us/azure/ai-services/authentication)
- [Enable diagnostic logging for Foundry Tools](https://learn.microsoft.com/en-us/azure/ai-services/diagnostic-logging)
- [Plan and manage costs for Microsoft Foundry](https://learn.microsoft.com/en-us/azure/ai-services/plan-manage-costs)
- [Configure Foundry Tools virtual networks](https://learn.microsoft.com/en-us/azure/ai-services/cognitive-services-virtual-networks)
- [Azure built-in roles for AI + ML](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/ai-machine-learning)
- [Role-based access control for Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/role-based-access-control)
- [Configure Azure OpenAI with Managed Identity](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/managed-identity)

---

## Notes (your own words — fill this in after studying)

_(Write what clicked, what's still fuzzy, and any mnemonics you created)_
