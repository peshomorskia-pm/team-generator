import { memo } from 'react';
import { Copy, Check, Swords, Sparkles } from 'lucide-react';
import { TeamListProps } from '../../types';
import { TeamCard } from './TeamCard';
import { getTargetTeamSize } from '../../hooks/useTeamGenerator';

export const TeamList = memo(function TeamList({
  teams,
  onShuffleTeam,
  onCopy,
  isCopied = false,
  onSaveAsMatch,
  format,
  mode = 'tennis',
  onDrawGroups,
  hasIncompleteTeams: propHasIncompleteTeams,
  targetTeamSize: propTargetTeamSize,
  formationMode = 'auto',
  onSelectEmptySlot,
  onRemovePlayer,
  onAutoFillRemaining,
}: TeamListProps) {
  if (teams.length === 0) {
    return null;
  }

  const isTennisMode = mode === 'tennis';

  const computedTargetSize =
    propTargetTeamSize ??
    getTargetTeamSize(
      mode,
      format,
      null,
      null,
      teams.reduce((acc, t) => acc + t.players.length, 0)
    );

  const hasIncomplete =
    propHasIncompleteTeams !== undefined
      ? propHasIncompleteTeams
      : teams.some((t) => t.players.length < computedTargetSize);

  const totalEmptySlots = teams.reduce(
    (sum, t) => sum + Math.max(0, computedTargetSize - t.players.length),
    0
  );

  return (
    <div id="resultsContainer" className="w-full max-w-5xl mt-10 transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 px-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Резултати</h2>
        <div className="flex flex-wrap items-center gap-2">
          {formationMode === 'manual' && totalEmptySlots > 0 && onAutoFillRemaining && (
            <button
              type="button"
              id="autoFillRemainingBtn"
              onClick={onAutoFillRemaining}
              className="text-sm font-semibold flex items-center px-3 py-1.5 rounded-lg shadow-sm border bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900 border-amber-300 dark:border-amber-700 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 mr-1 text-amber-600 dark:text-amber-400" />
              <span>✨ Попълни останалите автоматично</span>
              <span className="ml-1 text-xs text-amber-700 dark:text-amber-300 opacity-90">
                (остават {totalEmptySlots} {totalEmptySlots === 1 ? 'свободно място' : 'свободни места'})
              </span>
            </button>
          )}
          {isTennisMode && teams.length >= 6 && onDrawGroups && (
            <button
              type="button"
              id="drawGroupsBtn"
              onClick={onDrawGroups}
              disabled={hasIncomplete}
              className={`text-sm font-semibold flex items-center px-3 py-1.5 rounded-lg shadow-sm border transition-colors ${
                hasIncomplete
                  ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 border-indigo-200 dark:border-indigo-800 cursor-pointer'
              }`}
            >
              <span>🎲 Тегли жребий за групи</span>
            </button>
          )}
          {isTennisMode && teams.length === 2 && onSaveAsMatch && (
            <button
              type="button"
              id="saveAsMatchBtn"
              onClick={onSaveAsMatch}
              disabled={hasIncomplete}
              className={`text-sm font-medium flex items-center px-3 py-1.5 rounded-lg shadow-sm border transition-colors ${
                hasIncomplete
                  ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 border-gray-200 dark:border-slate-700 cursor-pointer'
              }`}
            >
              <Swords
                className={`w-4 h-4 mr-1 ${
                  hasIncomplete
                    ? 'text-gray-400 dark:text-slate-500'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              />
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
            targetSize={computedTargetSize}
            onSelectEmptySlot={onSelectEmptySlot}
            onRemovePlayer={onRemovePlayer}
          />
        ))}
      </div>
    </div>
  );
});
