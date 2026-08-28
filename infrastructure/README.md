# KAIROS Infrastructure

This path holds the private, low-cost Azure baseline.

Initial infrastructure work must stay serverless-first and private-network-first. API Management, Front Door, Web PubSub, Redis, Data Explorer, Event Hubs, AI Search, always-on compute, and multi-region deployment are deferred until an issue-linked architecture and cost decision approves them.

## Dev Baseline

The active Bicep baseline is resource-group scoped:

```text
infrastructure/bicep/resource-group.bicep
infrastructure/bicep/environments/dev-resource-group.bicepparam
infrastructure/bicep/main.bicep
infrastructure/bicep/environments/dev.bicepparam
```

It provisions:

- optional subscription-scope resource group bootstrap
- VNet with runtime and private endpoint subnets
- private DNS zones
- private endpoints for Key Vault and Storage blob/dfs/queue
- StorageV2 with Data Lake namespace and public access disabled
- Key Vault with RBAC authorization and public access disabled
- user-assigned managed identity for future workloads
- Log Analytics and Application Insights
- resource-group budget

FinOps policy and runbook:

```text
infrastructure/finops/policy.json
docs/operations/finops-runbook.md
```

## Validation

Run:

```bash
bash infrastructure/scripts/guard-tests.sh
bash infrastructure/scripts/validate.sh dev --lint-only
```

Run what-if after `rg-kairos-dev` exists and GitHub/Azure OIDC has the required resource-group permissions:

```bash
bash infrastructure/scripts/validate.sh dev --what-if
```

Resource group bootstrap is separated because it requires subscription-scope permissions. Normal GitHub deployment should use resource-group scope after `rg-kairos-dev` exists.

## CI/CD Deployment

`.github/workflows/azure-dev-deploy.yaml` deploys the dev baseline on pushes to `main` that change infrastructure files. It uses GitHub OIDC and the repository secrets:

```text
AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
```

The workflow runs lint validation, group what-if, and then resource-group deployment into `rg-kairos-dev`.
