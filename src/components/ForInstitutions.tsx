import React, { useEffect, useState } from 'react';
import { Building2, Users, UtensilsCrossed, Settings, LineChart, Shield, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ForInstitutionsProps {
  onOpenRegisterInstitution: () => void;
}

export const ForInstitutions: React.FC<ForInstitutionsProps> = ({ onOpenRegisterInstitution }) => {
  const [orderCount, setOrderCount] = useState<number>(12500);

  useEffect(() => {
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .then(({ count }) => { if (count) setOrderCount(count); });
  }, []);

  return (
    <section id="institutions" className="py-24 bg-slate-950 relative border-t border-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>For Institutions</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
              Manage campus <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">dining at scale.</span>
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Digitize your entire campus food operation. From vendor onboarding and menu management to live sales analytics and student access control. FOODEXA gives administrators complete visibility.
            </p>
            
            <div className="pt-2">
              <button onClick={onOpenRegisterInstitution} className="px-6 py-3.5 rounded-2xl bg-slate-900 border border-indigo-500/50 hover:border-indigo-400 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 cursor-pointer">
                <span>Register Your Institution</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'Student Access', icon: Users, desc: 'Manage verified student and faculty lists.' },
              { title: 'Vendor Control', icon: UtensilsCrossed, desc: 'Onboard cafes and manage their active menus.' },
              { title: 'Live Analytics', icon: LineChart, desc: `Track revenue and ${orderCount.toLocaleString()}+ orders.` },
              { title: 'Role Settings', icon: Shield, desc: 'Assign specific permissions to staff.' }
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className={`bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/30 transition-colors ${idx % 2 !== 0 ? 'translate-y-8' : ''}`}>
                  <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center mb-4 border border-slate-800">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">{feat.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
          
        </div>
      </div>
    </section>
  );
};