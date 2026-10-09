import { memo } from 'react';
import { Copy, Check, Swords } from 'lucide-react';
import { TeamListProps } from '../../types';
import { TeamCard } from './TeamCard';

export const TeamList = memo(function TeamList({
  teams,
  onShuffleTeam,
  onCopy,
  isCopied = false,
  onSaveAsMatch,
  format,
  mode = 'tennis',
}: TeamListProps) {
  if (teams.length === 0) {
    return null;
  }

  const isTennisMode = mode === 'tennis';

  return (
    <div id="resultsContainer" className="w-full max-w-5xl mt-10 transition-all duration-300">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Резултати</h2>
        <div className="flex items-center gap-2">
          {isTennisMode && teams.length === 2 && onSaveAsMatch && (
            <button
              type="button"
              id="saveAsMatchBtn"
              onClick={onSaveAsMatch}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium flex items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Swords className="w-4 h-4 mr-1 text-emerald-600 dark:text-emerald-400" />
              <span>Запиши като мач</span>
            </button>
          )}
          {onCopy && (
            <button
              type="button"
              id="copyBtn"
              onClick={onCopy}
              title="Копирай съставите на отборите в клипборда"
              aria-label="Копирай отборите"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {isCopied ? (
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
          )}
        </div>
      </div>

      <div id="teamsGrid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team, index) => (
          <TeamCard
            key={team.id}
            team={team}
            index={index}
            onShuffleTeam={onShuffleTeam}
            format={format}
            mode={mode}
          />
        ))}
      </div>
    </div>
  );
});
