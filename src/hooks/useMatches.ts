import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AlertNotification } from '../types';
import type { MatchDetail, MatchFormData, MatchPlayerDetail } from '../types/matches';

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

      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert({
          team_1_score: data.team_1_score,
          team_2_score: data.team_2_score,
          played_at: data.played_at,
        })
        .select()
        .single();

      if (matchError) {
        throw matchError;
      }

      const matchPlayers = [
        ...data.team_1_players.map((p) => ({
          match_id: matchData.id,
          player_id: p.player_id ?? null,
          guest_name: p.guest_name ?? null,
          team_side: 'team_1' as const,
        })),
        ...data.team_2_players.map((p) => ({
          match_id: matchData.id,
          player_id: p.player_id ?? null,
          guest_name: p.guest_name ?? null,
          team_side: 'team_2' as const,
        })),
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

      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .update({
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

      const matchPlayers = [
        ...data.team_1_players.map((p) => ({
          match_id: id,
          player_id: p.player_id ?? null,
          guest_name: p.guest_name ?? null,
          team_side: 'team_1' as const,
        })),
        ...data.team_2_players.map((p) => ({
          match_id: id,
          player_id: p.player_id ?? null,
          guest_name: p.guest_name ?? null,
          team_side: 'team_2' as const,
        })),
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
