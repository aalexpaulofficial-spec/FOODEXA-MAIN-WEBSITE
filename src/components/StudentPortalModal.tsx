import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  AlertCircle, ArrowRight, Bell, Building2, CheckCircle2, ChefHat, Clock, CreditCard, Heart, Home, Loader2, LogOut,
  QrCode, Receipt, Search, ShoppingBag, Sparkles, Star, Tag, TrendingUp, User, Utensils, X, Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatDateTime, subscribeOrders, subscribeMenuItems, subscribeAnnouncements, placeOrder } from '../lib/supabase-service';
import type { MenuItem, Order, OrderStatus, NotificationItem, UserRole } from '../types';

interface StudentPortalModalProps { isOpen: boolean; onClose: () => void; }
type PortalTab = 'home' | 'menu' | 'orders' | 'announcements' | 'profile';

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready'];

const statusLabel = (s: OrderStatus) => {
  const map: Record<OrderStatus, string> = { pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready for Pickup', completed: 'Completed', cancelled: 'Cancelled' };
  return map[s] || s;
};

const statusColor = (s: OrderStatus) => {
  const map: Record<OrderStatus, string> = { pending: 'text-yellow-300 border-yellow-500/40 bg-yellow-950/40', accepted: 'text-blue-300 border-blue-500/40 bg-blue-950/40', preparing: 'text-indigo-300 border-indigo-500/40 bg-indigo-950/40', ready: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/50', completed: 'text-slate-400 border-slate-700 bg-slate-900', cancelled: 'text-red-300 border-red-500/40 bg-red-950/40' };
  return map[s] || 'text-slate-300 border-slate-700 bg-slate-900';
};

const roleLabel = (role: UserRole | null | undefined) => {
  if (role === 'student') return 'Student'; if (role === 'faculty') return 'Faculty'; if (role === 'guest') return 'Guest'; return 'Role pending';
};

const roleColor = (role: UserRole | null | undefined) => {
  if (role === 'student') return 'text-emerald-300 border-emerald-500/40 bg-emerald-950/50';
  if (role === 'faculty') return 'text-cyan-300 border-cyan-500/40 bg-cyan-950/40';
  if (role === 'guest') return 'text-amber-300 border-amber-500/40 bg-amber-950/40';
  return 'text-slate-300 border-slate-700 bg-slate-900';
};

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) => (
  <div className="flex items-end justify-between gap-4">
    <div className="space-y-1">
      <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-emerald-400" /><h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">{title}</h3></div>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, message }: { icon: React.ElementType; title: string; message: string }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-center">
    <Icon className="w-7 h-7 mx-auto text-slate-600" />
    <h4 className="mt-3 text-sm font-bold text-slate-200">{title}</h4>
    <p className="mt-1 text-xs text-slate-500">{message}</p>
  </div>
);

