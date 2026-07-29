// Vercel Serverless Function: /api/validate-institution-code
// Uses the Supabase service role key to bypass RLS for anonymous institution code lookups.

export default async function handler(req, res) {
  // Allow CORS for the Vercel deployment
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code } = req.body || {};
  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'Institution code is required.' });
  }

  const trimmed = code.trim();
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseServerKey = supabaseServiceKey || supabaseAnonKey;

  if (!supabaseUrl || !supabaseServerKey) {
    console.error('[validate-institution-code] Missing Supabase env vars');
    return res.status(503).json({
      error: 'Institution verification is not configured yet. Please contact Foodexa support.',
      code: 'MISSING_SUPABASE_SERVER_ENV',
    });
  }

  try {
    const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/institutions?institution_code=ilike.${encodeURIComponent(trimmed)}&select=id,name,institution_name,campus,city,state,country,institution_code&limit=1`;
    const resp = await fetch(url, {
      headers: {
        'apikey': supabaseServerKey,
        'Authorization': `Bearer ${supabaseServerKey}`,
        'Accept': 'application/json',
      },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[validate-institution-code] Supabase error:', errText);
      const isMissingTable = resp.status === 404 || errText.includes('PGRST205') || errText.includes('Could not find the table');
      if (isMissingTable) {
        return res.status(503).json({
          error: 'Institution verification is being set up. Please try again after the Foodexa database is updated.',
          code: 'INSTITUTIONS_TABLE_MISSING',
        });
      }

      if (!supabaseServiceKey && (resp.status === 401 || resp.status === 403)) {
        return res.status(503).json({
          error: 'Institution verification needs the server Supabase service key in Vercel.',
          code: 'SUPABASE_SERVICE_KEY_REQUIRED',
        });
      }

      return res.status(502).json({
        error: 'Unable to verify Institution Code. Please try again.',
        code: 'SUPABASE_LOOKUP_FAILED',
      });
    }

    const rows = await resp.json();
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Institution Code not found.' });
    }

    const inst = rows[0];
    return res.status(200).json({
      institution_id: inst.id,
      institution_name: inst.name || inst.institution_name || '',
      campus: inst.campus || '',
      city: inst.city || '',
      state: inst.state || '',
      country: inst.country || '',
      institution_code: inst.institution_code || '',
    });
  } catch (err) {
    console.error('[validate-institution-code] Error:', err);
    return res.status(500).json({ error: 'Server error during institution code validation.' });
  }
}
