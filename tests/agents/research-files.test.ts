import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { persistForecast } from '../../agents/shared/files';
import type { Forecast } from '../../src/domain/forecast';

const sampleForecast: Forecast = {
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
};

const tempDirs: string[] = [];

afterEach(async () => {
  // temp dirs are left for the OS to clean; tests only read what they wrote
});

describe('persistForecast', () => {
  it('writes latest.json and a date-keyed history file', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'czytankowac-'));
    tempDirs.push(root);

    const { latestPath, historyPath } = await persistForecast(sampleForecast, root);

    const latest = JSON.parse(await readFile(latestPath, 'utf8'));
    const history = JSON.parse(await readFile(historyPath, 'utf8'));

    expect(latest).toEqual(sampleForecast);
    expect(history).toEqual(sampleForecast);
    expect(historyPath).toMatch(/2026-09-16\.json$/);
    expect((await readFile(latestPath, 'utf8')).endsWith('\n')).toBe(true);
  });

  it('does not overwrite unrelated history files', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'czytankowac-'));
    tempDirs.push(root);

    const historyDir = path.join(root, 'src', 'data', 'history');
    await mkdir(historyDir, { recursive: true });
    await writeFile(
      path.join(historyDir, '2026-09-01.json'),
      JSON.stringify({ kept: true }) + '\n',
      'utf8',
    );

    await persistForecast(sampleForecast, root);

    const files = await readdir(historyDir);
    expect(files).toContain('2026-09-01.json');
    expect(files).toContain('2026-09-16.json');

    const old = JSON.parse(await readFile(path.join(historyDir, '2026-09-01.json'), 'utf8'));
    expect(old).toEqual({ kept: true });
  });
});
