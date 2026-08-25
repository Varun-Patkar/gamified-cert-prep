# Day 14: D3.3 ALM (Foundry + Models + Dynamics 365)

**Date**: 2026-08-25
**Domain**: Deploy AI-powered business solutions (40-45%)
**Subtopics**: ALM for Microsoft Foundry Agent Service, custom AI models, Dynamics 365 finance and supply chain, and Dynamics 365 customer experience and service
**Estimated study time**: 1 hr

---

## TL;DR (60-second skim)

- Treat an AI release as separate versioned artifacts, target configuration, runtime identity/RBAC, deployment endpoints, and release evidence.
- Foundry Agent Service snapshots agent versions; preserve a validated version so you can compare changes and roll back instead of editing production in place.
- Each deployed hosted agent gets a dedicated Microsoft Entra agent identity and endpoint. The project managed identity is not the hosted container's runtime identity.
- Promote only after representative pre-production evaluations pass approved task, quality, groundedness, safety, and robustness thresholds.
- Fine-tuning creates a custom model; a separate inference deployment, deployment name, quota, and application binding make it callable.
- AI Builder solutions carry the published model executable, not drafts or training data; use managed solutions downstream and make changes in source.
- Dynamics 365 Finance release validation must check the target Feature management state and user security roles.
- Customer Service Copilot must be enabled and validated per environment, including admin role, licensing, region/data movement, app/profile availability, and user privileges.

---

## Learning Objectives

After this session, you should be able to:

1. Design a reversible Foundry agent promotion process using versions, comparisons, evaluation gates, endpoints, and rollback.
2. Distinguish a hosted agent's dedicated runtime identity from the project managed identity and assign downstream RBAC correctly.
3. Separate fine-tuning completion from inference deployment and application configuration.
4. Validate cross-region and cross-subscription custom-model deployment prerequisites.
5. Package and service AI Builder models without assuming training data is transported.
6. Define target-environment release checks for AI features in Dynamics 365 Finance and Customer Service.

---

## Key Concepts

### 1. Foundry agent versions, promotion, and recovery

Govern artifact version, target configuration, runtime identity/RBAC, dependencies, and evidence separately. Build is not deployment; import is not enablement; enablement is not authorization.

Foundry Agent Service provides built-in versioning and publishing. As an agent changes, versions are automatically snapshotted. Teams can compare changes between versions and roll back to a previous version.

Use the version as the unit of validation:

1. Create a candidate version from reviewed source or configuration.
2. Record model, tools, instructions/code, protocol, and dependency changes.
3. Evaluate that exact version against the approved dataset and thresholds.
4. Deploy/promote only the passing version.
5. Monitor task, quality, safety, latency, errors, and downstream failures.
6. If quality regresses, restore the previously validated version first.
7. Compare versions and traces, correct the source, and produce a new candidate.

Do not mutate a failing production definition as the recovery method. In-place edits weaken traceability, invalidate earlier evidence, and remove confidence that production matches a tested artifact.

### 2. Hosted-agent endpoint and identity

A hosted agent is code packaged as a container image or supported source package and run by Agent Service. At deployment, the platform creates both:

- A **dedicated Microsoft Entra ID (agent identity)** for that agent.
- A **dedicated endpoint** for supported protocols.

The endpoint is immediately available after deployment; publishing to Teams or Microsoft 365 isn't required for programmatic access. Active endpoint routes depend on the protocols declared in the agent version definition. Current documented protocol routes include Responses, Invocations, Invocations over WebSocket, and A2A (preview).

| Identity                           | Scope                                              | Purpose                                                                                                 |
| ---------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Agent identity                     | Dedicated per hosted agent, created at deploy time | Container runtime authentication for model calls, tools, and downstream Azure resources                 |
| Project managed identity           | System-assigned, project-wide                      | Platform infrastructure operations, such as reading the container image; not the agent runtime identity |
| User identity/on-behalf-of context | Invocation-specific when available                 | User-delegated access where the channel and downstream service support it                               |

