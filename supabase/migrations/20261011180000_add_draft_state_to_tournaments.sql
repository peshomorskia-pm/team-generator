-- Add draft_state column to tournaments table for persisting interactive board roster and state
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS draft_state JSONB DEFAULT NULL;

COMMENT ON COLUMN public.tournaments.draft_state IS 'Persisted draft state of the interactive team board, pool, groups, and schedule';
