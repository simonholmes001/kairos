# Third-Party Provider Prerequisites

## Purpose

KAIROS should not begin provider integration until the required accounts, credentials, entitlements, rate limits, and cost posture are known. Do not store secret values in this document.

The machine-readable provider manifest is `docs/setup/provider-prerequisites.json`.

## Required Before Active Implementation

| Provider | Setup | Initial Tier | Secret Location | Consuming Issues |
| --- | --- | --- | --- | --- |
| Azure | Dedicated KAIROS dev subscription or resource-group strategy with budgets and owner/contact details | lowest viable dev spend | GitHub OIDC plus Azure-managed identity | #13, #47, #48 |
| FRED | API key for macroeconomic series | free | Azure Key Vault for deployed services; local ignored config for development | #37 |
| SEC EDGAR | Contact/user-agent policy and request-rate rules | no paid subscription expected | config only; no secret expected | #17, #37 |
| Alpaca | Paper Trading account and API credentials | paper/free where available | Azure Key Vault; local ignored config for adapter tests | #30, #43 |
| Massive | Equities market-data account and API key | free/basic first | Azure Key Vault; local ignored config for development | #15, #16 |
| CoinGecko | Demo API key | demo/free first | Azure Key Vault; local ignored config for development | #15, #16 |
| Apple Developer | Team, bundle identifier, signing, and TestFlight readiness | only when iOS release starts | GitHub environment secrets and local ignored Xcode config | #49 |

## Conditional / Later

| Provider | Use When | Initial Decision |
| --- | --- | --- |
| Coinbase Developer / Advanced Trade | Crypto execution design enters near-term scope | defer until execution slice needs it |
| CoinGlass | Crypto derivatives, funding, and open-interest analysis starts | defer |
| Quiver | Political/government/alternative intelligence starts | defer |
| Benzinga | News/Event Agent requires paid news access | defer |
| Intrinio | Fundamentals needs exceed lower-cost or free provider options | defer |
| Interactive Brokers | Live brokerage design and compliance readiness are approved | defer |

## Provider Setup Record

For every provider that moves from deferred to active, record:

- account owner
- environment: dev, paper, live, or manual research
- provider tier and expected monthly cost
- credential names, not values
- target storage location
- rate limits and quota behavior
- entitlement and redistribution constraints
- cache/storage permission
- fallback behavior
- related implementation issue

## Guardrails

- Paid subscriptions require issue-linked approval before activation.
- Broker and exchange credentials must be separated by paper/live environment.
- Agents cannot receive raw provider credentials.
- Provider data must flow through KAIROS ingestion/tool boundaries with provenance metadata.
- If provider terms do not allow storage, caching, model use, or agent access patterns, integration must stop until an alternative is selected.
