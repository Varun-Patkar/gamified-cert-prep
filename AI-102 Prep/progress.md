# Progress Tracker: Designing and Implementing a Microsoft Azure AI Solution (AI-102)

## Overall

- Sessions Completed: 30 / 32
- Questions Answered: 382 / 313
- Accuracy: 88.2%
- Current Streak: 30 days
- Next Session: Day 31 (2026-06-05) — Full Review 2

## Milestones

- [x] Domain 1 completed (Days 1-5, avg 90.3%)
- [x] Domain 2 completed (Days 6-10, avg 84.8%)
- [x] Domain 3 completed (Days 11-12, avg 89.3%)
- [x] Domain 4 completed (Days 13-16, avg 82.9%)
- [x] Domain 5 completed (Days 17-22, avg 89.9%)
- [x] Domain 6 completed (Days 23-28, avg 91.7%)
- [x] Buffer day completed (Day 29, 100%)
- [ ] Review days completed
- [ ] Final mock completed

## Daily Log

(Updated after each session)

### Day 1 (2026-05-06) - Domain 1: Service Selection

- Status: Completed
- Questions Attempted: 14 (graded) + 2 skipped (simulations)
- Correct: 12 / 14 (85.7%)
- Time Spent: ~10 min quiz + study
- Key Mistakes: Misclick on ARM template TPM question; Face API detect vs identify mix-up
- Lab: 5/5 scenarios correct (Doc Intelligence, Speech STT, Spatial Analysis, AI Search, Content Safety)
- Notes: _fill in your own words_
- Next action: Day 2 - Deployment Planning

### Day 2 (2026-05-07) - Domain 1: Deployment Planning

- Status: Completed
- Questions Attempted: 16 (graded)
- Correct: 14 / 16 (87.5%)
- Time Spent: ~6.7 min quiz + study
- Key Mistakes:
  - LUIS container export: confused export order (select v1.1 → export for containers → run container)
  - Doc Intelligence upload: Azure Files share ≠ Azure Storage account; custom neural not template for inconsistent layouts
- Lab: 9/10 - Deployment checklist (missed: Azure OpenAI is cloud-only, no container option)
- Notes: _fill in your own words_
- Next action: Day 3 - Security and Monitoring

### Day 3 (2026-05-08) - Domain 1: Security and Monitoring

- Status: Completed
- Questions Attempted: 15 (graded)
- Correct: 15 / 15 (100%)
- Time Spent: ~4.1 min quiz
- Key Mistakes: None — perfect quiz run!
- Lab: 3/4 (75%) - RBAC + Managed Identity Design
  - Missed: Default action "Deny" enforcement for VNet rules; always conclude key rotation with "use managed identity instead"
- Notes: _fill in your own words_
- Next action: Day 4 - Responsible AI Controls

### Day 4 (2026-05-09) - Domain 1: Responsible AI Controls

- Status: Completed
- Questions Attempted: 13 (graded)
- Correct: 13 / 13 (100%) — 1 marked wrong by quiz but answer was correct (container ordering: agent-generated options mislabeled)
- Time Spent: ~1 hr study + quiz
- Key Mistakes: None (disputed Q on Sentiment container deploy order — correct sequence: Provision Language resource → Deploy Docker on-prem → Query endpoint)
- Lab: Safety Policy Matrix completed (input/output/grounding layers for financial chatbot)
- Notes: _fill in your own words_
- Next action: Day 5 - Domain 1 Consolidation

### Day 5 (2026-05-10) - Domain 1: Consolidation

- Status: Completed
- Questions Attempted: 18 (graded)
- Correct: 15 / 18 (83.3%)
- Time Spent: ~4.3 min quiz
- Key Mistakes:
  - `az cognitiveservices account show` (not `account list`) to identify a created AI Services account
  - Equitable results = Fairness + Inclusiveness (picked 3 answers instead of 2)
  - Image captioning resource creation: ComputerVision with free tier (not CognitiveServices multi-service)
- Lab: Mini architecture review (from session file)
- Notes: _fill in your own words_
- Next action: Day 6 - Domain 2: Foundry GenAI Foundations

### Day 6 (2026-05-11) - Domain 2: Foundry GenAI Foundations

