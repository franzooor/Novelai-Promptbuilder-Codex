import React, { useState } from 'react';
import { FiUserPlus, FiTrash, FiSave } from 'react-icons/fi';
import { Button } from './Buttons';
import { useCharacters } from '../state/useCharacters';
import type { Character } from '../types/models';

const genderOptions: Character['gender'][] = ['female', 'male', 'nonbinary', 'unknown'];

const tagsToString = (tags: string[]) => tags.join(', ');
const stringToTags = (value: string) =>
  value
    .split(/,|\n/)
    .map((tag) => tag.trim())
    .filter(Boolean);

export const CharacterPanel: React.FC = () => {
  const { active, profiles, addActive, removeActive, updateActive, saveProfile, deleteProfile, applyProfile, initialize } =
    useCharacters((state) => ({
      active: state.active,
      profiles: state.profiles,
      addActive: state.addActive,
      removeActive: state.removeActive,
      updateActive: state.updateActive,
      saveProfile: state.saveProfile,
      deleteProfile: state.deleteProfile,
      applyProfile: state.applyProfile,
      initialize: state.initialize
    }));

  React.useEffect(() => {
    void initialize();
  }, [initialize]);

  const [newLabel, setNewLabel] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newGender, setNewGender] = useState<Character['gender']>('female');

  const addCharacter = () => {
    const tags = stringToTags(newTags);
    if (!tags.length && !newLabel.trim()) {
      addActive({ id: '', tags: ['character'] });
    } else {
      addActive({ id: '', label: newLabel || undefined, gender: newGender, tags });
    }
    setNewLabel('');
    setNewTags('');
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="rounded border border-slate-800 bg-slate-900/60 p-3">
        <h2 className="text-sm font-semibold uppercase text-slate-300">Step 2 · Characters</h2>
        <p className="mt-1 text-xs text-slate-400">
          Describe each person or subject you want in the picture. A short name and a few traits (for example “Anna, red hair, smi
          ling”) are perfect.
        </p>
        <div className="mt-3 grid gap-3">
          {active.map((character) => (
            <article key={character.id} className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <input
                  value={character.label ?? ''}
                  onChange={(event) => updateActive({ ...character, label: event.target.value })}
                  placeholder="Character name"
                  className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:border-accent focus:outline-none"
                />
                <select
                  value={character.gender ?? 'unknown'}
                  onChange={(event) => updateActive({ ...character, gender: event.target.value as Character['gender'] })}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:border-accent focus:outline-none"
                >
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  icon={<FiTrash />}
                  onClick={() => removeActive(character.id)}
                  className="h-8 px-2"
                >
                  Remove
                </Button>
              </div>
              <textarea
                value={tagsToString(character.tags)}
                onChange={(event) =>
                  updateActive({ ...character, tags: stringToTags(event.target.value) })
                }
                placeholder="red hair, blue eyes, sailor uniform:1.1"
                rows={3}
                className="mt-2 w-full rounded border border-slate-800 bg-slate-950/60 px-2 py-1 text-xs text-slate-100 focus:border-accent focus:outline-none"
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  icon={<FiSave />}
                  onClick={() => saveProfile(character)}
                  className="h-8 px-2"
                >
                  Save profile
                </Button>
              </div>
            </article>
          ))}
          {active.length === 0 ? (
            <p className="text-xs text-slate-500">No characters added. Create one below or load from profiles.</p>
          ) : null}
        </div>
      </div>

      <div className="rounded border border-slate-800 bg-slate-900/60 p-3 text-xs">
        <h3 className="text-xs font-semibold uppercase text-slate-400">Quick add</h3>
        <p className="mt-1 text-slate-500">
          Fill these fields and press “Add character” to drop a ready-made subject into your prompt.
        </p>
        <div className="mt-2 grid gap-2">
          <input
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            placeholder="Character label"
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:border-accent focus:outline-none"
          />
          <select
            value={newGender}
            onChange={(event) => setNewGender(event.target.value as Character['gender'])}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:border-accent focus:outline-none"
          >
            {genderOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <textarea
            value={newTags}
            onChange={(event) => setNewTags(event.target.value)}
            placeholder="Tags (comma separated)"
            rows={2}
            className="w-full rounded border border-slate-800 bg-slate-950/60 px-2 py-1 text-xs text-slate-200 focus:border-accent focus:outline-none"
          />
          <Button variant="secondary" icon={<FiUserPlus />} onClick={addCharacter}>
            Add character
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded border border-slate-800 bg-slate-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase text-slate-400">Saved profiles</h3>
        <p className="mt-1 text-xs text-slate-500">
          Reuse favourite characters with one click. Saving keeps their details ready for the next story.
        </p>
        <div className="mt-2 grid gap-2">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs"
            >
              <div>
                <p className="font-medium text-slate-200">{profile.label ?? 'Unnamed'}</p>
                <p className="text-slate-400">{tagsToString(profile.tags)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => applyProfile(profile.id)} className="h-8 px-2">
                  Use
                </Button>
                <Button variant="secondary" onClick={() => deleteProfile(profile.id)} className="h-8 px-2">
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {profiles.length === 0 ? (
            <p className="text-xs text-slate-500">No profiles yet. Save a character to reuse it later.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
