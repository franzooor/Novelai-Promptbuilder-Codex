import * as Toast from '@radix-ui/react-toast';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ToastMessage = {
  id?: string;
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
};

type ToastContextValue = {
  pushToast: (toast: ToastMessage) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const variantClasses: Record<NonNullable<ToastMessage['variant']>, string> = {
  success: 'border-emerald-500 text-emerald-200',
  error: 'border-rose-500 text-rose-200',
  warning: 'border-amber-500 text-amber-200',
  info: 'border-sky-500 text-sky-200'
};

export const ToastCenter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);

  const pushToast = useCallback((toast: ToastMessage) => {
    setActiveToast({ variant: 'info', ...toast });
    setOpen(false);
    requestAnimationFrame(() => setOpen(true));
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      <Toast.Provider swipeDirection="right" duration={4000}>
        {children}
        <Toast.Root
          className={`fixed bottom-6 right-6 z-50 max-w-md rounded border bg-slate-900/90 px-4 py-3 shadow-lg backdrop-blur ${
            activeToast ? variantClasses[activeToast.variant ?? 'info'] : ''
          }`}
          open={open}
          onOpenChange={setOpen}
        >
          <Toast.Title className="text-sm font-semibold">
            {activeToast?.title ?? ''}
          </Toast.Title>
          {activeToast?.description ? (
            <Toast.Description className="mt-1 text-xs text-slate-300">
              {activeToast.description}
            </Toast.Description>
          ) : null}
        </Toast.Root>
        <Toast.Viewport className="pointer-events-none" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastCenter');
  return context;
};
