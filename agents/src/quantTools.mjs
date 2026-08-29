import { analyzePrices } from "../../quant/src/priceAnalysis.mjs";

export function createQuantHandlers() {
  return Object.freeze({
    "quant.compute": async (input = {}) => {
      if (input.operation !== "price_analysis") throw new RangeError("unsupported quant operation");
      return analyzePrices({
        closes: input.closes,
        shortPeriod: input.shortPeriod,
        longPeriod: input.longPeriod,
        periodsPerYear: input.periodsPerYear
      });
    }
  });
}
