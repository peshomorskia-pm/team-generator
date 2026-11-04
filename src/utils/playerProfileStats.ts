import type { MatchDetail, MatchPlayerDetail, MatchFormat } from '../types/matches';
import type { Tournament } from '../types/tournament';
import type { FormOutcome } from '../types/rankings';
import { resolveMatchFormat } from './matchFormat';
import { getMatchOutcome } from './standings';
import { calculateGameDifference } from './standingsStats';

/** Participant representation for timeline items and aggregations */
export interface PlayerParticipant {
  id: string;
  name: string;
  isGuest?: boolean;
}

/** Aggregate statistics across a specific scope (all, singles, or doubles) */
export interface PlayerProfileSummary {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number; // 0.0 - 100.0, rounded to 1 decimal place; strictly 50.0 when matchesPlayed === 0
  gamesWon: number;
  gamesLost: number;
  gameDifference: number; // gamesWon - gamesLost
  form: FormOutcome[]; // Up to 5 most recent completed matches (chronological: oldest -> newest)
}

/** Individual match entry formatted from the target player's perspective */
export interface PlayerTimelineItem {
  matchId: string;
  date: string; // ISO date string from played_at (fallback: created_at)
  format: MatchFormat; // 'singles' | 'doubles'
  isWinner: boolean; // True if player's team won
  partner?: PlayerParticipant; // Present only in doubles when partner exists
  opponents: PlayerParticipant[]; // List of opposing players/guests
  scoreDisplay: string; // Perspective score: e.g. "6:4, 4:6, 10:7" or "6:4"
  tournamentName?: string; // Resolved from tournaments map or match
  stage?: 'final' | 'semi_final' | 'quarter_final' | 'group' | string;
  groupName?: string; // Raw group_name from match
}

/** Doubles partner chemistry record */
export interface PlayerPartnerStat {
  partnerId: string;
  partnerName: string;
  matchesTogether: number;
  wins: number;
  losses: number;
  winRate: number; // 0.0 - 100.0, rounded to 1 decimal place; 50.0 when matchesTogether === 0
}

/** Head-to-head rival record across singles and doubles */
export interface PlayerRivalStat {
  rivalId: string;
  rivalName: string;
  encounters: number;
  wins: number; // Player's wins against this rival
  losses: number; // Player's losses against this rival
  winRate: number; // Win % against this rival; 50.0 when encounters === 0
}

/** Tournament title record for playoff final wins */
export interface PlayerTournamentTitle {
  tournamentId: string;
  tournamentName: string;
  date: string;
  format: MatchFormat;
}

/** Complete aggregated player profile data payload */
export interface PlayerProfileData {
  playerId: string;
  summary: {
    all: PlayerProfileSummary;
    doubles: PlayerProfileSummary;
    singles: PlayerProfileSummary;
  };
  timeline: PlayerTimelineItem[]; // Chronological: newest first
  partners: PlayerPartnerStat[]; // Ranked by partner hierarchy
  rivals: PlayerRivalStat[]; // Ranked by rival hierarchy
  titles: PlayerTournamentTitle[]; // Deduplicated tournament titles
  favoritePartner: PlayerPartnerStat | null;
  topRival: PlayerRivalStat | null;
  // Compatibility convenience aliases
  mainRival: PlayerRivalStat | null;
  titlesCount: number;
}

// Backward-compatible type aliases for alternative intake conventions
export type PlayerProfileStats = PlayerProfileData;
export type FormatStatsSummary = PlayerProfileSummary;
export type PlayerMatchTimelineItem = PlayerTimelineItem;
export type PartnerRecord = PlayerPartnerStat;
export type RivalRecord = PlayerRivalStat;
export type TournamentTitleRecord = PlayerTournamentTitle;

/**
 * Validates whether a match is completed with valid scores.
 */
