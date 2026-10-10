-- Migration: Add round number to matches
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS round INTEGER NULL;
