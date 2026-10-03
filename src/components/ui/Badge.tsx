import { LucideIcon } from 'lucide-react';
import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'indigo' | 'emerald' | 'amber' | 'slate' | 'purple';
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'slate',
  size = 'sm',
  icon: Icon,
  className = '',
  children,
  ...props
}) => {
  const variantClasses = {
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    slate: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  }[variant];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }[size];

  const iconSizeClasses = size === 'sm' ? 'w-3 h-3 mr-1 shrink-0' : 'w-4 h-4 mr-1 shrink-0';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {Icon && <Icon className={iconSizeClasses} />}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
