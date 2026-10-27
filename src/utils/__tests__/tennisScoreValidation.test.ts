import { describe, it, expect } from 'vitest';
import {
  validateTennisSet,
  validateSuperTiebreak,
  validateCasualMatchScore,
  validateTournamentMatch,
  REGULAR_SET_PRESETS_TEAM1,
  REGULAR_SET_PRESETS_TEAM2,
  SUPER_TIEBREAK_PRESETS_TEAM1,
  SUPER_TIEBREAK_PRESETS_TEAM2,
  TENNIS_ERROR_MESSAGES,
} from '../tennisScoreValidation';
import type { MatchSet } from '../../types/match';

describe('tennisScoreValidation Engine', () => {
  describe('validateTennisSet', () => {
    it('validates happy path standard wins (6:0 .. 6:4)', () => {
      for (let loser = 0; loser <= 4; loser++) {
        expect(validateTennisSet(6, loser)).toEqual({ isValid: true });
      }
    });

    it('validates happy path mirrors (0:6 .. 4:6)', () => {
      for (let loser = 0; loser <= 4; loser++) {
        expect(validateTennisSet(loser, 6)).toEqual({ isValid: true });
      }
    });

    it('validates advantage and tiebreak sets (7:5, 7:6, 5:7, 6:7)', () => {
      expect(validateTennisSet(7, 5)).toEqual({ isValid: true });
      expect(validateTennisSet(7, 6)).toEqual({ isValid: true });
      expect(validateTennisSet(5, 7)).toEqual({ isValid: true });
      expect(validateTennisSet(6, 7)).toEqual({ isValid: true });
    });

    it('rejects tied sets with NO_TIE error', () => {
      expect(validateTennisSet(6, 6)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.NO_TIE,
      });
      expect(validateTennisSet(5, 5)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.NO_TIE,
      });
      expect(validateTennisSet(0, 0)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.NO_TIE,
      });
    });

    it('rejects incomplete and impossible margins with REGULAR_SET_INVALID', () => {
      const invalidPairs = [
        [6, 5],
        [5, 6],
        [5, 4],
        [4, 2],
        [7, 0],
        [7, 4],
        [8, 2],
        [7, 56],
        [10, 5],
      ];
      for (const [s1, s2] of invalidPairs) {
        expect(validateTennisSet(s1, s2)).toEqual({
          isValid: false,
          error: TENNIS_ERROR_MESSAGES.REGULAR_SET_INVALID,
        });
      }
    });

    it('rejects non-integers and negative numbers', () => {
      expect(validateTennisSet(-1, 6)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.NON_NEGATIVE_INTEGERS,
      });
      expect(validateTennisSet(6, -2)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.NON_NEGATIVE_INTEGERS,
      });
      expect(validateTennisSet(6.5, 4)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.NON_NEGATIVE_INTEGERS,
      });
    });
  });

  describe('validateSuperTiebreak', () => {
    it('validates standard 10-point tiebreaks (10:0 .. 10:8)', () => {
      expect(validateSuperTiebreak(10, 0)).toEqual({ isValid: true });
      expect(validateSuperTiebreak(10, 4)).toEqual({ isValid: true });
      expect(validateSuperTiebreak(10, 7)).toEqual({ isValid: true });
      expect(validateSuperTiebreak(10, 8)).toEqual({ isValid: true });
      expect(validateSuperTiebreak(4, 10)).toEqual({ isValid: true });
      expect(validateSuperTiebreak(8, 10)).toEqual({ isValid: true });
    });

    it('validates extended deuce finishes where diff is exactly 2', () => {
      expect(validateSuperTiebreak(11, 9)).toEqual({ isValid: true });
      expect(validateSuperTiebreak(12, 10)).toEqual({ isValid: true });
      expect(validateSuperTiebreak(14, 12)).toEqual({ isValid: true });
      expect(validateSuperTiebreak(9, 11)).toEqual({ isValid: true });
      expect(validateSuperTiebreak(10, 12)).toEqual({ isValid: true });
    });

    it('rejects tied tiebreaks', () => {
      expect(validateSuperTiebreak(10, 10)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.NO_TIE,
      });
      expect(validateSuperTiebreak(11, 11)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.NO_TIE,
      });
    });

    it('rejects tiebreaks with insufficient points or margin', () => {
      expect(validateSuperTiebreak(9, 7)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.SUPER_TIEBREAK_MIN_POINTS,
      });
      expect(validateSuperTiebreak(8, 6)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.SUPER_TIEBREAK_MIN_POINTS,
      });
      expect(validateSuperTiebreak(10, 9)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.SUPER_TIEBREAK_MIN_POINTS,
      });
      expect(validateSuperTiebreak(11, 10)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.SUPER_TIEBREAK_MIN_POINTS,
      });
    });

    it('rejects tiebreaks where winner > 10 but diff > 2', () => {
      expect(validateSuperTiebreak(12, 8)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.SUPER_TIEBREAK_MARGIN,
      });
      expect(validateSuperTiebreak(15, 10)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.SUPER_TIEBREAK_MARGIN,
      });
      expect(validateSuperTiebreak(56, 7)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.SUPER_TIEBREAK_MARGIN,
      });
    });

    it('rejects non-integers and negative numbers', () => {
      expect(validateSuperTiebreak(-1, 10)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.NON_NEGATIVE_INTEGERS,
      });
      expect(validateSuperTiebreak(10.5, 8)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.NON_NEGATIVE_INTEGERS,
      });
    });
  });

  describe('validateCasualMatchScore', () => {
    it('accepts casual sets-won tallies', () => {
      expect(validateCasualMatchScore(2, 1)).toEqual({ isValid: true });
      expect(validateCasualMatchScore(3, 1)).toEqual({ isValid: true });
      expect(validateCasualMatchScore(1, 0)).toEqual({ isValid: true });
      expect(validateCasualMatchScore(0, 2)).toEqual({ isValid: true });
    });

    it('accepts single set game tallies', () => {
      expect(validateCasualMatchScore(6, 4)).toEqual({ isValid: true });
      expect(validateCasualMatchScore(6, 2)).toEqual({ isValid: true });
      expect(validateCasualMatchScore(7, 5)).toEqual({ isValid: true });
    });

    it('rejects tied scores', () => {
      expect(validateCasualMatchScore(2, 2)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.NO_TIE,
      });
      expect(validateCasualMatchScore(6, 6)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.NO_TIE,
      });
    });

    it('rejects negative scores and non-integers', () => {
      expect(validateCasualMatchScore(-1, 2)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.CASUAL_NON_NEGATIVE,
      });
      expect(validateCasualMatchScore(2.5, 1)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.CASUAL_NON_NEGATIVE,
      });
    });

    it('rejects scores exceeding 50 (corrupt typos)', () => {
      expect(validateCasualMatchScore(7, 56)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.CASUAL_MAX_SCORE,
      });
      expect(validateCasualMatchScore(100, 2)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.CASUAL_MAX_SCORE,
      });
    });
  });

  describe('validateTournamentMatch', () => {
    it('handles empty sets as valid (reset score scenario)', () => {
      expect(validateTournamentMatch([])).toEqual({ isValid: true, setErrors: {} });
    });

    it('validates single set match', () => {
      const validSet: MatchSet[] = [{ set_number: 1, team_1_score: 6, team_2_score: 3 }];
      expect(validateTournamentMatch(validSet)).toEqual({
        isValid: true,
        overallWinner: 'team1',
        setErrors: {},
      });

      const invalidSet: MatchSet[] = [{ set_number: 1, team_1_score: 6, team_2_score: 5 }];
      const res = validateTournamentMatch(invalidSet);
      expect(res.isValid).toBe(false);
      expect(res.setErrors[1]).toBe(TENNIS_ERROR_MESSAGES.REGULAR_SET_INVALID);
    });

    it('validates 2-set match when a team wins 2-0', () => {
      const match20: MatchSet[] = [
        { set_number: 1, team_1_score: 6, team_2_score: 4 },
        { set_number: 2, team_1_score: 6, team_2_score: 2 },
      ];
      expect(validateTournamentMatch(match20)).toEqual({
        isValid: true,
        overallWinner: 'team1',
        setErrors: {},
      });

      const match02: MatchSet[] = [
        { set_number: 1, team_1_score: 4, team_2_score: 6 },
        { set_number: 2, team_1_score: 2, team_2_score: 6 },
      ];
      expect(validateTournamentMatch(match02)).toEqual({
        isValid: true,
        overallWinner: 'team2',
        setErrors: {},
      });
    });

    it('rejects 2-set match when sets are tied 1-1 without deciding set', () => {
      const match11: MatchSet[] = [
        { set_number: 1, team_1_score: 6, team_2_score: 4 },
        { set_number: 2, team_1_score: 3, team_2_score: 6 },
      ];
      expect(validateTournamentMatch(match11)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.DECIDING_SET_REQUIRED,
        setErrors: {},
      });
    });

    it('records individual set errors in 2-set match', () => {
      const matchWithErr: MatchSet[] = [
        { set_number: 1, team_1_score: 6, team_2_score: 4 },
        { set_number: 2, team_1_score: 6, team_2_score: 5 },
      ];
      const res = validateTournamentMatch(matchWithErr);
      expect(res.isValid).toBe(false);
      expect(res.setErrors[2]).toBe(TENNIS_ERROR_MESSAGES.REGULAR_SET_INVALID);
    });

    it('validates 3-set match with 1-1 in sets and super tiebreak', () => {
      const match3: MatchSet[] = [
        { set_number: 1, team_1_score: 6, team_2_score: 4 },
        { set_number: 2, team_1_score: 3, team_2_score: 6 },
        { set_number: 3, team_1_score: 10, team_2_score: 7 },
      ];
      expect(validateTournamentMatch(match3)).toEqual({
        isValid: true,
        overallWinner: 'team1',
        setErrors: {},
      });

      const match3Team2Wins: MatchSet[] = [
        { set_number: 1, team_1_score: 6, team_2_score: 4 },
        { set_number: 2, team_1_score: 3, team_2_score: 6 },
        { set_number: 3, team_1_score: 8, team_2_score: 10 },
      ];
      expect(validateTournamentMatch(match3Team2Wins)).toEqual({
        isValid: true,
        overallWinner: 'team2',
        setErrors: {},
      });
    });

    it('rejects 3-set match if sets 1 and 2 were already won 2-0', () => {
      const illegal3rdSet: MatchSet[] = [
        { set_number: 1, team_1_score: 6, team_2_score: 4 },
        { set_number: 2, team_1_score: 6, team_2_score: 3 },
        { set_number: 3, team_1_score: 10, team_2_score: 7 },
      ];
      expect(validateTournamentMatch(illegal3rdSet)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.EXTRA_SET_NOT_ALLOWED,
        setErrors: {},
      });
    });

    it('reports errors for invalid sets in 3-set match', () => {
      const invalidTiebreak: MatchSet[] = [
        { set_number: 1, team_1_score: 6, team_2_score: 4 },
        { set_number: 2, team_1_score: 3, team_2_score: 6 },
        { set_number: 3, team_1_score: 10, team_2_score: 9 },
      ];
      const res = validateTournamentMatch(invalidTiebreak);
      expect(res.isValid).toBe(false);
      expect(res.setErrors[3]).toBe(TENNIS_ERROR_MESSAGES.SUPER_TIEBREAK_MIN_POINTS);
    });

    it('rejects matches with more than 3 sets', () => {
      const fourSets: MatchSet[] = [
        { set_number: 1, team_1_score: 6, team_2_score: 4 },
        { set_number: 2, team_1_score: 3, team_2_score: 6 },
        { set_number: 3, team_1_score: 10, team_2_score: 7 },
        { set_number: 4, team_1_score: 6, team_2_score: 0 },
      ];
      expect(validateTournamentMatch(fourSets)).toEqual({
        isValid: false,
        error: TENNIS_ERROR_MESSAGES.MAX_SETS_EXCEEDED,
        setErrors: {},
      });
    });
  });

  describe('Presets Validity Check', () => {
    it('verifies all regular set presets for team 1 are valid tennis sets', () => {
      for (const preset of REGULAR_SET_PRESETS_TEAM1) {
        const res = validateTennisSet(preset.score1, preset.score2);
        expect(res.isValid).toBe(true);
        expect(preset.score1).toBeGreaterThan(preset.score2);
      }
    });

    it('verifies all regular set presets for team 2 are valid tennis sets', () => {
      for (const preset of REGULAR_SET_PRESETS_TEAM2) {
        const res = validateTennisSet(preset.score1, preset.score2);
        expect(res.isValid).toBe(true);
        expect(preset.score2).toBeGreaterThan(preset.score1);
      }
    });

    it('verifies all super tiebreak presets for team 1 are valid super tiebreaks', () => {
      for (const preset of SUPER_TIEBREAK_PRESETS_TEAM1) {
        const res = validateSuperTiebreak(preset.score1, preset.score2);
        expect(res.isValid).toBe(true);
        expect(preset.score1).toBeGreaterThan(preset.score2);
      }
    });

    it('verifies all super tiebreak presets for team 2 are valid super tiebreaks', () => {
      for (const preset of SUPER_TIEBREAK_PRESETS_TEAM2) {
        const res = validateSuperTiebreak(preset.score1, preset.score2);
        expect(res.isValid).toBe(true);
        expect(preset.score2).toBeGreaterThan(preset.score1);
      }
    });
  });
});
