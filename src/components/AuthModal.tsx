import React, { useState } from 'react';
import { X, Lock, User, ArrowRight, CheckCircle2, ExternalLink, ShieldCheck, KeyRound, Building2, Users, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'create';
  selectedRole?: 'student' | 'faculty' | 'guest';
  onLoginSuccess?: (data: { studentName: string; email: string; code: string; institutionName?: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  selectedRole = 'student',
  onLoginSuccess,
}) => {
  const { signIn, signInWithOtp, verifyOtp } = useAuth();
  const [mode, setMode] = useState<'login' | 'create'>(initialMode);
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [authLoading, setAuthLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Track the email used for the current OTP flow (login or create)
  const [currentEmail, setCurrentEmail] = useState('');

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [portalPayload, setPortalPayload] = useState<{ studentName: string; email: string; code: string; institutionName?: string } | null>(null);

  // Institution validation state
  const [institutionData, setInstitutionData] = useState<{ id: string; name: string; campus: string; code: string } | null>(null);
  const [institutionLoading, setInstitutionLoading] = useState(false);
  const [institutionError, setInstitutionError] = useState<string | null>(null);

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

  if (!isOpen) return null;

  const validateInstitutionCode = async (code: string) => {
    if (!code || !code.trim()) {
      setInstitutionError('Institution Code is required.');
      return null;
    }
    setInstitutionLoading(true);
    setInstitutionError(null);
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('id, name, campus, code')
        .eq('code', code.trim().toUpperCase())
        .maybeSingle();

      if (error || !data) {
        setInstitutionError('Invalid Institution Code. Please check and try again.');
        setInstitutionData(null);
        return null;
      }

      const verifiedInstitution = { id: data.id, name: data.name, campus: data.campus, code: data.code };
      setInstitutionData(verifiedInstitution);
      return verifiedInstitution;
    } catch (err) {
      setInstitutionError('Failed to validate institution code. Please try again.');
      setInstitutionData(null);
      return null;
    } finally {
      setInstitutionLoading(false);
    }
  };

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

      let loginInstitution: { id: string; name: string; campus: string; code: string } | null = null;
      if (profile?.institution_id || profile?.institution_code) {
        let query = supabase.from('institutions').select('id, name, campus, code');
        query = profile.institution_id
          ? query.eq('id', profile.institution_id)
          : query.eq('code', (profile.institution_code || '').trim().toUpperCase());

        const { data } = await query.maybeSingle();
        if (data) {
          loginInstitution = { id: data.id, name: data.name, campus: data.campus, code: data.code };
          setInstitutionData(loginInstitution);
        }
      }

      const nextPayload = {
        studentName: profile?.full_name || '',
        email: profile?.email || loginEmail.trim(),
        code: loginInstitution?.code || profile?.institution_code || '',
        institutionName: loginInstitution?.name,
      };
      setPortalPayload(nextPayload);
      setCurrentEmail(loginEmail.trim());
      setStep('success');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentForm = selectedRole === 'student' ? studentForm : selectedRole === 'faculty' ? facultyForm : guestForm;

    if (currentForm.password !== currentForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const institution = await validateInstitutionCode(currentForm.institutionCode);
    if (!institution) {
      return;
    }

    if (selectedRole === 'student') {
      setStudentForm({ ...studentForm, institutionCode: institution.code });
    } else if (selectedRole === 'faculty') {
      setFacultyForm({ ...facultyForm, institutionCode: institution.code });
    } else {
      setGuestForm({ ...guestForm, institutionCode: institution.code });
    }

    setAuthLoading(true);
    setCurrentEmail(currentForm.universityEmail.trim());

    const { error } = await signInWithOtp(
      currentForm.universityEmail.trim(),
      currentForm.fullName.trim(),
      selectedRole,
      institution.code,
      currentForm.phone.trim(),
      institution.id,
      institution.name,
      institution.campus
    );

    setAuthLoading(false);

    if (error) {
      alert(`Failed to send OTP: ${error.message}`);
      return;
    }

    setOtpCode('');
    setStep('otp');
  };

  const getExpectedOtpLength = (): number => {
    return 8;
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const expectedLength = getExpectedOtpLength();
    const cleanOtp = otpCode.trim();
    
    if (!new RegExp(`^\\d{${expectedLength}}$`).test(cleanOtp)) {
      alert(`Please enter a valid ${expectedLength}-digit OTP code`);
      return;
    }

    setAuthLoading(true);
    const { error } = await verifyOtp(currentEmail, cleanOtp);
    setAuthLoading(false);

    if (error) {
      alert(`OTP verification failed: ${error.message}`);
      return;
    }

    const currentForm = getCurrentForm();
    setPortalPayload({
      studentName: currentForm.fullName || '',
      email: currentEmail,
      code: institutionData?.code || '',
      institutionName: institutionData?.name,
    });
    setStep('success');
  };

  const handleResendOtp = async () => {
    const currentForm = getCurrentForm();
    if (!institutionData) {
      setInstitutionError('Please validate a valid Institution Code before requesting OTP.');
      return;
    }

    setAuthLoading(true);
    const { error } = await signInWithOtp(
      currentEmail,
      currentForm.fullName.trim(),
      selectedRole,
      institutionData.code,
      currentForm.phone.trim(),
      institutionData.id,
      institutionData.name,
      institutionData.campus
    );
    setAuthLoading(false);

    if (error) {
      alert(`Failed to resend OTP: ${error.message}`);
      return;
    }

    alert('New OTP code re-sent to your university email.');
  };

  const handleReset = () => {
    setStep('form');
    onClose();
  };

  const handleContinueToPortalLive = () => {
    onClose();
    if (onLoginSuccess) {
      onLoginSuccess(portalPayload || {
        studentName: getCurrentForm().fullName || '',
        email: mode === 'login' ? (loginEmail || '') : (currentEmail || ''),
        code: institutionData?.code || '',
        institutionName: institutionData?.name || undefined,
      });
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
                      placeholder="Enter your university email"
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
                      onClick={() => alert('Password reset instructions sent to your university email.')}
                      className="text-emerald-400 font-medium hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>{authLoading ? 'Logging in...' : 'Login'}</span>
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
placeholder="Enter your full name"
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
                         placeholder="Enter your university email"
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
                         placeholder="Enter your phone number"
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
                             placeholder="Enter your programme"
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
                             placeholder="Enter your institution code"
                             className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none"
                           />
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
                         <input
                           type="text"
                           required
                           value={facultyForm.institutionCode}
                           onChange={(e) => setFacultyForm({ ...facultyForm, institutionCode: e.target.value })}
                           placeholder="Enter your institution code"
                           className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none"
                         />
                       </div>
                     </>
                   )}

                   {selectedRole === 'guest' && (
                     <div>
                       <label className="text-xs font-semibold text-slate-300 mb-1 block">Institution Code</label>
                       <input
                         type="text"
                         required
                         value={guestForm.institutionCode}
                         onChange={(e) => setGuestForm({ ...guestForm, institutionCode: e.target.value })}
                         placeholder="Enter your institution code"
                         className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none"
                       />
                     </div>
                   )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">Password</label>
                      <input
                        type="password"
                        required
                        value={getCurrentForm().password}
                        onChange={(e) => {
                          if (selectedRole === 'student') setStudentForm({ ...studentForm, password: e.target.value });
                          else if (selectedRole === 'faculty') setFacultyForm({ ...facultyForm, password: e.target.value });
                          else setGuestForm({ ...guestForm, password: e.target.value });
                        }}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={getCurrentForm().confirmPassword}
                        onChange={(e) => {
                          if (selectedRole === 'student') setStudentForm({ ...studentForm, confirmPassword: e.target.value });
                          else if (selectedRole === 'faculty') setFacultyForm({ ...facultyForm, confirmPassword: e.target.value });
                          else setGuestForm({ ...guestForm, confirmPassword: e.target.value });
                        }}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading || institutionLoading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md"
                  >
                    <span>{authLoading || institutionLoading ? 'Validating Institution Code...' : 'Proceed to OTP Email Verification'}</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
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
                <strong className="text-emerald-400">{currentEmail || 'your email'}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block text-center">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={getExpectedOtpLength()}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, getExpectedOtpLength()))}
                  className="w-full bg-slate-950 border border-emerald-500/60 focus:border-emerald-400 rounded-2xl py-3 text-center text-xl font-mono tracking-[0.5em] text-emerald-300 font-bold focus:outline-none shadow-inner"
                />
              </div>

              {institutionLoading ? (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-xs text-slate-400">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Validating institution...</span>
                </div>
              ) : institutionError ? (
                <div className="p-3 bg-slate-950 border border-red-500/40 rounded-xl flex items-center gap-2 text-xs text-red-300">
                  <Building2 className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{institutionError}</span>
                </div>
              ) : institutionData ? (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-xs text-slate-400">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Institution: <strong className="text-white">{institutionData.name}</strong>
                    {institutionData.campus ? ` — ${institutionData.campus}` : ''}
                    <br />
                    Code: <strong className="text-emerald-400">{institutionData.code}</strong>
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-xs text-slate-400">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Institution Code: <strong className="text-emerald-400">{getCurrentForm().institutionCode || '—'}</strong>
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>{authLoading ? 'Verifying OTP...' : 'Verify & Join Campus Portal'}</span>
              </button>

              <div className="text-center text-xs text-slate-400">
                Didn't receive code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={authLoading}
                  className="text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  Resend OTP
                </button>
              </div>
            </form>
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
              <p className="text-xs text-emerald-400 font-mono font-semibold">
                Joined: {portalPayload?.institutionName || institutionData?.name || 'Institution'}
                {institutionData?.campus ? ` - ${institutionData.campus}` : ''}
                ({portalPayload?.code || institutionData?.code || getCurrentForm().institutionCode || '-'})
              </p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
              You now have access to Counter A, B, C & D menus, instant Razorpay checkout, and QR pickup lockers for your campus.
            </p>
            <button
              onClick={handleContinueToPortalLive}
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
