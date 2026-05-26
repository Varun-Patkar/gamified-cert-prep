# Day 21: Question Answering

**Date**: 2026-05-26
**Domain**: Domain 5 — Implement Natural Language Processing Solutions (15–20%)
**Subtopics**: Custom Q&A projects, Q&A pair management, training/testing/publishing, multi-turn, alternate phrasing, chit-chat, export, multi-language
**Estimated study time**: 0.5 hrs

---

## TL;DR (60-second skim)

- **Custom Question Answering (CQA)** is a feature of Azure AI Language (successor to QnA Maker) — create projects in Language Studio / Foundry (classic)
- **Sources**: import Q&A pairs from URLs, files (PDF, DOCX, TSV), and manual entry
- **Alternate phrasing**: add variant questions to existing Q&A pairs so the ranker matches paraphrased queries — first 5 are used for core ranking
- **Chit-chat**: pre-built personality datasets (Professional, Friendly, Witty, Caring, Enthusiastic) handle spurious/off-topic questions — tag with `editorial:chitchat` metadata
- **Multi-turn**: follow-up prompts create parent-child Q&A relationships; child answers are boosted when context includes `previousQnAId`
- **Export/Import**: use Language Studio or REST API to export a knowledge base for collaboration, migration, or backup
- **Multi-language**: one language per project; create separate projects per language, route by detected language
- **Bot Framework dialog types for exam**: Waterfall (linear step-by-step), Prompt (collect input), Component (reusable set), Adaptive (Composer), Action/Input (Composer-only)

---

## Learning Objectives

After this session you should be able to:

1. Create and configure a custom question answering project in Language Studio
2. Add Q&A pairs manually and import from URLs/files
3. Add alternate phrasing to existing Q&A pairs to improve answer matching
4. Enable and configure chit-chat with the appropriate personality tone
5. Distinguish chit-chat from custom Q&A intents (spurious questions = chit-chat, not custom intents)
6. Create multi-turn conversations using follow-up prompts
7. Train, test, and publish a knowledge base
8. Export a knowledge base for migration or collaboration
9. Design a multi-language Q&A solution (one language per project)
10. Identify correct Bot Framework dialog types (waterfall, prompt) for step-by-step flows

---

## Key Concepts

### 1. Custom Question Answering (CQA) Overview

CQA is a **cloud-based NLP feature of Azure AI Language** that builds conversational Q&A layers over your data. It replaces the retired QnA Maker service (retired March 2025).

**Architecture workflow:**

1. **Create a project** in Language Studio (or Foundry classic)
2. **Add sources** — URLs, files (PDF, DOCX, TSV, Excel), or manual Q&A pairs
3. **Train** — the model processes sources and builds a ranked knowledge base
4. **Test** — validate in the built-in test pane
5. **Deploy/Publish** — creates a REST API endpoint
6. **Integrate** — client apps (e.g., bots) query the endpoint; responses include answer text, confidence score, and follow-up prompts

**Key resource**: Requires an **Azure Language resource** (S tier for production, F0 for free).

### 2. Adding Q&A Pairs and Importing Sources

| Method            | Details                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| **URL import**    | CQA crawls FAQ pages and extracts Q&A pairs automatically; works best with well-structured FAQ pages |
| **File import**   | Supports PDF, DOCX, TSV, TXT, Excel; product manuals should have clear headings and index pages      |
| **Manual entry**  | Add Q&A pairs directly in Language Studio's editor                                                   |
| **Chit-chat TSV** | Pre-built personality files added as a source                                                        |

**Extraction best practice**: FAQ pages should be **standalone** — don't combine with other info. Product manuals need clear headings and preferably an index page.

### 3. Alternate Phrasing

CQA uses a **transformer-based ranker** that handles semantically similar queries automatically (e.g., "What is the price?" matches "How much does it cost?"). However, when the ranker fails:

- **Add alternate questions** to the _existing_ Q&A pair in Language Studio
- Then **retrain and republish** the model
- **First 5 alternate questions** are used for core ranking; the rest help with exact match scenarios
- Keep alternate questions **semantically distinct** from each other — don't add near-duplicates
- Diminishing returns after ~10 alternate questions