- Status: Completed
- Questions Attempted: 13 (graded) + 1 skipped + 1 ungraded
- Correct: 11 / 13 (84.6%)
- Time Spent: ~5.5 min quiz + study
- Key Mistakes:
  - Bulk OCR from scanned images: Read API (Computer Vision) is the production answer, not Image Analysis 4.0
  - Face API find similar with 60K images: use `largeFaceListId` (up to 1M) not `faceListId` (up to 1K); `matchFace` mode for ranked similarity
- Domain 1 carryover: 3/3 (100%)
- Lab: Prompt flow design exercise (from session file)
- Notes: _fill in your own words_
- Next action: Day 7 - Domain 2: RAG Fundamentals

### Day 7 (2026-05-12) - Domain 2: RAG Fundamentals

- Status: Completed
- Questions Attempted: 12 (graded after adjustment) + 3 excluded (garbled options)
- Correct: 8 / 12 (66.7%)
- Time Spent: ~5.7 min quiz
- Excluded Questions: 3 hotspot Qs had garbled agent-generated options (brands CV, Face API stream, Speech SDK translation)
- Credited: 1 Q (AI Vision tags hotspot) — user demonstrated correct reasoning despite broken options
- Key Mistakes:
  - Speech translation: TranslationRecognizer (not SpeechRecognizer) + target langs exclude source lang (en-GB)
  - Video Indexer upload: all 4 files uploadable (WMV/AVI/MOV/MP4 all supported, 2GB device limit, 30GB URL limit)
  - Face Recognition hotspot: Yes, No, Yes (Free tier = 1K person groups × 1K persons = 1M max; code uses AddFaceFromUrlAsync matching URI source)
  - Video Indexer person search: Customize Person model (not create Face API group separately)
- Topic 2: 3/7 graded (42.9%) — weak area
- Topic 3: 5/5 graded (100%)
- Notes: _fill in your own words_
- Next action: Day 8 - Domain 2: Azure OpenAI Usage

### Day 8 (2026-05-13) - Domain 2: Azure OpenAI Usage

- Status: Completed
- Questions Attempted: 15 (graded)
- Correct: 13 / 15 (86.7% adjusted; 1 quiz answer corrected — key phrases Q was right)
- Raw Score: 12 / 15 (80.0%)
- Time Spent: ~8.9 min quiz
- Key Mistakes:
  - Custom Speech container deploy order: disputed ordering (export model vs request approval first)
  - Speech SDK translation hotspot: SpeechRecognitionLanguage sets source (fr), AddTargetLanguage sets output (de) — not SpeechSynthesisLanguage
- Corrected Questions: 46A5oFwQ4xmzReGvqTDq (key phrases NYN — answer changed from B to A)
- Topic 2: 7/7 (100%) — strong improvement from Day 7's 42.9%
- Topic 3: 5/8 (62.5%) — hotspot Qs remain tricky
- Notes: _fill in your own words_
- Next action: Day 9 - Domain 2: Optimization and Ops

### Day 9 (2026-05-14) - Domain 2: Optimization and Ops

- Status: Completed
- Questions Attempted: 14 (graded) + 1 skipped (broken options, now fixed)
- Correct: 13 / 14 (92.9% adjusted; Video Indexer widget Q wrongly marked wrong — duplicate options fixed)
- Raw Score: 12 / 14 (85.7%)
- Time Spent: ~5.4 min quiz
- Key Mistakes:
  - Custom Speech container deploy order: disputed ordering (export model vs request approval first)
- Corrected Questions: InafH60aKv8ilod7fM8e (Video Indexer widget — correctAnswer changed C→A, duplicate options)
- Fixed Questions: lbvU8kjpmEBbth3PjpoY (Computer Vision smart cropping — garbled options rewritten)
- Topic 2: 5/7 graded (71.4%)
- Topic 3: 7/8 graded (87.5%) — carryover questions strong
- Notes: _fill in your own words_
- Next action: Day 10 - Domain 2: Fine-tuning and Orchestration

### Day 10 (2026-05-15) - Domain 2: Fine-tuning and Orchestration

