import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Building2, Loader2, LogOut, Utensils, ClipboardList, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface InstitutionDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstitutionDashboardModal: React.FC<InstitutionDashboardModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, signOut, institutionData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ orders: 0, menuItems: 0, counters: 0 });
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
    if (!isOpen || !profile?.institution_id) return;
    setLoading(true);
    try {
      const [{ count: orderCount }, { count: itemCount }, { data: menuItems }, { data: orders }] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('institution_id', profile.institution_id),
        supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('institution_id', profile.institution_id),
        supabase.from('menu_items').select('counter').eq('institution_id', profile.institution_id),
        supabase.from('orders').select('*').eq('institution_id', profile.institution_id).order('created_at', { ascending: false }).limit(10),
      ]);

      const uniqueCounters = new Set((menuItems || []).map((m: any) => m.counter).filter(Boolean)).size;
      setStats({ orders: orderCount || 0, menuItems: itemCount || 0, counters: uniqueCounters });
      setRecentOrders(orders || []);
    } catch (err) {
      console.error('Institution dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, profile?.institution_id]);

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
                <h2 className="truncate text-base font-black tracking-tight text-white sm:text-lg">Institution Dashboard</h2>
                <p className="truncate text-[11px] text-slate-400">{institutionData?.institution_code ? `Code: ${institutionData.institution_code}` : 'Institution sync pending'}</p>
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
            <div className="flex items-center justify-center py-20 text-sm font-bold text-slate-300"><Loader2 className="w-5 h-5 animate-spin text-emerald-400 mr-2" />Loading institution data...</div>
          ) : (
            <div className="mx-auto w-full max-w-[1800px] space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5"><Utensils className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{stats.menuItems}</p><p className="text-xs font-bold text-slate-500">Menu Items</p></div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5"><ClipboardList className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{stats.orders}</p><p className="text-xs font-bold text-slate-500">Total Orders</p></div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5"><Users className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{stats.counters}</p><p className="text-xs font-bold text-slate-500">Active Counters</p></div>
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
                        <p className="mt-2 text-xs text-slate-300">Counter: {o.counter}</p>
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
