import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Swords, Plus, Search, Loader2, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { MatchesStatSummary } from '../components/match/MatchesStatSummary';
import { MatchCard } from '../components/match/MatchCard';
import { MatchModal } from '../components/match/MatchModal';
import { DeleteMatchModal } from '../components/match/DeleteMatchModal';
import { useMatches } from '../hooks/useMatches';
import { usePlayers } from '../hooks/usePlayers';
import type { MatchDetail, MatchFormData } from '../types/matches';

export type StatusFilter = 'all' | 'completed' | 'upcoming';
export type PeriodFilter = 'all' | 'this_week' | 'this_month' | 'custom';

interface BulkCreateLocationState {
  fromBulkCreate?: boolean;
  matchCount?: number;
  statusFilter?: StatusFilter;
}

const isWithinThisWeek = (dateStr: string): boolean => {
  const matchDate = new Date(dateStr);
  const now = new Date();

  const currentDay = now.getDay();
  const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;

  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return matchDate >= monday && matchDate <= sunday;
};

const isWithinThisMonth = (dateStr: string): boolean => {
  const matchDate = new Date(dateStr);
  const now = new Date();
  return (
    matchDate.getFullYear() === now.getFullYear() &&
    matchDate.getMonth() === now.getMonth()
  );
};

export const MatchesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as BulkCreateLocationState | null;

  const {
    matches,
    loading: matchesLoading,
    alert,
    createMatch,
    updateMatch,
    deleteMatch,
    clearAlert,
  } = useMatches();

  const { players: availablePlayers } = usePlayers();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    if (locationState?.fromBulkCreate || locationState?.statusFilter === 'upcoming') {
      return 'upcoming';
    }
    return 'all';
  });

  const [bulkSuccessMessage, setBulkSuccessMessage] = useState<string | null>(() => {
    if (locationState?.fromBulkCreate) {
      const count = locationState.matchCount ?? 0;
      return `Успешно създадени ${count} предстоящи мача от турнира!`;
    }
    return null;
  });

  useEffect(() => {
    if (locationState?.fromBulkCreate) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [locationState, location.pathname, navigate]);

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchDetail | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<MatchDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredMatches = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return matches.filter((m) => {
      // 1. Status Filter
      if (statusFilter === 'completed') {
        if (m.team_1_score === null || m.team_2_score === null) return false;
      } else if (statusFilter === 'upcoming') {
        if (m.team_1_score !== null && m.team_2_score !== null) return false;
      }

      // 2. Period Filter
      if (periodFilter === 'this_week') {
        if (!isWithinThisWeek(m.played_at)) return false;
      } else if (periodFilter === 'this_month') {
        if (!isWithinThisMonth(m.played_at)) return false;
      } else if (periodFilter === 'custom') {
        const matchDate = new Date(m.played_at);
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (matchDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (matchDate > end) return false;
        }
      }

      // 3. Search Filter
      if (query) {
        const matchesPlayer = m.match_players.some(
          (p) =>
            p.players?.name?.toLowerCase().includes(query) ||
            p.guest_name?.toLowerCase().includes(query)
        );
        const matchesGroupName = Boolean(m.group_name?.toLowerCase().includes(query));
        const matchesTeam1Name = Boolean(m.team_1_name?.toLowerCase().includes(query));
        const matchesTeam2Name = Boolean(m.team_2_name?.toLowerCase().includes(query));

        if (!matchesPlayer && !matchesGroupName && !matchesTeam1Name && !matchesTeam2Name) {
          return false;
        }
      }

      return true;
    });
  }, [matches, statusFilter, periodFilter, searchQuery, customStartDate, customEndDate]);

  const handleCreateSave = async (data: MatchFormData) => {
    await createMatch(data);
  };

  const handleEditSave = async (data: MatchFormData) => {
    if (!editingMatch) return;
    await updateMatch(editingMatch.id, data);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMatch) return;
    try {
      setIsDeleting(true);
      await deleteMatch(deletingMatch.id);
      setDeletingMatch(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Top Header & New Match CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Swords className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>Мачове</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Следене на срещи, резултати и история на двубоите
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Нов мач</span>
        </Button>
      </div>

      {/* Bulk Creation Success Alert */}
      {bulkSuccessMessage && (
        <div className="mb-6">
          <Alert
            type="success"
            message={bulkSuccessMessage}
            onDismiss={() => setBulkSuccessMessage(null)}
          />
        </div>
      )}

      {/* Alert Notification */}
      {alert && (
        <div className="mb-6">
          <Alert type={alert.type} message={alert.message} onDismiss={clearAlert} />
        </div>
      )}

      {/* Stat Summary Widgets */}
      <MatchesStatSummary matches={matches} />

      {/* Filters and Search Bar Section */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          {/* Status Tabs */}
          <div className="flex items-center rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 self-start">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Всички
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                statusFilter === 'completed'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Изиграни
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                statusFilter === 'upcoming'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Предстоящи
            </button>
          </div>

          {/* Period Filter Dropdown & Custom Range */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Филтър по период"
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                className="pl-9 pr-8 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              >
                <option value="all">Всички периоди</option>
                <option value="this_week">Тази седмица</option>
                <option value="this_month">Този месец</option>
                <option value="custom">Посочи период...</option>
              </select>
            </div>

            {periodFilter === 'custom' && (
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 dark:text-gray-400 text-[11px] font-medium">От:</span>
                  <input
                    type="date"
                    aria-label="Начална дата"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 dark:text-gray-400 text-[11px] font-medium">До:</span>
                  <input
                    type="date"
                    aria-label="Крайна дата"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Търсене по име на играч или гост..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-xs transition-all"
            aria-label="Търсене на мачове"
          />
        </div>
      </div>

      {/* Content Area */}
      {matchesLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm">Зареждане на мачовете...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
            <Swords className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Няма записани мачове
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Все още няма изиграни двубои в системата. Запишете първия си мач с бутона по-долу.
          </p>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Нов мач</span>
          </Button>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {searchQuery
              ? `Няма намерени мачове за \u201C${searchQuery}\u201D.`
              : 'Няма намерени мачове, отговарящи на избраните филтри.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onEdit={(m) => setEditingMatch(m)}
              onDelete={(m) => setDeletingMatch(m)}
            />
          ))}
        </div>
      )}

      {/* Create Match Modal */}
      <MatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateSave}
        availablePlayers={availablePlayers}
      />

      {/* Edit Match Modal */}
      <MatchModal
        isOpen={Boolean(editingMatch)}
        onClose={() => setEditingMatch(null)}
        onSave={handleEditSave}
        match={editingMatch ?? undefined}
        availablePlayers={availablePlayers}
      />

      {/* Delete Confirmation Modal */}
      <DeleteMatchModal
        isOpen={Boolean(deletingMatch)}
        onClose={() => setDeletingMatch(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
};
