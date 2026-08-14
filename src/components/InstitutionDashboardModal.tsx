import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Building2, Loader2, LogOut, Utensils, ClipboardList, Users, Inbox, ChefHat, QrCode, CheckCircle2, Package, Plus, Minus, Save, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { mapMenuItem, subscribeMenuItems, getItemAvailability, formatINR } from '../lib/supabase-service';
import type { OrderStatus, MenuItem } from '../types';

type QueueFilter = 'incoming' | 'preparing' | 'ready' | 'completed';

interface InstitutionDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_QUEUE: Record<string, QueueFilter> = {
  pending: 'incoming',
  confirmed: 'preparing',
  accepted: 'preparing',
  preparing: 'preparing',
  ready: 'ready',
  completed: 'completed',
  cancelled: 'completed',
};

function normalizeStatus(status: string | null | undefined): string {
  const s = String(status || 'pending').toLowerCase();
  if (['pending', 'order received'].includes(s)) return 'pending';
  if (['accepted', 'confirmed'].includes(s)) return 'confirmed';
  if (['preparing', 'preparation', 'cooking', 'quality_check', 'packed'].includes(s)) return 'preparing';
  if (['ready', 'ready for pickup'].includes(s)) return 'ready';
  if (['completed', 'collected', 'delivered'].includes(s)) return 'completed';
  if (['cancelled', 'canceled'].includes(s)) return 'cancelled';
  return 'pending';
}

