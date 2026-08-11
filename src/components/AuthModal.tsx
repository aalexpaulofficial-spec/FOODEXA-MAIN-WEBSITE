import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, Lock, User, ArrowRight, ArrowLeft, CheckCircle2, ExternalLink, ShieldCheck, KeyRound, Building2, Users, Loader2, RefreshCw } from 'lucide-react';
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
  const [step, setStep] = useState<'form' | 'institution_verify' | 'counter_verify' | 'otp' | 'success'>('form');
  const [loginUserId, setLoginUserId] = useState<string | null>(null);
  const selectedAccountRole: AccountRole = ACCOUNT_ROLES.includes(selectedRole as AccountRole) ? (selectedRole as AccountRole) : 'student';

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);

  // Track the email used for the current OTP flow (login or create)
  const [currentEmail, setCurrentEmail] = useState('');

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
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
    designation: '',
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
  }, [initialMode, isOpen]);

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


  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    setGoogleError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/student-login`,
        },
      });
      if (error) {
        console.error('[Auth] Google OAuth error:', error.message);
        setGoogleError('Unable to start Google Sign-In. Please try again.');
        setIsGoogleLoading(false);
      }
      // On success the browser redirects to Google — modal stays until redirect
    } catch (err: any) {
      console.error('[Auth] Google OAuth exception:', err);
      setGoogleError('Unable to start Google Sign-In. Please try again.');
      setIsGoogleLoading(false);
    }
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
       .from('menu_items')
       .select('counter')
       .eq('institution_id', profile.institution_id)
       .ilike('counter', code);

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
        setLoginError('We found your account, but your student profile is missing. Please contact FOODEXA support.');
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingAccount) return;

    const currentForm = getCurrentForm();

    const normalizedEmail = (currentForm.universityEmail || '').trim().toLowerCase();
    setCurrentEmail(normalizedEmail);
    setInstitutionError(null);
    setOtpError(null);

    if (currentForm.password.length < 8) {
      setInstitutionError('Password must be at least 8 characters.');
      return;
    }

    if (currentForm.password !== currentForm.confirmPassword) {
      setInstitutionError('Passwords do not match.');
      return;
    }

    setRegistrationPhase('validating');
    setValidatingCode(true);

    const { error: validateError, data: validatedInst } = await validateInstitutionCode(currentForm.institutionCode);

if (validateError || !validatedInst) {
        setInstitutionError(validateError || 'Invalid Institution Code');
        setValidatingCode(false);
        setRegistrationPhase('idle');
        return;
      }

    setRegistrationPhase('connecting');
    setValidatedInstitution(validatedInst);
    setInstitutionData(validatedInst);
    setInstitutionVerifyCode(validatedInst.institution_code);
    setValidatingCode(false);

    setRegistrationPhase('sending');
    console.info('[Auth] Calling signUpWithPassword | email:', normalizedEmail, '| institution_id:', validatedInst.institution_id);
    // PRODUCTION FIX: Pass institution_id directly so verifyOtp can always resolve it,
    // even if React context state gets stale or is reset between steps.
    const { error } = await signUpWithPassword(normalizedEmail, currentForm.password, currentForm.fullName, selectedAccountRole, {
      institutionCode: currentForm.institutionCode,
      institutionId: validatedInst.institution_id, // Direct UUID — never NULL
      phone: currentForm.phone,
      department: (currentForm as any).department,
      semester: (currentForm as any).semester,
      programme: (currentForm as any).programme,
      campusBlock: (currentForm as any).campusBlock,
      designation: (currentForm as any).designation,
      facultyId: (currentForm as any).facultyId,
    });

    if (error) {
      console.error('[Auth] signUpWithPassword rejected:', error.message);
      setInstitutionError(error.message || 'Registration failed. Please try again.');
      setRegistrationPhase('idle');
      return;
    }

    console.info('[Auth] signUpWithPassword succeeded; OTP email dispatched to:', normalizedEmail);
    setRegistrationPhase('sent');
    setOtpError(null);
    setStep('otp');
  };
  const handleResendOtp = async () => {
    if (!currentEmail || registrationPhase === 'sending') return;
    const normalizedEmail = currentEmail.trim().toLowerCase();
    setOtpError(null);
    setRegistrationPhase('sending');
    console.info('[Auth] Resending OTP email for:', normalizedEmail);
    try {
      // PRODUCTION FIX: the OTP for this flow is issued by signInWithOtp
      // (Magic Link template), NOT by a signup confirmation. Using
      // `resend({ type: 'signup' })` would silently do nothing because no
      // signup-confirmation email was ever sent (Confirm Email is OFF).
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: false },
      });
      if (error) {
        console.error('[Auth] OTP resend (signInWithOtp) failed:', error.name, '-', error.message);
        setOtpError(error.message?.toLowerCase().includes('rate limit')
          ? 'Too many requests. Please wait a few minutes before requesting another OTP.'
          : (error.message || 'Failed to resend OTP. Please try again.'));
        setRegistrationPhase('sent');
        return;
      }
      console.info('[Auth] OTP email resent successfully for:', normalizedEmail);
      setRegistrationPhase('sent');
    } catch (err: any) {
      console.error('[Auth] OTP resend threw:', err?.message || err);
      setOtpError('Network error. Please check your connection and try again.');
      setRegistrationPhase('sent');
    }
  };

   const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();

      const normalizedEmail = currentEmail.trim().toLowerCase();
      const normalizedToken = otpCode.trim();
      console.info('[Auth] OTP submit | email:', normalizedEmail, '| token length:', normalizedToken.length);

      // Supabase OTP tokens are 6 digits by default (configurable to 8 in the
      // Supabase dashboard). Accept any token between 6 and 8 digits so the
      // form works regardless of that dashboard setting.
      if (normalizedToken.length < 6 || normalizedToken.length > 8) {
        setOtpError('Please enter the verification code sent to your email.');
        return;
      }

       const { error, profile: liveProfile, institution } = await verifyOtp(normalizedEmail, normalizedToken);

       if (error) {
         console.error('[Auth] OTP verification rejected:', error.message);
         setOtpError(error.message || 'OTP verification failed. Please check the code and try again.');
         return;
       }

       if (!liveProfile) {
         console.warn('[Auth] verifyOtp returned null profile, attempting to ensure profile exists...');
         const { data: currentUser } = await supabase.auth.getUser();
         if (currentUser?.user) {
           const { error: ensureError } = await supabase.from('profiles').upsert({
             user_id: currentUser.user.id,
             email: currentUser.user.email || normalizedEmail,
             full_name: currentUser.user.user_metadata?.full_name || null,
             role: currentUser.user.user_metadata?.role || 'student',
           }, { onConflict: 'user_id' });
           if (ensureError) {
             console.error('[Auth] Failed to ensure profile exists:', ensureError.message);
           }
         }
         setOtpError('');
         setRegistrationPhase('idle');
         if (onLoginSuccess) {
           onLoginSuccess({ profile: liveProfile || ({ user_id: '', email: normalizedEmail, full_name: null, role: 'student', institution_id: null, department: null, semester: null, programme: null, campus_block: null, designation: null, avatar_url: null, diet_preference: null, created_at: '', updated_at: '' } as Profile), institution: institution || null });
         }
         return;
       }

       console.info('[Auth] OTP verified and profile ready | user:', liveProfile.user_id, '| institution:', institution?.institution_id || 'NULL');
       setRegistrationPhase('idle');

       if (institution?.institution_code) {
         setInstitutionVerifyCode(institution.institution_code);
         setVerifiedInstitution(institution);
         setValidatedInstitution(institution);
       }

       if (onLoginSuccess) {
         onLoginSuccess({ profile: liveProfile, institution: institution || null });
       }
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
                  <h3 className="text-2xl font-bold text-black">Welcome Back</h3>
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
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full apple-input"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#515154] mb-1 block">Password</label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full apple-input"
                    />
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-xl bg-[#FFF0F0] border border-[#FFD6D6] text-xs text-[#FF3B30]">
                      {loginError}
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
                        <span>Login</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </>
                    )}
                  </button>
                </form>

                <button
                  type="button"
                  className="w-full text-center text-xs font-semibold text-[#0071E3] hover:underline"
                >
                  Forgot Password?
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] text-[#86868B] font-medium">OR</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-black" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  <span className="text-sm font-semibold text-[#1D1D1F]">
                    {isGoogleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
                  </span>
                </button>

                {googleError && (
                  <div className="p-3 rounded-xl bg-[#FFF0F0] border border-[#FFD6D6] text-xs text-[#FF3B30]">
                    {googleError}
                  </div>
                )}

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
                    <label className="text-xs font-semibold text-[#86868B] mb-1 block">Institution Code <span className="text-black">*</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={getCurrentForm().institutionCode}
onChange={(e) => {
                           if (selectedAccountRole === 'student') setStudentForm({ ...studentForm, institutionCode: e.target.value });
                           else if (selectedAccountRole === 'faculty') setFacultyForm({ ...facultyForm, institutionCode: e.target.value });
                           else setGuestForm({ ...guestForm, institutionCode: e.target.value });
                           handleInstitutionCodeChange(e.target.value);
                         }}
                         placeholder="e.g. YAWEHH264881"
                         className="w-full apple-input font-mono font-bold w-full pr-8"
                      />
                      {validatingCode && (
                        <Loader2 className="w-4 h-4 animate-spin text-black absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
{institutionError && !validatingCode && (
                       <p className="text-[10px] text-[#FF3B30] mt-1">✗ {institutionError}</p>
                     )}
                     {!institutionError && validatedInstitution && !validatingCode && (
                       <div className="text-[10px] text-black mt-1 space-y-0.5">
                         <p>✓ Institution Verified</p>
                         <p className="text-black">{validatedInstitution.institution_name}</p>
                         <p className="text-black">Campus: {validatedInstitution.campus || 'N/A'}</p>
                         <p className="text-black">Status: Active</p>
                       </div>
                     )}
                  </div>

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
                      <div className="grid grid-cols-2 gap-2">
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
                          <label className="text-xs font-semibold text-[#86868B] mb-1 block">Designation</label>
                          <input
                            type="text"
                            required
                            value={facultyForm.designation}
                            onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                            placeholder="e.g. Assistant Professor"
                            className="w-full apple-input w-full"
                          />
                        </div>
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

                  <button
                    type="submit"
                    disabled={isCreatingAccount || validatingCode}
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
              <h3 className="text-xl font-bold text-black">Verify Your Email OTP</h3>
               <p className="text-xs text-[#86868B] leading-relaxed">
                 We sent a security code to{' '}
                 <strong className="text-black">{currentEmail || ''}</strong>
                 . Check your inbox (and spam folder) and enter the code below.
               </p>
            </div>

            {validatedInstitution && (
              <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center gap-2 text-xs text-[#86868B]">
                <Building2 className="w-4 h-4 text-black shrink-0" />
                <span>
                  Institution: <strong className="text-black">{validatedInstitution.institution_name}</strong> • Code: <strong className="text-black">{validatedInstitution.institution_code}</strong>
                </span>
              </div>
            )}

            {institutionError && (
              <div className="p-3 rounded-xl bg-[#FFF0F0] border border-[#FFD6D6] text-xs text-[#FF3B30]">
                {institutionError}
              </div>
            )}

            {otpError && (
              <div className="p-3 rounded-xl bg-[#FFF0F0] border border-[#FFD6D6] text-xs text-[#FF3B30]">
                {otpError}
              </div>
            )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
               <div>
                 <label className="text-xs font-semibold text-[#86868B] mb-1 block text-center">
                   Verification Code
                 </label>
                 <input
                   type="text"
                   inputMode="numeric"
                   maxLength={8}
                   required
                   value={otpCode}
                   onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                   className="w-full apple-input py-3 text-center text-xl font-mono tracking-[0.5em] font-bold w-full"
                 />
               </div>

              <button
                type="submit"
                className="w-full btn-primary"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Verify & Join Campus Portal</span>
              </button>

               <div className="text-center text-xs text-[#86868B]">
                 Didn't receive code? Check your spam/junk folder.{' '}
               <button
                 type="button"
                 onClick={handleResendOtp}
                 disabled={registrationPhase === 'sending'}
                 className="text-black font-bold hover:underline cursor-pointer disabled:text-gray-400 inline-block"
               >
                 {registrationPhase === 'sending' ? 'Sending...' : 'Resend OTP'}
               </button>
               </div>
             </form>
           </div>
         )}

        {/* INSTITUTION CODE VERIFICATION STEP (for institution_admin login) */}
        {step === 'institution_verify' && (
          <div className="space-y-5">
            <div className="space-y-1 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F5F5F7] border-transparent flex items-center justify-center text-black">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-black">Verify Institution Code</h3>
              <p className="text-xs text-[#86868B] leading-relaxed">
                Enter your Institution Code to access the campus portal.
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
onChange={(e) => handleInstitutionCodeChange(e.target.value)}
                     placeholder="e.g. YAWEHH264881"
                     className="w-full apple-input font-mono font-bold w-full pr-8"
                  />
                  {validatingCode && (
                    <Loader2 className="w-4 h-4 animate-spin text-black absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
{institutionError && !validatingCode && (
                   <p className="text-[10px] text-[#FF3B30] mt-1">✗ {institutionError}</p>
                 )}
                 {validatedInstitution && !institutionError && !validatingCode && (
                   <div className="text-[10px] text-black mt-1 space-y-0.5">
                     <p>✓ Institution Verified</p>
                     <p className="text-black">{validatedInstitution.institution_name}</p>
                     <p className="text-black">Campus: {validatedInstitution.campus || 'N/A'}</p>
                     <p className="text-black">Status: Active</p>
                   </div>
                 )}
              </div>

              <button
                type="button"
                onClick={handleLoginInstitutionVerify}
                disabled={!institutionVerifyCode.trim() || validatingCode}
                className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>Verify & Access Portal</span>
                <ArrowRight className="w-4 h-4 text-white" />
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
