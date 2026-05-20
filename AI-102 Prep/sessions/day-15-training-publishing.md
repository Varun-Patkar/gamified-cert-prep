# Day 15 — Domain 4: Training & Publishing (Custom Vision + Cross-Domain Refreshers)

**Date:** 2026-05-20  
**Exam:** AI-102  
**Focus:** Custom Vision models (train/evaluate/publish/consume), cross-domain NLP/Speech/Search

---

## TL;DR

Custom Vision requires **two resources** (Training + Prediction). Workflow: create project → upload/tag images → train (creates an **iteration**) → **publish the iteration** (gives it a name + links to prediction resource) → consume via prediction endpoint. Metrics: **Precision** (correct among predicted), **Recall** (correct among actual), **AP** (area under P/R curve), **mAP** (mean AP across tags). Export requires a **compact domain**. Formats: ONNX, TensorFlow, CoreML, Docker. Cross-domain: SpeechTranslationConfig uses `speech_recognition_language` (source) + `add_target_language()` (targets). CLU entity types: machine-learned, regex, list, Pattern.any. Translator data sovereignty via geographic endpoints (api-nam, api-eur, api-apc). TextAnalytics resource: kind="TextAnalytics", SKU S0, region "eastus". EntityRecognitionSkill in AI Search recognizes locations/persons/orgs. Custom skills use WebApiSkill + **output field mappings are required**.

---

## 1. Custom Vision: End-to-End Workflow

### 1.1 Resource Setup

You need **two separate resources** in Azure:

- **Custom Vision Training** — used during model development
- **Custom Vision Prediction** — used to serve predictions at runtime

Both are created via the Azure portal's "Create Custom Vision" page. Each has its own key and endpoint.

### 1.2 Project Types

| Project Type                    | Description                                   |
| ------------------------------- | --------------------------------------------- |
| **Classification — Multiclass** | Each image gets exactly ONE tag (most likely) |
| **Classification — Multilabel** | Each image can have ZERO or MORE tags         |
| **Object Detection**            | Locates objects with bounding boxes + tags    |

### 1.3 Domains

| Domain        | Use Case                                        |
| ------------- | ----------------------------------------------- |
| **General**   | Broad range, default choice                     |
| **Food**      | Restaurant dishes                               |
| **Landmarks** | Natural/artificial landmarks                    |
| **Retail**    | Shopping catalog images                         |
| **Compact**   | Edge/mobile deployment (slightly less accurate) |

> **Exam Key:** Only **compact domains** can be exported for edge deployment. If you need to export, you must select a compact domain (or convert to one and retrain).

### 1.4 Training Images Requirements

- Minimum **30 images per tag** (recommended)
- Formats: .jpg, .png, .bmp, .gif
- Max size: 6 MB (training), 4 MB (prediction)
- Min dimension: 256 pixels on shortest edge (auto-scaled if smaller)
- Vary: camera angle, lighting, background, style, size

### 1.5 Object Detection Tagging

For object detection, you must **draw bounding boxes** around each object instance and assign a tag. Every instance must be tagged — untagged background is used as a negative example.

### 1.6 Training

- Click **Train** to create a new **iteration**
- Each training run produces a new iteration with its own performance metrics
- Two training options: **Quick Training** and **Advanced Training** (more compute, better for complex scenarios)

### 1.7 Iterations and Publishing

**Critical Concept:** An iteration is NOT automatically available for prediction. You must **publish** it:

```
Trained Iteration → Publish (give it a name + specify prediction resource) → Prediction Endpoint available
```

- You can have multiple iterations; only published ones are callable
- Publishing links the iteration to the Prediction resource
- The **published name** is used in the prediction URL

### 1.8 Prediction Endpoint

After publishing, the prediction endpoint follows this pattern:

```
POST https://{prediction-endpoint}/customvision/v3.0/Prediction/{project-id}/classify/iterations/{published-name}/image
```

Headers: `Prediction-Key: {prediction-key}`, `Content-Type: application/octet-stream` (for image) or `application/json` (for URL)

For object detection, replace `classify` with `detect`.

---

## 2. Custom Vision Metrics

### 2.1 Precision

**Fraction of identified classifications that were correct.**

- If the model predicted 100 images as "dog" and 99 were actually dogs → **Precision = 99%**
- High precision = few false positives

### 2.2 Recall

**Fraction of actual classifications that were correctly identified.**

