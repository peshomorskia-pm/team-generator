import React from 'react';
import { User, Shuffle, Star, X, UserPlus } from 'lucide-react';
import { TeamCardProps } from '../../types';
import { Badge } from '../ui/Badge';

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  index = 0,
  onShuffleTeam,
  format,
  mode = 'tennis',
  targetSize,
  onSelectEmptySlot,
  onRemovePlayer,
}) => {
  const emptySlotsCount =
    targetSize !== undefined && targetSize > team.players.length
      ? targetSize - team.players.length
      : 0;
  const displayTotalRating = React.useMemo(() => {
    if (team.totalRating !== undefined && team.totalRating > 0 && !format) {
      return team.totalRating;
    }
    const sum = team.players.reduce((acc, p) => {
      const r =
        format === 'singles'
          ? (p.singles_rating ?? p.rating ?? 0)
          : format === 'doubles'
            ? (p.doubles_rating ?? p.rating ?? 0)
            : (p.rating ?? 0);
      return acc + r;
    }, 0);
    return sum > 0 ? sum : team.totalRating;
  }, [team, format]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transform transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700/80 dark:to-slate-700/40 px-5 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center">
          <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 font-bold">
            {index + 1}
          </span>
          {team.name}
        </h3>
        <div className="flex items-center space-x-2">
          {mode !== 'generic' && displayTotalRating !== undefined && displayTotalRating > 0 && (
            <Badge variant="amber" size="sm" icon={Star}>
              {displayTotalRating}
            </Badge>
          )}
          <Badge variant="slate" size="sm">
            {team.players.length} играчи
          </Badge>
          {onShuffleTeam && (
            <button
              type="button"
              onClick={() => onShuffleTeam(team.id)}
              className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 transition-colors"
              title="Разбъркай реда в отбора"
              aria-label="Разбъркай отбора"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <ul className="space-y-2">
          {team.players.map((player) => {
            const playerRating =
              format === 'singles'
                ? (player.singles_rating ?? player.rating)
                : format === 'doubles'
                  ? (player.doubles_rating ?? player.rating)
                  : player.rating;

            return (
              <li
                key={player.id}
                className="flex items-center justify-between text-gray-700 dark:text-gray-200 text-sm"
              >
                <div className="flex items-center min-w-0">
                  <User className="w-4 h-4 mr-2 text-indigo-400 shrink-0" />
                  <span className="truncate">{player.name}</span>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  {mode !== 'generic' && playerRating !== undefined && (
                    <span className="text-xs text-amber-500 font-medium ml-2 shrink-0">
                      ★ {playerRating}
                    </span>
                  )}
                  {onRemovePlayer && (
                    <button
                      type="button"
                      onClick={() => onRemovePlayer(team.id, player.id)}
                      aria-label={`Премахни ${player.name} от отбора`}
                      title={`Премахни ${player.name} от отбора`}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
          {emptySlotsCount > 0 &&
            Array.from({ length: emptySlotsCount }).map((_, slotIdx) => (
              <li key={`empty-slot-${slotIdx}`}>
                {onSelectEmptySlot ? (
                  <button
                    type="button"
                    data-testid="empty-slot"
                    onClick={() => onSelectEmptySlot(team.id)}
                    aria-label={`Избери играч за ${team.name}`}
                    className="w-full flex items-center justify-between text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm border border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-lg px-3 py-2 bg-indigo-50/40 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center min-w-0">
                      <UserPlus className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">+ Избери играч</span>
                    </div>
                    <span className="text-xs text-indigo-400/80 dark:text-indigo-400/60 italic hidden sm:inline">
                      Свободно място
                    </span>
                  </button>
                ) : (
                  <div
                    data-testid="empty-slot"
                    className="flex items-center text-gray-400 dark:text-slate-500 text-sm border border-dashed border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-gray-50/50 dark:bg-slate-800/40"
                  >
                    <User className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500 shrink-0" />
                    <span className="italic">Свободно място</span>
                  </div>
                )}
              </li>
            ))}
          {team.players.length === 0 && emptySlotsCount === 0 && (
            <li className="text-xs text-gray-400 italic text-center py-2">
              Няма разпределени играчи
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
