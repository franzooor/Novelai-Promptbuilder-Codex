import type { SendPayload, PromptTemplate, NegativePreset, StylePreset, Character, Tag, HistoryEntry } from './types/models';

declare global {
  interface Window {
    bridge: {
      sendToNAI: (payload: SendPayload) => Promise<void>;
      focusNovelAI: () => Promise<void>;
      randomizeSettings: (profile: string | null) => Promise<SendPayload['settings'] | null>;
      storage: {
        read: (key: string) => Promise<unknown>;
        write: (key: string, value: unknown) => Promise<void>;
        exportBundle: () => Promise<string | null>;
        importBundle: (data: string) => Promise<void>;
      };
      onNaiStatus: (cb: (status: string) => void) => () => void;
    };
  }
}

export type PersistedBundle = {
  tags?: Tag[];
  customTags?: Tag[];
  favorites?: string[];
  characters?: Character[];
  history?: HistoryEntry[];
  templates?: PromptTemplate[];
  negativePresets?: NegativePreset[];
  stylePresets?: StylePreset[];
  settings?: SendPayload['settings'];
};

export {};