- If there were 100 actual apple images and the model found 80 → **Recall = 80%**
- High recall = few false negatives

### 2.3 Average Precision (AP)

- Area under the Precision/Recall curve for a **single tag/class**
- Summarizes performance across all probability thresholds

### 2.4 Mean Average Precision (mAP)

- **Average of AP values across all tags**
- Used primarily in **object detection** to give an overall quality score
- Classification shows per-tag Precision/Recall; object detection additionally shows mAP

### 2.5 Probability Threshold

- Slider in the Performance tab controls the confidence cutoff
- **High threshold** → high precision, low recall (fewer but more confident predictions)
- **Low threshold** → high recall, low precision (more predictions, more false positives)
- Use the **same threshold** at prediction time as during evaluation

### 2.6 Overlap Threshold (Object Detection Only)

- Controls minimum IoU (Intersection over Union) between predicted and actual bounding boxes
- If predicted box doesn't overlap enough → prediction is marked incorrect

---

## 3. Code-First Custom Vision (SDK)

### 3.1 Python SDK Setup

```python
from azure.cognitiveservices.vision.customvision.training import CustomVisionTrainingClient
from azure.cognitiveservices.vision.customvision.prediction import CustomVisionPredictionClient
from azure.cognitiveservices.vision.customvision.training.models import ImageFileCreateBatch, ImageFileCreateEntry
from msrest.authentication import ApiKeyCredentials

# Training client
training_credentials = ApiKeyCredentials(in_headers={"Training-key": TRAINING_KEY})
trainer = CustomVisionTrainingClient(TRAINING_ENDPOINT, training_credentials)

# Prediction client
prediction_credentials = ApiKeyCredentials(in_headers={"Prediction-key": PREDICTION_KEY})
predictor = CustomVisionPredictionClient(PREDICTION_ENDPOINT, prediction_credentials)
```

### 3.2 Create Project + Tags

```python
# Create classification project
project = trainer.create_project("MyProject", classification_type="Multiclass")

# Create tags
hemlock_tag = trainer.create_tag(project.id, "Hemlock")
cherry_tag = trainer.create_tag(project.id, "Japanese Cherry")
```

### 3.3 Upload Images

```python
image_list = []
for image_path in hemlock_images:
    with open(image_path, "rb") as image_data:
        image_list.append(ImageFileCreateEntry(
            name=os.path.basename(image_path),
            contents=image_data.read(),
            tag_ids=[hemlock_tag.id]
        ))

trainer.create_images_from_files(project.id, ImageFileCreateBatch(images=image_list))
```

### 3.4 Train

```python
import time

iteration = trainer.train_project(project.id)
while iteration.status != "Completed":
    iteration = trainer.get_iteration(project.id, iteration.id)
    time.sleep(5)
```

### 3.5 Publish Iteration

```python
# Publish the iteration to the prediction resource
trainer.publish_iteration(
    project.id,
    iteration.id,
    publish_name="myModel_v1",          # The name used in prediction URL
    prediction_id=PREDICTION_RESOURCE_ID # Full resource ID of prediction resource
)
```

> **Exam Key:** `publish_iteration` requires the **prediction resource ID** (full Azure resource ID, not just the key).

### 3.6 Make Predictions

```python
# Classify an image
with open("test_image.jpg", "rb") as image_data:
    results = predictor.classify_image(project.id, "myModel_v1", image_data)

for prediction in results.predictions:
    print(f"{prediction.tag_name}: {prediction.probability:.2%}")
```

For object detection: `predictor.detect_image(project.id, "myModel_v1", image_data)`

---

## 4. Exporting Models for Edge Deployment

### 4.1 Requirements

- Must use a **compact domain** (General Compact, Food Compact, etc.)
- If existing project uses non-compact domain → change domain in settings → **retrain**

### 4.2 Export Formats

| Format                | Target                                                                       |
| --------------------- | ---------------------------------------------------------------------------- |
| **TensorFlow**        | Android                                                                      |
| **TensorFlow.js**     | JavaScript (React, Angular, Vue) — works on Android & iOS                    |
| **CoreML**            | iOS 11+                                                                      |
| **ONNX**              | Windows ML, Android, iOS                                                     |
| **Docker**            | Windows, Linux, or ARM containers (includes TensorFlow model + service code) |
| **Vision AI Dev Kit** | Specialized hardware                                                         |

