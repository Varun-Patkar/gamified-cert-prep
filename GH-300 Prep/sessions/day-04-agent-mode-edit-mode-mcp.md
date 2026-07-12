# Day 4: Agent Mode, Edit Mode, and MCP

**Date**: 2026-07-12
**Domain**: Domain 2 - GitHub Copilot features and plans (25-30%)
**Subtopics**: Agent Mode multi-step execution; legacy Edit Mode; MCP fundamentals, configuration, and security; subagents; agent session management; diagnostics; plan governance; secure prompting
**Estimated study time**: 2.5 hours

---

## TL;DR (60-second skim)

- **Ask/chat explains; targeted editing changes a controlled scope; an agent plans, edits, runs tools, validates, and iterates.** Autonomy and tool use are the main distinctions.
- The exam's **Edit mode** wording describes user-scoped, review-first multi-file edits. Current VS Code emphasizes agents, inline chat, and reviewing individual edits, so recognize both vocabularies.
- A **local agent** runs interactively in VS Code against the current workspace. A **cloud/coding agent** works asynchronously in a GitHub-hosted environment and normally produces a pull request for human review.
- **MCP is an open protocol**, not a model or autonomous agent. It standardizes how an AI host discovers and invokes external tools and accesses external context.
- Treat every MCP server as code with delegated authority: verify the publisher, inspect configuration, grant least privilege, review tool calls, and never place secrets directly in committed configuration.
- Agentic does not mean uncontrolled. Terminal commands, sensitive tools, authentication, branch protections, CI, required reviews, and merge permissions remain trust boundaries.
- Current July 2026 plan names extend beyond older exam wording. Preserve the exam's core split: individual plans are self-managed; Business and Enterprise add organization governance, with Enterprise aimed at broader enterprise-scale capabilities.
- For SQL, secrets, and migrations, prompts must specify concrete constraints, safety rails, validation, and rollback behavior rather than merely asking for code.

---

## Learning Objectives

After this session, you should be able to:

1. Select inline assistance, Ask/chat, targeted editing, a local agent, or a cloud coding agent for a scenario.
2. Explain the agent loop: understand, plan, choose tools, act, observe results, self-correct, and request approval where required.
3. Describe MCP client-server architecture and distinguish tools, resources, prompts, and the model itself.
4. Configure and govern MCP at the appropriate user, workspace, repository, organization, or enterprise boundary.
5. Evaluate MCP and agent security using trust, least privilege, approval, secret handling, and auditability.
6. Explain local, background, and cloud agent sessions and the role of subagents without relying on version-sensitive UI labels.
7. Troubleshoot Copilot in VS Code using diagnostics, Output logs, extension logs, trace logging, and Developer Tools.
8. Reconcile legacy exam plan wording with the official plan taxonomy current on 2026-07-12.
9. Write constrained prompts for SQL, secrets, database migrations, tests, documentation, debugging, and unfamiliar code.

---

## Version-Sensitive Terminology

The GH-300 question bank and product documentation evolve at different speeds. Use this translation table.

| Exam or legacy term | Current-product interpretation | Stable concept to remember |
| --- | --- | --- |
| Ask mode | Conversational assistance that primarily answers and explains | Human asks; Copilot responds; no autonomous workflow is implied |
| Edit mode / Copilot Edits | User-scoped editing with reviewable diffs; current clients may express this through inline chat, edit actions, or an agent with tightly bounded context | User controls scope and accepts/rejects edits |
| Agent mode | A local agent that can plan, choose files/tools, edit, run commands, observe results, and iterate | Multi-step orchestration and greater autonomy |
| Copilot coding agent | Current GitHub docs may say cloud agent; an asynchronous agent working in a GitHub-provided environment | Delegate task, track session, review resulting PR |
| Subagent | A separate delegated agent context used for a focused task | Isolation, specialization, parallelism, summarized result |
| Premium requests | Many current pages now describe AI credits and usage allowances | Limits and billing vocabulary are version-sensitive |
| Free / Pro / Pro+ only | Current individual lineup also includes Student and Max | Do not mistake obsolete taxonomy for current taxonomy |

**Exam rule**: answer the scenario's tested distinction, but do not turn historical wording into a false current-product claim.

---

## Key Concepts

### 1. Assistance Spectrum: From Completion to Autonomous Work

Copilot features sit on a spectrum of scope, autonomy, and execution authority.