> **Exam trap (Q1)**: When a chatbot fails to respond to a paraphrased question, the fix is adding **alternative phrasing to the existing Q&A pair**, NOT creating a new Q&A pair.

### 4. Synonyms

Synonyms are defined at the **project level** (unlike QnA Maker where they were service-wide). Use them for:

- Acronyms (MSFT ↔ Microsoft, ID ↔ Identification)
- Domain-specific terms the transformer won't naturally link
- Special characters are **NOT allowed** in synonyms

### 5. Chit-Chat

Chit-chat handles **spurious/off-topic questions** ("What's your name?", "Tell me a joke") with personality-driven responses.

**5 Personalities:**

| Personality      | Tone                   | File                            |
| ---------------- | ---------------------- | ------------------------------- |
| **Professional** | Formal, business-like  | `qna_chitchat_professional.tsv` |
| **Friendly**     | Warm, approachable     | `qna_chitchat_friendly.tsv`     |
| **Witty**        | Humorous, irreverent   | `qna_chitchat_witty.tsv`        |
| **Caring**       | Empathetic, supportive | `qna_chitchat_caring.tsv`       |
| **Enthusiastic** | Energetic, excited     | `qna_chitchat_enthusiastic.tsv` |

**How to add**: In Language Studio → Manage Sources → Add Source → Chitchat → select personality.

**Custom chit-chat Q&A pairs**: Add metadata tag `editorial:chitchat` to ensure the ranker treats them as chit-chat.

**Edit bot-specific questions**: Customize answers for "Who are you?", "What can you do?", "What is your age?", "Who created you?"

**Language support**: Chinese, English, French, German, Italian, Japanese, Korean, Portuguese, Spanish.

> **Exam trap (Q6)**: Spurious questions = chit-chat. Modifying custom intent Q&A pairs does NOT fix the tone of responses to spurious questions. You need to enable/configure the **chit-chat feature with the appropriate personality** (e.g., Professional for formal responses).

### 6. Multi-Turn Conversations

Multi-turn conversations use **follow-up prompts** to guide users through complex information hierarchically.

**How it works:**

- A parent Q&A pair includes follow-up prompt links to child Q&A pairs
- The REST API accepts a `context` object with `previousQnAId` property
- When context is provided, **child Q&A pairs are boosted first**, then siblings, then grandchildren

**Prioritization order:**

1. Child Q&A pairs of the previous answer
2. Sibling Q&A pairs
3. Grandchild Q&A pairs

**Creation**: Add follow-up prompts in Language Studio when editing a Q&A pair. Can be extracted automatically from well-structured documents with headings.

### 7. Training, Testing, and Publishing

| Step        | Details                                                                               |
| ----------- | ------------------------------------------------------------------------------------- |
| **Train**   | Process all sources and build/rebuild the ranking model                               |
| **Test**    | Use built-in test pane in Language Studio; send queries and inspect confidence scores |
| **Publish** | Deploys the project to a production endpoint; creates a REST API                      |

**Active learning**: After publishing, enable active learning to get suggestions for new alternate questions based on real user queries. Review and accept/reject suggestions.

**Confidence score threshold**: Default is 0 (returns all answers). Set a custom threshold based on your project needs. Test to find the optimal value.

**RankerType**: Default searches both questions AND answers. Use `RankerType=QuestionOnly` when answers shouldn't influence ranking (e.g., acronym catalog).

### 8. Exporting a Knowledge Base

Export uses **import-export** workflow via Language Studio or REST API:

- Export project contents for migration, backup, or collaboration
- **Editor-approver model**: Set up two Language resources in different subscriptions; edit/test in one, export and import to the approver's resource for production

### 9. Multi-Language Question Answering

- **One language per project** — you cannot mix languages within a single project
- For multi-language bots: create **separate Q&A projects per language**
- Use **language detection** to route incoming queries to the correct project
- The language is set at project creation time and cannot be changed later

---

## Comparisons (X vs Y tables)

### CQA vs QnA Maker

