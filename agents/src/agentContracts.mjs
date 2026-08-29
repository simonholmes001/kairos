const signals = new Set(["bullish", "bearish", "neutral", "no_trade"]);
const horizons = new Set(["intraday", "short_term", "medium_term", "long_term"]);
const analysisTypes = new Set(["fundamental", "technical", "macro", "sentiment", "risk", "portfolio", "scenario"]);
const fields = new Set(["analysisId", "agent", "analysisType", "instrumentId", "signal", "horizon", "thesis", "confidence", "risks", "missingData", "evidenceIds", "generatedAt"]);
const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function required(value, name) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${name} is required`);
  return value.trim();
}

export function validateAgentAnalysis(input) {
  if (!input || typeof input !== "object") throw new TypeError("analysis response must be an object");
  for (const field of Object.keys(input)) if (!fields.has(field)) throw new TypeError(`unexpected field: ${field}`);
  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) {
    throw new RangeError("confidence must be a number between 0 and 1");
  }
  const generatedAt = required(input.generatedAt, "generatedAt");
  if (!dateTimePattern.test(generatedAt)) throw new TypeError("generatedAt must be an RFC 3339 date-time");
  const date = new Date(generatedAt);
  if (Number.isNaN(date.valueOf())) throw new TypeError("generatedAt must be a valid date-time");
  const arrays = {};
  for (const field of ["risks", "missingData", "evidenceIds"]) {
    if (!Array.isArray(input[field]) || input[field].some((item) => typeof item !== "string" || item.trim() === "")) {
      throw new TypeError(`${field} must be an array of non-empty strings`);
    }
    arrays[field] = [...input[field]];
  }
  const output = {
    analysisId: required(input.analysisId, "analysisId"),
    agent: required(input.agent, "agent"),
    analysisType: required(input.analysisType, "analysisType"),
    instrumentId: required(input.instrumentId, "instrumentId"),
    signal: required(input.signal, "signal"),
    horizon: required(input.horizon, "horizon"),
    thesis: required(input.thesis, "thesis"),
    confidence: input.confidence,
    risks: arrays.risks,
    missingData: arrays.missingData,
    evidenceIds: arrays.evidenceIds,
    generatedAt: date.toISOString()
  };
  if (!analysisTypes.has(output.analysisType)) throw new RangeError(`Unsupported analysisType: ${output.analysisType}`);
  if (!signals.has(output.signal)) throw new RangeError(`Unsupported signal: ${output.signal}`);
  if (!horizons.has(output.horizon)) throw new RangeError(`Unsupported horizon: ${output.horizon}`);
  if (output.evidenceIds.length === 0 && output.signal !== "no_trade") throw new Error("non-no-trade analysis requires evidenceIds");
  return Object.freeze(output);
}
