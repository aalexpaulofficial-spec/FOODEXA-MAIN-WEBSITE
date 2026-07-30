import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Building2, Loader2, LogOut, Utensils, ClipboardList, Users, Inbox, ChefHat, QrCode, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { OrderStatus } from '../types';

type QueueFilter = 'incoming' | 'preparing' | 'ready' | 'completed';

interface InstitutionDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_QUEUE: Record<string, QueueFilter> = {
  pending: 'incoming', accepted: 'preparing', preparing: 'preparing', ready: 'ready', completed: 'completed', cancelled: 'completed',
};

const queueOrder: QueueFilter[] = ['incoming', 'preparing', 'ready', 'completed'];

export const InstitutionDashboardModal: React.FC<InstitutionDashboardModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, signOut, institutionData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ orders: 0, menuItems: 0, counters: 0 });
  const [orders, setOrders] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!isOpen || !profile?.institution_id) return;
    setLoading(true);
    try {
      const [{ count: orderCount }, { count: itemCount }, { data: menuItems }, { data: recentOrders }] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('institution_id', profile.institution_id),
        supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('institution_id', profile.institution_id),
        supabase.from('menu_items').select('counter').eq('institution_id', profile.institution_id),
        supabase.from('orders').select('*').eq('institution_id', profile.institution_id).order('created_at', { ascending: false }),
      ]);

      const uniqueCounters = new Set((menuItems || []).map((m: any) => m.counter).filter(Boolean)).size;
      setStats({ orders: orderCount || 0, menuItems: itemCount || 0, counters: uniqueCounters });
      setOrders(recentOrders || []);
    } catch (err) {
      console.error('Institution dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, profile?.institution_id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isOpen || !profile?.institution_id) return;
    const channel = supabase.channel('institution-orders');
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `institution_id=eq.${profile.institution_id}` },
      (payload) => {
        const row = payload.new as any;
        if (payload.eventType === 'INSERT') {
          setOrders((prev) => [row, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders((prev) => prev.map((o) => o.id === row.id ? row : o));
        } else if (payload.eventType === 'DELETE') {
          setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
        }
        setStats((s) => ({ ...s }));
      }
    );
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isOpen, profile?.institution_id]);

  const queued = orders.reduce<Record<QueueFilter, any[]>>((acc, o) => {
    const qf = STATUS_QUEUE[(o.status || 'pending').toLowerCase()] || 'incoming';
    acc[qf] = acc[qf] || [];
    acc[qf].push(o);
    return acc;
  }, {} as Record<QueueFilter, any[]>);

  const counts = {
    incoming: queued.incoming?.length || 0,
    preparing: queued.preparing?.length || 0,
    ready: queued.ready?.length || 0,
    completed: queued.completed?.length || 0,
  };

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const QueueCard = ({ label, icon: Icon, count, color, filter }: { label: string; icon: React.ElementType; count: number; color: string; filter: QueueFilter }) => (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <Icon className={`w-5 h-5 ${color}`} />
      <p className="mt-4 text-3xl font-black text-white">{count}</p>
      <p className="text-xs font-bold text-slate-500">{label}</p>
    </div>
  );

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
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                <QueueCard label="Incoming Queue" icon={Inbox} count={counts.incoming} color="text-amber-400" filter="incoming" />
                <QueueCard label="Preparing" icon={ChefHat} count={counts.preparing} color="text-violet-400" filter="preparing" />
                <QueueCard label="Ready for Pickup" icon={QrCode} count={counts.ready} color="text-emerald-400" filter="ready" />
                <QueueCard label="Completed" icon={CheckCircle2} count={counts.completed} color="text-slate-400" filter="completed" />
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><Utensils className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{stats.menuItems}</p><p className="text-xs font-bold text-slate-500">Menu Items</p></div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><ClipboardList className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{stats.orders}</p><p className="text-xs font-bold text-slate-500">Total Orders</p></div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><Users className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{stats.counters}</p><p className="text-xs font-bold text-slate-500">Active Counters</p></div>
              </div>
              <section className="space-y-4">
                <h3 className="text-sm font-extrabold text-white">Live Order Feed</h3>
                {orders.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500">No orders yet.</div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {orders.map((o: any) => (
                      <div key={o.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-emerald-300">{o.order_id} {o.token_number && <span className="ml-1 text-amber-300">· {o.token_number}</span>}</p>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${o.status === 'completed' ? 'text-emerald-300' : o.status === 'preparing' ? 'text-indigo-300' : o.status === 'ready' ? 'text-emerald-300' : 'text-yellow-300'}`}>{o.status}</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-300">Counter: {o.canteen_id || o.counter_status || ''}</p>
                        <p className="text-xs text-slate-300">Items: {o.items?.length || 0}</p>
                        <p className="text-xs text-slate-300">Total: {o.total_amount}</p>
                        {o.pickup_code && <p className="text-xs text-cyan-400 font-mono mt-1">Code: {o.pickup_code}</p>}
                        {o.estimated_ready_at && <p className="text-xs text-amber-400 font-bold mt-1">~{Math.round((new Date(o.estimated_ready_at).getTime() - Date.now()) / 60000) || 15} mins est.</p>}
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
