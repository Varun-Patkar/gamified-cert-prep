# Day 17: D3.4 Compliance & Audit

**Date**: 2026-08-28
**Domain**: Deploy AI-powered business solutions (40-45%)
**Subtopics**: Data residency and movement compliance; audit trails for model and data changes
**Estimated study time**: 1 hr

---

## TL;DR (60-second skim)

- A Power Platform environment is bound to a macro-region, but that does not prove every dependent AI feature processes prompts and outputs there. Validate each feature, model, connector, and connected service.
- Power Platform's **Move data across regions** consent can permit prompts and outputs to leave the environment region. Clearing it affects eligible future processing; it cannot reverse movement that already occurred.
- For Foundry Models sold by Azure, standard/regional, **DataZone**, and **Global** deployments have different processing boundaries. Keep processing location separate from storage-at-rest location.
- Cross-geo Power Platform pipeline deployment moves a solution and target configuration; it does not prove seed data, connection endpoints, or runtime business-data flows are compliant.
- Dataverse field-change evidence requires auditing at the environment, table, and relevant column levels. Row auditing is not a universal platform activity ledger.
- Reproducible model evidence links immutable versioned training data, the training run, code revision, registered model version, evaluation, approver, deployment, identity, and timestamp.
- Searchable audit records and immutable preservation solve different needs. Purview retention depends on licensing and policy; locked Blob WORM retention or a legal hold protects selected exported evidence from alteration.
- Application Insights is APM and observability. Correlate it with authoritative audit, version, approval, and deployment records rather than treating telemetry as the compliance ledger.

---

## Learning Objectives

After this session, you should be able to:

1. Validate residency from an end-to-end data-flow inventory instead of inferring it from one environment setting.
2. Distinguish processing location, storage location, data transfer, service dependency, and contractual commitment.
3. Compare regional, DataZone, and Global Foundry processing boundaries.
4. Separate cross-geo solution deployment from configuration, seed-data, and runtime-data movement.
5. Select the correct Dataverse, Purview, ALM, source-control, Azure, and application evidence surfaces for an event.
6. Design a reproducible audit chain for agent, model, training-data, configuration, approval, and deployment changes.
7. Apply retention, legal hold, immutability, access, and privacy controls to audit evidence.

---

## Key Concepts

### 1. Residency is an end-to-end data-flow property

Power Platform environments are bound to a geographic location. Apps and environment resources are routed to datacenters in that macro-region. This is an important control, but not a universal statement about every external or dependent service.

For each feature, document the data item, purpose, service hop, processing boundary, storage boundary, governing commitment, controlling setting, owner, and dated evidence. Include prompts, outputs, grounding chunks, search queries, files, embeddings, business rows, identities, and telemetry where applicable.

Do not use the maker's sign-in country, tenant display name, billing address, or one admin consent as a substitute for this analysis.

### 2. Power Platform environment geography and generative AI movement

The environment location establishes the macro-region for environment resources. Generative features can introduce a separate processing path when a required model is not available locally, capacity overflows, or a reliability issue affects the local model.

When **Move data across regions** is selected, inputs (prompts) and outputs (results) might move outside the environment region to the feature-hosting location. Important current behaviors:

- Not allowing movement does not necessarily disable every Copilot or generative feature; availability depends on feature and regional capacity.
- Clearing consent can constrain eligible future processing, but cannot reverse data movement that occurred while consent was enabled.
- The Bing search and Microsoft 365 services controls are distinct feature dependencies, even where cross-region consent is a prerequisite.
- Some generative features powered by Microsoft 365 store data under Microsoft 365 terms and residency commitments.
- A connected service's own current terms remain authoritative; never generalize one Power Platform approval across Microsoft 365, Bing, connectors, or custom APIs.

**Evidence package**: environment region, enabled feature list, all consent states, mapped processing/storage locations, dependency terms, approval owner/date, exception expiry, and periodic revalidation date.

### 3. Foundry deployment boundaries: processing is not storage

For Foundry Models sold by Azure, standard processing is within the customer-specified Azure **geography**, although requests may be processed between regions in that geography for operational purposes. A geography is not necessarily one Azure region.

