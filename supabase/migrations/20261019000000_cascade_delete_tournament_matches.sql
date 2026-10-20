-- Migration: Cascade delete tournament matches and match players on tournament deletion
-- 1. Drop existing foreign key constraint (default was ON DELETE SET NULL)
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_tournament_id_fkey;

-- 2. Re-create constraint with ON DELETE CASCADE
ALTER TABLE public.matches
  ADD CONSTRAINT matches_tournament_id_fkey
  FOREIGN KEY (tournament_id)
  REFERENCES public.tournaments(id)
  ON DELETE CASCADE;
