import { z } from 'zod';

export const ReviewResultSchema = z.object({
  decision: z.enum(['PASS', 'REJECT']),
  issues: z.array(z.string()),
  summary: z.string().max(120),
});

export const PublishedReviewSchema = ReviewResultSchema.extend({
  reviewedAt: z.string().datetime(),
});

export type ReviewResult = z.infer<typeof ReviewResultSchema>;
export type PublishedReview = z.infer<typeof PublishedReviewSchema>;

export type ReviewViewModel = {
  statusLabel: string;
  issuesLabel: string;
  accentClass: 'review-note--pass' | 'review-note--reject';
};

const STATUS_LABELS: Record<ReviewResult['decision'], string> = {
  PASS: 'Zatwierdzono',
  REJECT: 'Odrzucono',
};

export function toReviewViewModel(review: ReviewResult): ReviewViewModel {
  return {
    statusLabel: STATUS_LABELS[review.decision],
    issuesLabel: review.issues.length === 0 ? 'brak' : review.issues.join(', '),
    accentClass: review.decision === 'PASS' ? 'review-note--pass' : 'review-note--reject',
  };
}
