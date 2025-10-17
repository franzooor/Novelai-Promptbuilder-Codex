import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useHistory, filteredHistorySelector } from '../state/useHistory';
import type { HistoryEntry } from '../types/models';
import { Button } from './Buttons';

type HistoryListProps = {
  onReuse: (entry: HistoryEntry) => void;
};

export const HistoryList: React.FC<HistoryListProps> = ({ onReuse }) => {
  const { initialize, search, setSearch } = useHistory((state) => ({
    initialize: state.initialize,
    search: state.search,
    setSearch: state.setSearch
  }));
  const entries = useHistory(filteredHistorySelector);

  React.useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <section className="rounded border border-slate-800 bg-slate-900/70 p-4">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">History</h3>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search history"
          className="w-48 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-accent focus:outline-none"
        />
      </header>
      <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-200">
            <div className="flex items-center justify-between">
              <p className="font-medium">{entry.characters.map((character) => character.label ?? character.id).join(', ') || 'Scene'}</p>
              <span className="text-slate-400">
                {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-slate-300">{entry.positive}</p>
            {entry.negative ? <p className="mt-1 text-slate-500">{entry.negative}</p> : null}
            <div className="mt-2 flex justify-end">
              <Button variant="secondary" onClick={() => onReuse(entry)} className="h-7 px-2">
                Reuse
              </Button>
            </div>
          </div>
        ))}
        {entries.length === 0 ? (
          <p className="text-xs text-slate-500">No history yet. Send a prompt to populate this list.</p>
        ) : null}
      </div>
    </section>
  );
};
