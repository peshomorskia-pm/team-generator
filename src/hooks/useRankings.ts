import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { PlayerRow } from '../types/database.types';
import type { MatchDetail } from '../types/matches';
import type { MatchFormat } from '../types/match';
import type { Player } from '../types/player';
import type { RankingStats } from '../types/rankings';
import { computePlayerSportsStats } from '../utils/standingsStats';

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
  const [matches, setMatches] = useState<MatchDetail[]>([]);
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

      const [playersRes, matchesRes] = await Promise.all([
        supabase.from('players').select('*'),
        supabase.from('matches').select(`
          *,
          match_players (
            *,
            players (
              id,
              name
            )
          )
        `),
      ]);

      if (playersRes.error) {
        throw playersRes.error;
      }
      if (matchesRes.error) {
        throw matchesRes.error;
      }

      setPlayers(playersRes.data ?? []);
      setMatches((matchesRes.data as MatchDetail[]) ?? []);
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

        const [playersRes, matchesRes] = await Promise.all([
          supabase.from('players').select('*'),
          supabase.from('matches').select(`
            *,
            match_players (
              *,
              players (
                id,
                name
              )
            )
          `),
        ]);

        if (playersRes.error) {
          throw playersRes.error;
        }
        if (matchesRes.error) {
          throw matchesRes.error;
        }

        if (isMounted) {
          setPlayers(playersRes.data ?? []);
          setMatches((matchesRes.data as MatchDetail[]) ?? []);
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

  // Compute sports statistics and rankings
  const rawRankings = useMemo<RankingStats[]>(() => {
    const isSingles = format === 'singles';
    const sportsStats = computePlayerSportsStats(players, matches, format);

    const playerMap = new Map<string, PlayerRow>();
    for (const p of players) {
      playerMap.set(p.id, p);
    }

    return sportsStats.map((s) => {
      const p = playerMap.get(s.playerId);
      const domainPlayer: Player = {
        id: s.playerId,
        name: s.name,
        singles_rating: p?.singles_rating ?? 1200,
        doubles_rating: p?.doubles_rating ?? 1200,
        singles_matches_played: p?.singles_matches_played ?? s.matchesPlayed,
        singles_wins: p?.singles_wins ?? s.wins,
        singles_losses: p?.singles_losses ?? s.losses,
        doubles_matches_played: p?.doubles_matches_played ?? s.matchesPlayed,
        doubles_wins: p?.doubles_wins ?? s.wins,
        doubles_losses: p?.doubles_losses ?? s.losses,
        rating: p?.rating,
        created_at: p?.created_at,
        updated_at: p?.updated_at,
      };

      return {
        rank: s.rank,
        player: domainPlayer,
        rating: isSingles
          ? (p?.singles_rating ?? p?.rating ?? 1200)
          : (p?.doubles_rating ?? p?.rating ?? 1200),
        matchesPlayed: s.matchesPlayed,
        wins: s.wins,
        losses: s.losses,
        winRate: s.winRate,
        gamesWon: s.gamesWon,
        gamesLost: s.gamesLost,
        gameDifference: s.gameDifference,
        form: s.form,
      };
    });
  }, [players, matches, format]);

  // Apply search filtering while preserving original rank
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
