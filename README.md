# KAIROS

KAIROS is an iOS-only, agentic market-intelligence and trading system for a single operator.

The iOS app is the only human-facing application. Azure hosts the automated agent, risk, data, ledger, and execution control plane. The initial architecture is private-network-first and cost-disciplined: use phone-local read models where safe, keep secrets and trading authority server-side, and defer expensive Azure services until a specific issue proves the need.

## Active MVP Shape

- `ios/` - SwiftUI operator app, local read/cache policy, notifications, approvals, and kill switch.
- `backend/` - server-side domain services for portfolio, risk, execution, providers, and agent orchestration.
- `agents/` - agent workflow definitions, tool contracts, prompts, and evaluation harnesses.
- `quant/` - deterministic quantitative analysis, features, backtests, and strategy validation.
- `infrastructure/` - private Azure baseline, cost guardrails, and deployment validation.
- `docs/` - architecture decisions, provider setup, local/cloud boundary, and operating policy.
- `tests/` - cross-cutting integration, contract, and safety test planning.

There is intentionally no browser-based application in the MVP.

## First Implementation Batch

This scaffold starts issues #1, #11, #51, and #52:

- architecture baseline
- repository layout and CI conventions
- iPhone-local runtime boundary
- third-party provider subscription prerequisites

## Validation

```bash
npm test
npm --prefix agents test
npm --prefix quant test
bash infrastructure/scripts/validate.sh dev --lint-only
swift test --package-path ios/KairosApp
```
