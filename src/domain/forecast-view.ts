import type { Forecast, FuelForecast, Recommendation } from './forecast';

const RECOMMENDATION_HEADLINES: Record<Recommendation, string> = {
  FILL_UP: 'Tankuj do pełna',
  NORMAL: 'Tankuj normalnie',
  WAIT: 'Jeśli możesz, poczekaj',
};

const RECOMMENDATION_COMMIT: Record<Recommendation, string> = {
  FILL_UP: 'tankuj do pełna',
  NORMAL: 'normalnie',
  WAIT: 'poczekaj',
};

const DIRECTION_SUBLINES: Record<FuelForecast['direction'], string> = {
  UP: 'Ceny prawdopodobnie wzrosną',
  STABLE: 'Ceny prawdopodobnie bez zmian',
  DOWN: 'Ceny prawdopodobnie spadną',
};

const FUEL_COMMIT_LABELS: Record<FuelForecast['fuel'], string> = {
  PB95: 'PB95',
  DIESEL: 'diesel',
};

export type FuelCardViewModel = {
  headline: string;
  subline: string;
  confidencePercent: number;
  summary: string;
};

export function toFuelCardViewModel(fuel: FuelForecast): FuelCardViewModel {
  return {
    headline: RECOMMENDATION_HEADLINES[fuel.recommendation],
    subline: DIRECTION_SUBLINES[fuel.direction],
    confidencePercent: Math.round(fuel.confidence * 100),
    summary: fuel.summary,
  };
}

export function toCommitSummary(forecast: Forecast): string {
  return forecast.fuels
    .map(
      (fuel) =>
        `${FUEL_COMMIT_LABELS[fuel.fuel]} ${RECOMMENDATION_COMMIT[fuel.recommendation]}`,
    )
    .join(', ');
}
