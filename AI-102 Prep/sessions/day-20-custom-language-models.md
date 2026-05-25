# Day 20: Custom Language Models & Bot Framework Conversational AI

**Date**: 2026-05-25
**Domain**: Domain 5 — Implement NLP solutions (15–20%)
**Subtopics**: CLU intents/entities/utterances lifecycle; Bot Framework SDK (dialogs, state, LG, deployment, channels)
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)

- **CLU lifecycle**: Define schema (intents + entities) → Label utterances → Train → Evaluate → Deploy → Predict via runtime API. Two paths: LLM-powered quick deploy (no labeling) vs custom ML model (requires labeled data).
- **Bot Framework state**: `UserState` persists across conversations for a user; `ConversationState` persists within one conversation. Memory storage is **volatile** (lost on restart). Use `SaveChangesAsync()` to persist.
- **Waterfall dialogs** = linear step-by-step data collection. Each step is an async function receiving a `WaterfallStepContext`.
- **Language Generation (.lg)**: `# TemplateName` defines a template; `${expression}` evaluates expressions; `${user.name}` reads from user object memory (NOT a prompt).
- **Direct Line Speech** = the channel for voice bots with **custom client apps** (not Teams, not Cortana).
- **Bot deployment resources**: Azure Bot + App Service + App Service Plan + Identity (managed identity or app registration).
- **Dialog triggers** handle interruptions (cancellation, help requests) with minimal effort.
- **Question Answering**: When a question phrasing fails, add **alternate question phrasings** — don't create entities.

---

## Learning Objectives

After this session you should be able to:

1. Describe the CLU project development lifecycle (schema → label → train → evaluate → deploy → predict)
2. Differentiate UserState vs ConversationState vs PrivateConversationState
3. Explain when to use waterfall dialogs vs adaptive dialogs
4. Read and write .lg template syntax correctly
5. Choose Direct Line Speech for multi-client voice scenarios
6. List the Azure resources needed to deploy a bot
7. Understand dialog triggers for interruption handling
8. Know when to use alternate phrasings vs entities in Question Answering

---

## Key Concepts

### 1. CLU — Conversational Language Understanding

CLU is the successor to LUIS. It lets you build custom NLU models to predict **intents** and extract **entities** from user utterances.

**Core terminology:**
| Term | Definition |
|------|-----------|
| **Intent** | The action/goal the user wants (e.g., `BookFlight`, `GetWeather`) |
| **Entity** | Key information to extract (e.g., `destination`, `date`) |
| **Utterance** | Example user input labeled with intent + entities |

**Project development lifecycle (two paths):**

**Path 1 — LLM-powered quick deploy** (no labeled data needed):

1. Define schema: Create intents with **detailed descriptions** (the LLM uses these)
2. Deploy model with LLM-based training config
3. Predict intents + prebuilt entities

**Path 2 — Custom ML model** (requires labeled data):

1. **Define schema** — Create intents and entities
2. **Label utterances** — Quality of labels directly impacts model performance
3. **Train** — Model learns from labeled data
4. **Evaluate** — Review precision, recall, F1 per intent/entity
5. **Improve** — Add more/better utterances, rebalance classes
6. **Deploy** — Makes model available via Runtime API
7. **Predict** — Call the runtime endpoint with user text

**Exam-critical facts:**

- CLU is retiring March 31, 2029 (migrate to Foundry models)
- CLU does NOT perform actions — it only understands input
- Entity types: learned (ML), list, prebuilt, regex
- Multi-turn conversations supported via entity slot filling
- Orchestration workflow connects CLU with other skills (QA, custom skills)

### 2. Bot State Management

Bots are **inherently stateless** — each turn could be handled by a different instance. State management adds persistence.

**Three-layer architecture:**

```
Storage Layer → State Management (BotState) → State Property Accessors
```

**State buckets:**
| Bucket | Scope | Key pattern | Use case |
|--------|-------|-------------|----------|
| `UserState` | Per user, per channel, across conversations | `{ChannelId}/users/{From.Id}` | User preferences, name, past interactions |
| `ConversationState` | Per conversation, any user | `{ChannelId}/conversations/{Conversation.Id}` | Dialog position, current topic |
| `PrivateConversationState` | Per user + per conversation | `{ChannelId}/conversations/{ConvId}/users/{From.Id}` | Per-user data in group chats |

