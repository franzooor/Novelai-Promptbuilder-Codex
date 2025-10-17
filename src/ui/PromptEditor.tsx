import React from 'react';
import { FiClipboard, FiTrash } from 'react-icons/fi';
import { useSettings } from '../state/useSettings';
import { Button } from './Buttons';
import { useToast } from './ToastCenter';

const appendTag = (value: string, tag: string) => {
  const normalized = tag.trim();
  if (!normalized) return value;
  if (!value) return normalized;
  if (value.toLowerCase().includes(normalized.toLowerCase())) return value;
  return `${value}, ${normalized}`;
};

export const PromptEditor: React.FC = () => {
  const { positiveInput, negativeInput, setPositiveInput, setNegativeInput, tokenCounts } = useSettings(
    (state) => ({
      positiveInput: state.positiveInput,
      negativeInput: state.negativeInput,
      setPositiveInput: state.setPositiveInput,
      setNegativeInput: state.setNegativeInput,
      tokenCounts: state.tokenCounts
    })
  );
  const { pushToast } = useToast();

  const handleDrop = (setter: (value: string) => void, current: string) =>
    (event: React.DragEvent<HTMLTextAreaElement>) => {
      event.preventDefault();
      const label = event.dataTransfer.getData('text/plain');
      if (label) {
        setter(appendTag(current, label));
      }
    };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    pushToast({ title: `${label} copied to clipboard`, variant: 'success' });
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded border border-slate-800 bg-slate-900/70 p-4">
        <header className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Positive Prompt</h2>
            <p className="text-xs text-slate-400">Drag tags here or type manually.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setPositiveInput('')}
              icon={<FiTrash />}
            >
              Clear
            </Button>
            <Button
              variant="secondary"
              onClick={() => void copyToClipboard(positiveInput, 'Positive prompt')}
              icon={<FiClipboard />}
            >
              Copy
            </Button>
          </div>
        </header>
        <textarea
          value={positiveInput}
          onChange={(event) => setPositiveInput(event.target.value)}
          onDrop={handleDrop(setPositiveInput, positiveInput)}
          onDragOver={(event) => event.preventDefault()}
          rows={8}
          className="w-full rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-accent focus:outline-none"
        />
        <p className={`mt-2 text-right text-xs ${tokenCounts.positive > 180 ? 'text-amber-400' : 'text-slate-400'}`}>
          ~{tokenCounts.positive} tokens
        </p>
      </section>

      <section className="rounded border border-slate-800 bg-slate-900/70 p-4">
        <header className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Negative Prompt</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setNegativeInput('')} icon={<FiTrash />}>
              Clear
            </Button>
            <Button
              variant="secondary"
              onClick={() => void copyToClipboard(negativeInput, 'Negative prompt')}
              icon={<FiClipboard />}
            >
              Copy
            </Button>
          </div>
        </header>
        <textarea
          value={negativeInput}
          onChange={(event) => setNegativeInput(event.target.value)}
          onDrop={handleDrop(setNegativeInput, negativeInput)}
          onDragOver={(event) => event.preventDefault()}
          rows={6}
          className="w-full rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-accent focus:outline-none"
        />
        <p className={`mt-2 text-right text-xs ${tokenCounts.negative > 180 ? 'text-amber-400' : 'text-slate-400'}`}>
          ~{tokenCounts.negative} tokens
        </p>
      </section>
    </div>
  );
};
