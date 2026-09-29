import React from 'react';
import { NavLink } from 'react-router-dom';
import { Dices, Home, Trophy, Users, Swords } from 'lucide-react';

interface MobileNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

export const MobileNav: React.FC = () => {
  const navItems: MobileNavItem[] = [
    { to: '/', label: 'Начало', icon: Home, end: true },
    { to: '/generator', label: 'Генератор', icon: Dices },
    { to: '/players', label: 'Играчи', icon: Users },
    { to: '/matches', label: 'Мачове', icon: Swords },
    { to: '/rankings', label: 'Класиране', icon: Trophy },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 transition-colors safe-area-bottom"
      aria-label="Мобилна навигация"
    >
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 mb-1 transition-transform ${
                      isActive ? 'scale-110' : ''
                    }`}
                  />
                  <span className="text-[10px] leading-tight font-medium tracking-tight">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
