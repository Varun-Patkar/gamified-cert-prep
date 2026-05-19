# Day 14: Custom Vision Models (Classification vs Detection, Labeling Quality, Metrics)

**Date**: 2026-05-19
**Domain**: Domain 4 — Implement computer vision solutions (15–20%)
**Subtopics**: Classification vs detection, labeling quality, metrics
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)

- **Custom Vision** = two project types: **Image Classification** (multiclass or multilabel) and **Object Detection** (bounding boxes)
- **Multiclass** = exactly one tag per image; **Multilabel** = zero or more tags per image
- Minimum images per tag: **5** for classification, **15** for object detection (but **50+ recommended** for both)
- Metrics: **Precision** (of predicted positives, how many correct), **Recall** (of actual positives, how many found), **mAP** (object detection)
- **Compact domains** required for export (ONNX, TensorFlow, CoreML, Docker); standard domains stay cloud-only
- **Probability Threshold** slider adjusts precision/recall tradeoff; **Overlap Threshold** (detection only) sets IoU bar
- Service is **retiring 9/25/2028** — migration to Azure ML AutoML or Foundry Models recommended
- Most quiz questions today are **cross-domain carryover** — review the refresher table below carefully

---

## Learning Objectives

After this session you should be able to:

1. Choose between classification and object detection for a given scenario
2. Select the appropriate domain (General, Food, Landmarks, Retail, Compact)
3. Explain precision, recall, mAP and how probability/overlap thresholds affect them
4. Apply labeling best practices for dataset quality
5. Export models using compact domains to ONNX, TensorFlow, CoreML, Docker
6. Recall key cross-domain concepts: CLU None intent, Translator API params, SSML role/style, Speech Translation config, Content Moderator API, key phrase extraction, QA migration

---

## Key Concepts

### Custom Vision Service Overview

Azure AI Custom Vision lets you build custom image recognition models without ML expertise. Two project types:

| Feature            | Image Classification                           | Object Detection                            |
| ------------------ | ---------------------------------------------- | ------------------------------------------- |
| **Purpose**        | Assign label(s) to entire image                | Locate + label objects with bounding boxes  |
| **Output**         | Tag + confidence score                         | Tag + confidence + bounding box coordinates |
| **Subtypes**       | Multiclass (one tag) or Multilabel (many tags) | N/A                                         |
| **Min images/tag** | 5 (50+ recommended)                            | 15 (50+ recommended)                        |
| **Metrics**        | Precision, Recall                              | Precision, Recall, mAP                      |

### Classification Types

- **Multiclass**: Every image is sorted into **exactly one** tag. Mutually exclusive categories (e.g., "cat" vs "dog").
- **Multilabel**: Image can have **zero or more** tags. Non-exclusive categories (e.g., image tagged "outdoor" AND "sunset" AND "mountain").

### Domains

**Classification domains**: General, General [A1], General [A2], Food, Landmarks, Retail, Compact  
**Object Detection domains**: General, General [A1], Logo, Products on Shelves, Compact

- **General [A2]** = best balance of accuracy and speed; recommended for most projects
- **General [A1]** = highest accuracy, needs more training time and data
- **Compact domains** = required for export; slightly less accurate than standard

### Training & Iterations

- Each training run creates a new **iteration** with its own performance metrics
- You can have up to **20 iterations** per project
- Must **publish** an iteration to make it available via the prediction endpoint
- Training types: Quick Training (default) or Advanced Training (set time budget)

### Performance Metrics

- **Precision** = fraction of predicted positives that were correct. "When I predict 'dog,' am I right?"
- **Recall** = fraction of actual positives correctly identified. "Of all real dogs, how many did I find?"
- **mAP (Mean Average Precision)** = area under precision/recall curve, averaged across all tags (object detection)
- **Probability Threshold** slider: higher → more precision, less recall; lower → more recall, less precision
- **Overlap Threshold** (detection only): minimum IoU between predicted and actual bounding box to count as correct

### Labeling Best Practices

- Use **varied images**: different angles, lighting, backgrounds, sizes, subjects
- Image formats: .jpg, .png, .bmp, .gif
- Max size: 6 MB (training), 4 MB (prediction); min 256px on shortest edge
- Max regions/image: 300 (training), 200 (prediction) for object detection
- Tag every instance of the object in detection — untagged background is used as negative example
- Balance your dataset: roughly equal images per tag
- Include **negative examples** (images without the object) to reduce false positives

### Export

- Only **compact domains** support export
- Export formats: ONNX, TensorFlow, TensorFlow.js, CoreML, VAIDK, Docker (Windows/Linux/ARM)
- To export from a non-compact project: change domain to compact → retrain → export
- Exported models may have slightly different results vs cloud prediction API

