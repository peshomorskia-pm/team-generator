import { useState, useCallback, useRef, useMemo } from 'react';
import { Team, AlertNotification, GeneratorMode, TournamentGroup, TournamentMatch, UseTeamGeneratorReturn } from '../types';
import { GeneratorPlayer, DatabasePlayer, TeamFormationMode } from '../types/generator';
import { fisherYatesShuffle } from '../utils/shuffle';
import { balanceTeams } from '../utils/balance';
import { saveMatchup, generateTeamsFingerprint, areTeamConfigsEqual } from '../utils/history';
import { copyTextToClipboard, formatTeamsForClipboard } from '../utils/clipboard';
import { drawTournamentGroups } from '../utils/groupPartition';
import { generateTournamentSchedule } from '../utils/roundRobin';

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

export function getTargetTeamSize(
  mode: GeneratorMode,
  format?: 'singles' | 'doubles',
  ppt?: number | null,
  numTeams?: number | null,
  poolSize?: number
): number {
  if (mode === 'tennis') {
    return format === 'doubles' ? 2 : 1;
  }
  if (ppt !== null && ppt !== undefined && ppt > 0) {
    return ppt;
  }
  if (numTeams !== null && numTeams !== undefined && numTeams > 0) {
    const size = poolSize ?? 0;
    return size > 0 ? Math.ceil(size / numTeams) : 1;
  }
  return 1;
}

export const calculateTeamRating = (
  players: (GeneratorPlayer | { rating?: number; singles_rating?: number; doubles_rating?: number; source?: string })[],
  fmt?: 'singles' | 'doubles'
): number => {
  return players.reduce((sum, p) => {
    const r = resolvePlayerRating(p as GeneratorPlayer, fmt);
    return sum + (r ?? 0);
  }, 0);
};

