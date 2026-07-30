# Study Plan: GitHub Copilot (GH-300)

## Summary

- **Start Date:** 2026-07-09
- **Target Exam Date:** 2026-08-08 (Saturday)
- **Total Study Days:** 30 (Jul 9 – Aug 7), exam on Aug 8
- **User Level:** Intermediate-Advanced (daily Copilot user)
- **Strategy:** Skip beginner feature intro, focus on exam-specific nuances, responsible AI terminology, architecture, and privacy configuration

---

## Phase 1: Domain Foundations (Days 1–14)

### ~~Day 1 (2026-07-09) — Domain 1: Responsible AI (Full)~~ ✅ 28/29 (96.6%)

- [x] Study: Microsoft's 6 AI principles (Fairness, Reliability & Safety, Privacy & Security, Inclusiveness, Transparency, Accountability)
- [x] Study: Risks and limitations of generative AI tools; overreliance; hallucination
- [x] Study: Harm types and mitigation strategies
- [x] Study: Validating AI output; ethical usage; operating Copilot responsibly
- [x] Study: Difference between inclusiveness vs. fairness (common exam trap)
- [x] Practice: 29 questions on Domain 1 (--day-lock 1)
- Note: q027 wrong — offensive/unsafe content → Reliability & Safety (not Reliability alone)

### ~~Day 2 (2026-07-10) — Domain 2: IDE & Inline Suggestions~~

- [x] Study: Enabling Copilot in IDE (VS Code, JetBrains, Visual Studio)
- [x] Study: Inline suggestions, keyboard shortcuts (Tab, Esc, Alt+\, Alt+[, Alt+])
- [x] Study: Chat panel vs. inline chat; Plan Mode
- [x] Practice: 23 questions (--day-lock 2)
- Estimated time: 2 hrs

### ~~Day 3 (2026-07-11) — Domain 2: GitHub Copilot CLI~~ ✅ 23/26 (88.5%)

- [x] Study: `gh copilot suggest`, `gh copilot explain` commands
- [x] Study: CLI installation steps; interactive vs. session mode
- [x] Study: Script generation and file management via CLI
- [x] Practice: 26 questions (--day-lock 3 with 3 carryover)
- Note: Review q070 (GHEC does not bundle Copilot), q076 ("Copilot Premium" is not a plan), and q083 (code referencing has user and organization/enterprise scopes)
- Estimated time: 2 hrs

### ~~Day 4 (2026-07-12) — Domain 2: Agent Mode, Edit Mode, MCP~~ ✅ 24/26 (92.3%)

- [x] Study: Agent Mode capabilities (multi-step, tool use, MCP servers)
- [x] Study: Edit Mode (multi-file edits; differences from Agent Mode)
- [x] Study: Model Context Protocol (MCP) — what it is, how Copilot uses it
- [x] Study: Sub-agents and agent session management
- [x] Practice: 26 questions (--day-lock 4 with 3 carryover)
- Note: Review q133 (Business starts org-level governance; Enterprise inherits it) and q121 (safe secret prompts require explicit fail-fast and log-safe constraints)
- Estimated time: 2.5 hrs

### ~~Day 5 (2026-07-13) — Domain 2: Code Review, PR Summaries, Spaces~~ ✅ 25/26 (96.2%)

- [x] Study: Copilot Code Review feature; how to trigger, feedback mechanism
- [x] Study: Pull Request summaries; customizable review standards
- [x] Study: Copilot Spaces and Spark (what they are, when to use)
- [x] Practice: 26 questions (--day-lock 5 with 3 carryover; 25/26 = 96.2%)
- Note: Review q160 — organization-level repository/code access controls begin with Copilot Business; Enterprise inherits them and adds enterprise-level capabilities.
- Estimated time: 2 hrs

### ~~Day 6 (2026-07-14) — Domain 2: Org Policies, REST API, Audit~~ ✅ 24/26 (92.3%)

- [x] Study: Organization-wide Copilot policy management
- [x] Study: Enabling/disabling features by policy (business vs. enterprise)
- [x] Study: Audit log events for Copilot; REST API subscription management
- [x] Practice: 26 questions (--day-lock 6 with 3 carryover; 24/26 = 92.3%)
- Note: Review q196 and q206 — Copilot Free includes IDE agent mode, but cloud/coding agent is available only with paid Copilot plans.
- Estimated time: 2 hrs

### ~~Day 7 (2026-07-15) — Domain 2: Catch-up & Overflow~~ ✅ 25/26 (96.2%)

