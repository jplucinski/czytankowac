import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ForecastSchema } from '../../src/domain/forecast';

const validForecast = {
  asOf: '2026-09-16T05:30:00Z',
  market: 'PL',
  horizonDays: 7,
  fuels: [
    {
      fuel: 'PB95',
      direction: 'UP',
      recommendation: 'FILL_UP',
      confidence: 0.72,
      summary: 'Wholesale and currency signals point upward.',
    },
    {
      fuel: 'DIESEL',
      direction: 'STABLE',
      recommendation: 'NORMAL',
      confidence: 0.58,
      summary: 'Signals are mixed.',
    },
  ],
  sources: [
    { title: 'A', url: 'https://a.example/x', accessedAt: '2026-09-16T05:20:00Z' },
    { title: 'B', url: 'https://b.example/x', accessedAt: '2026-09-16T05:21:00Z' },
    { title: 'C', url: 'https://c.example/x', accessedAt: '2026-09-16T05:22:00Z' },
  ],
};

describe('ForecastSchema', () => {
  it('accepts one PB95 and one DIESEL forecast', () => {
    const result = ForecastSchema.safeParse({
      asOf: '2026-09-16T05:30:00Z',
      market: 'PL',
      horizonDays: 7,
      fuels: [
        {
          fuel: 'PB95',
          direction: 'UP',
          recommendation: 'FILL_UP',
          confidence: 0.72,
          summary: 'Wholesale and currency signals point upward.',
        },
        {
          fuel: 'DIESEL',
          direction: 'STABLE',
          recommendation: 'NORMAL',
          confidence: 0.58,
          summary: 'Signals are mixed.',
        },
      ],
      sources: [
        { title: 'A', url: 'https://a.example/x', accessedAt: '2026-09-16T05:20:00Z' },
        { title: 'B', url: 'https://b.example/x', accessedAt: '2026-09-16T05:21:00Z' },
        { title: 'C', url: 'https://c.example/x', accessedAt: '2026-09-16T05:22:00Z' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects confidence outside 0..1', () => {
    const result = ForecastSchema.safeParse({
      asOf: '2026-09-16T05:30:00Z',
      market: 'PL',
      horizonDays: 7,
      fuels: [
        {
          fuel: 'PB95',
          direction: 'UP',
          recommendation: 'FILL_UP',
          confidence: 1.5,
          summary: 'Invalid confidence.',
        },
        {
          fuel: 'DIESEL',
          direction: 'STABLE',
          recommendation: 'NORMAL',
          confidence: 0.5,
          summary: 'OK.',
        },
      ],
      sources: [
        { title: 'A', url: 'https://a.example/x', accessedAt: '2026-09-16T05:20:00Z' },
        { title: 'B', url: 'https://b.example/x', accessedAt: '2026-09-16T05:21:00Z' },
        { title: 'C', url: 'https://c.example/x', accessedAt: '2026-09-16T05:22:00Z' },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('does not emit JSON Schema format uri for source urls', () => {
    const schema = z.toJSONSchema(ForecastSchema);
    expect(JSON.stringify(schema)).not.toMatch(/"format"\s*:\s*"uri"/);
  });

  it('rejects invalid source urls', () => {
    const result = ForecastSchema.safeParse({
      ...validForecast,
      sources: [
        { title: 'A', url: 'not-a-url', accessedAt: '2026-09-16T05:20:00Z' },
        { title: 'B', url: 'https://b.example/x', accessedAt: '2026-09-16T05:21:00Z' },
        { title: 'C', url: 'https://c.example/x', accessedAt: '2026-09-16T05:22:00Z' },
      ],
    });
    expect(result.success).toBe(false);
  });
});
