import React from 'react';
import { User, Award, Trophy, Medal } from 'lucide-react';
import type { RankingStats } from '../../types/rankings';

export interface RankingsMobileProps {
  rankings: RankingStats[];
}

export const RankingsMobile: React.FC<RankingsMobileProps> = ({ rankings }) => {
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-extrabold text-sm border border-amber-300">
          <Trophy className="w-3.5 h-3.5 fill-amber-400 text-amber-500 mr-0.5" />
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-bold text-sm border border-slate-300">
          <Medal className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-400 font-bold text-sm border border-amber-600/30">
          <Award className="w-3.5 h-3.5 text-amber-600 mr-0.5" />
          3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 text-gray-500 dark:text-gray-400 font-bold text-sm">
        #{rank}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {rankings.map((stat) => (
        <div
          key={stat.player.id}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              {getRankBadge(stat.rank)}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white text-base">
                  {stat.player.name}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {stat.rating}
              </span>
              <span className="text-xs text-gray-400 ml-1">т.</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs">
            <div className="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-xl text-center">
              <span className="block text-gray-400 text-[10px] uppercase font-semibold">
                Мачове
              </span>
              <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                {stat.matchesPlayed}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-xl text-center">
              <span className="block text-gray-400 text-[10px] uppercase font-semibold">
                П-З
              </span>
              <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                <span className="text-emerald-600 dark:text-emerald-400">{stat.wins}</span>
                <span className="text-gray-400 mx-0.5">-</span>
                <span className="text-red-500">{stat.losses}</span>
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-xl text-center">
              <span className="block text-gray-400 text-[10px] uppercase font-semibold">
                Победи
              </span>
              <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                {stat.winRate}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
