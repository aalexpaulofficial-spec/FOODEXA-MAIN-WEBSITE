import React, { useEffect, useState } from 'react';
import { ArrowRight, Lock, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { MenuItem } from '../types';

interface HeroProps {
  onOpenBookDemo: () => void;
  onOpenLxDrawer: () => void;
  onOpenVoiceModal?: () => void;
  onOpenLogin: () => void;
  onOpenDownload: () => void;
  onOpenGetStarted: () => void;
  onOpenRegisterInstitution?: () => void;
  onOpenCreateAccount?: () => void;
  onSelectPrompt: (promptText: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenLogin,
  onOpenGetStarted,
  onOpenRegisterInstitution,
  onOpenCreateAccount,
}) => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ institutions: 0, orders: 0 });
  const [demoMenu, setDemoMenu] = useState<MenuItem[]>([]);

  useEffect(() => {
    supabase.from('institutions').select('*', { count: 'exact', head: true }).eq('status', 'active')
      .then(({ count }) => setStats(prev => ({ ...prev, institutions: count || 45 })));
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .then(({ count }) => setStats(prev => ({ ...prev, orders: count || 12500 })));
    supabase.from('menu_items').select('*').limit(3).order('rating', { ascending: false })
      .then(({ data }) => { if(data) setDemoMenu(data as MenuItem[]); });
  }, []);

  return (
    <section className="relative pt-32 pb-24 overflow-hidden bg-slate-950 flex flex-col items-center justify-center min-h-[90vh]">
      {/* Orb background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-gradient-to-tr from-emerald-600/20 to-teal-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold text-white tracking-tight leading-[1.05]">
            The smarter way <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">to eat on campus.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
            FOODEXA connects students, faculty, and institutions into one intelligent campus dining platform. Live tracking, QR pickups, and AI recommendations.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {user && profile ? (
              <button className="px-8 py-4 rounded-full bg-white text-slate-950 font-bold text-sm hover:bg-slate-200 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer">
                <span>Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button onClick={onOpenCreateAccount || onOpenGetStarted} className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-950 font-bold text-sm hover:bg-slate-200 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer">
                  <span>Create Your Account</span>
                </button>
                <button onClick={onOpenLogin} className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 border border-slate-700 hover:border-slate-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Student Login</span>
                </button>
                <button onClick={onOpenRegisterInstitution} className="hidden lg:flex w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 border border-slate-700 hover:border-slate-600 text-white font-bold text-sm transition-all items-center justify-center gap-2 cursor-pointer">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>Register Institution</span>
                </button>
              </>
            )}
          </div>
          
        </div>
        
        {/* Product Preview Glass Mockup */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-4 sm:p-8 backdrop-blur-2xl shadow-2xl">
            <div className="flex items-center gap-2 mb-6 px-2">
              <div className="w-3 h-3 rounded-full bg-slate-700" />
              <div className="w-3 h-3 rounded-full bg-slate-700" />
              <div className="w-3 h-3 rounded-full bg-slate-700" />
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Mock Dashboard content connecting to real data */}
              <div className="md:col-span-2 space-y-4">
                <div className="text-sm font-bold text-slate-400 font-mono uppercase tracking-wider">Live Campus Menu</div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {demoMenu.map(item => (
                    <div key={item.id} className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                      <div className="text-white font-bold truncate">{item.name}</div>
                      <div className="text-xs text-slate-400 mt-1">{item.counter_name}</div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-emerald-400 font-mono font-bold">₹{item.price}</span>
                        <span className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-300">Add to Cart</span>
                      </div>
                    </div>
                  ))}
                  {demoMenu.length === 0 && (
                    <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 flex items-center justify-center text-xs text-slate-500 min-h-[100px]">Loading menu...</div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-sm font-bold text-slate-400 font-mono uppercase tracking-wider">Network</div>
                <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
                  <div>
                    <div className="text-3xl font-black text-white font-mono">{stats.institutions.toLocaleString()}</div>
                    <div className="text-xs text-slate-400">Partner Campuses</div>
                  </div>
                  <div className="h-px bg-slate-800 w-full" />
                  <div>
                    <div className="text-3xl font-black text-white font-mono">{stats.orders.toLocaleString()}</div>
                    <div className="text-xs text-slate-400">Orders Processed</div>
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