const FoodCard = ({ item, onAdd }: { key?: React.Key; item: MenuItem; onAdd: (item: MenuItem) => void }) => (
  <article className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30">
    <div className="relative h-36 bg-slate-900">
      {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/50"><Utensils className="w-9 h-9 text-emerald-500/70" /></div>
      )}
      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        {item.popular && <span className="rounded-full border border-emerald-500/40 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Trending</span>}
        {item.offer_label && <span className="rounded-full border border-amber-500/40 bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-300">{item.offer_label}</span>}
      </div>
    </div>
    <div className="space-y-3 p-4">
      <div>
        <div className="flex items-start justify-between gap-3"><h4 className="text-sm font-extrabold text-white">{item.name}</h4><span className="shrink-0 text-xs font-black text-emerald-300">{formatINR(item.price)}</span></div>
        <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs leading-relaxed text-slate-400">{item.description || item.category}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-400">
        <span className="rounded-full bg-slate-900 px-2 py-1">{item.counter_name}</span>
        <span className="rounded-full bg-slate-900 px-2 py-1">{item.category}</span>
        {item.prep_time && <span className="rounded-full bg-slate-900 px-2 py-1">{item.prep_time}</span>}
        {item.rating > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1 text-amber-300"><Star className="w-3 h-3 fill-amber-300" /> {item.rating.toFixed(1)}</span>}
      </div>
      <button onClick={() => onAdd(item)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-md transition-all hover:from-emerald-300">
        <ShoppingBag className="w-4 h-4 text-slate-950" /> Add to order
      </button>
    </div>
  </article>
);

const QRModal = ({ isOpen, onClose, order }: { isOpen: boolean; onClose: () => void; order: Order | null }) => {
  if (!isOpen || !order) return null;
  const qrValue = order.qr_code_data || order.qr_code || order.pickup_code || order.order_id;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 max-w-sm w-full text-center space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center"><QrCode className="w-10 h-10 text-emerald-400" /></div>
        <h3 className="text-xl font-black text-white">Pickup Code Ready</h3>
        <p className="text-xs text-slate-400">Show this code at the counter or scan at the locker hub</p>
        <div className="bg-white rounded-2xl p-4 mx-auto max-w-[200px]">
          <div className="font-mono text-2xl font-black text-slate-950 tracking-wider">{qrValue}</div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">{order.order_id}</div>
        </div>
        <p className="text-xs text-emerald-400 font-mono">Counter: {order.counter}</p>
        <button onClick={onClose} className="w-full py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white">Close</button>
      </div>
    </div>
  );
};

export const StudentPortalModal: React.FC<StudentPortalModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<PortalTab>('home');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [institutionName, setInstitutionName] = useState('');
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounter, setSelectedCounter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrOrder, setQrOrder] = useState<Order | null>(null);

  const liveRole = profile?.role || null;
  const displayName = profile?.full_name || profile?.email || user?.email || 'Signed-in user';
  const firstItemCounter = cart.length > 0 ? cart[0].item.counter_name : '';

  const handleOrderUpdate = useCallback((payload: any) => {
    const newStatus = payload.new?.status;
    if (newStatus && payload.new?.user_id === user?.id) {
      setOrders((prev) => {
        const exists = prev.find((o) => o.id === String(payload.new.id));
        if (exists) {
          return prev.map((o) => o.id === String(payload.new.id) ? {
            ...o, status: newStatus.toLowerCase() as OrderStatus,
            ready_at: payload.new.ready_at || o.ready_at,
            completed_at: payload.new.completed_at || o.completed_at,
            qr_code: payload.new.qr_code || payload.new.qr_code_data || o.qr_code,
            qr_code_data: payload.new.qr_code_data || o.qr_code_data,
            pickup_code: payload.new.pickup_code || o.pickup_code,
          } : o);
        }
        return prev;
      });
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true); setError(null);
      try {
        await refreshProfile();
        const [menuResult, orderResult, notifResult] = await Promise.all([
          supabase.from('menu_items').select('*').order('name'),
          user?.id ? supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
          supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        ]);
        if (menuResult.error) throw menuResult.error;
        if (orderResult.error) throw orderResult.error;
        if (notifResult.error) throw notifResult.error;

        setMenuItems((menuResult.data || []).map((r: any) => ({
          id: String(r.id), name: String(r.name || 'Item'), counter: String(r.counter || r.counter_name || ''), counter_name: String(r.counter_name || r.counter || ''),
          counter_id: null, price: Number(r.price || 0), offer_price: r.offer_price || null, offer_label: r.offer_label || null,
          prep_time: r.prep_time || null, rating: Number(r.rating || 0), category: String(r.category || ''), category_id: null,
          image_url: r.image_url || r.image || null, description: String(r.description || ''), is_available: true, is_published: true,
          popular: Boolean(r.popular), nutrition: r.nutrition || null, institution_id: null,
        })));
        setOrders((orderResult.data || []).map((r: any) => ({
          id: String(r.id), user_id: String(r.user_id || ''), email: String(r.email || ''), role: r.role || null,
          institution_id: r.institution_id || null, institution_code: r.institution_code || null, counter_id: null, category_id: null,
          order_id: String(r.order_id || r.id), counter: String(r.counter || ''), items: Array.isArray(r.items) ? r.items.map((i: any) => ({ name: String(i.name || ''), quantity: Number(i.quantity || 1), price: Number(i.price || 0) })) : [],
          total_amount: Number(r.total_amount || r.total || 0), status: (r.status || 'pending').toLowerCase() as OrderStatus,
          payment_status: r.payment_status || 'pending', pickup_code: r.pickup_code || r.qr_code || null, qr_code: r.qr_code || null,
          qr_code_data: r.qr_code_data || null, locker_number: r.locker_number || null, created_at: r.created_at || '',
          accepted_at: r.accepted_at || null, preparing_at: r.preparing_at || null, ready_at: r.ready_at || null, completed_at: r.completed_at || null, updated_at: r.updated_at || '',
        })));
        setNotifications((notifResult.data || []).map((r: any) => ({ id: String(r.id), title: String(r.title || 'Update'), message: String(r.message || ''), created_at: r.created_at || '', type: String(r.type || 'announcement'), read: Boolean(r.read) })));

        if (profile?.institution_id) {
          const { data: inst } = await supabase.from('institutions').select('name, campus').eq('id', profile.institution_id).maybeSingle();
          if (inst) setInstitutionName(`${inst.name}${inst.campus ? ` - ${inst.campus}` : ''}`);
        }
      } catch (err: any) { setError(err?.message || 'Failed to load portal data.'); } finally { setLoading(false); }
    };
    load();

    const unsubOrders = user?.id ? subscribeOrders(handleOrderUpdate, { user_id: user.id }) : () => {};
    const unsubMenu = subscribeMenuItems((payload) => {
      if (payload.eventType === 'INSERT' && payload.new?.is_published !== false) {
        setMenuItems((prev) => { const exists = prev.find((i) => i.id === String(payload.new.id)); return exists ? prev : [...prev, { id: String(payload.new.id), name: String(payload.new.name || ''), counter: String(payload.new.counter || ''), counter_name: String(payload.new.counter_name || ''), counter_id: null, price: Number(payload.new.price || 0), offer_price: null, offer_label: null, prep_time: null, rating: 0, category: String(payload.new.category || ''), category_id: null, image_url: null, description: '', is_available: true, is_published: true, popular: false, nutrition: null, institution_id: null }]; });
        } else if (payload.eventType === 'UPDATE') {
          setMenuItems((prev) => prev.map((i) => i.id === String(payload.new.id) ? { ...i, name: String(payload.new.name || i.name), price: Number(payload.new.price || i.price), is_published: payload.new.is_published !== false } : i));
        } else if (payload.eventType === 'DELETE') {
          setMenuItems((prev) => prev.filter((i) => i.id !== String(payload.old.id)));
        }
      });
    const unsubNotif = subscribeAnnouncements((payload) => {
      if (payload.eventType === 'INSERT') {
        setNotifications((prev) => [{ id: String(payload.new.id), title: String(payload.new.title || 'Update'), message: String(payload.new.message || ''), created_at: payload.new.created_at || '', type: String(payload.new.type || 'announcement'), read: false }, ...prev]);
      }
    });

    return () => { unsubOrders(); unsubMenu(); unsubNotif(); };
  }, [isOpen, profile?.institution_id, refreshProfile, user?.id, handleOrderUpdate]);

  const counters = useMemo(() => {
    const grouped = new Map<string, MenuItem[]>();
    menuItems.forEach((item) => grouped.set(item.counter_name, [...(grouped.get(item.counter_name) || []), item]));
    return Array.from(grouped.entries()).map(([name, items]) => ({ name, items, avgRating: items.reduce((s, i) => s + i.rating, 0) / Math.max(items.filter((i) => i.rating > 0).length, 1), categories: Array.from(new Set(items.map((i) => i.category))).slice(0, 3) }));
  }, [menuItems]);

  const orderItemNames = useMemo(() => new Set(orders.flatMap((o) => o.items.map((i) => i.name))), [orders]);
  const orderedCategories = useMemo(() => { const names = orderItemNames; return new Set(menuItems.filter((i) => names.has(i.name)).map((i) => i.category)); }, [menuItems, orderItemNames]);

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const pastOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));
  const offerItems = menuItems.filter((i) => i.offer_label).slice(0, 6);
  const trendingItems = [...menuItems].sort((a, b) => Number(b.popular) - Number(a.popular) || b.rating - a.rating).slice(0, 8);
  const quickReorderItems = menuItems.filter((i) => orderItemNames.has(i.name)).slice(0, 6);
  const personalizedItems = menuItems.filter((i) => orderedCategories.has(i.category) && !orderItemNames.has(i.name)).slice(0, 6);
  const nutritionItems = menuItems.filter((i) => i.nutrition).slice(0, 4);
  const filteredItems = menuItems.filter((i) => {
    const q = searchQuery.trim().toLowerCase();
    const cm = selectedCounter === 'ALL' || i.counter_name === selectedCounter;
    const qm = !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.counter_name.toLowerCase().includes(q);
    return cm && qm;
  });
  const cartTotal = cart.reduce((s, e) => s + e.item.price * e.quantity, 0);

  const addToCart = (item: MenuItem) => setCart((prev) => { const ex = prev.find((e) => e.item.id === item.id); return ex ? prev.map((e) => e.item.id === item.id ? { ...e, quantity: e.quantity + 1 } : e) : [...prev, { item, quantity: 1 }]; });
  const updateQuantity = (id: string, delta: number) => setCart((prev) => prev.map((e) => e.item.id === id ? { ...e, quantity: e.quantity + delta } : e).filter((e) => e.quantity > 0));

  const handlePlaceOrder = async () => {
    if (!user?.id || !profile?.email) { setError('Sign in required.'); return; }
    if (!liveRole) { setError('Profile role missing.'); return; }
    if (!cart.length) return;
    setSubmittingOrder(true); setError(null);
    const result = await placeOrder({
      user_id: user.id, email: profile.email, role: liveRole,
      institution_id: profile.institution_id, institution_code: profile.institution_code,
      counter: firstItemCounter,
      items: cart.map((e) => ({ id: e.item.id, name: e.item.name, quantity: e.quantity, price: e.item.price })),
      total_amount: cartTotal,
    });
    setSubmittingOrder(false);
    if (result.error) { setError(result.error); return; }
    if (result.data) setOrders((prev) => [result.data!, ...prev]);
    setCart([]);
    setActiveTab('orders');
  };

  const tabs: { id: PortalTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'menu', label: 'Menu', icon: Utensils },
    { id: 'orders', label: 'Orders', icon: Receipt, badge: activeOrders.length ? String(activeOrders.length) : undefined },
    { id: 'announcements', label: 'Updates', icon: Bell, badge: notifications.filter((n) => !n.read).length ? String(notifications.filter((n) => !n.read).length) : undefined },
    { id: 'profile', label: roleLabel(liveRole), icon: User },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100">
      <QRModal isOpen={!!qrOrder} onClose={() => setQrOrder(null)} order={qrOrder} />
      <div className="flex h-full min-h-0 flex-col">
        <header className="shrink-0 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950">FX</div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-base font-black tracking-tight text-white sm:text-lg">FOODEXA Campus Portal</h2><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${roleColor(liveRole)}`}>{roleLabel(liveRole)}</span></div>
                <p className="truncate text-[11px] text-slate-400">{institutionName || 'Institution sync pending'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveTab('menu')} className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-emerald-500/50 sm:flex">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />{cart.reduce((s, e) => s + e.quantity, 0)} items
              </button>
              <button onClick={onClose} className="rounded-full border border-slate-800 bg-slate-900 p-2 text-slate-400 transition hover:text-white"><X className="w-5 h-5" /></button>
            </div>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950 p-4 lg:block">
            <div className="space-y-2">
              {tabs.map((tab) => { const Icon = tab.icon; const active = activeTab === tab.id; return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-xs font-bold transition ${active ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}>
                  <span className="flex items-center gap-2"><Icon className="w-4 h-4" />{tab.label}</span>
                  {tab.badge && <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] text-slate-950">{tab.badge}</span>}
                </button>
              );})}
            </div>
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Signed in as</p>
              <p className="mt-1 truncate text-sm font-extrabold text-white">{displayName}</p>
              <p className="truncate text-[11px] text-slate-400">{profile?.email || user?.email}</p>
            </div>
          </aside>
          <main className="min-w-0 flex-1 overflow-y-auto">
            <nav className="sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-slate-800 bg-slate-950/95 px-4 py-2 backdrop-blur-xl lg:hidden">
              {tabs.map((tab) => { const Icon = tab.icon; const active = activeTab === tab.id; return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${active ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-400'}`}>
                  <Icon className="w-4 h-4" />{tab.label}
                </button>
              );})}
            </nav>
            <div className="mx-auto w-full max-w-[1800px] space-y-6 p-4 sm:p-6 xl:p-8">
              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
                  <AlertCircle className="mt-0.5 w-5 h-5 shrink-0 text-red-300" />
                  <div><p className="font-bold">Sync issue</p><p className="text-xs text-red-200/80">{error}</p></div>
                </div>
              )}
              {loading ? (
                <div className="grid min-h-[55vh] place-items-center rounded-3xl border border-slate-800 bg-slate-900/40">
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-300"><Loader2 className="w-5 h-5 animate-spin text-emerald-400" />Loading live campus data</div>
                </div>
              ) : (
                <>
                  {activeTab === 'home' && (
                    <div className="space-y-6">
                      <section className="grid gap-4 xl:grid-cols-[1.5fr_0.8fr]">
                        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/60 p-6 sm:p-8">
                          <div className="relative z-10 max-w-3xl space-y-5">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/70 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-300"><Zap className="w-3.5 h-3.5" />Live campus ordering</span>
                            <div className="space-y-2"><h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">{displayName.split(' ')[0] || 'Welcome'}, order from your campus counters faster.</h1><p className="max-w-2xl text-sm leading-relaxed text-slate-300">Your portal is synchronized with live menu items, active orders, announcements, and order history from Supabase.</p></div>
                            <div className="flex flex-wrap gap-3">
                              <button onClick={() => setActiveTab('menu')} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 px-5 py-3 text-xs font-black text-slate-950 shadow-lg">Browse live menu<ArrowRight className="w-4 h-4 text-slate-950" /></button>
                              <button onClick={() => setActiveTab('orders')} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-5 py-3 text-xs font-black text-slate-200">Track orders<Receipt className="w-4 h-4 text-emerald-400" /></button>
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                          {[
                            { label: 'Live counters', value: counters.length, icon: Building2 },
                            { label: 'Available dishes', value: menuItems.length, icon: ChefHat },
                            { label: 'Active orders', value: activeOrders.length, icon: Clock },
                          ].map((stat) => { const Icon = stat.icon; return (
                            <div key={stat.label} className="rounded-3xl border border-slate-800 bg-slate-950 p-5"><Icon className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-3xl font-black text-white">{stat.value}</p><p className="text-xs font-bold text-slate-500">{stat.label}</p></div>
                          );})}
                        </div>
                      </section>
                      <section className="grid gap-6 xl:grid-cols-3">
                        <div className="space-y-4 xl:col-span-2">
                          <SectionHeader icon={Tag} title="Featured Offers" subtitle="Live menu items with active discounts." />
                          {offerItems.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{offerItems.map((item) => <FoodCard key={item.id} item={item} onAdd={addToCart} />)}</div> : <EmptyState icon={Tag} title="No live offers" message="Offer items appear when menu_items have offer_label or discount_label fields set." />}
                        </div>
                        <div className="space-y-4">
                          <SectionHeader icon={Bell} title="Campus Announcements" />
                          {notifications.length ? <div className="space-y-3">{notifications.slice(0, 5).map((n) => (
                            <div key={n.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                              <div className="flex items-center justify-between gap-3"><h4 className="text-xs font-extrabold text-white">{n.title}</h4><span className="text-[10px] text-slate-500">{formatDateTime(n.created_at)}</span></div>
                              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-400">{n.message}</p>
                            </div>
                          ))}</div> : <EmptyState icon={Bell} title="No announcements" message="Notifications from Supabase will appear here." />}
                        </div>
                      </section>
                      <section className="space-y-4">
                        <SectionHeader icon={TrendingUp} title="Trending Meals" subtitle="Ranked by popularity and rating from live menu rows." />
                        {trendingItems.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{trendingItems.map((item) => <FoodCard key={item.id} item={item} onAdd={addToCart} />)}</div> : <EmptyState icon={Utensils} title="Menu is empty" message="Add menu_items rows in Supabase to populate the portal." />}
                      </section>
                      <section className="grid gap-6 xl:grid-cols-2">
                        <div className="space-y-4"><SectionHeader icon={Receipt} title="Quick Reorder" subtitle="From your previous orders." />{quickReorderItems.length ? <div className="grid gap-3 sm:grid-cols-2">{quickReorderItems.map((item) => <FoodCard key={item.id} item={item} onAdd={addToCart} />)}</div> : <EmptyState icon={Receipt} title="No reorder history" message="Previously ordered items will appear here." />}</div>
                        <div className="space-y-4"><SectionHeader icon={Sparkles} title="AI Recommendations" subtitle="Personalized from order history." />{personalizedItems.length ? <div className="grid gap-3 sm:grid-cols-2">{personalizedItems.map((item) => <FoodCard key={item.id} item={item} onAdd={addToCart} />)}</div> : <EmptyState icon={Sparkles} title="Recommendations warming up" message="More orders will unlock personalized recommendations." />}</div>
                      </section>
                    </div>
                  )}
                  {activeTab === 'menu' && (
                    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
                      <section className="space-y-5">
                        <div className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-950 p-4 lg:flex-row lg:items-center">
                          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-500" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search live meals, counters, or categories" className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-emerald-500" /></div>
                          <div className="flex gap-2 overflow-x-auto">{['ALL', ...counters.map((c) => c.name)].map((c) => (
                            <button key={c} onClick={() => setSelectedCounter(c)} className={`shrink-0 rounded-2xl px-4 py-3 text-xs font-black transition ${selectedCounter === c ? 'bg-emerald-400 text-slate-950' : 'border border-slate-800 bg-slate-900 text-slate-300'}`}>{c === 'ALL' ? 'All counters' : c}</button>
                          ))}</div>
                        </div>
                        {filteredItems.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{filteredItems.map((item) => <FoodCard key={item.id} item={item} onAdd={addToCart} />)}</div> : <EmptyState icon={Search} title="No matching items" message="Try a different search or counter filter." />}
                      </section>
                      <aside className="h-fit rounded-3xl border border-slate-800 bg-slate-950 p-5 xl:sticky xl:top-8">
                        <SectionHeader icon={ShoppingBag} title="Order Cart" />
                        <div className="mt-4 space-y-3">
                          {cart.length ? cart.map((entry) => (
                            <div key={entry.item.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-extrabold text-white">{entry.item.name}</p><p className="text-[10px] text-slate-500">{entry.item.counter_name}</p></div><p className="text-xs font-black text-emerald-300">{formatINR(entry.item.price * entry.quantity)}</p></div>
                              <div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2"><button onClick={() => updateQuantity(entry.item.id, -1)} className="h-7 w-7 rounded-lg bg-slate-950 text-slate-300">-</button><span className="text-xs font-bold text-white">{entry.quantity}</span><button onClick={() => updateQuantity(entry.item.id, 1)} className="h-7 w-7 rounded-lg bg-slate-950 text-slate-300">+</button></div></div>
                            </div>
                          )) : <EmptyState icon={ShoppingBag} title="Cart is empty" message="Add live menu items to begin checkout." />}
                        </div>
                        <div className="mt-5 border-t border-slate-800 pt-4">
                          <div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-300">Total</span><span className="font-black text-emerald-300">{formatINR(cartTotal)}</span></div>
                          <button onClick={handlePlaceOrder} disabled={!cart.length || submittingOrder} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 py-3 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
                            {submittingOrder ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <CreditCard className="w-4 h-4 text-slate-950" />}Place order
                          </button>
                        </div>
                      </aside>
                    </div>
                  )}
                  {activeTab === 'orders' && (
                    <div className="space-y-6">
                      <SectionHeader icon={Receipt} title="Order Tracking" subtitle="Live order status via Supabase Realtime." />
                      {activeOrders.length ? <div className="grid gap-4 xl:grid-cols-2">{activeOrders.map((order) => (
                        <div key={order.id} className="rounded-3xl border border-emerald-500/30 bg-slate-950 p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div><p className="text-xs font-black text-emerald-300">{order.order_id}</p><h4 className="mt-1 text-lg font-black text-white">{order.counter}</h4></div>
                            <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
                          </div>
                          <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-slate-900 p-3"><Clock className="w-4 h-4 text-emerald-400" /><p className="mt-2 text-[10px] text-slate-500">Placed</p><p className="text-xs font-bold text-white">{formatDateTime(order.created_at) || 'Now'}</p></div>
                            <div className="rounded-2xl bg-slate-900 p-3"><ShoppingBag className="w-4 h-4 text-emerald-400" /><p className="mt-2 text-[10px] text-slate-500">Items</p><p className="text-xs font-bold text-white">{order.items.length}</p></div>
                            <div className="rounded-2xl bg-slate-900 p-3">
                              <QrCode className="w-4 h-4 text-emerald-400" /><p className="mt-2 text-[10px] text-slate-500">Pickup</p>
                              {order.status === 'ready' ? (
                                <button onClick={() => setQrOrder(order)} className="text-xs font-bold text-emerald-400 underline">View QR Code</button>
                              ) : (
                                <p className="text-xs font-bold text-white">{order.locker_number || 'Counter pickup'}</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 space-y-2">{order.items.map((item, i) => (
                            <div key={`${order.id}-${i}`} className="flex justify-between text-xs text-slate-300"><span>{item.quantity} x {item.name}</span><span>{formatINR(item.price * item.quantity)}</span></div>
                          ))}</div>
                          <div className="mt-4 flex justify-between border-t border-slate-800 pt-3 text-sm font-black"><span>Total</span><span className="text-emerald-300">{formatINR(order.total_amount)}</span></div>
                          <div className="mt-3 flex gap-1.5 text-[10px] font-mono">
                            {['pending', 'accepted', 'preparing', 'ready', 'completed'].map((step) => {
                              const orderIdx = ['pending', 'accepted', 'preparing', 'ready', 'completed'].indexOf(order.status);
                              const stepIdx = ['pending', 'accepted', 'preparing', 'ready', 'completed'].indexOf(step);
                              return <div key={step} className={`flex-1 h-1.5 rounded-full ${stepIdx <= orderIdx ? 'bg-emerald-400' : order.status === 'cancelled' ? 'bg-red-500/30' : 'bg-slate-700'}`} />;
                            })}
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                            <span>Pending</span><span>Accepted</span><span>Preparing</span><span>Ready</span><span>Done</span>
                          </div>
                        </div>
                      ))}</div> : <EmptyState icon={Receipt} title="No active orders" message="Orders placed from this portal will appear here immediately via Realtime." />}
                      <SectionHeader icon={CheckCircle2} title="Recently Ordered" />
                      {pastOrders.length ? <div className="grid gap-3">{pastOrders.slice(0, 10).map((order) => (
                        <div key={order.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div><p className="text-xs font-black text-white">{order.order_id}</p><p className="mt-1 text-xs text-slate-400">{order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}</p></div>
                          <div className="text-left sm:text-right"><p className="text-xs font-black text-emerald-300">{formatINR(order.total_amount)}</p><p className="text-[10px] text-slate-500">{statusLabel(order.status)}</p></div>
                        </div>
                      ))}</div> : <EmptyState icon={Clock} title="No completed orders" message="Completed orders will be listed here." />}
                    </div>
                  )}
                  {activeTab === 'announcements' && (
                    <div className="space-y-5">
                      <SectionHeader icon={Bell} title="Campus Announcements" subtitle="Live records from Supabase." />
                      {notifications.length ? <div className="grid gap-4 lg:grid-cols-2">{notifications.map((n) => (
                        <div key={n.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                          <div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase text-emerald-300">{n.type}</span><h4 className="mt-3 text-sm font-black text-white">{n.title}</h4></div><span className="text-[10px] text-slate-500">{formatDateTime(n.created_at)}</span></div>
                          <p className="mt-3 text-sm leading-relaxed text-slate-400">{n.message}</p>
                        </div>
                      ))}</div> : <EmptyState icon={Bell} title="No live announcements" message="Add notification rows in Supabase to publish campus updates." />}
                    </div>
                  )}
                  {activeTab === 'profile' && (
                    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                      <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-2xl font-black text-slate-950">{displayName.charAt(0).toUpperCase()}</div>
                          <div className="min-w-0"><h3 className="truncate text-xl font-black text-white">{displayName}</h3><p className="truncate text-xs font-semibold text-emerald-300">{profile?.email || user?.email}</p><span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase ${roleColor(liveRole)}`}>{roleLabel(liveRole)}</span></div>
                        </div>
                        <button onClick={async () => { await signOut(); onClose(); }} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-950/20 py-3 text-xs font-black text-red-300 transition hover:bg-red-950/40"><LogOut className="w-4 h-4" />Sign out</button>
                      </section>
                      <section className="grid gap-4 sm:grid-cols-2">
                        {[
                          { label: 'Profile role', value: roleLabel(liveRole), icon: User },
                          { label: 'Institution', value: institutionName || 'Not linked', icon: Building2 },
                          { label: 'Institution code', value: profile?.institution_code || 'Not synced', icon: Tag },
                          { label: 'Email', value: profile?.email || user?.email || 'Synced', icon: Home },
                        ].map((item) => { const Icon = item.icon; return (
                          <div key={item.label} className="rounded-3xl border border-slate-800 bg-slate-950 p-5"><Icon className="w-5 h-5 text-emerald-400" /><p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.label}</p><p className="mt-1 text-sm font-black text-white">{item.value}</p></div>
                        );})}
                      </section>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};