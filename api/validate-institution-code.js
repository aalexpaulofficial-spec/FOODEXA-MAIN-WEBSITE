// Vercel Serverless Function: /api/validate-institution-code
// Uses the Supabase service role key to bypass RLS for anonymous institution code lookups.
// PRODUCTION: No hardcoded/seeded fallbacks — only live DB lookups.

import { createClient } from '@supabase/supabase-js';

const normalizeCode = (value) => String(value || '').trim().toUpperCase();

export default async function handler(req, res) {
  // Allow CORS for the Vercel deployment
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, message: 'Method Not Allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { code } = body;
  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ valid: false, message: 'Institution code is required.' });
  }

  const trimmed = normalizeCode(code);

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    '';
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';
  const supabaseServerKey = supabaseServiceKey || supabaseAnonKey;

  if (!supabaseUrl || !supabaseServerKey) {
    console.error('[validate-institution-code] Missing Supabase env vars:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey,
    });
    return res.status(503).json({
      valid: false,
      message: 'Institution verification is not configured. Please contact Foodexa support.',
      code: 'MISSING_SUPABASE_SERVER_ENV',
    });
  }

  try {
    // Create a Supabase client with the service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServerKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Query with status='active' filter, case-insensitive using ilike
    const { data: rows, error: dbError } = await supabase
      .from('institutions')
      .select('id, name, campus, city, state, country, institution_code')
      .eq('institution_code', trimmed)
      .eq('status', 'active')
      .limit(1);

    if (dbError) {
      console.error('[validate-institution-code] Supabase query error:', dbError);

      const isMissingTable =
        dbError.code === 'PGRST205' ||
        (dbError.message && dbError.message.includes('Could not find the table'));

      if (isMissingTable) {
        return res.status(503).json({
          valid: false,
          message: 'Institution verification is being set up. Please try again shortly.',
          code: 'INSTITUTIONS_TABLE_MISSING',
        });
      }

      if (dbError.code === '42501' || (dbError.message && dbError.message.includes('permission'))) {
        return res.status(503).json({
          valid: false,
          message: 'Institution verification needs the Supabase service key configured in Vercel.',
          code: 'SUPABASE_SERVICE_KEY_REQUIRED',
        });
      }

      return res.status(502).json({
        valid: false,
        message: 'Unable to verify Institution Code. Please try again.',
        code: 'SUPABASE_LOOKUP_FAILED',
      });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ valid: false, message: 'Institution code not found.' });
    }

    const inst = rows[0];

    // Validate the returned institution has a real UUID id
    if (!inst.id || typeof inst.id !== 'string' || inst.id.length < 10) {
      console.error('[validate-institution-code] Institution row missing valid id:', inst);
      return res.status(500).json({ valid: false, message: 'Institution data is invalid. Please contact support.' });
    }

    return res.status(200).json({
      valid: true,
      institution_name: inst.name || '',
      institution_id: inst.id,
      campus: inst.campus || '',
      city: inst.city || '',
      state: inst.state || '',
      country: inst.country || '',
      institution_code: inst.institution_code || '',
    });
  } catch (err) {
    console.error('[validate-institution-code] Unexpected error:', err?.message || err);
    return res.status(500).json({ valid: false, message: 'Unexpected server error.' });
  }
}
