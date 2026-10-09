import React from 'react';
import { User, Star, Shield } from 'lucide-react';
import type { TournamentGroup, GeneratorMode } from '../../types';
import { Badge } from '../ui/Badge';

export interface GroupCardProps {
  group: TournamentGroup;
  format?: 'singles' | 'doubles';
  mode?: GeneratorMode;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  format,
  mode = 'tennis',
}) => {
  const teamCountText =
    group.teams.length === 1 ? '1 отбор' : `${group.teams.length} отбора`;

  return (
    <div
      data-testid={`group-card-${group.id}`}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transform transition-all duration-300 hover:shadow-md flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-700/80 dark:to-slate-700/50 px-5 py-3.5 border-b border-indigo-100 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center text-lg">
          <Shield className="w-5 h-5 text-indigo-500 mr-2 shrink-0" />
          <span>{group.name}</span>
        </h3>
        <Badge variant="indigo" size="sm">
          {teamCountText}
        </Badge>
      </div>

      {/* Teams Roster */}
      <div className="p-5 space-y-4 flex-1">
        {group.teams.map((team, idx) => {
          const displayTotalRating = (() => {
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
          })();

          return (
            <div
              key={team.id}
              className="bg-gray-50/70 dark:bg-slate-700/40 rounded-xl p-3 border border-gray-100 dark:border-slate-700/80"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold border border-gray-200 dark:border-slate-600">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                    {team.name}
                  </span>
                </div>

                {mode !== 'generic' && displayTotalRating !== undefined && displayTotalRating > 0 && (
                  <Badge variant="amber" size="sm" icon={Star}>
                    {displayTotalRating}
                  </Badge>
                )}
              </div>

              <ul className="space-y-1.5 pl-2">
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
                      className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-200"
                    >
                      <div className="flex items-center min-w-0">
                        <User className="w-3.5 h-3.5 mr-1.5 text-indigo-400 shrink-0" />
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
                  <li className="text-xs text-gray-400 italic py-1">
                    Няма играчи в отбора
                  </li>
                )}
              </ul>
            </div>
          );
        })}

        {group.teams.length === 0 && (
          <p className="text-xs text-gray-400 italic text-center py-4">
            Няма разпределени отбори в групата
          </p>
        )}
      </div>
    </div>
  );
};
