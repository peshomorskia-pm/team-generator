import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Ban, CheckSquare, Square } from 'lucide-react';
import type { PlayerRow } from '../../types/database.types';

export interface ComboboxPlayer {
  id: string;
  name: string;
  rating?: number;
}

export interface PlayerComboboxProps {
  players: (PlayerRow | ComboboxPlayer)[];
  selectedIds: string[];
  excludedIds: string[];
  onSelect: (player: PlayerRow | ComboboxPlayer) => void;
  onRemove?: (playerId: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  disabled?: boolean;
}

export const PlayerCombobox: React.FC<PlayerComboboxProps> = ({
  players,
  selectedIds,
  excludedIds,
  onSelect,
  onRemove,
  placeholder = 'Търси и избери играч...',
  ariaLabel = 'Избери играч',
  id,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPlayers = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return players;
    return players.filter((p) => p.name.toLowerCase().includes(trimmed));
  }, [players, query]);

  const handleItemClick = (player: PlayerRow | ComboboxPlayer) => {
    if (excludedIds.includes(player.id)) {
      return;
    }
    if (selectedIds.includes(player.id)) {
      if (onRemove) {
        onRemove(player.id);
      }
    } else {
      onSelect(player);
    }
    // Do NOT close dropdown so user can select multiple players in one go
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Превключи списък с играчи"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-30 w-full mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1 focus:outline-none"
        >
          {filteredPlayers.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              Няма намерени играчи
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const isSelected = selectedIds.includes(player.id);
              const isExcluded = excludedIds.includes(player.id);

              return (
                <button
                  key={player.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={isExcluded}
                  onClick={() => handleItemClick(player)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                    isExcluded
                      ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50 text-gray-400'
                      : isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer'
                        : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-gray-900 dark:text-gray-100 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {isExcluded ? (
                      <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : isSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                    )}
                    <span className={`truncate ${isSelected ? 'font-semibold text-emerald-900 dark:text-emerald-200' : ''}`}>
                      {player.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs shrink-0">
                    {isExcluded && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        в другия отбор
                      </span>
                    )}
                    {isSelected && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        избран
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
          {filteredPlayers.length > 0 && (
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800/95 backdrop-blur-xs px-3 py-1.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Избрани: {selectedIds.length}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-0.5 rounded cursor-pointer"
              >
                Готово
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
