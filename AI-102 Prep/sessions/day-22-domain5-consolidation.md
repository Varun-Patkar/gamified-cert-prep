# Day 22: Domain 5 Consolidation — NLP, Speech, Bot Framework & Question Answering

**Date**: 2026-05-27
**Domain**: Domain 5 — Implement NLP Solutions (15-20%)
**Subtopics**: LUIS/CLU Active Learning, Bot Framework (activity handlers, Emulator, Direct Line Speech), Question Answering (chit-chat, personalities), QnA Maker connection, cross-domain weak area recap
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)

- **LUIS Active Learning cycle**: Enable active learning (log=true) → Review/validate endpoint utterances → Retrain & republish. Always this order.
- **CLU None intent**: Add example utterances to the None intent to catch out-of-scope/spurious requests. Also set the None score threshold.
- **Bot Framework Emulator local testing**: Build & run bot on localhost → Open Bot Framework Emulator → Connect to bot endpoint (`http://localhost:<port>/api/messages`).
- **Emulator interactive debugging**: In code, create a trace activity → Send the trace activity → Run bot on localhost. Trace activities only appear in the Emulator, never in production channels.
- **Direct Line Speech**: Deploy bot to Azure + register with Direct Line Speech channel = minimum-effort speech integration. No custom Azure Function or Cortana needed.
- **Activity handlers** respond to events with custom logic (e.g., `OnMessageActivityAsync`, `OnMembersAddedAsync`). Dialogs manage multi-turn state. Adaptive cards are UI elements. Skills are reusable bot capabilities.
- **Chit-chat** handles pleasantries (greetings, jokes), NOT synonym understanding. For "How much does X cost?" vs "What is the price of X?" → add **alternative phrasing**, not chit-chat.
- **Chit-chat personalities**: Professional, Friendly, Witty, Caring, Enthusiastic. To fix formality → change personality to Professional, don't delete chit-chat.

---

## Learning Objectives

After this session you should be able to:

1. Order the 3-step LUIS/CLU active learning improvement cycle
2. Explain the role of the None intent and how to populate it
3. Sequence the Bot Framework Emulator local testing workflow
4. Sequence the Emulator interactive debugging workflow with trace activities
5. Identify Direct Line Speech as the minimal-effort speech channel for bots
6. Distinguish activity handlers, dialogs, adaptive cards, and skills
7. Explain what chit-chat does and does NOT do (synonyms vs pleasantries)
8. Name all 5 chit-chat personalities and know when to switch
9. Locate QnA Maker connection info in the Azure Portal (Keys and Endpoint blade)

---

## Key Concepts

### 1. LUIS / CLU Active Learning

**Active learning** is the process of reviewing endpoint utterances that the model is unsure about, then using them to improve the model.

**The 3-step cycle (exam-tested order):**

| Step | Action                           | Details                                                                                                                     |
| ---- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1    | **Enable active learning**       | Set `log=true` on endpoint queries. In LUIS portal: Manage → Azure Resources → Change query parameters → Toggle "Save logs" |
| 2    | **Review & validate utterances** | Go to "Review endpoint utterances" page. Accept correct predictions, reassign wrong intents, label entities                 |
| 3    | **Retrain & republish**          | Train the updated model and publish to the endpoint                                                                         |

**Key facts:**

- Active learning captures queries sent to the prediction endpoint that the model is unsure about
- You must log queries (`log=true`) to enable it — V3 endpoint defaults to `log=false`
- LUIS is retired (March 2026); CLU is the replacement. The exam still tests the active learning concept

### 2. CLU None Intent

The **None intent** is a required, non-deletable intent in every CLU project. It catches utterances that don't belong to any custom intent.

**Two mechanisms to route to None:**

1. **None score threshold**: If the top-scoring intent's score falls below this threshold, the prediction is automatically replaced with None. Set in Project Settings (0.0–1.0).
2. **Training examples**: Add examples of out-of-scope utterances directly to the None intent — greetings, yes/no answers, off-topic requests.

**Best practice**: Add **false positive examples** to None. E.g., in a flight booking app, add "I want to buy a book" to None so it doesn't trigger "Book Flight."

**Exam trap**: The question asks how to handle "spurious requests" — the answer is always **add examples to the None intent** (option C), NOT enable active learning or add entities.

