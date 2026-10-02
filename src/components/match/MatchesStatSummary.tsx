import React from 'react';
import { Swords, Flame, Calendar } from 'lucide-react';
import type { MatchDetail } from '../../types/matches';

export interface MatchesStatSummaryProps {
  matches: MatchDetail[];
}

export const MatchesStatSummary: React.FC<MatchesStatSummaryProps> = ({ matches }) => {
  const totalMatches = matches.length;
  const totalGoals = matches.reduce(
    (sum, m) => sum + (m.team_1_score || 0) + (m.team_2_score || 0),
    0
  );

  const lastMatch = matches.length > 0 ? matches[0] : null;
  const lastMatchDateFormatted = lastMatch
    ? new Date(lastMatch.played_at).toLocaleDateString('bg-BG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Няма';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-4 transition-all">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
          <Swords className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
            Общо изиграни мачове
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
            {totalMatches}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-4 transition-all">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
          <Flame className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
            Общо отбелязани голове
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
            {totalGoals}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-4 transition-all">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
            Последен мач
          </p>
          <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5">
            {lastMatchDateFormatted}
          </p>
        </div>
      </div>
    </div>
  );
};
