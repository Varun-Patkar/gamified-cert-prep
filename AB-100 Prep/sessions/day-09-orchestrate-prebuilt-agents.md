# Day 9: Orchestrate Prebuilt Agents and Apps

**Exam:** AB-100 Agentic AI Business Solutions Architect  
**Domain:** 2.3 Orchestrate configuration for prebuilt agents and apps  
**Date:** 2026-08-20  
**Quiz:** q091-q100 (10 questions maximum)

## Session Outcomes

By the end of this session, you should be able to:

- select an existing Dynamics 365 AI feature or agent before proposing a custom build;
- distinguish contextual help, knowledge-grounded Q&A, and transactional automation;
- place finance and operations data into Copilot Studio or Microsoft 365 Copilot safely;
- align Copilot for Sales and Copilot for Service to the correct user workflow;
- recognize where Power Platform AI capabilities and AI Builder fit;
- avoid the common exam trap that a knowledge source gives an agent permission to update business records.

## 1. The Decision Order

For AB-100 scenarios, use this order:

1. **Identify the user's work surface.** Is the user in Dynamics 365 Finance, Supply Chain Management, Sales, Customer Service, Outlook, Teams, Microsoft 365 Copilot, Power Apps, or Power Automate?
2. **Check for a prebuilt capability.** Prefer an app-native summary, prediction, assistant, or agent when it already matches the process.
3. **Add knowledge for questions.** Ground the experience in approved public, organizational, Dataverse, or finance and operations data.
4. **Add actions for changes.** Use authenticated tools, connectors, or agent flows for writes and side effects.
5. **Apply the user's authorization boundary.** Publishing an agent or adding knowledge must not bypass source-system permissions.

The phrase **orchestrate configuration** usually means combining existing products and controls, not training a new model.

## 2. Dynamics 365 Finance and Supply Chain

Microsoft's Dynamics 365 AI catalog includes inherited platform features, app-specific Copilot experiences, and task-focused agents.

### Generative help and guidance

The finance and operations Copilot sidecar provides contextual, conversational in-app help. Its default guidance is grounded in Microsoft's indexed public documentation for finance and operations apps and returns synthesized answers with source citations.

Administrators can extend this experience in Copilot Studio with custom knowledge such as approved PDF, Word, or RTF files and SharePoint sources. Optional general-question support can also use model knowledge, Bing-identified web content, and other enabled sources. Microsoft Learn documents the source order as custom knowledge first, with general content available after custom knowledge is exhausted.

**Exam boundary:** this experience explains and guides. Do not assume that guidance alone can approve, create, or update ERP transactions.

### App-specific features and agents

Choose the capability that matches the business process:

| Requirement                                                                                              | Closest prebuilt fit                                                  |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Summarize collections context and draft reminder text                                                    | Collections coordinator summary in Dynamics 365 Finance               |
| Automate repetitive vendor follow-up, purchase-order updates, and change requests under configured rules | Supplier Communications Agent in Dynamics 365 Supply Chain Management |
| Explain how to complete a task in a finance and operations app                                           | Generative help and guidance sidecar                                  |
| Ask questions over approved structured ERP data                                                          | Finance and operations data as a Copilot Studio knowledge source      |

Prebuilt does not mean uncontrolled. Confirm feature availability, environment prerequisites, licensing, preview status, supported regions, data boundaries, and human approval requirements before rollout.

## 3. Chat with Finance and Operations Data

Microsoft's agent platform can make structured finance and operations data available as agent knowledge.

### Supported architecture patterns

- Add **finance and operations virtual entities** as knowledge sources.
- Add a **native Dataverse table** as knowledge.
- Synchronize finance and operations data into Dataverse with a mechanism such as **dual-write**, then ground the agent in the Dataverse table.
- Add the knowledge to the in-app finance and operations Copilot, a custom Copilot Studio agent, or another supported agent surface.

The agent derives answers from structured data available to the user. The source-system access boundary remains part of the design.

### Extending Microsoft 365 Copilot

When users need ERP Q&A in Microsoft 365 Copilot:

1. create a declarative agent;
2. add the approved finance and operations knowledge;
3. add only the actions users need;
4. publish the agent to Microsoft 365 Copilot;
5. validate permissions and representative user scenarios.

Do not give Microsoft 365 Copilot broad database-owner access. The agent should expose narrowly scoped knowledge and actions through supported integration boundaries.

## 4. Customer Experience and Service

Dynamics 365 Sales and Customer Service are model-driven apps built on Power Apps. They can use app-specific Copilot features and supported Power Apps AI capabilities such as record summaries, form-fill assistance, finding data with natural language, and data visualization.

Use app-native features when the requirement is already covered. Add a custom agent or integration only for a genuine capability gap.

### Copilot for Sales versus Copilot for Service

| User and workflow                                                            | Product alignment                 |
| ---------------------------------------------------------------------------- | --------------------------------- |
| Seller working across Outlook, Teams, and CRM context                        | Microsoft 365 Copilot for Sales   |
| Service representative resolving cases with CRM and organizational knowledge | Microsoft 365 Copilot for Service |

Configuration is more than installation. Verify:

- the supported CRM connection and environment;
- user licensing and app availability;
- CRM roles and record-level access;
- the fields, summaries, and experiences enabled for the user group;
- admin deployment and organizational app policies;
- knowledge-source permissions and sensitivity controls.

