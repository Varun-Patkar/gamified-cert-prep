# Day 1: Service Selection — Choosing the Right Azure AI Service
**Date**: 2026-05-06 | **Domain**: 1 — Plan and manage an Azure AI solution (20–25%) | **Time**: 0.5 hr

---

## 1. Multi-Service vs Single-Service Resources

Azure AI services can be provisioned two ways:

| Approach | ARM kind | When to use |
|----------|----------|-------------|
| **Multi-service** (CognitiveServices) | `CognitiveServices` | One key/endpoint for Vision + Language + Speech + more. Pick when question says "single key", "consolidate billing", or "future services". |
| **Single-service** | `OpenAI`, `Face`, `CustomVision.Training`, etc. | Need to isolate billing, networking, or RBAC per service. |

- Creating via REST API: `PUT` to `subscriptions/{subId}/resourceGroups/{rg}/providers/Microsoft.CognitiveServices/accounts/{name}`. **Trap**: it's PUT not POST — Azure ARM uses PUT for resource creation.
- `az cognitiveservices account show` identifies an existing resource (not `az account list`, not `az resource link`).

---

## 2. On-Premises Containers

When data must stay on your network, you deploy AI services as **Docker containers** that process locally but **phone home to Azure for billing** (metered, not optional).

### Required `docker run` parameters (memorize these three)

| Param | Value | Notes |
|-------|-------|-------|
| `Eula` | `accept` | Legal acceptance |
| `Billing` | `https://contoso.cognitiveservices.azure.com` | Endpoint of your Azure resource — container won't start without it |
| `ApiKey` | Your resource key | Authentication |

- Container image path: `mcr.microsoft.com/azure-cognitive-services/<service>/<feature>` (e.g., `textanalytics/sentiment`)
- **Trap**: K8s cluster for containers must have internet access for billing. An internet-isolated cluster won't work.
- **Trap**: To keep API keys out of command-line history → use a custom Dockerfile that bakes them in as build secrets, then push to ACR (which also gives RBAC control over who pulls the image).

Sequence for on-prem Language/Sentiment container:
1. Provision Language resource in Azure
2. Pull container image from MCR (or build custom Dockerfile → push to ACR)
3. Run container with `Billing` endpoint + `ApiKey`

---

## 3. Networking — Private Endpoints vs Service Endpoints

| Question pattern | Answer |
|------------------|--------|
| "Connect without routing over public internet" | **Private endpoint** |
| "Public endpoint + NSG" offered as solution | **No** — still public internet, NSG just filters |
| "Prevent external access" + "allow specific VNet resources" | Service endpoint in VNet + modify AI resource firewall to allow that VNet (two steps) |

- Service endpoint: enable in VNet for `Microsoft.CognitiveServices` → then in the AI resource, add VNet rule under networking/firewall settings.
- **Trap**: IAM (RBAC) alone doesn't restrict network access — it controls who can manage the resource, not who can call the API over the wire.

---

## 4. Azure Cognitive Search — Throttling

This is a recurring 3-variant question: "Search queries are being throttled. Does [X] fix it?"

| Proposed fix | Works? | Why |
|-------------|--------|-----|
| Add **replicas** | **Yes** | Distributes query load across more nodes |
| Add **indexes** | No | More indexes = more data to manage, doesn't help query throughput |
| Enable **CMK encryption** | No | Security feature, zero impact on throughput |

For enrichment pipelines (50k+ docs needing OCR + text analytics): attach a **Cognitive Services S0 resource** to the skillset. Free tier only covers 20 docs/day.

---

## 5. Custom Vision — Offline Export

If you need to run a Custom Vision model on a disconnected device:
1. Change domain from General to **General (compact)** — compact models are smaller, exportable
2. **Retrain** the model (required after domain change)
3. Export to ONNX / TensorFlow / CoreML / Docker

**Trap**: question says "uses the General domain" — that domain can't export. You must switch to compact first.

---

## 6. Document Intelligence (Form Recognizer) — Receipt Extraction

- Prebuilt receipt model extracts vendor, total, date, line items from receipts — zero training needed.
- SDK: `FormRecognizerClient` + `StartRecognizeReceiptsFromUri` (not `FormTrainingClient`, not `StartRecognizeContentFromUri`).
- **Trap**: `ContentFromUri` = generic layout OCR. `ReceiptsFromUri` = receipt-specific structured extraction. Question says "extract top-level info from receipts" → receipt-specific method.
- "Form Recognizer" is the old name; exam may use either name, SDK still uses old names.

---

## 7. Language Service — Detection Endpoint

- Language detection: `POST {Endpoint}/text/analytics/v3.1/languages`
- Base URL: `https://{region}.api.cognitive.microsoft.com` or custom subdomain
- "Route emails to French vs English support team" = language detection (not translation, not sentiment)

---

## 8. Face API — PPE Compliance

- Detect removed masks/glasses on factory floor = **Face API** (detects face attributes including accessories, headwear, glasses)
- NOT Computer Vision (too general, no accessory detection), NOT Video Indexer (video insight extraction, not real-time compliance)
- Face API is gated — requires approval for identification/verification scenarios

---

## 9. Anomaly Detection

| Scenario | Service |
|----------|---------|
| Single time series (one sensor) | **Univariate Anomaly Detector** |
| Multiple correlated sensors | **Multivariate Anomaly Detector** |
| Multi-sensor + root cause + alerts | **Metrics Advisor** (if offered) |

- "Engine sensor data from 100 machines, 50 sensors each, identify unusual values" → Anomaly Detector
- "Correlate across sensors, root cause, send alerts, minimize dev time" → Metrics Advisor

---

## 10. Responsible AI Principles

- High-stakes decisions affecting people (bonuses, hiring, lending) → **always add human review** before acting on AI output
- "Equitable results regardless of location/background" → **Fairness + Inclusiveness**
- Don't use data from users who requested deletion (GDPR/privacy)

---

## Quick Reference Card

| Scenario Keyword | Service |
|---|---|
| Extract receipt/invoice fields | Document Intelligence |
| Single key for multiple services | Multi-service CognitiveServices resource |
| On-prem AI with local data | Container + `Billing` param |
| No public internet access | Private endpoint |
| Restrict to specific VNet | Service endpoint + firewall rule |
| Search query throttling | Add replicas |
| Offline model from Custom Vision | Compact domain → retrain → export |
| Language routing | Language detection endpoint |
| Face/mask/glasses detection | Face API |
| Multi-sensor anomalies | Multivariate Anomaly Detector |
| Multi-sensor + root cause + alerts | Metrics Advisor |

---

## Quiz Command
```powershell
cd "d:\Projects\microsoft-exam-prep\AI-102 Prep"
python quiz_runner.py questions.json --day-lock 1 --carryover 0 --shuffle --open-images --web --port 8765
```

---

## Sources
- [Azure AI Services overview](https://learn.microsoft.com/en-us/azure/ai-services/what-are-ai-services)
- [Container support for AI services](https://learn.microsoft.com/en-us/azure/ai-services/cognitive-services-container-support)
- [Custom Vision export](https://learn.microsoft.com/en-us/azure/ai-services/custom-vision-service/export-your-model)
- [Search throttling](https://learn.microsoft.com/en-us/azure/search/search-performance-analysis#throttling-behaviors)
- [Private endpoints for Search](https://learn.microsoft.com/en-us/azure/search/service-create-private-endpoint)
- [Document Intelligence overview](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/overview)
- [Language detection API](https://learn.microsoft.com/en-us/rest/api/language/text-analytics-runtime/detect-language)

---

## Notes (your own words)
_
_
