export const sourceAuthorities = Object.freeze(["primary", "provider", "derived", "operator", "simulation"]);
export const qualityFlags = Object.freeze(["current", "delayed", "stale", "estimated", "alternative", "unverified", "missing"]);
const qualityValues = new Set(qualityFlags);

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
  const quality = nonEmpty(input.quality ?? "current", "quality");
  if (!qualityValues.has(quality)) throw new RangeError(`Unsupported quality: ${quality}`);
  const inputQualityFlags = input.qualityFlags ?? [];
  if (!Array.isArray(inputQualityFlags)) throw new TypeError("qualityFlags must be an array");
  const normalizedQualityFlags = Object.freeze(inputQualityFlags.map((flag) => {
    const qualityFlag = nonEmpty(flag, "qualityFlags item");
    if (!qualityValues.has(qualityFlag)) throw new RangeError(`Unsupported quality flag: ${qualityFlag}`);
    return qualityFlag;
  }));
  return Object.freeze({
    evidenceId: nonEmpty(input.evidenceId ?? `${nonEmpty(input.sourceId, "sourceId")}:${retrievedAt.toISOString()}`, "evidenceId"),
    sourceId: nonEmpty(input.sourceId, "sourceId"),
    sourceAuthority,
    retrievedAt: retrievedAt.toISOString(),
    sourceTime: input.sourceTime ? new Date(input.sourceTime).toISOString() : undefined,
    sourceUrl: input.sourceUrl,
    quality,
    qualityFlags: normalizedQualityFlags,
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
  if (observed.getTime() > current.getTime()) throw new RangeError("observation timestamp cannot be in the future");
  if (!Number.isFinite(maxAgeMs) || maxAgeMs < 0) throw new TypeError("maxAgeMs must be non-negative");
  return current.getTime() - observed.getTime() > maxAgeMs ? "stale" : "current";
}

export function assertNotFuture({ sourceTime, retrievedAt, now = new Date() }) {
  const observed = new Date(sourceTime ?? retrievedAt);
  const current = new Date(now);
  if (Number.isNaN(observed.valueOf()) || Number.isNaN(current.valueOf())) throw new TypeError("timestamps must be valid dates");
  if (observed.getTime() > current.getTime()) throw new RangeError("observation timestamp cannot be in the future");
}

export function requireUsableProvenance(provenance) {
  if (!provenance || typeof provenance !== "object") throw new TypeError("provenance is required");
  if (!provenance.evidenceId) throw new TypeError("provenance.evidenceId is required");
  if (provenance.quality === "missing" || provenance.qualityFlags?.includes("missing")) {
    throw new Error("missing data cannot be treated as usable evidence");
  }
  return provenance;
}
