import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, ArrowRight, Loader2, AlertCircle, GraduationCap, Users, User, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { InstitutionData, Profile } from '../types';

interface StartFoodexaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountSetupSuccess: (data: { profile: Profile; institution: InstitutionData | null }) => void;
  onOpenLogin: () => void;
}

type AccountRole = 'student' | 'faculty' | 'guest';
type Step = 'create' | 'otp' | 'role' | 'details' | 'verified';
type InstitutionStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'error';

const roles = [
  { id: 'student' as const, icon: GraduationCap, title: 'Student' },
  { id: 'faculty' as const, icon: Users, title: 'Faculty' },
  { id: 'guest' as const, icon: User, title: 'Guest' },
];

const createFormInitial = { email: '', password: '', confirmPassword: '' };
const detailsFormInitial = { fullName: '', institutionCode: '' };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const friendlyAuthError = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes('already') || lower.includes('registered') || lower.includes('exists')) {
    return 'This email is already registered. Please log in instead.';
  }
  if (lower.includes('password')) {
    return 'Please use a stronger password.';
  }
  if (lower.includes('rate')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  return 'Unable to create your account right now. Please try again.';
};

export const StartFoodexaModal: React.FC<StartFoodexaModalProps> = ({
  isOpen,
  onClose,
  onAccountSetupSuccess,
  onOpenLogin,
}) => {
  const { validateInstitutionCode, setInstitutionData, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>('create');
  const [createForm, setCreateForm] = useState(createFormInitial);
  const [detailsForm, setDetailsForm] = useState(detailsFormInitial);
  const [selectedRole, setSelectedRole] = useState<AccountRole | null>(null);
  const [otp, setOtp] = useState(Array(8).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [institutionStatus, setInstitutionStatus] = useState<InstitutionStatus>('idle');
  const [verifiedInstitution, setVerifiedInstitution] = useState<InstitutionData | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!isOpen) {
      setStep('create');
      setCreateForm(createFormInitial);
      setDetailsForm(detailsFormInitial);
      setSelectedRole(null);
      setOtp(Array(8).fill(''));
      setLoading(false);
      setResending(false);
      setError(null);
      setDuplicateEmail(false);
      setInstitutionStatus('idle');
      setVerifiedInstitution(null);
    }
  }, [isOpen]);

  const normalizedEmail = useMemo(() => createForm.email.trim().toLowerCase(), [createForm.email]);
  const roleLabel = selectedRole ? selectedRole[0].toUpperCase() + selectedRole.slice(1) : '';
  const otpValue = otp.join('');

  if (!isOpen) return null;

  const resetInstitutionVerification = (institutionCode: string) => {
    setDetailsForm((prev) => ({ ...prev, institutionCode }));
    setInstitutionStatus('idle');
    setVerifiedInstitution(null);
    setError(null);
  };

  const handleClose = () => {
    onClose();
  };

  const handleOpenLogin = () => {
    onClose();
    onOpenLogin();
  };

  const sendOtp = async () => {
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: false },
    });

    if (otpError) {
      console.error('[StartFoodexa] OTP request failed:', otpError.message);
      return otpError;
    }
    return null;
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setDuplicateEmail(false);

    if (!emailPattern.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (createForm.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: createForm.password,
    });

    if (signUpError) {
      console.error('[StartFoodexa] signUp failed:', signUpError.message);
      const message = friendlyAuthError(signUpError.message);
      setDuplicateEmail(message.includes('already registered'));
      setError(message);
      setLoading(false);
      return;
    }

    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setDuplicateEmail(true);
      setError('This email is already registered. Please log in instead.');
      setLoading(false);
      return;
    }

    if (data.session) {
      await supabase.auth.signOut();
    }

    const otpError = await sendOtp();
    setLoading(false);

    if (otpError) {
      const message = friendlyAuthError(otpError.message);
      setDuplicateEmail(message.includes('already registered'));
      setError(message);
      return;
    }

    setStep('otp');
    window.setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setError(null);
    if (digit && index < 7) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!/^\d{8}$/.test(otpValue)) {
      setError('Please enter the 8-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    const emailAttempt = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: otpValue,
      type: 'email',
    });

    const result = emailAttempt.error
      ? await supabase.auth.verifyOtp({ email: normalizedEmail, token: otpValue, type: 'signup' })
      : emailAttempt;

    setLoading(false);

    if (result.error) {
      console.error('[StartFoodexa] OTP verification failed:', result.error.message);
      setError('Invalid or expired verification code. Please try again.');
      return;
    }

    setStep('role');
  };

  const handleResendCode = async () => {
    if (resending) return;
    setResending(true);
    setError(null);
    const otpError = await sendOtp();
    setResending(false);
    if (otpError) {
      console.error('[StartFoodexa] OTP resend failed:', otpError.message);
      setError('Unable to resend the code right now. Please try again.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || loading) return;

    const fullName = detailsForm.fullName.trim();
    const institutionCode = detailsForm.institutionCode.trim();

    setError(null);
    if (!fullName) {
      setError('Please enter your full name.');
      return;
    }
    if (!institutionCode) {
      setError('Please enter your institution code.');
      return;
    }

    setLoading(true);
    setInstitutionStatus('checking');
    setVerifiedInstitution(null);

    const verifyResult = await validateInstitutionCode(institutionCode);
    if (verifyResult.error || !verifyResult.data) {
      setLoading(false);
      const isRpcError = verifyResult.error?.toLowerCase().includes('unable to verify');
      setInstitutionStatus(isRpcError ? 'error' : 'invalid');
      setError(isRpcError ? 'Unable to verify the institution right now. Please try again.' : null);
      return;
    }

    setInstitutionStatus('valid');
    setVerifiedInstitution(verifyResult.data);

    const { data: authData, error: userError } = await supabase.auth.getUser();
    const authUser = authData.user;
    if (userError || !authUser) {
      console.error('[StartFoodexa] Unable to load authenticated user:', userError?.message);
      setError('Your session could not be loaded. Please log in again.');
      setLoading(false);
      return;
    }

    const profilePayload = {
      user_id: authUser.id,
      email: authUser.email || normalizedEmail,
      full_name: fullName,
      role: selectedRole,
      institution_id: verifyResult.data.institution_id,
    };

    const { data: savedProfile, error: profileError } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'user_id' })
      .select('user_id, email, full_name, phone, role, institution_id, department, semester, programme, campus_block, designation, avatar_url, diet_preference, created_at, updated_at')
      .maybeSingle();

    setLoading(false);

    if (profileError || !savedProfile) {
      console.error('[StartFoodexa] Profile save failed:', profileError?.message);
      setError('Unable to save your profile right now. Please try again.');
      return;
    }

    setInstitutionData(verifyResult.data);
    await refreshProfile();
    setStep('verified');
    onAccountSetupSuccess({ profile: savedProfile as Profile, institution: verifyResult.data });
  };

  const fieldClass = 'w-full rounded-2xl border border-[#D2D2D7] bg-white px-4 py-3 text-sm font-medium text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xl" onClick={handleClose}>
      <div
        className="relative my-8 w-full max-w-[480px] rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7] text-[#515154] transition-colors hover:bg-[#E8E8ED]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {step === 'create' && (
          <form onSubmit={handleCreateAccount} className="space-y-5">
            <div className="space-y-1.5 pr-8">
              <h3 className="text-[28px] font-bold text-[#1D1D1F]">Create your FOODEXA Account</h3>
              <p className="text-sm text-[#515154]">Create an account to access your campus dining experience.</p>
            </div>

            {error && (
              <div className="rounded-xl border border-[#FFD6D6] bg-[#FFF0F0] p-3 text-xs font-medium text-[#FF3B30]">
                {error}
                {duplicateEmail && (
                  <button type="button" onClick={handleOpenLogin} className="mt-2 block font-bold text-[#0071E3] hover:underline">
                    Go to Login
                  </button>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#515154]">Email Address *</label>
                <input type="email" required value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className={fieldClass} placeholder="you@example.com" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#515154]">Password *</label>
                <input type="password" required value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className={fieldClass} placeholder="Minimum 8 characters" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#515154]">Confirm Password *</label>
                <input type="password" required value={createForm.confirmPassword} onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })} className={fieldClass} placeholder="Re-enter password" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin text-white" /><span>Creating...</span></> : <><span>Create Account</span><ArrowRight className="h-4 w-4 text-white" /></>}
            </button>

            <button type="button" onClick={handleOpenLogin} className="w-full text-xs font-semibold text-[#0071E3] hover:underline">
              Already have an account? Login
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-1.5 pr-8">
              <h3 className="text-[28px] font-bold text-[#1D1D1F]">Verify Your Email</h3>
              <p className="text-sm text-[#515154]">We sent an 8-digit verification code to your email.</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-[#FFD6D6] bg-[#FFF0F0] p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B30]" />
                <p className="text-xs font-medium text-[#FF3B30]">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-8 gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => { otpRefs.current[index] = node; }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="h-12 rounded-xl border border-[#D2D2D7] bg-white text-center text-lg font-bold text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/10"
                />
              ))}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin text-white" /><span>Verifying...</span></> : <><span>Verify Email</span><ArrowRight className="h-4 w-4 text-white" /></>}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={handleResendCode} disabled={resending} className="rounded-2xl border border-[#D2D2D7] px-4 py-3 text-xs font-semibold text-[#1D1D1F] disabled:opacity-60">
                {resending ? <span className="inline-flex items-center gap-2"><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Resending</span> : 'Resend Code'}
              </button>
              <button type="button" onClick={() => setStep('create')} className="rounded-2xl border border-[#D2D2D7] px-4 py-3 text-xs font-semibold text-[#1D1D1F]">
                Change Email
              </button>
            </div>
          </form>
        )}

        {step === 'role' && (
          <div className="space-y-6">
            <div className="space-y-1.5 pr-8">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F2FFF8] px-3 py-1 text-xs font-semibold text-[#0A7A37]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Email Verified
              </div>
              <h3 className="text-[28px] font-bold text-[#1D1D1F]">Choose Your Role</h3>
            </div>

            <div className="grid gap-3">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role.id);
                      setStep('details');
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition-all hover:bg-[#F5F5F7]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F7] text-[#1D1D1F]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-[#1D1D1F]">{role.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 'details' && selectedRole && (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="space-y-1.5 pr-8">
              <h3 className="text-[28px] font-bold text-[#1D1D1F]">{roleLabel} Details</h3>
              <p className="text-sm text-[#515154]">Enter your name and verified campus institution code.</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-[#FFD6D6] bg-[#FFF0F0] p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B30]" />
                <p className="text-xs font-medium text-[#FF3B30]">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#515154]">Full Name *</label>
                <input type="text" required value={detailsForm.fullName} onChange={(e) => setDetailsForm({ ...detailsForm, fullName: e.target.value })} className={fieldClass} placeholder="Alex Paul" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#515154]">Institution Code *</label>
                <input
                  type="text"
                  required
                  value={detailsForm.institutionCode}
                  onChange={(e) => resetInstitutionVerification(e.target.value)}
                  className={`${fieldClass} font-mono font-bold`}
                  placeholder="Enter your institution code"
                />
                {institutionStatus === 'checking' && <p className="mt-2 text-xs font-semibold text-[#515154]">Checking institution...</p>}
                {institutionStatus === 'valid' && verifiedInstitution && (
                  <div className="mt-2 rounded-xl border border-[#B8F2D0] bg-[#F2FFF8] p-3 text-xs text-[#0A7A37]">
                    <p className="font-bold">Institution Code Verified</p>
                    <p className="mt-1 font-semibold">{verifiedInstitution.institution_name}</p>
                    <p>{[verifiedInstitution.campus, verifiedInstitution.city, verifiedInstitution.state || verifiedInstitution.country].filter(Boolean).join(' - ')}</p>
                  </div>
                )}
                {institutionStatus === 'invalid' && (
                  <div className="mt-2 rounded-xl border border-[#FFD6D6] bg-[#FFF0F0] p-3 text-xs text-[#FF3B30]">
                    <p className="font-bold">Invalid Institution Code</p>
                    <p>Please check the code and try again.</p>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin text-white" /><span>Saving...</span></> : <><span>Save Profile</span><ArrowRight className="h-4 w-4 text-white" /></>}
            </button>

            <button type="button" onClick={() => setStep('role')} className="w-full text-xs font-semibold text-[#515154] hover:text-[#1D1D1F]">
              Choose a different role
            </button>
          </form>
        )}

        {step === 'verified' && verifiedInstitution && (
          <div className="space-y-5 py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#B8F2D0] bg-[#F2FFF8] text-[#0A7A37]">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-[#1D1D1F]">Campus Ready</h3>
              <p className="text-sm font-semibold text-[#1D1D1F]">{verifiedInstitution.institution_name}</p>
              <p className="text-xs text-[#515154]">
                {[verifiedInstitution.campus, verifiedInstitution.city, verifiedInstitution.state || verifiedInstitution.country].filter(Boolean).join(' - ')}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#0A7A37]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading your campus...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
