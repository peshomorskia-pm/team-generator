import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { MatchSet } from '../../types/match';
import {
  validateTennisSet,
  validateSuperTiebreak,
  validateTournamentMatch,
  REGULAR_SET_PRESETS_TEAM1,
  REGULAR_SET_PRESETS_TEAM2,
  TENNIS_ERROR_MESSAGES,
} from '../../utils/tennisScoreValidation';

export interface TennisScoreEditorProps {
  /** Array of completed or in-progress match sets */
  sets: MatchSet[];
  /** Emitted whenever sets are modified and parseable */
  onChange: (sets: MatchSet[]) => void;
  /** Display label for Team 1 (default: 'Отбор 1') */
  team1Name?: string;
  /** Display label for Team 2 (default: 'Отбор 2') */
  team2Name?: string;
  /** Whether deciding 3rd set is allowed (default: true) */
  allowSet3?: boolean;
  /** Disables all inputs and action buttons */
  readOnly?: boolean;
  /** Emitted on every edit with validity status and first validation error message */
  onValidationChange?: (isValid: boolean, error?: string) => void;
}

export interface DraftSetRow {
  set_number: number;
  team_1_score: string;
  team_2_score: string;
}

function initDraftSets(sets: MatchSet[] | null | undefined): DraftSetRow[] {
  if (sets && sets.length > 0) {
    return sets.map((s, idx) => ({
      set_number: s.set_number ?? idx + 1,
      team_1_score: s.team_1_score !== undefined && s.team_1_score !== null ? String(s.team_1_score) : '',
      team_2_score: s.team_2_score !== undefined && s.team_2_score !== null ? String(s.team_2_score) : '',
    }));
  }
  return [{ set_number: 1, team_1_score: '', team_2_score: '' }];
}

