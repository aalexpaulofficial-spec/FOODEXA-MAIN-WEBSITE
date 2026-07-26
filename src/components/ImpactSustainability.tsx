import React from 'react';
import { Leaf, Recycle, ShieldCheck, Heart, Award, ArrowRight } from 'lucide-react';

export const ImpactSustainability: React.FC = () => {
  return (
    <section id="impact" className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sustainable Campus Initiative</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Nourishing Campuses, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Protecting Our Planet</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            FOODEXA combines AI inventory forecasting and smart reusable container tracking to help universities build zero-waste dining ecosystems.
          </p>
        </div>

        {/* 3 Impact Pillars */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Recycle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Zero Single-Use Plastic</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              FOODEXA integrates with university reusable container programs (like Ozzi & GreenBox). RFID-tagged containers are tracked and returned effortlessly at campus locker stations.
            </p>
            <div className="pt-2 text-xs font-mono text-emerald-400">
              🌱 1.8M plastic containers diverted from landfills
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-950 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">28% Food Waste Reduction</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              LX AI predicts meal prep quantities based on student turnout and class schedules, preventing cafeterias from overcooking surplus perishable food.
            </p>
            <div className="pt-2 text-xs font-mono text-teal-300">
              📊 410 tons of surplus food saved across campuses
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Empowering Local Vendors</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Small local food trucks, family-owned popups, and student-run food stalls get equal visibility alongside large franchises on FOODEXA.
            </p>
            <div className="pt-2 text-xs font-mono text-indigo-300">
              ❤️ $4.2M paid to local campus food partners
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
