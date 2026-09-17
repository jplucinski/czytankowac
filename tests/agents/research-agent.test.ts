import { describe, expect, it, vi } from 'vitest';
import { createResearchAgent, runResearch } from '../../agents/research/research-agent';
import { RESEARCH_DEEP_PROMPT, RESEARCH_PROMPT } from '../../agents/shared/prompts';
import type { Forecast } from '../../src/domain/forecast';

function forecastWithConfidences(pb95: number, diesel: number, asOf = '2026-09-17T09:00:00Z'): Forecast {
  return {
    asOf,
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

describe('createResearchAgent', () => {
  it('uses cheap prompt and one web search tool', () => {
    const agent = createResearchAgent('cheap');

    expect(agent.instructions).toBe(RESEARCH_PROMPT);
    expect(agent.tools).toHaveLength(1);
    expect(agent.tools[0]?.type).toBe('hosted_tool');
  });

  it('uses deep prompt and one web search tool', () => {
    const agent = createResearchAgent('deep');

    expect(agent.instructions).toBe(RESEARCH_DEEP_PROMPT);
    expect(agent.tools).toHaveLength(1);
    expect(agent.tools[0]?.type).toBe('hosted_tool');
  });
});

describe('runResearch', () => {
  const now = new Date('2026-09-17T09:00:00.000Z');

  it('runs only cheap path when both fuels meet confidence threshold', async () => {
    const cheapForecast = forecastWithConfidences(0.8, 0.9, now.toISOString());
    const runAgent = vi.fn().mockResolvedValue({ finalOutput: cheapForecast });

    const result = await runResearch(now, { runAgent });

    expect(runAgent).toHaveBeenCalledTimes(1);
    expect(result).toEqual(cheapForecast);
  });

  it('runs deep path when any fuel is below confidence threshold', async () => {
    const cheapForecast = forecastWithConfidences(0.66, 0.82, now.toISOString());
    const deepForecast = forecastWithConfidences(0.78, 0.85, now.toISOString());
    const runAgent = vi
      .fn()
      .mockResolvedValueOnce({ finalOutput: cheapForecast })
      .mockResolvedValueOnce({ finalOutput: deepForecast });

    const result = await runResearch(now, { runAgent });

    expect(runAgent).toHaveBeenCalledTimes(2);
    expect(result).toEqual(deepForecast);
  });

  it('passes first forecast JSON to deep prompt', async () => {
    const cheapForecast = forecastWithConfidences(0.66, 0.82, now.toISOString());
    const deepForecast = forecastWithConfidences(0.78, 0.85, now.toISOString());
    const runAgent = vi
      .fn()
      .mockResolvedValueOnce({ finalOutput: cheapForecast })
      .mockResolvedValueOnce({ finalOutput: deepForecast });

    await runResearch(now, { runAgent });

    const deepPrompt = runAgent.mock.calls[1]?.[1] as string;
    expect(deepPrompt).toContain(JSON.stringify(cheapForecast, null, 2));
    expect(deepPrompt).toContain('PB95 66% < 75%');
  });

  it('throws when agent returns no output', async () => {
    const runAgent = vi.fn().mockResolvedValue({ finalOutput: null });

    await expect(runResearch(now, { runAgent })).rejects.toThrow(
      'Research agent returned no output',
    );
  });
});
