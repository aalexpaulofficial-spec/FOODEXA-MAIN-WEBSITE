import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Sparkles, Clock, Activity, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { subscribeOrders } from '../lib/supabase-service';

export const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'traffic' | 'forecast' | 'dishes'>('traffic');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [{ count: totalOrders }, { data: recentOrders }, { data: counters }] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*').gte('created_at', today.toISOString()).order('created_at', { ascending: false }),
        supabase.from('counters').select('name')
      ]);

      const uniqueCounters = [...new Set((counters || []).map((c: any) => c.name))];
      const counterOrderCounts = (recentOrders || []).reduce((acc: any, o: any) => { acc[o.counter] = (acc[o.counter] || 0) + 1; return acc; }, {});

      const itemCounts: Record<string, { name: string; count: number; price: number }> = {};
      (recentOrders || []).forEach((o: any) => {
        (o.items || []).forEach((item: any) => {
          const key = item.name;
          if (!itemCounts[key]) itemCounts[key] = { name: item.name, count: 0, price: item.price || 0 };
          itemCounts[key].count += item.quantity || 1;
        });
      });
      const topDishes = Object.values(itemCounts).sort((a: any, b: any) => b.count - a.count).slice(0, 3);

      setDashboardData({
        totalOrders: totalOrders || 0,
        todayOrders: recentOrders?.length || 0,
        recentOrders: recentOrders || [],
        counters: uniqueCounters,
        counterOrderCounts,
        topDishes
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    const unsub = subscribeOrders(() => { fetchAnalytics(); });
    return () => unsub();
  }, [fetchAnalytics]);

  return (
    <section id="analytics" className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-teal-500/30 text-xs text-teal-300 font-mono">
            <Activity className="w-3.5 h-3.5 text-teal-400" /><span>Campus Dining Command Center</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Real-Time Intelligence & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Live Analytics</span></h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">Live order volume, counter activity, and campus dining metrics from the FOODEXA database.</p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <div><h3 className="text-sm font-bold text-white flex items-center gap-2">FOODEXA Live Command Center</h3><p className="text-[11px] text-slate-400 font-mono">{loading ? 'Loading...' : `${dashboardData?.counters?.length || 0} Counters Active`}</p></div>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button onClick={() => setActiveTab('traffic')} className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === 'traffic' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}>Live Traffic</button>
              <button onClick={() => setActiveTab('dishes')} className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === 'dishes' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}>Top Items</button>
            </div>
          </div>
          {loading ? (
            <div className="py-16 text-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-400" /><span className="text-xs font-mono">Loading live analytics...</span></div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 py-6 border-b border-slate-800">
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800"><div className="text-[10px] text-slate-400 font-mono uppercase">Orders Today</div><div className="text-2xl font-black text-white font-mono mt-1">{dashboardData?.todayOrders || 0}</div><div className="text-[10px] text-slate-400 font-mono mt-1">Total: {dashboardData?.totalOrders || 0}</div></div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800"><div className="text-[10px] text-slate-400 font-mono uppercase">Active Counters</div><div className="text-2xl font-black text-emerald-400 font-mono mt-1">{dashboardData?.counters?.length || 0}</div><div className="text-[10px] text-slate-400 font-mono mt-1">Campus dining stations</div></div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800"><div className="text-[10px] text-slate-400 font-mono uppercase">Recent Orders</div><div className="text-2xl font-black text-teal-300 font-mono mt-1">{dashboardData?.recentOrders?.length || 0}</div><div className="text-[10px] text-slate-400 font-mono mt-1">Since midnight</div></div>
              </div>
              <div className="pt-6">
                {activeTab === 'traffic' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Counter Load Distribution</h4>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {(dashboardData?.counters || []).map((counter: string) => {
                        const count = dashboardData?.counterOrderCounts?.[counter] || 0;
                        const maxCount = Math.max(...Object.values(dashboardData?.counterOrderCounts || { count: 1 }) as number[], 1);
                        const pct = Math.round((count / maxCount) * 100);
                        const isBusy = pct > 70;
                        const isMedium = pct > 40 && pct <= 70;
                        return (
                          <div key={counter} className={`bg-slate-950 p-4 rounded-2xl border ${isBusy ? 'border-red-500/40' : isMedium ? 'border-yellow-500/40' : 'border-emerald-500/40'} space-y-2`}>
                            <div className="flex justify-between items-center"><span className="text-xs font-bold text-white">{counter}</span><span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${isBusy ? 'bg-red-950 text-red-300' : isMedium ? 'bg-yellow-950 text-yellow-300' : 'bg-emerald-950 text-emerald-300'}`}>{count === 0 ? 'Inactive' : isBusy ? 'Busy' : isMedium ? 'Moderate' : 'Quiet'}</span></div>
                            <div className="text-xs text-slate-400">Orders today: <strong className="text-white font-mono">{count}</strong></div>
                            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden"><div className={`h-full ${isBusy ? 'bg-red-400' : isMedium ? 'bg-yellow-400' : 'bg-emerald-400'}`} style={{ width: `${Math.max(pct, 5)}%` }} /></div>
                          </div>
                        );
                      })}
                      {(!dashboardData?.counters || dashboardData.counters.length === 0) && <div className="col-span-full text-center py-8 text-xs text-slate-500">No counter data available yet.</div>}
                    </div>
                  </div>
                )}
                {activeTab === 'dishes' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Top Ordered Items Today</h4>
                    <div className="space-y-2 text-xs">
                      {(dashboardData?.topDishes || []).map((dish: any, idx: number) => (
                        <div key={dish.name} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-3"><span className="font-mono text-emerald-400 font-bold">#{idx + 1}</span><div><div className="font-bold text-white">{dish.name}</div></div></div>
                          <span className="font-mono text-xs text-slate-300">{dish.count} ordered</span>
                        </div>
                      ))}
                      {(!dashboardData?.topDishes || dashboardData.topDishes.length === 0) && <div className="text-center py-8 text-xs text-slate-500">No orders placed yet today.</div>}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};