- [x] Study: Edit mode vs Agent mode vs coding agent decision matrix; coding-agent safety guardrails
- [x] Study: PR summaries/review suggestions (advisory), branch protections & CODEOWNERS, policy hierarchy, repository-aware chat
- [x] Study: Slash commands review (/explain, /fix, /test, /doc, /new), chat participants (@workspace, @github, @terminal, @vscode), `.github/copilot-instructions.md`
- [x] Practice: 26 questions (--day-lock 7 with 3 carryover; 25/26 = 96.2%)
- Note: Review q235 — **Edit mode** = targeted, reviewable diffs on a small, well-scoped change; multi-step edits + commands + PR = **Agent mode**.
- Estimated time: 2 hrs

### ~~Day 8 (2026-07-16) — Domain 3: Data & Architecture~~ ✅ 9/10 (90%)

- [x] Study: How Copilot builds prompts (surrounding code, open files, cursor position)
- [x] Study: Proxy filtering and post-processing pipeline
- [x] Study: Data flow: user input → proxy → LLM → response → IDE
- [x] Study: LLM limitations; nondeterminism; token limits; hallucination
- [x] Practice: 10 questions (--day-lock 8 with 3 D2 carryover; 9/10 = 90%)
- Note: Review q214 — Copilot prompts + allowed context are processed by the **Copilot cloud service**, which relays the request to the selected AI model (shaped by content-exclusion/policy) — **not** local-only, GHES-only, or CI-runner processing.
- Lab: Read https://docs.github.com/en/copilot/overview-of-github-copilot/about-github-copilot-individual
- Estimated time: 2 hrs

### ~~Day 9 (2026-07-17) — Domain 4: Prompt Engineering Part 1~~ ✅ 14/14 (100%)

- [x] Study: Prompt structure (instruction, context, input data, output indicator)
- [x] Study: Zero-shot vs. few-shot vs. one-shot prompting
- [x] Study: How Copilot determines context (open tabs, file type, comments)
- [x] Practice: 11 questions + 3 D3 carryover (--day-lock 9; 14/14 = 100%)
- Estimated time: 1.5 hrs

### ~~Day 10 (2026-07-18) — Domain 4: Prompt Engineering Part 2~~ ✅ 13/13 (100%)

- [x] Study: Best practices (specific, contextual, iterative, divide complex tasks)
- [x] Study: Chat history usage in multi-turn conversations
- [x] Study: Prompt engineering principles for Copilot Chat vs. inline
- [x] Practice: 10 assigned questions + 3 carryover (--day-lock 10; 13/13 = 100%)
- Note: Perfect run in 3m 29s; no weak areas identified.
- Estimated time: 1.5 hrs

### ~~Day 11 (2026-07-19) — Domain 5: Developer Productivity Part 1~~ ✅ 17/18 (94.4%)

- [x] Study: Code generation patterns, refactoring with Copilot
- [x] Study: Documentation generation; inline docs vs. docstrings
- [x] Study: Legacy code modernization; sample data generation
- [x] Practice: 15 assigned questions + 3 D4 carryover (--day-lock 11; 17/18 = 94.4%)
- Note: Review q138 — exploring unfamiliar APIs and libraries is an advanced developer use case; non-development HR, legal, and administrative workflows are outside Copilot's coding-assistant scope.
- Estimated time: 2 hrs

### ~~Day 12 (2026-07-20) — Domain 5: Developer Productivity Part 2~~ ✅ 17/18 (94.4%)

- [x] Study: Test generation (unit, integration); edge cases and assertions
- [x] Study: Security improvement suggestions; performance optimizations
- [x] Study: Accelerating learning, reducing context switching
- [x] Practice: 15 assigned questions + 3 carryover (--day-lock 12; 17/18 = 94.4%)
- Note: Review q227 — Copilot can draft and refine test code, but CI/test execution is performed by the configured automation pipeline, such as GitHub Actions.
- Estimated time: 2 hrs

### ~~Day 13 (2026-07-21) — Domain 6: Privacy & Content Exclusions Part 1~~ ✅ 16/17 (94.1%)

- [x] Study: Content exclusion configuration (repository vs. org level)
- [x] Study: Current GitHub settings and REST API path rules (`fnmatch`); `.copilotignore` is not a documented exclusion mechanism
- [x] Study: Duplication detection ("Suggestions matching public code") — scopes
- [x] Practice: 14 assigned questions + 3 D5 carryover (--day-lock 13; 16/17 = 94.1%)
- Note: Review q140 — similar or near-matching public-code output maps to code referencing / suggestions matching public code; content exclusion only bounds input context.
- Estimated time: 2 hrs

### ~~Day 14 (2026-07-22) — Domain 6: Privacy & Content Exclusions Part 2~~ ✅ 13/16 (81.3%)

