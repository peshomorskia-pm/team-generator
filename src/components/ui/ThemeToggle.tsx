import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  className = '',
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/80 transition-colors cursor-pointer flex items-center ${
        showLabel ? 'px-3 py-1.5 space-x-2 text-xs font-medium shadow-sm' : 'p-2'
      } ${className}`}
      aria-label={theme === 'dark' ? 'Превключи към светла тема' : 'Превключи към тъмна тема'}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          {showLabel && <span className="hidden lg:inline">Светла тема</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-slate-600" />
          {showLabel && <span className="hidden lg:inline">Тъмна тема</span>}
        </>
      )}
    </button>
  );
};

ThemeToggle.displayName = 'ThemeToggle';
