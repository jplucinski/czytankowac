import { persistForecast } from '../shared/files';
import { runResearch } from './research-agent';

function formatFuelLog(fuel: { fuel: string; recommendation: string; confidence: number }): string {
  const pct = Math.round(fuel.confidence * 100);
  return `${fuel.fuel}: ${fuel.recommendation} (${pct}%)`;
}

async function main(): Promise<void> {
  const now = new Date();
  const forecast = await runResearch(now);
  const { latestPath, historyPath } = await persistForecast(forecast);

  console.log(forecast.fuels.map(formatFuelLog).join(' | '));
  console.log(`Saved: ${latestPath}, ${historyPath}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Research failed: ${message}`);
  process.exit(1);
});
