import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, GraduationCap, Users, User, Loader2, AlertCircle, Building2, Sparkles, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface JoinInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (institution: { id: string; name: string; campus: string; city: string; institution_code: string }, role: 'student' | 'faculty' | 'guest') => void;
}

type Step = 'code' | 'role' | 'loading';

export const JoinInstitutionModal: React.FC<JoinInstitutionModalProps> = ({
  isOpen,
  onClose,
  onJoin,
}) => {
  const [step, setStep] = useState<Step>('code');
  const [institutionCode, setInstitutionCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty' | 'guest' | null>(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatedInstitution, setValidatedInstitution] = useState<{
    id: string; name: string; campus: string; city: string; institution_code: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('code');
      setInstitutionCode('');
      setSelectedRole(null);
      setError(null);
      setValidatedInstitution(null);
      setValidating(false);
    } else {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleValidateCode = async () => {
    const trimmed = institutionCode.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter your institution code.');
      return;
    }

    setValidating(true);
    setError(null);

    try {
      // Use the existing RPC function for institution code validation
      const { data, error: rpcError } = await supabase
        .rpc('get_institution_by_code', { p_institution_code: trimmed });

      if (rpcError) {
        console.error('[JoinInstitution] RPC error:', rpcError);
        setError('We couldn\'t connect to FOODEXA right now. Please try again.');
        setValidating(false);
        return;
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        setError('Institution code not found. Please check the code and try again.');
        setValidating(false);
        return;
      }

      // Handle both single object and array responses
      const inst = Array.isArray(data) ? data[0] : data;

      setValidatedInstitution({
        id: inst.id,
        name: inst.institution_name || inst.name || '',
        campus: inst.campus || '',
        city: inst.city || '',
        institution_code: inst.institution_code || trimmed,
      });
      setStep('role');
    } catch (err: any) {
      console.error('[JoinInstitution] Exception:', err);
      setError('We couldn\'t connect to FOODEXA right now. Please try again.');
    }
    setValidating(false);
  };

  const handleSelectRole = (role: 'student' | 'faculty' | 'guest') => {
    setSelectedRole(role);
  };

  const handleJoin = () => {
    if (!selectedRole || !validatedInstitution) return;
    onJoin(validatedInstitution, selectedRole);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (step === 'code') handleValidateCode();
      else if (step === 'role' && selectedRole) handleJoin();
    }
  };

  if (!isOpen) return null;

  const roles = [
    { id: 'student' as const, icon: GraduationCap, title: 'Student', description: 'Order food, track orders, view history and profile.', color: 'emerald' },
    { id: 'faculty' as const, icon: Users, title: 'Faculty', description: 'Access campus dining with faculty benefits.', color: 'blue' },
    { id: 'guest' as const, icon: User, title: 'Guest', description: 'Explore and order as a guest visitor.', color: 'amber' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] my-8"
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(0,0,0,0.05)',
          padding: '32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer"
          style={{ background: '#F5F5F7', color: '#86868B' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#E8E8ED'; e.currentTarget.style.color = '#1D1D1F'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#F5F5F7'; e.currentTarget.style.color = '#86868B'; }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* STEP 1: Institution Code Entry */}
        {step === 'code' && (
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4" style={{ background: '#F5F5F7' }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: '#0071E3' }} />
                <span className="text-xs font-semibold" style={{ color: '#1D1D1F' }}>FOODEXA</span>
              </div>
              <h3 className="text-[28px] font-bold leading-tight" style={{ color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                Join Your Institution
              </h3>
              <p className="text-sm mt-2" style={{ color: '#86868B' }}>
                Enter your institution code to access campus dining.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#86868B' }}>
                  Institution Code
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={institutionCode}
                  onChange={(e) => { setInstitutionCode(e.target.value); setError(null); }}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. CHRIST-BGR"
                  className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all"
                  style={{
                    background: '#F5F5F7',
                    color: '#1D1D1F',
                    border: error ? '1.5px solid #FF3B30' : '1.5px solid transparent',
                  }}
                  onFocus={(e) => { e.currentTarget.style.border = '1.5px solid #0071E3'; e.currentTarget.style.background = '#FFFFFF'; }}
                  onBlur={(e) => { e.currentTarget.style.border = error ? '1.5px solid #FF3B30' : '1.5px solid transparent'; e.currentTarget.style.background = '#F5F5F7'; }}
                  disabled={validating}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: '#FFF0F0', border: '1px solid #FFD6D6' }}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#FF3B30' }} />
                  <p className="text-xs font-medium" style={{ color: '#FF3B30' }}>{error}</p>
                </div>
              )}

              <button
                onClick={handleValidateCode}
                disabled={validating || !institutionCode.trim()}
                className="w-full flex items-center justify-center gap-2 apple-press"
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  background: institutionCode.trim() ? '#1D1D1F' : '#D2D2D7',
                  color: institutionCode.trim() ? '#FFFFFF' : '#86868B',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: institutionCode.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  border: 'none',
                }}
              >
                {validating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 pt-4" style={{ borderTop: '1px solid #F5F5F7' }}>
              <p className="text-xs" style={{ color: '#86868B' }}>
                Don't have a code? Contact your institution administrator.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Role Selection */}
        {step === 'role' && (
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4" style={{ background: '#F5F5F7' }}>
                <Building2 className="w-3.5 h-3.5" style={{ color: '#30D158' }} />
                <span className="text-xs font-semibold" style={{ color: '#1D1D1F' }}>
                  {validatedInstitution?.name}
                </span>
              </div>
              <h3 className="text-[28px] font-bold leading-tight" style={{ color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                Who are you?
              </h3>
              <p className="text-sm mt-2" style={{ color: '#86868B' }}>
                Select how you're joining {validatedInstitution?.name}.
              </p>
            </div>

            <div className="space-y-2.5 mb-6">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleSelectRole(role.id)}
                    className="w-full text-left transition-all cursor-pointer apple-press"
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      border: isSelected ? '2px solid #0071E3' : '1.5px solid rgba(0,0,0,0.08)',
                      background: isSelected ? 'rgba(0,113,227,0.04)' : '#FBFBFD',
                      boxShadow: isSelected ? '0 0 0 3px rgba(0,113,227,0.12)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: isSelected ? '#0071E3' : '#F5F5F7',
                          color: isSelected ? '#FFFFFF' : '#86868B',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold" style={{ color: '#1D1D1F', letterSpacing: '-0.01em' }}>
                          {role.title}
                        </h4>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#86868B' }}>
                          {role.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#0071E3' }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleJoin}
              disabled={!selectedRole}
              className="w-full flex items-center justify-center gap-2 apple-press"
              style={{
                padding: '14px',
                borderRadius: '14px',
                background: selectedRole ? '#1D1D1F' : '#D2D2D7',
                color: selectedRole ? '#FFFFFF' : '#86868B',
                fontWeight: 600,
                fontSize: '15px',
                cursor: selectedRole ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                border: 'none',
              }}
            >
              <Shield className="w-4 h-4" />
              <span>{selectedRole ? `Join as ${selectedRole === 'student' ? 'Student' : selectedRole === 'faculty' ? 'Faculty' : 'Guest'}` : 'Select a Role'}</span>
              {selectedRole && <ArrowRight className="w-4 h-4" />}
            </button>

            <button
              onClick={() => { setStep('code'); setSelectedRole(null); setError(null); }}
              className="w-full mt-3 text-center text-xs font-medium cursor-pointer"
              style={{ color: '#86868B', background: 'none', border: 'none' }}
            >
              ← Use a different institution code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
