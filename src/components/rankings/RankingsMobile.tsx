import React from 'react';
import { User } from 'lucide-react';
import type { RankingStats } from '../../types/rankings';
import { FormBadge } from './FormBadge';

export interface RankingsMobileProps {
  rankings: RankingStats[];
}

export const RankingsMobile: React.FC<RankingsMobileProps> = ({ rankings }) => {
  return (
    <div className="space-y-3">
      {rankings.map((stat) => (
        <div
          key={stat.player.id}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center font-bold text-gray-700 dark:text-gray-300 text-sm w-7">
                #{stat.rank}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white text-base">
                  {stat.player.name}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              {stat.winRate}%
            </span>
          </div>

          {/* Primary 3-Metric Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs">
            <div className="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-xl text-center">
              <span className="block text-gray-400 text-[10px] uppercase font-semibold">
                М
              </span>
              <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                {stat.matchesPlayed}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-xl text-center">
              <span className="block text-gray-400 text-[10px] uppercase font-semibold">
                П
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {stat.wins}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-xl text-center">
              <span className="block text-gray-400 text-[10px] uppercase font-semibold">
                З
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                {stat.losses}
              </span>
            </div>
          </div>

          {/* Secondary Detail Row: Game Difference + Form */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-medium">
              Геймова разлика:{' '}
              <span
                className={`font-bold ${
                  stat.gameDifference > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : stat.gameDifference < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-gray-400'
                }`}
              >
                {stat.gameDifference > 0 ? `+${stat.gameDifference}` : stat.gameDifference}
              </span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium">Форма:</span>
              <FormBadge form={stat.form} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
