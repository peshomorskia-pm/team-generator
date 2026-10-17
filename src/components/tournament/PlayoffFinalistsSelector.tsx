import React from 'react';
import { Trophy } from 'lucide-react';
import type { PlayoffFinalistsCount } from '../../types/playoffs';
import { getAvailableFinalistOptions } from '../../utils/playoffs';

export interface PlayoffFinalistsSelectorProps {
  groupCount: number;
  totalTeams: number;
  selectedCount: PlayoffFinalistsCount;
  onChange: (count: PlayoffFinalistsCount) => void;
  disabled?: boolean;
  className?: string;
}

const optionLabels: Record<PlayoffFinalistsCount, { count: string; stage: string }> = {
  2: { count: '2 отбора', stage: 'Финал' },
  4: { count: '4 отбора', stage: 'Полуфинали' },
  8: { count: '8 отбора', stage: '1/4-финали' },
};

export const PlayoffFinalistsSelector: React.FC<PlayoffFinalistsSelectorProps> = ({
  groupCount,
  totalTeams,
  selectedCount,
  onChange,
  disabled = false,
  className = '',
}) => {
  const availableOptions = getAvailableFinalistOptions(groupCount, totalTeams);

  if (availableOptions.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs ${className}`}
      data-testid="playoff-finalists-selector"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Trophy className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
            Формат на елиминациите
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Изберете колко отбора се класират напред за плейофите
          </p>
        </div>
      </div>

      <div
        className="inline-flex p-1 bg-gray-100 dark:bg-slate-700/60 rounded-xl border border-gray-200 dark:border-slate-600 shrink-0 self-start sm:self-auto"
        role="group"
        aria-label="Избор на брой финалисти за елиминации"
      >
        {availableOptions.map((opt) => {
          const isSelected = selectedCount === opt;
          const { count, stage } = optionLabels[opt];

          return (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt)}
              aria-pressed={isSelected}
              title={`${count} се класират за ${stage}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              data-testid={`finalists-option-${opt}`}
            >
              <span>{count}</span>
              <span className="text-[10px] opacity-75 font-normal">({stage})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

PlayoffFinalistsSelector.displayName = 'PlayoffFinalistsSelector';
export default PlayoffFinalistsSelector;
