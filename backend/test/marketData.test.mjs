import assert from "node:assert/strict";
import test from "node:test";
import { createIngestionPipeline } from "../src/marketDataIngestion.mjs";
import { createInstrument, createMarketDataPoint, stableInstrumentId } from "../src/marketDataContracts.mjs";
import { assessFreshness, createProvenance, requireUsableProvenance } from "../src/provenance.mjs";
import { createTelemetry } from "../src/observability.mjs";
import { createAlpacaProvider, createCoinGeckoProvider, createMassiveProvider } from "../src/providerAdapters.mjs";
import { createJsonFileMarketDataStore, createMarketDataStore } from "../src/marketDataStore.mjs";
import { createIngestionScheduler } from "../src/marketDataScheduler.mjs";

const completeProvenance = { evidenceId: "e1", sourceId: "test", sourceAuthority: "provider", retrievedAt: "2026-01-01T00:00:00Z", quality: "current", qualityFlags: [], entitlement: { provider: "test", tier: "unknown", cacheAllowed: false, redistributionAllowed: false } };

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
    provenance: completeProvenance
  });
  assert.equal(point.dataType, "quote");
  assert.equal(createMarketDataPoint({
    instrumentId: "ins_a",
    asOf: "2026-01-01T00:00:00Z",
    provider: "alpaca",
    dataType: "fundamental",
    value: { peRatio: 10 },
    provenance: completeProvenance
  }).dataType, "fundamental");
  assert.throws(() => createMarketDataPoint({ instrumentId: "ins_a", asOf: "bad", provider: "x", dataType: "quote", value: 1, provenance: completeProvenance }), /ISO date/);
  assert.throws(() => createMarketDataPoint({ instrumentId: "ins_a", asOf: "2026-01-01T00:00:00Z", provider: "x", dataType: "quote", value: 1 }), /provenance is required/);
});

test("provenance marks delayed observations stale and rejects missing evidence", () => {
  const provenance = createProvenance({ sourceId: "fred", sourceAuthority: "primary", sourceTime: "2026-01-01T00:00:00Z", retrievedAt: "2026-01-01T00:01:00Z" });
  assert.equal(assessFreshness({ sourceTime: provenance.sourceTime, retrievedAt: provenance.retrievedAt, now: "2026-01-02T00:00:00Z", maxAgeMs: 60_000 }), "stale");
  assert.throws(() => createProvenance({ sourceId: "fred", sourceAuthority: "primary", quality: "invalid" }), /Unsupported quality/);
  assert.throws(() => createProvenance({ sourceId: "fred", sourceAuthority: "primary", qualityFlags: ["invalid"] }), /Unsupported quality flag/);
  assert.throws(() => requireUsableProvenance({ evidenceId: "e2", quality: "missing" }), /missing data/);
  assert.throws(() => assessFreshness({ retrievedAt: "2026-01-02T00:00:00Z", now: "2026-01-01T00:00:00Z", maxAgeMs: 60_000 }), /future/);
});

test("ingestion rejects future observations and classifies invalid records as non-retryable", async () => {
  const future = await createIngestionPipeline({
    provider: { name: "future", async fetch() { return [{ instrumentId: "ins_a", asOf: "2026-01-01T00:00:00Z", dataType: "price", value: 10, provenance: { sourceTime: "2026-01-02T00:00:00Z" } }]; } },
    clock: () => new Date("2026-01-01T00:00:00Z")
  }).ingest({});
  assert.deepEqual(future.error, { code: "PROVENANCE_UNUSABLE", message: "observation timestamp cannot be in the future", retryable: false });

  const invalid = await createIngestionPipeline({
    provider: { name: "invalid", async fetch() { return [{ instrumentId: "ins_a", asOf: "2026-01-01T00:00:00Z", dataType: "unsupported", value: 10, provenance: { sourceId: "invalid", sourceAuthority: "provider" } }]; } }
  }).ingest({});
  assert.equal(invalid.error.code, "PROVIDER_CONTRACT_INVALID");
  assert.equal(invalid.error.retryable, false);
});

test("ingestion persists stale quality when observations exceed the configured age", async () => {
  const result = await createIngestionPipeline({
    provider: { name: "delayed", async fetch() { return [{ instrumentId: "ins_a", asOf: "2026-01-01T00:00:00Z", dataType: "price", value: 10, provenance: { evidenceId: "e1", sourceTime: "2026-01-01T00:00:00Z" } }]; } },
    clock: () => new Date("2026-01-01T01:00:00Z"),
    maxAgeMs: 60_000
  }).ingest({});
  assert.equal(result[0].provenance.quality, "stale");
  assert.equal(result[0].provenance.qualityFlags.includes("stale"), true);
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
  assert.deepEqual((await failed.ingest({})).error, { code: "PROVIDER_UNAVAILABLE", message: "timeout", retryable: true });
});

