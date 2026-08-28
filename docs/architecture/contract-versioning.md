# Contract Versioning

KAIROS contracts use explicit major schema versions.

## Rules

- Domain events carry `schemaVersion` as `v1`, `v2`, and so on.
- Commands carry `idempotencyKey`, `correlationId`, and optional `causationId`.
- Financially significant commands and transitions must be idempotent.
- Additive optional fields may stay within the same major version.
- Removing fields, changing enum meanings, changing required fields, or changing financial semantics requires a new major version and an ADR.
- Runtime services must accept the current major version and explicitly reject unknown major versions.

## Required IDs

- `correlationId` groups a workflow from PERCEIVE through LEARN.
- `causationId` points to the command/event/decision that caused the new event.
- `idempotencyKey` prevents duplicate financial or safety mutations.

