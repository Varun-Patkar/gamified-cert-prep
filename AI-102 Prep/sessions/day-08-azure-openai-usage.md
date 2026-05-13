# Day 8: Azure OpenAI Usage

**Date**: 2026-05-13
**Domain**: Domain 2 — Implement generative AI solutions (15-20%)
**Subtopics**: Provision resource, select/deploy models, prompts for code/NL, DALL-E images, app integration, multimodal models
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)

- Azure OpenAI is now part of **Microsoft Foundry Models** — provision via Azure portal or CLI as `Microsoft.CognitiveServices/accounts`
- **Deployment name ≠ model name** — API calls use the deployment name, not the underlying model name
- Deployment types: **Global Standard** (highest quota, pay-per-token), **Provisioned** (reserved PTUs), **Global Batch** (50% cheaper, 24hr), **Data Zone** (EU/US residency), **Standard** (single region)
- Image generation now uses **gpt-image-1** series (DALL-E 3 retired March 2026) — output is always **base64**, no URL option
- Vision/multimodal: GPT-4o, GPT-5 series accept text+image input via `image_url` in Chat Completions; set `detail` to `low`/`high`/`auto`
- **Responses API** is the new unified API (`/openai/v1/responses`) — supports chaining via `previous_response_id`, function calling, streaming, code interpreter
- Quiz questions today test: OCR polling pattern, Custom Vision metrics/export, Face API find-similar, Video Indexer brands, Document Intelligence for invoices

---

## Learning Objectives

After this session you should be able to:

1. Provision an Azure OpenAI resource and deploy a model via portal or CLI
2. Distinguish deployment types and choose the right one for a scenario
3. Submit prompts via Chat Completions API and Responses API with correct parameters
4. Generate images using gpt-image-1 series models (replacing DALL-E 3)
5. Use multimodal (vision) capabilities with GPT-4o/GPT-5 series
6. Integrate Azure OpenAI into applications using the Python SDK

---

## Key Concepts

### 1. Provisioning an Azure OpenAI Resource

- Created as `Microsoft.CognitiveServices/accounts` with kind `OpenAI`
- **Pricing tier**: Only Standard (S0) available
- **Network options**: All networks / Selected networks (VNet + firewall) / Disabled (private endpoint only)
- **Authentication**: API key or Microsoft Entra ID (recommended)
- CLI: `az cognitiveservices account create --name <name> --resource-group <rg> --kind OpenAI --sku S0 --location <region>`

### 2. Selecting and Deploying Models

**Current model families (exam-relevant):**

| Family               | Key Models                                                | Strengths                                                   |
| -------------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| GPT-5 series         | gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-pro                  | Reasoning, multimodal, structured outputs, function calling |
| GPT-4.1 series       | gpt-4.1, gpt-4.1-mini, gpt-4.1-nano                       | 1M token context, text+image, function calling              |
| GPT-4o / GPT-4o-mini | gpt-4o (2024-11-20), gpt-4o-mini                          | Multimodal, JSON mode, parallel function calls              |
| o-series             | o3, o4-mini, o3-mini, o1                                  | Advanced reasoning, math, coding                            |
| Embeddings           | text-embedding-3-large/small, ada-002                     | Vector representations for search                           |
| Image gen            | gpt-image-1, gpt-image-1-mini, gpt-image-1.5, gpt-image-2 | Text-to-image, inpainting, editing                          |

**Trap**: DALL-E 3 (`dall-e-3`) was **retired March 4, 2026**. Use `gpt-image-1` series instead. If the exam mentions DALL-E, it's testing whether you know the current model.

**Deployment process** (Foundry portal):

1. Sign in to ai.azure.com → Select project → Models + endpoints
2. Deploy model → Select model → Configure: **Deployment name**, Deployment type, TPM rate limit, Content filter
3. **Deployment name is what you use in API calls** — not the model name

**Trap**: Azure OpenAI always requires `deployment name` in API calls. OpenAI API only requires `model name`. This is a **key difference** the exam tests.

### 3. Deployment Types Comparison

| Type                   | SKU Code                 | Data Processing   | Billing            | Best For                         |
| ---------------------- | ------------------------ | ----------------- | ------------------ | -------------------------------- |
| **Global Standard**    | GlobalStandard           | Any Azure region  | Pay-per-token      | General workloads, highest quota |
| **Global Provisioned** | GlobalProvisionedManaged | Any Azure region  | Reserved PTU       | Predictable high-throughput      |
| **Global Batch**       | GlobalBatch              | Any Azure region  | 50% discount, 24hr | Large async jobs                 |
| **Data Zone Standard** | DataZoneStandard         | Within US/EU zone | Pay-per-token      | Data residency compliance        |
| **Standard**           | Standard                 | Single region     | Pay-per-token      | Regional compliance, low volume  |
| **Provisioned**        | ProvisionedManaged       | Single region     | Reserved PTU       | Regional compliance + throughput |

