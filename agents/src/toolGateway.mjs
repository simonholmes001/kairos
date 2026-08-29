import { canAgentInvokeTool, classifyTool } from "./toolPolicy.mjs";

const allowedTools = new Set([
  "market.get_quote", "market.get_bars", "market.get_status", "portfolio.get_positions",
  "research.get_documents", "research.get_fundamentals", "quant.compute"
]);

export function createToolGateway({ handlers = {}, telemetry = { emit: () => {} } } = {}) {
  return Object.freeze({
    async invoke({ toolName, input = {}, mode = "research", correlationId }) {
      if (!allowedTools.has(toolName) || !canAgentInvokeTool(toolName, mode)) {
        telemetry.emit("agent.tool.denied", { toolName, mode, correlationId, classification: classifyTool(toolName) });
        return { ok: false, error: { code: "TOOL_DENIED", message: "tool is not allowed for agent use" } };
      }
      const handler = handlers[toolName];
      if (typeof handler !== "function") return { ok: false, error: { code: "TOOL_UNAVAILABLE", message: "tool is not registered" } };
      try {
        const value = await handler(input);
        telemetry.emit("agent.tool.completed", { toolName, mode, correlationId });
        return { ok: true, value };
      } catch (error) {
        telemetry.emit("agent.tool.failed", { toolName, mode, correlationId, error: error.message });
        return { ok: false, error: { code: "TOOL_FAILED", message: error.message, retryable: true } };
      }
    }
  });
}

export { allowedTools };