| Experience | Best for | Context and scope | Can edit? | Can run tools/commands? | Human control point |
| --- | --- | --- | --- | --- | --- |
| Inline suggestion | Completing the code being typed | Cursor, nearby code, editor context | Inserts accepted suggestion into current editor | No autonomous tool loop | Accept or dismiss ghost text |
| Ask/chat | Explanations, design questions, snippets, debugging hypotheses | Prompt plus attached/selected context | Usually proposes code; surface may offer apply actions | Not inherently autonomous | Evaluate response and choose next action |
| Targeted edit / legacy Edit mode | Surgical changes across known files | Files or selections chosen by user | Yes, with reviewable diffs | Limited compared with agentic orchestration | Keep, undo, accept, or reject edits |
| Local Agent | Multi-file implementation, refactor, debugging, test-and-fix loop | Current workspace plus configured tools | Yes; selects relevant files | Yes, subject to approvals and policy | Review actions, commands, diffs, and final result |
| Background agent | Work that should continue while the user does something else | Isolated local/background worktree or environment, product-dependent | Yes | Yes within granted environment | Track session and review result |
| Cloud/coding agent | Asynchronous GitHub task that should culminate in reviewable repository changes | Repository and configured cloud environment | Yes | Yes within its sandbox and permissions | Inspect session log and review PR |

#### Inline acceptance is not deployment

Accepting an inline suggestion converts ghost text into normal text in the editor buffer. It does **not** automatically:

- stage the file;
- create a commit;
- push a branch;
- approve a pull request;
- bypass CI or branch protection;
- merge into the default branch.

Treat accepted code as newly authored code: inspect, test, lint, scan, and review it.

### 2. Agent Mode and the Agentic Loop

A local agent in VS Code can:

- inspect the workspace and search for relevant code;
- build and revise a plan;
- choose built-in, extension-provided, or MCP tools;
- create and edit multiple files;
- run builds, tests, linters, scripts, and terminal commands when allowed;
- read errors and command output;
- self-correct and repeat until a stopping condition is reached;
- ask the user for missing information or approval.

The conceptual loop is:

```text
Goal -> gather context -> plan -> select tool -> act -> observe -> validate
  ^                                                        |
  +---------------- revise or ask for help ----------------+
```

Agent mode is appropriate when the work cannot be completed as one isolated text transformation. Examples include a framework migration, a feature spanning API/UI/tests, or diagnosing and repairing a failing test suite.

Agent mode does **not** guarantee correctness. The model can select the wrong files, misunderstand command output, over-expand scope, or repeatedly pursue a bad hypothesis. Give it acceptance criteria and a validation command, then review its work.

### 3. Edit Mode Versus Agent Mode

Legacy Edit mode is best understood as **controlled transformation**:

- the user identifies the intended files or selections;
- Copilot proposes edits within that scope;
- the user reviews diffs and keeps or rejects changes;
- the user remains the workflow orchestrator.

Agent mode is **goal-directed orchestration**:

- the user states an outcome and constraints;
- the agent determines which files and tools are relevant;
- it performs multiple steps and uses feedback to continue;
- it can run validation and repair failures;
- the user reviews approvals and the final result.

| Signal in a scenario | Prefer targeted edit | Prefer agent |
| --- | --- | --- |
| Exact file and exact transformation are known | Yes | Usually unnecessary |
| User must tightly bound touched files | Yes | Only with explicit constraints |
| Need to discover affected files | Weak fit | Strong fit |
| Need to run tests and react to failures | Manual orchestration | Strong fit |
| Need a migration across code, config, and tests | Possible but labor-intensive | Strong fit |
| Need a quick explanation without changes | No | Use Ask/chat instead |

Neither mode grants permission to auto-merge or bypass repository governance.

### 4. Local Agent Versus GitHub Cloud/Coding Agent

These are often conflated in exam material.

| Dimension | Local agent in VS Code | Cloud/coding agent on GitHub |
| --- | --- | --- |
| Execution location | User's current VS Code environment | GitHub-hosted or configured cloud environment |
| Interaction | Synchronous and iterative | Asynchronous delegation |
| Context | Local workspace, editor state, local tools | Repository checkout, issue/task, environment configuration |
| Result | Workspace edits for immediate review | Typically a branch and pull request |
| Tracking | Chat/session view; current clients retain sessions | Agents panel/tab, IDE integrations, CLI, and session logs |
| Good fit | Debugging with local state and rapid conversation | Well-defined backlog task that can run independently |

The cloud agent remains governed by repository permissions, branch protections, Actions policy, review requirements, and its scoped token. A generated PR is a proposal, not an approved merge.

### 5. MCP Fundamentals

The **Model Context Protocol (MCP)** is an open standard for connecting AI applications to external tools and data sources.

Core roles:

- **Host**: the AI application, such as VS Code or another Copilot surface.
- **MCP client**: the component in the host that connects to one server and negotiates capabilities.
- **MCP server**: a local process or remote service that exposes capabilities through the protocol.
- **Model/agent**: decides, within policy, whether a capability is relevant; it is not the MCP server.

