import React from 'react';
import { Trophy, Search, Loader2, Users } from 'lucide-react';
import { useRankings } from '../hooks/useRankings';
import { Podium } from '../components/rankings/Podium';
import { RankingsTable } from '../components/rankings/RankingsTable';
import { RankingsMobile } from '../components/rankings/RankingsMobile';
import { Alert } from '../components/ui/Alert';

export const RankingsPage: React.FC = () => {
  const {
    format,
    setFormat,
    searchTerm,
    setSearchTerm,
    rankings,
    rawRankings,
    loading,
    error,
  } = useRankings();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500 fill-amber-400" />
            <span>Класиране</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Таблица на лидерите и ELO рейтинг на играчите
          </p>
        </div>

        {/* Format Selector Pills */}
        <div className="flex items-center rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFormat('singles')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              format === 'singles'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-pressed={format === 'singles'}
          >
            Поединично
          </button>
          <button
            type="button"
            onClick={() => setFormat('doubles')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              format === 'doubles'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-pressed={format === 'doubles'}
          >
            По двойки
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} />
        </div>
      )}

      {/* Podium for Top 3 (Shown when no search term is entered) */}
      {!loading && !searchTerm && rawRankings.length > 0 && (
        <Podium topPlayers={rawRankings.slice(0, 3)} />
      )}

      {/* Search Input Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Търси играч..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-xs transition-all"
            aria-label="Търсене на играч"
          />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm">Зареждане на класирането...</p>
        </div>
      ) : rawRankings.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Все още няма добавени играчи
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Добавете играчи от меню "Играчи", за да започне изчисляването на ранглистата.
          </p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Няма намерени играчи за &ldquo;{searchTerm}&rdquo;.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <RankingsTable rankings={rankings} />
          </div>

          {/* Mobile Cards */}
          <div className="block md:hidden">
            <RankingsMobile rankings={rankings} />
          </div>
        </>
      )}
    </div>
  );
};
