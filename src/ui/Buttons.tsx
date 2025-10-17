import React from 'react';
import clsx from 'clsx';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', icon, children, className, ...rest }) => {
  const base = 'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50';
  const styles: Record<typeof variant, string> = {
    primary: 'bg-accent text-white hover:bg-indigo-500/90',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
    ghost: 'bg-transparent text-slate-200 hover:bg-slate-800'
  } as const;
  return (
    <button className={clsx(base, styles[variant], className)} {...rest}>
      {icon ? <span className="text-lg">{icon}</span> : null}
      {children}
    </button>
  );
};

export const IconButton: React.FC<ButtonProps> = ({ children, className, ...rest }) => (
  <Button
    variant="ghost"
    className={clsx('h-10 w-10 justify-center rounded-full p-0 text-xl', className)}
    {...rest}
  >
    {children}
  </Button>
);
