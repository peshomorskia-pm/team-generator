import { useState, useCallback, useRef } from 'react';
import { Team, AlertNotification } from '../types';
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
  fmt: 'singles' | 'doubles'
): number | undefined => {
  if (player.source === 'guest') return undefined;
  if (fmt === 'singles') {
    return player.singles_rating ?? player.rating;
  }
  return player.doubles_rating ?? player.rating;
};

export function useTeamGenerator() {
  const [activePool, setActivePool] = useState<GeneratorPlayer[]>([]);
  const [numberOfTeams, setNumberOfTeams] = useState<number | null>(null);
  const [playersPerTeam, setPlayersPerTeam] = useState<number | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [alert, setAlert] = useState<AlertNotification | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [balanceByRating, setBalanceByRating] = useState<boolean>(false);
  const [format, setFormat] = useState<'singles' | 'doubles'>('singles');
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

  const generateTeams = useCallback(
    (teamCount?: number, balanceByRatingParam?: boolean) => {
      if (activePool.length === 0) {
        showAlert('Списъкът с играчи е празен. Моля, въведете поне няколко имена.', 'error');
        return;
      }
      if (activePool.length < 2) {
        showAlert('Нужни са поне 2-ма играчи за да се сформират отбори.', 'error');
        return;
      }

      const effectiveNumTeams =
        typeof teamCount === 'number' && teamCount > 0
          ? teamCount
          : numberOfTeams !== null && !Number.isNaN(numberOfTeams) && numberOfTeams > 0
            ? numberOfTeams
            : null;

      const pptInt =
        playersPerTeam !== null && !Number.isNaN(playersPerTeam) && playersPerTeam > 0
          ? playersPerTeam
          : null;

      const effectiveBalance =
        typeof balanceByRatingParam === 'boolean' ? balanceByRatingParam : balanceByRating;

      const hasNumTeams = effectiveNumTeams !== null && effectiveNumTeams > 0;
      const hasPpt = pptInt !== null && pptInt > 0;

      if (!hasNumTeams && !hasPpt) {
        showAlert("Моля, въведете 'Брой отбори' или 'Брой играчи в отбор'.", 'error');
        return;
      }

      if (hasNumTeams && effectiveNumTeams > activePool.length) {
        showAlert('Броят на отборите не може да е по-голям от броя на играчите.', 'error');
        return;
      }

      const lastTeams = lastTeamsRef.current;
      let generatedTeams: Team[] = [];
      let attempts = 0;
      const maxAttempts = 15;

      const hasRatings = activePool.some(
        (p) => resolvePlayerRating(p, format) !== undefined || p.rating !== undefined
      );

      do {
        generatedTeams = [];

        if (effectiveBalance && hasRatings && hasNumTeams) {
          const shuffled = fisherYatesShuffle(activePool);
          generatedTeams = balanceTeams(shuffled, effectiveNumTeams, format);
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
              const pRating = resolvePlayerRating(player, format);
              if (pRating !== undefined) {
                generatedTeams[teamIdx].totalRating =
                  (generatedTeams[teamIdx].totalRating ?? 0) + pRating;
              }
            });
          } else if (hasPpt) {
            let teamIndex = 1;
            for (let i = 0; i < shuffled.length; i += pptInt) {
              const chunk = shuffled.slice(i, i + pptInt);
              const total = chunk.reduce(
                (sum, p) => sum + (resolvePlayerRating(p, format) ?? 0),
                0
              );
              generatedTeams.push({
                id: `team-${teamIndex}`,
                name: `Отбор ${teamIndex}`,
                players: chunk,
                totalRating: total,
              });
              teamIndex++;
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
    [activePool, numberOfTeams, playersPerTeam, balanceByRating, showAlert, format]
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