- [x] Study: Output ownership and copyright considerations
- [x] Study: Telemetry settings (user-level vs. org-level opt-out)
- [x] Study: Data retention policies; Business vs. Enterprise privacy guarantees
- [x] Practice: 13 assigned questions + 3 D6 carryover (--day-lock 14; 13/16 = 81.3%)
- Note: Distracted workday (21m 51s). Review q150 — duplication detection handles exact long public-code matches; q165 — Copilot Business is the first plan with organization-admin public-code matching policy; q169 — repository-level content exclusions are available with Copilot Business and Enterprise.
- Estimated time: 1.5 hrs

---

## Phase 2: Consolidation & Cross-Domain (Days 15–17)

### ~~Day 15 (2026-07-23) — D1 + D3 + D4 Consolidation~~ ✅ 21/22 (95.5%)

- [x] Review: Responsible AI principles cheat sheet
- [x] Review: Data flow diagram + architecture notes
- [x] Review: Prompt engineering patterns
- [x] Practice: 22 questions cross-domain D1/D3/D4 (--day-lock 15; 21/22 = 95.5%)
- Note: Review q122 — best "explain a file" prompt fixes **audience** (new backend hire), **sections** (purpose, data flows, dependencies, risks), AND **length cap** (5 bullets). An unbounded "thorough explanation, no strict length limit" is weaker for onboarding.
- Estimated time: 2 hrs

### ~~Day 16 (2026-07-24) — D1 + D3 + D4 Assignment Consolidation~~ ✅ 20/21 adjusted (95.2%)

- [x] Review: Responsible AI principle selection and coding-agent boundaries
- [x] Review: Content-exclusion plan scope and constrained prompt patterns
- [x] Practice: 19 assigned questions + 3 carryover (--day-lock 16; raw 20/22, adjusted 20/21 after excluding q118 input glitch)
- Note: The plan originally labeled Day 16 as D5+D6, but `day-assignments.json` supplied D1/D3/D4 questions. Genuine miss: q124 — CI-ready output requires format + schema + no prose.
- Estimated time: 2 hrs

### ~~Day 17 (2026-07-25) — D1 + D4 Assignment Consolidation~~ ✅ 19/22 (86.4%)

- Note: `plan.md` labeled this "D2 Deep Review," but `day-assignments.json` supplied D1 (11) + D4 (7) + D3 (1) questions. Strict quiz alignment takes precedence; the session taught the actual D1/D4/D3 assignment.
- [x] Review: Responsible AI principle decision table (Fairness vs Inclusiveness vs Transparency)
- [x] Review: Content-safety filters vs. code referencing; private-code training boundaries
- [x] Practice: 19 assigned + 3 carryover (--day-lock 17; 19/22 = 86.4%)
- Note: Distracted run (28m 42s). Wrong: q009 + q019 — "bias / representative data" = **Fairness**, not Transparency. q124 repeat miss — CI-ready output = format + schema + "no prose". **Drill q124 again.**
- Estimated time: 2 hrs

---

## Phase 3: Mock Exam Rounds (Days 18–27)

### ~~Day 18 (2026-07-26) — Mock Round 1 (All Domains)~~ ✅ 26/27 (96.3%)

- [x] Practice: 27 questions mixed all domains (--day-lock 18)
- [x] Review wrong answers thoroughly
- Note: Only miss was **q019 (Fairness)** — 3rd repeat miss. "Prevent discrimination / unbiased & representative training data" = **Fairness**, NOT Transparency. Drill before exam.
- Estimated time: 2 hrs

### ~~Day 19 (2026-07-27) — Mock Round 2 + Review~~ ✅ 28/28 (100%)

- [x] Practice: 28 questions (--day-lock 19)
- [x] Target weak areas from Day 18 results
- Note: 🏆 Perfect run (11m 37s). D2 18/18, D4 4/4, D1 4/4, D3 1/1, D6 1/1. **q009 (Fairness) finally correct** — broke the 4-miss Fairness streak. Keep force-correcting the Transparency instinct on exam day.
- Estimated time: 2 hrs

### ~~Day 20 (2026-07-28) — Mock Round 3~~ ✅ 26/28 (92.9%) _(completed early on 07-27)_

- [x] Practice: 28 questions (--day-lock 20)
- [x] Review wrong answers
- Note: Both misses = **"Business is the baseline" plan-tier trap** — chose Enterprise, correct = Business. q169 (repo-level content exclusion) and q165 (org-admin code-suggestion policy) both begin at **Copilot Business**; Enterprise only adds cross-org enforcement. Drill: "org admin sets policy / repo exclusion" → **Business**.
- Estimated time: 1.5 hrs