test("ingestion retries transient provider failures and scheduler runs all requests", async () => {
  let attempts = 0;
  const pipeline = createIngestionPipeline({
    provider: { name: "retrying", async fetch() { attempts += 1; if (attempts < 2) throw new Error("temporary"); return []; } },
    maxAttempts: 2,
    sleep: async () => {}
  });
  assert.deepEqual(await pipeline.ingest({}), []);
  assert.equal(attempts, 2);

  const completed = [];
  const scheduled = [];
  let intervalCallback;
  const scheduler = createIngestionScheduler({
    pipeline: { async ingest(request) { scheduled.push(request); return request; } },
    requests: [{ symbol: "AAPL" }, { symbol: "BTC" }],
    intervalMs: 1000,
    logger: (event) => completed.push(event),
    setIntervalImpl: (callback) => { intervalCallback = callback; return "timer"; },
    clearIntervalImpl: () => {}
  });
  const { runOnce, start, stop } = scheduler;
  await runOnce();
  start();
  await intervalCallback();
  stop();
  assert.deepEqual(scheduled, [{ symbol: "AAPL" }, { symbol: "BTC" }, { symbol: "AAPL" }, { symbol: "BTC" }]);
  assert.equal(completed.length >= 1, true);
});

test("scheduled ingestion logs rejected interval runs", async () => {
  const events = [];
  let intervalCallback;
  const scheduler = createIngestionScheduler({
    pipeline: { async ingest() { throw new Error("provider unavailable"); } },
    requests: [{}],
    intervalMs: 1000,
    logger: (event) => events.push(event),
    setIntervalImpl: (callback) => { intervalCallback = callback; return "timer"; },
    clearIntervalImpl: () => {}
  });
  scheduler.start();
  intervalCallback();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(events[0].event, "market_data.schedule.failed");
  scheduler.stop();
});

test("JSON market-data store survives reload", async () => {
  const path = "/tmp/kairos-market-data-test.json";
  const point = createMarketDataPoint({ instrumentId: "ins_a", asOf: "2026-01-01T00:00:00Z", provider: "test", dataType: "price", value: 10, provenance: completeProvenance });
  const first = createJsonFileMarketDataStore({ path });
  await first.put([point]);
  const second = createJsonFileMarketDataStore({ path });
  assert.equal(await second.size(), 1);
  assert.equal((await second.query({ instrumentId: "ins_a" }))[0].value, 10);
});

test("JSON market-data store serializes concurrent writes", async () => {
  const path = "/tmp/kairos-market-data-concurrent-test.json";
  const store = createJsonFileMarketDataStore({ path });
  const points = [1, 2].map((value) => createMarketDataPoint({ instrumentId: `ins_${value}`, asOf: "2026-01-01T00:00:00Z", provider: "test", dataType: "price", value, provenance: { ...completeProvenance, evidenceId: `e${value}` } }));
  await Promise.all(points.map((point) => store.put([point])));
  assert.equal(await store.size(), 2);
  assert.equal(JSON.parse(await (await import("node:fs/promises")).readFile(path, "utf8")).length, 2);
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

test("provider telemetry carries correlation without credential-bearing request data", async () => {
  const events = [];
  const provider = createAlpacaProvider({
    apiKey: "key",
    secretKey: "secret",
    telemetry: { emit: (event, fields) => events.push({ event, fields }) },
    fetchImpl: async () => ({ ok: true, async json() { return { bars: [] }; } })
  });
  await provider.fetch({ symbol: "AAPL", instrumentId: "ins_a", correlationId: "c-1" });
  assert.deepEqual(events.map(({ event }) => event), ["provider.request.started", "provider.request.completed"]);
  assert.equal(events[0].fields.correlationId, "c-1");
  assert.equal(JSON.stringify(events).includes("secret"), false);
});

test("CoinGecko adapter uses the API header and normalizes prices", async () => {
  let request;
  const provider = createCoinGeckoProvider({ apiKey: "demo", fetchImpl: async (url, options) => {
    request = { url: String(url), options };
    return { ok: true, async json() { return { bitcoin: { usd: 42_000 } }; } };
  } });
  const records = await provider.fetch({ ids: ["bitcoin"], currency: "usd", observedAt: "2026-01-01T00:00:00Z" });
  assert.equal(records[0].value, 42_000);
  assert.equal(records[0].instrumentId.startsWith("ins_"), true);
  assert.equal(request.options.headers["x-cg-demo-api-key"], "demo");
  assert.match(request.url, /ids=bitcoin/);
});

test("Massive adapter uses bearer authentication and normalizes aggregate bars", async () => {
  let request;
  const provider = createMassiveProvider({ apiKey: "massive-key", fetchImpl: async (url, options) => {
    request = { url: String(url), options };
    return { ok: true, async json() { return { results: [{ t: 1767225600000, o: 1, h: 2, l: 0.5, c: 1.5, v: 10 }] }; } };
  } });
  const records = await provider.fetch({ symbol: "AAPL", instrumentId: "ins_a", from: "2026-01-01", to: "2026-01-02" });
  assert.equal(records[0].dataType, "ohlcv");
  assert.equal(request.options.headers.authorization, "Bearer massive-key");
  assert.equal(request.url.includes("massive-key"), false);
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
