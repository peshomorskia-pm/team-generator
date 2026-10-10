import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { X, Search, User, Star, UserPlus } from 'lucide-react';
import { GeneratorPlayer } from '../../types/generator';
import { generateGuestId } from '../../hooks/useTeamGenerator';
import { Button } from '../ui/Button';

export interface TeamSlotPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string | null;
  teamName?: string;
  unassignedPlayers: GeneratorPlayer[];
  onSelectPlayer?: (teamId: string, player: GeneratorPlayer) => void;
  onAssign?: (teamId: string, player: GeneratorPlayer) => void;
  format?: 'singles' | 'doubles';
}

export const TeamSlotPickerModal: React.FC<TeamSlotPickerModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  unassignedPlayers,
  onSelectPlayer,
  onAssign,
  format,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [guestName, setGuestName] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    setGuestName('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return unassignedPlayers;
    const q = searchQuery.toLowerCase().trim();
    return unassignedPlayers.filter((p) => p.name.toLowerCase().includes(q));
  }, [unassignedPlayers, searchQuery]);

  if (!isOpen || !teamId) {
    return null;
  }

  const handleSelect = (player: GeneratorPlayer) => {
    const callback = onSelectPlayer ?? onAssign;
    callback?.(teamId, player);
    handleClose();
  };

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guestName.trim();
    if (!trimmed) return;

    const newGuest: GeneratorPlayer = {
      id: generateGuestId(),
      name: trimmed,
      source: 'guest',
    };

    handleSelect(newGuest);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-picker-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <h2 id="slot-picker-title" className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Избери играч за {teamName || 'отбора'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Затвори"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-700/60 bg-gray-50/50 dark:bg-slate-800/40">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              id="playerSearchInput"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Търсене на играч..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:text-white"
            />
          </div>
        </div>

        {/* Players List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[160px] max-h-[320px]">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => {
              const rating =
                format === 'singles'
                  ? (player.singles_rating ?? player.rating)
                  : format === 'doubles'
                    ? (player.doubles_rating ?? player.rating)
                    : player.rating;

              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => handleSelect(player)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center min-w-0">
                    <User className="w-4 h-4 mr-2.5 text-indigo-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {player.name}
                    </span>
                    {player.source === 'guest' && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">
                        гост
                      </span>
                    )}
                  </div>
                  {rating !== undefined && (
                    <span className="text-xs text-amber-500 font-semibold ml-2 shrink-0 flex items-center">
                      <Star className="w-3 h-3 mr-0.5 fill-current" />
                      {rating}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-center py-6 px-4 text-sm text-gray-500 dark:text-slate-400">
              {searchQuery.trim()
                ? `Няма намерени играчи с име "${searchQuery}".`
                : 'Няма свободни играчи в списъка. Добавете още играчи към активния пул или добавете гост по-долу.'}
            </div>
          )}
        </div>

        {/* Quick Guest Add Form */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-900/60">
          <form onSubmit={handleAddGuest} className="flex gap-2">
            <input
              type="text"
              id="quickGuestNameInput"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Име на нов гост..."
              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!guestName.trim()}
              className="flex items-center cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              <span>+ Гост</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
