import { createMarketDataPoint } from "./marketDataContracts.mjs";
import { assessFreshness, assertNotFuture, createProvenance, requireUsableProvenance } from "./provenance.mjs";

function failure(code, message, retryable) {
  return { records: [], error: { code, message, retryable } };
}

export function createIngestionPipeline({ provider, store, clock = () => new Date(), logger = () => {}, maxAttempts = 3, sleep = async () => {}, maxAgeMs }) {
  if (!provider || typeof provider.fetch !== "function") throw new TypeError("provider.fetch is required");
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw new TypeError("maxAttempts must be a positive integer");
  if (maxAgeMs !== undefined && (!Number.isFinite(maxAgeMs) || maxAgeMs < 0)) throw new TypeError("maxAgeMs must be non-negative");
  return Object.freeze({
    async ingest(request) {
      const startedAt = clock();
      try {
        let records;
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            records = await provider.fetch(request);
            break;
          } catch (error) {
            lastError = error;
            if (attempt < maxAttempts) await sleep(attempt);
          }
        }
        if (lastError && records === undefined) {
          logger({ event: "market_data.ingestion.failed", provider: provider.name, error: lastError.message, startedAt: startedAt.toISOString() });
          return failure("PROVIDER_UNAVAILABLE", lastError.message, true);
        }
        if (!Array.isArray(records)) {
          const error = new TypeError("provider must return an array");
          logger({ event: "market_data.ingestion.failed", provider: provider.name, error: error.message, startedAt: startedAt.toISOString() });
          return failure("PROVIDER_CONTRACT_INVALID", error.message, false);
        }
        let normalized;
        try {
          normalized = records.map((record) => {
          let provenance = createProvenance({
            ...record.provenance,
            sourceId: record.provenance?.sourceId ?? provider.name,
            sourceAuthority: record.provenance?.sourceAuthority ?? "provider",
            retrievedAt: record.provenance?.retrievedAt ?? startedAt,
            entitlement: record.provenance?.entitlement ?? { provider: provider.name, tier: "unknown" }
          });
          assertNotFuture({ sourceTime: provenance.sourceTime, retrievedAt: provenance.retrievedAt, now: clock() });
          if (maxAgeMs !== undefined && assessFreshness({ sourceTime: provenance.sourceTime, retrievedAt: provenance.retrievedAt, now: clock(), maxAgeMs }) === "stale") {
            provenance = createProvenance({ ...provenance, quality: "stale", qualityFlags: [...provenance.qualityFlags, "stale"] });
          }
          requireUsableProvenance(provenance);
          return createMarketDataPoint({ ...record, provider: provider.name, ingestedAt: clock(), provenance });
          });
        } catch (error) {
          logger({ event: "market_data.ingestion.failed", provider: provider.name, error: error.message, startedAt: startedAt.toISOString() });
          const code = error.message.includes("provenance") || error.message.includes("evidence") || error.message.includes("future")
            ? "PROVENANCE_UNUSABLE"
            : "PROVIDER_CONTRACT_INVALID";
          return failure(code, error.message, false);
        }
        if (store) {
          try {
            await store.put(normalized);
          } catch (error) {
            logger({ event: "market_data.ingestion.failed", provider: provider.name, error: error.message, startedAt: startedAt.toISOString() });
            return failure("STORE_FAILED", error.message, false);
          }
        }
        logger({ event: "market_data.ingestion.completed", provider: provider.name, count: normalized.length, startedAt: startedAt.toISOString() });
        return normalized;
      } catch (error) {
        logger({ event: "market_data.ingestion.failed", provider: provider.name, error: error.message, startedAt: startedAt.toISOString() });
        return failure("INGESTION_FAILED", error.message, true);
      }
    }
  });
}
