import { create } from 'zustand';
import { nanoid } from 'nanoid/non-secure';
import type { Tag } from '../types/models';
import defaultTags from '../data/default-tags.json';
import { readStorage, writeStorage, STORAGE_KEYS } from './persistence';

type TagState = {
  tags: Tag[];
  customTags: Tag[];
  favorites: string[];
  sceneTags: string[];
  search: string;
  loading: boolean;
  initialize: () => Promise<void>;
  setSearch: (value: string) => void;
  toggleSceneTag: (id: string) => void;
  addCustomTag: (label: string, category?: string) => void;
  removeCustomTag: (id: string) => void;
  toggleFavorite: (id: string) => void;
  resetScene: () => void;
};

const DEFAULT_TAGS: Tag[] = defaultTags as Tag[];

export const useTags = create<TagState>((set, get) => ({
  tags: DEFAULT_TAGS,
  customTags: [],
  favorites: [],
  sceneTags: [],
  search: '',
  loading: false,
  initialize: async () => {
    if (get().loading) return;
    set({ loading: true });
    const [custom, favorites] = await Promise.all([
      readStorage<Tag[]>(STORAGE_KEYS.customTags, []),
      readStorage<string[]>(STORAGE_KEYS.favorites, [])
    ]);
    set({
      tags: DEFAULT_TAGS,
      customTags: custom,
      favorites,
      loading: false
    });
  },
  setSearch: (value) => set({ search: value }),
  toggleSceneTag: (id) => {
    const sceneTags = new Set(get().sceneTags);
    if (sceneTags.has(id)) {
      sceneTags.delete(id);
    } else {
      sceneTags.add(id);
    }
    set({ sceneTags: Array.from(sceneTags) });
  },
  addCustomTag: (label, category) => {
    const normalized = label.trim();
    if (!normalized) return;
    const id = normalized.toLowerCase().replace(/\s+/g, '_') || nanoid();
    const tag: Tag = { id, label: normalized, category, favorite: false };
    const customTags = [...get().customTags.filter((t) => t.id !== id), tag];
    set({ customTags });
    void writeStorage(STORAGE_KEYS.customTags, customTags);
  },
  removeCustomTag: (id) => {
    const customTags = get().customTags.filter((tag) => tag.id !== id);
    set({ customTags });
    void writeStorage(STORAGE_KEYS.customTags, customTags);
  },
  toggleFavorite: (id) => {
    const favorites = new Set(get().favorites);
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    const arr = Array.from(favorites);
    set({ favorites: arr });
    void writeStorage(STORAGE_KEYS.favorites, arr);
  },
  resetScene: () => set({ sceneTags: [] })
}));

export const allTagsSelector = (state: TagState) => {
  const favorites = new Set(state.favorites);
  const merged = [...state.tags, ...state.customTags].map((tag) => ({
    ...tag,
    favorite: favorites.has(tag.id)
  }));
  if (!state.search) return merged;
  const query = state.search.toLowerCase();
  return merged.filter((tag) =>
    [tag.label, tag.category, tag.id].some((value) =>
      value?.toLowerCase().includes(query)
    )
  );
};

export const categorizedTagsSelector = (state: TagState) => {
  return allTagsSelector(state).reduce<Record<string, Tag[]>>((acc, tag) => {
    const key = tag.category ?? 'uncategorized';
    acc[key] = acc[key] ?? [];
    acc[key].push(tag);
    return acc;
  }, {});
};