| Deployment type | Prompt/response processing boundary | Data stored at rest | Exam cue |
| --- | --- | --- | --- |
| Standard/regional | Customer-specified Azure geography; may use regions within that geography | Customer-designated geography, subject to feature behavior | Residency requirement tied to a geography; confirm model/type availability |
| DataZone | Any geography within the specified Microsoft data zone; US deployments can process within the US, EU deployments within EU member nations | Customer-designated geography | Wider than one region, narrower than global |
| Global | Any geography where the relevant model sold by Azure is deployed | Customer-designated geography | Capacity/availability optimized globally; unsuitable for a strict specified-geography processing rule |

Global and DataZone alter the **location of processing**, not the designated geography for at-rest data such as uploaded data and the applicable abuse-monitoring store. Some APIs are stateful and store service data, including Files/vector stores and certain Responses, Assistants, and stored-completion scenarios. Inventory those separately from stateless inference.

Never assume the resource region, endpoint hostname, or at-rest location alone establishes the prompt-processing boundary. Confirm the exact model, deployment type, feature, and current availability.

### 4. Cross-geo solution deployment is not runtime-data compliance

Power Platform pipelines can deploy solutions across geographies when the host setting **Cross-Geo Solution Deployment** is enabled and prerequisites are met. Microsoft notes that this setting enables data sharing across geographical regions within the tenant.

Pipelines deploy the solution/customizations, target configuration such as connections and environment variables, and deployment metadata/stored solution versions.

Solutions do not contain ordinary data stored in Dataverse tables. That does not prove the release has no data movement. Review four layers: **artifact** (definitions/code/metadata), **configuration** (endpoints, connection references, variables), **seed/reference data** (separately migrated records, files, prompts, evaluation sets, indexes), and **runtime flows** (prompts, outputs, connectors, rows, telemetry, APIs).

Approval to move an artifact is not approval for all four layers. Preserve the same reviewed artifact across stages, but perform separate residency and purpose reviews for configuration and data flows.

### 5. Dataverse audit configuration and boundaries

Dataverse auditing records supported customer-record changes and can answer who created or updated a record and when, which fields changed, and the previous value. Audit records consume Dataverse log storage and may appear with delay.

To capture a field change, enable auditing in this order:

1. Turn on auditing for the **environment**.
2. Turn on auditing for the relevant **table**.
3. Turn on auditing for each relevant **column**.
4. Grant investigators the required privileges and define retention/capacity procedures.

Use **Audit History** for one record and **Audit Summary** for audited operations across an environment. Logs can also be retrieved through the Web API or .NET SDK.

Dataverse row auditing does not support table/column definition changes, authentication, retrieve operations, or export operations. Use Dataverse and model-driven-app activity logging for supported reads/exports, then layer other records for maker, schema, and release activity.

### 6. Choose the audit surface by event

| Event/evidence need | Primary surface | What it does not prove alone |
| --- | --- | --- |
| Dataverse row/field create, update, delete, share | Dataverse auditing | Schema change, all reads/exports, agent authoring, approval |
| Dataverse/model-driven app reads and exports | Activity logging surfaced through Purview | Field prior value or complete maker configuration history |
| Copilot Studio create, update, auth change, publish, delete | Copilot Studio administrative activities in Microsoft Purview Audit | Source diff, business approval, immutable preservation |
| Solution artifact and stage deployment | Pipeline/deployment history and stored artifact | Runtime data movement or downstream authorization |
| Configuration content and exact diff | Source control plus solution unpack/export and review | Actual production runtime outcome |
| Azure resource/control-plane change | Azure Activity Log | Application-level data/model semantic change |
| Model/data asset lineage | Azure Machine Learning assets, jobs, registry, lineage | Business approval unless linked explicitly |
| Runtime requests, dependencies, failures, latency | Application Insights / Azure Monitor | Complete governed change ledger |
| Searchable Microsoft service activity | Microsoft Purview Audit | WORM preservation for a separately mandated evidence copy |
| Tamper-resistant retained evidence | Immutable Blob Storage | Searchable source activity unless indexed/exported with metadata |

Copilot Studio administrative activities are collected by default; Purview exposes activity filters and events for agent creation, deletion, publishing, authentication changes, and other updates. One user action can create multiple events because logging occurs at the SDK layer. Correlate by actor, time, environment/agent ID, operation, and release ID rather than counting raw events as business actions.

### 7. Reproducible model and data change trail

An auditor should be able to move from an approved deployment backward to the exact model, run, code, environment, and input data without relying on names or screenshots.

**Minimum chain**:

`business requirement/risk -> source commit -> immutable data asset version -> training job/run -> metrics and evaluation set/version -> registered model version -> approval -> deployment/version -> runtime telemetry and incidents`

