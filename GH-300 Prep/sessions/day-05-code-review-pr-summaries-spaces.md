# Day 5: Code Review, PR Summaries, Copilot Spaces, and GitHub Spark

**Date**: 2026-07-13  
**Exam**: GH-300  
**Domain**: Domain 2 - Use GitHub Copilot Features (25-30%)  
**Subtopics**: Copilot code review, pull request summaries, customizable review standards, Copilot Spaces, GitHub Spark, plan and availability refreshers  
**Estimated study time**: 2 hours

---

## TL;DR (60-second skim)

- **Code review finds issues; a PR summary explains the change.** Neither replaces human review, tests, security checks, or required approvals.
- On GitHub.com, request Copilot under **Reviewers**. Copilot leaves a **Comment** review, never an approval or request-changes verdict, and its review does not satisfy required approvals.
- Custom instructions can make reviews follow repository standards. Keep them short, direct, testable, and scoped; instructions do not guarantee complete enforcement.
- A PR summary is generated from the pull request diff. It identifies changes, impacted files, and reviewer focus areas, but it does not infer missing business intent reliably.
- Spaces are curated, reusable context collections for grounded Copilot conversations. They can contain GitHub sources, text, uploads, and images; permissions to a Space do not grant access to restricted source content.
- Spark builds and deploys full-stack web apps from natural language, visual controls, or code. It is an app builder, not a code-review tool, repository knowledge base, or background issue-to-PR agent.
- **Current docs differ from older exam-source wording.** In July 2026, Chat on GitHub and repository indexing are broader than the old “Enterprise-only repository-aware chat” description; network routing and identity integrations can also apply to Copilot Business.
- Content exclusion is **not universal**: current docs say Copilot CLI, Copilot cloud agent, and IDE Agent mode do not support it. Treat “applies on every surface” as outdated.

---

## Learning Objectives

After this session, you should be able to:

1. Request Copilot code review on GitHub.com, in an IDE, and from Copilot CLI.
2. Interpret, apply, discuss, dismiss, and validate Copilot review comments safely.
3. Configure automatic reviews and repository-specific review standards.
4. Distinguish code review, pull request summaries, Chat, IDE Agent mode, and Copilot cloud agent.
5. Generate and validate a pull request summary and explain its scope and limitations.
6. Design a Space with appropriate context, ownership, sharing, and permissions.
7. Explain Spark's build-iterate-publish workflow, availability, and limitations.
8. Select plan families by individual, organization, and enterprise needs without treating old feature matrices as timeless.
9. Recognize current-doc contradictions in older quiz wording without losing the exam concept being tested.
10. Apply safe testing, debugging, and large-project prompting patterns.

---

## Current Documentation Baseline: July 13, 2026

GitHub Copilot changes quickly. The GH-300 source pool includes wording based on older product boundaries. Use this rule:

1. For real work, use the current official documentation.
2. For the quiz, identify the historical distinction the stem is testing.
3. When the two conflict, do not convert the old distinction into a timeless fact.

### High-impact changes since older source material

| Area                     | Current official behavior                                                                                                                                            | Older exam-source wording to recognize                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Individual plans         | Free, Student, Pro, Pro+, and Max are documented. Paid usage now centers on GitHub AI Credits; some annual subscribers remain on legacy request billing.             | Often lists only Free, Pro/Pro+, Business, Enterprise and speaks of “premium requests.”                   |
| Chat on GitHub           | Copilot Free can use Chat on GitHub; repository-context conversations can trigger repository indexing. Feature depth and usage limits still vary by plan and policy. | “Repository-aware Chat on GitHub.com is Enterprise-only.”                                                 |
| Copilot Business signup  | New self-serve Business signups for GitHub Free/Team organizations have been temporarily paused since April 22, 2026; sales/enterprise routes may differ.            | Assumes ordinary self-serve Business purchase without qualification.                                      |
| Business vs Enterprise   | Both are organization plans with governance. Enterprise has more AI credits and priority/early feature access; availability is best checked in the live plan matrix. | Treats every identity, proxy, compliance, audit, or network requirement as automatically Enterprise-only. |
| Identity integrations    | A Copilot-only enterprise using **Copilot Business** can integrate with identity providers, SAML SSO, SCIM, and managed users.                                       | “SSO always means Copilot Enterprise.”                                                                    |
| Network routing          | Subscription-based routing can allow Business, Enterprise, or both, and block individual plans. Basic HTTP proxy support is a client/network capability.             | “Enterprise proxy support means Copilot Enterprise.”                                                      |
| Content exclusion        | Supported for many inline, Chat, and code-review surfaces, but **not** Copilot CLI, Copilot cloud agent, or IDE Agent mode.                                          | “Content exclusions apply globally across all Copilot surfaces.”                                          |
| Coding agent terminology | Current docs increasingly say **Copilot cloud agent**. It works asynchronously on GitHub and can create a PR. IDE Agent mode is a synchronous editor session.        | Combines “coding agent” and “Agent mode” into one label.                                                  |
| Spark availability       | Public preview; available to Pro+, Max, and Enterprise users. Enterprise admins must enable it; not available for GHEC with data residency.                          | May omit Max or preview/data-residency constraints.                                                       |
| Billing                  | As of June 1, 2026, current monthly plans use token-based AI Credits; code completions remain unlimited on paid plans.                                               | Uses premium-request quotas as the universal current model.                                               |

