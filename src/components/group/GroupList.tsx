import React, { useState, useCallback, useMemo } from 'react';
import { Shuffle, RotateCcw, Copy, Check, Calendar, ClipboardList, Sparkles, AlertTriangle } from 'lucide-react';
import type { TournamentGroup, GeneratorMode, TournamentMatch, Team } from '../../types';
import { GroupCard } from './GroupCard';
import { Badge } from '../ui/Badge';
import { copyTextToClipboard, formatGroupsForClipboard } from '../../utils/clipboard';

export interface GroupListProps {
  groups: TournamentGroup[];
  unassignedTeams?: Team[];
  targetGroupSizes?: number[];
  onSelectEmptySlot?: (groupId: string) => void;
  onRemoveTeam?: (groupId: string, teamId: string) => void;
  onMoveTeam?: (teamId: string, targetGroupId: string) => void;
  onRedraw?: () => void;
  onReDraw?: () => void;
  onReset?: () => void;
  onClear?: () => void;
  onInitializeBlankGroups?: () => void;
  onAutoFillRemainingGroups?: () => void;
  canGenerateSchedule?: boolean;
  validationMessage?: string | null;
  onGenerateSchedule?: () => void;
  hasSchedule?: boolean;
  schedule?: TournamentMatch[];
  mode?: GeneratorMode;
  format?: 'singles' | 'doubles';
  onCopy?: () => void;
  isCopied?: boolean;
}

export const GroupList: React.FC<GroupListProps> = ({
  groups,
  unassignedTeams,
  targetGroupSizes,
  onSelectEmptySlot,
  onRemoveTeam,
  onMoveTeam,
  onRedraw,
  onReDraw,
  onReset,
  onClear,
  onInitializeBlankGroups,
  onAutoFillRemainingGroups,
  canGenerateSchedule = true,
  validationMessage,
  onGenerateSchedule,
  hasSchedule = false,
  schedule,
  mode = 'tennis',
  format,
  onCopy,
  isCopied: externalIsCopied,
}) => {
  const [internalIsCopied, setInternalIsCopied] = useState(false);

  const handleRedraw = onRedraw || onReDraw;
  const handleReset = onReset || onClear;

  const handleCopy = useCallback(async () => {
    if (onCopy) {
      onCopy();
      return;
    }
    const textToCopy = formatGroupsForClipboard(groups, mode, format, schedule);
    const success = await copyTextToClipboard(textToCopy);
    if (success) {
      setInternalIsCopied(true);
      setTimeout(() => setInternalIsCopied(false), 2000);
    }
  }, [groups, mode, format, schedule, onCopy]);

  const copiedState = externalIsCopied ?? internalIsCopied;

  const availableGroups = useMemo(
    () => groups.map((g) => ({ id: g.id, name: g.name })),
    [groups]
  );

  if (!groups || groups.length === 0) {
    return null;
  }

  const isScheduleDisabled = !canGenerateSchedule;

  return (
    <div id="tournamentGroupsContainer" className="w-full max-w-5xl mt-10 transition-all duration-300">
      {/* Validation Message / Gating Warning */}
      {validationMessage && (
        <div
          data-testid="group-validation-message"
          className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-sm flex items-center justify-between"
        >
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 shrink-0 text-amber-500" />
            <span>{validationMessage}</span>
          </div>
          {onAutoFillRemainingGroups && unassignedTeams && unassignedTeams.length > 0 && (
            <button
              type="button"
              onClick={onAutoFillRemainingGroups}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-3 shrink-0"
            >
              Попълни автоматично
            </button>
          )}
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between mb-6 px-2 gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
            <span>Турнирни групи</span>
          </h2>
          {unassignedTeams !== undefined && (
            unassignedTeams.length === 0 ? (
              <Badge variant="emerald" size="sm">
                Няма неразпределени отбори
              </Badge>
            ) : (
              <Badge variant="amber" size="sm">
                {unassignedTeams.length === 1
                  ? 'Остава 1 неразпределен отбор'
                  : `Остават ${unassignedTeams.length} неразпределени отбора`}
              </Badge>
            )
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onGenerateSchedule && !hasSchedule && (
            <button
              type="button"
              id="generateScheduleBtn"
              onClick={onGenerateSchedule}
              disabled={isScheduleDisabled}
              title={isScheduleDisabled && validationMessage ? validationMessage : 'Генерирай програма с мачове за турнира'}
              aria-label="Генерирай програма с мачове"
              className={`text-sm font-semibold flex items-center px-3.5 py-1.5 rounded-lg shadow-sm transition-colors ${
                isScheduleDisabled
                  ? 'bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white cursor-pointer'
              }`}
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              <span>📅 Генерирай програма с мачове</span>
            </button>
          )}

          {onAutoFillRemainingGroups && unassignedTeams && unassignedTeams.length > 0 && (
            <button
              type="button"
              id="autoFillRemainingGroupsBtn"
              onClick={onAutoFillRemainingGroups}
              title="Попълни останалите отбори автоматично в групите"
              aria-label="Попълни останалите отбори автоматично"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 mr-1 text-indigo-500" />
              <span>✨ Попълни останалите отбори</span>
            </button>
          )}

          {onInitializeBlankGroups && (
            <button
              type="button"
              id="initializeBlankGroupsBtn"
              onClick={onInitializeBlankGroups}
              title="Инициализирай празни групи за ръчно разпределение"
              aria-label="Ръчно разпределение"
              className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
              <span>📋 Ръчно разпределение</span>
            </button>
          )}

          {handleRedraw && (
            <button
              type="button"
              id="redrawGroupsBtn"
              onClick={handleRedraw}
              title="Изтегли нов жребий за групите"
              aria-label="Нов жребий"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Shuffle className="w-4 h-4 mr-1 text-indigo-500" />
              <span>Нов жребий</span>
            </button>
          )}

          {handleReset && (
            <button
              type="button"
              id="resetGroupsBtn"
              onClick={handleReset}
              title="Изчисти изтегления жребий"
              aria-label="Изчисти жребия"
              className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-medium flex items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 mr-1 text-rose-500" />
              <span>Изчисти жребия</span>
            </button>
          )}

          <button
            type="button"
            id="copyGroupsBtn"
            onClick={handleCopy}
            title="Копирай групите в клипборда"
            aria-label="Копирай групите"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            {copiedState ? (
              <>
                <Check className="w-4 h-4 mr-1 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400">Копирано!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                <span>Копирай</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        id="groupsGrid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {groups.map((group, idx) => (
          <GroupCard
            key={group.id}
            group={group}
            format={format}
            mode={mode}
            targetSize={targetGroupSizes ? targetGroupSizes[idx] : undefined}
            onSelectEmptySlot={onSelectEmptySlot}
            onRemoveTeam={onRemoveTeam}
            onMoveTeam={onMoveTeam}
            availableGroups={availableGroups}
          />
        ))}
      </div>
    </div>
  );
};
