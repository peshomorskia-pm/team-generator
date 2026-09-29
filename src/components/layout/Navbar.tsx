import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Dices, Moon, Sun, Home, Users, Swords, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { NavItem } from '../../types';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const navItems: (NavItem & { icon: LucideIcon })[] = [
    { href: '/', name: 'Начало', icon: Home, end: true },
    { href: '/generator', name: 'Генератор', icon: Dices, end: false },
    { href: '/players', name: 'Играчи', icon: Users, end: false },
    { href: '/matches', name: 'Мачове', icon: Swords, end: false },
    { href: '/rankings', name: 'Класиране', icon: Trophy, end: false },
  ];

  return (
    <header className="hidden md:block sticky top-0 z-40 w-full border-b border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Dices className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight block leading-tight">
                Team Generator
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 block leading-none">
                Генератор на Отбори
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="flex items-center space-x-1" aria-label="Основна навигация">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.end}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/80'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Theme Toggle Button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 flex items-center space-x-2 text-xs font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
              aria-label={theme === 'dark' ? 'Превключи към светла тема' : 'Превключи към тъмна тема'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden lg:inline">Светла тема</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span className="hidden lg:inline">Тъмна тема</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
