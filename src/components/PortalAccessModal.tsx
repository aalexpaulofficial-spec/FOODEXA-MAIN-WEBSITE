import React from 'react';
import { X, GraduationCap, ArrowRight, Sparkles, Lock, ExternalLink, User } from 'lucide-react';

interface PortalAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStudentRegister: () => void;
  onOpenInstitutionRegister?: () => void;
  onOpenLogin: () => void;
  onOpenCreateAccount?: () => void;
}

export const PortalAccessModal: React.FC<PortalAccessModalProps> = ({
  isOpen,
  onClose,
  onOpenStudentRegister,
  onOpenLogin,
  onOpenCreateAccount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Student Portal Access</span>
          </div>
          <h3 className="text-2xl font-extrabold text-white">Welcome Back</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sign in to your FOODEXA student account to order food, manage your orders, access QR pickup, and use LX AI.
          </p>
        </div>

        {/* Student Access Options */}
        <div className="grid sm:grid-cols-2 gap-4">
          
          {/* Student Login Option */}
          <button
            onClick={() => {
              onClose();
              onOpenLogin();
            }}
            className="group bg-slate-950 border border-slate-800 hover:border-emerald-500 p-5 rounded-2xl text-left space-y-3 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Student Login
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Sign in with your university email to access LX AI, track orders & QR pickup.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 pt-1">
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
            {onOpenCreateAccount && (
              <div className="pt-2 text-center text-xs text-slate-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    onOpenCreateAccount();
                  }}
                  className="text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            )}
          </button>

          {/* Create Account Option */}
          {onOpenCreateAccount && (
            <button
              onClick={() => {
                onClose();
                onOpenCreateAccount();
              }}
              className="group bg-slate-950 border border-slate-800 hover:border-teal-500 p-5 rounded-2xl text-left space-y-3 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                  Create Account
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Create your FOODEXA account as Student, Faculty, or Guest.
                </p>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 pt-1">
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          )}

          {/* Student Registration Option */}
          <button
            onClick={() => {
              onClose();
              onOpenStudentRegister();
            }}
            className="group bg-slate-950 border border-slate-800 hover:border-teal-500 p-5 rounded-2xl text-left space-y-3 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                Create Student Account
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                New student? Create your account for express pickup and smart meal planning.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 pt-1">
              <span>Register Account</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

        </div>

        {/* Bottom Institution Access Link */}
        <div className="pt-3 border-t border-slate-800/80 text-center text-xs text-slate-400">
          <span>Institution Administrator? </span>
          <a
            href="https://portal.foodexa.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 font-bold hover:underline inline-flex items-center gap-1 ml-1"
          >
            <span>Open Institution Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </div>
  );
};
