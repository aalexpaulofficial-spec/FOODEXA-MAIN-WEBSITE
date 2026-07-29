import { supabase } from './supabase';
import type {
  Banner,
  Announcement,
  PricingPlan,
  FaqItem,
  PlatformFeature,
  HeroStat,
  PartnerUniversity,
  MenuItem,
  MenuCategory,
  Order,
  OrderItem,
  OrderStatus,
  NotificationItem,
  CampusFeature,
  ImpactStat,
  Profile,
  InstitutionData,
  UserRole,
} from '../types';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const ORDER_STATUS_FLOW: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'completed'];

export function canTransitionTo(from: OrderStatus, to: OrderStatus): boolean {
  const fromIdx = ORDER_STATUS_FLOW.indexOf(from);
  const toIdx = ORDER_STATUS_FLOW.indexOf(to);
  if (from === 'cancelled' || from === 'completed') return false;
  if (to === 'cancelled') return true;
  return toIdx > fromIdx;
}

export function formatINR(value: number): string {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ==================== BANNERS ====================
export async function fetchBanners(): Promise<Banner[]> {
  const { data } = await supabase.from('banners').select('*').eq('is_active', true).order('order', { ascending: true });
  return (data || []) as Banner[];
}

// ==================== ANNOUNCEMENTS ====================
export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data } = await supabase.from('announcements').select('*').eq('is_published', true).order('created_at', { ascending: false });
  return (data || []) as Announcement[];
}

// ==================== PRICING PLANS ====================
export async function fetchPricingPlans(): Promise<PricingPlan[]> {
  const { data } = await supabase.from('pricing_plans').select('*').eq('is_active', true).order('order', { ascending: true });
  return ((data || []).map((p: any) => ({
    ...p,
    features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []),
  }))) as PricingPlan[];
}

// ==================== FAQ ITEMS ====================
export async function fetchFaqItems(): Promise<FaqItem[]> {
  const { data } = await supabase.from('faq_items').select('*').eq('is_published', true).order('order', { ascending: true });
  return (data || []) as FaqItem[];
}

// ==================== PLATFORM FEATURES ====================
export async function fetchPlatformFeatures(): Promise<PlatformFeature[]> {
  const { data } = await supabase.from('platform_features').select('*').eq('is_active', true).order('order', { ascending: true });
  return ((data || []).map((f: any) => ({
    ...f,
    highlights: typeof f.highlights === 'string' ? JSON.parse(f.highlights) : (f.highlights || []),
  }))) as PlatformFeature[];
}

// ==================== HERO STATS ====================
export async function fetchHeroStats(): Promise<HeroStat[]> {
  const { data } = await supabase.from('hero_stats').select('*').eq('is_active', true).order('order', { ascending: true });
  return (data || []) as HeroStat[];
}

// ==================== PARTNER UNIVERSITIES ====================
export async function fetchPartnerUniversities(): Promise<PartnerUniversity[]> {
  const { data } = await supabase.from('partner_universities').select('*').eq('is_active', true).order('order', { ascending: true });
  return (data || []) as PartnerUniversity[];
}

// ==================== MENU ITEMS ====================
export async function fetchMenuItems(params?: {
  institution_id?: string;
  counter?: string;
  category?: string;
  availableOnly?: boolean;
}): Promise<MenuItem[]> {
  let query = supabase.from('menu_items').select('*');
  if (params?.institution_id) query = query.eq('institution_id', params.institution_id);
  if (params?.counter) query = query.eq('counter', params.counter);
  if (params?.category) query = query.eq('category', params.category);
  if (params?.availableOnly !== false) query = query.eq('is_published', true);
  query = query.order('name', { ascending: true });
  const { data } = await query;
  return (data || []).map(mapMenuItem);
}

