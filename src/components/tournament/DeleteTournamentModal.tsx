import React, { useState, useEffect } from 'react';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Tournament, TournamentStatus } from '../../types/tournament';

export type DeleteTournamentTarget = Pick<Tournament, 'id' | 'status'> & {
  title?: string;
  name?: string;
};

export interface DeleteTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  tournament?: DeleteTournamentTarget | null;
  /** Backwards compatibility fallback if full tournament entity is not passed */
  tournamentTitle?: string;
  /** Backwards compatibility fallback if tournament object does not specify status */
  tournamentStatus?: TournamentStatus;
  /** External loading state control (optional; component also manages internal state) */
  isDeleting?: boolean;
}

export const DeleteTournamentModal: React.FC<DeleteTournamentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tournament,
  tournamentTitle,
  tournamentStatus: tournamentStatusProp,
  isDeleting: isDeletingProp,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [internalIsDeleting, setInternalIsDeleting] = useState(false);

  const effectiveIsDeleting = isDeletingProp ?? internalIsDeleting;

  const tournamentName =
    tournament?.name || tournament?.title || tournamentTitle || '';
  const tournamentStatus =
    tournament?.status || tournamentStatusProp || 'draft';
  const isDraft = tournamentStatus === 'draft';

  const isConfirmed =
    Boolean(tournamentName.trim()) &&
    confirmationText.trim() === tournamentName.trim();

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setConfirmationText('');
      setInternalIsDeleting(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !effectiveIsDeleting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, effectiveIsDeleting, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = async () => {
    if (!isDraft && !isConfirmed) return;
    try {
      setInternalIsDeleting(true);
      await onConfirm();
      onClose();
    } catch {
      // Keep modal open on failure
    } finally {
      setInternalIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={() => {
        if (!effectiveIsDeleting) {
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
          <div className="flex items-center gap-2">
            {isDraft ? (
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <h2
              id="delete-tournament-modal-title"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              {isDraft ? 'Изтриване на чернова' : 'Необратимо изтриване на турнир'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={effectiveIsDeleting}
            aria-label="Затвори"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isDraft ? (
          <div className="mt-4 space-y-2">
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              {tournamentName ? (
                <>
                  Сигурни ли сте, че искате да изтриете черновата на турнир &quot;{tournamentName}&quot;? Това действие не може да бъде отменено.
                </>
              ) : (
                'Сигурни ли сте, че искате да изтриете тази чернова на турнир? Това действие не може да бъде отменено.'
              )}
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2.5">
              <span>
                ⚠️ Внимание: Този турнир съдържа записани мачове и официални резултати. Изтриването ще премахне турнира и всички свързани мачове завинаги.
              </span>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="tournament-confirm-input"
                className="block text-xs sm:text-sm text-gray-600 dark:text-gray-300"
              >
                За да потвърдите, въведете точното име на турнира:{' '}
                <strong className="font-semibold text-gray-900 dark:text-white">
                  {tournamentName}
                </strong>
              </label>
              <input
                id="tournament-confirm-input"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Въведете името на турнира тук..."
                disabled={effectiveIsDeleting}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={effectiveIsDeleting}
          >
            Отказ
          </Button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDraft ? effectiveIsDeleting : (!isConfirmed || effectiveIsDeleting)}
            className="inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 px-4 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {effectiveIsDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Изтриване...
              </>
            ) : isDraft ? (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Изтрий
              </>
            ) : (
              '🗑️ Изтрий безвъзвратно'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

DeleteTournamentModal.displayName = 'DeleteTournamentModal';
