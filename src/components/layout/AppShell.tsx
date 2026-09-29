import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Dices, Moon, Sun } from 'lucide-react';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { useTheme } from '../../hooks/useTheme';

interface AppShellProps {
  children?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-gray-100 transition-colors">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 w-full border-b border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 h-14 flex items-center justify-between transition-colors">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Dices className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight">
            Team Generator
          </span>
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          aria-label={theme === 'dark' ? 'Превключи към светла тема' : 'Превключи към тъмна тема'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </header>

      {/* Desktop Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-8 min-h-[calc(100vh-4rem)] flex flex-col">
        {children || <Outlet />}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};
