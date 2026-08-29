export function createResearchRunStore() {
  const runs = new Map();
  return Object.freeze({
    async save(run) { runs.set(run.runId, Object.freeze({ ...run })); },
    async get(runId) { return runs.get(runId); },
    size() { return runs.size; }
  });
}
