import { createTechnicalResearchAgent } from "../../agents/src/technicalAgent.mjs";
import { createFundamentalResearchAgent } from "../../agents/src/fundamentalAgent.mjs";
import { createMacroResearchAgent } from "../../agents/src/macroAgent.mjs";
import { createSentimentResearchAgent } from "../../agents/src/sentimentAgent.mjs";
import { createRiskResearchAgent } from "../../agents/src/riskAgent.mjs";
import { createResearchRuntime } from "./researchRuntime.mjs";

export function createDefaultResearchRuntime(options = {}) {
  return createResearchRuntime({
    ...options,
    agents: options.agents ?? [
      createTechnicalResearchAgent(),
      createFundamentalResearchAgent(),
      createMacroResearchAgent(),
      createSentimentResearchAgent(),
      createRiskResearchAgent()
    ]
  });
}
