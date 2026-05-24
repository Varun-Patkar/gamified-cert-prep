# Day 19: Speech Solutions, Bot Framework SDK & NLP Integration

**Date**: 2026-05-24
**Domain**: Domain 5 – Implement natural language processing solutions (15–20%)
**Subtopics**: Speech STT/TTS, SSML, Custom Speech, keyword/intent recognition, Bot Framework SDK dialogs, state management, deployment, CLU/LUIS lifecycle, QnA Maker chitchat
**Estimated study time**: 1 hr

---

## TL;DR (60-second skim)

- **Bot Framework dialog types**: Prompt dialogs ask for input with built-in retry/validation (exam favorite). Waterfall dialogs define sequential steps. Component dialogs encapsulate reusable sets. Adaptive dialogs are for Composer only. QnAMakerDialog connects to a knowledge base.
- **State management**: UserState persists across conversations for one user; ConversationState persists across turns in one conversation. MemoryStorage is volatile (lost on restart). Use BlobStorage or CosmosDB for production.
- **Bot deployment**: `az bot prepare-deploy` → zip project → `az webapp deployment source config-zip` (now `az webapp deploy`). Resources needed: App Service Plan + App Service + Azure Bot.
- **CLU/LUIS lifecycle**: Create app → Define intents/entities → Add utterances → Train → Publish. CLU is the successor to LUIS. In JSON exports, entities are labeled with offset/length within utterances.
- **QnA Maker chitchat**: 5 personas — Professional, Friendly, Witty, Caring, Enthusiastic. Source file: `qna_chitchat_<persona>.tsv`. Professional = formal responses.
- **Speech services**: SpeechRecognizer (STT), SpeechSynthesizer (TTS), SSML for fine-tuning TTS output. Custom Speech for domain-specific accuracy. IntentRecognizer for speech + LUIS/CLU intent.
- **Azure Search OCR indexing**: Split data into virtual folders, create indexer per folder, increase search units, schedule same runtime execution.

---

## Learning Objectives

After this session you should be able to:
1. Select the correct Bot Framework dialog type for a given scenario
2. Distinguish UserState vs ConversationState and explain MemoryStorage limitations
3. Recall the CLI commands to deploy a bot to Azure App Service
4. Order the LUIS/CLU model build lifecycle steps correctly
5. Identify QnA Maker chitchat persona files by name
6. Read a CLU JSON export and identify entity representations
7. Explain STT/TTS, SSML structure, Custom Speech, and intent recognition
8. Design an Azure Search indexing strategy for scanned document OCR

---

## Key Concepts

### 1. Bot Framework SDK Dialog Types

The Bot Framework SDK v4 provides several dialog types. The exam loves testing which dialog to use in a given scenario.

| Dialog Type | Purpose | Key Characteristics |
|---|---|---|
| **Prompt** | Ask user for specific input | Built-in retry loop until valid input or cancel. Types: TextPrompt, NumberPrompt, DateTimePrompt, ConfirmPrompt, ChoicePrompt, AttachmentPrompt |
| **Waterfall** | Sequential multi-step flow | Defines a series of steps executed in order. Each step can call a prompt. Typically used inside a ComponentDialog |
| **Component** | Encapsulate a reusable dialog set | Container dialog with its own inner dialog set. When inner stack empties, component ends. Best for modular, reusable flows |
| **Adaptive** | Dynamic conversational flow | Used by **Bot Framework Composer** only. Not intended for SDK-first bots. Supports triggers, actions, and conditions |
| **QnAMakerDialog** | Query a QnA Maker knowledge base | Specialized dialog that automates access to QnA Maker. Supports follow-up prompts and active learning |
| **Skill** | Manage skill bots | Routes activities between parent bot and skill bot |
| **Action / Input** | Composer building blocks | Implementation details for Composer. Not used directly in SDK-first bots |

**Exam pattern**: "A bot must repeat a question until valid input is received" → **Prompt dialog** (not waterfall, not adaptive).

