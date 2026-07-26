import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Heart, Lock } from 'lucide-react';

interface FooterProps {
  onOpenBookDemo: () => void;
  onOpenLxDrawer: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenBookDemo, onOpenLxDrawer }) => {
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setSubscribed(true);
    setEmailInput('');
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-16 pb-12 text-slate-400 text-xs relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Column 1: Brand */}
          <div className="col-span-2 space-y-4">
            <a href="#" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 p-[1px] shadow-md shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <span className="font-extrabold text-base text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                    FX
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-white">FOODEXA</span>
                <span className="text-[10px] tracking-wider uppercase text-slate-400 font-mono">
                  Smart Campus Food Platform
                </span>
              </div>
            </a>

            <p className="text-slate-300 max-w-sm leading-relaxed text-xs">
              FOODEXA is the next-generation AI campus food ordering ecosystem. Powering express pickup, group cart order splitting, smart heated/cooled lockers, and LX AI meal recommendations across 45+ top university campuses.
            </p>

            {/* Live Operational Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>All Systems Operational</span>
              <span className="text-slate-500">• 99.99% Uptime</span>
            </div>
          </div>

          {/* Column 2: Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Platform</h4>
            <ul className="space-y-2">
              <li><a href="#platform" className="hover:text-emerald-300 transition-colors">LX AI Assistant</a></li>
              <li><a href="#platform" className="hover:text-emerald-300 transition-colors">Express Queue Jump</a></li>
              <li><a href="#platform" className="hover:text-emerald-300 transition-colors">Group Carts & Split Bills</a></li>
              <li><a href="#platform" className="hover:text-emerald-300 transition-colors">Smart Locker Hubs</a></li>
              <li><a href="#platform" className="hover:text-emerald-300 transition-colors">Merchant KDS & POS</a></li>
            </ul>
          </div>

          {/* Column 3: Audiences */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">For Campuses</h4>
            <ul className="space-y-2">
              <li><a href="#students" className="hover:text-emerald-300 transition-colors">For Students</a></li>
              <li><a href="#institutions" className="hover:text-emerald-300 transition-colors">For Universities</a></li>
              <li><a href="#institutions" className="hover:text-emerald-300 transition-colors">For Campus Vendors</a></li>
              <li><a href="#analytics" className="hover:text-emerald-300 transition-colors">Analytics & Command Center</a></li>
              <li><a href="#impact" className="hover:text-emerald-300 transition-colors">Sustainability Initiative</a></li>
            </ul>
          </div>

          {/* Column 4: Newsletter & Security */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Campus Dispatch</h4>
            <p className="text-[11px] text-slate-400">Get monthly insights on campus dining AI and smart locker innovations.</p>
            
            {!subscribed ? (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="university.edu email..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-emerald-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Subscribed! Check your inbox for updates.</span>
              </div>
            )}
          </div>

        </div>

        {/* Compliance & Security Badges Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> FERPA Ready
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SOC 2 Type II Certified
            </span>
            <span>•</span>
            <span>GDPR Compliant</span>
            <span>•</span>
            <span>PCI-DSS Level 1 Payment Safe</span>
          </div>

          <div className="flex items-center gap-4 font-mono">
            <span>© 2026 FOODEXA Inc. All rights reserved.</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
