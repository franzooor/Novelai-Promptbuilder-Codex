export type Tag = {
  id: string;
  label: string;
  weight?: number;
  category?: string;
  favorite?: boolean;
};

export type Character = {
  id: string;
  label?: string;
  gender?: 'female' | 'male' | 'nonbinary' | 'unknown';
  tags: string[];
};

export type RandomProfile = {
  cfg: { min: number; max: number };
  steps: { min: number; max: number };
  samplerPool: string[];
  resolutions: Array<{ w: number; h: number }>;
  distribution?: 'uniform' | 'triangular';
  label?: string;
  description?: string;
};

export type SendPayload = {
  positive: string;
  negative?: string;
  settings?: {
    cfg?: number;
    steps?: number;
    sampler?: string;
    width?: number;
    height?: number;
  };
  characters?: Character[];
  autoGenerate?: boolean;
};

export type PromptTemplate = {
  id: string;
  name: string;
  positive: string;
  negative?: string;
  settings?: SendPayload['settings'];
  tags?: string[];
};

export type NegativePreset = {
  id: string;
  name: string;
  text: string;
};

export type StylePreset = {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  negative?: string;
  settings?: SendPayload['settings'];
};

export type HistoryEntry = {
  id: string;
  positive: string;
  negative?: string;
  characters: Character[];
  createdAt: string;
  settings?: SendPayload['settings'];
};

export type PersistedState = {
  tags: Tag[];
  customTags: Tag[];
  favorites: string[];
  characters: Character[];
  history: HistoryEntry[];
  templates: PromptTemplate[];
  negativePresets: NegativePreset[];
  stylePresets: StylePreset[];
};
