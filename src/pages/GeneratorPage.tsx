import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Trophy, ArrowLeft } from 'lucide-react';
import { GeneratorHeader } from '../components/team/GeneratorHeader';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { TeamSettings } from '../components/team/TeamSettings';
import { TeamList } from '../components/team/TeamList';
import { GroupList } from '../components/group/GroupList';
import { MatchScheduleList } from '../components/group/MatchScheduleList';
import { MatchModal, type MatchParticipant } from '../components/match/MatchModal';
import { PlayerSelector } from '../components/generator/PlayerSelector';
import { GuestInput } from '../components/generator/GuestInput';
import { ActivePool } from '../components/generator/ActivePool';
import { useTeamGenerator } from '../hooks/useTeamGenerator';
import { usePlayers } from '../hooks/usePlayers';
import { useMatches } from '../hooks/useMatches';
import { useTournaments } from '../hooks/useTournaments';
import type { Team } from '../types';
import type { MatchFormData } from '../types/matches';
import type { GeneratorPlayer } from '../types/generator';

const mapTeamToParticipants = (team?: Team): MatchParticipant[] => {
  if (!team) return [];
  return team.players.map((p) => {
    const isGuest = (p as Partial<GeneratorPlayer>).source === 'guest';
    return {
      player_id: isGuest ? undefined : p.id,
      guest_name: isGuest ? p.name : undefined,
      name: p.name,
    };
  });
};