Common capability types in the MCP specification:

| Capability | Meaning | Example |
| --- | --- | --- |
| Tools | Callable operations that can cause reads or writes | Query an issue tracker, run a database query, create an issue |
| Resources | Context/data exposed for reading | Documentation, schema, repository metadata |
| Prompts | Reusable server-provided prompt templates | A standard incident-triage workflow |

Support differs by host. For example, current GitHub cloud-agent documentation states that its repository MCP integration supports MCP **tools**, not necessarily all resources or prompts. Never infer universal support from the protocol alone.

#### What MCP does

- standardizes discovery and invocation of external capabilities;
- reduces bespoke integrations between each AI host and each service;
- supplies live or specialized context unavailable in the model's training data;
- lets agents act through APIs under configured credentials and permissions.

#### What MCP does not do

- It is not an LLM, agent, database, plugin marketplace, or permission system.
- It does not make tool output correct or safe.
- It does not automatically authorize access to a service.
- It does not override the service's authentication or access controls.
- It does not remove the need for user/tool approval or organizational policy.
- It does not guarantee that every host supports every MCP capability.

### 6. MCP Transports and Configuration Scope

Two common connection patterns are:

- **Local/stdio**: the host launches a local executable and communicates through standard input/output. This inherits local process risk and local user permissions.
- **Remote HTTP**: the host connects to a hosted endpoint. This introduces network, identity, TLS, data-egress, and service-trust considerations.

In VS Code, MCP configuration can be personal or workspace-oriented, depending on how it is installed and stored. A workspace configuration is shareable and should be reviewed like executable project configuration because it can cause local processes to start. User configuration is private to the developer but still carries the developer's authority.

GitHub also supports repository-level MCP configuration for cloud agent and code review. That is a different execution boundary from a local VS Code MCP configuration. Organization and enterprise policies can govern whether managed users may use MCP and which servers are permitted.

**Configuration decision**:

1. Personal experiment used only by one developer -> user scope.
2. Repeatable local tool needed by the project -> workspace scope, reviewed in source control.
3. Cloud agent needs a service while working on one repository -> repository MCP settings.
4. Organization must standardize or restrict available servers -> organization/enterprise policy, registry, or allowlist.

Never commit raw tokens. Use supported input variables, environment variables, OAuth flows, or a secret store. Remember that environment variables still become available to the launched process.

### 7. MCP Trust and Security Boundaries

An MCP tool can be as powerful as the credential and operating-system identity behind it. Evaluate these boundaries:

| Boundary | Risk | Control |
| --- | --- | --- |
| Server installation | Malicious or compromised package executes code | Verify source/publisher; pin/review deployments; prefer trusted registries |
| Process authority | Local server inherits user permissions | Run with least privilege; sandbox where possible |
| Authentication | Token grants excessive service access | Use narrowly scoped, short-lived credentials |
| Tool selection | Agent invokes an unintended operation | Restrict tool list; require approvals for sensitive actions |
| Arguments | Prompt injection or model error supplies dangerous input | Validate server-side; use allowlists and parameter checks |
| Data egress | Prompt/context leaves expected boundary | Review endpoint and privacy posture; exclude sensitive content |
| Writes | Tool mutates production or source control | Separate read/write tools; use staging; require human confirmation |
| Configuration | Shared config silently changes executable/URL | Review config diffs as code; protect branches |

#### Approval nuance

Approval behavior depends on the host and deployment boundary. A local IDE may ask to trust a server and may ask before certain tools or terminal commands. Current GitHub repository MCP documentation warns that, once configured for the cloud agent, tools may be used autonomously without per-call approval. Therefore:

- do not memorize “MCP always asks” or “MCP never asks”;
- identify the host, policy, and server configuration in the scenario;
- grant only the authority acceptable for unattended invocation.

#### Prompt injection

External content returned through MCP can contain hostile instructions. The agent should treat tool output as data, not higher-priority policy. Reduce risk by limiting reachable data, validating responses, constraining tools, separating read from write authority, and requiring review for consequential operations.

### 8. Subagents and Delegation

A subagent is a specialized delegated agent context. The parent agent can assign a bounded task, the subagent works with its own context window and allowed tools, and the result is returned as a summary or artifact.

Benefits:

- preserves the parent context by isolating detailed exploration;
- enables specialization such as testing, security review, or documentation;
- permits parallel investigation when tasks are independent;
- limits tools for a read-only or narrowly scoped role.

Tradeoffs:

- delegation consumes additional usage and time;
- summaries can omit important evidence;
- parallel agents can conflict if they edit overlapping files;
- more agents do not make an ambiguous task clearer;
- every delegated action remains subject to permissions and review.

