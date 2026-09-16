import { describe, expect, it } from 'vitest';
import { validateForecast } from '../../agents/review/validate-forecast';
import type { Forecast } from '../../src/domain/forecast';

const now = new Date('2026-09-16T12:00:00Z');

function baseForecast(overrides: Partial<Forecast> = {}): Forecast {
  return {
    asOf: '2026-09-16T05:30:00Z',
    market: 'PL',
    horizonDays: 7,
    fuels: [
      {
        fuel: 'PB95',
        direction: 'UP',
        recommendation: 'FILL_UP',
        confidence: 0.72,
        summary: 'Hurt wskazuje wzrost.',
      },
      {
        fuel: 'DIESEL',
        direction: 'STABLE',
        recommendation: 'NORMAL',
        confidence: 0.58,
        summary: 'Sygnały mieszane.',
      },
    ],
    sources: [
      { title: 'A', url: 'https://a.example/x', accessedAt: '2026-09-16T05:20:00Z' },
      { title: 'B', url: 'https://b.example/x', accessedAt: '2026-09-16T05:21:00Z' },
      { title: 'C', url: 'https://c.example/x', accessedAt: '2026-09-16T05:22:00Z' },
    ],
    ...overrides,
  };
}

describe('validateForecast', () => {
  it('accepts a valid forecast', () => {
    expect(validateForecast(baseForecast(), now)).toEqual([]);
  });

  it('flags missing fuel', () => {
    const issues = validateForecast(
      baseForecast({
        fuels: [
          {
            fuel: 'PB95',
            direction: 'UP',
            recommendation: 'FILL_UP',
            confidence: 0.7,
            summary: 'OK.',
          },
          {
            fuel: 'PB95',
            direction: 'STABLE',
            recommendation: 'NORMAL',
            confidence: 0.5,
            summary: 'OK.',
          },
        ],
      }),
      now,
    );
    expect(issues.some((issue) => issue.code === 'MISSING_FUEL')).toBe(true);
    expect(issues.some((issue) => issue.code === 'DUPLICATE_FUEL')).toBe(true);
  });

  it('flags insufficient sources', () => {
    const issues = validateForecast(
      baseForecast({
        sources: [
          { title: 'A', url: 'https://a.example/x', accessedAt: '2026-09-16T05:20:00Z' },
          { title: 'B', url: 'https://b.example/x', accessedAt: '2026-09-16T05:21:00Z' },
        ],
      }),
      now,
    );
    expect(issues.some((issue) => issue.code === 'INSUFFICIENT_SOURCES')).toBe(true);
  });

  it('flags insufficient source hosts', () => {
    const issues = validateForecast(
      baseForecast({
        sources: [
          { title: 'A', url: 'https://a.example/1', accessedAt: '2026-09-16T05:20:00Z' },
          { title: 'B', url: 'https://a.example/2', accessedAt: '2026-09-16T05:21:00Z' },
          { title: 'C', url: 'https://a.example/3', accessedAt: '2026-09-16T05:22:00Z' },
        ],
      }),
      now,
    );
    expect(issues.some((issue) => issue.code === 'INSUFFICIENT_HOSTS')).toBe(true);
  });

  it('flags invalid confidence', () => {
    const issues = validateForecast(
      baseForecast({
        fuels: [
          {
            fuel: 'PB95',
            direction: 'UP',
            recommendation: 'FILL_UP',
            confidence: 1.2,
            summary: 'Bad.',
          },
          {
            fuel: 'DIESEL',
            direction: 'STABLE',
            recommendation: 'NORMAL',
            confidence: 0.5,
            summary: 'OK.',
          },
        ],
      }),
      now,
    );
    expect(issues.some((issue) => issue.code === 'INVALID_CONFIDENCE')).toBe(true);
  });

  it('flags wrong horizon', () => {
    const forecast = baseForecast();
    (forecast as { horizonDays: number }).horizonDays = 5;
    const issues = validateForecast(forecast, now);
    expect(issues.some((issue) => issue.code === 'INVALID_HORIZON')).toBe(true);
  });

  it('flags stale asOf', () => {
    const issues = validateForecast(
      baseForecast({ asOf: '2026-09-14T05:30:00Z' }),
      now,
    );
    expect(issues.some((issue) => issue.code === 'STALE_AS_OF')).toBe(true);
  });
});
