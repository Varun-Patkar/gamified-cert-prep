# Day 31: Light Review & Logistics

**Date**: 2026-09-09
**Scheduled plan date**: 2026-09-11 (working ahead)
**Exam**: AB-100 on 2026-09-12 at 9:00 AM IST
**Test center**: GIIT Computer Institute
**Focus**: Identity and authorization boundaries, managed-identity lifecycle, one Copilot Studio input limitation, model-fit judgment, and exam-day readiness
**Estimated study time**: 45-60 min
**Progress entering session**: Days 1-30 complete | Day 30: 10/10

> **Status:** Ready to study. Day 31 has exactly ten assigned questions. Keep this session light; progress remains unchanged until the quiz is completed.

---

## TL;DR

- Sharing or authenticating an agent does not grant access to its tools or underlying records. Treat agent access, runtime identity, tool authorization, and source authorization as separate gates.
- For user-specific operations, let the downstream system evaluate the signed-in user's permissions. For unattended work, use a dedicated workload identity with narrow permissions.
- The model is not an authorization engine. Validate caller, target, operation, and policy in deterministic code before a consequential tool executes.
- System-assigned managed identity shares one host's lifecycle. User-assigned managed identity has an independent lifecycle and can remain stable across approved replaceable hosts.
- Managed identity removes stored credentials; it does not grant authorization. Minimize both allowed actions and assignment scope.
- A shared user-assigned identity gives every attached workload the identity's combined permissions. Separate identities when duties or risk differ.
- In generative orchestration, collect a custom regex or closed-list entity through a Question node and pass the validated value onward.
- Prefer the smallest catalog model that demonstrably meets quality, latency, cost, and deployment requirements. Customize only for a measured gap.

---

## Session Plan

| Time      | Activity                              | Output                                       |
| --------- | ------------------------------------- | -------------------------------------------- |
| 0-10 min  | Read the identity decision framework  | Explain the four authorization gates         |
| 10-20 min | Review managed-identity lifecycle     | Choose identity type from lifecycle clues    |
| 20-30 min | Review deterministic tool controls    | State what must be checked outside the model |
| 30-35 min | Review the two cross-domain traps     | Recall the entity-input and model-fit rules  |
| 35-50 min | Complete the ten-question quiz        | Exactly 10 answers                           |
| 50-60 min | Confirm logistics, then stop studying | Exam-day checklist ready                     |

---

## 1. Four Separate Access Gates

An agent can be available to a user while the requested record remains inaccessible. Evaluate these gates independently:

1. **Agent access**: Can the user open or invoke the agent?
2. **Runtime identity**: Which identity obtains the token for a tool call?
3. **Tool authorization**: Is that identity allowed to invoke the operation?
4. **Source authorization**: Can the effective identity access this exact record or resource?

Publishing, sharing, or signing in answers only part of the chain. It must not copy a maker's data privileges to users or bypass security trimming in the source.

### Delegated Versus Workload Identity

- Use **delegated end-user authorization** when the tool reads each user's own data or acts on that user's behalf. The downstream service should enforce the signed-in user's rights.
- Use a **dedicated workload identity** for unattended or autonomous work. Grant only the required application permissions or data-plane roles.
- Do not use a maker's personal connection as a convenient shared runtime identity when callers should have different permissions.

```text
User-specific action -> downstream system evaluates the user
Unattended action -> dedicated workload identity with least privilege
```

---

## 2. Deterministic Authorization Before Tool Execution

Prompts, retrieved documents, and model-selected parameters are untrusted inputs. Before a high-impact action, deterministic server-side logic should validate:

- authenticated caller;
- target resource or record;
- caller-to-target relationship;
- allowlisted operation and parameter schema;
- current business-policy threshold;
- confirmation or authorized approval when impact requires it.

Content filters address harmful content categories. They do not prove record ownership or authorize an account closure. A system instruction can guide behavior but cannot enforce permissions.

### Exam Rule

```text
Model proposes -> deterministic control validates -> authorized tool executes
```

---

## 3. Managed-Identity Lifecycle

| Requirement                            | System-assigned | User-assigned          |
| -------------------------------------- | --------------- | ---------------------- |
| Enabled directly on one host           | Yes             | No; created separately |
| Deleted with host                      | Yes             | No                     |
| Shared by multiple approved hosts      | No              | Yes                    |
| Stable across host replacement         | No              | Yes                    |
| Requires RBAC or service authorization | Yes             | Yes                    |

Choose **system-assigned** when one host alone uses the identity and both should disappear together. Choose **user-assigned** when the principal and its role assignments must survive host replacement, support blue-green deployment, or be attached to multiple approved resources.

### Reuse Trap

Shareability is not a recommendation to share broadly. Every host attached to one user-assigned identity can exercise that identity's permissions. A read-only reporting workload and a secret-deletion workload should not share an identity: their duties, blast radius, and audit expectations differ.

### Least Privilege Uses Two Axes

1. **Minimum actions**: read-only work should not receive write, delete, owner, or contributor actions.
2. **Minimum scope**: access to one container should not be assigned at subscription scope.

```text
Managed identity solves credential handling.
RBAC and source permissions solve authorization.
```

---

## 4. Two Cross-Domain Traps

### Generative-Orchestration Entity Inputs

Generative topic and tool inputs do not directly support every custom entity type. When an asset tag must match a custom regex entity, collect it in a topic with a **Question node**, validate it there, and pass the resulting value onward. Do not remove validation or expect the planner to infer a required identifier safely.

