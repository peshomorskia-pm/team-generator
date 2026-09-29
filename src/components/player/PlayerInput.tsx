import React, { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { PlayerInputProps as BasePlayerInputProps } from '../../types';

export interface PlayerInputProps extends BasePlayerInputProps {
  value?: string;
  onChange?: (val: string) => void;
  playerCount?: number;
}

export const PlayerInput: React.FC<PlayerInputProps> = ({
  onAddPlayer,
  isLoading = false,
  value,
  onChange,
  playerCount = 0,
}) => {
  const [singleName, setSingleName] = useState('');
  const [singleRating, setSingleRating] = useState<string>('');
  const [showSingleInput, setShowSingleInput] = useState(false);

  const handleSingleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;
    const ratingNum = singleRating.trim() !== '' ? parseFloat(singleRating) : undefined;
    onAddPlayer(singleName.trim(), ratingNum);
    setSingleName('');
    setSingleRating('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="playersList" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Списък с играчи
        </label>
        <button
          type="button"
          onClick={() => setShowSingleInput(!showSingleInput)}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center font-medium"
        >
          <UserPlus className="w-3.5 h-3.5 mr-1" />
          {showSingleInput ? 'Скрий бързо добавяне' : '+ Бързо добавяне с рейтинг'}
        </button>
      </div>

      {showSingleInput && (
        <form
          onSubmit={handleSingleAdd}
          className="flex flex-col sm:flex-row gap-2 p-3 bg-indigo-50/60 dark:bg-slate-700/40 rounded-xl border border-indigo-100 dark:border-slate-600"
        >
          <input
            type="text"
            placeholder="Име на играч..."
            value={singleName}
            onChange={(e) => setSingleName(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number"
            placeholder="Рейтинг (напр. 7)"
            value={singleRating}
            onChange={(e) => setSingleRating(e.target.value)}
            disabled={isLoading}
            className="w-full sm:w-36 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !singleName.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-sm rounded-lg font-medium flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-1" />
            Добави
          </button>
        </form>
      )}

      <div>
        <textarea
          id="playersList"
          rows={6}
          disabled={isLoading}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={`Въведете по едно име на ред...\nПример:\nИван\nПетър (8)\nГеорги (6)\n...или просто въведете числа от 1 до 10`}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-y text-sm sm:text-base"
        />
        <div className="mt-2 text-xs flex justify-between items-center text-gray-500 dark:text-gray-400">
          <span>Всеки нов ред е отделен играч. Поддържа и рейтинг: Име (рейтинг)</span>
          <span
            className={
              playerCount > 0
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-gray-500 dark:text-gray-400'
            }
          >
            {playerCount} въведени
          </span>
        </div>
      </div>
    </div>
  );
};
