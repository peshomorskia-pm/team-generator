import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { X, Search, Users, User, Star } from 'lucide-react';
import type { Team } from '../../types';
import { Badge } from '../ui/Badge';

export interface GroupTeamPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | null;
  groupName?: string;
  unassignedTeams: Team[];
  onSelectTeam: (groupId: string, team: Team) => void;
  format?: 'singles' | 'doubles';
}

export const GroupTeamPickerModal: React.FC<GroupTeamPickerModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  unassignedTeams,
  onSelectTeam,
  format,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setSearchQuery('');
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

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return unassignedTeams;
    const q = searchQuery.toLowerCase().trim();
    return unassignedTeams.filter((t) => {
      if (t.name.toLowerCase().includes(q)) return true;
      if (t.players.some((p) => p.name.toLowerCase().includes(q))) return true;
      if (t.totalRating !== undefined && String(t.totalRating).includes(q)) return true;
      return false;
    });
  }, [unassignedTeams, searchQuery]);

  if (!isOpen || !groupId) {
    return null;
  }

  const handleSelect = (team: Team) => {
    onSelectTeam(groupId, team);
    handleClose();
  };

  const titleText = groupName ? `Избери отбор за ${groupName}` : 'Избери отбор за групата';

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
        aria-labelledby="group-team-picker-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 to-purple-50/60 dark:from-slate-800 dark:to-slate-800">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3
                id="group-team-picker-title"
                className="font-bold text-gray-900 dark:text-white text-base"
              >
                {titleText}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {unassignedTeams.length === 1
                  ? '1 свободен отбор'
                  : `${unassignedTeams.length} свободни отбора`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Затвори"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Търси по име на отбор или играч..."
              aria-label="Търсене на отбор"
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* Team List */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {filteredTeams.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery.trim()
                ? `Няма намерени отбори с име "${searchQuery}".`
                : 'Няма налични свободни отбори за разпределение.'}
            </div>
          ) : (
            filteredTeams.map((team) => {
              const displayTotalRating = (() => {
                if (team.totalRating !== undefined && team.totalRating > 0 && !format) {
                  return team.totalRating;
                }
                const sum = team.players.reduce((acc, p) => {
                  const r =
                    format === 'singles'
                      ? (p.singles_rating ?? p.rating ?? 0)
                      : format === 'doubles'
                        ? (p.doubles_rating ?? p.rating ?? 0)
                        : (p.rating ?? 0);
                  return acc + r;
                }, 0);
                return sum > 0 ? sum : team.totalRating;
              })();

              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => handleSelect(team)}
                  data-testid={`select-team-${team.id}`}
                  className="w-full text-left p-3.5 rounded-xl border border-gray-100 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-slate-800 hover:bg-indigo-50/40 dark:hover:bg-slate-700/50 transition-all flex flex-col gap-2 group cursor-pointer shadow-2xs hover:shadow-sm"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {team.name}
                    </span>
                    {displayTotalRating !== undefined && displayTotalRating > 0 && (
                      <Badge variant="amber" size="sm" icon={Star}>
                        {displayTotalRating}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {team.players.map((p) => {
                      const playerRating =
                        format === 'singles'
                          ? (p.singles_rating ?? p.rating)
                          : format === 'doubles'
                            ? (p.doubles_rating ?? p.rating)
                            : p.rating;

                      return (
                        <span
                          key={p.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                        >
                          <User className="w-3 h-3 mr-1 text-indigo-400" />
                          <span>{p.name}</span>
                          {playerRating !== undefined && (
                            <span className="ml-1 text-amber-500 font-medium">
                              ★{playerRating}
                            </span>
                          )}
                        </span>
                      );
                    })}
                    {team.players.length === 0 && (
                      <span className="text-xs text-gray-400 italic">
                        Няма играчи в отбора
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
