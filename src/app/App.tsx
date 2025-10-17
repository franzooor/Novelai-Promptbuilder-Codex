import React, { useCallback, useMemo } from 'react';
import { FiSend, FiShuffle, FiCopy, FiExternalLink, FiDownload, FiUpload } from 'react-icons/fi';
import { nanoid } from 'nanoid/non-secure';
import { PromptEditor } from '../ui/PromptEditor';
import { TagLibrary } from '../ui/TagLibrary';
import { CharacterPanel } from '../ui/CharacterPanel';
import { RandomizerPanel } from '../ui/RandomizerPanel';
import { HistoryList } from '../ui/HistoryList';
import { ToastCenter, useToast } from '../ui/ToastCenter';
import { Button } from '../ui/Buttons';
import { useTags } from '../state/useTags';
import { useCharacters } from '../state/useCharacters';
import { useSettings } from '../state/useSettings';
import { useHistory } from '../state/useHistory';
import { buildPayload, sendToNovelAI } from '../core/sendToNAI';
import { DEFAULT_RANDOM_PROFILES, randomizeFromProfile } from '../core/randomizer';
import { useHotkeys } from 'react-hotkeys-hook';
import type { HistoryEntry } from '../types/models';

const useInitialization = () => {
  const initializeTags = useTags((state) => state.initialize);
  const initializeCharacters = useCharacters((state) => state.initialize);
  const initializeSettings = useSettings((state) => state.initialize);
  const initializeHistory = useHistory((state) => state.initialize);

  React.useEffect(() => {
    void initializeTags();
    void initializeCharacters();
    void initializeSettings();
    void initializeHistory();
  }, [initializeTags, initializeCharacters, initializeSettings, initializeHistory]);
};

const getTagLabelById = (id: string, tags: ReturnType<typeof useTags.getState>['tags'], custom: ReturnType<typeof useTags.getState>['customTags']) => {
  const match = [...tags, ...custom].find((tag) => tag.id === id);
  return match?.label ?? id;
};

