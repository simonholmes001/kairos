import assert from "node:assert/strict";
import test from "node:test";
import { canAgentInvokeTool, classifyTool } from "../src/toolPolicy.mjs";

test("financial write tools are classified and denied to agents", () => {
  assert.equal(classifyTool("broker.place_order"), "financial_write");
  assert.equal(canAgentInvokeTool("broker.place_order", "research"), false);
  assert.equal(canAgentInvokeTool("exchange.cancel_order", "live"), false);
});

test("read tools are allowed through controlled tool boundary", () => {
  assert.equal(classifyTool("market.get_bars"), "read");
  assert.equal(canAgentInvokeTool("market.get_bars", "research"), true);
  assert.equal(canAgentInvokeTool("portfolio.get_positions", "paper"), true);
});

test("unknown tools are denied in live mode", () => {
  assert.equal(classifyTool("provider.raw_http"), "unknown");
  assert.equal(canAgentInvokeTool("provider.raw_http", "live"), false);
});
