import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-16 md:py-24 text-center my-auto flex flex-col items-center justify-center">
      <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 shadow-sm">
        <FileQuestion className="w-10 h-10" />
      </div>

      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
        Грешка 404
      </span>

      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
        Страницата не е намерена
      </h2>

      <p className="text-base text-gray-500 dark:text-gray-400 mb-8 max-w-md">
        Страницата, която търсите, не съществува или е била преместена на друг адрес.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          to="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Към началната страница</span>
        </Link>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/80 font-medium transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад</span>
        </button>
      </div>
    </div>
  );
};
