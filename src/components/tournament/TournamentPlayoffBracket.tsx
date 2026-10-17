import React, { useState, useMemo } from 'react';
import { Trophy, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { MatchCard } from '../match/MatchCard';
import { getMatchOutcome } from '../../utils/standings';
import type { Tournament } from '../../types/tournament';
import type { MatchDetail } from '../../types/matches';
import type { TournamentPlayoffTree } from '../../types/playoffs';

export interface TournamentPlayoffBracketProps {
  tournament: Tournament;
  playoffMatches: MatchDetail[];
  groupMatches: MatchDetail[];
  tree?: TournamentPlayoffTree | null;
  onGeneratePlayoffs: () => Promise<void> | void;
  onEditMatchScore: (match: MatchDetail) => void;
  onCompleteTournament?: () => Promise<void> | void;
  isGenerating?: boolean;
  className?: string;
}

function isPlaceholderTeam(name?: string | null): boolean {
  if (!name) return true;
  return /^(победител от|tbd)/i.test(name.trim());
}

export const TournamentPlayoffBracket: React.FC<TournamentPlayoffBracketProps> = ({
  tournament,
  playoffMatches,
  groupMatches,
  tree: _tree,
  onGeneratePlayoffs,
  onEditMatchScore,
  onCompleteTournament,
  isGenerating = false,
  className = '',
}) => {
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Group matches completion check
  const unplayedGroupMatches = useMemo(
    () =>
      groupMatches.filter(
        (m) => m.team_1_score === null || m.team_2_score === null
      ),
    [groupMatches]
  );

  // Partition playoff matches by round / stage
  const qfMatches = useMemo(
    () =>
      playoffMatches
        .filter((m) => Boolean(m.group_name && /1\/4-финал/i.test(m.group_name)))
        .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')),
    [playoffMatches]
  );

  const sfMatches = useMemo(
    () =>
      playoffMatches
        .filter((m) => Boolean(m.group_name && /полуфинал/i.test(m.group_name)))
        .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')),
    [playoffMatches]
  );

  const finalMatches = useMemo(
    () =>
      playoffMatches.filter((m) =>
        Boolean(m.group_name && /^финал/i.test(m.group_name.trim()))
      ),
    [playoffMatches]
  );

  const finalMatch = finalMatches[0];
  const finalOutcome = finalMatch ? getMatchOutcome(finalMatch) : null;
  const isFinalCompleted =
    Boolean(finalOutcome?.isCompleted) &&
    (finalOutcome?.winner === 'team_1' || finalOutcome?.winner === 'team_2');

  const championTeamName = isFinalCompleted
    ? finalOutcome?.winner === 'team_1'
      ? finalMatch.team_1_name
      : finalMatch.team_2_name
    : tournament.winner_team_name;

  const handleGenerateClick = () => {
    if (unplayedGroupMatches.length > 0) {
      setShowWarningModal(true);
    } else {
      void onGeneratePlayoffs();
    }
  };

  const handleConfirmGenerate = () => {
    setShowWarningModal(false);
    void onGeneratePlayoffs();
  };

  const hasGeneratedMatches = playoffMatches.length > 0;

  return (
    <div
      className={`space-y-6 ${className}`}
      data-testid="tournament-playoff-bracket"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Елиминационна фаза (Плейофи)
          </h2>
          {hasGeneratedMatches && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {playoffMatches.length} {playoffMatches.length === 1 ? 'мач' : 'мача'}
            </span>
          )}
        </div>

        {!hasGeneratedMatches && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleGenerateClick}
            disabled={isGenerating}
            data-testid="generate-playoffs-btn"
            className="flex items-center gap-2 shadow-xs"
          >
            <Trophy className="w-4 h-4" />
            <span>🏆 Генерирай елиминации</span>
          </Button>
        )}
      </div>

      {/* Champion Banner */}
      {isFinalCompleted && championTeamName && (
        <div
          className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-lg border border-amber-300 dark:border-amber-600 animate-in fade-in duration-500"
          data-testid="playoff-champion-banner"
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/15 text-slate-950 text-xs font-extrabold uppercase tracking-wider backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Шампион на турнира</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-xs">
                🏆 {championTeamName}
              </h3>
              <p className="text-sm font-medium text-slate-900/80 max-w-xl">
                Поздравления на победителите за спечелването на турнирния трофей!
              </p>
            </div>

            {tournament.status !== 'completed' && onCompleteTournament && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => void onCompleteTournament()}
                className="bg-slate-950 text-white hover:bg-slate-900 border-none font-bold shrink-0 shadow-md"
                data-testid="mark-tournament-completed-btn"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                <span>Маркирай турнира като приключил</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Bracket Content */}
      {!hasGeneratedMatches ? (
        /* Empty State */
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-10 text-center shadow-xs"
          data-testid="playoffs-empty-state"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Елиминационната схема все още не е генерирана
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            След приключване на груповата фаза или избор на финалисти, натиснете бутона по-долу, за да създадете автоматичната схема за елиминации.
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={handleGenerateClick}
            disabled={isGenerating}
            data-testid="generate-playoffs-cta-btn"
            className="inline-flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            <span>🏆 Генерирай елиминации</span>
          </Button>
        </div>
      ) : (
        /* Multi-Stage Bracket Columns */
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start"
          data-testid="playoffs-bracket-columns"
        >
          {/* Quarterfinals Column */}
          {qfMatches.length > 0 && (
            <div className="space-y-4" data-testid="qf-column">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <span>1/4-финали</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                    {qfMatches.length}
                  </span>
                </h3>
              </div>
              <div className="space-y-4">
                {qfMatches.map((m) => {
                  const hasPlaceholder =
                    isPlaceholderTeam(m.team_1_name) || isPlaceholderTeam(m.team_2_name);
                  return (
                    <div
                      key={m.id}
                      className={
                        hasPlaceholder
                          ? 'opacity-85 border border-dashed border-gray-300 dark:border-slate-600 rounded-2xl'
                          : ''
                      }
                      data-testid={`bracket-match-${m.id}`}
                    >
                      <MatchCard
                        match={m}
                        onEdit={(matchToEdit) => {
                          if (!hasPlaceholder) {
                            onEditMatchScore(matchToEdit);
                          }
                        }}
                        hideDelete={true}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Semifinals Column */}
          {sfMatches.length > 0 && (
            <div className="space-y-4" data-testid="sf-column">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Полуфинали</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                    {sfMatches.length}
                  </span>
                </h3>
              </div>
              <div className="space-y-4">
                {sfMatches.map((m) => {
                  const hasPlaceholder =
                    isPlaceholderTeam(m.team_1_name) || isPlaceholderTeam(m.team_2_name);
                  return (
                    <div
                      key={m.id}
                      className={
                        hasPlaceholder
                          ? 'opacity-85 border border-dashed border-gray-300 dark:border-slate-600 rounded-2xl'
                          : ''
                      }
                      data-testid={`bracket-match-${m.id}`}
                    >
                      <MatchCard
                        match={m}
                        onEdit={(matchToEdit) => {
                          if (!hasPlaceholder) {
                            onEditMatchScore(matchToEdit);
                          }
                        }}
                        hideDelete={true}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Final Column */}
          {finalMatches.length > 0 && (
            <div className="space-y-4" data-testid="final-column">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Финал</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                    Трофей 🏆
                  </span>
                </h3>
              </div>
              <div className="space-y-4">
                {finalMatches.map((m) => {
                  const hasPlaceholder =
                    isPlaceholderTeam(m.team_1_name) || isPlaceholderTeam(m.team_2_name);
                  return (
                    <div
                      key={m.id}
                      className={
                        hasPlaceholder
                          ? 'opacity-85 border border-dashed border-gray-300 dark:border-slate-600 rounded-2xl'
                          : ''
                      }
                      data-testid={`bracket-match-${m.id}`}
                    >
                      <MatchCard
                        match={m}
                        onEdit={(matchToEdit) => {
                          if (!hasPlaceholder) {
                            onEditMatchScore(matchToEdit);
                          }
                        }}
                        hideDelete={true}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Incomplete Group Matches Warning Modal */}
      {showWarningModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          data-testid="playoff-warning-modal"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-slate-700 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Внимание: Неизграни мачове
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  В груповата фаза има{' '}
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {unplayedGroupMatches.length}
                  </span>{' '}
                  неизгран(и) мач(а). Класирането в групите може да се промени след изиграването им.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Сигурни ли сте, че искате да генерирате схемата за елиминации сега?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowWarningModal(false)}
              >
                Отказ
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmGenerate}
                data-testid="confirm-generate-playoffs-btn"
              >
                Генерирай въпреки това
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

TournamentPlayoffBracket.displayName = 'TournamentPlayoffBracket';
export default TournamentPlayoffBracket;
