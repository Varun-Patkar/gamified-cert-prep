# Gamified Cert Prep

Turn any certification exam into a day-by-day study campaign — with XP, streaks, a battle pass, and a repo that remembers everything.

Researches your exam, builds a personalised plan, teaches you a topic a day, quizzes you on it, and commits every bit of progress to your own git repo. Works for any vendor: Microsoft, GitHub, Anthropic, AWS, whoever.

## 📸 [See the full visual walkthrough →](https://github.com/Varun-Patkar/gamified-cert-prep/blob/main/docs/WALKTHROUGH.md)

![Campaign board](https://raw.githubusercontent.com/Varun-Patkar/gamified-cert-prep/main/docs/screenshots/dashboard.png)

## How it works

1. **Tell it what you're taking.** Ask `@certprep` to prep you for an exam and it interviews you — one question at a time. When's the exam, or how many days do you want? Hours per day? Weekends? Questions per day (10 minimum)?
2. **Approve the sources.** It finds the official objectives, the docs, official practice material and reputable community guides, then shows you the list. Add your own — a paid corporate practice test, a PDF, any URL — and those are treated as trusted and used verbatim.
3. **It builds the plan.** Days apportioned across the exam's domains by weight, with review days for spaced repetition, buffer days, and a final mock before exam day.
4. **Study a day at a time.** Teaching material plus a graded quiz. Days unlock in order, but any locked day still offers "Do this early" if you're ahead.
5. **Everything commits and pushes** as you go, automatically.

## Gamification

On by default, entirely optional (`certPrep.gamification.enabled`).

- **XP** scaling with accuracy, bonuses for streaks and perfect quizzes. Lifetime XP carries across every exam you take.
- **Levels and ranks** — Apprentice → Practitioner → Specialist → Architect → Grandmaster.
- **Battle pass** per exam, sized to your plan so it always ends on exam day.
- **Streaks with freeze tokens** — earn one every five days, so missing a day doesn't nuke a thirty-day streak.
- **Domain certificates** — clear a domain and unlock a generated certificate, exported to PNG.
- **Badges** for perfect quizzes, clearing weak domains, and comebacks.

Retakes earn reduced XP, so review is rewarded without being farmable.

## Chat commands

| Command | What it does |
|---------|--------------|
| `@certprep /new` | Set up a new exam campaign |
| `@certprep /today` | What today's session is, with a button to open it |
| `@certprep /plan` | Show or rebuild your plan |
| `@certprep /explain <topic>` | Teach a topic, grounded in your approved sources |
| `@certprep /status` | Days done, accuracy, streak, XP, days to exam |

## Getting started

Install, then open a folder. On first run it offers to **clone a prep repo**, **use the current folder**, or **create a new one**. If the folder already has a `.certprep/` marker it binds silently.

Then: `@certprep prep me for AZ-104`

## Sync

Commits and pushes to `main` after every action, pulls on startup and periodically, and is built to **never fail loudly**. Conflicts resolve in favour of your local copy, with the remote preserved under `.certprep/conflicts/`. Offline? Commits queue. Not a git repo? Everything still works, sync just does nothing.

## A note on question sources

Questions are **synthesized from official objectives and documentation**, with a citation for every question. Vendor-published samples and anything you explicitly supply as trusted are used verbatim. Leaked "braindump" content is deliberately not gathered — it violates the NDA you sign at the test centre, can void your certification, and makes for worse practice.

## Requirements

- VS Code 1.104+
- A language model provider (e.g. GitHub Copilot) for research, teaching and question generation
