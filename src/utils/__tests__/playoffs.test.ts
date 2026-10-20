import { describe, it, expect } from 'vitest';
import {
  getAvailableFinalistOptions,
  getDefaultFinalistsCount,
  isPlayoffMatch,
  resolvePlayoffTeams,
  generatePlayoffBracketNodes,
  generatePlayoffMatches,
  propagatePlayoffWinner,
  extractTournamentTeams,
  buildPlayoffPairings,
} from '../playoffs';
import type { GroupStanding } from '../../types/standings';
import type { Team } from '../../types';
import type { MatchDetail } from '../../types/matches';
import type { PlayoffQualifier } from '../../types/playoffs';

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

    it('PO-PROP-01: propagatePlayoffWinner carries player rosters into downstream updatedMatch', () => {
      const qf1MatchId = 'match-qf-1';
      const sf1MatchId = 'match-sf-1';

      const tree = {
        finalistsCount: 4 as const,
        generatedAt: '2026-04-18T10:00:00Z',
        nodes: [
          {
            nodeId: 'sf-1',
            matchId: sf1MatchId,
            stage: 'sf' as const,
            stageLabel: 'Полуфинал',
            round: 1,
            matchIndex: 0,
            nextMatchNodeId: 'final',
            nextMatchSlot: 'team_1' as const,
          },
        ],
      };

      const completedMatch: MatchDetail = {
        id: qf1MatchId,
        team_1_score: 6,
        team_2_score: 2,
        team_1_name: 'Отбор Титан',
        team_2_name: 'Отбор Олимп',
        group_name: '1/4-финал',
        round: 1,
        match_format: 'doubles',
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
            players: { id: 'p-1', name: 'Иван' },
          },
          {
            id: 'mp-2',
            match_id: qf1MatchId,
            player_id: 'p-2',
            team_side: 'team_1',
            rating_before: 1200,
            rating_after: 1215,
            guest_name: null,
            players: { id: 'p-2', name: 'Петър' },
          },
        ],
      };

      const downstreamMatch: MatchDetail = {
        id: sf1MatchId,
        team_1_score: null,
        team_2_score: null,
        team_1_name: 'Победител от 1/4-финал 1',
        team_2_name: 'Победител от 1/4-финал 2',
        group_name: 'Полуфинал',
        round: 2,
        match_format: 'doubles',
        played_at: '2026-04-18T14:00:00Z',
        created_at: '2026-04-18T10:00:00Z',
        updated_at: '2026-04-18T10:00:00Z',
        match_players: [],
      };

      const currentTree = {
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
          ...tree.nodes,
        ],
      };

      const result = propagatePlayoffWinner({
        completedMatch,
        allMatches: [completedMatch, downstreamMatch],
        tree: currentTree,
      });

      expect(result).not.toBeNull();
      expect(result?.updatedMatch.team_1_name).toBe('Отбор Титан');
      expect(result?.updatedMatch.team_1_players).toHaveLength(2);
      expect(result?.updatedMatch.team_1_players).toEqual([
        { player_id: 'p-1', guest_name: undefined },
        { player_id: 'p-2', guest_name: undefined },
      ]);
    });
  });

  describe('extractTournamentTeams & playoff player propagation', () => {
    it('PO-EXT-01: extractTournamentTeams recovers full team objects from groupMatches when draftTeams is null', () => {
      const groupMatches: MatchDetail[] = [
        {
          id: 'm-g-1',
          match_format: 'doubles',
          team_1_score: 6,
          team_2_score: 4,
          played_at: '2026-04-18T10:00:00Z',
          team_1_name: 'Отбор Алфа',
          team_2_name: 'Отбор Бета',
          group_name: 'Група А',
          round: 1,
          tournament_id: 't-1',
          created_at: '2026-04-18T10:00:00Z',
          updated_at: '2026-04-18T10:00:00Z',
          match_players: [
            {
              id: 'mp-1',
              match_id: 'm-g-1',
              player_id: 'p-1',
              team_side: 'team_1',
              rating_before: 1200,
              rating_after: 1215,
              guest_name: null,
              players: { id: 'p-1', name: 'Георги' },
            },
            {
              id: 'mp-2',
              match_id: 'm-g-1',
              player_id: null,
              team_side: 'team_2',
              rating_before: null,
              rating_after: null,
              guest_name: 'Николай (Гост)',
              players: null,
            },
          ],
        },
      ];

      const teams = extractTournamentTeams(groupMatches, null);

      expect(teams).toHaveLength(2);
      const teamAlpha = teams.find((t) => t.name === 'Отбор Алфа');
      const teamBeta = teams.find((t) => t.name === 'Отбор Бета');

      expect(teamAlpha).toBeDefined();
      expect(teamAlpha?.players).toEqual([
        { id: 'p-1', name: 'Георги', is_guest: false },
      ]);

      expect(teamBeta).toBeDefined();
      expect(teamBeta?.players).toEqual([
        { id: '', name: 'Николай (Гост)', is_guest: true },
      ]);
    });

    it('PO-EXT-02: extractTournamentTeams preserves draftTeams and supplements missing matches', () => {
      const draftTeams: Team[] = [
        {
          id: 't-draft-1',
          name: 'Отбор Чернова',
          players: [{ id: 'p-draft', name: 'Александър' }],
        },
      ];

      const matches: MatchDetail[] = [
        {
          id: 'm-g-2',
          match_format: 'singles',
          team_1_score: 6,
          team_2_score: 1,
          played_at: '2026-04-18T11:00:00Z',
          team_1_name: 'Отбор Чернова',
          team_2_name: 'Отбор Мач',
          group_name: 'Група Б',
          round: 1,
          tournament_id: 't-1',
          created_at: '2026-04-18T11:00:00Z',
          updated_at: '2026-04-18T11:00:00Z',
          match_players: [
            {
              id: 'mp-3',
              match_id: 'm-g-2',
              player_id: 'p-new',
              team_side: 'team_2',
              rating_before: 1200,
              rating_after: 1190,
              guest_name: null,
              players: { id: 'p-new', name: 'Мартин' },
            },
          ],
        },
      ];

      const combined = extractTournamentTeams(matches, draftTeams);

      expect(combined).toHaveLength(2);
      const draftMatch = combined.find((t) => t.name === 'Отбор Чернова');
      const matchOnly = combined.find((t) => t.name === 'Отбор Мач');

      expect(draftMatch?.players[0].name).toBe('Александър');
      expect(matchOnly?.players[0].name).toBe('Мартин');
    });

    it('PO-GEN-01: generatePlayoffMatches includes players in team objects', () => {
      const qualifiers = [
        {
          teamId: 't-1',
          teamName: 'Отбор 1',
          seed: 1,
          isWildcard: false,
          groupOrigin: 'Група А',
          rankInGroup: 1,
          played: 2,
          pointsPerMatch: 1,
          gameDiffPerMatch: 2,
          gamesWonPerMatch: 6,
        },
        {
          teamId: 't-2',
          teamName: 'Отбор 2',
          seed: 2,
          isWildcard: false,
          groupOrigin: 'Група Б',
          rankInGroup: 1,
          played: 2,
          pointsPerMatch: 1,
          gameDiffPerMatch: 1,
          gamesWonPerMatch: 6,
        },
        {
          teamId: 't-3',
          teamName: 'Отбор 3',
          seed: 3,
          isWildcard: false,
          groupOrigin: 'Група А',
          rankInGroup: 2,
          played: 2,
          pointsPerMatch: 0.5,
          gameDiffPerMatch: 0,
          gamesWonPerMatch: 4,
        },
        {
          teamId: 't-4',
          teamName: 'Отбор 4',
          seed: 4,
          isWildcard: false,
          groupOrigin: 'Група Б',
          rankInGroup: 2,
          played: 2,
          pointsPerMatch: 0.5,
          gameDiffPerMatch: -1,
          gamesWonPerMatch: 3,
        },
      ];

      const teams: Team[] = qualifiers.map((q) => ({
        id: q.teamId,
        name: q.teamName,
        players: [{ id: `p-${q.seed}`, name: `Играч ${q.seed}` }],
      }));

      const { matches } = generatePlayoffMatches({
        tournamentId: 't-tourn',
        format: 'singles',
        qualifiers,
        teams,
        finalistsCount: 4,
      });

      // SF1: Seed 1 vs Seed 4
      const sf1 = matches.find((m) => m.team1.name === 'Отбор 1');
      expect(sf1).toBeDefined();
      expect(sf1?.team1.players.length).toBeGreaterThan(0);
      expect(sf1?.team2.players.length).toBeGreaterThan(0);
      expect(sf1?.team1.players[0].name).toBe('Играч 1');
      expect(sf1?.team2.players[0].name).toBe('Играч 4');

      // SF2: Seed 2 vs Seed 3
      const sf2 = matches.find((m) => m.team1.name === 'Отбор 2');
      expect(sf2).toBeDefined();
      expect(sf2?.team1.players.length).toBeGreaterThan(0);
      expect(sf2?.team2.players.length).toBeGreaterThan(0);
      expect(sf2?.team1.players[0].name).toBe('Играч 2');
      expect(sf2?.team2.players[0].name).toBe('Играч 3');
    });
  });

  describe('cross-group playoff bracket pairings & blueprints', () => {
    it('Blueprint 1: prevents same-group rematches when G=2, K=4 with inverted runner-up rankings (User Defect)', () => {
      // Group A: Team 1 (A1) and Team 5 (A2)
      // Group B: Team 3 (B1) and Team 2 (B2)
      // Group B runner-up (Team 2) outperforms Group A runner-up (Team 5)
      // Resulting in Seeds: 1=Team 1 (A1), 2=Team 3 (B1), 3=Team 2 (B2), 4=Team 5 (A2)
      const mockStandings: GroupStanding[] = [
        {
          groupId: 'g-a',
          groupName: 'Група А',
          rows: [
            {
              rank: 1,
              teamId: 'team-1',
              teamName: 'Отбор 1',
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
              teamId: 'team-5',
              teamName: 'Отбор 5',
              played: 2,
              won: 1,
              lost: 1,
              gamesWon: 8,
              gamesLost: 6,
              gameDiff: 2,
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
              teamId: 'team-3',
              teamName: 'Отбор 3',
              played: 2,
              won: 2,
              lost: 0,
              gamesWon: 12,
              gamesLost: 6,
              gameDiff: 6,
              points: 2,
            },
            {
              rank: 2,
              teamId: 'team-2',
              teamName: 'Отбор 2',
              played: 2,
              won: 1,
              lost: 1,
              gamesWon: 10,
              gamesLost: 6,
              gameDiff: 4,
              points: 1,
            },
          ],
        },
      ];

      const res = resolvePlayoffTeams(mockStandings, 4);

      expect(res.qualifiers).toHaveLength(4);
      expect(res.qualifiers[0].teamId).toBe('team-1'); // Seed 1: A1
      expect(res.qualifiers[1].teamId).toBe('team-3'); // Seed 2: B1
      expect(res.qualifiers[2].teamId).toBe('team-2'); // Seed 3: B2 (runner-up with +4 gd)
      expect(res.qualifiers[3].teamId).toBe('team-5'); // Seed 4: A2 (runner-up with +2 gd)

      expect(res.pairings).toHaveLength(2);

      const sf1 = res.pairings[0];
      const sf2 = res.pairings[1];

      expect(sf1.stage).toBe('sf');
      expect(sf1.matchIndex).toBe(0);
      expect(sf1.team1.teamId).toBe('team-1');
      expect(sf1.team2.teamId).toBe('team-2');
      expect(sf1.team1.groupOrigin).not.toBe(sf1.team2.groupOrigin);

      expect(sf2.stage).toBe('sf');
      expect(sf2.matchIndex).toBe(1);
      expect(sf2.team1.teamId).toBe('team-3');
      expect(sf2.team2.teamId).toBe('team-5');
      expect(sf2.team1.groupOrigin).not.toBe(sf2.team2.groupOrigin);

      // Verify same-group teams are in opposite semifinals (different bracket halves)
      expect(sf1.team1.groupOrigin).toBe('Група А');
      expect(sf1.team2.groupOrigin).toBe('Група Б');
      expect(sf2.team1.groupOrigin).toBe('Група Б');
      expect(sf2.team2.groupOrigin).toBe('Група А');

      // Verify higher seed is in team1
      expect(sf1.team1.seed).toBeLessThan(sf1.team2.seed);
      expect(sf2.team1.seed).toBeLessThan(sf2.team2.seed);
    });

    it('Blueprint 2: separates same-group teams into opposite bracket halves when G=4, K=8', () => {
      const qualifiers: PlayoffQualifier[] = [
        // 4 Group Winners: Seeds 1 to 4
        {
          teamId: 'team-a1',
          teamName: 'Отбор А1',
          seed: 1,
          isWildcard: false,
          groupOrigin: 'Група А',
          rankInGroup: 1,
          played: 3,
          pointsPerMatch: 1,
          gameDiffPerMatch: 3,
          gamesWonPerMatch: 6,
        },
        {
          teamId: 'team-b1',
          teamName: 'Отбор Б1',
          seed: 2,
          isWildcard: false,
          groupOrigin: 'Група Б',
          rankInGroup: 1,
          played: 3,
          pointsPerMatch: 1,
          gameDiffPerMatch: 2.5,
          gamesWonPerMatch: 6,
        },
        {
          teamId: 'team-c1',
          teamName: 'Отбор В1',
          seed: 3,
          isWildcard: false,
          groupOrigin: 'Група В',
          rankInGroup: 1,
          played: 3,
          pointsPerMatch: 1,
          gameDiffPerMatch: 2,
          gamesWonPerMatch: 6,
        },
        {
          teamId: 'team-d1',
          teamName: 'Отбор Г1',
          seed: 4,
          isWildcard: false,
          groupOrigin: 'Група Г',
          rankInGroup: 1,
          played: 3,
          pointsPerMatch: 1,
          gameDiffPerMatch: 1.5,
          gamesWonPerMatch: 6,
        },
        // 4 Runners-up: Seeds 5 to 8
        {
          teamId: 'team-a2',
          teamName: 'Отбор А2',
          seed: 5,
          isWildcard: false,
          groupOrigin: 'Група А',
          rankInGroup: 2,
          played: 3,
          pointsPerMatch: 0.67,
          gameDiffPerMatch: 1,
          gamesWonPerMatch: 4,
        },
        {
          teamId: 'team-b2',
          teamName: 'Отбор Б2',
          seed: 6,
          isWildcard: false,
          groupOrigin: 'Група Б',
          rankInGroup: 2,
          played: 3,
          pointsPerMatch: 0.67,
          gameDiffPerMatch: 0.8,
          gamesWonPerMatch: 4,
        },
        {
          teamId: 'team-c2',
          teamName: 'Отбор В2',
          seed: 7,
          isWildcard: false,
          groupOrigin: 'Група В',
          rankInGroup: 2,
          played: 3,
          pointsPerMatch: 0.67,
          gameDiffPerMatch: 0.5,
          gamesWonPerMatch: 4,
        },
        {
          teamId: 'team-d2',
          teamName: 'Отбор Г2',
          seed: 8,
          isWildcard: false,
          groupOrigin: 'Група Г',
          rankInGroup: 2,
          played: 3,
          pointsPerMatch: 0.67,
          gameDiffPerMatch: 0.2,
          gamesWonPerMatch: 4,
        },
      ];

      const pairings = buildPlayoffPairings(qualifiers, 8, 4);

      expect(pairings).toHaveLength(4);

      // QF1 (matchIndex 0): A1 vs B2
      expect(pairings[0].matchIndex).toBe(0);
      expect(pairings[0].team1.teamId).toBe('team-a1');
      expect(pairings[0].team2.teamId).toBe('team-b2');

      // QF2 (matchIndex 1): C1 vs D2
      expect(pairings[1].matchIndex).toBe(1);
      expect(pairings[1].team1.teamId).toBe('team-c1');
      expect(pairings[1].team2.teamId).toBe('team-d2');

      // QF3 (matchIndex 2): B1 vs A2
      expect(pairings[2].matchIndex).toBe(2);
      expect(pairings[2].team1.teamId).toBe('team-b1');
      expect(pairings[2].team2.teamId).toBe('team-a2');

      // QF4 (matchIndex 3): D1 vs C2
      expect(pairings[3].matchIndex).toBe(3);
      expect(pairings[3].team1.teamId).toBe('team-d1');
      expect(pairings[3].team2.teamId).toBe('team-c2');

      // Top Half: QF1 and QF2 (indices 0 and 1)
      const topHalfGroups = [
        pairings[0].team1.groupOrigin,
        pairings[0].team2.groupOrigin,
        pairings[1].team1.groupOrigin,
        pairings[1].team2.groupOrigin,
      ];
      // Bottom Half: QF3 and QF4 (indices 2 and 3)
      const bottomHalfGroups = [
        pairings[2].team1.groupOrigin,
        pairings[2].team2.groupOrigin,
        pairings[3].team1.groupOrigin,
        pairings[3].team2.groupOrigin,
      ];

      // Top Half contains exactly one team from each of the 4 groups
      expect(new Set(topHalfGroups).size).toBe(4);
      expect(new Set(bottomHalfGroups).size).toBe(4);

      // For every group, winner is in Top Half iff runner-up is in Bottom Half
      const groups = ['Група А', 'Група Б', 'Група В', 'Група Г'];
      for (const g of groups) {
        const inTop = topHalfGroups.filter((orig) => orig === g).length;
        const inBottom = bottomHalfGroups.filter((orig) => orig === g).length;
        expect(inTop).toBe(1);
        expect(inBottom).toBe(1);
      }

      // Verify higher seed is in team1 for all QFs
      for (const p of pairings) {
        expect(p.team1.seed).toBeLessThan(p.team2.seed);
      }
    });

    it('Blueprint 3: separates wildcard from Seed 1 group in G=3, K=4 (Branch A swap)', () => {
      const qualifiers: PlayoffQualifier[] = [
        {
          teamId: 'team-a1',
          teamName: 'Отбор А1',
          seed: 1,
          isWildcard: false,
          groupOrigin: 'Група А',
          rankInGroup: 1,
          played: 2,
          pointsPerMatch: 1,
          gameDiffPerMatch: 4,
          gamesWonPerMatch: 6,
        },
        {
          teamId: 'team-b1',
          teamName: 'Отбор Б1',
          seed: 2,
          isWildcard: false,
          groupOrigin: 'Група Б',
          rankInGroup: 1,
          played: 2,
          pointsPerMatch: 1,
          gameDiffPerMatch: 3,
          gamesWonPerMatch: 6,
        },
        {
          teamId: 'team-c1',
          teamName: 'Отбор В1',
          seed: 3,
          isWildcard: false,
          groupOrigin: 'Група В',
          rankInGroup: 1,
          played: 2,
          pointsPerMatch: 1,
          gameDiffPerMatch: 2,
          gamesWonPerMatch: 6,
        },
        {
          teamId: 'team-a2',
          teamName: 'Отбор А2',
          seed: 4,
          isWildcard: true,
          groupOrigin: 'Група А', // Wildcard from Seed 1 group!
          rankInGroup: 2,
          played: 2,
          pointsPerMatch: 0.5,
          gameDiffPerMatch: 1,
          gamesWonPerMatch: 4,
        },
      ];

      const pairings = buildPlayoffPairings(qualifiers, 4, 3);

      expect(pairings).toHaveLength(2);

      // SF1: W1 (A1) vs W3 (C1)
      expect(pairings[0].matchIndex).toBe(0);
      expect(pairings[0].team1.teamId).toBe('team-a1');
      expect(pairings[0].team2.teamId).toBe('team-c1');
      expect(pairings[0].team1.groupOrigin).not.toBe(pairings[0].team2.groupOrigin);

      // SF2: W2 (B1) vs WC (A2)
      expect(pairings[1].matchIndex).toBe(1);
      expect(pairings[1].team1.teamId).toBe('team-b1');
      expect(pairings[1].team2.teamId).toBe('team-a2');
      expect(pairings[1].team1.groupOrigin).not.toBe(pairings[1].team2.groupOrigin);

      // Team A1 and Team A2 must not play each other in semifinals
      expect(pairings[0].team2.teamId).not.toBe('team-a2');
      expect(pairings[1].team1.teamId).not.toBe('team-a1');

      // Higher seed in team1
      expect(pairings[0].team1.seed).toBeLessThan(pairings[0].team2.seed);
      expect(pairings[1].team1.seed).toBeLessThan(pairings[1].team2.seed);
    });

    it('Blueprint 4: handles wildcard from Seed 2 group in G=3, K=4 (Branch B standard)', () => {
      const qualifiers: PlayoffQualifier[] = [
        {
          teamId: 'team-a1',
          teamName: 'Отбор А1',
          seed: 1,
          isWildcard: false,
          groupOrigin: 'Група А',
          rankInGroup: 1,
          played: 2,
          pointsPerMatch: 1,
          gameDiffPerMatch: 4,
          gamesWonPerMatch: 6,
        },
        {
          teamId: 'team-b1',
          teamName: 'Отбор Б1',
          seed: 2,
          isWildcard: false,
          groupOrigin: 'Група Б',
          rankInGroup: 1,
          played: 2,
          pointsPerMatch: 1,
          gameDiffPerMatch: 3,
          gamesWonPerMatch: 6,
        },
        {
          teamId: 'team-c1',
          teamName: 'Отбор В1',
          seed: 3,
          isWildcard: false,
          groupOrigin: 'Група В',
          rankInGroup: 1,
          played: 2,
          pointsPerMatch: 1,
          gameDiffPerMatch: 2,
          gamesWonPerMatch: 6,
        },
        {
          teamId: 'team-b2',
          teamName: 'Отбор Б2',
          seed: 4,
          isWildcard: true,
          groupOrigin: 'Група Б', // Wildcard from Seed 2 group!
          rankInGroup: 2,
          played: 2,
          pointsPerMatch: 0.5,
          gameDiffPerMatch: 1,
          gamesWonPerMatch: 4,
        },
      ];

      const pairings = buildPlayoffPairings(qualifiers, 4, 3);

      expect(pairings).toHaveLength(2);

      // SF1: W1 (A1) vs WC (B2)
      expect(pairings[0].matchIndex).toBe(0);
      expect(pairings[0].team1.teamId).toBe('team-a1');
      expect(pairings[0].team2.teamId).toBe('team-b2');
      expect(pairings[0].team1.groupOrigin).not.toBe(pairings[0].team2.groupOrigin);

      // SF2: W2 (B1) vs W3 (C1)
      expect(pairings[1].matchIndex).toBe(1);
      expect(pairings[1].team1.teamId).toBe('team-b1');
      expect(pairings[1].team2.teamId).toBe('team-c1');
      expect(pairings[1].team1.groupOrigin).not.toBe(pairings[1].team2.groupOrigin);

      // Higher seed in team1
      expect(pairings[0].team1.seed).toBeLessThan(pairings[0].team2.seed);
      expect(pairings[1].team1.seed).toBeLessThan(pairings[1].team2.seed);
    });

    it('Blueprint 5: verifies SSOT synchronization between resolvePlayoffTeams and generatePlayoffMatches', () => {
      // Test K=4
      const standingsK4: GroupStanding[] = [
        {
          groupId: 'g-1',
          groupName: 'Група 1',
          rows: [
            {
              rank: 1,
              teamId: 't-g1-1',
              teamName: 'Отбор Г1-1',
              played: 2,
              won: 2,
              lost: 0,
              gamesWon: 12,
              gamesLost: 2,
              gameDiff: 10,
              points: 2,
            },
            {
              rank: 2,
              teamId: 't-g1-2',
              teamName: 'Отбор Г1-2',
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
          groupId: 'g-2',
          groupName: 'Група 2',
          rows: [
            {
              rank: 1,
              teamId: 't-g2-1',
              teamName: 'Отбор Г2-1',
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
              teamId: 't-g2-2',
              teamName: 'Отбор Г2-2',
              played: 2,
              won: 1,
              lost: 1,
              gamesWon: 9,
              gamesLost: 7,
              gameDiff: 2,
              points: 1,
            },
          ],
        },
      ];

      const resolutionK4 = resolvePlayoffTeams(standingsK4, 4);
      const teamsK4: Team[] = resolutionK4.qualifiers.map((q) => ({
        id: q.teamId,
        name: q.teamName,
        players: [{ id: `p-${q.teamId}`, name: `Играч ${q.teamName}` }],
      }));

      const { matches: matchesK4 } = generatePlayoffMatches({
        tournamentId: 'tourn-k4',
        format: 'singles',
        qualifiers: resolutionK4.qualifiers,
        teams: teamsK4,
        finalistsCount: 4,
        groupCount: standingsK4.length,
      });

      // Assert Round 1 matches in matchesK4 exactly match resolutionK4.pairings
      for (const pairing of resolutionK4.pairings) {
        const round1Match = matchesK4.find(
          (m) =>
            m.groupId === pairing.stage &&
            (m.team1.id === pairing.team1.teamId || m.team2.id === pairing.team2.teamId)
        );
        expect(round1Match).toBeDefined();
        expect(round1Match?.team1.id).toBe(pairing.team1.teamId);
        expect(round1Match?.team2.id).toBe(pairing.team2.teamId);
      }

      // Test K=8
      const standingsK8: GroupStanding[] = ['А', 'Б', 'В', 'Г'].map((letter, gIdx) => ({
        groupId: `g-${letter}`,
        groupName: `Група ${letter}`,
        rows: [
          {
            rank: 1,
            teamId: `t-${letter}1`,
            teamName: `Отбор ${letter}1`,
            played: 3,
            won: 3,
            lost: 0,
            gamesWon: 18,
            gamesLost: 6,
            gameDiff: 12 - gIdx,
            points: 3,
          },
          {
            rank: 2,
            teamId: `t-${letter}2`,
            teamName: `Отбор ${letter}2`,
            played: 3,
            won: 2,
            lost: 1,
            gamesWon: 14,
            gamesLost: 10,
            gameDiff: 4 - gIdx,
            points: 2,
          },
        ],
      }));

      const resolutionK8 = resolvePlayoffTeams(standingsK8, 8);
      const teamsK8: Team[] = resolutionK8.qualifiers.map((q) => ({
        id: q.teamId,
        name: q.teamName,
        players: [{ id: `p-${q.teamId}`, name: `Играч ${q.teamName}` }],
      }));

      const { matches: matchesK8 } = generatePlayoffMatches({
        tournamentId: 'tourn-k8',
        format: 'singles',
        qualifiers: resolutionK8.qualifiers,
        teams: teamsK8,
        finalistsCount: 8,
        groupCount: standingsK8.length,
      });

      for (const pairing of resolutionK8.pairings) {
        const round1Match = matchesK8.find(
          (m) => m.groupId === pairing.stage && m.team1.id === pairing.team1.teamId
        );
        expect(round1Match).toBeDefined();
        expect(round1Match?.team1.id).toBe(pairing.team1.teamId);
        expect(round1Match?.team2.id).toBe(pairing.team2.teamId);
      }
    });
  });
});
