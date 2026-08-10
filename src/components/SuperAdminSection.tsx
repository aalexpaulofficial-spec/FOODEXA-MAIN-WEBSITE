import React from 'react';
import { Database, Activity, Globe, ArrowRight } from 'lucide-react';

interface SuperAdminSectionProps {
  onOpenLogin: () => void;
}

export const SuperAdminSection: React.FC<SuperAdminSectionProps> = ({ onOpenLogin }) => {
  return (
    <section className="py-20 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12">
          
          <div className="space-y-6 max-w-2xl">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <Database className="w-6 h-6 text-emerald-400" />
              Platform Administration Layer
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              FOODEXA is a multi-tenant SaaS platform. Our Super Admin dashboard provides complete visibility into global operations, institution requests, platform health, subscriptions, and AI configurations.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono">Institution Directory</span>
              <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono">Global Analytics</span>
              <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono">Audit Logs</span>
              <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono">AI Center</span>
            </div>
          </div>
          
          <div className="shrink-0">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 w-full sm:w-64 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">System Status</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[98%]" />
                </div>
                <div className="text-[10px] text-slate-500 text-right">Uptime</div>
              </div>
              <button onClick={onOpenLogin} className="w-full mt-4 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer">
                Super Admin Login
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};
