import React, { useState } from 'react';
import { BarChart3, TrendingUp, Sparkles, Clock, ShieldCheck, Flame, Users, ChevronRight, Activity } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'traffic' | 'forecast' | 'dishes'>('traffic');

  return (
    <section id="analytics" className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-teal-500/30 text-xs text-teal-300 font-mono">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span>Campus Dining Command Center</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Real-Time Intelligence & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">LX Predictive Analytics</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Monitor real-time cafeteria order volume, prep throughput, peak lunch rushes, and student satisfaction metrics from one centralized dashboard.
          </p>
        </div>

        {/* Dashboard Frame Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Dashboard Header Bar */}
          <div className="flex flex-wrap items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Stanford Main Campus • Live Command Center
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">Sync Interval: 1.0s • 4 Dining Halls Active</p>
              </div>
            </div>

            {/* View Selector Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('traffic')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'traffic'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Live Traffic
              </button>
              <button
                onClick={() => setActiveTab('forecast')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  activeTab === 'forecast'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                LX Forecast
              </button>
              <button
                onClick={() => setActiveTab('dishes')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'dishes'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Top Dishes
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-b border-slate-800">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Orders Today</div>
              <div className="text-2xl font-black text-white font-mono mt-1">4,892</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +18.4% vs last Tuesday
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Avg Prep Wait Time</div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">3.1 mins</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-1">⚡ Down from 22 mins</div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono uppercase">LX AI Auto Matches</div>
              <div className="text-2xl font-black text-teal-300 font-mono mt-1">89.2%</div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">Dietary & Budget Filtered</div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Student Satisfaction</div>
              <div className="text-2xl font-black text-indigo-400 font-mono mt-1">4.92 / 5.0</div>
              <div className="text-[10px] text-indigo-400 font-mono mt-1">★ Based on 1,420 ratings</div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="pt-6">
            {activeTab === 'traffic' && (
              <div className="space-y-4">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Live Campus Cafeteria Load Heatmap
                </h4>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">Science Quad Bistro</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                        Optimal
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">Wait: <strong className="text-emerald-400 font-mono">2 mins</strong></div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-[25%]" />
                    </div>
                    <p className="text-[10px] text-slate-500">Capacity: 25% • Locker Pod 2 Active</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-yellow-500/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">Main Library Cafe</span>
                      <span className="text-[10px] bg-yellow-950 text-yellow-300 px-2 py-0.5 rounded-full font-mono">
                        Medium
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">Wait: <strong className="text-yellow-400 font-mono">5 mins</strong></div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-yellow-400 h-full w-[55%]" />
                    </div>
                    <p className="text-[10px] text-slate-500">Capacity: 55% • Express Barista Active</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-red-500/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">North Student Union</span>
                      <span className="text-[10px] bg-red-950 text-red-300 px-2 py-0.5 rounded-full font-mono">
                        Peak Rush
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">Walk-in: <strong className="text-red-400 font-mono">22 mins</strong></div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-400 h-full w-[92%]" />
                    </div>
                    <p className="text-[10px] text-emerald-400 font-mono">💡 LX Express Pickup: 3 mins!</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">West Dorm Grill</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                        Optimal
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">Wait: <strong className="text-emerald-400 font-mono">4 mins</strong></div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-[35%]" />
                    </div>
                    <p className="text-[10px] text-slate-500">Capacity: 35% • Dorm Delivery Pool</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'forecast' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300 font-mono">LX AI Demand Forecast Summary</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      "Physics 101 midterm ends at 12:15 PM near Science Quad. LX predicts an influx of +220 students requesting quick high-protein meals. Kitchen staff instructed to pre-portion 120 Grilled Chicken Quinoa Bowls."
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dishes' && (
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Top 3 Student Favorite Campus Dishes
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-emerald-400 font-bold">#1</span>
                      <div>
                        <div className="font-bold text-white">Grilled Chicken Quinoa Bowl</div>
                        <div className="text-[10px] text-slate-400">Science Quad Bistro • $7.80</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-slate-300">1,240 orders / wk</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-emerald-400 font-bold">#2</span>
                      <div>
                        <div className="font-bold text-white">Iced Oat Vanilla Matcha</div>
                        <div className="text-[10px] text-slate-400">Library Artisan Roast • $4.50</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-slate-300">980 orders / wk</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-emerald-400 font-bold">#3</span>
                      <div>
                        <div className="font-bold text-white">Spicy Sesame Tofu Tan Tan</div>
                        <div className="text-[10px] text-slate-400">North Union Noodle House • $5.99</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-slate-300">850 orders / wk</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};
