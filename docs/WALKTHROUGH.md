# Walkthrough

A visual tour of Gamified Cert Prep. Every screenshot below is the real UI, rendered with real data from the exam folders in this repo.

---

## First run

Open a folder and the extension asks what you want to do. If the folder already has a `.certprep/` marker it skips this entirely and binds silently.

![Welcome screen](screenshots/welcome.png)

---

## The sidebar

Your home base. Lifetime level and rank at the top, an XP bar that fills on load, and your streak with freeze tokens beside it.

Below that: whatever you're currently studying, then a collapsed trophy case of everything you've already passed.

![Sidebar with an active exam and trophy case](screenshots/sidebar.png)

Gamification is a setting, not a religion. Turn `certPrep.gamification.enabled` off and the XP bar, streak and battle pass disappear — progress tracking carries on exactly as before.

![Sidebar with gamification disabled](screenshots/sidebar-nogame.png)

Starting from nothing looks like this.

![Sidebar empty state](screenshots/sidebar-empty.png)

---

## The campaign board

Click into an exam and you get the whole plan at a glance. Completed days keep their accuracy badge, the next day is highlighted and ready, and future days are dimmed.

Locked days are never a hard wall — every one of them offers **"Do this early"** if you're feeling ahead.

![Exam dashboard with the day board](screenshots/dashboard.png)

The side rail tracks per-domain progress and surfaces your weakest topics, pulled from the questions you've actually been getting wrong.

A brand new exam starts here instead:

![Dashboard before a plan exists](screenshots/dashboard-noplan.png)

---

## Approving your sources

Before anything gets generated, the agent goes and finds the official objectives, the docs, the official practice material and a few reputable community guides — then asks you to sign off.

You can add your own: paste a URL, or attach a PDF from a paid corporate practice test. Anything you supply is marked trusted and used verbatim.

![Source approval screen](screenshots/sources.png)

---

## A study session

Each day's material is written for that day's topics and rendered for actual reading — a constrained measure, real typographic hierarchy, callouts, and code blocks.

"Ask about this" hands the day's context to `@certprep` if something doesn't click.

![Session reader](screenshots/session.png)

---

## The quiz

One question per screen, keyboard-first. Number keys pick, arrows move, Enter submits.

![Quiz question](screenshots/quiz-question.png)

Answer wrong and it shows you the right answer, explains why, and links back to the source it came from. No guessing what you missed.

![Quiz feedback after a wrong answer](screenshots/quiz-feedback.png)

Then the XP lands — base, accuracy, streak, perfect-score bonus, itemised and totalled — with a per-domain breakdown and the topics worth another look.

![Quiz results with XP tally](screenshots/quiz-results.png)

---

## The battle pass

Per exam, sized to your plan so it always ends on exam day. A ten-day sprint and a sixty-day campaign both get a full track.

![Battle pass tier track](screenshots/battlepass.png)

---

## Certificates

Clear every day of a domain and you unlock a certificate. It's generated as HTML, rasterised to PNG, and committed to your repo. The guilloche pattern is seeded per domain, so no two look the same.

![Generated domain certificate](screenshots/certificate.png)

---

## After the exam

On exam day the campaign card flips to ask how it went. Hand it your score report and it reads the score and credential link out of the PDF for you to confirm.

![Exam completion form](screenshots/completion.png)

Confirm, and the exam moves into your trophy case and the certifications table in the README updates itself.