### 3. Bot Framework — Activity Handlers vs Dialogs vs Adaptive Cards vs Skills

| Component            | Purpose                                                                                    | When to Use                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| **Activity Handler** | Event-driven handler for each activity type (message, conversationUpdate, event, reaction) | Respond to events with custom text; short interactions; no multi-turn state needed  |
| **Dialog**           | State-based conversation flow management (waterfall, component, adaptive)                  | Multi-turn conversations; gathering info step-by-step; complex conversation flows   |
| **Adaptive Card**    | Rich UI card rendered in the channel (buttons, inputs, images)                             | Display interactive content; collect structured user input; NOT for handling events |
| **Skill**            | A reusable, self-contained bot capability consumed by other bots                           | Modular bot architecture; sharing capabilities across multiple bots                 |

**Key activity handler methods (C#):**

- `OnMessageActivityAsync` — handles incoming messages
- `OnMembersAddedAsync` — handles users joining conversation
- `OnEventActivityAsync` — handles event activities
- `OnTokenResponseEventAsync` — handles OAuth token responses
- `OnTurnAsync` — base turn handler (calls all other handlers)

**Exam trap**: "Respond to events with custom text" → **Activity handler** (not dialog, not adaptive card, not skill).

### 4. Bot Framework Emulator — Local Testing Workflow

**Standard local testing (exam-tested order):**

| Step | Action                                                               |
| ---- | -------------------------------------------------------------------- |
| 1    | **Build and run the bot** on localhost (e.g., `dotnet run`)          |
| 2    | **Open Bot Framework Emulator**                                      |
| 3    | **Connect to bot endpoint** (`http://localhost:<port>/api/messages`) |

**Why this order**: The bot must be running before the Emulator can connect to it. You need the port number from the running bot.

### 5. Bot Framework Emulator — Interactive Debugging with Trace Activities

**Trace activity debugging (exam-tested order):**

| Step | Action                                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------------------------- |
| 1    | **In code, create a new trace activity** (set `type = "trace"`, optionally set `name`, `label`, `value`)         |
| 2    | **In code, send the trace activity** via `turnContext.SendActivityAsync()` or `turnContext.TraceActivityAsync()` |
| 3    | **Run the bot on localhost** and test in Emulator                                                                |

**Key facts:**

- Trace activities are sent **only to the Emulator**, never to other channels or clients
- They appear in the Emulator LOG panel, not the main chat panel
- Common use: error handling in the adapter's `OnTurnError` handler
- C# shortcut: `await turnContext.TraceActivityAsync("TraceLabel", exceptionMessage, "errorType", "TurnError");`

### 6. Direct Line Speech Channel

**Minimum-effort speech integration for bots:**

> Deploy the bot to Azure → Register with **Direct Line Speech** channel

**Key facts:**

- Direct Line Speech connects Bot Framework bots to the Speech service
- Provides real-time, bidirectional streaming of speech and text
- No custom Azure Function needed (that's extra effort)
- Cortana integration is deprecated/limited — not the minimal answer
- Microsoft Teams channel handles Teams, not general speech

**Exam trap**: "Minimize development effort" + "spoken requests" → Direct Line Speech (option A), not Cortana (B), not custom Azure Function (C), not Teams (D).

### 7. Question Answering — Chit-Chat Feature

**What chit-chat IS:**

- A prepopulated set of ~100 question-answer pairs for casual conversation (greetings, jokes, small talk)
- Added as a source in Language Studio (stored as a .tsv file)
- Makes bots more conversational and engaging

**What chit-chat is NOT:**

- Does NOT improve synonym understanding
- Does NOT fix "How much does X cost?" when "What is the price of X?" works
- Does NOT add domain knowledge

**To fix synonym/phrasing issues**: Add **alternative phrasing** (alternative questions) to existing QA pairs in your knowledge base.

### 8. Chit-Chat Personality Types

| Personality      | Style                         | Example Response to "When is your birthday?" |
| ---------------- | ----------------------------- | -------------------------------------------- |
| **Professional** | Formal, corporate-appropriate | "Age doesn't really apply to me."            |
| **Friendly**     | Warm, approachable            | "I don't really have an age."                |
| **Witty**        | Humorous, clever              | "I'm age-free."                              |
| **Caring**       | Empathetic, supportive        | "I don't have an age."                       |
| **Enthusiastic** | Energetic, excited            | "I'm a bot, so I don't have an age."         |

**Exam trap**: "Chatbot responses lack formality" → Change chit-chat personality to **Professional** (swap the .tsv source). **Removing** chit-chat entirely does NOT fix formality — it just removes all small-talk responses.

**Chit-chat source files follow naming**: `qna_chitchat_professional.tsv`, `qna_chitchat_friendly.tsv`, etc.

### 9. QnA Maker / Language Service — Connection Info

**Where to find connection info for a QnA Maker resource in Azure Portal:**

> **Keys and Endpoint** blade

This blade provides:

- Subscription key(s) (Key1, Key2)
- Endpoint URL
- These are needed by the bot to call the QnA Maker runtime API

**Not the answer:**

- Access control (IAM) = RBAC role assignments
- Properties = resource metadata (resource ID, type, location)
- Identity = Managed Identity settings

---

## Comparisons (X vs Y Tables)

### Chit-Chat vs Alternative Phrasing

| Scenario                                                                                 | Solution                                         | Why                                                                       |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Bot doesn't understand "How much does X cost?" but understands "What is the price of X?" | Add **alternative phrasing**                     | Same intent, different wording — chit-chat doesn't handle domain synonyms |
| Bot gives no response to "Hi" or "Tell me a joke"                                        | Enable **chit-chat**                             | These are pleasantries/small-talk, exactly what chit-chat covers          |
| Bot responses to casual questions are too informal                                       | Change chit-chat personality to **Professional** | Personality controls tone of chit-chat responses                          |
| Bot responses to casual questions should be removed entirely                             | **Delete** chit-chat source                      | Removes all small-talk QA pairs                                           |

### Bot Framework Component Selection

| Need                                        | Component              | Why Not Others                                                             |
| ------------------------------------------- | ---------------------- | -------------------------------------------------------------------------- |
| Respond to events with custom text          | **Activity handler**   | Dialogs = multi-turn state; Adaptive cards = UI; Skills = reusable modules |
| Multi-step form collection                  | **Dialog** (waterfall) | Activity handler doesn't manage state between turns                        |
| Display rich interactive content            | **Adaptive card**      | Activity handlers/dialogs are logic, not UI                                |
| Share bot capabilities across multiple bots | **Skill**              | Other components are internal to one bot                                   |

---

## Common Traps & Misconceptions

1. **Active learning order trap**: Must ENABLE first, then REVIEW, then RETRAIN. You can't review utterances that haven't been logged yet.

2. **None intent vs Active learning trap**: "Model gives wrong responses to unrelated requests" → Add examples to None intent. "Model gives wrong responses to RELATED requests" → Use active learning to review and correct.

3. **Trace activity order trap**: Create the trace activity BEFORE sending it. You can't send what doesn't exist. But both code steps happen before running on localhost.

4. **Emulator local test order trap**: Bot must be RUNNING before you open the Emulator and connect. Build & run → Open → Connect.

5. **Chit-chat doesn't fix synonyms**: "What is the price?" works but "How much does it cost?" doesn't → Alternative phrasing, not chit-chat.

6. **Removing chit-chat doesn't fix formality**: Removing chit-chat means NO casual responses at all. To fix formality, CHANGE personality to Professional.

7. **Direct Line Speech vs custom Function**: The exam loves "minimize development effort" — Direct Line Speech is a channel registration, no code needed. Custom Azure Function is unnecessary overhead.

8. **Keys and Endpoint vs Properties vs IAM**: Connection info (keys, endpoint URL) is always in the "Keys and Endpoint" blade. Properties has metadata. IAM has role assignments.

---

## Cross-Domain Quiz Question Refreshers (Days 17-21 Weak Areas)

| Concept                                | Key Fact                                                                                                                           | Trap                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Knowledge store projections            | 3 types: **table** (Azure Table Storage, structured), **object** (Blob, JSON docs), **file** (Blob, binary normalized images only) | File projections are for images, not documents                           |
| Knowledge store definition             | Requires `storageConnectionString` + `projections` array. Each array element is a group with `{tables:[], objects:[], files:[]}`   | Both fields mandatory; items in same group share cross-reference keys    |
| Doc Intelligence S0 pixel limits       | Minimum **50×50 pixels**; maximum 10000×10000 pixels                                                                               | S0 minimum is 50×50, not 0×0 or 1×1                                      |
| Composer entity extraction vs triggers | Entities are extracted FROM utterances. Triggers determine WHICH dialog to run. Intent triggers ≠ entity extractors                | Don't confuse "entity" (data extraction) with "trigger" (dialog routing) |
| Text Analytics endpoints               | `RecognizeEntities` (NER), `ExtractKeyPhrases`, `AnalyzeSentiment`, `DetectLanguage`, `RecognizePiiEntities`                       | Method names are specific — NER ≠ key phrases                            |
| LUIS container deploy order            | Export model (select v1.1) → Move package to input directory → Run container                                                       | Can't run container before package is in the input directory             |

---

## Quick Reference Card

### Active Learning Cycle

```
Enable (log=true) → Review endpoint utterances → Retrain & republish
```

### Emulator Local Testing

```
Build & run bot → Open Emulator → Connect to endpoint
```

### Emulator Trace Debugging

```
Create trace activity → Send trace activity → Run on localhost
```

### Chit-Chat Personalities

```
Professional | Friendly | Witty | Caring | Enthusiastic
```

### QnA Maker Connection Info Location

```
Azure Portal → QnA Maker resource → Keys and Endpoint blade
```

### Activity Handler Key Methods

```
OnMessageActivityAsync       — incoming messages
OnMembersAddedAsync          — user joins conversation
OnEventActivityAsync         — event activities
OnTokenResponseEventAsync    — OAuth token responses
OnTurnAsync                  — base handler (calls all others)
```

---

## Related Questions in questions.json

| ID                     | Summary                                                                       |
| ---------------------- | ----------------------------------------------------------------------------- |
| `lSUUlRAuDomVABtBpbS3` | LUIS active learning 3-step order: Enable → Validate → Retrain                |
| `lxWhXKBCjpWqpcKZWiqO` | Bot Framework spoken requests → Direct Line Speech channel                    |
| `nJTNqN5bDBZakbIleqz4` | Emulator debugging order: Create trace → Send trace → Run on localhost        |
| `nVQj8drAwKvfCH7t2iJ8` | Emulator local testing order: Build & run → Open Emulator → Connect           |
| `oZVByU8caVl3GdfXXSqw` | Chit-chat does NOT fix synonym understanding → need alternative phrasing      |
| `pOKKg6429i76VKJAO00M` | Removing chit-chat doesn't fix formality → change to Professional personality |
| `sB2OMHhhAaEbrapxtJ71` | Respond to events with custom text → Activity handler                         |
| `tZQuuUIZcQU1b5BA9qgR` | CLU spurious requests → Add examples to None intent                           |
| `ta7hRiZlllmj3fuMHUgn` | QnA Maker connection info → Keys and Endpoint blade                           |

Quiz command:

```powershell
python quiz_runner.py questions.json --day-lock 22 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [CLU None Intent](https://learn.microsoft.com/en-us/azure/ai-services/language-service/conversational-language-understanding/concepts/none-intent)
- [How to improve a LUIS app — Active Learning](https://learn.microsoft.com/en-us/previous-versions/azure/ai-services/luis/how-to/improve-application)
- [Bot Framework Basics — Activity handlers, dialogs, bot logic](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-basics?view=azure-bot-service-4.0)
- [Activity Handler Concept](https://learn.microsoft.com/en-us/azure/bot-service/bot-activity-handler-concept?view=azure-bot-service-4.0)
- [Test and debug with the Emulator](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-debug-emulator?view=azure-bot-service-4.0)
- [Add trace activities to your bot](https://learn.microsoft.com/en-us/azure/bot-service/using-trace-activities?view=azure-bot-service-4.0)
- [Use chitchat with a project (Question Answering)](https://learn.microsoft.com/en-us/azure/ai-services/language-service/question-answering/how-to/chit-chat)
- [Direct Line Speech Channel](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-channel-connect-directlinespeech?view=azure-bot-service-4.0)

---

## Notes (your own words — fill this in after studying)

_(Space for your own notes after going through the material)_