| Feature        | Custom Question Answering    | QnA Maker (retired)    |
| -------------- | ---------------------------- | ---------------------- |
| Service        | Feature of Azure AI Language | Standalone service     |
| Synonyms scope | Project-level                | Service-level (shared) |
| Portal         | Language Studio / Foundry    | qnamaker.ai            |
| Status         | Active                       | Retired March 2025     |

### Alternate Phrasing vs New Q&A Pair vs Synonyms

| Approach               | When to use                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| **Alternate phrasing** | Same answer, different question wording — add to existing pair        |
| **New Q&A pair**       | Truly different question requiring a different answer                 |
| **Synonyms**           | Domain-specific word equivalences (acronyms, jargon) at project level |

### Chit-Chat vs Custom Q&A Intents

| Aspect       | Chit-Chat                                         | Custom Q&A                         |
| ------------ | ------------------------------------------------- | ---------------------------------- |
| Purpose      | Off-topic, casual questions                       | Domain-specific questions          |
| Source       | Pre-built personality TSV file                    | Your content (URLs, files, manual) |
| Metadata     | `editorial:chitchat`                              | Custom metadata tags               |
| Tone control | Select personality (Professional, Friendly, etc.) | You write the answers              |

---

## Important Details for Exam

- **First 5 alternate questions** are used for core ranking; rest are for exact match only
- **Special characters NOT allowed** in synonyms
- **Punctuation is ignored** in user queries before ranking
- **Casing**: CQA is case-aware but intelligently ignores case when appropriate
- **Accents**: supported for European languages; minor accent errors still return relevant answers via fuzzy search
- **Active learning** needs diverse, real user queries to generate good suggestions
- **One language per project** — this is a hard constraint
- **Chit-chat languages**: Chinese, English, French, German, Italian, Japanese, Korean, Portuguese, Spanish
- **Chit-chat metadata**: custom chit-chat pairs must include `editorial:chitchat` metadata
- CQA is **retiring March 31, 2029** — migration path is to Microsoft Foundry models

---

## Common Traps & Misconceptions

1. **"Add a new Q&A pair" vs "Add alternate phrasing"**: When a bot fails to answer a paraphrased question, add **alternate phrasing to the existing pair**, NOT a new pair with the same answer. (Q1)

2. **"Modify custom intent Q&A pairs" vs "Enable chit-chat"**: Spurious/off-topic questions are handled by the **chit-chat feature**, not custom Q&A pairs. To make responses more formal, select the **Professional** chit-chat personality. (Q6)

3. **Waterfall vs Adaptive dialogs**: For step-by-step linear flows (product setup, food ordering), use **Waterfall + Prompt dialogs**. Adaptive dialogs are for Composer's flexible flows and are not the minimum-effort SDK answer. (Q4, Q7)

4. **Action and Input dialog types**: These are Composer-specific and NOT standard Bot Framework SDK dialog types for linear flows.

5. **Speech for bots requires 3 things**: Speech resource + WebSockets enabled + Direct Line Speech channel. NOT Cortana, NOT CORS, NOT LUIS. (Q3)

6. **LUIS export format**: To translate a LUIS model locally using Bot Framework CLI, first **export as .lu file**. Not clone, not create new service. (Q2)

7. **Adaptive cards in Composer**: For presenting options with images, use **adaptive card + dialog**. Entities, Azure Functions, and utterances don't display visual options. (Q8)

---

## Quick Reference Card

| Topic                   | Key Fact                                                            |
| ----------------------- | ------------------------------------------------------------------- |
| Alternate phrasing      | Add to existing Q&A pair → retrain → republish                      |
| Core ranking limit      | First 5 alternate questions                                         |
| Chit-chat personalities | Professional, Friendly, Witty, Caring, Enthusiastic                 |
| Chit-chat metadata      | `editorial:chitchat`                                                |
| Spurious questions fix  | Enable chit-chat with right personality, not custom Q&A             |
| Multi-turn context      | `previousQnAId` in REST API context object                          |
| Multi-turn priority     | Child → Sibling → Grandchild                                        |
| Multi-language          | One language per project; separate projects per language            |
| Export purpose          | Migration, backup, collaboration (editor-approver model)            |
| RankerType option       | `QuestionOnly` for when answers shouldn't influence ranking         |
| Active learning         | Needs real user queries; review & accept/reject suggestions         |
| .lu file syntax         | `#` = intent, `- ` = utterance                                      |
| Waterfall dialog        | Linear step-by-step flow; use with Prompt dialogs                   |
| Direct Line Speech      | Channel for speech-enabled bots; needs Speech resource + WebSockets |