export function useTeamGenerator(): UseTeamGeneratorReturn {
  const [mode, setMode] = useState<GeneratorMode>('tennis');
  const [activePool, setActivePool] = useState<GeneratorPlayer[]>([]);
  const [numberOfTeams, setNumberOfTeams] = useState<number | null>(null);
  const [playersPerTeam, setPlayersPerTeam] = useState<number | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [drawnGroups, setDrawnGroups] = useState<TournamentGroup[]>([]);
  const [schedule, setSchedule] = useState<TournamentMatch[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [alert, setAlert] = useState<AlertNotification | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [balanceByRating, setBalanceByRating] = useState<boolean>(false);
  const [formationMode, setFormationMode] = useState<TeamFormationMode>('auto');
  const [manualPlayersPerTeam, setManualPlayersPerTeam] = useState<number>(2);
  const [format, setFormat] = useState<'singles' | 'doubles'>('doubles');
  const lastTeamsRef = useRef<Team[] | null>(null);
  const lastFingerprintRef = useRef<string>('');

  const effectiveFormat = mode === 'tennis' ? format : undefined;

  const targetTeamSize = useMemo(() => {
    if (formationMode === 'manual') {
      return manualPlayersPerTeam;
    }
    return getTargetTeamSize(mode, format, playersPerTeam, numberOfTeams, activePool.length);
  }, [formationMode, manualPlayersPerTeam, mode, format, playersPerTeam, numberOfTeams, activePool.length]);

  const unassignedPoolPlayers = useMemo(() => {
    const assignedIds = new Set(teams.flatMap((t) => t.players.map((p) => p.id)));
    return activePool.filter((p) => !assignedIds.has(p.id));
  }, [activePool, teams]);

  const hasIncompleteTeams = useMemo(() => {
    if (teams.length === 0) return false;
    return teams.some((t) => t.players.length < targetTeamSize);
  }, [teams, targetTeamSize]);

  // Completely reactive tournament groups computation:
  // - Tennis mode with 3, 4, or 5 complete teams: auto-assigned to single group ("Група А")
  // - Tennis mode with >= 6 teams: formed via drawTournamentGroups()
  // - Incomplete teams or generic mode: empty array
  const groups = useMemo<TournamentGroup[]>(() => {
    if (mode !== 'tennis' || hasIncompleteTeams) {
      return [];
    }
    if (teams.length >= 3 && teams.length <= 5) {
      return [{ id: 'group-0', name: 'Група А', teams }];
    }
    if (teams.length >= 6) {
      return drawnGroups;
    }
    return [];
  }, [mode, hasIncompleteTeams, teams, drawnGroups]);

  const resetGroups = useCallback(() => {
    setDrawnGroups([]);
    setSchedule([]);
  }, []);

  const handleSetMode = useCallback((newMode: GeneratorMode) => {
    setMode(newMode);
    setDrawnGroups([]);
    setSchedule([]);
  }, []);

  const showAlert = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }, []);

  const addGuest = useCallback(
    (name: string) => {
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

      setTeams((prevTeams) => {
        if (prevTeams.length === 0) return prevTeams;
        let currentTeams = [...prevTeams];
        const currentTargetSize = getTargetTeamSize(
          mode,
          effectiveFormat,
          playersPerTeam,
          numberOfTeams,
          activePool.length + newGuests.length
        );

        for (const guest of newGuests) {
          const incompleteIdx = currentTeams.findIndex(
            (t) => t.players.length < currentTargetSize
          );
          if (incompleteIdx !== -1) {
            const targetTeam = currentTeams[incompleteIdx];
            const updatedPlayers = [...targetTeam.players, guest];
            currentTeams = [
              ...currentTeams.slice(0, incompleteIdx),
              {
                ...targetTeam,
                players: updatedPlayers,
                totalRating: calculateTeamRating(updatedPlayers, effectiveFormat),
              },
              ...currentTeams.slice(incompleteIdx + 1),
            ];
          }
        }
        return currentTeams;
      });

      setDrawnGroups([]);
      setSchedule([]);
    },
    [mode, effectiveFormat, playersPerTeam, numberOfTeams, activePool.length]
  );

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
      const exists = activePool.some((p) => p.id === player.id);
      if (exists) {
        setActivePool((prev) => prev.filter((p) => p.id !== player.id));
        setTeams((prevTeams) => {
          if (prevTeams.length === 0) return prevTeams;
          const playerInAnyTeam = prevTeams.some((t) => t.players.some((p) => p.id === player.id));
          if (!playerInAnyTeam) return prevTeams;

          return prevTeams
            .map((t) => {
              if (!t.players.some((p) => p.id === player.id)) return t;
              const remaining = t.players.filter((p) => p.id !== player.id);
              return {
                ...t,
                players: remaining,
                totalRating: calculateTeamRating(remaining, effectiveFormat),
              };
            })
            .filter((t) => (formationMode === 'manual' ? true : t.players.length > 0));
        });
      } else {
        const newPlayer: GeneratorPlayer = {
          id: player.id,
          name: player.name,
          source: 'registered',
          rating: player.rating,
          singles_rating: player.singles_rating,
          doubles_rating: player.doubles_rating,
        };
        setActivePool((prev) => [...prev, newPlayer]);
        setTeams((prevTeams) => {
          if (prevTeams.length === 0) return prevTeams;
          const currentTargetSize = getTargetTeamSize(
            mode,
            effectiveFormat,
            playersPerTeam,
            numberOfTeams,
            activePool.length + 1
          );
          const incompleteIdx = prevTeams.findIndex((t) => t.players.length < currentTargetSize);
          if (incompleteIdx === -1) return prevTeams;

          const targetTeam = prevTeams[incompleteIdx];
          const updatedPlayers = [...targetTeam.players, newPlayer];
          return [
            ...prevTeams.slice(0, incompleteIdx),
            {
              ...targetTeam,
              players: updatedPlayers,
              totalRating: calculateTeamRating(updatedPlayers, effectiveFormat),
            },
            ...prevTeams.slice(incompleteIdx + 1),
          ];
        });
      }
      setDrawnGroups([]);
      setSchedule([]);
    },
    [activePool, mode, effectiveFormat, playersPerTeam, numberOfTeams, formationMode]
  );

  const addRegisteredPlayer = useCallback(
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
      const exists = activePool.some((p) => p.id === player.id);
      if (exists) return;

      const newPlayer: GeneratorPlayer = {
        id: player.id,
        name: player.name,
        source: 'registered',
        rating: player.rating,
        singles_rating: player.singles_rating,
        doubles_rating: player.doubles_rating,
      };
      setActivePool((prev) => [...prev, newPlayer]);
      setTeams((prevTeams) => {
        if (prevTeams.length === 0) return prevTeams;
        const currentTargetSize = getTargetTeamSize(
          mode,
          effectiveFormat,
          playersPerTeam,
          numberOfTeams,
          activePool.length + 1
        );
        const incompleteIdx = prevTeams.findIndex((t) => t.players.length < currentTargetSize);
        if (incompleteIdx === -1) return prevTeams;

        const targetTeam = prevTeams[incompleteIdx];
        const updatedPlayers = [...targetTeam.players, newPlayer];
        return [
          ...prevTeams.slice(0, incompleteIdx),
          {
            ...targetTeam,
            players: updatedPlayers,
            totalRating: calculateTeamRating(updatedPlayers, effectiveFormat),
          },
          ...prevTeams.slice(incompleteIdx + 1),
        ];
      });
      setDrawnGroups([]);
      setSchedule([]);
    },
    [activePool, mode, effectiveFormat, playersPerTeam, numberOfTeams]
  );

  const removePlayer = useCallback(
    (id: string) => {
      setActivePool((prev) => prev.filter((p) => p.id !== id));
      setTeams((prevTeams) => {
        if (prevTeams.length === 0) return prevTeams;
        const playerInAnyTeam = prevTeams.some((t) => t.players.some((p) => p.id === id));
        if (!playerInAnyTeam) return prevTeams;

        return prevTeams
          .map((t) => {
            if (!t.players.some((p) => p.id === id)) return t;
            const remaining = t.players.filter((p) => p.id !== id);
            return {
              ...t,
              players: remaining,
              totalRating: calculateTeamRating(remaining, effectiveFormat),
            };
          })
          .filter((t) => (formationMode === 'manual' ? true : t.players.length > 0));
      });
      setDrawnGroups([]);
      setSchedule([]);
    },
    [formationMode, effectiveFormat]
  );

  const clearPool = useCallback(() => {
    setActivePool([]);
    setTeams([]);
    setDrawnGroups([]);
    setSchedule([]);
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
        if (teams.length > 0 && activePool.length % 2 !== 0) {
          return {
            canGenerate: false,
            validationError: 'Добавете още 1 играч за пълни двойки',
          };
        }
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
  }, [activePool.length, mode, format, playersPerTeam, numberOfTeams, teams.length]);

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
      setFormationMode('auto');
      setTeams(generatedTeams);
      setDrawnGroups([]);
      setSchedule([]);
    },
    [activePool, mode, numberOfTeams, playersPerTeam, balanceByRating, showAlert, format, canGenerate, validationError]
  );

  const drawGroups = useCallback(() => {
    if (teams.length >= 6 && mode === 'tennis' && !hasIncompleteTeams) {
      const drawn = drawTournamentGroups(teams);
      setDrawnGroups(drawn);
      setSchedule([]);
    }
  }, [teams, mode, hasIncompleteTeams]);

  const generateSchedule = useCallback(() => {
    if (groups.length > 0) {
      const drawnSchedule = generateTournamentSchedule(groups);
      setSchedule(drawnSchedule);
    }
  }, [groups]);

  const resetSchedule = useCallback(() => {
    setSchedule([]);
  }, []);

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
    setSchedule([]);
  }, []);

  const copyResults = useCallback(async (): Promise<boolean> => {
    if (teams.length === 0) return false;

    const textToCopy = formatTeamsForClipboard(teams, mode, format, schedule);
    const successful = await copyTextToClipboard(textToCopy);

    if (successful) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      return true;
    }

    showAlert('Неуспешно копиране. Моля, копирайте ръчно.', 'error');
    if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
      window.prompt('Копирайте съставите ръчно (Ctrl+C):', textToCopy);
    }
    return false;
  }, [teams, mode, format, schedule, showAlert]);

  const initializeBlankTeams = useCallback((numTeams: number, ppt = 2) => {
    if (numTeams < 1) return;
    setFormationMode('manual');
    setManualPlayersPerTeam(ppt);
    const blankTeams: Team[] = [];
    for (let i = 0; i < numTeams; i++) {
      blankTeams.push({
        id: `team-${i + 1}`,
        name: `Отбор ${i + 1}`,
        players: [],
        totalRating: 0,
      });
    }
    setTeams(blankTeams);
    setDrawnGroups([]);
    setSchedule([]);
  }, []);

  const assignPlayerToTeam = useCallback(
    (teamId: string, player: GeneratorPlayer) => {
      setActivePool((prev) => {
        if (prev.some((p) => p.id === player.id)) return prev;
        return [...prev, player];
      });

      setTeams((prevTeams) => {
        return prevTeams.map((team) => {
          if (team.id === teamId) {
            if (team.players.some((p) => p.id === player.id)) return team;
            if (team.players.length >= targetTeamSize) return team;
            const updated = [...team.players, player];
            return {
              ...team,
              players: updated,
              totalRating: calculateTeamRating(updated, effectiveFormat),
            };
          } else {
            if (team.players.some((p) => p.id === player.id)) {
              const remaining = team.players.filter((p) => p.id !== player.id);
              return {
                ...team,
                players: remaining,
                totalRating: calculateTeamRating(remaining, effectiveFormat),
              };
            }
            return team;
          }
        });
      });

      setDrawnGroups([]);
      setSchedule([]);
    },
    [targetTeamSize, effectiveFormat]
  );

  const removePlayerFromTeam = useCallback(
    (teamId: string, playerId: string) => {
      setTeams((prevTeams) => {
        return prevTeams
          .map((team) => {
            if (team.id !== teamId) return team;
            const remaining = team.players.filter((p) => p.id !== playerId);
            return {
              ...team,
              players: remaining,
              totalRating: calculateTeamRating(remaining, effectiveFormat),
            };
          })
          .filter((t) => (formationMode === 'manual' ? true : t.players.length > 0));
      });

      setDrawnGroups([]);
      setSchedule([]);
    },
    [formationMode, effectiveFormat]
  );

  const autoFillRemainingSlots = useCallback(
    (balance?: boolean) => {
      setTeams((prevTeams) => {
        if (prevTeams.length === 0) return prevTeams;
        const assignedIds = new Set(prevTeams.flatMap((t) => t.players.map((p) => p.id)));
        let available = activePool.filter((p) => !assignedIds.has(p.id));
        if (available.length === 0) return prevTeams;

        const shouldBalance = balance ?? balanceByRating;
        if (shouldBalance) {
          available = [...available].sort((a, b) => {
            const rA = resolvePlayerRating(a, effectiveFormat) ?? 0;
            const rB = resolvePlayerRating(b, effectiveFormat) ?? 0;
            return rB - rA;
          });
        } else {
          available = fisherYatesShuffle(available);
        }

        const updatedTeams = prevTeams.map((team) => ({
          ...team,
          players: [...team.players],
        }));

        let playerIdx = 0;
        while (playerIdx < available.length) {
          const incompleteTeams = updatedTeams.filter((t) => t.players.length < targetTeamSize);
          if (incompleteTeams.length === 0) break;

          let targetTeam: (typeof updatedTeams)[0];
          if (shouldBalance) {
            incompleteTeams.sort((a, b) => (a.totalRating ?? 0) - (b.totalRating ?? 0));
            targetTeam = incompleteTeams[0];
          } else {
            targetTeam = incompleteTeams[0];
          }

          const nextPlayer = available[playerIdx++];
          targetTeam.players.push(nextPlayer);
          targetTeam.totalRating = calculateTeamRating(targetTeam.players, effectiveFormat);
        }

        return updatedTeams;
      });

      setDrawnGroups([]);
      setSchedule([]);
    },
    [activePool, balanceByRating, effectiveFormat, targetTeamSize]
  );

  return {
    mode,
    setMode: handleSetMode,
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
    targetTeamSize,
    hasIncompleteTeams,
    groups,
    drawGroups,
    resetGroups,
    clearGroups: resetGroups,
    schedule,
    generateSchedule,
    resetSchedule,
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
    addRegisteredPlayer,
    removePlayer,
    clearPool,
    generateTeams,
    shuffleSingleTeam,
    copyResults,
    formationMode,
    setFormationMode,
    teamFormationMode: formationMode,
    setTeamFormationMode: setFormationMode,
    unassignedPoolPlayers,
    initializeBlankTeams,
    assignPlayerToTeam,
    removePlayerFromTeam,
    autoFillRemainingSlots,
  };
}