**Version-sensitive note**: names, UI placement, and exact delegation controls change quickly. For GH-300, remember the stable idea: a parent can delegate focused work to isolated specialist contexts, while session and tool governance still apply.

### 9. Agent Session Management

A session records the task's conversation, actions, tool calls, progress, and result. Current GitHub documentation exposes cloud/coding-agent sessions through an agents panel/page and integrations such as VS Code and CLI. Session logs help explain the agent's approach.

Session lifecycle:

1. Start from a clear task, issue, prompt, or IDE request.
2. Track status: queued, running, waiting/blocked, completed, or failed terminology may vary.
3. Inspect logs and tool activity rather than judging only the final diff.
4. Intervene with clarification when supported, or stop a runaway/incorrect task.
5. Review changed files, tests, security impact, and PR checks.
6. Continue in the same session when context is useful; start a new one when the goal changes materially.
7. Close/archive completed sessions according to the client experience.

Current VS Code also distinguishes local, background, and cloud agent workflows and can show sessions across them. Preview UI such as the Agents window is product-version-sensitive; the durable exam concept is that asynchronous agent work must be observable, interruptible, and reviewable.

### 10. Concise VS Code Diagnostics Workflow

Use the least invasive evidence first.

1. Check GitHub Status and confirm the editor and Copilot extensions are current.
2. Open **View -> Output**, then select **GitHub Copilot** or the relevant Copilot Chat channel.
3. Open the Command Palette with **Ctrl+Shift+P** on Windows/Linux or **Cmd+Shift+P** on macOS.
4. Run **GitHub Copilot: Collect Diagnostics** when available. Inspect the report before sharing it; use its reachability/environment information for proxy, firewall, certificate, extension, and version issues.
5. Run **Developer: Open Extension Logs Folder** to collect the underlying extension log files.
6. For deeper extension runtime/Electron evidence, run **Developer: Toggle Developer Tools** and inspect the Console.
7. If normal logs are insufficient, use **Developer: Set Log Level**, select the relevant GitHub/Copilot extension, temporarily choose **Trace**, reproduce once, collect evidence, then restore the prior level.
8. Redact tokens, repository secrets, personal data, and proprietary source before attaching artifacts to a support ticket.

Output logs, extension logs, diagnostics reports, and Electron Developer Tools are complementary; none is a substitute for all the others.

---

## Decision Frameworks

### Which Copilot Experience?

```text
Do you only need the next code fragment while typing?
  Yes -> Inline suggestion.
  No  -> Do you need explanation, brainstorming, or a proposed snippet?
           Yes -> Ask/chat.
           No  -> Are exact files and the exact transformation known?
                    Yes -> Targeted edit / inline chat / legacy Edit mode.
                    No  -> Must the task use tools, run tests, and react to results?
                             Yes -> Agent.
                             No  -> Start with Ask/Plan, then choose edit or agent.

Should work continue asynchronously and produce a PR?
  Yes -> Cloud/coding agent.
  No  -> Local agent in the active workspace.
```

### Is an MCP Server Safe Enough to Enable?

```text
Is the publisher and source trusted?
  No -> Do not install.
  Yes -> Are the exposed tools necessary for this task?
           No -> Disable/remove unnecessary tools.
           Yes -> Are credentials least-privileged and secrets externalized?
                    No -> Fix authentication design first.
                    Yes -> Can any tool mutate source, production, billing, or identity?
                             Yes -> Add explicit approvals, staging, and audit controls.
                             No  -> Enable, monitor, and periodically review.
```

### Business or Enterprise in Exam Scenarios?

```text
Personal, self-managed use -> individual plan family.
Central seats, organization policy, content controls, usage visibility -> Business baseline.
Same governance plus broader enterprise-scale rollout/allowances/integrations -> Enterprise.
Audit logs alone -> do not assume Enterprise-only; current docs allow Business or Enterprise.
```

---

## Comparisons the Exam Likes to Confuse

### Ask/Chat, Edit, Agent, and Coding Agent

| Question clue | Ask/chat | Edit (legacy) | Local agent | Cloud/coding agent |
| --- | --- | --- | --- | --- |
| Explain unfamiliar code | Best initial choice | Not needed | Useful if investigation requires tools | Usually excessive |
| User chooses target files | Optional attachments | Defining behavior | Agent may choose more files | Agent operates over repository task |
| Multi-step tool loop | No inherent loop | User coordinates | Yes | Yes |
| Runs commands and reacts | No inherent behavior | Usually user-driven | Yes, with local approvals | Yes, in cloud environment |
| Works after user switches tasks | Chat remains but is interactive | No autonomous continuation | Background/local options vary | Yes, designed for asynchronous work |
| Typical final artifact | Answer or snippet | Reviewed workspace diff | Validated local changes | Pull request for review |

