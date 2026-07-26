import React, { useState } from 'react';
import { X, Lock, User, ArrowRight, CheckCircle2, ExternalLink, ShieldCheck, KeyRound, Building2 } from 'lucide-react';

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

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // OTP state
  const [otpCode, setOtpCode] = useState('849201');

  // Create Student Account state
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    universityEmail: '',
    phone: '',
    programme: '',
    department: '',
    semester: '',
    campusBlock: '',
    institutionCode: 'CHRKNG2026',
    password: '',
    confirmPassword: '',
  });

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('success');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentForm.password !== studentForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Advance to OTP verification
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      alert('Please enter a valid 6-digit OTP code');
      return;
    }
    setStep('success');
  };

  const handleDemoStudentLogin = () => {
    const demoData = {
      studentName: 'Alex Paul',
      email: 'alex.paul@christuniversity.in',
      code: 'CHRKNG2026',
    };
    onClose();
    if (onLoginSuccess) {
      onLoginSuccess(demoData);
    }
  };

  const handleReset = () => {
    setStep('form');
    onClose();
  };

  const handleContinueToPortal = () => {
    onClose();
    if (onLoginSuccess) {
      onLoginSuccess({
        studentName: studentForm.fullName || 'Alex Paul',
        email: mode === 'login' ? (loginEmail || 'alex.paul@christuniversity.in') : (studentForm.universityEmail || 'alex.paul@christuniversity.in'),
        code: studentForm.institutionCode || 'CHRKNG2026',
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
                    Sign in to your FOODEXA student account to order food, manage orders, access QR pickup, and use LX AI.
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
                      onClick={() => alert('Password reset instructions sent to your university email.')}
                      className="text-emerald-400 font-medium hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
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
                      onClick={() => setMode('create')}
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
                        placeholder="CHRKNG2026"
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
                        value={studentForm.confirmPassword}
                        onChange={(e) => setStudentForm({ ...studentForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md"
                  >
                    <span>Proceed to OTP Email Verification</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-400">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
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

        {/* STEP 2: OTP EMAIL VERIFICATION */}
        {step === 'otp' && (
          <div className="space-y-5">
            <div className="space-y-1 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Verify Your Email OTP</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We sent a 6-digit security code to{' '}
                <strong className="text-emerald-400">{studentForm.universityEmail || 'alex.paul@christuniversity.in'}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/60 focus:border-emerald-400 rounded-2xl py-3 text-center text-xl font-mono tracking-[0.5em] text-emerald-300 font-bold focus:outline-none shadow-inner"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-xs text-slate-400">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Institution Target: <strong className="text-white">CHRIST (Deemed to be University)</strong> Code: <strong className="text-emerald-400">{studentForm.institutionCode || 'CHRKNG2026'}</strong>
                </span>
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
                  onClick={() => alert('New OTP code re-sent to your university email.')}
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
                Joined: CHRIST (Deemed to be University) - Kengeri Campus ({studentForm.institutionCode || 'CHRKNG2026'})
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
