import { describe, expect, it } from 'vitest';
import {
  CONFIDENCE_ESCALATION_THRESHOLD,
  formatLowConfidenceFuels,
  needsResearchEscalation,
} from '../../agents/research/escalation';
import type { Forecast } from '../../src/domain/forecast';

function forecastWithConfidences(pb95: number, diesel: number): Forecast {
  return {
    asOf: '2026-09-17T09:00:00Z',
    market: 'PL',
    horizonDays: 7,
    fuels: [
      {
        fuel: 'PB95',
        direction: 'STABLE',
        recommendation: 'NORMAL',
        confidence: pb95,
        summary: 'PB95 summary.',
      },
      {
        fuel: 'DIESEL',
        direction: 'UP',
        recommendation: 'FILL_UP',
        confidence: diesel,
        summary: 'DIESEL summary.',
      },
    ],
    sources: [
      { title: 'A', url: 'https://a.example/x', accessedAt: '2026-09-17T08:00:00Z' },
      { title: 'B', url: 'https://b.example/x', accessedAt: '2026-09-17T08:01:00Z' },
      { title: 'C', url: 'https://c.example/x', accessedAt: '2026-09-17T08:02:00Z' },
    ],
  };
}

describe('needsResearchEscalation', () => {
  it('escalates when confidence is just below threshold', () => {
    expect(needsResearchEscalation(forecastWithConfidences(0.749, 0.8))).toBe(true);
  });

  it('does not escalate when confidence equals threshold', () => {
    expect(needsResearchEscalation(forecastWithConfidences(0.75, 0.75))).toBe(false);
  });

  it('escalates when only one fuel is below threshold', () => {
    expect(needsResearchEscalation(forecastWithConfidences(0.66, 0.82))).toBe(true);
  });

  it('does not escalate when both fuels are at or above threshold', () => {
    expect(needsResearchEscalation(forecastWithConfidences(0.75, 0.9))).toBe(false);
  });
});

describe('formatLowConfidenceFuels', () => {
  it('formats fuels below threshold', () => {
    expect(formatLowConfidenceFuels(forecastWithConfidences(0.66, 0.82))).toBe(
      'PB95 66% < 75%',
    );
  });

  it('formats multiple low-confidence fuels', () => {
    expect(formatLowConfidenceFuels(forecastWithConfidences(0.66, 0.58))).toBe(
      'PB95 66% < 75%, DIESEL 58% < 75%',
    );
  });
});

describe('CONFIDENCE_ESCALATION_THRESHOLD', () => {
  it('is 0.75', () => {
    expect(CONFIDENCE_ESCALATION_THRESHOLD).toBe(0.75);
  });
});
