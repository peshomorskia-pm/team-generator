import type { MatchSet } from '../types/match';

export interface TennisValidationResult {
  isValid: boolean;
  error?: string;
}

export interface MatchValidationResult {
  isValid: boolean;
  overallWinner?: 'team1' | 'team2';
  error?: string;
  setErrors: Record<number, string>; // 1-indexed by set_number
}

export interface ScorePreset {
  score1: number;
  score2: number;
  label: string;
}

export const TENNIS_ERROR_MESSAGES = {
  NON_NEGATIVE_INTEGERS: 'Резултатите трябва да бъдат неотрицателни цели числа.',
  NO_TIE: 'Сетовете не могат да завършват наравно.',
  REGULAR_SET_INVALID: 'Невалиден сет: сетовете се играят до 6 гейма с 2 разлика, 7:5 или 7:6 при тайбрек.',
  SUPER_TIEBREAK_MIN_POINTS: 'Тайбрекът се играе до минимум 10 точки с поне 2 разлика (напр. 10:8, 11:9).',
  SUPER_TIEBREAK_MARGIN: 'Невалиден резултат в тайбрека: необходима е точно 2 точки разлика при резултат над 10 точки.',
  SUPER_TIEBREAK_GENERIC: 'Невалиден супер тайбрек: победителят трябва да има поне 10 точки с поне 2 разлика.',
  SET_INCOMPLETE: (setNum: number) => `Моля, попълнете резултата за Сет ${setNum}.`,
  DECIDING_SET_REQUIRED: 'При резултат 1-1 в сетовете е необходим трети решителен сет.',
  EXTRA_SET_NOT_ALLOWED: 'При резултат 2-0 не се играе трети сет.',
  MAX_SETS_EXCEEDED: 'Мачът не може да съдържа повече от 3 сета.',
  CASUAL_MAX_SCORE: 'Резултатът не може да надвишава 50.',
  CASUAL_NON_NEGATIVE: 'Резултатът трябва да бъде 0 или по-голям.',
} as const;

export const REGULAR_SET_PRESETS_TEAM1: readonly ScorePreset[] = [
  { score1: 6, score2: 0, label: '6:0' },
  { score1: 6, score2: 1, label: '6:1' },
  { score1: 6, score2: 2, label: '6:2' },
  { score1: 6, score2: 3, label: '6:3' },
  { score1: 6, score2: 4, label: '6:4' },
  { score1: 7, score2: 5, label: '7:5' },
  { score1: 7, score2: 6, label: '7:6' },
] as const;

export const REGULAR_SET_PRESETS_TEAM2: readonly ScorePreset[] = [
  { score1: 0, score2: 6, label: '0:6' },
  { score1: 1, score2: 6, label: '1:6' },
  { score1: 2, score2: 6, label: '2:6' },
  { score1: 3, score2: 6, label: '3:6' },
  { score1: 4, score2: 6, label: '4:6' },
  { score1: 5, score2: 7, label: '5:7' },
  { score1: 6, score2: 7, label: '6:7' },
] as const;

export const SUPER_TIEBREAK_PRESETS_TEAM1: readonly ScorePreset[] = [
  { score1: 10, score2: 4, label: '10:4' },
  { score1: 10, score2: 6, label: '10:6' },
  { score1: 10, score2: 7, label: '10:7' },
  { score1: 10, score2: 8, label: '10:8' },
  { score1: 11, score2: 9, label: '11:9' },
  { score1: 12, score2: 10, label: '12:10' },
] as const;

export const SUPER_TIEBREAK_PRESETS_TEAM2: readonly ScorePreset[] = [
  { score1: 4, score2: 10, label: '4:10' },
  { score1: 6, score2: 10, label: '6:10' },
  { score1: 7, score2: 10, label: '7:10' },
  { score1: 8, score2: 10, label: '8:10' },
  { score1: 9, score2: 11, label: '9:11' },
  { score1: 10, score2: 12, label: '10:12' },
] as const;

/**
 * Validates a regular tennis set (Sets 1 and 2, or single set match).
 * Valid outcomes: 6:0..6:4, 7:5, 7:6 and mirrors.
 */
export function validateTennisSet(score1: number, score2: number): TennisValidationResult {
  if (!Number.isInteger(score1) || !Number.isInteger(score2) || score1 < 0 || score2 < 0) {
    return { isValid: false, error: TENNIS_ERROR_MESSAGES.NON_NEGATIVE_INTEGERS };
  }

  if (score1 === score2) {
    return { isValid: false, error: TENNIS_ERROR_MESSAGES.NO_TIE };
  }

  const winner = Math.max(score1, score2);
  const loser = Math.min(score1, score2);

  const isValidRegularSet =
    (winner === 6 && loser <= 4) ||
    (winner === 7 && (loser === 5 || loser === 6));

  if (isValidRegularSet) {
    return { isValid: true };
  }

  return { isValid: false, error: TENNIS_ERROR_MESSAGES.REGULAR_SET_INVALID };
}

/**
 * Validates a super tiebreak (Set 3 deciding tiebreak).
 * Played to at least 10 points with at least 2 points difference.
 * If winner > 10, diff must be exactly 2.
 */
