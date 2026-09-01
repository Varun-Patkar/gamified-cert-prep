# Gamified Cert Prep

Turn any certification exam into a day-by-day study campaign — with XP, streaks, a battle pass, and a repo that remembers everything.

A VS Code extension that researches your exam, builds a personalised plan, teaches you a topic a day, quizzes you on it, and commits every bit of progress to your own git repo. Works for any vendor: Microsoft, GitHub, Anthropic, AWS, whoever.

## 🏆 Certifications Earned with Help of Agent

These exams were passed using this prep system:

| Exam | Certification | Credential | Score Report |
|------|---------------|------------|--------------|
| **DP-800** | Microsoft Certified: SQL AI Developer Associate | [View credential](https://learn.microsoft.com/api/credentials/share/en-gb/VarunPatkar/2EC3461E6479548?sharingId=255AC49FFD10B95B) | [View PDF](DP-800%20Prep/DP-800-score-report.pdf) |
| **AI-102** | Microsoft Certified: Azure AI Engineer Associate | [View credential](https://learn.microsoft.com/api/credentials/share/en-gb/VarunPatkar/57E88FFE28157FDB?sharingId=255AC49FFD10B95B) | [View PDF](AI-102%20Prep/AI-102-score-report.pdf) |
| **GH-300** | GitHub Certified: GitHub Copilot | [View credential](https://learn.microsoft.com/api/credentials/share/en-gb/VarunPatkar/857C8CC1F8AB312A?sharingId=255AC49FFD10B95B) | [View PDF](GH-300%20Prep/GH-300-score-report.pdf) |

_This table is regenerated automatically by the extension whenever an exam is marked complete._

## How it works

Everything lives in the sidebar. Your repo is the save file.

1. **Tell it what you're taking.** Ask `@certprep` to prep you for an exam, and it interviews you — one question at a time. When's the exam, or how many days do you want? How many hours a day? Weekends or not? How many questions per day (10 minimum)?
2. **Approve the sources.** It goes and finds the official objectives, the docs, the official practice material, and a few reputable community guides — then shows you the list. Add your own (a paid corporate practice test, a PDF, any URL) and those are treated as trusted and used verbatim.
3. **It builds the plan.** Days are apportioned across the exam's domains by weight, with review days for spaced repetition, buffer days, and a final mock before exam day.
4. **Study a day at a time.** Each day has teaching material and a graded quiz. Days unlock in order — but if you're feeling ahead, any locked day offers "Do this early" instead of blocking you.
5. **Everything is committed and pushed** as you go, automatically.

## Gamification

On by default, and entirely optional (`certPrep.gamification.enabled`).

- **XP** for completing days, scaling with accuracy, with bonuses for streaks and perfect quizzes. Lifetime XP carries across every exam you ever take.
- **Levels and ranks** — Apprentice → Practitioner → Specialist → Architect → Grandmaster.
- **Battle pass** per exam, sized to your plan so it always ends on exam day. Tiers unlock cosmetics, milestones and certificates.
- **Streaks with freeze tokens** — you earn a token every five days, so missing one day doesn't nuke a thirty-day streak.
- **Domain certificates** — finish every day of a domain and you unlock a generated certificate, exported to PNG and committed to your repo.
- **Badges** for perfect quizzes, clearing a weak domain, and comebacks after a bad day.

Retakes earn reduced XP, so reviewing is rewarded without being farmable.

## Getting started

Install the extension, then open a folder. On first run it'll offer to **clone a prep repo**, **use the current folder**, or **create a new one**. If the folder already has a `.certprep/` marker it binds silently and gets out of your way.

Then just:

```
@certprep prep me for AZ-104
```

Or use the sidebar's **+ Prepare for a new exam**.

### Chat commands

| Command | What it does |
|---------|--------------|
| `@certprep /new` | Set up a new exam campaign |
| `@certprep /today` | What today's session is, with a button to open it |
| `@certprep /plan` | Show or rebuild your plan |
| `@certprep /explain <topic>` | Teach a topic, grounded in your approved sources |
| `@certprep /status` | Days done, accuracy, streak, XP, days to exam |

## Repo layout

The extension owns these files. They're all plain markdown and JSON, so they read fine on GitHub and diff cleanly.

```
.certprep/config.json          # repo marker + lifetime XP profile
<Exam> Prep/
  meta.json                    # vendor, code, status, dates, domains
  sources.json                 # approved sources
  topics.md                    # objective domains and weights
  plan.json / plan.md          # the day-by-day campaign
  questions.json               # the practice question bank
  progress.json / progress.md  # results, XP, streak, badges
  sessions/day-NN-*.md         # teaching material
  results/day-NN.json          # every quiz attempt
  certificates/                # unlocked certificates (html + png)
```

## Sync

The extension commits and pushes to `main` after every action, pulls on startup and periodically, and is built to **never fail loudly**. Conflicts resolve in favour of your local copy, with the remote version preserved under `.certprep/conflicts/` so nothing is ever lost. Offline? Commits queue and go out later. Not a git repo at all? Everything still works, sync just does nothing.

Configure with `certPrep.sync.enabled` and `certPrep.sync.pullIntervalMinutes`.

## A note on question sources

Practice questions are **synthesized from official objectives and documentation**, with a citation back to the source for every question. Vendor-published sample questions and anything you explicitly supply as a trusted source are used verbatim.

Leaked or "braindump" exam content is deliberately not gathered. It violates the NDA you sign at the test centre, it can void your certification, and it's worse study material anyway.

## Development

```bash
cd extension
npm install
npm run check-types   # type check
npm test              # unit tests
node esbuild.js       # bundle
```

Press <kbd>F5</kbd> to launch an Extension Development Host.

## Contributing

This is a personal study repo and doesn't accept pull requests — but it's built for forking. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Requirements

- VS Code 1.104+
- A language model provider (e.g. GitHub Copilot) for research, teaching and question generation