const AppContent: React.FC = () => {
  useInitialization();
  const { pushToast } = useToast();

  const {
    sceneTags,
    tags,
    customTags
  } = useTags((state) => ({
    sceneTags: state.sceneTags,
    tags: state.tags,
    customTags: state.customTags
  }));

  const { active, setActive } = useCharacters((state) => ({
    active: state.active,
    setActive: state.setActive
  }));

  const {
    positiveInput,
    negativeInput,
    selectedProfile,
    settingsOverrides,
    autoGenerate,
    duplicateCleaner,
    setLastRandomized,
    setPositiveInput,
    setNegativeInput
  } = useSettings((state) => ({
    positiveInput: state.positiveInput,
    negativeInput: state.negativeInput,
    selectedProfile: state.selectedProfile,
    settingsOverrides: state.settingsOverrides,
    autoGenerate: state.autoGenerate,
    duplicateCleaner: state.duplicateCleaner,
    setLastRandomized: state.setLastRandomized,
    setPositiveInput: state.setPositiveInput,
    setNegativeInput: state.setNegativeInput
  }));

  const addHistoryEntry = useHistory((state) => state.addEntry);

  const sceneTagLabels = useMemo(
    () => sceneTags.map((id) => getTagLabelById(id, tags, customTags)),
    [sceneTags, tags, customTags]
  );

  const handleSend = useCallback(async () => {
    try {
      const payload = buildPayload({
        sceneTags: sceneTagLabels,
        characters: active,
        positiveInput,
        negativeInput,
        profileKey: selectedProfile,
        settingsOverrides,
        duplicateCleaner,
        autoGenerate
      });
      await sendToNovelAI(payload);
      await addHistoryEntry({
        positive: payload.positive,
        negative: payload.negative,
        characters: payload.characters ?? [],
        settings: payload.settings
      });
      setLastRandomized(payload.settings ?? null);
      pushToast({ title: 'Prompt sent to NovelAI', variant: 'success' });
    } catch (error) {
      console.error(error);
      pushToast({ title: 'Failed to send prompt', description: String(error), variant: 'error' });
    }
  }, [sceneTagLabels, active, positiveInput, negativeInput, selectedProfile, settingsOverrides, duplicateCleaner, autoGenerate, addHistoryEntry, setLastRandomized, pushToast]);

  const handleRandomize = useCallback(() => {
    const profile = selectedProfile === 'custom' ? DEFAULT_RANDOM_PROFILES.strict : DEFAULT_RANDOM_PROFILES[selectedProfile];
    const randomized = randomizeFromProfile(profile ?? DEFAULT_RANDOM_PROFILES.strict);
    setLastRandomized(randomized);
    pushToast({
      title: 'Settings randomized',
      description: `CFG ${randomized.cfg}, steps ${randomized.steps}, ${randomized.width}×${randomized.height}`,
      variant: 'info'
    });
  }, [selectedProfile, setLastRandomized, pushToast]);

  const handleCopyFinal = useCallback(async () => {
    const payload = buildPayload({
      sceneTags: sceneTagLabels,
      characters: active,
      positiveInput,
      negativeInput,
      profileKey: 'custom',
      settingsOverrides,
      duplicateCleaner: false
    });
    await navigator.clipboard.writeText(payload.positive);
    pushToast({ title: 'Final positive prompt copied', variant: 'success' });
  }, [sceneTagLabels, active, positiveInput, negativeInput, settingsOverrides, duplicateCleaner, pushToast]);

  const handleFocusNovelAI = useCallback(async () => {
    if (!window.bridge) return;
    await window.bridge.focusNovelAI();
  }, []);

  const handleReuseHistory = useCallback(
    (entry: HistoryEntry) => {
      setPositiveInput(entry.positive);
      setNegativeInput(entry.negative ?? '');
      const rebuilt = entry.characters.map((character) => ({
        ...character,
        id: character.id || nanoid()
      }));
      setActive(rebuilt);
      pushToast({ title: 'History entry applied', variant: 'info' });
    },
    [setPositiveInput, setNegativeInput, setActive, pushToast]
  );

  const handleExport = useCallback(async () => {
    if (!window.bridge) return;
    const result = await window.bridge.storage.exportBundle();
    if (result) {
      pushToast({ title: 'Data exported', description: result, variant: 'success' });
    }
  }, [pushToast]);

  const handleImport = useCallback(async () => {
    if (!window.bridge) return;
    await window.bridge.storage.importBundle('');
    await Promise.all([
      useTags.getState().initialize(),
      useCharacters.getState().initialize(),
      useSettings.getState().initialize(),
      useHistory.getState().initialize()
    ]);
    pushToast({ title: 'Import complete', variant: 'success' });
  }, [pushToast]);

  useHotkeys(
    'ctrl+enter, cmd+enter',
    (event) => {
      event.preventDefault();
      void handleSend();
    },
    [handleSend]
  );

  useHotkeys(
    'ctrl+r, cmd+r',
    (event) => {
      event.preventDefault();
      handleRandomize();
    },
    [handleRandomize]
  );

  useHotkeys(
    'ctrl+shift+c, cmd+shift+c',
    (event) => {
      event.preventDefault();
      void handleCopyFinal();
    },
    [handleCopyFinal]
  );

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold">NovelAI Prompt & Character Manager</h1>
          <p className="text-xs text-slate-400">Compose prompts, manage characters, and automate NovelAI injections.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={<FiSend />} onClick={() => void handleSend()}>
            Send to NovelAI
          </Button>
          <Button variant="secondary" icon={<FiShuffle />} onClick={handleRandomize}>
            Randomize
          </Button>
          <Button variant="secondary" icon={<FiCopy />} onClick={() => void handleCopyFinal()}>
            Copy Final
          </Button>
          <Button variant="secondary" icon={<FiExternalLink />} onClick={() => void handleFocusNovelAI()}>
            Focus NAI
          </Button>
          <Button variant="secondary" icon={<FiDownload />} onClick={() => void handleExport()}>
            Export
          </Button>
          <Button variant="secondary" icon={<FiUpload />} onClick={() => void handleImport()}>
            Import
          </Button>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r border-slate-800 bg-slate-900/60 p-4">
          <TagLibrary />
          <div className="mt-4">
            <CharacterPanel />
          </div>
        </aside>
        <section className="flex flex-1 flex-col overflow-hidden">
          <div className="grid flex-1 grid-cols-2 gap-4 overflow-hidden p-4">
            <div className="flex flex-col overflow-hidden">
              <PromptEditor />
              <div className="mt-4 overflow-hidden">
                <HistoryList onReuse={handleReuseHistory} />
              </div>
            </div>
            <div className="overflow-y-auto pr-2">
              <RandomizerPanel />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <ToastCenter>
    <AppContent />
  </ToastCenter>
);

export default App;
