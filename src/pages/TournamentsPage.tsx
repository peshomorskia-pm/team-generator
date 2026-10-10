import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  FileEdit,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { TournamentCard } from '../components/tournament/TournamentCard';
import { TournamentModal } from '../components/tournament/TournamentModal';
import { DeleteTournamentModal } from '../components/tournament/DeleteTournamentModal';
import { useTournaments } from '../hooks/useTournaments';
import type {
  Tournament,
  TournamentStatus,
  CreateTournamentInput,
  UpdateTournamentInput,
} from '../types/tournament';

export type TournamentStatusFilter = 'all' | TournamentStatus;

export const TournamentsPage: React.FC = () => {
  const {
    tournaments,
    loading,
    error,
    createTournament,
    updateTournament,
    deleteTournament,
  } = useTournaments();

  const [statusFilter, setStatusFilter] = useState<TournamentStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null);

  const stats = useMemo(() => {
    const total = tournaments.length;
    const inProgress = tournaments.filter((t) => t.status === 'in_progress').length;
    const draft = tournaments.filter((t) => t.status === 'draft').length;
    const completed = tournaments.filter((t) => t.status === 'completed').length;
    return { total, inProgress, draft, completed };
  }, [tournaments]);

  const filteredTournaments = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return tournaments.filter((t) => {
      // 1. Status Filter
      if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }

      // 2. Search query (title or notes)
      if (query) {
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesNotes = Boolean(t.notes?.toLowerCase().includes(query));
        if (!matchesTitle && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [tournaments, statusFilter, searchQuery]);

  const handleCreateSave = async (data: CreateTournamentInput | UpdateTournamentInput) => {
    await createTournament(data as CreateTournamentInput);
  };

  const handleEditSave = async (data: CreateTournamentInput | UpdateTournamentInput) => {
    if (!editingTournament) return;
    await updateTournament(editingTournament.id, data as UpdateTournamentInput);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTournament) return;
    await deleteTournament(deletingTournament.id);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Top Header & New Tournament CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <span>Турнири</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {stats.total}
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Организиране, групи и проследяване на турнирни събития
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Нов турнир</span>
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6">
          <Alert type="error" message={error.message} />
        </div>
      )}

      {/* Stats Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-4 transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              Общо
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-4 transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              В ход
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {stats.inProgress}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-4 transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <FileEdit className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              Чернови
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {stats.draft}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-4 transition-all">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              Приключили
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {stats.completed}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
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
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                statusFilter === 'in_progress'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              В ход
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                statusFilter === 'draft'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Чернови
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
              Приключили
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Търси турнир..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading && tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm">Зареждане на турнирите...</p>
        </div>
      ) : tournaments.length === 0 ? (
        /* Empty Database State */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Все още няма създадени турнири
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Създайте първия турнир, за да организирате групи, срещи и класиране за вашите играчи.
          </p>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Нов турнир</span>
          </Button>
        </div>
      ) : filteredTournaments.length === 0 ? (
        /* Search / Filter Empty State */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-xs">
          <Search className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            Няма намерени турнири, отговарящи на търсенето.
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Опитайте да промените филтрите или ключовите думи за търсене.
          </p>
        </div>
      ) : (
        /* Tournaments Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onEdit={(t) => setEditingTournament(t)}
              onDelete={(id) => {
                const target = tournaments.find((item) => item.id === id) ?? null;
                setDeletingTournament(target);
              }}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || editingTournament) && (
        <TournamentModal
          isOpen={isCreateModalOpen || Boolean(editingTournament)}
          initialData={editingTournament}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTournament(null);
          }}
          onSave={editingTournament ? handleEditSave : handleCreateSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTournament && (
        <DeleteTournamentModal
          isOpen={Boolean(deletingTournament)}
          tournamentTitle={deletingTournament.title}
          onClose={() => setDeletingTournament(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

TournamentsPage.displayName = 'TournamentsPage';
export default TournamentsPage;
