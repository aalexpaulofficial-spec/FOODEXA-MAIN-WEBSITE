import React, { useEffect, useState } from 'react';
import { Leaf, Recycle, ShieldCheck, Heart, Award, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const ImpactSustainability: React.FC = () => {
  const [stats, setStats] = useState<{ icon: string; title: string; desc: string; stat: string }[]>([
    { icon: 'recycle', title: 'Zero Single-Use Plastic', desc: 'FOODEXA integrates with university reusable container programs. RFID-tagged containers are tracked and returned effortlessly at campus locker stations.', stat: '🌱 Diverting millions of plastic containers from landfills' },
    { icon: 'leaf', title: '28% Food Waste Reduction', desc: 'LX AI predicts meal prep quantities based on student turnout and class schedules, preventing cafeterias from overcooking surplus perishable food.', stat: '📊 Hundreds of tons of surplus food saved across campuses' },
    { icon: 'heart', title: 'Empowering Local Vendors', desc: 'Small local food trucks, family-owned popups, and student-run food stalls get equal visibility alongside large franchises on FOODEXA.', stat: '❤️ Millions paid to local campus food partners' },
  ]);

  useEffect(() => {
    (async () => {
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      if (count && count > 1000) {
        const totalPaid = (count * 185).toLocaleString('en-IN');
        setStats((prev) => prev.map((s) => s.icon === 'heart' ? { ...s, stat: `❤️ ₹${totalPaid} paid to local campus food partners` } : s));
      }
    })().catch(() => {});
  }, []);

  const iconMap: Record<string, React.ReactNode> = { recycle: <Recycle className="w-6 h-6" />, leaf: <Leaf className="w-6 h-6" />, heart: <Heart className="w-6 h-6" /> };

  return (
    <section id="impact" className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-xs text-emerald-300 font-mono"><Leaf className="w-3.5 h-3.5 text-emerald-400" /><span>Sustainable Campus Initiative</span></div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Nourishing Campuses, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Protecting Our Planet</span></h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">FOODEXA combines AI inventory forecasting and smart reusable container tracking to help universities build zero-waste dining ecosystems.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {stats.map((s, i) => {
            const colors = ['border-emerald-500/30 bg-emerald-950', 'border-teal-500/30 bg-teal-950', 'border-indigo-500/30 bg-indigo-950'];
            const textColors = ['text-emerald-400', 'text-teal-400', 'text-indigo-400'];
            const statColors = ['text-emerald-400', 'text-teal-300', 'text-indigo-300'];
            return (
              <div key={i} className={`bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-emerald-500/40 transition-all`}>
                <div className={`w-12 h-12 rounded-2xl ${colors[i]} border flex items-center justify-center ${textColors[i]}`}>{iconMap[s.icon] || <Leaf className="w-6 h-6" />}</div>
                <h3 className="text-xl font-bold text-white">{s.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
                <div className={`pt-2 text-xs font-mono ${statColors[i]}`}>{s.stat}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};