**Trap**: Global Standard routes traffic globally — no data residency. For EU/US data residency, use **Data Zone** types. For single-region compliance, use **Standard** or **Regional Provisioned**.

### 4. Submitting Prompts — APIs

**Chat Completions API** (legacy but still widely used):

```python
from openai import AzureOpenAI
client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2024-08-01-preview",
    azure_endpoint="https://<resource>.openai.azure.com"
)
response = client.chat.completions.create(
    model="my-gpt4o-deployment",  # DEPLOYMENT name, not model name
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Write a Python function to sort a list"}
    ],
    max_tokens=500,
    temperature=0.7
)
```

**Responses API** (new unified API — `/openai/v1/responses`):

```python
from openai import OpenAI
client = OpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    base_url="https://<resource>.openai.azure.com/openai/v1/"
)
response = client.responses.create(
    model="gpt-4.1-nano",  # deployment name
    input="Explain quantum computing in simple terms."
)
print(response.output_text)
```

Key Responses API features:

- **Chaining**: `previous_response_id` carries conversation context without resending messages
- **Function calling**: Built-in tool support
- **Code Interpreter**: Sandboxed Python execution with container
- **Streaming**: `stream=True` for real-time token delivery
- **Background tasks**: `background=True` for long-running requests (o3, o1-pro)

### 5. Image Generation (gpt-image-1 series)

```json
POST https://<resource>.openai.azure.com/openai/v1/images/generations
{
    "prompt": "A mountain landscape at sunset, watercolor style",
    "model": "gpt-image-1.5",
    "size": "1024x1024",
    "n": 1,
    "quality": "high"
}
```

**Key facts for exam:**

- **Output format**: Always **base64** (`b64_json`) — no URL option for gpt-image-1 series
- **Sizes** (gpt-image-1 series): `1024x1024`, `1024x1536`, `1536x1024`
- **Sizes** (gpt-image-2): Arbitrary resolutions, multiples of 16px, up to 3840px (4K), aspect ratio up to 3:1
- **Quality**: `low`, `medium`, `high` (default: `high` for gpt-image-1; `medium` for gpt-image-1-mini)
- **Rate limit**: 5 requests per deployment (default)
- **n parameter**: 1-10 images per request
- **Streaming**: `stream=true` with `partial_images` (1-3) for progressive rendering
- **Editing/inpainting**: Supported via `/images/edits` endpoint with mask (PNG, alpha=0 for edit areas)
- **Transparency**: Set `background=transparent` + `output_format=PNG`
- **Content filter**: Prompts flagged as harmful return `error.code: contentFilter`

**Trap**: `response_format` parameter is NOT supported for gpt-image-1 series — they always return base64. Don't confuse with DALL-E 2 which supported URL output.

### 6. Multimodal / Vision Models

Vision-enabled models: **o-series**, **GPT-5 series**, **GPT-4.1 series**, **GPT-4o/GPT-4o-mini**

```json
{
	"model": "gpt-4o-deployment",
	"messages": [
		{
			"role": "user",
			"content": [
				{ "type": "text", "text": "Describe this image:" },
				{
					"type": "image_url",
					"image_url": { "url": "<URL or base64>", "detail": "high" }
				}
			]
		}
	],
	"max_tokens": 300
}
```

**Key details:**

- Image input via URL or `data:image/jpeg;base64,<data>`
- `detail` parameter: `low` (512×512, fewer tokens), `high` (detailed 512×512 segments), `auto` (default)
- **Supported formats**: JPEG, PNG, GIF (first frame), WEBP
- **Limits**: Max 10 images per request, max 20MB per image
- **Trap**: Set `max_tokens` or `max_completion_tokens` — output is cut off without it

---

## Important Details for Exam

### Cross-Topic Concepts Tested in Day 8 Quiz

**Computer Vision Read API (OCR polling pattern):**

- Read API is **asynchronous** — returns `operationId` immediately
- Must poll `GetReadResultAsync` in a **loop with delay**, checking `status` value
- Two actions needed: (1) wrap call in loop with delay, (2) verify `results.Status` value
- **Trap**: Read API (not Image Analysis 4.0) is the production answer for bulk OCR

**Custom Vision:**

- Evaluation metrics: **Precision** and **Recall** (not F-score, not AUC, not weighted accuracy)
- Move project between resources: **GetProjects** → **ExportProjects** → **ImportProjects**
- Retrain with new images + Smart Labeler: Upload all → Get suggested tags → Review & confirm
- For mobile (iOS/Android): Change domain to **compact** → Retrain → Export/Publish

