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
    rating: number,
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
  const [rating, setRating] = useState(player ? String(player.rating) : '1200');
  const [singlesRating, setSinglesRating] = useState(
    player ? String(player.singles_rating ?? player.rating ?? 1200) : '1200'
  );
  const [doublesRating, setDoublesRating] = useState(
    player ? String(player.doubles_rating ?? player.rating ?? 1200) : '1200'
  );
  const [nameError, setNameError] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [singlesRatingError, setSinglesRatingError] = useState('');
  const [doublesRatingError, setDoublesRatingError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevPlayer, setPrevPlayer] = useState(player);

  if (isOpen !== prevIsOpen || player !== prevPlayer) {
    setPrevIsOpen(isOpen);
    setPrevPlayer(player);
    setName(isOpen && player ? player.name : '');
    setRating(isOpen && player ? String(player.rating) : '1200');
    setSinglesRating(
      isOpen && player ? String(player.singles_rating ?? player.rating ?? 1200) : '1200'
    );
    setDoublesRating(
      isOpen && player ? String(player.doubles_rating ?? player.rating ?? 1200) : '1200'
    );
    setNameError('');
    setRatingError('');
    setSinglesRatingError('');
    setDoublesRatingError('');
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
    let hasError = false;

    if (!name.trim()) {
      setNameError('Името на играча е задължително.');
      hasError = true;
    } else {
      setNameError('');
    }

    const parsedRating = Number(rating);
    if (rating.trim() === '' || Number.isNaN(parsedRating) || parsedRating < 0) {
      setRatingError('Рейтингът трябва да бъде положително число или 0.');
      hasError = true;
    } else {
      setRatingError('');
    }

    const parsedSingles = Number(singlesRating);
    if (
      singlesRating.trim() === '' ||
      Number.isNaN(parsedSingles) ||
      parsedSingles < 0
    ) {
      setSinglesRatingError(
        'Рейтингът поединично трябва да бъде положително число или 0.'
      );
      hasError = true;
    } else {
      setSinglesRatingError('');
    }

    const parsedDoubles = Number(doublesRating);
    if (
      doublesRating.trim() === '' ||
      Number.isNaN(parsedDoubles) ||
      parsedDoubles < 0
    ) {
      setDoublesRatingError(
        'Рейтингът по двойки трябва да бъде положително число или 0.'
      );
      hasError = true;
    } else {
      setDoublesRatingError('');
    }

    if (hasError) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(name.trim(), parsedRating, parsedSingles, parsedDoubles);
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
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-gray-900 dark:text-gray-100 relative transition-all"
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

          <Input
            id="player-rating"
            type="number"
            min="0"
            step="1"
            label="Общ рейтинг (ELO)"
            placeholder="1200"
            value={rating}
            onChange={(e) => {
              setRating(e.target.value);
              if (ratingError) setRatingError('');
            }}
            disabled={isSubmitting}
            error={ratingError}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="player-singles-rating"
              type="number"
              min="0"
              step="1"
              label="Рейтинг поединично (ELO)"
              placeholder="1200"
              value={singlesRating}
              onChange={(e) => {
                setSinglesRating(e.target.value);
                if (singlesRatingError) setSinglesRatingError('');
              }}
              disabled={isSubmitting}
              error={singlesRatingError}
            />

            <Input
              id="player-doubles-rating"
              type="number"
              min="0"
              step="1"
              label="Рейтинг по двойки (ELO)"
              placeholder="1200"
              value={doublesRating}
              onChange={(e) => {
                setDoublesRating(e.target.value);
                if (doublesRatingError) setDoublesRatingError('');
              }}
              disabled={isSubmitting}
              error={doublesRatingError}
            />
          </div>

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