export function mapMenuItem(row: any): MenuItem {
  return {
    id: String(row.id),
    name: String(row.item_name || row.name || 'Unnamed'),
    counter: String(row.counter || row.counter_name || 'Counter'),
    counter_name: String(row.counter_name || row.counter || 'Counter'),
    counter_id: row.counter_id || null,
    price: Number(row.price || row.amount || 0),
    offer_price: row.offer_price || null,
    offer_label: row.offer_label || row.discount_label || null,
    prep_time: row.prep_time || row.prepTime || null,
    rating: Number(row.rating || row.avg_rating || 0),
    category: String(row.category || 'Menu'),
    category_id: row.category_id || null,
    image_url: row.image_url || row.image || null,
    description: String(row.description || ''),
    is_available: row.is_available !== false,
    is_published: row.is_published !== false,
    popular: Boolean(row.popular || row.is_popular || row.trending),
    nutrition: row.nutrition || row.calories || null,
    institution_id: row.institution_id || null,
  };
}

// ==================== MENU CATEGORIES ====================
export async function fetchMenuCategories(params?: { institution_id?: string }): Promise<MenuCategory[]> {
  let query = supabase.from('menu_categories').select('*').eq('is_active', true).order('order', { ascending: true });
  if (params?.institution_id) query = query.eq('institution_id', params.institution_id);
  const { data } = await query;
  return (data || []) as MenuCategory[];
}

// ==================== ORDERS ====================
export async function fetchOrders(params: { user_id?: string; institution_id?: string; status?: OrderStatus }): Promise<Order[]> {
  let query = supabase.from('orders').select('*');
  if (params.user_id) query = query.eq('user_id', params.user_id);
  if (params.institution_id) query = query.eq('institution_id', params.institution_id);
  if (params.status) query = query.eq('status', params.status);
  query = query.order('created_at', { ascending: false });
  const { data } = await query;
  return (data || []).map(mapOrder);
}

export function mapOrder(row: any): Order {
  return {
    id: String(row.id),
    user_id: String(row.user_id || ''),
    email: String(row.email || ''),
    role: ['student', 'faculty', 'guest', 'institution_admin', 'kitchen_staff', 'canteen_manager', 'super_admin'].includes(row.role) ? row.role : null,
    institution_id: row.institution_id || null,
    institution_code: row.institution_code || null,
    counter_id: row.counter_id || null,
    category_id: row.category_id || null,
    order_id: String(row.order_id || row.id),
    counter: String(row.counter || row.counter_name || 'Counter'),
    items: normalizeOrderItems(row.items),
    total_amount: Number(row.total_amount || row.total || 0),
    status: normalizeOrderStatus(row.status),
    payment_status: row.payment_status || 'pending',
    pickup_code: row.pickup_code || row.qr_code || null,
    qr_code: row.qr_code || row.qr || null,
    qr_code_data: row.qr_code_data || null,
    locker_number: row.locker_number || row.locker || null,
    created_at: row.created_at || row.inserted_at || '',
    accepted_at: row.accepted_at || null,
    preparing_at: row.preparing_at || null,
    ready_at: row.ready_at || null,
    completed_at: row.completed_at || null,
    updated_at: row.updated_at || row.created_at || '',
  };
}

function normalizeOrderStatus(status: any): OrderStatus {
  const s = String(status || 'pending').toLowerCase();
  if (['pending', 'order received'].includes(s)) return 'pending';
  if (['accepted', 'confirmed'].includes(s)) return 'accepted';
  if (['preparing', 'preparation'].includes(s)) return 'preparing';
  if (['ready', 'ready for pickup'].includes(s)) return 'ready';
  if (['completed', 'collected', 'delivered'].includes(s)) return 'completed';
  if (['cancelled', 'canceled'].includes(s)) return 'cancelled';
  return 'pending';
}

function normalizeOrderItems(items: any): OrderItem[] {
  if (!items) return [];
  if (Array.isArray(items)) return items.map((i: any) => ({
    name: String(i.item_name || i.name || 'Item'),
    quantity: Number(i.quantity || i.qty || 1),
    price: Number(i.price || i.amount || 0),
  }));
  if (typeof items === 'string') {
    try { return normalizeOrderItems(JSON.parse(items)); } catch { return []; }
  }
  return [];
}