- Status: Completed
- Questions Attempted: 14 (graded)
- Correct: 13 / 14 (92.9% adjusted; alt text hotspot had broken options — not a real miss)
- Raw Score: 12 / 14 (85.7%)
- Time Spent: ~5.3 min quiz
- Key Mistakes:
  - Image tagging hotspot: Computer Vision analyze endpoint + imageType property (photographs/drawings/clipart detection)
- Corrected Questions: wJsz2eoOtd9CfW1uz9zR (alt text hotspot — agent-generated options were all wrong customvision URLs; replaced with actual dropdown values)
- Topic 2: 6/7 (85.7% adjusted)
- Topic 3: 7/7 (100%)
- Notes: _fill in your own words_
- Next action: Day 11

### Day 11 (2026-05-16) - Domain 3: Agent Concepts

- Status: Completed
- Questions Attempted: 14 (graded) + 2 excluded (broken agent-generated options)
- Correct: 12 / 14 (85.7% adjusted)
- Raw Score: 10 / 14 (71.4%)
- Time Spent: ~15.6 min quiz
- Excluded Questions: 2 (MzfIUXsxoAMUexLknZmK — correct answer NYN not in options; UR9i2oGHAMwESr4thHvy — garbled action text, skipped)
- Credited: 2 (LrVoIFW7NYkqWJin5TGe — user knew correct answer, skipped due to identical options; X3C2GHY19fpNu3kwMWZ1 — answer key was wrong, user's answer was correct)
- Key Mistakes:
  - LUIS container deploy order: export → move → run (not run first)
  - Voice talent profile: upload consent recording (.wav/.mp3 of talent consenting), NOT training data (.zip of .wav samples)
- Agent-option fixes applied: 6 questions corrected in questions.json
- Domain 2 carryover: 3/3 (100%)
- Domain 3 new: 9/11 adjusted (81.8%)
- Notes: _fill in your own words_
- Next action: Day 12 - Domain 3: Agent Framework Refresher

### Day 12 (2026-05-17) - Domain 3: Agent Framework Refresher

- Status: Completed
- Questions Attempted: 14 (graded) + 1 skipped (broken options, now fixed)
- Correct: 13 / 14 (92.9%)
- Time Spent: ~6.1 min quiz
- Key Mistakes:
  - Document Translation glossary placement: glossary goes in target (French) container, not source (German)
- Skipped: SkdajNLBgXGawPLCy4Bj (Speech translation HOTSPOT — options were garbled, now fixed)
- Fixed Questions: SkdajNLBgXGawPLCy4Bj (HOTSPOT dropdowns restructured), XzR2ZH21uV0QLk0q1Skf (duplicate options replaced with actual dropdown values)
- Day-assignments.json remapped: all 313 questions now properly assigned by domain to matching study days
- Domain 3: 13/14 (92.9%)
- Notes: _fill in your own words_
- Next action: Day 13 - Domain 4: Image Analysis

### Day 13 (2026-05-18) - Domain 4: Image Analysis

- Status: Completed
- Questions Attempted: 13 (graded)
- Correct: 11 / 13 (84.6%)
- Time Spent: ~5.9 min quiz
- Key Mistakes:
  - Content Moderator Text Moderation API: response categories are top-level (Classification, Personal data) not sub-scores (adult/racy); picked B,E instead of A,C
  - Custom Vision flower classifier: adding new images + labels → retrain → publish is correct (Yes, not No)
- Fixed Questions: bg7ZNwoZiyLNsOYVGC6Q (Translator hotspot — options rewritten with actual dropdown values), bwWWpOkpYUh7Wo3xepka (Translator data sovereignty hotspot — options rewritten)
- Domain 4 (Implement computer vision solutions): 8/10 (80.0%)
- Domain 3 carryover: 3/3 (100%)
- Notes: _fill in your own words_
- Next action: Day 14

### Day 14 (2026-05-19) - Domain 4: Custom Vision Models

- Status: Completed
- Questions Attempted: 11 (graded) + 2 skipped (broken options, now fixed)
- Correct: 9 / 11 (81.8%)
- Time Spent: ~43.4 min quiz
- Key Mistakes:
  - Multi-service resource provisioning: Answer is C (Azure Cognitive Services / Azure AI Services multi-service), not D
  - LUIS phrase list: Creating a new entity for domain does NOT meet the goal — need a pattern or phrase list feature, not an entity
- Skipped: k5BQihvhdxhwndsQCqYm (key phrases hotspot — options fixed), pOzZ9dbpzU00CIH9hExI (SSML hotspot — options fixed)
- Fixed Questions: 2 hotspot questions had duplicate/garbled agent-generated options; rewritten with actual dropdown values
- Domain 4 (Topic 3 cross-domain): 9/11 (81.8%)
- Notes: _fill in your own words_
- Next action: Day 15 - Domain 4: Training and Publishing

### Day 15 (2026-05-20) - Domain 4: Training and Publishing

- Status: Completed
- Questions Attempted: 10 (graded) + 2 skipped (broken options, now fixed) + 1 ungraded
- Correct: 9 / 10 (90.0% adjusted; 2 credited — broken options before fix)
- Raw Score: 7 / 10 (70.0%)
- Time Spent: ~4.5 min quiz
- Key Mistakes:
  - Entity Linking hotspot (vHMvoWyXIGKpz5DgEIxQ): Picked NYN, correct is NNY — Entity Linking returns Wikipedia URLs (Statement 3 = Yes), does NOT return custom entity categories
- Credited: 2 (t1V5ns251Fge7UiMBU84 — Translator options were near-identical before fix; wk672W3KbJLJW0OxVlK0 — correct service not in options before fix)
- Skipped: uQSZR2brZIclGwwo2gk9 (SpeechRecognizer/Synthesizer — had 4 boxes instead of 2, now fixed), 0cOYKGwLV89rZ9aCIwRT (AI Search custom skill — garbled options, now fixed)
- Fixed Questions: 4 hotspot questions rewritten with proper dropdown values (Translator, SpeechRecognizer, PDF extraction, AI Search custom skill)
- Domain 4 + cross-domain: 9/10 adjusted (90.0%)
- Notes: _fill in your own words_
- Next action: Day 16 - Domain 4: Video and Spatial Analysis

### Day 16 (2026-05-21) - Domain 4: Video and Spatial Analysis (Doc Intelligence focus)

- Status: Completed
- Questions Attempted: 12 (graded) + 1 skipped (broken options)
- Correct: 9 / 12 (75.0% adjusted)
- Raw Score: 6 / 11 (54.5%)
- Time Spent: ~9.2 min quiz
- Credited: 3 (9FyXH8exsY5DWDAUUD9t — prebuilt-read not in options; 2uw9VHkHTDj5U3qXNcKK — all options identical/garbled; 3jzO8zUYBnRoAHI4tGQw — 6-value options for 3-statement hotspot)
- Skipped: 5uq0tU3cFRatKHLoyhuH (correct answer not in options, now fixed)
- Key Mistakes:
  - prebuilt-read for handwriting (6Yhnv8wKOgYiJfdBwybv): picked prebuilt-contract instead of prebuilt-read — prebuilt-read is the only model with handwriting style detection
  - QR code support (CfFks5HxPpiEE92s4r87): business card model never added QR support in any version — prebuilt-read is the only model with barcode/QR extraction
  - AI Search custom skill schema (0cOYKGwLV89rZ9aCIwRT): YYN — output field mappings required for skillsets, custom skill = Web API, entity recognition feeds the skill
- Fixed Questions: 5 hotspot questions rewritten with correct dropdown values (prebuilt-read+confidence, lesson plan services, doc intelligence response, doc model selection, expense forms)
- Domain 4: 7/10 adjusted (70.0%)
- Domain 3 carryover: 2/2 (100%)
- Notes: _fill in your own words_
- Next action: Day 17 - Domain 5: Text Analytics

### Day 17 (2026-05-22) - Domain 5: Text Analytics

- Status: Completed
- Questions Attempted: 13 (graded)
- Correct: 12 / 13 (92.3%)
- Time Spent: ~6.8 min quiz
- Key Mistakes:
  - AI Search query key rotation: confused admin key rotation pattern with query key rotation — query keys: add new → switch app → delete old (no admin keys involved)
- Domain 5 (NLP): 9/10 (90.0%)
- Domain 4 carryover: 3/3 (100%)
- Notes: _fill in your own words_
- Next action: Day 18 - Domain 5: Translation Workloads

### Day 18 (2026-05-23) - Domain 5: Translation / Knowledge Mining

- Status: Completed
- Questions Attempted: 12 (graded) + 1 skipped (broken options, now fixed)
- Correct: 9 / 12 (75.0% adjusted)
- Raw Score: 9 / 12 (75.0%)
- Time Spent: ~6.9 min quiz
- Credited: 1 (ZAomwNtp8WZ7LTJMSFp0 — ARM template HOTSPOT had 3-box workflow options for 2-dropdown question; user knew correct answer: CognitiveServices + FormRecognizer)
- Key Mistakes:
  - Knowledge store projections (aEglPFeC8t9sKQMqo0gH): Object projections store JSON, not binary images; `files: []` empty = no image projection. Picked "projected to Blob" instead of "not be projected"
  - Knowledge store definition (aZOuG3d0QOgjERlaXN0m): Need `storageConnectionString` + `projections` — picked wrong second field
  - Doc Intelligence S0 limits (V53zHQhO3vu97NWJ9D7T): Forgot 50×50 minimum pixel dimension — File2.jpg (25×25) rejected, only File3.tiff valid
- Fixed Questions: ZAomwNtp8WZ7LTJMSFp0 (ARM template — options rewritten with actual dropdown values: CognitiveServices/FormRecognizer)
- Domain 5 (Knowledge Mining/Doc Intelligence): 9/12 (75.0%)
- Notes: _fill in your own words_
- Next action: Day 19 - Domain 5: Speech Solutions

### Day 19 (2026-05-24) - Domain 5: Speech Solutions (Bot Framework & NLP focus)

- Status: Completed
- Questions Attempted: 12 (graded) + 1 skipped (MemoryStorage hotspot — broken options, now fixed)
- Correct: 11 / 12 (91.7%)
- Time Spent: ~5.9 min quiz
- Skipped: 3u0Lt2unUlTbrMRxGdRQ (MemoryStorage state — had garbled Box options instead of Y/N, now fixed)
- Key Mistakes:
  - Composer hotspot (19SuosyKaYI0KCnbj4Qe): Swapped entity extraction vs trigger type — Box 1 asks what bot _does_ (identify entity), Box 2 asks _trigger type_ (LU intent recognized)
- Fixed Questions: 3 hotspot questions rewritten with distinct options (Composer entity/intent, bot deployment CLI, MemoryStorage Y/N)
- Topic 5 (Bot Framework/NLP): 7/8 graded (87.5%)
- Topic 4 (cross-domain): 4/4 (100%)
- Notes: _fill in your own words_
- Next action: Day 20 - Domain 5: Custom Language Models

### Day 20 (2026-05-25) - Domain 5: Custom Language Models & Bot Framework

- Status: Completed
- Questions Attempted: 9 (graded) + 3 skipped (broken hotspot options, now fixed)
- Correct: 8 / 9 (88.9%)
- Time Spent: ~4.9 min quiz
- Skipped: KvuCXGrJOarwyFY5DyRW (Composer dialog hotspot), VprGJ8eHIPUF8hd4HAb5 (bot state hotspot), WcGAS4FwpZ1lqcc2vF4z (conversation expiration hotspot) — all had duplicate/nonsensical agent-generated options, now fixed
- Key Mistakes:
  - Ck9BkhaLPagDJAlMcM4V (.lg file hotspot): Answered B (Yes,Yes,Yes) instead of A (No,Yes,Yes) — `${user.name}` is property access, NOT a prompt
- Fixed Questions: 4 hotspot questions rewritten with proper Yes/No or dropdown options
- Notes: _fill in your own words_
- Next action: Day 21 - Domain 5: Question Answering

### Day 21 (2026-05-26) - Domain 5: Question Answering

- Status: Completed
- Questions Attempted: 12 (graded)
- Correct: 12 / 12 (100%) — PERFECT SCORE!
- Time Spent: ~4.5 min quiz
- Key Mistakes: None — flawless run
- Topics covered: Alternative phrasing, chit-chat personas, Bot Framework dialogs (waterfall/prompt/adaptive), Composer (adaptive cards, speech channels), .lu file format, LUIS export, bot state & conversation expiry
- Carryover Qs: 3/3 (100%) — Day 20 topics (bot state hotspot, conversation expiry hotspot, food ordering dialogs)
- Notes: _fill in your own words_
- Next action: Day 22 - Domain 5: Consolidation

### Day 22 (2026-05-27) - Domain 5: Consolidation

- Status: Completed
- Questions Attempted: 12 (graded)
- Correct: 10 / 12 (83.3%)
- Time Spent: ~4.8 min quiz
- Key Mistakes:
  - Trace debugging order (nJTNqN5bDBZakbIleqz4): Picked Run→Send→Create instead of Create→Send→Run — code first, then run
  - Emulator local testing order (nVQj8drAwKvfCH7t2iJ8): Picked Open Emulator first instead of Build & Run first — bot must be running before connecting
- Pattern: Both misses = "code/build first, then tooling" ordering
- Domain 5: 10/12 (83.3%) — consolidation round
- Notes: _fill in your own words_
- Next action: Day 23 - Domain 6: AI Search Core

### Day 23 (2026-05-28) - Domain 6: AI Search Core (Bot Framework cross-domain quiz)

- Status: Completed
- Questions Attempted: 12 (graded) + 2 skipped (broken options, now fixed)
- Correct: 12 / 12 (100%) — PERFECT SCORE!
- Time Spent: ~10.3 min quiz
- Skipped: tggEkigssu3zb844Wo2G (OnMembersAddedAsync hotspot — garbled options, now fixed), vWWq8vBrtX3SgSzR6PyZ (Adaptive Card hotspot — truncated options, now fixed)
- Key Mistakes: None — flawless run
- Topics covered: Content Moderator classification (Category 1), Bot Channels Registration (App ID + Password), Emulator settings (ngrok + v1.0 auth), Adaptive Cards, Composer dialog scope, Q&A alternative phrasing, Composer multi-bot dispatch (BCF), multilingual chatbot APIs (Sentiment + Detect Language)
- Domain 6 (cross-domain Bot Framework): 9/9 graded (100%)
- Domain 5 carryover: 3/3 (100%)
- Notes: _fill in your own words_
- Next action: Day 24 - Domain 6: Query and Enrichment

### Day 24 (2026-05-29) - Domain 6: Query and Enrichment

- Status: Completed
- Questions Attempted: 11 (graded) + 3 skipped (garbled hotspot options, now fixed)
- Correct: 10 / 11 (90.9%) — quiz scored 9/11 but travel chatbot Q had wrong answer key (was A, corrected to C; user answered C correctly)
- Time Spent: ~8.1 min quiz
- Skipped: NMI2S8rZcFiDHGEvawvI (OpenAI console app hotspot — options fixed), AGD750zD5ne6CzR1MRfD (Chat playground params hotspot — options fixed), 1sqHO0HzcRd1Nlv4wHaG (LLM definitions hotspot — options fixed to Yes/No format)
- Key Mistakes:
  - ICzikIAERFRO4FU8OhEA: Azure OpenAI "on your data" code — picked `AzureChatExtensionConfiguration` (B) instead of `AzureCognitiveSearchChatExtensionConfiguration` (C). The specific Search extension config class is needed, not the generic one.
- Answer key fixes applied: IlpzdeGWFEkeTSU5mXzL corrected A→C (Temperature=0 for accuracy), NMI2S8rZcFiDHGEvawvI options rewritten, 1sqHO0HzcRd1Nlv4wHaG options rewritten to Yes/No, Pt3w9pCNGVFFUtiGLZf7 options expanded to 4 boxes
- Topic 5 carryover: 4/4 (100%)
- Topic 6: 2/2 (100%)
- Topic 7: 4/5 graded answered (80%) + 3 skipped
- Notes: _fill in your own words_
- Next action: Day 25 - Domain 6: Semantic and Vector Search

### Day 25 (2026-05-30) - Domain 6: Semantic and Vector Search

- Status: Completed
- Questions Attempted: 13 (graded) + 1 skipped (garbled options, credited)
- Correct: 11 / 14 (78.6% adjusted)
- Raw Score: 9 / 13 (69.2%)
- Time Spent: ~7.3 min quiz
- Credited: 2 (Q9yZaZRalGtQmWjHR8mI — answer key wrong, user's A was correct per Highly Voted discussion; b3dBtUm3v75h2gV0tVz5 — garbled 3-box options for 2-dropdown hotspot, user knew answer)
- Key Mistakes:
  - gwsIQSZPu8cibMgPdECI: Picked D (Cognitive Services OpenAI Contributor) instead of A (Cognitive Services OpenAI User) — User role is least privilege for view endpoints + view models + generate content
  - PFarcFliASzPdwk45Nn1: Picked B (AzureDocumentIntelligence) instead of D (AzureCognitiveSearch) — "on your data" grounding uses Azure Cognitive Search as data source type, not Doc Intelligence
  - ICzikIAERFRO4FU8OhEA: Repeat miss from Day 24 — picked `AzureChatExtensionConfiguration` (generic) instead of `AzureCognitiveSearchChatExtensionConfiguration` (specific Search class)
- Answer key fixes applied: Q9yZaZRalGtQmWjHR8mI corrected C→A (Translator, not Orchestrator), b3dBtUm3v75h2gV0tVz5 options rewritten from garbled 3-box to correct 2-dropdown (ChatCompletion.create + response.choices[0].text)
- Day 25 assigned: 8/11 adjusted (72.7%)
- Day 24 carryover: 3/3 (100%) — NMI2S8rZcFiDHGEvawvI now correct, IlpzdeGWFEkeTSU5mXzL still correct
- Weak pattern: Azure OpenAI "on your data" extension config classes — missed twice (Day 24 + Day 25)
- Notes: _fill in your own words_
- Next action: Day 26 - Domain 6: Document Intelligence

### Day 26 (2026-05-31) - Domain 6: Document Intelligence (OpenAI + Content Safety quiz)

- Status: Completed
- Questions Attempted: 12 (graded) + 2 skipped (broken options, fixed mid-session)
- Correct: 11 / 12 (91.7% adjusted)
- Raw Score: 10 / 12 (83.3%)
- Time Spent: ~8.8 min quiz
- Credited: 1 (yWTIgbDzuiXoM1HDn2SP — answer key corrected E→A during session; user answered A correctly, file size trap: XLSX 200MB exceeds 100MB limit)
- Skipped: 2 (ySc713rLrB2m1vOp3N1F — duplicate user/temperature Q, options fixed; 7U635sBPXBJl2yUHep7f — QnA Maker RBAC, options fixed to actual dropdowns)
- Key Mistakes:
  - qB2JbI6mQxYp6LeEH510: Picked C (RankerType) instead of D (ScoreThreshold) — requirement says "confidence ≥ 70%", ScoreThreshold sets minimum confidence cutoff; RankerType switches ranking algorithm (unrelated)
- Option fixes applied: 4 questions rewritten (q9xO + ySc7 user/temperature dropdowns, yWTIgbDzuiXoM1HDn2SP answer key E→A, 7U635sBPXBJl2yUHep7f RBAC 3-box dropdowns)
- Topic 7 (OpenAI): 7/8 adjusted (87.5%)
- Topic 8 (Content Safety/QnA): 4/4 (100%)
- Notes: _fill in your own words_
- Next action: Day 27 - Domain 6: Content Understanding

### Day 27 (2026-06-01) - Domain 6: Content Understanding & Content Safety

- Status: Completed
- Questions Attempted: 14 (graded)
- Correct: 14 / 14 (100%) — PERFECT SCORE!
- Time Spent: ~5.3 min quiz
- Key Mistakes: None — flawless run
- Topics covered: Content Safety SDK (ContentSafetyClient, AnalyzeTextOptions), REST API (contentsafety/text:analyze), blocklists, jailbreak/prompt shields, Content Safety Studio features (Moderate text content vs Safety metaprompt vs Monitor online activity), image moderation (Content Safety + AI Vision)
- Carryover: Topic 9 (Computer Vision captioning, Video Indexer pipeline) 2/2 (100%), Topic 10 (Form Recognizer labeling) 1/1 (100%)
- Topic 8 (Content Safety): 11/11 (100%)
- Notes: _fill in your own words_
- Next action: Day 28 - Domain 6: Consolidation

### Day 28 (2026-06-02) - Domain 6: Consolidation

- Status: Completed
- Questions Attempted: 9 (graded) + 5 skipped (broken hotspot options, all fixed live during session)
- Correct: 8 / 9 (88.9%)
- Raw Score: 8 / 14 (57.1%) — depressed by skipped Qs
- Time Spent: ~8.4 min quiz
- Skipped (all fixed mid-session): MPgzeUdDCGnnoCGtkeGe (QnA Maker RBAC), SR2xMgYCGQKsm6JNkKG3 (Translator URI hotspot), Z0bXFl0VstaAKFmiPykK + cmfzGsVPqHQibIyHSCyd (Adaptive Card hotspots — duplicates), y9Zi9GjzdrqTnPW8taVo (Entity Recognition skill hotspot — 3rd box was invented; only 2 dropdowns exist)
- Key Mistakes:
  - P4nMr5NK2YJrJJeM7imu (Form Recognizer endpoints): picked B,E (custom model + Read v3.1 analyze) instead of B,C (custom model + prebuilt receipt) — for receipts use prebuilt-receipt endpoint, NOT generic /vision read; per-office customization confirms custom model + receipt prebuilt
- Fixed Questions: 5 hotspot/dropdown questions rewritten with actual dropdown values from question images (QnA RBAC roles, Translator base URLs, Adaptive Card language interpolation x2, EntityRecognitionSkill JSON)
- Bonus Fix: 6sKvXQJnlu00FLM7Y1fW (DRAG DROP video processing) — Step 4 was truncated to "Tr"; rewritten with full step labels
- Topic 9 (Video processing): 2/2 (100%) — carryover
- Topic 10 (Video Indexer, Form Recognizer): 2/2 (100%)
- Topic 12 (Form Recognizer JSON): 1/1 (100%)
- Topic 13 (AI Search autocomplete): 1/1 (100%)
- Topic 14 (AI Search skillsets, synonym maps): 2/3 graded (66.7%) — missed Form Recognizer endpoint choice
- Domain 6 final average (Days 23-28): 91.7%

### Day 29 (2026-06-03) - Buffer / Catch-up

- Status: Completed
- Questions Attempted: 7 (graded) + 1 review-only (skipped)
- Correct: 7 / 7 (100%)
- Time Spent: ~5 min quiz + study
- Key Mistakes: None — perfect remediation run!
- Focus: Cross-domain drill on weakest areas (Domains 2, 4, 5)
- Remediation topics: RAG fundamentals, Video/Spatial Analysis, Translation/Knowledge Mining
- Notes: _fill in your own words_
- Next action: Day 30 - Full Review 1 (Domains 1, 2, 5)
- Notes: _fill in your own words_
- Next action: Day 30 - Full Review 1 (Domains 1, 2, 5)

### Day 30 (2026-06-04) - Full Review 1 (Domains 1, 2, 5)

- Status: Completed
- Questions Attempted: 15 (graded) + 5 skipped (4 garbled AI-generated options, 1 excluded from grading)
- Correct: 12 / 15 (80.0%)
- Time Spent: ~11.7 min quiz
- Key Mistakes:
  - ARM template capacity: Picked deployment-level capacity (B) instead of account-level (A). 1 TPM unit ≈ 6 RPM; need 600 RPM → capacity 100 on accounts resource
  - PPE monitoring: Picked Computer Vision (B) instead of Face API (A). Face detection identifies masks/glasses removal with less dev effort
  - QnA Maker auto-created resources: Picked C,D instead of D,E. QnA Maker auto-creates Azure Search + Azure Web App (not Cosmos DB)
- Skipped (garbled options): Speech STT hotspot, Container sentiment hotspot, Search security hotspot, Language detection hotspot, Container on-prem deploy (excluded from grading)
- Review Domains: D1 (Plan & Manage), D2 (Generative AI), D5 (NLP) — combined ~50-60% of exam
- Notes: _fill in your own words_
- Next action: Day 31 - Full Review 2 (Domains 3, 4, 6)