---

## Cross-Domain Quiz Question Refreshers

| Concept                                    | Key Fact                                                                                                                                               | Trap                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Bot Framework dialog types** (Q4, Q7)    | Waterfall = linear steps; Prompt = collect input; Component = reusable container; Adaptive = Composer-only flexible flow; Action/Input = Composer-only | Waterfall + Prompt = minimum effort for step-by-step bots. Adaptive is NOT the answer for simple linear flows |
| **LUIS .lu file format** (Q5)              | `#` prefix = intent definition; `- ` lines under it = sample utterances; `@` = entity definition                                                       | Intent vs utterance — `#` is intent, dashes below are utterances                                              |
| **LUIS export for Bot Framework CLI** (Q2) | Export model as `.lu` file first, then translate locally                                                                                               | Don't clone; don't create a new LUIS service; export comes first                                              |
| **Speech for chatbot** (Q3)                | 3 steps: (1) Create Speech resource, (2) Enable WebSockets, (3) Register Direct Line Speech channel                                                    | Cortana channel, CORS, and LUIS are distractors                                                               |
| **Adaptive cards in Composer** (Q8)        | Adaptive cards = rich display with images/buttons; combined with dialogs for conversation flow                                                         | Entities, Azure Functions, utterances don't present visual options                                            |
| **Speech in Bot Composer** (Q9)            | 3 steps: (A) Configure language/voice for Speech resource, (B) Add Speech endpoint/key to bot, (E) Add Speech to bot responses                         | Language Understanding and Orchestrator are NOT required; don't remove setSpeak                               |

---

## Related Questions in questions.json

| ID                     | Summary                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| `XGpVUml4yznLG6X83m5H` | Alternate phrasing fixes paraphrased question failures (Yes)                     |
| `XYy7E2wHLOB1n3TjBd1R` | Export LUIS model as .lu file first for Bot Framework CLI translation            |
| `ajyl3KWbwbjvBiQP9UGz` | Enable speech: WebSockets + Speech resource + Direct Line Speech channel         |
| `dzueUcN2Og6vc8zFTrkY` | Food ordering bot: Waterfall + Prompt dialogs                                    |
| `gjIfQfDBj6zGfJZamun4` | .lu file format: # = intent, - = utterance (hotspot)                             |
| `hcBXSwi3vuBF6QwprWN2` | Spurious questions need chit-chat, not custom intent modification (No)           |
| `iZHphNNTh5Amwki7OFbS` | Product setup guidance: Waterfall dialog                                         |
| `ikF0utvJ29ypyqF28OS9` | Options with images in Composer: Adaptive card + Dialog                          |
| `jKNuOZZE3xzofkH3S3JW` | Speech channels in Composer: configure voice + add key + add Speech to responses |

Quiz command:

```powershell
python quiz_runner.py questions.json --day-lock 21 --carryover 3 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [What is custom question answering?](https://learn.microsoft.com/en-us/azure/ai-services/language-service/question-answering/overview)
- [Custom question answering best practices](https://learn.microsoft.com/en-us/azure/ai-services/language-service/question-answering/concepts/best-practices)
- [Use chitchat with a project](https://learn.microsoft.com/en-us/azure/ai-services/language-service/question-answering/how-to/chit-chat)
- [Bot Framework Dialogs library](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-concept-dialog?view=azure-bot-service-4.0)
- [Dialogs in Bot Framework Composer](https://learn.microsoft.com/en-us/composer/concept-dialog?tabs=v2x)
- [.lu file format](https://learn.microsoft.com/en-us/azure/bot-service/file-format/bot-builder-lu-file-format?view=azure-bot-service-4.0)
- [Multi-turn CLU models (guided conversations)](https://learn.microsoft.com/en-us/azure/ai-services/language-service/question-answering/tutorials/guided-conversations)

---

## Notes (your own words — fill this in after studying)

_(Space for your personal notes after reading through the material)_
