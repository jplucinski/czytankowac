import { describe, expect, it } from 'vitest';
import {
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

  it('keeps review prompt within budget', () => {
    expect(REVIEW_PROMPT.length).toBeLessThanOrEqual(REVIEW_PROMPT_MAX_CHARS);
  });

  it('uses low search context for research and review', () => {
    expect(RESEARCH_SEARCH_OPTIONS.searchContextSize).toBe('low');
    expect(REVIEW_SEARCH_OPTIONS.searchContextSize).toBe('low');
  });
});
