import assert from "node:assert/strict";
import test from "node:test";
import { isObservationStale } from "../src/staleData.mjs";

test("detects stale observations deterministically", () => {
  assert.equal(
    isObservationStale({
      observedAt: new Date("2026-08-24T10:00:00Z"),
      now: new Date("2026-08-24T10:05:01Z"),
      maxAgeMs: 5 * 60 * 1000
    }),
    true
  );

  assert.equal(
    isObservationStale({
      observedAt: new Date("2026-08-24T10:00:00Z"),
      now: new Date("2026-08-24T10:04:59Z"),
      maxAgeMs: 5 * 60 * 1000
    }),
    false
  );
});
