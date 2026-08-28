import { createHash } from "node:crypto";
import { requireUsableProvenance } from "./provenance.mjs";

export const assetClasses = Object.freeze(["equity", "crypto", "cash", "fund", "index", "fx"]);
export const marketDataTypes = Object.freeze(["price", "ohlcv", "quote", "trade", "order_book", "market_status"]);

function requiredString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value.trim();
}

function isoDate(value, name) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new TypeError(`${name} must be an ISO date-time`);
  return date.toISOString();
}

export function stableInstrumentId({ assetClass, venue, symbol, currency }) {
  const canonical = [assetClass, venue, symbol, currency].map((value) => requiredString(value, "instrument identity").toLowerCase()).join(":");
  return `ins_${createHash("sha256").update(canonical).digest("hex").slice(0, 24)}`;
}

export function createInstrument(input) {
  const assetClass = requiredString(input.assetClass, "assetClass").toLowerCase();
  if (!assetClasses.includes(assetClass)) throw new RangeError(`Unsupported asset class: ${assetClass}`);
  const venue = requiredString(input.venue, "venue").toUpperCase();
  const symbol = requiredString(input.symbol, "symbol").toUpperCase();
  const currency = requiredString(input.currency, "currency").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new RangeError("currency must be an ISO 4217 code");
  const instrumentId = input.instrumentId ?? stableInstrumentId({ assetClass, venue, symbol, currency });
  if (input.instrumentId !== undefined) requiredString(input.instrumentId, "instrumentId");
  return Object.freeze({
    instrumentId,
    symbol,
    name: input.name?.trim(),
    assetClass,
    venue,
    currency,
    status: input.status ?? "active",
    providerRefs: Object.freeze({ ...(input.providerRefs ?? {}) })
  });
}

export function createMarketDataPoint(input) {
  const dataType = requiredString(input.dataType, "dataType").toLowerCase();
  if (!marketDataTypes.includes(dataType)) throw new RangeError(`Unsupported market data type: ${dataType}`);
  const value = input.value;
  if (value === undefined || value === null) throw new TypeError("value is required");
  requireUsableProvenance(input.provenance);
  return Object.freeze({
    instrumentId: requiredString(input.instrumentId, "instrumentId"),
    asOf: isoDate(input.asOf, "asOf"),
    ingestedAt: isoDate(input.ingestedAt ?? new Date(), "ingestedAt"),
    provider: requiredString(input.provider, "provider"),
    dataType,
    value,
    provenance: input.provenance
  });
}

export function providerPort(name, implementation) {
  requiredString(name, "provider");
  if (!implementation || typeof implementation.fetch !== "function") {
    throw new TypeError("provider implementation must expose fetch(request)");
  }
  return Object.freeze({ name, fetch: implementation.fetch.bind(implementation) });
}
