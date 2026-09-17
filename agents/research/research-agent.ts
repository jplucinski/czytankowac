import { Agent, run, webSearchTool } from '@openai/agents';
import { ForecastSchema, type Forecast } from '../../src/domain/forecast';
import {
  RESEARCH_DEEP_PROMPT,
  RESEARCH_DEEP_SEARCH_OPTIONS,
  RESEARCH_PROMPT,
  RESEARCH_SEARCH_OPTIONS,
} from '../shared/prompts';
import { formatLowConfidenceFuels, needsResearchEscalation } from './escalation';

export type ResearchTier = 'cheap' | 'deep';

export function createResearchAgent(tier: ResearchTier): Agent {
  const isDeep = tier === 'deep';

  return new Agent({
    name: isDeep ? 'Fuel Research (Deep)' : 'Fuel Research',
    instructions: isDeep ? RESEARCH_DEEP_PROMPT : RESEARCH_PROMPT,
    tools: [
      webSearchTool(isDeep ? RESEARCH_DEEP_SEARCH_OPTIONS : RESEARCH_SEARCH_OPTIONS),
    ],
    outputType: ForecastSchema,
    model: isDeep
      ? process.env.OPENAI_RESEARCH_FALLBACK_MODEL || process.env.OPENAI_RESEARCH_MODEL
      : process.env.OPENAI_RESEARCH_MODEL,
  });
}

function buildCheapPrompt(asOf: string): string {
  return `Przygotuj dzisiejszą prognozę paliw PB95 i DIESEL dla Polski. Ustaw asOf na ${asOf}.`;
}

function buildDeepPrompt(asOf: string, initialForecast: Forecast): string {
  const lowFuels = formatLowConfidenceFuels(initialForecast);

  return `Pierwsza prognoza miała niską pewność (${lowFuels}). Pogłęb research i przygotuj ulepszoną prognozę PB95 i DIESEL dla Polski.
Ustaw asOf na ${asOf}.

Pierwsza prognoza:
${JSON.stringify(initialForecast, null, 2)}`;
}

type RunAgentFn = (agent: Agent, prompt: string) => Promise<{ finalOutput: unknown }>;

const defaultRunAgent: RunAgentFn = async (agent, prompt) => run(agent, prompt);

export type RunResearchOptions = {
  runAgent?: RunAgentFn;
};

export async function runResearch(
  now: Date,
  options: RunResearchOptions = {},
): Promise<Forecast> {
  const runAgent = options.runAgent ?? defaultRunAgent;
  const asOf = now.toISOString();

  const cheapResult = await runAgent(createResearchAgent('cheap'), buildCheapPrompt(asOf));

  if (!cheapResult.finalOutput) {
    throw new Error('Research agent returned no output');
  }

  const initialForecast = ForecastSchema.parse(cheapResult.finalOutput);

  if (!needsResearchEscalation(initialForecast)) {
    return initialForecast;
  }

  console.log(`Escalating research: ${formatLowConfidenceFuels(initialForecast)}`);

  const deepResult = await runAgent(
    createResearchAgent('deep'),
    buildDeepPrompt(asOf, initialForecast),
  );

  if (!deepResult.finalOutput) {
    throw new Error('Research agent returned no output');
  }

  return ForecastSchema.parse(deepResult.finalOutput);
}
