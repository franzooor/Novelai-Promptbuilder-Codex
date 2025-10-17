import { contextBridge, ipcRenderer } from 'electron';
import type { SendPayload } from '../src/types/models';

type SelectorMap = Record<string, string>;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let fallbackSelectors: SelectorMap = {};

ipcRenderer.invoke('selectors:load').then((selectors: SelectorMap) => {
  fallbackSelectors = selectors ?? {};
});

const queryAll = <T extends Element>(selector: string): T[] =>
  Array.from(document.querySelectorAll(selector)) as T[];

const matchLabel = (element: HTMLElement, hint: string) => {
  const target = hint.toLowerCase();
  const aria = (element.getAttribute('aria-label') ?? '').toLowerCase();
  if (aria.includes(target)) return true;
  const placeholder = (element.getAttribute('placeholder') ?? '').toLowerCase();
  if (placeholder.includes(target)) return true;
  const label = element.closest('label');
  if (label && (label.textContent ?? '').toLowerCase().includes(target)) return true;
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl && (labelEl.textContent ?? '').toLowerCase().includes(target)) return true;
  }
  return false;
};

const fuzzyFindPrompt = (hints: string[]): HTMLTextAreaElement | null => {
  const areas = queryAll<HTMLTextAreaElement>('textarea');
  for (const hint of hints) {
    const match = areas.find((area) => matchLabel(area, hint));
    if (match) return match;
  }
  for (const area of areas) {
    if ((area.getAttribute('name') ?? '').toLowerCase().includes('prompt')) {
      return area;
    }
  }
  const fallback = hints.map((hint) => fallbackSelectors[hint]).find(Boolean);
  if (fallback) {
    const element = document.querySelector(fallback);
    if (element instanceof HTMLTextAreaElement) return element;
  }
  return null;
};

const setValue = (element: HTMLTextAreaElement | HTMLInputElement, value: string | number) => {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')?.set;
  if (setter) {
    setter.call(element, value);
  } else {
    (element as HTMLTextAreaElement).value = value as string;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
};

const ensureCharacterSlots = async (count: number) => {
  if (count <= 0) return;
  const getCharacterAreas = () =>
    queryAll<HTMLTextAreaElement>('textarea').filter((area) => matchLabel(area, 'character'));

  let existing = getCharacterAreas().length;
  if (existing >= count) return;

  const addButton = queryAll<HTMLButtonElement>('button').find((button) =>
    /add character/i.test(button.textContent ?? '')
  );
  while (existing < count && addButton) {
    addButton.click();
    await wait(300);
    existing = getCharacterAreas().length;
  }
};

const setCharacterText = async (index: number, text: string) => {
  const areas = queryAll<HTMLTextAreaElement>('textarea').filter((area) => matchLabel(area, 'character'));
  const area = areas[index];
  if (!area) return false;
  setValue(area, text);
  return true;
};

const setSliderByLabel = (labelLike: string, value: number) => {
  const inputs = queryAll<HTMLInputElement>('input[type="range"], input[type="number"]');
  const target = inputs.find((input) => matchLabel(input, labelLike));
  if (target) {
    setValue(target, value);
    return true;
  }
  return false;
};

const setDropdownByLabel = (labelLike: string, matcher: (text: string) => boolean) => {
  const selects = queryAll<HTMLSelectElement>('select');
  for (const select of selects) {
    if (!matchLabel(select, labelLike)) continue;
    const option = Array.from(select.options).find((opt) => matcher(opt.textContent ?? ''));
    if (option) {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }
  const buttons = queryAll<HTMLButtonElement>('button');
  for (const button of buttons) {
    if (!matchLabel(button, labelLike)) continue;
    button.click();
    const menuItems = queryAll<HTMLDivElement>('[role="menuitem"], [role="option"]');
    const item = menuItems.find((element) => matcher(element.textContent ?? ''));
    if (item instanceof HTMLElement) {
      item.click();
      return true;
    }
  }
  return false;
};

const setResolution = async (width: number, height: number) => {
  const widthSet = setSliderByLabel('width', width);
  const heightSet = setSliderByLabel('height', height);
  return widthSet || heightSet;
};

const fillPrompts = (payload: SendPayload) => {
  const positive = fuzzyFindPrompt(['positive', 'prompt', 'main prompt']);
  const negative = fuzzyFindPrompt(['negative', 'negative prompt']);
  if (positive) setValue(positive, payload.positive);
  if (negative && payload.negative) setValue(negative, payload.negative);
};

const applySettings = async (payload: SendPayload) => {
  if (!payload.settings) return;
  const { cfg, steps, sampler, width, height } = payload.settings;
  if (cfg !== undefined) setSliderByLabel('cfg', cfg);
  if (steps !== undefined) setSliderByLabel('steps', steps);
  if (sampler) setDropdownByLabel('sampler', (text) => text.toLowerCase().includes(sampler.toLowerCase()));
  if (width !== undefined && height !== undefined) await setResolution(width, height);
};

const inject = async (payload: SendPayload) => {
  fillPrompts(payload);
  if (payload.characters?.length) {
    await ensureCharacterSlots(payload.characters.length);
    for (const [index, character] of payload.characters.entries()) {
      await setCharacterText(index, character.tags.join(', '));
    }
  }
  await applySettings(payload);
  if (payload.autoGenerate) {
    const generateButton = queryAll<HTMLButtonElement>('button').find((button) =>
      /(generate|start)/i.test(button.textContent ?? '')
    );
    generateButton?.click();
  }
  ipcRenderer.send('nai:status', 'injection-complete');
};

contextBridge.exposeInMainWorld('__NAI_BRIDGE', {
  inject,
  fuzzyFindPrompt,
  setSliderByLabel,
  setDropdownByLabel,
  setResolution,
  ensureCharacterSlots,
  setCharacterText
});
