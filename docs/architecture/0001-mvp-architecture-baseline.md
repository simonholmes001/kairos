# ADR 0001: MVP Architecture Baseline

## Status

Accepted for MVP implementation.

## Context

KAIROS was originally described with both web and iOS clients and a broad Azure service topology. The current product decision is narrower: KAIROS has one human-facing client, the iOS app, and one user/operator.

The agentic system should run automatically. The iOS app is not a hosted command centre replacement; it is the operator surface for portfolio status, alerts, explainability, approvals where required, and emergency controls.

## Decision

Use an iOS-only UI with a private, low-cost Azure automation backend.

MVP rules:

- Do not build a browser-based application.
- Do not scaffold a Next.js app.
- Keep safe presentation/read state on the phone where practical.
- Keep authoritative trading, risk, audit, provider, and execution state in Azure.
- Prefer Azure Functions Flex Consumption for scheduled, triggered, and background work.
- Use Azure Container Apps Consumption only where a service genuinely needs containerized long-running HTTP or worker behavior.
- Use Container Apps Jobs or Functions for ingestion batches, backtests, outcome evaluation, replay, and reconciliation.
- Start with Storage/Data Lake, Key Vault, managed identity, Application Insights, Log Analytics, and explicit budgets.
- Add PostgreSQL only when authoritative ledger/domain persistence begins.
- Use Storage Queue for simple low-cost work.
- Use Service Bus only for high-value command workflows that need stronger delivery semantics.
- Defer API Management, Front Door, Web PubSub, Redis, Data Explorer, Event Hubs, AI Search, always-on compute, and multi-region deployment.

## Rationale

This keeps the first implementation aligned with the actual operating model: one user, one iOS app, automated backend services, and strict trading controls. It also applies the main lesson from Deja Groove: do not pay for hosted platform breadth before the product proves it needs it.

KAIROS cannot copy Deja Groove exactly because trading requires server-side secrets, broker boundaries, deterministic risk controls, immutable decision records, and an authoritative ledger. The useful pattern is local-first presentation plus minimal cloud authority, not local execution authority.

## Consequences

- CI, repo layout, and CODEOWNERS should not include web as an active stack.
- iOS implementation must handle stale/offline state explicitly.
- Backend APIs should be narrow and purpose-built for the iOS app and automated agents.
- Every new Azure service needs cost, private-network, and teardown rationale.
- Any future web UI requires a new issue and architecture decision.

## Validation

- Repository scaffold has no `web/` application path.
- GitHub Actions test active stacks only.
- Phone/cloud boundary is documented.
- Provider setup is documented before integration work starts.
