import { createMarketDataPoint } from "./marketDataContracts.mjs";
import { createProvenance, requireUsableProvenance } from "./provenance.mjs";

export function createIngestionPipeline({ provider, store, clock = () => new Date(), logger = () => {}, maxAttempts = 3, sleep = async () => {} }) {
  if (!provider || typeof provider.fetch !== "function") throw new TypeError("provider.fetch is required");
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw new TypeError("maxAttempts must be a positive integer");
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
        if (lastError && records === undefined) throw lastError;
        if (!Array.isArray(records)) throw new TypeError("provider must return an array");
        const normalized = records.map((record) => {
          const provenance = createProvenance({
            ...record.provenance,
            sourceId: record.provenance?.sourceId ?? provider.name,
            sourceAuthority: record.provenance?.sourceAuthority ?? "provider",
            retrievedAt: record.provenance?.retrievedAt ?? startedAt,
            entitlement: record.provenance?.entitlement ?? { provider: provider.name, tier: "unknown" }
          });
          requireUsableProvenance(provenance);
          return createMarketDataPoint({ ...record, provider: provider.name, ingestedAt: clock(), provenance });
        });
        if (store) store.put(normalized);
        logger({ event: "market_data.ingestion.completed", provider: provider.name, count: normalized.length, startedAt: startedAt.toISOString() });
        return normalized;
      } catch (error) {
        logger({ event: "market_data.ingestion.failed", provider: provider.name, error: error.message, startedAt: startedAt.toISOString() });
        return { records: [], error: { code: "INGESTION_FAILED", message: error.message, retryable: true } };
      }
    }
  });
}