export async function placeOrder(params: {
  user_id: string;
  email: string;
  role: UserRole;
  institution_id: string | null;
  institution_code: string | null;
  counter: string;
  items: { id: string; name: string; quantity: number; price: number }[];
  total_amount: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  payment_method?: string;
}): Promise<{ data: Order | null; error: string | null }> {
  const orderId = `FDX-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const pickupCode = `PC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const isPaid = Boolean(params.razorpay_payment_id && params.razorpay_signature);
  const payload: Record<string, any> = {
    user_id: params.user_id,
    email: params.email,
    role: params.role,
    institution_id: params.institution_id,
    institution_code: params.institution_code,
    order_id: orderId,
    counter: params.counter,
    items: params.items,
    total_amount: params.total_amount,
    status: isPaid ? 'pending' : 'pending',
    payment_status: isPaid ? 'paid' : 'pending',
    pickup_code: pickupCode,
    qr_code: `FOODEXA-${orderId}`,
    qr_code_data: JSON.stringify({ orderId, pickupCode, counter: params.counter }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (params.razorpay_order_id) payload.razorpay_order_id = params.razorpay_order_id;
  if (params.razorpay_payment_id) payload.razorpay_payment_id = params.razorpay_payment_id;
  if (params.razorpay_signature) payload.razorpay_signature = params.razorpay_signature;
  if (params.payment_method) payload.payment_method = params.payment_method;
  const { data, error } = await supabase.from('orders').insert([payload]).select().single();
  if (error) return { data: null, error: error.message };
  return { data: mapOrder(data), error: null };
}

export async function createRazorpayOrder(params: {
  amount: number;
  currency?: string;
  user_id: string;
  email?: string;
  phone?: string;
  name?: string;
  institution_id?: string | null;
  order_id: string;
  counter?: string;
}): Promise<{ success: boolean; order_id?: string; razorpay_key_id?: string; amount?: number; currency?: string; error?: string }> {
  try {
    const resp = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency || 'INR',
        receipt: `fdx_${params.order_id}`,
        user_id: params.user_id,
        email: params.email,
        phone: params.phone,
        name: params.name,
        institution_id: params.institution_id,
        order_id: params.order_id,
        counter: params.counter,
      }),
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to create payment order.' };
    }
    return { success: true, order_id: data.order_id, razorpay_key_id: data.razorpay_key_id, amount: data.amount, currency: data.currency };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error while creating payment order.' };
  }
}

export async function verifyRazorpayPayment(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  user_id: string;
  order_id: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resp = await fetch('/api/razorpay/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      return { success: false, error: data.error || 'Payment verification failed.' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error during payment verification.' };
  }
}

// ==================== NOTIFICATIONS ====================
export async function fetchNotifications(): Promise<NotificationItem[]> {
  const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
  return (data || []).map((r: any) => ({
    id: String(r.id),
    title: String(r.title || r.heading || r.subject || 'Update'),
    message: String(r.message || r.body || r.content || ''),
    created_at: r.created_at || '',
    type: String(r.type || r.category || 'announcement'),
    read: Boolean(r.read || r.is_read),
  }));
}

// ==================== CAMPUS FEATURES (For Institutions page) ====================
export async function fetchCampusFeatures(): Promise<CampusFeature[]> {
  const { data } = await supabase.from('campus_features').select('*').eq('is_active', true).order('order', { ascending: true });
  if (data && data.length > 0) {
    return (data || []).map((f: any) => ({
      ...f,
      highlights: typeof f.highlights === 'string' ? JSON.parse(f.highlights) : (f.highlights || []),
    })) as CampusFeature[];
  }
  return [];
}

// ==================== IMPACT STATS (Sustainability page) ====================
export async function fetchImpactStats(): Promise<ImpactStat[]> {
  const { data } = await supabase.from('impact_stats').select('*').eq('is_active', true).order('order', { ascending: true });
  return (data || []) as ImpactStat[];
}

// ==================== INSTITUTIONS ====================
export async function fetchInstitution(id: string): Promise<InstitutionData | null> {
  const { data } = await supabase.from('institutions').select('*').eq('id', id).single();
  if (!data) return null;
  return {
    institution_id: data.id,
    institution_name: data.name || '',
    campus: data.campus || '',
    city: data.city || '',
    state: data.state || '',
    country: data.country || '',
    institution_code: data.institution_code || '',
    logo_url: data.logo_url || null,
  };
}

