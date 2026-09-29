import React from 'react';
import { Shuffle, Sliders } from 'lucide-react';
import { TeamSettingsProps as BaseTeamSettingsProps } from '../../types';

export interface TeamSettingsProps extends BaseTeamSettingsProps {
  playersPerTeam?: number | '';
  onPlayersPerTeamChange?: (count: number | '') => void;
  balanceByRating?: boolean;
  onBalanceToggle?: (checked: boolean) => void;
  hasRatings?: boolean;
}

export const TeamSettings: React.FC<TeamSettingsProps> = ({
  numberOfTeams,
  onSettingsChange,
  onGenerate,
  playersPerTeam = '',
  onPlayersPerTeamChange,
  balanceByRating = false,
  onBalanceToggle,
  hasRatings = false,
}) => {
  return (
    <div className="space-y-6">
      {/* Settings Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="numTeams" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Брой отбори
          </label>
          <input
            type="number"
            id="numTeams"
            min="1"
            value={numberOfTeams || ''}
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
              onSettingsChange(val);
            }}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Напр. 2"
          />
        </div>

        <div>
          <label
            htmlFor="playersPerTeam"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            <span className="opacity-80 font-normal mr-1">(или)</span> Брой играчи в отбор
          </label>
          <input
            type="number"
            id="playersPerTeam"
            min="1"
            value={playersPerTeam || ''}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
              onPlayersPerTeamChange?.(val);
            }}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Напр. 5"
          />
        </div>
      </div>

      {hasRatings && onBalanceToggle && (
        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <label htmlFor="balanceToggle" className="text-sm font-medium text-amber-900 dark:text-amber-200 cursor-pointer">
              Балансирай отборите по рейтинг на играчите
            </label>
          </div>
          <input
            id="balanceToggle"
            type="checkbox"
            checked={balanceByRating}
            onChange={(e) => onBalanceToggle(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 cursor-pointer"
          />
        </div>
      )}

      {/* Generate Button */}
      <button
        type="button"
        id="generateBtn"
        onClick={onGenerate}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-md hover:shadow-lg transform transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
      >
        <Shuffle className="w-5 h-5" />
        <span>Разпредели в отбори</span>
      </button>
    </div>
  );
};
