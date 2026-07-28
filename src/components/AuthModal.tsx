import React, { useEffect, useState, useRef } from 'react';
import { X, Lock, User, ArrowRight, CheckCircle2, ExternalLink, ShieldCheck, KeyRound, Building2, Users, Loader2 } from 'lucide-react';
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
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  selectedRole = 'student',
  onLoginSuccess,
}) => {
  const { signInWithOtp, verifyOtp, validateInstitutionCode, setInstitutionData, institutionData, signOut, signIn, user, setRememberMeFlag, refreshProfile, profile: authProfile } = useAuth();
  const [mode, setMode] = useState<'login' | 'create'>(initialMode);
  const [step, setStep] = useState<'form' | 'institution_verify' | 'counter_verify' | 'otp' | 'success'>('form');
  const [loginUserId, setLoginUserId] = useState<string | null>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Track the email used for the current OTP flow (login or create)
  const [currentEmail, setCurrentEmail] = useState('');

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Institution validation state
  const [validatedInstitution, setValidatedInstitution] = useState<InstitutionData | null>(null);
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
  });

  // Create Faculty Account state
  const [facultyForm, setFacultyForm] = useState({
    fullName: '',
    universityEmail: '',
    phone: '',
    department: '',
    designation: '',
    institutionCode: '',
  });

  // Create Guest Account state
  const [guestForm, setGuestForm] = useState({
    fullName: '',
    universityEmail: '',
    phone: '',
    institutionCode: '',
  });

  const getCurrentForm = () => {
    switch (selectedRole) {
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

 useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setStep('form');
    setCurrentEmail('');
    setOtpCode('');
    setValidatedInstitution(null);
    setVerifiedInstitution(null);
    setInstitutionError(null);
    setLoginError(null);
    setOtpError(null);
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
        setCounterError('Session expired. Please login again.');
        setValidatingCounter(false);
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('institution_id').eq('user_id', userId).single();
      if (!profile?.institution_id) {
        setCounterError('Profile missing institution. Contact support.');
        setValidatingCounter(false);
        return;
      }
      const { data: counterRows, error: counterError } = await supabase
        .from('menu_items')
        .select('counter')
        .eq('institution_id', profile.institution_id)
        .ilike('counter', trimmed);
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
      setCounterError('Session expired. Please login again.');
      setValidatingCounter(false);
      return;
    }
    supabase.from('profiles').select('institution_id').eq('user_id', userId).single().then(({ data: profile }) => {
      if (!profile?.institution_id) {
        setCounterError('Profile missing institution. Contact support.');
        setValidatingCounter(false);
        return;
      }
      supabase.from('menu_items').select('counter').eq('institution_id', profile.institution_id).ilike('counter', trimmed).then(({ data: counterRows, error: counterError }) => {
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
    setValidatedInstitution(null);
    setInstitutionError(null);
    const trimmed = code.trim();
    if (!trimmed) return;
    setValidatingCode(true);
    institutionCodeTimerRef.current = setTimeout(async () => {
      const { error, data } = await validateInstitutionCode(trimmed);
      if (error || !data) {
        setInstitutionError('Invalid Institution Code. Please check and try again.');
        setValidatedInstitution(null);
      } else {
        setValidatedInstitution(data);
        setInstitutionData(data);
      }
      setValidatingCode(false);
    }, 500);
  };

  const handleInstitutionCodeBlur = (code: string) => {
    if (institutionCodeTimerRef.current) clearTimeout(institutionCodeTimerRef.current);
    const trimmed = code.trim();
    if (!trimmed) return;
    setValidatingCode(true);
    validateInstitutionCode(trimmed).then(({ error, data }) => {
      if (error || !data) {
        setInstitutionError('Invalid Institution Code. Please check and try again.');
        setValidatedInstitution(null);
      } else {
        setValidatedInstitution(data);
        setInstitutionData(data);
      }
      setValidatingCode(false);
    });
  };

  const handleLoginInstitutionVerify = async () => {
    const code = validatedInstitution?.institution_code || institutionData?.institution_code || '';
    if (!code) {
      setInstitutionError('Please enter a valid Institution Code.');
      return;
    }

    const userId = loginUserId || user?.id;

    if (validatedInstitution && userId) {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          institution_id: validatedInstitution.institution_id,
          institution_code: validatedInstitution.institution_code,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (upsertError) {
        setInstitutionError('Failed to save institution. Please try again.');
        return;
      }

      await refreshProfile();
      setVerifiedInstitution(validatedInstitution);
      setInstitutionData(validatedInstitution);
    }

    setStep('success');

    const updatedProfile = authProfile;
    if (onLoginSuccess && updatedProfile) {
      onLoginSuccess({ profile: updatedProfile, institution: validatedInstitution });
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
      setCounterError('Session expired. Please login again.');
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('institution_id').eq('user_id', userId).single();
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
    setCurrentEmail(loginEmail);
    setLoginError(null);
    setInstitutionError(null);
    setStep('form');

    const { error, session: authSession, user: authUser, profile: liveProfile } = await signIn(loginEmail, loginPassword);
    setRememberMeFlag(rememberMe);

    if (error) {
      setLoginError(error.message);
      return;
    }

    if (!authUser) {
      setLoginError('Authentication failed. No user returned from Supabase.');
      return;
    }

    if (!liveProfile) {
      setLoginError('Your account exists in Supabase Auth but no profile was found. Please contact support or register again.');
      return;
    }

    setLoginUserId(authUser.id);

    let institution: InstitutionData | null = null;
    if (liveProfile.institution_id) {
      const { data: instData } = await supabase
        .from('institutions')
        .select('id, name, campus, city, state, country, institution_code')
        .eq('id', liveProfile.institution_id)
        .single();

      if (instData) {
        institution = {
          institution_id: instData.id,
          institution_name: instData.name,
          campus: instData.campus || '',
          city: instData.city || '',
          state: instData.state || '',
          country: instData.country || '',
          institution_code: instData.institution_code,
        };
        setInstitutionData(institution);
        setVerifiedInstitution(institution);
      }
    }

    const role = liveProfile.role;

    if (role === 'institution_admin') {
      if (!institution) {
        setStep('institution_verify');
        return;
      }
    } else if (role === 'kitchen_staff' || role === 'canteen_manager') {
      setStep('counter_verify');
      return;
    }

    setStep('success');
    if (onLoginSuccess) {
      onLoginSuccess({ profile: liveProfile, institution });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentForm = getCurrentForm();

    setCurrentEmail(currentForm.universityEmail);
    setInstitutionError(null);
    setValidatingCode(true);

    const { error: validateError, data: validatedInst } = await validateInstitutionCode(currentForm.institutionCode);

    if (validateError || !validatedInst) {
      setInstitutionError('Invalid Institution Code');
      setValidatingCode(false);
      return;
    }

    setValidatedInstitution(validatedInst);
    setInstitutionData(validatedInst);
    setValidatingCode(false);

    signInWithOtp(currentForm.universityEmail, currentForm.fullName, selectedRole, {
      institutionCode: currentForm.institutionCode,
      phone: currentForm.phone,
      department: (currentForm as any).department,
      semester: (currentForm as any).semester,
      programme: (currentForm as any).programme,
      campusBlock: (currentForm as any).campusBlock,
      designation: (currentForm as any).designation,
    }).then(({ error }) => {
      if (!error) {
        setOtpError(null);
        setStep('otp');
      } else {
        setInstitutionError(error.message || 'Registration failed');
      }
    });
  };
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 8) {
      setOtpError('Please enter a valid 8-digit OTP code');
      return;
    }

    const { error, profile, institution } = await verifyOtp(currentEmail, otpCode);

    if (error) {
      setOtpError(error.message || 'OTP verification failed');
      return;
    }

    if (!profile) {
      setOtpError('Profile creation failed. Please try again.');
      return;
    }

    setVerifiedInstitution(institution);
    setStep('success');

    if (onLoginSuccess) {
      onLoginSuccess({ profile, institution });
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
  };

  const handleContinueToPortal = () => {
    onClose();
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
                    Sign in to your FOODEXA account to order food, manage orders, access QR pickup, and use LX AI.
                  </p>
                </div>

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
                      onClick={() => {}}
                      className="text-emerald-400 font-medium hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                      {loginError}
                    </div>
                  )}

                  {institutionError && step === 'form' && (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                      {institutionError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>

                  {/* Institution Login Link */}
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
              /* Create Account View */
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
                    {selectedRole === 'student' ? 'Sign up for instant queue skipping, express pickup, and LX AI dining recommendations.' : 'Sign up to access campus dining services.'}
                  </p>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-3">
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
                        value={getCurrentForm().universityEmail}
                        onChange={(e) => {
                          if (selectedRole === 'student') setStudentForm({ ...studentForm, universityEmail: e.target.value });
                          else if (selectedRole === 'faculty') setFacultyForm({ ...facultyForm, universityEmail: e.target.value });
                          else setGuestForm({ ...guestForm, universityEmail: e.target.value });
                        }}
                        placeholder="e.g. alex@christuniversity.in"
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
                        placeholder="+91 9876543210"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

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
                            placeholder="e.g. B.Tech Computer Science"
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
                              placeholder="e.g. YAWEHH264881"
                              className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none pr-8"
                            />
                            {validatingCode && (
                              <Loader2 className="w-4 h-4 animate-spin text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            )}
                          </div>
                          {institutionError && !validatingCode && (
                            <p className="text-[10px] text-red-400 mt-1">✗ Invalid Institution Code. Please check and try again.</p>
                          )}
                          {validatedInstitution && !institutionError && !validatingCode && (
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
                            placeholder="e.g. Computer Science"
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
                            placeholder="e.g. 3"
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
                          placeholder="e.g. Block A"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}

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
                            placeholder="e.g. Computer Science"
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
                            placeholder="e.g. Assistant Professor"
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
                            placeholder="e.g. YAWEHH264881"
                            className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none pr-8"
                          />
                          {validatingCode && (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          )}
                        </div>
                        {institutionError && !validatingCode && (
                          <p className="text-[10px] text-red-400 mt-1">✗ Invalid Institution Code. Please check and try again.</p>
                        )}
                        {validatedInstitution && !institutionError && !validatingCode && (
                          <p className="text-[10px] text-emerald-400 mt-1">✓ Institution Code Verified</p>
                        )}
                      </div>
                    </>
                  )}

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
                          placeholder="e.g. YAWEHH264881"
                          className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none pr-8"
                        />
                        {validatingCode && (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        )}
                      </div>
                      {institutionError && !validatingCode && (
                        <p className="text-[10px] text-red-400 mt-1">✗ Invalid Institution Code. Please check and try again.</p>
                      )}
                      {validatedInstitution && !institutionError && !validatingCode && (
                        <p className="text-[10px] text-emerald-400 mt-1">✓ Institution Code Verified</p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={validatingCode || !validatedInstitution}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {validatingCode ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Validating & Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send OTP & Verify Email</span>
                        <ArrowRight className="w-4 h-4 text-slate-950" />
                      </>
                    )}
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
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Verify Your Email OTP</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We sent an 8-digit security code to{' '}
                <strong className="text-emerald-400">{currentEmail || ''}</strong>
              </p>
            </div>

            {validatedInstitution && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-xs text-slate-400">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Institution: <strong className="text-white">{validatedInstitution.institution_name}</strong> • Code: <strong className="text-emerald-400">{validatedInstitution.institution_code}</strong>
                </span>
              </div>
            )}

            {institutionError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                {institutionError}
              </div>
            )}

            {otpError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block text-center">
                  8-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={8}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/60 focus:border-emerald-400 rounded-2xl py-3 text-center text-xl font-mono tracking-[0.5em] text-emerald-300 font-bold focus:outline-none shadow-inner"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>Verify & Join Campus Portal</span>
              </button>

              <div className="text-center text-xs text-slate-400">
                Didn't receive code?{' '}
                <button
                  type="button"
                  onClick={() => {}}
                  className="text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          </div>
        )}

        {/* INSTITUTION CODE VERIFICATION STEP (for institution_admin login) */}
        {step === 'institution_verify' && (
          <div className="space-y-5">
            <div className="space-y-1 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Verify Institution Code</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Please enter your Institution Code to access the institution dashboard.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Institution Code</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={validatedInstitution?.institution_code || institutionData?.institution_code || ''}
                    onChange={(e) => handleInstitutionCodeChange(e.target.value)}
                    onBlur={(e) => handleInstitutionCodeBlur(e.target.value)}
                    placeholder="e.g. YAWEHH264881"
                    className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none pr-8"
                  />
                  {validatingCode && (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
                {institutionError && !validatingCode && (
                  <p className="text-[10px] text-red-400 mt-1">✗ {institutionError}</p>
                )}
                {validatedInstitution && !institutionError && !validatingCode && (
                  <p className="text-[10px] text-emerald-400 mt-1">✓ Institution Code Verified: {validatedInstitution.institution_name}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleLoginInstitutionVerify}
                disabled={!validatedInstitution}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>Open Institution Dashboard</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </div>
        )}

        {/* COUNTER / CANTEEN CODE VERIFICATION STEP (for kitchen_staff / canteen_manager login) */}
        {step === 'counter_verify' && (
          <div className="space-y-5">
            <div className="space-y-1 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Verify Counter Code</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your assigned Counter or Canteen Code to access the kitchen dashboard.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Counter / Canteen Code</label>
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
                    className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none pr-8"
                  />
                  {validatingCounter && (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
                {counterError && !validatingCounter && (
                  <p className="text-[10px] text-red-400 mt-1">✗ {counterError}</p>
                )}
                {!counterError && validatedInstitution && !validatingCounter && (
                  <p className="text-[10px] text-emerald-400 mt-1">✓ Counter Code Verified</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleCounterVerify}
                disabled={!counterCode || validatingCounter || counterError}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>Open Kitchen Dashboard</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-xl">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-white">
                {mode === 'login' ? 'Logged In Successfully!' : 'Email Verified & Account Joined!'}
              </h3>
              {mode === 'create' && !verifiedInstitution && (
                <p className="text-xs text-red-400 font-mono font-semibold">
                  Unable to verify institution details. Please try again.
                </p>
              )}
              {verifiedInstitution && (
                <p className="text-xs text-emerald-400 font-mono font-semibold">
                  {verifiedInstitution.institution_name} - {verifiedInstitution.campus} ({verifiedInstitution.institution_code})
                </p>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
              You now have access to campus dining menus, instant Razorpay checkout, and QR pickup lockers.
            </p>
            {verifiedInstitution && (
              <button
                onClick={handleContinueToPortal}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Launch Campus Portal</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