export function isMatchCompletedAndValid(match: MatchDetail): boolean {
  if (match.sets && match.sets.length > 0) {
    return getMatchOutcome(match).isCompleted;
  }
  return (
    match.team_1_score !== null &&
    match.team_1_score !== undefined &&
    typeof match.team_1_score === 'number' &&
    !Number.isNaN(match.team_1_score) &&
    match.team_2_score !== null &&
    match.team_2_score !== undefined &&
    typeof match.team_2_score === 'number' &&
    !Number.isNaN(match.team_2_score)
  );
}

/**
 * Formats ISO dates into Bulgarian display date (e.g. "01.03.2026 г.")
 */
export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formats partner and rival chemistry records with Bulgarian pluralization.
 */
export function formatRecordSummary(matches: number, wins: number, losses: number): string {
  const matchWord = matches === 1 ? 'мач' : 'мача';
  const winWord = wins === 1 ? 'победа' : 'победи';
  const lossWord = losses === 1 ? 'загуба' : 'загуби';
  return `${matches} ${matchWord} • ${wins} ${winWord}, ${losses} ${lossWord}`;
}

/**
 * Resolves tournament title with fallback "Турнир ({date})" or "Турнир", strictly never raw UUID.
 */
export function resolveTournamentName(
  tournamentId?: string | null,
  tournamentsMap?: Map<string, Tournament>,
  dateStr?: string
): string | undefined {
  if (!tournamentId) return undefined;
  const directTitle = tournamentsMap?.get(tournamentId)?.title?.trim();
  if (directTitle) return directTitle;
  const formattedDate = formatDisplayDate(dateStr);
  return formattedDate ? `Турнир (${formattedDate})` : 'Турнир';
}

/**
 * Resolves stage label for timeline rows, retaining group titles (e.g. "Група А").
 */
export function resolveTimelineStageLabel(stage?: string, groupName?: string): string | undefined {
  if (groupName && groupName.trim()) {
    const trimmed = groupName.trim();
    if (/^(полуфинал|semi[-_]?final)/i.test(trimmed)) return 'Полуфинал';
    if (/^(финал|final)/i.test(trimmed)) return 'Финал';
    if (/^(1\/4-финал|quarter[-_]?final)/i.test(trimmed)) return '1/4-финал';
    return trimmed;
  }
  if (!stage) return undefined;
  switch (stage) {
    case 'final':
      return 'Финал';
    case 'semi_final':
      return 'Полуфинал';
    case 'quarter_final':
      return '1/4-финал';
    case 'group':
      return 'Групова фаза';
    default:
      return stage;
  }
}

/**
 * Normalizes Bulgarian & English group/stage names.
 */
export function resolveMatchStage(groupName?: string | null): string | undefined {
  if (!groupName) return undefined;
  const trimmed = groupName.trim();
  if (!trimmed) return undefined;

  if (/^(полуфинал|semi[-_]?final)/i.test(trimmed)) {
    return 'semi_final';
  }
  if (/^(финал|final)/i.test(trimmed)) {
    return 'final';
  }
  if (/^(1\/4-финал|quarter[-_]?final)/i.test(trimmed)) {
    return 'quarter_final';
  }
  if (/^(група|group)/i.test(trimmed)) {
    return 'group';
  }

  return trimmed;
}

/**
 * Formats score from the target player's perspective (player side first).
 */
export function formatPerspectiveScore(
  match: MatchDetail,
  playerSide: 'team_1' | 'team_2'
): string {
  if (match.sets && match.sets.length > 0) {
    const sortedSets = [...match.sets].sort(
      (a, b) => (a.set_number ?? 0) - (b.set_number ?? 0)
    );
    return sortedSets
      .map((s) => {
        const playerScore = playerSide === 'team_1' ? s.team_1_score : s.team_2_score;
        const oppScore = playerSide === 'team_1' ? s.team_2_score : s.team_1_score;
        return `${playerScore ?? 0}:${oppScore ?? 0}`;
      })
      .join(', ');
  }

  const playerScore = playerSide === 'team_1' ? match.team_1_score : match.team_2_score;
  const oppScore = playerSide === 'team_1' ? match.team_2_score : match.team_1_score;
  return `${playerScore ?? 0}:${oppScore ?? 0}`;
}