### Model Fit Before Customization

Model size is not the objective. Evaluate task quality together with latency, cost, deployment location, and operating constraints. If a catalog small language model already meets the acceptance criteria on representative data, adopt and monitor it first. Fine-tuning or training introduces data, evaluation, deployment, governance, and maintenance obligations and should address a demonstrated gap.

---

## Quiz Alignment

| ID   | What it tests                | Decisive clue                       | Common trap                                               |
| ---- | ---------------------------- | ----------------------------------- | --------------------------------------------------------- |
| q076 | Custom entity collection     | Required regex validation           | Defining the custom entity directly as a generative input |
| q141 | Separate access gates        | Shared agent, restricted ledger     | Treating sharing as data authorization                    |
| q142 | Delegated user authorization | Employee acts on own record         | Reusing the maker's broader connection                    |
| q143 | Unattended workload identity | Nightly run, no stored secrets      | Broad subscription role                                   |
| q144 | Tool execution authorization | Model selects another customer's ID | Trusting prompts or content filters as policy             |
| q177 | System-assigned lifecycle    | One host; identity dies with host   | Choosing a standalone reusable identity                   |
| q178 | User-assigned lifecycle      | Blue-green hosts; stable principal  | Recreating permissions after each replacement             |
| q179 | Role and scope               | Read one container                  | Contributor at subscription scope                         |
| q180 | Privilege aggregation        | Low-risk and destructive workloads  | Sharing one identity for convenience                      |
| q189 | Model selection              | Small model already meets criteria  | Customizing or upsizing without a measured gap            |

The table names the tested decisions but intentionally omits answer letters.

---

## Exactly Ten Questions

Today's assignment is:

```text
q076 q141 q142 q143 q144 q177 q178 q179 q180 q189
```

Launch the repository's normal `@certprep /today` workflow. Do not inspect answer fields in `questions.json` during the attempt. For every guessed-correct or missed response, write one replacement rule; otherwise, do not add more questions today.

---

## Exam Logistics

### Appointment

- Exam: AB-100
- Date and time: Saturday, 2026-09-12 at 9:00 AM IST
- Test center: GIIT Computer Institute
- Use the Pearson VUE appointment confirmation as the authority for the exact address, arrival time, accepted identification, and center-specific instructions.
- Plan to arrive 30 minutes early unless the appointment confirmation requires earlier arrival.
- Verify that the first and last name on the accepted, valid ID match the appointment profile.
- Prepare the route, transport buffer, appointment confirmation, and required ID the night before.
- Leave prohibited personal items outside the testing room or store them as directed by the center.

### During the Exam

- Most Microsoft certification exams contain roughly 40-60 questions, but the count varies. Read the opening instructions because labs and question formats can change.
- AB-100 is an Expert exam, so Microsoft Learn is available from the exam navigation. The timer continues while Learn is open.
- Learn access excludes Q&A, Practice Assessments, and the signed-in profile. External domains are blocked.
- Use Learn for targeted verification, not as the default way to answer every question. Search with precise service and feature nouns, then use `Ctrl+F` on the page.
- Unscheduled breaks are allowed, but the timer continues. After starting a break, you cannot return to questions already viewed, even if unanswered or marked for review.
- Before a break, finish and review every question already seen. Never leave without starting the break through the exam interface.

### Tonight and the Day Before

- Confirm the appointment email and ID requirements.
- Pack the accepted ID and route details.
- Stop heavy study after this session.
- Eat normally, hydrate, and protect sleep.
- Do not add a second mock or a large new question set.

---

## Five-Minute Recall

Answer aloud without looking back:

1. What are the four separate access gates?
2. When should a connector use delegated end-user authorization?
3. What must deterministic code validate before a consequential tool action?
4. Which identity dies with its host?
5. Which identity survives replaceable hosts?
6. What are the two axes of least privilege?
7. Why can sharing one user-assigned identity aggregate privilege?
8. How should a custom regex entity be collected for generative orchestration?
9. When is a catalog small language model the better first choice?
10. What happens to previously viewed questions after an unscheduled break?

---

## Completion Criteria

- [ ] Explain agent access versus source authorization.
- [ ] Choose delegated or workload identity from the actor and operation.
- [ ] State the deterministic tool-authorization rule.
- [ ] Distinguish system-assigned and user-assigned identity without hesitation.
- [ ] Apply minimum actions and minimum scope.
- [ ] Complete exactly ten questions.
- [ ] Confirm appointment, accepted ID, route, and arrival plan.
- [ ] Stop studying after a brief review of misses.

---

## Sources Verified Live

- [AB-100 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-100)
- [Microsoft exam duration and exam experience](https://learn.microsoft.com/en-us/credentials/support/exam-duration-exam-experience)
- [Managed identities for Azure resources](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview)
- [Azure RBAC best practices](https://learn.microsoft.com/en-us/azure/role-based-access-control/best-practices)
- [Copilot Studio end-user authentication](https://learn.microsoft.com/en-us/microsoft-copilot-studio/configure-enduser-authentication)
- [Generative orchestration inputs](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-generative-actions)
- [Pearson VUE candidate rules agreement](https://www.pearsonvue.com/content/dam/VUE/vue/global/documents/candidate-rules/candidate-rules-agreement.pdf)

---

## Notes in Your Own Words

- Agent access is not data access because:
- The lifecycle clue for system-assigned identity:
- The lifecycle clue for user-assigned identity:
- The authorization check the model must never own:
- My exam arrival and route plan:
