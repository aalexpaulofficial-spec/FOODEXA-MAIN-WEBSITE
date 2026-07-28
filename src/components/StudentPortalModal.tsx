import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  AlertCircle, ArrowRight, Award, Bell, BookOpen, Building2, CheckCircle2, ChefHat, Clock, CreditCard,
  Heart, Home, Loader2, LogOut, MapPin, QrCode, Receipt, Search, Settings, ShoppingBag, Sparkles,
  Star, Tag, TrendingUp, User, Utensils, X, Zap, Edit3, Save, Phone, Mail, Hash, Shield,
  ChevronRight, Circle, Flame,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  formatINR, formatDateTime, subscribeOrders, subscribeMenuItems, subscribeAnnouncements,
  placeOrder, createRazorpayOrder, verifyRazorpayPayment, mapMenuItem,
} from '../lib/supabase-service';
import type { MenuItem, Order, OrderStatus, NotificationItem, UserRole } from '../types';

declare global { interface Window { Razorpay: any } }

interface StudentPortalModalProps { isOpen: boolean; onClose: () => void; role?: UserRole }
type PortalTab = 'home' | 'menu' | 'orders' | 'profile';

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready'];

const statusLabel = (s: OrderStatus) => {
  const map: Record<OrderStatus, string> = { pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' };
  return map[s] || s;
};

const statusColor = (s: OrderStatus) => {
  const map: Record<OrderStatus, string> = {
    pending: 'text-yellow-300 border-yellow-500/40 bg-yellow-950/40',
    accepted: 'text-blue-300 border-blue-500/40 bg-blue-950/40',
    preparing: 'text-indigo-300 border-indigo-500/40 bg-indigo-950/40',
    ready: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/50',
    completed: 'text-slate-400 border-slate-700 bg-slate-900',
    cancelled: 'text-red-300 border-red-500/40 bg-red-950/40',
  };
  return map[s] || 'text-slate-300 border-slate-700 bg-slate-900';
};

const roleLabel = (role: UserRole | null | undefined) => {
  if (role === 'student') return 'Student';
  if (role === 'faculty') return 'Faculty';
  if (role === 'guest') return 'Guest';
  return 'Member';
};

const roleColor = (role: UserRole | null | undefined) => {
  if (role === 'student') return 'text-emerald-300 border-emerald-500/40 bg-emerald-950/50';
  if (role === 'faculty') return 'text-cyan-300 border-cyan-500/40 bg-cyan-950/40';
  if (role === 'guest') return 'text-amber-300 border-amber-500/40 bg-amber-950/40';
  return 'text-slate-300 border-slate-700 bg-slate-900';
};

const formatDate = (d: string) => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

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

const EmptyState = ({ icon: Icon, title, message }: { icon: React.ElementType; title: string; message: string }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-center">
    <Icon className="w-7 h-7 mx-auto text-slate-600" />
    <h4 className="mt-3 text-sm font-bold text-slate-200">{title}</h4>
    <p className="mt-1 text-xs text-slate-500">{message}</p>
  </div>
);

export const StudentPortalModal: React.FC<StudentPortalModalProps> = ({ isOpen, onClose, role }) => {
  const { user, profile, refreshProfile, signOut, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<PortalTab>('home');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [institutionName, setInstitutionName] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounter, setSelectedCounter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrOrder, setQrOrder] = useState<Order | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '', department: '', semester: '', programme: '', campus_block: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const liveRole = profile?.role || null;
  const displayName = profile?.full_name || profile?.email || user?.email || 'User';
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
        const instId = profile?.institution_id;
        const [menuResult, orderResult, notifResult] = await Promise.all([
          supabase.from('menu_items').select('*').order('item_name', { ascending: true }),
          user?.id ? supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
          supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        ]);
        if (menuResult.error) throw menuResult.error;
        if (orderResult.error) throw orderResult.error;
        if (notifResult.error) throw notifResult.error;

        setMenuItems((menuResult.data || []).map(mapMenuItem));
        setOrders((orderResult.data || []).map((r: any) => ({
          id: String(r.id), user_id: String(r.user_id || ''), email: String(r.email || ''),
          role: ['student', 'faculty', 'guest', 'institution_admin', 'kitchen_staff', 'canteen_manager', 'super_admin'].includes(r.role) ? r.role : null,
          institution_id: r.institution_id || null, institution_code: r.institution_code || null,
          counter_id: null, category_id: null,
          order_id: String(r.order_id || r.id), counter: String(r.counter || ''),
          items: Array.isArray(r.items) ? r.items.map((i: any) => ({ name: String(i.item_name || i.name || 'Item'), quantity: Number(i.quantity || 1), price: Number(i.price || 0) })) : [],
          total_amount: Number(r.total_amount || r.total || 0),
          status: (r.status || 'pending').toLowerCase() as OrderStatus,
          payment_status: r.payment_status || 'pending', pickup_code: r.pickup_code || r.qr_code || null,
          qr_code: r.qr_code || null, qr_code_data: r.qr_code_data || null,
          locker_number: r.locker_number || null, created_at: r.created_at || '',
          accepted_at: r.accepted_at || null, preparing_at: r.preparing_at || null,
          ready_at: r.ready_at || null, completed_at: r.completed_at || null, updated_at: r.updated_at || '',
        })));
        setNotifications((notifResult.data || []).map((r: any) => ({
          id: String(r.id), title: String(r.title || r.heading || r.subject || 'Update'),
          message: String(r.message || r.body || r.content || ''),
          created_at: r.created_at || '', type: String(r.type || 'announcement'), read: Boolean(r.read || r.is_read),
        })));

        if (instId) {
          const { data: inst } = await supabase.from('institutions').select('name, campus, institution_code').eq('id', instId).maybeSingle();
          if (inst) {
            setInstitutionName(`${inst.name}${inst.campus ? ` - ${inst.campus}` : ''}`);
            setInstitutionCode(inst.institution_code || '');
          }
        } else if (profile?.institution_code) {
          const { data: inst } = await supabase.from('institutions').select('name, campus, institution_code').ilike('institution_code', profile.institution_code).maybeSingle();
          if (inst) {
            setInstitutionName(`${inst.name}${inst.campus ? ` - ${inst.campus}` : ''}`);
            setInstitutionCode(inst.institution_code || '');
          }
        }
      } catch (err: any) { setError(err?.message || 'Failed to load portal data.'); } finally { setLoading(false); }
    };
    load();

    const unsubOrders = user?.id ? subscribeOrders(handleOrderUpdate, { user_id: user.id }) : () => {};
    const unsubMenu = subscribeMenuItems((payload: any) => {
      if (payload.eventType === 'INSERT' && payload.new?.is_published !== false) {
        setMenuItems((prev) => { const exists = prev.find((i) => i.id === String(payload.new.id)); return exists ? prev : [...prev, mapMenuItem(payload.new)]; });
      } else if (payload.eventType === 'UPDATE') {
        setMenuItems((prev) => prev.map((i) => i.id === String(payload.new.id) ? { ...i, ...mapMenuItem(payload.new), id: i.id } : i));
      } else if (payload.eventType === 'DELETE') {
        setMenuItems((prev) => prev.filter((i) => i.id !== String(payload.old.id)));
      }
    });
    const unsubNotif = subscribeAnnouncements((payload: any) => {
      if (payload.eventType === 'INSERT') {
        setNotifications((prev) => [{
          id: String(payload.new.id), title: String(payload.new.title || payload.new.heading || 'Update'),
          message: String(payload.new.message || payload.new.body || ''),
          created_at: payload.new.created_at || '', type: String(payload.new.type || 'announcement'), read: false,
        }, ...prev]);
      }
    });

    return () => { unsubOrders(); unsubMenu(); unsubNotif(); };
  }, [isOpen, profile?.institution_id, profile?.institution_code, refreshProfile, user?.id, handleOrderUpdate]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    menuItems.forEach((i) => { if (i.category) cats.add(i.category); });
    return Array.from(cats);
  }, [menuItems]);

  const counters = useMemo(() => {
    const grouped = new Map<string, MenuItem[]>();
    menuItems.forEach((item) => grouped.set(item.counter_name, [...(grouped.get(item.counter_name) || []), item]));
    return Array.from(grouped.entries()).map(([name, items]) => ({
      name, items, count: items.length,
      avgRating: items.reduce((s, i) => s + i.rating, 0) / Math.max(items.filter((i) => i.rating > 0).length, 1),
      categories: Array.from(new Set(items.map((i) => i.category))).slice(0, 3),
    }));
  }, [menuItems]);

  const orderItemNames = useMemo(() => new Set(orders.flatMap((o) => o.items.map((i) => i.name))), [orders]);
  const orderedCategories = useMemo(() => {
    const names = orderItemNames;
    return new Set(menuItems.filter((i) => names.has(i.name)).map((i) => i.category));
  }, [menuItems, orderItemNames]);

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const pastOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));
  const offerItems = menuItems.filter((i) => i.offer_label).slice(0, 8);
  const trendingItems = [...menuItems].sort((a, b) => Number(b.popular) - Number(a.popular) || b.rating - a.rating).slice(0, 10);
  const quickReorderItems = menuItems.filter((i) => orderItemNames.has(i.name)).slice(0, 8);
  const personalizedItems = menuItems.filter((i) => orderedCategories.has(i.category) && !orderItemNames.has(i.name)).slice(0, 8);
  const todaySpecials = menuItems.filter((i) => i.popular).slice(0, 6);

  const filteredItems = menuItems.filter((i) => {
    const q = searchQuery.trim().toLowerCase();
    const cm = selectedCounter === 'ALL' || i.counter_name === selectedCounter;
    const catM = selectedCategory === 'ALL' || i.category === selectedCategory;
    const qm = !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.counter_name.toLowerCase().includes(q);
    return cm && catM && qm;
  });

  const cartTotal = cart.reduce((s, e) => s + e.item.price * e.quantity, 0);
  const cartCount = cart.reduce((s, e) => s + e.quantity, 0);

  const addToCart = (item: MenuItem) => setCart((prev) => {
    const ex = prev.find((e) => e.item.id === item.id);
    return ex ? prev.map((e) => e.item.id === item.id ? { ...e, quantity: e.quantity + 1 } : e) : [...prev, { item, quantity: 1 }];
  });
  const updateQuantity = (id: string, delta: number) => setCart((prev) =>
    prev.map((e) => e.item.id === id ? { ...e, quantity: e.quantity + delta } : e).filter((e) => e.quantity > 0)
  );

  const handlePlaceOrder = async () => {
    if (!user?.id || !profile?.email) { setError('Sign in required.'); return; }
    if (!liveRole) { setError('Profile role missing.'); return; }
    if (!cart.length) return;
    setSubmittingOrder(true); setError(null);
    try {
      const tempOrderId = `FDX-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const razorpayResult = await createRazorpayOrder({
        amount: cartTotal, currency: 'INR', user_id: user.id, email: profile.email,
        phone: profile.phone || undefined, name: profile.full_name || undefined,
        institution_id: profile.institution_id || undefined, order_id: tempOrderId, counter: firstItemCounter,
      });
      if (!razorpayResult.success || !razorpayResult.order_id) {
        setError(razorpayResult.error || 'Failed to initialize payment.'); setSubmittingOrder(false); return;
      }

      const razorpayKeyId = razorpayResult.razorpay_key_id;
      if (!razorpayKeyId) { setError('Payment configuration error.'); setSubmittingOrder(false); return; }

      const options = {
        key: razorpayKeyId, amount: razorpayResult.amount, currency: razorpayResult.currency || 'INR',
        name: 'FOODEXA', description: `Campus Order - ${firstItemCounter}`,
        order_id: razorpayResult.order_id,
        handler: async function (response: any) {
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;
          try {
            const verifyResult = await verifyRazorpayPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id: user.id, order_id: tempOrderId });
            if (!verifyResult.success) { setError(verifyResult.error || 'Payment verification failed.'); setSubmittingOrder(false); return; }
            const orderResult = await placeOrder({
              user_id: user.id, email: profile.email, role: liveRole, institution_id: profile.institution_id,
              institution_code: profile.institution_code, counter: firstItemCounter,
              items: cart.map((e) => ({ id: e.item.id, name: e.item.name, quantity: e.quantity, price: e.item.price })),
              total_amount: cartTotal, razorpay_order_id, razorpay_payment_id, razorpay_signature,
            });
            if (orderResult.error) { setError(`Order failed: ${orderResult.error}`); setSubmittingOrder(false); return; }
            if (orderResult.data) setOrders((prev) => [orderResult.data!, ...prev]);
            setCart([]); setActiveTab('orders'); setShowCart(false); setSubmittingOrder(false);
          } catch (verifyErr: any) {
            console.error('Payment verification error:', verifyErr);
            setError('Payment completed but verification failed. Contact support.'); setSubmittingOrder(false);
          }
        },
        prefill: { name: profile.full_name || '', email: profile.email || '', contact: profile.phone || '' },
        notes: { institution_id: profile.institution_id || '', order_id: tempOrderId, counter: firstItemCounter },
        theme: { color: '#34d399' },
        modal: { ondismiss: function () { setSubmittingOrder(false); setError('Payment cancelled.'); } },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        setError(`Payment failed: ${response?.error?.description || 'Please try again.'}`); setSubmittingOrder(false);
      });
      razorpay.open();
    } catch (err: any) {
      console.error('Order initiation error:', err);
      setError(err?.message || 'Failed to initiate payment.'); setSubmittingOrder(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleEditProfile = () => {
    setProfileForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      department: profile?.department || '',
      semester: profile?.semester || '',
      programme: profile?.programme || '',
      campus_block: profile?.campus_block || '',
    });
    setEditingProfile(true);
    setProfileMessage(null);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true); setProfileMessage(null);
    const { error: saveError } = await updateProfile({
      full_name: profileForm.full_name,
      phone: profileForm.phone,
      department: profileForm.department,
      semester: profileForm.semester,
      programme: profileForm.programme,
      campus_block: profileForm.campus_block,
    });
    if (saveError) {
      setProfileMessage(`Failed: ${saveError.message}`);
    } else {
      setProfileMessage('Profile updated successfully!');
      setEditingProfile(false);
      await refreshProfile();
    }
    setSavingProfile(false);
  };

  const tabs: { id: PortalTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'menu', label: 'Menu', icon: Utensils },
    { id: 'orders', label: 'Orders', icon: Receipt, badge: activeOrders.length ? String(activeOrders.length) : undefined },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100">
      <QRModal isOpen={!!qrOrder} onClose={() => setQrOrder(null)} order={qrOrder} />

      {/* Header */}
      <header className="sticky top-0 z-30 shrink-0 border-b border-slate-800/80 bg-slate-950/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 text-base font-black text-slate-950 shadow-lg shadow-emerald-950/50">FX</div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white">FOODEXA</h1>
              <p className="truncate text-[10px] text-slate-400 max-w-[160px] sm:max-w-[280px]">{institutionName || 'Campus Portal'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`hidden rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide sm:inline-block ${roleColor(liveRole)}`}>{roleLabel(liveRole)}</span>
            <button onClick={() => setShowCart(!showCart)} className="relative rounded-full border border-slate-800 bg-slate-900 p-2 text-slate-400 transition hover:text-white">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[9px] font-black text-slate-950">{cartCount}</span>}
            </button>
            <button onClick={onClose} className="rounded-full border border-slate-800 bg-slate-900 p-2 text-slate-400 transition hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl space-y-6 p-4 pb-24 sm:p-6">
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
                <AlertCircle className="mt-0.5 w-5 h-5 shrink-0 text-red-300" />
                <div><p className="font-bold">Error</p><p className="text-xs text-red-200/80">{error}</p></div>
              </div>
            )}

            {/* Cart Slide-over Panel */}
            {showCart && (
              <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={() => setShowCart(false)} />
            )}
            <aside className={`fixed bottom-0 right-0 top-0 z-50 w-full max-w-md border-l border-slate-800 bg-slate-950 p-5 shadow-2xl transition-transform lg:sticky lg:top-20 lg:z-0 lg:block lg:max-h-[calc(100vh-6rem)] lg:w-80 lg:translate-x-0 lg:overflow-y-auto lg:rounded-3xl lg:border ${showCart ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-black text-white">Your Cart</h3>
                <button onClick={() => setShowCart(false)} className="rounded-full p-1 text-slate-400 hover:text-white lg:hidden"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                {cart.length ? cart.map((entry) => (
                  <div key={entry.item.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="text-xs font-extrabold text-white truncate">{entry.item.name}</p><p className="text-[10px] text-slate-500">{entry.item.counter_name}</p></div>
                      <p className="shrink-0 text-xs font-black text-emerald-300">{formatINR(entry.item.price * entry.quantity)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(entry.item.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs text-slate-300">-</button>
                        <span className="text-xs font-bold text-white w-5 text-center">{entry.quantity}</span>
                        <button onClick={() => updateQuantity(entry.item.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs text-slate-300">+</button>
                      </div>
                    </div>
                  </div>
                )) : <EmptyState icon={ShoppingBag} title="Cart is empty" message="Add items from the menu to begin." />}
              </div>
              <div className="mt-5 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-300">Total</span><span className="font-black text-emerald-300">{formatINR(cartTotal)}</span></div>
                <button onClick={handlePlaceOrder} disabled={!cart.length || submittingOrder} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 py-3 text-xs font-black text-slate-950 shadow-lg disabled:cursor-not-allowed disabled:opacity-50">
                  {submittingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}Proceed to Payment
                </button>
              </div>
            </aside>

            {loading ? (
              <div className="grid min-h-[55vh] place-items-center">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-300"><Loader2 className="w-5 h-5 animate-spin text-emerald-400" />Loading live campus data...</div>
              </div>
            ) : (
              <>
                {/* ========== HOME TAB ========== */}
                {activeTab === 'home' && (
                  <div className="space-y-8">
                    {/* Hero Banner */}
                    <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/80 p-6 sm:p-10">
                      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
                      <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
                      <div className="relative z-10 space-y-5">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/70 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-300"><Zap className="w-3 h-3" />Live Campus Ordering</span>
                        <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Hey {displayName.split(' ')[0]},<br />what's for today?</h2>
                        <p className="max-w-xl text-sm leading-relaxed text-slate-300">Browse live menus, pre-order from your favorite counters, and skip the line.</p>
                        <div className="flex flex-wrap gap-3">
                          <button onClick={() => setActiveTab('menu')} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 px-6 py-3 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/30">Browse Menu<ArrowRight className="w-4 h-4" /></button>
                          <button onClick={() => setActiveTab('orders')} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/80 px-6 py-3 text-xs font-black text-slate-200 backdrop-blur-sm">Track Orders<Receipt className="w-4 h-4 text-emerald-400" /></button>
                        </div>
                      </div>
                    </section>

                    {/* Live Counters Grid */}
                    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {counters.slice(0, 4).map((c) => (
                        <div key={c.name} className="group cursor-pointer rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4 transition hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/30" onClick={() => { setSelectedCounter(c.name); setActiveTab('menu'); }}>
                          <Building2 className="w-5 h-5 text-emerald-400" />
                          <p className="mt-2 text-lg font-black text-white">{c.count}</p>
                          <p className="text-xs font-bold text-slate-400">{c.name}</p>
                          {c.avgRating > 0 && <p className="mt-1 flex items-center gap-1 text-[10px] text-amber-400"><Star className="w-3 h-3 fill-amber-400" />{c.avgRating.toFixed(1)}</p>}
                        </div>
                      ))}
                      {counters.length === 0 && <EmptyState icon={Building2} title="No counters" message="Menu items will create counters automatically." />}
                    </section>

                    {/* Food Categories */}
                    {allCategories.length > 0 && (
                      <section className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black text-white">Categories</h3>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                          {allCategories.map((cat) => {
                            const colors = ['from-emerald-600/40 to-emerald-800/40', 'from-orange-600/40 to-orange-800/40', 'from-purple-600/40 to-purple-800/40', 'from-pink-600/40 to-pink-800/40', 'from-cyan-600/40 to-cyan-800/40', 'from-amber-600/40 to-amber-800/40'];
                            const idx = allCategories.indexOf(cat) % colors.length;
                            return (
                              <button key={cat} onClick={() => { setSelectedCategory(cat); setActiveTab('menu'); }} className={`shrink-0 rounded-2xl border border-slate-700/50 bg-gradient-to-br ${colors[idx]} px-5 py-3 text-center transition hover:-translate-y-0.5 hover:shadow-lg`}>
                                <p className="text-xs font-black text-white">{cat}</p>
                                <p className="text-[10px] text-slate-400">{menuItems.filter((i) => i.category === cat).length} items</p>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {/* Featured Offers */}
                    {offerItems.length > 0 && (
                      <section className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div><h3 className="text-sm font-black text-white">Featured Offers</h3><p className="text-[10px] text-slate-400">Live discounts on campus favorites</p></div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {offerItems.map((item) => (
                            <FoodCard key={item.id} item={item} onAdd={addToCart} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Trending Meals */}
                    {trendingItems.length > 0 && (
                      <section className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div><h3 className="text-sm font-black text-white"><TrendingUp className="w-4 h-4 inline text-emerald-400 mr-1" />Trending Meals</h3><p className="text-[10px] text-slate-400">Most popular right now</p></div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {trendingItems.map((item) => <FoodCard key={item.id} item={item} onAdd={addToCart} />)}
                        </div>
                      </section>
                    )}

                    {/* Today's Specials */}
                    {todaySpecials.length > 0 && (
                      <section className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div><h3 className="text-sm font-black text-white"><Flame className="w-4 h-4 inline text-orange-400 mr-1" />Today's Specials</h3><p className="text-[10px] text-slate-400">Chef's picks for today</p></div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {todaySpecials.map((item) => <FoodCard key={item.id} item={item} onAdd={addToCart} />)}
                        </div>
                      </section>
                    )}

                    {/* Quick Reorder */}
                    {quickReorderItems.length > 0 && (
                      <section className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div><h3 className="text-sm font-black text-white"><Receipt className="w-4 h-4 inline text-cyan-400 mr-1" />Quick Reorder</h3><p className="text-[10px] text-slate-400">From your previous orders</p></div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {quickReorderItems.map((item) => <FoodCard key={item.id} item={item} onAdd={addToCart} />)}
                        </div>
                      </section>
                    )}

                    {/* Recommended for You */}
                    {personalizedItems.length > 0 && (
                      <section className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div><h3 className="text-sm font-black text-white"><Sparkles className="w-4 h-4 inline text-purple-400 mr-1" />Recommended for You</h3><p className="text-[10px] text-slate-400">Based on your taste</p></div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {personalizedItems.map((item) => <FoodCard key={item.id} item={item} onAdd={addToCart} />)}
                        </div>
                      </section>
                    )}

                    {/* Campus Announcements */}
                    <section className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                      <div className="mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-emerald-400" /><h3 className="text-sm font-black text-white">Live Announcements</h3></div>
                      {notifications.length ? (
                        <div className="space-y-3">
                          {notifications.slice(0, 5).map((n) => (
                            <div key={n.id} className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <h4 className="text-xs font-extrabold text-white">{n.title}</h4>
                                <span className="shrink-0 text-[10px] text-slate-500">{formatDateTime(n.created_at)}</span>
                              </div>
                              <p className="mt-1 text-xs leading-relaxed text-slate-400">{n.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : <EmptyState icon={Bell} title="No announcements" message="Campus updates will appear here." />}
                    </section>

                    {menuItems.length === 0 && notifications.length === 0 && counters.length === 0 && (
                      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-10 text-center">
                        <Utensils className="w-10 h-10 mx-auto text-slate-600" />
                        <h3 className="mt-4 text-lg font-black text-white">Welcome to FOODEXA!</h3>
                        <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">Your campus portal is live. Add menu items and announcements in Supabase to start ordering.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ========== MENU TAB ========== */}
                {activeTab === 'menu' && (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950 p-4 lg:flex-row lg:items-center">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-500" />
                        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search meals, counters, or categories..." className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-emerald-500" />
                      </div>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {['ALL', ...allCategories].map((c) => (
                          <button key={c} onClick={() => { setSelectedCategory(c === 'ALL' ? 'ALL' : c); setSelectedCounter('ALL'); }} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${selectedCategory === c ? 'bg-emerald-400 text-slate-950' : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'}`}>{c === 'ALL' ? 'All' : c}</button>
                        ))}
                      </div>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {['ALL', ...counters.map((c) => c.name)].map((c) => (
                          <button key={c} onClick={() => { setSelectedCounter(c); setSelectedCategory('ALL'); }} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${selectedCounter === c ? 'bg-emerald-400 text-slate-950' : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'}`}>{c === 'ALL' ? 'All Counters' : c}</button>
                        ))}
                      </div>
                    </div>
                    {filteredItems.length ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredItems.map((item) => <FoodCard key={item.id} item={item} onAdd={addToCart} />)}
                      </div>
                    ) : (
                      <EmptyState icon={Search} title="No items found" message="Try a different search or filter." />
                    )}
                  </div>
                )}

                {/* ========== ORDERS TAB ========== */}
                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-white">Your Orders</h3>
                    {activeOrders.length > 0 && (
                      <>
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Orders</h4>
                        <div className="grid gap-4">
                          {activeOrders.map((order) => (
                            <div key={order.id} className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-slate-950 p-5">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div><p className="text-xs font-mono text-emerald-300">{order.order_id}</p><h4 className="mt-1 text-lg font-black text-white">{order.counter}</h4></div>
                                <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
                              </div>
                              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl bg-slate-900/80 p-3"><Clock className="w-4 h-4 text-emerald-400" /><p className="mt-2 text-[10px] text-slate-500">Placed</p><p className="text-xs font-bold text-white">{formatDateTime(order.created_at) || 'Just now'}</p></div>
                                <div className="rounded-2xl bg-slate-900/80 p-3"><ShoppingBag className="w-4 h-4 text-emerald-400" /><p className="mt-2 text-[10px] text-slate-500">Items</p><p className="text-xs font-bold text-white">{order.items.length}</p></div>
                                <div className="rounded-2xl bg-slate-900/80 p-3">
                                  <QrCode className="w-4 h-4 text-emerald-400" /><p className="mt-2 text-[10px] text-slate-500">Pickup</p>
                                  {order.status === 'ready' ? (
                                    <button onClick={() => setQrOrder(order)} className="text-xs font-bold text-emerald-400 underline">View Code</button>
                                  ) : (
                                    <p className="text-xs font-bold text-white">{order.locker_number || 'Counter'}</p>
                                  )}
                                </div>
                              </div>
                              <div className="mt-4 space-y-1.5">
                                {order.items.map((item, i) => (
                                  <div key={`${order.id}-${i}`} className="flex justify-between text-xs text-slate-300"><span>{item.quantity} x {item.name}</span><span>{formatINR(item.price * item.quantity)}</span></div>
                                ))}
                              </div>
                              <div className="mt-4 flex justify-between border-t border-slate-800 pt-3 text-sm font-black"><span>Total</span><span className="text-emerald-300">{formatINR(order.total_amount)}</span></div>
                              <div className="mt-4">
                                <div className="flex gap-1">
                                  {['pending', 'accepted', 'preparing', 'ready', 'completed'].map((step) => {
                                    const orderIdx = ['pending', 'accepted', 'preparing', 'ready', 'completed'].indexOf(order.status);
                                    const stepIdx = ['pending', 'accepted', 'preparing', 'ready', 'completed'].indexOf(step);
                                    return <div key={step} className={`h-2 flex-1 rounded-full ${stepIdx <= orderIdx ? 'bg-emerald-400' : order.status === 'cancelled' ? 'bg-red-500/30' : 'bg-slate-700'}`} />;
                                  })}
                                </div>
                                <div className="mt-1 flex justify-between text-[9px] text-slate-500"><span>Pending</span><span>Accepted</span><span>Preparing</span><span>Ready</span><span>Done</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{pastOrders.length ? 'Order History' : 'No orders yet'}</h4>
                    {pastOrders.length > 0 && (
                      <div className="space-y-2">
                        {pastOrders.slice(0, 20).map((order) => (
                          <div key={order.id} className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-mono text-slate-400">{order.order_id}</p>
                              <p className="mt-0.5 text-xs text-slate-300 truncate">{order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}</p>
                            </div>
                            <div className="flex items-center gap-3 text-left sm:text-right">
                              <p className="text-xs font-black text-emerald-300">{formatINR(order.total_amount)}</p>
                              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
                              <span className="text-[10px] text-slate-500">{formatDate(order.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ========== PROFILE TAB ========== */}
                {activeTab === 'profile' && (
                  <div className="space-y-6 max-w-2xl mx-auto">
                    {/* Profile Header */}
                    <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
                      <div className="flex items-center gap-5">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-teal-300 to-cyan-400 text-3xl font-black text-slate-950 shadow-lg shadow-emerald-500/30">{displayName.charAt(0).toUpperCase()}</div>
                        <div className="min-w-0">
                          <h3 className="text-xl font-black text-white truncate">{displayName}</h3>
                          <p className="text-xs font-semibold text-emerald-300 truncate">{profile?.email || user?.email}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-3 py-0.5 text-[10px] font-black uppercase ${roleColor(liveRole)}`}>{roleLabel(liveRole)}</span>
                            {institutionName && <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-0.5 text-[10px] font-bold text-slate-300">{institutionName}</span>}
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Institution & Stats */}
                    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><Building2 className="w-4 h-4 text-emerald-400" /><p className="mt-2 text-[10px] font-bold uppercase text-slate-500">Institution</p><p className="mt-0.5 text-xs font-black text-white truncate">{institutionName || profile?.institution_code || 'Linked'}</p></div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><Hash className="w-4 h-4 text-emerald-400" /><p className="mt-2 text-[10px] font-bold uppercase text-slate-500">Code</p><p className="mt-0.5 text-xs font-black text-emerald-300 font-mono">{institutionCode || profile?.institution_code || '—'}</p></div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><Receipt className="w-4 h-4 text-emerald-400" /><p className="mt-2 text-[10px] font-bold uppercase text-slate-500">Orders</p><p className="mt-0.5 text-xs font-black text-white">{orders.length}</p></div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><Award className="w-4 h-4 text-emerald-400" /><p className="mt-2 text-[10px] font-bold uppercase text-slate-500">Role</p><p className="mt-0.5 text-xs font-black text-white">{roleLabel(liveRole)}</p></div>
                    </section>

                    {/* Quick Actions */}
                    <section className="grid grid-cols-2 gap-3">
                      <button onClick={handleEditProfile} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left transition hover:border-emerald-500/40 hover:bg-slate-900/80">
                        <Edit3 className="w-4 h-4 text-emerald-400" />
                        <p className="mt-2 text-xs font-black text-white">Edit Profile</p>
                        <p className="text-[10px] text-slate-500">Update personal details</p>
                      </button>
                      <button onClick={() => setActiveTab('orders')} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left transition hover:border-emerald-500/40 hover:bg-slate-900/80">
                        <Receipt className="w-4 h-4 text-emerald-400" />
                        <p className="mt-2 text-xs font-black text-white">Order History</p>
                        <p className="text-[10px] text-slate-500">View past orders</p>
                      </button>
                    </section>

                    {/* Achievements & Loyalty */}
                    <section className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left">
                        <div className="flex items-center gap-2"><Award className="w-4 h-4 text-amber-400" /><h4 className="text-xs font-black text-white">Achievements</h4></div>
                        <p className="mt-2 text-[10px] text-slate-400">Earned <span className="font-bold text-amber-300">0</span> badges</p>
                        <p className="text-[10px] text-slate-500">Complete orders to unlock</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left">
                        <div className="flex items-center gap-2"><Award className="w-4 h-4 text-emerald-400" /><h4 className="text-xs font-black text-white">Loyalty Points</h4></div>
                        <p className="mt-2 text-lg font-black text-emerald-300">0 pts</p>
                        <p className="text-[10px] text-slate-500">₹1 spent = 1 point</p>
                      </div>
                    </section>

                    {/* Settings Section */}
                    <section className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                      <h4 className="text-xs font-black text-white mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-emerald-400" />Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-2xl bg-slate-900/60 p-4">
                          <div><p className="text-xs font-bold text-white">Notifications</p><p className="text-[10px] text-slate-500">Manage push alerts</p></div>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-slate-900/60 p-4">
                          <div><p className="text-xs font-bold text-white">Payment Methods</p><p className="text-[10px] text-slate-500">Manage saved cards</p></div>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-slate-900/60 p-4">
                          <div><p className="text-xs font-bold text-white">Saved Addresses</p><p className="text-[10px] text-slate-500">Manage delivery locations</p></div>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                    </section>

                    {/* Sign Out */}
                    <button onClick={handleSignOut} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-950/20 py-4 text-sm font-black text-red-300 transition hover:bg-red-950/40 hover:border-red-500/50">
                      <LogOut className="w-4 h-4" />Sign Out
                    </button>

                    <p className="text-center text-[10px] text-slate-600">FOODEXA v2.0 | Powered by Supabase</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4" onClick={() => setEditingProfile(false)}>
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Edit Profile</h3>
              <button onClick={() => setEditingProfile(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {profileMessage && (
              <div className={`rounded-xl p-3 text-xs font-bold ${profileMessage.includes('success') ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-red-950/60 border border-red-500/40 text-red-300'}`}>{profileMessage}</div>
            )}
            <div className="space-y-3">
              <div><label className="text-xs font-semibold text-slate-300 mb-1 block">Full Name</label><input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500" /></div>
              <div><label className="text-xs font-semibold text-slate-300 mb-1 block">Phone</label><input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500" /></div>
              <div><label className="text-xs font-semibold text-slate-300 mb-1 block">Department</label><input value={profileForm.department} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-slate-300 mb-1 block">Semester</label><input value={profileForm.semester} onChange={(e) => setProfileForm({ ...profileForm, semester: e.target.value })} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500" /></div>
                <div><label className="text-xs font-semibold text-slate-300 mb-1 block">Programme</label><input value={profileForm.programme} onChange={(e) => setProfileForm({ ...profileForm, programme: e.target.value })} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500" /></div>
              </div>
              <div><label className="text-xs font-semibold text-slate-300 mb-1 block">Campus Block</label><input value={profileForm.campus_block} onChange={(e) => setProfileForm({ ...profileForm, campus_block: e.target.value })} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500" /></div>
            </div>
            <button onClick={handleSaveProfile} disabled={savingProfile} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 py-3 text-xs font-black text-slate-950 shadow-lg disabled:opacity-50">
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 z-30 shrink-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-around py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative flex flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-bold transition ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.badge && <span className="absolute right-2 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[8px] font-black text-slate-950">{tab.badge}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

const FoodCard = ({ item, onAdd }: { key?: React.Key; item: MenuItem; onAdd: (item: MenuItem) => void }) => (
  <article className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30">
    <div className="relative h-40 bg-slate-900">
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/50">
          <Utensils className="w-10 h-10 text-emerald-500/70" />
        </div>
      )}
      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        {item.popular && <span className="rounded-full border border-emerald-500/40 bg-emerald-950/80 px-2 py-0.5 text-[9px] font-bold text-emerald-300 backdrop-blur-sm">Trending</span>}
        {item.offer_label && <span className="rounded-full border border-amber-500/40 bg-amber-950/80 px-2 py-0.5 text-[9px] font-bold text-amber-300 backdrop-blur-sm">{item.offer_label}</span>}
      </div>
      {item.rating > 0 && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-slate-950/80 px-2 py-0.5 text-[9px] font-bold text-amber-300 backdrop-blur-sm">
          <Star className="w-3 h-3 fill-amber-300" />{item.rating.toFixed(1)}
        </div>
      )}
    </div>
    <div className="space-y-3 p-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-extrabold text-white line-clamp-1">{item.name}</h4>
          <div className="shrink-0 text-right">
            {item.offer_price ? (
              <><span className="text-xs font-black text-emerald-300">{formatINR(item.offer_price)}</span><span className="ml-1 text-[10px] text-slate-500 line-through">{formatINR(item.price)}</span></>
            ) : (
              <span className="text-xs font-black text-emerald-300">{formatINR(item.price)}</span>
            )}
          </div>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{item.description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-semibold text-slate-400">
        <span className="rounded-full bg-slate-900 px-2 py-1">{item.counter_name}</span>
        {item.category && <span className="rounded-full bg-slate-900 px-2 py-1">{item.category}</span>}
        {item.prep_time && <span className="rounded-full bg-slate-900 px-2 py-1 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{item.prep_time}</span>}
      </div>
      <button onClick={() => onAdd(item)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-md transition-all hover:from-emerald-300 active:scale-[0.98]">
        <ShoppingBag className="w-4 h-4" /> Add to Order
      </button>
    </div>
  </article>
);
