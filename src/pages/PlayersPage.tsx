import React, { useState, useMemo } from 'react';
import { UserPlus, Search, Pencil, Trash2, Users, Loader2 } from 'lucide-react';
import { usePlayers } from '../hooks/usePlayers';
import { PlayerModal } from '../components/player/PlayerModal';
import { DeletePlayerModal } from '../components/player/DeletePlayerModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import type { PlayerRow } from '../types/database.types';

export const getRatingBadgeVariant = (
  rating: number
): 'emerald' | 'indigo' | 'amber' | 'slate' => {
  if (rating >= 1500) return 'emerald';
  if (rating >= 1300) return 'indigo';
  if (rating >= 1100) return 'amber';
  return 'slate';
};

export const PlayersPage: React.FC = () => {
  const {
    players,
    loading,
    alert,
    createPlayer,
    updatePlayer,
    deletePlayer,
    clearAlert,
  } = usePlayers();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerRow | undefined>(undefined);
  const [deletingPlayer, setDeletingPlayer] = useState<PlayerRow | undefined>(undefined);

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) {
      return players;
    }
    const query = searchQuery.trim().toLowerCase();
    return players.filter((player) => player.name.toLowerCase().includes(query));
  }, [players, searchQuery]);

  const handleSavePlayer = async (
    name: string,
    rating: number,
    singlesRating?: number,
    doublesRating?: number
  ) => {
    if (editingPlayer) {
      await updatePlayer(
        editingPlayer.id,
        name,
        rating,
        singlesRating,
        doublesRating
      );
      setEditingPlayer(undefined);
    } else {
      await createPlayer(name, rating, singlesRating, doublesRating);
      setIsCreateModalOpen(false);
    }
  };

  const handleDeletePlayer = async () => {
    if (deletingPlayer) {
      await deletePlayer(deletingPlayer.id);
      setDeletingPlayer(undefined);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Alert Area */}
      {alert && (
        <div className="mb-6">
          <Alert
            type={alert.type}
            message={alert.message}
            onDismiss={clearAlert}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Играчи
          </h1>
          <Badge variant="indigo" size="md">
            {players.length} {players.length === 1 ? 'играч' : 'играчи'}
          </Badge>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Нов играч
        </Button>
      </div>

      {/* Search Section */}
      <div className="mt-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <Input
            id="player-search"
            type="text"
            placeholder="Търсене по име на играч..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Търсене по име на играч"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-6">
        {loading && players.length === 0 ? (
          <div
            role="status"
            aria-label="Зареждане"
            className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400"
          >
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm">Зареждане на играчите...</p>
          </div>
        ) : players.length === 0 ? (
          <Card className="p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Няма добавени играчи
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Все още няма въведени играчи в базата данни. Добавете първия участник, за да започнете.
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Добави първия играч
              </Button>
            </div>
          </Card>
        ) : filteredPlayers.length === 0 ? (
          <Card className="p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Няма намерени играчи
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Не са открити резултати, отговарящи на &quot;{searchQuery}&quot;.
            </p>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs bg-white dark:bg-slate-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-900/50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Играч
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Рейтинг
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredPlayers.map((player) => (
                    <tr
                      key={player.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {player.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={getRatingBadgeVariant(
                              player.singles_rating ?? player.rating
                            )}
                            size="md"
                          >
                            🎾 {player.singles_rating ?? player.rating} ELO
                          </Badge>
                          <Badge
                            variant={getRatingBadgeVariant(
                              player.doubles_rating ?? player.rating
                            )}
                            size="md"
                          >
                            👥 {player.doubles_rating ?? player.rating} ELO
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingPlayer(player)}
                            aria-label={`Редактирай ${player.name}`}
                            className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingPlayer(player)}
                            aria-label={`Изтрий ${player.name}`}
                            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid gap-3">
              {filteredPlayers.map((player) => (
                <Card
                  key={player.id}
                  className="p-4 flex items-center justify-between border border-gray-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {player.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={getRatingBadgeVariant(
                            player.singles_rating ?? player.rating
                          )}
                          size="sm"
                        >
                          🎾 {player.singles_rating ?? player.rating} ELO
                        </Badge>
                        <Badge
                          variant={getRatingBadgeVariant(
                            player.doubles_rating ?? player.rating
                          )}
                          size="sm"
                        >
                          👥 {player.doubles_rating ?? player.rating} ELO
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => setEditingPlayer(player)}
                      aria-label={`Редактирай ${player.name}`}
                      className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingPlayer(player)}
                      aria-label={`Изтрий ${player.name}`}
                      className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <PlayerModal
        isOpen={isCreateModalOpen || Boolean(editingPlayer)}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPlayer(undefined);
        }}
        onSave={handleSavePlayer}
        player={editingPlayer}
      />

      <DeletePlayerModal
        isOpen={Boolean(deletingPlayer)}
        onClose={() => setDeletingPlayer(undefined)}
        onConfirm={handleDeletePlayer}
        playerName={deletingPlayer?.name ?? ''}
      />
    </div>
  );
};
