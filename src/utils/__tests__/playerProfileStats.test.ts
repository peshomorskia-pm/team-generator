import { describe, it, expect } from 'vitest';
import {
  calculatePlayerProfileData,
  computePlayerProfileStats,
  formatPerspectiveScore,
  isMatchCompletedAndValid,
  resolveMatchStage,
  sortPartners,
  sortRivals,
  PlayerPartnerStat,
  PlayerRivalStat,
} from '../playerProfileStats';
import type { MatchDetail } from '../../types/matches';
import type { Tournament } from '../../types/tournament';

function createMockMatch(overrides?: Partial<MatchDetail>): MatchDetail {
  return {
    id: 'm-default',
    match_format: 'singles',
    team_1_score: 6,
    team_2_score: 4,
    played_at: '2026-02-01T10:00:00Z',
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-01T10:00:00Z',
    match_players: [],
    ...overrides,
  };
}

function createMockTournament(overrides?: Partial<Tournament>): Tournament {
  return {
    id: 't-1',
    title: 'Sofia Open',
    date: '2026-02-01',
    format: 'singles',
    status: 'completed',
    winner_team_name: null,
    notes: null,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    ...overrides,
  };
}

describe('playerProfileStats engine', () => {
  const targetId = 'p-target';

  describe('1. Empty / Inactive State', () => {
    it('returns zeroed profile with 50.0% win rate neutral prior when player has 0 matches', () => {
      const result = calculatePlayerProfileData([], targetId);

      expect(result.playerId).toBe(targetId);
      expect(result.summary.all).toEqual({
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 50.0,
        gamesWon: 0,
        gamesLost: 0,
        gameDifference: 0,
        form: [],
      });
      expect(result.summary.doubles).toEqual({
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 50.0,
        gamesWon: 0,
        gamesLost: 0,
        gameDifference: 0,
        form: [],
      });
      expect(result.summary.singles).toEqual({
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 50.0,
        gamesWon: 0,
        gamesLost: 0,
        gameDifference: 0,
        form: [],
      });
      expect(result.timeline).toEqual([]);
      expect(result.partners).toEqual([]);
      expect(result.rivals).toEqual([]);
      expect(result.titles).toEqual([]);
      expect(result.favoritePartner).toBeNull();
      expect(result.topRival).toBeNull();
      expect(result.mainRival).toBeNull();
      expect(result.titlesCount).toBe(0);
    });
  });

  describe('2. Filtering Incomplete & Foreign Matches', () => {
    it('ignores incomplete matches with null scores and missing or empty sets', () => {
      const matchNullScores = createMockMatch({
        id: 'm-null',
        team_1_score: null,
        team_2_score: null,
        sets: null,
        match_players: [
          { id: 'mp-1', match_id: 'm-null', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-2', match_id: 'm-null', player_id: 'p-opp', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null },
        ],
      });

      const matchEmptySetsNullScores = createMockMatch({
        id: 'm-empty-sets',
        team_1_score: null,
        team_2_score: null,
        sets: [],
        match_players: [
          { id: 'mp-3', match_id: 'm-empty-sets', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
        ],
      });

      expect(isMatchCompletedAndValid(matchNullScores)).toBe(false);
      expect(isMatchCompletedAndValid(matchEmptySetsNullScores)).toBe(false);

      const result = calculatePlayerProfileData([matchNullScores, matchEmptySetsNullScores], targetId);
      expect(result.summary.all.matchesPlayed).toBe(0);
      expect(result.timeline).toHaveLength(0);
    });

    it('ignores matches where target player does not appear in match_players', () => {
      const foreignMatch = createMockMatch({
        id: 'm-foreign',
        team_1_score: 6,
        team_2_score: 2,
        match_players: [
          { id: 'mp-1', match_id: 'm-foreign', player_id: 'other-1', team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-2', match_id: 'm-foreign', player_id: 'other-2', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null },
        ],
      });

      const result = calculatePlayerProfileData([foreignMatch], targetId);
      expect(result.summary.all.matchesPlayed).toBe(0);
      expect(result.timeline).toHaveLength(0);
    });
  });

  describe('3. Singles Aggregations', () => {
    it('correctly accumulates wins, losses, games won/lost, net difference, and form', () => {
      const match1 = createMockMatch({
        id: 'm-1',
        match_format: 'singles',
        played_at: '2026-02-01T10:00:00Z',
        team_1_score: 6,
        team_2_score: 3,
        match_players: [
          { id: 'mp-1', match_id: 'm-1', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-2', match_id: 'm-1', player_id: 'p-opp', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null, players: { id: 'p-opp', name: 'Опонент' } },
        ],
      });

      const match2 = createMockMatch({
        id: 'm-2',
        match_format: 'singles',
        played_at: '2026-02-02T10:00:00Z',
        team_1_score: 4,
        team_2_score: 6,
        match_players: [
          { id: 'mp-3', match_id: 'm-2', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-4', match_id: 'm-2', player_id: 'p-opp', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null, players: { id: 'p-opp', name: 'Опонент' } },
        ],
      });

      const result = calculatePlayerProfileData([match1, match2], targetId);

      expect(result.summary.singles).toEqual({
        matchesPlayed: 2,
        wins: 1,
        losses: 1,
        winRate: 50.0,
        gamesWon: 10,
        gamesLost: 9,
        gameDifference: 1,
        form: ['W', 'L'],
      });
      expect(result.summary.all).toEqual(result.summary.singles);
      expect(result.summary.doubles.matchesPlayed).toBe(0);
      expect(result.summary.doubles.winRate).toBe(50.0);
    });

    it('creates singles timeline items with partner undefined and exactly one opponent', () => {
      const match = createMockMatch({
        id: 'm-singles-1',
        match_format: 'singles',
        team_1_score: 6,
        team_2_score: 2,
        match_players: [
          { id: 'mp-1', match_id: 'm-singles-1', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-2', match_id: 'm-singles-1', player_id: 'p-opp', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null, players: { id: 'p-opp', name: 'Опонент' } },
        ],
      });

      const result = calculatePlayerProfileData([match], targetId);
      expect(result.timeline).toHaveLength(1);
      const item = result.timeline[0];
      expect(item.partner).toBeUndefined();
      expect(item.opponents).toEqual([{ id: 'p-opp', name: 'Опонент' }]);
      expect(item.format).toBe('singles');
      expect(item.isWinner).toBe(true);
    });
  });

  describe('4. Doubles Aggregations', () => {
    it('correctly identifies partner and opponents, populates doubles & all, leaves singles zeroed', () => {
      const doublesMatch = createMockMatch({
        id: 'm-doubles-1',
        match_format: 'doubles',
        team_1_score: 7,
        team_2_score: 5,
        match_players: [
          { id: 'mp-1', match_id: 'm-doubles-1', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-2', match_id: 'm-doubles-1', player_id: 'p-teammate', team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null, players: { id: 'p-teammate', name: 'Партньор' } },
          { id: 'mp-3', match_id: 'm-doubles-1', player_id: 'p-rival-1', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null, players: { id: 'p-rival-1', name: 'Съперник 1' } },
          { id: 'mp-4', match_id: 'm-doubles-1', player_id: 'p-rival-2', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null, players: { id: 'p-rival-2', name: 'Съперник 2' } },
        ],
      });

      const result = calculatePlayerProfileData([doublesMatch], targetId);

      expect(result.summary.doubles.matchesPlayed).toBe(1);
      expect(result.summary.doubles.wins).toBe(1);
      expect(result.summary.doubles.winRate).toBe(100.0);
      expect(result.summary.doubles.gameDifference).toBe(2);

      expect(result.summary.all).toEqual(result.summary.doubles);
      expect(result.summary.singles).toEqual({
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 50.0,
        gamesWon: 0,
        gamesLost: 0,
        gameDifference: 0,
        form: [],
      });

      expect(result.timeline).toHaveLength(1);
      expect(result.timeline[0].partner).toEqual({ id: 'p-teammate', name: 'Партньор' });
      expect(result.timeline[0].opponents).toHaveLength(2);
      expect(result.timeline[0].opponents).toEqual([
        { id: 'p-rival-1', name: 'Съперник 1' },
        { id: 'p-rival-2', name: 'Съперник 2' },
      ]);
    });
  });

  describe('5. Perspective-Aware Score Formatting', () => {
    it('formats multi-set score when player is team_1', () => {
      const match = createMockMatch({
        sets: [
          { set_number: 1, team_1_score: 6, team_2_score: 3 },
          { set_number: 2, team_1_score: 4, team_2_score: 6 },
          { set_number: 3, team_1_score: 10, team_2_score: 7 },
        ],
      });

      expect(formatPerspectiveScore(match, 'team_1')).toBe('6:3, 4:6, 10:7');
    });

    it('formats multi-set score when player is team_2 with player score first', () => {
      const match = createMockMatch({
        sets: [
          { set_number: 1, team_1_score: 6, team_2_score: 3 },
          { set_number: 2, team_1_score: 4, team_2_score: 6 },
          { set_number: 3, team_1_score: 10, team_2_score: 7 },
        ],
      });

      expect(formatPerspectiveScore(match, 'team_2')).toBe('3:6, 6:4, 7:10');
    });

    it('formats casual single-set score with player score on left', () => {
      const match = createMockMatch({
        team_1_score: 6,
        team_2_score: 4,
        sets: null,
      });

      expect(formatPerspectiveScore(match, 'team_1')).toBe('6:4');
      expect(formatPerspectiveScore(match, 'team_2')).toBe('4:6');
    });
  });

  describe('6. Recent Form Extraction', () => {
    it('extracts strictly the last 5 outcomes in chronological order (oldest to newest) when 8 matches exist', () => {
      // 8 matches: W, L, W, W, L, W, L, W
      const matchOutcomes = [true, false, true, true, false, true, false, true];
      const matches: MatchDetail[] = matchOutcomes.map((won, idx) =>
        createMockMatch({
          id: `m-form-${idx + 1}`,
          played_at: `2026-01-${String(idx + 1).padStart(2, '0')}T10:00:00Z`,
          team_1_score: won ? 6 : 4,
          team_2_score: won ? 4 : 6,
          match_players: [
            { id: `mp-${idx}-1`, match_id: `m-form-${idx + 1}`, player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
            { id: `mp-${idx}-2`, match_id: `m-form-${idx + 1}`, player_id: 'p-opp', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null },
          ],
        })
      );

      const result = calculatePlayerProfileData(matches, targetId);
      // Last 5 of [W, L, W, W, L, W, L, W] are indices 3, 4, 5, 6, 7 => ['W', 'L', 'W', 'L', 'W']
      expect(result.summary.all.form).toEqual(['W', 'L', 'W', 'L', 'W']);
    });

    it('returns exact match count when player has fewer than 5 matches', () => {
      const matchOutcomes = [true, false, true];
      const matches: MatchDetail[] = matchOutcomes.map((won, idx) =>
        createMockMatch({
          id: `m-form-short-${idx + 1}`,
          played_at: `2026-01-${String(idx + 1).padStart(2, '0')}T10:00:00Z`,
          team_1_score: won ? 6 : 4,
          team_2_score: won ? 4 : 6,
          match_players: [
            { id: `mp-${idx}-1`, match_id: `m-form-short-${idx + 1}`, player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
            { id: `mp-${idx}-2`, match_id: `m-form-short-${idx + 1}`, player_id: 'p-opp', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null },
          ],
        })
      );

      const result = calculatePlayerProfileData(matches, targetId);
      expect(result.summary.all.form).toEqual(['W', 'L', 'W']);
    });
  });

  describe('7. Timeline Chronology & Tie-Breaking', () => {
    it('sorts timeline newest first by played_at descending and breaks ties by id descending', () => {
      const m1 = createMockMatch({
        id: 'm-old',
        played_at: '2026-01-10T10:00:00Z',
        match_players: [{ id: 'mp-1', match_id: 'm-old', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null }],
      });
      const m2 = createMockMatch({
        id: 'm-tie-b',
        played_at: '2026-02-15T12:00:00Z',
        match_players: [{ id: 'mp-2', match_id: 'm-tie-b', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null }],
      });
      const m3 = createMockMatch({
        id: 'm-tie-a',
        played_at: '2026-02-15T12:00:00Z',
        match_players: [{ id: 'mp-3', match_id: 'm-tie-a', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null }],
      });
      const m4 = createMockMatch({
        id: 'm-newest',
        played_at: '2026-03-01T10:00:00Z',
        match_players: [{ id: 'mp-4', match_id: 'm-newest', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null }],
      });

      const result = calculatePlayerProfileData([m1, m2, m3, m4], targetId);
      const timelineIds = result.timeline.map((item) => item.matchId);
      expect(timelineIds).toEqual(['m-newest', 'm-tie-b', 'm-tie-a', 'm-old']);
    });
  });

  describe('8. Partner Analytics & Tie-Breaking', () => {
    it('calculates partner stats and respects 4-tier tie-breaking hierarchy', () => {
      // Tier 1: matchesTogether
      const p1: PlayerPartnerStat = { partnerId: 'p-1', partnerName: 'Георги', matchesTogether: 5, wins: 3, losses: 2, winRate: 60.0 };
      const p2: PlayerPartnerStat = { partnerId: 'p-2', partnerName: 'Ангел', matchesTogether: 6, wins: 3, losses: 3, winRate: 50.0 };
      expect(sortPartners([p1, p2])[0].partnerId).toBe('p-2'); // 6 matches beats 5

      // Tier 2: winRate when matchesTogether equal
      const p3: PlayerPartnerStat = { partnerId: 'p-3', partnerName: 'Борис', matchesTogether: 5, wins: 4, losses: 1, winRate: 80.0 };
      expect(sortPartners([p1, p3])[0].partnerId).toBe('p-3'); // 80.0% beats 60.0%

      // Tier 3: wins when matchesTogether & winRate equal (if different total pool or same)
      const p4: PlayerPartnerStat = { partnerId: 'p-4', partnerName: 'Васил', matchesTogether: 4, wins: 2, losses: 2, winRate: 50.0 };
      const p5: PlayerPartnerStat = { partnerId: 'p-5', partnerName: 'Димитър', matchesTogether: 4, wins: 2, losses: 2, winRate: 50.0 };

      // Tier 4: Bulgarian alphabetical collation
      const sorted = sortPartners([p5, p4]);
      expect(sorted[0].partnerName).toBe('Васил');
      expect(sorted[1].partnerName).toBe('Димитър');
    });

    it('correctly sets favoritePartner to the top-ranked partner', () => {
      const match = createMockMatch({
        id: 'm-fav',
        match_format: 'doubles',
        team_1_score: 6,
        team_2_score: 2,
        match_players: [
          { id: 'mp-1', match_id: 'm-fav', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-2', match_id: 'm-fav', player_id: 'p-partner', team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null, players: { id: 'p-partner', name: 'Любим Партньор' } },
          { id: 'mp-3', match_id: 'm-fav', player_id: 'p-opp', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null },
        ],
      });

      const result = calculatePlayerProfileData([match], targetId);
      expect(result.favoritePartner).not.toBeNull();
      expect(result.favoritePartner?.partnerName).toBe('Любим Партньор');
      expect(result.favoritePartner?.matchesTogether).toBe(1);
      expect(result.favoritePartner?.winRate).toBe(100.0);
    });
  });

  describe('9. Rival Analytics & Tie-Breaking', () => {
    it('awards 1 encounter to each opponent in a doubles match', () => {
      const doublesMatch = createMockMatch({
        id: 'm-rivals-1',
        match_format: 'doubles',
        team_1_score: 4,
        team_2_score: 6,
        match_players: [
          { id: 'mp-1', match_id: 'm-rivals-1', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-2', match_id: 'm-rivals-1', player_id: 'p-partner', team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-3', match_id: 'm-rivals-1', player_id: 'r-1', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null, players: { id: 'r-1', name: 'Съперник А' } },
          { id: 'mp-4', match_id: 'm-rivals-1', player_id: 'r-2', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null, players: { id: 'r-2', name: 'Съперник Б' } },
        ],
      });

      const result = calculatePlayerProfileData([doublesMatch], targetId);
      expect(result.rivals).toHaveLength(2);
      expect(result.rivals[0].encounters).toBe(1);
      expect(result.rivals[0].losses).toBe(1); // Player lost against this rival
      expect(result.rivals[1].encounters).toBe(1);
      expect(result.rivals[1].losses).toBe(1);
    });

    it('respects 4-tier rival tie-breaking (encounters -> losses nemesis -> wins -> bg collation)', () => {
      // Tier 1: encounters
      const r1: PlayerRivalStat = { rivalId: 'r-1', rivalName: 'Георги', encounters: 4, wins: 2, losses: 2, winRate: 50.0 };
      const r2: PlayerRivalStat = { rivalId: 'r-2', rivalName: 'Ангел', encounters: 5, wins: 3, losses: 2, winRate: 60.0 };
      expect(sortRivals([r1, r2])[0].rivalId).toBe('r-2');

      // Tier 2: losses (nemesis priority) when encounters equal
      const r3: PlayerRivalStat = { rivalId: 'r-3', rivalName: 'Борис', encounters: 4, wins: 1, losses: 3, winRate: 25.0 };
      expect(sortRivals([r1, r3])[0].rivalId).toBe('r-3'); // 3 losses beats 2 losses

      // Tier 3: wins when encounters and losses equal
      const r4: PlayerRivalStat = { rivalId: 'r-4', rivalName: 'Васил', encounters: 3, wins: 2, losses: 1, winRate: 66.7 };
      const r5: PlayerRivalStat = { rivalId: 'r-5', rivalName: 'Димитър', encounters: 3, wins: 2, losses: 1, winRate: 66.7 };

      // Tier 4: Bulgarian alphabetical collation
      const sorted = sortRivals([r5, r4]);
      expect(sorted[0].rivalName).toBe('Васил');
      expect(sorted[1].rivalName).toBe('Димитър');
    });

    it('sets topRival and mainRival alias to the top-ranked rival', () => {
      const match = createMockMatch({
        id: 'm-top-rival',
        team_1_score: 3,
        team_2_score: 6,
        match_players: [
          { id: 'mp-1', match_id: 'm-top-rival', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-2', match_id: 'm-top-rival', player_id: 'r-nemesis', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null, players: { id: 'r-nemesis', name: 'Топ Съперник' } },
        ],
      });

      const result = calculatePlayerProfileData([match], targetId);
      expect(result.topRival).not.toBeNull();
      expect(result.topRival?.rivalName).toBe('Топ Съперник');
      expect(result.mainRival).toEqual(result.topRival);
    });
  });

  describe('10. Guest Handling', () => {
    it('handles guest partner and guest opponent with isGuest: true without null dereference', () => {
      const match = createMockMatch({
        id: 'm-guest-match',
        match_format: 'doubles',
        team_1_score: 6,
        team_2_score: 4,
        match_players: [
          { id: 'mp-1', match_id: 'm-guest-match', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-2', match_id: 'm-guest-match', player_id: null, guest_name: 'Гост Партньор', team_side: 'team_1', rating_before: null, rating_after: null },
          { id: 'mp-3', match_id: 'm-guest-match', player_id: null, guest_name: 'Гост Съперник', team_side: 'team_2', rating_before: null, rating_after: null },
        ],
      });

      const result = calculatePlayerProfileData([match], targetId);
      expect(result.timeline).toHaveLength(1);
      const item = result.timeline[0];
      expect(item.partner).toEqual({
        id: 'guest-Гост Партньор',
        name: 'Гост Партньор',
        isGuest: true,
      });
      expect(item.opponents).toEqual([
        {
          id: 'guest-Гост Съперник',
          name: 'Гост Съперник',
          isGuest: true,
        },
      ]);
      expect(result.favoritePartner?.partnerName).toBe('Гост Партньор');
      expect(result.topRival?.rivalName).toBe('Гост Съперник');
    });
  });

  describe('11. Tournament Stage Normalization', () => {
    it('correctly resolves Bulgarian stage labels', () => {
      expect(resolveMatchStage('Финал')).toBe('final');
      expect(resolveMatchStage('финал')).toBe('final');
      expect(resolveMatchStage('Полуфинал')).toBe('semi_final');
      expect(resolveMatchStage('полуфинал 1')).toBe('semi_final');
      expect(resolveMatchStage('1/4-финал')).toBe('quarter_final');
      expect(resolveMatchStage('1/4-финал B')).toBe('quarter_final');
      expect(resolveMatchStage('Група А')).toBe('group');
      expect(resolveMatchStage('група 2')).toBe('group');
      expect(resolveMatchStage('Custom Stage')).toBe('Custom Stage');
      expect(resolveMatchStage(null)).toBeUndefined();
      expect(resolveMatchStage('')).toBeUndefined();
      expect(resolveMatchStage('   ')).toBeUndefined();
    });
  });

  describe('12. Tournament Titles Extraction & Deduplication', () => {
    it('records title and increments titlesCount for won final matches', () => {
      const tournaments = [createMockTournament({ id: 't-1', title: 'Sofia Grand Prix' })];
      const finalMatch = createMockMatch({
        id: 'm-final-win',
        tournament_id: 't-1',
        group_name: 'Финал',
        team_1_score: 6,
        team_2_score: 4,
        match_players: [
          { id: 'mp-1', match_id: 'm-final-win', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-2', match_id: 'm-final-win', player_id: 'p-opp', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null },
        ],
      });

      const result = calculatePlayerProfileData([finalMatch], targetId, tournaments);
      expect(result.titles).toHaveLength(1);
      expect(result.titlesCount).toBe(1);
      expect(result.titles[0]).toEqual({
        tournamentId: 't-1',
        tournamentName: 'Sofia Grand Prix',
        date: finalMatch.played_at,
        format: 'singles',
      });
    });

    it('does NOT record title when losing a final', () => {
      const tournaments = [createMockTournament({ id: 't-1', title: 'Sofia Grand Prix' })];
      const finalLoss = createMockMatch({
        id: 'm-final-loss',
        tournament_id: 't-1',
        group_name: 'Финал',
        team_1_score: 4,
        team_2_score: 6,
        match_players: [
          { id: 'mp-1', match_id: 'm-final-loss', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-2', match_id: 'm-final-loss', player_id: 'p-opp', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null },
        ],
      });

      const result = calculatePlayerProfileData([finalLoss], targetId, tournaments);
      expect(result.titles).toHaveLength(0);
      expect(result.titlesCount).toBe(0);
    });

    it('does NOT record title when winning a semifinal', () => {
      const tournaments = [createMockTournament({ id: 't-1', title: 'Sofia Grand Prix' })];
      const semiWin = createMockMatch({
        id: 'm-semi-win',
        tournament_id: 't-1',
        group_name: 'Полуфинал',
        team_1_score: 6,
        team_2_score: 3,
        match_players: [
          { id: 'mp-1', match_id: 'm-semi-win', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-2', match_id: 'm-semi-win', player_id: 'p-opp', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null },
        ],
      });

      const result = calculatePlayerProfileData([semiWin], targetId, tournaments);
      expect(result.titles).toHaveLength(0);
      expect(result.titlesCount).toBe(0);
    });

    it('deduplicates multiple final match wins for the same tournament_id', () => {
      const tournaments = [createMockTournament({ id: 't-1', title: 'Sofia Grand Prix' })];
      const final1 = createMockMatch({
        id: 'm-final-1',
        tournament_id: 't-1',
        group_name: 'Финал',
        team_1_score: 6,
        team_2_score: 4,
        played_at: '2026-02-01T10:00:00Z',
        match_players: [
          { id: 'mp-1', match_id: 'm-final-1', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-2', match_id: 'm-final-1', player_id: 'p-opp', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null },
        ],
      });
      const final2 = createMockMatch({
        id: 'm-final-2',
        tournament_id: 't-1',
        group_name: 'Финал',
        team_1_score: 6,
        team_2_score: 3,
        played_at: '2026-02-01T15:00:00Z',
        match_players: [
          { id: 'mp-3', match_id: 'm-final-2', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-4', match_id: 'm-final-2', player_id: 'p-opp', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null },
        ],
      });

      const result = calculatePlayerProfileData([final1, final2], targetId, tournaments);
      expect(result.titles).toHaveLength(1);
      expect(result.titlesCount).toBe(1);
      expect(result.titles[0].tournamentId).toBe('t-1');
    });

    it('resolves tournament titles from both Tournament[] and Map<string, Tournament>', () => {
      const tournament = createMockTournament({ id: 't-map', title: 'Varna Masters' });
      const finalMatch = createMockMatch({
        id: 'm-varna-final',
        tournament_id: 't-map',
        group_name: 'Финал',
        team_1_score: 6,
        team_2_score: 2,
        match_players: [
          { id: 'mp-1', match_id: 'm-varna-final', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-2', match_id: 'm-varna-final', player_id: 'p-opp', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null },
        ],
      });

      // Array intake
      const resArray = calculatePlayerProfileData([finalMatch], targetId, [tournament]);
      expect(resArray.titles[0].tournamentName).toBe('Varna Masters');

      // Map intake
      const tourMap = new Map<string, Tournament>();
      tourMap.set('t-map', tournament);
      const resMap = calculatePlayerProfileData([finalMatch], targetId, tourMap);
      expect(resMap.titles[0].tournamentName).toBe('Varna Masters');
    });
  });

  describe('13. Dual Signature Compatibility', () => {
    it('produces identical output for calculatePlayerProfileData and computePlayerProfileStats', () => {
      const match = createMockMatch({
        id: 'm-dual',
        team_1_score: 6,
        team_2_score: 3,
        match_players: [
          { id: 'mp-1', match_id: 'm-dual', player_id: targetId, team_side: 'team_1', guest_name: null, rating_before: null, rating_after: null },
          { id: 'mp-2', match_id: 'm-dual', player_id: 'p-opp', team_side: 'team_2', guest_name: null, rating_before: null, rating_after: null, players: { id: 'p-opp', name: 'Опонент' } },
        ],
      });

      const res1 = calculatePlayerProfileData([match], targetId);
      const res2 = computePlayerProfileStats(targetId, [match]);

      expect(res1).toEqual(res2);
    });
  });
});
