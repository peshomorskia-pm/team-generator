import { useState, useCallback, useRef, useMemo } from 'react';
import { Team, AlertNotification, GeneratorMode } from '../types';
import { GeneratorPlayer, DatabasePlayer } from '../types/generator';
import { fisherYatesShuffle } from '../utils/shuffle';
import { balanceTeams } from '../utils/balance';
import { saveMatchup, generateTeamsFingerprint, areTeamConfigsEqual } from '../utils/history';

export function generateGuestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const resolvePlayerRating = (
  player: GeneratorPlayer,
  fmt?: 'singles' | 'doubles'
): number | undefined => {
  if (player.source === 'guest') return undefined;
  if (fmt === 'singles') {
    return player.singles_rating ?? player.rating;
  }
  if (fmt === 'doubles') {
    return player.doubles_rating ?? player.rating;
  }
  return player.rating;
};

export function useTeamGenerator() {
  const [mode, setMode] = useState<GeneratorMode>('tennis');
  const [activePool, setActivePool] = useState<GeneratorPlayer[]>([]);
  const [numberOfTeams, setNumberOfTeams] = useState<number | null>(null);
  const [playersPerTeam, setPlayersPerTeam] = useState<number | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [alert, setAlert] = useState<AlertNotification | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [balanceByRating, setBalanceByRating] = useState<boolean>(false);
  const [format, setFormat] = useState<'singles' | 'doubles'>('doubles');
  const lastTeamsRef = useRef<Team[] | null>(null);
  const lastFingerprintRef = useRef<string>('');

  const showAlert = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }, []);

  const addGuest = useCallback((name: string) => {
    if (!name.trim()) return;
    const names = name
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) return;

    const newGuests: GeneratorPlayer[] = names.map((guestName) => ({
      id: generateGuestId(),
      name: guestName,
      source: 'guest',
    }));

    setActivePool((prev) => [...prev, ...newGuests]);
  }, []);

  const toggleRegisteredPlayer = useCallback(
    (
      player:
        | DatabasePlayer
        | {
            id: string;
            name: string;
            rating?: number;
            singles_rating?: number;
            doubles_rating?: number;
          }
    ) => {
      setActivePool((prev) => {
        const exists = prev.some((p) => p.id === player.id);
        if (exists) {
          return prev.filter((p) => p.id !== player.id);
        }
        const newPlayer: GeneratorPlayer = {
          id: player.id,
          name: player.name,
          source: 'registered',
          rating: player.rating,
          singles_rating: player.singles_rating,
          doubles_rating: player.doubles_rating,
        };
        return [...prev, newPlayer];
      });
    },
    []
  );

  const removePlayer = useCallback((id: string) => {
    setActivePool((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearPool = useCallback(() => {
    setActivePool([]);
    setTeams([]);
  }, []);

  const handleNumTeamsChange = useCallback((val: number | null) => {
    setNumberOfTeams(val);
    if (val !== null) {
      setPlayersPerTeam(null);
    }
  }, []);

  const handlePlayersPerTeamChange = useCallback((val: number | null) => {
    setPlayersPerTeam(val);
    if (val !== null) {
      setNumberOfTeams(null);
    }
  }, []);

  const { validationError, canGenerate } = useMemo(() => {
    if (activePool.length === 0) {
      return {
        canGenerate: false,
        validationError: null,
      };
    }

    if (mode === 'tennis') {
      if (format === 'doubles') {
        if (activePool.length < 4) {
          return {
            canGenerate: false,
            validationError: 'Нужни са поне 4 играчи за игра по двойки.',
          };
        }
        if (activePool.length % 2 !== 0) {
          return {
            canGenerate: false,
            validationError: 'Добавете още 1 играч за пълни двойки',
          };
        }
        return {
          canGenerate: true,
          validationError: null,
        };
      }

      // singles
      if (activePool.length < 2) {
        return {
          canGenerate: false,
          validationError: 'Нужни са поне 2-ма играчи за сформиране на сингъл срещи',
        };
      }
      return {
        canGenerate: true,
        validationError: null,
      };
    }

    // Generic mode
    if (activePool.length < 2) {
      return {
        canGenerate: false,
        validationError: 'Нужни са поне 2-ма играчи за да се сформират отбори.',
      };
    }

    if (playersPerTeam !== null && !Number.isNaN(playersPerTeam)) {
      if (playersPerTeam < 1) {
        return {
          canGenerate: false,
          validationError: 'Броят играчи в отбор трябва да бъде поне 1.',
        };
      }
      if (playersPerTeam >= activePool.length) {
        return {
          canGenerate: false,
          validationError: `Броят играчи в отбор (${playersPerTeam}) не може да бъде по-голям или равен на общия брой играчи (${activePool.length}). Нужни са играчи за поне 2 отбора.`,
        };
      }
      return {
        canGenerate: true,
        validationError: null,
      };
    }

    if (numberOfTeams !== null && !Number.isNaN(numberOfTeams)) {
      if (numberOfTeams < 2) {
        return {
          canGenerate: false,
          validationError: 'Нужни са поне 2 отбора за разпределение.',
        };
      }
      if (numberOfTeams > activePool.length) {
        return {
          canGenerate: false,
          validationError: `Броят отбори (${numberOfTeams}) не може да надвишава наличните играчи (${activePool.length}).`,
        };
      }
      return {
        canGenerate: true,
        validationError: null,
      };
    }

    return {
      canGenerate: true,
      validationError: null,
    };
  }, [activePool.length, mode, format, playersPerTeam, numberOfTeams]);

  const generateTeams = useCallback(
    (teamCount?: number, balanceByRatingParam?: boolean) => {
      if (activePool.length === 0) {
        showAlert('Списъкът с играчи е празен. Моля, въведете поне няколко имена.', 'error');
        return;
      }

      if (!canGenerate && typeof teamCount !== 'number') {
        if (validationError) {
          showAlert(validationError, 'error');
        }
        return;
      }

      if (mode === 'tennis') {
        if (format === 'doubles') {
          if (activePool.length < 4) {
            showAlert('Нужни са поне 4 играчи за игра по двойки.', 'error');
            return;
          }
          if (activePool.length % 2 !== 0) {
            showAlert('Добавете още 1 играч за пълни двойки', 'error');
            return;
          }
        }
        if (format === 'singles') {
          if (activePool.length < 2) {
            showAlert('Нужни са поне 2-ма играчи за сформиране на сингъл срещи', 'error');
            return;
          }
        }
      } else {
        if (activePool.length < 2) {
          showAlert('Нужни са поне 2-ма играчи за да се сформират отбори.', 'error');
          return;
        }
      }

      const effectiveFormat = mode === 'tennis' ? format : undefined;

      const tennisTargetTeams =
        format === 'doubles'
          ? Math.floor(activePool.length / 2)
          : activePool.length;

      const effectiveNumTeams =
        mode === 'tennis'
          ? typeof teamCount === 'number' && teamCount > 0
            ? teamCount
            : tennisTargetTeams
          : typeof teamCount === 'number' && teamCount > 0
            ? teamCount
            : numberOfTeams !== null && !Number.isNaN(numberOfTeams) && numberOfTeams > 0
              ? numberOfTeams
              : null;

      const pptInt =
        mode === 'generic' && playersPerTeam !== null && !Number.isNaN(playersPerTeam) && playersPerTeam > 0
          ? playersPerTeam
          : null;

      const effectiveBalance =
        mode === 'generic'
          ? false
          : typeof balanceByRatingParam === 'boolean'
            ? balanceByRatingParam
            : balanceByRating;

      const hasNumTeams = effectiveNumTeams !== null && effectiveNumTeams > 0;
      const hasPpt = pptInt !== null && pptInt > 0;

      if (mode === 'generic') {
        if (!hasNumTeams && !hasPpt) {
          showAlert("Моля, въведете 'Брой отбори' или 'Брой играчи в отбор'.", 'error');
          return;
        }

        if (hasNumTeams && effectiveNumTeams > activePool.length) {
          showAlert(`Броят отбори (${effectiveNumTeams}) не може да надвишава наличните играчи (${activePool.length}).`, 'error');
          return;
        }

        if (hasNumTeams && effectiveNumTeams < 2) {
          showAlert('Нужни са поне 2 отбора за разпределение.', 'error');
          return;
        }

        if (hasPpt && pptInt < 1) {
          showAlert('Броят играчи в отбор трябва да бъде поне 1.', 'error');
          return;
        }

        if (hasPpt && pptInt >= activePool.length) {
          showAlert(`Броят играчи в отбор (${pptInt}) не може да бъде по-голям или равен на общия брой играчи (${activePool.length}). Нужни са играчи за поне 2 отбора.`, 'error');
          return;
        }
      }

      const targetNumTeams = hasNumTeams
        ? effectiveNumTeams
        : hasPpt
          ? Math.ceil(activePool.length / pptInt)
          : null;

      const lastTeams = lastTeamsRef.current;
      let generatedTeams: Team[] = [];
      let attempts = 0;
      const maxAttempts = 15;

      const hasRatings = activePool.some(
        (p) => resolvePlayerRating(p, effectiveFormat) !== undefined
      );

      do {
        generatedTeams = [];

        if (effectiveBalance && hasRatings && targetNumTeams) {
          const shuffled = fisherYatesShuffle(activePool);
          generatedTeams = balanceTeams(shuffled, targetNumTeams, effectiveFormat);
        } else {
          const shuffled = fisherYatesShuffle(activePool);

          if (hasNumTeams) {
            for (let i = 0; i < effectiveNumTeams; i++) {
              generatedTeams.push({
                id: `team-${i + 1}`,
                name: `Отбор ${i + 1}`,
                players: [],
                totalRating: 0,
              });
            }
            shuffled.forEach((player, index) => {
              const teamIdx = index % effectiveNumTeams;
              generatedTeams[teamIdx].players.push(player);
              const pRating = resolvePlayerRating(player, effectiveFormat);
              if (pRating !== undefined) {
                generatedTeams[teamIdx].totalRating =
                  (generatedTeams[teamIdx].totalRating ?? 0) + pRating;
              }
            });
          } else if (hasPpt) {
            const numTeams = Math.ceil(shuffled.length / pptInt);
            const baseSize = Math.floor(shuffled.length / numTeams);
            const remainder = shuffled.length % numTeams;

            let cursor = 0;
            for (let i = 0; i < numTeams; i++) {
              const targetSize = i < remainder ? baseSize + 1 : baseSize;
              const chunk = shuffled.slice(cursor, cursor + targetSize);
              cursor += targetSize;
              const total = chunk.reduce(
                (sum, p) => sum + (resolvePlayerRating(p, effectiveFormat) ?? 0),
                0
              );
              generatedTeams.push({
                id: `team-${i + 1}`,
                name: `Отбор ${i + 1}`,
                players: chunk,
                totalRating: total,
              });
            }
          }
        }

        attempts++;
      } while (
        lastTeams &&
        areTeamConfigsEqual(generatedTeams, lastTeams) &&
        attempts < maxAttempts
      );

      lastTeamsRef.current = generatedTeams;
      const fingerprint = generateTeamsFingerprint(generatedTeams);
      lastFingerprintRef.current = fingerprint;
      saveMatchup(generatedTeams);
      setHistory((prev) => [fingerprint, ...prev]);
      setTeams(generatedTeams);
    },
    [activePool, mode, numberOfTeams, playersPerTeam, balanceByRating, showAlert, format, canGenerate, validationError]
  );

  const shuffleSingleTeam = useCallback((teamId: string) => {
    setTeams((prevTeams) => {
      const updated = prevTeams.map((team) => {
        if (team.id === teamId) {
          return {
            ...team,
            players: fisherYatesShuffle(team.players),
          };
        }
        return team;
      });
      lastTeamsRef.current = updated;
      const fingerprint = generateTeamsFingerprint(updated);
      lastFingerprintRef.current = fingerprint;
      setHistory((prev) => [fingerprint, ...prev]);
      return updated;
    });
  }, []);

  const copyResults = useCallback(async (): Promise<boolean> => {
    if (teams.length === 0) return false;

    let textToCopy = 'Списък с отбори:\n\n';
    teams.forEach((team) => {
      textToCopy += `${team.name}:\n`;
      team.players.forEach((p) => {
        textToCopy += `- ${p.name}\n`;
      });
      textToCopy += '\n';
    });

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'absolute';
        textArea.style.left = '-999999px';
        document.body.prepend(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      return true;
    } catch {
      showAlert('Неуспешно копиране. Моля, копирайте ръчно.', 'error');
      return false;
    }
  }, [teams, showAlert]);

  return {
    mode,
    setMode,
    canGenerate,
    validationError,
    validationMessage: validationError,
    activePool,
    players: activePool,
    numberOfTeams,
    setNumberOfTeams: handleNumTeamsChange,
    playersPerTeam,
    setPlayersPerTeam: handlePlayersPerTeamChange,
    teams,
    history,
    alert,
    showAlert,
    isCopied,
    balanceByRating,
    setBalanceByRating,
    format,
    setFormat,
    addGuest,
    toggleRegisteredPlayer,
    removePlayer,
    clearPool,
    generateTeams,
    shuffleSingleTeam,
    copyResults,
  };
}
