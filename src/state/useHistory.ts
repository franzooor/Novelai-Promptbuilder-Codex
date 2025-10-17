import { create } from 'zustand';
import { nanoid } from 'nanoid/non-secure';
import type { HistoryEntry } from '../types/models';
import { readStorage, writeStorage, STORAGE_KEYS } from './persistence';

type HistoryState = {
  entries: HistoryEntry[];
  search: string;
  loading: boolean;
  initialize: () => Promise<void>;
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'createdAt'>) => Promise<HistoryEntry>;
  reuseEntry: (id: string) => HistoryEntry | null;
  setSearch: (value: string) => void;
};

export const useHistory = create<HistoryState>((set, get) => ({
  entries: [],
  search: '',
  loading: false,
  initialize: async () => {
    if (get().loading) return;
    set({ loading: true });
    const entries = await readStorage<HistoryEntry[]>(STORAGE_KEYS.history, []);
    set({ entries, loading: false });
  },
  addEntry: async (entry) => {
    const newEntry: HistoryEntry = {
      id: nanoid(),
      createdAt: new Date().toISOString(),
      ...entry
    };
    const entries = [newEntry, ...get().entries].slice(0, 200);
    set({ entries });
    await writeStorage(STORAGE_KEYS.history, entries);
    return newEntry;
  },
  reuseEntry: (id) => get().entries.find((entry) => entry.id === id) ?? null,
  setSearch: (value) => set({ search: value })
}));

export const filteredHistorySelector = (state: HistoryState) => {
  if (!state.search) return state.entries;
  const query = state.search.toLowerCase();
  return state.entries.filter((entry) =>
    [entry.positive, entry.negative, entry.characters.map((c) => c.label).join(' ')]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(query))
  );
};
