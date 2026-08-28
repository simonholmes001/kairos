import { validateAgentAnalysis } from "./agentContracts.mjs";

export function createSpecialistAgent({ name, analysisType, signal = "neutral", horizon = "medium_term", confidence = 0, run }) {
  if (typeof run !== "function") throw new TypeError("specialist agent requires run(context)");
  return Object.freeze({
    name,
    async run(context) {
      const result = await run(context);
      return validateAgentAnalysis({
        ...result,
        agent: name,
        analysisType,
        instrumentId: context.instrumentId,
        signal: result.signal ?? signal,
        horizon: result.horizon ?? horizon,
        confidence: result.confidence ?? confidence
      });
    }
  });
}
