import React, { useEffect, useState, useCallback } from 'react';
import { X, Loader2, LogOut, ChefHat, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { OrderStatus } from '../types';

interface KitchenDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready'];

export const KitchenDashboardModal: React.FC<KitchenDashboardModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, signOut, institutionData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!isOpen || !profile?.institution_id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('institution_id', profile.institution_id)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false });
      setOrders(data || []);
    } catch (err) {
      console.error('Kitchen dashboard load error:', err);
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
                <h2 className="truncate text-base font-black tracking-tight text-white sm:text-lg">Kitchen Dashboard</h2>
                <p className="truncate text-[11px] text-slate-400">{institutionData?.institution_code ? `Institution: ${institutionData.institution_code}` : 'Institution sync pending'}</p>
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
            <div className="flex items-center justify-center py-20 text-sm font-bold text-slate-300"><Loader2 className="w-5 h-5 animate-spin text-emerald-400 mr-2" />Loading kitchen orders...</div>
          ) : (
            <div className="mx-auto w-full max-w-[1800px] space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5"><ChefHat className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{orders.length}</p><p className="text-xs font-bold text-slate-500">Active Orders</p></div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5"><Clock className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{orders.filter((o) => o.status === 'preparing').length}</p><p className="text-xs font-bold text-slate-500">Preparing</p></div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{orders.filter((o) => o.status === 'ready').length}</p><p className="text-xs font-bold text-slate-500">Ready for Pickup</p></div>
              </div>
              <section className="space-y-4">
                <h3 className="text-sm font-extrabold text-white">Active Orders</h3>
                {orders.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500">No active orders right now.</div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {orders.map((o) => (
                      <div key={o.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <div className="flex items-center justify-between"><p className="text-xs font-black text-emerald-300">{o.order_id}</p><span className={`text-[10px] font-mono ${o.status === 'ready' ? 'text-emerald-300' : o.status === 'preparing' ? 'text-indigo-300' : 'text-yellow-300'}`}>{o.status}</span></div>
                        <p className="mt-2 text-xs text-slate-300">Counter: {o.counter}</p>
                        <p className="text-xs text-slate-300">Items: {o.items?.length || 0}</p>
                        <p className="text-xs text-slate-300">Total: {o.total_amount}</p>
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
