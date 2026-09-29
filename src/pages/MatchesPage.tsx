import React from 'react';
import { Link } from 'react-router-dom';
import { Swords, Dices, Clock } from 'lucide-react';

export const MatchesPage: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Мачове
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Следене на срещи, резултати и история на двубоите
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <Swords className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>В процес на разработка</span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Модулът за мачове очаква старт
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
          Скоро тук ще можете да организирате мачове между генерираните отбори, да записвате резултати и да преглеждате архив на изиграните двубои.
        </p>

        <Link
          to="/generator"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors cursor-pointer"
        >
          <Dices className="w-4 h-4" />
          <span>Генерирай отбори за мач</span>
        </Link>
      </div>
    </div>
  );
};