### MCP Versus Related Customizations

| Mechanism | Primary purpose | Does it execute external operations? |
| --- | --- | --- |
| Instructions | Persistent coding rules and conventions | No, not by itself |
| Prompt file/template | Reusable task prompt | No, not by itself |
| Agent skill | Packaged specialized workflow/knowledge, often loaded when relevant | May direct tool use through the agent |
| Custom agent | Specialized persona with instructions, model, and allowed tools | Can, according to its tools |
| MCP server | Standardized external tools and data integration | Yes, if it exposes callable tools |
| Extension tool | Capability contributed directly by an IDE extension | Yes, according to the extension |

### Current Plan Taxonomy Versus Legacy Quiz Taxonomy

| Audience | Current official names found on 2026-07-12 | Exam-safe interpretation |
| --- | --- | --- |
| Individuals | Free, Student, Pro, Pro+, Max | Free is limited/personal; paid or eligibility-based individual plans add allowances/features |
| Organizations/enterprises | Business, Enterprise | Both provide managed access and governance; Enterprise targets larger enterprise needs and higher allowances |

Important current changes:

- Official plan documentation now uses **AI credits** and includes newer individual plans.
- Verified students have a named **Copilot Student** plan in current documentation; verified teachers and eligible open-source maintainers may qualify for free Pro access.
- New self-serve sign-ups for some paid plans were temporarily paused in April 2026 according to the official plans and quickstart pages. This operational notice is not the core exam distinction.
- Current plan matrices change rapidly. Use the official plan comparison for live procurement decisions.

### Governance Capabilities

| Requirement | Individual plans | Business | Enterprise |
| --- | --- | --- | --- |
| Self-managed developer access | Yes | Seat assigned by organization/enterprise | Seat assigned by organization/enterprise |
| Central seat/license management | No organization admin layer | Yes | Yes |
| Organization policies and content controls | No shared organization governance | Yes | Yes |
| Organization usage/activity visibility | No | Yes | Yes |
| Copilot-related audit events | No enterprise/org audit surface | Available in managed Business/Enterprise contexts | Available, including enterprise-scale views |
| Broader enterprise deployment and higher enterprise allowances | No | Baseline managed plan | Strongest fit |

Do not use the stale shortcut “audit log means Enterprise.” Official July 2026 docs say enterprise audit-log review applies to **Copilot Business or Copilot Enterprise**. If a question combines auditing with explicitly advanced enterprise-scale requirements, choose based on the full scenario, not the word “audit” alone.

---

## Secure Prompt Patterns

### SQL Query Prompt

A strong SQL prompt pins the engine, schema, business rule, output, and validation:

```text
PostgreSQL 14. Using only the tables and columns in the schema below, return the
top five customers by recognized revenue in the last 30 UTC days. Include a
window-function rank. Return customer_id, customer_name, revenue, and rank,
ordered by revenue descending. Use parameters rather than interpolated values.
Explain assumptions and provide a read-only EXPLAIN command separately.

[schema]
```

Why it works: dialect prevents syntax drift; schema prevents invented columns; time zone and time window remove ambiguity; output shape is testable; parameterization reduces injection risk.

### Secret-Handling Prompt

```text
Read the API credential from the approved secret manager or an environment
variable. Never hardcode it, commit it, print it, or include it in exceptions.
Fail fast with a non-secret diagnostic if missing. Redact credentials from logs.
Use least-privileged access and provide a minimal test that uses a fake secret.
```

Avoid fallback test keys, committed config secrets, or “log it for debugging.” Continuing with partial functionality is only safe when the application contract explicitly permits it and does not conceal a security misconfiguration.

### Production Migration Prompt

```text
For [database engine/version], design an expand-migrate-contract change that adds
the status column with the stated type/default, backfills it deterministically
from state in bounded batches, preserves compatibility during rolling deploys,
avoids long blocking locks, verifies row counts and invalid values, and includes
forward SQL, rollback/roll-forward steps, monitoring, and abort criteria. Do not
drop the old column until all application versions have stopped using it.
```

Safety elements: exact DDL, deterministic backfill, online/low-lock strategy, dual compatibility, validation, observability, and rollback or roll-forward plan.

### Debugging Prompt

```text
Given this exact stack trace, runtime/version, reproduction steps, and relevant
code, identify the top three hypotheses. State evidence for each, propose the
smallest fix that preserves the public API, and give a focused test that would
falsify the leading hypothesis before making broader changes.
```

### Test Generation and TDD Prompt

