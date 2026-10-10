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
  Play,
  FileText,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { MatchCard } from '../components/match/MatchCard';
import { MatchModal } from '../components/match/MatchModal';
import { DeleteMatchModal } from '../components/match/DeleteMatchModal';
import { TournamentModal } from '../components/tournament/TournamentModal';
import { DeleteTournamentModal } from '../components/tournament/DeleteTournamentModal';
import { useTournaments } from '../hooks/useTournaments';
import { useMatches } from '../hooks/useMatches';
import { usePlayers } from '../hooks/usePlayers';
import type {
  TournamentStatus,
  UpdateTournamentInput,
} from '../types/tournament';
import type { MatchDetail, MatchFormData } from '../types/matches';

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
    updateMatch,
    deleteMatch,
  } = useMatches();

  const { players: availablePlayers } = usePlayers();

  const tournament = useMemo(
    () => tournaments.find((t) => t.id === id),
    [tournaments, id]
  );

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
  const [deletingMatch, setDeletingMatch] = useState<MatchDetail | null>(null);
  const [isDeletingMatch, setIsDeletingMatch] = useState(false);

  // Tournament matches
  const tournamentMatches = useMemo(() => {
    if (!tournament) return [];
    return matches.filter((m) => m.tournament_id === tournament.id);
  }, [matches, tournament]);

  // Available groups for filtering
  const availableGroups = useMemo(() => {
    const groupsSet = new Set<string>();
    for (const m of tournamentMatches) {
      if (m.group_name) {
        groupsSet.add(m.group_name);
      }
    }
    return Array.from(groupsSet).sort();
  }, [tournamentMatches]);

  // Matches stats
  const matchStats = useMemo(() => {
    const total = tournamentMatches.length;
    const played = tournamentMatches.filter(
      (m) => m.team_1_score !== null && m.team_2_score !== null
    ).length;
    const upcoming = total - played;
    return { total, played, upcoming };
  }, [tournamentMatches]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return tournamentMatches.filter((m) => {
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
    if (!tournament) return;
    await updateTournament(tournament.id, data);
  };

  const handleDeleteTournamentConfirm = async () => {
    if (!tournament) return;
    await deleteTournament(tournament.id);
    navigate('/tournaments');
  };

  // Match edit / delete handlers
  const handleEditMatchSave = async (data: MatchFormData) => {
    if (!editingMatch) return;
    await updateMatch(editingMatch.id, data);
    setEditingMatch(null);
  };

  const handleDeleteMatchConfirm = async () => {
    if (!deletingMatch) return;
    try {
      setIsDeletingMatch(true);
      await deleteMatch(deletingMatch.id);
      setDeletingMatch(null);
    } finally {
      setIsDeletingMatch(false);
    }
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

            {/* Edit / Delete Buttons */}
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditTournamentOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Редактирай</span>
              </Button>
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

      {/* Generator Launch CTA Section */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <span>🎲 Стартирай генератор за турнира</span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Изберете играчи, генерирайте отбори и автоматично създайте програма от мачове за този турнир.
          </p>
        </div>
        <Link
          to={`/generator?tournamentId=${tournament.id}`}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors shrink-0"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Към генератора</span>
        </Link>
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
          {tournamentMatches.length > 0 && (
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
          )}
        </div>

        {/* Matches Content */}
        {matchesLoading && tournamentMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs">Зареждане на мачовете...</p>
          </div>
        ) : tournamentMatches.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Swords className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Все още няма записани мачове за този турнир
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Използвайте турнирния генератор, за да създадете отбори, групи и автоматична програма от срещи.
            </p>
            <Link
              to={`/generator?tournamentId=${tournament.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
            >
              <span>🎲 Стартирай генератор за турнира</span>
            </Link>
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
                onEdit={(match) => setEditingMatch(match)}
                onDelete={(match) => setDeletingMatch(match)}
              />
            ))}
          </div>
        )}
      </div>

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
      {isDeleteTournamentOpen && (
        <DeleteTournamentModal
          isOpen={isDeleteTournamentOpen}
          tournamentTitle={tournament.title}
          onClose={() => setIsDeleteTournamentOpen(false)}
          onConfirm={handleDeleteTournamentConfirm}
        />
      )}

      {/* Edit Match Modal */}
      {editingMatch && (
        <MatchModal
          isOpen={Boolean(editingMatch)}
          match={editingMatch}
          availablePlayers={availablePlayers}
          onClose={() => setEditingMatch(null)}
          onSave={handleEditMatchSave}
        />
      )}

      {/* Delete Match Modal */}
      {deletingMatch && (
        <DeleteMatchModal
          isOpen={Boolean(deletingMatch)}
          isLoading={isDeletingMatch}
          onClose={() => setDeletingMatch(null)}
          onConfirm={handleDeleteMatchConfirm}
        />
      )}
    </div>
  );
};

TournamentDetailPage.displayName = 'TournamentDetailPage';
export default TournamentDetailPage;