**Face API find-similar:**

- `faceListId`: Up to **1,000** faces
- `largeFaceListId`: Up to **1,000,000** faces — use for 60K+ images
- `matchFace` mode: Returns ranked similar faces (even low similarity)
- `matchPerson` mode: Default, only same-person matches above threshold

**Document Intelligence:**

- For structured document extraction (invoices, receipts): Use **Azure AI Document Intelligence** (not Computer Vision)
- For compliance (no cloud storage): Send images as **raw image binary**

**Video Indexer:**

- Custom brands: Sign in → Content model customization → Brands → Add to include list
- Language model: Upload vocabulary as **.txt** files
- File upload limits: **2GB from device**, **30GB from URL**; supports WMV, AVI, MOV, MP4

**Speech Studio:**

- Upload training samples: **.zip** file containing **.wav** audio files + text transcript

---

## Common Traps & Misconceptions

1. **Deployment name vs model name**: Azure OpenAI requires deployment name in API calls, not model name
2. **DALL-E 3 is retired**: gpt-image-1 series is the replacement — always outputs base64
3. **Global Standard ≠ data residency**: Data can be processed in any region
4. **Read API for bulk OCR**: Not Image Analysis 4.0 (preview) — Read API is the production answer
5. **Custom Vision metrics**: Only Precision and Recall — not F-score or AUC
6. **Face API lists**: 60K+ images requires `largeFaceListId`, not `faceListId`
7. **Vision detail parameter**: Omitting `max_tokens` truncates output silently

---

## Hands-On Lab: Compare Two Prompt Templates

**Task**: Write two prompt templates for the same goal and compare outputs.

**Scenario**: Generate a product description for an e-commerce site.

**Template A — Minimal prompt:**

```
Write a product description for: {product_name}
```

**Template B — Structured prompt with constraints:**

```
You are a professional e-commerce copywriter. Write a product description for: {product_name}
Requirements:
- 50-75 words
- Include one benefit statement
- End with a call-to-action
- Tone: friendly and professional
```

**Exercise**:

1. Mentally substitute `{product_name}` = "Wireless Noise-Canceling Headphones"
2. Consider: Which template gives more consistent, usable output?
3. Template B demonstrates **prompt engineering principles**: role assignment, length constraints, format guidance, tone specification
4. **Exam takeaway**: Structured prompts with system messages produce more predictable, production-ready responses

---

## Related Questions in questions.json

| ID                   | Summary                                                         |
| -------------------- | --------------------------------------------------------------- |
| BcaFz1tclyElEMdfBNT8 | Face API find-similar with largeFaceListId + matchFace mode     |
| Iha51tSuMiJqVnoezpGz | Custom Vision evaluation metrics (Precision + Recall)           |
| O5tV1iOovO9O8hOpD6Ds | Video Indexer: detect company brands in video (3-step sequence) |
| Vei3M4yerWdKZto3invB | OCR Read API: polling loop + status check                       |
| jzTK4eBuiQAqpJYHPmHY | Computer Vision brand detection: bounding box coordinates       |
| pMq9Omo40uIVcjvGdbrN | Multilingual image tags → Computer Vision Image Analysis        |
| uGqLUFeUjeIBrkc18OC0 | Custom Vision: move project (GetProjects → Export → Import)     |
| 0CUuSnMV6fpCAccW1XG9 | Invoice extraction → Azure AI Document Intelligence             |
| 46A5oFwQ4xmzReGvqTDq | Text Analytics key phrases extraction output                    |
| AKisF2X8uT2E19xxDoNl | Speech Studio: upload .zip with .wav + transcript               |
| CsTapV8XiL2z1jvWwK8d | Custom speech container: Request approval → Export → Run        |
| EWdhhbwD8UFjMhpr0PFa | Custom Vision retrain: Upload all → Suggested tags → Review     |

Quiz command:

```powershell
cd "c:\Users\v-vpatkar\OneDrive - Microsoft\Desktop\microsoft-exam-prep\AI-102 Prep"; python quiz_runner.py questions.json --day-lock 8 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [Foundry Models sold directly by Azure](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure)
- [Create and deploy Azure OpenAI resource](https://learn.microsoft.com/en-us/azure/foundry-classic/openai/how-to/create-resource)
- [Deployment types for Microsoft Foundry Models](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types)
- [Azure OpenAI image generation models](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/dall-e)
- [Use vision-enabled chat models](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/gpt-with-vision)
- [Use the Azure OpenAI Responses API](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/responses)

---

## Notes (your own words — fill this in after studying)

_(Space for your own notes after reading through the material)_
