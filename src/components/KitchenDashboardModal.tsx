import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, LogOut, ChefHat, Clock, CheckCircle2, QrCode, Inbox } from 'lucide-react';
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
  const navigate = useNavigate();
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

  useEffect(() => {
    if (!isOpen || !profile?.institution_id) return;
    const channel = supabase.channel('kitchen-orders');
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `institution_id=eq.${profile.institution_id}` },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = payload.new as any;
          if (ACTIVE_STATUSES.includes(row.status)) {
            setOrders((prev) => [row, ...prev]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const row = payload.new as any;
          if (ACTIVE_STATUSES.includes(row.status)) {
            setOrders((prev) => prev.map((o) => o.id === row.id ? row : o));
          } else {
            setOrders((prev) => prev.filter((o) => o.id !== row.id));
          }
        } else if (payload.eventType === 'DELETE') {
          setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
        }
      }
    );
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isOpen, profile?.institution_id]);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
    if (error) {
      console.error('Status update failed:', error);
    } else {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white text-gray-900">
      <div className="flex h-full min-h-0 flex-col">
        <header className="shrink-0 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950">FX</div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-black tracking-tight text-black sm:text-lg">Kitchen Display</h2>
                <p className="truncate text-[11px] text-gray-500">{institutionData?.institution_code ? `Institution: ${institutionData.institution_code}` : 'Institution sync pending'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSignOut} className="rounded-full border border-gray-200 bg-gray-50 p-2 text-gray-500 transition hover:text-black"><LogOut className="w-5 h-5" /></button>
              <button onClick={onClose} className="rounded-full border border-gray-200 bg-gray-50 p-2 text-gray-500 transition hover:text-black"><X className="w-5 h-5" /></button>
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 xl:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm font-bold text-gray-600"><Loader2 className="w-5 h-5 animate-spin text-black mr-2" />Loading kitchen orders...</div>
          ) : (
            <div className="mx-auto w-full max-w-[1800px] space-y-6">
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <Inbox className="w-5 h-5 text-amber-400" />
                  <p className="mt-4 text-3xl font-black text-black">{orders.filter((o) => o.kitchen_status === 'pending' || o.status === 'pending').length}</p>
                  <p className="text-xs font-bold text-gray-400">Incoming</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <ChefHat className="w-5 h-5 text-violet-400" />
                  <p className="mt-4 text-3xl font-black text-black">{orders.filter((o) => o.status === 'preparing').length}</p>
                  <p className="text-xs font-bold text-gray-400">Preparing</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <QrCode className="w-5 h-5 text-black" />
                  <p className="mt-4 text-3xl font-black text-black">{orders.filter((o) => o.status === 'ready').length}</p>
                  <p className="text-xs font-bold text-gray-400">Ready</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <CheckCircle2 className="w-5 h-5 text-gray-500" />
                  <p className="mt-4 text-3xl font-black text-black">{orders.filter((o) => o.status === 'completed').length}</p>
                  <p className="text-xs font-bold text-gray-400">Completed</p>
                </div>
              </div>
              <section className="space-y-4">
                <h3 className="text-sm font-extrabold text-black">Live Queue</h3>
                {orders.length === 0 ? (
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-xs text-gray-400">No active orders right now.</div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {orders.map((o) => (
                      <div key={o.id} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-black text-emerald-300">{o.order_id}</p>
                            <p className="text-[9px] text-gray-400">{o.token_number || ''}</p>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${o.status === 'ready' ? 'text-emerald-300 bg-emerald-950/40' : o.status === 'preparing' ? 'text-indigo-300 bg-indigo-950/40' : 'text-yellow-300 bg-yellow-950/40'}`}>{o.status}</span>
                        </div>
                        <p className="text-xs text-gray-600">Counter: {o.canteen_id || o.counter_status || ''}</p>
                        <p className="text-xs text-gray-600">PIN: {o.pickup_code || 'N/A'}</p>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => updateStatus(o.id, 'accepted')} className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 text-[10px] font-bold text-amber-300 hover:bg-amber-950 transition-colors">Accept</button>
                          <button onClick={() => updateStatus(o.id, 'preparing')} className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 text-[10px] font-bold text-violet-300 hover:bg-violet-950 transition-colors">Prepare</button>
                          <button onClick={() => updateStatus(o.id, 'ready')} className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-950 transition-colors">Ready</button>
                          <button onClick={() => updateStatus(o.id, 'completed')} className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-100 transition-colors">Complete</button>
                        </div>
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
