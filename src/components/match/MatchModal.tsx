import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Swords, Loader2, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PlayerCombobox } from './PlayerCombobox';
import type { PlayerRow } from '../../types/database.types';
import type { MatchDetail, MatchFormData, MatchFormat } from '../../types/matches';

export interface MatchParticipant {
  player_id?: string;
  guest_name?: string;
  name: string;
}

export interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MatchFormData) => Promise<void>;
  match?: MatchDetail;
  availablePlayers?: PlayerRow[];
  initialTeam1?: MatchParticipant[];
  initialTeam2?: MatchParticipant[];
  initialFormat?: MatchFormat;
}

const getTodayFormatted = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const MatchModal: React.FC<MatchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  match,
  availablePlayers = [],
  initialTeam1,
  initialTeam2,
  initialFormat,
}) => {
  const isEditMode = Boolean(match);

  const getInitialDate = () => {
    if (match) {
      return match.played_at.slice(0, 10);
    }
    return getTodayFormatted();
  };

  const getInitialParticipants = (side: 'team_1' | 'team_2'): MatchParticipant[] => {
    if (match) {
      return match.match_players
        .filter((p) => p.team_side === side)
        .map((p) => ({
          player_id: p.player_id ?? undefined,
          guest_name: p.guest_name ?? undefined,
          name: p.players?.name ?? p.guest_name ?? 'Играч',
        }));
    }
    if (side === 'team_1' && initialTeam1) {
      return initialTeam1;
    }
    if (side === 'team_2' && initialTeam2) {
      return initialTeam2;
    }
    return [];
  };

  const getInitialFormat = (): MatchFormat => {
    if (initialFormat) {
      return initialFormat;
    }
    const t1 = initialTeam1?.length ?? (match ? match.match_players.filter((p) => p.team_side === 'team_1').length : 0);
    const t2 = initialTeam2?.length ?? (match ? match.match_players.filter((p) => p.team_side === 'team_2').length : 0);
    if (t1 > 1 || t2 > 1) {
      return 'doubles';
    }
    if (match && (match as { match_format?: MatchFormat }).match_format) {
      return (match as { match_format: MatchFormat }).match_format;
    }
    return 'singles';
  };

  const [format, setFormat] = useState<MatchFormat>(getInitialFormat);
  const [date, setDate] = useState(getInitialDate);
  const [team1Score, setTeam1Score] = useState(
    match && match.team_1_score !== null ? String(match.team_1_score) : ''
  );
  const [team2Score, setTeam2Score] = useState(
    match && match.team_2_score !== null ? String(match.team_2_score) : ''
  );
  const [team1Players, setTeam1Players] = useState<MatchParticipant[]>(() =>
    getInitialParticipants('team_1')
  );
  const [team2Players, setTeam2Players] = useState<MatchParticipant[]>(() =>
    getInitialParticipants('team_2')
  );

  const [guestNameT1, setGuestNameT1] = useState('');
  const [guestNameT2, setGuestNameT2] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevMatch, setPrevMatch] = useState(match);
  const [prevInitialTeam1, setPrevInitialTeam1] = useState(initialTeam1);
  const [prevInitialTeam2, setPrevInitialTeam2] = useState(initialTeam2);
  const [prevInitialFormat, setPrevInitialFormat] = useState(initialFormat);

  if (
    isOpen !== prevIsOpen ||
    match !== prevMatch ||
    initialTeam1 !== prevInitialTeam1 ||
    initialTeam2 !== prevInitialTeam2 ||
    initialFormat !== prevInitialFormat
  ) {
    setPrevIsOpen(isOpen);
    setPrevMatch(match);
    setPrevInitialTeam1(initialTeam1);
    setPrevInitialTeam2(initialTeam2);
    setPrevInitialFormat(initialFormat);
    setFormat(getInitialFormat());
    setDate(getInitialDate());
    setTeam1Score(match && match.team_1_score !== null ? String(match.team_1_score) : '');
    setTeam2Score(match && match.team_2_score !== null ? String(match.team_2_score) : '');
    setTeam1Players(getInitialParticipants('team_1'));
    setTeam2Players(getInitialParticipants('team_2'));
    setGuestNameT1('');
    setGuestNameT2('');
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

  const handleAddPlayer = (teamSide: 'team_1' | 'team_2', playerId: string) => {
    if (!playerId) return;
    const playerObj = availablePlayers.find((p) => p.id === playerId);
    if (!playerObj) return;

    const participant: MatchParticipant = {
      player_id: playerObj.id,
      name: playerObj.name,
    };

    if (teamSide === 'team_1') {
      if (team1Players.some((p) => p.player_id === playerId)) return;
      const nextT1 = [...team1Players, participant];
      setTeam1Players(nextT1);
      if (nextT1.length > 1) {
        setFormat('doubles');
      }
    } else {
      if (team2Players.some((p) => p.player_id === playerId)) return;
      const nextT2 = [...team2Players, participant];
      setTeam2Players(nextT2);
      if (nextT2.length > 1) {
        setFormat('doubles');
      }
    }
    setValidationError(null);
  };

  const handleAddGuest = (teamSide: 'team_1' | 'team_2', name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const participant: MatchParticipant = {
      guest_name: trimmed,
      name: trimmed,
    };

    if (teamSide === 'team_1') {
      const nextT1 = [...team1Players, participant];
      setTeam1Players(nextT1);
      setGuestNameT1('');
      if (nextT1.length > 1) {
        setFormat('doubles');
      }
    } else {
      const nextT2 = [...team2Players, participant];
      setTeam2Players(nextT2);
      setGuestNameT2('');
      if (nextT2.length > 1) {
        setFormat('doubles');
      }
    }
    setValidationError(null);
  };

  const handleRemoveParticipant = (teamSide: 'team_1' | 'team_2', index: number) => {
    if (teamSide === 'team_1') {
      setTeam1Players((prev) => prev.filter((_, i) => i !== index));
    } else {
      setTeam2Players((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleRemovePlayerById = (teamSide: 'team_1' | 'team_2', playerId: string) => {
    if (teamSide === 'team_1') {
      setTeam1Players((prev) => prev.filter((p) => p.player_id !== playerId));
    } else {
      setTeam2Players((prev) => prev.filter((p) => p.player_id !== playerId));
    }
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (team1Players.length === 0 || team2Players.length === 0) {
      setValidationError('Всеки отбор трябва да има поне един играч.');
      return;
    }

    if (format === 'singles') {
      if (team1Players.length !== 1 || team2Players.length !== 1) {
        setValidationError('За поединичен мач всеки отбор трябва да има точно по 1 играч.');
        return;
      }
    } else if (format === 'doubles') {
      if (team1Players.length !== 2 || team2Players.length !== 2) {
        setValidationError('За мач по двойки всеки отбор трябва да има точно по 2 играчи.');
        return;
      }
    }

    // Check player overlap between team 1 and team 2
    const team1PlayerIds = new Set(
      team1Players.filter((p) => p.player_id).map((p) => p.player_id)
    );
    const team2PlayerIds = new Set(
      team2Players.filter((p) => p.player_id).map((p) => p.player_id)
    );

    for (const id of team1PlayerIds) {
      if (team2PlayerIds.has(id)) {
        setValidationError('Играч не може да участва едновременно и в двата отбора.');
        return;
      }
    }

    const team1GuestNames = new Set(
      team1Players.filter((p) => p.guest_name).map((p) => p.guest_name!.toLowerCase())
    );
    const team2GuestNames = new Set(
      team2Players.filter((p) => p.guest_name).map((p) => p.guest_name!.toLowerCase())
    );

    for (const guest of team1GuestNames) {
      if (team2GuestNames.has(guest)) {
        setValidationError('Играч не може да участва едновременно и в двата отбора.');
        return;
      }
    }

    // Date-aware score validation
    const today = getTodayFormatted();
    const isPastDate = date < today;
    const isT1Empty = team1Score.trim() === '';
    const isT2Empty = team2Score.trim() === '';

    let parsedScore1: number | null = null;
    let parsedScore2: number | null = null;

    if (isPastDate) {
      if (isT1Empty || isT2Empty) {
        setValidationError('За минали мачове резултатът е задължителен.');
        return;
      }

      const num1 = Number(team1Score);
      const num2 = Number(team2Score);

      if (Number.isNaN(num1) || Number.isNaN(num2) || num1 < 0 || num2 < 0) {
        setValidationError('Резултатът трябва да бъде 0 или по-голям.');
        return;
      }

      parsedScore1 = num1;
      parsedScore2 = num2;
    } else {
      // Today or future date: scores are optional, but if one is provided both must be valid
      if (isT1Empty && isT2Empty) {
        parsedScore1 = null;
        parsedScore2 = null;
      } else if (isT1Empty || isT2Empty) {
        setValidationError('Моля, въведете резултат и за двата отбора или оставете полетата празни.');
        return;
      } else {
        const num1 = Number(team1Score);
        const num2 = Number(team2Score);

        if (Number.isNaN(num1) || Number.isNaN(num2) || num1 < 0 || num2 < 0) {
          setValidationError('Резултатът трябва да бъде 0 или по-голям.');
          return;
        }

        parsedScore1 = num1;
        parsedScore2 = num2;
      }
    }

    const formData: MatchFormData = {
      match_format: format,
      team_1_score: parsedScore1,
      team_2_score: parsedScore2,
      played_at: new Date(date).toISOString(),
      team_1_players: team1Players.map((p) => ({
        player_id: p.player_id,
        guest_name: p.guest_name,
      })),
      team_2_players: team2Players.map((p) => ({
        player_id: p.player_id,
        guest_name: p.guest_name,
      })),
    };

    try {
      setIsSubmitting(true);
      await onSave(formData);
      onClose();
    } catch {
      // Keep modal open so the user can inspect or retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = isEditMode ? 'Редактиране на мач' : 'Нов мач';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-gray-900 dark:text-gray-100 relative transition-all my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-modal-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 id="match-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
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

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-6">
          {/* Format Selector Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Формат на мача
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setFormat('singles');
                  setValidationError(null);
                }}
                className={`py-2 px-3 text-sm font-semibold rounded-lg transition-all ${
                  format === 'singles'
                    ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-pressed={format === 'singles'}
              >
                Поединично
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormat('doubles');
                  setValidationError(null);
                }}
                className={`py-2 px-3 text-sm font-semibold rounded-lg transition-all ${
                  format === 'doubles'
                    ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-pressed={format === 'doubles'}
              >
                По двойки
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label
              htmlFor="match-date"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Дата на мача
            </label>
            <input
              id="match-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Teams Rosters Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Team 1 Section */}
            <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center justify-between">
                <span>Състав Отбор 1</span>
                <span className="text-xs text-gray-500 font-normal">
                  ({team1Players.length} играчи)
                </span>
              </h3>

              {/* Player Combobox for Registered Players */}
              <PlayerCombobox
                players={availablePlayers}
                selectedIds={team1Players.filter((p) => p.player_id).map((p) => p.player_id!)}
                excludedIds={team2Players.filter((p) => p.player_id).map((p) => p.player_id!)}
                onSelect={(player) => handleAddPlayer('team_1', player.id)}
                onRemove={(playerId) => handleRemovePlayerById('team_1', playerId)}
                ariaLabel="Избери играч за Отбор 1"
                placeholder="Избери играч..."
                disabled={isSubmitting}
              />

              {/* Add Guest */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Име на гост..."
                  value={guestNameT1}
                  onChange={(e) => setGuestNameT1(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  aria-label="Име на гост за Отбор 1"
                />
                <button
                  type="button"
                  onClick={() => handleAddGuest('team_1', guestNameT1)}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm transition-colors"
                  aria-label="Добави гост към Отбор 1"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Selected List */}
              <div className="space-y-1.5 pt-2">
                {team1Players.map((p, idx) => (
                  <div
                    key={`${p.player_id ?? p.guest_name}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{p.name}</span>
                      {p.guest_name && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                          (гост)
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant('team_1', idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      aria-label={`Премахни ${p.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Team 2 Section */}
            <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center justify-between">
                <span>Състав Отбор 2</span>
                <span className="text-xs text-gray-500 font-normal">
                  ({team2Players.length} играчи)
                </span>
              </h3>

              {/* Player Combobox for Registered Players */}
              <PlayerCombobox
                players={availablePlayers}
                selectedIds={team2Players.filter((p) => p.player_id).map((p) => p.player_id!)}
                excludedIds={team1Players.filter((p) => p.player_id).map((p) => p.player_id!)}
                onSelect={(player) => handleAddPlayer('team_2', player.id)}
                onRemove={(playerId) => handleRemovePlayerById('team_2', playerId)}
                ariaLabel="Избери играч за Отбор 2"
                placeholder="Избери играч..."
                disabled={isSubmitting}
              />

              {/* Add Guest */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Име на гост..."
                  value={guestNameT2}
                  onChange={(e) => setGuestNameT2(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  aria-label="Име на гост за Отбор 2"
                />
                <button
                  type="button"
                  onClick={() => handleAddGuest('team_2', guestNameT2)}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm transition-colors"
                  aria-label="Добави гост към Отбор 2"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Selected List */}
              <div className="space-y-1.5 pt-2">
                {team2Players.map((p, idx) => (
                  <div
                    key={`${p.player_id ?? p.guest_name}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{p.name}</span>
                      {p.guest_name && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                          (гост)
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant('team_2', idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      aria-label={`Премахни ${p.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scores Section */}
          <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="font-bold text-gray-900 dark:text-white text-sm">
                Краен резултат
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                (незадължителен за днес и бъдещи мачове)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="team-1-score"
                type="number"
                min="0"
                step="1"
                label="Резултат Отбор 1"
                placeholder="-"
                value={team1Score}
                onChange={(e) => {
                  setTeam1Score(e.target.value);
                  setValidationError(null);
                }}
                disabled={isSubmitting}
              />
              <Input
                id="team-2-score"
                type="number"
                min="0"
                step="1"
                label="Резултат Отбор 2"
                placeholder="-"
                value={team2Score}
                onChange={(e) => {
                  setTeam2Score(e.target.value);
                  setValidationError(null);
                }}
                disabled={isSubmitting}
              />
            </div>
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