export function validateSuperTiebreak(score1: number, score2: number): TennisValidationResult {
  if (!Number.isInteger(score1) || !Number.isInteger(score2) || score1 < 0 || score2 < 0) {
    return { isValid: false, error: TENNIS_ERROR_MESSAGES.NON_NEGATIVE_INTEGERS };
  }

  if (score1 === score2) {
    return { isValid: false, error: TENNIS_ERROR_MESSAGES.NO_TIE };
  }

  const winner = Math.max(score1, score2);
  const loser = Math.min(score1, score2);
  const diff = winner - loser;

  if (winner < 10 || diff < 2) {
    return { isValid: false, error: TENNIS_ERROR_MESSAGES.SUPER_TIEBREAK_MIN_POINTS };
  }

  if (winner === 10 && loser <= 8) {
    return { isValid: true };
  }

  if (winner > 10) {
    if (diff === 2) {
      return { isValid: true };
    }
    return { isValid: false, error: TENNIS_ERROR_MESSAGES.SUPER_TIEBREAK_MARGIN };
  }

  return { isValid: false, error: TENNIS_ERROR_MESSAGES.SUPER_TIEBREAK_GENERIC };
}

/**
 * Validates casual match scores in MatchModal.
 * Checks for integers, non-negative, non-tie, and sanity cap <= 50.
 */
export function validateCasualMatchScore(score1: number, score2: number): TennisValidationResult {
  if (!Number.isInteger(score1) || !Number.isInteger(score2) || score1 < 0 || score2 < 0) {
    return { isValid: false, error: TENNIS_ERROR_MESSAGES.CASUAL_NON_NEGATIVE };
  }

  if (score1 === score2) {
    return { isValid: false, error: TENNIS_ERROR_MESSAGES.NO_TIE };
  }

  if (score1 > 50 || score2 > 50) {
    return { isValid: false, error: TENNIS_ERROR_MESSAGES.CASUAL_MAX_SCORE };
  }

  return { isValid: true };
}

/**
 * Validates full tournament match set configurations (1 to 3 sets).
 */
export function validateTournamentMatch(sets: MatchSet[]): MatchValidationResult {
  if (sets.length === 0) {
    return { isValid: true, setErrors: {} };
  }

  if (sets.length === 1) {
    const s1 = sets[0];
    const setNum = s1.set_number ?? 1;
    const v1 = validateTennisSet(s1.team_1_score, s1.team_2_score);
    if (!v1.isValid) {
      return {
        isValid: false,
        error: v1.error,
        setErrors: { [setNum]: v1.error! },
      };
    }
    const overallWinner = s1.team_1_score > s1.team_2_score ? 'team1' : 'team2';
    return { isValid: true, overallWinner, setErrors: {} };
  }

  if (sets.length === 2) {
    const s1 = sets[0];
    const s2 = sets[1];
    const setNum1 = s1.set_number ?? 1;
    const setNum2 = s2.set_number ?? 2;

    const v1 = validateTennisSet(s1.team_1_score, s1.team_2_score);
    const v2 = validateTennisSet(s2.team_1_score, s2.team_2_score);

    const setErrors: Record<number, string> = {};
    if (!v1.isValid) setErrors[setNum1] = v1.error!;
    if (!v2.isValid) setErrors[setNum2] = v2.error!;

    if (!v1.isValid || !v2.isValid) {
      return {
        isValid: false,
        error: v1.error || v2.error,
        setErrors,
      };
    }

    const t1Sets = (s1.team_1_score > s1.team_2_score ? 1 : 0) + (s2.team_1_score > s2.team_2_score ? 1 : 0);
    const t2Sets = (s1.team_2_score > s1.team_1_score ? 1 : 0) + (s2.team_2_score > s2.team_1_score ? 1 : 0);

    if (t1Sets === 1 && t2Sets === 1) {
      return {
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.DECIDING_SET_REQUIRED,
        setErrors: {},
      };
    }

    const overallWinner = t1Sets === 2 ? 'team1' : 'team2';
    return { isValid: true, overallWinner, setErrors: {} };
  }

  if (sets.length === 3) {
    const s1 = sets[0];
    const s2 = sets[1];
    const s3 = sets[2];
    const setNum1 = s1.set_number ?? 1;
    const setNum2 = s2.set_number ?? 2;
    const setNum3 = s3.set_number ?? 3;

    const v1 = validateTennisSet(s1.team_1_score, s1.team_2_score);
    const v2 = validateTennisSet(s2.team_1_score, s2.team_2_score);
    const v3 = validateSuperTiebreak(s3.team_1_score, s3.team_2_score);

    const setErrors: Record<number, string> = {};
    if (!v1.isValid) setErrors[setNum1] = v1.error!;
    if (!v2.isValid) setErrors[setNum2] = v2.error!;
    if (!v3.isValid) setErrors[setNum3] = v3.error!;

    if (!v1.isValid || !v2.isValid || !v3.isValid) {
      return {
        isValid: false,
        error: v1.error || v2.error || v3.error,
        setErrors,
      };
    }

    const t1Sets = (s1.team_1_score > s1.team_2_score ? 1 : 0) + (s2.team_1_score > s2.team_2_score ? 1 : 0);
    const t2Sets = (s1.team_2_score > s1.team_1_score ? 1 : 0) + (s2.team_2_score > s2.team_1_score ? 1 : 0);

    if (t1Sets === 2 || t2Sets === 2) {
      return {
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.EXTRA_SET_NOT_ALLOWED,
        setErrors: {},
      };
    }

    const overallWinner = s3.team_1_score > s3.team_2_score ? 'team1' : 'team2';
    return { isValid: true, overallWinner, setErrors: {} };
  }

  return {
    isValid: false,
    error: TENNIS_ERROR_MESSAGES.MAX_SETS_EXCEEDED,
    setErrors: {},
  };
}
