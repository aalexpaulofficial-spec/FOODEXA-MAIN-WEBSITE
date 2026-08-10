import React from 'react';
import { X, GraduationCap, Users, User, ArrowRight } from 'lucide-react';

interface PortalAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenCreateAccount: (role: 'student' | 'faculty' | 'guest') => void;
}

export const PortalAccessModal: React.FC<PortalAccessModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
  onOpenCreateAccount,
}) => {
  if (!isOpen) return null;

  const roles = [
    {
      id: 'student' as const,
      icon: GraduationCap,
      title: 'Student',
      description: 'Create an account as a Student.',
      color: 'emerald',
    },
    {
      id: 'faculty' as const,
      icon: Users,
      title: 'Faculty',
      description: 'Create an account as a Faculty member.',
      color: 'blue',
    },
    {
      id: 'guest' as const,
      icon: User,
      title: 'Guest',
      description: 'Create an account as a Guest.',
      color: 'amber',
    },
  ];

  const colorMap = {
    emerald: {
      bg: 'bg-emerald-950',
      border: 'border-gray-300',
      text: 'text-black',
      hover: 'hover:border-emerald-400',
      iconBg: 'bg-black/20',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-gray-50 border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-black transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1.5">
          <h3 className="text-2xl font-extrabold text-black">Create Your Account</h3>
          <p className="text-xs text-gray-600">Choose your role</p>
        </div>

        <div className="space-y-3">
          {roles.map((role) => {
            const Icon = role.icon;
            const c = colorMap[role.color];
            return (
              <button
                key={role.id}
                onClick={() => onOpenCreateAccount(role.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${c.bg} ${c.border} ${c.hover}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center ${c.iconText} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${c.text}`}>
                      {role.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                  <ArrowRight className={`w-4 h-4 ${c.text}`} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-gray-200/80 text-center text-xs text-gray-500">
          <span>Institution Administrator? </span>
          <a
            href="https://foodexa-institution-platform.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black font-bold hover:underline inline-flex items-center gap-1 ml-1"
          >
            <span>Open Institution Portal</span>
          </a>
        </div>
      </div>
    </div>
  );
};
