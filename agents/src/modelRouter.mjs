const defaultAssignments = Object.freeze({ research: "openai", summarization: "openai", extraction: "openai" });

function requiredApiKey(apiKey) {
  if (typeof apiKey !== "string" || apiKey.trim() === "") throw new TypeError("OPENAI_API_KEY is required");
  return apiKey.trim();
}

export function createOpenAiProvider({ apiKey = process.env.OPENAI_API_KEY, model = "gpt-4.1-mini", fetchImpl = fetch, baseUrl = "https://api.openai.com" } = {}) {
  const key = requiredApiKey(apiKey);
  return Object.freeze({
    async complete({ messages, metadata = {} }) {
      const response = await fetchImpl(new URL("/v1/responses", baseUrl), {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, input: messages, store: false, ...metadata })
      });
      if (!response.ok) throw new Error(`OpenAI returned HTTP ${response.status}`);
      const payload = await response.json();
      const output = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
      if (typeof output !== "string") throw new Error("OpenAI response did not contain output text");
      return { model: payload.model ?? model, output, cost: payload.usage?.total_tokens };
    }
  });
}

export function createModelRouter({ providers = {}, assignments = defaultAssignments, telemetry = { emit: () => {} } } = {}) {
  return Object.freeze({
    async complete({ task, messages, correlationId, metadata = {} }) {
      const configured = assignments[task] ?? assignments.research;
      const providerNames = Array.isArray(configured) ? configured : [configured];
      const providerName = providerNames.find((name) => providers[name] && typeof providers[name].complete === "function");
      const provider = providers[providerName];
      if (!provider) {
        return { ok: false, error: { code: "MODEL_UNAVAILABLE", message: `No model provider configured for ${providerNames.join(", ")}`, retryable: false } };
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
