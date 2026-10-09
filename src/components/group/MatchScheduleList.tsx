import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, RotateCcw, Copy, Check, Zap, Loader2 } from 'lucide-react';
import type { TournamentMatch } from '../../types';
import { copyTextToClipboard, formatScheduleForClipboard } from '../../utils/clipboard';

export interface MatchScheduleListProps {
  schedule: TournamentMatch[];
  onReset?: () => void;
  onClear?: () => void;
  onSaveAllMatches?: () => Promise<void> | void;
  isSavingMatches?: boolean;
}

export const MatchScheduleList: React.FC<MatchScheduleListProps> = ({
  schedule,
  onReset,
  onClear,
  onSaveAllMatches,
  isSavingMatches = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    const textToCopy = formatScheduleForClipboard(schedule);
    const success = await copyTextToClipboard(textToCopy);
    if (success) {
      setIsCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  }, [schedule]);

  const handleReset = onReset || onClear;

  if (!schedule || schedule.length === 0) {
    return null;
  }

  // Extract unique rounds sorted ascending
  const roundNumbers = Array.from(new Set(schedule.map((m) => m.round))).sort((a, b) => a - b);

  return (
    <div id="matchScheduleContainer" className="w-full max-w-5xl mt-10 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6 px-2 gap-3">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
          <span>Програма на срещите</span>
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {onSaveAllMatches && (
            <button
              type="button"
              id="saveAllMatchesBtn"
              onClick={onSaveAllMatches}
              disabled={isSavingMatches}
              title={isSavingMatches ? 'Записване...' : 'Запиши всички мачове'}
              aria-label={isSavingMatches ? 'Записване...' : 'Запиши всички мачове'}
              className={`text-sm font-semibold flex items-center px-4 py-1.5 rounded-lg shadow-sm border transition-colors ${
                isSavingMatches
                  ? 'bg-indigo-400 dark:bg-indigo-600/70 border-indigo-400 text-white cursor-not-allowed opacity-80'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow hover:shadow-md cursor-pointer'
              }`}
            >
              {isSavingMatches ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  <span>Записване...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-1.5 fill-current" />
                  <span>⚡ Запиши всички мачове</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            id="copyScheduleBtn"
            onClick={handleCopy}
            title={isCopied ? 'Копирано!' : 'Копирай програмата'}
            aria-label={isCopied ? 'Копирано!' : 'Копирай програмата'}
            className={`text-sm font-medium flex items-center px-3 py-1.5 rounded-lg shadow-sm border transition-colors cursor-pointer ${
              isCopied
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 mr-1 text-emerald-500" />
                <span>Копирано!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1 text-indigo-500" />
                <span>Копирай програмата</span>
              </>
            )}
          </button>

          {handleReset && (
            <button
              type="button"
              id="resetScheduleBtn"
              onClick={handleReset}
              disabled={isSavingMatches}
              title="Изчисти програмата"
              aria-label="Изчисти програмата"
              className={`text-sm text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-medium flex items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 transition-colors ${
                isSavingMatches ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <RotateCcw className="w-4 h-4 mr-1 text-rose-500" />
              <span>Изчисти програмата</span>
            </button>
          )}
        </div>
      </div>

      {/* Rounds list */}
      <div className="space-y-6">
        {roundNumbers.map((roundNum) => {
          const roundMatches = schedule.filter((m) => m.round === roundNum);
          const byeTeam = roundMatches.find((m) => m.byeTeam)?.byeTeam;

          return (
            <div
              key={`round-${roundNum}`}
              className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm"
            >
              {/* Round header with bye badge */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/80 pb-3 mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  Кръг {roundNum}
                </h3>
                {byeTeam && (
                  <span
                    data-testid="bye-team-badge"
                    className="text-xs bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium px-2.5 py-1 rounded-full"
                  >
                    Почива: {byeTeam.name}
                  </span>
                )}
              </div>

              {/* Round matches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roundMatches.map((match, idx) => (
                  <div
                    key={match.id}
                    className="bg-white dark:bg-slate-800/90 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                      <span>Мач {idx + 1}</span>
                      {match.groupName && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          {match.groupName}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
                      {/* Team 1 */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                            {match.team1.name}
                          </span>
                          {match.team1.totalRating !== undefined && match.team1.totalRating > 0 && (
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                              ★ {match.team1.totalRating}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {match.team1.players.map((p) => p.name).join(', ')}
                        </div>
                      </div>

                      {/* VS separator */}
                      <div className="flex items-center justify-center px-1">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-full">
                          vs
                        </span>
                      </div>

                      {/* Team 2 */}
                      <div className="space-y-1 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {match.team2.totalRating !== undefined && match.team2.totalRating > 0 && (
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                              ★ {match.team2.totalRating}
                            </span>
                          )}
                          <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                            {match.team2.name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {match.team2.players.map((p) => p.name).join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
