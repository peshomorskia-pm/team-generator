import React, { useState, useCallback, useMemo } from 'react';
import { GeneratorHeader } from '../components/team/GeneratorHeader';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { TeamSettings } from '../components/team/TeamSettings';
import { TeamList } from '../components/team/TeamList';
import { PlayerSelector } from '../components/generator/PlayerSelector';
import { GuestInput } from '../components/generator/GuestInput';
import { ActivePool } from '../components/generator/ActivePool';
import { useTeamGenerator } from '../hooks/useTeamGenerator';
import { usePlayers } from '../hooks/usePlayers';

export const GeneratorPage: React.FC = () => {
  const {
    players: dbPlayers,
    loading: dbLoading,
    error: dbError,
  } = usePlayers();

  const {
    activePool,
    teams,
    alert,
    isCopied,
    balanceByRating,
    numberOfTeams,
    playersPerTeam,
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

  const selectedIds = useMemo(() => new Set(activePool.map((p) => p.id)), [activePool]);

  const [searchQuery, setSearchQuery] = useState('');

  const handleClearPool = useCallback(() => {
    clearPool();
    setSearchQuery('');
  }, [clearPool]);

  const handleNumberOfTeamsChange = useCallback(
    (val: number) => {
      setNumberOfTeams(val > 0 ? val : null);
    },
    [setNumberOfTeams]
  );

  const handlePlayersPerTeamChange = useCallback(
    (val: number | null) => {
      setPlayersPerTeam(val);
    },
    [setPlayersPerTeam]
  );

  const hasRatings = useMemo(
    () => activePool.some((p) => p.rating !== undefined),
    [activePool]
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 flex flex-col items-center">
      <div className="w-full">
        <Card className="mb-8">
          <GeneratorHeader />

          <div className="p-6 sm:p-8 space-y-6">
            {/* Custom Notification Alert */}
            {alert && (
              <Alert
                type={alert.type}
                message={alert.message}
                className="mb-4"
              />
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
                  />

                  <div className="border-t border-gray-200 dark:border-slate-700 pt-5">
                    <TeamSettings
                      numberOfTeams={numberOfTeams ?? 0}
                      onSettingsChange={handleNumberOfTeamsChange}
                      playersPerTeam={playersPerTeam}
                      onPlayersPerTeamChange={handlePlayersPerTeamChange}
                      onGenerate={generateTeams}
                      balanceByRating={balanceByRating}
                      onBalanceToggle={setBalanceByRating}
                      hasRatings={hasRatings}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Results Section */}
      <TeamList
        teams={teams}
        onShuffleTeam={shuffleSingleTeam}
        onCopy={copyResults}
        isCopied={isCopied}
      />
    </div>
  );
};
