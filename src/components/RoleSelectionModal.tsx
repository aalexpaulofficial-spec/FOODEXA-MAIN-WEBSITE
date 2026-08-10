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
      color: 'blue',
    },
    {
      id: 'faculty' as const,
      icon: Users,
      title: 'Faculty',
      description: 'Register as faculty to access campus dining services with your staff credentials.',
      color: 'purple',
    },
    {
      id: 'guest' as const,
      icon: User,
      title: 'Guest',
      description: 'Register as a guest to explore campus dining options and place orders.',
      color: 'green',
    },
  ];

  const handleContinue = () => {
    if (!selectedRole) return;
    onRoleSelected(selectedRole);
  };

  const colorMap = {
    blue: {
      iconBg: 'bg-blue-50',
      iconText: 'text-blue-600',
    },
    purple: {
      iconBg: 'bg-purple-50',
      iconText: 'text-purple-600',
    },
    green: {
      iconBg: 'bg-green-50',
      iconText: 'text-green-600',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 space-y-6">

        <button
          onClick={() => {
            setSelectedRole(null);
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-50 border border-gray-100 text-gray-400 hover:text-black transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-[11px] font-mono">
            <span>Choose Your Role</span>
          </div>
          <h3 className="text-2xl font-extrabold text-black">Select Your Role</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
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
                    ? 'border-black bg-gray-50/50 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center ${c.iconText} shrink-0`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${isSelected ? 'text-black' : 'text-gray-900'}`}>
                      {role.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-white" />
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
          className={`w-full py-3 rounded-full font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            selectedRole
              ? 'bg-black text-white hover:bg-gray-800 shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>{selectedRole ? 'Continue with Registration' : 'Select a Role to Continue'}</span>
          {selectedRole && <ArrowRight className="w-4 h-4 text-white" />}
        </button>

      </div>
    </div>
  );
};
