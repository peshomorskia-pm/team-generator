import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Edit, Trash2, ArrowRight } from 'lucide-react';
import type { Tournament } from '../../types/tournament';

export interface TournamentCardProps {
  tournament: Tournament;
  onEdit: (tournament: Tournament) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  in_progress: {
    label: 'В ход',
    classes:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  draft: {
    label: 'Чернова',
    classes:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  completed: {
    label: 'Приключил',
    classes:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
} as const;

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onEdit,
  onDelete,
}) => {
  const statusInfo = statusConfig[tournament.status] ?? statusConfig.draft;
  const formatLabel = tournament.format === 'doubles' ? 'По двойки' : 'Поединично';

  const formattedDate = new Date(tournament.date).toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        {/* Top Badges: Format & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
            {formatLabel}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.classes}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Tournament Title */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-2 line-clamp-1">
          {tournament.title}
        </h3>

        {/* Tournament Date */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>

        {/* Winner Badge (if present) */}
        {tournament.winner_team_name && (
          <div className="mb-3 inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
            🏆 Шампион: {tournament.winner_team_name}
          </div>
        )}

        {/* Notes Preview (if present) */}
        {tournament.notes && (
          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 bg-gray-50 dark:bg-slate-700/50 p-2.5 rounded-lg border border-gray-100 dark:border-slate-700/60">
            {tournament.notes}
          </p>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700/70 mt-4">
        <Link
          to={`/tournaments/${tournament.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          <span>Към турнира</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(tournament)}
            aria-label="Редактиране"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(tournament.id)}
            aria-label="Изтриване"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

TournamentCard.displayName = 'TournamentCard';