```text
Using [framework/version], turn these acceptance criteria into focused tests.
Start with tests that fail for the missing behavior, include boundary and error
cases, and avoid asserting implementation details. After the implementation is
green, propose a behavior-preserving refactor and rerun the same tests.
```

Red -> write a meaningful failing test. Green -> implement the smallest behavior that passes. Refactor -> improve design while tests remain green. Copilot accelerates each stage but does not choose the product contract or quality bar for you.

### Documentation and Unfamiliar-Code Prompt

```text
Summarize this component's purpose, public API, dependencies, side effects,
invariants, failure modes, and security-sensitive paths. Then draft [docstring,
README section, or comments] for [audience] in [style]. Do not claim behavior
that cannot be verified from the attached code; list uncertainties separately.
```

Documentation is a draft. Verify behavior, tone, confidentiality, links, examples, and version details before publishing.

---

## Important Details for the Exam

- Inline suggestions appear as ghost text near the cursor; accepting inserts text into the editor only.
- Chat is available across GitHub.com, supported IDEs, GitHub Mobile, and Windows Terminal. Surface availability does not guarantee identical features.
- Current official “What is Copilot?” documentation lists IDEs, GitHub Mobile, Windows Terminal Canary Terminal Chat, command line, and GitHub website.
- Test generation can be requested from selected code or file context in supported IDEs. Specify framework, style, assertions, edge cases, and constraints.
- Debugging prompts should include the exact error, stack trace, environment, reproduction, and relevant code. Copilot proposes hypotheses; the debugger/tests establish evidence.
- Local agents have access to configured built-in, extension-provided, and MCP tools. Tool availability is not permission to invoke every tool without review.
- MCP policy for managed Business/Enterprise users can be controlled by organization/enterprise administrators and may be disabled by default.
- The GitHub MCP server may be available broadly, but individual tools still inherit the access requirements of the underlying GitHub feature.
- GitHub cloud-agent repository MCP and local IDE MCP are separate configurations and trust boundaries.
- Current cloud-agent MCP documentation says tools are supported, while resources/prompts may not be; check the host's feature matrix.
- Current official audit-log documentation says Copilot plan/settings/license and agent events are logged, but local client prompts are not automatically included.
- Audit events can be searched with Copilot action filters; agent activity can be correlated through agent session identifiers in supported events.
- Usage metrics and activity reports are not the same as audit logs: metrics measure adoption/activity; audit logs record administrative and agent actions.
- Organization owners manage organization-scoped access; enterprise owners manage enterprise-level subscriptions, policies, and delegation across organizations.

---

## Common Traps and Misconceptions

1. **Trap: “Agent mode” and “coding agent” are identical.** Local agent mode is interactive in the current workspace; the cloud/coding agent is asynchronous and PR-oriented.
2. **Trap: Edit mode is just chat.** The tested concept is targeted, reviewable multi-file changes with user-controlled scope.
3. **Trap: Agent means auto-merge.** Agents propose changes; permissions, branch protection, CI, review, and merge policy still apply.
4. **Trap: MCP is an AI model.** It is a protocol connecting a host to external capabilities.
5. **Trap: MCP grants access.** Authentication and authorization belong to the connected service and configured credentials.
6. **Trap: Every MCP action always prompts.** Approval behavior depends on the host and configuration; unattended cloud use requires stricter least privilege.
7. **Trap: A trusted server makes every response safe.** Tool output and external content can still carry prompt injection or malicious data.
8. **Trap: Copilot Chat exists only in IDEs.** Official docs list web, mobile, IDE, and Windows Terminal surfaces.
9. **Trap: Accepting inline code commits it.** Acceptance only inserts code into the editor.
10. **Trap: Generated tests prove correctness.** Tests can be incomplete, tautological, flaky, or coupled to implementation.
11. **Trap: Enterprise is required for all organization governance.** Business is the baseline managed organization plan; Enterprise extends it.
12. **Trap: Audit logs are Enterprise-only.** Current docs cover audit logs for Business and Enterprise managed contexts.
13. **Trap: The older five-name plan list is the complete current taxonomy.** Student and Max appear in current July 2026 official documentation.
14. **Trap: “Use an environment variable” is enough for secret safety.** Also forbid hardcoding/logging, require fail-fast behavior, redaction, least privilege, and safe tests.
15. **Trap: “No downtime” alone makes a migration safe.** Require exact DDL, compatibility phases, bounded backfill, validation, monitoring, and recovery.

---

## Real-World Scenarios

### Scenario 1: Surgical API rename

You know the three files and want to inspect every diff. Use a targeted edit workflow. If failures reveal unknown call sites, escalate to an agent with a validation command.

### Scenario 2: Cross-stack feature

