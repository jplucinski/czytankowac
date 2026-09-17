import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  PublishedReviewSchema,
  ReviewResultSchema,
  type ReviewResult,
} from '../src/domain/review';

function extractReviewResult(raw: string): ReviewResult | null {
  const lines = raw.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) {
      continue;
    }

    try {
      const parsed = JSON.parse(trimmed);
      const result = ReviewResultSchema.safeParse(parsed);
      if (result.success) {
        return result.data;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function persistReview(
  inputPath: string,
  outputPath = path.join('src', 'data', 'review.json'),
  reviewedAt = new Date(),
): Promise<void> {
  const raw = await readFile(inputPath, 'utf8');
  const review = extractReviewResult(raw);

  if (!review) {
    throw new Error('Review output did not contain valid JSON');
  }

  if (review.decision !== 'PASS') {
    throw new Error(`Review decision is ${review.decision}; only PASS is persisted`);
  }

  const published = PublishedReviewSchema.parse({
    ...review,
    reviewedAt: reviewedAt.toISOString(),
  });

  await writeFile(outputPath, `${JSON.stringify(published, null, 2)}\n`, 'utf8');
}

async function main(): Promise<void> {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: tsx scripts/persist-review.ts <review-output.json>');
    process.exit(1);
  }

  try {
    await persistReview(inputPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
