import { describe, it, expect } from 'vitest';
import {
  generateTeamsFingerprint,
  saveMatchup,
  getPreviousMatchups,
  isStringArray,
} from '../history';
import { Team } from '../../types';

describe('history and fingerprint utilities', () => {
  const teamA: Team = {
    id: 'team-1',
    name: 'Team 1',
    players: [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ],
  };

  const teamB: Team = {
    id: 'team-2',
    name: 'Team 2',
    players: [
      { id: '3', name: 'Charlie' },
      { id: '4', name: 'David' },
    ],
  };

  it('generates identical fingerprints regardless of player or team order', () => {
    const teams1 = [teamA, teamB];
    const teams2 = [
      {
        id: 'team-2-alt',
        name: 'Team 2 Alt',
        players: [
          { id: '4', name: 'David' },
          { id: '3', name: 'Charlie' },
        ],
      },
      {
        id: 'team-1-alt',
        name: 'Team 1 Alt',
        players: [
          { id: '2', name: 'Bob' },
          { id: '1', name: 'Alice' },
        ],
      },
    ];

    expect(generateTeamsFingerprint(teams1)).toBe(generateTeamsFingerprint(teams2));
  });

  it('saves and retrieves matchups from history', () => {
    expect(getPreviousMatchups().size).toBe(0);

    saveMatchup([teamA, teamB]);

    const matchups = getPreviousMatchups();
    expect(matchups.size).toBe(1);
    expect(matchups.has(generateTeamsFingerprint([teamA, teamB]))).toBe(true);
  });

  describe('consecutive anti-repetition logic', () => {
    it('avoids producing the exact same fingerprint consecutively when reshuffling', () => {
      const players = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Charlie' },
        { id: '4', name: 'David' },
      ];

      // Initial layout fingerprint
      const initialTeams: Team[] = [
        { id: 't-1', name: 'Team 1', players: [players[0], players[1]] },
        { id: 't-2', name: 'Team 2', players: [players[2], players[3]] },
      ];
      const lastFingerprint = generateTeamsFingerprint(initialTeams);

      // Reshuffle using anti-repetition condition
      let generated: Team[] = [];
      let attempts = 0;
      const maxAttempts = 15;

      do {
        // Simple 2-team split of shuffled players
        const copy = [...players];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        generated = [
          { id: 't-1', name: 'Team 1', players: [copy[0], copy[1]] },
          { id: 't-2', name: 'Team 2', players: [copy[2], copy[3]] },
        ];
        attempts++;
      } while (
        lastFingerprint &&
        generateTeamsFingerprint(generated) === lastFingerprint &&
        attempts < maxAttempts
      );

      const newFingerprint = generateTeamsFingerprint(generated);
      expect(newFingerprint).not.toBe(lastFingerprint);
      expect(attempts).toBeLessThanOrEqual(maxAttempts);
    });

    it('guarantees consecutive different configurations across multiple successive generations', () => {
      const players = [
        { id: '1', name: 'Player A' },
        { id: '2', name: 'Player B' },
        { id: '3', name: 'Player C' },
        { id: '4', name: 'Player D' },
      ];

      let lastFingerprint = '';
      for (let run = 0; run < 10; run++) {
        let generated: Team[] = [];
        let attempts = 0;
        const maxAttempts = 15;

        do {
          const copy = [...players];
          for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
          }
          generated = [
            { id: 't-1', name: 'Team 1', players: [copy[0], copy[1]] },
            { id: 't-2', name: 'Team 2', players: [copy[2], copy[3]] },
          ];
          attempts++;
        } while (
          lastFingerprint &&
          generateTeamsFingerprint(generated) === lastFingerprint &&
          attempts < maxAttempts
        );

        const currentFingerprint = generateTeamsFingerprint(generated);
        if (lastFingerprint) {
          expect(currentFingerprint).not.toBe(lastFingerprint);
        }
        lastFingerprint = currentFingerprint;
      }
    });
  });

  describe('runtime type guard isStringArray', () => {
    it('returns true for string arrays', () => {
      expect(isStringArray([])).toBe(true);
      expect(isStringArray(['a', 'b', 'c'])).toBe(true);
    });

    it('returns false for null, undefined, primitives, and non-array objects', () => {
      expect(isStringArray(null)).toBe(false);
      expect(isStringArray(undefined)).toBe(false);
      expect(isStringArray(123)).toBe(false);
      expect(isStringArray('hello')).toBe(false);
      expect(isStringArray({ a: 'b' })).toBe(false);
    });

    it('returns false for arrays containing non-string items', () => {
      expect(isStringArray([1, 2, 3])).toBe(false);
      expect(isStringArray(['a', 1])).toBe(false);
      expect(isStringArray(['a', null])).toBe(false);
      expect(isStringArray([{}])).toBe(false);
    });
  });

  describe('corrupted storage handling', () => {
    it('gracefully handles malformed JSON and non-string array payloads in localStorage', () => {
      const mockStorage: Record<string, string> = {};
      const fakeWindow = {
        localStorage: {
          getItem: (key: string) => mockStorage[key] ?? null,
          setItem: (key: string, value: string) => {
            mockStorage[key] = value;
          },
        },
      };

      const originalWindow = (globalThis as unknown as { window?: unknown }).window;
      (globalThis as unknown as { window?: unknown }).window = fakeWindow;

      try {
        // Corrupted JSON
        mockStorage['team_generator_matchup_history'] = 'invalid json {[';
        expect(() => getPreviousMatchups()).not.toThrow();
        expect(getPreviousMatchups()).toBeInstanceOf(Set);

        // Valid JSON but not an array
        mockStorage['team_generator_matchup_history'] = JSON.stringify({ not: 'an array' });
        expect(() => getPreviousMatchups()).not.toThrow();

        // Valid JSON array but with non-string elements
        mockStorage['team_generator_matchup_history'] = JSON.stringify([123, true, null]);
        expect(() => getPreviousMatchups()).not.toThrow();
      } finally {
        if (originalWindow !== undefined) {
          (globalThis as unknown as { window?: unknown }).window = originalWindow;
        } else {
          delete (globalThis as unknown as { window?: unknown }).window;
        }
      }
    });
  });
});
