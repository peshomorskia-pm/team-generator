import React, { useState, useEffect } from 'react';
import { X, User, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import type { MatchDetail } from '../../types/matches';
import type { MatchSet } from '../../types/match';

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

interface SetRowState {
  set_number: number;
  team_1_score: string;
  team_2_score: string;
}

function getInitialSets(match: MatchDetail | null): SetRowState[] {
  if (!match) return [{ set_number: 1, team_1_score: '', team_2_score: '' }];
  if (match.sets && match.sets.length > 0) {
    return match.sets.map((s, idx) => ({
      set_number: idx + 1,
      team_1_score: String(s.team_1_score),
      team_2_score: String(s.team_2_score),
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
        team_1_score: String(match.team_1_score),
        team_2_score: String(match.team_2_score),
      },
    ];
  }
  return [{ set_number: 1, team_1_score: '', team_2_score: '' }];
}

export const TournamentScoreModal: React.FC<TournamentScoreModalProps> = ({
  isOpen,
  onClose,
  match,
  onSave,
}) => {
  const [sets, setSets] = useState<SetRowState[]>(() => getInitialSets(match));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevMatch, setPrevMatch] = useState(match);

  if (isOpen !== prevIsOpen || match !== prevMatch) {
    setPrevIsOpen(isOpen);
    setPrevMatch(match);
    setError(null);
    setIsSubmitting(false);
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

  const handleScoreChange = (
    index: number,
    field: 'team_1_score' | 'team_2_score',
    value: string
  ) => {
    // Only allow digits
    const cleaned = value.replace(/\D/g, '');
    setError(null);
    setSets((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: cleaned,
      };
      return updated;
    });
  };

  const handleAddSet = (setNumber: number) => {
    setError(null);
    if (sets.length >= 3) return;
    setSets((prev) => [
      ...prev,
      {
        set_number: setNumber,
        team_1_score: '',
        team_2_score: '',
      },
    ]);
  };

  const handleRemoveSet = (index: number) => {
    setError(null);
    setSets((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((s, idx) => ({
        ...s,
        set_number: idx + 1,
      }));
    });
  };

  // Check if Set 3 button can be shown
  let showSet3Button = false;
  if (sets.length === 2) {
    const s1_1 = parseInt(sets[0].team_1_score, 10);
    const s1_2 = parseInt(sets[0].team_2_score, 10);
    const s2_1 = parseInt(sets[1].team_1_score, 10);
    const s2_2 = parseInt(sets[1].team_2_score, 10);

    const s1Valid = !isNaN(s1_1) && !isNaN(s1_2) && s1_1 !== s1_2;
    const s2Valid = !isNaN(s2_1) && !isNaN(s2_2) && s2_1 !== s2_2;

    if (s1Valid && s2Valid) {
      const t1WonSet1 = s1_1 > s1_2;
      const t1WonSet2 = s2_1 > s2_2;
      // Tied 1-1 in sets
      showSet3Button = (t1WonSet1 && !t1WonSet2) || (!t1WonSet1 && t1WonSet2);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check if completely empty
    const allEmpty = sets.every(
      (s) => s.team_1_score.trim() === '' && s.team_2_score.trim() === ''
    );

    if (allEmpty) {
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

    // Validate each set
    for (const s of sets) {
      if (s.team_1_score.trim() === '' || s.team_2_score.trim() === '') {
        setError(`Моля, попълнете резултата за Сет ${s.set_number}.`);
        return;
      }

      if (!/^\d+$/.test(s.team_1_score.trim()) || !/^\d+$/.test(s.team_2_score.trim())) {
        setError('Резултатите трябва да бъдат неотрицателни цели числа.');
        return;
      }

      const score1 = parseInt(s.team_1_score.trim(), 10);
      const score2 = parseInt(s.team_2_score.trim(), 10);

      if (score1 === score2) {
        setError('Сетовете не могат да завършват наравно.');
        return;
      }
    }

    // Validate 1-1 tie in 2-set match
    if (sets.length === 2) {
      const s1_1 = parseInt(sets[0].team_1_score.trim(), 10);
      const s1_2 = parseInt(sets[0].team_2_score.trim(), 10);
      const s2_1 = parseInt(sets[1].team_1_score.trim(), 10);
      const s2_2 = parseInt(sets[1].team_2_score.trim(), 10);

      const t1SetsWon = (s1_1 > s1_2 ? 1 : 0) + (s2_1 > s2_2 ? 1 : 0);
      const t2SetsWon = (s1_2 > s1_1 ? 1 : 0) + (s2_2 > s2_1 ? 1 : 0);

      if (t1SetsWon === 1 && t2SetsWon === 1) {
        setError('При резултат 1-1 в сетовете е необходим трети решителен сет.');
        return;
      }
    }

    const parsedSets: MatchSet[] = sets.map((s, idx) => ({
      set_number: idx + 1,
      team_1_score: parseInt(s.team_1_score.trim(), 10),
      team_2_score: parseInt(s.team_2_score.trim(), 10),
    }));

    let team1Score: number;
    let team2Score: number;

    if (parsedSets.length === 1) {
      team1Score = parsedSets[0].team_1_score;
      team2Score = parsedSets[0].team_2_score;
    } else {
      let t1Won = 0;
      let t2Won = 0;
      for (const s of parsedSets) {
        if (s.team_1_score > s.team_2_score) t1Won += 1;
        else if (s.team_2_score > s.team_1_score) t2Won += 1;
      }
      team1Score = t1Won;
      team2Score = t2Won;
    }

    try {
      setIsSubmitting(true);
      await onSave(match.id, parsedSets, team1Score, team2Score);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Грешка при записване на резултата.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-gray-900 dark:text-gray-100 relative transition-all"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tournament-score-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {sets.map((setRow, index) => (
              <div
                key={setRow.set_number}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700"
              >
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300 w-24">
                  {setRow.set_number === 3 ? 'Сет 3 (Тайбрек)' : `Сет ${setRow.set_number}`}
                </span>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    aria-label={`Сет ${setRow.set_number} Отбор 1`}
                    value={setRow.team_1_score}
                    onChange={(e) => handleScoreChange(index, 'team_1_score', e.target.value)}
                    className="w-14 h-11 text-center font-mono font-bold text-lg rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-gray-400 font-bold text-lg">:</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    aria-label={`Сет ${setRow.set_number} Отбор 2`}
                    value={setRow.team_2_score}
                    onChange={(e) => handleScoreChange(index, 'team_2_score', e.target.value)}
                    className="w-14 h-11 text-center font-mono font-bold text-lg rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="w-8 flex justify-end">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSet(index)}
                      aria-label={`Премахни Сет ${setRow.set_number}`}
                      className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Progressive Add Set Buttons */}
          {sets.length === 1 && (
            <button
              type="button"
              onClick={() => handleAddSet(2)}
              className="w-full py-2 px-3 border border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 rounded-xl text-xs sm:text-sm font-medium transition-colors"
            >
              + Добави сет (2 от 3)
            </button>
          )}

          {sets.length === 2 && showSet3Button && (
            <button
              type="button"
              onClick={() => handleAddSet(3)}
              className="w-full py-2 px-3 border border-dashed border-amber-300 dark:border-amber-600 hover:border-amber-500 dark:hover:border-amber-400 text-amber-600 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 rounded-xl text-xs sm:text-sm font-medium transition-colors"
            >
              + Добави решителен тайбрек (Сет 3)
            </button>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
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
        </form>
      </div>
    </div>
  );
};
