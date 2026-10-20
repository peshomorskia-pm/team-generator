import React, { useState, useEffect } from 'react';
import { X, User, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import type { MatchDetail } from '../../types/matches';
import type { MatchSet } from '../../types/match';
import {
  validateTennisSet,
  validateSuperTiebreak,
  validateTournamentMatch,
  REGULAR_SET_PRESETS_TEAM1,
  REGULAR_SET_PRESETS_TEAM2,
  SUPER_TIEBREAK_PRESETS_TEAM1,
  SUPER_TIEBREAK_PRESETS_TEAM2,
  TENNIS_ERROR_MESSAGES,
} from '../../utils/tennisScoreValidation';

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

  const handleApplyPreset = (index: number, score1: number, score2: number) => {
    setError(null);
    setSets((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        team_1_score: String(score1),
        team_2_score: String(score2),
      };
      return updated;
    });
  };

  const handleStepScore = (
    index: number,
    field: 'team_1_score' | 'team_2_score',
    delta: number
  ) => {
    setError(null);
    setSets((prev) => {
      const updated = [...prev];
      const currentVal = parseInt(updated[index][field], 10);
      const base = Number.isNaN(currentVal) ? 0 : currentVal;
      const nextVal = Math.max(0, base + delta);
      updated[index] = {
        ...updated[index],
        [field]: String(nextVal),
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

  // Derive live per-set validation errors when both inputs are entered
  const liveSetErrors: Record<number, string> = {};
  sets.forEach((s) => {
    const t1 = s.team_1_score.trim();
    const t2 = s.team_2_score.trim();
    if (t1 !== '' && t2 !== '') {
      if (!/^\d+$/.test(t1) || !/^\d+$/.test(t2)) {
        liveSetErrors[s.set_number] = TENNIS_ERROR_MESSAGES.NON_NEGATIVE_INTEGERS;
      } else {
        const num1 = parseInt(t1, 10);
        const num2 = parseInt(t2, 10);
        const res =
          s.set_number === 3
            ? validateSuperTiebreak(num1, num2)
            : validateTennisSet(num1, num2);
        if (!res.isValid && res.error) {
          liveSetErrors[s.set_number] = res.error;
        }
      }
    }
  });

  // Check if Set 3 button can be shown (valid 1-1 split in sets 1 and 2)
  let showSet3Button = false;
  if (sets.length === 2) {
    const s1_1 = parseInt(sets[0].team_1_score, 10);
    const s1_2 = parseInt(sets[0].team_2_score, 10);
    const s2_1 = parseInt(sets[1].team_1_score, 10);
    const s2_2 = parseInt(sets[1].team_2_score, 10);

    if (!Number.isNaN(s1_1) && !Number.isNaN(s1_2) && !Number.isNaN(s2_1) && !Number.isNaN(s2_2)) {
      const v1 = validateTennisSet(s1_1, s1_2);
      const v2 = validateTennisSet(s2_1, s2_2);
      if (v1.isValid && v2.isValid) {
        const t1WonSet1 = s1_1 > s1_2;
        const t1WonSet2 = s2_1 > s2_2;
        // Tied 1-1 in sets
        showSet3Button = (t1WonSet1 && !t1WonSet2) || (!t1WonSet1 && t1WonSet2);
      }
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

    // Validate that all sets are filled and integer-based
    for (const s of sets) {
      const t1 = s.team_1_score.trim();
      const t2 = s.team_2_score.trim();

      if (t1 === '' || t2 === '') {
        setError(TENNIS_ERROR_MESSAGES.SET_INCOMPLETE(s.set_number));
        return;
      }

      if (!/^\d+$/.test(t1) || !/^\d+$/.test(t2)) {
        setError(TENNIS_ERROR_MESSAGES.NON_NEGATIVE_INTEGERS);
        return;
      }
    }

    const parsedSets: MatchSet[] = sets.map((s, idx) => ({
      set_number: idx + 1,
      team_1_score: parseInt(s.team_1_score.trim(), 10),
      team_2_score: parseInt(s.team_2_score.trim(), 10),
    }));

    const validation = validateTournamentMatch(parsedSets);
    if (!validation.isValid) {
      const firstSetError = Object.values(validation.setErrors)[0];
      setError(validation.error || firstSetError || 'Невалиден резултат.');
      return;
    }

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
            <div className="space-y-3">
              {sets.map((setRow, index) => {
                const isSuperTiebreak = setRow.set_number === 3;
                const setT1Presets = isSuperTiebreak
                  ? SUPER_TIEBREAK_PRESETS_TEAM1
                  : REGULAR_SET_PRESETS_TEAM1;
                const setT2Presets = isSuperTiebreak
                  ? SUPER_TIEBREAK_PRESETS_TEAM2
                  : REGULAR_SET_PRESETS_TEAM2;

                return (
                  <div
                    key={setRow.set_number}
                    className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-300 w-28 shrink-0">
                        {isSuperTiebreak ? 'Сет 3 (Тайбрек)' : `Сет ${setRow.set_number}`}
                      </span>

                      {/* Inputs & Optional Steppers */}
                      <div className="flex items-center gap-2">
                        {/* Team 1 Score Control */}
                        {isSuperTiebreak ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              aria-label="Намали точки Отбор 1"
                              onClick={() => handleStepScore(index, 'team_1_score', -1)}
                              className="w-7 h-8 flex items-center justify-center rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold text-sm transition-colors select-none"
                            >
                              -
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="0"
                              aria-label={`Сет ${setRow.set_number} Отбор 1`}
                              value={setRow.team_1_score}
                              onChange={(e) => handleScoreChange(index, 'team_1_score', e.target.value)}
                              className="w-12 h-10 text-center font-mono font-bold text-base rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              aria-label="Увеличи точки Отбор 1"
                              onClick={() => handleStepScore(index, 'team_1_score', 1)}
                              className="w-7 h-8 flex items-center justify-center rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold text-sm transition-colors select-none"
                            >
                              +
                            </button>
                          </div>
                        ) : (
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
                        )}

                        <span className="text-gray-400 font-bold text-lg">:</span>

                        {/* Team 2 Score Control */}
                        {isSuperTiebreak ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              aria-label="Намали точки Отбор 2"
                              onClick={() => handleStepScore(index, 'team_2_score', -1)}
                              className="w-7 h-8 flex items-center justify-center rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold text-sm transition-colors select-none"
                            >
                              -
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="0"
                              aria-label={`Сет ${setRow.set_number} Отбор 2`}
                              value={setRow.team_2_score}
                              onChange={(e) => handleScoreChange(index, 'team_2_score', e.target.value)}
                              className="w-12 h-10 text-center font-mono font-bold text-base rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              aria-label="Увеличи точки Отбор 2"
                              onClick={() => handleStepScore(index, 'team_2_score', 1)}
                              className="w-7 h-8 flex items-center justify-center rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold text-sm transition-colors select-none"
                            >
                              +
                            </button>
                          </div>
                        ) : (
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
                        )}
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

                    {/* Live Per-Set Validation Error */}
                    {liveSetErrors[setRow.set_number] && (
                      <div
                        role="alert"
                        className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-md px-2.5 py-1"
                      >
                        {liveSetErrors[setRow.set_number]}
                      </div>
                    )}

                    {/* Fast-Tap Mobile Preset Chips */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 space-y-1.5">
                      {/* Team 1 Winning Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 w-16 truncate shrink-0">
                          {match.team_1_name || 'Отбор 1'}:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {setT1Presets.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => handleApplyPreset(index, preset.score1, preset.score2)}
                              className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 dark:border-indigo-800/60 transition-colors select-none active:scale-95"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Team 2 Winning Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 w-16 truncate shrink-0">
                          {match.team_2_name || 'Отбор 2'}:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {setT2Presets.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => handleApplyPreset(index, preset.score1, preset.score2)}
                              className="px-2 py-0.5 text-xs font-semibold rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 dark:bg-gray-700/60 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-600 transition-colors select-none active:scale-95"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
