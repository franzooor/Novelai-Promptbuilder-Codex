import React from 'react';
import { Button } from './Buttons';
import { useSettings } from '../state/useSettings';
import { DEFAULT_RANDOM_PROFILES, randomizeFromProfile } from '../core/randomizer';

export const RandomizerPanel: React.FC = () => {
  const {
    selectedProfile,
    setSelectedProfile,
    settingsOverrides,
    setSettingsOverrides,
    autoGenerate,
    setAutoGenerate,
    duplicateCleaner,
    setDuplicateCleaner,
    templates,
    applyTemplate,
    negativePresets,
    applyNegativePreset,
    stylePresets,
    applyStylePreset,
    lastRandomized,
    setLastRandomized
  } = useSettings((state) => ({
    selectedProfile: state.selectedProfile,
    setSelectedProfile: state.setSelectedProfile,
    settingsOverrides: state.settingsOverrides,
    setSettingsOverrides: state.setSettingsOverrides,
    autoGenerate: state.autoGenerate,
    setAutoGenerate: state.setAutoGenerate,
    duplicateCleaner: state.duplicateCleaner,
    setDuplicateCleaner: state.setDuplicateCleaner,
    templates: state.templates,
    applyTemplate: state.applyTemplate,
    negativePresets: state.negativePresets,
    applyNegativePreset: state.applyNegativePreset,
    stylePresets: state.stylePresets,
    applyStylePreset: state.applyStylePreset,
    lastRandomized: state.lastRandomized,
    setLastRandomized: state.setLastRandomized
  }));

  const profiles = DEFAULT_RANDOM_PROFILES;

  const updateOverride = (key: keyof typeof settingsOverrides, value: number | undefined) => {
    setSettingsOverrides({ ...settingsOverrides, [key]: value });
  };

  const handleRandomize = () => {
    const profile = profiles[selectedProfile] ?? profiles.strict;
    const randomized = randomizeFromProfile(profile);
    setLastRandomized(randomized);
  };

  return (
    <div className="grid gap-4">
      <section className="rounded border border-slate-800 bg-slate-900/60 p-4 text-xs">
        <header className="mb-2 flex items-center justify-between text-sm text-slate-200">
          <span>Settings randomizer</span>
          <Button variant="secondary" onClick={handleRandomize}>
            Roll
          </Button>
        </header>
        <label className="flex flex-col gap-1 text-xs text-slate-300">
          Profile
          <select
            value={selectedProfile}
            onChange={(event) => setSelectedProfile(event.target.value as typeof selectedProfile)}
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-accent focus:outline-none"
          >
            {Object.entries(profiles).map(([key, profile]) => (
              <option key={key} value={key}>
                {profile.label ?? key}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            CFG override
            <input
              type="number"
              step={0.1}
              value={settingsOverrides.cfg ?? ''}
              placeholder="auto"
              onChange={(event) =>
                updateOverride('cfg', event.target.value ? Number(event.target.value) : undefined)
              }
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            Steps override
            <input
              type="number"
              value={settingsOverrides.steps ?? ''}
              placeholder="auto"
              onChange={(event) =>
                updateOverride('steps', event.target.value ? Number(event.target.value) : undefined)
              }
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            Sampler override
            <input
              value={settingsOverrides.sampler ?? ''}
              placeholder="auto"
              onChange={(event) => updateOverride('sampler', event.target.value || undefined)}
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-accent focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs text-slate-300">
              Width
              <input
                type="number"
                value={settingsOverrides.width ?? ''}
                placeholder="auto"
                onChange={(event) =>
                  updateOverride('width', event.target.value ? Number(event.target.value) : undefined)
                }
                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-300">
              Height
              <input
                type="number"
                value={settingsOverrides.height ?? ''}
                placeholder="auto"
                onChange={(event) =>
                  updateOverride('height', event.target.value ? Number(event.target.value) : undefined)
                }
                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-accent focus:outline-none"
              />
            </label>
          </div>
        </div>
        {lastRandomized ? (
          <div className="mt-3 rounded border border-slate-800 bg-slate-950/60 p-2 text-slate-300">
            <p className="font-medium text-slate-200">Last roll</p>
            <p>CFG {lastRandomized.cfg}</p>
            <p>Steps {lastRandomized.steps}</p>
            <p>Sampler {lastRandomized.sampler}</p>
            <p>
              Resolution {lastRandomized.width}×{lastRandomized.height}
            </p>
          </div>
        ) : null}
        <div className="mt-3 flex flex-col gap-2 text-xs text-slate-300">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoGenerate}
              onChange={(event) => setAutoGenerate(event.target.checked)}
            />
            Auto-generate after send
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={duplicateCleaner}
              onChange={(event) => setDuplicateCleaner(event.target.checked)}
            />
            Automatic duplicate cleaner
          </label>
        </div>
      </section>

      <section className="rounded border border-slate-800 bg-slate-900/60 p-4 text-xs">
        <h3 className="mb-2 text-sm font-semibold text-slate-200">Templates</h3>
        <div className="grid gap-2">
          {templates.map((template) => (
            <div key={template.id} className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div>
                <p className="font-medium text-slate-200">{template.name}</p>
                <p className="text-slate-400">{template.positive}</p>
              </div>
              <Button variant="secondary" onClick={() => applyTemplate(template.id)} className="h-8 px-2">
                Apply
              </Button>
            </div>
          ))}
          {templates.length === 0 ? <p className="text-slate-500">No templates defined yet.</p> : null}
        </div>
      </section>

      <section className="rounded border border-slate-800 bg-slate-900/60 p-4 text-xs">
        <h3 className="mb-2 text-sm font-semibold text-slate-200">Negative presets</h3>
        <div className="grid gap-2">
          {negativePresets.map((preset) => (
            <div key={preset.id} className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div>
                <p className="font-medium text-slate-200">{preset.name}</p>
                <p className="text-slate-400">{preset.text}</p>
              </div>
              <Button variant="secondary" onClick={() => applyNegativePreset(preset.id)} className="h-8 px-2">
                Use
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded border border-slate-800 bg-slate-900/60 p-4 text-xs">
        <h3 className="mb-2 text-sm font-semibold text-slate-200">Style presets</h3>
        <div className="grid gap-2">
          {stylePresets.map((preset) => (
            <div key={preset.id} className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div>
                <p className="font-medium text-slate-200">{preset.name}</p>
                <p className="text-slate-400">{preset.description}</p>
              </div>
              <Button variant="secondary" onClick={() => applyStylePreset(preset.id)} className="h-8 px-2">
                Apply
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
