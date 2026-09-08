# Day 30: Last-Minute Revision

**Date**: 2026-09-08
**Scheduled plan date**: 2026-09-10 (working ahead)
**Domain**: Mixed review - Plan (25-30%), Design (25-30%), Deploy (40-45%)
**Focus**: Build-buy-extend, agent boundaries and orchestration, Responsible AI, ALM, least privilege, and managed-identity lifecycle
**Estimated study time**: 1 hr
**Progress entering session**: Session 30 of 31 | Days 1-29 complete | Latest local check: 9/10, then targeted retry completed

> **Status:** Ready to study. Day 30 has exactly ten assigned questions. Progress remains unchanged until the quiz is completed.

---

## TL;DR

- Start with requirements. Adopt a supported product for a commodity need, extend for a validated gap, and build only when required differentiation or control remains unsupported.
- Split agents at meaningful trust, authority, ownership, or failure-containment boundaries. Sequence dependent work and parallelize only independent work.
- Responsible AI is a lifecycle discipline. Consequential actions need deterministic policy controls and meaningful human authority, not prompt-only caution.
- In Power Platform ALM, environment variables carry environment-specific configuration and connection references bind solution-aware components to target-owned connections.
- Managed identity removes application-managed credentials; it does not grant authorization. Apply the minimum data-plane role at the narrowest practical scope.
- System-assigned identity: one host, shared lifecycle, deleted with the host. User-assigned identity: standalone lifecycle, reusable by approved hosts, survives compute replacement.

---

## Learning Objectives

By the end of this session, you should be able to:

1. Choose build, buy, or extend from requirements rather than a platform preference.
2. map workflow dependencies to sequential and parallel orchestration.
3. justify an agent boundary using trust and authority instead of agent count.
4. apply Microsoft's Responsible AI principles to a consequential action.
5. distinguish environment variables from connection references in Power Platform ALM.
6. choose between system-assigned and user-assigned managed identity from lifecycle requirements.
7. separate credential-free authentication from least-privilege authorization.

---

## 60-Minute Session Plan

| Time      | Activity                                | Output                                       |
| --------- | --------------------------------------- | -------------------------------------------- |
| 0-10 min  | Read the five decision frameworks       | One rule recalled per framework              |
| 10-25 min | Work through the architecture scenarios | Build/buy/extend and orchestration decisions |
| 25-40 min | Review Deploy controls                  | RAI, ALM, identity, and RBAC distinctions    |
| 40-55 min | Complete the ten-question local quiz    | Exactly 10 answers                           |
| 55-60 min | Review misses and guesses               | One replacement rule per weak point          |

---

## 1. Build, Buy, or Extend

Use a requirements-first sequence:

1. **Buy or adopt** when a supported Microsoft product already satisfies the business outcome, data boundary, user experience, governance, and nonfunctional requirements.
2. **Extend** when the product satisfies the core requirement but has a specific supported gap that a connector, action, topic, knowledge source, workflow, or declarative extension can close.
3. **Build** when material differentiation, custom runtime control, unsupported integration, specialized model behavior, or a strict architecture constraint cannot be achieved by adoption or extension.

Do not equate custom development with architectural maturity. A custom solution adds implementation, integration, evaluation, security, monitoring, upgrade, support, and operational costs. The decision must compare full lifecycle TCO and delivery risk, not only model-consumption price.

### Exam Decision Rule

```text
Supported product meets all material requirements -> adopt it
Supported product meets the core but has a proven gap -> extend it
Required differentiation or control remains unsupported -> build it
```

### Traps

- Building merely to maximize code ownership.
- Extending before identifying a concrete unmet requirement.
- Training a model before testing the supported product capability.
- Creating multiple agents because decomposition sounds more advanced.

---

## 2. Agent Boundaries and Orchestration

### When to Split Agents

An agent boundary is justified when it enforces a meaningful difference in:

- trust level, such as public or retrieved content versus curated internal data;
- authority, such as read-only research versus privileged ERP approval;
- identity and permission scope;
- accountable business ownership;
- regulatory treatment or data residency;
- failure containment or independently scaled specialization.

The boundary must be real: separate identities and permissions, structured handoff, validation, reauthorization, audit, and approval where impact requires it. Two prompts with the same broad identity do not create a useful security boundary.

