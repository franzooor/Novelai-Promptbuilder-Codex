import { create } from 'zustand';
import { nanoid } from 'nanoid/non-secure';
import type { Character } from '../types/models';
import { readStorage, writeStorage, STORAGE_KEYS } from './persistence';

type CharacterState = {
  profiles: Character[];
  active: Character[];
  loading: boolean;
  initialize: () => Promise<void>;
  addActive: (character: Character) => void;
  removeActive: (id: string) => void;
  updateActive: (character: Character) => void;
  clearActive: () => void;
  setActive: (characters: Character[]) => void;
  saveProfile: (character: Character) => void;
  deleteProfile: (id: string) => void;
  applyProfile: (id: string) => void;
};

export const useCharacters = create<CharacterState>((set, get) => ({
  profiles: [],
  active: [],
  loading: false,
  initialize: async () => {
    if (get().loading) return;
    set({ loading: true });
    const profiles = await readStorage<Character[]>(STORAGE_KEYS.characters, []);
    set({ profiles, loading: false });
  },
  addActive: (character) => {
    const id = character.id || nanoid();
    const active = [...get().active.filter((c) => c.id !== id), { ...character, id }];
    set({ active });
  },
  removeActive: (id) => {
    set({ active: get().active.filter((c) => c.id !== id) });
  },
  updateActive: (character) => {
    set({
      active: get().active.map((existing) =>
        existing.id === character.id ? { ...existing, ...character } : existing
      )
    });
  },
  clearActive: () => set({ active: [] }),
  setActive: (characters) => set({ active: characters }),
  saveProfile: (character) => {
    const profiles = [...get().profiles.filter((c) => c.id !== character.id), {
      ...character,
      id: character.id || nanoid()
    }];
    set({ profiles });
    void writeStorage(STORAGE_KEYS.characters, profiles);
  },
  deleteProfile: (id) => {
    const profiles = get().profiles.filter((c) => c.id !== id);
    set({ profiles });
    void writeStorage(STORAGE_KEYS.characters, profiles);
  },
  applyProfile: (id) => {
    const profile = get().profiles.find((c) => c.id === id);
    if (!profile) return;
    const active = [...get().active, { ...profile }];
    set({ active });
  }
}));
