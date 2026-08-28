# ADR 0002: Dev Platform IaC Baseline

## Status

Accepted for implementation slice #12, #13, #14, and #47.

## Context

KAIROS needs an Azure development baseline before backend, agent, risk, execution, and iOS API work can depend on cloud resources. The system has one operator and an iOS-only UI, so the first Azure footprint must stay small, private-network-first, and cost-controlled. There is one deployment environment: `dev`.

## Decision

Provision a subscription-orchestrated dev baseline in Bicep across two resource groups:

- `rg-kairos-dev-network` owns the VNet, subnets, private DNS zones, DNS links, and private endpoints.
- `rg-kairos-dev-platform` owns Storage, Key Vault, the user-assigned managed identity, Log Analytics, Application Insights, and the budget.

`main.bicep` creates both resource groups and passes platform resource IDs into the network module. CI/CD deploys this composition; there are no test, staging, or production variants.

- VNet with separate runtime and private endpoint subnets
- private DNS zones and private endpoints for Key Vault and Storage data paths
- StorageV2 account with Data Lake namespace for provider data, artifacts, replay, backtest output, and queue-backed simple async work
- Key Vault with RBAC authorization for provider, model, and broker secrets
- user-assigned managed identity for future backend workloads
- Log Analytics workspace with low dev retention and daily cap
- workspace-based Application Insights with public ingestion/query disabled
- Azure budget at the resource group scope
- required cost/security/governance tags

## Deferred

Do not provision these in the dev baseline:

- browser/web hosting
- API Management
- Front Door
- Web PubSub
- Event Hubs
- Service Bus
- Redis
- Data Explorer
- AI Search
- PostgreSQL
- always-on compute
- multi-region deployment

## Rationale

This keeps the first platform slice aligned with the product decision: automated backend services, one iOS operator surface, and no paid platform breadth before the domain model and first runtime prove a need. Storage Queue is enough for simple early async work; Service Bus remains reserved for later high-value command workflows that need duplicate detection, sessions, transactions, or dead-letter workflows.

## Consequences

- The first Bicep validation can run without provisioning compute.
- Private endpoints increase baseline cost, but they satisfy the private-network requirement for data and secrets.
- Resource-group separation improves ownership, access control, cost attribution, and lifecycle management without introducing another environment.
- The existing `rg-kairos-dev` deployment is treated as a legacy migration source. It is not deleted automatically; moving or retiring those resources requires a separately verified migration operation to protect existing data and secrets.
- App Insights public access is disabled in the target configuration; runtime connectivity through Azure Monitor private link must be reviewed when compute is added.
- PostgreSQL is deferred until ledger/decision-record persistence is implemented.
