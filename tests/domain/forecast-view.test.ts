import { describe, expect, it } from 'vitest';
import type { Forecast, FuelForecast } from '../../src/domain/forecast';
import { toCommitSummary, toFuelCardViewModel } from '../../src/domain/forecast-view';

const pb95: FuelForecast = {
  fuel: 'PB95',
  direction: 'UP',
  recommendation: 'FILL_UP',
  confidence: 0.72,
  summary: 'Hurt wskazuje wzrost.',
};

const diesel: FuelForecast = {
  fuel: 'DIESEL',
  direction: 'STABLE',
  recommendation: 'NORMAL',
  confidence: 0.58,
  summary: 'Sygnały mieszane.',
};

describe('toFuelCardViewModel', () => {
  it('maps FILL_UP to Polish headline', () => {
    expect(toFuelCardViewModel(pb95).headline).toBe('Tankuj do pełna');
  });

  it('maps NORMAL to Polish headline', () => {
    expect(toFuelCardViewModel(diesel).headline).toBe('Tankuj normalnie');
  });

  it('maps WAIT to Polish headline', () => {
    expect(
      toFuelCardViewModel({ ...pb95, recommendation: 'WAIT' }).headline,
    ).toBe('Jeśli możesz, poczekaj');
  });

  it('maps direction to Polish subline', () => {
    expect(toFuelCardViewModel(pb95).subline).toBe('Ceny prawdopodobnie wzrosną');
    expect(toFuelCardViewModel(diesel).subline).toBe('Ceny prawdopodobnie bez zmian');
    expect(
      toFuelCardViewModel({ ...pb95, direction: 'DOWN' }).subline,
    ).toBe('Ceny prawdopodobnie spadną');
  });

  it('rounds confidence to percent', () => {
    expect(toFuelCardViewModel({ ...pb95, confidence: 0.724 }).confidencePercent).toBe(72);
    expect(toFuelCardViewModel({ ...pb95, confidence: 0.725 }).confidencePercent).toBe(73);
  });
});

describe('toCommitSummary', () => {
  it('builds Polish verdict summary for both fuels', () => {
    const forecast: Forecast = {
      asOf: '2026-09-16T05:30:00Z',
      market: 'PL',
      horizonDays: 7,
      fuels: [pb95, diesel],
      sources: [
        { title: 'A', url: 'https://a.example/x', accessedAt: '2026-09-16T05:20:00Z' },
        { title: 'B', url: 'https://b.example/x', accessedAt: '2026-09-16T05:21:00Z' },
        { title: 'C', url: 'https://c.example/x', accessedAt: '2026-09-16T05:22:00Z' },
      ],
    };

    expect(toCommitSummary(forecast)).toBe('PB95 tankuj do pełna, diesel normalnie');
  });
});
