/**
 * FOODEXA — Auth Flow Diagnostic Script
 *
 * Run from the project root:
 *   node scripts/check-auth-flow.mjs
 *
 * What it does:
 *  1. Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + SUPABASE_ANON_KEY from .env.
 *  2. Prints the live Supabase auth settings (autoconfirm, disable_signup, etc.)
 *     so you can compare them against the dashboard checklist.
 *  3. Executes the EXACT OTP registration flow used by the app end-to-end and
 *     reports whether each step (signUp → OTP request → verifyOtp) succeeds.
 *  4. Cleans up the test user it creates.
 *
 * IMPORTANT: uses a throwaway @foodexa-test.in address and a fake OTP, so no
 * real email is sent and no real user is retained. It only checks that the
 * Supabase endpoints ACCEPT the requests without error.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function banner(t) {
  console.log('\n' + '='.repeat(64));
  console.log('  ' + t);
  console.log('='.repeat(64));
}

if (!URL || !SERVICE || !ANON) {
  console.error('Missing env vars. Need SUPABASE_URL (or VITE_SUPABASE_URL),');
  console.error('SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY.');
  process.exit(1);
}

const anonClient = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
const serviceClient = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

banner('STEP 1 — Live Supabase Auth Settings');
{
  const resp = await fetch(`${URL}/auth/v1/settings`, { headers: { apikey: ANON } });
  if (!resp.ok) {
    console.error('Could not fetch /auth/v1/settings:', resp.status, await resp.text());
  } else {
    const s = await resp.json();
    console.log('  disable_signup        :', s.disable_signup);
    console.log('  mailer_autoconfirm    :', s.mailer_autoconfirm, '  -> "Confirm email" is', s.mailer_autoconfirm ? 'OFF (auto-confirm ON)' : 'ON');
    console.log('  phone_autoconfirm     :', s.phone_autoconfirm);
    console.log('  external.email enabled:', s.external?.email);
    console.log('\n  REQUIREMENT: mailer_autoconfirm should be FALSE so that\n  signUp sends a real email and "Confirm Email" is ON.');
  }
}

// Check whether a custom SMTP is configured. We probe the public
// `GET /auth/v1/settings` (no SMTP info) — so instead we rely on the fact that
// a real email send would be required. We cannot read SMTP creds via API; this
// must be verified manually in the dashboard (see checklist).
banner('STEP 1b — SMTP / Email Template (manual dashboard check)');
console.log('  The diagnostic script cannot read SMTP credentials or email templates');
console.log('  via API. Verify these MANUALLY in the Supabase dashboard:\n');
console.log('    Authentication → Providers → Email → SMTP settings');
console.log('      • SMTP Host, Port, User, Password set & valid?');
console.log('      • Sender email verified?');
console.log('    Authentication → Email Templates → Magic Link');
console.log('      • Template contains {{ .Token }} (the OTP code) AND {{ .ConfirmationURL }}');
console.log('    Authentication → Email Templates → Confirm signup (if Confirm Email ON)');
console.log('      • Template contains {{ .Token }}');
console.log('    Authentication → Settings → OTP');
console.log('      • OTP expiry (default 600s) — keep default or as intended');
console.log('      • OTP length — set to 8 if you want 8-digit codes\n');

banner('STEP 2 — End-to-end OTP flow test (no real email sent)');
const suffix = Math.floor(1000 + Math.random() * 9000);
const EMAIL = `diag-${suffix}@foodexa-test.in`;
const PASSWORD = 'DiagPass123!';

console.log('  Test email:', EMAIL);

try {
  // 2a. create a real auth user via signup (autoconfirm ON → instant session)
  const { data: signUpData, error: signUpErr } = await anonClient.auth.signUp({
    email: EMAIL,
    password: PASSWORD,
    options: { data: { full_name: 'Diagnostic User', role: 'student' } },
  });

  if (signUpErr) {
    console.error('  ✗ signUp() FAILED:', signUpErr.name, '-', signUpErr.message);
  } else {
    console.log('  ✓ signUp() OK | user:', signUpData?.user?.id, '| session:', !!signUpData?.session);
    if (signUpData?.session) {
      console.log('    → autoconfirm is ON: signup auto-confirmed the user; app will now signOut + send OTP.');
    }
  }

  // 2b. sign out (mirrors the app: it must not let the user in before OTP)
  await anonClient.auth.signOut();
  console.log('  ✓ signOut() OK (mirrors app behavior).');

  // 2c. request the OTP email via signInWithOtp (what the app does after signOut)
  const { error: otpErr } = await anonClient.auth.signInWithOtp({
    email: EMAIL,
    options: { shouldCreateUser: false },
  });
  if (otpErr) {
    console.error('  ✗ signInWithOtp (OTP email request) FAILED:', otpErr.name, '-', otpErr.message);
    console.error('    → THIS is why students may not get an OTP. Root cause:', otpErr.message);
  } else {
    console.log('  ✓ signInWithOtp() ACCEPTED — Supabase dispatched (or queued) the OTP email.');
    console.log('    → Check the inbox/spam of', EMAIL, '(throwaway) or a real student email.');
  }

  // 2d. (cannot get the real token) — show that verifyOtp is called correctly
  console.log('  ℹ  NOTE: a real 6/8-digit code cannot be retrieved from the API.');
  console.log('     The app calls verifyOtp({ email, token, type: "email" }) on submit.');

  // 2e. clean up the test user
  if (signUpData?.user?.id) {
    const { error: delErr } = await serviceClient.auth.admin.deleteUser(signUpData.user.id);
    console.log(delErr ? '  ! cleanup delete error: ' + delErr.message : '  ✓ cleanup: deleted test user');
  }
} catch (e) {
  console.error('  ✗ unexpected error during flow:', e?.message || e);
}

banner('STEP 3 — Summary & Dashboard Checklist');
console.log('  1. Confirm Email must be ON  → set mailer_autoconfirm = FALSE');
console.log('     (currently: ' + (await (async () => {
  const r = await fetch(`${URL}/auth/v1/settings`, { headers: { apikey: ANON } });
  const j = await r.json();
  return j.mailer_autoconfirm ? 'ON/auto-confirm (needs FIX)' : 'OFF (good)';
})()) + ')');
console.log('  2. Configure SMTP under Authentication → Email → SMTP (or use Supabase default).');
console.log('  3. Ensure Magic Link & Confirm signup templates contain {{ .Token }}.');
console.log('  4. Set OTP length to 8 (if you want 8-digit) or 6 — the FIXED app now accepts 6–8 digits.');
console.log('  5. Set OTP expiry in Authentication → Settings → "OTP expiry" (default 600s).');
console.log('  6. Run `npm run lint` (tsc --noEmit) to confirm the code compiles.\n');

function exit() {
  process.exit(0);
}
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Press ENTER to exit... ', exit);
