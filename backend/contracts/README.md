# Backend Contracts

These JSON schemas define the first stable backend boundary for KAIROS.

The contracts are intentionally language-neutral until the backend runtime is selected. They define the domain vocabulary needed before implementing provider ingestion, risk, execution, agent orchestration, iOS APIs, and immutable audit records.

## Rules

- Agents produce `ProposedTrade` and `DecisionRecord` data; they do not produce executable orders.
- Risk decisions are deterministic and must reference a policy version.
- Orders require idempotency keys and cannot bypass risk and approval boundaries.
- Ledger entries are append-oriented financial events.
- Operator permissions are explicit and separate read actions from financial/safety mutations.
- Breaking changes require a major schema version update and an ADR.
