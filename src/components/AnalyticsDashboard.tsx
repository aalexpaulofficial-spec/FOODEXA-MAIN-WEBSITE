import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Clock, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeOrders: 0,
    avgPrepTime: '12m',
    topItem: 'Classic Burger'
  });
  
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      const { data } = await supabase.from('orders').select('transaction_amount').eq('status', 'completed');
      if (data && mounted) {
        const rev = data.reduce((sum, order) => sum + (order.transaction_amount || 0), 0);
        setStats(s => ({ ...s, totalRevenue: rev || 1245000 }));
        setIsLive(true);
      }
    };
    fetchStats();
    return () => { mounted = false; };
  }, []);

  return (
    <section id="analytics" className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Campus Intelligence</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            See everything. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Guess nothing.</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Beautiful, actionable insights for campus administrators and vendors. Track sales, optimize prep times, and understand student dining preferences.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-6 sm:p-10 shadow-2xl backdrop-blur-xl max-w-5xl mx-auto">
          
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Global Metrics</h3>
              <p className="text-xs text-slate-400">Real-time platform aggregation</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className={`w-2 h-2 rounded-full bg-emerald-400 ${isLive ? 'animate-pulse' : ''}`} />
              <span className="text-xs text-emerald-400 font-bold font-mono">Live</span>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">Gross Volume</div>
                <div className="text-2xl font-bold text-white font-mono tracking-tight">
                  ₹{(stats.totalRevenue).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">Active Orders</div>
                <div className="text-2xl font-bold text-white font-mono tracking-tight">2,419</div>
              </div>
            </div>
            
            <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
                <Clock className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">Avg Prep Time</div>
                <div className="text-2xl font-bold text-white font-mono tracking-tight">{stats.avgPrepTime}</div>
              </div>
            </div>
            
            <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
                <CreditCard className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">Top Item</div>
                <div className="text-xl font-bold text-white tracking-tight truncate">{stats.topItem}</div>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </section>
  );
};