### 4.3 Export Process

1. Go to **Performance** tab → select the iteration
2. Click **Export**
3. Choose format → **Download**

> **Exam Trap:** The Export button is only available if the iteration uses a compact domain. If greyed out, check the domain.

---

## 5. Cross-Domain Quiz Question Refreshers

### 5.1 SpeechTranslationConfig — Source vs Target Language

```python
import azure.cognitiveservices.speech as speechsdk

translation_config = speechsdk.translation.SpeechTranslationConfig(
    subscription="YOUR_KEY",
    region="YOUR_REGION"
)

# Source language (what the speaker is speaking)
translation_config.speech_recognition_language = "en-US"

# Target language(s) (what to translate TO)
translation_config.add_target_language("de")  # German
translation_config.add_target_language("fr")  # French — can add multiple targets

# Create the recognizer
recognizer = speechsdk.translation.TranslationRecognizer(translation_config=translation_config)
```

**Key distinctions:**

- `speech_recognition_language` = the **source** (input) language → set as a **property**
- `add_target_language()` = the **target** (output) language(s) → called as a **method**, can add multiple
- **NOT** `speech_synthesis_language` — that property is for TTS voice output language, not translation target
- **NOT** `source_language` or `target_language` as standalone properties

### 5.2 CLU Entity Types

| Entity Type         | How It Works                                                | Best For                                            |
| ------------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| **Machine-learned** | Trained from labeled examples, learns patterns from context | Addresses, product descriptions, unstructured text  |
| **Regex**           | Matches a defined regular expression pattern                | Order numbers, phone numbers, IDs with known format |
| **List**            | Exact string match from a predefined list (with synonyms)   | Product categories, department names, status values |
| **Pattern.any**     | Wildcard placeholder in pattern utterances                  | Book titles, entity names of variable length        |

> **Exam Key:** Billing addresses are **unstructured** and vary widely → **machine-learned** entity (not regex, not list). Regex only works for predictable patterns.

### 5.3 Translator API Data Sovereignty

| Geographic Endpoint                         | Region Coverage                                      |
| ------------------------------------------- | ---------------------------------------------------- |
| `api.cognitive.microsofttranslator.com`     | **Global** (closest datacenter, recommended default) |
| `api-nam.cognitive.microsofttranslator.com` | **Americas** (East US 2, West US 2)                  |
| `api-eur.cognitive.microsofttranslator.com` | **Europe** (France Central, West Europe)             |
| `api-apc.cognitive.microsofttranslator.com` | **Asia Pacific** (Japan East, Southeast Asia)        |

**Usage:** Replace the global base URL with the geographic one:

```
POST https://api-nam.cognitive.microsofttranslator.com/translate?api-version=3.0&to=en
```

> **Exam Key:** A US company with data sovereignty requirements → use `api-nam` endpoint. The global endpoint routes to the nearest datacenter but doesn't guarantee data stays in a geography.

### 5.4 TextAnalytics Resource Creation (ARM/Bicep)

When creating a Text Analytics resource via ARM template or Azure CLI:

- **kind**: `"TextAnalytics"` (exact casing matters)
- **SKU**: `"S0"` (Standard tier for production sentiment analysis)
- **region/location**: `"eastus"` (lowercase, no spaces — not "East US")

```json
{
	"type": "Microsoft.CognitiveServices/accounts",
	"apiVersion": "2023-05-01",
	"name": "my-text-analytics",
	"location": "eastus",
	"kind": "TextAnalytics",
	"sku": {
		"name": "S0"
	},
	"properties": {}
}
```

> **Exam Trap:** Common wrong answers: kind="Language" (wrong), kind="CognitiveServices" (multi-service, not specific), SKU="F0" (free tier, may not support all features), region="East US" (spaces not allowed in ARM).

### 5.5 SpeechRecognizer vs SpeechSynthesizer vs VoiceProfileClient

| Class                     | Function                        | Direction               |
| ------------------------- | ------------------------------- | ----------------------- |
| **SpeechRecognizer**      | Speech-to-Text (STT)            | Audio → Text            |
| **SpeechSynthesizer**     | Text-to-Speech (TTS)            | Text → Audio            |
| **TranslationRecognizer** | Speech Translation              | Audio → Translated Text |
| **VoiceProfileClient**    | Speaker enrollment/verification | Audio → Voice Profile   |

**Scenario: Phone order status bot**

