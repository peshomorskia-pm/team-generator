import React from 'react';
import { User, Shuffle, Star } from 'lucide-react';
import { TeamCardProps } from '../../types';
import { Badge } from '../ui/Badge';

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  index = 0,
  onShuffleTeam,
  format,
  mode = 'tennis',
}) => {
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
                {mode !== 'generic' && playerRating !== undefined && (
                  <span className="text-xs text-amber-500 font-medium ml-2 shrink-0">
                    ★ {playerRating}
                  </span>
                )}
              </li>
            );
          })}
          {team.players.length === 0 && (
            <li className="text-xs text-gray-400 italic text-center py-2">
              Няма разпределени играчи
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
