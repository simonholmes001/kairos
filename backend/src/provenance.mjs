export const sourceAuthorities = Object.freeze(["primary", "provider", "derived", "operator", "simulation"]);
export const qualityFlags = Object.freeze(["current", "delayed", "stale", "estimated", "alternative", "unverified", "missing"]);

function nonEmpty(value, name) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${name} must be non-empty`);
  return value.trim();
}

export function createProvenance(input) {
  const sourceAuthority = nonEmpty(input.sourceAuthority, "sourceAuthority");
  if (!sourceAuthorities.includes(sourceAuthority)) throw new RangeError(`Unsupported source authority: ${sourceAuthority}`);
  const retrievedAt = new Date(input.retrievedAt ?? new Date());
  if (Number.isNaN(retrievedAt.valueOf())) throw new TypeError("retrievedAt must be a valid date");
  const entitlement = input.entitlement ?? {};
  return Object.freeze({
    evidenceId: nonEmpty(input.evidenceId ?? `${nonEmpty(input.sourceId, "sourceId")}:${retrievedAt.toISOString()}`, "evidenceId"),
    sourceId: nonEmpty(input.sourceId, "sourceId"),
    sourceAuthority,
    retrievedAt: retrievedAt.toISOString(),
    sourceTime: input.sourceTime ? new Date(input.sourceTime).toISOString() : undefined,
    sourceUrl: input.sourceUrl,
    quality: input.quality ?? "current",
    qualityFlags: Object.freeze([...(input.qualityFlags ?? [])]),
    entitlement: Object.freeze({
      provider: nonEmpty(entitlement.provider ?? input.sourceId, "entitlement.provider"),
      tier: nonEmpty(entitlement.tier ?? "unknown", "entitlement.tier"),
      cacheAllowed: entitlement.cacheAllowed === true,
      redistributionAllowed: entitlement.redistributionAllowed === true
    })
  });
}

export function assessFreshness({ sourceTime, retrievedAt, now = new Date(), maxAgeMs }) {
  const observed = new Date(sourceTime ?? retrievedAt);
  const current = new Date(now);
  if (Number.isNaN(observed.valueOf()) || Number.isNaN(current.valueOf())) throw new TypeError("timestamps must be valid dates");
  if (!Number.isFinite(maxAgeMs) || maxAgeMs < 0) throw new TypeError("maxAgeMs must be non-negative");
  return current.getTime() - observed.getTime() > maxAgeMs ? "stale" : "current";
}

export function requireUsableProvenance(provenance) {
  if (!provenance || typeof provenance !== "object") throw new TypeError("provenance is required");
  if (!provenance.evidenceId) throw new TypeError("provenance.evidenceId is required");
  if (provenance.quality === "missing" || provenance.qualityFlags?.includes("missing")) {
    throw new Error("missing data cannot be treated as usable evidence");
  }
  return provenance;
}
