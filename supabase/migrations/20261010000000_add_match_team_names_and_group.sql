-- Migration: Add custom team names and group name to matches
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS team_1_name TEXT NULL DEFAULT 'Отбор 1',
  ADD COLUMN IF NOT EXISTS team_2_name TEXT NULL DEFAULT 'Отбор 2',
  ADD COLUMN IF NOT EXISTS group_name TEXT NULL;

-- Backfill existing records
UPDATE public.matches
SET
  team_1_name = COALESCE(team_1_name, 'Отбор 1'),
  team_2_name = COALESCE(team_2_name, 'Отбор 2')
WHERE team_1_name IS NULL OR team_2_name IS NULL;
