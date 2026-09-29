import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Dices,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-between">
      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 md:pt-16 md:pb-24 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex-1 text-center lg:text-left">
          {/* Badge */}
          <Badge variant="indigo" size="md" icon={Sparkles} className="mb-6">
            Интелигентно разпределяне на играчи
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
            Генерирай{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300">
              балансирани отбори
            </span>{' '}
            за секунди
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
            Перфектният инструмент за футбол, баскетбол, настолни игри и приятелски турнири. Въведи списък с играчи и получи честни, равностойни отбори с един клик.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link
              to="/generator"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Dices className="w-5 h-5 mr-2" />
              <span>Създай отбори</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>

            <Link
              to="/players"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/80 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-all"
            >
              <Users className="w-5 h-5 mr-2 text-indigo-500" />
              <span>Управление на играчи</span>
            </Link>
          </div>
        </div>

        {/* Graphic Element: Team Allocation / Balance Visual */}
        <div className="flex-1 w-full max-w-md lg:max-w-lg relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-2xl opacity-20 dark:opacity-30 -z-10" />

          <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Визуализация на разпределението
              </span>
              <Badge variant="emerald" size="sm">
                Равновесен баланс
              </Badge>
            </div>

            {/* Simulated Teams Visual */}
            <div className="grid grid-cols-2 gap-4">
              {/* Team A */}
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm text-indigo-900 dark:text-indigo-200">Отбор 1</span>
                  <Badge variant="indigo" size="sm">
                    Рейтинг: 14.5
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs text-xs font-medium">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span className="truncate">Иван (★ 5.0)</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs text-xs font-medium">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span className="truncate">Георги (★ 4.5)</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs text-xs font-medium">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">3</span>
                    <span className="truncate">Николай (★ 5.0)</span>
                  </div>
                </div>
              </div>

              {/* Team B */}
              <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm text-purple-900 dark:text-purple-200">Отбор 2</span>
                  <Badge variant="purple" size="sm">
                    Рейтинг: 14.5
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs text-xs font-medium">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span className="truncate">Димитър (★ 5.0)</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs text-xs font-medium">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span className="truncate">Александър (★ 4.5)</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs text-xs font-medium">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">3</span>
                    <span className="truncate">Стефан (★ 5.0)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Bar Indicator */}
            <div className="pt-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                <span>Разпределение по умения</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">100% равенство</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                <div className="bg-indigo-600 h-full w-1/2" />
                <div className="bg-purple-600 h-full w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 border-t border-gray-200/60 dark:border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Всичко необходимо за честна и организирана игра
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Опростен интерфейс с мощни възможности за разпределение и настройки.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Бързо и лесно
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Въведете списък с имена или ги копирайте директно от груповия чат. Разпределянето става моментално само с едно натискане.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Балансирани отбори
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Възможност за разпределение според индивидуалните умения и рейтинг (1-5 звезди). Край на неравностойните състави.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Справедлива игра
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Прозрачен и обективен алгоритъм без фаворитизъм. Презавъртане на отделни отбори и мигновено копиране на резултатите за чат.
            </p>
          </div>
        </div>
      </section>

      {/* Stats / Purpose Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mb-8">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Готови ли сте за следващата игра?
            </h2>
            <p className="mt-2 text-indigo-100 text-sm sm:text-base max-w-xl">
              Започнете сега без нужда от регистрация. Добавете вашите съотборници и създайте перфектните отбори.
            </p>
          </div>
          <Link
            to="/generator"
            className="shrink-0 px-8 py-4 bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer"
          >
            Към Генератора
          </Link>
        </div>
      </section>
    </div>
  );
};
