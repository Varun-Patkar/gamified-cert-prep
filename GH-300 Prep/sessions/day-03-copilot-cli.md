# Day 3: GitHub Copilot Plans, Governance & the CLI

**Date**: 2026-07-11
**Domain**: Domain 2 — GitHub Copilot Plans & Features (plus CLI, policy, agent mode)
**Subtopics**: Plan/feature matrix (Free/Pro/Pro+/Business/Enterprise), usage metrics & audit, org/enterprise policy hierarchy, code referencing scopes, Copilot CLI, coding agent, knowledge bases, Chat surfaces, VS Code settings/diagnostics
**Estimated study time**: ~1 hr

---

## TL;DR (60-second skim)

- **Scope split**: Free / Pro / Pro+ = **individual**. Business / Enterprise = **organization-managed** (seats, policies, usage reports, **audit logs**).
- **Audit logs are in BOTH Business AND Enterprise** — not Enterprise-only. (This was your Day 2 miss on q053 — burn it in.)
- **Enterprise-only extras**: GitHub.com **repository-aware Chat**, **Knowledge Bases**, enterprise integrations. Business does NOT get repo-aware Chat on GitHub.com.
- **Policy hierarchy**: Enterprise (enforce/default) → Org (within bounds) → Repo (stricter only). **Enforced = no override, lower scopes cannot loosen.**
- **Copilot CLI** = agentic terminal agent (`copilot`), available on **all plans**; org can disable via policy. Installed via `npm i -g @github/copilot`.
- **Coding agent** = autonomous multi-step changes → **opens a PR**. **"Copilot Premium" is NOT a real plan.** Copilot is **not** available on **GHES** (self-hosted).

---

## Learning Objectives

- Map any scenario cue to the correct plan tier (individual vs org; Business vs Enterprise).
- Recall which governance features live at which scope and how enforcement cascades.
- Distinguish input controls (content/context exclusion) from output controls (code referencing / public code filtering).
- Explain what Copilot CLI, coding agent, and knowledge bases do and which plans get them.
- Know the VS Code settings/diagnostics answers cold.

---

## Key Concepts

### 1. Plan / Feature Matrix

| Feature | Free | Pro | Pro+ | Business | Enterprise |
|---|---|---|---|---|---|
| Scope | Individual | Individual | Individual | **Organization** | **Enterprise** |
| Inline completions + Chat | Limited | Yes | Yes | Yes | Yes |
| Copilot CLI | Yes* | Yes | Yes | Yes* | Yes* |
| Centralized **seat management** | No | No | No | **Yes** | **Yes** |
| **Usage metrics / reports** | No | No | No | **Yes** | **Yes** |
| **Audit log** (Copilot events) | No | No | No | **Yes** | **Yes** |
| Org **policy controls** (exclusions, public-code filter, feature/model toggles) | No | No | No | **Yes** | **Yes** |
| **GitHub.com repo-aware Chat** | No | No | No | **No** | **Yes** |
| **Knowledge Bases** (curated docs as chat context) | No | No | No | No | **Yes** |
| Enterprise integrations / enterprise-scope policy | No | No | No | No | **Yes** |

\* CLI/other org-delivered surfaces require the org/enterprise **policy to be enabled**.

- **Free** — for individuals getting started, personal use. Limited features, **no org governance**. (q071)
- **Pro / Pro+** — individual paid tiers. **Pro** is granted **free to verified students, teachers, and qualified OSS maintainers** (this is Pro, NOT "Free"). (q071, q076)
- **Business** — first tier with admin governance: seats, usage reports, **audit logs**, policy controls. (q056, q060, q061, q062)
- **Enterprise** — everything Business has **plus** GitHub.com repo-aware Chat, Knowledge Bases, enterprise integrations. (q057, q058, q063, q088)

### 2. Usage Metrics vs Telemetry (q066)

- Copilot **does** collect usage metrics: activity and feature usage (completions accepted, chat activity, agent usage) for **reporting/adoption/governance**.
- Metrics are **NOT a dump of your source code** and are **NOT** "Enterprise-only" (Business gets them too).

### 3. AI Models (q067)

- Copilot supports **multiple AI models** with different capability/latency/cost trade-offs; you can **switch models** in Chat.
- Model choice **does** affect quality and latency. Governance controls (public code filter, exclusions, code referencing) apply **regardless of model**.

### 4. Copilot CLI (verified current — q081)

