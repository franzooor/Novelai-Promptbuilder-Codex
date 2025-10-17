import { create } from 'zustand';
import type { PromptTemplate, NegativePreset, StylePreset, SendPayload } from '../types/models';
import { readStorage, writeStorage, STORAGE_KEYS } from './persistence';
import presets from '../data/presets.json';
import { DEFAULT_RANDOM_PROFILES } from '../core/randomizer';

type SettingsState = {
  positiveInput: string;
  negativeInput: string;
  autoGenerate: boolean;
  duplicateCleaner: boolean;
  selectedProfile: keyof typeof DEFAULT_RANDOM_PROFILES | 'custom';
  settingsOverrides: SendPayload['settings'];
  templates: PromptTemplate[];
  negativePresets: NegativePreset[];
  stylePresets: StylePreset[];
  tokenCounts: { positive: number; negative: number };
  lastRandomized: SendPayload['settings'] | null;
  initialize: () => Promise<void>;
  setPositiveInput: (value: string) => void;
  setNegativeInput: (value: string) => void;
  setAutoGenerate: (value: boolean) => void;
  setDuplicateCleaner: (value: boolean) => void;
  setSelectedProfile: (value: SettingsState['selectedProfile']) => void;
  setSettingsOverrides: (value: SendPayload['settings']) => void;
  setLastRandomized: (value: SendPayload['settings'] | null) => void;
  saveTemplate: (template: PromptTemplate) => void;
  deleteTemplate: (id: string) => void;
  applyTemplate: (id: string) => PromptTemplate | null;
  applyNegativePreset: (id: string) => NegativePreset | null;
  applyStylePreset: (id: string) => StylePreset | null;
  updateTokenCounts: (positive: string, negative: string) => void;
};

type PresetFile = {
  styles: StylePreset[];
  negative: NegativePreset[];
  templates: PromptTemplate[];
};

const presetData = presets as PresetFile;

function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.split(/\s+/).join(' ').length / 4.2);
}

export const useSettings = create<SettingsState>((set, get) => ({
  positiveInput: '',
  negativeInput: '',
  autoGenerate: false,
  duplicateCleaner: true,
  selectedProfile: 'strict',
  settingsOverrides: {},
  templates: presetData.templates ?? [],
  negativePresets: presetData.negative ?? [],
  stylePresets: presetData.styles ?? [],
  tokenCounts: { positive: 0, negative: 0 },
  lastRandomized: null,
  initialize: async () => {
    const [templates, negatives, styles, settings] = await Promise.all([
      readStorage<PromptTemplate[]>(STORAGE_KEYS.templates, presetData.templates ?? []),
      readStorage<NegativePreset[]>(
        STORAGE_KEYS.negativePresets,
        presetData.negative ?? []
      ),
      readStorage<StylePreset[]>(STORAGE_KEYS.stylePresets, presetData.styles ?? []),
      readStorage<SendPayload['settings']>(STORAGE_KEYS.settings, {})
    ]);
    set({ templates, negativePresets: negatives, stylePresets: styles, settingsOverrides: settings });
  },
  setPositiveInput: (value) => {
    set({ positiveInput: value });
    get().updateTokenCounts(value, get().negativeInput);
  },
  setNegativeInput: (value) => {
    set({ negativeInput: value });
    get().updateTokenCounts(get().positiveInput, value);
  },
  setAutoGenerate: (value) => set({ autoGenerate: value }),
  setDuplicateCleaner: (value) => set({ duplicateCleaner: value }),
  setSelectedProfile: (value) => set({ selectedProfile: value }),
  setSettingsOverrides: (value) => {
    set({ settingsOverrides: value });
    void writeStorage(STORAGE_KEYS.settings, value);
  },
  setLastRandomized: (value) => set({ lastRandomized: value }),
  saveTemplate: (template) => {
    const templates = [...get().templates.filter((item) => item.id !== template.id), template];
    set({ templates });
    void writeStorage(STORAGE_KEYS.templates, templates);
  },
  deleteTemplate: (id) => {
    const templates = get().templates.filter((template) => template.id !== id);
    set({ templates });
    void writeStorage(STORAGE_KEYS.templates, templates);
  },
  applyTemplate: (id) => {
    const template = get().templates.find((tpl) => tpl.id === id) ?? null;
    if (template) {
      set({
        positiveInput: template.positive,
        negativeInput: template.negative ?? '',
        settingsOverrides: template.settings ?? {}
      });
      void writeStorage(STORAGE_KEYS.settings, template.settings ?? {});
      get().updateTokenCounts(template.positive, template.negative ?? '');
    }
    return template;
  },
  applyNegativePreset: (id) => {
    const preset = get().negativePresets.find((item) => item.id === id) ?? null;
    if (preset) {
      set({ negativeInput: preset.text });
      get().updateTokenCounts(get().positiveInput, preset.text);
    }
    return preset;
  },
  applyStylePreset: (id) => {
    const preset = get().stylePresets.find((item) => item.id === id) ?? null;
    if (preset) {
      const combinedPositive = preset.tags.join(', ');
      set({
        positiveInput: combinedPositive,
        negativeInput: preset.negative ?? get().negativeInput,
        settingsOverrides: { ...get().settingsOverrides, ...preset.settings }
      });
      void writeStorage(STORAGE_KEYS.settings, {
        ...get().settingsOverrides,
        ...preset.settings
      });
      get().updateTokenCounts(combinedPositive, preset.negative ?? get().negativeInput);
    }
    return preset;
  },
  updateTokenCounts: (positive, negative) => {
    set({
      tokenCounts: {
        positive: estimateTokens(positive),
        negative: estimateTokens(negative)
      }
    });
  }
}));
