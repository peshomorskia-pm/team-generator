import React, { useState, useCallback } from 'react';
import { UserPlus, Plus } from 'lucide-react';
import { Button, Input } from '../ui';

export interface GuestInputProps {
  onAddGuest: (name: string) => void;
  disabled?: boolean;
}

export const GuestInput: React.FC<GuestInputProps> = ({ onAddGuest, disabled = false }) => {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;
      onAddGuest(trimmed);
      setValue('');
    },
    [value, onAddGuest]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center space-x-2">
        <UserPlus className="w-5 h-5 text-indigo-500 shrink-0" />
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          Добави гости
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Input
          type="text"
          id="guestNamesInput"
          placeholder="напр. Иван, Петър, Георги"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          containerClassName="flex-1"
          aria-label="Въведете имена на гости"
        />
        <Button
          type="submit"
          disabled={disabled || !value.trim()}
          className="shrink-0 flex items-center justify-center space-x-1 sm:self-stretch"
        >
          <Plus className="w-4 h-4 mr-1" />
          <span>Добави</span>
        </Button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Въведете едно или няколко имена, разделени със запетая (напр. Иван, Петър). Гостите са временни и не се записват в базата данни.
      </p>
    </form>
  );
};
