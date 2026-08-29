# Research Foundation Implementation

This slice implements the reusable boundaries for issues #15, #17, #16, #34, #18, #20, #24, #19, and #21.

## Implemented

- Provider-independent instrument IDs and normalized market-data point contracts.
- Provenance with evidence IDs, source authority, timestamps, entitlement metadata, and quality flags.
- Ingestion pipeline with Alpaca equities bars and CoinGecko crypto prices, normalization, deduplication, and failure isolation.
- In-memory market-data store for deterministic tests and local development.
- Correlation IDs and recursive redaction of credential-shaped telemetry fields.
- Deny-by-default agent tool gateway. Broker writes, arbitrary HTTP, raw provider access, and secret access are outside the boundary.
- Structured agent analysis validation with bounded signal/horizon values, confidence, risks, missing data, and evidence IDs.
- Provider-neutral model router with assignment, latency, cost metadata, and controlled failure results.
- Research-only concurrent specialist orchestration with per-agent failure capture and no execution method.

## Runtime status

The repository remains Node-based for domain and provider boundaries, with a native Python Microsoft Agent Framework adapter under `agents/maf`. It uses the documented concurrent workflow builder, optional file checkpoint storage, and the repository-standard `OPENAI_API_KEY`.

The implementation remains research-only. No broker or execution capability is introduced. Production deployment still requires wiring the scheduler to the selected private Azure job runtime, replacing local JSON/file stores with private managed storage, configuring Azure Monitor/OpenTelemetry exporters, and validating provider entitlements and quotas in the dev environment.
