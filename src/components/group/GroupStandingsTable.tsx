import React from 'react';
import { Trophy } from 'lucide-react';
import type { GroupStandingRow } from '../../types/standings';

export interface GroupStandingsTableProps {
  groupName?: string;
  standings: GroupStandingRow[];
  highlightTop?: number; // default: 2 (playoff threshold)
  className?: string;
}

export const GroupStandingsTable: React.FC<GroupStandingsTableProps> = ({
  groupName,
  standings,
  highlightTop = 2,
  className = '',
}) => {
  const hasCompletedMatches = standings.some((s) => s.played > 0);

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}
      data-testid="group-standings-table-container"
    >
      {groupName && (
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Класиране - {groupName}
            </h3>
          </div>
          <span className="text-[11px] text-gray-400 dark:text-gray-400 font-medium">
            Топ {highlightTop} се класират за елиминации
          </span>
        </div>
      )}

      {standings.length === 0 ? (
        <div className="p-6 text-center text-xs text-gray-500 dark:text-gray-400">
          Няма добавени отбори в групата.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-700 dark:text-gray-200">
              <thead className="text-[11px] uppercase bg-gray-50 dark:bg-slate-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th scope="col" className="w-10 px-3 py-2.5 text-center font-bold">
                    #
                  </th>
                  <th scope="col" className="min-w-[140px] px-4 py-2.5 font-bold">
                    Отбор
                  </th>
                  <th scope="col" className="w-12 px-2 py-2.5 text-center font-bold" title="Изиграни мачове">
                    М
                  </th>
                  <th scope="col" className="w-12 px-2 py-2.5 text-center font-bold" title="Победи">
                    П
                  </th>
                  <th scope="col" className="w-12 px-2 py-2.5 text-center font-bold" title="Загуби">
                    З
                  </th>
                  <th scope="col" className="w-16 px-2 py-2.5 text-center font-bold" title="Геймова разлика (спечелени - загубени)">
                    +/-
                  </th>
                  <th scope="col" className="w-12 px-3 py-2.5 text-center font-extrabold text-indigo-600 dark:text-indigo-400" title="Точки (1 при победа)">
                    Т
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
                {standings.map((row) => {
                  const isPlayoffSpot = row.rank <= highlightTop;
                  const diffDisplay =
                    row.gameDiff > 0
                      ? `+${row.gameDiff}`
                      : `${row.gameDiff}`;

                  return (
                    <tr
                      key={row.teamId || row.teamName}
                      className={`transition-colors ${
                        isPlayoffSpot
                          ? 'bg-emerald-50/40 hover:bg-emerald-50/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30'
                          : 'hover:bg-gray-50/60 dark:hover:bg-slate-700/30'
                      }`}
                      data-testid={`standings-row-${row.rank}`}
                    >
                      <td className="px-3 py-2.5 text-center">
                        {isPlayoffSpot ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                            {row.rank}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-400 font-semibold">
                            {row.rank}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{row.teamName}</span>
                          {isPlayoffSpot && (
                            <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                              Плейофи
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center text-gray-600 dark:text-gray-300">
                        {row.played}
                      </td>
                      <td className="px-2 py-2.5 text-center font-medium text-emerald-600 dark:text-emerald-400">
                        {row.won}
                      </td>
                      <td className="px-2 py-2.5 text-center font-medium text-rose-500 dark:text-rose-400">
                        {row.lost}
                      </td>
                      <td className="px-2 py-2.5 text-center font-semibold text-gray-700 dark:text-gray-300">
                        {diffDisplay}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-sm text-indigo-600 dark:text-indigo-400">
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!hasCompletedMatches && (
            <div className="px-4 py-2 bg-gray-50/50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-700/60 text-[11px] text-gray-400 dark:text-gray-400 italic text-center">
              Все още няма изиграни мачове в групата.
            </div>
          )}
        </>
      )}
    </div>
  );
};

GroupStandingsTable.displayName = 'GroupStandingsTable';
export default GroupStandingsTable;
