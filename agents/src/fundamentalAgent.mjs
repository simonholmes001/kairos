import { createSpecialistAgent } from "./specialistAgents.mjs";

export function createFundamentalResearchAgent({ name = "fundamental-research" } = {}) {
  const supportedValuations = new Set(["cheap", "fair", "expensive"]);
  return createSpecialistAgent({
    name,
    analysisType: "fundamental",
    run: async ({ instrumentId, fundamentals = {} }) => {
      const { earningsGrowth, revenueGrowth, debtToEquity, valuation } = fundamentals;
      const missingData = [];
      if (!Number.isFinite(earningsGrowth)) missingData.push("earningsGrowth");
      if (!Number.isFinite(revenueGrowth)) missingData.push("revenueGrowth");
      if (!Number.isFinite(debtToEquity)) missingData.push("debtToEquity");
      const normalizedValuation = typeof valuation === "string" ? valuation.trim() : undefined;
      const valuationMissing = valuation === undefined || valuation === null;
      const valuationRecognized = normalizedValuation !== undefined && supportedValuations.has(normalizedValuation);
      const valuationInvalid = !valuationMissing && !valuationRecognized;
      if (valuationMissing) missingData.push("valuation");
      const complete = missingData.length === 0 && valuationRecognized;
      const signal = !complete ? "no_trade" : earningsGrowth > 0 && revenueGrowth > 0 && debtToEquity < 2 && normalizedValuation !== "expensive" ? "bullish" : "neutral";
      const thesis = !complete && valuationInvalid
        ? "Fundamental data contains an unrecognized valuation classification; no trade conclusion is permitted."
        : complete
          ? "Fundamental factors were evaluated against the configured growth, leverage, and valuation rules."
          : "Fundamental data is incomplete; no trade conclusion is permitted.";
      return {
        analysisId: `${name}:${instrumentId}`,
        signal,
        horizon: "medium_term",
        confidence: complete ? (signal === "bullish" ? 0.65 : 0.35) : 0,
        thesis,
        risks: complete ? [`Debt-to-equity is ${debtToEquity}.`] : [],
        missingData,
        evidenceIds: complete ? [`fundamentals:${instrumentId}`] : []
      };
    }
  });
}
