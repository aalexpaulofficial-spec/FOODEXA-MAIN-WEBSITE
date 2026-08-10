import React, { useEffect, useState } from 'react';
import { Layers, GraduationCap, UtensilsCrossed, Settings, UserCircle, QrCode } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PlatformFeature } from '../types';

export const PlatformFeatures: React.FC = () => {
  const [features, setFeatures] = useState<PlatformFeature[]>([]);

  useEffect(() => {
    supabase.from('platform_features').select('*').eq('is_active', true).order('order', { ascending: true })
      .then(({ data }) => { if (data && data.length > 0) setFeatures(data as PlatformFeature[]); });
  }, []);

  const icons: Record<string, React.ReactNode> = {
    student: <GraduationCap className="w-6 h-6 text-emerald-400" />,
    kitchen: <UtensilsCrossed className="w-6 h-6 text-amber-400" />,
    admin: <Settings className="w-6 h-6 text-indigo-400" />,
    guest: <UserCircle className="w-6 h-6 text-teal-400" />,
    qr: <QrCode className="w-6 h-6 text-cyan-400" />
  };

  const defaultFeatures = [
    { title: 'For Students', subtitle: 'Smart Ordering', description: 'Browse campus menus, pay securely, and track orders live.', icon: 'student', gradient: 'from-emerald-500/20 to-teal-500/5', border: 'border-emerald-500/30' },
    { title: 'For Kitchens', subtitle: 'KDS & Prep', description: 'Real-time ticket management and inventory forecasting.', icon: 'kitchen', gradient: 'from-amber-500/20 to-orange-500/5', border: 'border-amber-500/30' },
    { title: 'For Administration', subtitle: 'Campus Control', description: 'Manage vendors, menus, roles, and view live analytics.', icon: 'admin', gradient: 'from-indigo-500/20 to-blue-500/5', border: 'border-indigo-500/30' },
  ];

  return (
    <section id="platform" className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <Layers className="w-3.5 h-3.5" />
            <span>The Platform Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            One platform. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Every campus persona.</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            FOODEXA isn't just an app. It's a complete operating system connecting the entire campus food ecosystem in real-time.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {(features.length > 0 ? features.map(f => ({ title: f.title, subtitle: f.badge, description: f.description, icon: f.icon_name || 'student', gradient: 'from-slate-800 to-slate-900', border: 'border-slate-800' })) : defaultFeatures).map((feat, idx) => (
            <div key={idx} className={`bg-slate-900/50 border ${feat.border} rounded-3xl p-8 relative overflow-hidden group`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${feat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                  {icons[feat.icon] || <Layers className="w-6 h-6 text-slate-400" />}
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1">{feat.subtitle}</div>
                  <h3 className="text-xl font-bold text-white">{feat.title}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};