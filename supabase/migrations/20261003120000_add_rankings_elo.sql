-- Migration: Add ELO Ratings and Formats
-- Description: Adds dual singles/doubles ratings and statistics counters to players, format to matches, and numeric rating snapshot columns to match_players.

-- 1. Update players table
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS singles_rating NUMERIC(7,2) DEFAULT 1200.00 NOT NULL,
ADD COLUMN IF NOT EXISTS doubles_rating NUMERIC(7,2) DEFAULT 1200.00 NOT NULL,
ADD COLUMN IF NOT EXISTS singles_matches_played INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS singles_wins INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS singles_losses INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS doubles_matches_played INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS doubles_wins INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS doubles_losses INTEGER DEFAULT 0 NOT NULL;

-- Migrate existing rating if present, else default to 1200
UPDATE public.players 
SET singles_rating = COALESCE(rating, 1200.00), 
    doubles_rating = COALESCE(rating, 1200.00);

-- 2. Update matches table
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS match_format TEXT DEFAULT 'singles' NOT NULL CHECK (match_format IN ('singles', 'doubles'));

-- 3. Update match_players table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'match_players' 
        AND column_name = 'rating_before'
    ) THEN
        ALTER TABLE public.match_players 
        ALTER COLUMN rating_before TYPE NUMERIC(7,2);
    ELSE
        ALTER TABLE public.match_players 
        ADD COLUMN rating_before NUMERIC(7,2);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'match_players' 
        AND column_name = 'rating_after'
    ) THEN
        ALTER TABLE public.match_players 
        ALTER COLUMN rating_after TYPE NUMERIC(7,2);
    ELSE
        ALTER TABLE public.match_players 
        ADD COLUMN rating_after NUMERIC(7,2);
    END IF;
END $$;
