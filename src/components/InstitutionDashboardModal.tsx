import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Building2, Loader2, LogOut, Utensils, ClipboardList, Users, Inbox, ChefHat, QrCode, CheckCircle2, Package, Plus, Minus, Save, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { mapMenuItem, subscribeMenuItems, getMenuAvailability, formatINR } from '../lib/supabase-service';
import type { OrderStatus, MenuItem } from '../types';

type QueueFilter = 'incoming' | 'preparing' | 'ready' | 'completed';

interface InstitutionDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_QUEUE: Record<string, QueueFilter> = {
  pending: 'incoming', accepted: 'preparing', preparing: 'preparing', ready: 'ready', completed: 'completed', cancelled: 'completed',
};

export const InstitutionDashboardModal: React.FC<InstitutionDashboardModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, signOut, institutionData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ orders: 0, menuItems: 0, counters: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockInput, setStockInput] = useState<number>(0);
  const [savingStock, setSavingStock] = useState(false);
  const [menuTab, setMenuTab] = useState<'orders' | 'inventory'>('orders');

  const load = useCallback(async () => {
    if (!isOpen || !profile?.institution_id) return;
    setLoading(true);
    try {
      const [{ count: orderCount }, { data: menuData }, { data: counters }, { data: recentOrders }] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('institution_id', profile.institution_id),
        supabase.from('menu_items').select('*').eq('institution_id', profile.institution_id).order('food_name', { ascending: true }),
        supabase.from('counters').select('name').eq('institution_id', profile.institution_id).eq('status', 'open'),
        supabase.from('orders').select('*').eq('institution_id', profile.institution_id).order('created_at', { ascending: false }),
      ]);

      const mapped = (menuData || []).map(mapMenuItem);
      setMenuItems(mapped);
      const uniqueCounters = new Set((counters || []).map((m: any) => m.name).filter(Boolean)).size;
      setStats({ orders: orderCount || 0, menuItems: mapped.length, counters: uniqueCounters });
      setOrders(recentOrders || []);
    } catch (err) {
      console.error('Institution dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, profile?.institution_id]);

  useEffect(() => { load(); }, [load]);

  // Realtime subscription for menu_items
  useEffect(() => {
    if (!isOpen || !profile?.institution_id) return;
    const unsub = subscribeMenuItems((payload: any) => {
      if (payload.eventType === 'INSERT') {
        const newItem = mapMenuItem(payload.new);
        setMenuItems((prev) => {
          if (prev.find((i) => i.id === newItem.id)) return prev;
          return [...prev, newItem];
        });
        setStats((s) => ({ ...s, menuItems: s.menuItems + 1 }));
      } else if (payload.eventType === 'UPDATE') {
        const updated = mapMenuItem(payload.new);
        setMenuItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else if (payload.eventType === 'DELETE') {
        setMenuItems((prev) => prev.filter((i) => i.id !== String(payload.old.id)));
        setStats((s) => ({ ...s, menuItems: Math.max(0, s.menuItems - 1) }));
      }
    }, { institution_id: profile.institution_id });
    return () => unsub();
  }, [isOpen, profile?.institution_id]);

  // Realtime subscription for orders
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
      }
    );
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isOpen, profile?.institution_id]);

  const handleStockUpdate = async (id: string, newStock: number) => {
    setSavingStock(true);
    const { error } = await supabase
      .from('menu_items')
      .update({ stock_quantity: Math.max(0, Math.floor(newStock)) })
      .eq('id', id);
    if (!error) {
      setMenuItems((prev) => prev.map((i) => i.id === id ? { ...i, stock_quantity: Math.max(0, Math.floor(newStock)) } : i));
    }
    setEditingStockId(null);
    setSavingStock(false);
  };

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

  const outOfStockCount = menuItems.filter((i) => i.stock_quantity !== undefined && i.stock_quantity <= 0).length;
  const lowStockCount = menuItems.filter((i) => i.stock_quantity !== undefined && i.stock_quantity > 0 && i.stock_quantity <= 5).length;

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const QueueCard = ({ label, icon: Icon, count, color }: { label: string; icon: React.ElementType; count: number; color: string }) => (
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

          {/* Tab navigation */}
          <div className="flex gap-1 mt-3 border-t border-slate-800 pt-3">
            <button
              onClick={() => setMenuTab('orders')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${menuTab === 'orders' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Orders
            </button>
            <button
              onClick={() => setMenuTab('inventory')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${menuTab === 'inventory' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Inventory
              {outOfStockCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500/20 text-red-300 text-[9px] font-black">{outOfStockCount}</span>
              )}
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 xl:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm font-bold text-slate-300"><Loader2 className="w-5 h-5 animate-spin text-emerald-400 mr-2" />Loading institution data...</div>
          ) : (
            <div className="mx-auto w-full max-w-[1800px] space-y-6">

              {/* ── STATS ROW ── */}
              {menuTab === 'orders' && (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  <QueueCard label="Incoming Queue" icon={Inbox} count={counts.incoming} color="text-amber-400" />
                  <QueueCard label="Preparing" icon={ChefHat} count={counts.preparing} color="text-violet-400" />
                  <QueueCard label="Ready for Pickup" icon={QrCode} count={counts.ready} color="text-emerald-400" />
                  <QueueCard label="Completed" icon={CheckCircle2} count={counts.completed} color="text-slate-400" />
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><Utensils className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{stats.menuItems}</p><p className="text-xs font-bold text-slate-500">Menu Items</p></div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><ClipboardList className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{stats.orders}</p><p className="text-xs font-bold text-slate-500">Total Orders</p></div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><Users className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{stats.counters}</p><p className="text-xs font-bold text-slate-500">Active Counters</p></div>
                </div>
              )}

              {/* ── INVENTORY TAB ── */}
              {menuTab === 'inventory' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <Package className="w-4 h-4 text-emerald-400" /> Menu Inventory
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {menuItems.length} items · {outOfStockCount} out of stock · {lowStockCount} low stock
                      </p>
                    </div>
                    <button
                      onClick={load}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  {menuItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-10 text-center">
                      <Package className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                      <p className="text-sm font-bold text-slate-400">No menu items yet</p>
                      <p className="text-xs text-slate-600 mt-1">Add items in Supabase to see them here.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {menuItems.map((item) => {
                        const { isSoldOut } = getMenuAvailability(item);
                        return (
                          <div key={item.id} className={`rounded-2xl border p-4 transition-all ${isSoldOut ? 'border-red-500/30 bg-red-950/20' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-sm font-extrabold text-white truncate">{item.name}</h4>
                                  {item.is_veg !== false && item.is_veg !== null && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                                )}
                              </div>
                              <span className="shrink-0 text-xs font-black text-emerald-300">{formatINR(item.price)}</span>
                            </div>

                            {/* Tags row */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {item.counter_name && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-semibold text-slate-400">
                                  <Building2 className="w-2 h-2" />{item.counter_name}
                                </span>
                              )}
                              {item.category && (
                                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-semibold text-slate-400">
                                  {item.category}
                                </span>
                              )}
                            </div>

                            {/* Stock section */}
                            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800 pt-3">
                              <div className="flex items-center gap-2">
                                <Package className={`w-3.5 h-3.5 ${isSoldOut ? 'text-red-400' : item.stock_quantity !== undefined && item.stock_quantity <= 5 ? 'text-amber-400' : 'text-emerald-400'}`} />
                                {editingStockId === item.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setStockInput((v) => Math.max(0, v - 1))}
                                      className="p-0.5 rounded bg-slate-800 text-slate-400 hover:text-white"
                                    ><Minus className="w-3 h-3" /></button>
                                    <input
                                      type="number"
                                      min={0}
                                      value={stockInput}
                                      onChange={(e) => setStockInput(Math.max(0, parseInt(e.target.value) || 0))}
                                      className="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs font-bold text-white text-center outline-none focus:border-emerald-500/60"
                                    />
                                    <button
                                      onClick={() => setStockInput((v) => v + 1)}
                                      className="p-0.5 rounded bg-slate-800 text-slate-400 hover:text-white"
                                    ><Plus className="w-3 h-3" /></button>
                                    <button
                                      onClick={() => handleStockUpdate(item.id, stockInput)}
                                      disabled={savingStock}
                                      className="p-0.5 rounded bg-emerald-950 text-emerald-400 hover:bg-emerald-900"
                                    ><Save className="w-3 h-3" /></button>
                                    <button
                                      onClick={() => setEditingStockId(null)}
                                      className="p-0.5 rounded bg-slate-800 text-slate-500 hover:text-slate-300"
                                    ><X className="w-3 h-3" /></button>
                                  </div>
                                ) : (
                                  <>
                                    <span className={`text-xs font-bold ${isSoldOut ? 'text-red-400' : 'text-white'}`}>
                                      {item.stock_quantity !== undefined ? item.stock_quantity : '∞'}
                                    </span>
                                    <span className="text-[9px] text-slate-500">in stock</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {isSoldOut ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-red-500/50 bg-red-950/80 px-2 py-0.5 text-[9px] font-black text-red-300">
                                    <XCircle className="w-2.5 h-2.5" /> Out of Stock
                                  </span>
                                ) : !item.is_available && item.stock_quantity !== undefined && item.stock_quantity > 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-950/80 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                                    <AlertCircle className="w-2.5 h-2.5" /> Unavailable
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-950/80 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Available
                                  </span>
                                )}
                                {editingStockId !== item.id && (
                                  <button
                                    onClick={() => { setEditingStockId(item.id); setStockInput(item.stock_quantity ?? 0); }}
                                    className="p-1 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                                  >
                                    <Package className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── ORDERS TAB ── */}
              {menuTab === 'orders' && (
                <section className="space-y-4">
                  <h3 className="text-sm font-extrabold text-white">Live Order Feed</h3>
                  {orders.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500">No orders yet.</div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {orders.slice(0, 50).map((o: any) => (
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
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
