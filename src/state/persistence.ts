import type { PersistedBundle } from '../bridge';

export const STORAGE_KEYS = {
  tags: 'libraries/user-tags.json',
  customTags: 'libraries/custom-tags.json',
  favorites: 'libraries/favorites.json',
  characters: 'characters/profiles.json',
  history: 'history/history.json',
  settings: 'config/settings.json',
  selectors: 'config/selectors.json',
  templates: 'libraries/templates.json',
  negativePresets: 'libraries/negative-presets.json',
  stylePresets: 'libraries/style-presets.json'
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];


function ensureBridge(): typeof window.bridge | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.bridge ?? null;
}

export async function readStorage<T>(key: StorageKey, fallback: T): Promise<T> {
  const bridge = ensureBridge();
  if (!bridge) {
    return fallback;
  }
  try {
    const value = (await bridge.storage.read(key)) as T | undefined;
    if (value === undefined || value === null) {
      return fallback;
    }
    return value;
  } catch (error) {
    console.error('Failed to read storage', key, error);
    return fallback;
  }
}

export async function writeStorage<T>(key: StorageKey, value: T): Promise<void> {
  const bridge = ensureBridge();
  if (!bridge) return;
  try {
    await bridge.storage.write(key, value);
  } catch (error) {
    console.error('Failed to write storage', key, error);
  }
}

export async function exportBundle(): Promise<string | null> {
  const bridge = ensureBridge();
  if (!bridge) return null;
  return bridge.storage.exportBundle();
}

export async function importBundle(data: string): Promise<void> {
  const bridge = ensureBridge();
  if (!bridge) return;
  await bridge.storage.importBundle(data);
}

export async function readPersistedBundle(): Promise<PersistedBundle | null> {
  const bridge = ensureBridge();
  if (!bridge) return null;
  const payload = await bridge.storage.read('bundle.json');
  return (payload as PersistedBundle) ?? null;
}
