import React, { useState } from 'react';
import { X, ArrowRight, Loader2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole, Profile, InstitutionData } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'create'; // Kept for backwards compatibility
  selectedRole?: UserRole;
  onLoginSuccess?: (data: { profile: Profile; institution: InstitutionData | null }) => void;
  onBack?: () => void;
  onDirectLogin?: () => void;
  onOpenCreateAccount?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  selectedRole = 'student',
  onLoginSuccess,
}) => {
  const { startStudentEntry } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    const { error: entryError, profile, institution } = await startStudentEntry(
      fullName,
      email,
      institutionCode
    );

    setIsSubmitting(false);

    if (entryError) {
      setError(entryError);
      return;
    }

    if (onLoginSuccess && profile) {
      onLoginSuccess({ profile, institution });
    }
    
    // Reset and close
    setFullName('');
    setEmail('');
    setInstitutionCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-black/5 rounded-[24px] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] my-8 space-y-6">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#F5F5F7] text-[#86868B] hover:bg-[#E8E8ED] hover:text-[#1D1D1F] border-transparent transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F5F7] text-[#1D1D1F] border-transparent text-[11px] font-mono">
              <User className="w-3.5 h-3.5" />
              <span>Start with FOODEXA</span>
            </div>
            <h3 className="text-2xl font-bold text-black">
              Welcome to FOODEXA
            </h3>
            <p className="text-xs text-[#86868B]">
              Enter your details to instantly skip the queue and order your meals.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#86868B] mb-1 block">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Paul"
                className="w-full bg-[#F5F5F7] border border-transparent focus:border-black rounded-xl px-3.5 py-3 text-sm text-black placeholder-[#86868B] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#86868B] mb-1 block">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex@university.in"
                className="w-full bg-[#F5F5F7] border border-transparent focus:border-black rounded-xl px-3.5 py-3 text-sm text-black placeholder-[#86868B] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#86868B] mb-1 block">Institution Code</label>
              <input
                type="text"
                required
                value={institutionCode}
                onChange={(e) => setInstitutionCode(e.target.value.toUpperCase())}
                placeholder="e.g. YWH001"
                className="w-full bg-[#F5F5F7] border border-transparent focus:border-black rounded-xl px-3.5 py-3 text-sm text-black placeholder-[#86868B] focus:outline-none transition-colors uppercase"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#FFF0F0] border border-[#FFD6D6] text-xs text-[#FF3B30]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
