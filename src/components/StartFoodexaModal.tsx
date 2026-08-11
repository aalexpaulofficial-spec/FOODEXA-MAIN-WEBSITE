import React, { useState } from 'react';
import { X, ArrowRight, Sparkles, Loader2, AlertCircle, GraduationCap, Users, User, Building2 } from 'lucide-react';

interface StartFoodexaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignInStart: () => void;
  onLoginSuccess: (data: { role: 'student' | 'faculty' | 'guest'; institution: string | null }) => void;
  onOpenLogin: () => void;
}

type Step = 'welcome' | 'role' | 'institution';

export const StartFoodexaModal: React.FC<StartFoodexaModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignInStart,
  onLoginSuccess,
  onOpenLogin,
}) => {
  const [step, setStep] = useState<Step>('welcome');
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty' | 'guest' | null>(null);
  const [institution, setInstitution] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const roles = [
    { id: 'student' as const, icon: GraduationCap, title: 'Student', description: 'Access campus dining menus, order food, and track meals.' },
    { id: 'faculty' as const, icon: Users, title: 'Faculty', description: 'Access campus dining services with faculty credentials.' },
    { id: 'guest' as const, icon: User, title: 'Guest', description: 'Explore campus dining options.' },
  ];

  const handleRoleSelect = (role: 'student' | 'faculty' | 'guest') => {
    setSelectedRole(role);
    setStep('institution');
  };

  const handleContinue = () => {
    if (!selectedRole) return;
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({ role: selectedRole, institution: institution.trim() || null });
    }, 500);
  };

  const handleGoogleSignIn = () => {
    onGoogleSignInStart();
  };

  const handleOpenLogin = () => {
    onOpenLogin();
  };

  const handleClose = () => {
    setStep('welcome');
    setSelectedRole(null);
    setInstitution('');
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[440px] my-8"
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          padding: '32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ background: '#F5F5F7', color: '#86868B' }}
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'welcome' && (
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4" style={{ background: '#F5F5F7' }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: '#0071E3' }} />
                <span className="text-xs font-semibold" style={{ color: '#1D1D1F' }}>FOODEXA</span>
              </div>
              <h3 className="text-[28px] font-bold" style={{ color: '#1D1D1F' }}>
                Welcome to FOODEXA
              </h3>
              <p className="text-sm mt-2" style={{ color: '#86868B' }}>
                Your smart campus dining companion.
              </p>
            </div>

            <div className="space-y-2.5 mb-6">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
                    className="w-full text-left transition-all cursor-pointer"
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      border: '1.5px solid rgba(0, 0, 0, 0.08)',
                      background: '#FBFBFD',
                    }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: '#F5F5F7', color: '#86868B' }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="text-sm font-semibold" style={{ color: '#1D1D1F' }}>
                          {role.title}
                        </h4>
                        <p className="text-xs mt-0.5" style={{ color: '#86868B' }}>
                          {role.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 bg-white border border-gray-300 text-gray-700"
            >
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#0071E3' }} />
              <span>Continue with Google</span>
            </button>

            <button
              onClick={handleOpenLogin}
              className="mt-4 text-xs font-semibold underline"
              style={{ color: '#0071E3' }}
            >
              Already have an account? Sign in
            </button>
          </div>
        )}

        {step === 'institution' && selectedRole && (
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4" style={{ background: '#F5F5F7' }}>
                <Building2 className="w-3.5 h-3.5" style={{ color: '#30D158' }} />
                <span className="text-xs font-semibold" style={{ color: '#1D1D1F' }}>
                  {selectedRole === 'student' ? 'Student' : selectedRole === 'faculty' ? 'Faculty' : 'Guest'}
                </span>
              </div>
              <h3 className="text-[28px] font-bold" style={{ color: '#1D1D1F' }}>
                Enter Institution Code
              </h3>
              <p className="text-sm mt-2" style={{ color: '#86868B' }}>
                Enter your institution code (optional).
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl mb-4" style={{ background: '#FFF0F0', border: '1px solid #FFD6D6' }}>
                <AlertCircle className="w-4 h-4" style={{ color: '#FF3B30' }} />
                <p className="text-xs font-medium" style={{ color: '#FF3B30' }}>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. CHRIST-BGR (optional)"
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none"
                style={{
                  background: '#F5F5F7',
                  color: '#1D1D1F',
                  border: '1.5px solid transparent',
                }}
              />

              <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold"
                style={{
                  background: loading ? '#D2D2D7' : '#1D1D1F',
                  color: loading ? '#86868B' : '#FFFFFF',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Continue...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                onClick={() => setStep('welcome')}
                className="w-full text-xs font-semibold"
                style={{ color: '#86868B' }}
              >
                ? Choose a different role
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
