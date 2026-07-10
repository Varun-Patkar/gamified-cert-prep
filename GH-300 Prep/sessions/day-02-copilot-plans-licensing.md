# Day 2: GitHub Copilot Plans, Licensing & Features

**Date**: 2026-07-10
**Domain**: Domain 2 — GitHub Copilot Features & Functionality (25–30%)
**Subtopics**: Plans (Free, Pro, Business, Enterprise), Content Exclusion, Usage Reporting, Audit Logs, SSO, Admin Controls, Copilot Chat
**Estimated study time**: 2 hrs

---

## TL;DR (60-second skim)

- **4 main plans for exam**: Free (limited/individual), Pro (individual paid; free for students/teachers/OSS), Business (org-level, $19/user), Enterprise (GH Enterprise Cloud only, all Business + extras)
- **Business vs Enterprise decision**: If org needs license mgmt + policies + content exclusion + usage reporting → **Business**. Add enterprise integrations + repo-aware Chat + advanced compliance → **Enterprise**
- **Audit logs**: BOTH Business AND Enterprise have them — don't say "only Enterprise"
- **Content exclusion**: Business + Enterprise (NOT Free or Pro)
- **Usage reporting**: Business + Enterprise (NOT Free or Pro)
- **SSO**: NOT a Copilot plan feature. It's an Enterprise Cloud org capability. Copilot Enterprise *uses* SSO if the org has it — it doesn't bundle it.
- **Premium Support SLAs**: Completely separate purchase. NOT included with any Copilot plan.
- **Repo-aware Chat on GitHub.com**: Enterprise ONLY differentiator
- **GitHub Enterprise Cloud 30-day trial**: Includes Copilot **Business** (not Enterprise)
- **GitHub Team orgs**: Can use Copilot Business. Enterprise Cloud orgs can use Business OR Enterprise.

---

## Learning Objectives

After this session, you should be able to:

1. Select the correct Copilot plan given a scenario (who, what org type, what features needed)
2. Explain which features are Business-only, Enterprise-only, or shared
3. Explain why SSO and Premium Support are NOT bundled with any Copilot plan
4. Identify that audit logs exist in BOTH Business AND Enterprise
5. Describe what content exclusion is and which plans include it
6. Describe the Enterprise-only differentiator: repo-aware Copilot Chat on GitHub.com
7. Know Copilot Pro is free for verified students, teachers, and popular OSS maintainers

---

## Key Concepts

### 1. GitHub Copilot Plans — Full Overview

GitHub offers these plans as of 2026. **The exam focuses on Free, Pro, Business, Enterprise.**

| Plan | Target | Cost | Org Controls | Notes |
|------|--------|------|--------------|-------|
| **Copilot Free** | Individual (no org/enterprise access) | $0 | None | 2,000 completions/mo; 50 premium requests/mo; limited chat; auto model selection only |
| **Copilot Student** | Verified students | $0 | None | Unlimited completions + AI Credits allowance; limited chat/agent |
| **Copilot Pro** | Individuals wanting full features | $10/mo | None | Unlimited completions; 300 premium requests/mo; Copilot Chat; cloud agent; **FREE for verified students, teachers, popular OSS maintainers** |
| **Copilot Pro+** | AI power users | $39/mo | None | Everything in Pro + full model access + 1,500 premium requests/mo |
| **Copilot Max** | High-volume users | $100/mo | None | Highest AI credits + priority access to new models |
| **Copilot Business** | Orgs (GitHub Free, Team, or Enterprise Cloud) | $19/user/mo | Yes — centralized mgmt, policies, content exclusion, usage reporting, audit logs | Does NOT include enterprise integrations or repo-aware GitHub.com Chat |
| **Copilot Enterprise** | GitHub Enterprise Cloud orgs ONLY | Higher (varies) | Everything in Business + enterprise-grade extras | Adds: repo-aware Chat on GitHub.com, enterprise identity integrations, advanced compliance |

> **Exam focus**: The exam rarely asks about Pro+ or Max. Know Free, Pro, Business, Enterprise cold.

---

### 2. Copilot Business — Who It's For and What It Includes

