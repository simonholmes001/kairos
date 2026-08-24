# Phone/Cloud Boundary

## Purpose

This document defines what may run or persist on the iPhone and what must remain authoritative in Azure.

## Phone-Owned State

The iOS app may own:

- display preferences
- alert read/unread state
- local notification context
- last-known portfolio snapshots
- cached decision summaries and explainability payloads
- local watchlists
- scenario drafts that have not been submitted to KAIROS
- local routing/navigation state

Phone-owned state is never authoritative for trading.

## Azure-Owned State

Azure remains authoritative for:

- portfolio ledger
- positions and cash
- orders, fills, cancellations, and rejections
- approvals and approval expiry
- autonomy level
- kill-switch state
- risk policy and risk decisions
- agent runs and tool calls
- provider/model/broker credentials
- immutable decision records
- provider data provenance and entitlement metadata

## Duplicated Read Models

The iOS app may cache read-only copies of Azure-owned records for continuity. Cached data must carry freshness metadata and must be visibly stale when the backend cannot be reached.

Cached read models cannot:

- approve or reject trades
- change autonomy level
- activate or deactivate kill switch
- place, cancel, or modify orders
- update authoritative portfolio, ledger, or risk state
- fabricate live market or portfolio state

## Offline Behavior

When Azure is unreachable:

- portfolio and decision views may show the last-known snapshot with a stale marker
- alerts may remain visible locally
- draft questions or scenario requests may be queued locally only as drafts
- approvals, kill switch changes, broker actions, and execution actions must be disabled

## Secret Handling

Provider, model, and broker secrets must never be stored in the app bundle, user defaults, source files, or issue bodies. Secrets belong in Azure Key Vault, GitHub Actions secrets, local ignored development config, or manual-only setup according to provider type.

## Tests Required

Implementation must include tests proving:

- stale cached state is labeled as stale
- offline approval is impossible
- offline kill-switch mutation is impossible
- local cache cannot create or alter orders
- secrets are not loaded from app-bundled config
