const defaultAssignments = Object.freeze({ research: "openai", summarization: "openai", extraction: "openai" });

export function createModelRouter({ providers = {}, assignments = defaultAssignments, telemetry = { emit: () => {} } } = {}) {
  return Object.freeze({
    async complete({ task, messages, correlationId, metadata = {} }) {
      const providerName = assignments[task] ?? assignments.research;
      const provider = providers[providerName];
      if (!provider || typeof provider.complete !== "function") {
        return { ok: false, error: { code: "MODEL_UNAVAILABLE", message: `No model provider configured for ${providerName}`, retryable: false } };
      }
      const startedAt = Date.now();
      try {
        const response = await provider.complete({ messages, metadata });
        const result = { ok: true, provider: providerName, model: response.model ?? "unknown", output: response.output, latencyMs: Date.now() - startedAt };
        telemetry.emit("model.completed", { ...result, correlationId, cost: response.cost });
        return result;
      } catch (error) {
        telemetry.emit("model.failed", { provider: providerName, correlationId, error: error.message, latencyMs: Date.now() - startedAt });
        return { ok: false, error: { code: "MODEL_FAILED", message: error.message, retryable: true } };
      }
    }
  });
}
