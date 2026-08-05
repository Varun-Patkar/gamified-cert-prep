# Day 29: Light Review — Final Consolidation & Exam Logistics

**Date**: 2026-08-06
**Domain**: All (D1–D6) — light reinforcement, no new material
**Subtopics**: 6 recurring trap patterns, all-domain cheat sheet, exam-day logistics
**Estimated study time**: 1.5 hrs (stop early if fatigued — you are exam-ready at 94.4%)

---

## TL;DR (60-second skim)

- **You are ready.** 28/30 sessions, 94.4% overall, three perfect runs in the last two weeks. Today is reinforcement, not cramming.
- The **only** things that have caused misses recently are **6 known trap patterns** (below) — all are stem-reading slips, not knowledge gaps.
- **Directional plan-tier rule** is the #1 recurring theme: no org controls → **Pro**; org admin/policy/audit/repo-exclusion → **Business**; GHEC-scoped enterprise-wide compliance + repo-aware Chat → **Enterprise**. Match the stem's signals — don't over-correct up or down.
- **Read every option fully** before selecting — your data shows skimming (not speed) causes every miss.
- **Exam logistics**: GH-300 is a **closed-book Pearson VUE proctored exam**. **MS Learn is NOT available** during it (it's a GitHub cert; no resources allowed). Have a **government photo ID** (name matching your registration), an **empty walled room**, single monitor, ≥6 Mbps. Check-in opens **30 min early** with a 360° room scan.
- ⚠️ **Heads-up**: the English GH-300 was refreshed on **Aug 7, 2026** (day before your exam). Your prep already tracks the "Skills measured as of August 7, 2026" study guide — so you're aligned, but expect current wording.

---

## Learning Objectives

After this session you should be able to:

- Instantly classify any plan-tier scenario without over-correcting.
- Separate the three content controls (exclusion / referencing / duplication) on sight.
- Reflexively pick **Fairness** on bias/representative-data stems.
- Spot CI-ready-output and negation stems and answer them correctly.
- Walk into the exam knowing exactly what ID, room, and system setup you need.

---

## The 6 Trap Patterns (force-correct these)

### 1. Directional plan-tier rule (biggest recurring theme)

The rule is **directional** — read the stem's explicit signals and match the tier. Do NOT default to "always Business."

| Stem signal                                                                                                                                   | Correct plan                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| "single dev / personal / **no** org controls / no policy management"                                                                          | **Copilot Pro** (unlimited completions, cloud agent, code review) |
| Verified **student / teacher / OSS maintainer** free benefit                                                                                  | **Copilot Pro** (free for verified) — _not_ Copilot Free          |
| "org admin controls / policy management / audit logs / **repo-level content exclusion** / centralized billing / no training on org code"      | **Copilot Business** (baseline for org governance)                |
| "GHEC-scoped advanced compliance/identity + GitHub.com **repo-aware Chat** + PR summaries + enterprise-wide enforcement across multiple orgs" | **Copilot Enterprise** (requires GitHub Enterprise Cloud)         |

- **Trap firing UP**: stem names no org controls → pick **Pro**, not Business.
- **Trap firing DOWN**: stem adds GHEC + repo-aware Chat + advanced compliance → pick **Enterprise**, not Business.
- **Enterprise only when** the stem explicitly adds enterprise identity/compliance/network requirements or "across multiple orgs."

### 2. The three-control split (D6 — your weakest domain, now clean)

| Control                                                   | Governs                                                        | Behavior                                                                                                                |
| --------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Content exclusion**                                     | **INPUT** — which files/repos/paths/globs Copilot may **read** | Blocks context; targets repos/paths/file types (**not branches**). Business/Enterprise feature.                         |
| **Code referencing** ("suggestions matching public code") | **Similar OUTPUT**                                             | **Shows** the suggestion **with references/links** to matching public code — never blocks.                              |
| **Duplication detection**                                 | **Exact OUTPUT**                                               | **Blocks** ~150+ char **exact** matches to public code. **Length-based, license-blind** — does **no** license analysis. |

- Exact ~150+ char match → **duplication detection blocks** (ignores the repo's license file).
- Similar-but-not-exact → **code referencing shows** references.
- "Which files can Copilot see?" → **content exclusion**.

### 3. Fairness vs Transparency (D1 — broke a 4-miss streak, keep force-correcting)

- "prevent discrimination / unbiased / representative training data / avoid bias" = **Fairness**. **Never Transparency.**
- Transparency = users understand _how/why_ the AI produced output and its limitations.
- Reflex: see "bias / representative data / discrimination" → answer **Fairness** without hesitating.

### 4. CI-ready / machine-readable output prompt (D4 — repeat miss, drill it)

- A good CI/machine-consumable prompt must specify **(a) format + (b) exact schema/named fields + (c) "no prose"** (e.g., "return a JSON array with fields `id`, `status`, `message`; no explanation").
- A human-readable report/summary is **wrong** for CI-ready stems.

### 5. Negation / "when NOT / least appropriate" stems

- Re-read the stem — it's asking for the **worst** fit, not the best.
- Pick the **highest-risk** option to keep human-led: **live production incident / PII / auth / security** must **not** be delegated to the coding agent.
- Good agent tasks (test coverage, refactors, docs, boilerplate) are the _trap_ answers on a negation stem.

### 6. Plan-identity facts (distinct from the tier-control rule)

- **GHEC 30-day trial includes Copilot Business** (not Free/none).
- **GHEC does NOT auto-bundle Copilot** — Copilot is a separate add-on (trial aside).
- **Copilot is NOT supported on GHES** (GitHub Enterprise Server / on-prem / air-gapped) — it's a **cloud service** requiring GitHub.com or GHEC sign-in.
- Copilot **cloud/coding agent** requires a **paid** plan (Free/IDE includes agent _mode_, but the cloud coding agent needs Pro+).
- **"Copilot Premium"** is **not** a real plan. Real tiers: **Free, Pro, Pro+, Max, Business, Enterprise**.

---

## One-Page All-Domain Key-Facts Cheat Sheet

**Exam meta**: 700/1000 to pass · ~60 scored + 10–15 pretest · 100 min · Pearson VUE (OnVUE or test center) · $99 · 24-hr retake wait · closed-book.

| Area                       | Must-know                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **6 RAI principles**       | Fairness · Reliability & Safety · Privacy & Security · Inclusiveness · Transparency · Accountability          |
| Offensive/unsafe content   | **Reliability & Safety**                                                                                      |
| Bias / representative data | **Fairness**                                                                                                  |
| IDE support                | VS Code, JetBrains, Visual Studio, Vim/Neovim, Azure Data Studio                                              |
| Inline shortcuts           | Tab (accept), Esc (dismiss), Alt+\ (trigger), Alt+] / Alt+[ (next/prev)                                       |
| Chat participants          | `@workspace`, `@github`, `@terminal`, `@vscode`                                                               |
| Slash commands             | `/explain`, `/fix`, `/test`, `/doc`, `/new`, `/newNotebook`                                                   |
| CLI commands               | `gh copilot suggest`, `gh copilot explain`                                                                    |
| Edit vs Agent mode         | Edit = targeted, reviewable multi-file diffs on a small scope; Agent = multi-step, tools, MCP, commands, PRs  |
| Coding (cloud) agent       | Paid plan required; keep prod incidents / PII / auth **human-led**                                            |
| MCP                        | Model Context Protocol — lets Copilot call external tools/data sources                                        |
| Data flow                  | Prompt + context relayed by **Copilot cloud service** to the model (not local/GHES/CI runners)                |
| Training default           | Private/org code **not** used to train shared models by default; Business/Enterprise never train on your code |
| Plans                      | Free · Pro ($10) · Pro+ ($39) · Max ($100) · Business ($19) · Enterprise (GHEC)                               |
| Free tier                  | ~2,000 completions/mo, CLI + IDE agent mode, auto model selection                                             |
| Business adds              | Org policy, content exclusion, audit logs, centralized billing, no training on org code                       |
| Enterprise adds            | GHEC required, repo-aware Chat (indexed codebase), PR summaries, org knowledge                                |
| Content exclusion scope    | Repository + organization; paths/globs/file types (not branches)                                              |
| Duplication detection      | "Suggestions matching public code" — blocks exact long matches, license-blind                                 |
| Telemetry opt-out          | User + org level                                                                                              |
| Prompt engineering         | Zero-shot / few-shot; give format + constraints + examples; CI-ready = format + schema + "no prose"           |

---

## Exam-Day Logistics Checklist

**Verified via GitHub Docs, Microsoft Learn (GH-300 cert page), and Pearson VUE OnVUE guidance.**

### Before exam day

- [ ] Confirm exam slot for **2026-08-08** (booking window: Pearson VUE allows scheduling up to 90 days out).
- [ ] Decide **online (OnVUE)** vs **test center**. If online, run the **system pre-check** on the exact computer you'll use.
- [ ] Ensure your **name in the GitHub/Pearson VUE profile exactly matches** your government ID.

### ID requirements

- [ ] Bring a **valid, unexpired, government-issued photo ID** with your **name, photo, and signature**.
- [ ] Name on ID must match your registration exactly. (Test center may require a second ID.)

### Online (OnVUE) system + room setup

- [ ] **Single monitor** only (disconnect extra displays).
- [ ] **≥6 Mbps** download connection; wired preferred.
- [ ] Working **webcam + microphone**; you'll photograph your ID and do a **360° room scan**.
- [ ] **Empty, walled, private room** — no notes, no papers, no phones, no second devices, no food; clear the desk.
- [ ] **Check-in opens 30 minutes early** — start early to avoid last-minute stress.
- [ ] Close all other apps before launching OnVUE.

### Allowed resources during the exam

- [ ] **None.** GH-300 is **closed-book**. **Microsoft Learn is NOT available** during this exam (it is a GitHub certification; no external references, no browsing, no notes).
- [ ] No scratch paper for online proctored; use the on-screen whiteboard/notepad if provided.

### Mindset reminders (from your own performance data)

- [ ] **Read all four options fully** before answering — every recent miss came from skimming, not from lack of knowledge.
- [ ] On plan-tier questions, identify the stem's control signals **first**, then pick the tier.
- [ ] On "when NOT / least appropriate" stems, flip to the **highest-risk** option.
- [ ] Flag-and-return on any uncertain item; you have time (100 min for ~60 scored).

---

## Related Questions in questions.json

Day 29 has **no fixed day-assignment IDs** — it's a full-pool light run. Draw 25 random questions from the entire bank to confirm broad readiness.

**Quiz command (run from inside the `GH-300 Prep/` folder):**

```powershell
python quiz_runner.py questions.json --all --shuffle --limit 25
```

Stop early if fatigued — this is reinforcement, not a graded gate.

---

## Sources (verified during this session)

- [GitHub Copilot — Certifications | Microsoft Learn](https://learn.microsoft.com/en-us/credentials/certifications/github-copilot/)
- [Study guide for Exam GH-300 | Microsoft Learn](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-300)
- [Registering for a GitHub Certifications exam — GitHub Docs](https://docs.github.com/en/get-started/showcase-your-expertise-with-github-certifications/registering-for-a-github-certifications-exam)
- [Plans for GitHub Copilot — GitHub Docs](https://docs.github.com/copilot/about-github-copilot/subscription-plans-for-github-copilot)
- [GitHub Copilot Plans & pricing — GitHub](https://github.com/features/copilot/plans)
- [Microsoft Online Proctored Exams: OnVUE Guide (2026)](https://examinotion.com/blog/microsoft-online-proctored-exam-guide)

---

## Notes (your own words — fill this in after studying)

_(Leave space for the user to add their own notes after going through it.)_
