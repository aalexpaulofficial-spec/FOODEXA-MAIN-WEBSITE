import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, LogOut, Globe, Users, ClipboardList } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface SuperAdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuperAdminDashboardModal: React.FC<SuperAdminDashboardModalProps> = ({ isOpen, onClose }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ institutions: 0, orders: 0, profiles: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const guard = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s || !s.user?.email_confirmed_at) {
        onClose();
        navigate('/');
      }
    };
    guard();
  }, [isOpen]);

  const load = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const [{ count: instCount }, { count: orderCount }, { count: profileCount }, { data: orders }] = await Promise.all([
        supabase.from('institutions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
      ]);
      setStats({ institutions: instCount || 0, orders: orderCount || 0, profiles: profileCount || 0 });
      setRecentOrders(orders || []);
    } catch (err) {
      console.error('Super admin dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => { load(); }, [load]);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100">
      <div className="flex h-full min-h-0 flex-col">
        <header className="shrink-0 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950">FX</div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-black tracking-tight text-white sm:text-lg">Super Admin Dashboard</h2>
                <p className="truncate text-[11px] text-slate-400">Platform-wide overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSignOut} className="rounded-full border border-slate-800 bg-slate-900 p-2 text-slate-400 transition hover:text-white"><LogOut className="w-5 h-5" /></button>
              <button onClick={onClose} className="rounded-full border border-slate-800 bg-slate-900 p-2 text-slate-400 transition hover:text-white"><X className="w-5 h-5" /></button>
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 xl:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm font-bold text-slate-300"><Loader2 className="w-5 h-5 animate-spin text-emerald-400 mr-2" />Loading platform data...</div>
          ) : (
            <div className="mx-auto w-full max-w-[1800px] space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5"><Globe className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{stats.institutions}</p><p className="text-xs font-bold text-slate-500">Active Institutions</p></div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5"><ClipboardList className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{stats.orders}</p><p className="text-xs font-bold text-slate-500">Total Orders</p></div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5"><Users className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{stats.profiles}</p><p className="text-xs font-bold text-slate-500">Registered Users</p></div>
              </div>
              <section className="space-y-4">
                <h3 className="text-sm font-extrabold text-white">Recent Orders</h3>
                {recentOrders.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500">No orders yet.</div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {recentOrders.map((o) => (
                      <div key={o.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <div className="flex items-center justify-between"><p className="text-xs font-black text-emerald-300">{o.order_id}</p><span className="text-[10px] font-mono text-slate-400">{new Date(o.created_at).toLocaleDateString()}</span></div>
                        <p className="mt-2 text-xs text-slate-300">Counter: {o.canteen_id || o.counter_status || ''}</p>
                        <p className="text-xs text-slate-300">Total: {o.total_amount}</p>
                        <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${o.status === 'completed' ? 'text-emerald-300 border-emerald-500/40 bg-emerald-950/40' : 'text-yellow-300 border-yellow-500/40 bg-yellow-950/40'}`}>{o.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