The task needs a schema change, backend endpoint, UI, tests, and lint/build repair. Use an agent with explicit acceptance criteria, migration safety constraints, and required validation.

### Scenario 3: Issue tracker integration

The agent must query and update an external tracker. Add a trusted MCP server with read-only tools first; enable write tools only if needed, with least-privileged credentials and approval controls.

### Scenario 4: Backlog task while offline

The task is well specified and repository-hosted. Delegate it to the cloud/coding agent, track the session, inspect logs and checks, then review the resulting PR.

### Scenario 5: Corporate proxy failure

Start with status/version checks and Copilot Output. Collect diagnostics, inspect reachability, open extension logs, then use trace logging and Electron Developer Tools only if necessary. Redact before sharing.

---

## Cross-Domain Quiz Question Refreshers

| Concept | Key fact | Trap |
| --- | --- | --- |
| Copilot logs | VS Code Output and the extension logs folder contain extension evidence; Developer Tools Console provides deeper Electron/runtime evidence | Looking only at Git output or GitHub.com |
| Collect Diagnostics | Run from the Command Palette; inspect reachability, versions, environment, and connectivity data | Treating it as a terminal command or a replacement for all raw logs |
| Chat surfaces | GitHub.com, supported IDEs, GitHub Mobile, and Windows Terminal are documented surfaces | Assuming “chat” means IDE-only or identical features everywhere |
| Individual eligibility | Personal plans are self-managed; current docs distinguish Student and teacher/maintainer eligibility as well as paid individual plans | Memorizing only older Free/Pro/Pro+ wording as the full 2026 taxonomy |
| Managed seats | Organization and enterprise owners assign access at their administrative scopes | Developers buying Business seats in the IDE |
| Invocation | Inline appears near cursor and is accepted/dismissed; Chat is explicitly opened and prompted with context | Assuming suggestions are automatically applied |
| Unit tests | Copilot can draft tests from selected/contextual code in supported IDEs | Enterprise-only or one-IDE-only claims |
| Documentation | Selection/file prompts can draft docstrings, comments, explanations, and README content | Publishing without verifying behavior or sensitive content |
| Debugging | Supply exact errors and context; ask for hypotheses, minimal fix, and falsifying test | Assuming Copilot automatically fixes every build error |
| TDD | Red: failing behavior test; green: minimal implementation; refactor: improve while tests stay green | Auto-approving PRs or replacing assertions |
| Inline acceptance | Inserts normal editor text; Git actions remain manual/normal workflow | Equating accept with commit, push, or merge |
| Unfamiliar code | Ask for purpose, dependencies, side effects, invariants, risks, and tests using selected/file context | Believing only full-repository Enterprise context can explain any file |
| SQL prompting | Pin dialect/version, schema, business rule, filters/window, output shape, ordering, and safety constraints | Vague “write SQL” prompts that invite invented columns or wrong syntax |
| Secret prompting | No hardcoding/logging; secret store/env; fail fast; redact; least privilege | Default keys, committed config, or logging secrets for debugging |
| Safe migrations | Exact DDL, deterministic backfill, online compatibility, validation, monitoring, rollback/roll-forward | One-step destructive schema changes or downtime without recovery |
| Organization controls | Business is the baseline for centrally managed seats, policies, content controls, and usage visibility; Enterprise includes/extends managed capabilities | Choosing an individual plan for organization governance |
| Audit and compliance | Audit logs exist in managed Business/Enterprise contexts; choose Enterprise only when the whole scenario requires enterprise-scale capabilities | “Audit log” as a single-word Enterprise trigger |

---

## Quick Reference Card

### Mode Signals

- **Explain/summarize** -> Ask/chat.
- **Complete current line/block** -> inline suggestion.
- **Known files, controlled diffs** -> targeted edit / legacy Edit mode.
- **Discover, edit, run, observe, repair** -> local agent.
- **Delegate asynchronously, track, receive PR** -> cloud/coding agent.

### MCP Security Checklist

- Trust the publisher and endpoint.
- Understand every enabled tool.
- Prefer read-only and least privilege.
- Externalize secrets and use short-lived credentials.
- Review shared configuration as executable code.
- Require approval for consequential writes where the host supports it.
- Assume external content can contain prompt injection.
- Audit and periodically remove unused servers/tools.

### Diagnostics Ladder

```text
Status/version -> Output -> Collect Diagnostics -> Extension logs
-> temporary Trace -> Electron Developer Tools -> sanitized support bundle
```

### Secure Prompt Formula

```text
environment/version + concrete context + exact outcome + constraints
+ forbidden behavior + validation + rollback/error behavior + output format
```

---

## No-Spoiler Readiness Checklist

