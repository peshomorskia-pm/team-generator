import React, { useState, useCallback } from 'react';
import { Shuffle, RotateCcw, Copy, Check } from 'lucide-react';
import type { TournamentGroup, GeneratorMode } from '../../types';
import { GroupCard } from './GroupCard';
import { copyTextToClipboard, formatGroupsForClipboard } from '../../utils/clipboard';

export interface GroupListProps {
  groups: TournamentGroup[];
  onRedraw?: () => void;
  onReDraw?: () => void;
  onReset?: () => void;
  onClear?: () => void;
  onCopy?: () => void;
  isCopied?: boolean;
  mode?: GeneratorMode;
  format?: 'singles' | 'doubles';
}

export const GroupList: React.FC<GroupListProps> = ({
  groups,
  onRedraw,
  onReDraw,
  onReset,
  onClear,
  onCopy,
  isCopied: externalIsCopied,
  mode = 'tennis',
  format,
}) => {
  const [internalIsCopied, setInternalIsCopied] = useState(false);

  const handleRedraw = onRedraw || onReDraw;
  const handleReset = onReset || onClear;

  const handleCopy = useCallback(async () => {
    if (onCopy) {
      onCopy();
      return;
    }
    const textToCopy = formatGroupsForClipboard(groups, mode, format);
    const success = await copyTextToClipboard(textToCopy);
    if (success) {
      setInternalIsCopied(true);
      setTimeout(() => setInternalIsCopied(false), 2000);
    }
  }, [groups, mode, format, onCopy]);

  const copiedState = externalIsCopied ?? internalIsCopied;

  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <div id="tournamentGroupsContainer" className="w-full max-w-5xl mt-10 transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between mb-6 px-2 gap-3">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
          <span>Турнирни групи</span>
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {handleRedraw && (
            <button
              type="button"
              id="redrawGroupsBtn"
              onClick={handleRedraw}
              title="Изтегли нов жребий за групите"
              aria-label="Нов жребий"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Shuffle className="w-4 h-4 mr-1 text-indigo-500" />
              <span>Нов жребий</span>
            </button>
          )}

          {handleReset && (
            <button
              type="button"
              id="resetGroupsBtn"
              onClick={handleReset}
              title="Изчисти изтегления жребий"
              aria-label="Изчисти жребия"
              className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-medium flex items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 mr-1 text-rose-500" />
              <span>Изчисти жребия</span>
            </button>
          )}

          <button
            type="button"
            id="copyGroupsBtn"
            onClick={handleCopy}
            title="Копирай групите в клипборда"
            aria-label="Копирай групите"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            {copiedState ? (
              <>
                <Check className="w-4 h-4 mr-1 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400">Копирано!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                <span>Копирай</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div
        id="groupsGrid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            format={format}
            mode={mode}
          />
        ))}
      </div>
    </div>
  );
};
