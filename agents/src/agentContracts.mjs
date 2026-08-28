const signals = new Set(["bullish", "bearish", "neutral", "no_trade"]);
const horizons = new Set(["intraday", "short_term", "medium_term", "long_term"]);

function required(value, name) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${name} is required`);
  return value.trim();
}

export function validateAgentAnalysis(input) {
  const output = {
    analysisId: required(input.analysisId, "analysisId"),
    agent: required(input.agent, "agent"),
    instrumentId: required(input.instrumentId, "instrumentId"),
    signal: required(input.signal, "signal"),
    horizon: required(input.horizon, "horizon"),
    thesis: required(input.thesis, "thesis"),
    risks: Array.isArray(input.risks) ? [...input.risks] : [],
    missingData: Array.isArray(input.missingData) ? [...input.missingData] : [],
    evidenceIds: Array.isArray(input.evidenceIds) ? [...input.evidenceIds] : [],
    generatedAt: new Date(input.generatedAt ?? new Date()).toISOString()
  };
  if (!signals.has(output.signal)) throw new RangeError(`Unsupported signal: ${output.signal}`);
  if (!horizons.has(output.horizon)) throw new RangeError(`Unsupported horizon: ${output.horizon}`);
  if (output.evidenceIds.length === 0 && output.signal !== "no_trade") throw new Error("non-no-trade analysis requires evidenceIds");
  return Object.freeze(output);
}
