import { createSpecialistAgent } from "./specialistAgents.mjs";

export function createFundamentalResearchAgent({ name = "fundamental-research" } = {}) {
  return createSpecialistAgent({
    name,
    analysisType: "fundamental",
    run: async ({ instrumentId, fundamentals = {} }) => {
      const { earningsGrowth, revenueGrowth, debtToEquity, valuation } = fundamentals;
      const numeric = [earningsGrowth, revenueGrowth, debtToEquity, valuation].every(Number.isFinite);
      const signal = !numeric ? "no_trade" : earningsGrowth > 0 && revenueGrowth > 0 && debtToEquity < 2 && valuation !== "expensive" ? "bullish" : "neutral";
      return {
        analysisId: `${name}:${instrumentId}`,
        signal,
        horizon: "medium_term",
        confidence: numeric ? (signal === "bullish" ? 0.65 : 0.35) : 0,
        thesis: numeric ? "Fundamental factors were evaluated against the configured growth, leverage, and valuation rules." : "Fundamental data is incomplete; no trade conclusion is permitted.",
        risks: numeric ? [`Debt-to-equity is ${debtToEquity}.`] : [],
        missingData: numeric ? [] : ["earningsGrowth", "revenueGrowth", "debtToEquity", "valuation"],
        evidenceIds: [`fundamentals:${instrumentId}`]
      };
    }
  });
}
