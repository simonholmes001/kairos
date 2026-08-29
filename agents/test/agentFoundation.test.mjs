import assert from "node:assert/strict";
import test from "node:test";
import { validateAgentAnalysis } from "../src/agentContracts.mjs";
import { createModelRouter, createOpenAiProvider } from "../src/modelRouter.mjs";
import { createResearchOrchestrator } from "../src/orchestrator.mjs";
import { createSpecialistAgent } from "../src/specialistAgents.mjs";
import { createTechnicalResearchAgent } from "../src/technicalAgent.mjs";
import { createQuantHandlers } from "../src/quantTools.mjs";
import { createResearchRunStore } from "../src/runStore.mjs";
import { createFundamentalResearchAgent } from "../src/fundamentalAgent.mjs";
import { createRiskResearchAgent } from "../src/riskAgent.mjs";
import { createMacroResearchAgent } from "../src/macroAgent.mjs";
import { createSentimentResearchAgent } from "../src/sentimentAgent.mjs";
import { createToolGateway } from "../src/toolGateway.mjs";

test("agent analyses require bounded signals and evidence", () => {
  const base = { analysisId: "a", agent: "x", analysisType: "technical", instrumentId: "i", signal: "bullish", horizon: "short_term", thesis: "t", confidence: 0.8, risks: [], missingData: [], evidenceIds: ["e1"], generatedAt: "2026-01-01T00:00:00Z" };
  assert.equal(validateAgentAnalysis({ ...base, signal: "no_trade", thesis: "insufficient evidence", evidenceIds: [] }).signal, "no_trade");
  assert.throws(() => validateAgentAnalysis({ ...base, signal: "neutral", confidence: 2 }), /confidence/);
  assert.throws(() => validateAgentAnalysis({ ...base, analysisType: "unknown" }), /analysisType/);
  assert.throws(() => validateAgentAnalysis({ ...base, generatedAt: undefined }), /generatedAt/);
  assert.throws(() => validateAgentAnalysis({ ...base, generatedAt: "2026-01-01" }), /date-time/);
  assert.throws(() => validateAgentAnalysis({ ...base, risks: [""] }), /risks/);
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

test("research orchestrator runs every agent with bounded concurrency and persists state", async () => {
  let active = 0;
  let peak = 0;
  const runStore = createResearchRunStore();
  const agents = Array.from({ length: 5 }, (_, index) => createSpecialistAgent({
    name: `agent-${index}`,
    analysisType: "technical",
    run: async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
      return { analysisId: `a-${index}`, thesis: "test", evidenceIds: [`e-${index}`], confidence: 0.5 };
    }
  }));
  const result = await createResearchOrchestrator({ agents, maxConcurrency: 2, runStore }).run({ instrumentId: "i", correlationId: "run-1" });
  assert.equal(result.analyses.length, 5);
  assert.equal(peak <= 2, true);
  assert.equal((await runStore.get("run-1")).status, "completed");
});

test("technical specialist emits a validated, evidence-backed result", async () => {
  const agent = createTechnicalResearchAgent({ shortPeriod: 2, longPeriod: 3 });
  const result = await agent.run({ instrumentId: "ins_a", closes: [100, 101, 102, 103], correlationId: "c" });
  assert.equal(result.analysisType, "technical");
  assert.equal(result.signal, "bullish");
  assert.equal(result.confidence >= 0 && result.confidence <= 1, true);
});

test("technical and risk specialists fail closed when price history is unavailable", async () => {
  const technical = await createTechnicalResearchAgent({ shortPeriod: 2, longPeriod: 3 }).run({ instrumentId: "ins_a" });
  const risk = await createRiskResearchAgent({ shortPeriod: 2, longPeriod: 3 }).run({ instrumentId: "ins_a", closes: [100, 101] });
  assert.equal(technical.signal, "no_trade");
  assert.equal(risk.signal, "no_trade");
  assert.equal(technical.evidenceIds.length, 0);
  assert.equal(risk.missingData.includes("price history"), true);
});

test("fundamental and risk specialists fail closed when evidence is insufficient or limits are breached", async () => {
  const fundamental = createFundamentalResearchAgent();
  const incomplete = await fundamental.run({ instrumentId: "ins_a", fundamentals: { revenueGrowth: 0.1 } });
  assert.equal(incomplete.signal, "no_trade");
  assert.equal(incomplete.missingData.includes("debtToEquity"), true);
  assert.deepEqual(incomplete.evidenceIds, []);

  const bullish = await fundamental.run({
    instrumentId: "ins_a",
    fundamentals: { earningsGrowth: 0.2, revenueGrowth: 0.3, debtToEquity: 1.2, valuation: "fair" }
  });
  assert.equal(bullish.signal, "bullish");
  assert.equal(bullish.evidenceIds.length, 1);

  const expensive = await fundamental.run({
    instrumentId: "ins_a",
    fundamentals: { earningsGrowth: 0.2, revenueGrowth: 0.3, debtToEquity: 1.2, valuation: "expensive" }
  });
  assert.equal(expensive.signal, "neutral");
  assert.deepEqual(expensive.missingData, []);

  const missingValuation = await fundamental.run({
    instrumentId: "ins_a",
    fundamentals: { earningsGrowth: 0.2, revenueGrowth: 0.3, debtToEquity: 1.2 }
  });
  assert.equal(missingValuation.signal, "no_trade");
  assert.deepEqual(missingValuation.missingData, ["valuation"]);

  const risk = createRiskResearchAgent({ shortPeriod: 2, longPeriod: 3, maxDrawdownLimit: 0.1 });
  const result = await risk.run({ instrumentId: "ins_a", closes: [100, 120, 90, 100] });
  assert.equal(result.signal, "no_trade");
  assert.equal(result.evidenceIds.length, 1);
});

test("macro and sentiment specialists require complete, sufficiently supported inputs", async () => {
  const macro = createMacroResearchAgent();
  const macroResult = await macro.run({ instrumentId: "ins_a", macro: { inflation: 2, unemployment: 5, policyRate: 3, gdpGrowth: 2 } });
  assert.equal(macroResult.signal, "bullish");
  const missingMacro = await macro.run({ instrumentId: "ins_a", macro: { inflation: 2 } });
  assert.equal(missingMacro.signal, "no_trade");
  assert.deepEqual(missingMacro.evidenceIds, []);

  const sentiment = createSentimentResearchAgent({ minimumSources: 2 });
  const sentimentResult = await sentiment.run({ instrumentId: "ins_a", sentiment: { score: -0.6, sourceIds: ["news-1", "news-2"] } });
  assert.equal(sentimentResult.signal, "bearish");
  const weakSentiment = await sentiment.run({ instrumentId: "ins_a", sentiment: { score: 0.8, sourceIds: ["news-1"] } });
  assert.equal(weakSentiment.signal, "no_trade");
});
