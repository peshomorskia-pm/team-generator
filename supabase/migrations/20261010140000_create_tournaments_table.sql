-- Migration: Create tournaments table and link to matches
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  format TEXT NOT NULL DEFAULT 'doubles' CHECK (format IN ('singles', 'doubles')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  winner_team_name TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add tournament_id foreign key to matches
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS tournament_id UUID NULL REFERENCES public.tournaments(id) ON DELETE SET NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_date_status ON public.tournaments(date DESC, status);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON public.matches(tournament_id);

-- Updated_at trigger
CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on tournaments"
  ON public.tournaments FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on tournaments"
  ON public.tournaments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on tournaments"
  ON public.tournaments FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access on tournaments"
  ON public.tournaments FOR DELETE
  USING (true);
