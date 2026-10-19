import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  Swords,
  FileText,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { MatchCard } from '../components/match/MatchCard';
import { TournamentScoreModal } from '../components/tournament/TournamentScoreModal';
import { TournamentModal } from '../components/tournament/TournamentModal';
import { DeleteTournamentModal } from '../components/tournament/DeleteTournamentModal';
import { TournamentInteractiveBoard } from '../components/tournament/TournamentInteractiveBoard';
import { GroupStandingsTable } from '../components/group/GroupStandingsTable';
import { PlayoffFinalistsSelector } from '../components/tournament/PlayoffFinalistsSelector';
import { TournamentPlayoffBracket } from '../components/tournament/TournamentPlayoffBracket';
import { calculateAllGroupStandings, getMatchOutcome } from '../utils/standings';
import {
  isPlayoffMatch,
  resolvePlayoffTeams,
  generatePlayoffMatches,
  propagatePlayoffWinner,
  getDefaultFinalistsCount,
  extractTournamentTeams,
} from '../utils/playoffs';
import { useTournaments } from '../hooks/useTournaments';
import { useMatches } from '../hooks/useMatches';
import type {
  TournamentStatus,
  UpdateTournamentInput,
} from '../types/tournament';
import type { MatchDetail } from '../types/matches';
import type { MatchSet } from '../types/match';
import type { PlayoffFinalistsCount } from '../types/playoffs';
import type { Team } from '../types';

export type TournamentMatchStatusFilter = 'all' | 'completed' | 'upcoming';

interface LocationState {
  fromBulkCreate?: boolean;
  matchCount?: number;
}