**Exam technique:** If a stem explicitly uses a legacy phrase such as “Enterprise-only repository-aware Chat,” answer the intended historical comparison in that question set. In production decisions, verify the live feature matrix.

---

## Key Concept 1: GitHub Copilot Code Review

### What it is

Copilot code review analyzes changed code, identifies potential defects or improvements, and may provide ready-to-apply suggestions. It is an **assistive reviewer**, not an approving authority.

Typical review categories include:

- Correctness and likely bugs
- Security and unsafe input handling
- Maintainability and readability
- Performance problems
- Test gaps
- Repository-specific conventions when instructions are available

Current docs say code review is available for all paid Copilot plans. Supported surfaces include GitHub.com, GitHub CLI, GitHub Mobile, VS Code, Visual Studio, Xcode, JetBrains IDEs, and Azure DevOps in public preview.

### How to request a review on GitHub.com

1. Create or open a pull request.
2. In the right sidebar, find **Reviewers**.
3. Next to **Copilot**, select **Request**.
4. Wait for the review and inspect every comment.
5. Apply, modify, discuss, resolve, or dismiss suggestions as appropriate.
6. Run tests and retain human review for material changes.

A REST API workflow can request `copilot-pull-request-reviewer[bot]` as a reviewer.

### What the review means

- Copilot always leaves a **Comment** review.
- It does not issue **Approve** or **Request changes**.
- It does not count toward required approvals.
- It does not block merging.
- Replies are visible to people, but Copilot does not participate in the comment thread as a human reviewer would.
- Suggested changes can be committed individually or in a batch after inspection.
- Where enabled, **Fix with Copilot** can delegate a review comment to the cloud agent.

### IDE workflows

In VS Code, you can review:

- A selected block: select code, right-click, then use **Generate Code > Review**.
- Uncommitted changes: use the Copilot code-review action in Source Control.

Comments appear inline and in the relevant Problems/Comments view. Applying a suggestion changes the working tree; it does not automatically commit it.

### CLI workflow

In Copilot CLI, `/review` asks Copilot to analyze changes. You can add a prompt, path, or file pattern. If Copilot proposes a command to inspect a diff or gather evidence, review and approve that command before execution.

**Current-vs-source note:** An older quiz item says CLI Chat drafts and explains commands but never runs them. That remains the safe conceptual boundary for simple command assistance, but current agentic CLI workflows can propose tool execution with explicit user approval. The safe invariant is **review before execution**, not “the CLI can never execute anything.”

### Automatic reviews

Automatic code review can be configured:

- For an individual's own pull requests on eligible individual paid plans.
- For a repository through branch rulesets.
- Across organizations or an enterprise through policy and ruleset controls.

A ruleset can target branches and automatically request Copilot review. This makes coverage consistent, but it still does not turn Copilot into a required human approver. Business or Enterprise administrators can also allow members without individual Copilot licenses to use code review on GitHub.com; current docs require paid AI-credit usage and the corresponding policy.

### Custom instructions and review standards

Use repository instructions to tell Copilot how this project should be reviewed. Common forms include:

- Repository-wide `.github/copilot-instructions.md`
- Path-specific instruction files where supported
- Organization or enterprise instructions where supported

Good review instructions are:

- Short and direct
- Grouped under clear headings
- Focused on observable requirements
- Specific about build, test, security, and compatibility constraints
- Scoped to the files where the rule applies