### ~~Day 21 (2026-07-29) — Mock Round 4~~ ✅ 26/28 adjusted (92.9%) _(done early on 07-28)_

- [x] Practice: 28 questions (--day-lock 21; raw 25/28, adjusted 26/28 crediting q177 finger-slip)
- Note: Two genuine misses, both repeat traps. q160 — org control over which repos/code Copilot can access = **Copilot Business** (baseline), NOT Enterprise. q124 — CI-ready output prompt must specify **format + exact schema + "no prose"** (correct = JSON array with fields, no prose). Drill both hard before exam day.
- Estimated time: 1.5 hrs

### ~~Day 22 (2026-07-30) — Mock Round 5~~ ✅ 26/28 (92.9%) _(completed early on 07-29)_

- [x] Practice: 28 questions (--day-lock 22; 26/28 = 92.9% in 7m 34s)
- [x] Review wrong answers
- Note: D1 5/5, D3 1/1, D4 2/2, D5 3/3, D6 3/3 perfect; D2 12/14. Both misses were an **over-correction of the "Business is baseline" drill** — chose the lower tier when the stem pointed higher. q053 (2nd miss, also Day 2): "GHEC + advanced compliance/audit/identity + GitHub.com repo-aware Chat" = **Copilot Enterprise**. q050: the free 30-day GHEC trial **includes Copilot Business** (not Free, not "requires separate purchase"). **Tier rule is directional:** Business = org admin controls / policies / audit logs / repo-level exclusions; Enterprise = GHEC-scoped advanced compliance + identity + GitHub.com repo-aware Chat.
- Estimated time: 1.5 hrs

### ~~Day 23 (2026-07-31) — Responsible AI Focus Review~~ ✅ 26/28 (92.9%) _(completed early on 07-30)_

- [x] Deep dive: All 6 AI principles with scenarios — `sessions/day-23-responsible-ai-focus-review.md`
- [x] Practice: 28 questions (--day-lock 23; 26/28 = 92.9% in 12m 19s)
- [x] Review wrong answers
- Note: D1 1/1, D3 1/1, D4 2/2, D5 3/3, D6 4/4 perfect; D2 15/17. Fairness/Transparency and the Business-vs-Enterprise control rule both held clean. Misses were plan-identity facts: q031 — free access for **verified students/teachers/OSS maintainers = Copilot Pro**, not Copilot Free. q154 — **Copilot is not supported on GHES**; it is cloud-only and requires GitHub.com or GHEC (Enterprise = GHEC, never GHES).
- Estimated time: 2 hrs

### Day 24 (2026-08-01) — D2/D3 Focus Review

- [ ] Review: Feature-heavy domain — Agent Mode, MCP, CLI specifics
- [ ] Practice: 25 questions (--day-lock 24)
- Estimated time: 2 hrs

### Day 25 (2026-08-02) — D4/D5 Focus Review

- [ ] Review: Prompt engineering nuances; productivity patterns
- [ ] Practice: 25 questions (--day-lock 25)
- Estimated time: 2 hrs

### Day 26 (2026-08-03) — D6 Focus + Config Review

- [ ] Review: Privacy settings matrix; content exclusion gotchas
- [ ] Practice: 25 questions (--day-lock 26)
- Estimated time: 2 hrs

### Day 27 (2026-08-04) — Full Timed Mock

- [ ] Mock exam: --all mode, timed 100 minutes, track score
- [ ] Review: All wrong answers
- Estimated time: 2.5 hrs

---

## Phase 4: Final Revision (Days 28–30)

### Day 28 (2026-08-05) — Targeted Weak Areas

- [ ] Identify lowest-scoring domains from Day 27 mock
- [ ] Practice: 25 questions on those domains
- [ ] Review final-last-minute-revision notes
- Estimated time: 2 hrs

### Day 29 (2026-08-06) — Light Review

- [ ] Skim topics.md key facts table
- [ ] Practice: 25 questions light run (--all, stop early if fatigued)
- [ ] Prep exam logistics (ID, location, system check)
- Estimated time: 1.5 hrs

### Day 30 (2026-08-07) — Rest Day

- [ ] Light skim of topics.md cheat sheet (30 min max)
- [ ] No new material — rest and confidence building
- [ ] Ensure exam slot confirmed for tomorrow
- Estimated time: 30 min

**EXAM DAY: 2026-08-08** — GitHub Copilot GH-300 🎯

---

## Quick Reference: Quiz Runner Commands

```bash
# Daily study (day-locked)
python quiz_runner.py questions.json --day-lock <N>

# Domain-specific practice
python quiz_runner.py questions.json --domain <1-6>

# Full mock exam
python quiz_runner.py questions.json --all

# Web UI mode
python quiz_web.py questions.json
```