**Storage options:**
| Storage | Persistent? | Use case |
|---------|------------|----------|
| **MemoryStorage** | **NO** — lost on restart | Local testing only |
| **Azure Blob Storage** | Yes | Production (simple) |
| **Azure Cosmos DB** | Yes | Production (scalable, partitioned) |

**Critical code pattern:**

```csharp
// Create state property accessor
var userStateAccessors = _userState.CreateProperty<UserProfile>("UserProfile");

// Get value (with factory for first access)
var profile = await userStateAccessors.GetAsync(turnContext, () => new UserProfile());

// Set value
await userStateAccessors.SetAsync(turnContext, profile);

// MUST call SaveChangesAsync to persist!
await _userState.SaveChangesAsync(turnContext);
await _conversationState.SaveChangesAsync(turnContext);
```

**Exam trap**: `CreateProperty` creates an **accessor**, not the property itself. The property is created lazily on first `GetAsync` call with the factory method.

**Exam trap**: If you don't call `SaveChangesAsync()`, changes are only in the local cache and will be **lost** after the turn.

### 3. Waterfall Dialogs

A waterfall dialog is a **linear sequence of steps** for collecting information. Each step is an async function that:

1. Prompts the user for input (or begins a child dialog)
2. Waits for a response
3. Passes the result to the next step via `step.Result`

**When to use:**

- Structured data collection (dates, names, amounts)
- Linear workflows with minimal branching
- Forms-like interaction patterns

**Key properties of WaterfallStepContext:**

- `Options` — input passed when dialog started
- `Values` — dictionary for passing data between steps (persists across steps within same dialog)
- `Result` — return value from previous step's prompt

**Navigation methods:**
| Method | Effect |
|--------|--------|
| `BeginDialogAsync` | Push new dialog onto stack |
| `NextAsync` | Skip to next waterfall step in same turn |
| `EndDialogAsync` | Pop current dialog, return result to parent |
| `ReplaceDialogAsync` | Pop current, push replacement (looping) |
| `CancelAllDialogsAsync` | Clear entire dialog stack |

### 4. Language Generation (.lg files)

LG separates bot response text from code. Used primarily in **Bot Framework Composer**.

**Syntax rules:**
| Syntax | Meaning | Example |
|--------|---------|---------|
| `# TemplateName` | Defines a template | `# Greet(user)` |
| `- text` | One variation of a response | `- Hello there!` |
| `${expression}` | Evaluates an expression | `${user.name}` |
| `${TemplateName()}` | Calls another template | `${Greeting()}` |

**Example .lg file:**

```
# greetingTemplate
- Hello ${user.name}, how are you?
- Good morning ${user.name}. Nice to see you again.
- Good day ${user.name}. What can I do for you today?
```

**Exam trap**: `${user.name}` retrieves a value from the **user object in memory** — it is NOT a prompt asking for the user's name. It's property access, not input collection.

**Exam trap**: `${Greeting()}` calls another template named `Greeting`. The `()` indicates a template call. Without `()`, it would be a property reference.

### 5. Direct Line Speech

Direct Line Speech is a **channel** that enables real-time, bidirectional voice streaming between a bot and a client application.

**When to use Direct Line Speech:**

- You need **voice interactions** with your bot
- You're building **custom client applications** (not Teams, not Cortana)
- You want **multiple custom client apps** to connect via voice
- Low-latency voice I/O is required

**How it works:**

- Uses Azure Speech Services for STT/TTS
- WebSocket-based streaming for low latency
- Client uses Speech SDK to connect

**Exam trap**: If the question says "voice bot for multiple custom client applications," the answer is **Direct Line Speech** — NOT Cortana (deprecated), NOT Teams (single platform).

### 6. Bot Deployment to Azure

**Required Azure resources:**
| Resource | Purpose | Created how? |
|----------|---------|-------------|
| **Azure Bot** | Channel registration, messaging endpoint | ARM template / Portal |
| **App Service** | Hosts bot code | ARM template |
| **App Service Plan** | Compute for App Service | ARM template (or existing) |
| **Identity** (Managed Identity or App Registration) | Authentication | `az identity create` or Entra ID |

**Identity types (exam-relevant):**
| Type | Status | SDK support |
|------|--------|-------------|
| User-assigned managed identity | Recommended | C#, JS, Python |
| Single-tenant | Supported | C#, JS, Python |
| Multi-tenant | **Deprecated** (after July 31, 2025) | All languages |

