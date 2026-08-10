import React from 'react';
import { UserCircle, QrCode, ArrowRight } from 'lucide-react';

interface ForGuestsProps {
  onOpenCreateAccount: () => void;
}

export const ForGuests: React.FC<ForGuestsProps> = ({ onOpenCreateAccount }) => {
  return (
    <section className="py-20 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-mono">
              <UserCircle className="w-3.5 h-3.5" />
              <span>Campus Visitors</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Visiting campus? Order like a local.
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Parents, visiting speakers, and prospective students can easily access the FOODEXA guest experience. Browse available public food courts and place eligible orders without pretending to be a permanent institution member.
            </p>
          </div>
          
          <div className="shrink-0 flex flex-col items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 w-full md:w-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <QrCode className="w-8 h-8 text-amber-400" />
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-white">Scan & Order</div>
              <div className="text-xs text-slate-400 mt-1">Scan QR codes at participating cafes.</div>
            </div>
            <button onClick={onOpenCreateAccount} className="w-full mt-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <span>Continue as Guest</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
        </div>
      </div>
    </section>
  );
};
