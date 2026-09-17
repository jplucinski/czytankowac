import { ReviewResultSchema, type ReviewResult } from './review-schema';

export function reviewCrashResult(message: string): ReviewResult {
  const summary = message.length <= 120 ? message : `${message.slice(0, 117)}...`;
  return ReviewResultSchema.parse({
    decision: 'REJECT',
    issues: [message],
    summary,
  });
}
