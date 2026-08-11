import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  GraduationCap,
  Users,
  User,
  CheckCircle2,
  RefreshCw,
  Mail,
  Sparkles,
  Building2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { InstitutionData, Profile } from '../types';

interface StartFoodexaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountSetupSuccess: (data: { profile: Profile; institution: InstitutionData | null }) => void;
  onOpenLogin: () => void;
  onDirectAccess: () => void;
  mode?: 'entry' | 'google-onboarding';
}

type AccountRole = 'student' | 'faculty' | 'guest';
type Step = 'choice' | 'email' | 'otp' | 'role' | 'details' | 'verified';
type InstitutionStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'error';

const roles = [
  { id: 'student' as const, icon: GraduationCap, title: 'Student', description: 'Create a student account for your campus dining experience.' },
  { id: 'faculty' as const, icon: Users, title: 'Faculty', description: 'Set up a faculty account with the right campus access.' },
  { id: 'guest' as const, icon: User, title: 'Guest', description: 'Create a guest account for temporary campus dining access.' },
];

const emailFormInitial = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const detailsFormInitial = {
  fullName: '',
  institutionCode: '',
};

const otpPattern = /^\d{6,8}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const safeTrim = (value: string) => value.trim();

const friendlyAuthError = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes('already') || lower.includes('registered') || lower.includes('exists')) {
    return 'This email is already registered. Please use Login instead.';
  }
  if (lower.includes('password')) {
    return 'Please use a stronger password.';
  }
  if (lower.includes('rate')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  return 'Unable to create your account right now. Please try again.';
};

const getInstitutionLocation = (institution: InstitutionData | null) =>
  [institution?.campus, institution?.city, institution?.state || institution?.country]
    .filter(Boolean)
    .join(' • ');

