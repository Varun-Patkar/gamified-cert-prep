# Day 12: Agent Framework Refresher — Azure AI Services for Agentic Solutions
**Date**: 2026-05-17
**Domain**: Domain 3 — Implement an agentic solution (5–10%)
**Subtopics**: CLU active learning & entities, Speech SDK (translation, streaming MP3), Document Translation, Custom Neural Voice, QnA Maker KB creation, resource provisioning, Spatial Analysis
**Estimated study time**: 1 hr

---

## TL;DR (60-second skim)
- **Active learning in CLU/LUIS**: enabled by appending `log=true` to the prediction endpoint query — NOT speech priming or sentiment analysis
- **List entities** in CLU: use for known lookup values (airport codes/names) to minimize training utterances — not Pattern.any, not regex, not ML
- **TranslationRecognizer** (not SpeechRecognizer) for speech translation; target languages use ISO codes (`"fr"`, `"de"`, `"es"`), source uses locale (`"en-US"` / `"en-GB"`)
- **Streaming MP3 to Speech-to-Text**: `AudioStreamFormat.GetCompressedFormat()` → `PushAudioInputStream` → `SpeechRecognizer`
- **Custom Neural Voice profile**: upload a **consent statement recording** (.wav/.mp3 of voice talent consenting), NOT training data
- **QnA Maker KB from URLs**: use `CreateKbDTO` with `Urls` property (list of strings) + `client.Knowledgebase.CreateAsync()` — NOT `FileDTO`
- **Multi-service resource (Azure AI Services)**: single endpoint + single key for both Speech and Language APIs
- **Document Translation**: upload glossary to target (French) container → define translation spec → run async translation

---

## Learning Objectives
After this session you should be able to:
1. Configure CLU active learning and choose the correct entity component type for lookup values
2. Write Speech SDK code for translation (TranslationRecognizer) and streaming compressed audio (PushAudioInputStream)
3. Sequence batch Document Translation steps including glossary placement
4. Distinguish multi-service vs single-service Azure AI resource provisioning
5. Identify what to upload for a Custom Neural Voice talent profile vs training data
6. Create a QnA Maker knowledge base programmatically from URLs
7. Identify the correct Azure portal blade for finding service endpoints

---

## Key Concepts

### 1. CLU / Language Understanding — Active Learning
Active learning lets the system suggest utterances for review based on real user queries. To enable it:
- **Add `log=true`** to the prediction endpoint query string
- This logs user queries so the system can surface uncertain predictions for human review
- It is NOT enabled by `show-all-intents=true` (that just returns scores for all intents)
- It is NOT speech priming or sentiment analysis

### 2. CLU Entity Components
CLU entities have four component types:

| Component | When to Use | How It Works |
|-----------|------------|--------------|
| **Learned** | Context-dependent extraction | ML model trained from labeled utterances |
| **List** | Known, finite sets of values (airport codes, product names) | Exact text match against a defined synonym list; returns a normalized key |
| **Prebuilt** | Common types (numbers, dates, names) | Auto-detected, no training needed |
| **Regex** | Consistent patterns (phone numbers, IDs) | Regular expression matching |

**Exam trap**: When utterances contain **airport names AND airport codes** (known lookup values), use a **list entity** — it minimizes training utterances because you define the values once rather than labeling every occurrence. Pattern.any is for variable-length entities in patterns, not for lookup values.

### 3. Speech SDK — Translation
For translating speech from one language to multiple target languages:

```python
# Configuration
translation_config = speechsdk.translation.SpeechTranslationConfig(
    subscription=key, region=region)
translation_config.speech_recognition_language = "en-US"  # Source locale
translation_config.add_target_language("fr")  # Target: French
translation_config.add_target_language("de")  # Target: German
translation_config.add_target_language("es")  # Target: Spanish

# Audio input
audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)

# Recognizer — MUST be TranslationRecognizer
recognizer = speechsdk.translation.TranslationRecognizer(
    translation_config=translation_config,
    audio_config=audio_config)
```

