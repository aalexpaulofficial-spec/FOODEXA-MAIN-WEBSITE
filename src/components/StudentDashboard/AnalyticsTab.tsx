import React, { useMemo } from 'react';
import { TrendingUp, ShoppingBag, Receipt, Sparkles } from 'lucide-react';
import type { Order } from '../../types';
import { formatINR } from '../../lib/supabase-service';

interface AnalyticsTabProps {
  orders: Order[];
}

// Simple SVG bar chart — no external dependencies
const BarChart: React.FC<{ data: { label: string; value: number }[]; maxValue: number }> = ({ data, maxValue }) => {
  if (!data.length) return null;
  const colors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => {
        const pct = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
        return (
          <div key={d.label} className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-[9px] font-bold text-slate-500">{formatINR(d.value).replace('₹', '₹')}</span>
            <div
              className="w-full rounded-t-lg transition-all duration-700 ease-out"
              style={{
                height: `${Math.max(4, pct)}%`,
                background: `linear-gradient(to top, ${colors[i % colors.length]}, ${colors[i % colors.length]}88)`,
                minHeight: '4px',
              }}
            />
            <span className="text-[8px] text-slate-400 font-medium text-center leading-tight">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ orders }) => {
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'completed');
  const avgOrderValue = completedOrders.length > 0
    ? completedOrders.reduce((s, o) => s + o.total_amount, 0) / completedOrders.length
    : 0;
  const savings = orders.reduce((s, o) => {
    // estimate savings as discount portion if available
    return s;
  }, 0);

  // Weekly spend — last 7 days
  const weeklyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { date: d, label: d.toLocaleDateString('en-US', { weekday: 'short' }), value: 0 };
    });
    orders.forEach(o => {
      const created = new Date(o.created_at);
      const idx = days.findIndex(d =>
        d.date.toDateString() === created.toDateString()
      );
      if (idx >= 0) days[idx].value += o.total_amount;
    });
    return days;
  }, [orders]);

  const maxWeekly = Math.max(...weeklyData.map(d => d.value), 1);

  // Monthly spend — last 4 weeks label
  const monthlySummary = useMemo(() => {
    const now = new Date();
    const weeks = [0, 1, 2, 3].map(w => ({
      label: `Wk ${4 - w}`,
      value: 0,
    }));
    orders.forEach(o => {
      const created = new Date(o.created_at);
      const diffDays = Math.floor((now.getTime() - created.getTime()) / 86400000);
      const wIdx = Math.min(3, Math.floor(diffDays / 7));
      if (wIdx >= 0 && wIdx <= 3) weeks[3 - wIdx].value += o.total_amount;
    });
    return weeks;
  }, [orders]);

  const topItem = useMemo(() => {
    const freq: Record<string, { name: string; count: number }> = {};
    orders.forEach(o =>
      o.items.forEach(item => {
        if (!freq[item.name]) freq[item.name] = { name: item.name, count: 0 };
        freq[item.name].count += item.quantity;
      })
    );
    return Object.values(freq).sort((a, b) => b.count - a.count)[0] || null;
  }, [orders]);

  const statCards = [
    { label: 'Total Orders', value: totalOrders.toString(), icon: ShoppingBag, color: 'from-blue-500 to-indigo-600', glow: 'rgba(59,130,246,0.3)' },
    { label: 'Total Spent', value: formatINR(totalSpent), icon: Receipt, color: 'from-emerald-500 to-teal-600', glow: 'rgba(16,185,129,0.3)' },
    { label: 'Avg. Order', value: formatINR(avgOrderValue), icon: TrendingUp, color: 'from-violet-500 to-purple-600', glow: 'rgba(139,92,246,0.3)' },
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      <div className="p-4 space-y-5 max-w-2xl mx-auto">

        {/* Header */}
        <div>
          <h2 className="text-xl font-black text-slate-900">Spending Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">Derived from your order history</p>
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-3 gap-3">
          {statCards.map(card => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} p-4 flex flex-col gap-2`}
                style={{ boxShadow: `0 8px 24px ${card.glow}` }}
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-black text-white leading-tight truncate">{card.value}</p>
                  <p className="text-[9px] text-white/70 font-medium uppercase tracking-wider mt-0.5">{card.label}</p>
                </div>
                {/* bg orb */}
                <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-white/10 blur-xl pointer-events-none" />
              </div>
            );
          })}
        </div>

        {/* Weekly spending bar chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900">This Week's Spending</h3>
            <span className="text-[10px] text-slate-400 font-medium">Last 7 days</span>
          </div>
          {orders.length > 0 ? (
            <BarChart data={weeklyData} maxValue={maxWeekly} />
          ) : (
            <div className="h-28 flex items-center justify-center text-xs text-slate-400">
              No order data yet
            </div>
          )}
        </div>

        {/* Monthly breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900">Monthly Breakdown</h3>
            <span className="text-[10px] text-slate-400 font-medium">By week</span>
          </div>
          <BarChart data={monthlySummary} maxValue={Math.max(...monthlySummary.map(d => d.value), 1)} />
        </div>

        {/* Top ordered item */}
        {topItem && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Most Ordered Item</p>
              <p className="text-sm font-black text-slate-900 truncate">{topItem.name}</p>
              <p className="text-[11px] text-slate-500">{topItem.count} order{topItem.count !== 1 ? 's' : ''} total</p>
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <TrendingUp className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-500">No analytics yet</p>
            <p className="text-xs text-slate-400 mt-1">Start ordering to see your spending trends</p>
          </div>
        )}
      </div>
    </div>
  );
};
