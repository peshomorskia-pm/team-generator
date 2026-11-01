import React from 'react';
import type { FormOutcome } from '../../types/rankings';

export interface FormBadgeProps {
  form: FormOutcome[];
  maxItems?: number;
  className?: string;
}

export const FormBadge: React.FC<FormBadgeProps> = ({
  form,
  maxItems = 5,
  className = '',
}) => {
  const safeForm = form ?? [];
  const paddingCount = Math.max(0, maxItems - safeForm.length);
  const placeholders = Array.from({ length: paddingCount });

  return (
    <div
      className={`flex items-center gap-1 ${className}`.trim()}
      aria-label={`Форма от последните ${maxItems} мача`}
    >
      {/* Neutral empty placeholders */}
      {placeholders.map((_, idx) => (
        <span
          key={`placeholder-${idx}`}
          title="Няма изигран мач"
          className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 select-none"
        >
          -
        </span>
      ))}

      {/* Actual chronological form outcomes */}
      {safeForm.slice(-maxItems).map((outcome, idx) => {
        const isWin = outcome === 'W';
        return (
          <span
            key={`outcome-${idx}`}
            title={isWin ? 'Победа' : 'Загуба'}
            className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold select-none ${
              isWin
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
            }`}
          >
            {isWin ? 'П' : 'З'}
          </span>
        );
      })}
    </div>
  );
};