- Customer calls and speaks → **SpeechRecognizer** (STT) converts speech to text
- System processes the order query
- Response is read back to customer → **SpeechSynthesizer** (TTS) converts text to speech

> **Exam Key:** A phone bot that LISTENS uses SpeechRecognizer. A phone bot that SPEAKS uses SpeechSynthesizer. VoiceProfileClient is for enrolling voice biometrics, NOT for general STT/TTS.

### 5.6 Entity Linking vs Entity Recognition

| Feature      | Entity Linking                                     | Entity Recognition                                                  |
| ------------ | -------------------------------------------------- | ------------------------------------------------------------------- |
| **Purpose**  | Disambiguates entities and links to knowledge base | Categorizes entities by type                                        |
| **Output**   | Wikipedia URL + description                        | Category label (Person, Location, Organization, DateTime, Quantity) |
| **Example**  | "Mars" → link to Mars (planet) vs Mars (company)   | "Mars" → Organization or Location                                   |
| **Use case** | Disambiguation, knowledge enrichment               | Information extraction, categorization                              |

> **Exam Key:** Entity Linking returns **Wikipedia URLs** to disambiguate. It does NOT return custom entities or categories. If the question asks "which service returns URLs to disambiguate," the answer is Entity Linking.

### 5.7 Azure AI Vision for PDF OCR + Language for Sentiment

**Pipeline for analyzing sentiment in PDF documents:**

1. **Azure AI Vision (Read/OCR API)** — extracts text from PDF pages (supports multi-page PDFs)
2. **Azure AI Language (Sentiment Analysis)** — analyzes the extracted text for sentiment

```
PDF Document → AI Vision (OCR/Read) → Extracted Text → AI Language (Sentiment) → Sentiment Scores
```

- Vision's Read API handles printed and handwritten text, multi-page documents
- Language's sentiment analysis returns document-level and sentence-level sentiment (positive/negative/neutral/mixed)

> **Exam Key:** You need TWO services: Vision for text extraction, Language for sentiment. Vision alone cannot do sentiment. Language alone cannot read PDFs.

### 5.8 Custom NER for Company-Specific Product Names

**Custom Named Entity Recognition (Custom NER)** in Azure AI Language lets you train a model to recognize **domain-specific entities** that pre-built NER cannot detect.

**Use case:** A company has internal product codenames (e.g., "Project Phoenix," "Widget-X3000") that standard NER doesn't recognize.

**Workflow:**

1. Create a Language resource
2. Upload documents containing your entities
3. Label/tag the entities in your training data
4. Train the Custom NER model
5. Deploy and consume via API

> **Exam Key:** Standard NER recognizes generic categories (person, location, org). For company-specific product names or codenames → use **Custom NER**. Not Custom Text Classification (that classifies documents, not extracts entities).

### 5.9 EntityRecognitionSkill in Azure AI Search

The **EntityRecognitionSkill** is a **built-in cognitive skill** in Azure AI Search that detects and categorizes entities during indexing:

**Entity categories recognized:**

- **Location/Geographic** — countries, cities, landmarks
- **Person** — people's names
- **Organization** — companies, institutions
- **Quantity** — numbers, percentages
- **DateTime** — dates, times
- **URL** — web addresses
- **Email** — email addresses

```json
{
	"@odata.type": "#Microsoft.Skills.Text.V3.EntityRecognitionSkill",
	"context": "/document/content",
	"categories": ["Location"],
	"inputs": [{ "name": "text", "source": "/document/content" }],
	"outputs": [{ "name": "locations", "targetName": "extractedLocations" }]
}
```

> **Exam Key:** To extract **geographic locations** from documents during indexing → EntityRecognitionSkill with `categories: ["Location"]`. It's a built-in skill, not a custom skill.

### 5.10 Azure AI Search Custom Skills: WebApiSkill + Output Field Mappings

**WebApiSkill** (`#Microsoft.Skills.Custom.WebApiSkill`) lets you call an external API as part of the enrichment pipeline.

**Key facts:**

- **No predefined inputs or outputs** — you define them based on your API
- Only supports **HTTPS** endpoints
- HTTP methods: PUT or POST
- API must return JSON with `values` array containing `recordId`, `data`, `errors`, `warnings`

**Output Field Mappings are REQUIRED** for custom skill outputs:

- Custom skills generate enrichments in memory
- Without `outputFieldMappings`, the enriched data **will not** appear in the search index
- Defined in the **indexer** definition (not in the skillset)

```json
{
	"name": "myIndexer",
	"skillsetName": "mySkillset",
	"outputFieldMappings": [
		{
			"sourceFieldName": "/document/content/myCustomOutput",
			"targetFieldName": "customField"
		}
	]
}
```

> **Exam Key:** Output field mappings are required when you use a skillset. They map enrichment nodes in memory to fields in the search index. Built-in skills also need them. `fieldMappings` map source→index (pre-enrichment); `outputFieldMappings` map enrichment→index (post-enrichment).

---

## 6. Exam Traps & Gotchas

### Custom Vision Traps

1. **Two resources required** — Training and Prediction are separate. Don't confuse their keys.
2. **Publishing ≠ Training** — Training creates an iteration; you must explicitly **publish** it to make it available for prediction.
3. **Compact domain required for export** — Cannot export non-compact models. Must convert domain and **retrain**.
4. **publish_iteration needs prediction resource ID** — Not the prediction key, the full Azure resource ID.
5. **mAP is for object detection** — Classification shows per-tag precision/recall; mAP is the mean of AP across all tags in detection.

### Speech Translation Traps

6. **speech_recognition_language is a PROPERTY** (set with `=`), **add_target_language is a METHOD** (called with `()`).
7. **speech_synthesis_language** is for TTS output voice, NOT for translation target selection.
8. **TranslationRecognizer** (not SpeechRecognizer) is used with SpeechTranslationConfig.

### NLP/Language Traps

9. **Machine-learned entities** need labeled training data; **regex/list** entities are defined declaratively.
10. **Entity Linking** returns Wikipedia URLs; **Entity Recognition** returns category labels. They are different operations.
11. **Custom NER** extracts entities; **Custom Text Classification** classifies whole documents. Don't confuse them.
12. **TextAnalytics kind** is case-sensitive: `"TextAnalytics"` not `"textanalytics"` or `"Language"`.

### Translator Traps

13. **api-nam** = Americas, **api-eur** = Europe, **api-apc** = Asia Pacific. The global endpoint does NOT guarantee data residency.
14. The translate endpoint path: `/translate?api-version=3.0&to=en` — the `to` parameter specifies target language.

### AI Search Traps

15. **outputFieldMappings** are in the **indexer**, not the skillset. They are REQUIRED for enrichment outputs to reach the index.
16. **fieldMappings** = source document → index (before enrichment). **outputFieldMappings** = enrichment → index (after enrichment).
17. **WebApiSkill** only supports HTTPS (not HTTP). Must return the correct JSON contract with `values`, `recordId`, `data`, `errors`, `warnings`.
18. **EntityRecognitionSkill** is a built-in skill with the `categories` parameter to filter entity types. Using `["Location"]` extracts only geographic entities.

---

## 7. Quick-Reference Decision Table

| Scenario                                 | Service/Feature                                 |
| ---------------------------------------- | ----------------------------------------------- |
| Classify images into categories          | Custom Vision (Classification)                  |
| Detect objects with bounding boxes       | Custom Vision (Object Detection)                |
| Run model on mobile/edge device          | Custom Vision Export (compact domain)           |
| Translate speech in real-time            | SpeechTranslationConfig + TranslationRecognizer |
| Extract billing addresses from text      | CLU with machine-learned entities               |
| Ensure translation data stays in US      | Translator `api-nam` endpoint                   |
| Create TextAnalytics resource via ARM    | kind="TextAnalytics", SKU S0, location "eastus" |
| Phone bot: listen to caller              | SpeechRecognizer (STT)                          |
| Phone bot: speak response                | SpeechSynthesizer (TTS)                         |
| Disambiguate "Mars" (planet vs company)  | Entity Linking (returns Wikipedia URL)          |
| Extract text from PDF                    | Azure AI Vision (Read/OCR API)                  |
| Analyze sentiment of extracted text      | Azure AI Language (Sentiment Analysis)          |
| Recognize internal product codenames     | Custom NER                                      |
| Extract locations during search indexing | EntityRecognitionSkill (built-in)               |
| Call external API during indexing        | WebApiSkill (custom skill)                      |
| Route enrichment output to index field   | outputFieldMappings (in indexer)                |

---

_Session prepared: 2026-05-20 | Day 15 of AI-102 Prep_
