export function createIngestionScheduler({ pipeline, requests, intervalMs, logger = () => {}, setIntervalImpl = setInterval, clearIntervalImpl = clearInterval } = {}) {
  if (!pipeline || typeof pipeline.ingest !== "function") throw new TypeError("pipeline.ingest is required");
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) throw new TypeError("intervalMs must be positive");
  if (!Array.isArray(requests)) throw new TypeError("requests must be an array");
  let timer;
  return Object.freeze({
    async runOnce() {
      const results = await Promise.all(requests.map((request) => pipeline.ingest(request)));
      logger({ event: "market_data.schedule.completed", requestCount: requests.length });
      return results;
    },
    start() {
      if (timer) return;
      timer = setIntervalImpl(() => { void this.runOnce(); }, intervalMs);
    },
    stop() {
      if (!timer) return;
      clearIntervalImpl(timer);
      timer = undefined;
    }
  });
}