// ==================== LIVESTATS (computed from DB) ====================
export async function fetchLiveStats(): Promise<{ value: string; label: string }[]> {
  try {
    const [{ count: instCount }, { count: orderCount }] = await Promise.all([
      supabase.from('institutions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
    ]);
    return [
      { value: `${(instCount || 0)}+`, label: 'Partner Campuses' },
      { value: `${(orderCount || 0)}+`, label: 'Orders Processed' },
    ];
  } catch {
    return [];
  }
}

// ==================== REALTIME SUBSCRIPTIONS ====================
export type RealtimeCallback<T> = (payload: RealtimePostgresChangesPayload<T>) => void;

type RealtimeRegistration = {
  table: string;
  filter?: string;
  callback: RealtimeCallback<any>;
};

type ManagedRealtimeSubscription = {
  channel: RealtimeChannel;
  retryTimer: ReturnType<typeof setTimeout> | null;
  active: boolean;
};

const realtimeSubscriptions = new Map<string, ManagedRealtimeSubscription>();
let realtimeSubscriptionId = 0;

function cleanupRealtimeSubscription(key: string) {
  const existing = realtimeSubscriptions.get(key);
  if (!existing) return;
  existing.active = false;
  if (existing.retryTimer) clearTimeout(existing.retryTimer);
  realtimeSubscriptions.delete(key);
  try {
    supabase.removeChannel(existing.channel);
  } catch {
  }
}

function subscribeToRealtime(key: string, registrations: RealtimeRegistration[]) {
  const subscriptionKey = `${key}:${++realtimeSubscriptionId}`;

  let managed: ManagedRealtimeSubscription | null = null;

  const connect = () => {
    if (managed && !managed.active) return;

    try {
      const channel = supabase.channel(subscriptionKey);

      registrations.forEach((registration) => {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: registration.table,
            filter: registration.filter,
          },
          (payload) => {
            try {
              registration.callback(payload);
            } catch {
            }
          }
        );
      });

      managed = { channel, retryTimer: null, active: true };
      realtimeSubscriptions.set(subscriptionKey, managed);

      channel.subscribe((status) => {
        if (!managed?.active) return;
        if (status !== 'CHANNEL_ERROR' && status !== 'TIMED_OUT' && status !== 'CLOSED') return;

        try {
          supabase.removeChannel(channel);
        } catch {
        }

        managed.retryTimer = setTimeout(() => {
          if (managed?.active && realtimeSubscriptions.get(subscriptionKey) === managed) {
            connect();
          }
        }, 5000);
      });
    } catch {
      managed = { channel: supabase.channel(`${subscriptionKey}-idle`), retryTimer: null, active: true };
      realtimeSubscriptions.set(subscriptionKey, managed);
      managed.retryTimer = setTimeout(() => {
        if (managed?.active && realtimeSubscriptions.get(subscriptionKey) === managed) {
          connect();
        }
      }, 5000);
    }
  };

  connect();

  return () => cleanupRealtimeSubscription(subscriptionKey);
}

export function subscribeOrders(
  callback: RealtimeCallback<any>,
  filter?: { user_id?: string; institution_id?: string }
) {
  const realtimeFilter = filter?.user_id ? `user_id=eq.${filter.user_id}` : filter?.institution_id ? `institution_id=eq.${filter.institution_id}` : undefined;
  const key = `orders-realtime:${realtimeFilter || 'all'}`;
  return subscribeToRealtime(key, [{ table: 'orders', filter: realtimeFilter, callback }]);
}

export function subscribeMenuItems(callback: RealtimeCallback<any>) {
  return subscribeToRealtime('menu-items-realtime', [{ table: 'menu_items', callback }]);
}

export function subscribeAnnouncements(callback: RealtimeCallback<any>) {
  return subscribeToRealtime('announcements-realtime', [
    { table: 'announcements', callback },
    { table: 'notifications', callback },
  ]);
}

export function subscribeBanners(callback: RealtimeCallback<any>) {
  return subscribeToRealtime('banners-realtime', [{ table: 'banners', callback }]);
}

export function subscribeMenuCategories(callback: RealtimeCallback<any>) {
  return subscribeToRealtime('menu-categories-realtime', [{ table: 'menu_categories', callback }]);
}
