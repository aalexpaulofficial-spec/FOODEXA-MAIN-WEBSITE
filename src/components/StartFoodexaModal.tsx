import React, { useEffect, useState } from 'react';
import { X, ArrowRight, Loader2, AlertCircle, GraduationCap, Users, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { InstitutionData } from '../types';

interface StartFoodexaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignInStart: () => void;
  onDirectAccessSuccess: (data: { role: 'student' | 'faculty' | 'guest'; institution: InstitutionData | null }) => void;
  onOpenLogin: () => void;
}

type DirectRole = 'student' | 'faculty' | 'guest';
type Step = 'welcome' | 'role' | 'details' | 'verified';

const roles = [
  { id: 'student' as const, icon: GraduationCap, title: 'Student' },
  { id: 'faculty' as const, icon: Users, title: 'Faculty' },
  { id: 'guest' as const, icon: User, title: 'Guest' },
];

const emptyForm = { fullName: '', email: '', institutionCode: '' };

export const StartFoodexaModal: React.FC<StartFoodexaModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignInStart,
  onDirectAccessSuccess,
  onOpenLogin,
}) => {
  const { validateInstitutionCode, joinWithDirectAccess } = useAuth();
  const [step, setStep] = useState<Step>('welcome');
  const [selectedRole, setSelectedRole] = useState<DirectRole | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedInstitution, setVerifiedInstitution] = useState<InstitutionData | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('welcome');
      setSelectedRole(null);
      setForm(emptyForm);
      setError(null);
      setVerifiedInstitution(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const roleLabel = selectedRole ? selectedRole[0].toUpperCase() + selectedRole.slice(1) : '';

  const handleClose = () => {
    setStep('welcome');
    setSelectedRole(null);
    setForm(emptyForm);
    setError(null);
    setVerifiedInstitution(null);
    onClose();
  };

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || loading) return;

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const institutionCode = form.institutionCode.trim();

    if (!fullName) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!institutionCode) {
      setError('Please enter your institution code.');
      return;
    }

    setLoading(true);
    setError(null);

    const verifyResult = await validateInstitutionCode(institutionCode);
    if (verifyResult.error || !verifyResult.data) {
      const message = verifyResult.error?.toLowerCase().includes('unable to verify')
        ? 'Unable to verify your institution right now. Please try again.'
        : 'Invalid institution code. Please check your code and try again.';
      setError(message);
      setVerifiedInstitution(null);
      setLoading(false);
      return;
    }

    setVerifiedInstitution(verifyResult.data);
    const joinResult = await joinWithDirectAccess(institutionCode, selectedRole, fullName, email);
    setLoading(false);

    if (joinResult.error || !joinResult.profile) {
      const message = joinResult.error?.toLowerCase().includes('invalid institution')
        ? 'Invalid institution code. Please check your code and try again.'
        : 'Unable to verify your institution right now. Please try again.';
      setError(message);
      return;
    }

    setStep('verified');
  };

  const handleContinueToDashboard = () => {
    if (!selectedRole) return;
    onDirectAccessSuccess({ role: selectedRole, institution: verifiedInstitution });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-xl"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[480px] my-8 rounded-[24px] bg-white border border-black/5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F5F5F7] text-[#515154] hover:bg-[#E8E8ED] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'welcome' && (
          <div className="space-y-6">
            <div className="space-y-1.5 pr-8">
              <h3 className="text-[28px] font-bold text-[#1D1D1F]">Welcome to FOODEXA</h3>
              <p className="text-sm text-[#515154]">Choose how you'd like to continue.</p>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={onGoogleSignInStart}
                className="w-full text-left rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-all p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
                    <svg width="19" height="19" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-[#1D1D1F]">Continue with Google</h4>
                    <p className="text-xs text-[#515154] mt-0.5">Your account and order history will be saved securely.</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStep('role')}
                className="w-full text-left rounded-2xl border border-gray-200 bg-[#FBFBFD] hover:bg-[#F5F5F7] transition-all p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-[#1D1D1F]">Direct Access</h4>
                    <p className="text-xs text-[#515154] mt-0.5">Continue without Google. Your personal order history will not be saved after you sign out.</p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={onOpenLogin}
              className="w-full text-xs font-semibold text-[#0071E3] hover:underline"
            >
              Already have an account? Login
            </button>
          </div>
        )}

        {step === 'role' && (
          <div className="space-y-6">
            <div className="space-y-1.5 pr-8">
              <h3 className="text-[28px] font-bold text-[#1D1D1F]">Who are you?</h3>
              <p className="text-sm text-[#515154]">Select the role you will use for this visit.</p>
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
                    className="w-full flex items-center gap-3 rounded-2xl border border-gray-200 bg-white hover:bg-[#F5F5F7] transition-all p-4 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-[#1D1D1F]">{role.title}</span>
                  </button>
                );
              })}
            </div>

            <button onClick={() => setStep('welcome')} className="w-full text-xs font-semibold text-[#515154] hover:text-[#1D1D1F]">
              Back
            </button>
          </div>
        )}

        {step === 'details' && selectedRole && (
          <form onSubmit={handleDirectSubmit} className="space-y-5">
            <div className="space-y-1.5 pr-8">
              <h3 className="text-[28px] font-bold text-[#1D1D1F]">{roleLabel} Details</h3>
              <p className="text-sm text-[#515154]">Enter the details needed for temporary direct access.</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FFF0F0] border border-[#FFD6D6]">
                <AlertCircle className="w-4 h-4 text-[#FF3B30] mt-0.5 shrink-0" />
                <p className="text-xs font-medium text-[#FF3B30]">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#515154] mb-1 block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full apple-input"
                  placeholder="Alex Paul"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#515154] mb-1 block">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full apple-input"
                  placeholder="alex@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#515154] mb-1 block">Institution Code *</label>
                <input
                  type="text"
                  required
                  value={form.institutionCode}
                  onChange={(e) => setForm({ ...form, institutionCode: e.target.value })}
                  className="w-full apple-input font-mono font-bold"
                  placeholder="e.g. YAWEHH264881"
                />
              </div>
            </div>

            {verifiedInstitution && !error && (
              <div className="rounded-xl bg-[#F2FFF8] border border-[#B8F2D0] p-3 text-xs text-[#0A7A37] space-y-0.5">
                <p className="font-semibold">Institution Verified</p>
                <p>{verifiedInstitution.institution_name}</p>
                <p>{[verifiedInstitution.campus, verifiedInstitution.city, verifiedInstitution.state || verifiedInstitution.country].filter(Boolean).join(', ')}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify Institution</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>

            <button type="button" onClick={() => setStep('role')} className="w-full text-xs font-semibold text-[#515154] hover:text-[#1D1D1F]">
              Choose a different role
            </button>
          </form>
        )}

        {step === 'verified' && verifiedInstitution && (
          <div className="text-center py-4 space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#F2FFF8] border border-[#B8F2D0] flex items-center justify-center text-[#0A7A37]">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-[#1D1D1F]">Institution Verified</h3>
              <p className="text-sm font-semibold text-[#1D1D1F]">{verifiedInstitution.institution_name}</p>
              <p className="text-xs text-[#515154]">
                {[verifiedInstitution.campus, verifiedInstitution.city, verifiedInstitution.state || verifiedInstitution.country].filter(Boolean).join(', ')}
              </p>
            </div>
            <button onClick={handleContinueToDashboard} className="w-full btn-primary">
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
