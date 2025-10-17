import type { Character, SendPayload } from '../types/models';
import { composePositivePrompt, cleanPromptDuplicates } from './promptComposer';
import { DEFAULT_RANDOM_PROFILES, mergeRandomizedSettings, randomizeFromProfile } from './randomizer';

export type BuildPayloadArgs = {
  sceneTags: string[];
  characters: Character[];
  positiveInput: string;
  negativeInput: string;
  profileKey: keyof typeof DEFAULT_RANDOM_PROFILES | 'custom';
  settingsOverrides?: SendPayload['settings'];
  duplicateCleaner?: boolean;
  autoGenerate?: boolean;
};

export const buildPayload = ({
  sceneTags,
  characters,
  positiveInput,
  negativeInput,
  profileKey,
  settingsOverrides,
  duplicateCleaner = true,
  autoGenerate
}: BuildPayloadArgs): SendPayload => {
  const positive = composePositivePrompt({
    sceneTags,
    characters,
    extraPositive: positiveInput,
    includeCharacterDetails: true
  });

  const profile =
    profileKey === 'custom'
      ? null
      : DEFAULT_RANDOM_PROFILES[profileKey] ?? DEFAULT_RANDOM_PROFILES.strict;

  const randomizedSettings = profile ? randomizeFromProfile(profile) : undefined;
  const mergedSettings = randomizedSettings
    ? mergeRandomizedSettings(randomizedSettings, settingsOverrides)
    : settingsOverrides;

  const characterTexts = characters.map((character) => character.tags.join(', '));
  if (duplicateCleaner) {
    const cleaned = cleanPromptDuplicates(positive, negativeInput, characterTexts);
    return {
      positive: cleaned.positive,
      negative: cleaned.negative,
      settings: mergedSettings,
      characters: characters.map((character, index) => ({
        ...character,
        tags: cleaned.characters[index]?.split(',').map((tag) => tag.trim()).filter(Boolean) ??
          character.tags
      })),
      autoGenerate
    };
  }

  return {
    positive,
    negative: negativeInput,
    settings: mergedSettings,
    characters,
    autoGenerate
  };
};

export const sendToNovelAI = async (payload: SendPayload) => {
  if (typeof window === 'undefined' || !window.bridge) return;
  await window.bridge.sendToNAI(payload);
};
