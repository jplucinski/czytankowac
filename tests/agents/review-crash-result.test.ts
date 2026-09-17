import { describe, expect, it } from 'vitest';
import { reviewCrashResult } from '../../agents/review/review-crash-result';
import { ReviewResultSchema } from '../../agents/review/review-schema';

describe('reviewCrashResult', () => {
  it('returns a schema-valid REJECT payload for jq to parse', () => {
    const result = reviewCrashResult('Review agent returned no output');

    expect(ReviewResultSchema.parse(result)).toEqual({
      decision: 'REJECT',
      issues: ['Review agent returned no output'],
      summary: 'Review agent returned no output',
    });
  });

  it('truncates summary to 120 characters', () => {
    const message = 'x'.repeat(200);
    const result = reviewCrashResult(message);

    expect(result.summary).toHaveLength(120);
    expect(ReviewResultSchema.parse(result).issues).toEqual([message]);
  });
});
