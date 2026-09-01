# Contributing

Thanks for the interest — but please read this first, because this repo probably isn't what you expect.

## This is a personal learning repo

This repository is **one person's certification study record**. The exam folders, plans, progress logs, quiz results, XP and certificates in here are my own. It isn't a shared knowledge base, and it isn't accepting study material from other people.

**I do not accept pull requests to this repository.** Issues and PRs proposing new exams, new questions, or changes to my study data will be closed without review. That's not unfriendly — it's just that merging someone else's study history into mine would make both of ours meaningless.

## What to do instead: fork it and make it yours

The Gamified Cert Prep extension in [`extension/`](extension) is designed so that **everyone runs their own repo**. That's the whole model — your repo is your save file.

1. Fork this repository (or just create an empty one).
2. Delete my exam folders — anything matching `* Prep/` — and the certifications table in the README.
3. Open your copy in VS Code with the extension installed. It'll detect the empty repo and walk you through setup.
4. Ask `@certprep` to prepare for whatever exam you're taking.

From that point on the extension writes everything into your repo and pushes it for you. Your progress, your XP, your battle pass, your certificates.

## The one branch rule

The extension commits and pushes to **`main` only**, automatically, after every action. It deliberately does not create branches, open PRs, or ask permission — the goal is that studying never gets interrupted by git.

If you'd rather it worked differently, change it in your fork. The sync logic is all in [`extension/src/sync/gitSync.ts`](extension/src/sync/gitSync.ts) and it's reasonably self-contained.

## Bugs in the extension itself

Extension bugs are a different story from study data. If you hit a genuine bug in the extension code, feel free to open an issue describing it. I may or may not get to it — this is a side project that exists mainly to get me through my own exams — so forking and fixing it yourself is usually faster.

## On exam integrity

The research pipeline is built to **synthesize original practice questions** from official objectives and documentation, and to use verbatim only what a vendor publishes as sample material or what you explicitly supply as a trusted source.

Please don't repurpose this to collect or redistribute leaked live exam content. Beyond being against the NDA you sign at the test centre and grounds for revoking a certification, it makes for worse practice material.
