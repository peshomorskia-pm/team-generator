-- Migration: Create Matches and Match Players Tables
-- Description: Sets up the matches and match_players tables with constraints, indexes, triggers, and permissive RLS policies.

CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_1_score INTEGER NOT NULL CHECK (team_1_score >= 0),
    team_2_score INTEGER NOT NULL CHECK (team_2_score >= 0),
    played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.match_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    guest_name TEXT,
    team_side TEXT NOT NULL CHECK (team_side IN ('team_1', 'team_2')),
    rating_before INTEGER,
    rating_after INTEGER,
    CONSTRAINT check_participant CHECK (
        (player_id IS NOT NULL AND guest_name IS NULL) OR 
        (player_id IS NULL AND guest_name IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_matches_played_at ON public.matches(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON public.match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON public.match_players(player_id);

-- Triggers
DROP TRIGGER IF EXISTS update_matches_updated_at ON public.matches;
CREATE TRIGGER update_matches_updated_at 
BEFORE UPDATE ON public.matches 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

-- Row Level Security
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for matches" ON public.matches;
CREATE POLICY "Enable all for matches" ON public.matches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for match_players" ON public.match_players;
CREATE POLICY "Enable all for match_players" ON public.match_players FOR ALL USING (true) WITH CHECK (true);