**Critical distinctions**:
| Property | Value Format | Example |
|----------|-------------|---------|
| `speech_recognition_language` (source) | Full locale | `"en-US"`, `"en-GB"` |
| `add_target_language` (target) | ISO language code | `"fr"`, `"de"`, `"es"` |

- Use **`TranslationRecognizer`** — NOT `SpeechRecognizer`, NOT `IntentRecognizer`, NOT `SpeechSynthesizer`
- Source language is NOT added as a target language
- For continuous recognition (e.g., lectures), use `start_continuous_recognition()` with event handlers

### 4. Speech SDK — Streaming Compressed Audio (MP3)
For streaming MP3 data to Speech-to-Text:

```python
# Step 1: Define the compressed audio format
stream_format = speechsdk.audio.AudioStreamFormat.get_compressed_format(
    speechsdk.AudioStreamContainerFormat.MP3)

# Step 2: Create PushAudioInputStream with the format
push_stream = speechsdk.audio.PushAudioInputStream(stream_format)

# Step 3: Create AudioConfig from the stream
audio_config = speechsdk.audio.AudioConfig(stream=push_stream)

# Step 4: Create SpeechRecognizer (NOT TranslationRecognizer for plain STT)
recognizer = speechsdk.SpeechRecognizer(
    speech_config=speech_config,
    audio_config=audio_config)
```

**Key facts**:
- `AudioStreamFormat` is used to specify the compressed format — this goes FIRST
- `SpeechRecognizer` is used for speech-to-text (not translation)
- Supported compressed formats: MP3, Opus, FLAC, MULAW, ALAW, OGG_OPUS
- For pull-based streaming, use `PullAudioInputStream` instead

### 5. Document Translation (Batch)
Translating Word/PowerPoint files from German to French with a custom glossary:

**Correct sequence**:
1. **Upload glossary file** to the **target** (French) container — the glossary defines term mappings
2. **Define a document translation specification** with French as target
3. **Execute asynchronous translation** using the specification

**Key details**:
- Preserves original formatting (Word .docx, PowerPoint .pptx supported natively)
- Glossary formats: CSV, TSV, XLIFF
- Requires Azure Blob Storage with source and target containers
- Glossary goes in the **target** container (debated in community — some say source; exam answer is target per consensus)
- The translation is **asynchronous** — you submit a job and poll for status

### 6. Resource Provisioning — Multi-Service vs Single-Service

| Scenario | Resource Type | Key Fact |
|----------|--------------|----------|
| Need Speech AND Language with **single endpoint/key** | **Azure AI Services** (multi-service) | One endpoint, one key for all included services |
| Need only Language | Azure AI Language (single-service) | Dedicated endpoint for Language only |
| Need only Speech | Azure AI Speech (single-service) | Dedicated endpoint for Speech only |

**Exam trap**: When the question says "single endpoint and credential" for multiple services → always pick **Azure AI Services** (formerly Cognitive Services multi-service resource, now called Foundry resource).

### 7. Custom Neural Voice
Two distinct steps that the exam tests separately:

| Step | What You Do | Where |
|------|------------|-------|
| **Create voice talent profile** | Upload a **consent statement recording** (.wav or .mp3 of the talent saying they consent to synthetic voice creation) | Speech Studio |
| **Train the voice model** | Upload training data (.zip of .wav files + transcripts) | Speech Studio |
| **Generate narration** | Use the trained custom voice via **Text-to-speech** API | Speech SDK / REST |

**Critical trap**: The voice talent PROFILE requires the **consent recording** — NOT training data, NOT a description recording, NOT a .flac file. The consent recording is the voice talent verbally agreeing to have their voice synthesized.

To create a Custom Neural Voice: **Speech Studio portal** → train → deploy
To generate narration: **Text-to-speech** service

