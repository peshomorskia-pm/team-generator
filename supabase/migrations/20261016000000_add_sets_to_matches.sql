-- Add sets JSONB column to public.matches for tennis multi-set breakdowns
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS sets JSONB DEFAULT NULL;

COMMENT ON COLUMN public.matches.sets IS 'Array of match sets: [{ set_number: number, team_1_score: number, team_2_score: number }]';
