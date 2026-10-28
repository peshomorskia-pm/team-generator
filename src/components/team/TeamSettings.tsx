import { memo, useMemo } from 'react';
import { Shuffle, Sliders, LayoutGrid, AlertCircle, AlertTriangle } from 'lucide-react';
import { TeamSettingsProps } from '../../types';
import { Button, Input } from '../ui';

export const TeamSettings = memo(function TeamSettings({
  mode = 'tennis',
  onModeChange,
  numberOfTeams = null,
  onSettingsChange,
  onGenerate,
  playersPerTeam = null,
  onPlayersPerTeamChange,
  balanceByRating = false,
  onBalanceToggle,
  hasRatings = false,
  format = 'doubles',
  onFormatChange,
  canGenerate: _canGenerate = true,
  validationError = null,
  formationMode = 'auto',
  onFormationModeChange,
  manualTeamCount = 4,
  onManualTeamCountChange,
  onCreateBlankTeams,
  activePoolLength,
  activePool,
}: TeamSettingsProps) {
  const poolLength = activePoolLength ?? (Array.isArray(activePool) ? activePool.length : 0);
  const playersPerTeamForMode = format === 'singles' ? 1 : 2;
  const neededPlayers = manualTeamCount * playersPerTeamForMode;
  const isInsufficient = poolLength < neededPlayers;
  const isExcess = poolLength > neededPlayers;
  const isOdd = format === 'doubles' && poolLength % 2 !== 0;
  const recommendedTeams = Math.floor(poolLength / playersPerTeamForMode);
  const excessCount = poolLength - neededPlayers;
  const excessReserveText = excessCount === 1 ? 'играч остава резерва' : 'играчи остават резерви';
  const formatLabel = format === 'singles' ? 'поединично' : 'по двойки';

  const availableTeamCounts = useMemo(() => {
    const baseCounts = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    if (!baseCounts.includes(manualTeamCount)) {
      return [...baseCounts, manualTeamCount].sort((a, b) => a - b);
    }
    return baseCounts;
  }, [manualTeamCount]);

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex flex-col space-y-1.5">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Режим
        </span>
        <div className="flex items-center rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 self-start">
          <button
            type="button"
            onClick={() => onModeChange?.('tennis')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              mode === 'tennis'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-pressed={mode === 'tennis'}
          >
            🎾 Тенис
          </button>
          <button
            type="button"
            onClick={() => onModeChange?.('generic')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              mode === 'generic'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-pressed={mode === 'generic'}
          >
            🎲 Универсален
          </button>
        </div>
      </div>

      {/* Mode-specific Controls */}
      {mode === 'tennis' ? (
        <div className="space-y-4">
          {/* Formation Mode Selector */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Режим на сформиране
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onFormationModeChange?.('auto')}
                className={`w-full py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all text-center flex items-center justify-center ${
                  formationMode === 'auto'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-pressed={formationMode === 'auto'}
              >
                🤖 Автоматично
              </button>
              <button
                type="button"
                onClick={() => onFormationModeChange?.('manual')}
                className={`w-full py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all text-center flex items-center justify-center ${
                  formationMode === 'manual'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-pressed={formationMode === 'manual'}
              >
                📋 Интерактивна дъска (Ръчно)
              </button>
            </div>
          </div>

          {/* Format Selector Pills */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Формат на мача
            </span>
            <div className="flex items-center rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 self-start">
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
            </div>
          </div>

          {formationMode === 'manual' && (
            <div className="space-y-3">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="manualTeamCountSelect" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Брой отбори
                </label>
                <select
                  id="manualTeamCountSelect"
                  value={manualTeamCount}
                  onChange={(e) => onManualTeamCountChange?.(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                  {availableTeamCounts.map((count) => (
                    <option key={count} value={count}>
                      {count} отбора
                    </option>
                  ))}
                </select>
              </div>

              {/* Insufficient Players Error Banner */}
              {isInsufficient && (
                <div
                  data-testid="manual-insufficient-players-error"
                  className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span>
                      Недостатъчно играчи: За {manualTeamCount} отбора {formatLabel} са нужни {neededPlayers} играчи (в списъка: {poolLength}).
                    </span>
                  </div>
                </div>
              )}

              {/* Excess Players Warning Banner */}
              {isExcess && (
                <div
                  data-testid="manual-excess-players-warning"
                  className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200 flex flex-col gap-2"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span>
                        Внимание: Избрани са {poolLength} играчи за {manualTeamCount} отбора ({neededPlayers} места). {excessCount} {excessReserveText}.
                      </span>
                    </div>
                  </div>
                  {recommendedTeams >= 2 && onManualTeamCountChange && (
                    <div className="flex justify-start pl-7">
                      <button
                        type="button"
                        onClick={() => onManualTeamCountChange(recommendedTeams)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-200/70 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800/80 text-amber-900 dark:text-amber-100 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>👉 Задай {recommendedTeams} отбора</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Odd Player Count Warning Banner */}
              {isOdd && (
                <div
                  data-testid="manual-odd-players-warning"
                  className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span>
                      Списъкът съдържа нечетен брой играчи ({poolLength}). За пълни двойки е нужен още 1 играч.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation Warning */}
          {formationMode === 'auto' && validationError && (
            <div
              data-testid="tennis-validation-warning"
              className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200"
            >
              {validationError}
            </div>
          )}
        </div>
      ) : (
        /* Generic Settings Inputs */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="number"
              id="numTeams"
              label="Брой отбори"
              min="1"
              value={numberOfTeams ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                onSettingsChange?.(val !== null && Number.isNaN(val) ? null : val);
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

          {/* Validation Warning */}
          {validationError && (
            <div
              data-testid="generic-validation-warning"
              className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200"
            >
              {validationError}
            </div>
          )}
        </div>
      )}

      {mode !== 'generic' && hasRatings && onBalanceToggle && (
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

      {/* Generate / Create Blank Teams Button */}
      {formationMode === 'manual' && mode === 'tennis' ? (
        <Button
          type="button"
          id="createBlankTeamsBtn"
          size="lg"
          onClick={onCreateBlankTeams}
          disabled={isInsufficient}
          className="w-full flex items-center justify-center space-x-2 cursor-pointer py-4"
        >
          <LayoutGrid className="w-5 h-5" />
          <span>📋 Създай празни отбори</span>
        </Button>
      ) : (
        <Button
          type="button"
          id="generateBtn"
          size="lg"
          onClick={onGenerate}
          disabled={Boolean(validationError)}
          className="w-full flex items-center justify-center space-x-2 cursor-pointer py-4"
        >
          <Shuffle className="w-5 h-5" />
          <span>Разпредели в отбори</span>
        </Button>
      )}
    </div>
  );
});
