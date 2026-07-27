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
      description: 'Register as a student to access campus dining menus, order food, and track meals.',
      color: 'emerald',
    },
    {
      id: 'faculty' as const,
      icon: Users,
      title: 'Faculty',
      description: 'Register as faculty to access campus dining services with your staff credentials.',
      color: 'blue',
    },
    {
      id: 'guest' as const,
      icon: User,
      title: 'Guest',
      description: 'Register as a guest to explore campus dining options and place orders.',
      color: 'amber',
    },
  ];

  const handleContinue = () => {
    if (!selectedRole) return;
    onRoleSelected(selectedRole);
  };

  const colorMap = {
    emerald: {
      bg: 'bg-emerald-950',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      hover: 'hover:border-emerald-400',
      iconBg: 'bg-emerald-500/20',
      iconText: 'text-emerald-300',
    },
    blue: {
      bg: 'bg-blue-950',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      hover: 'hover:border-blue-400',
      iconBg: 'bg-blue-500/20',
      iconText: 'text-blue-300',
    },
    amber: {
      bg: 'bg-amber-950',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      hover: 'hover:border-amber-400',
      iconBg: 'bg-amber-500/20',
      iconText: 'text-amber-300',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 space-y-6">

        <button
          onClick={() => {
            setSelectedRole(null);
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800 text-[11px] font-mono">
            <span>Choose Your Role</span>
          </div>
          <h3 className="text-2xl font-extrabold text-white">Select Your Role</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Choose the role that best describes you to get started with FOODEXA.
          </p>
        </div>

        <div className="space-y-3">
          {roles.map((role) => {
            const Icon = role.icon;
            const c = colorMap[role.color];
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={`w-full p-4 rounded-2xl border text-left space-y-2 transition-all cursor-pointer ${
                  isSelected
                    ? `${c.bg} ${c.border} border-2`
                    : `bg-slate-950 border-slate-800 hover:${c.border}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center ${c.iconText} shrink-0`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${isSelected ? c.text : 'text-white'}`}>
                      {role.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className={`w-5 h-5 rounded-full ${c.bg} border-2 ${c.border} flex items-center justify-center`}>
                      <ArrowRight className={`w-3 h-3 ${c.text}`} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          className={`w-full py-3 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
            selectedRole
              ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 hover:from-emerald-300'
              : 'bg-slate-950 border border-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>{selectedRole ? 'Continue with Registration' : 'Select a Role to Continue'}</span>
          {selectedRole && <ArrowRight className="w-4 h-4 text-slate-950" />}
        </button>

      </div>
    </div>
  );
};