/**
 * Extracts a PlayerParticipant from a MatchPlayerDetail row.
 */
export function extractParticipant(mp: MatchPlayerDetail): PlayerParticipant {
  if (!mp.player_id) {
    return {
      id: `guest-${mp.guest_name ?? 'unknown'}`,
      name: mp.guest_name ?? 'Гост',
      isGuest: true,
    };
  }
  return {
    id: mp.player_id,
    name: mp.players?.name || 'Играч',
  };
}

/**
 * Computes win rate percentage rounded to 1 decimal place, strictly 50.0 for 0 matches.
 */
function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 50.0;
  return Number(((wins / total) * 100).toFixed(1));
}

/**
 * Returns a neutral, zeroed summary with 50.0% win rate prior.
 */
function createZeroSummary(): PlayerProfileSummary {
  return {
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 50.0,
    gamesWon: 0,
    gamesLost: 0,
    gameDifference: 0,
    form: [],
  };
}

/**
 * Normalizes input tournaments map or array into a standard Map<string, Tournament>.
 */
function normalizeTournamentsMap(
  tournaments?: Map<string, Tournament> | Tournament[]
): Map<string, Tournament> {
  if (!tournaments) return new Map();
  if (tournaments instanceof Map) return tournaments;
  const map = new Map<string, Tournament>();
  if (Array.isArray(tournaments)) {
    for (const t of tournaments) {
      if (t && t.id) {
        map.set(t.id, t);
      }
    }
  }
  return map;
}

/**
 * Computes summary aggregations for a chronological slice of matches (oldest first).
 */
function computeSummaryForMatches(
  entries: { match: MatchDetail; playerSide: 'team_1' | 'team_2' }[]
): PlayerProfileSummary {
  if (entries.length === 0) {
    return createZeroSummary();
  }

  let wins = 0;
  let losses = 0;
  let gamesWon = 0;
  let gamesLost = 0;
  const outcomes: FormOutcome[] = [];

  for (const entry of entries) {
    const outcome = getMatchOutcome(entry.match);
    const won = outcome.winner === entry.playerSide;
    if (won) {
      wins += 1;
      outcomes.push('W');
    } else {
      losses += 1;
      outcomes.push('L');
    }

    const diff = calculateGameDifference(entry.match, entry.playerSide);
    gamesWon += diff.gamesWon;
    gamesLost += diff.gamesLost;
  }

  const matchesPlayed = wins + losses;
  return {
    matchesPlayed,
    wins,
    losses,
    winRate: calculateWinRate(wins, matchesPlayed),
    gamesWon,
    gamesLost,
    gameDifference: gamesWon - gamesLost,
    form: outcomes.slice(-5),
  };
}

/**
 * Sorts doubles partner stats adhering to 4-tier tie-breaking:
 * Tier 1: matchesTogether (desc)
 * Tier 2: winRate (desc)
 * Tier 3: wins (desc)
 * Tier 4: Bulgarian alphabetical name collation (asc)
 */
export function sortPartners(partners: PlayerPartnerStat[]): PlayerPartnerStat[] {
  return [...partners].sort((a, b) => {
    if (b.matchesTogether !== a.matchesTogether) {
      return b.matchesTogether - a.matchesTogether;
    }
    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate;
    }
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    return a.partnerName.localeCompare(b.partnerName, 'bg');
  });
}

/**
 * Sorts rival stats adhering to 4-tier tie-breaking:
 * Tier 1: encounters (desc)
 * Tier 2: losses (desc) - nemesis priority
 * Tier 3: wins (desc)
 * Tier 4: Bulgarian alphabetical name collation (asc)
 */