For example: require tests for public API behavior changes, preserve v1 compatibility, and flag logs containing tokens or personal data. Do not write vague instructions such as “make everything secure.” State the boundary, expected evidence, and prohibited behavior.

### Limitations and human responsibility

Copilot may:

- Miss defects or vulnerabilities.
- Report false positives.
- Misread product intent or hidden invariants.
- Ignore generated, vendored, lock, log, configuration, or other excluded file types.
- Produce suggestions that compile but violate architecture or policy.
- Overlook effects outside the visible diff.

Humans must still:

- Confirm behavior against requirements.
- Run unit, integration, security, and performance checks.
- Inspect dependencies and generated artifacts separately where necessary.
- Verify privacy, legal, licensing, and compliance implications.
- Apply branch protection and required review rules.

---

## Key Concept 2: Pull Request Summaries

### Purpose

A pull request summary gives reviewers a fast orientation to the diff. Copilot can describe:

- What changed
- Which files are affected
- What the reviewer should focus on

It is primarily **communication assistance**. It is not a defect detector, approval, test report, or guarantee that the PR matches its issue.

### Generation workflow

You can generate a summary:

- In the description of a new pull request
- While editing the opening description of an existing pull request
- In a comment on the pull request timeline

Workflow:

1. Open the PR description or comment field.
2. Select the Copilot action in the field toolbar.
3. Choose **Summary**.
4. Review and edit the generated text.
5. Add missing business reason, issue links, test evidence, rollout notes, risks, and breaking-change details.
6. Publish the PR or comment.

Current docs say this feature is not available in Copilot Free.

### Scope and input

The summary workflow builds context from raw diffs in summarizable files. It does not reliably know:

- Why the business requested the change
- Undocumented deployment steps
- External system behavior
- Test results that are not present in context
- Whether every requirement was met

GitHub recommends starting with a blank description because existing description content is not considered when generating the summary.

The responsible-use documentation currently lists English as the supported language.

### Summary versus review

| Capability       | Pull request summary                     | Copilot code review                                   |
| ---------------- | ---------------------------------------- | ----------------------------------------------------- |
| Primary question | “What changed?”                          | “What may be wrong or improvable?”                    |
| Main output      | Overview, file list, reviewer focus      | Inline comments and suggested fixes                   |
| Typical user     | PR author and reviewers                  | Author and reviewers                                  |
| Trigger          | Summary action in description/comment    | Request Copilot as reviewer, IDE action, or `/review` |
| Approval effect  | None                                     | Comment-only; no required approval credit             |
| Human follow-up  | Add intent, tests, risk, rollout details | Validate finding, patch, and broader impact           |

### Practical PR description checklist

A useful final description includes **What**, **Why**, **How**, **Testing**, **Risk**, **Rollout**, and **Review focus**. The generated summary can seed What and Review focus; the author remains responsible for the rest.

---

## Key Concept 3: Copilot Spaces

### Purpose

A Space is a curated context collection used to ground Copilot answers for a specific task, system, or shared body of knowledge. It persists beyond one Chat conversation and can be shared.

Use Spaces for:

- Onboarding to a codebase or subsystem
- A feature specification plus relevant implementation
- Architecture and operational knowledge
- Review checklists and standards
- Incident notes and runbooks
- Repeated processes that otherwise require the same explanation

### Supported context sources

Current docs say a Space can include:

- Repositories and code
- Pull requests and issues
- Free-text notes, transcripts, and instructions
- Uploaded files
- Images

GitHub-based sources stay synchronized as those sources change. Uploaded or pasted content should be treated as snapshots unless replaced.

### Availability and ownership

- Anyone with a Copilot license, including Copilot Free, can create and use Spaces.
- A Space can belong to a personal account or an organization.
- Create one at `https://github.com/copilot/spaces`.

### Collaboration and permissions

Organization-owned Spaces can grant organization members:

- **Admin:** manage the Space, content, and access
- **Editor:** update included context
- **Viewer:** use and inspect the Space without editing
- **No access:** explicitly excluded from that Space

Personal and organization Space sharing options differ. Public sharing should be used only when every included source is appropriate for public exposure.

**Critical permission rule:** Space access does not grant access to an underlying private repository, issue, PR, or file. A user's answers are bounded by the source permissions they already possess. A Space is context organization, not an authorization bypass.

### Building a good Space