**Deployment flow:**

1. `az login` → `az account set`
2. Create resource group
3. Create identity resource
4. Create App Service + App Service Plan (ARM template)
5. Create Azure Bot resource (ARM template)
6. Update bot configuration (appsettings.json / .env / config.py)
7. `az bot prepare-deploy` → zip project → `az webapp deploy`

**Exam trap**: The question asks what resources you need AFTER creating the Azure Bot. You still need App Service + App Service Plan. Whether App Registration is auto-created or manual depends on how you provision — but the exam often expects you to select it as a required resource.

### 7. Bot Framework Composer — Dialog Design

Composer is a visual authoring tool for building bots using **adaptive dialogs**.

**Key concepts for exam:**

- **Properties**: `User.name`, `Conversation.topic` — scoped state variables
- **`coalesce()` function**: Returns the first non-null value. `coalesce(User.name, "Guest")` → returns `User.name` if set, otherwise `"Guest"`
- **Triggers**: Event handlers that fire on specific conditions
- **Actions**: Steps executed when a trigger fires

### 8. Dialog Triggers

Triggers define **how a bot responds to events** like messages, intents, or interruptions.

**Common trigger types:**
| Trigger | When it fires |
|---------|--------------|
| Intent recognized | LUIS/CLU recognizes an intent |
| Unknown intent | No intent matched |
| Dialog event | Dialog lifecycle (started, canceled) |
| Activity trigger | Activity type (message, conversationUpdate) |
| Custom event | Programmatically emitted events |

**Interruption handling**: Use a **dialog trigger** to handle cancellation requests mid-conversation. This lets users say "cancel" or "never mind" during any dialog, with **minimal implementation effort**.

**Exam trap**: When asked about handling cancellation "with minimal effort," the answer is a **dialog trigger** — not rewriting waterfall steps or adding middleware.

### 9. Question Answering — Alternate Phrasings

Custom Question Answering (CQA) returns answers from a knowledge base.

**Key fix for unmatched questions:**

- If "How much does X cost?" fails but "What is the price of X?" works → **add alternate question phrasings** to the QA pair
- Do NOT create entities — QA doesn't use intent/entity models
- Active learning suggests alternate phrasings from real user queries

