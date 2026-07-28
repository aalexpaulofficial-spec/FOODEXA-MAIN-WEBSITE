import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '').trim();

const envMissing = !rawUrl || !rawKey;

if (envMissing) {
  throw new Error(
    '[Foodexa] Supabase env vars are missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

export const supabase = createClient(rawUrl, rawKey);