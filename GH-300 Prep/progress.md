# Progress Tracker: GitHub Copilot (GH-300)

## Overall

- Sessions Completed: 16 / 30
- Questions Answered: 331 / 252
- Accuracy: 94.0%
- Target Exam Date: 2026-08-08

## Domain Progress

| Domain                               | Questions | Answered | Accuracy |
| ------------------------------------ | --------- | -------- | -------- |
| D1 - Responsible AI (15-20%)         | 29        | 49       | 100% ✅  |
| D2 - Features (25-30%)               | 138       | 156      | 93.6%    |
| D3 - Data & Architecture (10-15%)    | 7         | 13       | 92.3%    |
| D4 - Prompt Engineering (10-15%)     | 21        | 41       | 95.1%    |
| D5 - Developer Productivity (10-15%) | 30        | 36       | 94.4%    |
| D6 - Privacy & Config (10-15%)       | 27        | 33       | 87.9%    |

## Daily Log

| Day | Date       | Topic                                                              | Q    | Correct | Accuracy | Notes                                                                                                                                                                                                                           |
| --- | ---------- | ------------------------------------------------------------------ | ---- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 2026-07-09 | D1 Responsible AI                                                  | 29   | 28      | 96.6%    | Wrong: q027 (offensive content → Reliability & Safety)                                                                                                                                                                          |
| 2   | 2026-07-10 | D2 Copilot Plans & Licensing                                       | 23   | 22      | 95.7%    | Wrong: q053 (chose Business A, correct Enterprise B — confused audit logs as Enterprise-only)                                                                                                                                   |
| 3   | 2026-07-11 | D2 Copilot CLI, Plans & Governance                                 | 26   | 23      | 88.5%    | Wrong: q070 (GHEC does NOT bundle Copilot; 30-day trial only), q076 ("Copilot Premium" is not a real plan), q083 (code referencing = user + org/enterprise scopes)                                                              |
| 4   | 2026-07-12 | D2 Agent Mode, Edit Mode & MCP                                     | 26   | 24      | 92.3%    | Wrong: q133 (Business is baseline for org controls; Enterprise inherits them), q121 (safe secret prompt: no hardcoding, fail fast, log-safe)                                                                                    |
| 5   | 2026-07-13 | D2 Code Review, PR Summaries, Spaces & Spark                       | 26   | 25      | 96.2%    | Wrong: q160 (organization-wide repository/code controls start with Business; Enterprise inherits and extends them)                                                                                                              |
| 6   | 2026-07-14 | D2 Copilot Cloud Agent & Governance                                | 26   | 24      | 92.3%    | Wrong: q196, q206 (Free includes IDE agent mode, not cloud/coding agent; cloud agent requires a paid Copilot plan)                                                                                                              |
| 7   | 2026-07-15 | D2 Catch-up & Overflow (Edit vs Agent, agent safety, PR review)    | 26   | 25      | 96.2%    | Wrong: q235 (chose Agent-mode description; Edit mode = targeted, reviewable diffs on a small, well-scoped change)                                                                                                               |
| 8   | 2026-07-16 | D3 Data & Architecture (data flow, privacy, prompting, exclusions) | 10   | 9       | 90.0%    | Wrong: q214 (chose CI-runners; correct = Copilot cloud service relays prompts+context to the AI model — not local/GHES/CI)                                                                                                      |
| 9   | 2026-07-17 | D4 Prompt Engineering Part 1 (+3 D3 carryover)                     | 14   | 14      | 100%     | Perfect run. Reinforced q214 (cloud service processing), q215 (private code not used to train shared models by default), q232 (fix flaky tests at root — mocks/deterministic fixtures)                                          |
| 10  | 2026-07-18 | D4 Prompt Engineering Part 2 (+3 carryover)                        | 13   | 13      | 100%     | Perfect run in 3m 29s. Strong on precise constraints, bounded refactors, structured output, performance, security, privacy, and multi-turn prompting.                                                                           |
| 11  | 2026-07-19 | D5 Developer Productivity Part 1 (+3 D4 carryover)                 | 18   | 17      | 94.4%    | Wrong: q138 (advanced developer use case = exploring unfamiliar APIs/libraries; HR, legal, and administrative automation are outside Copilot's coding-assistant scope)                                                          |
| 12  | 2026-07-20 | D5 Developer Productivity Part 2 (+3 carryover)                    | 18   | 17      | 94.4%    | Wrong: q227 (Copilot drafts and refines tests; CI/test execution belongs to the configured automation pipeline, such as GitHub Actions)                                                                                         |
| 13  | 2026-07-21 | D6 Privacy & Content Exclusions Part 1 (+3 D5 carryover)           | 17   | 16      | 94.1%    | Wrong: q140 (similar or near-matching public-code output is governed by code referencing / suggestions matching public code; content exclusion controls input context)                                                          |
| 14  | 2026-07-22 | D6 Privacy & Content Exclusions Part 2 (+3 D6 carryover)           | 16   | 13      | 81.3%    | Distracted workday (21m 51s). Wrong: q150 (exact long public-code matches use duplication detection), q165 (Business starts org-admin matching policy), q169 (Business/Enterprise support repository-level content exclusions). |
| 15  | 2026-07-23 | D1+D3+D4 Consolidation (cross-domain)                              | 22   | 21      | 95.5%    | Strong run (12m 50s). D1 8/8, D3 4/4, D6 3/3, D4 6/7. Wrong: q122 (best explain-a-file prompt = D, which fixes audience + sections + length cap; picked C, which omits the length cap and audience scope).                      |
| 16  | 2026-07-24 | D1+D3+D4 Assignment Consolidation                                  | 21\* | 20      | 95.2%\*  | Raw runner: 20/22 (90.9%) in 6m 55s. q118 excluded due to terminal input glitch; genuine miss: q124 (CI-ready output must specify machine-readable format + exact schema + no prose). D1 12/12, D3 2/2, D4 6/7 adjusted.        |

\* Adjusted grading excludes q118 only; the raw result remains unchanged in `session-results.json`.
