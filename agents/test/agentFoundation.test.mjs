import assert from "node:assert/strict";
import test from "node:test";
import { validateAgentAnalysis } from "../src/agentContracts.mjs";
import { createModelRouter, createOpenAiProvider } from "../src/modelRouter.mjs";
import { createResearchOrchestrator } from "../src/orchestrator.mjs";
import { createSpecialistAgent } from "../src/specialistAgents.mjs";
import { createTechnicalResearchAgent } from "../src/technicalAgent.mjs";
import { createQuantHandlers } from "../src/quantTools.mjs";
import { createToolGateway } from "../src/toolGateway.mjs";

test("agent analyses require bounded signals and evidence", () => {
  assert.throws(() => validateAgentAnalysis({ analysisId: "a", agent: "x", instrumentId: "i", signal: "bullish", horizon: "short_term", thesis: "t", confidence: 0.8 }), /evidenceIds/);
  assert.equal(validateAgentAnalysis({ analysisId: "a", agent: "x", instrumentId: "i", signal: "no_trade", horizon: "short_term", thesis: "insufficient evidence", confidence: 0.1 }).signal, "no_trade");
  assert.throws(() => validateAgentAnalysis({ analysisId: "a", agent: "x", instrumentId: "i", signal: "neutral", horizon: "short_term", thesis: "t", confidence: 2 }), /confidence/);
});

test("tool gateway denies broker writes and arbitrary unregistered tools", async () => {
  const gateway = createToolGateway({ handlers: { "market.get_quote": async () => ({ price: 1 }), ...createQuantHandlers() } });
  assert.equal((await gateway.invoke({ toolName: "broker.place_order", mode: "research" })).error.code, "TOOL_DENIED");
  assert.equal((await gateway.invoke({ toolName: "provider.raw_http", mode: "research" })).error.code, "TOOL_DENIED");
  assert.deepEqual(await gateway.invoke({ toolName: "market.get_quote", input: { instrumentId: "i" } }), { ok: true, value: { price: 1 } });
  const quant = await gateway.invoke({ toolName: "quant.compute", input: { operation: "price_analysis", closes: [100, 101, 102], shortPeriod: 2, longPeriod: 3 } });
  assert.equal(quant.ok, true);
  assert.equal(quant.value.latest, 102);
  assert.equal((await gateway.invoke({ toolName: "quant.compute", input: { operation: "unknown", closes: [1, 2, 3], shortPeriod: 1, longPeriod: 2 } })).error.code, "TOOL_FAILED");
});

test("model router records provider-neutral completion and controlled failure", async () => {
  const router = createModelRouter({ providers: { openai: { async complete() { return { model: "test", output: "ok", cost: 0 }; } } } });
  assert.equal((await router.complete({ task: "research", messages: [] })).output, "ok");
  assert.equal((await createModelRouter().complete({ task: "research", messages: [] })).error.code, "MODEL_UNAVAILABLE");
});

test("OpenAI provider uses only OPENAI_API_KEY and parses Responses output", async () => {
  let request;
  const provider = createOpenAiProvider({ apiKey: "test-key", fetchImpl: async (url, options) => {
    request = { url: String(url), options };
    return { ok: true, async json() { return { model: "test-model", output_text: "structured output", usage: { total_tokens: 12 } }; } };
  } });
  const result = await provider.complete({ messages: [{ role: "user", content: "test" }] });
  assert.equal(result.output, "structured output");
  assert.equal(request.options.headers.authorization, "Bearer test-key");
  assert.equal(request.options.body.includes("OPENAI_KEY"), false);
});

test("research orchestrator isolates agent failure and does not expose execution", async () => {
  const good = createSpecialistAgent({ name: "technical", analysisType: "technical", signal: "bullish", confidence: 0.7, run: async () => ({ analysisId: "a", thesis: "trend", evidenceIds: ["e1"] }) });
  const bad = createSpecialistAgent({ name: "broken", analysisType: "sentiment", run: async () => { throw new Error("provider timeout"); } });
  const result = await createResearchOrchestrator({ agents: [good, bad] }).run({ instrumentId: "i", correlationId: "c" });
  assert.equal(result.analyses.length, 1);
  assert.equal(result.failures[0].error.code, "AGENT_FAILED");
  assert.equal("placeOrder" in result, false);
});

test("technical specialist emits a validated, evidence-backed result", async () => {
  const agent = createTechnicalResearchAgent({ shortPeriod: 2, longPeriod: 3 });
  const result = await agent.run({ instrumentId: "ins_a", closes: [100, 101, 102, 103], correlationId: "c" });
  assert.equal(result.analysisType, undefined);
  assert.equal(result.signal, "bullish");
  assert.equal(result.confidence >= 0 && result.confidence <= 1, true);
});
