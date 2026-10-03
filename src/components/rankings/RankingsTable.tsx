import React from 'react';
import { User, Award, Trophy, Medal } from 'lucide-react';
import type { RankingStats } from '../../types/rankings';

export interface RankingsTableProps {
  rankings: RankingStats[];
}

export const RankingsTable: React.FC<RankingsTableProps> = ({ rankings }) => {
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
        {rank}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xs">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/75 dark:bg-gray-700/30 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
            <th className="py-3.5 px-4 text-center w-16">Място</th>
            <th className="py-3.5 px-4">Играч</th>
            <th className="py-3.5 px-4 text-right">Рейтинг</th>
            <th className="py-3.5 px-4 text-center">Мачове</th>
            <th className="py-3.5 px-4 text-center">П-З</th>
            <th className="py-3.5 px-4 text-right">Победи %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {rankings.map((stat) => (
            <tr
              key={stat.player.id}
              className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors"
            >
              <td className="py-3 px-4 text-center font-bold">
                {getRankBadge(stat.rank)}
              </td>
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="truncate">{stat.player.name}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                {stat.rating}
              </td>
              <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300 font-semibold">
                {stat.matchesPlayed}
              </td>
              <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300 font-medium">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stat.wins}</span>
                <span className="text-gray-400 mx-1">-</span>
                <span className="text-red-500 font-bold">{stat.losses}</span>
              </td>
              <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 hidden sm:block">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${stat.winRate}%` }}
                    />
                  </div>
                  <span>{stat.winRate}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
