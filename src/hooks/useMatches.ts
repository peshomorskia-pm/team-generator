import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AlertNotification } from '../types';
import type { PlayerRow } from '../types/database.types';
import type { MatchDetail, MatchFormData, MatchFormat, MatchPlayerDetail } from '../types/matches';
import { calculateMatchElo } from '../utils/elo';

export interface UseMatchesReturn {
  matches: MatchDetail[];
  loading: boolean;
  error: string | null;
  alert: AlertNotification | null;
  fetchMatches: () => Promise<void>;
  createMatch: (data: MatchFormData) => Promise<boolean>;
  updateMatch: (id: string, data: MatchFormData) => Promise<void>;
  deleteMatch: (id: string) => Promise<void>;
  clearAlert: () => void;
}

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error) {
    return err.message;
  }
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
};

export function useMatches(): UseMatchesReturn {
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertNotification | null>(null);

  const clearAlert = useCallback(() => {
    setAlert(null);
  }, []);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        const msg = 'Supabase не е конфигуриран.';
        setError(msg);
        setAlert({ type: 'error', message: msg });
        return;
      }

      const { data, error: queryError } = await supabase
        .from('matches')
        .select(`
          *,
          match_players (
            *,
            players (
              id,
              name
            )
          )
        `)
        .order('played_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setMatches((data as MatchDetail[]) ?? []);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Грешка при зареждане на мачовете.');
      setError(msg);
      setAlert({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  const createMatch = useCallback(async (data: MatchFormData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        const msg = 'Supabase не е конфигуриран.';
        setError(msg);
        setAlert({ type: 'error', message: msg });
        return false;
      }

      const format: MatchFormat =
        data.match_format ??
        (data.team_1_players.length > 1 || data.team_2_players.length > 1
          ? 'doubles'
          : 'singles');

      const isCompleted =
        data.team_1_score !== null && data.team_2_score !== null;

      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert({
          match_format: format,
          team_1_score: data.team_1_score,
          team_2_score: data.team_2_score,
          played_at: data.played_at,
        })
        .select()
        .single();

      if (matchError) {
        throw matchError;
      }

      const registeredIds = [
        ...data.team_1_players
          .map((p) => p.player_id)
          .filter((id): id is string => Boolean(id)),
        ...data.team_2_players
          .map((p) => p.player_id)
          .filter((id): id is string => Boolean(id)),
      ];

      const playerMap = new Map<string, PlayerRow>();
      if (isCompleted && registeredIds.length > 0) {
        try {
          const playersTable = supabase.from('players');
          if (playersTable && typeof playersTable.select === 'function') {
            const selectQuery = playersTable.select('*');
            if (selectQuery && typeof selectQuery.in === 'function') {
              const { data: fetchedPlayers } = await selectQuery.in('id', registeredIds);
              if (fetchedPlayers) {
                for (const p of fetchedPlayers) {
                  playerMap.set(p.id, p);
                }
              }
            }
          }
        } catch {
          // Fall back gracefully to defaults
        }
      }

      const getPlayerRating = (playerId: string | undefined): number => {
        if (!playerId) return 1200;
        const p = playerMap.get(playerId);
        if (!p) return 1200;
        if (format === 'doubles') {
          return p.doubles_rating ?? p.rating ?? 1200;
        }
        return p.singles_rating ?? p.rating ?? 1200;
      };

      let team1Delta = 0;
      let team2Delta = 0;

      if (isCompleted) {
        const team1Ratings = data.team_1_players.map((p) =>
          getPlayerRating(p.player_id)
        );
        const team2Ratings = data.team_2_players.map((p) =>
          getPlayerRating(p.player_id)
        );

        const eloResult = calculateMatchElo({
          format,
          team1Ratings,
          team2Ratings,
          score1: data.team_1_score!,
          score2: data.team_2_score!,
        });

        team1Delta = eloResult.team1Delta;
        team2Delta = eloResult.team2Delta;
      }

      const matchPlayers = [
        ...data.team_1_players.map((p) => {
          const ratingBefore = isCompleted
            ? getPlayerRating(p.player_id)
            : null;
          const ratingAfter =
            isCompleted && ratingBefore !== null
              ? ratingBefore + team1Delta
              : null;

          return {
            match_id: matchData.id,
            player_id: p.player_id ?? null,
            guest_name: p.guest_name ?? null,
            team_side: 'team_1' as const,
            rating_before: ratingBefore,
            rating_after: ratingAfter,
          };
        }),
        ...data.team_2_players.map((p) => {
          const ratingBefore = isCompleted
            ? getPlayerRating(p.player_id)
            : null;
          const ratingAfter =
            isCompleted && ratingBefore !== null
              ? ratingBefore + team2Delta
              : null;

          return {
            match_id: matchData.id,
            player_id: p.player_id ?? null,
            guest_name: p.guest_name ?? null,
            team_side: 'team_2' as const,
            rating_before: ratingBefore,
            rating_after: ratingAfter,
          };
        }),
      ];

      let insertedPlayers: MatchPlayerDetail[] = [];
      if (matchPlayers.length > 0) {
        const { data: playersData, error: insertPlayersError } = await supabase
          .from('match_players')
          .insert(matchPlayers)
          .select('*, players(id, name)');

        if (insertPlayersError) {
          throw insertPlayersError;
        }
        insertedPlayers = (playersData as MatchPlayerDetail[]) ?? [];
      }

      // Update player rating and stats in players table
      if (isCompleted && registeredIds.length > 0) {
        const team1Won = data.team_1_score! > data.team_2_score!;
        const team2Won = data.team_2_score! > data.team_1_score!;

        const playerUpdates: PromiseLike<unknown>[] = [];

        for (const p of data.team_1_players) {
          if (!p.player_id) continue;
          const player = playerMap.get(p.player_id);
          const currentRating = getPlayerRating(p.player_id);
          const newRating = currentRating + team1Delta;

          const updateObj =
            format === 'singles'
              ? {
                  singles_rating: newRating,
                  singles_matches_played:
                    (player?.singles_matches_played ?? 0) + 1,
                  singles_wins:
                    (player?.singles_wins ?? 0) + (team1Won ? 1 : 0),
                  singles_losses:
                    (player?.singles_losses ?? 0) + (team2Won ? 1 : 0),
                  rating: newRating,
                }
              : {
                  doubles_rating: newRating,
                  doubles_matches_played:
                    (player?.doubles_matches_played ?? 0) + 1,
                  doubles_wins:
                    (player?.doubles_wins ?? 0) + (team1Won ? 1 : 0),
                  doubles_losses:
                    (player?.doubles_losses ?? 0) + (team2Won ? 1 : 0),
                };

          try {
            const playersTable = supabase.from('players');
            if (playersTable && typeof playersTable.update === 'function') {
              const updateQuery = playersTable.update(updateObj);
              if (updateQuery && typeof updateQuery.eq === 'function') {
                playerUpdates.push(updateQuery.eq('id', p.player_id));
              }
            }
          } catch {
            // ignore
          }
        }

        for (const p of data.team_2_players) {
          if (!p.player_id) continue;
          const player = playerMap.get(p.player_id);
          const currentRating = getPlayerRating(p.player_id);
          const newRating = currentRating + team2Delta;

          const updateObj =
            format === 'singles'
              ? {
                  singles_rating: newRating,
                  singles_matches_played:
                    (player?.singles_matches_played ?? 0) + 1,
                  singles_wins:
                    (player?.singles_wins ?? 0) + (team2Won ? 1 : 0),
                  singles_losses:
                    (player?.singles_losses ?? 0) + (team1Won ? 1 : 0),
                  rating: newRating,
                }
              : {
                  doubles_rating: newRating,
                  doubles_matches_played:
                    (player?.doubles_matches_played ?? 0) + 1,
                  doubles_wins:
                    (player?.doubles_wins ?? 0) + (team2Won ? 1 : 0),
                  doubles_losses:
                    (player?.doubles_losses ?? 0) + (team1Won ? 1 : 0),
                };

          try {
            const playersTable = supabase.from('players');
            if (playersTable && typeof playersTable.update === 'function') {
              const updateQuery = playersTable.update(updateObj);
              if (updateQuery && typeof updateQuery.eq === 'function') {
                playerUpdates.push(updateQuery.eq('id', p.player_id));
              }
            }
          } catch {
            // ignore
          }
        }

        await Promise.allSettled(playerUpdates);
      }

      const newMatch: MatchDetail = {
        ...matchData,
        match_players: insertedPlayers,
      };

      setMatches((prev) => {
        const next = [newMatch, ...prev.filter((m) => m.id !== newMatch.id)];
        return next.sort(
          (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
        );
      });

      setAlert({
        type: 'success',
        message: 'Мачът е записан успешно.',
      });
      return true;
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Грешка при записване на мач.');
      setError(msg);
      setAlert({ type: 'error', message: msg });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMatch = useCallback(async (id: string, data: MatchFormData) => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        const msg = 'Supabase не е конфигуриран.';
        setError(msg);
        setAlert({ type: 'error', message: msg });
        return;
      }

      const format: MatchFormat =
        data.match_format ??
        (data.team_1_players.length > 1 || data.team_2_players.length > 1
          ? 'doubles'
          : 'singles');

      const isCompleted =
        data.team_1_score !== null && data.team_2_score !== null;

      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .update({
          match_format: format,
          team_1_score: data.team_1_score,
          team_2_score: data.team_2_score,
          played_at: data.played_at,
        })
        .eq('id', id)
        .select()
        .single();

      if (matchError) {
        throw matchError;
      }

      const { error: deletePlayersError } = await supabase
        .from('match_players')
        .delete()
        .eq('match_id', id);

      if (deletePlayersError) {
        throw deletePlayersError;
      }

      const registeredIds = [
        ...data.team_1_players
          .map((p) => p.player_id)
          .filter((pid): pid is string => Boolean(pid)),
        ...data.team_2_players
          .map((p) => p.player_id)
          .filter((pid): pid is string => Boolean(pid)),
      ];

      const playerMap = new Map<string, PlayerRow>();
      if (isCompleted && registeredIds.length > 0) {
        try {
          const playersTable = supabase.from('players');
          if (playersTable && typeof playersTable.select === 'function') {
            const selectQuery = playersTable.select('*');
            if (selectQuery && typeof selectQuery.in === 'function') {
              const { data: fetchedPlayers } = await selectQuery.in('id', registeredIds);
              if (fetchedPlayers) {
                for (const p of fetchedPlayers) {
                  playerMap.set(p.id, p);
                }
              }
            }
          }
        } catch {
          // Fall back gracefully
        }
      }

      const getPlayerRating = (playerId: string | undefined): number => {
        if (!playerId) return 1200;
        const p = playerMap.get(playerId);
        if (!p) return 1200;
        if (format === 'doubles') {
          return p.doubles_rating ?? p.rating ?? 1200;
        }
        return p.singles_rating ?? p.rating ?? 1200;
      };

      let team1Delta = 0;
      let team2Delta = 0;

      if (isCompleted) {
        const team1Ratings = data.team_1_players.map((p) =>
          getPlayerRating(p.player_id)
        );
        const team2Ratings = data.team_2_players.map((p) =>
          getPlayerRating(p.player_id)
        );

        const eloResult = calculateMatchElo({
          format,
          team1Ratings,
          team2Ratings,
          score1: data.team_1_score!,
          score2: data.team_2_score!,
        });

        team1Delta = eloResult.team1Delta;
        team2Delta = eloResult.team2Delta;
      }

      const matchPlayers = [
        ...data.team_1_players.map((p) => {
          const ratingBefore = isCompleted
            ? getPlayerRating(p.player_id)
            : null;
          const ratingAfter =
            isCompleted && ratingBefore !== null
              ? ratingBefore + team1Delta
              : null;

          return {
            match_id: id,
            player_id: p.player_id ?? null,
            guest_name: p.guest_name ?? null,
            team_side: 'team_1' as const,
            rating_before: ratingBefore,
            rating_after: ratingAfter,
          };
        }),
        ...data.team_2_players.map((p) => {
          const ratingBefore = isCompleted
            ? getPlayerRating(p.player_id)
            : null;
          const ratingAfter =
            isCompleted && ratingBefore !== null
              ? ratingBefore + team2Delta
              : null;

          return {
            match_id: id,
            player_id: p.player_id ?? null,
            guest_name: p.guest_name ?? null,
            team_side: 'team_2' as const,
            rating_before: ratingBefore,
            rating_after: ratingAfter,
          };
        }),
      ];

      let insertedPlayers: MatchPlayerDetail[] = [];
      if (matchPlayers.length > 0) {
        const { data: playersData, error: insertPlayersError } = await supabase
          .from('match_players')
          .insert(matchPlayers)
          .select('*, players(id, name)');

        if (insertPlayersError) {
          throw insertPlayersError;
        }
        insertedPlayers = (playersData as MatchPlayerDetail[]) ?? [];
      }

      // Update player rating and stats in players table
      if (isCompleted && registeredIds.length > 0) {
        const team1Won = data.team_1_score! > data.team_2_score!;
        const team2Won = data.team_2_score! > data.team_1_score!;

        const playerUpdates: PromiseLike<unknown>[] = [];

        for (const p of data.team_1_players) {
          if (!p.player_id) continue;
          const player = playerMap.get(p.player_id);
          const currentRating = getPlayerRating(p.player_id);
          const newRating = currentRating + team1Delta;

          const updateObj =
            format === 'singles'
              ? {
                  singles_rating: newRating,
                  singles_matches_played:
                    (player?.singles_matches_played ?? 0) + 1,
                  singles_wins:
                    (player?.singles_wins ?? 0) + (team1Won ? 1 : 0),
                  singles_losses:
                    (player?.singles_losses ?? 0) + (team2Won ? 1 : 0),
                  rating: newRating,
                }
              : {
                  doubles_rating: newRating,
                  doubles_matches_played:
                    (player?.doubles_matches_played ?? 0) + 1,
                  doubles_wins:
                    (player?.doubles_wins ?? 0) + (team1Won ? 1 : 0),
                  doubles_losses:
                    (player?.doubles_losses ?? 0) + (team2Won ? 1 : 0),
                };

          try {
            const playersTable = supabase.from('players');
            if (playersTable && typeof playersTable.update === 'function') {
              const updateQuery = playersTable.update(updateObj);
              if (updateQuery && typeof updateQuery.eq === 'function') {
                playerUpdates.push(updateQuery.eq('id', p.player_id));
              }
            }
          } catch {
            // ignore
          }
        }

        for (const p of data.team_2_players) {
          if (!p.player_id) continue;
          const player = playerMap.get(p.player_id);
          const currentRating = getPlayerRating(p.player_id);
          const newRating = currentRating + team2Delta;

          const updateObj =
            format === 'singles'
              ? {
                  singles_rating: newRating,
                  singles_matches_played:
                    (player?.singles_matches_played ?? 0) + 1,
                  singles_wins:
                    (player?.singles_wins ?? 0) + (team2Won ? 1 : 0),
                  singles_losses:
                    (player?.singles_losses ?? 0) + (team1Won ? 1 : 0),
                  rating: newRating,
                }
              : {
                  doubles_rating: newRating,
                  doubles_matches_played:
                    (player?.doubles_matches_played ?? 0) + 1,
                  doubles_wins:
                    (player?.doubles_wins ?? 0) + (team2Won ? 1 : 0),
                  doubles_losses:
                    (player?.doubles_losses ?? 0) + (team1Won ? 1 : 0),
                };

          try {
            const playersTable = supabase.from('players');
            if (playersTable && typeof playersTable.update === 'function') {
              const updateQuery = playersTable.update(updateObj);
              if (updateQuery && typeof updateQuery.eq === 'function') {
                playerUpdates.push(updateQuery.eq('id', p.player_id));
              }
            }
          } catch {
            // ignore
          }
        }

        await Promise.allSettled(playerUpdates);
      }

      const updatedMatch: MatchDetail = {
        ...matchData,
        match_players: insertedPlayers,
      };

      setMatches((prev) => {
        const next = prev.map((m) => (m.id === id ? updatedMatch : m));
        return next.sort(
          (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
        );
      });

      setAlert({
        type: 'success',
        message: 'Мачът е обновен успешно.',
      });
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Грешка при обновяване на мач.');
      setError(msg);
      setAlert({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMatch = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        const msg = 'Supabase не е конфигуриран.';
        setError(msg);
        setAlert({ type: 'error', message: msg });
        return;
      }

      const { error: deleteError } = await supabase.from('matches').delete().eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setMatches((prev) => prev.filter((m) => m.id !== id));
      setAlert({
        type: 'success',
        message: 'Мачът е изтрит успешно.',
      });
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Грешка при изтриване на мач.');
      setError(msg);
      setAlert({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeMatches = async () => {
      try {
        if (!isSupabaseConfigured()) {
          const msg = 'Supabase не е конфигуриран.';
          if (isMounted) {
            setError(msg);
            setAlert({ type: 'error', message: msg });
          }
          return;
        }

        const { data, error: queryError } = await supabase
          .from('matches')
          .select(`
            *,
            match_players (
              *,
              players (
                id,
                name
              )
            )
          `)
          .order('played_at', { ascending: false });

        if (queryError) {
          throw queryError;
        }

        if (isMounted) {
          setMatches((data as MatchDetail[]) ?? []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = getErrorMessage(err, 'Грешка при зареждане на мачовете.');
          setError(msg);
          setAlert({ type: 'error', message: msg });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void initializeMatches();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    matches,
    loading,
    error,
    alert,
    fetchMatches,
    createMatch,
    updateMatch,
    deleteMatch,
    clearAlert,
  };
}
