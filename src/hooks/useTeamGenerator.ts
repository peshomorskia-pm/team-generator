import { useState, useMemo, useCallback, useRef, useDeferredValue } from 'react';
import { Player, Team, AlertNotification } from '../types';
import { fisherYatesShuffle } from '../utils/shuffle';
import { balanceTeams } from '../utils/balance';
import { saveMatchup, generateTeamsFingerprint } from '../utils/history';

export function useTeamGenerator() {
  const [rawText, setRawText] = useState<string>('');
  const [numberOfTeams, setNumberOfTeams] = useState<number | null>(null);
  const [playersPerTeam, setPlayersPerTeam] = useState<number | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [alert, setAlert] = useState<AlertNotification | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [balanceByRating, setBalanceByRating] = useState<boolean>(false);
  const lastFingerprintRef = useRef<string>('');
  const deferredRawText = useDeferredValue(rawText);

  // Parse lines to Player array
  const players: Player[] = useMemo(() => {
    return deferredRawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, index) => {
        // Support optional rating in formats: "Name (5)" or "Name [5]" or "Name: 5"
        const match = line.match(/^(.+?)(?:\s*[([:]\s*(\d+(?:\.\d+)?)\s*[)\]]?)?$/);
        if (match && match[2] !== undefined) {
          const parsedRating = parseFloat(match[2]);
          return {
            id: `p-${index + 1}`,
            name: match[1].trim(),
            rating: !Number.isNaN(parsedRating) ? parsedRating : undefined,
          };
        }
        return {
          id: `p-${index + 1}`,
          name: line,
        };
      });
  }, [deferredRawText]);

  const showAlert = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }, []);

  const addPlayer = useCallback((name: string, rating?: number) => {
    if (!name.trim()) return;
    const formatted = rating !== undefined ? `${name.trim()} (${rating})` : name.trim();
    setRawText((prev) => (prev ? `${prev}\n${formatted}` : formatted));
  }, []);

  const removePlayer = useCallback((id: string) => {
    // Find player index and remove that line
    const parsed = parseInt(id.replace('p-', ''), 10);
    if (Number.isNaN(parsed)) return;
    const index = parsed - 1;
    setRawText((prev) => {
      const lines = prev.split('\n');
      if (index >= 0 && index < lines.length) {
        lines.splice(index, 1);
        return lines.join('\n');
      }
      return prev;
    });
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

  const generateTeams = useCallback(() => {
    if (players.length === 0) {
      showAlert('Списъкът с играчи е празен. Моля, въведете поне няколко имена.', 'error');
      return;
    }
    if (players.length < 2) {
      showAlert('Нужни са поне 2-ма играчи за да се сформират отбори.', 'error');
      return;
    }

    const numTeamsInt = numberOfTeams !== null && !Number.isNaN(numberOfTeams) ? numberOfTeams : null;
    const pptInt = playersPerTeam !== null && !Number.isNaN(playersPerTeam) ? playersPerTeam : null;

    const hasNumTeams = numTeamsInt !== null && numTeamsInt > 0;
    const hasPpt = pptInt !== null && pptInt > 0;

    if (!hasNumTeams && !hasPpt) {
      showAlert("Моля, въведете 'Брой отбори' или 'Брой играчи в отбор'.", 'error');
      return;
    }

    if (hasNumTeams && numTeamsInt > players.length) {
      showAlert('Броят на отборите не може да е по-голям от броя на играчите.', 'error');
      return;
    }

    const lastFingerprint = lastFingerprintRef.current;
    let generatedTeams: Team[] = [];
    let attempts = 0;
    const maxAttempts = 15;

    // Check if ratings exist and balance requested
    const hasRatings = players.some((p) => p.rating !== undefined);

    do {
      generatedTeams = [];

      if (balanceByRating && hasRatings && hasNumTeams) {
        // Balance by rating algorithm with shuffled players so equal ratings vary across shuffles
        const shuffled = fisherYatesShuffle(players);
        generatedTeams = balanceTeams(shuffled, numTeamsInt);
      } else {
        const shuffled = fisherYatesShuffle(players);

        if (hasNumTeams) {
          // Initialize empty teams
          for (let i = 0; i < numTeamsInt; i++) {
            generatedTeams.push({
              id: `team-${i + 1}`,
              name: `Отбор ${i + 1}`,
              players: [],
              totalRating: 0,
            });
          }
          // Round-robin distribution
          shuffled.forEach((player, index) => {
            const teamIdx = index % numTeamsInt;
            generatedTeams[teamIdx].players.push(player);
            if (player.rating !== undefined) {
              generatedTeams[teamIdx].totalRating = (generatedTeams[teamIdx].totalRating ?? 0) + player.rating;
            }
          });
        } else if (hasPpt) {
          let teamIndex = 1;
          for (let i = 0; i < shuffled.length; i += pptInt) {
            const chunk = shuffled.slice(i, i + pptInt);
            const total = chunk.reduce((sum, p) => sum + (p.rating ?? 0), 0);
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
      lastFingerprint &&
      generateTeamsFingerprint(generatedTeams) === lastFingerprint &&
      attempts < maxAttempts
    );

    lastFingerprintRef.current = generateTeamsFingerprint(generatedTeams);
    saveMatchup(generatedTeams);
    setTeams(generatedTeams);
  }, [players, numberOfTeams, playersPerTeam, balanceByRating, showAlert]);

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
      lastFingerprintRef.current = generateTeamsFingerprint(updated);
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
    rawText,
    setRawText,
    players,
    numberOfTeams,
    setNumberOfTeams: handleNumTeamsChange,
    playersPerTeam,
    setPlayersPerTeam: handlePlayersPerTeamChange,
    teams,
    alert,
    showAlert,
    isCopied,
    balanceByRating,
    setBalanceByRating,
    addPlayer,
    removePlayer,
    generateTeams,
    shuffleSingleTeam,
    copyResults,
  };
}
