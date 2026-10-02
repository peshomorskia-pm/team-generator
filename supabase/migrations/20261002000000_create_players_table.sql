-- Migration: Create Players Table
-- Description: Sets up the players table with standard audit columns, triggers, and RLS policies.

CREATE TABLE IF NOT EXISTS public.players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    rating NUMERIC(7,2) NOT NULL DEFAULT 1200.00,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Trigger Function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for players table
CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON public.players
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies (For Local/Test Development)
CREATE POLICY "Enable read access for all users" ON public.players FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.players FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON public.players FOR DELETE USING (true);