**Exam trap:** a Microsoft 365 surface does not erase CRM authorization. CRM-aware assistance should return only the records and knowledge the user is allowed to access.

## 5. Microsoft 365 Agents for Business Scenarios

Propose a Microsoft 365 agent when the work starts in Microsoft 365 and benefits from organizational context such as SharePoint, Teams, Outlook, or approved ERP knowledge.

Useful business patterns include onboarding, policy Q&A, sales preparation, service knowledge assistance, and cross-system information retrieval. Use Agent Builder for a straightforward declarative knowledge agent; use Copilot Studio when the scenario needs richer orchestration, connectors, topics, controls, or actions.

Remember the separation:

- **Knowledge** answers questions.
- **Instructions** shape behavior.
- **Actions/tools** perform operations.
- **Sharing/publishing** controls availability.
- **Source permissions** control what each user can retrieve.

## 6. Power Platform AI Hub and AI Builder

Power Platform provides low-code AI capabilities that can be composed into Power Apps and Power Automate. AI Builder covers patterns such as document processing, prediction, classification, extraction, and prompt-based generative tasks.

Use these capabilities when the process belongs in a Power Platform app or flow and a supported low-code model or prompt meets the requirement. A custom hosted model is justified only when supported capabilities cannot meet the required behavior, control, performance, or data boundary.

Apply normal architecture controls:

- validate prompt and model outputs;
- define confidence thresholds and exception paths;
- require approval for consequential actions;
- monitor consumption and licensing capacity;
- place components in solutions for ALM;
- enforce connector and data policies.

## 7. Knowledge Is Not Transaction Authority

This is today's most important boundary.

Suppose an agent can answer, "Which purchase orders are overdue?" from a Dataverse or virtual-entity knowledge source. That does not mean it can approve or update those orders.

To perform a transaction, add:

1. an authenticated action, connector, API, or agent flow;
2. authorization using the correct user or workload identity;
3. input and business-rule validation;
4. confirmation or human approval where impact requires it;
5. audit logging, failure handling, and idempotency.

More indexed data, general LLM knowledge, or fine-tuning cannot substitute for transaction authority.

## 8. Exam Decision Patterns

| Scenario clue                                        | Likely decision                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| "How do I complete this task in Finance?"            | Generative help and guidance sidecar                                     |
| Company procedure must augment public F&O help       | Add approved custom knowledge in Copilot Studio                          |
| Ask questions over live structured ERP records       | Virtual entity or Dataverse knowledge source                             |
| Ask ERP questions from Microsoft 365 Copilot         | Declarative agent with ERP knowledge, published to Microsoft 365 Copilot |
| Vendor follow-up and PO change handling              | Supplier Communications Agent                                            |
| Collections summary and reminder draft               | Collections coordinator summary                                          |
| Seller needs CRM context in Outlook/Teams            | Copilot for Sales                                                        |
| Service representative needs case and knowledge help | Copilot for Service                                                      |
| Low-code document/prediction/prompt capability       | Power Platform AI capability or AI Builder                               |
| Agent must update a record                           | Authenticated action plus controls, not knowledge alone                  |

## 9. Common Traps

- Building a custom model before checking the Dynamics 365 or Power Platform catalog.
- Treating generative help as a transaction-processing agent.
- Using stale exports when supported virtual entities or Dataverse grounding can provide structured data.
- Assuming publishing an agent grants access to every underlying source.
- Confusing retrieval with action authority.
- Enabling broad general knowledge in a regulated workflow without a risk decision.
- Ignoring preview status and prerequisites in an architecture recommendation.
- Selecting Copilot for Sales for a service workflow, or Copilot for Service for a seller workflow.

## 10. Quick Recall

Before starting the quiz, explain these aloud in one sentence each:

1. Why is the finance and operations sidecar different from Supplier Communications Agent?
2. When would you use a virtual entity instead of a static document?
3. How do you expose ERP knowledge in Microsoft 365 Copilot?
4. Why does a knowledge source not authorize a purchase-order update?
5. What separates Copilot for Sales from Copilot for Service?

## Official Sources Researched

- [AB-100 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-100)
- [Agents, Copilot, and AI capabilities in Dynamics 365 apps](https://learn.microsoft.com/en-us/dynamics365/copilot/ai-get-started)
- [Generative help and guidance with Copilot](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/fin-ops/copilot/copilot-generative-help)
- [Chat with finance and operations data](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/copilot/chat-with-fno-data)
- [Supplier Communications Agent setup](https://learn.microsoft.com/en-us/dynamics365/supply-chain/procurement/supplier-com-agent-setup)
- [Collections coordinator summary](https://learn.microsoft.com/en-us/dynamics365/finance/accounts-receivable/collectionscoordinatorsummary)
- [Agent Builder in Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/agent-builder)
- [Copilot and AI features in Power Apps](https://learn.microsoft.com/en-us/power-apps/copilot-landing-page)

## Quiz

Today's assignment contains exactly 10 questions: q091 through q100. Run it only after completing the quick recall prompts.

```powershell
python quiz_runner.py --ids q091,q092,q093,q094,q095,q096,q097,q098,q099,q100
```
