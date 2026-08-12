import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  ArrowRight,
  Loader2,
  AlertCircle,
  GraduationCap,
  Users,
  User,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, OTP_LENGTH } from '../context/AuthContext';
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
type Step = 'account' | 'otp' | 'institution';
type InstitutionStatus = 'idle' | 'valid' | 'invalid' | 'error';

const roles = [
  { id: 'student' as const, icon: GraduationCap, label: 'Student' },
  { id: 'faculty' as const, icon: Users, label: 'Faculty' },
  { id: 'guest' as const, icon: User, label: 'Guest' },
];

const PENDING_VERIFICATION_EMAIL_KEY = 'foodexa_pending_verification_email';
const RESEND_COOLDOWN_SECONDS = 60;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialAccountForm = {
  fullName: '',
  email: '',
};

const getPendingVerificationEmail = () =>
  (sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY) || '').trim().toLowerCase();

const getInstitutionLocation = (institution: InstitutionData | null) =>
  [institution?.campus, institution?.city, institution?.state || institution?.country]
    .filter(Boolean)
    .join(' • ');

const mapOtpErrorMessage = (message: string) => {
  const lower = message.toLowerCase();

  if (lower.includes('expired')) {
    return 'This verification code has expired. Please request a new code.';
  }
  if (lower.includes('invalid') || lower.includes('otp') || lower.includes('token')) {
    return 'Invalid verification code. Please check the 8-digit code and try again.';
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('server') || lower.includes('rate limit') || lower.includes('too many')) {
    return 'Unable to send a new code. Please try again shortly.';
  }

  return 'Unable to verify right now. Please try again.';
};

const isExistingEmailError = (message: string) => {
  const lower = message.toLowerCase();
  return lower.includes('already') || lower.includes('registered') || lower.includes('exists');
};