export function sortRivals(rivals: PlayerRivalStat[]): PlayerRivalStat[] {
  return [...rivals].sort((a, b) => {
    if (b.encounters !== a.encounters) {
      return b.encounters - a.encounters;
    }
    if (b.losses !== a.losses) {
      return b.losses - a.losses;
    }
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    return a.rivalName.localeCompare(b.rivalName, 'bg');
  });
}

/**
 * Calculates comprehensive player profile statistics, timeline, partner/rival analytics,
 * and tournament titles.
 */
export function calculatePlayerProfileData(
  matches: MatchDetail[],
  playerId: string,
  tournamentsMap?: Map<string, Tournament> | Tournament[]
): PlayerProfileData {
  const tournaments = normalizeTournamentsMap(tournamentsMap);

  // Filter completed matches where player is participant
  const playerMatches: {
    match: MatchDetail;
    playerSide: 'team_1' | 'team_2';
    format: MatchFormat;
    timeValue: number;
    date: string;
  }[] = [];

  for (const m of matches) {
    if (!isMatchCompletedAndValid(m)) continue;
    const mp = m.match_players?.find((p) => p.player_id === playerId);
    if (!mp || (mp.team_side !== 'team_1' && mp.team_side !== 'team_2')) continue;

    const date = m.played_at || m.created_at || '';
    const timeValue = date ? new Date(date).getTime() : 0;
    const format = resolveMatchFormat(m);

    playerMatches.push({
      match: m,
      playerSide: mp.team_side,
      format,
      timeValue,
      date,
    });
  }

  if (playerMatches.length === 0) {
    return {
      playerId,
      summary: {
        all: createZeroSummary(),
        doubles: createZeroSummary(),
        singles: createZeroSummary(),
      },
      timeline: [],
      partners: [],
      rivals: [],
      titles: [],
      favoritePartner: null,
      topRival: null,
      mainRival: null,
      titlesCount: 0,
    };
  }

  // Sort chronological ascending (oldest first) for summaries / stats / form
  const chronological = [...playerMatches].sort((a, b) => {
    if (a.timeValue !== b.timeValue) return a.timeValue - b.timeValue;
    return a.match.id.localeCompare(b.match.id);
  });

  const doublesEntries = chronological.filter((e) => e.format === 'doubles');
  const singlesEntries = chronological.filter((e) => e.format === 'singles');

  const summary = {
    all: computeSummaryForMatches(chronological),
    doubles: computeSummaryForMatches(doublesEntries),
    singles: computeSummaryForMatches(singlesEntries),
  };

  // Partners aggregation (doubles only)
  const partnerMap = new Map<
    string,
    { partnerId: string; partnerName: string; matchesTogether: number; wins: number; losses: number }
  >();

  // Rivals aggregation (all formats)
  const rivalMap = new Map<
    string,
    { rivalId: string; rivalName: string; encounters: number; wins: number; losses: number }
  >();

  // Titles raw list
  const rawTitles: PlayerTournamentTitle[] = [];

  // Timeline list
  const timeline: PlayerTimelineItem[] = [];

  for (const entry of playerMatches) {
    const { match, playerSide, format, date } = entry;
    const outcome = getMatchOutcome(match);
    const isWinner = outcome.winner === playerSide;
    const stage = resolveMatchStage(match.group_name);
    const tournamentDate = date || (match.tournament_id ? tournaments.get(match.tournament_id)?.date : undefined);
    const tournamentName = resolveTournamentName(match.tournament_id, tournaments, tournamentDate);

    // Teammate / Partner
    let partner: PlayerParticipant | undefined;
    if (format === 'doubles') {
      const teammateMp = match.match_players?.find(
        (p) => p.team_side === playerSide && p.player_id !== playerId
      );
      if (teammateMp) {
        partner = extractParticipant(teammateMp);
        const existing = partnerMap.get(partner.id) || {
          partnerId: partner.id,
          partnerName: partner.name,
          matchesTogether: 0,
          wins: 0,
          losses: 0,
        };
        existing.matchesTogether += 1;
        if (isWinner) existing.wins += 1;
        else existing.losses += 1;
        partnerMap.set(partner.id, existing);
      }
    }

    // Opponents (deduplicated per match)
    const opposingMps = (match.match_players || []).filter((p) => p.team_side !== playerSide);
    const opponentsMap = new Map<string, PlayerParticipant>();
    for (const oppMp of opposingMps) {
      const part = extractParticipant(oppMp);
      if (!opponentsMap.has(part.id)) {
        opponentsMap.set(part.id, part);
      }
    }
    const opponents = Array.from(opponentsMap.values());

    for (const opp of opponents) {
      const existing = rivalMap.get(opp.id) || {
        rivalId: opp.id,
        rivalName: opp.name,
        encounters: 0,
        wins: 0,
        losses: 0,
      };
      existing.encounters += 1;
      if (isWinner) existing.wins += 1;
      else existing.losses += 1;
      rivalMap.set(opp.id, existing);
    }

    // Tournament Titles: winning a final in a tournament
    if (stage === 'final' && isWinner && match.tournament_id) {
      const tName = tournamentName || 'Турнир';
      rawTitles.push({
        tournamentId: match.tournament_id,
        tournamentName: tName,
        date: date || tournaments.get(match.tournament_id)?.date || '',
        format,
      });
    }

    timeline.push({
      matchId: match.id,
      date,
      format,
      isWinner,
      partner,
      opponents,
      scoreDisplay: formatPerspectiveScore(match, playerSide),
      tournamentName,
      stage,
      groupName: match.group_name ?? undefined,
    });
  }

  // Sort timeline newest first (played_at desc, id desc)
  timeline.sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;
    return b.matchId.localeCompare(a.matchId);
  });

  // Calculate partners with winRate & sort
  const partnersList: PlayerPartnerStat[] = Array.from(partnerMap.values()).map((p) => ({
    ...p,
    winRate: calculateWinRate(p.wins, p.matchesTogether),
  }));
  const partners = sortPartners(partnersList);
  const favoritePartner = partners.length > 0 ? partners[0] : null;

  // Calculate rivals with winRate & sort
  const rivalsList: PlayerRivalStat[] = Array.from(rivalMap.values()).map((r) => ({
    ...r,
    winRate: calculateWinRate(r.wins, r.encounters),
  }));
  const rivals = sortRivals(rivalsList);
  const topRival = rivals.length > 0 ? rivals[0] : null;

  // Deduplicate titles by tournamentId (keep latest date) and sort
  const titlesByTournamentId = new Map<string, PlayerTournamentTitle>();
  for (const title of rawTitles) {
    const existing = titlesByTournamentId.get(title.tournamentId);
    if (!existing) {
      titlesByTournamentId.set(title.tournamentId, title);
    } else {
      const existingTime = existing.date ? new Date(existing.date).getTime() : 0;
      const newTime = title.date ? new Date(title.date).getTime() : 0;
      if (newTime > existingTime) {
        titlesByTournamentId.set(title.tournamentId, title);
      }
    }
  }
  const titles = Array.from(titlesByTournamentId.values()).sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;
    return a.tournamentName.localeCompare(b.tournamentName, 'bg');
  });

  return {
    playerId,
    summary,
    timeline,
    partners,
    rivals,
    titles,
    favoritePartner,
    topRival,
    mainRival: topRival,
    titlesCount: titles.length,
  };
}

/**
 * Functional alias matching alternative intake signature: (playerId, matches, tournaments)
 */
export function computePlayerProfileStats(
  playerId: string,
  matches: MatchDetail[],
  tournaments?: Map<string, Tournament> | Tournament[]
): PlayerProfileStats {
  return calculatePlayerProfileData(matches, playerId, tournaments);
}
