import { validateAgentAnalysis } from "./agentContracts.mjs";

export function createResearchOrchestrator({ agents = [], telemetry = { emit: () => {} }, runStore, maxConcurrency = 4 } = {}) {
  if (maxConcurrency < 1 || !Number.isInteger(maxConcurrency)) throw new TypeError("maxConcurrency must be a positive integer");
  return Object.freeze({
    async run({ instrumentId, mode = "research", correlationId, context = {} }) {
      if (mode !== "research") return { ok: false, error: { code: "MODE_NOT_ALLOWED", message: "research orchestrator only supports research mode" } };
      const runId = correlationId ?? `research-${Date.now()}`;
      const initial = { runId, mode, instrumentId, correlationId, status: "running", startedAt: new Date().toISOString() };
      await runStore?.save(initial);
      const outcomes = new Array(agents.length);
      let nextIndex = 0;
      async function worker() {
        while (nextIndex < agents.length) {
          const index = nextIndex++;
          const agent = agents[index];
          outcomes[index] = await (async () => {
        try {
          const result = await agent.run({ instrumentId, context, correlationId });
          return { ok: true, analysis: validateAgentAnalysis(result) };
        } catch (error) {
          return { ok: false, agent: agent.name ?? "unknown", error: { code: "AGENT_FAILED", message: error.message } };
        }
          })();
        }
      }
      await Promise.all(Array.from({ length: Math.min(maxConcurrency, agents.length) }, () => worker()));
      const analyses = outcomes.filter((outcome) => outcome.ok).map((outcome) => outcome.analysis);
      const failures = outcomes.filter((outcome) => !outcome.ok);
      telemetry.emit("research.workflow.completed", { correlationId, instrumentId, analysisCount: analyses.length, failureCount: failures.length });
      const result = { ok: failures.length === 0, runId, mode, instrumentId, correlationId, analyses, failures, completedAt: new Date().toISOString() };
      await runStore?.save({ ...initial, ...result, status: "completed" });
      return result;
    }
  });
}
