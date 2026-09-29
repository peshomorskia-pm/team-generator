import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Moon, Sun } from 'lucide-react';
import { Container } from './components/layout/Container';
import { Header } from './components/layout/Header';
import { Card } from './components/ui/Card';
import { PlayerInput } from './components/player/PlayerInput';
import { PlayerList } from './components/player/PlayerList';
import { TeamSettings } from './components/team/TeamSettings';
import { TeamList } from './components/team/TeamList';
import { useTeamGenerator } from './hooks/useTeamGenerator';

export const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
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

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const hasRatings = players.some((p) => p.rating !== undefined);

  return (
    <Container className={isDarkMode ? 'dark' : ''}>
      {/* Dark mode toggle */}
      <div className="w-full max-w-3xl flex justify-end mb-3">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 flex items-center space-x-1.5 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Светла тема</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600" />
              <span>Тъмна тема</span>
            </>
          )}
        </button>
      </div>

      <main className="w-full max-w-3xl">
        <Card>
          <Header />

          <div className="px-6 py-8 sm:p-10">
            {/* Custom Message Box */}
            {alert && (
              <div
                id="messageBox"
                role="alert"
                className={`mb-6 p-4 rounded-xl flex items-center border transition-all ${
                  alert.type === 'error'
                    ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60'
                    : 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/60'
                }`}
              >
                {alert.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 mr-3 shrink-0 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 mr-3 shrink-0 text-green-500" />
                )}
                <span id="messageText" className="text-sm font-medium">
                  {alert.message}
                </span>
              </div>
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
                numberOfTeams={typeof numberOfTeams === 'number' ? numberOfTeams : 0}
                onSettingsChange={(val) => setNumberOfTeams(val > 0 ? val : '')}
                playersPerTeam={playersPerTeam}
                onPlayersPerTeamChange={setPlayersPerTeam}
                onGenerate={generateTeams}
                balanceByRating={balanceByRating}
                onBalanceToggle={setBalanceByRating}
                hasRatings={hasRatings}
              />
            </div>
          </div>
        </Card>
      </main>

      {/* Results Section */}
      <TeamList
        teams={teams}
        onShuffleTeam={shuffleSingleTeam}
        onCopy={copyResults}
        isCopied={isCopied}
      />
    </Container>
  );
};

export default App;
