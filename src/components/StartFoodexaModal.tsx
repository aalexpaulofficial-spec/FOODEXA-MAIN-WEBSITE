import React, { useEffect, useState } from 'react';
import {
  X,
  ArrowRight,
  Loader2,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { InstitutionData, Profile } from '../types';

interface StartFoodexaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountSetupSuccess: (data: { profile: Profile; institution: InstitutionData | null }) => void;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClass =
  'w-full rounded-2xl border border-[#D2D2D7] bg-white px-4 py-3 text-sm font-medium text-[#1D1D1F] outline-none transition focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/10';

export const StartFoodexaModal: React.FC<StartFoodexaModalProps> = ({
  isOpen,
  onClose,
  onAccountSetupSuccess,
}) => {
  const { startStudentEntry } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusy = loading;
  const canContinue =
    !!fullName.trim() && emailPattern.test(email.trim()) && !!institutionCode.trim();

  const resetState = () => {
    setFullName('');
    setEmail('');
    setInstitutionCode('');
    setLoading(false);
    setError(null);
  };

  useEffect(() => {
    if (isOpen) resetState();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleContinue = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isBusy) return;
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!emailPattern.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!institutionCode.trim()) {
      setError('Institution code is required.');
      return;
    }

    setLoading(true);

    const { error: entryError, profile, institution } = await startStudentEntry(
      fullName.trim(),
      email.trim(),
      institutionCode.trim()
    );

    setLoading(false);

    if (entryError || !profile) {
      setError(entryError || 'Unable to start your session. Please try again.');
      return;
    }

    if (institution) {
      onAccountSetupSuccess({ profile, institution });
    } else {
      // Profile created but institution missing — still open the dashboard.
      onAccountSetupSuccess({ profile, institution: null });
    }
  };

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

        <form onSubmit={handleContinue} className="space-y-5">
          <div className="space-y-1.5 pr-8">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF4FF] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0071E3]">
              <GraduationCap className="h-3.5 w-3.5" /> Start with FOODEXA
            </div>
            <h3 className="text-[26px] font-bold leading-tight text-[#1D1D1F]">
              Welcome to your campus kitchen
            </h3>
            <p className="text-sm leading-relaxed text-[#515154]">
              Enter your details and institution code to open your student dashboard.
            </p>
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
              <input
                type="text"
                required
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setError(null);
                }}
                className={fieldClass}
                placeholder="Alex Paul"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#515154]">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
                className={fieldClass}
                placeholder="alex@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#515154]">
                Institution Code * <span className="font-normal text-[#86868B]">(mandatory)</span>
              </label>
              <input
                type="text"
                required
                value={institutionCode}
                onChange={(event) => {
                  setInstitutionCode(event.target.value.toUpperCase());
                  setError(null);
                }}
                className={`${fieldClass} font-mono font-bold uppercase`}
                placeholder="Institution Code"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isBusy || !canContinue}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Setting up your dashboard...</span>
              </>
            ) : (
              <>
                <span>CONTINUE</span>
                <ArrowRight className="h-4 w-4 text-white" />
              </>
            )}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[#86868B]">
            <ShieldCheck className="h-3.5 w-3.5" />
            No password. No OTP. Your session is created securely and instantly.
          </p>
        </form>
      </div>
    </div>
  );
};
