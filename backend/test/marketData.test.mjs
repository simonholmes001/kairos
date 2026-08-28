import assert from "node:assert/strict";
import test from "node:test";
import { createIngestionPipeline } from "../src/marketDataIngestion.mjs";
import { createInstrument, createMarketDataPoint, stableInstrumentId } from "../src/marketDataContracts.mjs";
import { assessFreshness, createProvenance, requireUsableProvenance } from "../src/provenance.mjs";
import { createTelemetry } from "../src/observability.mjs";
import { createAlpacaProvider } from "../src/providerAdapters.mjs";
import { createMarketDataStore } from "../src/marketDataStore.mjs";

test("instrument identity is stable and provider-independent", () => {
  const first = createInstrument({ assetClass: "equity", venue: "nasdaq", symbol: "aapl", currency: "usd", providerRefs: { alpaca: "AAPL" } });
  const second = createInstrument({ assetClass: "equity", venue: "NASDAQ", symbol: "AAPL", currency: "USD", providerRefs: { massive: "AAPL" } });
  assert.equal(first.instrumentId, second.instrumentId);
  assert.equal(first.instrumentId, stableInstrumentId({ assetClass: "equity", venue: "NASDAQ", symbol: "AAPL", currency: "USD" }));
  assert.notEqual(first.instrumentId, "AAPL");
});

test("market data requires normalized type and provenance", () => {
  const point = createMarketDataPoint({
    instrumentId: "ins_a",
    asOf: "2026-01-01T00:00:00Z",
    provider: "alpaca",
    dataType: "quote",
    value: { bid: 1, ask: 2 },
    provenance: { evidenceId: "e1" }
  });
  assert.equal(point.dataType, "quote");
  assert.throws(() => createMarketDataPoint({ instrumentId: "ins_a", asOf: "bad", provider: "x", dataType: "quote", value: 1, provenance: { evidenceId: "e1" } }), /ISO date/);
  assert.throws(() => createMarketDataPoint({ instrumentId: "ins_a", asOf: "2026-01-01T00:00:00Z", provider: "x", dataType: "quote", value: 1 }), /provenance is required/);
});

test("provenance marks delayed observations stale and rejects missing evidence", () => {
  const provenance = createProvenance({ sourceId: "fred", sourceAuthority: "primary", sourceTime: "2026-01-01T00:00:00Z", retrievedAt: "2026-01-01T00:01:00Z" });
  assert.equal(assessFreshness({ sourceTime: provenance.sourceTime, retrievedAt: provenance.retrievedAt, now: "2026-01-02T00:00:00Z", maxAgeMs: 60_000 }), "stale");
  assert.throws(() => requireUsableProvenance({ evidenceId: "e2", quality: "missing" }), /missing data/);
});

test("ingestion normalizes records and isolates provider failures", async () => {
  const logs = [];
  const store = createMarketDataStore();
  const pipeline = createIngestionPipeline({
    provider: {
      name: "test-provider",
      async fetch() { return [{ instrumentId: "ins_a", asOf: "2026-01-01T00:00:00Z", dataType: "price", value: 10 }]; }
    },
    clock: () => new Date("2026-01-01T00:01:00Z"),
    logger: (event) => logs.push(event),
    store
  });
  const result = await pipeline.ingest({ symbols: ["AAPL"] });
  assert.equal(result.length, 1);
  assert.equal(result[0].provider, "test-provider");
  assert.equal(logs[0].event, "market_data.ingestion.completed");
  assert.equal(store.size(), 1);

  const failed = createIngestionPipeline({ provider: { name: "broken", async fetch() { throw new Error("timeout"); } } });
  assert.deepEqual((await failed.ingest({})).error, { code: "INGESTION_FAILED", message: "timeout", retryable: true });
});

test("Alpaca adapter keeps credentials in headers and normalizes bars", async () => {
  let request;
  const provider = createAlpacaProvider({ apiKey: "key", secretKey: "secret", fetchImpl: async (url, options) => {
    request = { url: String(url), options };
    return { ok: true, async json() { return { bars: [{ t: "2026-01-01T00:00:00Z", o: 1, h: 2, l: 0.5, c: 1.5, v: 10 }] }; } };
  } });
  const records = await provider.fetch({ symbol: "AAPL", instrumentId: "ins_a" });
  assert.equal(records[0].dataType, "ohlcv");
  assert.equal(request.options.headers["APCA-API-KEY-ID"], "key");
  assert.equal(request.url.includes("secret"), false);
});

test("telemetry redacts credentials while retaining correlation", () => {
  const records = [];
  const telemetry = createTelemetry({ sink: (record) => records.push(record), clock: () => new Date("2026-01-01T00:00:00Z") });
  const record = telemetry.emit("provider.call", { apiKey: "secret", nested: { authorization: "Bearer secret" } });
  assert.match(record.correlationId, /^kairos-/);
  assert.equal(record.apiKey, "[REDACTED]");
  assert.equal(record.nested.authorization, "[REDACTED]");
  assert.equal(records.length, 1);
});
