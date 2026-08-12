import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, Lock, User, ArrowRight, ArrowLeft, CheckCircle2, ExternalLink, ShieldCheck, KeyRound, Building2, Users, Loader2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { UserRole, Profile } from '../types';

interface InstitutionData {
  institution_id: string;
  institution_name: string;
  campus: string;
  city: string;
  state: string;
  country: string;
  institution_code: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'create';
  selectedRole?: UserRole;
  onLoginSuccess?: (data: { profile: Profile; institution: InstitutionData | null }) => void;
  onBack?: () => void;
  onDirectLogin?: () => void;
}

type AccountRole = 'student' | 'faculty' | 'guest';
const ACCOUNT_ROLES: AccountRole[] = ['student', 'faculty', 'guest'];
const PENDING_VERIFICATION_EMAIL_KEY = 'foodexa_pending_verification_email';
const RESEND_COOLDOWN_SECONDS = 60;

const getPendingVerificationEmail = () =>
  (sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY) || '').trim().toLowerCase();

const mapOtpErrorMessage = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes('expired') || lower.includes('invalid') || lower.includes('otp') || lower.includes('token')) {
    return 'Invalid or expired verification code. Please check the latest code in your email and try again.';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Verification service is temporarily unavailable. Please try again.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Verification service is temporarily unavailable. Please try again.';
  }
  return message;
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  selectedRole = 'student',
  onLoginSuccess,
  onBack,
  onDirectLogin,
}) => {
  const { signUpWithPassword, verifyOtp, validateInstitutionCode, setInstitutionData, institutionData, signIn, user, refreshProfile, updateProfile, profile: authProfile } = useAuth();
  const [mode, setMode] = useState<'login' | 'create' | 'quick'>(initialMode);
  const [step, setStep] = useState<'form' | 'institution_verify' | 'counter_verify' | 'otp' | 'success' | 'profile_completion' | 'forgot_password'>('form');
  const [loginUserId, setLoginUserId] = useState<string | null>(null);
  const selectedAccountRole: AccountRole = ACCOUNT_ROLES.includes(selectedRole as AccountRole) ? (selectedRole as AccountRole) : 'student';

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);

  // Track the email used for the current OTP flow (login or create)
  const [currentEmail, setCurrentEmail] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateConfirmPassword, setShowCreateConfirmPassword] = useState(false);

  // Password strength helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: '', level: 0 };
    if (pass.length < 8) return { label: 'Weak', color: 'text-red-500', level: 1 };
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    if (pass.length >= 8 && hasUpper && hasNumber && hasSpecial) return { label: 'Very Strong', color: 'text-green-600', level: 4 };
    if (pass.length >= 8 && hasUpper && hasNumber) return { label: 'Strong', color: 'text-green-500', level: 3 };
    if (pass.length >= 8) return { label: 'Fair', color: 'text-yellow-500', level: 2 };
    return { label: 'Weak', color: 'text-red-500', level: 1 };
  };

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [registrationPhase, setRegistrationPhase] = useState<'idle' | 'validating' | 'connecting' | 'sending' | 'sent'>('idle');

  // Institution validation state
  const [validatedInstitution, setValidatedInstitution] = useState<InstitutionData | null>(null);
  const [institutionVerifyCode, setInstitutionVerifyCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [institutionError, setInstitutionError] = useState<string | null>(null);
  const [verifiedInstitution, setVerifiedInstitution] = useState<InstitutionData | null>(null);
  const institutionCodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Counter/Canteen code validation state
  const [counterCode, setCounterCode] = useState('');
  const [validatingCounter, setValidatingCounter] = useState(false);
  const [counterError, setCounterError] = useState<string | null>(null);
  const counterCodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create Student Account state
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    universityEmail: '',
    phone: '',
    programme: '',
    department: '',
    semester: '',
    campusBlock: '',
    institutionCode: '',
    password: '',
    confirmPassword: '',
  });

  // Create Faculty Account state
  const [facultyForm, setFacultyForm] = useState({
    fullName: '',
    universityEmail: '',
    phone: '',
    department: '',
    facultyId: '',
    institutionCode: '',
    password: '',
    confirmPassword: '',
  });

  // Create Guest Account state
  const [guestForm, setGuestForm] = useState({
    fullName: '',
    universityEmail: '',
    phone: '',
    institutionCode: '',
    password: '',
    confirmPassword: '',
  });

  const getCurrentForm = () => {
    switch (selectedAccountRole) {
      case 'student':
        return studentForm;
      case 'faculty':
        return facultyForm;
      case 'guest':
        return guestForm;
      default:
        return studentForm;
    }
  };

  const isCreatingAccount = registrationPhase !== 'idle';
  const registrationProgress = registrationPhase === 'validating'
    ? 28
    : registrationPhase === 'connecting'
      ? 58
      : registrationPhase === 'sending'
        ? 84
        : registrationPhase === 'sent'
          ? 100
          : 0;
  const registrationLabel = registrationPhase === 'validating'
    ? 'Validating Institution Code...'
    : registrationPhase === 'connecting'
      ? 'Connecting to Supabase...'
      : registrationPhase === 'sending'
        ? 'Generating & Sending OTP...'
        : registrationPhase === 'sent'
          ? 'OTP Email Sent'
          : 'Create Account';

 useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setStep('form');
    setCurrentEmail('');
    setOtpCode('');
    setValidatedInstitution(null);
    setInstitutionVerifyCode('');
    setVerifiedInstitution(null);
    setInstitutionError(null);
    setLoginError(null);
    setOtpError(null);
    setRegistrationPhase('idle');
    setIsLoginSubmitting(false);
    setResendCountdown(0);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen || resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [isOpen, resendCountdown]);

  useEffect(() => () => {
    if (institutionCodeTimerRef.current) clearTimeout(institutionCodeTimerRef.current);
    if (counterCodeTimerRef.current) clearTimeout(counterCodeTimerRef.current);
  }, []);

  const handleCounterCodeChange = (code: string) => {
    if (counterCodeTimerRef.current) clearTimeout(counterCodeTimerRef.current);
    setCounterError(null);
    const trimmed = code.trim();
    if (!trimmed) return;
    setValidatingCounter(true);
    counterCodeTimerRef.current = setTimeout(async () => {
      const userId = loginUserId || user?.id;
      if (!userId) {
        setCounterError('Unable to verify. Please sign in again.');
        setValidatingCounter(false);
        return;
      }
       const { data: profile } = await supabase.from('profiles').select('institution_id').eq('user_id', userId).maybeSingle();
       if (!profile?.institution_id) {
         setCounterError('Profile missing institution. Contact support.');
         setValidatingCounter(false);
         return;
       }
       const { data: counterRows, error: counterError } = await supabase
          .from('counters')
          .select('code')
          .eq('institution_id', profile.institution_id)
          .ilike('code', trimmed);
        if (counterError || !counterRows || counterRows.length === 0) {
          setCounterError('Invalid Counter Code');
        } else {
          setCounterError(null);
        }
        setValidatingCounter(false);
    }, 500);
  };

  const handleCounterCodeBlur = (code: string) => {
    if (counterCodeTimerRef.current) clearTimeout(counterCodeTimerRef.current);
    const trimmed = code.trim();
    if (!trimmed) return;
    setValidatingCounter(true);
    const userId = loginUserId || user?.id;
    if (!userId) {
      setCounterError('Unable to verify. Please sign in again.');
      setValidatingCounter(false);
      return;
    }
     supabase.from('profiles').select('institution_id').eq('user_id', userId).maybeSingle().then(({ data: profile }) => {
       if (!profile?.institution_id) {
         setCounterError('Profile missing institution. Contact support.');
         setValidatingCounter(false);
         return;
       }
       supabase.from('counters').select('code').eq('institution_id', profile.institution_id).ilike('code', trimmed).then(({ data: counterRows, error: counterError }) => {
         if (counterError || !counterRows || counterRows.length === 0) {
           setCounterError('Invalid Counter Code');
         } else {
           setCounterError(null);
         }
         setValidatingCounter(false);
       });
     });
  };

   // Track whether institution verification is in progress
   const [isVerifyingInstitution, setIsVerifyingInstitution] = useState(false);

   const handleInstitutionCodeChange = (code: string) => {
     if (institutionCodeTimerRef.current) clearTimeout(institutionCodeTimerRef.current);
     setInstitutionVerifyCode(code);
     setValidatedInstitution(null);
     setInstitutionError(null);
     const trimmed = code.trim();
     if (!trimmed) return;
     setValidatingCode(true);
     institutionCodeTimerRef.current = setTimeout(async () => {
       const { error, data } = await validateInstitutionCode(trimmed);
       if (error || !data) {
         setInstitutionError(error || 'Invalid Institution Code');
         setValidatedInstitution(null);
       } else {
         setValidatedInstitution(data);
         setInstitutionData(data);
       }
       setValidatingCode(false);
     }, 500);
   };


  const handleLoginInstitutionVerify = async () => {
      const code = institutionVerifyCode.trim() || validatedInstitution?.institution_code || institutionData?.institution_code || '';
      if (!code) {
        setInstitutionError('Please enter a valid Institution Code.');
        return;
      }

      const { error: validateError, data: liveInstitution } = await validateInstitutionCode(code);
      if (validateError || !liveInstitution) {
        setInstitutionError(validateError || 'Invalid Institution Code');
        setValidatedInstitution(null);
        return;
      }

      const userId = loginUserId || user?.id;
      let freshProfile: Profile | null = authProfile;

      if (userId) {
        // PRODUCTION FIX: Use direct .update to bypass upsert requirement errors
        const { error: upsertError } = await supabase
          .from('profiles')
          .update({ institution_id: liveInstitution.institution_id })
          .eq('user_id', userId);

        if (upsertError) {
          setInstitutionError(upsertError.message || 'Failed to save institution. Please try again.');
          return;
        }

        await refreshProfile();
        setValidatedInstitution(liveInstitution);
        setVerifiedInstitution(liveInstitution);
        setInstitutionData(liveInstitution);

        const { data: profileData } = await supabase
           .from('profiles')
           .select('user_id, email, full_name, role, institution_id')
           .eq('user_id', userId)
           .maybeSingle();
        if (profileData) freshProfile = { ...profileData, phone: null, created_at: '', updated_at: '' } as Profile;
      }

      setStep('success');

      if (onLoginSuccess && freshProfile) {
        onLoginSuccess({ profile: freshProfile, institution: liveInstitution });
      }
    };

  const handleCounterVerify = async () => {
    const code = counterCode.trim();
    if (!code) {
      setCounterError('Please enter a valid Counter Code.');
      return;
    }

     const userId = loginUserId || user?.id;
     if (!userId) {
       setCounterError('Unable to verify. Please sign in again.');
       return;
     }

     const { data: profile } = await supabase.from('profiles').select('institution_id').eq('user_id', userId).maybeSingle();
     if (!profile?.institution_id) {
       setCounterError('Profile missing institution. Contact support.');
       return;
     }

     const { data: counterRows, error: counterError } = await supabase
       .from('counters')
       .select('code, name, institution_id')
       .eq('institution_id', profile.institution_id)
       .ilike('code', code);

    if (counterError || !counterRows || counterRows.length === 0) {
      setCounterError('Invalid Counter Code');
      return;
    }

    const verified: InstitutionData = validatedInstitution || institutionData || {
      institution_id: profile.institution_id,
      institution_name: '',
      campus: '',
      city: '',
      state: '',
      country: '',
      institution_code: code,
    };
    setVerifiedInstitution(verified);
    setStep('success');

    if (onLoginSuccess) {
      const liveProfile = authProfile;
      if (liveProfile) {
        onLoginSuccess({ profile: liveProfile, institution: verified });
      }
    }
  };

  if (!isOpen) return null;

   const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isLoginSubmitting) return;
      const normalizedLoginEmail = (loginEmail || '').trim().toLowerCase();
      setCurrentEmail(normalizedLoginEmail);
      setLoginError(null);
      setLoginNotice(null);
      setInstitutionError(null);
      setStep('form');

      // 1. Validate required input
      if (!normalizedLoginEmail) {
        setLoginError('Please enter your email address.');
        setIsLoginSubmitting(false);
        return;
      }
      if (!loginPassword) {
        setLoginError('Please enter your password.');
        setIsLoginSubmitting(false);
        return;
      }

      setIsLoginSubmitting(true);
      const { error, user: authUser, profile: liveProfile } = await signIn(normalizedLoginEmail, loginPassword);

      if (error) {
        const msg = error.message.toLowerCase();
        console.error('[Auth] Login rejected:', error.message);
        if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('invalid email or password')) {
          setLoginError('Incorrect email or password. Please check your credentials and try again.');
        } else if (msg.includes('email not confirmed')) {
          setLoginError('Please verify your email before signing in. Check your inbox for the OTP emailed after registration.');
        } else if (msg.includes('rate limit')) {
          setLoginError('Too many login attempts. Please wait a moment and try again.');
        } else {
          setLoginError(error.message);
        }
        setIsLoginSubmitting(false);
        return;
      }

      if (!authUser) {
        setLoginError('Unable to sign in. Please try again or contact support.');
        setIsLoginSubmitting(false);
        return;
      }

      // 7. Load existing profile — handle missing profile gracefully
      if (!liveProfile) {
        console.warn('[Auth] Profile not found for authenticated user:', authUser.id);
        setLoginUserId(authUser.id);
        setStep('profile_completion');
        setIsLoginSubmitting(false);
        return;
      }

      // 8. Confirm profile belongs to the selected institution (informational — update if different)
      setLoginUserId(authUser.id);

      // 10. Navigate to Student Dashboard
      const role = liveProfile.role;

      if (role === 'institution_admin') {
        setIsLoginSubmitting(false);
        setStep('institution_verify');
        return;
      } else if (role === 'kitchen_staff' || role === 'canteen_manager') {
        setIsLoginSubmitting(false);
        setStep('counter_verify');
        return;
      } else if (role === 'student' || role === 'faculty' || role === 'guest') {
        setIsLoginSubmitting(false);
        setStep('success');
        if (onLoginSuccess) {
          onLoginSuccess({ profile: liveProfile, institution: institutionData });
        }
        return;
      }

      setIsLoginSubmitting(false);
      setStep('success');
      if (onLoginSuccess) {
        onLoginSuccess({ profile: liveProfile, institution: institutionData });
      }
    };

  const handleForgotPassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const normalizedLoginEmail = (loginEmail || '').trim().toLowerCase();
    setLoginError(null);
    setLoginNotice(null);

    if (!normalizedLoginEmail) {
      setStep('forgot_password');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedLoginEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('[Auth] Password reset failed:', error.message);
      setLoginError('Unable to send password reset right now. Please try again.');
      return;
    }

    setStep('forgot_password');
    setLoginNotice('Password reset link sent. Please check your email.');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingAccount) return;

    const currentForm = getCurrentForm();

    const normalizedEmail = (currentForm.universityEmail || '').trim().toLowerCase();
    setCurrentEmail(normalizedEmail);
    setInstitutionError(null);
    setOtpError(null);

    if (!currentForm.fullName.trim()) {
      setInstitutionError('Please enter your full name.');
      return;
    }

    if (!normalizedEmail) {
      setInstitutionError('Please enter your email address.');
      return;
    }

    if (currentForm.password.length < 8) {
      setInstitutionError('Password must be at least 8 characters.');
      return;
    }

    if (currentForm.password !== currentForm.confirmPassword) {
      setInstitutionError('Passwords do not match.');
      return;
    }

    setRegistrationPhase('sending');

    console.info('[Auth] Calling signUpWithPassword | email:', normalizedEmail);
    const { error } = await signUpWithPassword(normalizedEmail, currentForm.password, currentForm.fullName, selectedAccountRole);

      if (error) {
        console.error('[FOODEXA AUTH] Signup error:', error);
        if (error.message.toLowerCase().includes('already registered')) {
        setMode('login');
        setLoginEmail(normalizedEmail);
        setLoginPassword('');
        setLoginError(error.message);
        setInstitutionError(null);
        setRegistrationPhase('idle');
        return;
      }
      setInstitutionError(error.message || 'Registration failed. Please try again.');
      setRegistrationPhase('idle');
      return;
    }

    console.info('[Auth] signUpWithPassword succeeded; OTP email dispatched to:', normalizedEmail);
    setRegistrationPhase('sent');
    setResendCountdown(RESEND_COOLDOWN_SECONDS);
    setOtpError(null);
    setStep('otp');
  };
  const handleResendOtp = async () => {
    if (!currentEmail || registrationPhase === 'sending' || resendCountdown > 0) return;
    const normalizedEmail = (getPendingVerificationEmail() || currentEmail).trim().toLowerCase();
    setOtpError(null);
    setRegistrationPhase('sending');
    console.info('[Auth] Resending OTP email for:', normalizedEmail);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
      });
      if (error) {
        console.error('[FOODEXA AUTH] Resend error:', error);
        setOtpError(mapOtpErrorMessage(error.message || 'Failed to resend OTP. Please try again.'));
        setRegistrationPhase('sent');
        return;
      }
      console.info('[Auth] OTP email resent successfully for:', normalizedEmail);
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      setRegistrationPhase('sent');
    } catch (err) {
      console.error('[Auth] OTP resend threw:', err);
      setOtpError('Verification service is temporarily unavailable. Please try again.');
      setRegistrationPhase('sent');
    }
  };

    const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();

      const normalizedEmail = (getPendingVerificationEmail() || currentEmail).trim().toLowerCase();
      const normalizedToken = otpCode.replace(/\D/g, '').trim();
      console.info('[Auth] OTP submit | email:', normalizedEmail, '| token length:', normalizedToken.length);

      if (normalizedToken.length !== 6) {
        setOtpError('Please enter the 6-digit verification code sent to your email.');
        return;
      }

       const { error, profile: liveProfile, institution } = await verifyOtp(normalizedEmail, normalizedToken);

       if (error) {
         console.error('[FOODEXA AUTH] OTP verification error:', error);
         setOtpError(error.message || 'OTP verification failed. Please check the code and try again.');
         return;
       }

       console.info('[Auth] OTP verified | profile:', liveProfile?.user_id || 'NULL', '| institution:', institution?.institution_id || 'NULL');
       setRegistrationPhase('idle');
       sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);

       // If profile already exists with institution, go straight to success
       if (liveProfile && liveProfile.institution_id && institution) {
         setVerifiedInstitution(institution);
         setValidatedInstitution(institution);
         setInstitutionVerifyCode(institution.institution_code);
         setStep('success');
         if (onLoginSuccess) {
           onLoginSuccess({ profile: liveProfile, institution });
         }
         return;
       }

       // Otherwise, show institution code step
       setInstitutionVerifyCode('');
       setInstitutionError(null);
       setValidatedInstitution(null);
       setStep('institution_verify');
   };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('form');
      setOtpError(null);
      setRegistrationPhase('idle');
    } else if (step === 'institution_verify') {
      setStep('form');
      setInstitutionError(null);
    } else if (step === 'counter_verify') {
      setStep('form');
      setCounterError(null);
    } else if (step === 'form' && mode === 'create') {
      handleReset();
      onBack?.();
    }
  };

  const handleReset = () => {
    setStep('form');
    setMode(initialMode);
    onClose();
    setVerifiedInstitution(null);
    setValidatedInstitution(null);
    setLoginUserId(null);
    setLoginError(null);
    setLoginNotice(null);
    setShowLoginPassword(false);
    setOtpError(null);
    setRegistrationPhase('idle');
    setIsLoginSubmitting(false);
  };

  const handleContinueToPortal = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-black/5 rounded-[24px] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] my-8 space-y-6">
        
        <button
          onClick={handleReset}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#F5F5F7] text-[#86868B] hover:bg-[#E8E8ED] hover:text-[#1D1D1F] border-transparent transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {(step === 'otp' || step === 'institution_verify' || step === 'counter_verify' || (mode === 'create' && step === 'form')) && (
          <button
            onClick={handleBack}
            className="absolute top-5 left-5 p-2 rounded-full bg-[#F5F5F7] text-[#86868B] hover:bg-[#E8E8ED] hover:text-[#1D1D1F] border-transparent transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {step === 'form' && (
          <div>
            {mode === 'login' ? (
              <div className="space-y-5">

                {/* Header */}
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F5F7] text-[#1D1D1F] border-transparent text-[11px] font-mono">
                    <Lock className="w-3.5 h-3.5" />
                    <span>FOODEXA Login</span>
                  </div>
                  <h3 className="text-2xl font-bold text-black">Login to FOODEXA</h3>
                  <p className="text-xs text-[#86868B] leading-relaxed">
                    Sign in to your FOODEXA account.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#515154] mb-1 block">Email</label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setLoginError(null);
                        setLoginNotice(null);
                      }}
                      placeholder="you@example.com"
                      className="w-full apple-input"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#515154] mb-1 block">Password</label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          setLoginError(null);
                        }}
                        placeholder="Enter your password"
                        className="w-full apple-input pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((value) => !value)}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#515154] transition hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
                        aria-label={showLoginPassword ? 'Hide Password' : 'Show Password'}
                        title={showLoginPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-xl bg-[#FFF0F0] border border-[#FFD6D6] text-xs text-[#FF3B30]">
                      {loginError}
                    </div>
                  )}

                  {loginNotice && (
                    <div className="p-3 rounded-xl bg-[#F2FFF8] border border-[#B8F2D0] text-xs text-[#0A7A37]">
                      {loginNotice}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoginSubmitting}
                    className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoginSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Logging in...</span>
                      </>
                    ) : (
                      <>
                        <span>LOGIN</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </>
                    )}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="w-full text-center text-xs font-semibold text-[#0071E3] hover:underline"
                >
                  Forgot Password?
                </button>

                <div className="p-3 bg-white/80 border border-gray-200 rounded-xl text-center text-xs text-[#86868B]">
                  <span>Institution Administrator? </span>
                  <a
                    href="https://foodexa-institution-platform.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black font-bold hover:underline inline-flex items-center gap-1 ml-1"
                  >
                    <span>Open Institution Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

              </div>
            ) : (
              /* Create Account View */
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F5F7] text-[#1D1D1F] border-transparent text-[11px] font-mono">
                    <User className="w-3.5 h-3.5" />
                    <span>
                      {selectedAccountRole === 'student' ? 'Student Pass Registration' : selectedAccountRole === 'faculty' ? 'Faculty Registration' : 'Guest Registration'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-black">
                    Register as {selectedAccountRole === 'student' ? 'Student' : selectedAccountRole === 'faculty' ? 'Faculty' : 'Guest'}
                  </h3>
                  <p className="text-xs text-[#86868B]">
                    {selectedAccountRole === 'student' ? 'Sign up for instant queue skipping, express pickup, and LX AI dining recommendations.' : 'Sign up to access campus dining services.'}
                  </p>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-3">
                  {/* Institution Code - TOP OF ALL FORMS (required by spec) */}

                  <div>
                    <label className="text-xs font-semibold text-[#86868B] mb-1 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={getCurrentForm().fullName}
                      onChange={(e) => {
                        if (selectedAccountRole === 'student') setStudentForm({ ...studentForm, fullName: e.target.value });
                        else if (selectedAccountRole === 'faculty') setFacultyForm({ ...facultyForm, fullName: e.target.value });
                        else setGuestForm({ ...guestForm, fullName: e.target.value });
                      }}
                      placeholder="e.g. Alex Paul"
                      className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-3.5 py-2 text-xs text-black placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-[#86868B] mb-1 block">Email Address</label>
                      <input
                        type="email"
                        required
                        value={getCurrentForm().universityEmail}
                        onChange={(e) => {
                          if (selectedAccountRole === 'student') setStudentForm({ ...studentForm, universityEmail: e.target.value });
                          else if (selectedAccountRole === 'faculty') setFacultyForm({ ...facultyForm, universityEmail: e.target.value });
                          else setGuestForm({ ...guestForm, universityEmail: e.target.value });
                        }}
                        placeholder="e.g. alex@university.in"
                        className="w-full apple-input w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#86868B] mb-1 block">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={getCurrentForm().phone}
                        onChange={(e) => {
                          if (selectedAccountRole === 'student') setStudentForm({ ...studentForm, phone: e.target.value });
                          else if (selectedAccountRole === 'faculty') setFacultyForm({ ...facultyForm, phone: e.target.value });
                          else setGuestForm({ ...guestForm, phone: e.target.value });
                        }}
                        placeholder="+91 9876543210"
                        className="w-full apple-input w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-[#86868B] mb-1 block">Password</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={getCurrentForm().password}
                        onChange={(e) => {
                          if (selectedAccountRole === 'student') setStudentForm({ ...studentForm, password: e.target.value });
                          else if (selectedAccountRole === 'faculty') setFacultyForm({ ...facultyForm, password: e.target.value });
                          else setGuestForm({ ...guestForm, password: e.target.value });
                        }}
                        placeholder="Minimum 8 characters"
                        className="w-full apple-input w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#86868B] mb-1 block">Confirm Password</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={getCurrentForm().confirmPassword}
                        onChange={(e) => {
                          if (selectedAccountRole === 'student') setStudentForm({ ...studentForm, confirmPassword: e.target.value });
                          else if (selectedAccountRole === 'faculty') setFacultyForm({ ...facultyForm, confirmPassword: e.target.value });
                          else setGuestForm({ ...guestForm, confirmPassword: e.target.value });
                        }}
                        placeholder="Repeat password"
                        className="w-full apple-input w-full"
                      />
                    </div>
                  </div>

                  {selectedAccountRole === 'student' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-[#86868B] mb-1 block">Programme</label>
                          <input
                            type="text"
                            required
                            value={studentForm.programme}
                            onChange={(e) => setStudentForm({ ...studentForm, programme: e.target.value })}
                            placeholder="e.g. B.Tech Computer Science"
                            className="w-full apple-input w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[#86868B] mb-1 block">Department</label>
                          <input
                            type="text"
                            required
                            value={studentForm.department}
                            onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                            placeholder="e.g. Computer Science"
                            className="w-full apple-input w-full"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-[#86868B] mb-1 block">Semester</label>
                          <input
                            type="text"
                            required
                            value={studentForm.semester}
                            onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })}
                            placeholder="e.g. 3"
                            className="w-full apple-input w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[#86868B] mb-1 block">Campus Block</label>
                          <input
                            type="text"
                            required
                            value={studentForm.campusBlock}
                            onChange={(e) => setStudentForm({ ...studentForm, campusBlock: e.target.value })}
                            placeholder="e.g. Block A"
                            className="w-full apple-input w-full"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedAccountRole === 'faculty' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-[#86868B] mb-1 block">Department</label>
                        <input
                          type="text"
                          required
                          value={facultyForm.department}
                          onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                          placeholder="e.g. Computer Science"
                          className="w-full apple-input w-full"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#86868B] mb-1 block">Faculty ID</label>
                        <input
                          type="text"
                          required
                          value={facultyForm.facultyId}
                          onChange={(e) => setFacultyForm({ ...facultyForm, facultyId: e.target.value })}
                          placeholder="e.g. FAC-2024-001"
                          className="w-full apple-input w-full"
                        />
                      </div>
                    </>
                  )}

                  {selectedAccountRole === 'guest' && (
                    <></>
                  )}

                  {institutionError && (
                    <div className="p-3 rounded-xl bg-[#FFF0F0] border border-[#FFD6D6] text-xs text-[#FF3B30] mb-2">
                      {institutionError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isCreatingAccount || !getCurrentForm().fullName.trim() || !getCurrentForm().universityEmail.trim() || getCurrentForm().password.length < 8 || getCurrentForm().password !== getCurrentForm().confirmPassword}
                    className="relative w-full overflow-hidden btn-primary mt-2"
                  >
                    {isCreatingAccount && (
                      <>
                        <span
                          className="absolute inset-y-0 left-0 bg-[#0071E3] transition-all duration-700 ease-out"
                          style={{ width: `${registrationProgress}%` }}
                        />
                        <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.42),transparent)] animate-[registration-shimmer_1.1s_ease-in-out_infinite]" />
                      </>
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                    {isCreatingAccount ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>{registrationLabel}</span>
                      </>
                    ) : (
                      <>
                        <span>{registrationLabel}</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </>
                    )}
                    </span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: OTP EMAIL VERIFICATION */}
        {step === 'otp' && (
          <div className="space-y-5">
            <div className="space-y-1 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F5F5F7] border-transparent flex items-center justify-center text-black">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-black">Check Your Email</h3>
               <p className="text-xs text-[#86868B] leading-relaxed">
                 Enter the 6-digit verification code sent to:
                 <br />
                 <strong className="text-black">{getPendingVerificationEmail() || currentEmail || ''}</strong>
               </p>
            </div>

            {otpError && (
              <div className="p-3 rounded-xl bg-[#FFF0F0] border border-[#FFD6D6] text-xs text-[#FF3B30]">
                {otpError}
              </div>
            )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
               <div>
                 <label className="text-xs font-semibold text-[#86868B] mb-2 block text-center">
                   Verification Code
                 </label>
                  <div className="flex justify-center gap-1.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <input
                        key={i}
                        id={`otp-box-${i}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                        maxLength={1}
                        value={otpCode[i] || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (!val && !e.target.value) return;
                          const newCode = otpCode.split('');
                          newCode[i] = val.slice(-1);
                          const joined = newCode.join('').slice(0, 6);
                          setOtpCode(joined);
                          if (val && i < 5) {
                            document.getElementById(`otp-box-${i + 1}`)?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otpCode[i] && i > 0) {
                            const newCode = otpCode.split('');
                            newCode[i - 1] = '';
                            setOtpCode(newCode.join(''));
                            document.getElementById(`otp-box-${i - 1}`)?.focus();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                          if (pasted) {
                            setOtpCode(pasted);
                            const focusIdx = Math.min(pasted.length, 5);
                            document.getElementById(`otp-box-${focusIdx}`)?.focus();
                          }
                        }}
                        className="w-10 h-12 text-center text-lg font-mono font-bold border border-gray-200 rounded-xl focus:border-black focus:outline-none bg-white transition-colors"
                      />
                    ))}
                  </div>
               </div>

              <button
                type="submit"
                disabled={otpCode.replace(/\D/g, '').length !== 6 || isCreatingAccount}
                className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Verify Code</span>
              </button>

               <div className="text-center text-xs text-[#86868B]">
                 Didn't receive code? Check your spam/junk folder.{' '}
               <button
                 type="button"
                 onClick={handleResendOtp}
                 disabled={registrationPhase === 'sending' || resendCountdown > 0}
                 className="text-black font-bold hover:underline cursor-pointer disabled:text-gray-400 inline-block"
               >
                 {registrationPhase === 'sending'
                   ? 'Sending...'
                   : resendCountdown > 0
                     ? `Resend available in ${resendCountdown}s`
                     : 'Resend OTP'}
               </button>
               </div>
             </form>
           </div>
         )}

        {/* INSTITUTION CODE VERIFICATION STEP */}
        {step === 'institution_verify' && (
          <div className="space-y-5">
            <div className="space-y-1 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F5F5F7] border-transparent flex items-center justify-center text-black">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-black">Join Your Institution</h3>
              <p className="text-xs text-[#86868B] leading-relaxed">
                Enter your institution code to complete registration.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#86868B] mb-1 block">Institution Code</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={institutionVerifyCode}
                    onChange={(e) => {
                      setInstitutionVerifyCode(e.target.value.toUpperCase());
                      setInstitutionError(null);
                      setValidatedInstitution(null);
                      handleInstitutionCodeChange(e.target.value);
                    }}
                    placeholder="e.g. YAWEHH264881"
                    className="w-full apple-input font-mono font-bold pr-8"
                  />
                  {validatingCode && (
                    <Loader2 className="w-4 h-4 animate-spin text-black absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
                {institutionError && !validatingCode && (
                  <p className="text-[10px] text-[#FF3B30] mt-1">✗ {institutionError}</p>
                )}
                {validatedInstitution && !institutionError && !validatingCode && (
                  <div className="text-[10px] text-green-600 mt-1 space-y-0.5">
                    <p>✓ Institution Code Verified</p>
                    <p className="text-black font-semibold">{validatedInstitution.institution_name}</p>
                    <p className="text-black">{validatedInstitution.campus || ''} {validatedInstitution.city ? `• ${validatedInstitution.city}` : ''}</p>
                  </div>
                )}
              </div>

               <button
                 type="button"
                 onClick={async () => {
                   if (isVerifyingInstitution || !institutionVerifyCode.trim()) return;
                   setIsVerifyingInstitution(true);
                   setValidatingCode(true);
                   setInstitutionError(null);

                   try {
                     const { error: validateError, data: validatedInst } = await validateInstitutionCode(institutionVerifyCode);

                     if (validateError || !validatedInst) {
                       setInstitutionError(validateError || 'Invalid Institution Code');
                       setValidatedInstitution(null);
                       return;
                     }

                     setValidatedInstitution(validatedInst);
                     setVerifiedInstitution(validatedInst);
                     setInstitutionData(validatedInst);

                     // Now create/update the profile with institution_id and designation
                     const { error: profileError } = await updateProfile({
                       full_name: getCurrentForm().fullName || authProfile?.full_name || '',
                       role: selectedAccountRole,
                       designation: selectedAccountRole,
                       institution_id: validatedInst.institution_id,
                     });

                     if (profileError) {
                       setInstitutionError(profileError.message || 'Failed to complete profile.');
                       return;
                     }

                     await refreshProfile();

                     setStep('success');
                     if (onLoginSuccess && authProfile) {
                       onLoginSuccess({ profile: authProfile, institution: validatedInst });
                     }
                   } finally {
                     setValidatingCode(false);
                     setIsVerifyingInstitution(false);
                   }
                 }}
                 disabled={!institutionVerifyCode.trim() || validatingCode || isVerifyingInstitution}
                 className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
               >
                 {validatingCode || isVerifyingInstitution ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin text-white" />
                     <span>Verifying...</span>
                   </>
                 ) : (
                   <>
                     <span>ENTER DASHBOARD</span>
                     <ArrowRight className="w-4 h-4 text-white" />
                   </>
                 )}
               </button>
            </div>
          </div>
        )}

        {/* COUNTER / CANTEEN CODE VERIFICATION STEP (for kitchen_staff / canteen_manager login) */}
        {step === 'counter_verify' && (
          <div className="space-y-5">
            <div className="space-y-1 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F5F5F7] border-transparent flex items-center justify-center text-black">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-black">Verify Counter Code</h3>
              <p className="text-xs text-[#86868B] leading-relaxed">
                Enter your assigned Counter or Canteen Code to access the kitchen dashboard.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#86868B] mb-1 block">Counter / Canteen Code</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={counterCode}
                    onChange={(e) => {
                      setCounterCode(e.target.value);
                      handleCounterCodeChange(e.target.value);
                    }}
                    onBlur={(e) => handleCounterCodeBlur(e.target.value)}
                    placeholder="e.g. COUNTER-01"
                    className="w-full apple-input font-mono font-bold w-full pr-8"
                  />
                  {validatingCounter && (
                    <Loader2 className="w-4 h-4 animate-spin text-black absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
                {counterError && !validatingCounter && (
                  <p className="text-[10px] text-[#FF3B30] mt-1">✗ {counterError}</p>
                )}
                {!counterError && validatedInstitution && !validatingCounter && (
                  <p className="text-[10px] text-black mt-1">✓ Counter Code Verified</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleCounterVerify}
                disabled={!counterCode || validatingCounter || counterError}
                className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>Open Kitchen Dashboard</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#F5F5F7] border-transparent flex items-center justify-center text-black shadow-xl">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-black">
                {mode === 'login' ? 'Logged In Successfully!' : 'Email Verified & Account Joined!'}
              </h3>
              {mode === 'create' && !verifiedInstitution && (
                <p className="text-xs text-[#FF3B30] font-mono font-semibold">
                  Unable to verify institution details. Please try again.
                </p>
              )}
              {verifiedInstitution && (
                <p className="text-xs text-black font-mono font-semibold">
                  {verifiedInstitution.institution_name} - {verifiedInstitution.campus} ({verifiedInstitution.institution_code})
                </p>
              )}
            </div>
            <p className="text-xs text-[#86868B] leading-relaxed max-w-xs mx-auto">
              You now have access to campus dining menus, instant Razorpay checkout, and QR pickup lockers.
            </p>
            {verifiedInstitution && (
              <button
                onClick={handleContinueToPortal}
                className="w-full btn-primary"
              >
                <span>Launch Campus Portal</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