Azure Machine Learning data asset versions are immutable and support reproducibility, auditability, and consuming-job/pipeline lineage. They identify who updated a version and when. Registered models store and version trained models; register from the exact job output where possible.

The release manifest should capture the release/change ID; source commit; data asset name/version/URI/hash; run ID, environment, components, parameters, seed, and identity; model name/version and producing job; evaluation data/version, sliced metrics, thresholds, safety results, and exceptions; approval identity/rationale/time; endpoint binding, deployment type/geography, configuration, and rollback target.

Do not overwrite a training folder or reuse an unversioned model filename as evidence. A latest-score screenshot cannot establish lineage, identity, prior state, or reproducibility.

### 8. Retention, immutability, and privacy

**Searchability**, **retention**, and **immutability** are different requirements.

Microsoft Purview Audit provides searchable records. Current defaults and extended durations depend on workload, user licensing, and applicable retention policy. Audit Standard records generated on or after October 17, 2023 use a 180-day default. Audit Premium provides custom retention policies; supported longer periods and eligibility depend on E5/add-on licensing. Custom policies take priority over the default, with lower numerical priority values processed first. Verify the generating user's license, record type, duration, and policy rather than quoting one duration universally.

For evidence that must not be changed or deleted, export only the required records and metadata to approved **immutable Azure Blob Storage**:

- A time-based retention policy keeps blobs WORM for a defined interval.
- A legal hold keeps blobs WORM until the hold is explicitly cleared and is suitable when the duration is unknown.
- A locked time-based policy cannot be deleted or shortened; it can be extended.
- An unlocked policy is for testing and can be changed or removed; do not call it the final compliant control.
- An ordinary writable container, CSV export, snapshot, backup, or administrator promise is not WORM evidence.

Protect evidence with least privilege, separation of duties, encryption, monitored access, documented disposal, legal/privacy review, and data minimization. Do not retain prompt bodies or personal data merely because more logging feels safer.

---

## Decision Frameworks

### Residency decision

`inventory every data item/hop -> identify required processing and storage boundaries -> verify exact feature/model/deployment type -> inspect every dependent service and connector -> compare all hops with policy and current terms -> change or reject noncompliant paths -> approve with evidence and revalidation triggers`

### Audit-evidence decision

1. Identify the claim: **who**, **when**, **what changed**, **old/new value or version**, **why/approval**, **where deployed**, **runtime effect**.
2. Choose the authoritative source for that event; do not start with whichever dashboard is familiar.
3. Add a common correlation/release ID across source, run, approval, deployment, and telemetry.
4. Check coverage gaps, retention, licensing, access, clock/time-zone consistency, and export delay.
5. If alteration protection is required, preserve the selected evidence under a locked WORM policy or applicable legal hold.
6. Test retrieval and reconstruction periodically. Evidence that cannot be found or correlated does not satisfy the control.

---

## Important Details for Exam

- **Region is not geography**: standard Foundry processing can move among regions inside the specified Azure geography.
- **DataZone is not one region**: it permits processing within the specified data zone.
- **Global changes processing scope**: at-rest data remains in the customer-designated geography under the documented behavior.
- **Consent is prospective, not a rewind**: clearing cross-region movement does not reverse earlier movement.
- **Environment + table + column**: all are needed for relevant Dataverse field-change audit evidence.
- **Purview duration is conditional**: retention depends on record type, policy, generating-user license, and add-ons.
- **Locked matters**: a final time-based WORM policy must be locked; an unlocked policy can be shortened or deleted.
- **Application Insights is APM**: useful for correlation and runtime facts, not automatic proof of approvals, prior values, versions, or immutability.

---

## Common Traps & Misconceptions

1. **"The environment is in Germany, so every AI call stays in Germany."** Environment binding does not replace per-feature and dependency validation.
2. **"Turning consent off brings moved data back."** It cannot undo movement that already happened.
3. **"Global means globally available but region-local processing."** Global can process in any geography where the model is deployed.
4. **"At-rest geography proves inference location."** Storage and processing are separate dimensions.
5. **"One consent covers Microsoft 365, Bing, and every connector."** Each dependency has its own behavior and commitments.
6. **"A cross-geo solution deployment proves business data compliance."** Artifact deployment, configuration, seed data, and runtime flows require separate review.
7. **"Dataverse auditing captures every platform event."** Row auditing omits schema changes and supported read/export coverage requires other activity logging.
8. **"A retained searchable log is immutable."** Search/retention and tamper-resistant WORM preservation are distinct.
9. **"Telemetry is an audit ledger."** Runtime spans/events are supporting evidence unless designed and governed as part of a broader authoritative chain.