**Prompt retry behavior**: When a prompt receives invalid input, it automatically re-prompts the user. The retry continues until valid input is received or the dialog is canceled. You configure validation via a `PromptValidator` delegate.

### 2. Bot Framework Composer

Bot Framework Composer is a **visual authoring tool** for building bots using adaptive dialogs.

Key concepts for the exam:
- **Triggers**: Events that start a dialog flow (e.g., "Language Understanding intent recognized", "Unknown intent", "Greeting")
- **Actions**: Steps executed when a trigger fires (e.g., "Send a response", "Ask a question", "Set a property")
- **Language Understanding integration**: Composer can connect to LUIS/CLU. When a user utterance matches an intent, the corresponding trigger fires
- **Entity extraction**: In a Composer flow diagram, entities are identified from user utterances (e.g., "New York" as a `city` entity)

**Reading a Composer diagram**:
1. The trigger fires (e.g., "Language Understanding intent recognized")
2. Entities are extracted from the utterance
3. Actions execute in sequence

### 3. Bot Framework State Management

State is organized into **scoped buckets**:

| State Bucket | Scope | Key Pattern | Use Case |
|---|---|---|---|
| **UserState** | Per user, per channel, across all conversations | `{ChannelId}/users/{From.Id}` | User preferences, profile info, last conversation context |
| **ConversationState** | Per conversation, regardless of user | `{ChannelId}/conversations/{Conversation.Id}` | Current topic, which question was asked, dialog state |
| **PrivateConversationState** | Per user + per conversation | `{ChannelId}/conversations/{Conversation.Id}/users/{From.Id}` | Per-user data within a group chat |

**Storage layer options**:

| Storage | Persistence | Use Case |
|---|---|---|
| **MemoryStorage** | **Volatile — lost when bot restarts** | Local testing only. Data cleared on every restart |
| **Azure Blob Storage** | Persistent | Production — stores state as blobs |
| **Azure Cosmos DB (partitioned)** | Persistent | Production — NoSQL with partition keys |

**Critical exam facts about MemoryStorage**:
- Data exists only in-process memory
- When the bot runtime terminates, **all state is lost**
- The code *will* create and maintain state objects (UserProfile, ConversationData) in the underlying storage layer during runtime
- But those objects **will not persist** beyond the current runtime session
- This is the default for local development/testing

**State accessor pattern** (code flow):
1. Create state management objects: `new UserState(storage)`, `new ConversationState(storage)`
2. Create state property accessors: `userState.CreateProperty<UserProfile>("UserProfile")`
3. In turn handler: `accessor.GetAsync()` to read, `accessor.SetAsync()` to write
4. At end of turn: `userState.SaveChangesAsync()` / `conversationState.SaveChangesAsync()`

**Exam trap**: "Last write wins" — if two instances write to the same state, the last one overwrites.

### 4. Bot Deployment to Azure

The deployment workflow for a Bot Framework bot:

```
Step 1: az login
Step 2: az group create (resource group)
Step 3: Create identity (managed identity or app registration)
Step 4: Create App Service (ARM template)
Step 5: Create Azure Bot resource (ARM template)
Step 6: Update project config (appsettings.json / .env)
Step 7: az bot prepare-deploy --lang <language> --code-dir "."
Step 8: Zip project files
Step 9: az webapp deployment source config-zip --resource-group "<rg>" --name "<app-name>" --src "<zip-path>"
```

**Key CLI commands**:

| Command | Purpose |
|---|---|
| `az bot prepare-deploy` | Generates `.deployment` file in project root |
| `az webapp deployment source config-zip` | Deploys zipped bot code to App Service (Kudu zip push) |
| `az webapp deploy` | Newer alternative to config-zip |
| `az group create` | Create resource group |
| `az identity create` | Create user-assigned managed identity |

