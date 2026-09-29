import React from 'react';
import { User, X, Star } from 'lucide-react';
import { Player } from '../../types';

interface PlayerListProps {
  players: Player[];
  onRemovePlayer?: (id: string) => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, onRemovePlayer }) => {
  if (players.length === 0) {
    return null;
  }

  return (
    <div className="pt-2">
      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700">
        {players.map((player) => (
          <div
            key={player.id}
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-600 shadow-sm"
          >
            <User className="w-3 h-3 mr-1 text-indigo-500" />
            <span className="max-w-[120px] truncate">{player.name}</span>
            {player.rating !== undefined && (
              <span className="ml-1 inline-flex items-center text-amber-500 dark:text-amber-400 font-bold">
                <Star className="w-3 h-3 fill-current inline mr-0.5" />
                {player.rating}
              </span>
            )}
            {onRemovePlayer && (
              <button
                type="button"
                onClick={() => onRemovePlayer(player.id)}
                className="ml-1.5 text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                aria-label={`Премахни ${player.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
