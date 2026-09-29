import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`min-h-screen text-gray-800 dark:text-gray-100 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-start ${className}`}
    >
      {children}
    </div>
  );
};
