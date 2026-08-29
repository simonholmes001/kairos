import { analyzePrices } from "../../quant/src/priceAnalysis.mjs";
import { createSpecialistAgent } from "./specialistAgents.mjs";

export function createTechnicalResearchAgent({ name = "technical-research", shortPeriod = 20, longPeriod = 50, periodsPerYear = 252 } = {}) {
  return createSpecialistAgent({
    name,
    analysisType: "technical",
    run: async ({ instrumentId, closes }) => {
      if (!Array.isArray(closes) || closes.length < longPeriod || closes.some((close) => !Number.isFinite(close))) {
        return {
          analysisId: `${name}:${instrumentId}:insufficient-price-data`,
          signal: "no_trade",
          horizon: "short_term",
          confidence: 0,
          thesis: "Technical analysis is unavailable because the required price history is missing or incomplete.",
          risks: [],
          missingData: ["price history", `at least ${longPeriod} closes`],
          evidenceIds: []
        };
      }
      const features = analyzePrices({ closes, shortPeriod, longPeriod, periodsPerYear });
      const signal = features.latest > features.shortSma && features.shortSma > features.longSma
        ? "bullish"
        : features.latest < features.shortSma && features.shortSma < features.longSma ? "bearish" : "neutral";
      return {
        analysisId: `${name}:${instrumentId}:${closes.length}`,
        signal,
        horizon: "short_term",
        confidence: Math.min(1, Math.abs(features.shortSma - features.longSma) / features.latest * 10),
        thesis: `Price is ${signal} relative to the ${shortPeriod}- and ${longPeriod}-period moving averages.`,
        risks: [`Annualized volatility is ${(features.annualizedVolatility * 100).toFixed(2)}%.`],
        evidenceIds: [`market:${instrumentId}:close-window:${closes.length}`],
        missingData: []
      };
    }
  });
}
