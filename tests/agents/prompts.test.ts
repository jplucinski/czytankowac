import { describe, expect, it } from 'vitest';
import {
  RESEARCH_DEEP_PROMPT,
  RESEARCH_DEEP_PROMPT_MAX_CHARS,
  RESEARCH_DEEP_SEARCH_OPTIONS,
  RESEARCH_PROMPT,
  RESEARCH_PROMPT_MAX_CHARS,
  RESEARCH_SEARCH_OPTIONS,
  REVIEW_PROMPT,
  REVIEW_PROMPT_MAX_CHARS,
  REVIEW_SEARCH_OPTIONS,
} from '../../agents/shared/prompts';

describe('agent prompts', () => {
  it('keeps research prompt within budget', () => {
    expect(RESEARCH_PROMPT.length).toBeLessThanOrEqual(RESEARCH_PROMPT_MAX_CHARS);
  });

  it('keeps deep research prompt within budget', () => {
    expect(RESEARCH_DEEP_PROMPT.length).toBeLessThanOrEqual(RESEARCH_DEEP_PROMPT_MAX_CHARS);
  });

  it('keeps review prompt within budget', () => {
    expect(REVIEW_PROMPT.length).toBeLessThanOrEqual(REVIEW_PROMPT_MAX_CHARS);
  });

  it('uses low search context for cheap research and review', () => {
    expect(RESEARCH_SEARCH_OPTIONS.searchContextSize).toBe('low');
    expect(REVIEW_SEARCH_OPTIONS.searchContextSize).toBe('low');
  });

  it('uses high search context for deep research', () => {
    expect(RESEARCH_DEEP_SEARCH_OPTIONS.searchContextSize).toBe('high');
  });

  it('caps cheap research at 2 web searches', () => {
    expect(RESEARCH_PROMPT).toContain('max 2 wyszukiwania web');
  });

  it('caps deep research at 6 web searches', () => {
    expect(RESEARCH_DEEP_PROMPT).toContain('max 6 wyszukiwań web');
  });
});
