import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Forecast } from '../../src/domain/forecast';

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function persistForecast(
  forecast: Forecast,
  root = process.cwd(),
): Promise<{ latestPath: string; historyPath: string }> {
  const dataDir = path.join(root, 'src', 'data');
  const historyDir = path.join(dataDir, 'history');
  await mkdir(historyDir, { recursive: true });

  const payload = `${JSON.stringify(forecast, null, 2)}\n`;
  const latestPath = path.join(dataDir, 'latest.json');
  const historyPath = path.join(historyDir, `${formatDateKey(new Date(forecast.asOf))}.json`);

  await writeFile(latestPath, payload, 'utf8');
  await writeFile(historyPath, payload, 'utf8');

  return { latestPath, historyPath };
}
