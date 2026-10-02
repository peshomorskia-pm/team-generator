import React from 'react';
import { Calendar, Edit2, Trash2, Trophy, User } from 'lucide-react';
import type { MatchDetail } from '../../types/matches';

export interface MatchCardProps {
  match: MatchDetail;
  onEdit: (match: MatchDetail) => void;
  onDelete: (match: MatchDetail) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onEdit, onDelete }) => {
  const team1Players = match.match_players.filter((p) => p.team_side === 'team_1');
  const team2Players = match.match_players.filter((p) => p.team_side === 'team_2');

  const team1Won = match.team_1_score > match.team_2_score;
  const team2Won = match.team_2_score > match.team_1_score;
  const isDraw = match.team_1_score === match.team_2_score;

  const formattedDate = new Date(match.played_at).toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs hover:shadow-md transition-all overflow-hidden p-5">
      {/* Header with Date and Action Buttons */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-4">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{formattedDate}</span>
          {isDraw && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              Равенство
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(match)}
            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            aria-label="Редактирай"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(match)}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            aria-label="Изтрий"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Score and Teams Section */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
        {/* Team 1 Roster */}
        <div className="md:col-span-3 text-left">
          <div className="flex items-center gap-1.5 mb-2">
            <h4
              className={`font-bold text-sm sm:text-base ${
                team1Won
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              Отбор 1
            </h4>
            {team1Won && <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {team1Players.length > 0 ? (
              team1Players.map((p) => {
                const name = p.players?.name ?? p.guest_name ?? 'Играч';
                const isGuest = !p.player_id;
                return (
                  <span
                    key={p.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      isGuest
                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                        : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <User className="w-3 h-3 opacity-60" />
                    <span>{name}</span>
                    {isGuest && <span className="opacity-75 text-[10px]">(гост)</span>}
                  </span>
                );
              })
            ) : (
              <span className="text-xs text-gray-400 italic">Няма играчи</span>
            )}
          </div>
        </div>

        {/* Score Board */}
        <div className="md:col-span-1 flex flex-col items-center justify-center py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-2xl sm:text-3xl font-extrabold">
            <span
              className={
                team1Won
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-800 dark:text-gray-200'
              }
            >
              {match.team_1_score}
            </span>
            <span className="text-gray-400 dark:text-gray-500 text-xl font-normal">:</span>
            <span
              className={
                team2Won
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-800 dark:text-gray-200'
              }
            >
              {match.team_2_score}
            </span>
          </div>
        </div>

        {/* Team 2 Roster */}
        <div className="md:col-span-3 text-left md:text-right">
          <div className="flex items-center gap-1.5 mb-2 md:justify-end">
            {team2Won && <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />}
            <h4
              className={`font-bold text-sm sm:text-base ${
                team2Won
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              Отбор 2
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5 md:justify-end">
            {team2Players.length > 0 ? (
              team2Players.map((p) => {
                const name = p.players?.name ?? p.guest_name ?? 'Играч';
                const isGuest = !p.player_id;
                return (
                  <span
                    key={p.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      isGuest
                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                        : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <User className="w-3 h-3 opacity-60" />
                    <span>{name}</span>
                    {isGuest && <span className="opacity-75 text-[10px]">(гост)</span>}
                  </span>
                );
              })
            ) : (
              <span className="text-xs text-gray-400 italic">Няма играчи</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