For external Azure dependencies, grant the production agent identity the required RBAC roles. A development agent's role assignment, a project identity assignment, or a developer credential does not authorize the newly deployed production agent.

### 3. Pre-production evaluation as a release gate

Playground conversations are useful for exploration, not sufficient release evidence. Use representative organizational data, known edge cases, adversarial cases, and production-like tool/permission paths.

A balanced gate can include:

| Dimension         | Representative evidence                                                                |
| ----------------- | -------------------------------------------------------------------------------------- |
| Task behavior     | Task completion/adherence, tool-call accuracy, workflow success                        |
| General quality   | Coherence, fluency, relevance, domain correctness                                      |
| Grounded behavior | Groundedness and source relevance for RAG responses                                    |
| Safety/security   | Harm categories, protected material, prompt-attack/red-team results                    |
| Robustness        | Edge cases, ambiguous inputs, multi-turn state, dependency failures                    |
| Operations        | Latency, error rate, capacity, cost; important but not a substitute for quality/safety |

Store evaluator versions, dataset versions, thresholds, results, exceptions, and approvals with the candidate release. Foundry evaluations can be integrated as automated CI/CD quality gates. After deployment, continue with sampled/scheduled evaluation and operational monitoring for drift.

### 4. Fine-tuned model lifecycle

Keep these lifecycle objects distinct:

| Object                | What it proves                                   | What it does not prove                                   |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| Fine-tuning job       | Training process ran and produced a custom model | The model is callable by an application                  |
| Custom model artifact | Tuned weights/model version exist in Foundry     | An inference deployment exists                           |
| Inference deployment  | Model is hosted and available for inference      | The application references the correct target deployment |
| Deployment name       | Stable identifier used by application calls      | It is not the fine-tuning job ID or training filename    |
| Application binding   | Target endpoint/deployment name is configured    | Capacity, authorization, and quality gates passed        |

Release sequence: validate model -> select target resource/region and deployment type -> verify permission and quota -> create deployment with a deployment name -> wait for readiness -> bind application configuration to that name -> run target smoke/evaluation/load tests -> release traffic.

### 5. Cross-region and cross-subscription deployment

Microsoft documents deployment of a fine-tuned model to a different region and to a different subscription/region by SDK or REST. The portal does not support cross-region deployment.

Preflight checklist:

- Confirm the destination region supports fine-tuning for the selected model/deployment pattern.
- Confirm target deployment capacity/quota; do not substitute unrelated Azure VM quota.
- Ensure the identity/token used for cross-subscription deployment has access to both source and destination subscriptions.
- Provide source account information plus destination subscription, resource group, resource, deployment name, SKU/capacity, and model reference.
- Validate target networking, content filters, data-residency requirements, RBAC, cost controls, and application binding.
- Test the destination deployment before switching production traffic.

Cross-environment support does not mean source settings transfer automatically. The release pipeline must explicitly configure and validate the destination.

### 6. AI Builder model packaging and servicing

AI Builder models are solution components, but only a model with a **published version** can be added to a solution. Export/import installs the published version in the target.

The solution contains the **model executable**, not its training data. Therefore maintain a separate governed path for training data, labels, schema, consent, retention, quality checks, and reproducibility evidence.

Recommended promotion lifecycle:

1. Develop, train, validate, and publish in a sandbox/development environment.
2. Add the published model and dependent solution components to the source solution.
3. Export a managed solution for downstream environments.
4. Import to test/UAT/production and run a target smoke test.
5. Make subsequent model changes in source, publish a new version, and promote a new managed version.

Microsoft discourages imported-model changes because they create unmanaged customizations that can block servicing. Managed properties can disable accidental target customization.

### 7. Dynamics 365 Finance feature release

An application update can deliver feature code without making an optional feature usable. The target Feature management workspace records environment-specific status and lifecycle.

Status signals include on, off, scheduled, mandatory, requires attention, and cannot be enabled. Lifecycle states progress through optional/preview or released behavior toward on-by-default and mandatory states. Some features require prerequisite action or confirmation; some cannot be disabled after enablement.

