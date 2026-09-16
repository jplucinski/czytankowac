import { Agent, run, webSearchTool } from '@openai/agents';
import type { Forecast } from '../../src/domain/forecast';
import { REVIEW_PROMPT, REVIEW_SEARCH_OPTIONS } from '../shared/prompts';
import { ReviewResultSchema, type ReviewResult } from './review-schema';

export async function runReview(forecast: Forecast): Promise<ReviewResult> {
  const agent = new Agent({
    name: 'Fuel Review',
    instructions: REVIEW_PROMPT,
    tools: [webSearchTool(REVIEW_SEARCH_OPTIONS)],
    outputType: ReviewResultSchema,
    model: process.env.OPENAI_REVIEW_MODEL,
  });

  const result = await run(
    agent,
    `Zweryfikuj tę prognozę:\n${JSON.stringify(forecast, null, 2)}`,
  );

  if (!result.finalOutput) {
    throw new Error('Review agent returned no output');
  }

  return ReviewResultSchema.parse(result.finalOutput);
}
