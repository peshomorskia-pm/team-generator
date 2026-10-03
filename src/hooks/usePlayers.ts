import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { PlayerRow } from '../types/database.types';

export interface AlertNotification {
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface UsePlayersReturn {
  players: PlayerRow[];
  loading: boolean;
  error: string | null;
  alert: AlertNotification | null;
  fetchPlayers: () => Promise<void>;
  createPlayer: (name: string, rating?: number) => Promise<void>;
  updatePlayer: (id: string, name: string, rating: number) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
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

export function usePlayers(): UsePlayersReturn {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertNotification | null>(null);

  const clearAlert = useCallback(() => {
    setAlert(null);
  }, []);

  const fetchPlayers = useCallback(async () => {
    await Promise.resolve();
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
        .from('players')
        .select('*')
        .order('rating', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setPlayers(data ?? []);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Грешка при зареждане на играчите.');
      setError(msg);
      setAlert({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlayer = useCallback(async (name: string, rating?: number) => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        const msg = 'Supabase не е конфигуриран.';
        setError(msg);
        setAlert({ type: 'error', message: msg });
        return;
      }

      const trimmedName = name.trim();
      const finalRating =
        rating !== undefined && Number.isFinite(rating) && rating >= 0 ? rating : 1200;

      const { data, error: insertError } = await supabase
        .from('players')
        .insert({ name: trimmedName, rating: finalRating })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        setPlayers((prev) => {
          const next = [data, ...prev.filter((p) => p.id !== data.id)];
          return next.sort((a, b) => b.rating - a.rating);
        });
        setAlert({
          type: 'success',
          message: `Играчът "${data.name}" е добавен успешно.`,
        });
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Грешка при добавяне на играч.');
      setError(msg);
      setAlert({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlayer = useCallback(async (id: string, name: string, rating: number) => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        const msg = 'Supabase не е конфигуриран.';
        setError(msg);
        setAlert({ type: 'error', message: msg });
        return;
      }

      const trimmedName = name.trim();
      const finalRating = Number.isFinite(rating) && rating >= 0 ? rating : 1200;

      const { data, error: updateError } = await supabase
        .from('players')
        .update({ name: trimmedName, rating: finalRating })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      if (data) {
        setPlayers((prev) => {
          const next = prev.map((p) => (p.id === id ? data : p));
          return next.sort((a, b) => b.rating - a.rating);
        });
        setAlert({
          type: 'success',
          message: `Играчът "${data.name}" е обновен успешно.`,
        });
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Грешка при обновяване на играч.');
      setError(msg);
      setAlert({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePlayer = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        if (!isSupabaseConfigured()) {
          const msg = 'Supabase не е конфигуриран.';
          setError(msg);
          setAlert({ type: 'error', message: msg });
          return;
        }

        const playerToDelete = players.find((p) => p.id === id);
        const playerName = playerToDelete?.name;

        const { error: deleteError } = await supabase.from('players').delete().eq('id', id);

        if (deleteError) {
          throw deleteError;
        }

        setPlayers((prev) => prev.filter((p) => p.id !== id));
        setAlert({
          type: 'success',
          message: playerName
            ? `Играчът "${playerName}" е изтрит успешно.`
            : 'Играчът е изтрит успешно.',
        });
      } catch (err: unknown) {
        const msg = getErrorMessage(err, 'Грешка при изтриване на играч.');
        setError(msg);
        setAlert({ type: 'error', message: msg });
      } finally {
        setLoading(false);
      }
    },
    [players]
  );

  useEffect(() => {
    let isMounted = true;

    const initializePlayers = async () => {
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
          .from('players')
          .select('*')
          .order('rating', { ascending: false });

        if (queryError) {
          throw queryError;
        }

        if (isMounted) {
          setPlayers(data ?? []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = getErrorMessage(err, 'Грешка при зареждане на играчите.');
          setError(msg);
          setAlert({ type: 'error', message: msg });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void initializePlayers();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    players,
    loading,
    error,
    alert,
    fetchPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer,
    clearAlert,
  };
}