Enabling a feature does not bypass security. Availability still depends on the user's security role and legal-entity access. A production validation therefore checks both the feature's target state and intended users' authorization.

### 8. Dynamics 365 Customer Service Copilot release

Customer Service Copilot enablement is environment-specific. In the Power Platform admin center, locate the production environment, edit the Dynamics 365 Customer Service Copilot setting, enable AI-powered Copilot features, and save.

Release checks include:

| Gate                  | Validate in production                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| Administration        | Operator has System Administrator role                                                           |
| Licensing             | Required product/environment licenses are assigned                                               |
| Environment setting   | Copilot is enabled for this specific environment                                                 |
| Region/data movement  | Regional availability is supported; cross-region data movement is enabled/approved when required |
| App capability        | Intended features are configured in Copilot Service admin center and available in the target app |
| Representative access | Experience profiles, security roles, custom-role privileges, and user assignment permit use      |
| Data/knowledge        | Approved sources, access controls, and target records are available                              |
| Validation            | Representative persona can complete smoke tests without excess access                            |

---

## Lifecycle and Release Flows

**Agent**: reviewed source -> candidate version -> representative evaluation -> target deploy -> endpoint/identity -> RBAC -> programmatic tests -> channel/traffic release -> monitor -> rollback/compare.

**Model**: versioned training data -> fine-tuning job -> custom model -> validation -> region/quota/access -> inference deployment -> deployment-name binding -> target tests -> release.

---

## Decision Tables

### Diagnose a production readiness gap

| Symptom                                         | First boundary to inspect                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Agent quality fell after release                | Version/evaluation evidence; restore known-good version and compare             |
| Hosted agent gets downstream 403                | RBAC on the deployed agent's dedicated identity                                 |
| API test is blocked pending channel publication | Use the deployed agent's dedicated programmatic endpoint                        |
| Fine-tuning succeeded but calls fail            | Inference deployment readiness and application deployment-name binding          |
| Destination deployment fails                    | Regional support, target quota, source/destination access, target configuration |
| AI Builder model is missing from solution       | Confirm it has a published version and was added to the source solution         |
| Finance feature is invisible to users           | Target feature state plus role/legal-entity access                              |
| Customer Service Copilot worked in test only    | Production environment setting, license/region, app/profile, and privileges     |

### Artifact versus target-owned dependency

| Travels/promotes as artifact      | Recreated or validated in target                                      |
| --------------------------------- | --------------------------------------------------------------------- |
| Agent/model/container version     | Agent identity RBAC and endpoint protocol behavior                    |
| Fine-tuned custom model reference | Inference deployment, quota, deployment name, network/filter settings |
| AI Builder published executable   | Training data lineage and target smoke test                           |
| D365 application update/solution  | Feature flags, licenses, roles, profiles, region/data movement        |

---

## Common Traps & Misconceptions

- **Production edit equals rollback.** A rollback restores a validated version; an in-place edit creates an unvalidated state.
- **Project identity equals hosted-agent identity.** They have different scopes and purposes.
- **A few good chats prove readiness.** Exploration does not replace representative, threshold-based evaluation.
- **Publishing creates the hosted endpoint.** Deployment creates it; publishing distributes the agent to channels.
- **Fine-tuning completion creates a callable endpoint.** Deployment is a separate lifecycle step.
- **A job ID is an application model target.** Applications bind to a deployment name.
- **Cross-subscription means impossible.** It is supported with destination support, access to both subscriptions, quota, and explicit configuration.
- **AI Builder solutions include training records.** They contain the published executable only.
- **Fix imported models directly in production.** That creates unmanaged layers and weakens upgrades.
- **D365 package deployment enables and authorizes everyone.** Feature state and user access remain target gates.
- **Customer Service Copilot enablement is tenant-global.** Configure and validate each environment.

---

## End-to-End Promotion Checklist

- [ ] Candidate artifact/version is immutable, reviewed, and traceable to source.
- [ ] Training/evaluation datasets and evaluator versions are recorded.
- [ ] Task, quality, groundedness, safety, and robustness thresholds pass.
- [ ] Target region, service/model support, quota, licensing, and data movement pass preflight.
- [ ] Target deployment name, endpoint/protocol, feature state, and app settings are defined.
- [ ] Runtime/deployment identities have least-privilege access to every dependency.
- [ ] AI Builder artifact is published; training data has a separate governance/reproducibility plan.
- [ ] Managed promotion is used downstream; no unmanaged production edits are required.
- [ ] Programmatic, representative-user, permission-negative, and rollback tests pass in target.
- [ ] Channel/user exposure or traffic switch occurs only after target validation.
- [ ] Monitoring, owner, rollback point, and incident thresholds are recorded.

---

## Concise Knowledge Checks (no spoilers)

1. Which identity should receive RBAC when a hosted production agent calls a protected storage account?
2. What release evidence is lost when a production agent is edited in place?
3. Can a hosted-agent API smoke test run before Teams or Microsoft 365 publication? Why?
4. What additional object must exist after fine-tuning before an application can invoke the model?
5. Name four preflight checks for a cross-subscription, cross-region model deployment.
6. What exactly does an AI Builder solution transport, and what must be governed separately?
7. Why can an enabled Finance feature remain unavailable to a representative?
8. Which Customer Service Copilot controls must be repeated for a newly provisioned production environment?

---

## Quick Reference Card

**Foundry agent**: version -> evaluate -> deploy -> endpoint/identity -> RBAC -> target test -> publish/traffic -> monitor -> rollback/compare.

**Fine-tuned model**: job -> custom model -> validate -> quota/region/access -> inference deployment -> deployment-name binding -> test -> release.

**AI Builder**: develop/train -> publish -> add executable to source solution -> managed promotion -> smoke test; training data stays separate.

**Dynamics 365**: deploy code/solution -> configure target feature/environment -> verify license/region/data movement -> verify roles/profiles -> persona test.

---

## Cross-Domain Quiz Question Refreshers

None. All ten assigned Day 14 questions (q131-q140) directly test Domain 3.3 ALM for Foundry agents, custom models, AI Builder, or AI in Dynamics 365 Finance and Customer Service. No carryover or other-domain question is assigned today.

---

## Related Questions in questions.json

- q131, q132, q133, q134: Foundry versioning, identity, evaluation, endpoint, and release lifecycle.
- q135, q136: Fine-tuned model inference deployment and cross-environment prerequisites.
- q137, q138: AI Builder model packaging and managed solution servicing.
- q139, q140: Dynamics 365 Finance and Customer Service target release validation.

Exactly ten Day 14 questions, with carryover disabled:

```powershell
python quiz_runner.py questions.json --day-lock 14 --carryover 0 --shuffle --open-images --web --port 8765
```

Do not use a positive carryover value today: Day 14 already has ten assigned questions, and carryover would exceed the explicitly required count.

---

## Sources (verified during this session)

- [What is Microsoft Foundry Agent Service?](https://learn.microsoft.com/en-us/azure/foundry/agents/overview)
- [Hosted agents in Foundry Agent Service](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/hosted-agents)
- [Observability in Generative AI](https://learn.microsoft.com/en-us/azure/foundry/concepts/observability)
- [Deployment overview for Microsoft Foundry Models](https://learn.microsoft.com/en-us/azure/foundry/concepts/deployments-overview)
- [Deploy a fine-tuned model for inferencing](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/fine-tuning-deploy?tabs=python)
- [Distribute your AI Builder model using a solution](https://learn.microsoft.com/en-us/ai-builder/distribute-model)
- [Feature management overview for Dynamics 365 finance and operations](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/fin-ops/get-started/feature-management/feature-management-overview)
- [Manage Copilot features in Dynamics 365 Customer Service](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-copilot-features)

---

## Notes (your own words - fill this in after studying)

-
-
-
