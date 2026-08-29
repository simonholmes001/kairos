import assert from "node:assert/strict";
import test from "node:test";
import { createTechnicalResearchAgent } from "../../agents/src/technicalAgent.mjs";
import { createResearchRuntime } from "../src/researchRuntime.mjs";

test("runtime composes configured providers and runs research with shared context", async () => {
  const runtime = createResearchRuntime({
    env: { ALPACA_PAPER_API_KEY: "key", ALPACA_PAPER_SECRET_KEY: "secret" },
    fetchImpl: async () => ({ ok: true, async json() { return { bars: [] }; } }),
    agents: [createTechnicalResearchAgent({ shortPeriod: 2, longPeriod: 3 })]
  });
  assert.deepEqual(runtime.providers, ["alpaca"]);
  const result = await runtime.research({ instrumentId: "ins_a", context: { closes: [100, 101, 102, 103] }, correlationId: "run-1" });
  assert.equal(result.analyses[0].analysisType, "technical");
});

test("runtime does not create providers without complete credentials", () => {
  const runtime = createResearchRuntime({ env: { ALPACA_PAPER_API_KEY: "key" } });
  assert.deepEqual(runtime.providers, []);
});
