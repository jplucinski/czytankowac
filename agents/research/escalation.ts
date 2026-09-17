import type { Forecast } from '../../src/domain/forecast';

export const CONFIDENCE_ESCALATION_THRESHOLD = 0.75;

export function needsResearchEscalation(forecast: Forecast): boolean {
  return forecast.fuels.some(
    (fuel) => fuel.confidence < CONFIDENCE_ESCALATION_THRESHOLD,
  );
}

export function formatLowConfidenceFuels(forecast: Forecast): string {
  const thresholdPct = Math.round(CONFIDENCE_ESCALATION_THRESHOLD * 100);
  return forecast.fuels
    .filter((fuel) => fuel.confidence < CONFIDENCE_ESCALATION_THRESHOLD)
    .map((fuel) => `${fuel.fuel} ${Math.round(fuel.confidence * 100)}% < ${thresholdPct}%`)
    .join(', ');
}
