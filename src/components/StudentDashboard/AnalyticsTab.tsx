import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  Award,
  DollarSign,
  HeartPulse,
  Leaf,
  Clock,
  PieChart as PieIcon,
  CheckCircle,
  Building2
} from 'lucide-react';
import type { Order } from '../../types';
import { formatINR } from '../../lib/supabase-service';

interface AnalyticsTabProps {
  orders: Order[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ orders }) => {
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  
  // Calculate average order value
  const completedOrders = orders.filter(o => o.status === 'completed');
  const avgOrderValue = completedOrders.length > 0
    ? completedOrders.reduce((s, o) => s + (o.total_amount || 0), 0) / completedOrders.length
    : 0;

  // Compute real stats from order data
  const totalSavings = useMemo(() => {
    return orders.reduce((s, o) => {
      const itemTotal = o.items.reduce((is, i) => is + i.price * i.quantity, 0);
      return s + Math.max(0, itemTotal - (o.total_amount || 0));
    }, 0);
  }, [orders]);

  // Weekly spend — last 7 days
  const weeklyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), spend: 0 };
    });
    orders.forEach(o => {
      const created = new Date(o.created_at);
      const idx = days.findIndex(d => d.day === created.toLocaleDateString('en-US', { weekday: 'short' }));
      if (idx >= 0) days[idx].spend += (o.total_amount || 0);
    });
    return days;
  }, [orders]);

  // Monthly spend — last 6 months
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { month: d.toLocaleDateString('en-US', { month: 'short' }), amount: 0 };
    });
    orders.forEach(o => {
      const created = new Date(o.created_at);
      const idx = months.findIndex(m => m.month === created.toLocaleDateString('en-US', { month: 'short' }));
      if (idx >= 0) months[idx].amount += (o.total_amount || 0);
    });
    return months;
  }, [orders]);

  // Compute real stats from order data
  const favoriteCanteen = useMemo(() => {
    if (orders.length === 0) return null;
    const canteenCounts = new Map<string, number>();
    orders.forEach(o => {
      if (o.counter) {
        canteenCounts.set(o.counter, (canteenCounts.get(o.counter) || 0) + 1);
      }
    });
    let maxCount = 0;
    let fav = '';
    canteenCounts.forEach((count, name) => {
      if (count > maxCount) { maxCount = count; fav = name; }
    });
    return fav ? { name: fav, orders: maxCount } : null;
  }, [orders]);

  const favoriteCategory = useMemo(() => {
    if (orders.length === 0) return null;
    const catCounts = new Map<string, number>();
    orders.forEach(o => {
      o.items.forEach(item => {
        const cat = item.variant || item.name;
        catCounts.set(cat, (catCounts.get(cat) || 0) + item.quantity);
      });
    });
    let maxCount = 0;
    let fav = '';
    catCounts.forEach((count, name) => {
      if (count > maxCount) { maxCount = count; fav = name; }
    });
    const pct = orders.length > 0 ? Math.round((maxCount / Math.max(orders.reduce((s, o) => s + o.items.reduce((is, i) => is + i.quantity, 0), 0), 1)) * 100) : 0;
    return fav ? { name: fav, pct } : null;
  }, [orders]);

  const avgWaitTime = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === 'completed' && o.created_at && o.completed_at);
    if (completedOrders.length === 0) return null;
    const totalMinutes = completedOrders.reduce((s, o) => {
      const diff = (new Date(o.completed_at!).getTime() - new Date(o.created_at).getTime()) / 60000;
      return s + diff;
    }, 0);
    return Math.round(totalMinutes / completedOrders.length * 10) / 10;
  }, [orders]);

  const healthyMealPct = useMemo(() => {
    if (orders.length === 0) return 0;
    const allItems = orders.flatMap(o => o.items);
    if (allItems.length === 0) return 0;
    const healthyCount = allItems.filter(i => {
      const name = i.name.toLowerCase();
      return name.includes('salad') || name.includes('bowl') || name.includes('grilled') || name.includes('healthy') || name.includes('wrap');
    }).length;
    return Math.round((healthyCount / allItems.length) * 100);
  }, [orders]);

  const co2Offset = useMemo(() => {
    return (orders.filter(o => o.status === 'completed').length * 0.4).toFixed(1);
  }, [orders]);

  return (
    <div className="w-full pb-32 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Campus Analytics</h2>
          <p className="text-xs text-slate-500">Your dining history, spending insights, and eco impact</p>
        </div>

        {/* Top Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          
          <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 p-4 rounded-3xl shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Orders</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalOrders}</p>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">All time</p>
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 p-4 rounded-3xl shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Money Spent</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-1">{formatINR(totalSpent)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Avg {formatINR(avgOrderValue)}/order</p>
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 p-4 rounded-3xl shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Savings</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatINR(totalSavings)}</p>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">Coupons Applied</p>
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 p-4 rounded-3xl shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Healthy Meals %</p>
            <p className="text-2xl font-extrabold text-teal-600 mt-1">{healthyMealPct}%</p>
            <p className="text-[10px] text-teal-600 font-medium mt-1">Based on your orders</p>
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 p-4 rounded-3xl col-span-2 sm:col-span-1 shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase">CO₂ Offset</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1 flex items-center gap-1">
              <Leaf className="w-5 h-5 text-emerald-500" />
              {co2Offset} kg
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Zero packaging waste</p>
          </div>

        </div>

        {/* Graphs Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Monthly Spending Bar Chart */}
          <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 p-5 sm:p-6 rounded-3xl shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Monthly Campus Spending (₹)</h3>
            <p className="text-xs text-slate-500 mb-4">Tracking monthly budget allocation across canteens</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', color: '#fff', border: 'none' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Bar dataKey="amount" fill="#2563eb" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Spending Trend Line Chart */}
          <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 p-5 sm:p-6 rounded-3xl shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Weekly Dining Activity (₹)</h3>
            <p className="text-xs text-slate-500 mb-4">Your spending pattern across the week</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', color: '#fff', border: 'none' }}
                    itemStyle={{ color: '#4ade80' }}
                  />
                  <Line type="monotone" dataKey="spend" stroke="#22c55e" strokeWidth={3} dot={{ r: 5, fill: '#22c55e' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Additional Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 p-5 rounded-3xl shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Favorite Canteen
            </h4>
            {favoriteCanteen ? (
              <>
                <p className="text-base font-extrabold text-slate-900">{favoriteCanteen.name}</p>
                <p className="text-xs text-slate-500 mt-1">{favoriteCanteen.orders} orders placed</p>
              </>
            ) : (
              <>
                <p className="text-base font-extrabold text-slate-400">No data yet</p>
                <p className="text-xs text-slate-400 mt-1">Place orders to see your favorites</p>
              </>
            )}
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 p-5 rounded-3xl shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              Most Ordered Category
            </h4>
            {favoriteCategory ? (
              <>
                <p className="text-base font-extrabold text-slate-900">{favoriteCategory.name}</p>
                <p className="text-xs text-slate-500 mt-1">{favoriteCategory.pct}% of total orders</p>
              </>
            ) : (
              <>
                <p className="text-base font-extrabold text-slate-400">No data yet</p>
                <p className="text-xs text-slate-400 mt-1">Place orders to see categories</p>
              </>
            )}
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 p-5 rounded-3xl shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Average Waiting Time
            </h4>
            {avgWaitTime !== null ? (
              <>
                <p className="text-base font-extrabold text-slate-900">{avgWaitTime} Minutes</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">Based on completed orders</p>
              </>
            ) : (
              <>
                <p className="text-base font-extrabold text-slate-400">No data yet</p>
                <p className="text-xs text-slate-400 mt-1">Complete orders to see wait times</p>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