const statusConfig = {
  in_progress: {
    label: 'В ход',
    classes:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  draft: {
    label: 'Чернова',
    classes:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  completed: {
    label: 'Приключил',
    classes:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
} as const;

export const TournamentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  const {
    tournaments,
    loading: tournamentsLoading,
    updateTournament,
    deleteTournament,
  } = useTournaments();

  const {
    matches,
    loading: matchesLoading,
    fetchMatches,
    updateMatch,
    bulkCreateMatches,
  } = useMatches();

  const tournament = useMemo(
    () => tournaments.find((t) => t.id === id),
    [tournaments, id]
  );

  const isCompleted = tournament?.status === 'completed';

  const [bulkAlertMessage, setBulkAlertMessage] = useState<string | null>(() => {
    if (locationState?.fromBulkCreate) {
      const count = locationState.matchCount ?? 0;
      return `Успешно записани ${count} мача за турнира!`;
    }
    return null;
  });

  useEffect(() => {
    if (locationState?.fromBulkCreate) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [locationState, location.pathname, navigate]);

  // Match filtering state
  const [matchStatusFilter, setMatchStatusFilter] =
    useState<TournamentMatchStatusFilter>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  // Modals state
  const [isEditTournamentOpen, setIsEditTournamentOpen] = useState(false);
  const [isDeleteTournamentOpen, setIsDeleteTournamentOpen] = useState(false);

  const [editingMatch, setEditingMatch] = useState<MatchDetail | null>(null);

  // Tournament matches partitioned into group stage and playoff stage
  const tournamentMatches = useMemo(() => {
    if (!tournament) return [];
    return matches.filter((m) => m.tournament_id === tournament.id);
  }, [matches, tournament]);

  const groupMatches = useMemo(
    () => tournamentMatches.filter((m) => !isPlayoffMatch(m)),
    [tournamentMatches]
  );

  const playoffMatches = useMemo(
    () => tournamentMatches.filter((m) => isPlayoffMatch(m)),
    [tournamentMatches]
  );

  // Available groups for filtering
  const availableGroups = useMemo(() => {
    const groupsSet = new Set<string>();
    for (const m of groupMatches) {
      if (m.group_name) {
        groupsSet.add(m.group_name);
      }
    }
    return Array.from(groupsSet).sort();
  }, [groupMatches]);

  // Reactive group standings calculation strictly from group stage matches
  const allGroupStandings = useMemo(() => {
    if (groupMatches.length === 0) return [];
    const groupsToCompute =
      availableGroups.length > 0
        ? availableGroups.map((name) => ({ name }))
        : [{ name: '' }];
    return calculateAllGroupStandings(groupsToCompute, groupMatches);
  }, [groupMatches, availableGroups]);

  const groupStandings = useMemo(() => {
    if (groupFilter === 'all') return allGroupStandings;
    return allGroupStandings.filter((g) => g.groupName === groupFilter);
  }, [allGroupStandings, groupFilter]);

  const totalTeamsCount = useMemo(() => {
    if (tournament?.draft_state?.teams && tournament.draft_state.teams.length > 0) {
      return tournament.draft_state.teams.length;
    }
    return allGroupStandings.reduce((sum, g) => sum + g.rows.length, 0);
  }, [tournament, allGroupStandings]);

  // Playoff finalists selector state
  const defaultFinalistsCount = useMemo(() => {
    if (tournament?.draft_state?.playoffFinalists) {
      return tournament.draft_state.playoffFinalists;
    }
    if (allGroupStandings.length > 0) {
      return getDefaultFinalistsCount(allGroupStandings.length, totalTeamsCount);
    }
    return 2 as PlayoffFinalistsCount;
  }, [tournament, allGroupStandings.length, totalTeamsCount]);

  const [customFinalistsCount, setCustomFinalistsCount] =
    useState<PlayoffFinalistsCount | null>(null);

  const selectedFinalistsCount = customFinalistsCount ?? defaultFinalistsCount;

  const handleFinalistsCountChange = async (count: PlayoffFinalistsCount) => {
    setCustomFinalistsCount(count);
    if (tournament) {
      await updateTournament(tournament.id, {
        draft_state: {
          ...(tournament.draft_state || {
            targetTeams: totalTeamsCount,
            formationMode: 'auto',
            teams: [],
            activePool: [],
          }),
          playoffFinalists: count,
        },
      });
    }
  };

  // Tournament teams & roster map extraction for standings display
  const tournamentTeams = useMemo(() => {
    return extractTournamentTeams(groupMatches, tournament?.draft_state?.teams);
  }, [groupMatches, tournament?.draft_state?.teams]);

  const teamRosterMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const t of tournamentTeams) {
      const names = t.players.map((p) => p.name).filter(Boolean);
      if (names.length > 0) {
        if (t.id) map.set(t.id, names);
        if (t.name) map.set(t.name, names);
      }
    }
    return map;
  }, [tournamentTeams]);

  // Playoff qualification resolver
  const playoffResolution = useMemo(() => {
    return resolvePlayoffTeams(allGroupStandings, selectedFinalistsCount);
  }, [allGroupStandings, selectedFinalistsCount]);

  // Playoff bracket generation & lifecycle
  const [isGeneratingPlayoffs, setIsGeneratingPlayoffs] = useState(false);

  const handleGeneratePlayoffs = async () => {
    if (!tournament) return;
    setIsGeneratingPlayoffs(true);
    try {
      const knownTeams: Team[] = extractTournamentTeams(
        groupMatches,
        tournament.draft_state?.teams
      );
      const { matches: newMatches, tree } = generatePlayoffMatches({
        tournamentId: tournament.id,
        format: tournament.format,
        qualifiers: playoffResolution.qualifiers,
        teams: knownTeams,
        finalistsCount: selectedFinalistsCount,
      });

      const { error } = await bulkCreateMatches(newMatches, tournament.format, tournament.id);
      if (error) throw error;

      await updateTournament(tournament.id, {
        draft_state: {
          ...(tournament.draft_state || {
            targetTeams: totalTeamsCount,
            formationMode: 'auto',
            teams: [],
            activePool: [],
          }),
          playoffFinalists: selectedFinalistsCount,
          playoffs: {
            finalistsCount: selectedFinalistsCount,
            tree,
          },
        },
      });
      await fetchMatches();
    } catch {
      // Handled in hooks
    } finally {
      setIsGeneratingPlayoffs(false);
    }
  };

  const handleCompleteTournament = async () => {
    if (!tournament) return;
    await updateTournament(tournament.id, { status: 'completed' });
  };

  // Matches stats
  const matchStats = useMemo(() => {
    const total = tournamentMatches.length;
    const played = tournamentMatches.filter(
      (m) => m.team_1_score !== null && m.team_2_score !== null
    ).length;
    const upcoming = total - played;
    return { total, played, upcoming };
  }, [tournamentMatches]);

  // Filtered and sorted matches
  const filteredMatches = useMemo(() => {
    return tournamentMatches
      .filter((m) => {
        // 1. Status Filter
        if (matchStatusFilter === 'completed') {
          if (m.team_1_score === null || m.team_2_score === null) return false;
        } else if (matchStatusFilter === 'upcoming') {
          if (m.team_1_score !== null && m.team_2_score !== null) return false;
        }

        // 2. Group Filter
        if (groupFilter !== 'all') {
          if (m.group_name !== groupFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // 1. Sort by round ascending (1, 2, 3...)
        const roundA = a.round ?? 999;
        const roundB = b.round ?? 999;
        if (roundA !== roundB) {
          return roundA - roundB;
        }

        // 2. Sort by group name ascending (Група А, Група Б...)
        const groupA = a.group_name ?? '';
        const groupB = b.group_name ?? '';
        if (groupA !== groupB) {
          return groupA.localeCompare(groupB);
        }

        // 3. Fallback to played_at or created_at
        return (a.played_at || a.created_at || '').localeCompare(b.played_at || b.created_at || '');
      });
  }, [tournamentMatches, matchStatusFilter, groupFilter]);

  // Status changer handler
  const handleStatusChange = async (newStatus: TournamentStatus) => {
    if (!tournament || tournament.status === newStatus) return;
    try {
      await updateTournament(tournament.id, { status: newStatus });
    } catch {
      // Handled in hook
    }
  };

  // Tournament edit / delete handlers
  const handleEditTournamentSave = async (data: UpdateTournamentInput) => {
    if (!tournament || isCompleted) return;
    await updateTournament(tournament.id, data);
  };

  const handleDeleteTournamentConfirm = async () => {
    if (!tournament) return;
    await deleteTournament(tournament.id);
    navigate('/tournaments');
  };

  // Match score edit handler
  const handleScoreModalSave = async (
    matchId: string,
    sets: MatchSet[] | null,
    team1Score: number | null,
    team2Score: number | null
  ) => {
    if (!editingMatch || isCompleted) return;
    const t1Players = editingMatch.match_players
      .filter((p) => p.team_side === 'team_1')
      .map((p) => ({
        player_id: p.player_id ?? undefined,
        guest_name: p.guest_name ?? undefined,
      }));
    const t2Players = editingMatch.match_players
      .filter((p) => p.team_side === 'team_2')
      .map((p) => ({
        player_id: p.player_id ?? undefined,
        guest_name: p.guest_name ?? undefined,
      }));

    await updateMatch(matchId, {
      match_format: editingMatch.match_format,
      played_at: editingMatch.played_at,
      team_1_players: t1Players,
      team_2_players: t2Players,
      team_1_name: editingMatch.team_1_name,
      team_2_name: editingMatch.team_2_name,
      group_name: editingMatch.group_name,
      round: editingMatch.round,
      tournament_id: editingMatch.tournament_id,
      team_1_score: team1Score,
      team_2_score: team2Score,
      sets,
    });

    // Check if edited match is in playoffs to propagate winner downstream and handle champion
    const isPlayoff = isPlayoffMatch(editingMatch);
    if (isPlayoff) {
      const outcome = getMatchOutcome({
        sets,
        team_1_score: team1Score,
        team_2_score: team2Score,
      });

      // 1. If Final completed, declare champion
      const isFinal = Boolean(
        editingMatch.group_name && /^финал/i.test(editingMatch.group_name.trim())
      );
      if (isFinal) {
        if (
          outcome.isCompleted &&
          (outcome.winner === 'team_1' || outcome.winner === 'team_2')
        ) {
          const championName =
            outcome.winner === 'team_1'
              ? editingMatch.team_1_name
              : editingMatch.team_2_name;
          if (tournament) {
            await updateTournament(tournament.id, {
              winner_team_name: championName,
            });
          }
        } else if (!outcome.isCompleted && tournament?.winner_team_name) {
          await updateTournament(tournament.id, {
            winner_team_name: null,
          });
        }
      }

      // 2. Propagate winner downstream
      const tree = tournament?.draft_state?.playoffs?.tree;
      if (tree) {
        const completedMatch: MatchDetail = {
          ...editingMatch,
          sets,
          team_1_score: team1Score,
          team_2_score: team2Score,
        };
        const propagation = propagatePlayoffWinner({
          completedMatch,
          allMatches: tournamentMatches,
          tree,
        });
        if (propagation) {
          await updateMatch(propagation.matchId, propagation.updatedMatch);
          await fetchMatches();
        }
      }
    }

    setEditingMatch(null);
  };

  // 1. Loading State
  if (tournamentsLoading && !tournament) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500 dark:text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm">Зареждане на турнира...</p>
      </div>
    );
  }

  // 2. Not Found State
  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Турнирът не е намерен
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Избраният турнир не съществува или е бил изтрит.
          </p>
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Към турнири</span>
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[tournament.status] ?? statusConfig.draft;
  const formatLabel = tournament.format === 'doubles' ? 'По двойки' : 'Поединично';

  // Format date deterministic Bulgarian format: DD.MM.YYYY г.
  const dateObj = new Date(tournament.date);
  const formattedDate = !Number.isNaN(dateObj.getTime())
    ? `${String(dateObj.getDate()).padStart(2, '0')}.${String(
        dateObj.getMonth() + 1
      ).padStart(2, '0')}.${dateObj.getFullYear()} г.`
    : tournament.date;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back Link */}
      <div className="mb-4">
        <Link
          to="/tournaments"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Към турнири</span>
        </Link>
      </div>

      {/* Bulk Creation Success Alert */}
      {bulkAlertMessage && (
        <div className="mb-6">
          <Alert
            type="success"
            message={bulkAlertMessage}
            onDismiss={() => setBulkAlertMessage(null)}
          />
        </div>
      )}

      {/* Tournament Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Left Details */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
                {formatLabel}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.classes}`}
              >
                {statusInfo.label}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Trophy className="w-7 h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{tournament.title}</span>
            </h1>

            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>

            {tournament.winner_team_name && (
              <div className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                🏆 Шампион: {tournament.winner_team_name}
              </div>
            )}

            {tournament.notes && (
              <div className="mt-3 flex items-start gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <span>{tournament.notes}</span>
              </div>
            )}
          </div>

          {/* Right Actions: Quick Status & Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 shrink-0">
            {/* Quick Status Segmented Control */}
            {!isCompleted && (
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block md:text-right">
                  Бърза смяна на статус:
                </span>
                <div className="flex items-center rounded-xl bg-gray-100 dark:bg-gray-700/60 p-1 border border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => handleStatusChange('draft')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      tournament.status === 'draft'
                        ? 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    aria-pressed={tournament.status === 'draft'}
                  >
                    Чернова
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('in_progress')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      tournament.status === 'in_progress'
                        ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    aria-pressed={tournament.status === 'in_progress'}
                  >
                    В ход
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('completed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      tournament.status === 'completed'
                        ? 'bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    aria-pressed={tournament.status === 'completed'}
                  >
                    Приключил
                  </button>
                </div>
              </div>
            )}

            {/* Edit / Delete Buttons */}
            <div className="flex items-center gap-2 mt-2">
              {!isCompleted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditTournamentOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Редактирай</span>
                </Button>
              )}
              <button
                type="button"
                onClick={() => setIsDeleteTournamentOpen(true)}
                aria-label="Изтрий турнир"
                className="p-2 rounded-xl text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Central Content: Interactive Board if 0 matches, or Matches List if matches exist */}
      {tournamentMatches.length === 0 ? (
        <TournamentInteractiveBoard
          tournament={tournament}
          onMatchesSaved={async () => {
            await fetchMatches();
          }}
          onMatchesCreated={async () => {
            await fetchMatches();
          }}
        />
      ) : (
        /* Standings & Matches Section */
        <div className="space-y-8">
          {/* Group Standings Section */}
          {allGroupStandings.length > 0 && (
            <div className="space-y-4" data-testid="tournament-standings-section">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Trophy className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Класиране в групите
                </h2>
              </div>

              {/* Playoff Finalists Selector */}
              {totalTeamsCount >= 2 && (
                <PlayoffFinalistsSelector
                  groupCount={allGroupStandings.length}
                  totalTeams={totalTeamsCount}
                  selectedCount={selectedFinalistsCount}
                  onChange={handleFinalistsCountChange}
                  disabled={isCompleted || playoffMatches.length > 0}
                />
              )}

              {/* Group Tables Grid */}
              <div
                className={`grid grid-cols-1 ${
                  groupStandings.length > 1 ? 'lg:grid-cols-2' : ''
                } gap-4`}
              >
                {groupStandings.map((grp) => (
                  <GroupStandingsTable
                    key={grp.groupId || grp.groupName}
                    groupName={grp.groupName || undefined}
                    standings={grp.rows}
                    qualifierMap={playoffResolution.qualifierMap}
                    teamRosterMap={teamRosterMap}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Knockout Playoff Bracket Section */}
          <div data-testid="tournament-playoffs-section">
            <TournamentPlayoffBracket
              tournament={tournament}
              playoffMatches={playoffMatches}
              groupMatches={groupMatches}
              tree={tournament.draft_state?.playoffs?.tree ?? null}
              onGeneratePlayoffs={handleGeneratePlayoffs}
              onEditMatchScore={(match) => {
                if (!isCompleted) setEditingMatch(match);
              }}
              onCompleteTournament={handleCompleteTournament}
              isGenerating={isGeneratingPlayoffs}
              readOnly={isCompleted}
            />
          </div>

          {/* Matches List Section */}
          <div className="space-y-4">
            {/* Section Heading & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Swords className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Мачове на турнира
                </h2>
                <span className="ml-2 text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {matchStats.total}
                </span>
              </div>

              {/* Quick Filters (Status & Groups) */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Tabs */}
                <div className="flex items-center rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setMatchStatusFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      matchStatusFilter === 'all'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Всички ({matchStats.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchStatusFilter('completed')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      matchStatusFilter === 'completed'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Изиграни ({matchStats.played})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchStatusFilter('upcoming')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      matchStatusFilter === 'upcoming'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Предстоящи ({matchStats.upcoming})
                  </button>
                </div>

                {/* Group Filter (when multiple groups exist) */}
                {availableGroups.length > 1 && (
                  <div className="flex items-center rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setGroupFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        groupFilter === 'all'
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Всички групи
                    </button>
                    {availableGroups.map((grp) => (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => setGroupFilter(grp)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          groupFilter === grp
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {grp}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Matches Content */}
            {matchesLoading && tournamentMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2 text-indigo-600 dark:text-indigo-400" />
                <p className="text-xs">Зареждане на мачовете...</p>
              </div>
            ) : filteredMatches.length === 0 ? (
              /* Filtered Empty State */
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center shadow-xs">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Няма намерени мачове за избраните критерии.
                </p>
              </div>
            ) : (
              /* Matches List */
              <div className="space-y-4">
                {filteredMatches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    readOnly={isCompleted}
                    onEdit={(match) => {
                      if (!isCompleted) setEditingMatch(match);
                    }}
                    hideDelete={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Tournament Modal */}
      {isEditTournamentOpen && (
        <TournamentModal
          isOpen={isEditTournamentOpen}
          initialData={tournament}
          onClose={() => setIsEditTournamentOpen(false)}
          onSave={handleEditTournamentSave}
        />
      )}

      {/* Delete Tournament Modal */}
      {isDeleteTournamentOpen && tournament && (
        <DeleteTournamentModal
          isOpen={isDeleteTournamentOpen}
          tournament={tournament}
          onClose={() => setIsDeleteTournamentOpen(false)}
          onConfirm={handleDeleteTournamentConfirm}
        />
      )}

      {/* Edit Match Score Modal */}
      {editingMatch && (
        <TournamentScoreModal
          isOpen={Boolean(editingMatch)}
          match={editingMatch}
          onClose={() => setEditingMatch(null)}
          onSave={handleScoreModalSave}
        />
      )}
    </div>
  );
};

TournamentDetailPage.displayName = 'TournamentDetailPage';
export default TournamentDetailPage;
