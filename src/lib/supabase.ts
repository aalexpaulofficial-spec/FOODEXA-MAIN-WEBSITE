import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Trim any accidental newlines/whitespace that may be injected from env vars
const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string || '').trim();
const rawKey = (
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '') ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string || '')
).trim();

const envMissing = !rawUrl || !rawKey;

if (envMissing) {
  throw new Error(
    '[Foodexa] Supabase env vars are missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

// Singleton pattern: prevent multiple GoTrueClient instances in browser context
// (causes "Multiple GoTrueClient instances detected" console warning)
const SUPABASE_CLIENT_KEY = '__foodexa_supabase_client__';

const g = globalThis as Record<string, unknown>;
let supabaseClient = g[SUPABASE_CLIENT_KEY] as SupabaseClient | undefined;

if (!supabaseClient) {
  supabaseClient = createClient(rawUrl, rawKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'foodexa-main-auth',
      // Enable anonymous sign-in support — invisible to students
      // If anonymous auth is disabled in Supabase, the app falls back to direct sessions
      flowType: 'pkce',
    },
  });
  g[SUPABASE_CLIENT_KEY] = supabaseClient;
}

export const supabase = supabaseClient;
