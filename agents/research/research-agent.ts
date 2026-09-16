import { Agent, run, webSearchTool } from '@openai/agents';
import { ForecastSchema, type Forecast } from '../../src/domain/forecast';
import { RESEARCH_PROMPT, RESEARCH_SEARCH_OPTIONS } from '../shared/prompts';

export async function runResearch(now: Date): Promise<Forecast> {
  const agent = new Agent({
    name: 'Fuel Research',
    instructions: RESEARCH_PROMPT,
    tools: [webSearchTool(RESEARCH_SEARCH_OPTIONS)],
    outputType: ForecastSchema,
    model: process.env.OPENAI_RESEARCH_MODEL,
  });

  const asOf = now.toISOString();
  const result = await run(
    agent,
    `Przygotuj dzisiejszą prognozę paliw PB95 i DIESEL dla Polski. Ustaw asOf na ${asOf}.`,
  );

  if (!result.finalOutput) {
    throw new Error('Research agent returned no output');
  }

  return ForecastSchema.parse(result.finalOutput);
}
