import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Tournament,
  CreateTournamentInput,
  UpdateTournamentInput,
} from '../types/tournament';

export interface UseTournamentsReturn {
  tournaments: Tournament[];
  loading: boolean;
  error: Error | null;
  fetchTournaments: () => Promise<void>;
  createTournament: (input: CreateTournamentInput) => Promise<Tournament>;
  updateTournament: (id: string, input: UpdateTournamentInput) => Promise<Tournament>;
  deleteTournament: (id: string) => Promise<void>;
}

const toError = (err: unknown, fallback: string): Error => {
  if (err instanceof Error) {
    return err;
  }
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return new Error((err as { message: string }).message);
  }
  return new Error(fallback);
};

export function useTournaments(): UseTournamentsReturn {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        const err = new Error('Supabase не е конфигуриран.');
        setError(err);
        return;
      }

      const { data, error: queryError } = await supabase
        .from('tournaments')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setTournaments((data as Tournament[]) ?? []);
    } catch (err: unknown) {
      const errorObj = toError(err, 'Грешка при зареждане на турнирите.');
      setError(errorObj);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTournament = useCallback(
    async (input: CreateTournamentInput): Promise<Tournament> => {
      setLoading(true);
      setError(null);
      try {
        if (!isSupabaseConfigured()) {
          const err = new Error('Supabase не е конфигуриран.');
          setError(err);
          throw err;
        }

        const { data, error: insertError } = await supabase
          .from('tournaments')
          .insert(input)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        const created = data as Tournament;
        setTournaments((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
        return created;
      } catch (err: unknown) {
        const errorObj = toError(err, 'Грешка при създаване на турнир.');
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateTournament = useCallback(
    async (id: string, input: UpdateTournamentInput): Promise<Tournament> => {
      setLoading(true);
      setError(null);
      try {
        if (!isSupabaseConfigured()) {
          const err = new Error('Supabase не е конфигуриран.');
          setError(err);
          throw err;
        }

        const { data, error: updateError } = await supabase
          .from('tournaments')
          .update(input)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        const updated = data as Tournament;
        setTournaments((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated;
      } catch (err: unknown) {
        const errorObj = toError(err, 'Грешка при обновяване на турнир.');
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteTournament = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        if (!isSupabaseConfigured()) {
          const err = new Error('Supabase не е конфигуриран.');
          setError(err);
          throw err;
        }

        const { error: deleteError } = await supabase
          .from('tournaments')
          .delete()
          .eq('id', id);

        if (deleteError) {
          throw deleteError;
        }

        setTournaments((prev) => prev.filter((t) => t.id !== id));
      } catch (err: unknown) {
        const errorObj = toError(err, 'Грешка при изтриване на турнир.');
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const initializeTournaments = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!isSupabaseConfigured()) {
          const err = new Error('Supabase не е конфигуриран.');
          if (isMounted) {
            setError(err);
          }
          return;
        }

        const { data, error: queryError } = await supabase
          .from('tournaments')
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });

        if (queryError) {
          throw queryError;
        }

        if (isMounted) {
          setTournaments((data as Tournament[]) ?? []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errorObj = toError(err, 'Грешка при зареждане на турнирите.');
          setError(errorObj);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void initializeTournaments();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    tournaments,
    loading,
    error,
    fetchTournaments,
    createTournament,
    updateTournament,
    deleteTournament,
  };
}
