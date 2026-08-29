import { createAlpacaProvider, createCoinGeckoProvider, createMassiveProvider } from "../../backend/src/providerAdapters.mjs";
import { createIngestionPipeline } from "../../backend/src/marketDataIngestion.mjs";
import { createMarketDataStore } from "../../backend/src/marketDataStore.mjs";
import { createTelemetry } from "../../backend/src/observability.mjs";
import { createResearchOrchestrator } from "../../agents/src/orchestrator.mjs";

function configuredProviders(env, options) {
  const providers = [];
  if (env.ALPACA_PAPER_API_KEY && env.ALPACA_PAPER_SECRET_KEY) {
    providers.push(createAlpacaProvider({ apiKey: env.ALPACA_PAPER_API_KEY, secretKey: env.ALPACA_PAPER_SECRET_KEY, ...options }));
  }
  if (env.MASSIVE_API_KEY) providers.push(createMassiveProvider({ apiKey: env.MASSIVE_API_KEY, ...options }));
  if (env.COINGECKO_API_KEY) providers.push(createCoinGeckoProvider({ apiKey: env.COINGECKO_API_KEY, ...options }));
  return providers;
}

export function createResearchRuntime({ env = process.env, agents = [], fetchImpl, clock, logger = () => {}, maxAgeMs } = {}) {
  const telemetry = createTelemetry({ sink: logger, clock });
  const store = createMarketDataStore();
  const providers = configuredProviders(env, { fetchImpl, telemetry });
  const pipelines = providers.map((provider) => ({ provider: provider.name, pipeline: createIngestionPipeline({ provider, store, clock, logger, maxAgeMs }) }));
  const orchestrator = createResearchOrchestrator({ agents, telemetry });
  return Object.freeze({
    providers: Object.freeze(providers.map(({ name }) => name)),
    async ingest(requestsByProvider = {}) {
      return Object.fromEntries(await Promise.all(pipelines.map(async ({ provider, pipeline }) => [provider, await pipeline.ingest(requestsByProvider[provider] ?? {})])));
    },
    async research(input) {
      return orchestrator.run({ ...input, context: { ...input.context, store } });
    },
    store
  });
}