function statusBadgeClass(status: string): string {
  const s = normalizeStatus(status);
  switch (s) {
    case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'preparing': return 'bg-violet-100 text-violet-700 border-violet-200';
    case 'ready': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'completed': return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'cancelled': return 'bg-red-100 text-red-600 border-red-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

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
        supabase.from('orders').select('*, order_items(id, order_id, menu_item_id, name, quantity, price, subtotal)').eq('institution_id', profile.institution_id).order('created_at', { ascending: false }),
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
      .update({ stock: Math.max(0, Math.floor(newStock)) })
      .eq('id', id);
    if (!error) {
      setMenuItems((prev) => prev.map((i) => i.id === id ? { ...i, stock: Math.max(0, Math.floor(newStock)) } : i));
    }
    setEditingStockId(null);
    setSavingStock(false);
  };

  const queued = orders.reduce<Record<QueueFilter, any[]>>((acc, o) => {
    const qf = STATUS_QUEUE[normalizeStatus(o.status)] || 'incoming';
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

  const outOfStockCount = menuItems.filter((i) => getItemAvailability(i).isSoldOut).length;
  const lowStockCount = menuItems.filter((i) => !getItemAvailability(i).isSoldOut && i.stock > 0 && i.stock <= 5).length;

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const QueueCard = ({ label, icon: Icon, count, color }: { label: string; icon: React.ElementType; count: number; color: string }) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <Icon className={`w-5 h-5 ${color}`} />
      <p className="mt-4 text-3xl font-black text-black">{count}</p>
      <p className="text-xs font-bold text-gray-400">{label}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-white text-gray-900">
      <div className="flex h-full min-h-0 flex-col">
        <header className="shrink-0 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950">FX</div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-black tracking-tight text-black sm:text-lg">Institution Dashboard</h2>
                <p className="truncate text-[11px] text-gray-500">{institutionData?.institution_code ? `Code: ${institutionData.institution_code}` : 'Institution sync pending'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSignOut} className="rounded-full border border-gray-200 bg-gray-50 p-2 text-gray-500 transition hover:text-black"><LogOut className="w-5 h-5" /></button>
              <button onClick={onClose} className="rounded-full border border-gray-200 bg-gray-50 p-2 text-gray-500 transition hover:text-black"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 mt-3 border-t border-gray-200 pt-3">
            <button
              onClick={() => setMenuTab('orders')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${menuTab === 'orders' ? 'bg-black/20 border border-black/40 text-emerald-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Orders
            </button>
            <button
              onClick={() => setMenuTab('inventory')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${menuTab === 'inventory' ? 'bg-black/20 border border-black/40 text-emerald-300' : 'text-gray-400 hover:text-gray-600'}`}
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
            <div className="flex items-center justify-center py-20 text-sm font-bold text-gray-600"><Loader2 className="w-5 h-5 animate-spin text-black mr-2" />Loading institution data...</div>
          ) : (
            <div className="mx-auto w-full max-w-[1800px] space-y-6">

              {/* ── STATS ROW ── */}
              {menuTab === 'orders' && (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  <QueueCard label="Incoming Queue" icon={Inbox} count={counts.incoming} color="text-amber-400" />
                  <QueueCard label="Preparing" icon={ChefHat} count={counts.preparing} color="text-violet-400" />
                  <QueueCard label="Ready for Pickup" icon={QrCode} count={counts.ready} color="text-black" />
                  <QueueCard label="Completed" icon={CheckCircle2} count={counts.completed} color="text-gray-500" />
                  <div className="rounded-2xl border border-gray-200 bg-white p-4"><Utensils className="w-5 h-5 text-black" /><p className="mt-4 text-3xl font-black text-black">{stats.menuItems}</p><p className="text-xs font-bold text-gray-400">Menu Items</p></div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4"><ClipboardList className="w-5 h-5 text-black" /><p className="mt-4 text-3xl font-black text-black">{stats.orders}</p><p className="text-xs font-bold text-gray-400">Total Orders</p></div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4"><Users className="w-5 h-5 text-black" /><p className="mt-4 text-3xl font-black text-black">{stats.counters}</p><p className="text-xs font-bold text-gray-400">Active Counters</p></div>
                </div>
              )}

              {/* ── INVENTORY TAB ── */}
              {menuTab === 'inventory' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-black flex items-center gap-2">
                        <Package className="w-4 h-4 text-black" /> Menu Inventory
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {menuItems.length} items · {outOfStockCount} out of stock · {lowStockCount} low stock
                      </p>
                    </div>
                    <button
                      onClick={load}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-[10px] font-bold text-gray-500 hover:text-black hover:border-slate-600 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  {menuItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-10 text-center">
                      <Package className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                      <p className="text-sm font-bold text-gray-500">No menu items yet</p>
                      <p className="text-xs text-slate-600 mt-1">Add items in Supabase to see them here.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {menuItems.map((item) => {
                        const { isSoldOut } = getItemAvailability(item);
                        return (
                          <div key={item.id} className={`rounded-2xl border p-4 transition-all ${isSoldOut ? 'border-red-500/30 bg-red-950/20' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-sm font-extrabold text-black truncate">{item.name}</h4>
                                  {item.is_veg !== false && item.is_veg !== null && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-black shrink-0" />
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                                )}
                              </div>
                              <span className="shrink-0 text-xs font-black text-emerald-300">{formatINR(item.price)}</span>
                            </div>

                            {/* Tags row */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {item.counter_name && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-500">
                                  <Building2 className="w-2 h-2" />{item.counter_name}
                                </span>
                              )}
                              {item.category && (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-500">
                                  {item.category}
                                </span>
                              )}
                            </div>

                            {/* Stock section */}
                            <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-200 pt-3">
                              <div className="flex items-center gap-2">
                                <Package className={`w-3.5 h-3.5 ${isSoldOut ? 'text-red-400' : item.stock !== undefined && item.stock <= 5 ? 'text-amber-400' : 'text-black'}`} />
                                {editingStockId === item.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setStockInput((v) => Math.max(0, v - 1))}
                                      className="p-0.5 rounded bg-gray-100 text-gray-500 hover:text-black"
                                    ><Minus className="w-3 h-3" /></button>
                                    <input
                                      type="number"
                                      min={0}
                                      value={stockInput}
                                      onChange={(e) => setStockInput(Math.max(0, parseInt(e.target.value) || 0))}
                                      className="w-16 rounded border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs font-bold text-black text-center outline-none focus:border-black/60"
                                    />
                                    <button
                                      onClick={() => setStockInput((v) => v + 1)}
                                      className="p-0.5 rounded bg-gray-100 text-gray-500 hover:text-black"
                                    ><Plus className="w-3 h-3" /></button>
                                    <button
                                      onClick={() => handleStockUpdate(item.id, stockInput)}
                                      disabled={savingStock}
                                      className="p-0.5 rounded bg-emerald-950 text-black hover:bg-emerald-900"
                                    ><Save className="w-3 h-3" /></button>
                                    <button
                                      onClick={() => setEditingStockId(null)}
                                      className="p-0.5 rounded bg-gray-100 text-gray-400 hover:text-gray-600"
                                    ><X className="w-3 h-3" /></button>
                                  </div>
                                ) : (
                                  <>
                                    <span className={`text-xs font-bold ${isSoldOut ? 'text-red-400' : 'text-black'}`}>
                                      {item.stock !== undefined ? item.stock : '∞'}
                                    </span>
                                    <span className="text-[9px] text-gray-400">in stock</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {isSoldOut ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-red-500/50 bg-red-950/80 px-2 py-0.5 text-[9px] font-black text-red-300">
                                    <XCircle className="w-2.5 h-2.5" /> Out of Stock
                                  </span>
                                ) : !item.is_available && item.stock !== undefined && item.stock > 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-950/80 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                                    <AlertCircle className="w-2.5 h-2.5" /> Unavailable
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-black/50 bg-emerald-950/80 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Available
                                  </span>
                                )}
                                {editingStockId !== item.id && (
                                  <button
                                    onClick={() => { setEditingStockId(item.id); setStockInput(item.stock ?? 0); }}
                                    className="p-1 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
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
                  <h3 className="text-sm font-extrabold text-black">Live Order Feed</h3>
                  {orders.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-xs text-gray-400">No orders yet.</div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {orders.slice(0, 50).map((o: any) => {
                        const ns = normalizeStatus(o.status);
                        return (
                        <div key={o.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-gray-900">{o.token_number || 'TKN-????'} <span className="ml-1 text-gray-500">· {o.customer_name || 'Customer'}</span></p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass(o.status)}`}>{ns}</span>
                          </div>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-600">Counter: <span className="font-bold text-gray-800">{o.counter_name || o.counter_code || o.canteen_id || '—'}</span></p>
                            {o.pickup_code && <p className="text-xs text-cyan-600 font-mono font-bold">Pickup: {o.pickup_code}</p>}
                            <p className="text-xs text-gray-600">Items: {o.items?.length || 0} · Total: ₹{Number(o.total_amount || 0).toLocaleString('en-IN')}</p>
                            {o.estimated_ready_at && <p className="text-xs text-amber-600 font-bold">~{Math.max(0, Math.round((new Date(o.estimated_ready_at).getTime() - Date.now()) / 60000))} mins est.</p>}
                            <p className="text-[10px] text-gray-400">{o.created_at ? new Date(o.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                          </div>
                        </div>
                        );
                      })}
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
