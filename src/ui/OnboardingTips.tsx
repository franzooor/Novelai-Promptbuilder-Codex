import React from 'react';
import { FiHelpCircle, FiX } from 'react-icons/fi';
import { Button } from './Buttons';

const steps = [
  {
    title: 'Pick your scene tags',
    description:
      'Browse the tag library or type in keywords. Click a tag to add it to your scene — no special formatting required.'
  },
  {
    title: 'Add the characters you want to see',
    description:
      'Give each character a simple name and a few descriptive words. We will handle the prompt grammar for you.'
  },
  {
    title: 'Review the prompt text',
    description:
      'Everything you add appears in the prompt editor. You can freely tweak the text like a normal sentence.'
  },
  {
    title: 'Send it to NovelAI',
    description:
      'Press “Send to NovelAI” when you are happy. The app fills in the NovelAI page for you automatically.'
  }
];

const storageKey = 'novelai-promptbuilder-guide-collapsed';

export const OnboardingTips: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const value = window.localStorage.getItem(storageKey);
    return value === 'true';
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, collapsed ? 'true' : 'false');
  }, [collapsed]);

  if (collapsed) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-slate-200">
        <div className="flex items-center gap-3">
          <FiHelpCircle className="text-xl text-accent" />
          <div>
            <p className="text-sm font-semibold">Need a refresher?</p>
            <p className="text-xs text-slate-400">Open the quick-start guide any time for step-by-step help.</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => setCollapsed(false)}>
          Show guide
        </Button>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-slate-200">
      <header className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <FiHelpCircle className="text-2xl text-accent" />
          <div>
            <h2 className="text-lg font-semibold">Welcome! Let’s build a picture together.</h2>
            <p className="text-sm text-slate-400">
              Follow the friendly steps below — no coding, prompt jargon, or previous NovelAI knowledge required.
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => setCollapsed(true)} aria-label="Hide quick-start guide">
          <FiX className="text-lg" />
        </Button>
      </header>
      <ol className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Step {index + 1}</p>
            <p className="mt-1 font-medium text-slate-100">{step.title}</p>
            <p className="mt-1 text-slate-400">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default OnboardingTips;
