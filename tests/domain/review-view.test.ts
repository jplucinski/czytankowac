import { describe, expect, it } from 'vitest';
import { toReviewViewModel } from '../../src/domain/review';

describe('toReviewViewModel', () => {
  it('maps PASS to Polish status and accent class', () => {
    const view = toReviewViewModel({
      decision: 'PASS',
      issues: [],
      summary: 'Prognoza jest spójna ze źródłami.',
    });

    expect(view).toEqual({
      statusLabel: 'Zatwierdzono',
      issuesLabel: 'brak',
      accentClass: 'review-note--pass',
    });
  });

  it('maps REJECT and joins issues', () => {
    const view = toReviewViewModel({
      decision: 'REJECT',
      issues: ['Brak źródła', 'Niska pewność'],
      summary: 'Prognoza wymaga poprawy.',
    });

    expect(view).toEqual({
      statusLabel: 'Odrzucono',
      issuesLabel: 'Brak źródła, Niska pewność',
      accentClass: 'review-note--reject',
    });
  });
});
