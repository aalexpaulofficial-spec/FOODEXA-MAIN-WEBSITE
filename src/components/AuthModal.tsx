import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Lock, User, ArrowRight, CheckCircle2, ExternalLink,
  ShieldCheck, KeyRound, Building2, Eye, EyeOff, Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'create';
  selectedRole?: 'student' | 'faculty' | 'guest';
  onLoginSuccess?: (data: { studentName: string; email: string; code: string; institutionName?: string }) => void;
}

// ── Password strength helper ────────────────────────────────────────────────
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Medium', color: 'bg-yellow-400' };
  if (score <= 3) return { score, label: 'Strong', color: 'bg-emerald-400' };
  return { score, label: 'Very Strong', color: 'bg-emerald-500' };
}

const OTP_LENGTH = 8;
const RESEND_COOLDOWN = 60; // seconds

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  selectedRole = 'student',
  onLoginSuccess,
}) => {
  const { signIn, signInWithOtp, verifyOtp, signUp } = useAuth();

  const [mode, setMode] = useState<'login' | 'create'>(initialMode);
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [authLoading, setAuthLoading] = useState(false);

  // ── Login state ─────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw, setShowLoginPw]     = useState(false);
  const [rememberMe, setRememberMe]       = useState(false);

  // ── Registration password fields ─────────────────────────────────────────
  const [regPassword, setRegPassword]       = useState('');
  const [regConfirm, setRegConfirm]         = useState('');
  const [showRegPw, setShowRegPw]           = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // ── OTP state: 8 separate boxes ──────────────────────────────────────────
  const [otpDigits, setOtpDigits]     = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const otpRefs                        = useRef<(HTMLInputElement | null)[]>([]);
  const [otpError, setOtpError]       = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const resendIntervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);
  const institutionCodeTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Shared flow state ────────────────────────────────────────────────────
  const [currentEmail, setCurrentEmail] = useState('');
  const [portalPayload, setPortalPayload] = useState<{ studentName: string; email: string; code: string; institutionName?: string } | null>(null);

  // ── Institution validation ───────────────────────────────────────────────
  const [institutionData, setInstitutionData]   = useState<{ id: string; name: string; campus: string; code: string } | null>(null);
  const [institutionLoading, setInstitutionLoading] = useState(false);
  const [institutionError, setInstitutionError] = useState<string | null>(null);

  // ── Per-role form state ──────────────────────────────────────────────────
  const [studentForm, setStudentForm] = useState({
    fullName: '', universityEmail: '', phone: '',
    programme: '', department: '', semester: '', campusBlock: '', institutionCode: '',
  });
  const [facultyForm, setFacultyForm] = useState({
    fullName: '', universityEmail: '', phone: '',
    department: '', designation: '', institutionCode: '',
  });
  const [guestForm, setGuestForm] = useState({
    fullName: '', universityEmail: '', phone: '', institutionCode: '',
  });

  const getCurrentForm = useCallback(() => {
    if (selectedRole === 'faculty') return facultyForm;
    if (selectedRole === 'guest')   return guestForm;
    return studentForm;
  }, [selectedRole, studentForm, facultyForm, guestForm]);

  // ── CRITICAL: sync mode + reset all state on open ───────────────────────
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStep('form');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setOtpError(null);
      setInstitutionData(null);
      setInstitutionError(null);
      setPortalPayload(null);
      setCurrentEmail('');
      setLoginEmail('');
      setLoginPassword('');
      setRegPassword('');
      setRegConfirm('');
      setShowLoginPw(false);
      setShowRegPw(false);
      setShowRegConfirm(false);
      setStudentForm({ fullName: '', universityEmail: '', phone: '', programme: '', department: '', semester: '', campusBlock: '', institutionCode: '' });
      setFacultyForm({ fullName: '', universityEmail: '', phone: '', department: '', designation: '', institutionCode: '' });
      setGuestForm({ fullName: '', universityEmail: '', phone: '', institutionCode: '' });
      stopResendTimer();
    }
  }, [isOpen, initialMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Resend countdown ─────────────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(RESEND_COOLDOWN);
    resendIntervalRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(resendIntervalRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const stopResendTimer = () => {
    if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
    setResendTimer(0);
  };

  useEffect(() => () => stopResendTimer(), []);
  useEffect(() => () => {
    if (institutionCodeTimerRef.current) clearTimeout(institutionCodeTimerRef.current);
  }, []);

  if (!isOpen) return null;

  // ── Institution validation ────────────────────────────────────────────────
  const validateInstitutionCode = async (code: string) => {
    const trimmed = code?.trim() || '';
    if (!trimmed) {
      setInstitutionError('Institution Code is required.');
      setInstitutionData(null);
      return null;
    }
    setInstitutionLoading(true);
    setInstitutionError(null);
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('id, institution_name, campus, institution_code, status')
        .ilike('institution_code', trimmed)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        setInstitutionError('Unable to verify Institution Code. Please try again.');
        setInstitutionData(null);
        return null;
      }
      if (!data) {
        setInstitutionError('Invalid Institution Code. Please check and try again.');
        setInstitutionData(null);
        return null;
      }
      const inst = { id: data.id, name: data.institution_name, campus: data.campus, code: data.institution_code };
      setInstitutionData(inst);
      return inst;
    } catch {
      setInstitutionError('Unable to verify Institution Code. Please try again.');
      setInstitutionData(null);
      return null;
    } finally {
      setInstitutionLoading(false);
    }
  };

  const handleInstitutionCodeChange = (code: string) => {
    if (institutionCodeTimerRef.current) clearTimeout(institutionCodeTimerRef.current);
    setInstitutionData(null);
    setInstitutionError(null);
    const trimmed = code.trim();
    if (!trimmed) return;
    institutionCodeTimerRef.current = setTimeout(() => {
      validateInstitutionCode(trimmed);
    }, 500);
  };

  const handleInstitutionCodeBlur = (code: string) => {
    if (institutionCodeTimerRef.current) clearTimeout(institutionCodeTimerRef.current);
    validateInstitutionCode(code.trim());
  };

  // ── LOGIN ────────────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setInstitutionError(null);
    try {
      const { error, profile } = await signIn(loginEmail.trim(), loginPassword);
      if (error) {
        alert(`Login failed: ${error.message}`);
        return;
      }
      let loginInstitution: typeof institutionData = null;
      if (profile?.institution_id || profile?.institution_code) {
        let q = supabase.from('institutions').select('id, institution_name, campus, institution_code');
        q = profile.institution_id
          ? q.eq('id', profile.institution_id)
          : q.ilike('institution_code', (profile.institution_code || '').trim());
        const { data } = await q.maybeSingle();
        if (data) {
          loginInstitution = { id: data.id, name: data.institution_name, campus: data.campus, code: data.institution_code };
          setInstitutionData(loginInstitution);
        }
      }
      const payload = {
        studentName: profile?.full_name || '',
        email: profile?.email || loginEmail.trim(),
        code: loginInstitution?.code || profile?.institution_code || '',
        institutionName: loginInstitution?.name,
      };
      setPortalPayload(payload);
      setCurrentEmail(loginEmail.trim());
      setStep('success');
    } finally {
      setAuthLoading(false);
    }
  };

  // ── REGISTER: validate → create user with password → send OTP ────────────
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = getCurrentForm();

    // Password validation
    if (regPassword.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }
    if (regPassword !== regConfirm) {
      alert('Passwords do not match. Please check and try again.');
      return;
    }

    // Validate institution code from Supabase (live, no hardcoding)
    const institution = await validateInstitutionCode(form.institutionCode);
    if (!institution) return;

    // Store verified code back
    if (selectedRole === 'student') setStudentForm((f) => ({ ...f, institutionCode: institution.code }));
    else if (selectedRole === 'faculty') setFacultyForm((f) => ({ ...f, institutionCode: institution.code }));
    else setGuestForm((f) => ({ ...f, institutionCode: institution.code }));

    setAuthLoading(true);
    const email = form.universityEmail.trim();
    setCurrentEmail(email);

    try {
      // Step 1: Create Supabase Auth user with password (secure account creation)
      const { error: signUpError } = await signUp(
        email,
        regPassword,
        form.fullName.trim(),
        selectedRole,
        institution.code,
      );

      // "User already registered" is acceptable — we'll still send OTP
      if (signUpError && !signUpError.message.toLowerCase().includes('already registered')) {
        alert(`Registration failed: ${signUpError.message}`);
        setAuthLoading(false);
        return;
      }

      // Step 2: Send Supabase email OTP for verification
      const { error: otpError } = await signInWithOtp(
        email,
        form.fullName.trim(),
        selectedRole,
        institution.code,
        form.phone.trim(),
        institution.id,
        institution.name,
        institution.campus,
      );

      if (otpError) {
        alert(`Failed to send OTP: ${otpError.message}`);
        setAuthLoading(false);
        return;
      }

      // Step 3: Show OTP verification screen
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setOtpError(null);
      setStep('otp');
      startResendTimer();
      // Auto-focus first OTP box after render
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setAuthLoading(false);
    }
  };

  // ── OTP box handlers ──────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setOtpError(null);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        const next = [...otpDigits];
        next[index] = '';
        setOtpDigits(next);
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtpDigits(next);
    const lastFilled = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[lastFilled]?.focus();
  };

  // ── VERIFY OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== OTP_LENGTH) {
      setOtpError(`Please enter all ${OTP_LENGTH} digits of your verification code.`);
      return;
    }

    setAuthLoading(true);
    setOtpError(null);

    const { error } = await verifyOtp(currentEmail, code);
    setAuthLoading(false);

    if (error) {
      setOtpError(`Verification failed: ${error.message}`);
      return;
    }

    stopResendTimer();
    const form = getCurrentForm();
    setPortalPayload({
      studentName: form.fullName || '',
      email: currentEmail,
      code: institutionData?.code || '',
      institutionName: institutionData?.name,
    });
    setStep('success');
  };

  // ── RESEND OTP ────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendTimer > 0 || !institutionData) return;
    setAuthLoading(true);
    const form = getCurrentForm();
    const { error } = await signInWithOtp(
      currentEmail,
      form.fullName.trim(),
      selectedRole,
      institutionData.code,
      form.phone.trim(),
      institutionData.id,
      institutionData.name,
      institutionData.campus,
    );
    setAuthLoading(false);
    if (error) {
      setOtpError(`Failed to resend OTP: ${error.message}`);
      return;
    }
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setOtpError(null);
    startResendTimer();
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  // ── CONTINUE TO PORTAL ────────────────────────────────────────────────────
  const handleContinueToPortal = () => {
    onClose();
    if (onLoginSuccess) {
      onLoginSuccess(portalPayload || {
        studentName: getCurrentForm().fullName || '',
        email: mode === 'login' ? loginEmail : currentEmail,
        code: institutionData?.code || '',
        institutionName: institutionData?.name,
      });
    }
  };

  const handleClose = () => {
    setStep('form');
    onClose();
  };

  const pwStrength = getPasswordStrength(regPassword);

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 space-y-6">

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── STEP 1: FORM (login or create) ─────────────────────────────── */}
        {step === 'form' && (
          <div>
            {mode === 'login' ? (

              /* ── LOGIN ── */
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Student Portal Login</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">Welcome Back</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sign in to your FOODEXA account to order food, manage orders, access QR pickup, and use LX AI.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">University Email</label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Enter your university email"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Password</label>
                    <div className="relative">
                      <input
                        type={showLoginPw ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPw(!showLoginPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
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
                      onClick={() => alert('Password reset instructions sent to your university email.')}
                      className="text-emerald-400 font-medium hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
                  >
                    <span>{authLoading ? 'Logging in...' : 'Login'}</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>

                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                    <span>Institution Login? </span>
                    <a
                      href="https://foodexa-institution-platform.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 font-bold hover:underline inline-flex items-center gap-1 ml-1"
                    >
                      <span>Open Institution Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </form>
              </div>

            ) : (

              /* ── CREATE ACCOUNT ── */
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono">
                    <User className="w-3.5 h-3.5" />
                    <span>
                      {selectedRole === 'student' ? 'Student Pass Registration' : selectedRole === 'faculty' ? 'Faculty Registration' : 'Guest Registration'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">
                    {selectedRole === 'student' ? 'Create Student Account' : selectedRole === 'faculty' ? 'Create Faculty Account' : 'Create Guest Account'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {selectedRole === 'student'
                      ? 'Sign up for instant queue skipping, express pickup, and LX AI dining recommendations.'
                      : 'Sign up to access campus dining services.'}
                  </p>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-3">

                  {/* Full Name */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={getCurrentForm().fullName}
                      onChange={(e) => {
                        if (selectedRole === 'student') setStudentForm({ ...studentForm, fullName: e.target.value });
                        else if (selectedRole === 'faculty') setFacultyForm({ ...facultyForm, fullName: e.target.value });
                        else setGuestForm({ ...guestForm, fullName: e.target.value });
                      }}
                      placeholder="Enter your full name"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {/* University Email + Phone */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">University Email</label>
                      <input
                        type="email"
                        required
                        value={getCurrentForm().universityEmail}
                        onChange={(e) => {
                          if (selectedRole === 'student') setStudentForm({ ...studentForm, universityEmail: e.target.value });
                          else if (selectedRole === 'faculty') setFacultyForm({ ...facultyForm, universityEmail: e.target.value });
                          else setGuestForm({ ...guestForm, universityEmail: e.target.value });
                        }}
                        placeholder="University email"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={getCurrentForm().phone}
                        onChange={(e) => {
                          if (selectedRole === 'student') setStudentForm({ ...studentForm, phone: e.target.value });
                          else if (selectedRole === 'faculty') setFacultyForm({ ...facultyForm, phone: e.target.value });
                          else setGuestForm({ ...guestForm, phone: e.target.value });
                        }}
                        placeholder="Phone number"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password + Confirm Password */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">Password</label>
                      <div className="relative">
                        <input
                          type={showRegPw ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPw(!showRegPw)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          {showRegPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {/* Password strength meter */}
                      {regPassword && (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-all ${i <= pwStrength.score ? pwStrength.color : 'bg-slate-800'}`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400">{pwStrength.label}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showRegConfirm ? 'text' : 'password'}
                          required
                          value={regConfirm}
                          onChange={(e) => setRegConfirm(e.target.value)}
                          placeholder="Re-enter password"
                          className={`w-full bg-slate-950 border focus:outline-none rounded-xl px-3 py-2 pr-9 text-xs text-white placeholder-slate-500 ${
                            regConfirm && regPassword !== regConfirm
                              ? 'border-red-500/60 focus:border-red-500'
                              : 'border-slate-800 focus:border-emerald-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirm(!showRegConfirm)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          {showRegConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                       {regConfirm && regPassword !== regConfirm && (
                         <p className="text-[10px] text-red-400 mt-1">✗ Passwords Do Not Match</p>
                       )}
                       {regConfirm && regPassword === regConfirm && (
                         <p className="text-[10px] text-emerald-400 mt-1">✓ Passwords Match</p>
                       )}
                    </div>
                  </div>

                  {/* Student-specific fields */}
                  {selectedRole === 'student' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-300 mb-1 block">Programme</label>
                          <input
                            type="text"
                            required
                            value={studentForm.programme}
                            onChange={(e) => setStudentForm({ ...studentForm, programme: e.target.value })}
                            placeholder="Enter your programme"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-300 mb-1 block">Institution Code</label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={studentForm.institutionCode}
                              onChange={(e) => {
                                setStudentForm({ ...studentForm, institutionCode: e.target.value });
                                handleInstitutionCodeChange(e.target.value);
                              }}
                              onBlur={() => handleInstitutionCodeBlur(studentForm.institutionCode)}
                              placeholder="e.g. CHRIST01"
                              className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none pr-8"
                            />
                            {institutionLoading && (
                              <Loader2 className="w-4 h-4 animate-spin text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            )}
                          </div>
                          {institutionError && (
                            <p className="text-[10px] text-red-400 mt-1">✗ Invalid Institution Code. Please check and try again.</p>
                          )}
                          {institutionData && !institutionError && !institutionLoading && (
                            <p className="text-[10px] text-emerald-400 mt-1">✓ Institution Code Verified</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-300 mb-1 block">Department</label>
                          <input
                            type="text"
                            required
                            value={studentForm.department}
                            onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                            placeholder="Enter your department"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-300 mb-1 block">Semester</label>
                          <input
                            type="text"
                            required
                            value={studentForm.semester}
                            onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })}
                            placeholder="Enter your semester"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 mb-1 block">Campus Block</label>
                        <input
                          type="text"
                          required
                          value={studentForm.campusBlock}
                          onChange={(e) => setStudentForm({ ...studentForm, campusBlock: e.target.value })}
                          placeholder="Enter your campus block"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Faculty-specific fields */}
                  {selectedRole === 'faculty' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-300 mb-1 block">Department</label>
                          <input
                            type="text"
                            required
                            value={facultyForm.department}
                            onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                            placeholder="Enter your department"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-300 mb-1 block">Designation</label>
                          <input
                            type="text"
                            required
                            value={facultyForm.designation}
                            onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                            placeholder="Enter your designation"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 mb-1 block">Institution Code</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={facultyForm.institutionCode}
                            onChange={(e) => {
                              setFacultyForm({ ...facultyForm, institutionCode: e.target.value });
                              handleInstitutionCodeChange(e.target.value);
                            }}
                            onBlur={() => handleInstitutionCodeBlur(facultyForm.institutionCode)}
                            placeholder="e.g. CHRIST01"
                            className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none pr-8"
                          />
                          {institutionLoading && (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          )}
                        </div>
                        {institutionError && (
                          <p className="text-[10px] text-red-400 mt-1">✗ Invalid Institution Code. Please check and try again.</p>
                        )}
                        {institutionData && !institutionError && !institutionLoading && (
                          <p className="text-[10px] text-emerald-400 mt-1">✓ Institution Code Verified</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Guest-specific fields */}
                  {selectedRole === 'guest' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">Institution Code</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={guestForm.institutionCode}
                          onChange={(e) => {
                            setGuestForm({ ...guestForm, institutionCode: e.target.value });
                            handleInstitutionCodeChange(e.target.value);
                          }}
                          onBlur={() => handleInstitutionCodeBlur(guestForm.institutionCode)}
                          placeholder="e.g. CHRIST01"
                          className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none pr-8"
                        />
                        {institutionLoading && (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        )}
                      </div>
                      {institutionError && (
                        <p className="text-[10px] text-red-400 mt-1">✗ Invalid Institution Code. Please check and try again.</p>
                      )}
                      {institutionData && !institutionError && !institutionLoading && (
                        <p className="text-[10px] text-emerald-400 mt-1">✓ Institution Code Verified</p>
                      )}
                    </div>
                  )}

                  {institutionData && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-[11px] text-emerald-300">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        <strong>{institutionData.name}</strong>
                        {institutionData.campus ? ` — ${institutionData.campus}` : ''}
                        {' '}
                        <span className="text-slate-400">({institutionData.code})</span>
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading || institutionLoading || (!!regConfirm && regPassword !== regConfirm) || !institutionData || pwStrength.score < 2}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>
                      {authLoading || institutionLoading
                        ? 'Validating & Sending OTP...'
                        : 'Send OTP & Verify Email'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: OTP VERIFICATION ────────────────────────────────────── */}
        {step === 'otp' && (
          <div className="space-y-5">
            <div className="space-y-1.5 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Verify Your Email</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We sent an <strong className="text-emerald-400">8-digit</strong> security code to{' '}
                <strong className="text-white">{currentEmail}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* 8-box OTP input */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block text-center">
                  Verification Code
                </label>
                <div className="flex gap-1.5 justify-center" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-10 h-12 rounded-xl text-center text-lg font-mono font-bold focus:outline-none transition-all border ${
                        digit
                          ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                          : 'bg-slate-950 border-slate-700 text-white focus:border-emerald-500'
                      } ${otpError ? 'border-red-500/70' : ''}`}
                    />
                  ))}
                </div>
                {otpError && (
                  <p className="text-[11px] text-red-400 text-center mt-2">{otpError}</p>
                )}
              </div>

              {/* Institution info */}
              {institutionData && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-xs text-slate-400">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-white">{institutionData.name}</strong>
                    {institutionData.campus ? ` — ${institutionData.campus}` : ''}
                    <br />
                    Code: <strong className="text-emerald-400">{institutionData.code}</strong>
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading || otpDigits.join('').length !== OTP_LENGTH}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>{authLoading ? 'Verifying...' : 'Verify & Join Campus Portal'}</span>
              </button>

              {/* Resend with countdown */}
              <div className="text-center text-xs text-slate-400">
                {resendTimer > 0 ? (
                  <span>Resend available in <strong className="text-emerald-400">{resendTimer}s</strong></span>
                ) : (
                  <>
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={authLoading}
                      className="text-emerald-400 font-bold hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 3: SUCCESS ──────────────────────────────────────────────── */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-xl">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-white">
                {mode === 'login' ? 'Logged In Successfully!' : 'Email Verified & Account Created!'}
              </h3>
              <p className="text-xs text-emerald-400 font-mono font-semibold">
                {portalPayload?.institutionName || institutionData?.name || 'Institution'}
                {institutionData?.campus ? ` — ${institutionData.campus}` : ''}
                {' '}({portalPayload?.code || institutionData?.code || '—'})
              </p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
              You now have access to Counter A, B, C & D menus, instant Razorpay checkout, and QR pickup lockers for your campus.
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
