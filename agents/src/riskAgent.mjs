import { analyzePrices } from "../../quant/src/priceAnalysis.mjs";
import { createSpecialistAgent } from "./specialistAgents.mjs";

export function createRiskResearchAgent({ name = "risk-research", shortPeriod = 20, longPeriod = 50, periodsPerYear = 252, maxDrawdownLimit = 0.2 } = {}) {
  return createSpecialistAgent({
    name,
    analysisType: "risk",
    run: async ({ instrumentId, closes }) => {
      const features = analyzePrices({ closes, shortPeriod, longPeriod, periodsPerYear });
      const breached = features.maximumDrawdown > maxDrawdownLimit;
      return {
        analysisId: `${name}:${instrumentId}:${closes.length}`,
        signal: breached ? "no_trade" : "neutral",
        horizon: "medium_term",
        confidence: Math.min(1, features.maximumDrawdown / Math.max(maxDrawdownLimit, Number.EPSILON)),
        thesis: breached ? "Maximum drawdown exceeds the configured risk limit." : "Maximum drawdown is within the configured risk limit.",
        risks: [`Maximum drawdown is ${(features.maximumDrawdown * 100).toFixed(2)}%.`],
        missingData: [],
        evidenceIds: [`market:${instrumentId}:risk-window:${closes.length}`]
      };
    }
  });
}