### Dependency Test

- **Sequential:** Step B needs Step A's output, order matters, or failure must stop later work.
- **Parallel/concurrent:** Branches have all required inputs, are independent, and can run simultaneously.
- **Fan-out/fan-in:** One stage prepares shared input, independent branches run in parallel, then a later stage waits for all required results.
- **Handoff:** One agent transfers control to another specialist based on context.
- **Supervisor:** A coordinating agent delegates and synthesizes when the path cannot be fixed in advance; deterministic policy still belongs outside probabilistic delegation.

For the claims pattern used in today's quiz: extract facts first, run independent coverage and fraud checks in parallel, synchronize, and then make the dependent decision.

### Exam Decision Rule

```text
Order follows data dependency; parallelism follows independence.
Agent separation follows trust and authority, not task count.
```

---

## 3. Responsible AI and Human Oversight

Microsoft's six guiding principles are:

1. Fairness
2. Reliability and safety
3. Privacy and security
4. Inclusiveness
5. Transparency
6. Accountability

These principles govern the complete sociotechnical system: data, model, prompts, tools, users, processes, release controls, telemetry, incident handling, and ownership.

### Meaningful Human Oversight

Human review is meaningful only when the reviewer has:

- enough context to understand the recommendation and impact;
- enough time and competence to assess it;
- authority to stop, change, or escalate the action;
- an audit trail of the decision and evidence considered.

For a consequential threshold, enforce policy deterministically before the action tool. Let the agent gather evidence and recommend, but require an authorized reviewer for the high-impact case. A system prompt saying "be careful" and retrospective sampling do not enforce a policy.

### Exam Decision Rule

```text
Probabilistic recommendation + deterministic policy gate + authorized human decision
```

### Traps

- Treating aggregate accuracy as proof of fairness.
- Treating content filtering as authorization or prompt-injection protection.
- Calling a review accountable when the reviewer cannot stop the action.
- Transferring organizational accountability to the model provider.

---

## 4. Power Platform ALM

### Environment Variables

Use environment variables for configuration that changes by environment, such as site URLs, list identifiers, API endpoints, or knowledge-index references. Components resolve the variable instead of embedding development or production values.

The definition and optional default value are publisher-owned solution metadata. The current value is environment-specific and takes precedence when present. This allows a publisher to service a managed solution without casually overwriting the customer's production configuration.

Do not store ordinary credentials or secrets as exported default values. Keep secrets in an approved secret-management and deployment path.

### Connection References

A connection reference is a solution component that points to a connector connection. A solution-aware flow or agent action binds to the reference; the target environment supplies the appropriate authenticated connection during import or deployment.

```text
Environment variable -> Where or which environment-specific configuration?
Connection reference -> Which target-owned authenticated connector connection?
```

### Release Checklist

- Package the agent and dependencies in a custom solution.
- Include referenced topics, flows, environment variables, and required components.
- Import custom connectors before dependent connection references when required.
- Supply target values and target connections through the deployment process.
- Validate authentication, permissions, DLP, behavior, publishing, and sharing after import.

---

## 5. Managed Identity and Least Privilege

Managed identities allow supported Azure resources to obtain Microsoft Entra tokens without the application storing and rotating credentials. Authentication and authorization remain separate.

### Lifecycle Matrix

| Requirement                               | System-assigned | User-assigned                 |
| ----------------------------------------- | --------------- | ----------------------------- |
| Created on one Azure resource             | Yes             | No; standalone Azure resource |
| Lifecycle tied to host                    | Yes             | No; independent lifecycle     |
| Deleted automatically with host           | Yes             | No; delete explicitly         |
| Shared by multiple supported resources    | No              | Yes                           |
| Stable principal across replaceable hosts | No              | Yes                           |

Use a system-assigned identity when one resource alone uses the identity and the identity should disappear with that resource. Use a user-assigned identity when approved resources need the same principal, permissions must survive host recycling, or preauthorization must exist before compute is provisioned.

Do not share one user-assigned identity across workloads with materially different duties merely because sharing is supported. Every attached host can exercise that identity's combined permissions.

### Least Privilege Has Two Axes

1. **Minimum actions:** choose the role that permits only the required operations, such as read instead of read/write/delete.
2. **Minimum scope:** assign it at the narrowest practical resource, container, vault, resource group, or other supported scope.

