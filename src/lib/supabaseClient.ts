import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '').trim();

if (!rawUrl || !rawKey) {
  console.error('[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set.');
}

// Use safe placeholder values so the app still renders if env vars are missing.
// All DB calls will fail gracefully rather than crashing the module at import time.
const supabaseUrl = rawUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

