# Repository Layout

## Active Paths

```text
.
├── agents/
├── backend/
├── docs/
│   ├── architecture/
│   └── setup/
├── infrastructure/
├── ios/
├── quant/
├── scripts/
└── tests/
```

## Path Responsibilities

`ios/`

SwiftUI operator app, local cache/read models, notifications, approvals, kill switch, and iOS-specific tests.

`backend/`

Server-side domain services for portfolio, risk, execution, provider integration, ledger, and API boundaries.

`agents/`

Agent definitions, workflow graphs, tool contracts, prompt assets, and evaluation harnesses.

`quant/`

Deterministic price analysis, features, backtesting, strategy validation, and portfolio analytics.

`infrastructure/`

Private Azure baseline, cost controls, deployment validation, and guard tests.

`docs/`

Architecture decisions, setup prerequisites, operating policy, and implementation notes.

`tests/`

Cross-cutting contract, integration, safety, and scenario tests that do not naturally belong to one implementation package.

## Explicitly Absent

There is no active `web/` path in the MVP. Any future browser application requires a new issue and architecture decision.
