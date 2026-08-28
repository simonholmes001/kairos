export function createMarketDataStore() {
  const records = new Map();
  return Object.freeze({
    put(points) {
      for (const point of points) {
        const key = `${point.instrumentId}:${point.dataType}:${point.asOf}:${point.provider}`;
        if (!records.has(key)) records.set(key, point);
      }
      return points.length;
    },
    query({ instrumentId, dataType, from, to } = {}) {
      return [...records.values()]
        .filter((point) => !instrumentId || point.instrumentId === instrumentId)
        .filter((point) => !dataType || point.dataType === dataType)
        .filter((point) => !from || point.asOf >= from)
        .filter((point) => !to || point.asOf <= to)
        .sort((a, b) => a.asOf.localeCompare(b.asOf));
    },
    size() { return records.size; }
  });
}