**Available to**:
- Orgs on **GitHub Free** plan
- Orgs on **GitHub Team** plan
- Orgs on **GitHub Enterprise Cloud** (can choose Business or Enterprise per org)

**Key features** (admin-facing):
- **Centralized license management** — org admins assign/revoke seats
- **Policy controls** — define and enforce settings for how code suggestions work
- **Content/context exclusion** — configure which files/repos Copilot CANNOT use as context
- **Usage reporting** — see how many seats are used, activity metrics
- **Audit logs** — record of changes to settings, policies, license assignments

**Key features** (developer-facing):
- Inline suggestions in IDEs (VS Code, JetBrains, Visual Studio, etc.)
- Copilot Chat in IDE
- Copilot CLI
- Code review, PR summaries
- Agent Mode in IDE

**What Business does NOT include**:
- Repo-aware Copilot Chat on GitHub.com (that's Enterprise)
- SSO via enterprise identity providers (that's the org's own capability, not a plan feature)
- Enterprise proxy support configuration at enterprise scope
- Premium Support with SLAs (that's a separate purchase)

---

### 3. Copilot Enterprise — How It Differs from Business

**Available to**: GitHub **Enterprise Cloud** organizations ONLY (NOT GitHub Team or Free orgs)

**Everything in Business, PLUS**:

| Feature | Business | Enterprise |
|---------|----------|------------|
| Inline suggestions in IDE | ✅ | ✅ |
| Copilot Chat in IDE | ✅ | ✅ |
| Content exclusion | ✅ | ✅ |
| Usage reporting | ✅ | ✅ |
| Audit logs | ✅ | ✅ |
| Policy controls | ✅ | ✅ |
| **Repo-aware Chat on GitHub.com** | ❌ | ✅ |
| **Enterprise identity/SSO integration** | ❌ | ✅ (uses org's configured SSO) |
| **Advanced compliance reporting** | ❌ | ✅ |
| **Enterprise proxy support** | ❌ | ✅ |
| **GitHub.com-based Copilot Chat with repo context** | ❌ | ✅ |

> **The key Enterprise differentiator for exam questions**: When a scenario says "developers can ask questions about the codebase directly on GitHub.com" or "Copilot Chat can reference specific repo files in GitHub.com interface" — that's **Enterprise**.

---

### 4. Content Exclusion — What It Is

**What it does**: Prevents specific files, repositories, or path patterns from being used as context when Copilot generates suggestions. This protects sensitive data, secrets, credentials, or proprietary algorithms from being inadvertently included in Copilot's context window.

**Who can configure it**:
- Repository owners (repository-level exclusion)
- Organization owners (org-level exclusion)
- Enterprise owners (enterprise-level exclusion)

**Which plans support it**: **Copilot Business** and **Copilot Enterprise** ONLY. Not available on Free or Pro.

**How to configure** (exam-relevant workflow):
1. Go to org/repo Settings → Copilot → Content exclusion
2. Specify path patterns (glob syntax, e.g., `**/.env`, `**/secrets/**`)
3. These paths are excluded from Copilot's context regardless of IDE

**Audit trail**: Changes to content exclusion settings are logged in the organization's audit log under the `copilot.content_exclusion_changed` event.

---

### 5. Usage Reporting

**What it shows**: Seat usage, active users, engagement metrics (suggestions shown, accepted, dismissed)

**Where to access**:
- Org admins: Organization Settings → Copilot → Seat management
- Enterprise owners: Enterprise Settings → Copilot → Usage

**Which plans**: **Business** and **Enterprise** ONLY.

**Why it matters (exam)**: Orgs use this to understand adoption, justify cost, and manage license count. If a question asks about tracking usage or reviewing seat utilization → Business or Enterprise.

---

### 6. Audit Logs — CRITICAL EXAM TRAP

> ⚠️ **TRAP**: Many candidates think only Copilot Enterprise has audit logs. **WRONG.** Both Business AND Enterprise have audit logs.

**What audit logs capture for Copilot**:
- Changes to Copilot plan settings and policies
- License assignments (seats granted or revoked)
- Content exclusion setting changes
- Agent activity on GitHub.com

**What they do NOT capture**: Client-side session data (e.g., the specific prompts you typed). That requires custom tooling.

**Retention**: Audit log retains events for the **last 180 days**. For longer retention, stream to a SIEM platform.

**Access**: Enterprise owners or users with the "Read enterprise audit logs" role.

**Plans with audit logs**: Copilot **Business** AND **Enterprise**.

---

### 7. SSO (Single Sign-On) — The Most Common Trap

> ⚠️ **CRITICAL TRAP**: SSO is NOT a feature included with or bundled into any Copilot plan. It is a **GitHub Enterprise Cloud organization capability**.

**How it actually works**:
1. A GitHub Enterprise Cloud org configures SAML SSO or SCIM with their identity provider (Azure AD, Okta, etc.)
2. When members sign in to GitHub, they authenticate via SSO
3. When those members use Copilot, authentication flows through the org's SSO setup
4. **Copilot Enterprise leverages/uses SSO** — it doesn't "include" or "provide" SSO

**Why this matters for exam questions**:
- Q: "Which Copilot plan integrates with enterprise identity providers for SSO?"
  - A: Copilot Enterprise — but the answer is nuanced. The SSO integration is an Enterprise Cloud org feature; Copilot Enterprise is the plan that requires/uses it.
- Q: "Does Copilot Enterprise include SSO?"
  - A: No. SSO is an Enterprise Cloud org capability. Copilot Enterprise is available to Enterprise Cloud orgs (which may already have SSO configured).

---

### 8. GitHub Premium Support SLAs — Another Common Trap

> ⚠️ **TRAP**: Premium Support with response time SLAs is **NOT bundled with any Copilot plan**. It is a **completely separate purchase**.

**What Premium Support is**: A paid add-on that provides:
- Guaranteed response time SLAs (e.g., 1-hour response for critical issues)
- Dedicated support engineers
- Faster escalation paths

**Which Copilot plans include it**: **NONE**. Even Copilot Enterprise does not include Premium Support.

**Exam pattern**: Questions may say "an enterprise wants Copilot Enterprise AND Premium Support SLAs" — the correct understanding is these are two separate purchases/subscriptions.

---

### 9. Repo-Aware Copilot Chat on GitHub.com

**What it is**: When using Copilot Chat on GitHub.com (not in IDE), Copilot Enterprise users can ask questions about their actual repositories — "What does this function do?", "Find all places where we handle auth errors" — and Copilot can reference the live repository content.

**Who has this**: **Copilot Enterprise ONLY**

**Why it matters**: Business plan users have Copilot Chat in their IDE, but when they go to GitHub.com, Copilot Chat there is not repo-context-aware in the same way. Enterprise gives GitHub.com-native, repo-aware Chat.

---

### 10. Copilot Pro — Free Access Eligibility

**Copilot Pro** (the $10/month paid plan) is available **for free** to:
- **Verified students** via GitHub Education / GitHub Student Developer Pack
- **Verified teachers** via GitHub Education
- **Maintainers of popular open-source projects** (those with a certain follower/usage threshold on GitHub)

> ⚠️ **TRAP**: Do not confuse with **Copilot Free** (a separate, limited tier available to all). Copilot Pro being "free for students" means they get the FULL Pro plan, not the limited Free tier.

---

### 11. GitHub Plan Tiers vs Copilot Plans

These are different things. Know them:

| GitHub Account Type | Available Copilot Plans |
|---------------------|------------------------|
| Personal account | Free, Student, Pro, Pro+, Max |
| Org on GitHub Free | Copilot Business |
| Org on GitHub Team | Copilot Business |
| Org on GitHub Enterprise Cloud | Copilot Business OR Copilot Enterprise |

> **Key**: Copilot Enterprise is ONLY for GitHub Enterprise Cloud orgs. GitHub Team orgs can only get Copilot Business at the org level.

**Note (as of April 2026)**: New self-serve sign-ups for Copilot Business for orgs on GitHub Free and Team plans are temporarily paused. This is a product change — for exam purposes, the conceptual structure above still applies.

---

### 12. GitHub Enterprise Cloud 30-Day Trial

When an org signs up for the **GitHub Enterprise Cloud 30-day free trial**, it includes access to **Copilot Business** (not Enterprise).

**Exam trap**: You might expect Enterprise Cloud trial to include Copilot Enterprise. It does not — the trial includes Business tier.

---

### 13. Copilot Chat — What It Is

**Copilot Chat** is a conversational AI interface integrated into:
- Supported IDEs (VS Code, JetBrains, Visual Studio)
- GitHub.com website
- GitHub Mobile

**What it does**:
- Natural language Q&A about code
- Explain code snippets
- Suggest code fixes
- Generate tests
- Answer questions about programming concepts

**Who has it**: Available across plans, but GitHub.com repo-aware Chat is Enterprise-only.

---

## Decision Framework — Which Plan Does the Scenario Need?

```
Is the user an individual (no org)?
  ├── Just exploring → Free
  ├── Student/Teacher/OSS maintainer → Pro (free)
  └── Paid individual → Pro or Pro+

Is the user part of an organization?
  ├── Does the org need admin controls (license mgmt, policies, usage reporting)?
  │   ├── No → Individual plans (Free/Pro)
  │   └── Yes:
  │       ├── Is the org on GitHub Enterprise Cloud AND needs repo-aware Chat on GitHub.com, 
  │       │   enterprise SSO integration, or advanced compliance?
  │       │   ├── Yes → Copilot Enterprise
  │       │   └── No → Copilot Business
  │       └── Is the org on GitHub Team (NOT Enterprise Cloud)?
  │           └── Copilot Business (Enterprise not available to Team orgs)
```

**Shorthand rules**:
- "Org admins + license mgmt + content exclusion + usage reporting" → **Business**
- "All of Business PLUS enterprise integrations / SSO / advanced compliance / repo-aware GitHub.com Chat" → **Enterprise**
- "GitHub Team org needs org controls" → **Business** (Enterprise is Enterprise Cloud only)
- "Enterprise Cloud org needs org controls, nothing special" → **Business** (cheaper)
- "Enterprise Cloud org needs everything" → **Enterprise**

---

## Comparisons Table — Business vs Enterprise

| Feature | Copilot Business | Copilot Enterprise |
|---------|-----------------|-------------------|
| Available on GitHub Team orgs | ✅ | ❌ |
| Available on Enterprise Cloud orgs | ✅ | ✅ |
| Centralized license management | ✅ | ✅ |
| Policy controls | ✅ | ✅ |
| Content exclusion | ✅ | ✅ |
| Usage reporting | ✅ | ✅ |
| Audit logs | ✅ | ✅ |
| Copilot Chat in IDE | ✅ | ✅ |
| Inline suggestions in IDE | ✅ | ✅ |
| Repo-aware Chat on GitHub.com | ❌ | ✅ |
| Enterprise identity / SSO integration | ❌ | ✅ (uses org's SSO) |
| Advanced compliance reporting | ❌ | ✅ |
| Enterprise proxy support | ❌ | ✅ |
| Premium Support SLAs | ❌ | ❌ (separate purchase) |

---

## Important Details for Exam

- **Audit log retention**: 180 days. Recommend streaming to SIEM for longer retention.
- **Audit log covers**: settings changes, policy changes, license assignments, agent activity. Does NOT cover individual prompts.
- **Content exclusion scope**: Configured at repo, org, or enterprise level. Applies to all IDE users in that scope.
- **Copilot Pro price**: $10/month per user
- **Copilot Business price**: $19/user/month
- **Business on GitHub Team**: YES, available. Enterprise is NOT available on GitHub Team.
- **Enterprise Cloud trial**: Includes Copilot Business (not Enterprise)
- **SSO**: Is an Enterprise Cloud org feature, not a Copilot feature. Don't say "Copilot Enterprise includes SSO."
- **Premium Support**: Completely separate. Any "Copilot plan that includes SLA support" is wrong — no plan does.
- **Pro free access**: Students, teachers, popular OSS maintainers get Copilot PRO (not just Free tier).
- **Copilot Free limits**: 2,000 inline suggestions/month, 50 premium requests/month.
- **Policy management scope**: Business = org-level. Enterprise = can manage at enterprise level across multiple orgs.

---

## Common Traps & Misconceptions

| Trap | Wrong Answer | Correct Answer |
|------|-------------|----------------|
| Audit logs availability | "Only Enterprise has audit logs" | Both **Business AND Enterprise** have audit logs |
| SSO bundling | "Copilot Enterprise includes SSO" | SSO is an Enterprise Cloud org feature; Copilot Enterprise *uses* org's SSO, doesn't bundle it |
| Premium Support | "Copilot Enterprise includes Premium SLAs" | Premium Support is a completely separate paid purchase — no Copilot plan includes it |
| Pro free access | "Students get Copilot Free for free" | Students get **Copilot Pro** for free (verified via GitHub Education) |
| Enterprise Cloud trial | "Trial includes Copilot Enterprise" | Enterprise Cloud 30-day trial includes **Copilot Business** |
| GitHub Team + Enterprise | "GitHub Team orgs can use Copilot Enterprise" | Enterprise is for Enterprise Cloud only. Team orgs → Business |
| Content exclusion | "All plans have content exclusion" | Only **Business and Enterprise** have content exclusion |
| Usage reporting | "Only Enterprise has usage reporting" | Both **Business AND Enterprise** have usage reporting |
| Repo-aware Chat | "Business has repo-aware Chat on GitHub.com" | Repo-aware GitHub.com Chat is **Enterprise ONLY** |
| When to pick Enterprise over Business | "Enterprise has everything Business doesn't" | Only choose Enterprise when you need enterprise integrations, repo-aware GitHub.com Chat, or advanced compliance — Business is sufficient for most org controls |

---

## Real-World Scenarios

**Scenario 1**: A startup with a GitHub Team plan wants to roll out Copilot with org-wide policy settings and see usage metrics.  
→ **Copilot Business** (available to Team orgs, has policy controls + usage reporting)

**Scenario 2**: A large enterprise on GitHub Enterprise Cloud wants developers to ask Copilot questions about specific repos directly on GitHub.com, plus advanced compliance reporting.  
→ **Copilot Enterprise** (repo-aware GitHub.com Chat + advanced compliance = Enterprise-only)

**Scenario 3**: An enterprise wants Copilot Enterprise plus guaranteed 1-hour SLA support response times.  
→ **Copilot Enterprise** + **GitHub Premium Support** as a SEPARATE purchase. These are two independent items.

**Scenario 4**: A company's GitHub Enterprise Cloud org needs centralized license management and content exclusion to prevent trade secrets from being used as Copilot context. No need for GitHub.com-based Chat features.  
→ **Copilot Business** (has content exclusion + license mgmt; no need for Enterprise-tier features)

**Scenario 5**: A university professor teaches programming. They want full Copilot capabilities with unlimited suggestions.  
→ **Copilot Pro** (teachers get it free via GitHub Education verification)

---

## Quick Reference Card

```
PLAN SELECTION:
  Individual, just exploring         → Free
  Student / Teacher / OSS maintainer → Pro (FREE)
  Individual, paid                   → Pro ($10/mo)
  Org, needs org controls            → Business ($19/user/mo)
  Enterprise Cloud, needs extras     → Enterprise

FEATURES BY PLAN:
  Feature                  | Free | Pro | Business | Enterprise
  Inline suggestions       |  ✅  | ✅  |    ✅    |     ✅
  Copilot Chat in IDE      |  ✅  | ✅  |    ✅    |     ✅
  Content exclusion        |  ❌  | ❌  |    ✅    |     ✅
  Usage reporting          |  ❌  | ❌  |    ✅    |     ✅
  Audit logs               |  ❌  | ❌  |    ✅    |     ✅
  Policy controls          |  ❌  | ❌  |    ✅    |     ✅
  Repo-aware Chat (GH.com) |  ❌  | ❌  |    ❌    |     ✅
  Enterprise SSO integration|  ❌  | ❌  |    ❌    |     ✅ (uses org's)
  Advanced compliance      |  ❌  | ❌  |    ❌    |     ✅
  Premium Support SLAs     |  ❌  | ❌  |    ❌    |     ❌ (separate!)

KEY FACTS:
  - Business available on: GitHub Free, Team, AND Enterprise Cloud orgs
  - Enterprise available on: GitHub Enterprise Cloud ONLY
  - Enterprise Cloud 30-day trial → Copilot Business (not Enterprise)
  - SSO = org capability, NOT a Copilot plan feature
  - Premium Support SLAs = SEPARATE purchase, never bundled
  - Audit logs = Business AND Enterprise (not just Enterprise!)
  - Content exclusion = Business AND Enterprise
  - Copilot Chat = Natural language Q&A in IDE + GitHub.com + Mobile
```

---

## Cross-Domain Quiz Question Refreshers

| Concept | Key Fact | Exam Trap |
|---------|----------|-----------|
| **Accountability principle** | Taking responsibility for AI outcomes; owning mistakes; escalating violations; documenting decisions | "Quietly retraining" or "no action needed if data was public" are wrong — Accountability requires active response |
| **Privacy & Security violation + custom extension** | Training a custom extension on customer data without consent violates Privacy & Security. Response: obtain consent, retrain ethically | "It was public data so it's fine" is WRONG — consent is required |
| **Accountability response to personal identifier exposure** | Remove identifiers, report the incident, document the remediation steps, enforce consent policies | The exam tests that accountability = escalate + document + audit trail, not just fix quietly |
| **Multi-correct answers on Accountability** | When asked which TWO actions demonstrate accountability: look for (1) removing the violation + reporting/documenting AND (2) escalating + enforcing policies + audit trail | Trap: picking the "easiest" single action misses that accountability requires BOTH remediation AND governance |

---

## Related Questions in questions.json (Day 2)

| Question ID | Topic Tested |
|-------------|-------------|
| q023 | Cross-domain: Accountability + Privacy & Security violation (personal identifiers + untrained consent) |
| q031 | Copilot Pro free for students/teachers/OSS maintainers |
| q032 | Business: org license mgmt + policies + usage reporting (no enterprise integrations) |
| q033 | Enterprise: audit logs + SSO + advanced compliance |
| q034 | Copilot Chat: natural language Q&A about code in IDE |
| q035 | Content exclusion: prevent sensitive data from being used as context |
| q036 | Enterprise: centralized mgmt + audit logs + SSO + advanced compliance |
| q037 | Business: license mgmt + content exclusion + usage reporting |
| q038 | Enterprise + Premium Support as separate purchase |
| q039 | Enterprise: repo-level context on GitHub.com |
| q040 | Enterprise + Premium Support SLAs separately |
| q041 | Business: usage reporting + policy controls, no enterprise integrations |
| q042 | Enterprise: integrates with enterprise identity providers for SSO |
| q043 | Pro: individual developers, no org controls |
| q044 | Multi-select: Business + Enterprise have org-level usage reporting |
| q046 | Business available for GitHub Team orgs (not just Enterprise Cloud) |
| q047 | Multi-select: Business + Enterprise have content exclusion |
| q048 | Premium Support with SLAs is separate paid; not bundled with any plan |
| q049 | SSO is Enterprise Cloud org capability; Copilot Enterprise uses it, doesn't include it |
| q050 | GitHub Enterprise Cloud 30-day trial includes Copilot Business |
| q053 | Enterprise: Enterprise Cloud + advanced compliance + audit + identity |
| q054 | Enterprise: proxy support + advanced compliance; Premium Support SLAs separate |
| q055 | Business: org admins define/enforce policy settings for code suggestions |

---

## Quiz Command

```powershell
cd "d:\Projects\microsoft-exam-prep\GH-300 Prep"; python quiz_runner.py --day-lock 2
```

---

## Sources (verified during this session)

- [Plans for GitHub Copilot](https://docs.github.com/copilot/get-started/plans) — GitHub Docs
- [About individual GitHub Copilot plans and benefits](https://docs.github.com/en/copilot/concepts/billing/individual-plans) — GitHub Docs
- [GitHub Copilot licenses](https://docs.github.com/en/billing/concepts/product-billing/github-copilot-licenses) — GitHub Docs
- [GitHub Copilot features](https://docs.github.com/en/copilot/get-started/features) — GitHub Docs
- [Reviewing audit logs for GitHub Copilot](https://docs.github.com/copilot/managing-github-copilot-in-your-organization/reviewing-audit-logs-for-copilot-business) — GitHub Docs
- [Reviewing changes to content exclusions](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/configure-content-exclusion/review-changes) — GitHub Docs

---

## Notes (your own words — fill in after studying)

_(Add your own notes here after going through the material)_
