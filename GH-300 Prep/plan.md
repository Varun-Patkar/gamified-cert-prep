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

### Day 6 (2026-07-14) — Domain 2: Org Policies, REST API, Audit

- [ ] Study: Organization-wide Copilot policy management
- [ ] Study: Enabling/disabling features by policy (business vs. enterprise)
- [ ] Study: Audit log events for Copilot; REST API subscription management
- [ ] Practice: 23 questions (--day-lock 6)
- Estimated time: 2 hrs

### Day 7 (2026-07-15) — Domain 2: Catch-up & Overflow

- [ ] Study: Slash commands comprehensive review (/explain, /fix, /test, /doc, /new)
- [ ] Study: Chat participants (@workspace, @github, @terminal, @vscode)
- [ ] Study: Prompt file reuse (`.github/copilot-instructions.md`)
- [ ] Practice: 23 questions (--day-lock 7)
- Estimated time: 2 hrs

### Day 8 (2026-07-16) — Domain 3: Data & Architecture

- [ ] Study: How Copilot builds prompts (surrounding code, open files, cursor position)
- [ ] Study: Proxy filtering and post-processing pipeline
- [ ] Study: Data flow: user input → proxy → LLM → response → IDE
- [ ] Study: LLM limitations; nondeterminism; token limits; hallucination
- [ ] Practice: 7 questions (--day-lock 8) — light quiz, spend more time on concepts
- Lab: Read https://docs.github.com/en/copilot/overview-of-github-copilot/about-github-copilot-individual
- Estimated time: 2 hrs

### Day 9 (2026-07-17) — Domain 4: Prompt Engineering Part 1

- [ ] Study: Prompt structure (instruction, context, input data, output indicator)
- [ ] Study: Zero-shot vs. few-shot vs. one-shot prompting
- [ ] Study: How Copilot determines context (open tabs, file type, comments)
- [ ] Practice: 11 questions (--day-lock 9)
- Estimated time: 1.5 hrs

### Day 10 (2026-07-18) — Domain 4: Prompt Engineering Part 2

- [ ] Study: Best practices (specific, contextual, iterative, divide complex tasks)
- [ ] Study: Chat history usage in multi-turn conversations
- [ ] Study: Prompt engineering principles for Copilot Chat vs. inline
- [ ] Practice: 10 questions (--day-lock 10)
- Estimated time: 1.5 hrs

### Day 11 (2026-07-19) — Domain 5: Developer Productivity Part 1

- [ ] Study: Code generation patterns, refactoring with Copilot
- [ ] Study: Documentation generation; inline docs vs. docstrings
- [ ] Study: Legacy code modernization; sample data generation
- [ ] Practice: 15 questions (--day-lock 11)
- Estimated time: 2 hrs

### Day 12 (2026-07-20) — Domain 5: Developer Productivity Part 2

- [ ] Study: Test generation (unit, integration); edge cases and assertions
- [ ] Study: Security improvement suggestions; performance optimizations
- [ ] Study: Accelerating learning, reducing context switching
- [ ] Practice: 15 questions (--day-lock 12)
- Estimated time: 2 hrs

### Day 13 (2026-07-21) — Domain 6: Privacy & Content Exclusions Part 1

- [ ] Study: Content exclusion configuration (repository vs. org level)
- [ ] Study: `.copilotignore` file syntax and behavior
- [ ] Study: Duplication detection ("Suggestions matching public code") — scopes
- [ ] Practice: 14 questions (--day-lock 13)
- Estimated time: 2 hrs

### Day 14 (2026-07-22) — Domain 6: Privacy & Content Exclusions Part 2

- [ ] Study: Output ownership and copyright considerations
- [ ] Study: Telemetry settings (user-level vs. org-level opt-out)
- [ ] Study: Data retention policies; Business vs. Enterprise privacy guarantees
- [ ] Practice: 13 questions (--day-lock 14)
- Estimated time: 1.5 hrs

---

## Phase 2: Consolidation & Cross-Domain (Days 15–17)

### Day 15 (2026-07-23) — D1 + D3 + D4 Consolidation

- [ ] Review: Responsible AI principles cheat sheet
- [ ] Review: Data flow diagram + architecture notes
- [ ] Review: Prompt engineering patterns
- [ ] Practice: 19 questions cross-domain D1/D3/D4 (--day-lock 15)
- Estimated time: 2 hrs

### Day 16 (2026-07-24) — D5 + D6 Consolidation

- [ ] Review: Productivity patterns; test gen; security hints
- [ ] Review: Privacy settings comparison table (Free vs. Pro vs. Business vs. Enterprise)
- [ ] Practice: 19 questions cross-domain D5/D6 (--day-lock 16)
- Estimated time: 2 hrs

### Day 17 (2026-07-25) — D2 Deep Review

- [ ] Review: D2 is 25-30% of exam — revisit weak areas from days 2-7
- [ ] Focus: MCP, Agent Mode, Edit Mode, org policies (most commonly tested)
- [ ] Practice: 19 questions D2 focused (--day-lock 17)
- Estimated time: 2 hrs

---

## Phase 3: Mock Exam Rounds (Days 18–27)

### Day 18 (2026-07-26) — Mock Round 1 (All Domains)

- [ ] Practice: 25 questions mixed all domains (--day-lock 18)
- [ ] Review wrong answers thoroughly
- Estimated time: 2 hrs

### Day 19 (2026-07-27) — Mock Round 2 + Review

- [ ] Practice: 25 questions (--day-lock 19)
- [ ] Target weak areas from Day 18 results
- Estimated time: 2 hrs

### Day 20 (2026-07-28) — Mock Round 3

- [ ] Practice: 25 questions (--day-lock 20)
- Estimated time: 1.5 hrs

### Day 21 (2026-07-29) — Mock Round 4

- [ ] Practice: 25 questions (--day-lock 21)
- Estimated time: 1.5 hrs

### Day 22 (2026-07-30) — Mock Round 5

- [ ] Practice: 25 questions (--day-lock 22)
- Estimated time: 1.5 hrs

### Day 23 (2026-07-31) — Responsible AI Focus Review

- [ ] Deep dive: All 6 AI principles with scenarios
- [ ] Practice: 25 questions with D1 bias (--day-lock 23)
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