export const StartFoodexaModal: React.FC<StartFoodexaModalProps> = ({
  isOpen,
  onClose,
  onAccountSetupSuccess,
  onOpenLogin,
}) => {
  const { validateInstitutionCode, setInstitutionData, refreshProfile, signUpWithOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<Step>('account');
  const [accountForm, setAccountForm] = useState(initialAccountForm);
  const [selectedRole, setSelectedRole] = useState<AccountRole | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [pendingSignupEmail, setPendingSignupEmail] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [verifiedInstitution, setVerifiedInstitution] = useState<InstitutionData | null>(null);
  const [institutionStatus, setInstitutionStatus] = useState<InstitutionStatus>('idle');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const fullName = accountForm.fullName.trim();
  const normalizedEmail = accountForm.email.trim().toLowerCase();
  const otpCode = otpDigits.join('');
  const isBusy = loading || resending;
  const canCreateAccount =
    !!fullName &&
    emailPattern.test(normalizedEmail) &&
    !!selectedRole;

  const fieldClass =
    'w-full rounded-2xl border border-[#D2D2D7] bg-white px-4 py-3 text-sm font-medium text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/10';

  const resetState = () => {
    setStep('account');
    setAccountForm(initialAccountForm);
    setSelectedRole(null);
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setPendingSignupEmail('');
    setInstitutionCode('');
    setVerifiedInstitution(null);
    setInstitutionStatus('idle');
    setResendCountdown(0);
    setLoading(false);
    setResending(false);
    setError(null);
    setDuplicateEmail(false);
    sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
  };

  useEffect(() => {
    if (isOpen) resetState();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [isOpen, resendCountdown]);

  useEffect(() => {
    if (step === 'otp') {
      window.setTimeout(() => otpRefs.current[0]?.focus(), 80);
    }
  }, [step]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleOpenLogin = () => {
    resetState();
    onOpenLogin();
  };

  const updateAccountField = (field: keyof typeof initialAccountForm, value: string) => {
    setAccountForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setDuplicateEmail(false);
  };

  const handleCreateAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isBusy) return;

    setError(null);
    setDuplicateEmail(false);

    if (!fullName || !emailPattern.test(normalizedEmail) || !selectedRole) return;

    setLoading(true);

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      setLoading(false);
      setDuplicateEmail(true);
      setError('An account with this email already exists. Please use Login instead.');
      return;
    }

    const { error: signUpError } = await signUpWithOtp(
      normalizedEmail,
      fullName,
      selectedRole
    );

    if (signUpError) {
      console.error('FOODEXA AUTH ERROR:', signUpError);
      setLoading(false);
      if (isExistingEmailError(signUpError.message)) {
        setDuplicateEmail(true);
        setError('This email is already registered.');
      } else {
        setError(signUpError.message || 'Unable to create your account right now. Please try again.');
      }
      return;
    }

    sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, normalizedEmail);
    setPendingSignupEmail(normalizedEmail);
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setResendCountdown(RESEND_COOLDOWN_SECONDS);
    setLoading(false);
    setStep('otp');
  };

  const handleOtpChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      setOtpDigits((prev) => prev.map((digit, digitIndex) => (digitIndex === index ? '' : digit)));
      setError(null);
      return;
    }

    setOtpDigits((prev) => {
      const next = [...prev];
      digits.slice(0, OTP_LENGTH - index).split('').forEach((digit, offset) => {
        next[index + offset] = digit;
      });
      return next;
    });

    const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
    window.setTimeout(() => otpRefs.current[nextIndex]?.focus(), 0);
    setError(null);
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      setOtpDigits((prev) => prev.map((digit, digitIndex) => (digitIndex === index - 1 ? '' : digit)));
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    setOtpDigits(Array.from({ length: OTP_LENGTH }, (_, index) => pasted[index] || ''));
    window.setTimeout(() => otpRefs.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus(), 0);
    setError(null);
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isBusy || otpCode.length !== OTP_LENGTH) {
      if (otpCode.length !== OTP_LENGTH) {
        setError('Please enter the complete 8-digit verification code.');
      }
      return;
    }

    const signupEmail = (getPendingVerificationEmail() || pendingSignupEmail).trim().toLowerCase();
    if (!signupEmail) {
      setError('Please restart signup so we can verify the correct email address.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: verifyError, profile: liveProfile, institution } = await verifyOtp(signupEmail, otpCode);

    setLoading(false);

    if (verifyError) {
      console.error('Supabase Auth Error:', verifyError);
      console.error('[FOODEXA AUTH] OTP verification error:', verifyError);
      setError(mapOtpErrorMessage(verifyError.message));
      return;
    }

    sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);

    if (liveProfile && liveProfile.institution_id && institution) {
      setInstitutionData(institution);
      setLoading(false);
      onAccountSetupSuccess({ profile: liveProfile, institution });
      return;
    }

    setInstitutionCode('');
    setInstitutionStatus('idle');
    setVerifiedInstitution(null);
    setStep('institution');
  };

  const handleResendCode = async () => {
    const signupEmail = (getPendingVerificationEmail() || pendingSignupEmail).trim().toLowerCase();
    if (resending || resendCountdown > 0 || !signupEmail) return;

    setResending(true);
    setError(null);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: signupEmail,
      options: {
        shouldCreateUser: true,
      },
    });

    setResending(false);

    if (otpError) {
      console.error('FOODEXA AUTH ERROR:', otpError);
      setError(mapOtpErrorMessage(otpError.message));
      return;
    }

    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setResendCountdown(RESEND_COOLDOWN_SECONDS);
    window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
  };

  const handleVerifyInstitution = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isBusy || !selectedRole) return;

    const code = institutionCode.trim().toUpperCase();
    if (!code) {
      setError('Institution Code is required.');
      return;
    }

    setLoading(true);
    setError(null);
    setInstitutionStatus('idle');
    setVerifiedInstitution(null);

    const { error: institutionError, data: institution } = await validateInstitutionCode(code);

    if (institutionError || !institution) {
      const isVerificationError = institutionError?.toLowerCase().includes('unable to verify');
      setInstitutionStatus(isVerificationError ? 'error' : 'invalid');
      setError(isVerificationError ? 'Unable to verify right now. Please try again.' : 'Invalid institution code. Please check your code and try again.');
      setLoading(false);
      return;
    }

    setVerifiedInstitution(institution);
    setInstitutionStatus('valid');

    const { data: authData, error: userError } = await supabase.auth.getUser();
    const authUser = authData?.user;

    if (userError || !authUser) {
      console.error('[StartFoodexa] Unable to load authenticated user:', userError?.message);
      setError('Unable to load your FOODEXA profile.');
      setLoading(false);
      return;
    }

    const profilePayload = {
      user_id: authUser.id,
      email: authUser.email || normalizedEmail,
      full_name: fullName,
      role: selectedRole,
      designation: selectedRole,
      institution_id: institution.institution_id,
      department: null,
      semester: null,
      programme: null,
      campus_block: null,
      avatar_url: null,
      diet_preference: 'all',
    };

    const profileColumns = 'id, user_id, institution_id, full_name, email, phone, role, created_at, updated_at, department, semester, programme, campus_block, designation, avatar_url, diet_preference';

    const { data: savedProfile, error: profileError } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'user_id' })
      .select(profileColumns)
      .maybeSingle();

    if (profileError || !savedProfile) {
      console.error('[StartFoodexa] Profile upsert failed:', profileError?.message);
      setError('Unable to load your FOODEXA profile.');
      setLoading(false);
      return;
    }

    setInstitutionData(institution);
    await refreshProfile();
    setLoading(false);
    onAccountSetupSuccess({
      profile: savedProfile as Profile,
      institution,
    });
  };

  const renderHeader = (title: string, subtitle: string) => (
    <div className="space-y-1.5 pr-8">
      <h3 className="text-[26px] font-bold leading-tight text-[#1D1D1F]">{title}</h3>
      <p className="text-sm leading-relaxed text-[#515154]">{subtitle}</p>
    </div>
  );



  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xl"
      onClick={handleClose}
    >
      <div
        className="relative my-8 w-full max-w-[540px] rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7] text-[#515154] transition-colors hover:bg-[#E8E8ED]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {step === 'account' && (
          <form onSubmit={handleCreateAccount} className="space-y-5">
            {renderHeader('Create your FOODEXA account', 'Start with your details, choose your role, and secure your account.')}

            {(error || duplicateEmail) && (
              <div className="rounded-xl border border-[#FFD6D6] bg-[#FFF0F0] p-3 text-xs font-medium text-[#FF3B30]">
                <p>{error}</p>
                {duplicateEmail && (
                  <>
                    <p className="mt-1">Please log in instead.</p>
                    <button
                      type="button"
                      onClick={handleOpenLogin}
                      className="mt-2 inline-flex items-center gap-1 font-bold text-[#0071E3] hover:underline"
                    >
                      GO TO LOGIN
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#515154]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={accountForm.fullName}
                  onChange={(event) => updateAccountField('fullName', event.target.value)}
                  className={fieldClass}
                  placeholder="A. Alex Paul"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#515154]">Email *</label>
                <input
                  type="email"
                  required
                  value={accountForm.email}
                  onChange={(event) => updateAccountField('email', event.target.value)}
                  className={fieldClass}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#515154]">Role *</label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role.id);
                          setError(null);
                        }}
                        className={`flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-2xl border px-2 text-xs font-bold transition ${
                          isSelected
                            ? 'border-[#0071E3] bg-[#EAF4FF] text-[#005BB5]'
                            : 'border-[#D2D2D7] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7]'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {role.label}
                      </button>
                    );
                  })}
                </div>
              </div>


            </div>

            <button
              type="submit"
              disabled={isBusy || !canCreateAccount}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>CREATE ACCOUNT</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </>
              )}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            {renderHeader('CHECK YOUR EMAIL', 'Enter the 8-digit verification code sent to:')}

            <p className="rounded-2xl bg-[#F5F5F7] px-4 py-3 text-center text-sm font-bold text-[#1D1D1F]">
              {getPendingVerificationEmail() || pendingSignupEmail}
            </p>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-[#FFD6D6] bg-[#FFF0F0] p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B30]" />
                <p className="text-xs font-medium text-[#FF3B30]">{error}</p>
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-semibold text-[#515154]">Verification Code *</label>
              <div className="flex justify-center gap-1.5 sm:gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      otpRefs.current[index] = node;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={handleOtpPaste}
                    className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl border border-[#D2D2D7] bg-white text-center font-mono text-base sm:text-lg font-bold text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/10"
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isBusy || otpCode.length !== OTP_LENGTH}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>VERIFY CODE</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending || resendCountdown > 0}
              className="w-full rounded-2xl border border-[#D2D2D7] px-4 py-3 text-xs font-semibold text-[#1D1D1F] disabled:opacity-60"
            >
              {resending ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  SENDING...
                </span>
              ) : resendCountdown > 0 ? (
                `RESEND AVAILABLE IN ${resendCountdown}s`
              ) : (
                'RESEND CODE'
              )}
            </button>
          </form>
        )}

        {step === 'institution' && (
          <form onSubmit={handleVerifyInstitution} className="space-y-5">
            {renderHeader('JOIN YOUR INSTITUTION', 'Enter your institution code to continue.')}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-[#FFD6D6] bg-[#FFF0F0] p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B30]" />
                <p className="text-xs font-medium text-[#FF3B30]">{error}</p>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#515154]">Institution Code *</label>
              <input
                type="text"
                required
                value={institutionCode}
                onChange={(event) => {
                  setInstitutionCode(event.target.value.toUpperCase());
                  setError(null);
                  setInstitutionStatus('idle');
                  setVerifiedInstitution(null);
                }}
                className={`${fieldClass} font-mono font-bold uppercase`}
                placeholder="Institution Code"
              />

              {institutionStatus === 'valid' && verifiedInstitution && (
                <div className="mt-3 rounded-xl border border-[#B8F2D0] bg-[#F2FFF8] p-3 text-xs text-[#0A7A37]">
                  <p className="font-bold">✓ Institution Code Verified</p>
                  <p className="mt-1 font-semibold text-[#1D1D1F]">{verifiedInstitution.institution_name}</p>
                  <p>{verifiedInstitution.campus}</p>
                  <p>{getInstitutionLocation(verifiedInstitution)}</p>
                </div>
              )}

              {institutionStatus === 'invalid' && (
                <div className="mt-3 rounded-xl border border-[#FFD6D6] bg-[#FFF0F0] p-3 text-xs text-[#FF3B30]">
                  <p className="font-bold">Invalid institution code.</p>
                  <p>Please check your code and try again.</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isBusy || !institutionCode.trim()}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Entering dashboard...</span>
                </>
              ) : (
                <>
                  <span>ENTER DASHBOARD</span>
                  <ArrowRight className="h-4 w-4 text-white" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
