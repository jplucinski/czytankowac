import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ForecastSchema } from '../../src/domain/forecast';
import { reviewCrashResult } from './review-crash-result';
import { runReview } from './review-agent';
import type { ReviewResult } from './review-schema';
import { validateForecast } from './validate-forecast';

function printResult(result: ReviewResult): void {
  console.log(JSON.stringify(result));
}

async function main(): Promise<void> {
  const latestPath = path.join(process.cwd(), 'src', 'data', 'latest.json');
  const raw = await readFile(latestPath, 'utf8');
  const forecast = ForecastSchema.parse(JSON.parse(raw));
  const now = new Date();

  const validationIssues = validateForecast(forecast, now);
  if (validationIssues.length > 0) {
    printResult({
      decision: 'REJECT',
      issues: validationIssues.map((issue) => `${issue.code}: ${issue.message}`),
      summary: 'Prognoza nie przeszła walidacji deterministycznej.',
    });
    process.exit(1);
  }

  const review = await runReview(forecast);
  printResult(review);

  if (review.decision !== 'PASS') {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Review failed: ${message}`);
  printResult(reviewCrashResult(message));
  process.exit(1);
});
