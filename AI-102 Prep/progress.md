# Progress Tracker: Designing and Implementing a Microsoft Azure AI Solution (AI-102)

## Overall

- Sessions Completed: 16 / 32
- Questions Answered: 218 / 313
- Accuracy: 86.7%
- Current Streak: 16 days
- Next Session: Day 17 (2026-05-22)

## Milestones

- [x] Domain 1 completed (Days 1-5, avg 90.3%)
- [ ] Domain 2 completed
- [ ] Domain 3 completed
- [ ] Domain 4 completed
- [ ] Domain 5 completed
- [ ] Domain 6 completed
- [ ] Buffer day completed
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