### 8. QnA Maker — KB Creation from URLs
`CreateKbDTO` accepts data from three sources:
- **`Urls`**: list of strings — publicly accessible web page URLs to crawl for Q&A pairs
- **`QnaList`**: list of `QnADTO` objects — manually defined Q&A pairs
- **`Files`**: list of `FileDTO` objects — files with filename + public URI

**For creating KBs from URLs**, you need:
1. **`CreateKbDTO`** object with the `Urls` property set (NOT `FileDTO` — that's for uploaded files)
2. **`client.Knowledgebase.CreateAsync(createKbDto)`** to execute

> Note: QnA Maker is retired (Oct 2025). Successor is Custom Question Answering in Azure AI Language. Exam may still test QnA Maker SDK patterns.

### 9. Azure Portal — Finding the Endpoint URL
The **Keys and Endpoint** blade (under Resource Management) shows:
- Key 1 and Key 2 (subscription keys)
- The **endpoint URL** (REST interface URL)
- The region

NOT Identity (for managed identity), NOT Networking (for firewall rules), NOT Properties (for resource metadata).

### 10. Spatial Analysis — Video Monitoring
For monitoring a video stream to verify a user is alone (no collaboration):
- **Spatial Analysis in Azure AI Vision** — detects and counts people in video streams
- Runs on IoT Edge devices, analyzes camera feeds
- Operations: `personcountcrossing`, `personcount`, `persondistance`, `personzonecrossing`

**Why not other options?**
- Speech-to-text: can't detect visual collaboration
- Custom Vision object detection: requires significant training effort (high dev effort)
- Spatial Analysis is purpose-built for person detection in video with minimal effort

> Note: Spatial Analysis was retired March 2025 in some regions; exam may still test it. Successor capabilities are in Azure Content Understanding.

---

## Comparisons (X vs Y)

| Feature | SpeechRecognizer | TranslationRecognizer |
|---------|-----------------|----------------------|
| Purpose | Speech-to-text only | Speech-to-text + translation |
| Config class | `SpeechConfig` | `SpeechTranslationConfig` |
| Target languages | N/A | `add_target_language("fr")` |
| Output | `result.text` | `result.translations["fr"]` |

| Feature | `Urls` in CreateKbDTO | `Files` (FileDTO) |
|---------|----------------------|-------------------|
| Source | Public web URLs | File with name + URI |
| Use case | Crawl FAQ pages | Upload structured files (.tsv, .docx) |
| For URL-based KB | ✅ Use this | ❌ Not this |

| Resource | Azure AI Services | Azure AI Language |
|----------|------------------|-------------------|
| Services included | All (Speech, Language, Vision, etc.) | Language only |
| Single endpoint for multiple services | ✅ Yes | ❌ Only Language |
| When to pick | Need 2+ service types with one key | Only need Language |

---

## Common Traps & Misconceptions

1. **`log=true` vs `show-all-intents=true`**: Active learning = `log=true`. Show-all-intents just returns all intent scores — it doesn't enable learning.
2. **Voice talent PROFILE vs training DATA**: Profile = consent recording. Training = audio samples + transcripts. The question asks about the profile.
3. **Target language format**: Use `"fr"` not `"French"`, `"de"` not `"German"`. Source uses full locale like `"en-GB"`.
4. **Glossary container placement**: The glossary file goes in the **target** container (French), not the source (German).
5. **FileDTO vs Urls**: When creating a KB from URLs, use the `Urls` string list property directly — `FileDTO` is for file uploads with filenames.
6. **AudioStreamFormat vs SpeechRecognizer ordering**: First configure `AudioStreamFormat`, then create `PushAudioInputStream`, then `SpeechRecognizer`.
7. **Multi-service resource name**: Now called "Azure AI Services" or "Foundry resource" — the answer choice may say "Azure AI Services" (formerly Cognitive Services).
8. **Custom Neural Voice creation**: Use **Speech Studio portal** to create/train; use **Text-to-speech** to generate narration. Not Azure portal, not Bot Framework.

---

## Quick Reference Card

| Concept | Key Fact |
|---------|----------|
| Enable active learning | `log=true` on prediction endpoint |
| Airport codes entity type | List entity (lookup values) |
| Speech translation recognizer | `TranslationRecognizer` |
| Translation target language format | ISO: `"fr"`, `"de"`, `"es"` |
| Translation source language format | Locale: `"en-US"`, `"en-GB"` |
| Streaming MP3 order | `AudioStreamFormat` → `PushAudioInputStream` → `SpeechRecognizer` |
| Compressed format method | `AudioStreamFormat.get_compressed_format(MP3)` |
| Voice talent profile upload | Consent statement recording (.wav/.mp3) |
| Custom Neural Voice creation tool | Speech Studio portal |
| Custom Neural Voice narration service | Text-to-speech |
| KB from URLs | `CreateKbDTO.Urls` + `CreateAsync` |
| KB from files | `FileDTO` (not for URL-based creation) |
| Multi-service single endpoint | Azure AI Services resource |
| Find endpoint URL in portal | Keys and Endpoint blade |
| Document Translation glossary location | Target language container |
| Person detection in video | Spatial Analysis (Azure AI Vision) |

---

## Related Questions in questions.json

| ID | Summary |
|----|---------|
| S97WPPZCW5GDdXus0OwQ | CLU active learning — `log=true` |
| SkdajNLBgXGawPLCy4Bj | HOTSPOT: Speech SDK translation en-GB lecture transcription |
| UR9i2oGHAMwESr4thHvy | DRAG DROP: Document Translation German→French with glossary |
| URfg207EIaavs2iJWBd4 | Multi-service resource for Speech + Language |
| URg3iik67Pte9LNkEHhu | CLU list entity for airport names/codes |
| UmzikKIYg708CGlhsBLy | Keys and Endpoint blade for REST URL |
| VMHYZXsnql9NJTG2Vixd | Voice talent profile — consent recording |
| VZ1ENZCeIG39OkRnhLeL | QnA Maker KB from URLs — CreateKbDTO + CreateAsync |
| X3C2GHY19fpNu3kwMWZ1 | HOTSPOT: Custom Neural Voice — Speech Studio + TTS |
| XJWvfBfjWXm5WiEIJj7g | HOTSPOT: Speech translation en→fr/de/es — TranslationRecognizer |
| XVXLKy70MTcoDjhA2IfF | Spatial Analysis for person detection in video |
| XzR2ZH21uV0QLk0q1Skf | HOTSPOT: Streaming MP3 STT — AudioStreamFormat + SpeechRecognizer |

Quiz command:
```powershell
python quiz_runner.py questions.json --day-lock 12 --shuffle --web --port 8765
```

---

## Sources (verified during this session)
- [CLU — Label utterances](https://learn.microsoft.com/en-us/azure/ai-services/language-service/conversational-language-understanding/how-to/tag-utterances)
- [CLU — Entity components (learned, list, prebuilt, regex)](https://learn.microsoft.com/en-us/azure/ai-services/language-service/conversational-language-understanding/concepts/entity-components)
- [Document Translation overview](https://learn.microsoft.com/en-us/azure/ai-services/translator/document-translation/overview)
- [Custom Neural Voice — Train voice model](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/professional-voice-train-voice)
- [Speech SDK — Compressed audio input streams](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-use-codec-compressed-audio-input-streams)
- [Speech translation quickstart](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-speech-translation)
- [QnA Maker SDK quickstart (retired)](https://learn.microsoft.com/en-us/previous-versions/azure/ai-services/qnamaker/quickstarts/quickstart-sdk)
- [Create a Foundry resource (multi-service)](https://learn.microsoft.com/en-us/azure/ai-services/multi-service-resource)
- [Spatial Analysis / Content Understanding video](https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/video/overview)

---

## Notes (your own words — fill this in after studying)
_(Space for your own notes after going through the material)_
