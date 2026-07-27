import React, { useState } from 'react';
import { X, Lock, User, ArrowRight, CheckCircle2, ExternalLink, ShieldCheck, KeyRound, Building2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'create';
  onLoginSuccess?: (data: { studentName: string; email: string; code: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'create'>(initialMode);
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpInstitutionCode, setOtpInstitutionCode] = useState('');

  // Create Student Account state
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    universityEmail: '',
    phone: '',
    programme: '',
    institutionCode: '',
    password: '',
    confirmPassword: '',
  });

  // Holds the resolved profile after login/register
  const [resolvedProfile, setResolvedProfile] = useState<{
    studentName: string;
    email: string;
    code: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('form');
    setError(null);
    setSuccessMessage(null);
    setOtpCode('');
    setOtpEmail('');
    setOtpInstitutionCode('');
    setOtpExpiresAt(null);
    onClose();
  };

  // ─── LOGIN ─────────────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      console.log('[Foodexa Auth] Login request:', { email: loginEmail });
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      console.log('[Foodexa Auth] Login response:', { data, error: authError });

      if (authError) {
        console.error('[Foodexa Auth] Login error:', authError);
        throw new Error(authError.message);
      }

      const user = data.user;
      const profile = {
        studentName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student',
        email: user?.email || loginEmail,
        code: user?.user_metadata?.institution_code || '',
      };
      setResolvedProfile(profile);
      setStep('success');
    } catch (err: any) {
      console.error('[Foodexa Auth] Login exception:', err);
      setError(err?.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── REGISTER (Send OTP) ───────────────────────────────────────────────────
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (studentForm.password !== studentForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!studentForm.institutionCode.trim()) {
      setError('Institution Code is required.');
      return;
    }

    setLoading(true);
    try {
      console.log('OTP Request', {
        email: studentForm.universityEmail,
        options: {
          shouldCreateUser: true,
        },
      });
      const response = await supabase.auth.signInWithOtp({
        email: studentForm.universityEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      console.log('OTP Response', response);
      console.log('OTP Error', response.error);
      console.log('OTP Data', response.data);

      if (response.error) {
        console.error('[Foodexa Auth] OTP send error:', response.error);
        setError(response.error.message);
        return;
      }

      setSuccessMessage('OTP sent successfully.');
      setOtpCode('');
      setOtpEmail(studentForm.universityEmail);
      setOtpInstitutionCode(studentForm.institutionCode.toUpperCase());
      setOtpExpiresAt(Date.now() + 10 * 60 * 1000);
      setStep('otp');
    } catch (err: any) {
      console.error('[Foodexa Auth] OTP send exception:', err);
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── VERIFY OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (otpCode.trim().length < 8) {
      setError('Please enter the complete 8-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      console.log('[Foodexa Auth] OTP verify request:', {
        email: studentForm.universityEmail,
        token: otpCode.trim(),
        type: 'email',
      });
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: studentForm.universityEmail,
        token: otpCode.trim(),
        type: 'email',
      });
      console.log('[Foodexa Auth] OTP verify response:', { data, error: verifyError });

      if (verifyError) {
        console.error('[Foodexa Auth] OTP verify error:', verifyError);
        throw new Error(verifyError.message);
      }

      console.log('[Foodexa Auth] getUser request');
      const getUserResponse = await supabase.auth.getUser();
      console.log('[Foodexa Auth] getUser response:', getUserResponse);

      if (getUserResponse.error) {
        console.error('[Foodexa Auth] getUser error:', getUserResponse.error);
        throw new Error(getUserResponse.error.message);
      }

      const user = getUserResponse.data.user;
      if (!user) {
        throw new Error('Authenticated user not found.');
      }

      console.log('[Foodexa Auth] profiles select request:', { user_id: user.id });
      const profileResponse = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      console.log('[Foodexa Auth] profiles select response:', profileResponse);

      let profile = profileResponse.data;
      if (profileResponse.error && profileResponse.error.code !== 'PGRST116') {
        console.error('[Foodexa Auth] profiles select error:', profileResponse.error);
        throw new Error(profileResponse.error.message);
      }

      if (!profile) {
        const newProfile = {
          user_id: user.id,
          email: user.email,
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            null,
          role: 'student',
        };
        console.log('[Foodexa Auth] profiles insert request:', newProfile);
        const insertProfileResponse = await supabase
          .from('profiles')
          .insert([newProfile])
          .select('*')
          .single();
        console.log('[Foodexa Auth] profiles insert response:', insertProfileResponse);

        if (insertProfileResponse.error) {
          console.error('[Foodexa Auth] profiles insert error:', insertProfileResponse.error);
          throw new Error(insertProfileResponse.error.message);
        }

        profile = insertProfileResponse.data;
      }

      setResolvedProfile({
        studentName: profile?.full_name || studentForm.fullName || user.email?.split('@')[0] || 'Student',
        email: profile?.email || user.email || otpEmail || studentForm.universityEmail,
        code: otpInstitutionCode || studentForm.institutionCode.toUpperCase(),
      });
      setOtpExpiresAt(null);
      setStep('success');
    } catch (err: any) {
      console.error('[Foodexa Auth] OTP verify exception:', err);
      setError(err?.message || 'OTP verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── RESEND OTP ────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      console.log('OTP Request', {
        email: studentForm.universityEmail,
        options: {
          shouldCreateUser: true,
        },
      });
      const response = await supabase.auth.signInWithOtp({
        email: studentForm.universityEmail,
        options: {
          shouldCreateUser: true,
        },
      });
      console.log('OTP Response', response);
      console.log('OTP Error', response.error);
      console.log('OTP Data', response.data);
      if (response.error) {
        console.error('[Foodexa Auth] Resend OTP error:', response.error);
        setError(response.error.message);
        return;
      }
      setOtpCode('');
      setOtpExpiresAt(Date.now() + 10 * 60 * 1000);
      setSuccessMessage('A new verification code has been sent to your email.');
    } catch (err: any) {
      console.error('[Foodexa Auth] Resend OTP exception:', err);
      setError(err?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── FORGOT PASSWORD ───────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!loginEmail) {
      setError('Please enter your university email above first, then click Forgot Password.');
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      console.log('[Foodexa Auth] Password reset request:', { email: loginEmail });
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(loginEmail);
      console.log('[Foodexa Auth] Password reset response:', { error: resetError });
      if (resetError) throw new Error(resetError.message);
      setError(null);
      alert(`Password reset instructions sent to ${loginEmail}`);
    } catch (err: any) {
      console.error('[Foodexa Auth] Password reset error:', err);
      setError(err?.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  // ─── CONTINUE TO PORTAL ────────────────────────────────────────────────────
  const handleContinueToPortal = () => {
    onClose();
    if (onLoginSuccess && resolvedProfile) {
      onLoginSuccess(resolvedProfile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── STEP 1: FORM ── */}
        {step === 'form' && (
          <div>
            {mode === 'login' ? (
              <div className="space-y-5">
                
                {/* Header */}
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Student Portal Login</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">Welcome Back</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sign in to your FOODEXA student account to order food, manage orders, access QR pickup, and use LX AI.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                    {error}
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">University Email</label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. alex@christuniversity.in"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Password</label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-400 focus:ring-emerald-500"
                      />
                      <span>Remember Me</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="text-emerald-400 font-medium hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <>
                        <span>Login</span>
                        <ArrowRight className="w-4 h-4 text-slate-950" />
                      </>
                    )}
                  </button>

                  {/* Institution Administrator Redirect Link */}
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                    <span>Institution Administrator? </span>
                    <a
                      href="https://portal.foodexa.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 font-bold hover:underline inline-flex items-center gap-1 ml-1"
                    >
                      <span>Open Institution Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="pt-2 text-center text-xs text-slate-400">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('create'); setError(null); setSuccessMessage(null); }}
                      className="text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Create Student Account
                    </button>
                  </div>
                </form>

              </div>
            ) : (
              /* Create Student Account View */
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono">
                    <User className="w-3.5 h-3.5" />
                    <span>Student Pass Registration</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">Create Student Account</h3>
                  <p className="text-xs text-slate-300">Sign up for instant queue skipping, express pickup, and LX AI dining recommendations.</p>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCreateSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={studentForm.fullName}
                      onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                      placeholder="e.g. Alex Paul"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">University Email</label>
                      <input
                        type="email"
                        required
                        value={studentForm.universityEmail}
                        onChange={(e) => setStudentForm({ ...studentForm, universityEmail: e.target.value })}
                        placeholder="e.g. alex@christuniversity.in"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={studentForm.phone}
                        onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">Programme</label>
                      <input
                        type="text"
                        required
                        value={studentForm.programme}
                        onChange={(e) => setStudentForm({ ...studentForm, programme: e.target.value })}
                        placeholder="e.g. B.Tech Computer Science"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">Institution Code</label>
                      <input
                        type="text"
                        required
                        value={studentForm.institutionCode}
                        onChange={(e) => setStudentForm({ ...studentForm, institutionCode: e.target.value })}
                        placeholder="e.g. CHRKNG2026"
                        className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">Password</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={studentForm.password}
                        onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">Confirm Password</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={studentForm.confirmPassword}
                        onChange={(e) => setStudentForm({ ...studentForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <>
                        <span>Proceed to OTP Email Verification</span>
                        <ArrowRight className="w-4 h-4 text-slate-950" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-400">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }}
                      className="text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Login
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: OTP EMAIL VERIFICATION ── */}
        {step === 'otp' && (
          <div className="space-y-5">
            <div className="space-y-1 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Verify Your Email OTP</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We sent an 8-digit security code to{' '}
                <strong className="text-emerald-400">{otpEmail || studentForm.universityEmail}</strong>
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block text-center">
                  8-Digit Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-emerald-500/60 focus:border-emerald-400 rounded-2xl py-3 text-center text-xl font-mono tracking-[0.5em] text-emerald-300 font-bold focus:outline-none shadow-inner"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-xs text-slate-400">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Institution Code: <strong className="text-emerald-400">{otpInstitutionCode || studentForm.institutionCode.toUpperCase()}</strong>
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Verify &amp; Join Campus Portal</span>
                  </>
                )}
              </button>

              <div className="text-center text-xs text-slate-400">
                Didn't receive code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-emerald-400 font-bold hover:underline cursor-pointer disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 3: SUCCESS CONFIRMATION ── */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-xl">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-white">
                {mode === 'login' ? 'Logged In Successfully!' : 'Email Verified & Account Joined!'}
              </h3>
              {resolvedProfile?.code && (
                <p className="text-xs text-emerald-400 font-mono font-semibold">
                  Institution Code: {resolvedProfile.code}
                </p>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
              Welcome, <strong className="text-white">{resolvedProfile?.studentName}</strong>. You now have access to your campus food ordering portal, Razorpay checkout, and QR pickup lockers.
            </p>
            <button
              onClick={handleContinueToPortal}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Launch Campus Student Portal</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
