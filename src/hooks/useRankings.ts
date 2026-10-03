import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { PlayerRow } from '../types/database.types';
import type { MatchFormat } from '../types/match';
import type { Player } from '../types/player';
import type { RankingStats } from '../types/rankings';

export interface UseRankingsReturn {
  format: MatchFormat;
  setFormat: (format: MatchFormat) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  rankings: RankingStats[];
  rawRankings: RankingStats[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRankings(initialFormat: MatchFormat = 'singles'): UseRankingsReturn {
  const [format, setFormat] = useState<MatchFormat>(initialFormat);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        const msg = 'Supabase не е конфигуриран.';
        setError(msg);
        return;
      }

      const { data, error: queryError } = await supabase
        .from('players')
        .select('*');

      if (queryError) {
        throw queryError;
      }

      setPlayers(data ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Грешка при зареждане на класирането.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        if (!isSupabaseConfigured()) {
          const msg = 'Supabase не е конфигуриран.';
          if (isMounted) {
            setError(msg);
          }
          return;
        }

        const { data, error: queryError } = await supabase
          .from('players')
          .select('*');

        if (queryError) {
          throw queryError;
        }

        if (isMounted) {
          setPlayers(data ?? []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Грешка при зареждане на класирането.';
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  // Transform players into sorted RankingStats
  const rawRankings = useMemo<RankingStats[]>(() => {
    const isSingles = format === 'singles';

    const sortedPlayers = [...players].sort((a, b) => {
      const ratingA = isSingles
        ? (a.singles_rating ?? a.rating ?? 1200)
        : (a.doubles_rating ?? a.rating ?? 1200);
      const ratingB = isSingles
        ? (b.singles_rating ?? b.rating ?? 1200)
        : (b.doubles_rating ?? b.rating ?? 1200);

      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      return a.name.localeCompare(b.name);
    });

    return sortedPlayers.map((p, index) => {
      const matchesPlayed = isSingles
        ? (p.singles_matches_played ?? 0)
        : (p.doubles_matches_played ?? 0);
      const wins = isSingles ? (p.singles_wins ?? 0) : (p.doubles_wins ?? 0);
      const losses = isSingles ? (p.singles_losses ?? 0) : (p.doubles_losses ?? 0);
      const rating = isSingles
        ? (p.singles_rating ?? p.rating ?? 1200)
        : (p.doubles_rating ?? p.rating ?? 1200);
      const winRate =
        matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

      const domainPlayer: Player = {
        id: p.id,
        name: p.name,
        singles_rating: p.singles_rating ?? 1200,
        doubles_rating: p.doubles_rating ?? 1200,
        singles_matches_played: p.singles_matches_played ?? 0,
        singles_wins: p.singles_wins ?? 0,
        singles_losses: p.singles_losses ?? 0,
        doubles_matches_played: p.doubles_matches_played ?? 0,
        doubles_wins: p.doubles_wins ?? 0,
        doubles_losses: p.doubles_losses ?? 0,
        rating: p.rating,
        created_at: p.created_at,
        updated_at: p.updated_at,
      };

      return {
        rank: index + 1,
        player: domainPlayer,
        rating,
        matchesPlayed,
        wins,
        losses,
        winRate,
      };
    });
  }, [players, format]);

  // Apply search filtering
  const rankings = useMemo<RankingStats[]>(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) {
      return rawRankings;
    }
    return rawRankings.filter((item) =>
      item.player.name.toLowerCase().includes(query)
    );
  }, [rawRankings, searchTerm]);

  return {
    format,
    setFormat,
    searchTerm,
    setSearchTerm,
    rankings,
    rawRankings,
    loading,
    error,
    refresh: fetchRankings,
  };
}
