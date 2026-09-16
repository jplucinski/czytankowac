import type { Forecast } from '../../src/domain/forecast';

export type ValidationIssueCode =
  | 'MISSING_FUEL'
  | 'DUPLICATE_FUEL'
  | 'INSUFFICIENT_SOURCES'
  | 'INSUFFICIENT_HOSTS'
  | 'INVALID_CONFIDENCE'
  | 'INVALID_HORIZON'
  | 'STALE_AS_OF';

export type ValidationIssue = {
  code: ValidationIssueCode;
  message: string;
};

const REQUIRED_FUELS = ['PB95', 'DIESEL'] as const;
const STALE_MS = 36 * 60 * 60 * 1000;

function distinctHosts(sources: Forecast['sources']): number {
  const hosts = new Set<string>();
  for (const source of sources) {
    try {
      hosts.add(new URL(source.url).hostname);
    } catch {
      // invalid URLs are caught by schema parsing earlier
    }
  }
  return hosts.size;
}

export function validateForecast(forecast: Forecast, now: Date): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const fuels = forecast.fuels.map((entry) => entry.fuel);
  const fuelSet = new Set(fuels);

  if (fuelSet.size !== fuels.length) {
    issues.push({
      code: 'DUPLICATE_FUEL',
      message: 'Forecast contains duplicate fuel entries',
    });
  }

  for (const fuel of REQUIRED_FUELS) {
    if (!fuelSet.has(fuel)) {
      issues.push({
        code: 'MISSING_FUEL',
        message: `Missing required fuel: ${fuel}`,
      });
    }
  }

  if (forecast.sources.length < 3) {
    issues.push({
      code: 'INSUFFICIENT_SOURCES',
      message: 'Forecast must include at least 3 sources',
    });
  }

  if (distinctHosts(forecast.sources) < 2) {
    issues.push({
      code: 'INSUFFICIENT_HOSTS',
      message: 'Forecast must include sources from at least 2 distinct hosts',
    });
  }

  if (forecast.horizonDays !== 7) {
    issues.push({
      code: 'INVALID_HORIZON',
      message: 'horizonDays must be exactly 7',
    });
  }

  for (const fuel of forecast.fuels) {
    if (fuel.confidence < 0 || fuel.confidence > 1) {
      issues.push({
        code: 'INVALID_CONFIDENCE',
        message: `Confidence for ${fuel.fuel} must be between 0 and 1`,
      });
    }
  }

  const asOfMs = Date.parse(forecast.asOf);
  if (Number.isNaN(asOfMs) || now.getTime() - asOfMs > STALE_MS) {
    issues.push({
      code: 'STALE_AS_OF',
      message: 'asOf timestamp is older than 36 hours',
    });
  }

  return issues;
}
