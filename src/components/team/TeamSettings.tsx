import React from 'react';
import { Shuffle, Sliders } from 'lucide-react';
import { TeamSettingsProps } from '../../types';
import { Button, Input } from '../ui';

export const TeamSettings: React.FC<TeamSettingsProps> = ({
  numberOfTeams,
  onSettingsChange,
  onGenerate,
  playersPerTeam = null,
  onPlayersPerTeamChange,
  balanceByRating = false,
  onBalanceToggle,
  hasRatings = false,
}) => {
  return (
    <div className="space-y-6">
      {/* Settings Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          type="number"
          id="numTeams"
          label="Брой отбори"
          min="1"
          value={numberOfTeams || ''}
          onChange={(e) => {
            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
            onSettingsChange(Number.isNaN(val) ? 0 : val);
          }}
          placeholder="Напр. 2"
        />

        <Input
          type="number"
          id="playersPerTeam"
          label={
            <>
              <span className="opacity-80 font-normal mr-1">(или)</span> Брой играчи в отбор
            </>
          }
          min="1"
          value={playersPerTeam ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
            onPlayersPerTeamChange?.(val !== null && Number.isNaN(val) ? null : val);
          }}
          placeholder="Напр. 5"
        />
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
      <Button
        type="button"
        id="generateBtn"
        size="lg"
        onClick={onGenerate}
        className="w-full flex items-center justify-center space-x-2 cursor-pointer py-4"
      >
        <Shuffle className="w-5 h-5" />
        <span>Разпредели в отбори</span>
      </Button>
    </div>
  );
};