export const StartFoodexaModal: React.FC<StartFoodexaModalProps> = ({
  isOpen,
  onClose,
  onAccountSetupSuccess,
  onOpenLogin,
  onDirectAccess,
  mode = 'entry',
}) => {
  const { validateInstitutionCode, setInstitutionData, refreshProfile, user, profile: authProfile } = useAuth();

  const [step, setStep] = useState<Step>('choice');
  const [selectedRole, setSelectedRole] = useState<AccountRole | null>(null);
  const [emailForm, setEmailForm] = useState(emailFormInitial);
  const [detailsForm, setDetailsForm] = useState(detailsFormInitial);
  const [otpCode, setOtpCode] = useState('');
  const [pendingSignupEmail, setPendingSignupEmail] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [institutionStatus, setInstitutionStatus] = useState<InstitutionStatus>('idle');
  const [verifiedInstitution, setVerifiedInstitution] = useState<InstitutionData | null>(null);

  const verificationRequestRef = useRef(0);
  const validationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onboardingMode = mode === 'google-onboarding';

  const normalizedEmail = useMemo(() => emailForm.email.trim().toLowerCase(), [emailForm.email]);
  const displayName = useMemo(() => safeTrim(detailsForm.fullName || emailForm.fullName), [detailsForm.fullName, emailForm.fullName]);
  const isBusy = loading || resending;

  const resetState = () => {
    const suggestedName = safeTrim(authProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
    setStep(onboardingMode ? 'role' : 'choice');
    setSelectedRole(null);
    setEmailForm({
      ...emailFormInitial,
      fullName: onboardingMode ? suggestedName : '',
    });
    setDetailsForm({
      ...detailsFormInitial,
      fullName: onboardingMode ? suggestedName : '',
    });
    setOtpCode('');
    setPendingSignupEmail('');
    setOtpSuccessMessage(null);
    setLoading(false);
    setResending(false);
    setError(null);
    setDuplicateEmail(false);
    setInstitutionStatus('idle');
    setVerifiedInstitution(null);
    verificationRequestRef.current += 1;
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
      validationTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen, mode, authProfile?.full_name, user?.email]);

  useEffect(() => {
    if (!isOpen || step !== 'details') return;

    const institutionCode = detailsForm.institutionCode.trim();
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
      validationTimerRef.current = null;
    }

    if (!institutionCode) {
      setInstitutionStatus('idle');
      setVerifiedInstitution(null);
      return;
    }

    const requestId = ++verificationRequestRef.current;
    setInstitutionStatus('checking');
    setVerifiedInstitution(null);

    validationTimerRef.current = setTimeout(async () => {
      const { error: codeError, data } = await validateInstitutionCode(institutionCode);
      if (verificationRequestRef.current !== requestId) return;

      if (codeError || !data) {
        const status: InstitutionStatus = codeError?.toLowerCase().includes('unable to verify') ? 'error' : 'invalid';
        setInstitutionStatus(status);
        setVerifiedInstitution(null);
        return;
      }

      setInstitutionStatus('valid');
      setVerifiedInstitution(data);
    }, 450);

    return () => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
        validationTimerRef.current = null;
      }
    };
  }, [detailsForm.institutionCode, isOpen, step, validateInstitutionCode]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleOpenLogin = () => {
    resetState();
    onOpenLogin();
  };

  const handleDirectAccess = () => {
    resetState();
    onDirectAccess();
  };

  const requestVerificationOtp = async (email: string, fullName: string) => {
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        data: {
          full_name: fullName,
        },
      },
    });

    if (otpError) {
      console.error('[StartFoodexa] OTP request failed:', otpError.message);
      return otpError;
    }

    return null;
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;

    setError(null);
    setDuplicateEmail(false);
    setOtpSuccessMessage(null);

    const fullName = safeTrim(emailForm.fullName);
    const email = normalizedEmail;

    if (!fullName) {
      setError('Full name is required.');
      return;
    }
    if (!emailPattern.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (emailForm.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (emailForm.password !== emailForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: emailForm.password,
      options: {
        data: {
          full_name: fullName,
        },
      },
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
      setError('This email is already registered. Please use Login instead.');
      setLoading(false);
      return;
    }

    setPendingSignupEmail(email);

    if (data.session) {
      await supabase.auth.signOut();
    }

    const otpError = await requestVerificationOtp(email, fullName);
    setLoading(false);

    if (otpError) {
      const message = friendlyAuthError(otpError.message);
      setDuplicateEmail(message.includes('already registered'));
      setError(message);
      return;
    }

    setOtpCode('');
    setStep('otp');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;

    const token = otpCode.trim();
    if (!otpPattern.test(token)) {
      setError('Please enter the verification code from your email.');
      return;
    }

    const signupEmail = (pendingSignupEmail || normalizedEmail).trim().toLowerCase();
    if (!signupEmail) {
      setError('Please restart signup so we can verify the correct email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setOtpSuccessMessage(null);

    const emailAttempt = await supabase.auth.verifyOtp({
      email: signupEmail,
      token,
      type: 'email',
    });

    const result = emailAttempt.error
      ? await supabase.auth.verifyOtp({
          email: signupEmail,
          token,
          type: 'signup',
        })
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
    const signupEmail = (pendingSignupEmail || normalizedEmail).trim().toLowerCase();
    if (resending || !signupEmail) return;
    setResending(true);
    setError(null);
    setOtpSuccessMessage(null);
    const otpError = await requestVerificationOtp(signupEmail, safeTrim(emailForm.fullName));
    setResending(false);

    if (otpError) {
      console.error('[StartFoodexa] OTP resend failed:', otpError.message);
      setError('Unable to resend the code right now. Please try again.');
      return;
    }
    setOtpSuccessMessage('New verification code sent.');
  };

  const handleRoleSelect = (role: AccountRole) => {
    setSelectedRole(role);
    const suggestedName = safeTrim(authProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || emailForm.fullName);
    setDetailsForm((prev) => ({
      ...prev,
      fullName: safeTrim(prev.fullName) || suggestedName,
    }));
    setStep('details');
  };

  const handleDetailsChange = (field: 'fullName' | 'institutionCode', value: string) => {
    setDetailsForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'institutionCode') {
      setError(null);
      setInstitutionStatus('idle');
      setVerifiedInstitution(null);
    }
  };

  const handleEnterDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy || !selectedRole) return;

    const fullName = safeTrim(detailsForm.fullName || emailForm.fullName);
    const institutionCode = detailsForm.institutionCode.trim();

    if (!fullName) {
      setError('Full name is required.');
      return;
    }
    if (!institutionCode) {
      setError('Institution code is required.');
      return;
    }
    if (institutionStatus !== 'valid' || !verifiedInstitution) {
      setError('Please wait for your institution code to be verified.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data: authData, error: userError } = await supabase.auth.getUser();
    const authUser = authData?.user;

    if (userError || !authUser) {
      console.error('[StartFoodexa] Unable to load authenticated user:', userError?.message);
      setError('Your session could not be loaded. Please sign in again.');
      setLoading(false);
      return;
    }

    const profilePayload = {
      user_id: authUser.id,
      email: authUser.email || normalizedEmail,
      full_name: fullName,
      role: selectedRole,
      institution_id: verifiedInstitution.institution_id,
      department: null,
      semester: null,
      programme: null,
      campus_block: null,
    };

    const profileColumns = 'user_id, institution_id, full_name, email, phone, role, created_at, updated_at, department, semester, programme, campus_block';

    const { data: savedProfile, error: profileError } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'user_id' })
      .select(profileColumns)
      .maybeSingle();

    if (profileError || !savedProfile) {
      console.error('[StartFoodexa] Profile save failed:', profileError?.message);
      setError('Unable to save your profile right now. Please try again.');
      setLoading(false);
      return;
    }

    setInstitutionData(verifiedInstitution);
    await refreshProfile();
    setStep('verified');
    setLoading(false);
    onAccountSetupSuccess({
      profile: savedProfile as Profile,
      institution: verifiedInstitution,
    });
  };

  const fieldClass =
    'w-full rounded-2xl border border-[#D2D2D7] bg-white px-4 py-3 text-sm font-medium text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/10';

  const renderHeader = (title: string, subtitle: string) => (
    <div className="space-y-1.5 pr-8">
      <h3 className="text-[28px] font-bold text-[#1D1D1F]">{title}</h3>
      <p className="text-sm text-[#515154]">{subtitle}</p>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xl"
      onClick={handleClose}
    >
      <div
        className="relative my-8 w-full max-w-[520px] rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7] text-[#515154] transition-colors hover:bg-[#E8E8ED]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {!(onboardingMode && step === 'role') && step !== 'choice' && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              if (step === 'email') setStep('choice');
              else if (step === 'otp') setStep('email');
              else if (step === 'role') setStep('otp');
              else if (step === 'details') setStep('role');
              else if (step === 'verified') setStep('choice');
            }}
            className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7] text-[#515154] transition-colors hover:bg-[#E8E8ED]"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        {step === 'choice' && (
          <div className="space-y-6">
            <div className="space-y-3 pr-8">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F7] px-3 py-1 text-xs font-semibold text-[#1D1D1F]">
                <Sparkles className="h-3.5 w-3.5 text-[#0071E3]" />
                WELCOME TO FOODEXA
              </div>
              {renderHeader(
                'Choose how you\'d like to continue.',
                'Create a permanent account with email, or use direct access for temporary campus entry.'
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-[#FFD6D6] bg-[#FFF0F0] p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B30]" />
                <p className="text-xs font-medium text-[#FF3B30]">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="flex w-full items-start gap-3 rounded-2xl border border-[#D2D2D7] bg-white p-4 text-left transition hover:bg-[#F5F5F7]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F7] text-[#1D1D1F]">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1D1D1F]">CREATE ACCOUNT WITH EMAIL</p>
                  <p className="mt-1 text-xs text-[#515154]">
                    Create a FOODEXA account using your email and password.
                  </p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 text-[#515154]" />
              </button>

              <button
                type="button"
                onClick={handleDirectAccess}
                className="flex w-full items-start gap-3 rounded-2xl border border-[#D2D2D7] bg-white p-4 text-left transition hover:bg-[#F5F5F7]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F7] text-[#1D1D1F]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1D1D1F]">DIRECT ACCESS</p>
                  <p className="mt-1 text-xs text-[#515154]">
                    Enter your institution code and continue without creating a permanent account.
                  </p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 text-[#515154]" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenLogin}
              className="w-full text-xs font-semibold text-[#0071E3] hover:underline"
            >
              Already have an account? Go to Login
            </button>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleCreateAccount} className="space-y-5">
            {renderHeader('Create your FOODEXA account', 'Enter your name, email, and password to continue.')}

            {(error || duplicateEmail) && (
              <div className="rounded-xl border border-[#FFD6D6] bg-[#FFF0F0] p-3 text-xs font-medium text-[#FF3B30]">
                {error}
                {duplicateEmail && (
                  <button
                    type="button"
                    onClick={handleOpenLogin}
                    className="mt-2 block font-bold text-[#0071E3] hover:underline"
                  >
                    Go to Login
                  </button>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#515154]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={emailForm.fullName}
                  onChange={(e) => setEmailForm({ ...emailForm, fullName: e.target.value })}
                  className={fieldClass}
                  placeholder="Alex Paul"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#515154]">Email Address *</label>
                <input
                  type="email"
                  required
                  value={emailForm.email}
                  onChange={(e) => {
                    setEmailForm({ ...emailForm, email: e.target.value });
                    setPendingSignupEmail('');
                    setOtpSuccessMessage(null);
                  }}
                  className={fieldClass}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#515154]">Password *</label>
                <input
                  type="password"
                  required
                  value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  className={fieldClass}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#515154]">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={emailForm.confirmPassword}
                  onChange={(e) => setEmailForm({ ...emailForm, confirmPassword: e.target.value })}
                  className={fieldClass}
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenLogin}
              className="w-full text-xs font-semibold text-[#0071E3] hover:underline"
            >
              Already have an account? Login
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            {renderHeader(
              'CHECK YOUR EMAIL FOR YOUR VERIFICATION CODE',
              'Enter the verification code sent to your email.'
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-[#FFD6D6] bg-[#FFF0F0] p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B30]" />
                <p className="text-xs font-medium text-[#FF3B30]">{error}</p>
              </div>
            )}

            {otpSuccessMessage && (
              <div className="flex items-start gap-2 rounded-xl border border-[#B8F2D0] bg-[#F2FFF8] p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0A7A37]" />
                <p className="text-xs font-medium text-[#0A7A37]">{otpSuccessMessage}</p>
              </div>
            )}

            <div>
              <p className="mb-3 rounded-2xl bg-[#F5F5F7] px-4 py-3 text-center text-xs font-semibold text-[#515154]">
                Enter the verification code sent to:<br />
                <span className="text-[#1D1D1F]">{pendingSignupEmail || normalizedEmail}</span>
              </p>
              <label className="mb-1 block text-xs font-semibold text-[#515154]">Verification Code *</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8));
                  setError(null);
                  setOtpSuccessMessage(null);
                }}
                className={`${fieldClass} text-center font-mono text-xl tracking-[0.35em]`}
                placeholder="123456"
              />
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify Code</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="rounded-2xl border border-[#D2D2D7] px-4 py-3 text-xs font-semibold text-[#1D1D1F] disabled:opacity-60"
              >
                {resending ? (
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    SENDING...
                  </span>
                ) : (
                  'RESEND CODE'
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="rounded-2xl border border-[#D2D2D7] px-4 py-3 text-xs font-semibold text-[#1D1D1F]"
              >
                Change Email
              </button>
            </div>
          </form>
        )}

        {step === 'role' && (
          <div className="space-y-6">
            {renderHeader('Choose your role', 'Select the role that matches how you will use FOODEXA.')}

            <div className="grid gap-3">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition-all hover:bg-[#F5F5F7]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F7] text-[#1D1D1F]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1D1D1F]">{role.title}</p>
                      <p className="mt-1 text-xs text-[#515154]">{role.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#515154]" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 'details' && selectedRole && (
          <form onSubmit={handleEnterDashboard} className="space-y-5">
            {renderHeader(
              `${selectedRole[0].toUpperCase() + selectedRole.slice(1)} details`,
              'Confirm your name and verify your institution code before entering the dashboard.'
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-[#FFD6D6] bg-[#FFF0F0] p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B30]" />
                <p className="text-xs font-medium text-[#FF3B30]">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#515154]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={detailsForm.fullName}
                  onChange={(e) => handleDetailsChange('fullName', e.target.value)}
                  className={fieldClass}
                  placeholder={emailForm.fullName || 'Alex Paul'}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#515154]">Institution Code *</label>
                <input
                  type="text"
                  required
                  value={detailsForm.institutionCode}
                  onChange={(e) => handleDetailsChange('institutionCode', e.target.value)}
                  className={`${fieldClass} font-mono font-bold uppercase`}
                  placeholder="Enter your institution code"
                />

                {institutionStatus === 'checking' && (
                  <p className="mt-2 text-xs font-semibold text-[#515154]">Checking institution...</p>
                )}

                {institutionStatus === 'valid' && verifiedInstitution && (
                  <div className="mt-2 rounded-xl border border-[#B8F2D0] bg-[#F2FFF8] p-3 text-xs text-[#0A7A37]">
                    <p className="font-bold">Institution Code Verified</p>
                    <p className="mt-1 font-semibold">{verifiedInstitution.institution_code}</p>
                    <p className="mt-0.5">{verifiedInstitution.institution_name}</p>
                    <p>{getInstitutionLocation(verifiedInstitution)}</p>
                  </div>
                )}

                {institutionStatus === 'invalid' && (
                  <div className="mt-2 rounded-xl border border-[#FFD6D6] bg-[#FFF0F0] p-3 text-xs text-[#FF3B30]">
                    <p className="font-bold">Invalid Institution Code</p>
                    <p>Please check your code and try again.</p>
                  </div>
                )}

                {institutionStatus === 'error' && (
                  <div className="mt-2 rounded-xl border border-[#FFD6D6] bg-[#FFF0F0] p-3 text-xs text-[#FF3B30]">
                    <p className="font-bold">Unable to verify right now</p>
                    <p>Please try again in a moment.</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isBusy || !displayName || institutionStatus !== 'valid' || !verifiedInstitution}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Entering dashboard...</span>
                </>
              ) : (
                <>
                  <span>Enter Dashboard</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('role')}
              className="w-full text-xs font-semibold text-[#515154] hover:text-[#1D1D1F]"
            >
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
              <p className="text-xs text-[#515154]">{getInstitutionLocation(verifiedInstitution)}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#0A7A37]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading your dashboard...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
