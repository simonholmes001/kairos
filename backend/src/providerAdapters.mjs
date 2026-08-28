import { createInstrument } from "./marketDataContracts.mjs";

function required(value, name) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${name} is required`);
  return value.trim();
}

function query(params) {
  return new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null));
}

export function createJsonHttpProvider({ name, baseUrl, fetchImpl = fetch, headers = {}, buildRequest, normalize }) {
  required(name, "provider name");
  const root = new URL(required(baseUrl, "baseUrl"));
  return Object.freeze({
    name,
    async fetch(request) {
      const { path, searchParams } = buildRequest(request);
      const url = new URL(path, root);
      url.search = query(searchParams ?? {}).toString();
      const response = await fetchImpl(url, { headers: { accept: "application/json", ...headers } });
      if (!response.ok) throw new Error(`${name} returned HTTP ${response.status}`);
      return normalize(await response.json(), request);
    }
  });
}

export function createAlpacaProvider({ apiKey, secretKey, fetchImpl, baseUrl = "https://data.alpaca.markets" }) {
  required(apiKey, "Alpaca API key");
  required(secretKey, "Alpaca secret key");
  return createJsonHttpProvider({
    name: "alpaca",
    baseUrl,
    fetchImpl,
    headers: { "APCA-API-KEY-ID": apiKey, "APCA-API-SECRET-KEY": secretKey },
    buildRequest: ({ symbol, start, end, limit = 1000 }) => ({
      path: `/v2/stocks/${encodeURIComponent(required(symbol, "symbol"))}/bars`,
      searchParams: { timeframe: "1Day", start, end, limit, feed: "iex", adjustment: "raw" }
    }),
    normalize: (payload, request) => (payload.bars ?? []).map((bar) => ({
      instrumentId: request.instrumentId,
      asOf: bar.t,
      dataType: "ohlcv",
      value: { open: bar.o, high: bar.h, low: bar.l, close: bar.c, volume: bar.v },
      provenance: { sourceId: "alpaca", sourceAuthority: "provider", sourceTime: bar.t }
    }))
  });
}

export function createCoinGeckoProvider({ apiKey, fetchImpl, baseUrl = "https://api.coingecko.com" }) {
  required(apiKey, "CoinGecko API key");
  return createJsonHttpProvider({
    name: "coingecko",
    baseUrl,
    fetchImpl,
    headers: { "x-cg-demo-api-key": apiKey },
    buildRequest: ({ ids, currency = "usd" }) => ({
      path: "/api/v3/simple/price",
      searchParams: { ids: required(ids?.join(","), "ids"), vs_currencies: currency }
    }),
    normalize: (payload, request) => Object.entries(payload).map(([id, value]) => ({
      instrumentId: request.instrumentIds?.[id] ?? createInstrument({ assetClass: "crypto", venue: "COINGECKO", symbol: id, currency: currencyCode(request.currency) }).instrumentId,
      asOf: request.observedAt ?? new Date().toISOString(),
      dataType: "price",
      value: value[request.currency ?? "usd"],
      provenance: { sourceId: "coingecko", sourceAuthority: "provider", sourceTime: request.observedAt }
    }))
  });
}

function currencyCode(currency = "usd") {
  return currency.toUpperCase().slice(0, 3);
}
