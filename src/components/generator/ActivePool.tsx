import React, { useMemo } from 'react';
import { User, X, Star, Users, Trash2 } from 'lucide-react';
import { GeneratorPlayer } from '../../types/generator';
import { Badge, Button } from '../ui';

export interface ActivePoolProps {
  activePool: GeneratorPlayer[];
  onRemovePlayer: (id: string) => void;
  onClearPool?: () => void;
}

export const ActivePool: React.FC<ActivePoolProps> = ({
  activePool,
  onRemovePlayer,
  onClearPool,
}) => {
  const registeredCount = useMemo(
    () => activePool.filter((p) => p.source === 'registered').length,
    [activePool]
  );
  const guestCount = useMemo(
    () => activePool.filter((p) => p.source === 'guest').length,
    [activePool]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-indigo-500 shrink-0" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            Активен състав
          </h3>
          <Badge variant="indigo" size="sm">
            {activePool.length}
          </Badge>
        </div>

        {onClearPool && activePool.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearPool}
            className="!px-2 !py-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Изчисти всички
          </Button>
        )}
      </div>

      {activePool.length > 0 && (
        <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{registeredCount} регистрирани</span>
          <span>•</span>
          <span>{guestCount} гости</span>
        </div>
      )}

      {activePool.length === 0 ? (
        <div className="text-center py-8 px-4 text-sm text-gray-400 dark:text-gray-500 bg-gray-50/70 dark:bg-slate-800/40 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
          Няма избрани играчи. Изберете регистрирани играчи или добавете гости, за да започнете.
        </div>
      ) : (
        <div
          data-testid="active-pool-list"
          className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-2.5 bg-gray-50/70 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-700"
        >
          {activePool.map((player) => {
            const isRegistered = player.source === 'registered';

            return (
              <Badge
                key={player.id}
                variant={isRegistered ? 'indigo' : 'slate'}
                size="md"
                data-testid={`player-badge-${player.id}`}
                className="shadow-sm border border-gray-200/80 dark:border-slate-700 flex items-center space-x-1 py-1 px-2.5"
              >
                <User
                  className={`w-3.5 h-3.5 mr-1 shrink-0 ${
                    isRegistered ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                  }`}
                />
                <span className="max-w-[130px] truncate font-medium">{player.name}</span>

                {isRegistered ? (
                  player.rating !== undefined && (
                    <span className="ml-1.5 inline-flex items-center text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      <Star className="w-3 h-3 fill-current inline mr-0.5" />
                      {player.rating}
                    </span>
                  )
                ) : (
                  <span className="ml-1.5 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    Гост
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onRemovePlayer(player.id)}
                  className="ml-2 -mr-1 p-0.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full focus:outline-none cursor-pointer"
                  aria-label={`Премахни ${player.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};
