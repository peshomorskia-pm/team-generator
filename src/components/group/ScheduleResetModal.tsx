import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ScheduleResetModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ScheduleResetModal: React.FC<ScheduleResetModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-gray-900 dark:text-gray-100 relative transition-all"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-reset-modal-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2
              id="schedule-reset-modal-title"
              className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white"
            >
              Предупреждение за промяна на групите
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Затвори"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
            Внимание: Програмата на мачовете вече е генерирана. Промяната на отборите в групите ще изисква ново генериране на срещите. Желаете ли да продължите?
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Отказ
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 px-4 py-2.5 text-sm bg-amber-600 hover:bg-amber-700 text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 shadow-sm cursor-pointer"
          >
            Продължи
          </button>
        </div>
      </div>
    </div>
  );
};

ScheduleResetModal.displayName = 'ScheduleResetModal';
export default ScheduleResetModal;
