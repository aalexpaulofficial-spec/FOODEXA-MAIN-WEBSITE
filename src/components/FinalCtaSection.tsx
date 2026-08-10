import React from 'react';
import { ArrowRight, Sparkles, Building2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface FinalCtaSectionProps {
  onOpenCreateAccount: () => void;
  onOpenLogin: () => void;
  onOpenRegisterInstitution: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ 
  onOpenCreateAccount, 
  onOpenLogin, 
  onOpenRegisterInstitution 
}) => {
  const { user, profile } = useAuth();
  
  // Handlers for authenticated state are expected to be managed by the parent
  // but we provide the visual layout here. If user is logged in, they wouldn't 
  // normally see these public CTAs, but we'll conditionally render a dashboard button.

  return (
    <section className="py-32 bg-slate-950 relative border-t border-slate-900 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-12">
        
        <h2 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight leading-[1.05]">
          One campus. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">One connected dining experience.</span>
        </h2>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {user && profile ? (
            <button className="px-8 py-4 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-bold text-sm hover:from-emerald-300 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer">
              <span>Open Your Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button onClick={onOpenCreateAccount} className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-bold text-sm hover:from-emerald-300 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer">
                <Sparkles className="w-4 h-4" />
                <span>Create Your Account</span>
              </button>
              
              <button onClick={onOpenLogin} className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 border border-slate-700 hover:border-slate-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Student Login</span>
              </button>
              
              <button onClick={onOpenRegisterInstitution} className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
                <Building2 className="w-4 h-4" />
                <span>Register Institution</span>
              </button>
            </>
          )}
        </div>
        
      </div>
    </section>
  );
};
