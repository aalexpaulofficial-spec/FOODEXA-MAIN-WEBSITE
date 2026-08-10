import React from 'react';
import { Route, Search, CreditCard, Crosshair, Building2, LayoutDashboard, ShieldCheck, CheckSquare, Eye } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <span>How FOODEXA Works</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Three journeys. <span className="text-slate-500">One platform.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-emerald-500/40 transition-colors group">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Students & Faculty
            </h3>
            <div className="space-y-6 relative border-l border-slate-800 ml-4">
              <div className="relative pl-6">
                <div className="absolute w-2 h-2 bg-slate-700 group-hover:bg-emerald-500 rounded-full -left-[4.5px] top-1.5 ring-4 ring-slate-950 transition-colors" />
                <div className="text-sm font-bold text-white">Join Institution</div>
                <div className="text-xs text-slate-400 mt-1">Enter code & verify email</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-2 h-2 bg-slate-700 group-hover:bg-emerald-500 rounded-full -left-[4.5px] top-1.5 ring-4 ring-slate-950 transition-colors" />
                <div className="text-sm font-bold text-white">Discover & Order</div>
                <div className="text-xs text-slate-400 mt-1">Browse menus or ask LX AI</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-2 h-2 bg-slate-700 group-hover:bg-emerald-500 rounded-full -left-[4.5px] top-1.5 ring-4 ring-slate-950 transition-colors" />
                <div className="text-sm font-bold text-white">Pay Securely</div>
                <div className="text-xs text-slate-400 mt-1">UPI, cards, or allowances</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-2 h-2 bg-slate-700 group-hover:bg-emerald-500 rounded-full -left-[4.5px] top-1.5 ring-4 ring-slate-950 transition-colors" />
                <div className="text-sm font-bold text-white">Track & Pickup</div>
                <div className="text-xs text-slate-400 mt-1">Live updates & QR token</div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/40 transition-colors group">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Institutions & Vendors
            </h3>
            <div className="space-y-6 relative border-l border-slate-800 ml-4">
              <div className="relative pl-6">
                <div className="absolute w-2 h-2 bg-slate-700 group-hover:bg-indigo-500 rounded-full -left-[4.5px] top-1.5 ring-4 ring-slate-950 transition-colors" />
                <div className="text-sm font-bold text-white">Register</div>
                <div className="text-xs text-slate-400 mt-1">Submit campus details</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-2 h-2 bg-slate-700 group-hover:bg-indigo-500 rounded-full -left-[4.5px] top-1.5 ring-4 ring-slate-950 transition-colors" />
                <div className="text-sm font-bold text-white">Configure</div>
                <div className="text-xs text-slate-400 mt-1">Setup canteens & menus</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-2 h-2 bg-slate-700 group-hover:bg-indigo-500 rounded-full -left-[4.5px] top-1.5 ring-4 ring-slate-950 transition-colors" />
                <div className="text-sm font-bold text-white">Manage Operations</div>
                <div className="text-xs text-slate-400 mt-1">KDS, scanning & staff</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-2 h-2 bg-slate-700 group-hover:bg-indigo-500 rounded-full -left-[4.5px] top-1.5 ring-4 ring-slate-950 transition-colors" />
                <div className="text-sm font-bold text-white">Monitor Analytics</div>
                <div className="text-xs text-slate-400 mt-1">Live revenue & volume</div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-amber-500/40 transition-colors group">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              FOODEXA Super Admin
            </h3>
            <div className="space-y-6 relative border-l border-slate-800 ml-4">
              <div className="relative pl-6">
                <div className="absolute w-2 h-2 bg-slate-700 group-hover:bg-amber-500 rounded-full -left-[4.5px] top-1.5 ring-4 ring-slate-950 transition-colors" />
                <div className="text-sm font-bold text-white">Review Requests</div>
                <div className="text-xs text-slate-400 mt-1">Vet new universities</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-2 h-2 bg-slate-700 group-hover:bg-amber-500 rounded-full -left-[4.5px] top-1.5 ring-4 ring-slate-950 transition-colors" />
                <div className="text-sm font-bold text-white">Approve & Provision</div>
                <div className="text-xs text-slate-400 mt-1">Generate access codes</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-2 h-2 bg-slate-700 group-hover:bg-amber-500 rounded-full -left-[4.5px] top-1.5 ring-4 ring-slate-950 transition-colors" />
                <div className="text-sm font-bold text-white">Monitor Platform</div>
                <div className="text-xs text-slate-400 mt-1">Global health & metrics</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-2 h-2 bg-slate-700 group-hover:bg-amber-500 rounded-full -left-[4.5px] top-1.5 ring-4 ring-slate-950 transition-colors" />
                <div className="text-sm font-bold text-white">Manage Operations</div>
                <div className="text-xs text-slate-400 mt-1">Updates & configurations</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
