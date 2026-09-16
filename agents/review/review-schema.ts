import { z } from 'zod';

export const ReviewResultSchema = z.object({
  decision: z.enum(['PASS', 'REJECT']),
  issues: z.array(z.string()),
  summary: z.string().max(120),
});

export type ReviewResult = z.infer<typeof ReviewResultSchema>;
