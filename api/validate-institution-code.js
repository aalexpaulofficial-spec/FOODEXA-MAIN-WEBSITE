// Vercel Serverless Function: /api/validate-institution-code
// Uses the Supabase service role key to bypass RLS for anonymous institution code lookups.
// PRODUCTION: No hardcoded/seeded fallbacks — only live DB lookups.

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    // Allow CORS for the Vercel deployment
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        valid: false,
        message: 'Method Not Allowed'
      });
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
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Institution code is required.'
      });
    }

    const trimmed = String(code).trim().toUpperCase();

    const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/[^\x20-\x7E]/g, '').trim();
    const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/[^\x20-\x7E]/g, '').trim();

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[validate-institution-code] Missing Supabase server environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
      });
      return res.status(503).json({
        success: false,
        valid: false,
        message: 'Institution verification is not configured. Please contact Foodexa support.',
        code: 'MISSING_SUPABASE_SERVER_ENV'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: rows, error: dbError } = await supabase
      .from('institutions')
      .select('*')
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
          success: false,
          valid: false,
          message: 'Institution verification is being set up. Please try again shortly.',
          code: 'INSTITUTIONS_TABLE_MISSING'
        });
      }

      if (dbError.code === '42501' || (dbError.message && dbError.message.includes('permission'))) {
        return res.status(503).json({
          success: false,
          valid: false,
          message: 'Institution verification needs the Supabase service key configured in Vercel.',
          code: 'SUPABASE_SERVICE_KEY_REQUIRED'
        });
      }

      return res.status(500).json({
        success: false,
        valid: false,
        message: dbError.message || 'Database query failed.'
      });
    }

    if (!rows || rows.length === 0) {
      return res.status(200).json({
        success: false,
        valid: false,
        message: 'Institution code not found.'
      });
    }

    const inst = rows[0];

    if (!inst.id || typeof inst.id !== 'string' || inst.id.length < 10) {
      console.error('[validate-institution-code] Institution row missing valid id:', inst);
      return res.status(500).json({
        success: false,
        valid: false,
        message: 'Institution data is invalid. Please contact support.'
      });
    }

    const institutionName = inst.institution_name || inst.name || '';

    return res.status(200).json({
      success: true,
      valid: true,
      institution: {
        id: inst.id,
        name: institutionName,
        institution_name: institutionName,
        code: inst.institution_code || '',
        status: inst.status || 'active',
        campus: inst.campus || '',
        city: inst.city || '',
        state: inst.state || '',
        country: inst.country || ''
      }
    });
  } catch (err) {
    console.error('[validate-institution-code] Unexpected server error:', err);
    return res.status(500).json({
      success: false,
      valid: false,
      message: err?.message || 'Unexpected server error.'
    });
  }
}
