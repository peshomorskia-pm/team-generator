import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all ${className}`}
    >
      {children}
    </div>
  );
};
