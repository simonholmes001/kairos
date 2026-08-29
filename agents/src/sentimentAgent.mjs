import { createSpecialistAgent } from "./specialistAgents.mjs";

export function createSentimentResearchAgent({ name = "sentiment-research", minimumSources = 3 } = {}) {
  return createSpecialistAgent({
    name,
    analysisType: "sentiment",
    run: async ({ instrumentId, sentiment = {} }) => {
      const { score, sourceIds = [] } = sentiment;
      const usable = Number.isFinite(score) && score >= -1 && score <= 1 && sourceIds.length >= minimumSources;
      const signal = !usable ? "no_trade" : score >= 0.35 ? "bullish" : score <= -0.35 ? "bearish" : "neutral";
      return {
        analysisId: `${name}:${instrumentId}`,
        signal,
        horizon: "short_term",
        confidence: usable ? Math.min(1, Math.abs(score)) : 0,
        thesis: usable ? `Aggregated sentiment score is ${score.toFixed(2)} across ${sourceIds.length} sources.` : "Sentiment evidence is insufficient or outside the supported score range.",
        risks: usable ? ["Sentiment can reverse quickly and is not sufficient on its own for execution."] : [],
        missingData: usable ? [] : ["sentiment score or minimum source coverage"],
        evidenceIds: sourceIds.map((sourceId) => `sentiment:${sourceId}`)
      };
    }
  });
}
