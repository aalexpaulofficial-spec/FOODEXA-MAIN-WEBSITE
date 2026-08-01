# FOODEXA — Email OTP Auth Flow: Production Setup Checklist

This document describes the Supabase dashboard settings that must be configured
for the Email OTP registration flow to work. The code changes in
`src/context/AuthContext.tsx` and `src/components/AuthModal.tsx` make the
frontend robust, but **email delivery and the OTP template live in the
Supabase dashboard** — those cannot be changed from source code.

## How to verify quickly

Run the diagnostic script (it prints the live auth settings + an end-to-end
API test that creates a throwaway user, sends an OTP request, and cleans up):

```bash
npm run diag:auth      # or: node scripts/check-auth-flow.mjs
npm run lint           # tsc --noEmit — confirm everything compiles
```

> If your local node uses a corporate TLS proxy, set
> `NODE_TLS_REJECT_UNAUTHORIZED=0` when running the script. The deployed app
> on Vercel is unaffected.

---

## 1. Confirm Email must be ON

Supabase setting: **Authentication → Settings → "Confirm email"**

- Must be **ON** (i.e. `mailer_autoconfirm = false`).
- Current live value (read from `/auth/v1/settings`): **ON/auto-confirm (needs FIX)**.

Why: with auto-confirm ON, `signUp()` instantly logs the user in and the
"Confirm signup" email is never sent. The app now sends the OTP explicitly via
`signInWithOtp` in that case, but to guarantee real email verification you
should still enable "Confirm email". When enabled, `signUp()` sends the
**Confirm signup** email (containing the OTP) and returns **no session**, so
the user is fully blocked until they verify.

## 2. SMTP configuration

Supabase setting: **Authentication → Providers → Email → SMTP**

Either:
- Use the **Supabase default** built-in email provider (sufficient for most
  cases; emails come from `no-reply@supabase.co` / `auth.emails.supabase.com`), **or**
- Configure a **custom SMTP** (e.g. Resend, SendGrid) with:
  - Host, Port (587 / 465), User, Password
  - A **verified sender** (e.g. `noreply@your-domain.com`)

If using a custom domain (Resend):
- Add the **verified domain** in Resend.
- Confirm **SPF**, **DKIM**, and **DMARC** DNS records for that domain so the
  emails are not flagged as spam.

Verify the address is deliverable: send a test OTP to a real student email
and check the inbox + spam folder.

## 3. Email templates must contain the OTP token

Supabase setting: **Authentication → Email Templates**

| Template | Must contain | Notes |
|---|---|---|
| **Magic Link** | `{{ .Token }}` **and** `{{ .ConfirmationURL }}` | The OTP the app collects is read from `{{ .Token }}`. If the template omits it, students receive an email with no code → "not receiving OTP". |
| **Confirm signup** | `{{ .Token }}` (and `{{ .ConfirmationURL }}`) | Used when "Confirm email" is ON. The 6/8-digit code must be present. |

Tip: keep the default templates, or ensure any customization still renders
`{{ .Token }}` as visible text (not only inside a link).

## 4. OTP settings

Supabase setting: **Authentication → Settings → OTP**

- **OTP expiry**: keep the default (10 minutes / 600s) or set as intended.
- **OTP length**: set to **8** if you want 8-digit codes, or **6** for the
  Supabase default. The fixed app accepts **6 to 8** digits, so either works —
  just keep this setting consistent with what your template renders.

## 5. Auth redirect URLs (for the magic-link fallback)

Supabase setting: **Authentication → Settings → "Redirect URLs"**

Add the production and local URLs so magic links resolve:

```
https://foodexa-six.vercel.app/auth/callback
http://localhost:2000/auth/callback
```

## 6. Flow summary (what the code does after these fixes)

```
Student Registration
  → supabase.auth.signUp({ email, password, options: { data } })        // ALWAYS used
  → If a session was returned (auto-confirm ON): signOut()              // block dashboard
  → Always send an OTP email via signInWithOtp({ email, shouldCreateUser:false })
      (uses the "Magic Link" template; works in BOTH autoconfirm modes)
  → Student receives OTP email (inbox/spam) and enters the code
  → verifyOtp({ email, token, type:'email' }) with fallback to type:'signup'
  → ONLY after verification succeeds → create profile (with institution_id)
  → redirect to dashboard
```

## 7. Login (existing verified users)

- Verified users `signInWithPassword(email, password)` normally.
- No OTP is requested on login. Existing verified users reach the dashboard
  directly. The `isPendingOtpVerification` guard only applies to the
  registration path.

## 8. Error handling / diagnostics

- All signup, OTP-send, verify, and profile-upsert steps now log structured
  messages to the browser console (prefixed `[Auth]`).
- The UI surfaces the **real** error message instead of generic strings.
- If students still don't receive the email after these fixes:
  1. Run `npm run diag:auth` and check the `signInWithOtp` result.
  2. Look in **Supabase Dashboard → Authentication → User → Recent logs/SMTP**
     for delivery errors (rejected domain, rate limit 60/hr/email, etc.).
  3. Confirm step 3 (template contains `{{ .Token }}`) above.
