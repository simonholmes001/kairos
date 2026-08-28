# KAIROS Backend

This path will hold server-side domain services for portfolio, risk, execution, provider integration, ledger, and agent orchestration boundaries.

Azure-hosted backend services are authoritative for trading state, risk state, broker credentials, provider credentials, approval state, and immutable decision records.

## Contracts

`backend/contracts/` contains the first canonical JSON schemas for domain, event, and operator authorization boundaries. They are intentionally runtime-neutral until the backend service implementation begins.

`backend/src/authPolicy.mjs` contains the first executable server-side auth/RBAC policy. It blocks unauthenticated access except health endpoints and requires stronger assurance plus audit reasons for financial and safety mutations.
