const financialWriteTools = new Set([
  "broker.place_order",
  "broker.cancel_order",
  "exchange.place_order",
  "exchange.cancel_order"
]);

export function classifyTool(toolName) {
  if (financialWriteTools.has(toolName)) {
    return "financial_write";
  }

  if (toolName.startsWith("market.") || toolName.startsWith("portfolio.") || toolName.startsWith("research.")) {
    return "read";
  }

  return "unknown";
}

export function canAgentInvokeTool(toolName, mode) {
  const classification = classifyTool(toolName);

  if (classification === "financial_write") {
    return false;
  }

  if (mode === "live" && classification === "unknown") {
    return false;
  }

  return classification === "read";
}