An identity that reads one blob container should not receive a contributor data role at subscription scope. Managed identity makes authentication credential-free; it does not make broad RBAC safe.

### Final Replacement Rule

```text
Host and identity should die together -> system-assigned
Host can be replaced but principal must survive -> user-assigned
Then grant minimum actions at minimum scope
```

---

## Cross-Domain Quiz Question Refreshers

| ID   | Domain | What it tests                          | Decisive clue                                                 | Common trap                                               |
| ---- | ------ | -------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| q187 | D1.2   | Build-buy-extend                       | Licensed capability already satisfies a commodity requirement | Building for code ownership                               |
| q182 | D1.2   | Multi-agent boundary                   | Public retrieval and privileged ERP approval                  | One broad identity for convenience                        |
| q183 | D1.2   | Sequential plus parallel orchestration | Two checks are independent only after extraction              | Making every stage parallel or sequential                 |
| q152 | D3.4   | Six Responsible AI principles          | Exact Microsoft principle names                               | Substituting business or platform metrics                 |
| q156 | D3.4   | Meaningful human oversight             | Refund threshold requires accountable approval                | Prompt caution or retrospective review                    |
| q123 | D3.3   | Environment-variable servicing         | Customer already has a production current value               | Assuming publisher default owns target configuration      |
| q124 | D3.3   | Connection references                  | Production uses a different authenticated connection          | Exporting the maker's development credential              |
| q177 | D3.4   | System-assigned lifecycle              | Identity should be created and deleted with one host          | Choosing a standalone identity unnecessarily              |
| q178 | D3.4   | User-assigned lifecycle                | Blue-green hosts need one stable principal                    | Expecting deleted host identities to retain principal IDs |
| q179 | D3.4   | Least-privilege RBAC                   | Read-only access to one container                             | Broad contributor role at subscription scope              |

This table identifies the tested decisions but intentionally omits answer letters.

---

## Ten-Question Check

Today's assignment is exactly:

```text
q187 q182 q183 q152 q156 q123 q124 q177 q178 q179
```

Before answering each question, state the decisive noun pair:

- commodity need versus differentiating gap;
- trust boundary versus task boundary;
- dependency versus independence;
- recommendation versus consequential action;
- publisher metadata versus target value;
- configuration versus authenticated connection;
- host lifecycle versus workload identity lifecycle;
- authentication versus authorization;
- allowed actions versus assignment scope.

Complete the quiz through the repository's normal `@certprep /today` workflow. Do not inspect answer fields in `questions.json` during the attempt.

---

## Five-Minute Recall Drill

Without looking back, complete these sentences aloud:

1. I buy or adopt when...
2. I split agents when...
3. I run branches in parallel only when...
4. A human approval is meaningful when...
5. An environment variable differs from a connection reference because...
6. A system-assigned identity is appropriate when...
7. A user-assigned identity is appropriate when...
8. Managed identity does not remove the need for...

Any answer that takes longer than 15 seconds gets one final skim before the quiz.

---

## Completion Criteria

- [ ] Explain build-buy-extend without naming a preferred product first.
- [ ] Draw the extract -> parallel checks -> synchronized decision flow from memory.
- [ ] Name all six Responsible AI principles.
- [ ] Explain why prompt-only caution is not a policy gate.
- [ ] Distinguish environment variables from connection references.
- [ ] State the managed-identity lifecycle rule without hesitation.
- [ ] Complete exactly ten assigned questions.
- [ ] Write one replacement rule for every miss or guessed-correct answer.

---

## Sources Verified Live for This Session

- [AB-100 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-100)
- [AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- [Embrace Responsible AI Principles and Practices](https://learn.microsoft.com/en-us/training/modules/embrace-responsible-ai-principles-practices/)
- [Use environment variables in Power Platform solutions](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/environmentvariables)
- [Create connection references](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/create-connection-reference)
- [Managed identities for Azure resources](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview)
- [Azure RBAC best practices](https://learn.microsoft.com/en-us/azure/role-based-access-control/best-practices)

---

## Notes in Your Own Words

- The clue that tells me to use system-assigned identity:
- The clue that tells me to use user-assigned identity:
- The orchestration dependency rule:
- The ALM distinction I must retain:
- My final exam-day replacement rule:
