import React from 'react';
import { BookOpen, CreditCard, Clock, MapPin, ArrowRight } from 'lucide-react';

interface ForFacultyProps {
  onOpenCreateAccount: () => void;
}

export const ForFaculty: React.FC<ForFacultyProps> = ({ onOpenCreateAccount }) => {
  return (
    <section className="py-24 bg-slate-950 relative border-t border-slate-900 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/30 border border-blue-500/30 text-xs text-blue-400 font-mono">
              <span>For Faculty & Staff</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
              Premium dining, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">zero waiting.</span>
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Faculty members enjoy dedicated priority queues, seamless billing through department allowances, and pre-ordering for meetings or daily lunches.
            </p>
            
            <div className="space-y-4 pt-2">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Department Billing</h4>
                  <p className="text-xs text-slate-400 mt-1">Charge meals directly to authorized faculty allowances or department codes.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Scheduled Orders</h4>
                  <p className="text-xs text-slate-400 mt-1">Order your lunch in the morning and have it ready exactly between your classes.</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button onClick={onOpenCreateAccount} className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-xs hover:from-blue-400 hover:to-indigo-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer">
                <span>Create Faculty Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="lg:col-span-7">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">DR</div>
                  <div>
                    <div className="text-xs font-bold text-white">Dr. Sarah Jenkins</div>
                    <div className="text-[10px] text-slate-400">Computer Science Dept</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Monthly Allowance</div>
                  <div className="text-sm font-bold text-blue-400 font-mono">₹4,500 left</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Faculty Journey</h4>
                
                <div className="relative border-l border-slate-800 ml-4 space-y-6 pb-2">
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[6.5px] top-1 ring-4 ring-slate-900" />
                    <div className="text-sm font-bold text-white">Select Faculty & Join</div>
                    <div className="text-xs text-slate-400 mt-1">Enter your institution code and create an account with your university email.</div>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-slate-800 rounded-full -left-[6.5px] top-1 ring-4 ring-slate-900" />
                    <div className="text-sm font-bold text-white">Order & Pay</div>
                    <div className="text-xs text-slate-400 mt-1">Browse menus, schedule pickup, and pay via faculty allowance or personal wallet.</div>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-slate-800 rounded-full -left-[6.5px] top-1 ring-4 ring-slate-900" />
                    <div className="text-sm font-bold text-white">Priority Pickup</div>
                    <div className="text-xs text-slate-400 mt-1">Skip the general student queue and collect your meal from the dedicated faculty counter.</div>
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