export const GeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get('tournamentId');

  const { tournaments } = useTournaments();
  const activeTournament = useMemo(
    () => (tournamentId ? tournaments.find((t) => t.id === tournamentId) : undefined),
    [tournaments, tournamentId]
  );

  const {
    players: dbPlayers,
    loading: dbLoading,
    error: dbError,
  } = usePlayers();

  const {
    createMatch,
    bulkCreateMatches,
    alert: matchAlert,
    clearAlert: clearMatchAlert,
  } = useMatches();

  const {
    activePool,
    teams,
    targetTeamSize,
    hasIncompleteTeams,
    groups,
    drawGroups,
    resetGroups,
    schedule,
    generateSchedule,
    resetSchedule,
    alert,
    showAlert,
    isCopied,
    balanceByRating,
    numberOfTeams,
    playersPerTeam,
    format,
    mode,
    setMode,
    canGenerate,
    validationError,
    setFormat,
    setNumberOfTeams,
    setPlayersPerTeam,
    setBalanceByRating,
    addGuest,
    toggleRegisteredPlayer,
    removePlayer,
    clearPool,
    generateTeams,
    shuffleSingleTeam,
    copyResults,
  } = useTeamGenerator();

  useEffect(() => {
    if (activeTournament) {
      if (mode !== 'tennis') {
        setMode('tennis');
      }
      if (format !== activeTournament.format) {
        setFormat(activeTournament.format);
      }
    }
  }, [activeTournament, mode, format, setMode, setFormat]);

  const handleModeChange = useCallback(
    (newMode: Parameters<typeof setMode>[0]) => {
      if (activeTournament) return;
      setMode(newMode);
    },
    [activeTournament, setMode]
  );

  const handleFormatChange = useCallback(
    (newFormat: 'singles' | 'doubles') => {
      if (activeTournament) return;
      setFormat(newFormat);
    },
    [activeTournament, setFormat]
  );

  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isSavingMatches, setIsSavingMatches] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedIds = useMemo(() => new Set(activePool.map((p) => p.id)), [activePool]);

  const handleClearPool = useCallback(() => {
    clearPool();
    setSearchQuery('');
  }, [clearPool]);

  const handleNumberOfTeamsChange = useCallback(
    (val: number | null) => {
      setNumberOfTeams(val);
    },
    [setNumberOfTeams]
  );

  const handlePlayersPerTeamChange = useCallback(
    (val: number | null) => {
      setPlayersPerTeam(val);
    },
    [setPlayersPerTeam]
  );

  const effectiveFormat = mode === 'tennis' ? format : undefined;

  const hasRatings = useMemo(
    () =>
      activePool.some((p) =>
        mode === 'tennis'
          ? ((format === 'doubles' ? p.doubles_rating : p.singles_rating) ?? p.rating) !== undefined
          : p.rating !== undefined
      ),
    [activePool, mode, format]
  );

  const initialTeam1 = useMemo(() => {
    if (teams.length >= 2) {
      return mapTeamToParticipants(teams[0]);
    }
    return undefined;
  }, [teams]);

  const initialTeam2 = useMemo(() => {
    if (teams.length >= 2) {
      return mapTeamToParticipants(teams[1]);
    }
    return undefined;
  }, [teams]);

  const handleSaveMatch = useCallback(
    async (data: MatchFormData) => {
      const matchData = tournamentId
        ? { ...data, tournament_id: tournamentId }
        : data;
      const success = await createMatch(matchData);
      if (!success) {
        throw new Error('Failed to create match');
      }
      setIsMatchModalOpen(false);
      if (tournamentId) {
        navigate(`/tournaments/${tournamentId}`);
      } else {
        navigate('/matches');
      }
    },
    [createMatch, navigate, tournamentId]
  );

  const handleSaveAllMatches = useCallback(async () => {
    if (schedule.length === 0) return;
    setIsSavingMatches(true);
    try {
      const { count, error } = tournamentId
        ? await bulkCreateMatches(schedule, format, tournamentId)
        : await bulkCreateMatches(schedule, format);
      if (error) {
        showAlert('Възникна грешка при записване на турнирните мачове.', 'error');
      } else {
        if (tournamentId) {
          navigate(`/tournaments/${tournamentId}`, {
            state: {
              fromBulkCreate: true,
              matchCount: count,
            },
          });
        } else {
          navigate('/matches', {
            state: {
              fromBulkCreate: true,
              matchCount: count,
              statusFilter: 'upcoming',
            },
          });
        }
      }
    } catch {
      showAlert('Възникна грешка при записване на турнирните мачове.', 'error');
    } finally {
      setIsSavingMatches(false);
    }
  }, [schedule, format, tournamentId, bulkCreateMatches, showAlert, navigate]);

  const activeAlert = alert || matchAlert;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 flex flex-col items-center">
      <div className="w-full">
        <Card className="mb-8">
          <GeneratorHeader />

          <div className="p-6 sm:p-8 space-y-6">
            {/* Custom Notification Alert */}
            {activeAlert && (
              <Alert
                type={activeAlert.type}
                message={activeAlert.message}
                onDismiss={matchAlert ? clearMatchAlert : undefined}
                className="mb-4"
              />
            )}

            {/* Contextual Tournament Banner */}
            {tournamentId && activeTournament && (
              <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3.5 mb-6 flex flex-wrap items-center justify-between gap-3 text-indigo-900 dark:text-indigo-200 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="font-semibold text-sm">
                    Турнир: {activeTournament.title} ({activeTournament.format === 'doubles' ? 'По двойки' : 'Поединично'})
                  </span>
                </div>
                <Link
                  to={`/tournaments/${tournamentId}`}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Обратно към турнира
                </Link>
              </div>
            )}

            {/* Split Layout: Selection (Left) vs Pool & Settings (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Player Selection (Registered Players + Guest Input) */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm space-y-6">
                  <PlayerSelector
                    players={dbPlayers}
                    selectedIds={selectedIds}
                    onTogglePlayer={toggleRegisteredPlayer}
                    loading={dbLoading}
                    error={dbError}
                    searchTerm={searchQuery}
                    onSearchChange={setSearchQuery}
                    format={effectiveFormat}
                    mode={mode}
                  />

                  <div className="border-t border-gray-200 dark:border-slate-700 pt-5">
                    <GuestInput onAddGuest={addGuest} />
                  </div>
                </div>
              </div>

              {/* Right Column: Active Pool & Team Generation Settings */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm space-y-6">
                  <ActivePool
                    activePool={activePool}
                    onRemovePlayer={removePlayer}
                    onClearPool={handleClearPool}
                    format={effectiveFormat}
                    mode={mode}
                  />

                  <div className="border-t border-gray-200 dark:border-slate-700 pt-5">
                    <TeamSettings
                      mode={mode}
                      onModeChange={handleModeChange}
                      numberOfTeams={numberOfTeams}
                      onSettingsChange={handleNumberOfTeamsChange}
                      playersPerTeam={playersPerTeam}
                      onPlayersPerTeamChange={handlePlayersPerTeamChange}
                      onGenerate={generateTeams}
                      balanceByRating={balanceByRating}
                      onBalanceToggle={setBalanceByRating}
                      hasRatings={hasRatings}
                      format={format}
                      onFormatChange={handleFormatChange}
                      canGenerate={canGenerate}
                      validationError={validationError}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Results Section */}
      {groups.length > 0 ? (
        <>
          <GroupList
            groups={groups}
            onRedraw={teams.length >= 6 ? drawGroups : undefined}
            onReset={teams.length >= 6 ? resetGroups : undefined}
            onGenerateSchedule={generateSchedule}
            hasSchedule={schedule.length > 0}
            schedule={schedule}
            mode={mode}
            format={effectiveFormat}
          />
          {schedule.length > 0 && (
            <MatchScheduleList
              schedule={schedule}
              onReset={resetSchedule}
              onSaveAllMatches={handleSaveAllMatches}
              isSavingMatches={isSavingMatches}
            />
          )}
        </>
      ) : (
        <TeamList
          teams={teams}
          mode={mode}
          onShuffleTeam={shuffleSingleTeam}
          onCopy={copyResults}
          isCopied={isCopied}
          onSaveAsMatch={() => setIsMatchModalOpen(true)}
          format={effectiveFormat}
          onDrawGroups={drawGroups}
          hasIncompleteTeams={hasIncompleteTeams}
          targetTeamSize={targetTeamSize}
        />
      )}

      {/* Match Modal Integration */}
      <MatchModal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        onSave={handleSaveMatch}
        availablePlayers={dbPlayers}
        initialTeam1={initialTeam1}
        initialTeam2={initialTeam2}
        initialFormat={format}
      />
    </div>
  );
};