Give it one purpose; add authoritative, relevant context; explain the audience and task; remove stale snapshots; assign least-privileged roles; test representative questions; and periodically audit sources and sharing.

### Limitations

- A Space improves grounding but does not guarantee correctness.
- Too much unrelated context can reduce answer quality.
- Conflicting sources can produce ambiguous answers.
- Synced sources can change after an earlier answer.
- Permissions still govern what each collaborator can retrieve.
- A Space does not execute a multi-step code change or open a PR by itself.
- A Space is not the same as repository custom instructions: instructions prescribe behavior; a Space curates reusable knowledge and task context.

---

## Key Concept 4: GitHub Spark

### Purpose

GitHub Spark is a natural-language app-building environment for creating, iterating, and deploying full-stack web applications. It can provide:

- Generated application code
- Live interactive preview
- Managed key-value data storage when needed
- GitHub authentication
- AI features through GitHub Models
- Prompt, visual, and code-based iteration
- One-click deployment to a managed runtime
- Repository creation and Codespaces integration for deeper development

### Availability as of July 2026

Copilot Pro+, Copilot Max, and Copilot Enterprise are listed in current prerequisites. Spark is in public preview, disabled by default for enterprise-provided access until enabled, and unavailable for GHEC with data residency. The policy blocking suggestions matching public code may not work as intended in Spark, so check the current policy note for sensitive use.

### Build workflow

At `https://github.com/spark`, describe users, workflow, data, constraints, and acceptance criteria; inspect the live preview; then iterate with prompts, visual controls, or code. Inspect AI prompts and data behavior, sync a repository, use Codespaces for deeper editing, and test authentication, authorization, storage, failures, accessibility, and security before publishing. Monitor and revise the deployed app.

### What Spark is not

| Do not confuse Spark with... | Why                                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| Copilot cloud agent          | Cloud agent performs repository tasks and can create PRs; Spark creates and hosts web apps.           |
| IDE Agent mode               | Agent mode edits an existing workspace interactively; Spark starts from an app idea and live preview. |
| Copilot Spaces               | Spaces curate knowledge for grounded Chat; Spark produces an application.                             |
| Pull request summary         | A summary describes a diff; Spark generates and deploys software.                                     |
| GitHub Codespaces            | Codespaces is a cloud development environment; Spark can integrate with one.                          |
| GitHub Pages                 | Pages hosts static sites; Spark provides a managed full-stack app experience.                         |

### Prompting Spark safely

State intended users and permissions, the core journey, data and retention, authentication and authorization, error states, accessibility, security constraints, and acceptance criteria. Never include real secrets, production credentials, regulated records, or private customer data. Generated authentication and storage still require validation.

---

## Agent Mode, Standard Chat, and Copilot Cloud Agent

| Capability        | Standard Chat                         | IDE Agent mode                                      | Copilot cloud agent                                                                                              |
| ----------------- | ------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Interaction       | Conversational, user-driven           | Synchronous agentic session                         | Asynchronous/background GitHub session                                                                           |
| Typical work      | Explain, suggest, answer, small edits | Plan, edit multiple files, run tools with approvals | Research repository, change branch, test, create PR                                                              |
| Environment       | Chat surface                          | Local/editor workspace                              | Ephemeral GitHub Actions-powered environment                                                                     |
| PR behavior       | Can advise about a PR                 | Can prepare local changes; may delegate             | Issue assignment always creates a PR; prompt-started sessions use a branch by default unless asked to create one |
| Human role        | Supply context and validate           | Approve tools, steer, review diffs                  | Review session, diff, CI, and PR                                                                                 |
| Content exclusion | Depends on supported Chat surface     | Not supported by current content-exclusion docs     | Not supported by current content-exclusion docs                                                                  |

When a stem says **multi-step work plus a PR**, identify the cloud/coding agent workflow. When it says **multi-step edits and tools in the editor**, identify IDE Agent mode. Do not merge these into one architecture even if older choices put them in one label.

---

## Plan and Governance Refresher

### Plan-selection ladder

