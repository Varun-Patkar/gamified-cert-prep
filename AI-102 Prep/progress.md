# Progress Tracker: Designing and Implementing a Microsoft Azure AI Solution (AI-102)

## Overall
- Sessions Completed: 5 / 32
- Questions Answered: 76 / 313
- Accuracy: 89.5%
- Current Streak: 5 days
- Next Session: Day 6 (2026-05-11)

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
