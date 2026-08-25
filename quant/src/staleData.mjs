export function isObservationStale({ observedAt, now, maxAgeMs }) {
  if (!(observedAt instanceof Date) || Number.isNaN(observedAt.valueOf())) {
    throw new TypeError("observedAt must be a valid Date");
  }

  if (!(now instanceof Date) || Number.isNaN(now.valueOf())) {
    throw new TypeError("now must be a valid Date");
  }

  if (!Number.isFinite(maxAgeMs) || maxAgeMs < 0) {
    throw new TypeError("maxAgeMs must be a non-negative finite number");
  }

  return now.getTime() - observedAt.getTime() > maxAgeMs;
}
