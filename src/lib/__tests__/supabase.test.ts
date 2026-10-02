import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Supabase Client Module', () => {

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('isSupabaseConfigured', () => {
    it('returns true when both URL and anon key are provided', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'valid-anon-key');

      const { isSupabaseConfigured } = await import('../supabase');
      expect(isSupabaseConfigured()).toBe(true);
    });

    it('returns false when VITE_SUPABASE_URL is missing or empty', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', '');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'valid-anon-key');
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { isSupabaseConfigured } = await import('../supabase');
      expect(isSupabaseConfigured()).toBe(false);
    });

    it('returns false when VITE_SUPABASE_ANON_KEY is missing or empty', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { isSupabaseConfigured } = await import('../supabase');
      expect(isSupabaseConfigured()).toBe(false);
    });

    it('returns false when both environment variables are missing', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', '');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { isSupabaseConfigured } = await import('../supabase');
      expect(isSupabaseConfigured()).toBe(false);
    });
  });

  describe('Client Singleton Initialization', () => {
    it('creates and exports the singleton client when env vars are present without warning', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:54321');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'valid-test-key');

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { supabase, default: defaultSupabase } = await import('../supabase');

      expect(supabase).toBeDefined();
      expect(defaultSupabase).toBe(supabase);
      expect(typeof supabase.from).toBe('function');
      expect(typeof supabase.auth.signUp).toBe('function');
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Supabase environment variables')
      );
    });

    it('falls back to default local placeholders and logs warning when env vars are missing', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', '');
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { supabase } = await import('../supabase');

      expect(supabase).toBeDefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing or empty')
      );
    });
  });
});
