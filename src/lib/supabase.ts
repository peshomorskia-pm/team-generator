import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Checks whether both Supabase URL and Anon Key are present in environment variables.
 */
export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return (
    typeof url === 'string' &&
    url.trim().length > 0 &&
    typeof key === 'string' &&
    key.trim().length > 0
  );
};

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!isSupabaseConfigured()) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing or empty. Supabase client initialized with fallback placeholder values.'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
