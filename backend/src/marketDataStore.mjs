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

export function createJsonFileMarketDataStore({ path, fsImpl } = {}) {
  if (typeof path !== "string" || path.trim() === "") throw new TypeError("path is required");
  const fs = fsImpl ? Promise.resolve(fsImpl) : import("node:fs/promises");
  const records = new Map();
  const keyFor = (point) => `${point.instrumentId}:${point.dataType}:${point.asOf}:${point.provider}`;
  const ready = fs.then(async (module) => {
    try {
      const points = JSON.parse(await module.readFile(path, "utf8"));
      if (!Array.isArray(points)) throw new TypeError("market data store file must contain an array");
      for (const point of points) records.set(keyFor(point), point);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  });
  async function persist(module) {
    await module.writeFile(path, `${JSON.stringify([...records.values()], null, 2)}\n`, "utf8");
  }
  return Object.freeze({
    ready,
    async put(points) {
      const module = await fs;
      await ready;
      for (const point of points) records.set(keyFor(point), point);
      await persist(module);
      return points.length;
    },
    async query(filters = {}) {
      await ready;
      return createMarketDataStoreFrom(records).query(filters);
    },
    async size() { await ready; return records.size; }
  });
}

function createMarketDataStoreFrom(records) {
  return {
    query({ instrumentId, dataType, from, to } = {}) {
      return [...records.values()]
        .filter((point) => !instrumentId || point.instrumentId === instrumentId)
        .filter((point) => !dataType || point.dataType === dataType)
        .filter((point) => !from || point.asOf >= from)
        .filter((point) => !to || point.asOf <= to)
        .sort((a, b) => a.asOf.localeCompare(b.asOf));
    }
  };
}
