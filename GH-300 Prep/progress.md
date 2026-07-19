# Progress Tracker: GitHub Copilot (GH-300)

## Overall

- Sessions Completed: 11 / 30
- Questions Answered: 237 / 252
- Accuracy: 94.5%
- Target Exam Date: 2026-08-08

## Domain Progress

| Domain                               | Questions | Answered | Accuracy |
| ------------------------------------ | --------- | -------- | -------- |
| D1 - Responsible AI (15-20%)         | 29        | 29       | 100% ✅  |
| D2 - Features (25-30%)               | 138       | 156      | 93.6%    |
| D3 - Data & Architecture (10-15%)    | 7         | 7        | 85.7%    |
| D4 - Prompt Engineering (10-15%)     | 21        | 27       | 100% ✅  |
| D5 - Developer Productivity (10-15%) | 30        | 15       | 93.3%    |
| D6 - Privacy & Config (10-15%)       | 27        | 0        | N/A      |

## Daily Log

| Day | Date       | Topic                                                              | Q   | Correct | Accuracy | Notes                                                                                                                                                                                  |
| --- | ---------- | ------------------------------------------------------------------ | --- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 2026-07-09 | D1 Responsible AI                                                  | 29  | 28      | 96.6%    | Wrong: q027 (offensive content → Reliability & Safety)                                                                                                                                 |
| 2   | 2026-07-10 | D2 Copilot Plans & Licensing                                       | 23  | 22      | 95.7%    | Wrong: q053 (chose Business A, correct Enterprise B — confused audit logs as Enterprise-only)                                                                                          |
| 3   | 2026-07-11 | D2 Copilot CLI, Plans & Governance                                 | 26  | 23      | 88.5%    | Wrong: q070 (GHEC does NOT bundle Copilot; 30-day trial only), q076 ("Copilot Premium" is not a real plan), q083 (code referencing = user + org/enterprise scopes)                     |
| 4   | 2026-07-12 | D2 Agent Mode, Edit Mode & MCP                                     | 26  | 24      | 92.3%    | Wrong: q133 (Business is baseline for org controls; Enterprise inherits them), q121 (safe secret prompt: no hardcoding, fail fast, log-safe)                                           |
| 5   | 2026-07-13 | D2 Code Review, PR Summaries, Spaces & Spark                       | 26  | 25      | 96.2%    | Wrong: q160 (organization-wide repository/code controls start with Business; Enterprise inherits and extends them)                                                                     |
| 6   | 2026-07-14 | D2 Copilot Cloud Agent & Governance                                | 26  | 24      | 92.3%    | Wrong: q196, q206 (Free includes IDE agent mode, not cloud/coding agent; cloud agent requires a paid Copilot plan)                                                                     |
| 7   | 2026-07-15 | D2 Catch-up & Overflow (Edit vs Agent, agent safety, PR review)    | 26  | 25      | 96.2%    | Wrong: q235 (chose Agent-mode description; Edit mode = targeted, reviewable diffs on a small, well-scoped change)                                                                      |
| 8   | 2026-07-16 | D3 Data & Architecture (data flow, privacy, prompting, exclusions) | 10  | 9       | 90.0%    | Wrong: q214 (chose CI-runners; correct = Copilot cloud service relays prompts+context to the AI model — not local/GHES/CI)                                                             |
| 9   | 2026-07-17 | D4 Prompt Engineering Part 1 (+3 D3 carryover)                     | 14  | 14      | 100%     | Perfect run. Reinforced q214 (cloud service processing), q215 (private code not used to train shared models by default), q232 (fix flaky tests at root — mocks/deterministic fixtures) |
| 10  | 2026-07-18 | D4 Prompt Engineering Part 2 (+3 carryover)                        | 13  | 13      | 100%     | Perfect run in 3m 29s. Strong on precise constraints, bounded refactors, structured output, performance, security, privacy, and multi-turn prompting.                                  |
| 11  | 2026-07-19 | D5 Developer Productivity Part 1 (+3 D4 carryover)                 | 18  | 17      | 94.4%    | Wrong: q138 (advanced developer use case = exploring unfamiliar APIs/libraries; HR, legal, and administrative automation are outside Copilot's coding-assistant scope)                 |
