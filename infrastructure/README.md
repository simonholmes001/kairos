# KAIROS Infrastructure

This path will hold the private, low-cost Azure baseline.

Initial infrastructure work must stay serverless-first and private-network-first. API Management, Front Door, Web PubSub, Redis, Data Explorer, Event Hubs, AI Search, always-on compute, and multi-region deployment are deferred until an issue-linked architecture and cost decision approves them.

## Validation

Run:

```bash
bash infrastructure/scripts/guard-tests.sh
bash infrastructure/scripts/validate.sh dev --lint-only
```

The initial validation is intentionally guard-only until Azure Bicep files are introduced.
