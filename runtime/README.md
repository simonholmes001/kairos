# KAIROS Runtime

This package composes the provider adapters, ingestion pipelines, shared market-data store, telemetry, and research orchestrator. It is the application boundary for a scheduled private Azure dev job.

Provider credentials are read only from environment variables and are never passed into agent context:

- `ALPACA_PAPER_API_KEY` and `ALPACA_PAPER_SECRET_KEY`
- `MASSIVE_API_KEY`
- `COINGECKO_API_KEY`

The runtime does not expose broker execution. A production host must invoke `ingest()` and `research()` from a private job trigger and provide a managed durable store.
