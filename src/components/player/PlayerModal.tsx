import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { PlayerRow } from '../../types/database.types';

export interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    rating?: number,
    singlesRating?: number,
    doublesRating?: number
  ) => Promise<void>;
  player?: PlayerRow;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  player,
}) => {
  const [name, setName] = useState(player ? player.name : '');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevPlayer, setPrevPlayer] = useState(player);

  if (isOpen !== prevIsOpen || player !== prevPlayer) {
    setPrevIsOpen(isOpen);
    setPrevPlayer(player);
    setName(isOpen && player ? player.name : '');
    setNameError('');
    setIsSubmitting(false);
  }

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setNameError('Името на играча е задължително.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(
        name.trim(),
        player?.rating ?? 1200,
        player?.singles_rating ?? 1200,
        player?.doubles_rating ?? 1200
      );
      onClose();
    } catch {
      // Keep modal open so the user can inspect or retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = Boolean(player);
  const title = isEditMode ? 'Редактиране на играч' : 'Нов играч';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 text-gray-900 dark:text-gray-100 relative transition-all"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-modal-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <h2
            id="player-modal-title"
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Затвори"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          <Input
            id="player-name"
            label="Име на играча"
            placeholder="напр. Георги Иванов"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            disabled={isSubmitting}
            error={nameError}
            autoFocus
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Отказ
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Запазване...
                </>
              ) : isEditMode ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Запази
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Създай
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