Before starting the quiz, confirm that you can answer these without looking up options:

- [ ] I can explain the difference between accepting inline text and accepting a repository change.
- [ ] I can contrast Ask/chat, targeted editing, local agent, and cloud/coding agent.
- [ ] I can describe the agent loop and identify where human approvals still matter.
- [ ] I can define MCP without calling it a model, agent, or permission system.
- [ ] I can identify MCP host, client, server, tool, resource, and prompt.
- [ ] I can explain user/workspace/repository/admin configuration boundaries.
- [ ] I can evaluate an MCP server for trust, credentials, tool scope, data egress, and prompt injection.
- [ ] I can explain why subagents help and why they can still create conflicts or lose context.
- [ ] I can distinguish local and asynchronous agent sessions and explain how to track them.
- [ ] I can walk through the VS Code diagnostics ladder in order.
- [ ] I know the documented Chat surfaces, including the terminal surface.
- [ ] I can reconcile legacy quiz plan names with the current July 2026 lineup.
- [ ] I will not use “audit logs” alone as an Enterprise-only signal.
- [ ] I can construct secure SQL, secret, and migration prompts with explicit constraints.
- [ ] I can apply Copilot to tests, TDD, docs, debugging, and unfamiliar-code analysis without overtrusting output.

---

## Related Questions in questions.json

The Day 4 assignment contains 23 questions:

- **q090-q093**: VS Code logs/diagnostics, Chat surfaces, and Edit-versus-Agent distinctions.
- **q095-q100**: access, seat administration, plan vocabulary, invocation, test generation, and terminal Chat.
- **q101-q105**: documentation, debugging, TDD, inline acceptance, and unfamiliar-code understanding.
- **q120-q121**: precise SQL prompting and safe secret handling.
- **q130**: production-safe database migration prompting.
- **q132-q135 and q137**: managed-plan governance, audit/compliance nuance, and practical editing-versus-agent autonomy.

Quiz command:

```powershell
python quiz_runner.py questions.json --day-lock 4 --carryover 3 --shuffle
```

Browser mode is supported by this repository's runner:

```powershell
python quiz_runner.py questions.json --day-lock 4 --carryover 3 --shuffle --web --port 8765
```

---

## Sources (Verified During This Session)

- [GitHub Copilot features](https://docs.github.com/en/copilot/get-started/features)
- [What is GitHub Copilot?](https://docs.github.com/en/copilot/get-started/what-is-github-copilot)
- [Plans for GitHub Copilot](https://docs.github.com/en/copilot/get-started/plans)
- [Choosing your enterprise's plan for GitHub Copilot](https://docs.github.com/en/copilot/tutorials/roll-out-at-scale/assign-licenses/choose-enterprise-plan)
- [Extending GitHub Copilot Chat with MCP servers](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/extend-copilot-chat-with-mcp)
- [Setting up the GitHub MCP Server](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/set-up-the-github-mcp-server)
- [MCP and GitHub Copilot cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/mcp-and-cloud-agent)
- [Configure MCP servers for your repository](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/configure-mcp-servers)
- [Enhancing GitHub Copilot agent mode with MCP](https://docs.github.com/en/copilot/tutorials/enhance-agent-mode-with-mcp)
- [Tracking GitHub Copilot's sessions](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/track-copilot-sessions)
- [Viewing logs for GitHub Copilot in your environment](https://docs.github.com/en/copilot/how-tos/troubleshoot-copilot/view-logs?tool=vscode)
- [Reviewing audit logs for GitHub Copilot](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/review-audit-logs)
- [GitHub Copilot usage metrics](https://docs.github.com/en/copilot/concepts/copilot-usage-metrics/copilot-metrics)
- [Local agents in Visual Studio Code](https://code.visualstudio.com/docs/agents/agent-types/local-agents)
- [Build with agents in VS Code](https://code.visualstudio.com/docs/agents/overview)
- [Use the Chat view](https://code.visualstudio.com/docs/agents/chat-view)
- [Use the Agents window (Preview)](https://code.visualstudio.com/docs/agents/agents-window)
- [AI features in VS Code cheat sheet](https://code.visualstudio.com/docs/agents/reference/ai-features-cheat-sheet)
- [Customize agent behavior in Visual Studio Code](https://code.visualstudio.com/docs/agent-customization/overview)

Research note: official pages and search-index content were checked live on 2026-07-12. Preview features, plan allowances, UI labels, and policy details can change; re-check the official plan and feature matrices for operational decisions.

---

## Notes (Your Own Words - Fill This In After Studying)

### My one-sentence distinction between Edit and Agent

_

### My MCP trust checklist

_

### Plan/governance wording I need to remember

_

### Questions to revisit after the quiz

_