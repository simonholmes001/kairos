import assert from "node:assert/strict";
import test from "node:test";
import { analyzePrices, annualizedVolatility, percentageReturns, simpleMovingAverage } from "../src/priceAnalysis.mjs";

test("price analysis computes deterministic moving averages and returns", () => {
  assert.equal(simpleMovingAverage([1, 2, 3, 4], 2), 3.5);
  assert.deepEqual(percentageReturns([100, 110, 99]), [0.1, -0.1]);
  const result = analyzePrices({ closes: Array.from({ length: 55 }, (_, index) => 100 + index), shortPeriod: 5, longPeriod: 20 });
  assert.equal(result.latest, 154);
  assert.equal(result.shortSma, 152);
  assert.equal(result.longSma, 144.5);
  assert.equal(result.returnCount, 54);
});

test("price analysis rejects invalid periods and zero-price returns", () => {
  assert.throws(() => simpleMovingAverage([1, 2], 3), /period/);
  assert.throws(() => percentageReturns([1, 0, 2]), /zero price/);
  assert.throws(() => annualizedVolatility([1, 2]), /three closes/);
});
