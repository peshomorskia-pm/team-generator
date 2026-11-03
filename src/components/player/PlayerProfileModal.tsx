import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, Swords, Trophy } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { FormBadge } from '../rankings/FormBadge';
import {
  calculatePlayerProfileData,
  type PlayerProfileData,
} from '../../utils/playerProfileStats';
import type { MatchDetail } from '../../types/matches';
import type { Tournament } from '../../types/tournament';

export type PlayerProfileFormatTab = 'all' | 'doubles' | 'singles';

export interface PlayerProfileModalProps {
  /** Controls modal visibility */
  isOpen: boolean;

  /** Callback invoked when closing via button, backdrop, or Escape key */
  onClose: () => void;

  /** Target player identifier */
  playerId: string | null;

  /** Optional target player display name (fallback: 'Играч') */
  playerName?: string;

  /** Optional convenience player object for alternative invocation */
  player?: { id: string; name: string } | null;

  /** Optional pre-computed profile data (avoids recalculation) */
  profileData?: PlayerProfileData | null;

  /** Fallback raw matches to calculate profileData on-the-fly when omitted */
  matches?: MatchDetail[];

  /** Fallback tournament dictionary or list for stage & title resolution */
  tournaments?: Map<string, Tournament> | Tournament[];

  /** Doubles leaderboard rank (e.g. 1 -> "#1 по двойки") */
  doublesRank?: number | null;

