# Issues #1, #11, #51, and #52 Implementation Notes

## Scope Completed In This Slice

This slice establishes the foundation needed before feature implementation accelerates.

## Issue #1: Architecture Baseline

Completed by:

- documenting the accepted iOS-only MVP architecture in `docs/architecture/0001-mvp-architecture-baseline.md`
- documenting that Azure is private, low-cost, serverless-first, and authoritative for trading state
- documenting deferred Azure services and the rule that they need issue-linked approval before adoption

## Issue #11: Repository Scaffold, CI, And Release Baseline

Completed by:

- adding active repository paths for iOS, backend, agents, quant, infrastructure, docs, and cross-cutting tests
- keeping `web/` absent from the active MVP scaffold
- adapting CI and pre-commit checks to active stacks
- adding a Swift package and test target for the iOS foundation
- adding root, agents, and quant Node package test scaffolds
- adding infrastructure guard and validation scripts
- adding a changeset for releasable scaffold work

## Issue #51: iPhone-Local Runtime Boundary

Completed by:

- documenting phone-owned, Azure-owned, and duplicated read-model state in `docs/architecture/phone-cloud-boundary.md`
- adding a tested Swift boundary policy in `ios/KairosApp`
- proving that stale snapshots are detectable
- proving that approval, kill-switch, autonomy, and order actions require backend reachability

## Issue #52: Provider Subscription Prerequisites

Completed by:

- documenting required provider setup in `docs/setup/third-party-provider-prerequisites.md`
- documenting required provider setup in `docs/setup/provider-prerequisites.json`
- separating required-now providers from conditional/later providers
- documenting cost, credential-location, entitlement, and approval guardrails

The actual external accounts and API keys still require operator action. Secret values must not be committed or pasted into issue bodies.

## Validation

Run:

```bash
bash .github/scripts/compute-next-release.test.sh
bash .github/scripts/changeset-check.test.sh
node --test .github/scripts/*.test.mjs
npm test
npm --prefix agents test
npm --prefix quant test
bash infrastructure/scripts/guard-tests.sh
bash infrastructure/scripts/validate.sh dev --lint-only
swift test --package-path ios/KairosApp
bash .githooks/pre-commit
```
