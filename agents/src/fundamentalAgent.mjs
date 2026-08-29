import { createSpecialistAgent } from "./specialistAgents.mjs";

export function createFundamentalResearchAgent({ name = "fundamental-research" } = {}) {
  const supportedValuations = new Set(["cheap", "fair", "expensive"]);
  return createSpecialistAgent({
    name,
    analysisType: "fundamental",
    run: async ({ instrumentId, fundamentals = {} }) => {
      const { earningsGrowth, revenueGrowth, debtToEquity, valuation } = fundamentals;
      const hasMetrics = [earningsGrowth, revenueGrowth, debtToEquity].every(Number.isFinite);
      const hasValuation = typeof valuation === "string" && supportedValuations.has(valuation.trim());
      const complete = hasMetrics && hasValuation;
      const signal = !complete ? "no_trade" : earningsGrowth > 0 && revenueGrowth > 0 && debtToEquity < 2 && valuation.trim() !== "expensive" ? "bullish" : "neutral";
      return {
        analysisId: `${name}:${instrumentId}`,
        signal,
        horizon: "medium_term",
        confidence: complete ? (signal === "bullish" ? 0.65 : 0.35) : 0,
        thesis: complete ? "Fundamental factors were evaluated against the configured growth, leverage, and valuation rules." : "Fundamental data is incomplete; no trade conclusion is permitted.",
        risks: complete ? [`Debt-to-equity is ${debtToEquity}.`] : [],
        missingData: complete ? [] : ["earningsGrowth", "revenueGrowth", "debtToEquity", "valuation"],
        evidenceIds: complete ? [`fundamentals:${instrumentId}`] : []
      };
    }
  });
}
