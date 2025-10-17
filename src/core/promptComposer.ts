import type { Character } from '../types/models';

export type ComposeOptions = {
  sceneTags: string[];
  characters: Character[];
  extraPositive?: string;
  includeCharacterDetails?: boolean;
  dedupe?: boolean;
};

const dedupeList = (items: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of items) {
    const normalized = raw.trim().replace(/,+$/g, '');
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
};

const formatCharacterDetails = (character: Character, index: number): string => {
  const label = character.label ? `character ${index + 1} (${character.label})` : `character ${index + 1}`;
  const tags = dedupeList(character.tags ?? []);
  if (!tags.length) return '';
  return `(${label}: ${tags.join(', ')})`;
};

const getSubjectTokens = (characters: Character[]): string[] => {
  if (!characters.length) return [];
  let female = 0;
  let male = 0;
  let other = 0;
  for (const character of characters) {
    switch (character.gender) {
      case 'female':
        female += 1;
        break;
      case 'male':
        male += 1;
        break;
      case 'nonbinary':
      case 'unknown':
      default:
        other += 1;
    }
  }

  const tokens: string[] = [];
  if (female && !male && !other) {
    tokens.push(female === 1 ? '1girl' : `${female}girls`);
  } else if (male && !female && !other) {
    tokens.push(male === 1 ? '1boy' : `${male}boys`);
  } else if (other && !female && !male) {
    tokens.push(other === 1 ? '1person' : `${other}people`);
  } else {
    if (female) tokens.push(female === 1 ? '1girl' : `${female}girls`);
    if (male) tokens.push(male === 1 ? '1boy' : `${male}boys`);
    if (other) tokens.push(other === 1 ? '1person' : `${other}people`);
    if (female + male + other >= 2) tokens.push('multiple people');
  }

  return tokens;
};

export const composePositivePrompt = ({
  sceneTags,
  characters,
  extraPositive,
  includeCharacterDetails = true,
  dedupe = true
}: ComposeOptions): string => {
  const subjectTokens = getSubjectTokens(characters);
  const baseTags = [...sceneTags, ...subjectTokens];
  if (extraPositive) baseTags.push(extraPositive);
  const characterGroups = includeCharacterDetails
    ? characters
        .map((character, index) => formatCharacterDetails(character, index))
        .filter(Boolean)
    : [];
  const combined = [...baseTags, ...characterGroups];
  const cleaned = dedupe ? dedupeList(combined) : combined;
  return cleaned.join(', ');
};

export const cleanPromptDuplicates = (
  positive: string,
  negative?: string,
  characterTexts?: string[]
) => {
  const tokenize = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const positiveTokens = tokenize(positive);
  const negativeTokens = negative ? tokenize(negative) : [];

  const seen = new Set<string>();
  const keep = (tokens: string[]) =>
    tokens.filter((token) => {
      const key = token.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return {
    positive: keep(positiveTokens).join(', '),
    negative: keep(negativeTokens).join(', '),
    characters: characterTexts?.map((text) => keep(tokenize(text)).join(', ')) ?? []
  };
};
