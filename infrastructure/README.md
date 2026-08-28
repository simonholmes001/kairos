# KAIROS Infrastructure

This path holds the private, low-cost Azure baseline.

Initial infrastructure work must stay serverless-first and private-network-first. API Management, Front Door, Web PubSub, Redis, Data Explorer, Event Hubs, AI Search, always-on compute, and multi-region deployment are deferred until an issue-linked architecture and cost decision approves them.

## Dev Baseline

The active Bicep baseline is subscription-orchestrated and has one environment, `dev`:

```text
infrastructure/bicep/resource-group.bicep
infrastructure/bicep/environments/dev-resource-group.bicepparam
infrastructure/bicep/main.bicep
infrastructure/bicep/environments/dev.bicepparam
infrastructure/bicep/platform.bicep
infrastructure/bicep/network.bicep
```

It provisions:

The deployment creates exactly two resource groups for `dev`:

- `rg-kairos-dev-network`: VNet, subnets, private DNS zones, DNS links, and private endpoints.
- `rg-kairos-dev-platform`: Storage, Key Vault, managed identity, Log Analytics, Application Insights, and budget.

The network module consumes the platform resource IDs as explicit cross-resource-group inputs. This keeps private connectivity in the network boundary while keeping business/platform resources in their own boundary.

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

Run what-if with subscription-scope permissions:

```bash
bash infrastructure/scripts/validate.sh dev --what-if
```

The subscription-scoped deployment creates both resource groups and then deploys the platform and network modules in dependency order. The GitHub OIDC identity therefore requires the `Contributor` role at the Kairos subscription scope, or an equivalent custom role that can create resource groups and deploy the required resources.

## CI/CD Deployment

`.github/workflows/azure-dev-deploy.yaml` deploys the dev baseline on pushes to `main` that change infrastructure files. It uses GitHub OIDC and the repository secrets:

```text
AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
```

The workflow runs lint validation, subscription what-if, and then subscription deployment into the two `dev` resource groups.

The previous `rg-kairos-dev` baseline is not automatically deleted or moved by this change. Migration and retirement of that legacy group must be a separate, verified operation so existing data and secrets are not destroyed.
