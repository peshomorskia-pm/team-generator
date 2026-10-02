import React, { useState, useMemo, useCallback } from 'react';
import { Search, Star, Users, CheckSquare, Square, X } from 'lucide-react';
import { PlayerRow } from '../../types/database.types';
import { Badge, Input, Button } from '../ui';

export interface PlayerSelectorProps {
  players: PlayerRow[];
  selectedIds: Set<string>;
  onTogglePlayer: (player: PlayerRow) => void;
  onSelectAll?: (playersToSelect: PlayerRow[]) => void;
  onDeselectAll?: (playersToDeselect: PlayerRow[]) => void;
  loading?: boolean;
  error?: string | null;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  players,
  selectedIds,
  onTogglePlayer,
  onSelectAll,
  onDeselectAll,
  loading = false,
  error = null,
  searchTerm,
  onSearchChange,
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const search = searchTerm !== undefined ? searchTerm : internalSearch;

  const handleSearchChange = useCallback(
    (val: string) => {
      if (onSearchChange) {
        onSearchChange(val);
      } else {
        setInternalSearch(val);
      }
    },
    [onSearchChange]
  );

  const filteredPlayers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return players;
    return players.filter((p) => p.name.toLowerCase().includes(term));
  }, [players, search]);

  const allFilteredSelected = useMemo(() => {
    if (filteredPlayers.length === 0) return false;
    return filteredPlayers.every((p) => selectedIds.has(p.id));
  }, [filteredPlayers, selectedIds]);

  const handleSelectAll = useCallback(() => {
    if (onSelectAll) {
      const unselected = filteredPlayers.filter((p) => !selectedIds.has(p.id));
      onSelectAll(unselected);
    } else {
      filteredPlayers.forEach((p) => {
        if (!selectedIds.has(p.id)) {
          onTogglePlayer(p);
        }
      });
    }
  }, [filteredPlayers, selectedIds, onSelectAll, onTogglePlayer]);

  const handleDeselectAll = useCallback(() => {
    if (onDeselectAll) {
      const selected = filteredPlayers.filter((p) => selectedIds.has(p.id));
      onDeselectAll(selected);
    } else {
      filteredPlayers.forEach((p) => {
        if (selectedIds.has(p.id)) {
          onTogglePlayer(p);
        }
      });
    }
  }, [filteredPlayers, selectedIds, onDeselectAll, onTogglePlayer]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-indigo-500 shrink-0" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            Регистрирани играчи
          </h3>
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Избрани: {players.filter((p) => selectedIds.has(p.id)).length} от {players.length}
        </span>
      </div>

      <div className="relative">
        <Input
          type="text"
          id="registeredPlayersSearch"
          label="Списък с играчи"
          placeholder="Търсене на играчи..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          disabled={loading}
          className="pl-9 pr-9"
          aria-label="Списък с играчи"
        />
        <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-10 pointer-events-none" />
        {search.trim().length > 0 && !loading && (
          <button
            type="button"
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5 rounded focus:outline-none"
            aria-label="Изчисти търсенето"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {players.length > 0 && (
        <div className="flex items-center justify-between text-xs pt-1 pb-1">
          <span className="text-gray-500 dark:text-gray-400">
            {filteredPlayers.length} {filteredPlayers.length === 1 ? 'играч' : 'играчи'}
          </span>
          <div className="flex items-center space-x-2">
            {!allFilteredSelected ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="!px-2 !py-1 text-xs text-indigo-600 dark:text-indigo-400"
              >
                <CheckSquare className="w-3.5 h-3.5 mr-1" />
                Избери всички
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                className="!px-2 !py-1 text-xs text-indigo-600 dark:text-indigo-400"
              >
                <Square className="w-3.5 h-3.5 mr-1" />
                Премахни всички
              </Button>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
          Зареждане на играчи...
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-4 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl p-3 border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      {!loading && !error && players.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-700">
          Няма регистрирани играчи в базата данни.
        </div>
      )}

      {!loading && !error && players.length > 0 && filteredPlayers.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-700">
          Няма намерени играчи за &quot;{search}&quot;.
        </div>
      )}

      {!loading && !error && filteredPlayers.length > 0 && (
        <div className="max-h-60 overflow-y-auto space-y-1 pr-1 border border-gray-100 dark:border-slate-700/60 rounded-xl p-1 bg-gray-50/50 dark:bg-slate-800/30">
          {filteredPlayers.map((player) => {
            const isSelected = selectedIds.has(player.id);
            return (
              <label
                key={player.id}
                htmlFor={`player-checkbox-${player.id}`}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors text-sm ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800'
                    : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-100 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <input
                    type="checkbox"
                    id={`player-checkbox-${player.id}`}
                    aria-label={player.name}
                    checked={isSelected}
                    onChange={() => onTogglePlayer(player)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 dark:border-slate-600 cursor-pointer"
                  />
                  <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                    {player.name}
                  </span>
                </div>
                <Badge variant="amber" size="sm" icon={Star} className="ml-2 shrink-0">
                  {player.rating}
                </Badge>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};
