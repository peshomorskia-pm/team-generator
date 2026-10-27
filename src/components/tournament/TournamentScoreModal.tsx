import React, { useState, useEffect } from 'react';
import { X, User, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { TennisScoreEditor } from '../match/TennisScoreEditor';
import type { MatchDetail } from '../../types/matches';
import type { MatchSet } from '../../types/match';
import { calculateMatchScores } from '../../utils/tennisScoreValidation';

export interface TournamentScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchDetail | null;
  onSave: (
    matchId: string,
    sets: MatchSet[] | null,
    team1Score: number | null,
    team2Score: number | null
  ) => Promise<void>;
}

function getInitialSets(match: MatchDetail | null): MatchSet[] {
  if (!match) return [];
  if (match.sets && match.sets.length > 0) {
    return match.sets.map((s, idx) => ({
      set_number: idx + 1,
      team_1_score: s.team_1_score,
      team_2_score: s.team_2_score,
    }));
  }
  if (
    match.team_1_score !== null &&
    match.team_1_score !== undefined &&
    match.team_2_score !== null &&
    match.team_2_score !== undefined
  ) {
    return [
      {
        set_number: 1,
        team_1_score: match.team_1_score,
        team_2_score: match.team_2_score,
      },
    ];
  }
  return [];
}

export const TournamentScoreModal: React.FC<TournamentScoreModalProps> = ({
  isOpen,
  onClose,
  match,
  onSave,
}) => {
  const [sets, setSets] = useState<MatchSet[]>(() => getInitialSets(match));
  const [isScoreValid, setIsScoreValid] = useState(true);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevMatch, setPrevMatch] = useState(match);

  if (isOpen !== prevIsOpen || match !== prevMatch) {
    setPrevIsOpen(isOpen);
    setPrevMatch(match);
    setError(null);
    setIsSubmitting(false);
    setIsScoreValid(true);
    setScoreError(null);
    setSets(getInitialSets(match));
  }

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !match) {
    return null;
  }

  const team1Players = match.match_players?.filter((p) => p.team_side === 'team_1') ?? [];
  const team2Players = match.match_players?.filter((p) => p.team_side === 'team_2') ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isScoreValid) {
      setError(scoreError || 'Невалиден резултат.');
      return;
    }

    // Check if completely empty
    if (sets.length === 0) {
      try {
        setIsSubmitting(true);
        await onSave(match.id, null, null, null);
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Грешка при записване на резултата.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const { team1Score, team2Score } = calculateMatchScores(sets);

    try {
      setIsSubmitting(true);
      await onSave(match.id, sets, team1Score, team2Score);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Грешка при записване на резултата.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-gray-900 dark:text-gray-100 relative transition-all my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tournament-score-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div>
            <h2
              id="tournament-score-modal-title"
              className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white"
            >
              Въвеждане на резултат
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {match.group_name && (
                <Badge
                  variant="outline"
                  className="text-xs font-semibold bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
                >
                  {match.group_name}
                </Badge>
              )}
              {match.round != null && match.round > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs font-semibold bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800"
                >
                  Кръг {match.round}
                </Badge>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Затвори"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 pr-1 -mr-1">
          {/* Teams & Players Display */}
          <div className="grid grid-cols-5 gap-2 my-5 items-center bg-gray-50 dark:bg-gray-700/30 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/60">
            {/* Team 1 */}
            <div className="col-span-2 text-left">
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                {match.team_1_name || 'Отбор 1'}
              </h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {team1Players.map((p) => {
                  const name = p.players?.name ?? p.guest_name ?? 'Играч';
                  const isGuest = !p.player_id;
                  return (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300"
                    >
                      <User className="w-2.5 h-2.5 opacity-60" />
                      <span>{name}</span>
                      {isGuest && <span className="opacity-75 text-[10px]">(гост)</span>}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* VS Divider */}
            <div className="col-span-1 text-center font-bold text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">
              vs
            </div>

            {/* Team 2 */}
            <div className="col-span-2 text-right">
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                {match.team_2_name || 'Отбор 2'}
              </h3>
              <div className="flex flex-wrap justify-end gap-1 mt-1">
                {team2Players.map((p) => {
                  const name = p.players?.name ?? p.guest_name ?? 'Играч';
                  const isGuest = !p.player_id;
                  return (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300"
                    >
                      <User className="w-2.5 h-2.5 opacity-60" />
                      <span>{name}</span>
                      {isGuest && <span className="opacity-75 text-[10px]">(гост)</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4">
              <Alert type="error" message={error} />
            </div>
          )}

          {/* Score Form */}
          <form id="tournament-score-form" onSubmit={handleSubmit} className="space-y-4">
            <TennisScoreEditor
              sets={sets}
              onChange={(newSets) => {
                setSets(newSets);
                setError(null);
              }}
              team1Name={match.team_1_name || 'Отбор 1'}
              team2Name={match.team_2_name || 'Отбор 2'}
              onValidationChange={(valid, err) => {
                setIsScoreValid(valid);
                setScoreError(err || null);
              }}
            />
          </form>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Отказ
          </Button>
          <Button
            type="submit"
            form="tournament-score-form"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                Записване...
              </span>
            ) : (
              '💾 Запази резултат'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
