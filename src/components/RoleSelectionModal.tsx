import React, { useState } from 'react';
import { X, GraduationCap, User, Users, ArrowRight } from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleSelected: (role: 'student' | 'faculty' | 'guest') => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
  onRoleSelected,
}) => {
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty' | 'guest' | null>(null);

  if (!isOpen) return null;

  const roles = [
    {
      id: 'student' as const,
      icon: GraduationCap,
      title: 'Student',
      description: 'Access campus dining menus, order food, and track your meals with express QR pickup.',
    },
    {
      id: 'faculty' as const,
      icon: Users,
      title: 'Faculty',
      description: 'Access campus dining services with your faculty credentials and staff benefits.',
    },
    {
      id: 'guest' as const,
      icon: User,
      title: 'Guest',
      description: 'Explore campus dining options and place orders as a guest visitor.',
    },
  ];

  const handleContinue = () => {
    if (!selectedRole) return;
    onRoleSelected(selectedRole);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
    >
      <div
        className="relative w-full max-w-[440px] my-8"
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(0, 0, 0, 0.05)',
          padding: '32px',
        }}
      >
        {/* Close button */}
        <button
          onClick={() => {
            setSelectedRole(null);
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer"
          style={{ background: '#F5F5F7', color: '#86868B' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#E8E8ED'; e.currentTarget.style.color = '#1D1D1F'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#F5F5F7'; e.currentTarget.style.color = '#86868B'; }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <p
            className="text-xs font-semibold tracking-wide uppercase mb-2"
            style={{ color: '#86868B', letterSpacing: '0.06em' }}
          >
            Choose Your Role
          </p>
          <h3
            className="text-[28px] font-bold leading-tight"
            style={{ color: '#1D1D1F', letterSpacing: '-0.02em' }}
          >
            Get Started
          </h3>
          <p className="text-sm mt-1" style={{ color: '#86868B' }}>
            Select the role that best describes you.
          </p>
        </div>

        {/* Role Cards */}
        <div className="space-y-2.5 mb-6">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className="w-full text-left transition-all cursor-pointer apple-press"
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  border: isSelected ? '2px solid #0071E3' : '1.5px solid rgba(0, 0, 0, 0.08)',
                  background: isSelected ? 'rgba(0, 113, 227, 0.04)' : '#FBFBFD',
                  boxShadow: isSelected ? '0 0 0 3px rgba(0, 113, 227, 0.12)' : 'none',
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
                    <h4
                      className="text-sm font-semibold"
                      style={{ color: '#1D1D1F', letterSpacing: '-0.01em' }}
                    >
                      {role.title}
                    </h4>
                    <p
                      className="text-xs mt-0.5 leading-relaxed"
                      style={{ color: '#86868B' }}
                    >
                      {role.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: '#0071E3' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          className="w-full flex items-center justify-center gap-2 apple-press"
          style={{
            padding: '14px',
            borderRadius: '14px',
            background: selectedRole ? '#1D1D1F' : '#D2D2D7',
            color: selectedRole ? '#FFFFFF' : '#86868B',
            fontWeight: 600,
            fontSize: '15px',
            letterSpacing: '-0.01em',
            cursor: selectedRole ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            border: 'none',
          }}
        >
          <span>{selectedRole ? 'Continue' : 'Select a Role'}</span>
          {selectedRole && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
