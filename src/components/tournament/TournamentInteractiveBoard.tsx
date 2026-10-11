import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Trophy,
  Users,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';
import { TeamList } from '../team/TeamList';
import { TeamSlotPickerModal } from '../team/TeamSlotPickerModal';
import { GroupList } from '../group/GroupList';
import { MatchScheduleList } from '../group/MatchScheduleList';
import { PlayerSelector } from '../generator/PlayerSelector';
import { GuestInput } from '../generator/GuestInput';
import { ActivePool } from '../generator/ActivePool';
import { useTournaments } from '../../hooks/useTournaments';
import { useMatches } from '../../hooks/useMatches';
import { usePlayers } from '../../hooks/usePlayers';
import { useTeamGenerator } from '../../hooks/useTeamGenerator';
import type {
  Tournament,
  TournamentDraftState,
} from '../../types/tournament';
import type { GeneratorPlayer } from '../../types/generator';

export interface TournamentInteractiveBoardProps {
  tournament: Tournament;
  onMatchesSaved?: () => Promise<void> | void;
  onMatchesCreated?: () => Promise<void> | void;
}

export const TournamentInteractiveBoard: React.FC<TournamentInteractiveBoardProps> = ({
  tournament,
  onMatchesSaved,
  onMatchesCreated,
}) => {
  const { saveTournamentDraft } = useTournaments();
  const { bulkCreateMatches } = useMatches();
  const { players: dbPlayers, loading: dbLoading, error: dbError } = usePlayers();

  // Instantiate team generator engine locked strictly to tournament.format and tennis mode
  const gen = useTeamGenerator({
    initialMode: 'tennis',
    initialFormat: tournament.format,
    initialDraftState: tournament.draft_state,
  });

  const [targetTeamCount, setTargetTeamCount] = useState<number>(() => {
    if (tournament.draft_state?.targetTeams) {
      return tournament.draft_state.targetTeams;
    }
    if (gen.teams.length > 0) {
      return gen.teams.length;
    }
    return 8;
  });

  const [isPoolExpanded, setIsPoolExpanded] = useState<boolean>(() => {
    // If teams are already drawn or drafted, keep pool collapsed by default
    return gen.teams.length === 0;
  });

  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');
  const [activeSlotTeamId, setActiveSlotTeamId] = useState<string | null>(null);
  const [isPickerModalOpen, setIsPickerModalOpen] = useState<boolean>(false);
  const [isSavingMatches, setIsSavingMatches] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-save state
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(() =>
    tournament.draft_state ? 'saved' : 'idle'
  );

  const prevDraftSerializedRef = useRef<string>(
    JSON.stringify(tournament.draft_state ?? null)
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef<boolean>(true);

  // Current draft snapshot
  const currentDraft = useMemo<TournamentDraftState>(() => {
    return {
      targetTeams: gen.teams.length > 0 ? gen.teams.length : (gen.numberOfTeams ?? targetTeamCount),
      formationMode: gen.formationMode,
      teams: gen.teams,
      activePool: gen.activePool,
      groups: gen.groups,
      schedule: gen.schedule,
    };
  }, [
    gen.numberOfTeams,
    gen.teams,
    targetTeamCount,
    gen.formationMode,
    gen.activePool,
    gen.groups,
    gen.schedule,
  ]);

  // Debounced auto-save effect (800ms)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const serialized = JSON.stringify(currentDraft);
    if (serialized === prevDraftSerializedRef.current) {
      return;
    }

    setDraftStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const success = await saveTournamentDraft(tournament.id, currentDraft);
        if (success) {
          prevDraftSerializedRef.current = serialized;
          setDraftStatus('saved');
        } else {
          setDraftStatus('error');
        }
      } catch {
        setDraftStatus('error');
      }
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentDraft, saveTournamentDraft, tournament.id]);

  const playersPerTeam = tournament.format === 'doubles' ? 2 : 1;
  const currentTeamCount = gen.teams.length > 0 ? gen.teams.length : targetTeamCount;
  const neededPlayers = currentTeamCount * playersPerTeam;

  const totalEmptySlots = useMemo(() => {
    if (gen.teams.length === 0) return 0;
    return gen.teams.reduce(
      (sum, t) => sum + Math.max(0, playersPerTeam - t.players.length),
      0
    );
  }, [gen.teams, playersPerTeam]);

  // Pool validation warnings
  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];

    // In manual mode, teams are constructed slot-by-slot directly from the database of players or guests
    if (gen.formationMode === 'manual') {
      return warnings;
    }

    if (tournament.format === 'doubles' && gen.activePool.length % 2 !== 0) {
      warnings.push(
        `Внимание: Броят играчи в пула е нечетен (${gen.activePool.length}). За формат по двойки е необходим четен брой играчи.`
      );
    }

    if (gen.teams.length > 0) {
      if (gen.activePool.length < neededPlayers) {
        warnings.push(
          `Недостиг на играчи: в пула има ${gen.activePool.length} играчи, а за запълване на ${currentTeamCount} отбора са нужни ${neededPlayers}.`
        );
      } else if (gen.activePool.length > neededPlayers) {
        warnings.push(
          `Излишък на играчи: в пула има ${gen.activePool.length} играчи, а за ${currentTeamCount} отбора са нужни ${neededPlayers}.`
        );
      }
    }

    return warnings;
  }, [gen.formationMode, tournament.format, gen.activePool.length, gen.teams.length, neededPlayers, currentTeamCount]);

  // Selected player IDs in pool
  const selectedPoolIds = useMemo(
    () => new Set(gen.activePool.map((p) => p.id)),
    [gen.activePool]
  );

  // Unassigned players list for slot picker modal (combining pool and DB players)
  const unassignedPlayersList = useMemo(() => {
    const assignedIds = new Set(gen.teams.flatMap((t) => t.players.map((p) => p.id)));
    const list: GeneratorPlayer[] = [...gen.unassignedPoolPlayers];
    const listIds = new Set(list.map((p) => p.id));

    dbPlayers.forEach((p) => {
      if (!assignedIds.has(p.id) && !listIds.has(p.id)) {
        list.push({
          id: p.id,
          name: p.name,
          source: 'registered',
          rating: p.rating,
          singles_rating: p.singles_rating,
          doubles_rating: p.doubles_rating,
        });
      }
    });

    return list;
  }, [gen.teams, gen.unassignedPoolPlayers, dbPlayers]);

  const activeSlotTeam = useMemo(
    () => gen.teams.find((t) => t.id === activeSlotTeamId),
    [gen.teams, activeSlotTeamId]
  );

  // Slot handlers
  const handleSelectEmptySlot = useCallback((teamId: string) => {
    setActiveSlotTeamId(teamId);
    setIsPickerModalOpen(true);
  }, []);

  const handleAssignPlayer = useCallback(
    (teamId: string, player: GeneratorPlayer) => {
      gen.assignPlayerToTeam(teamId, player);
      setIsPickerModalOpen(false);
    },
    [gen]
  );

  const handleUpdateTargetTeams = useCallback(
    (count: number) => {
      const clamped = Math.min(32, Math.max(2, count));
      setTargetTeamCount(clamped);
      gen.setNumberOfTeams(clamped);
    },
    [gen]
  );

  const handleGenerateFromPool = useCallback(() => {
    gen.generateTeams(targetTeamCount);
  }, [gen, targetTeamCount]);

  const handleCreateBlankTeams = useCallback(() => {
    gen.initializeBlankTeams(targetTeamCount, playersPerTeam);
    gen.setFormationMode('manual');
  }, [gen, targetTeamCount, playersPerTeam]);

  const handleAddBlankTeam = useCallback(() => {
    gen.addBlankTeam();
    setTargetTeamCount((prev) => {
      const nextCount = Math.min(32, Math.max(prev, gen.teams.length + 1));
      gen.setNumberOfTeams(nextCount);
      return nextCount;
    });
  }, [gen]);

  const handleDeleteTeam = useCallback(
    (teamId: string) => {
      gen.deleteTeam(teamId);
      setTargetTeamCount(() => {
        const nextCount = Math.max(2, gen.teams.length - 1);
        gen.setNumberOfTeams(nextCount);
        return nextCount;
      });
    },
    [gen]
  );

  const handleAutoFillRemaining = useCallback(() => {
    const unassignedPoolCount = gen.unassignedPoolPlayers.length;
    if (unassignedPoolCount < totalEmptySlots) {
      setErrorMessage(
        `Недостиг на играчи: в свободния пул има само ${unassignedPoolCount} ${
          unassignedPoolCount === 1 ? 'играч' : 'играчи'
        }, а за запълване на останалите празни места са нужни ${totalEmptySlots}. Добавете още играчи в пула или ги попълнете ръчно.`
      );
    } else {
      setErrorMessage(null);
    }
    gen.autoFillRemainingSlots();
  }, [gen, totalEmptySlots]);

  // Bulk save matches handler
  const handleSaveAllMatches = useCallback(async () => {
    if (gen.schedule.length === 0) return;
    setIsSavingMatches(true);
    setErrorMessage(null);

    try {
      const { error } = await bulkCreateMatches(
        gen.schedule,
        tournament.format,
        tournament.id
      );

      if (error) {
        setErrorMessage('Възникна грешка при записване на турнирните мачове.');
        return;
      }

      // Clear draft state upon successful match generation
      await saveTournamentDraft(tournament.id, null);

      if (onMatchesSaved) {
        await onMatchesSaved();
      }
      if (onMatchesCreated) {
        await onMatchesCreated();
      }
    } catch {
      setErrorMessage('Възникна грешка при записване на турнирните мачове.');
    } finally {
      setIsSavingMatches(false);
    }
  }, [
    gen.schedule,
    bulkCreateMatches,
    tournament.format,
    tournament.id,
    saveTournamentDraft,
    onMatchesSaved,
    onMatchesCreated,
  ]);

  return (
    <div className="space-y-8 animate-fadeIn" data-testid="tournament-interactive-board">
      {/* Top Status & Format Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Интерактивна дъска за турнир
            </h2>
            <Badge variant="indigo" size="sm">
              {tournament.format === 'doubles' ? 'По двойки' : 'Поединично'}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Съставете отбори ръчно или автоматично, изтеглете жребий за групи и генерирайте програма.
          </p>
        </div>

        {/* Auto-save Status Indicator */}
        <div className="flex items-center gap-2">
          {draftStatus === 'saving' && (
            <span
              data-testid="draft-status-saving"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Запазване на чернова...</span>
            </span>
          )}
          {draftStatus === 'saved' && (
            <span
              data-testid="draft-status-saved"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>✓ Всички промени са запазени като чернова</span>
            </span>
          )}
          {draftStatus === 'error' && (
            <span
              data-testid="draft-status-error"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Грешка при запазване</span>
            </span>
          )}
        </div>
      </div>

      {errorMessage && (
        <Alert
          type="error"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <div className="space-y-2">
          {validationWarnings.map((warning, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs font-medium text-amber-800 dark:text-amber-300 flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Setup & Actions Toolbar */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Target Team Count Selector */}
          <div className="space-y-2">
            <label
              htmlFor="targetTeamCountInput"
              className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block"
            >
              Целеви брой отбори
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="decrementTeamCountBtn"
                aria-label="Намали брой отбори"
                onClick={() => handleUpdateTargetTeams(targetTeamCount - 1)}
                disabled={targetTeamCount <= 2}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                -
              </button>
              <input
                type="number"
                id="targetTeamCountInput"
                aria-label="Целеви брой отбори"
                min={2}
                max={32}
                value={targetTeamCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    handleUpdateTargetTeams(val);
                  }
                }}
                className="w-16 text-center py-1.5 px-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                id="incrementTeamCountBtn"
                aria-label="Увеличи брой отбори"
                onClick={() => handleUpdateTargetTeams(targetTeamCount + 1)}
                disabled={targetTeamCount >= 32}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                +
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                отбора (мин. 2, макс. 32)
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              id="addBlankTeamBtn"
              variant="secondary"
              size="sm"
              onClick={handleAddBlankTeam}
              className="cursor-pointer font-semibold"
            >
              ➕ Добави отбор
            </Button>

            <Button
              type="button"
              id="createBlankTeamsBtn"
              variant="secondary"
              size="sm"
              onClick={handleCreateBlankTeams}
              className="cursor-pointer font-semibold"
            >
              📋 Създай празни отбори
            </Button>

            <Button
              type="button"
              id="generateTeamsBtn"
              variant="secondary"
              size="sm"
              onClick={handleGenerateFromPool}
              className="cursor-pointer font-semibold"
            >
              🎲 Генерирай отбори от пула
            </Button>

            {gen.formationMode === 'manual' && totalEmptySlots > 0 && (
              <Button
                type="button"
                id="autoFillRemainingBtn"
                variant="primary"
                size="sm"
                onClick={handleAutoFillRemaining}
                className="cursor-pointer font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                <span>✨ Попълни останалите автоматично</span>
              </Button>
            )}

            {gen.teams.length >= 6 && gen.groups.length === 0 && (
              <Button
                type="button"
                id="drawGroupsBtn"
                variant="primary"
                size="sm"
                onClick={gen.drawGroups}
                disabled={gen.hasIncompleteTeams || totalEmptySlots > 0}
                className="cursor-pointer font-semibold"
              >
                <span>🎲 Тегли жребий за групи</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Collapsible Player Pool & Participants Management */}
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden"
        data-testid="confirmed-participants-section"
      >
        <button
          type="button"
          onClick={() => setIsPoolExpanded((prev) => !prev)}
          className="w-full px-6 py-4 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/40 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <span className="font-bold text-sm text-gray-900 dark:text-white">
                Потвърден състав / Участници
              </span>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                ({gen.activePool.length} {gen.activePool.length === 1 ? 'играч' : 'играчи'} в пула)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              {isPoolExpanded ? 'Скрий състава' : 'Покажи състава'}
            </span>
            {isPoolExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {/* Confirmed Participants list shown clearly if participants exist */}
        {!isPoolExpanded && gen.activePool.length > 0 && (
          <div
            data-testid="confirmed-participants-summary"
            className="px-6 py-3 bg-gray-50/30 dark:bg-slate-800/20 border-t border-gray-100 dark:border-slate-700 flex flex-wrap items-center gap-2"
          >
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">
              Участници в пула:
            </span>
            {gen.activePool.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-600"
              >
                {p.name}
                {p.source === 'guest' && (
                  <span className="ml-1 text-[10px] text-gray-500 dark:text-gray-400">
                    (гост)
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        {isPoolExpanded && (
          <div className="p-6 border-t border-gray-100 dark:border-slate-700 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Registered Player Selector & Guest Input */}
              <div className="lg:col-span-6 space-y-6">
                <PlayerSelector
                  players={dbPlayers}
                  selectedIds={selectedPoolIds}
                  onTogglePlayer={gen.toggleRegisteredPlayer}
                  loading={dbLoading}
                  error={dbError}
                  searchTerm={playerSearchQuery}
                  onSearchChange={setPlayerSearchQuery}
                  format={tournament.format}
                  mode="tennis"
                />

                <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                  <GuestInput onAddGuest={gen.addGuest} />
                </div>
              </div>

              {/* Right Column: Active Pool Summary */}
              <div className="lg:col-span-6">
                <ActivePool
                  activePool={gen.activePool}
                  onRemovePlayer={gen.removePlayer}
                  onClearPool={gen.clearPool}
                  format={tournament.format}
                  mode="tennis"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Board Results Section: Groups or Teams */}
      {gen.groups.length > 0 || gen.schedule.length > 0 ? (
        <div className="space-y-6">
          <GroupList
            groups={gen.groups}
            onRedraw={gen.teams.length >= 6 ? gen.drawGroups : undefined}
            onReset={gen.teams.length >= 6 ? gen.resetGroups : undefined}
            onGenerateSchedule={gen.generateSchedule}
            hasSchedule={gen.schedule.length > 0}
            schedule={gen.schedule}
            mode="tennis"
            format={tournament.format}
          />

          {gen.schedule.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                    Програмата е готова!
                  </h4>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    Запишете срещите, за да започне турнирът и да се въвеждат резултати.
                  </p>
                </div>
                <button
                  type="button"
                  id="saveTournamentMatchesBtn"
                  onClick={handleSaveAllMatches}
                  disabled={isSavingMatches}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingMatches ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Записване...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>💾 Запиши мачове за турнира</span>
                    </>
                  )}
                </button>
              </div>

              <MatchScheduleList
                schedule={gen.schedule}
                onReset={gen.resetSchedule}
                onSaveAllMatches={handleSaveAllMatches}
                isSavingMatches={isSavingMatches}
              />
            </div>
          )}
        </div>
      ) : (
        <TeamList
          teams={gen.teams}
          mode="tennis"
          format={tournament.format}
          targetTeamSize={playersPerTeam}
          formationMode={gen.formationMode}
          hasIncompleteTeams={gen.hasIncompleteTeams}
          onSelectEmptySlot={handleSelectEmptySlot}
          onRemovePlayer={gen.removePlayerFromTeam}
          onDeleteTeam={handleDeleteTeam}
          onAutoFillRemaining={handleAutoFillRemaining}
          onDrawGroups={gen.drawGroups}
          onShuffleTeam={gen.shuffleSingleTeam}
          onCopy={gen.copyResults}
          isCopied={gen.isCopied}
        />
      )}

      {/* Team Slot Picker Modal */}
      <TeamSlotPickerModal
        isOpen={isPickerModalOpen}
        onClose={() => setIsPickerModalOpen(false)}
        teamId={activeSlotTeamId}
        teamName={activeSlotTeam?.name}
        unassignedPlayers={unassignedPlayersList}
        onSelectPlayer={handleAssignPlayer}
        format={tournament.format}
      />
    </div>
  );
};
