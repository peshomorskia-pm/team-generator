import React from 'react';
import { Calendar, Edit2, Trash2, Trophy, User } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { MatchDetail, MatchPlayerDetail } from '../../types/matches';

import { resolveMatchFormat } from '../../utils/eloRecalculation';
import { getMatchOutcome } from '../../utils/standings';

export interface MatchCardProps {
  match: MatchDetail;
  onEdit: (match: MatchDetail) => void;
  onDelete?: (match: MatchDetail) => void;
  hideDelete?: boolean;
  isPlayoff?: boolean;
  readOnly?: boolean;
  team1Seed?: number;
  team2Seed?: number;
  court?: string;
  matchNumber?: number;
  className?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onEdit,
  onDelete,
  hideDelete = false,
  isPlayoff,
  readOnly = false,
  team1Seed,
  team2Seed,
  court,
  matchNumber,
  className = '',
}) => {
  const team1Players = match.match_players.filter((p) => p.team_side === 'team_1');
  const team2Players = match.match_players.filter((p) => p.team_side === 'team_2');

  const outcome = getMatchOutcome(match);
  const isUpcoming = !outcome.isCompleted;
  const team1Won = outcome.winner === 'team_1';
  const team2Won = outcome.winner === 'team_2';
  const isDraw = outcome.winner === 'draw';

  const formattedDate = new Date(match.played_at).toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const effectiveIsPlayoff = Boolean(isPlayoff);
  const matchRecord = match as unknown as Record<string, unknown>;
  const effectiveCourt = court ?? (typeof matchRecord.court === 'string' ? matchRecord.court : undefined);
  const effectiveMatchNumber =
    matchNumber ?? (typeof matchRecord.match_number === 'number' ? matchRecord.match_number : undefined);
  const matchStage = matchRecord.stage as string | number | undefined;

  const renderPlayerBadge = (p: MatchPlayerDetail) => {
    const name = p.players?.name ?? p.guest_name ?? 'Играч';
    const isGuest = !p.player_id;
    const delta =
      p.rating_after !== null && p.rating_before !== null
        ? Math.round(p.rating_after - p.rating_before)
        : null;

    return (
      <span
        key={p.id || `${name}-${p.team_side}`}
        title={name}
        data-testid={`player-badge-${p.id || name}`}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium max-w-[180px] sm:max-w-[200px] truncate shrink-0 ${
          isGuest
            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
            : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200'
        }`}
      >
        <User className="w-3 h-3 opacity-60 shrink-0" />
        <span className="truncate">{name}</span>
        {isGuest && <span className="opacity-75 text-[10px] shrink-0">(гост)</span>}
        {delta !== null && (
          <span
            className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
              delta > 0
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                : delta < 0
                ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </span>
    );
  };

  if (effectiveIsPlayoff) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs hover:shadow-md transition-all overflow-hidden p-4 sm:p-5 ${className}`}
        data-testid={`playoff-match-card-${match.id || 'unassigned'}`}
      >
        {/* Playoff Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{formattedDate}</span>
            </div>

            {match.group_name ? (
              /^финал/i.test(match.group_name.trim()) && !match.group_name.includes('🏆') ? (
                <Badge
                  variant="outline"
                  className="text-xs font-semibold bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                >
                  🏆 {match.group_name}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-xs font-semibold bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
                >
                  {match.group_name}
                </Badge>
              )
            ) : matchStage != null ? (
              <Badge
                variant="outline"
                className="text-xs font-semibold bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
              >
                {typeof matchStage === 'number' ? `Етап ${matchStage}` : String(matchStage)}
              </Badge>
            ) : null}

            {effectiveMatchNumber != null && (
              <Badge
                variant="outline"
                className="text-xs font-semibold bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
              >
                Мач #{effectiveMatchNumber}
              </Badge>
            )}

            {effectiveCourt && (
              <Badge
                variant="outline"
                className="text-xs font-semibold bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800"
              >
                {effectiveCourt.toLowerCase().includes('корт') ? effectiveCourt : `Корт ${effectiveCourt}`}
              </Badge>
            )}

            {match.sets && match.sets.length > 1 && (
              <Badge
                variant="outline"
                className="text-xs font-semibold bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
              >
                {match.sets.length} сета
              </Badge>
            )}

            {isUpcoming && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                Предстоящ
              </span>
            )}
            {isDraw && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                Равенство
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {!readOnly && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(match)}
                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                aria-label="Редактирай"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {!hideDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(match)}
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                aria-label="Изтрий"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stacked Layout Body */}
        <div className="space-y-1.5" data-testid="match-card-stacked-layout">
          {/* Team 1 Row */}
          <div
            data-testid="playoff-team-row-1"
            className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
              team1Won
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40'
                : 'bg-gray-50/60 dark:bg-gray-800/40 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
              {team1Seed != null && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shrink-0">
                  #{team1Seed}
                </span>
              )}
              <h4
                className={`text-sm sm:text-base truncate ${
                  team1Won
                    ? 'font-bold text-emerald-700 dark:text-emerald-400'
                    : 'font-semibold text-gray-900 dark:text-white'
                }`}
              >
                {match.team_1_name || 'Отбор 1'}
              </h4>
              {team1Won && (
                <Trophy
                  data-testid="winner-trophy-team-1"
                  className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0 ml-1"
                />
              )}
              {team1Players.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-2">
                  {team1Players.map(renderPlayerBadge)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 font-mono">
              {isUpcoming ? (
                <span className="font-mono text-base font-bold text-gray-400 dark:text-gray-500">-</span>
              ) : match.sets && match.sets.length > 1 ? (
                <div className="flex items-center gap-1">
                  {match.sets.map((s) => (
                    <span
                      key={s.set_number}
                      className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                      {s.team_1_score}
                    </span>
                  ))}
                  <span
                    className={`font-mono text-base font-extrabold ml-1.5 ${
                      team1Won ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {match.team_1_score}
                  </span>
                </div>
              ) : (
                <span
                  className={`font-mono text-xl sm:text-2xl font-extrabold ${
                    team1Won ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {match.sets && match.sets.length === 1 ? match.sets[0].team_1_score : match.team_1_score}
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-700/40 my-1" />

          {/* Team 2 Row */}
          <div
            data-testid="playoff-team-row-2"
            className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
              team2Won
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40'
                : 'bg-gray-50/60 dark:bg-gray-800/40 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
              {team2Seed != null && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shrink-0">
                  #{team2Seed}
                </span>
              )}
              <h4
                className={`text-sm sm:text-base truncate ${
                  team2Won
                    ? 'font-bold text-emerald-700 dark:text-emerald-400'
                    : 'font-semibold text-gray-900 dark:text-white'
                }`}
              >
                {match.team_2_name || 'Отбор 2'}
              </h4>
              {team2Won && (
                <Trophy
                  data-testid="winner-trophy-team-2"
                  className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0 ml-1"
                />
              )}
              {team2Players.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-2">
                  {team2Players.map(renderPlayerBadge)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 font-mono">
              {isUpcoming ? (
                <span className="font-mono text-base font-bold text-gray-400 dark:text-gray-500">-</span>
              ) : match.sets && match.sets.length > 1 ? (
                <div className="flex items-center gap-1">
                  {match.sets.map((s) => (
                    <span
                      key={s.set_number}
                      className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                      {s.team_2_score}
                    </span>
                  ))}
                  <span
                    className={`font-mono text-base font-extrabold ml-1.5 ${
                      team2Won ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {match.team_2_score}
                  </span>
                </div>
              ) : (
                <span
                  className={`font-mono text-xl sm:text-2xl font-extrabold ${
                    team2Won ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {match.sets && match.sets.length === 1 ? match.sets[0].team_2_score : match.team_2_score}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Playoff Footer */}
        <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/40 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{isUpcoming ? 'Статус: Предстоящ' : 'Статус: Завършен'}</span>
          {match.sets && match.sets.length > 1 && (
            <span className="font-mono font-medium">
              {match.sets.map((s) => `${s.team_1_score}:${s.team_2_score}`).join(', ')}
            </span>
          )}
        </div>
      </div>
    );
  }

  const resolvedFormat = resolveMatchFormat(match);
  const formatLabel = resolvedFormat === 'doubles' ? 'По двойки' : 'Поединично';

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs hover:shadow-md transition-all overflow-hidden p-5 ${className}`}
    >
      {/* Header with Date and Action Buttons */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-4">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{formattedDate}</span>
          {!effectiveIsPlayoff && (
            <Badge variant="indigo" size="sm" className="ml-2 font-semibold">
              {formatLabel}
            </Badge>
          )}
          {match.group_name && (
            <Badge
              variant="outline"
              className="text-xs font-semibold bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
            >
              {match.group_name}
            </Badge>
          )}
          {!effectiveIsPlayoff && match.round != null && match.round > 0 && (
            <Badge
              variant="outline"
              className="text-xs font-semibold bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800"
            >
              Кръг {match.round}
            </Badge>
          )}
          {isUpcoming && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              Предстоящ
            </span>
          )}
          {isDraw && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              Равенство
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!readOnly && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(match)}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              aria-label="Редактирай"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {!hideDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(match)}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              aria-label="Изтрий"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
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
              {match.team_1_name || 'Отбор 1'}
            </h4>
            {team1Won && <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {team1Players.length > 0 ? (
              team1Players.map(renderPlayerBadge)
            ) : (
              <span className="text-xs text-gray-400 italic">Няма играчи</span>
            )}
          </div>
        </div>

        {/* Score Board */}
        <div className="md:col-span-1 flex flex-col items-center justify-center py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-center text-center">
            {isUpcoming ? (
              <span className="text-gray-400 dark:text-gray-500 text-xl font-semibold tracking-widest">
                - : -
              </span>
            ) : match.sets && match.sets.length > 1 ? (
              <span className="font-mono text-sm sm:text-base font-bold text-gray-800 dark:text-gray-200 text-center whitespace-nowrap">
                {match.sets.map((s) => `${s.team_1_score}:${s.team_2_score}`).join(', ')}
              </span>
            ) : (
              <div className="flex items-center gap-2 text-2xl sm:text-3xl font-extrabold">
                <span
                  className={
                    team1Won
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-800 dark:text-gray-200'
                  }
                >
                  {match.sets && match.sets.length === 1
                    ? match.sets[0].team_1_score
                    : match.team_1_score}
                </span>
                <span className="text-gray-400 dark:text-gray-500 text-xl font-normal">:</span>
                <span
                  className={
                    team2Won
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-800 dark:text-gray-200'
                  }
                >
                  {match.sets && match.sets.length === 1
                    ? match.sets[0].team_2_score
                    : match.team_2_score}
                </span>
              </div>
            )}
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
              {match.team_2_name || 'Отбор 2'}
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5 md:justify-end">
            {team2Players.length > 0 ? (
              team2Players.map(renderPlayerBadge)
            ) : (
              <span className="text-xs text-gray-400 italic">Няма играчи</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

