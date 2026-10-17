import { describe, it, expect } from 'vitest';
import {
  getAvailableFinalistOptions,
  getDefaultFinalistsCount,
  isPlayoffMatch,
  resolvePlayoffTeams,
  generatePlayoffBracketNodes,
  generatePlayoffMatches,
  propagatePlayoffWinner,
} from '../playoffs';
import type { GroupStanding } from '../../types/standings';
import type { Team } from '../../types';
import type { MatchDetail } from '../../types/matches';

describe('playoffs utility engine', () => {
  describe('getAvailableFinalistOptions', () => {
    it('returns empty array when total teams < 2 or groupCount < 1', () => {
      expect(getAvailableFinalistOptions(1, 1)).toEqual([]);
      expect(getAvailableFinalistOptions(0, 4)).toEqual([]);
    });

    it('returns [2] for single group (G=1)', () => {
      expect(getAvailableFinalistOptions(1, 2)).toEqual([2]);
      expect(getAvailableFinalistOptions(1, 8)).toEqual([2]);
    });

    it('returns [2, 4] for G=2 when totalTeams >= 4, else [2]', () => {
      expect(getAvailableFinalistOptions(2, 4)).toEqual([2, 4]);
      expect(getAvailableFinalistOptions(2, 6)).toEqual([2, 4]);
      expect(getAvailableFinalistOptions(2, 3)).toEqual([2]);
    });

    it('returns [4] for G=3 when totalTeams >= 4', () => {
      expect(getAvailableFinalistOptions(3, 6)).toEqual([4]);
      expect(getAvailableFinalistOptions(3, 3)).toEqual([2]);
    });

    it('returns [4, 8] for G=4 when totalTeams >= 8, else [4]', () => {
      expect(getAvailableFinalistOptions(4, 8)).toEqual([4, 8]);
      expect(getAvailableFinalistOptions(4, 6)).toEqual([4]);
    });

    it('returns [8] for G>=5 when totalTeams >= 8, or [4] when totalTeams >= 4', () => {
      expect(getAvailableFinalistOptions(5, 10)).toEqual([8]);
      expect(getAvailableFinalistOptions(5, 6)).toEqual([4]);
      expect(getAvailableFinalistOptions(6, 3)).toEqual([2]);
    });
  });

  describe('getDefaultFinalistsCount', () => {
    it('resolves correct default based on group count and team cap', () => {
      expect(getDefaultFinalistsCount(1, 4)).toBe(2);
      expect(getDefaultFinalistsCount(2, 4)).toBe(4);
      expect(getDefaultFinalistsCount(3, 6)).toBe(4);
      expect(getDefaultFinalistsCount(4, 8)).toBe(8);
      expect(getDefaultFinalistsCount(4, 6)).toBe(4);
    });
  });

  describe('isPlayoffMatch', () => {
    it('correctly detects playoff match group names', () => {
      expect(isPlayoffMatch({ group_name: '1/4-финал' })).toBe(true);
      expect(isPlayoffMatch({ group_name: '1/4-финали' })).toBe(true);
      expect(isPlayoffMatch({ group_name: 'Полуфинал' })).toBe(true);
      expect(isPlayoffMatch({ group_name: 'полуфинал' })).toBe(true);
      expect(isPlayoffMatch({ group_name: 'Финал' })).toBe(true);
      expect(isPlayoffMatch({ group_name: 'ФИНАЛ' })).toBe(true);
      expect(isPlayoffMatch({ group_name: 'Група А' })).toBe(false);
      expect(isPlayoffMatch({ group_name: 'Група Б' })).toBe(false);
      expect(isPlayoffMatch({ group_name: null })).toBe(false);
      expect(isPlayoffMatch({})).toBe(false);
    });
  });

  describe('resolvePlayoffTeams & normalized ranking', () => {
    it('handles empty group standings safely', () => {
      const res = resolvePlayoffTeams([], 4);
      expect(res.qualifiers).toHaveLength(0);
      expect(res.pairings).toHaveLength(0);
    });

    it('Scenario A: 3 groups with K=4 resolves 3 direct winners and 1 normalized wildcard', () => {
      const mockStandings: GroupStanding[] = [
        {
          groupId: 'g-a',
          groupName: 'Група А',
          rows: [
            {
              rank: 1,
              teamId: 'team-a1',
              teamName: 'Отбор А1',
              played: 2,
              won: 2,
              lost: 0,
              gamesWon: 12,
              gamesLost: 4,
              gameDiff: 8,
              points: 2,
            },
            {
              rank: 2,
              teamId: 'team-a2',
              teamName: 'Отбор А2',
              played: 2,
              won: 2,
              lost: 0,
              gamesWon: 12,
              gamesLost: 6,
              gameDiff: 6,
              points: 2, // 1.0 pts/m
            },
          ],
        },
        {
          groupId: 'g-b',
          groupName: 'Група Б',
          rows: [
            {
              rank: 1,
              teamId: 'team-b1',
              teamName: 'Отбор Б1',
              played: 3,
              won: 3,
              lost: 0,
              gamesWon: 18,
              gamesLost: 6,
              gameDiff: 12,
              points: 3,
            },
            {
              rank: 2,
              teamId: 'team-b2',
              teamName: 'Отбор Б2',
              played: 3,
              won: 2,
              lost: 1,
              gamesWon: 15,
              gamesLost: 10,
              gameDiff: 5,
              points: 2, // 0.67 pts/m
            },
          ],
        },
        {
          groupId: 'g-c',
          groupName: 'Група В',
          rows: [
            {
              rank: 1,
              teamId: 'team-c1',
              teamName: 'Отбор В1',
              played: 3,
              won: 3,
              lost: 0,
              gamesWon: 18,
              gamesLost: 5,
              gameDiff: 13,
              points: 3,
            },
            {
              rank: 2,
              teamId: 'team-c2',
              teamName: 'Отбор В2',
              played: 3,
              won: 1,
              lost: 2,
              gamesWon: 10,
              gamesLost: 14,
              gameDiff: -4,
              points: 1, // 0.33 pts/m
            },
          ],
        },
      ];

      const res = resolvePlayoffTeams(mockStandings, 4);

      expect(res.qualifiers).toHaveLength(4);

      // Direct qualifiers: 3 group winners
      const direct = res.qualifiers.filter((q) => !q.isWildcard);
      expect(direct).toHaveLength(3);
      expect(direct.map((q) => q.teamId)).toEqual(
        expect.arrayContaining(['team-a1', 'team-b1', 'team-c1'])
      );

      // Wildcard qualifier: team-a2 with 1.0 pts/m beats team-b2 (0.67) and team-c2 (0.33)
      const wildcard = res.qualifiers.find((q) => q.isWildcard);
      expect(wildcard).toBeDefined();
      expect(wildcard?.teamId).toBe('team-a2');
      expect(wildcard?.seed).toBe(4);

      // Pairings check: SF1 has Seed 1 vs Seed 4, SF2 has Seed 2 vs Seed 3
      expect(res.pairings).toHaveLength(2);
      expect(res.pairings[0].stage).toBe('sf');
      expect(res.pairings[0].team1.seed).toBe(1);
      expect(res.pairings[0].team2.seed).toBe(4);
      expect(res.pairings[1].team1.seed).toBe(2);
      expect(res.pairings[1].team2.seed).toBe(3);
    });

    it('resolves Bulgarian alphabetical tie-breaker deterministically when all normalized stats are identical', () => {
      const mockStandings: GroupStanding[] = [
        {
          groupId: 'g-a',
          groupName: 'Група А',
          rows: [
            {
              rank: 1,
              teamId: 'team-a',
              teamName: 'Отбор Лидер',
              played: 1,
              won: 1,
              lost: 0,
              gamesWon: 6,
              gamesLost: 2,
              gameDiff: 4,
              points: 1,
            },
            {
              rank: 2,
              teamId: 'team-boris',
              teamName: 'Борис',
              played: 2,
              won: 1,
              lost: 1,
              gamesWon: 8,
              gamesLost: 8,
              gameDiff: 0,
              points: 1,
            },
          ],
        },
        {
          groupId: 'g-b',
          groupName: 'Група Б',
          rows: [
            {
              rank: 1,
              teamId: 'team-b',
              teamName: 'Отбор Първи',
              played: 1,
              won: 1,
              lost: 0,
              gamesWon: 6,
              gamesLost: 2,
              gameDiff: 4,
              points: 1,
            },
            {
              rank: 2,
              teamId: 'team-ana',
              teamName: 'Ана',
              played: 2,
              won: 1,
              lost: 1,
              gamesWon: 8,
              gamesLost: 8,
              gameDiff: 0,
              points: 1,
            },
          ],
        },
        {
          groupId: 'g-c',
          groupName: 'Група В',
          rows: [
            {
              rank: 1,
              teamId: 'team-c',
              teamName: 'Отбор Втори',
              played: 1,
              won: 1,
              lost: 0,
              gamesWon: 6,
              gamesLost: 2,
              gameDiff: 4,
              points: 1,
            },
          ],
        },
      ];

      const res = resolvePlayoffTeams(mockStandings, 4);
      const wildcard = res.qualifiers.find((q) => q.isWildcard);
      expect(wildcard?.teamName).toBe('Ана');
    });

    it('handles under-allocation K < G: pools Rank 1 teams as candidates', () => {
      const mockStandings: GroupStanding[] = [
        {
          groupId: 'g-a',
          groupName: 'Група А',
          rows: [
            {
              rank: 1,
              teamId: 't-1',
              teamName: 'Отбор 1',
              played: 2,
              won: 2,
              lost: 0,
              gamesWon: 12,
              gamesLost: 2,
              gameDiff: 10,
              points: 2,
            },
          ],
        },
        {
          groupId: 'g-b',
          groupName: 'Група Б',
          rows: [
            {
              rank: 1,
              teamId: 't-2',
              teamName: 'Отбор 2',
              played: 2,
              won: 1,
              lost: 1,
              gamesWon: 8,
              gamesLost: 8,
              gameDiff: 0,
              points: 1,
            },
          ],
        },
        {
          groupId: 'g-c',
          groupName: 'Група В',
          rows: [
            {
              rank: 1,
              teamId: 't-3',
              teamName: 'Отбор 3',
              played: 2,
              won: 2,
              lost: 0,
              gamesWon: 12,
              gamesLost: 4,
              gameDiff: 8,
              points: 2,
            },
          ],
        },
      ];

      // K=2, G=3
      const res = resolvePlayoffTeams(mockStandings, 2);
      expect(res.qualifiers).toHaveLength(2);
      expect(res.qualifiers[0].teamId).toBe('t-1');
      expect(res.qualifiers[1].teamId).toBe('t-3');
      expect(res.pairings).toHaveLength(1);
      expect(res.pairings[0].stage).toBe('final');
      expect(res.pairings[0].team1.seed).toBe(1);
      expect(res.pairings[0].team2.seed).toBe(2);
    });
  });

  describe('generatePlayoffBracketNodes & generatePlayoffMatches', () => {
    it('generates 8-team knockout bracket tree and standard pairings (Scenario B)', () => {
      const dummyQualifiers = Array.from({ length: 8 }, (_, i) => ({
        teamId: `t-${i + 1}`,
        teamName: `Отбор ${i + 1}`,
        seed: i + 1,
        isWildcard: i >= 4,
        groupOrigin: 'Група А',
        rankInGroup: (i % 2) + 1,
        played: 2,
        pointsPerMatch: 1,
        gameDiffPerMatch: 1,
        gamesWonPerMatch: 6,
      }));

      const dummyTeams: Team[] = dummyQualifiers.map((q) => ({
        id: q.teamId,
        name: q.teamName,
        players: [{ id: `p-${q.seed}`, name: `Играч ${q.seed}` }],
      }));

      const { matches, tree } = generatePlayoffMatches({
        tournamentId: 'tourn-1',
        format: 'singles',
        qualifiers: dummyQualifiers,
        teams: dummyTeams,
        finalistsCount: 8,
      });

      expect(tree.finalistsCount).toBe(8);
      expect(tree.nodes).toHaveLength(7);
      expect(matches).toHaveLength(7);

      // Check QF round 1 matches
      const qfNodes = tree.nodes.filter((n) => n.stage === 'qf');
      expect(qfNodes).toHaveLength(4);
      expect(qfNodes[0].nextMatchNodeId).toBe('sf-1');
      expect(qfNodes[0].nextMatchSlot).toBe('team_1');
      expect(qfNodes[1].nextMatchNodeId).toBe('sf-1');
      expect(qfNodes[1].nextMatchSlot).toBe('team_2');

      expect(qfNodes[2].nextMatchNodeId).toBe('sf-2');
      expect(qfNodes[2].nextMatchSlot).toBe('team_1');
      expect(qfNodes[3].nextMatchNodeId).toBe('sf-2');
      expect(qfNodes[3].nextMatchSlot).toBe('team_2');

      // Check QF pairings
      expect(matches[0].team1.name).toBe('Отбор 1');
      expect(matches[0].team2.name).toBe('Отбор 8');
      expect(matches[1].team1.name).toBe('Отбор 4');
      expect(matches[1].team2.name).toBe('Отбор 5');
      expect(matches[2].team1.name).toBe('Отбор 2');
      expect(matches[2].team2.name).toBe('Отбор 7');
      expect(matches[3].team1.name).toBe('Отбор 3');
      expect(matches[3].team2.name).toBe('Отбор 6');

      // Check downstream placeholders
      const sf1Match = matches[4];
      expect(sf1Match.team1.name).toBe('Победител от 1/4-финал 1');
      expect(sf1Match.team2.name).toBe('Победител от 1/4-финал 2');

      const finalMatch = matches[6];
      expect(finalMatch.team1.name).toBe('Победител от Полуфинал 1');
      expect(finalMatch.team2.name).toBe('Победител от Полуфинал 2');
    });

    it('generates 4-team knockout tree with 3 matches (2 SFs, 1 Final)', () => {
      const nodes = generatePlayoffBracketNodes([], 4);
      expect(nodes).toHaveLength(3);
      expect(nodes[0].stage).toBe('sf');
      expect(nodes[1].stage).toBe('sf');
      expect(nodes[2].stage).toBe('final');
      expect(nodes[0].nextMatchNodeId).toBe('final');
      expect(nodes[1].nextMatchNodeId).toBe('final');
    });

    it('generates 2-team final with 1 match', () => {
      const nodes = generatePlayoffBracketNodes([], 2);
      expect(nodes).toHaveLength(1);
      expect(nodes[0].stage).toBe('final');
      expect(nodes[0].nextMatchNodeId).toBeNull();
    });
  });

  describe('propagatePlayoffWinner & reversal (Scenario C)', () => {
    it('propagates winner name and players from QF1 to SF1 team_1 slot', () => {
      const qf1MatchId = 'match-qf-1';
      const sf1MatchId = 'match-sf-1';

      const tree = {
        finalistsCount: 8 as const,
        generatedAt: '2026-04-18T10:00:00Z',
        nodes: [
          {
            nodeId: 'qf-1',
            matchId: qf1MatchId,
            stage: 'qf' as const,
            stageLabel: '1/4-финал',
            round: 1,
            matchIndex: 0,
            nextMatchNodeId: 'sf-1',
            nextMatchSlot: 'team_1' as const,
          },
          {
            nodeId: 'sf-1',
            matchId: sf1MatchId,
            stage: 'sf' as const,
            stageLabel: 'Полуфинал',
            round: 2,
            matchIndex: 0,
            nextMatchNodeId: 'final',
            nextMatchSlot: 'team_1' as const,
          },
        ],
      };

      const completedQf1: MatchDetail = {
        id: qf1MatchId,
        team_1_score: 6,
        team_2_score: 4,
        team_1_name: 'Отбор Алфа',
        team_2_name: 'Отбор Омега',
        group_name: '1/4-финал',
        round: 1,
        match_format: 'singles',
        played_at: '2026-04-18T12:00:00Z',
        created_at: '2026-04-18T12:00:00Z',
        updated_at: '2026-04-18T12:00:00Z',
        match_players: [
          {
            id: 'mp-1',
            match_id: qf1MatchId,
            player_id: 'p-1',
            team_side: 'team_1',
            rating_before: 1200,
            rating_after: 1215,
            guest_name: null,
          },
        ],
      };

      const existingSf1: MatchDetail = {
        id: sf1MatchId,
        team_1_score: null,
        team_2_score: null,
        team_1_name: 'Победител от 1/4-финал 1',
        team_2_name: 'Победител от 1/4-финал 2',
        group_name: 'Полуфинал',
        round: 2,
        match_format: 'singles',
        played_at: '2026-04-18T14:00:00Z',
        created_at: '2026-04-18T10:00:00Z',
        updated_at: '2026-04-18T10:00:00Z',
        match_players: [],
      };

      const result = propagatePlayoffWinner({
        completedMatch: completedQf1,
        allMatches: [completedQf1, existingSf1],
        tree,
      });

      expect(result).not.toBeNull();
      expect(result?.matchId).toBe(sf1MatchId);
      expect(result?.updatedMatch.team_1_name).toBe('Отбор Алфа');
      expect(result?.updatedMatch.team_1_players).toEqual([
        { player_id: 'p-1', guest_name: undefined },
      ]);
      expect(result?.updatedMatch.team_2_name).toBe('Победител от 1/4-финал 2');

      // Reversal: when score is reset to null
      const resetQf1: MatchDetail = {
        ...completedQf1,
        team_1_score: null,
        team_2_score: null,
      };

      const revertResult = propagatePlayoffWinner({
        completedMatch: resetQf1,
        allMatches: [resetQf1, existingSf1],
        tree,
      });

      expect(revertResult).not.toBeNull();
      expect(revertResult?.updatedMatch.team_1_name).toBe('Победител от 1/4-финал 1');
      expect(revertResult?.updatedMatch.team_1_players).toEqual([]);
    });

    it('returns null when match has no next downstream match (Final completed)', () => {
      const finalMatchId = 'match-final';
      const tree = {
        finalistsCount: 2 as const,
        generatedAt: '2026-04-18T10:00:00Z',
        nodes: [
          {
            nodeId: 'final',
            matchId: finalMatchId,
            stage: 'final' as const,
            stageLabel: 'Финал',
            round: 1,
            matchIndex: 0,
            nextMatchNodeId: null,
            nextMatchSlot: null,
          },
        ],
      };

      const finalMatch: MatchDetail = {
        id: finalMatchId,
        team_1_score: 6,
        team_2_score: 3,
        team_1_name: 'Шампионски Отбор',
        team_2_name: 'Подгласник',
        group_name: 'Финал',
        round: 1,
        match_format: 'singles',
        played_at: '2026-04-18T15:00:00Z',
        created_at: '2026-04-18T10:00:00Z',
        updated_at: '2026-04-18T15:00:00Z',
        match_players: [],
      };

      const result = propagatePlayoffWinner({
        completedMatch: finalMatch,
        allMatches: [finalMatch],
        tree,
      });

      expect(result).toBeNull();
    });
  });
});
