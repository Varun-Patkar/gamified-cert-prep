# Progress Tracker: Designing and Implementing a Microsoft Azure AI Solution (AI-102)

## Overall

- Sessions Completed: 9 / 32
- Questions Answered: 130 / 313
- Accuracy: 87.7%
- Current Streak: 9 days
- Next Session: Day 10 (2026-05-15)

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
