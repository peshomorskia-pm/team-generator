import React from 'react';
import { User, Star, Shield, X, Users } from 'lucide-react';
import type { TournamentGroup, GeneratorMode } from '../../types';
import { Badge } from '../ui/Badge';

export interface GroupCardProps {
  group: TournamentGroup;
  format?: 'singles' | 'doubles';
  mode?: GeneratorMode;
  targetSize?: number;
  onSelectEmptySlot?: (groupId: string) => void;
  onRemoveTeam?: (groupId: string, teamId: string) => void;
  onMoveTeam?: (teamId: string, targetGroupId: string) => void;
  availableGroups?: { id: string; name: string }[];
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  format,
  mode = 'tennis',
  targetSize,
  onSelectEmptySlot,
  onRemoveTeam,
  onMoveTeam,
  availableGroups = [],
}) => {
  const teamCountText =
    group.teams.length === 1 ? '1 отбор' : `${group.teams.length} отбора`;

  const effectiveTargetSize = targetSize ?? group.targetSize ?? 3;
  const emptySlotsCount = Math.max(0, effectiveTargetSize - group.teams.length);

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
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold border border-gray-200 dark:border-slate-600 shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm shrink-0">
                    {team.name}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {mode !== 'generic' && displayTotalRating !== undefined && displayTotalRating > 0 && (
                    <Badge variant="amber" size="sm" icon={Star}>
                      {displayTotalRating}
                    </Badge>
                  )}

                  {/* Remove team from group */}
                  {onRemoveTeam && (
                    <button
                      type="button"
                      onClick={() => onRemoveTeam(group.id, team.id)}
                      aria-label="Премахни от групата"
                      title="Премахни от групата"
                      data-testid={`remove-team-${team.id}`}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-md transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
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

              {/* Group Transfer */}
              {onMoveTeam && availableGroups.length > 1 && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span>Премести в:</span>
                  <select
                    aria-label="Премести в друга група"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        onMoveTeam(team.id, e.target.value);
                      }
                    }}
                    className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="" disabled>
                      Избери група...
                    </option>
                    {availableGroups
                      .filter((g) => g.id !== group.id)
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty slot buttons */}
        {onSelectEmptySlot &&
          emptySlotsCount > 0 &&
          Array.from({ length: emptySlotsCount }).map((_, slotIdx) => (
            <button
              key={`empty-group-slot-${slotIdx}`}
              type="button"
              data-testid="empty-group-slot"
              onClick={() => onSelectEmptySlot(group.id)}
              aria-label={`Избери отбор за ${group.name}`}
              className="w-full flex items-center justify-between text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm border border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl px-4 py-2.5 bg-indigo-50/40 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center min-w-0">
                <Users className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-medium">+ Избери отбор</span>
              </div>
              <span className="text-xs text-indigo-400/80 dark:text-indigo-400/60 italic hidden sm:inline">
                Свободно място
              </span>
            </button>
          ))}

        {!onSelectEmptySlot && group.teams.length === 0 && (
          <p className="text-xs text-gray-400 italic text-center py-4">
            Няма разпределени отбори в групата
          </p>
        )}
      </div>
    </div>
  );
};