export const TennisScoreEditor: React.FC<TennisScoreEditorProps> = ({
  sets,
  onChange,
  team1Name = 'Отбор 1',
  team2Name = 'Отбор 2',
  allowSet3 = true,
  readOnly = false,
  onValidationChange,
}) => {
  const [draftSets, setDraftSets] = useState<DraftSetRow[]>(() => initDraftSets(sets));
  const [prevSets, setPrevSets] = useState(sets);
  const [lastEmittedSets, setLastEmittedSets] = useState<MatchSet[] | null>(null);

  if (sets !== prevSets) {
    setPrevSets(sets);
    if (lastEmittedSets !== sets) {
      setDraftSets(initDraftSets(sets));
    }
  }

  const evaluateAndEmit = (updatedDraft: DraftSetRow[]) => {
    const allEmpty = updatedDraft.every(
      (s) => s.team_1_score.trim() === '' && s.team_2_score.trim() === ''
    );

    let isValid = true;
    let error: string | undefined = undefined;
    let parseableSets: MatchSet[] = [];

    if (allEmpty) {
      isValid = true;
      error = undefined;
      parseableSets = [];
    } else {
      const incomplete = updatedDraft.find(
        (s) => s.team_1_score.trim() === '' || s.team_2_score.trim() === ''
      );

      if (incomplete) {
        isValid = false;
        error = TENNIS_ERROR_MESSAGES.SET_INCOMPLETE(incomplete.set_number);
      } else {
        const nonDigits = updatedDraft.find(
          (s) => !/^\d+$/.test(s.team_1_score.trim()) || !/^\d+$/.test(s.team_2_score.trim())
        );

        if (nonDigits) {
          isValid = false;
          error = TENNIS_ERROR_MESSAGES.NON_NEGATIVE_INTEGERS;
        } else {
          const parsed: MatchSet[] = updatedDraft.map((s, idx) => ({
            set_number: idx + 1,
            team_1_score: parseInt(s.team_1_score.trim(), 10),
            team_2_score: parseInt(s.team_2_score.trim(), 10),
          }));
          const matchVal = validateTournamentMatch(parsed);
          isValid = matchVal.isValid;
          error = matchVal.error || Object.values(matchVal.setErrors)[0];
          parseableSets = parsed;
        }
      }
    }

    if (parseableSets.length === 0 && !allEmpty) {
      // Gather any fully parseable rows so parent has partial state if needed
      parseableSets = updatedDraft
        .filter(
          (s) =>
            s.team_1_score.trim() !== '' &&
            s.team_2_score.trim() !== '' &&
            /^\d+$/.test(s.team_1_score.trim()) &&
            /^\d+$/.test(s.team_2_score.trim())
        )
        .map((s, idx) => ({
          set_number: idx + 1,
          team_1_score: parseInt(s.team_1_score.trim(), 10),
          team_2_score: parseInt(s.team_2_score.trim(), 10),
        }));
    }

    setLastEmittedSets(parseableSets);
    onChange(parseableSets);
    onValidationChange?.(isValid, error);
  };

  const handleScoreChange = (
    index: number,
    field: 'team_1_score' | 'team_2_score',
    value: string
  ) => {
    const cleaned = value.replace(/\D/g, '');
    const updated = draftSets.map((row, i) =>
      i === index ? { ...row, [field]: cleaned } : row
    );
    setDraftSets(updated);
    evaluateAndEmit(updated);
  };

  const handleApplyPreset = (index: number, score1: number, score2: number) => {
    const updated = draftSets.map((row, i) =>
      i === index
        ? {
            ...row,
            team_1_score: String(score1),
            team_2_score: String(score2),
          }
        : row
    );
    setDraftSets(updated);
    evaluateAndEmit(updated);
  };

  const handleAddSet = (setNumber: number) => {
    if (draftSets.length >= 3) return;
    const updated = [
      ...draftSets,
      {
        set_number: setNumber,
        team_1_score: '',
        team_2_score: '',
      },
    ];
    setDraftSets(updated);
    evaluateAndEmit(updated);
  };

  const handleRemoveSet = (index: number) => {
    const filtered = draftSets.filter((_, i) => i !== index);
    const updated = filtered.map((s, idx) => ({
      ...s,
      set_number: idx + 1,
    }));
    setDraftSets(updated);
    evaluateAndEmit(updated);
  };

  // Derive live per-set validation errors when both inputs are entered
  const liveSetErrors: Record<number, string> = {};
  draftSets.forEach((s) => {
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
  if (draftSets.length === 2 && allowSet3) {
    const s1_1 = parseInt(draftSets[0].team_1_score.trim(), 10);
    const s1_2 = parseInt(draftSets[0].team_2_score.trim(), 10);
    const s2_1 = parseInt(draftSets[1].team_1_score.trim(), 10);
    const s2_2 = parseInt(draftSets[1].team_2_score.trim(), 10);

    if (
      !Number.isNaN(s1_1) &&
      !Number.isNaN(s1_2) &&
      !Number.isNaN(s2_1) &&
      !Number.isNaN(s2_2)
    ) {
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

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {draftSets.map((setRow, index) => {
          const isSuperTiebreak = setRow.set_number === 3;

          return (
            <div
              key={setRow.set_number}
              className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300 w-28 shrink-0">
                  {isSuperTiebreak ? 'Сет 3 (Тайбрек)' : `Сет ${setRow.set_number}`}
                </span>

                {/* Numeric Inputs */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    aria-label={`Сет ${setRow.set_number} Отбор 1`}
                    value={setRow.team_1_score}
                    onChange={(e) => handleScoreChange(index, 'team_1_score', e.target.value)}
                    disabled={readOnly}
                    className="w-14 h-11 text-center font-mono font-bold text-lg rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={readOnly}
                    className="w-14 h-11 text-center font-mono font-bold text-lg rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="w-8 flex justify-end">
                  {!readOnly && index > 0 && (
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

              {/* Fast-Tap Mobile Preset Chips (Sets 1 and 2 only, no chips for Set 3) */}
              {!readOnly && !isSuperTiebreak && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 space-y-1.5">
                  {/* Team 1 Winning Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 w-16 truncate shrink-0">
                      {team1Name}:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {REGULAR_SET_PRESETS_TEAM1.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleApplyPreset(index, preset.score1, preset.score2)}
                          className="min-h-[36px] py-1.5 px-2.5 flex items-center justify-center font-bold text-xs rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 dark:border-indigo-800/60 select-none active:scale-95 transition-transform"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Team 2 Winning Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 w-16 truncate shrink-0">
                      {team2Name}:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {REGULAR_SET_PRESETS_TEAM2.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleApplyPreset(index, preset.score1, preset.score2)}
                          className="min-h-[36px] py-1.5 px-2.5 flex items-center justify-center font-bold text-xs rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 dark:bg-gray-700/60 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-600 select-none active:scale-95 transition-transform"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progressive Add Set Buttons */}
      {!readOnly && draftSets.length === 1 && (
        <button
          type="button"
          onClick={() => handleAddSet(2)}
          className="w-full py-2 px-3 border border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 rounded-xl text-xs sm:text-sm font-medium transition-colors"
        >
          + Добави сет (2 от 3)
        </button>
      )}

      {!readOnly && draftSets.length === 2 && showSet3Button && (
        <button
          type="button"
          onClick={() => handleAddSet(3)}
          className="w-full py-2 px-3 border border-dashed border-amber-300 dark:border-amber-600 hover:border-amber-500 dark:hover:border-amber-400 text-amber-600 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 rounded-xl text-xs sm:text-sm font-medium transition-colors"
        >
          + Добави решителен тайбрек (Сет 3)
        </button>
      )}
    </div>
  );
};
