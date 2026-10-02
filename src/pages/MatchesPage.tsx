import React, { useState, useMemo } from 'react';
import { Swords, Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { MatchesStatSummary } from '../components/match/MatchesStatSummary';
import { MatchCard } from '../components/match/MatchCard';
import { MatchModal } from '../components/match/MatchModal';
import { DeleteMatchModal } from '../components/match/DeleteMatchModal';
import { useMatches } from '../hooks/useMatches';
import { usePlayers } from '../hooks/usePlayers';
import type { MatchDetail, MatchFormData } from '../types/matches';

export const MatchesPage: React.FC = () => {
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

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchDetail | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<MatchDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredMatches = useMemo(() => {
    if (!searchQuery.trim()) return matches;
    const query = searchQuery.toLowerCase().trim();
    return matches.filter((m) =>
      m.match_players.some(
        (p) =>
          p.players?.name?.toLowerCase().includes(query) ||
          p.guest_name?.toLowerCase().includes(query)
      )
    );
  }, [matches, searchQuery]);

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

      {/* Alert Notification */}
      {alert && (
        <div className="mb-6">
          <Alert type={alert.type} message={alert.message} onDismiss={clearAlert} />
        </div>
      )}

      {/* Stat Summary Widgets */}
      <MatchesStatSummary matches={matches} />

      {/* Search Bar */}
      <div className="mb-6 relative">
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
            Няма намерени мачове за &ldquo;{searchQuery}&rdquo;.
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
