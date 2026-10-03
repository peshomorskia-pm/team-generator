import { describe, it, expect } from 'vitest';
import {
  calculateExpectedScore,
  calculateEloDelta,
  getTeamAverageRating,
  calculateMatchElo,
  DEFAULT_RATING,
  K_FACTOR,
} from '../elo';

describe('ELO Calculation Utility', () => {
  describe('Constants', () => {
    it('defines default rating as 1200 and K factor as 32', () => {
      expect(DEFAULT_RATING).toBe(1200);
      expect(K_FACTOR).toBe(32);
    });
  });

  describe('calculateExpectedScore', () => {
    it('returns 0.5 when both ratings are equal', () => {
      expect(calculateExpectedScore(1200, 1200)).toBeCloseTo(0.5, 4);
      expect(calculateExpectedScore(1500, 1500)).toBeCloseTo(0.5, 4);
    });

    it('returns expected probabilities for 400 point difference', () => {
      // With 400 point advantage, expected score is 1 / (1 + 10^-1) = 1 / 1.1 ~= 0.9091
      expect(calculateExpectedScore(1600, 1200)).toBeCloseTo(0.9091, 3);
      expect(calculateExpectedScore(1200, 1600)).toBeCloseTo(0.0909, 3);
    });
  });

  describe('calculateEloDelta (1v1)', () => {
    it('awards +16 to winner and -16 to loser when ratings are identical (1200 vs 1200)', () => {
      const deltaA = calculateEloDelta(1200, 1200, 6, 4);
      const deltaB = calculateEloDelta(1200, 1200, 4, 6);

      expect(deltaA).toBe(16);
      expect(deltaB).toBe(-16);
    });

    it('awards smaller gain for favorite win (unequal ratings)', () => {
      // 1400 vs 1200 (200 point difference): expectedA ~= 0.7597, deltaA = round(32 * (1 - 0.7597)) = +8
      const deltaFavoriteWin = calculateEloDelta(1400, 1200, 6, 2);
      const deltaUnderdogLoss = calculateEloDelta(1200, 1400, 2, 6);

      expect(deltaFavoriteWin).toBe(8);
      expect(deltaUnderdogLoss).toBe(-8);
    });

    it('awards larger gain for upset win (underdog beats favorite)', () => {
      // Underdog (1200) beats Favorite (1400): expected = 0.2403, delta = round(32 * (1 - 0.2403)) = +24
      const deltaUnderdogWin = calculateEloDelta(1200, 1400, 6, 4);
      const deltaFavoriteLoss = calculateEloDelta(1400, 1200, 4, 6);

      expect(deltaUnderdogWin).toBe(24);
      expect(deltaFavoriteLoss).toBe(-24);
    });

    it('handles draw logic with S = 0.5 correctly', () => {
      // Equal ratings draw: delta = 0
      const deltaDrawEqualA = calculateEloDelta(1200, 1200, 5, 5);
      const deltaDrawEqualB = calculateEloDelta(1200, 1200, 5, 5);
      expect(deltaDrawEqualA).toBe(0);
      expect(deltaDrawEqualB).toBe(0);

      // Unequal ratings draw (1400 vs 1200): favorite drops, underdog rises
      const deltaFavoriteDraw = calculateEloDelta(1400, 1200, 4, 4);
      const deltaUnderdogDraw = calculateEloDelta(1200, 1400, 4, 4);

      expect(deltaFavoriteDraw).toBe(-8);
      expect(deltaUnderdogDraw).toBe(8);
    });
  });

  describe('getTeamAverageRating (Doubles & Transient Guests)', () => {
    it('calculates average for registered players', () => {
      expect(getTeamAverageRating([1300, 1100])).toBe(1200);
      expect(getTeamAverageRating([1400, 1500])).toBe(1450);
    });

    it('substitutes default 1200 for transient guests (null or undefined)', () => {
      // 1 registered player at 1400, 1 guest (null)
      // Average: (1400 + 1200) / 2 = 1300
      expect(getTeamAverageRating([1400, null])).toBe(1300);
      expect(getTeamAverageRating([undefined, 1100])).toBe(1150);
      expect(getTeamAverageRating([null, null])).toBe(1200);
    });

    it('handles empty roster by returning default 1200', () => {
      expect(getTeamAverageRating([])).toBe(1200);
    });
  });

  describe('calculateMatchElo (Full Match Calculation)', () => {
    it('calculates correct deltas for 1v1 singles match', () => {
      const result = calculateMatchElo({
        format: 'singles',
        team1Ratings: [1200],
        team2Ratings: [1200],
        score1: 6,
        score2: 3,
      });

      expect(result.team1EffectiveRating).toBe(1200);
      expect(result.team2EffectiveRating).toBe(1200);
      expect(result.team1Delta).toBe(16);
      expect(result.team2Delta).toBe(-16);
    });

    it('calculates correct deltas for 2v2 doubles match using team averages', () => {
      // Team 1: 1300 & 1100 -> avg 1200
      // Team 2: 1250 & 1150 -> avg 1200
      const result = calculateMatchElo({
        format: 'doubles',
        team1Ratings: [1300, 1100],
        team2Ratings: [1250, 1150],
        score1: 7,
        score2: 5,
      });

      expect(result.team1EffectiveRating).toBe(1200);
      expect(result.team2EffectiveRating).toBe(1200);
      expect(result.team1Delta).toBe(16);
      expect(result.team2Delta).toBe(-16);
    });

    it('correctly incorporates transient guests with 1200 in doubles match', () => {
      // Team 1: registered 1400 and guest (null -> 1200) -> avg 1300
      // Team 2: registered 1300 and registered 1300 -> avg 1300
      const result = calculateMatchElo({
        format: 'doubles',
        team1Ratings: [1400, null],
        team2Ratings: [1300, 1300],
        score1: 6,
        score2: 4,
      });

      expect(result.team1EffectiveRating).toBe(1300);
      expect(result.team2EffectiveRating).toBe(1300);
      expect(result.team1Delta).toBe(16);
      expect(result.team2Delta).toBe(-16);
    });

    it('supports custom K-factor', () => {
      const result = calculateMatchElo({
        team1Ratings: [1200],
        team2Ratings: [1200],
        score1: 6,
        score2: 2,
        kFactor: 16,
      });

      expect(result.team1Delta).toBe(8);
      expect(result.team2Delta).toBe(-8);
    });
  });
});
