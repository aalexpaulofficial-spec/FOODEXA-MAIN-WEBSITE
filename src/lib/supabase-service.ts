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
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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
    name: String(row.name || row.item_name || 'Unnamed'),
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
    role: row.role === 'student' || row.role === 'faculty' || row.role === 'guest' ? row.role : null,
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
    name: String(i.name || i.item_name || 'Item'),
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
}): Promise<{ data: Order | null; error: string | null }> {
  const orderId = `FDX-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const pickupCode = `PC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const payload = {
    user_id: params.user_id,
    email: params.email,
    role: params.role,
    institution_id: params.institution_id,
    institution_code: params.institution_code,
    order_id: orderId,
    counter: params.counter,
    items: params.items,
    total_amount: params.total_amount,
    status: 'pending',
    payment_status: 'pending',
    pickup_code: pickupCode,
    qr_code: `FOODEXA-${orderId}`,
    qr_code_data: JSON.stringify({ orderId, pickupCode, counter: params.counter }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('orders').insert([payload]).select().single();
  if (error) return { data: null, error: error.message };
  return { data: mapOrder(data), error: null };
}

// ==================== NOTIFICATIONS ====================
export async function fetchNotifications(): Promise<NotificationItem[]> {
  const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
  return (data || []).map((r: any) => ({
    id: String(r.id),
    title: String(r.title || r.heading || 'Update'),
    message: String(r.message || r.body || ''),
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
    id: data.id,
    name: data.name || '',
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
      { value: '4.2 Mins', label: 'Avg Express Pickup' },
      { value: '99.98%', label: 'Uptime Reliability' },
    ];
  } catch {
    return [];
  }
}

// ==================== REALTIME SUBSCRIPTIONS ====================
export type RealtimeCallback<T> = (payload: RealtimePostgresChangesPayload<T>) => void;

export function subscribeOrders(
  callback: RealtimeCallback<any>,
  filter?: { user_id?: string; institution_id?: string }
) {
  const channel = supabase.channel('orders-realtime');
  let subscription: any = channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'orders',
      filter: filter?.user_id ? `user_id=eq.${filter.user_id}` : filter?.institution_id ? `institution_id=eq.${filter.institution_id}` : undefined,
    },
    callback
  );
  channel.subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeMenuItems(callback: RealtimeCallback<any>) {
  const channel = supabase.channel('menu-items-realtime');
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, callback);
  channel.subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeAnnouncements(callback: RealtimeCallback<any>) {
  const channel = supabase.channel('announcements-realtime');
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, callback);
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, callback);
  channel.subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeBanners(callback: RealtimeCallback<any>) {
  const channel = supabase.channel('banners-realtime');
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, callback);
  channel.subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeMenuCategories(callback: RealtimeCallback<any>) {
  const channel = supabase.channel('menu-categories-realtime');
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories' }, callback);
  channel.subscribe();
  return () => { supabase.removeChannel(channel); };
}