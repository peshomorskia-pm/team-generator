import { memo } from 'react';
import { Shuffle, Sliders } from 'lucide-react';
import { TeamSettingsProps } from '../../types';
import { Button, Input } from '../ui';

export const TeamSettings = memo(function TeamSettings({
  numberOfTeams,
  onSettingsChange,
  onGenerate,
  playersPerTeam = null,
  onPlayersPerTeamChange,
  balanceByRating = false,
  onBalanceToggle,
  hasRatings = false,
  format = 'singles',
  onFormatChange,
}: TeamSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Format Selector Pills */}
      <div className="flex flex-col space-y-1.5">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Формат на мача
        </span>
        <div className="flex items-center rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 self-start">
          <button
            type="button"
            onClick={() => onFormatChange?.('singles')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              format === 'singles'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-pressed={format === 'singles'}
          >
            Поединично
          </button>
          <button
            type="button"
            onClick={() => onFormatChange?.('doubles')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              format === 'doubles'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-pressed={format === 'doubles'}
          >
            По двойки
          </button>
        </div>
      </div>

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
});