---

## Real-World Scenarios

1. **EU agent with Bing and Microsoft 365 grounding**: Map Power Platform, model processing, Bing, Microsoft 365 storage, connectors, and telemetry separately. Record each consent and current service commitment.
2. **Monthly credit-risk retraining**: Pin the immutable AML data asset, run, source commit, registered model, evaluation, approval, and endpoint binding. A model display name is insufficient.
3. **Seven-year evidence mandate**: Keep source audit searchable under validated licensing/policy and preserve the mandated subset in locked time-based WORM storage. Apply legal hold when the release date is unknown.
4. **Customer-risk field investigation**: Use environment/table/column Dataverse auditing and Audit History for prior-value attribution; use other activity and maker logs for surrounding exports or configuration changes.

---

## Quick Reference Card

**Residency checklist**: data item -> service hop -> purpose -> processing boundary -> storage boundary -> consent/config -> contract -> owner -> dated evidence -> revalidation trigger.

**Audit checklist**: actor -> timestamp -> old/new state or immutable version -> source/run -> evaluation -> approval -> deployment -> runtime correlation -> retention -> access -> tamper protection.

**Use the right noun**:

- Dataverse Audit History: one record's change history.
- Dataverse Audit Summary: audited operations across the environment.
- Purview Audit: searchable Microsoft service/user/admin activity.
- AML data/model versions: reproducibility and lineage.
- Pipeline/source control: artifact, deployment, and configuration history.
- Application Insights: runtime health, behavior, dependencies, failures, and performance.
- Immutable Blob Storage: WORM preservation under time-based retention or legal hold.

---

## Cross-Domain Quiz Question Refreshers

There are **no cross-domain carryover questions assigned today**. Questions q161-q170 all test D3.4 compliance, residency, data movement, or audit-trail design. The quiz command below uses `--carryover 0` to keep the set exact.

---

## Related Questions in questions.json

- q161-q165: environment/service processing boundaries, consent, Foundry deployment types, connected-service commitments, and cross-geo solution deployment.
- q166-q170: Dataverse audit configuration and gaps, model/data lineage, Purview versus WORM retention, and observability versus authoritative audit evidence.

Quiz command for exactly today's ten assigned IDs:

```powershell
python quiz_runner.py questions.json --day-lock 17 --carryover 0 --shuffle --open-images --web --port 8765
```

---

## Sources (verified during this session)

- [Power Platform environments overview](https://learn.microsoft.com/en-us/power-platform/admin/environments-overview)
- [Move data across regions for Copilots, AI agents, and generative AI features](https://learn.microsoft.com/en-us/power-platform/admin/geographical-availability-copilot)
- [Data, privacy, and security for Foundry Models sold by Azure](https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/openai/data-privacy)
- [Overview of pipelines in Power Platform](https://learn.microsoft.com/en-us/power-platform/alm/pipelines)
- [Enable cross-geo solution deployments for pipelines](https://learn.microsoft.com/en-us/power-platform/alm/enable-cross-geo-solution-deployments)
- [Manage Dataverse auditing](https://learn.microsoft.com/en-us/power-platform/admin/manage-dataverse-auditing)
- [View Copilot Studio audit logs in Purview](https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-logging-copilot-studio)
- [Audit logs for Copilot and AI applications](https://learn.microsoft.com/en-us/purview/audit-copilot)
- [Audit log activities](https://learn.microsoft.com/en-us/purview/audit-log-activities)
- [Manage audit log retention policies](https://learn.microsoft.com/en-us/purview/audit-log-retention-policies)
- [Create Azure Machine Learning data assets](https://learn.microsoft.com/en-us/azure/machine-learning/how-to-create-data-assets?view=azureml-api-2)
- [Register and work with Azure Machine Learning models](https://learn.microsoft.com/en-us/azure/machine-learning/how-to-manage-models?view=azureml-api-2)
- [Immutable Storage for Blob Data overview](https://learn.microsoft.com/en-us/azure/storage/blobs/immutable-storage-overview)
- [Application Insights OpenTelemetry observability overview](https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)

---

## Notes (your own words - fill this in after studying)

- Residency takeaway:
- Audit-evidence takeaway:
- Exam trap to remember:
