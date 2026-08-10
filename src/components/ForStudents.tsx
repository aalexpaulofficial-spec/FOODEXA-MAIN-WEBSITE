import React from 'react';
import { GraduationCap, ArrowRight, Clock, MapPin } from 'lucide-react';

interface ForStudentsProps {
  onOpenCreateAccount: () => void;
}

export const ForStudents: React.FC<ForStudentsProps> = ({ onOpenCreateAccount }) => {
  return (
    <section id="students" className="py-24 bg-slate-950 relative border-t border-slate-900 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-400 font-mono">
              <span>For Students</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
              Skip the line. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Save your time.</span>
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Between classes, every minute counts. Join your campus ecosystem, order ahead, and pick up your food exactly when it's ready. No more waiting in crowded food courts.
            </p>
            
            <div className="space-y-4 pt-2">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Save 2+ hours a week</h4>
                  <p className="text-xs text-slate-400 mt-1">Average time saved by students skipping peak lunch hour queues.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Discover Campus Food</h4>
                  <p className="text-xs text-slate-400 mt-1">See what's open, what's good, and what's nearby across all campus cafeterias.</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button onClick={onOpenCreateAccount} className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer">
                <span>Create Student Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="lg:col-span-7">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative">
              {/* Glass subtle gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent rounded-3xl pointer-events-none" />
              
              <div className="flex flex-col gap-6">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">The Student Journey</h4>
                
                <div className="relative border-l border-slate-800 ml-4 space-y-8 pb-2">
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[6.5px] top-1 ring-4 ring-slate-900" />
                    <div className="text-sm font-bold text-white">Join Campus</div>
                    <div className="text-xs text-slate-400 mt-1">Enter your institution code and verify your student email.</div>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-slate-700 rounded-full -left-[6.5px] top-1 ring-4 ring-slate-900" />
                    <div className="text-sm font-bold text-white">Order Ahead</div>
                    <div className="text-xs text-slate-400 mt-1">Order before your lecture ends and pay securely via UPI or Card.</div>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-slate-700 rounded-full -left-[6.5px] top-1 ring-4 ring-slate-900" />
                    <div className="text-sm font-bold text-white">Live Updates</div>
                    <div className="text-xs text-slate-400 mt-1">Watch your order move from "Preparing" to "Ready" in real-time.</div>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-slate-700 rounded-full -left-[6.5px] top-1 ring-4 ring-slate-900" />
                    <div className="text-sm font-bold text-white">QR Pickup</div>
                    <div className="text-xs text-slate-400 mt-1">Flash your secure QR code at the counter and grab your food.</div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};