| Need                                                                     | Current plan family to consider                  | Exam recognition cue                                                       |
| ------------------------------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------- |
| Limited no-cost personal exploration                                     | Copilot Free                                     | Limited personal use; no organization management                           |
| Paid personal Chat and coding features                                   | Pro, Pro+, or Max depending usage/model/features | “Individual developer; no org governance”                                  |
| Organization licenses, policy, metrics, content exclusion                | Business or Enterprise                           | Business is the baseline organization-governance answer in older questions |
| More AI credits, priority access, Enterprise-only feature in live matrix | Enterprise                                       | Verify the exact feature; do not infer from the word “enterprise” alone    |
| Spark for an individual                                                  | Pro+ or Max                                      | Not Free or basic Pro                                                      |
| Spark supplied through an organization                                   | Enterprise with admin enablement                 | Public preview and no GHEC data-residency support                          |

### Administration

Organization owners can grant Business access to members. Enterprise owners can select Business or Enterprise per organization, and current docs also permit direct enterprise assignment of Business licenses to users or teams. Copilot Enterprise remains a separate paid subscription; GHEC eligibility is not bundling.

### Identity, network, and support nuance

SAML SSO, SCIM, managed users, and IdP group sync belong to GitHub's account/enterprise identity architecture, not exclusively to one Copilot SKU; a Copilot-only enterprise can use Business with IdP integration. HTTP proxy and custom certificates are network/client capabilities, subscription routing can allow Business and/or Enterprise while blocking personal plans, and support SLAs come from the applicable GitHub support agreement.

### GHES boundary

Copilot inference remains a cloud service; there is no fully self-hosted or air-gapped Copilot model that runs inside GHES. However, current docs show some integrations can work with GHES, such as a **local GitHub MCP server**. Therefore:

- Reject claims that Copilot runs entirely on-premises inside GHES.
- Do not generalize that “nothing Copilot-related can interact with GHES.”
- Distinguish Copilot service hosting from an integration's ability to access a GHES API.

---

## Content Exclusion: Current Scope and Trap

Content exclusion is available to organizations with Copilot Business or Enterprise. Repository administrators, organization owners, and enterprise owners can configure it at their allowed scopes.

When supported, excluded files:

- Do not receive inline suggestions.
- Do not inform suggestions in other files.
- Do not inform Chat responses.
- Are not reviewed by Copilot code review.

Current official exception list:

- Copilot CLI does not support content exclusion.
- Copilot cloud agent does not support content exclusion.
- IDE Agent mode does not support content exclusion.

This is a direct contradiction of the older “global input fence on every surface” explanation in the source pool. For safe deployment, use feature-specific policy matrices and additional repository, agent, network, and access controls.

---

## Testing, Debugging, and Large-Project Productivity

Copilot can draft test scaffolding, assertions, fixtures, mocks, inputs, edge cases, and TDD tests. A test runner, IDE, CI system, or approved agent tool invocation executes tests; Chat text is not proof of execution.

For debugging, provide the smallest failing path plus the exact error, stack trace, environment, and reproduction. Ask for evidence-ranked hypotheses, a minimal patch, side effects, security impact, and regression tests. Run the tests and inspect real output. Avoid unbounded prompts such as “fix everything.”

For large projects, name relevant files, symbols, modules, and interfaces; reuse existing types; preserve public APIs unless requested; split work into reviewable changes; and add tests around shared contracts. Use Spaces for curated knowledge, cloud agent for bounded background work, and Agent mode for interactive local work. Productivity reduces search and drafting time; it does not remove human ownership.

---

## Common Exam Traps and Misconceptions

1. **Summary equals review.** A summary describes; a review critiques.
2. **Copilot review approves a PR.** It leaves Comment-only feedback and never satisfies required approvals.
3. **Custom instructions are enforcement.** They guide model behavior; branch protections, tests, policies, and human review enforce outcomes.
4. **Agent mode equals cloud agent.** One is an interactive IDE session; the other is a background GitHub workflow that works on branches and PRs.
5. **A Space grants source access.** Underlying repository permissions still apply.
6. **Spark is a coding agent.** Spark builds and deploys apps; it is not an issue-to-PR worker.
7. **All Copilot policies affect all surfaces.** The supported-surface matrix has exceptions; content exclusion is a major one.
8. **SSO necessarily selects Copilot Enterprise.** This is an older exam cue, but current Copilot Business enterprise accounts can integrate with IdPs and SSO.
9. **Proxy support is Enterprise-only.** Current basic proxy support is general, and subscription routing supports Business and Enterprise endpoints.
10. **GHEC includes Copilot Enterprise.** Eligibility and bundling are different; Copilot is separately purchased.
11. **GHES means a self-hosted Copilot model.** Copilot is cloud-hosted; selected local integrations do not change that.
12. **Chat or code generation ran tests.** Require actual runner output.
13. **Free means no Chat.** Current Free includes limited Chat; older items may describe a narrower historical Free tier.
14. **GitHub Desktop hosts Copilot Chat.** Current docs describe Copilot-generated commit messages/descriptions in Desktop, not Desktop as a general Chat surface.
15. **Repository-aware GitHub Chat is permanently Enterprise-only.** Current repository indexing and GitHub Chat availability are broader; treat that wording as historical.

