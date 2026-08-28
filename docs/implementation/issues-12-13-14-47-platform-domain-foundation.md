# Issues #12, #13, #14, #47 Platform and Domain Foundation

## Scope

This slice establishes the next foundation layer after the repository scaffold:

- canonical domain and event contracts
- executable operator auth/RBAC boundary
- private-network-first Azure dev baseline in Bicep
- Azure cost-control guardrails

## Azure Resource Intent

The dev baseline provisions only shared platform resources:

| Resource | Why |
| --- | --- |
| VNet/subnets | Defines runtime and private endpoint network boundaries before compute is added. |
| Private DNS zones | Required for private endpoint resolution. |
| Storage account | Low-cost provider data, artifacts, replay/backtest output, and simple queue-backed async work. |
| Key Vault | Central secret boundary for providers, models, broker credentials, and future runtime secrets. |
| Managed identity | Future backend/agent runtimes use identity-based access instead of secrets. |
| Log Analytics | Central log/metric store with low dev retention and daily cap. |
| Application Insights | Application telemetry surface for future APIs, agents, ingestion, and execution. |
| Budget | Hard visibility into dev spend from the first deployment. |

## Deferred Until Later Issues

Compute, PostgreSQL, Service Bus, API Management, Front Door, Web PubSub, Redis, Event Hubs, Data Explorer, and AI Search stay out of this slice.

## Security Rules

- Public access is disabled for Storage and Key Vault.
- Storage shared key access is disabled.
- Secrets do not go into source, issue bodies, or iOS bundles.
- Operator permissions are explicit and require stronger assurance for financial or safety mutations.

## Completion Evidence

- Contract tests validate strict schemas and financial idempotency/correlation requirements.
- Backend auth tests prove unauthenticated access is blocked except health endpoints, sensitive actions require server-side permission, strong assurance, and audit reasons.
- IaC validation builds Bicep and bicepparam files.
- CI/CD deploy workflow validates, previews, and deploys the dev baseline on merge to `main` when infrastructure changes.
- FinOps tests verify budget, tags, SKU guardrails, deferred-service blocks, and cost circuit breakers.