### Limits (Exam Favorites)

| Limit                           | F0 (Free) | S0 (Standard) |
| ------------------------------- | --------- | ------------- |
| Projects                        | 2         | 100           |
| Training images/project         | 5,000     | 100,000       |
| Tags/project                    | 50        | 500           |
| Iterations                      | 20        | 20            |
| Min images/tag (classification) | 5         | 5             |
| Min images/tag (detection)      | 15        | 15            |
| Predictions/month               | 10,000    | Unlimited     |

---

## Common Traps & Misconceptions

1. **"50 images" vs "5 images"**: Min is 5 (classification) / 15 (detection), but 50+ is **recommended**. The exam may test the minimum vs recommended distinction.
2. **Export requires compact domain**: You CANNOT export a standard-domain model. Must switch to compact, retrain, then export.
3. **Multiclass vs Multilabel confusion**: Multiclass = one label per image (mutually exclusive); Multilabel = multiple labels per image.
4. **Probability threshold tradeoff**: Higher threshold = higher precision but lower recall. The exam loves to test which direction each metric moves.
5. **mAP is for object detection only**: Classification uses precision + recall per tag; detection adds mAP.
6. **Service retirement**: Custom Vision retires 9/25/2028. Migration paths: Azure ML AutoML or Foundry Models. Exam may still test it.

---

## Quick Reference Card

| Concept                  | Key Fact                                                 |
| ------------------------ | -------------------------------------------------------- |
| Project types            | Classification (multiclass/multilabel), Object Detection |
| Min images/tag           | 5 (classification), 15 (detection), 50+ recommended      |
| Max tags                 | 50 (F0), 500 (S0)                                        |
| Export formats           | ONNX, TensorFlow, TF.js, CoreML, VAIDK, Docker           |
| Export requirement       | Compact domain only                                      |
| Image size limits        | 6 MB train, 4 MB predict, min 256px                      |
| Iterations max           | 20                                                       |
| Metrics (classification) | Precision, Recall per tag                                |
| Metrics (detection)      | Precision, Recall, mAP                                   |
| Thresholds               | Probability (both), Overlap/IoU (detection only)         |

---

## Cross-Domain Quiz Question Refreshers

These concepts come from earlier domains but appear in today's quiz. Study them carefully.

| #   | Concept                                           | Key Fact                                                                                                                                                 | Trap                                                                                                                    |
| --- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | **CLU/LUIS None intent**                          | Add examples to None intent to reduce false positives. None intent catches out-of-scope utterances.                                                      | Don't confuse with "add more examples to the primary intent" — that won't help false positives from other domains       |
| 2   | **Multi-service resource (Azure AI Services)**    | Single endpoint + key for all services (Language, Decision, Speech, Vision). Formerly "Cognitive Services."                                              | Answer is "Azure Cognitive Services" (now Azure AI Services), NOT individual service resources                          |
| 3   | **Accessing Cognitive Services from App Service** | Use **endpoint URI + subscription key** (minimizes admin effort). Managed identity is more secure but NOT minimal effort.                                | "Minimize admin effort" → key-based auth. Don't pick managed identity or OAuth for "minimize effort"                    |
| 4   | **Key Phrase Extraction**                         | `get_key_phrases()` method returns a list of key phrases from text. For "the cat sat on the mat" → returns key phrases (e.g., "cat", "mat").             | YNN pattern in hotspot. Method returns `KeyPhraseResult` with `.key_phrases` list. No sentiment, no entities.           |
| 5   | **Translator API parameters**                     | `to=el` (Greek), `textType=html` (webpage), `toScript=Latn` (Roman/Latin transliteration).                                                               | `from` is optional (autodetect). `toScript=Cyrl` is Cyrillic, NOT Latin. `textType` default is "plain".                 |
| 6   | **LUIS/CLU Patterns**                             | Patterns improve intent recognition for structured queries. Create a pattern in the intent to match phrase templates like "Find contacts in {Location}". | Pattern features work for **intent recognition**, not entity extraction alone                                           |
| 7   | **Question Answering Migration**                  | Export from original → Import to new instance → Train & Publish on new instance. Three steps in order.                                                   | Can't train before import. Can't import before export. Order matters!                                                   |
| 8   | **Content Moderator API**                         | Text moderation: Resource name in URL, `/classify` endpoint, `Ocp-Apim-Subscription-Key` header.                                                         | Not `/screen` — "classify" is the endpoint for aggressive/sexually explicit detection. Header is Ocp-Apim (not Ocp-Api) |
| 9   | **SSML role & style**                             | `role="YoungAdultFemale"` imitates age/gender. `style="calm"` sets emotional tone. Role in `<mstts:express-as>` tag.                                     | Role = who the voice **sounds like** (age/gender); Style = **how** they speak (emotion). Don't swap them.               |
| 10  | **Speech Translation Config (C#)**                | `SpeechRecognitionLanguage` = source language; `AddTargetLanguage()` = target language(s).                                                               | Don't confuse with `SpeechSynthesisLanguage`. Recognition = input; Target = output translation.                         |

### Deep Dive on Cross-Domain Concepts

**Translator API — Full URL construction:**

```
https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&textType=html&to=el&toScript=Latn
```

- `textType=html` — content is a webpage (HTML), not plain text
- `to=el` — target language is Greek
- `toScript=Latn` — transliterate the result into Latin/Roman alphabet
- `from` parameter is optional (autodetect works)

**SSML Role + Style example:**

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
  <voice name="zh-CN-XiaomoNeural">
    <mstts:express-as role="YoungAdultFemale" style="calm">
      This text is spoken calmly by a young adult female voice.
    </mstts:express-as>
  </voice>
</speak>
```

- **role** attribute: Girl, Boy, YoungAdultFemale, YoungAdultMale, OlderAdultFemale, OlderAdultMale, SeniorFemale, SeniorMale
- **style** attribute: calm, cheerful, sad, angry, empathetic, newscast, etc.
- **styledegree**: 0.01–2 (1 = default intensity)

**SpeechTranslationConfig (C#):**

```csharp
var config = SpeechTranslationConfig.FromSubscription(key, region);
config.SpeechRecognitionLanguage = "en-US";    // source = English
config.AddTargetLanguage("de");                 // target = German
```

**Question Answering Migration (3 steps):**

1. From **original** instance → Export existing project (downloads JSON/TSV)
2. From **new** instance → Import the project file
3. From **new** instance → Train and publish the model

---

## Related Questions in questions.json

| Question ID          | One-line Summary                                                               |
| -------------------- | ------------------------------------------------------------------------------ |
| hixcyvPa00DL9qGYknuw | CLU: Add examples to None intent to reduce false positives                     |
| jFRokSSXCA07suV24Gix | Multi-service resource: endpoint URI + subscription key (min effort)           |
| k5BQihvhdxhwndsQCqYm | HOTSPOT: Key phrase extraction — get_key_phrases, YNN pattern                  |
| l6biv6GqIn44j40xaxt7 | Translator API: textType=html, to=el, toScript=Latn                            |
| lKgElUvJhfuCZCbui43E | LUIS patterns: create pattern in FindContact intent → Yes                      |
| n3fop6UgeJJoOhMCZ4MY | DRAG DROP: QA migration — Export → Import → Train & Publish                    |
| nKrYvpGAAJeo9BLTOcJo | HOTSPOT: Content Moderator — Resource name, classify, Ocp-Apim key             |
| p00Kw9dYaSXJJ7xvBQWK | Provisioning: Azure Cognitive Services (multi-service) for Decision + Language |
| pOzZ9dbpzU00CIH9hExI | HOTSPOT: SSML — role (YoungAdultFemale) + style (calm)                         |
| rimX5dDUEyCAFpz5iHo2 | DRAG DROP: SpeechRecognitionLanguage (source) + AddTargetLanguage (target)     |

Quiz command:

```powershell
python quiz_runner.py questions.json --day-lock 14 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [What is Custom Vision?](https://learn.microsoft.com/en-us/azure/ai-services/custom-vision-service/overview)
- [Build a classifier (Custom Vision)](https://learn.microsoft.com/en-us/azure/ai-services/custom-vision-service/getting-started-build-a-classifier)
- [Build an object detector (Custom Vision)](https://learn.microsoft.com/en-us/azure/ai-services/custom-vision-service/get-started-build-detector)
- [Select a domain (Custom Vision)](https://learn.microsoft.com/en-us/azure/ai-services/custom-vision-service/select-domain)
- [Export your model (Custom Vision)](https://learn.microsoft.com/en-us/azure/ai-services/custom-vision-service/export-your-model)
- [Limits and quotas (Custom Vision)](https://learn.microsoft.com/en-us/azure/ai-services/custom-vision-service/limits-and-quotas)
- [CLU None intent](https://learn.microsoft.com/en-us/azure/ai-services/language-service/conversational-language-understanding/concepts/none-intent)
- [SSML voice, style, and role](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice)
- [Translator API v3.0 Translate reference](https://learn.microsoft.com/en-us/azure/ai-services/translator/reference/v3-0-translate)

---

## Notes (your own words — fill this in after studying)

_(Space for your notes after going through the material)_
