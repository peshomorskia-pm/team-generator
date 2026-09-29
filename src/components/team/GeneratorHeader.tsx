import React from 'react';

interface GeneratorHeaderProps {
  title?: string;
  subtitle?: string;
}

export const GeneratorHeader: React.FC<GeneratorHeaderProps> = ({
  title = 'Генератор на Отбори 🎲',
  subtitle = 'Въведете списък с играчи и ги разпределете на случаен принцип.',
}) => {
  return (
    <div className="bg-indigo-600 px-6 py-8 sm:p-10 text-center">
      <h1 className="text-3xl font-extrabold text-white tracking-tight">{title}</h1>
      <p className="mt-2 text-indigo-100 text-sm sm:text-base">{subtitle}</p>
    </div>
  );
};