**Exam trap**: The fix for unmatched variations is ALWAYS "add alternate phrasings" in the knowledge base — never "create entities" (that's CLU, not QA).

### 10. Conversation Expiration Pattern

When a bot conversation times out or expires:

1. **`send_activity`** — Notify the user their session has expired
2. **`clear_state`** — Reset conversation state for a fresh start

This is a standard pattern for session timeout handling in production bots.

---

## Comparisons (X vs Y)

| Feature       | Waterfall Dialog       | Adaptive Dialog                |
| ------------- | ---------------------- | ------------------------------ |
| Flow          | Linear, step-by-step   | Flexible, event-driven         |
| Authoring     | Code (SDK)             | Composer (visual)              |
| Interruptions | Manual handling        | Built-in trigger system        |
| Best for      | Simple data collection | Complex, natural conversations |

| Feature                        | UserState                     | ConversationState              |
| ------------------------------ | ----------------------------- | ------------------------------ |
| Scope                          | Per user across conversations | Per conversation across users  |
| Persists across conversations? | Yes                           | No                             |
| Example                        | User name, preferences        | Dialog position, current topic |

| Feature     | CLU                                | Question Answering                   |
| ----------- | ---------------------------------- | ------------------------------------ |
| Purpose     | Intent + entity extraction         | FAQ-style Q&A from knowledge base    |
| Input       | User utterance → intent + entities | User question → best matching answer |
| Improvement | Add labeled utterances             | Add alternate phrasings              |
| Model type  | ML classification                  | Information retrieval + ranking      |

| Channel            | Voice?    | Custom clients? | Best for          |
| ------------------ | --------- | --------------- | ----------------- |
| Direct Line Speech | Yes       | Yes (multiple)  | Custom voice apps |
| Teams              | Limited   | No (Teams only) | Teams integration |
| Web Chat           | No (text) | Yes             | Web-based bots    |

---

## Common Traps & Misconceptions

1. **`${user.name}` in .lg is NOT a prompt** — it reads from memory. The exam will try to trick you into thinking it asks the user for their name.
2. **MemoryStorage is NOT persistent** — data lost on bot restart. Only use for testing. Exam loves to ask "will state survive a restart?" → No with MemoryStorage.
3. **`SaveChangesAsync()` is mandatory** — without it, state changes are cached but never written to storage.
4. **Direct Line Speech ≠ Cortana** — Cortana is deprecated. For custom voice clients, use Direct Line Speech.
5. **Multi-tenant bots are deprecated** — after July 2025, new bots must use managed identity or single-tenant.
6. **QA alternate phrasings ≠ entities** — Question Answering doesn't use an entity model. Adding alternate phrasings is the fix.
7. **Dialog triggers for cancellation** — don't write custom middleware or modify every waterfall step. A dialog trigger handles interruptions centrally.
8. **`coalesce()` returns first non-null** — not a string concatenation or formatting function.
9. **`CreateProperty` creates an accessor** — the actual property/object is created on first `GetAsync` with the factory lambda.

---

## Quick Reference Card

| Concept                   | Key fact                                              |
| ------------------------- | ----------------------------------------------------- |
| CLU lifecycle             | Schema → Label → Train → Evaluate → Deploy → Predict  |
| CLU retirement            | March 31, 2029                                        |
| UserState key             | `{ChannelId}/users/{From.Id}`                         |
| ConversationState key     | `{ChannelId}/conversations/{Conversation.Id}`         |
| MemoryStorage persistence | None (volatile)                                       |
| Save state                | `await _userState.SaveChangesAsync(turnContext)`      |
| .lg template definition   | `# TemplateName`                                      |
| .lg expression            | `${expression}`                                       |
| .lg template call         | `${TemplateName()}`                                   |
| Direct Line Speech        | Voice + custom clients + WebSocket streaming          |
| Bot deploy resources      | Azure Bot + App Service + App Service Plan + Identity |
| Waterfall dialog          | Linear step sequence with prompts                     |
| Dialog trigger            | Event handler for interruptions/cancellations         |
| QA alternate phrasings    | Fix for unmatched question variations                 |
| coalesce(a, b)            | Returns first non-null value                          |
| Conversation expiration   | send_activity → clear_state                           |

---

## Related Questions in questions.json

| ID                   | Topic                   | Key concept tested                                         |
| -------------------- | ----------------------- | ---------------------------------------------------------- |
| Ck9BkhaLPagDJAlMcM4V | LG files                | `${user.name}` is property access, not a prompt            |
| Gkv9gw6Uk6zpbgA0OhA3 | Direct Line Speech      | Voice + multiple custom clients → Direct Line Speech       |
| KM22l5h6CUIc4zTvUXcv | Waterfall Dialogs       | Step-by-step data collection → waterfall                   |
| KvuCXGrJOarwyFY5DyRW | Composer                | `User.name` property, `coalesce()` function                |
| MQsLu40oNYZKFpduR5jO | Bot deployment          | Resources needed: App Registration + App Service + Plan    |
| QlcXH2r0NShO6l7tuqI5 | Dialog triggers         | Cancellation handling → dialog trigger                     |
| VprGJ8eHIPUF8hd4HAb5 | State management        | CreateProperty, UserState, MemoryStorage, SaveChangesAsync |
| WaogPyLgZvcGJglpIziR | Question Answering      | Alternate phrasings (not entities)                         |
| WcGAS4FwpZ1lqcc2vF4z | Conversation expiration | send_activity + clear_state                                |

Quiz command:

```powershell
python quiz_runner.py questions.json --day-lock 20 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [About component and waterfall dialogs](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-concept-waterfall-dialogs?view=azure-bot-service-4.0)
- [Managing state](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-concept-state?view=azure-bot-service-4.0)
- [Language Generation](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-concept-language-generation?view=azure-bot-service-4.0)
- [Provision and publish a bot](https://learn.microsoft.com/en-us/azure/bot-service/provision-and-publish-a-bot?view=azure-bot-service-4.0)
- [Dialogs library](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-concept-dialog?view=azure-bot-service-4.0)
- [What is conversational language understanding?](https://learn.microsoft.com/en-us/azure/ai-services/language-service/conversational-language-understanding/overview)
- [What is custom question answering?](https://learn.microsoft.com/en-us/azure/ai-services/language-service/question-answering/overview)

---

## Notes (your own words — fill this in after studying)

_(Space for your notes after reviewing the material)_
