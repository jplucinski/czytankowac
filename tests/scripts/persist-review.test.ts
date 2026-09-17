import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { persistReview } from '../../scripts/persist-review';
import { PublishedReviewSchema } from '../../src/domain/review';

describe('persistReview', () => {
  it('writes review.json for PASS output', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'czytankowac-review-'));
    const inputPath = path.join(dir, 'review-output.json');
    const outputPath = path.join(dir, 'review.json');
    const reviewedAt = new Date('2026-09-17T18:00:00.000Z');

    await writeFile(
      inputPath,
      `${JSON.stringify({
        decision: 'PASS',
        issues: [],
        summary: 'OK',
      })}\n> czytankowac@0.1.0 review\n`,
      'utf8',
    );

    await persistReview(inputPath, outputPath, reviewedAt);

    const published = PublishedReviewSchema.parse(
      JSON.parse(await readFile(outputPath, 'utf8')),
    );

    expect(published).toEqual({
      decision: 'PASS',
      issues: [],
      summary: 'OK',
      reviewedAt: '2026-09-17T18:00:00.000Z',
    });
  });

  it('rejects REJECT output', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'czytankowac-review-'));
    const inputPath = path.join(dir, 'review-output.json');
    const outputPath = path.join(dir, 'review.json');

    await writeFile(
      inputPath,
      JSON.stringify({
        decision: 'REJECT',
        issues: ['MISSING_SOURCE'],
        summary: 'Brak źródeł.',
      }),
      'utf8',
    );

    await expect(persistReview(inputPath, outputPath)).rejects.toThrow(
      'Review decision is REJECT; only PASS is persisted',
    );
  });

  it('rejects invalid JSON output', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'czytankowac-review-'));
    const inputPath = path.join(dir, 'review-output.json');
    const outputPath = path.join(dir, 'review.json');

    await writeFile(inputPath, '> czytankowac@0.1.0 review\n', 'utf8');

    await expect(persistReview(inputPath, outputPath)).rejects.toThrow(
      'Review output did not contain valid JSON',
    );
  });
});
