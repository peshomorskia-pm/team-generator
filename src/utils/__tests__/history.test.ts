import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateTeamsFingerprint,
  isDuplicateMatchup,
  saveMatchup,
  getPreviousMatchups,
  clearMatchupHistory,
} from '../history';
import { Team } from '../../types';

describe('history and fingerprint utilities', () => {
  beforeEach(() => {
    clearMatchupHistory();
  });

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

  it('detects duplicate matchups accurately', () => {
    const history = new Set<string>();
    const fingerprint = generateTeamsFingerprint([teamA, teamB]);
    history.add(fingerprint);

    expect(isDuplicateMatchup([teamA, teamB], history)).toBe(true);

    const differentTeams: Team[] = [
      {
        id: 'team-1',
        name: 'Team 1',
        players: [
          { id: '1', name: 'Alice' },
          { id: '3', name: 'Charlie' },
        ],
      },
      {
        id: 'team-2',
        name: 'Team 2',
        players: [
          { id: '2', name: 'Bob' },
          { id: '4', name: 'David' },
        ],
      },
    ];

    expect(isDuplicateMatchup(differentTeams, history)).toBe(false);
  });

  it('saves and retrieves matchups from history', () => {
    expect(getPreviousMatchups().size).toBe(0);

    saveMatchup([teamA, teamB]);

    const matchups = getPreviousMatchups();
    expect(matchups.size).toBe(1);
    expect(isDuplicateMatchup([teamA, teamB], matchups)).toBe(true);
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
});