- The modern **Copilot CLI** is an **agentic terminal agent** — command is simply `copilot`.
- Install: `npm install -g @github/copilot` (Node 22+), or WinGet `winget install GitHub.Copilot`, or Homebrew `brew install --cask copilot-cli`.
- **Available on ALL Copilot plans.** If delivered via an org, the **Copilot CLI policy must be enabled** by the org/enterprise admin.
- Two interfaces: **interactive** (`copilot` → conversation; **plan mode** via `Shift+Tab`) and **programmatic** (pass a single prompt directly).
- Can answer questions, write/debug code, interact with GitHub.com, and even **create a pull request** from the terminal.
- Supported OS: Linux, macOS, Windows (PowerShell or WSL).
- (Legacy note: the older `gh copilot suggest` / `gh copilot explain` gh-extension still exists for drafting/explaining shell commands, but the exam's "Copilot in the CLI helps draft/explain commands" answer maps to CLI availability being real — answer B on q081.)

### 5. Coding Agent (q085)

- **Copilot coding agent** autonomously performs **multi-step changes across files** and **opens a pull request** for review.
- Distinct from VS Code **Copilot Edits / Agent mode** (local, editor-driven). Agent PRs still pass **branch protections, reviews, CodeQL/secret scanning** — autonomy ≠ bypassing governance.

### 6. Knowledge Bases (q086)

- **Enterprise-only.** Curate org-approved docs and use them as **grounding context for Copilot Chat** on GitHub.com and VS Code.
- GitHub is transitioning Knowledge Bases toward **Copilot Spaces** — check current docs for migration.

---

## Policy Hierarchy & Enforcement (q080, q083, q084)

```
Enterprise  (enforce OR set default)
   └── Organization  (configure only WITHIN enterprise-allowed bounds)
          └── Repository  (granular, STRICTER-only, e.g. content exclusion)
```

- **Enforced** policy = **cannot be overridden** by org or repo. Lower scopes may only be **stricter**, never looser. (q080, q084)
- Read the verb: **"enforce" = locked**; **"set default" = orgs may adjust within bounds.**
- Example: enterprise enforces "block matching public code" → orgs/repos **cannot** turn it off (q080). Enterprise restricts allowed models/surfaces → org configures **only within the allowed set** (q084).

### Two different controls — don't confuse them

| Control | Direction | What it does |
|---|---|---|
| **Content / context exclusion** | **INPUT** | Limits what files/context Copilot can **see** |
| **Code referencing** ("Suggestions matching public code" / public code filter) | **OUTPUT** | Governs whether Copilot **emits** code matching public code (block, or allow-with-references) |

Use both for defense-in-depth.

### Code referencing scopes (q083, q062)

- Configurable at the **individual account level** AND via **organization / enterprise policies**.
- NOT "IDE-only," NOT "repository-only," NOT "enterprise-only." Enterprise **enforcement** overrides user/org preference.

---

## Chat & Product Surfaces

### Where Copilot Chat IS available (q059)

- **GitHub.com**, **VS Code**, **Visual Studio**, **JetBrains IDEs**.
- **NOT GitHub Desktop** (classic distractor).

### Where Copilot is NOT available (q077)

- **GitHub Enterprise Server (GHES)** — self-hosted. Copilot is a **cloud service** for **GHEC**, GitHub.com, and supported IDEs.
- GHEC ≠ auto-included: Copilot plans are **separate add-ons**, not bundled by default (q070). A GHEC 30-day trial can enable Copilot Business for evaluation, but that's temporary.

### Repository-aware Chat on GitHub.com (q063, q088)

- **Enterprise capability** — Chat can reference repo files, docs, issues in the browser (beyond IDE-local context), improved by **repository indexing**.
- Not all plans; not Business; does **not** require GHES.

---

## VS Code Settings & Troubleshooting

- **Collect diagnostics** for Copilot issues → Command Palette: **"GitHub Copilot: Collect Diagnostics"** (gathers env details + extension logs). (q075)
- **Enable/disable inline suggestions globally or per language** → **Settings → Extensions → GitHub Copilot** → **Inline Suggest: Enable** / **Enable for [Language]**. (q089)

---

## Common Traps & Misconceptions

- ⚠️ **Audit logs are NOT Enterprise-only** — Business has them too. (Your Day 2 q053 miss. On q061/q057/q058: if the option is "audit," both B and C qualify; Enterprise is distinguished by **GitHub.com repo-aware Chat + integrations**, not by audit.)
- ⚠️ **"Copilot Premium" is not a real plan** (q076). Real: Free, Pro, Pro+, Business, Enterprise.
- ⚠️ **Usage metrics ≠ Enterprise-only** and ≠ source-code dump (q066).
- ⚠️ **GHEC does not include Copilot by default** (q070).
- ⚠️ **Enforced ≠ default** — enforced policies can't be overridden; defaults can be refined within bounds (q080, q084).
- ⚠️ **Code referencing = OUTPUT control; exclusion = INPUT control** (q062, q083). Don't swap them.
- ⚠️ **GitHub Desktop is NOT a Chat surface** (q059).
- ⚠️ **Free vs Pro for students**: free-for-students is **Pro**, not "Free" (q071).

---

## Quiz Question Refreshers (every assigned question)

| Q | Concept | Correct | Trap to avoid |
|---|---|---|---|
| q056 | Usage metrics/reports plans | **B + C** (Business & Enterprise) | Not Pro/Free |
| q057 | Enterprise governance + GitHub.com repo Chat | **C** | Audit alone ≠ Enterprise; repo-aware Chat is the discriminator |
| q058 | Enterprise integrations, SSO (org-configured), compliance | **C** | SSO is org capability; Enterprise adds integrations |
| q059 | Where Chat is available | **A,B,C,D** | Exclude GitHub Desktop |
| q060 | Centralized seat management | **B + C** | Pro is individual only |
| q061 | Copilot events in org audit log | **B + C** | **Audit is Business AND Enterprise** |
| q062 | Org-wide policy controls (exclusions, public-code filter) | **B + C** | Free/Pro have no governance |
| q063 | GitHub.com repo-aware Chat | **C** | Business does NOT get it |
| q066 | Telemetry/usage data | **B** | Not a code dump; not Enterprise-only |
| q067 | AI models in Copilot | **B** (multiple models) | Not a single fixed model |
| q070 | Plan included by default with GHEC | **C** (none — separate add-on) | Trial ≠ permanent inclusion |
| q071 | Who benefits from Copilot Free | **B** (individuals, personal use) | Students get **Pro**, not Free |
| q075 | VS Code gather logs/diagnostics | **C** ("Collect Diagnostics") | Not "Export Telemetry" |
| q076 | Not a valid plan name | **C** ("Copilot Premium") | Pro+ IS valid |
| q077 | Where Copilot is NOT available | **C** (GHES) | GHEC/GitHub.com/VS Code all supported |
| q080 | Enterprise-enforced setting override | **C** (cannot override) | Lower scopes only stricter |
| q081 | Copilot in CLI + purpose | **B** (yes, draft/explain commands) | Not IDE-only; not Enterprise-only |
| q083 | Code referencing config scopes | **B** (account + org/enterprise) | Not IDE-only / repo-only / enterprise-only |
| q084 | Enterprise restricts models/surfaces | **B** (org configures within allowed set) | Can't override/disable enterprise policy |
| q085 | Autonomous multi-step + opens PR | **B** (coding agent) | Not Chat inline / exclusion |
| q086 | Copilot Knowledge Bases | **C** (Enterprise-only curated docs) | Not all plans / not Business |
| q088 | Repo-aware Chat on GitHub.com | **B** (Enterprise, references repo files) | Not all plans; doesn't need GHES |
| q089 | Enable/disable inline suggestions per language | **B** (Settings → Extensions → GitHub Copilot) | Not Keyboard Shortcuts |

---

## Real-World Scenarios

1. **"Admin needs a downloadable report of who's using Copilot"** → Business or Enterprise (usage metrics). Audit log complements it.
2. **"Legal wants to block any suggestion matching public code across all orgs, no exceptions"** → Enterprise **enforce** public code filter; orgs/repos can't loosen.
3. **"Team wants Chat that answers questions from repo files in the browser"** → **Enterprise** (repo-aware Chat on GitHub.com).
4. **"Dev on Windows wants an AI agent in the terminal that can open a PR"** → Copilot CLI (`npm i -g @github/copilot`) — works on all plans if org policy allows.
5. **"Company runs self-hosted GHES and wants Copilot"** → Not supported; move to GHEC.

---

## Related Questions in questions.json

q056, q057, q058, q059, q060, q061, q062, q063, q066, q067, q070, q071, q075, q076, q077, q080, q081, q083, q084, q085, q086, q088, q089 (23 total)

Quiz command:

```powershell
cd "GH-300 Prep"; python quiz_runner.py --day-lock 3
```

(Add `--web` for the browser UI.)

---

## Sources (verified 2026-07-11)

- [Installing GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli)
- [About GitHub Copilot CLI](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-copilot-cli)
- [GitHub Copilot plans](https://docs.github.com/en/copilot/get-started/plans)
- [Managing policies and features for Copilot in your organization](https://docs.github.com/en/copilot/how-tos/administer/organizations/managing-policies-for-copilot-in-your-organization)
- [Copilot coding agent](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent)

---

## Notes (your own words — fill this in after studying)

_(Leave space for your own notes after going through it.)_
