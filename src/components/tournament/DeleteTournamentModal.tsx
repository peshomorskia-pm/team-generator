import React, { useState, useEffect } from 'react';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

export interface DeleteTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  tournamentTitle?: string;
}

export const DeleteTournamentModal: React.FC<DeleteTournamentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tournamentTitle,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onClose();
    } catch {
      // Keep modal open on failure
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={() => {
        if (!isDeleting) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-gray-900 dark:text-gray-100 relative transition-all"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-tournament-modal-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2
              id="delete-tournament-modal-title"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Изтриване на турнир
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Затвори"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            {tournamentTitle ? (
              <>
                Сигурни ли сте, че искате да изтриете турнира{' '}
                <strong className="font-semibold text-gray-900 dark:text-white">
                  {tournamentTitle}
                </strong>
                ?
              </>
            ) : (
              'Сигурни ли сте, че искате да изтриете този турнир?'
            )}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Това действие е необратимо и ще премахне турнира от базата данни.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Отказ
          </Button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 px-4 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Изтриване...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Изтриване
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

DeleteTournamentModal.displayName = 'DeleteTournamentModal';