---

## Practical Scenarios

| Scenario                                           | Correct workflow and reason                                                               |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Payments PR needs fast feedback plus two approvals | Automatic Copilot review with security instructions, while retaining two human approvals  |
| A 40-file PR needs orientation                     | Generate a summary, add intent/test/risk details, then request code review separately     |
| Repeated authentication onboarding                 | Share an organization Space with code, architecture, runbooks, and least-privileged roles |
| Bounded parser test-coverage issue                 | Delegate to cloud agent with file and test constraints, then review its PR and CI         |
| Authenticated feedback-app prototype               | Use Spark, validate auth/data behavior, sync a repository, test, then publish             |

---

## Quiz-Aligned Refreshers

This table maps every assigned Day 5 item to the concept and trap you must recognize. It intentionally omits option letters and answer-key wording.

| Question ID | Concept to master                                                                                    | Trap to avoid                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| q139        | Organization plan baseline for centralized licenses, usage visibility, policy, and content exclusion | Escalating every organization-control requirement to the highest tier                 |
| q146        | Repository-context Chat on GitHub and historical plan boundaries                                     | Treating an older Enterprise-only feature matrix as current forever                   |
| q147        | Organization-owner versus enterprise-owner administration and per-organization plan enablement       | Giving purchase or seat authority to repository admins or ordinary members            |
| q148        | Cloud/coding agent performs bounded multi-step repository work and can create a PR                   | Confusing inline completion, IDE Agent mode, and background cloud agent               |
| q152        | Proxy, firewall allowlist, subscription routing, and secure network controls                         | Treating basic proxy support as an intrinsic single-plan feature                      |
| q153        | Chat surfaces versus feature-specific availability; GitHub Desktop's narrower Copilot function       | Assuming every GitHub client is a general Chat host or relying on an old surface list |
| q154        | Cloud-hosted Copilot versus GHES and local integrations                                              | Believing a fully on-premises/self-hosted Copilot model exists                        |
| q155        | CLI assistance for commands plus modern approval-based agentic execution                             | Running generated destructive commands without inspection                             |
| q157        | Content-exclusion effects and explicit unsupported agentic/CLI surfaces                              | Claiming exclusions apply universally                                                 |
| q158        | Limited no-cost personal plan and current Free capabilities                                          | Assigning organization governance to a personal free tier                             |
| q159        | Organization metrics and management without requiring the top tier                                   | Assuming usage visibility alone requires Enterprise                                   |
| q160        | Organization control of repository/code context through policies and exclusions                      | Confusing individual settings with organization governance                            |
| q161        | Paid individual features without organization management                                             | Choosing an organization plan for a solo-developer requirement                        |
| q162        | GHEC eligibility versus separately purchased Copilot subscription                                    | Reading “available to” as “included with”                                             |
| q164        | Enterprise identity architecture and current Business identity-provider nuance                       | Memorizing “SSO equals Enterprise SKU” without checking current docs                  |
| q166        | GitHub support agreement/SLA versus Copilot feature plan                                             | Treating support terms as a Copilot model capability                                  |
| q167        | Team usage reporting, seats, and policy management                                                   | Overbuying enterprise integrations when team governance is enough                     |
| q168        | Individual plan family for a developer without organization needs                                    | Confusing limited Free with full paid individual usage                                |
| q170        | IdP/SSO plan-selection wording and current Copilot-only enterprise options                           | Ignoring that current Business can use enterprise-grade identity integration          |
| q185        | Test drafting versus actual test execution                                                           | Treating generated tests or prose as runner evidence                                  |
| q186        | Evidence-driven debugging with suggested fixes and alternatives                                      | Assuming Copilot replaces QA, validation, or deployment controls                      |
| q188        | Workspace/repository context for coherent multi-file assistance                                      | Asking for unbounded autonomous rewrites                                              |
| q189        | Standard Chat versus agentic multi-step execution                                                    | Treating conversational suggestions and tool-using agents as identical                |

