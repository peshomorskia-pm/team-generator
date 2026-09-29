import React, { useCallback } from 'react';
import { GeneratorHeader } from '../components/team/GeneratorHeader';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { PlayerInput } from '../components/player/PlayerInput';
import { PlayerList } from '../components/player/PlayerList';
import { TeamSettings } from '../components/team/TeamSettings';
import { TeamList } from '../components/team/TeamList';
import { useTeamGenerator } from '../hooks/useTeamGenerator';

export const GeneratorPage: React.FC = () => {
  const {
    rawText,
    setRawText,
    players,
    numberOfTeams,
    setNumberOfTeams,
    playersPerTeam,
    setPlayersPerTeam,
    teams,
    alert,
    isCopied,
    balanceByRating,
    setBalanceByRating,
    addPlayer,
    removePlayer,
    generateTeams,
    shuffleSingleTeam,
    copyResults,
  } = useTeamGenerator();

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

  const hasRatings = players.some((p) => p.rating !== undefined);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 flex flex-col items-center">
      <div className="w-full">
        <Card>
          <GeneratorHeader />

          <div className="px-6 py-8 sm:p-10">
            {/* Custom Message Box */}
            {alert && (
              <Alert
                type={alert.type}
                message={alert.message}
                className="mb-6"
              />
            )}

            <div className="space-y-6">
              <PlayerInput
                onAddPlayer={addPlayer}
                value={rawText}
                onChange={setRawText}
                playerCount={players.length}
              />

              {players.length > 0 && (
                <PlayerList players={players} onRemovePlayer={removePlayer} />
              )}

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
