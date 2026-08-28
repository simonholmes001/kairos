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

## Deliberate follow-up

The repository is currently Node-based. Microsoft Agent Framework is officially provided for Python and .NET, so this slice defines and tests the KAIROS orchestration contract without claiming a native Agent Framework runtime. A later issue should add the selected Python or .NET runtime adapter, backed by the official framework workflow/executor APIs, checkpoint persistence, and OpenTelemetry exporter configuration.

Production persistence, scheduled provider jobs, Azure Monitor exporters, live provider entitlements, and real model/provider SDK clients remain deployment/integration work. No broker or execution capability is introduced by this slice.