---

## Rapid Recall Card

### One-line distinctions

- **Code review:** detects and comments on potential issues.
- **PR summary:** explains the diff to reviewers.
- **Standard Chat:** conversational assistance.
- **IDE Agent mode:** synchronous multi-step editing and tools in your workspace.
- **Cloud agent:** asynchronous repository task on GitHub, branch/PR oriented.
- **Space:** curated reusable context for grounded conversations.
- **Spark:** prompt-to-full-stack-app builder and managed deployment.
- **Custom instructions:** persistent behavioral guidance, not enforcement.
- **Content exclusion:** supported-surface input boundary with agentic exceptions.

### Trigger recall

| Goal                          | Trigger                                           |
| ----------------------------- | ------------------------------------------------- |
| Review a GitHub PR            | Request **Copilot** under **Reviewers**           |
| Review CLI changes            | `/review`                                         |
| Describe a PR diff            | Copilot **Summary** action in description/comment |
| Ground repeated Q&A           | Create a Space at `github.com/copilot/spaces`     |
| Delegate issue work           | Assign issue to Copilot cloud agent               |
| Build a web app from a prompt | Start at `github.com/spark`                       |

### Human-control invariants

- Read every generated comment and patch.
- Never treat a summary as test evidence.
- Never treat Copilot review as an approval.
- Require actual tests, checks, and policy enforcement.
- Preserve least privilege for Spaces and agents.
- Use narrow prompts with explicit constraints and acceptance criteria.

---

## Related Questions in `questions.json`

Primary Day 5 assignment: q139, q146, q147, q148, q152, q153, q154, q155, q157, q158, q159, q160, q161, q162, q164, q166, q167, q168, q170, q185, q186, q188, q189.

The day-lock runner also adds up to three recent questions from completed days for spaced repetition.

### Exact no-spoiler quiz command

Run from the `GH-300 Prep` directory after finishing this reference:

```powershell
python quiz_runner.py questions.json --day-lock 5 --carryover 3 --shuffle --open-images --web --port 8765
```

The local runner supports `--day-lock`, `--carryover`, `--shuffle`, `--open-images`, `--web`, and `--port`. Day 5 therefore serves the 23 assigned questions plus up to three prior-day carryovers.

---

## Sources (verified during this session)

- [Plans for GitHub Copilot](https://docs.github.com/en/copilot/get-started/plans)
- [GitHub Copilot features](https://docs.github.com/en/copilot/get-started/features)
- [About GitHub Copilot code review](https://docs.github.com/en/copilot/concepts/agents/code-review)
- [Using GitHub Copilot code review on GitHub](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/copilot-code-review)
- [Requesting a code review with GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/agentic-code-review)
- [Using custom instructions to customize code review](https://docs.github.com/en/copilot/tutorials/customize-code-review)
- [Creating a pull request summary with GitHub Copilot](https://docs.github.com/en/copilot/how-tos/copilot-on-github/copilot-for-github-tasks/create-a-pr-summary)
- [Responsible use of pull request summaries](https://docs.github.com/en/copilot/responsible-use/pull-request-summaries)
- [About GitHub Copilot Spaces](https://docs.github.com/en/copilot/concepts/context/spaces)
- [About GitHub Spark](https://docs.github.com/en/copilot/concepts/spark)
- [Building and deploying apps with GitHub Spark](https://docs.github.com/en/copilot/tutorials/spark/build-apps-with-spark)
- [About GitHub Copilot cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent)
- [Content exclusion for GitHub Copilot](https://docs.github.com/en/copilot/concepts/context/content-exclusion)
- [Excluding content from GitHub Copilot](https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/exclude-content-from-copilot)
- [Managing Copilot network access](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-access/manage-network-access)
- [Network settings for GitHub Copilot](https://docs.github.com/en/copilot/concepts/network-settings)
- [About enterprise accounts for Copilot Business](https://docs.github.com/en/copilot/concepts/about-enterprise-accounts-for-copilot-business)
- [Granting users access to Copilot in an enterprise](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-access/grant-access)
- [Billing for organizations and enterprises](https://docs.github.com/en/copilot/concepts/billing/organizations-and-enterprises)
- [Repository indexing for GitHub Copilot](https://docs.github.com/en/copilot/concepts/context/repository-indexing)
