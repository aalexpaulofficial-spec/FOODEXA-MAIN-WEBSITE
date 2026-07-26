import { createClient } from '@supabase/supabase-js';

// Trim any accidental newlines/whitespace that may be injected from env vars
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Foodexa] Supabase env vars are missing. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel.'
  );
}

// Use fallbacks so the app does not crash at startup even if env vars are absent
export const supabase = createClient(
  supabaseUrl || 'https://oxsbkwcmpsadbcceaalc.supabase.co',
  supabaseAnonKey ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c2Jrd2NtcHNhZGJjY2VhYWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMjAyNjksImV4cCI6MjA5OTU5NjI2OX0.' +
    'eJElI9vUOxX8bagwC95Civmv4vtnAnTNc_Fr9iJ6gsI'
);
