import { createSpecialistAgent } from "./specialistAgents.mjs";

export function createMacroResearchAgent({ name = "macro-research" } = {}) {
  return createSpecialistAgent({
    name,
    analysisType: "macro",
    run: async ({ instrumentId, macro = {} }) => {
      const { inflation, unemployment, policyRate, gdpGrowth } = macro;
      const numeric = [inflation, unemployment, policyRate, gdpGrowth].every(Number.isFinite);
      const supportive = numeric && gdpGrowth > 0 && inflation < 4 && unemployment < 8;
      const adverse = numeric && (gdpGrowth < 0 || inflation >= 6 || unemployment >= 10);
      const signal = !numeric ? "no_trade" : supportive ? "bullish" : adverse ? "bearish" : "neutral";
      return {
        analysisId: `${name}:${instrumentId}`,
        signal,
        horizon: "long_term",
        confidence: numeric ? (signal === "neutral" ? 0.35 : 0.6) : 0,
        thesis: numeric ? "Macro growth, inflation, and labor indicators were evaluated against configured thresholds." : "Macro indicators are incomplete; no trade conclusion is permitted.",
        risks: numeric ? [`Policy rate is ${policyRate}.`] : [],
        missingData: numeric ? [] : ["inflation", "unemployment", "policyRate", "gdpGrowth"],
        evidenceIds: numeric ? [`macro:${instrumentId}`] : []
      };
    }
  });
}
