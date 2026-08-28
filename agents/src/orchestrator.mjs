import { validateAgentAnalysis } from "./agentContracts.mjs";

export function createResearchOrchestrator({ agents = [], telemetry = { emit: () => {} }, maxConcurrency = 4 } = {}) {
  if (maxConcurrency < 1 || !Number.isInteger(maxConcurrency)) throw new TypeError("maxConcurrency must be a positive integer");
  return Object.freeze({
    async run({ instrumentId, mode = "research", correlationId, context = {} }) {
      if (mode !== "research") return { ok: false, error: { code: "MODE_NOT_ALLOWED", message: "research orchestrator only supports research mode" } };
      const selected = agents.slice(0, maxConcurrency);
      const outcomes = await Promise.all(selected.map(async (agent) => {
        try {
          const result = await agent.run({ instrumentId, context, correlationId });
          return { ok: true, analysis: validateAgentAnalysis(result) };
        } catch (error) {
          return { ok: false, agent: agent.name ?? "unknown", error: { code: "AGENT_FAILED", message: error.message } };
        }
      }));
      const analyses = outcomes.filter((outcome) => outcome.ok).map((outcome) => outcome.analysis);
      const failures = outcomes.filter((outcome) => !outcome.ok);
      telemetry.emit("research.workflow.completed", { correlationId, instrumentId, analysisCount: analyses.length, failureCount: failures.length });
      return { ok: failures.length === 0, mode, instrumentId, correlationId, analyses, failures };
    }
  });
}
