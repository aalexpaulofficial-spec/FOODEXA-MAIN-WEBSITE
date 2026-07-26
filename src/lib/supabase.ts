import { createClient } from '@supabase/supabase-js';

// Trim any accidental newlines/whitespace that may be injected from env vars
const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '').trim();

const envMissing = !rawUrl || !rawKey;

if (envMissing) {
  console.error(
    '[Foodexa] Supabase env vars are missing. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel.'
  );
}

// IMPORTANT: createClient throws synchronously if supabaseUrl is empty,
// which crashes the module before React can mount. We use safe placeholder
// values so the app still renders; all DB calls will simply fail gracefully.
const supabaseUrl = rawUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

