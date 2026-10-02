-- Migration: Allow nullable match scores for upcoming/scheduled matches
-- Description: Alters matches table columns team_1_score and team_2_score to drop NOT NULL and set DEFAULT NULL.

ALTER TABLE public.matches 
ALTER COLUMN team_1_score DROP NOT NULL,
ALTER COLUMN team_1_score SET DEFAULT NULL,
ALTER COLUMN team_2_score DROP NOT NULL,
ALTER COLUMN team_2_score SET DEFAULT NULL;