**HOTSPOT exam pattern**: Complete the deployment command:
- Box 1: `webapp` (it's `az webapp deployment source config-zip`)
- Box 2: `config-zip`

**Azure resources needed for a bot**:
- Azure subscription
- Resource group
- User-assigned managed identity (or app registration)
- App Service Plan
- App Service
- Azure Bot resource

### 5. CLU / LUIS Model Lifecycle

**LUIS** (Language Understanding Intelligent Service) — legacy, being retired.
**CLU** (Conversational Language Understanding) — successor, part of Azure Language service. Retiring March 2029, migrating to Foundry models.

**Build lifecycle (LUIS — exam still tests this heavily)**:

```
1. Add a new app (create LUIS app in portal)
2. Add intents and entities
3. Add example utterances (label training data)
4. Train the app
5. Publish the app (to prediction endpoint)
```

**Minimum workflow for exam drag-drop**: Add new app → Add example utterances → Train → Publish

**CLU lifecycle**:
- Option 1 (LLM-powered quick deploy): Define schema with intent descriptions → Deploy → Predict
- Option 2 (Custom ML model): Define schema → Label data → Train → Evaluate → Improve → Deploy → Predict

**CLU JSON export format**:

In a CLU exported JSON, entities are represented with:
- `category`: The entity type (e.g., `Weather.Historic`)
- `offset`: Character position where the entity starts in the utterance
- `length`: Number of characters the entity spans

Example: For utterance "What was the rainfall by month last year", if `Weather.Historic` has offset 30 and length 7, it represents "by month" (or similar substring based on the actual offset).

**Key difference**: In LUIS, entities use `startCharIndex` and `endCharIndex`. In CLU, entities use `offset` and `length`.

### 6. QnA Maker / Custom Question Answering

QnA Maker was retired March 2025, replaced by **Custom Question Answering** (part of Azure Language service). The exam still tests QnA Maker concepts.

**Chitchat personas** — 5 predefined personality options:

| Persona | File Name | Tone |
|---|---|---|
| **Professional** | `qna_chitchat_professional.tsv` | Formal, age-appropriate, business-like |
| **Friendly** | `qna_chitchat_friendly.tsv` | Warm, casual, approachable |
| **Witty** | `qna_chitchat_witty.tsv` | Playful, humorous, clever |
| **Caring** | `qna_chitchat_caring.tsv` | Sympathetic, gentle, supportive |
| **Enthusiastic** | `qna_chitchat_enthusiastic.tsv` | Upbeat, energetic, excited |

**Exam scenario**: "Users report responses lack formality for spurious questions" → Change chitchat to `qna_chitchat_professional.tsv` → Retrain → Republish → **Yes, this meets the goal**.

**Adding custom chitchat**: Add metadata key/value `Editorial: chitchat` to new Q&A pairs.

**Supported languages for chitchat**: Chinese, English, French, German, Italian, Japanese, Korean, Portuguese, Spanish.

### 7. Azure Speech Services (Plan Topic)

#### Speech-to-Text (STT)

| Mode | Description | SDK/API |
|---|---|---|
| **Real-time** | Streaming transcription from mic/file | Speech SDK, Speech CLI, REST (short audio) |
| **Fast transcription** | Synchronous, faster than real-time for files | REST API |
| **Batch transcription** | Async processing of large audio volumes | REST API, Speech CLI |

**Key SDK class**: `SpeechRecognizer` — instantiated with `SpeechConfig` and `AudioConfig`

```csharp
var config = SpeechConfig.FromSubscription(key, region);
var recognizer = new SpeechRecognizer(config);
var result = await recognizer.RecognizeOnceAsync();
```

**Custom Speech**: Train custom models with domain-specific vocabulary to improve accuracy. Uses text data (plain text / structured text) and/or audio data with reference transcriptions.

#### Text-to-Speech (TTS)

**Key SDK class**: `SpeechSynthesizer`

```csharp
var config = SpeechConfig.FromSubscription(key, region);
config.SpeechSynthesisVoiceName = "en-US-AvaMultilingualNeural";
var synthesizer = new SpeechSynthesizer(config);
await synthesizer.SpeakTextAsync("Hello world");
```

#### SSML (Speech Synthesis Markup Language)

XML-based markup for fine-tuning TTS output. Key elements:

| Element | Purpose | Example Attributes |
|---|---|---|
| `<speak>` | Root element | `version`, `xmlns`, `xml:lang` |
| `<voice>` | Select voice | `name` (required), `effect` |
| `<prosody>` | Adjust rate/pitch/volume | `rate`, `pitch`, `volume`, `contour` |
| `<break>` | Insert pause | `time` (ms/s), `strength` |
| `<emphasis>` | Word-level stress | `level` (reduced/none/moderate/strong) |
| `<mstts:express-as>` | Speaking style | `style`, `styledegree` (0.01–2), `role` |
| `<lang>` | Switch language | `xml:lang` |
| `<audio>` | Insert recorded audio | `src` (HTTPS URL required) |
| `<phoneme>` | Custom pronunciation | `alphabet`, `ph` |

**Basic SSML structure**:
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
    <voice name="en-US-AvaMultilingualNeural">
        <prosody rate="+30%" pitch="high">
            This text is spoken faster and higher.
        </prosody>
    </voice>
</speak>
```

**Prosody values**:
- `rate`: x-slow, slow, medium, default, fast, x-fast, or percentage (+30%), or multiplier (1.5)
- `pitch`: x-low, low, medium, default, high, x-high, or Hz (+80Hz), or semitones (-2st)
- `volume`: silent, x-soft, soft, medium, loud, x-loud, or 0.0–100.0, or percentage

**Exam trap**: SSML requires the `<speak>` root element with `version="1.0"` and proper namespace. The `<voice>` element is **required** inside `<speak>`.

#### Intent Recognition

The Speech SDK can combine STT + LUIS/CLU for **intent recognition** in a single step:

```csharp
var config = SpeechConfig.FromSubscription(speechKey, region);
var intentRecognizer = new IntentRecognizer(config);
var model = LanguageUnderstandingModel.FromAppId(luisAppId);
intentRecognizer.AddAllIntents(model);
var result = await intentRecognizer.RecognizeOnceAsync();
// result.IntentId contains the recognized intent
```

**Key class**: `IntentRecognizer` (not `SpeechRecognizer`) — this is the combined speech+intent class.

#### Keyword Recognition

Keyword recognition enables wake-word detection (e.g., "Hey Cortana"):
- Create a keyword model in Speech Studio
- Use `KeywordRecognizer` or `SpeechRecognizer.RecognizeKeywordAsync()`
- The model file is a `.table` file
- Keyword recognition runs **on-device** (no cloud calls until keyword detected)

#### Speech Translation

- **Key class**: `TranslationRecognizer` (not `SpeechRecognizer`)
- Source language: `SpeechRecognitionLanguage` property
- Target languages: `AddTargetLanguage()` — **exclude the source language**

---

## Comparisons (X vs Y)

### Dialog Types: Prompt vs Waterfall vs Component

| Aspect | Prompt | Waterfall | Component |
|---|---|---|---|
| Scope | Single input collection | Multi-step sequence | Encapsulation container |
| Retry | Built-in auto-retry on invalid input | No built-in retry | Delegates to inner dialogs |
| Typical use | "Enter your date of departure" | "Book a flight" (multi-step) | Reusable booking module |
| Used alone? | Usually inside waterfall/component | Usually inside component | Yes, standalone or nested |

### LUIS vs CLU

| Aspect | LUIS | CLU |
|---|---|---|
| Service | Standalone Cognitive Service | Part of Azure Language service |
| Portal | luis.ai | Language Studio / Foundry portal |
| Entity format (JSON) | `startCharIndex` / `endCharIndex` | `offset` / `length` |
| Status | Being retired | Active (retiring 2029, moving to Foundry) |
| Build steps | Create app → Intents → Utterances → Train → Publish | Define schema → Label → Train → Evaluate → Deploy |

### State Storage Options

| Storage | Volatile? | Production-ready? | Notes |
|---|---|---|---|
| MemoryStorage | Yes — lost on restart | No — testing only | In-process, single instance |
| BlobStorage | No | Yes | Azure Blob Storage |
| CosmosDB Partitioned | No | Yes | Requires manual DB creation; container auto-created |

---

## Important Details for Exam

- **Prompt dialog** = the answer when the question says "repeat until valid input" or "retry until valid"
- **QnAMakerDialog** = the answer when asked "which dialog class to query a knowledge base"
- **MemoryStorage** data is cleared when the bot restarts — it's **volatile and temporary**
- **UserState** persists across conversations for the same user on the same channel
- **ConversationState** persists across turns within one conversation
- Bot deployment uses `az webapp deployment source config-zip` (key = `webapp` + `config-zip`)
- LUIS build order: **Create app → Add utterances → Train → Publish** (4 steps, this exact order)
- Chitchat file naming: `qna_chitchat_professional.tsv` — the `.tsv` extension matters
- SSML `<speak>` must have `version="1.0"` and `xml:lang` attributes
- `IntentRecognizer` combines speech recognition + intent detection in one call
- `TranslationRecognizer` is for speech translation (not `SpeechRecognizer`)
- Custom Speech improves domain-specific STT accuracy with text/audio training data
- Keyword recognition model = `.table` file, runs on-device
- Bot Framework Composer uses adaptive dialogs — NOT for SDK-first development
- `az bot prepare-deploy` creates a `.deployment` file — run it before zipping

---

## Common Traps & Misconceptions

1. **"Input dialog" vs "Prompt dialog"**: Input dialogs are Composer-specific. In SDK-first bots, the answer is always **Prompt**. The exam uses "prompt" not "input" for SDK scenarios.

2. **MemoryStorage persists data?**: The code creates and maintains objects in memory during runtime — **Yes**. But data survives a restart — **No**. The exam tests both statements.

3. **Waterfall vs Prompt for retry**: A waterfall dialog defines sequential steps but doesn't auto-retry. A prompt dialog has built-in retry. If the question says "repeat until valid," it's a prompt.

4. **`az webapp deploy` vs `az webapp deployment source config-zip`**: Both work, but the exam question images typically show the older `config-zip` syntax. Look for "webapp" + "config-zip" as the two boxes.

5. **LUIS build order — "Add prebuilt domain" vs "Add utterances"**: Some LUIS questions use "Add prebuilt domain ToDo" instead of "Add example utterances." Both are valid step 2 alternatives. The core order remains: Create → Add data → Train → Publish.

6. **CLU entity JSON — "offset" vs "startCharIndex"**: CLU uses `offset` + `length`. LUIS uses `startCharIndex` + `endCharIndex`. If the question shows JSON with `offset`, it's CLU format.

7. **Chitchat "Professional" vs "Friendly"**: Professional = formal. If users want "formal responses," the answer is Professional (`qna_chitchat_professional.tsv`), not Friendly.

8. **QnAMakerDialog vs AdaptiveDialog**: QnAMakerDialog is a dedicated dialog class specifically for knowledge base queries. AdaptiveDialog is a general-purpose container for Composer.

9. **SpeechRecognizer vs IntentRecognizer vs TranslationRecognizer**: Three different classes for three different purposes. The exam tests whether you pick the right one.

---

## Cross-Domain Quiz Question Refreshers

| Concept | Key Fact | Trap |
|---|---|---|
| **Azure Cognitive Search — OCR indexing for scanned docs** (Topic 4) | Split data into virtual folders → Create indexer per folder → Increase search units → Schedule same runtime execution | Don't split into separate Search services (expensive, unnecessary). Use virtual folders, not blob containers. The key word is "virtual folders" — not new services or new containers. |
| **AI Search indexer parallelism** | Multiple indexers can run simultaneously when search units are increased | Each indexer handles one data source; more indexers + more search units = faster indexing |
| **AI enrichment skillset** | Built-in OCR skill extracts text from images/PDFs; results feed into search index | OCR skill is part of the AI enrichment pipeline, not a separate service |

---

## Quick Reference Card

### Bot Dialog Decision Tree
```
Need to ask user for one piece of input with retry? → Prompt
Need multi-step sequential flow? → Waterfall (inside Component)
Need reusable dialog module? → Component
Need to query a QnA knowledge base? → QnAMakerDialog
Building in Composer? → Adaptive
```

### State Management Quick Ref
```
UserState     = per user, across conversations
ConversationState = per conversation, all users
MemoryStorage = testing only, volatile
BlobStorage   = production, persistent
CosmosDB      = production, persistent, partitioned
```

### LUIS Build Order
```
1. Create new app
2. Add intents/entities/utterances
3. Train
4. Publish
```

### SSML Element Hierarchy
```
<speak>           ← root (required)
  <voice>         ← voice selection (required)
    <prosody>     ← rate, pitch, volume
    <break>       ← pause
    <emphasis>    ← word stress
    <mstts:express-as>  ← speaking style
    <lang>        ← language switch
    <audio>       ← insert audio file
```

### Speech SDK Classes
```
SpeechRecognizer      → STT only
SpeechSynthesizer     → TTS only
IntentRecognizer      → STT + intent (LUIS/CLU)
TranslationRecognizer → STT + translation
KeywordRecognizer     → Wake word detection
```

---

## Related Questions in questions.json

| ID | Summary |
|---|---|
| xyXJ5vbNduBnstJp4X1o | Azure Search OCR indexing — virtual folders strategy |
| 0M5PUKWLHAhYbHt85jpV | Bot dialog type — prompt for travel destination retry |
| 19SuosyKaYI0KCnbj4Qe | HOTSPOT — Composer trigger/action flow from diagram |
| 3u0Lt2unUlTbrMRxGdRQ | HOTSPOT — UserState/ConversationState with MemoryStorage |
| 43E19U5nxXX86VTG5oh9 | HOTSPOT — Bot deployment CLI (webapp + config-zip) |
| 5DxcrhiYuSg2Oy5b5dEj | Bot dialog type — prompt for flight departure date |
| 5g7KxKmBySFvImPPTfsi | Dialog class — QnAMakerDialog for knowledge base |
| 6HN37pZtROQh3f6AKP2L | DRAG DROP — LUIS model build workflow ordering |
| AFvclpbOQPqtWjA9XAeW | QnA Maker chitchat — professional persona |
| AhkBEn8Ln1AnWFHPkYYk | CLU model JSON — Weather.Historic entity representation |

Quiz command:

```powershell
python quiz_runner.py questions.json --day-lock 19 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [Dialogs library – Bot Framework SDK](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-concept-dialog?view=azure-bot-service-4.0)
- [Managing state – Bot Framework SDK](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-concept-state?view=azure-bot-service-4.0)
- [Provision and publish a bot](https://learn.microsoft.com/en-us/azure/bot-service/provision-and-publish-a-bot?view=azure-bot-service-4.0&tabs=userassigned%2Ccsharp)
- [What is CLU?](https://learn.microsoft.com/en-us/azure/ai-services/language-service/conversational-language-understanding/overview)
- [Use chitchat with a project (QnA)](https://learn.microsoft.com/en-us/azure/ai-services/language-service/question-answering/how-to/chit-chat)
- [What is speech to text?](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-to-text)
- [SSML overview](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup)
- [SSML voice and sound](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice)
- [Azure Speech overview](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview)

---

## Notes (your own words — fill this in after studying)

_(Space for your personal notes after reading through the material)_
