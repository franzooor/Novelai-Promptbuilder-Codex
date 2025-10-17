import React, { useMemo, useState } from 'react';
import { FiStar, FiPlus } from 'react-icons/fi';
import type { Tag } from '../types/models';
import { useTags, allTagsSelector, categorizedTagsSelector } from '../state/useTags';
import { Button } from './Buttons';

const TagChip: React.FC<{
  tag: Tag;
  active: boolean;
  onToggle: (id: string) => void;
  onFavorite: (id: string) => void;
}> = ({ tag, active, onToggle, onFavorite }) => {
  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData('text/plain', tag.label);
    event.dataTransfer.setData('application/x-tag-id', tag.id);
  };

  return (
    <button
      className={`group flex items-center justify-between rounded border px-2 py-1 text-xs transition ${
        active
          ? 'border-accent bg-accent/20 text-accent'
          : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500'
      }`}
      onClick={() => onToggle(tag.id)}
      onDragStart={handleDragStart}
      draggable
      type="button"
    >
      <span className="truncate">{tag.label}</span>
      <FiStar
        className={`ml-2 cursor-pointer transition ${tag.favorite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-500 group-hover:text-slate-300'}`}
        onClick={(event) => {
          event.stopPropagation();
          onFavorite(tag.id);
        }}
      />
    </button>
  );
};

export const TagLibrary: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { sceneTags, search, setSearch, toggleSceneTag, toggleFavorite, addCustomTag, initialize } = useTags(
    (state) => ({
      sceneTags: state.sceneTags,
      search: state.search,
      setSearch: state.setSearch,
      toggleSceneTag: state.toggleSceneTag,
      toggleFavorite: state.toggleFavorite,
      addCustomTag: state.addCustomTag,
      initialize: state.initialize
    })
  );

  React.useEffect(() => {
    void initialize();
  }, [initialize]);

  const categorized = useTags(categorizedTagsSelector);
  const all = useTags(allTagsSelector);

  const categories = useMemo(
    () =>
      Object.keys(categorized)
        .sort()
        .map((key) => ({ key, count: categorized[key].length })),
    [categorized]
  );

  const [customLabel, setCustomLabel] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const visibleTags = useMemo(() => {
    if (!categoryFilter || !categorized[categoryFilter]) return all;
    return categorized[categoryFilter];
  }, [all, categorized, categoryFilter]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Step 1 · Tag Library</h2>
        <p className="mt-1 text-xs text-slate-400">
          Search for simple words like “sunset” or “watercolor”. Click any tag to add it to your prompt — think of them as stickers
          that describe your scene.
        </p>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tags"
          className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
          <button
            className={`rounded-full border px-3 py-1 transition ${
              categoryFilter === null
                ? 'border-accent text-accent'
                : 'border-slate-700 hover:border-slate-500'
            }`}
            onClick={() => setCategoryFilter(null)}
          >
            All ({all.length})
          </button>
          {categories.map((category) => (
            <button
              key={category.key}
              className={`rounded-full border px-3 py-1 transition ${
                categoryFilter === category.key
                  ? 'border-accent text-accent'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
              onClick={() => setCategoryFilter(category.key)}
            >
              {category.key} ({category.count})
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded border border-slate-800 bg-slate-900/40 p-3">
        <div className="grid grid-cols-2 gap-2">
          {visibleTags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              active={sceneTags.includes(tag.id)}
              onToggle={toggleSceneTag}
              onFavorite={toggleFavorite}
            />
          ))}
        </div>
      </div>

      <div className="rounded border border-slate-800 bg-slate-900/50 p-3">
        <h3 className="text-xs font-semibold uppercase text-slate-400">Add custom tag</h3>
        <p className="mt-1 text-xs text-slate-500">
          Don’t see a word you need? Type your own here and save it for later. Separate multiple ideas with commas.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={customLabel}
            onChange={(event) => setCustomLabel(event.target.value)}
            placeholder="Tag label"
            className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200 focus:border-accent focus:outline-none"
          />
          <input
            value={customCategory}
            onChange={(event) => setCustomCategory(event.target.value)}
            placeholder="Category"
            className="w-32 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200 focus:border-accent focus:outline-none"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!customLabel.trim()) return;
              addCustomTag(customLabel, customCategory || undefined);
              setCustomLabel('');
              setCustomCategory('');
            }}
          >
            <FiPlus />
          </Button>
        </div>
      </div>
    </div>
  );
};
