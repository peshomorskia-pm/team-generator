import React, { useState, useEffect } from 'react';
import { X, Trophy, Save, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type {
  Tournament,
  TournamentFormat,
  TournamentStatus,
  CreateTournamentInput,
  UpdateTournamentInput,
} from '../../types/tournament';

export interface TournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTournamentInput | UpdateTournamentInput) => Promise<void>;
  initialData?: Tournament | null;
}

const getTodayFormatted = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const TournamentModal: React.FC<TournamentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const isEditMode = Boolean(initialData);

  const [title, setTitle] = useState(initialData ? initialData.title : '');
  const [date, setDate] = useState(
    initialData ? initialData.date.slice(0, 10) : getTodayFormatted()
  );
  const [format, setFormat] = useState<TournamentFormat>(
    initialData ? initialData.format : 'doubles'
  );
  const [status, setStatus] = useState<TournamentStatus>(
    initialData ? initialData.status : 'draft'
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  if (isOpen !== prevIsOpen || initialData !== prevInitialData) {
    setPrevIsOpen(isOpen);
    setPrevInitialData(initialData);
    setTitle(isOpen && initialData ? initialData.title : '');
    setDate(
      isOpen && initialData
        ? initialData.date.slice(0, 10)
        : getTodayFormatted()
    );
    setFormat(isOpen && initialData ? initialData.format : 'doubles');
    setStatus(isOpen && initialData ? initialData.status : 'draft');
    setNotes(isOpen && initialData?.notes ? initialData.notes : '');
    setValidationError(null);
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
    setValidationError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Моля, въведете име на турнира.');
      return;
    }

    const payload: CreateTournamentInput | UpdateTournamentInput = {
      title: trimmedTitle,
      date,
      format,
      status,
      notes: notes.trim() || null,
    };

    try {
      setIsSubmitting(true);
      await onSave(payload);
      onClose();
    } catch {
      // Keep modal open so the user can inspect or retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = isEditMode ? 'Редактиране на турнир' : 'Нов турнир';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-gray-900 dark:text-gray-100 relative transition-all my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tournament-modal-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2
              id="tournament-modal-title"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              {modalTitle}
            </h2>
          </div>
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

        {validationError && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium border border-red-200 dark:border-red-800/40"
          >
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-5">
          {/* Tournament Title */}
          <div>
            <Input
              id="tournament-title"
              type="text"
              label="Име на турнира"
              placeholder="напр. Летен турнир по тенис"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setValidationError(null);
              }}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Tournament Date */}
          <div>
            <label
              htmlFor="tournament-date"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Дата на провеждане
            </label>
            <input
              id="tournament-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Format Selector Pills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Формат
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl">
              <button
                type="button"
                onClick={() => setFormat('doubles')}
                disabled={isSubmitting}
                className={`py-2 px-3 text-sm font-semibold rounded-lg transition-all ${
                  format === 'doubles'
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-pressed={format === 'doubles'}
              >
                По двойки
              </button>
              <button
                type="button"
                onClick={() => setFormat('singles')}
                disabled={isSubmitting}
                className={`py-2 px-3 text-sm font-semibold rounded-lg transition-all ${
                  format === 'singles'
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-pressed={format === 'singles'}
              >
                Поединично
              </button>
            </div>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Статус
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl">
              <button
                type="button"
                onClick={() => setStatus('draft')}
                disabled={isSubmitting}
                className={`py-2 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  status === 'draft'
                    ? 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-pressed={status === 'draft'}
              >
                Чернова
              </button>
              <button
                type="button"
                onClick={() => setStatus('in_progress')}
                disabled={isSubmitting}
                className={`py-2 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  status === 'in_progress'
                    ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-pressed={status === 'in_progress'}
              >
                В ход
              </button>
              <button
                type="button"
                onClick={() => setStatus('completed')}
                disabled={isSubmitting}
                className={`py-2 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  status === 'completed'
                    ? 'bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-pressed={status === 'completed'}
              >
                Приключил
              </button>
            </div>
          </div>

          {/* Notes Area */}
          <div>
            <label
              htmlFor="tournament-notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Бележки
            </label>
            <textarea
              id="tournament-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              placeholder="Допълнителни правила, локация или бележки..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Modal Actions */}
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
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditMode ? 'Запази' : 'Създай'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

TournamentModal.displayName = 'TournamentModal';
