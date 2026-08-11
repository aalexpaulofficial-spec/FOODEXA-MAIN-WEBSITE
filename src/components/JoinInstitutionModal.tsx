import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, GraduationCap, Users, User, Loader2, AlertCircle, Building2, Sparkles, Shield, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface JoinInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (institution: { id: string; name: string; campus: string; city: string; institution_code: string }, role: 'student' | 'faculty' | 'guest', profile: any, directSession: { name: string; role: string; institutionId: string; institutionName: string } | null) => void;
}

type Step = 'code' | 'role' | 'name' | 'confirm' | 'loading';

export const JoinInstitutionModal: React.FC<JoinInstitutionModalProps> = ({
  isOpen,
  onClose,
  onJoin,
}) => {
  const { joinWithCodeRoleName } = useAuth();
  const [step, setStep] = useState<Step>('code');
  const [institutionCode, setInstitutionCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty' | 'guest' | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatedInstitution, setValidatedInstitution] = useState<{
    id: string; name: string; campus: string; city: string; institution_code: string;
  } | null>(null);
  const [joining, setJoining] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('code');
      setInstitutionCode('');
      setSelectedRole(null);
      setDisplayName('');
      setError(null);
      setValidatedInstitution(null);
      setValidating(false);
      setJoining(false);
    } else {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleValidateCode = async () => {
    const trimmed = institutionCode.trim();
    if (!trimmed) {
      setError('Please enter your institution code.');
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_institution_by_code', { p_institution_code: trimmed });

      if (rpcError) {
        console.error('[JoinInstitution] RPC error:', rpcError);
        setError('We couldn\'t connect to FOODEXA right now. Please try again.');
        setValidating(false);
        return;
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        setError('Invalid institution code. Please check your code and try again.');
        setValidating(false);
        return;
      }

      const inst = Array.isArray(data) ? data[0] : data;

      if (inst.status && inst.status !== 'approved' && inst.status !== 'active') {
        setError('This institution is currently unavailable. Please contact your institution administrator.');
        setValidating(false);
        return;
      }

      setValidatedInstitution({
        id: inst.id,
        name: inst.name || inst.institution_name || '',
        campus: inst.campus || '',
        city: inst.city || '',
        institution_code: inst.institution_code || trimmed.toUpperCase(),
      });
      setStep('name');
    } catch (err: any) {
      console.error('[JoinInstitution] Exception:', err);
      setError('We couldn\'t connect to FOODEXA right now. Please try again.');
    }
    setValidating(false);
  };

  const handleSelectRole = (role: 'student' | 'faculty' | 'guest') => {
    setSelectedRole(role);
  };

  const handleContinueFromRole = () => {
    if (!selectedRole) return;
    setStep('confirm');
  };

  const handleContinueFromName = () => {
    if (!displayName.trim()) return;
    setStep('role');
  };

  const handleConfirmJoin = async () => {
    if (!selectedRole || !validatedInstitution || !displayName.trim()) return;

    setJoining(true);
    setError(null);

    try {
      const result = await joinWithCodeRoleName(
        validatedInstitution.institution_code,
        selectedRole,
        displayName.trim()
      );

      if (result.error || !result.profile) {
        setError(result.error || 'Failed to join. Please try again.');
        setJoining(false);
        return;
      }

      setJoining(false);
      onJoin(validatedInstitution, selectedRole, result.profile, {
        name: displayName.trim(),
        role: selectedRole,
        institutionId: validatedInstitution.id,
        institutionName: validatedInstitution.name,
      });
    } catch (err: any) {
      console.error('[JoinInstitution] Join error:', err);
      setError('Something went wrong. Please try again.');
      setJoining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (step === 'code') handleValidateCode();
      else if (step === 'name' && displayName.trim()) handleContinueFromName();
      else if (step === 'role' && selectedRole) handleContinueFromRole();
      else if (step === 'confirm' && !joining) handleConfirmJoin();
    }
  };

  const handleBack = () => {
    if (step === 'role') setStep('name');
    else if (step === 'name') setStep('code');
    else if (step === 'confirm') setStep('role');
    setError(null);
  };

  if (!isOpen) return null;

  const roles = [
    { id: 'student' as const, icon: GraduationCap, title: 'Student', description: 'Order food, track orders, view history and profile.', color: 'emerald' },
    { id: 'faculty' as const, icon: Users, title: 'Faculty', description: 'Access campus dining with faculty benefits.', color: 'blue' },
    { id: 'guest' as const, icon: User, title: 'Guest', description: 'Explore and order as a guest visitor.', color: 'amber' },
  ];

  const roleLabel = selectedRole ? (selectedRole === 'student' ? 'Student' : selectedRole === 'faculty' ? 'Faculty' : 'Guest') : '';

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

        {/* Back button */}
        {(step === 'role' || step === 'name' || step === 'confirm') && (
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer"
            style={{ background: '#F5F5F7', color: '#86868B' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#E8E8ED'; e.currentTarget.style.color = '#1D1D1F'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F5F5F7'; e.currentTarget.style.color = '#86868B'; }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        {/* ═══════════════════ STEP 1: INSTITUTION CODE ═══════════════════ */}
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

        {/* ═══════════════════ STEP 2: NAME ENTRY ═══════════════════ */}
        {step === 'name' && (
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4" style={{ background: '#F5F5F7' }}>
                <Building2 className="w-3.5 h-3.5" style={{ color: '#30D158' }} />
                <span className="text-xs font-semibold" style={{ color: '#1D1D1F' }}>
                  {validatedInstitution?.name}
                </span>
              </div>
              <h3 className="text-[28px] font-bold leading-tight" style={{ color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                Your Name
              </h3>
              <p className="text-sm mt-2" style={{ color: '#86868B' }}>
                Enter your display name for {validatedInstitution?.name}.
                {validatedInstitution?.campus ? ` · ${validatedInstitution.campus}` : ''}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#86868B' }}>
                  Display Name
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); setError(null); }}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. A. Alex Paul"
                  className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all"
                  style={{
                    background: '#F5F5F7',
                    color: '#1D1D1F',
                    border: error ? '1.5px solid #FF3B30' : '1.5px solid transparent',
                  }}
                  onFocus={(e) => { e.currentTarget.style.border = '1.5px solid #0071E3'; e.currentTarget.style.background = '#FFFFFF'; }}
                  onBlur={(e) => { e.currentTarget.style.border = error ? '1.5px solid #FF3B30' : '1.5px solid transparent'; e.currentTarget.style.background = '#F5F5F7'; }}
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: '#FFF0F0', border: '1px solid #FFD6D6' }}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#FF3B30' }} />
                  <p className="text-xs font-medium" style={{ color: '#FF3B30' }}>{error}</p>
                </div>
              )}

              <button
                onClick={handleContinueFromName}
                disabled={!displayName.trim()}
                className="w-full flex items-center justify-center gap-2 apple-press"
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  background: displayName.trim() ? '#1D1D1F' : '#D2D2D7',
                  color: displayName.trim() ? '#FFFFFF' : '#86868B',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: displayName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  border: 'none',
                }}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════ STEP 3: ROLE SELECTION ═══════════════════ */}
        {step === 'role' && (
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4" style={{ background: '#F5F5F7' }}>
                <User className="w-3.5 h-3.5" style={{ color: '#0071E3' }} />
                <span className="text-xs font-semibold" style={{ color: '#1D1D1F' }}>
                  {displayName} at {validatedInstitution?.name}
                </span>
              </div>
              <h3 className="text-[28px] font-bold leading-tight" style={{ color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                Select Role
              </h3>
              <p className="text-sm mt-2" style={{ color: '#86868B' }}>
                How would you like to join {validatedInstitution?.name}?
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
              onClick={handleContinueFromRole}
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
              <span>{selectedRole ? 'Continue' : 'Select a Role'}</span>
              {selectedRole && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* ═══════════════════ STEP 4: CONFIRMATION ═══════════════════ */}
        {step === 'confirm' && (
          <div>
            <div className="mb-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: '#F0FDF4' }}>
                <CheckCircle2 className="w-8 h-8" style={{ color: '#30D158' }} />
              </div>
              <h3 className="text-[28px] font-bold leading-tight" style={{ color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                Continue as
              </h3>
            </div>

            {/* Confirmation Card */}
            <div className="rounded-2xl p-5 mb-6" style={{ background: '#F5F5F7', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div className="text-center space-y-3">
                <p className="text-xl font-bold" style={{ color: '#1D1D1F' }}>
                  {displayName}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#E8F5E9', color: '#1B8A2D' }}>
                    {roleLabel}
                  </span>
                </div>
                <div className="pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <p className="text-sm font-semibold" style={{ color: '#1D1D1F' }}>
                    {validatedInstitution?.name}
                  </p>
                  {validatedInstitution?.campus && (
                    <p className="text-xs mt-0.5" style={{ color: '#86868B' }}>
                      {validatedInstitution.campus}{validatedInstitution.city ? ` · ${validatedInstitution.city}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl mb-4" style={{ background: '#FFF0F0', border: '1px solid #FFD6D6' }}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#FF3B30' }} />
                <p className="text-xs font-medium" style={{ color: '#FF3B30' }}>{error}</p>
              </div>
            )}

            <button
              onClick={handleConfirmJoin}
              disabled={joining}
              className="w-full flex items-center justify-center gap-2 apple-press"
              style={{
                padding: '14px',
                borderRadius: '14px',
                background: joining ? '#D2D2D7' : '#1D1D1F',
                color: joining ? '#86868B' : '#FFFFFF',
                fontWeight: 600,
                fontSize: '15px',
                cursor: joining ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                border: 'none',
              }}
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Setting up...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
