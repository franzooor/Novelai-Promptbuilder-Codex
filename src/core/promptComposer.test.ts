import { describe, it, expect } from 'vitest';
import { composePositivePrompt, cleanPromptDuplicates } from './promptComposer';
import type { Character } from '../types/models';

describe('composePositivePrompt', () => {
  it('creates subject tokens based on characters', () => {
    const characters: Character[] = [
      { id: '1', gender: 'female', tags: ['red hair', 'blue eyes'] },
      { id: '2', gender: 'male', tags: ['armor'] }
    ];
    const result = composePositivePrompt({
      sceneTags: ['masterpiece', 'night'],
      characters,
      extraPositive: 'dramatic lighting'
    });
    expect(result).toContain('masterpiece');
    expect(result).toContain('night');
    expect(result).toContain('1girl');
    expect(result).toContain('1boy');
    expect(result).toContain('multiple people');
    expect(result).toContain('(character 1');
    expect(result).toContain('(character 2');
  });
});

describe('cleanPromptDuplicates', () => {
  it('removes duplicates across prompts', () => {
    const cleaned = cleanPromptDuplicates('red hair, blue eyes, red hair', 'red hair, bad hands', ['red hair, hero']);
    expect(cleaned.positive).toBe('red hair, blue eyes');
    expect(cleaned.negative).toBe('bad hands');
    expect(cleaned.characters[0]).toBe('hero');
  });
});
