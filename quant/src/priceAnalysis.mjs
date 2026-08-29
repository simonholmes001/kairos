function finiteSeries(values, name) {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new TypeError(`${name} must be a non-empty numeric series`);
  }
  return values;
}

export function simpleMovingAverage(values, period) {
  const series = finiteSeries(values, "values");
  if (!Number.isInteger(period) || period < 1 || period > series.length) throw new RangeError("period must fit the series");
  return series.slice(-period).reduce((sum, value) => sum + value, 0) / period;
}

export function percentageReturns(closes) {
  const series = finiteSeries(closes, "closes");
  return series.slice(1).map((close, index) => {
    const previous = series[index];
    if (previous === 0) throw new RangeError("cannot calculate return from a zero price");
    return (close - previous) / previous;
  });
}

export function annualizedVolatility(closes, periodsPerYear = 252) {
  const returns = percentageReturns(closes);
  if (returns.length < 2) throw new RangeError("at least three closes are required");
  if (!Number.isFinite(periodsPerYear) || periodsPerYear <= 0) throw new RangeError("periodsPerYear must be positive");
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance * periodsPerYear);
}

export function maximumDrawdown(closes) {
  const series = finiteSeries(closes, "closes");
  let peak = series[0];
  let drawdown = 0;
  for (const close of series) {
    peak = Math.max(peak, close);
    drawdown = Math.min(drawdown, (close - peak) / peak);
  }
  return Math.abs(drawdown);
}

export function analyzePrices({ closes, shortPeriod = 20, longPeriod = 50, periodsPerYear = 252 }) {
  const series = finiteSeries(closes, "closes");
  if (shortPeriod >= longPeriod) throw new RangeError("shortPeriod must be less than longPeriod");
  return Object.freeze({
    latest: series.at(-1),
    shortSma: simpleMovingAverage(series, shortPeriod),
    longSma: simpleMovingAverage(series, longPeriod),
    annualizedVolatility: annualizedVolatility(series, periodsPerYear),
    maximumDrawdown: maximumDrawdown(series),
    returnCount: series.length - 1
  });
}
