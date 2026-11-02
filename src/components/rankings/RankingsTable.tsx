import React from 'react';
import { User } from 'lucide-react';
import type { RankingStats } from '../../types/rankings';
import { FormBadge } from './FormBadge';

export interface RankingsTableProps {
  rankings: RankingStats[];
}

export const RankingsTable: React.FC<RankingsTableProps> = ({ rankings }) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xs">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/75 dark:bg-gray-700/30 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
            <th className="py-3.5 px-3 text-center w-12 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
              #
            </th>
            <th className="py-3.5 px-4 text-left">
              Играч
            </th>
            <th className="py-3.5 px-3 text-center w-14">
              М
            </th>
            <th className="py-3.5 px-3 text-center w-14 text-emerald-600 dark:text-emerald-400">
              П
            </th>
            <th className="py-3.5 px-3 text-center w-14 text-rose-600 dark:text-rose-400">
              З
            </th>
            <th className="text-center font-bold text-gray-700 dark:text-gray-300 px-4 py-3.5 whitespace-nowrap w-40">
              УСПЕВАЕМОСТ
            </th>
            <th
              className="py-3.5 px-3 text-center whitespace-nowrap"
              title="Геймова разлика (спечелени - загубени геймове)"
            >
              Геймова разлика
            </th>
            <th className="py-3.5 px-4 text-center w-36">
              Форма
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {rankings.map((stat) => (
            <tr
              key={stat.player.id}
              className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors"
            >
              <td className="py-3 px-3 text-center">
                <span className="font-bold text-gray-700 dark:text-gray-300 w-10 text-center inline-block">
                  {stat.rank}
                </span>
              </td>
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="truncate">{stat.player.name}</span>
                </div>
              </td>
              <td className="py-3 px-3 text-center text-gray-600 dark:text-gray-300 font-semibold">
                {stat.matchesPlayed}
              </td>
              <td className="py-3 px-3 text-center">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {stat.wins}
                </span>
              </td>
              <td className="py-3 px-3 text-center">
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {stat.losses}
                </span>
              </td>
              <td className="py-3 px-4 text-center font-bold text-gray-900 dark:text-white">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-16 sm:w-20 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden shrink-0">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${stat.winRate}%` }}
                    />
                  </div>
                  <span className="w-14 tabular-nums text-right font-bold text-gray-900 dark:text-white shrink-0">
                    {stat.winRate}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-3 text-center whitespace-nowrap">
                <span
                  className={
                    stat.gameDifference > 0
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : stat.gameDifference < 0
                      ? 'text-rose-600 dark:text-rose-400 font-semibold'
                      : 'text-gray-400 font-medium'
                  }
                >
                  {stat.gameDifference > 0 ? `+${stat.gameDifference}` : stat.gameDifference}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                <div className="flex justify-center">
                  <FormBadge form={stat.form} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
