import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import type { RankingStats } from '../../types/rankings';

export interface PodiumProps {
  topPlayers: RankingStats[];
}

export const Podium: React.FC<PodiumProps> = ({ topPlayers }) => {
  if (topPlayers.length === 0) return null;

  const first = topPlayers[0];
  const second = topPlayers[1];
  const third = topPlayers[2];

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 pt-4 pb-2" data-testid="rankings-podium">
      <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-4 sm:gap-6">
        {/* 2nd Place - Silver */}
        {second && (
          <div className="order-2 sm:order-1 flex-1 max-w-[240px] w-full flex flex-col items-center">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-200 dark:border-gray-700 shadow-xs flex flex-col items-center w-full text-center transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 mb-3 border-2 border-slate-300 shadow-xs">
                <Medal className="w-6 h-6 text-slate-400" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                2-ро място
              </span>
              <h3 className="font-bold text-base text-gray-900 dark:text-white truncate max-w-full">
                {second.player.name}
              </h3>
              <div className="mt-2 flex items-center gap-1.5 bg-slate-50 dark:bg-gray-700/50 px-3 py-1 rounded-full text-sm font-extrabold text-slate-700 dark:text-slate-200">
                <span>{second.rating}</span>
                <span className="text-xs font-normal text-gray-400">т.</span>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {second.wins}П - {second.losses}З ({second.winRate}%)
              </div>
            </div>
            <div className="hidden sm:flex w-full h-12 bg-slate-200/70 dark:bg-slate-700/50 rounded-t-xl mt-2 items-center justify-center font-black text-slate-400 text-lg">
              2
            </div>
          </div>
        )}

        {/* 1st Place - Gold */}
        {first && (
          <div className="order-1 sm:order-2 flex-1 max-w-[260px] w-full flex flex-col items-center -mt-2 sm:-mt-6">
            <div className="relative bg-gradient-to-b from-amber-50/80 to-white dark:from-amber-950/20 dark:to-gray-800 rounded-2xl p-6 border-2 border-amber-300 dark:border-amber-600/50 shadow-md flex flex-col items-center w-full text-center transition-all hover:shadow-lg">
              <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-500 dark:text-amber-400 mb-3 border-2 border-amber-400 shadow-xs">
                <Trophy className="w-7 h-7 fill-amber-400 text-amber-500" />
              </div>
              <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                Шампион
              </span>
              <h3 className="font-extrabold text-lg text-gray-900 dark:text-white truncate max-w-full">
                {first.player.name}
              </h3>
              <div className="mt-2 flex items-center gap-1.5 bg-amber-100/70 dark:bg-amber-900/40 px-3.5 py-1 rounded-full text-base font-black text-amber-800 dark:text-amber-300">
                <span>{first.rating}</span>
                <span className="text-xs font-normal text-amber-700 dark:text-amber-400">т.</span>
              </div>
              <div className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                {first.wins}П - {first.losses}З ({first.winRate}%)
              </div>
            </div>
            <div className="hidden sm:flex w-full h-20 bg-amber-200/70 dark:bg-amber-700/50 rounded-t-xl mt-2 items-center justify-center font-black text-amber-600 dark:text-amber-300 text-2xl">
              1
            </div>
          </div>
        )}

        {/* 3rd Place - Bronze */}
        {third && (
          <div className="order-3 flex-1 max-w-[240px] w-full flex flex-col items-center">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-5 border border-amber-800/20 dark:border-amber-900/30 shadow-xs flex flex-col items-center w-full text-center transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-700 dark:text-amber-500 mb-3 border-2 border-amber-600/40 shadow-xs">
                <Award className="w-6 h-6 text-amber-700 dark:text-amber-500" />
              </div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider mb-1">
                3-то място
              </span>
              <h3 className="font-bold text-base text-gray-900 dark:text-white truncate max-w-full">
                {third.player.name}
              </h3>
              <div className="mt-2 flex items-center gap-1.5 bg-amber-50 dark:bg-gray-700/50 px-3 py-1 rounded-full text-sm font-extrabold text-amber-900 dark:text-amber-200">
                <span>{third.rating}</span>
                <span className="text-xs font-normal text-gray-400">т.</span>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {third.wins}П - {third.losses}З ({third.winRate}%)
              </div>
            </div>
            <div className="hidden sm:flex w-full h-8 bg-amber-100 dark:bg-amber-950/40 rounded-t-xl mt-2 items-center justify-center font-black text-amber-700 dark:text-amber-500 text-base">
              3
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