  /** Singles leaderboard rank (e.g. 2 -> "#2 поединично") */
  singlesRank?: number | null;
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getStageLabel(stage?: string): string | undefined {
  if (!stage) return undefined;
  switch (stage) {
    case 'final':
      return 'Финал';
    case 'semi_final':
      return 'Полуфинал';
    case 'quarter_final':
      return '1/4-финал';
    case 'group':
      return 'Групова фаза';
    default:
      return stage;
  }
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  playerId,
  playerName,
  player,
  profileData,
  matches,
  tournaments,
  doublesRank,
  singlesRank,
}) => {
  const effectivePlayerId = playerId ?? player?.id ?? null;
  const effectivePlayerName = playerName ?? player?.name ?? 'Играч';

  const [activeTab, setActiveTab] = useState<PlayerProfileFormatTab>('all');
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevPlayerId, setPrevPlayerId] = useState(effectivePlayerId);

  if (isOpen !== prevIsOpen || effectivePlayerId !== prevPlayerId) {
    setPrevIsOpen(isOpen);
    setPrevPlayerId(effectivePlayerId);
    setActiveTab('all');
  }

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const resolvedProfile: PlayerProfileData | null = useMemo(() => {
    if (!effectivePlayerId) return null;
    if (profileData) return profileData;
    return calculatePlayerProfileData(matches ?? [], effectivePlayerId, tournaments);
  }, [effectivePlayerId, profileData, matches, tournaments]);

  const activeSummary = resolvedProfile?.summary[activeTab] ?? {
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 50.0,
    gamesWon: 0,
    gamesLost: 0,
    gameDifference: 0,
    form: [],
  };

  const timeline = resolvedProfile?.timeline;
  const filteredTimeline = useMemo(() => {
    if (!timeline) return [];
    if (activeTab === 'all') return timeline;
    return timeline.filter((item) => item.format === activeTab);
  }, [timeline, activeTab]);

  if (!isOpen) {
    return null;
  }

  const initial = (effectivePlayerName.trim().charAt(0) || 'И').toUpperCase();
  const isUnranked = doublesRank == null && singlesRank == null;
  const totalMatchesPlayed = resolvedProfile?.summary.all.matchesPlayed ?? 0;
  const showNewBadge = isUnranked && totalMatchesPlayed === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 text-gray-900 dark:text-gray-100 relative transition-all"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-profile-title"
      >
        {/* Header Section */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div
              data-testid="player-avatar"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-2xl shadow-md shrink-0"
            >
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="player-profile-title"
                  className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate"
                >
                  {effectivePlayerName}
                </h2>
                {doublesRank != null && (
                  <Badge variant="indigo">#{doublesRank} по двойки</Badge>
                )}
                {singlesRank != null && (
                  <Badge variant="purple">#{singlesRank} поединично</Badge>
                )}
                {showNewBadge && <Badge variant="slate">Нов</Badge>}
              </div>
              <FormBadge form={activeSummary.form} maxItems={5} className="mt-1" />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Затвори"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Scope Tab Selector */}
        <div
          role="tablist"
          aria-label="Формат на срещите"
          className="flex p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl gap-1 mt-4"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            className={`min-h-[38px] flex-1 text-center text-sm py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium'
            }`}
          >
            Всички
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'doubles'}
            onClick={() => setActiveTab('doubles')}
            className={`min-h-[38px] flex-1 text-center text-sm py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
              activeTab === 'doubles'
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium'
            }`}
          >
            По двойки
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'singles'}
            onClick={() => setActiveTab('singles')}
            className={`min-h-[38px] flex-1 text-center text-sm py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
              activeTab === 'singles'
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium'
            }`}
          >
            Поединично
          </button>
        </div>

        {/* Dynamic 5-Metric Stat Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 mt-4">
          <div
            data-testid="stat-matches"
            className="p-2.5 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60 text-center"
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Изиграни</div>
            <div className="text-lg sm:text-xl font-bold mt-1 text-gray-900 dark:text-white">
              {activeSummary.matchesPlayed}
            </div>
          </div>
          <div
            data-testid="stat-wins"
            className="p-2.5 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60 text-center"
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Победи</div>
            <div className="text-lg sm:text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {activeSummary.wins}
            </div>
          </div>
          <div
            data-testid="stat-losses"
            className="p-2.5 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60 text-center"
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Загуби</div>
            <div className="text-lg sm:text-xl font-bold mt-1 text-rose-600 dark:text-rose-400">
              {activeSummary.losses}
            </div>
          </div>
          <div
            data-testid="stat-winrate"
            className="p-2.5 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60 text-center"
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Успеваемост</div>
            <div className="text-lg sm:text-xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">
              {activeSummary.winRate}%
            </div>
          </div>
          <div
            data-testid="stat-gamediff"
            className="p-2.5 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60 text-center"
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Геймова разлика</div>
            <div className="text-lg sm:text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">
              {activeSummary.gameDifference > 0
                ? `+${activeSummary.gameDifference}`
                : `${activeSummary.gameDifference}`}
            </div>
          </div>
        </div>

        {/* Specialty Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {/* Favorite Partner */}
          <div
            data-testid="card-favorite-partner"
            className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Любим партньор</span>
            </div>
            {resolvedProfile?.favoritePartner ? (
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {resolvedProfile.favoritePartner.partnerName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {resolvedProfile.favoritePartner.matchesTogether} мача (
                  {resolvedProfile.favoritePartner.wins}П - {resolvedProfile.favoritePartner.losses}З,{' '}
                  {resolvedProfile.favoritePartner.winRate}%)
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 dark:text-gray-500 py-1">
                Няма изиграни мачове по двойки
              </div>
            )}
          </div>

          {/* Top Rival */}
          <div
            data-testid="card-top-rival"
            className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              <Swords className="w-4 h-4 text-purple-500" />
              <span>Най-чест съперник</span>
            </div>
            {resolvedProfile?.topRival ? (
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {resolvedProfile.topRival.rivalName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {resolvedProfile.topRival.encounters} мача ({resolvedProfile.topRival.wins}П -{' '}
                  {resolvedProfile.topRival.losses}З, {resolvedProfile.topRival.winRate}%)
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 dark:text-gray-500 py-1">
                Няма регистрирани съперници
              </div>
            )}
          </div>

          {/* Championship Titles */}
          {resolvedProfile && resolvedProfile.titles.length > 0 && (
            <div
              data-testid="card-championship-titles"
              className="sm:col-span-2 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>🏆 Титли ({resolvedProfile.titles.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {resolvedProfile.titles.map((title) => (
                  <div
                    key={title.tournamentId}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800/50"
                  >
                    <span>{title.tournamentName}</span>
                    {title.date && (
                      <span className="text-[11px] opacity-75">
                        ({formatDisplayDate(title.date)})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chronological Match Timeline */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200">
              История на мачовете
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {filteredTimeline.length}
              </span>
            </h3>
          </div>

          {filteredTimeline.length === 0 ? (
            <div className="p-6 text-center text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              {totalMatchesPlayed === 0
                ? 'Този играч все още няма записани изиграни срещи.'
                : 'Няма изиграни мачове в тази категория'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTimeline.map((item) => (
                <div
                  key={item.matchId}
                  className="p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  {/* Left Column: Context, Stage, Date, Participants */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {item.tournamentName || 'Приятелска среща'}
                      </span>
                      {item.stage && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                          {getStageLabel(item.stage)}
                        </span>
                      )}
                      {item.date && (
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">
                          {formatDisplayDate(item.date)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-700 dark:text-gray-300">
                      {item.format === 'doubles' ? (
                        <>
                          с <span className="font-medium">{item.partner?.name ?? 'Гост'}</span>{' '}
                          срещу{' '}
                          <span className="font-medium">
                            {item.opponents.map((o) => o.name).join(', ')}
                          </span>
                        </>
                      ) : (
                        <>
                          срещу{' '}
                          <span className="font-medium">
                            {item.opponents.map((o) => o.name).join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Outcome and Perspective Score */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        item.isWinner
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}
                    >
                      {item.isWinner ? 'Победа' : 'Загуба'}
                    </span>
                    <span className="font-mono font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                      {item.scoreDisplay}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
