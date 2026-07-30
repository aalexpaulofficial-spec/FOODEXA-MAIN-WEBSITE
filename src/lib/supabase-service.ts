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

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface FoodFilters {
  search?: string;
  veg?: boolean;
  nonVeg?: boolean;
  minPrice?: number;
  maxPrice?: number;
  maxPrepTime?: number;
  category?: string;
  counter?: string;
  sortBy?: 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'prep_time';
}

export interface CheckoutData {
  institutionId: string;
  institutionCode: string;
  counter: string;
  pickupTime: string;
  estimatedTime: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponCode: string;
  grandTotal: number;
  paymentMethod: 'razorpay' | 'wallet' | 'cash';
  notes: string;
}

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
  const { data } = await supabase.from('banners').select('*').eq('is_active', true).order('display_order', { ascending: true });
  return (data || []) as Banner[];
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  return [];
}

export async function fetchPricingPlans(): Promise<PricingPlan[]> {
  return [];
}

export async function fetchFaqItems(): Promise<FaqItem[]> {
  return [];
}

export async function fetchPlatformFeatures(): Promise<PlatformFeature[]> {
  return [];
}

export async function fetchHeroStats(): Promise<HeroStat[]> {
  return [];
}

export async function fetchPartnerUniversities(): Promise<PartnerUniversity[]> {
  return [];
}

// ==================== MENU ITEMS ====================
export async function fetchMenuItems(params?: {
  institution_id?: string;
  counter?: string;
  category?: string;
  availableOnly?: boolean;
  veg?: boolean;
  nonVeg?: boolean;
  popularOnly?: boolean;
  search?: string;
  sortBy?: 'name' | 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'prep_time' | 'rating';
  limit?: number;
}): Promise<MenuItem[]> {
  let query = supabase.from('menu_items').select('*');
  if (params?.institution_id) query = query.eq('institution_id', params.institution_id);
  if (params?.counter && params.counter !== 'ALL') query = query.eq('canteen_id', params.counter);
  if (params?.category && params.category !== 'ALL') query = query.eq('food_type', params.category);
  if (params?.availableOnly !== false) query = query.neq('status', 'archived');
  if (params?.popularOnly) query = query.eq('is_featured', true);
  if (params?.search) {
    const s = `%${params.search.toLowerCase()}%`;
    query = query.or(`food_name.ilike.${s},food_type.ilike.${s},description.ilike.${s}`);
  }
  
  switch (params?.sortBy) {
    case 'popular': query = query.order('ai_popularity_score', { ascending: false }).order('rating', { ascending: false }); break;
    case 'newest': query = query.order('created_at', { ascending: false }); break;
    case 'price_asc': query = query.order('price', { ascending: true }); break;
    case 'price_desc': query = query.order('price', { ascending: false }); break;
    case 'prep_time': query = query.order('prep_time', { ascending: true }); break;
    case 'rating': query = query.order('rating', { ascending: false }); break;
    default: query = query.order('food_name', { ascending: true });
  }
  
  if (params?.limit) query = query.limit(params.limit);
  
  const { data } = await query;
  return (data || []).map(mapMenuItem);
}

export function getMenuAvailability(menuItem: MenuItem): {
  isSoldOut: boolean;
  canAddToCart: boolean;
} {
  const isSoldOut = menuItem.stock_quantity !== undefined && menuItem.stock_quantity <= 0;
  const canAddToCart = menuItem.is_available && !isSoldOut;
  return { isSoldOut, canAddToCart };
}

export function mapMenuItem(row: any): MenuItem {
  // ── Field mapping: Supabase menu_items -> MenuItem ──
  // food_name -> item name
  const name = row.food_name || row.item_name || row.name || null;

  // price -> item price
  const price = Number(row.price || 0);

  // description -> description
  const description = row.description || '';

  // image_url (fallback thumbnail_url) -> image
  const imageUrl = row.image_url || row.thumbnail_url || null;

  // prep_time (fallback preparation_time) -> preparation time
  let prepTimeMinutes: number | undefined;
  let prepTimeDisplay: string | null = null;
  if (row.prep_time !== undefined && row.prep_time !== null) {
    prepTimeDisplay = String(row.prep_time);
    prepTimeMinutes = Number(row.prep_time);
  } else if (row.preparation_time !== undefined && row.preparation_time !== null) {
    prepTimeDisplay = String(row.preparation_time);
    prepTimeMinutes = Number(row.preparation_time);
  }

  // Counter & category mapping
  const counterName = row.counter_name || row.food_type || row.counter || null;
  const category = row.category || row.food_type || row.category_name || null;

  // ── Stock quantity ──
  const stockRaw = row.stock_quantity !== undefined ? row.stock_quantity
    : row.stock !== undefined ? row.stock
    : row.inventory_count !== undefined ? row.inventory_count
    : undefined;
  const stockQuantity = stockRaw !== undefined && stockRaw !== null ? Number(stockRaw) : undefined;

  // ── Strict availability logic ──
  // Available ONLY when ALL conditions are true:
  //   1. status = 'published' (or not 'archived')
  //   2. available = true (if column exists)
  //   3. availability = true (if column exists)
  //   4. is_available = true (or defaults true)
  //   5. is_archived = false
  //   6. stock > 0 (or no stock column = unlimited)

  const isArchived =
    row.is_archived === true ||
    row.status === 'archived' ||
    row.is_published === false;

  const isStatusPublished =
    row.status === 'published' || row.status === undefined || row.status === null;

  const isAvailableFlag =
    row.is_available !== undefined ? Boolean(row.is_available) : true;

  const isAvailableAlt =
    row.available !== undefined ? Boolean(row.available) : true;

  const isAvailabilityAlt =
    row.availability !== undefined ? Boolean(row.availability) : true;

  const isPublished =
    row.is_published !== undefined ? Boolean(row.is_published) : true;

  const stock = stockQuantity !== undefined ? stockQuantity : null;
  const hasStock = stock === null || stock > 0;

  const isFullyAvailable =
    !isArchived &&
    isStatusPublished &&
    isAvailableFlag &&
    isAvailableAlt &&
    isAvailabilityAlt &&
    isPublished &&
    hasStock;

  const isSoldOut = stock !== null && stock <= 0;

  return {
    id: String(row.id),
    name: name ? String(name) : 'Item',
    counter: counterName ? String(counterName) : 'Counter',
    counter_name: counterName ? String(counterName) : 'Counter',
    counter_id: row.canteen_id || row.counter_id || null,
    price,
    offer_price: row.offer_price || null,
    offer_label: row.offer_label || null,
    prep_time: prepTimeDisplay,
    rating: Number(row.rating || 0),
    category: category ? String(category) : 'Menu',
    category_id: row.category_id || null,
    image_url: imageUrl,
    description,
    is_available: isFullyAvailable,
    is_published: isPublished && !isArchived,
    popular: Boolean(row.is_featured || row.is_today_special || (row.ai_popularity_score > 0)),
    nutrition: row.calories ? JSON.stringify({ calories: row.calories, protein: row.protein, carbs: row.carbs || row.carbohydrates, fat: row.fat }) : null,
    institution_id: row.institution_id || null,
    is_veg: row.is_veg !== undefined ? row.is_veg : null,
    prep_time_minutes: prepTimeMinutes,
    calories: row.calories !== undefined ? Number(row.calories) : undefined,
    protein: row.protein !== undefined ? Number(row.protein) : undefined,
    carbs: row.carbs !== undefined ? Number(row.carbs) : (row.carbohydrates !== undefined ? Number(row.carbohydrates) : undefined),
    fat: row.fat !== undefined ? Number(row.fat) : undefined,
    is_healthy: row.is_healthy !== undefined ? Boolean(row.is_healthy) : (row.calories !== undefined && Number(row.calories) < 300),
    trending: row.is_featured || false,
    today_orders: 0,
    stock_quantity: stockQuantity,
    ai_popularity_score: row.ai_popularity_score !== undefined ? Number(row.ai_popularity_score) : row.rating || 0,
    tags: [],
    created_at: row.created_at || '',
  };
}

// ==================== MENU CATEGORIES ====================
export async function fetchMenuCategories(params?: { institution_id?: string }): Promise<MenuCategory[]> {
  let query = supabase.from('menu_categories').select('*').order('name', { ascending: true });
  if (params?.institution_id) query = query.eq('institution_id', params.institution_id);
  const { data } = await query;
  return (data || []).map((r: any) => ({ id: r.id, name: r.name, institution_id: r.institution_id, is_active: true, order: 0 })) as MenuCategory[];
}

// ==================== ORDERS ====================
export async function fetchOrders(params: { user_id?: string; institution_id?: string; status?: OrderStatus }): Promise<Order[]> {
  let query = supabase.from('orders').select('*');
  if (params.user_id) query = query.eq('student_id', params.user_id);
  if (params.institution_id) query = query.eq('institution_id', params.institution_id);
  if (params.status) query = query.eq('status', params.status);
  query = query.order('created_at', { ascending: false });
  const { data } = await query;
  return (data || []).map(mapOrder);
}

export function mapOrder(row: any): Order {
  return {
    id: String(row.id),
    student_id: String(row.student_id || ''),
    user_id: String(row.student_id || ''),
    email: String(row.email || ''),
    customer_name: row.customer_name || null,
    phone: row.phone || null,
    role: ['student', 'faculty', 'guest', 'institution_admin', 'kitchen_staff', 'canteen_manager', 'super_admin'].includes(row.role) ? row.role : null,
    institution_id: row.institution_id || null,
    canteen_id: row.canteen_id || null,
    counter_id: null,
    category_id: null,
    order_id: String(row.id),
    order_number: row.order_number || undefined,
    items: normalizeOrderItems(row.items),
    total_amount: Number(row.total_amount || 0),
    transaction_amount: Number(row.transaction_amount || row.total_amount || 0),
    status: normalizeOrderStatus(row.status),
    order_status: row.order_status || row.status || 'pending',
    payment_status: row.payment_status || 'pending',
    payment_method: row.payment_method || undefined,
    kitchen_status: row.kitchen_status || undefined,
    counter_status: row.counter_status || undefined,
    pickup_code: row.pickup_code || null,
    pickup_token: row.pickup_token || undefined,
    qr_pickup_code: row.qr_pickup_code || null,
    qr_code: row.qr_code || null,
    qr_code_data: null,
    pickup_pin: null,
    locker_number: null,
    notes: row.notes || null,
    created_at: row.created_at || '',
    accepted_at: row.accepted_at || null,
    preparing_at: row.preparing_at || null,
    ready_at: row.ready_at || null,
    completed_at: row.completed_at || null,
    paid_at: row.paid_at || null,
    updated_at: row.updated_at || row.created_at || '',
    estimated_ready_at: row.estimated_ready_at || null,
    token_number: row.token_number || row.pickup_token || undefined,
    kitchen_queue_status: row.kitchen_status || undefined,
    razorpay_order_id: row.razorpay_order_id || null,
    razorpay_payment_id: row.razorpay_payment_id || null,
    razorpay_signature: row.razorpay_signature || null,
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
  customer_name?: string;
  phone?: string;
  canteen_id?: string;
  notes?: string;
  institution_id: string | null;
  items: { id: string; name: string; quantity: number; price: number; subtotal?: number }[];
  itemsFull: { id: string; name: string; quantity: number; price: number; subtotal?: number }[];
  total_amount: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  payment_method?: string;
}): Promise<{ data: Order | null; error: string | null }> {
  const now = new Date();
  const nowISO = now.toISOString();
  const tokenNumber = `TKN-${Math.floor(1000 + Math.random() * 9000)}`;
  const pickupCode = `PC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const isPaid = Boolean(params.razorpay_payment_id && params.razorpay_signature);
  const customerName = params.customer_name || params.email?.split('@')[0] || 'Customer';
  const phone = params.phone || '0000000000';

  const payload: Record<string, any> = {
    student_id: params.user_id,
    email: params.email,
    customer_name: customerName,
    phone: phone,
    institution_id: params.institution_id,
    canteen_id: params.canteen_id || null,
    total_amount: params.total_amount,
    transaction_amount: params.total_amount,
    status: isPaid ? 'accepted' : 'pending',
    order_status: isPaid ? 'Accepted' : 'Pending Payment',
    payment_status: isPaid ? 'paid' : 'pending',
    payment_method: isPaid ? (params.payment_method === 'cash' ? 'cash' : 'razorpay') : 'razorpay',
    pickup_token: tokenNumber,
    pickup_code: pickupCode,
    token_number: tokenNumber,
    notes: params.notes || null,
    kitchen_status: 'Pending',
    counter_status: 'Incoming',
    estimated_ready_at: new Date(now.getTime() + 15 * 60000).toISOString(),
    created_at: nowISO,
    updated_at: nowISO,
  };

  if (isPaid) {
    payload.paid_at = nowISO;
    payload.accepted_at = nowISO;
  }

  if (params.razorpay_order_id) payload.razorpay_order_id = params.razorpay_order_id;
  if (params.razorpay_payment_id) payload.razorpay_payment_id = params.razorpay_payment_id;
  if (params.razorpay_signature) payload.razorpay_signature = params.razorpay_signature;

  const { data: orderData, error: orderError } = await supabase.from('orders').insert([payload]).select().single();
  if (orderError || !orderData) {
    return { data: null, error: orderError?.message || 'Failed to create order.' };
  }

  const orderItemsPayload = params.itemsFull.map((item) => ({
    order_id: orderData.id,
    menu_item_id: item.id,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal || (item.price * item.quantity),
  }));
  const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
  if (itemsError) {
    console.error('[Supabase] Failed to create order_items:', itemsError);
  }

  return { data: mapOrder(orderData), error: null };
}

export async function updateOrderAfterPayment(params: {
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  payment_method?: string;
}): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('orders').update({
    payment_status: 'paid',
    status: 'accepted',
    order_status: 'Accepted',
    payment_method: params.payment_method === 'cash' ? 'cash' : 'razorpay',
    razorpay_order_id: params.razorpay_order_id,
    razorpay_payment_id: params.razorpay_payment_id,
    razorpay_signature: params.razorpay_signature,
    paid_at: now,
    accepted_at: now,
    updated_at: now,
    kitchen_status: 'Pending',
    counter_status: 'Incoming',
    estimated_ready_at: new Date(Date.now() + 15 * 60000).toISOString(),
  }).eq('id', params.order_id);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function updateOrderPaymentStatus(params: {
  order_id: string;
  payment_status?: string;
  status?: string;
  order_status?: string;
}): Promise<void> {
  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  if (params.payment_status) update.payment_status = params.payment_status;
  if (params.status) update.status = params.status;
  if (params.order_status) update.order_status = params.order_status;
  await supabase.from('orders').update(update).eq('id', params.order_id);
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
  items?: any[];
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
        items: params.items,
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

// ==================== USER CARTS ====================
export async function fetchUserCart(user_id: string): Promise<{ item: MenuItem; quantity: number }[]> {
  try {
    const { data, error } = await supabase.from('user_carts').select('menu_item_id, quantity').eq('user_id', user_id);
    if (error || !data || data.length === 0) return [];
    const menuItemIds = data.map((r: any) => r.menu_item_id);
    const { data: menuItems } = await supabase.from('menu_items').select('*').in('id', menuItemIds);
    const menuMap = new Map((menuItems || []).map((m: any) => [m.id, mapMenuItem(m)]));
    return data.map((r: any) => ({ item: menuMap.get(r.menu_item_id) || null, quantity: r.quantity })).filter((x: any) => x.item);
  } catch (err) {
    return [];
  }
}

export async function saveUserCart(user_id: string, cartItems: any[]): Promise<void> {
  try {
    await supabase.from('user_carts').delete().eq('user_id', user_id);
    if (cartItems.length > 0) {
      const rows = cartItems.map((ci) => ({
        user_id,
        menu_item_id: ci.menu_item_id || ci.item?.id,
        quantity: ci.quantity,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('user_carts').insert(rows);
    }
  } catch (err) {
    // Ignore error, cart save is best effort
  }
}

// ==================== NOTIFICATIONS ====================
export async function fetchNotifications(): Promise<NotificationItem[]> {
  const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
  return (data || []).map((r: any) => ({
    id: String(r.id),
    title: String(r.title || 'Update'),
    message: String(r.message || ''),
    created_at: r.created_at || '',
    type: String(r.type || 'announcement'),
    read: Boolean(r.is_read),
  }));
}

// ==================== CAMPUS FEATURES (For Institutions page) ====================
export async function fetchCampusFeatures(): Promise<CampusFeature[]> {
  return [];
}

// ==================== IMPACT STATS (Sustainability page) ====================
export async function fetchImpactStats(): Promise<ImpactStat[]> {
  return [];
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
  const realtimeFilter = filter?.user_id ? `student_id=eq.${filter.user_id}` : filter?.institution_id ? `institution_id=eq.${filter.institution_id}` : undefined;
  const key = `orders-realtime:${realtimeFilter || 'all'}`;
  return subscribeToRealtime(key, [{ table: 'orders', filter: realtimeFilter, callback }]);
}

export function subscribeMenuItems(callback: RealtimeCallback<any>, filter?: { institution_id?: string }) {
  const realtimeFilter = filter?.institution_id ? `institution_id=eq.${filter.institution_id}` : undefined;
  const key = `menu-items-realtime:${realtimeFilter || 'all'}`;
  return subscribeToRealtime(key, [{ table: 'menu_items', filter: realtimeFilter, callback }]);
}

export function subscribeAnnouncements(callback: RealtimeCallback<any>) {
  return subscribeToRealtime('notifications-realtime', [
    { table: 'notifications', callback },
  ]);
}

export function subscribeBanners(callback: RealtimeCallback<any>) {
  return subscribeToRealtime('banners-realtime', [{ table: 'banners', callback }]);
}

export function subscribeMenuCategories(callback: RealtimeCallback<any>) {
  return subscribeToRealtime('menu-categories-realtime', [{ table: 'menu_categories', callback }]);
}

export function subscribeHomepageSections(callback: RealtimeCallback<any>) {
  return subscribeToRealtime('homepage-sections-realtime', [{ table: 'homepage_sections', callback }]);
}

export function subscribeCounters(callback: RealtimeCallback<any>) {
  return subscribeToRealtime('counters-realtime', [{ table: 'counters', callback }]);
}

// ==================== HOMEPAGE SECTIONS ====================
export async function fetchHomepageSections(institutionId?: string): Promise<any[]> {
  let query = supabase.from('homepage_sections').select('*').eq('is_active', true).order('display_order', { ascending: true });
  if (institutionId) query = query.eq('institution_id', institutionId);
  const { data } = await query;
  return data || [];
}

// ==================== COUNTERS ====================
export async function fetchCounters(institutionId?: string): Promise<any[]> {
  let query = supabase.from('counters').select('*');
  if (institutionId) query = query.eq('institution_id', institutionId);
  const { data } = await query;
  return (data || []).map((r: any) => ({ id: r.id, name: r.name, code: r.code, location: r.location, status: r.status }));
}

// ==================== SEARCH & FILTER ====================
export async function searchMenuItems(query: string, institutionId?: string): Promise<MenuItem[]> {
  let q = supabase.from('menu_items').select('*').neq('status', 'archived');
  if (institutionId) q = q.eq('institution_id', institutionId);
  
  const searchTerm = `%${query.toLowerCase()}%`;
  q = q.or(`food_name.ilike.${searchTerm},food_type.ilike.${searchTerm},description.ilike.${searchTerm}`);
  
  const { data } = await q.order('food_name', { ascending: true }).limit(50);
  return (data || []).map(mapMenuItem);
}

export async function filterMenuItems(filters: FoodFilters, institutionId?: string): Promise<MenuItem[]> {
  let query = supabase.from('menu_items').select('*').neq('status', 'archived');
  if (institutionId) query = query.eq('institution_id', institutionId);
  
  if (filters.search) {
    const searchTerm = `%${filters.search.toLowerCase()}%`;
    query = query.or(`food_name.ilike.${searchTerm},food_type.ilike.${searchTerm},description.ilike.${searchTerm}`);
  }
  if (filters.maxPrepTime !== undefined) {
    query = query.lte('prep_time', filters.maxPrepTime);
  }
  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }
  if (filters.category && filters.category !== 'ALL') {
    query = query.eq('food_type', filters.category);
  }
  if (filters.counter && filters.counter !== 'ALL') {
    query = query.eq('canteen_id', filters.counter);
  }
  
  switch (filters.sortBy) {
    case 'popular':
      query = query.order('ai_popularity_score', { ascending: false }).order('rating', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'prep_time':
      query = query.order('prep_time', { ascending: true });
      break;
    default:
      query = query.order('food_name', { ascending: true });
  }
  
  const { data } = await query.limit(100);
  return (data || []).map(mapMenuItem);
}

// ==================== CART CALCULATIONS ====================
export function calculateCartTotals(items: CartItem[], couponDiscount: number = 0): {
  subtotal: number;
  discount: number;
  convenienceFee: number;
  grandTotal: number;
} {
  const subtotal = items.reduce((sum, item) => sum + (item.item.offer_price || item.item.price) * item.quantity, 0);
  const discount = Math.min(couponDiscount, subtotal);
  const convenienceFee = 0;
  const grandTotal = Math.round((subtotal - discount + convenienceFee) * 100) / 100;
  return { subtotal, discount, convenienceFee, grandTotal };
}

// ==================== COUPONS ====================
export async function validateCoupon(code: string, institutionId?: string, userId?: string): Promise<{ valid: boolean; discount: number; type: 'percentage' | 'fixed'; error?: string }> {
  return { valid: false, discount: 0, type: 'fixed', error: 'Coupons are not available yet' };
}

export async function applyCouponUsage(couponCode: string, userId: string, orderId: string): Promise<void> {
  // Coupons table not available yet
}

// ==================== FAVORITES ====================
export async function fetchUserFavorites(userId: string): Promise<string[]> {
  try {
    const { data } = await supabase.from('user_favorites').select('menu_item_id').eq('user_id', userId);
    return (data || []).map((d: any) => String(d.menu_item_id));
  } catch {
    return [];
  }
}

export async function toggleFavorite(userId: string, menuItemId: string): Promise<boolean> {
  try {
    const { data: existing } = await supabase.from('user_favorites').select('id').eq('user_id', userId).eq('menu_item_id', menuItemId).maybeSingle();
    if (existing) {
      await supabase.from('user_favorites').delete().eq('id', existing.id);
      return false; // removed
    } else {
      await supabase.from('user_favorites').insert({ user_id: userId, menu_item_id: menuItemId });
      return true; // added
    }
  } catch (err) {
    console.error('Toggle favorite failed:', err);
    return false;
  }
}

// ==================== NUTRITION & AI ====================
export async function fetchNutritionInfo(menuItemId: string): Promise<any> {
  try {
    const { data } = await supabase.from('menu_items').select('calories, protein, carbohydrates, carbs, fat, fiber, sugar, sodium, serving_size').eq('id', menuItemId).maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}

export async function fetchAIRecommendations(userId: string, institutionId: string, type: 'healthy' | 'trending' | 'personalized' | 'popular_today' | 'fast_pickup' | 'offers'): Promise<MenuItem[]> {
  try {
    let query = supabase.from('menu_items').select('*').eq('institution_id', institutionId).neq('status', 'archived').eq('is_available', true);
    
    switch (type) {
      case 'healthy':
        query = query.order('rating', { ascending: false });
        break;
      case 'trending':
        query = query.eq('is_featured', true).order('rating', { ascending: false });
        break;
      case 'popular_today':
        query = query.order('ai_popularity_score', { ascending: false });
        break;
      case 'fast_pickup':
        query = query.lte('prep_time', 15).order('prep_time', { ascending: true });
        break;
      case 'offers':
        query = query.not('offer_price', 'is', null).order('offer_price', { ascending: true });
        break;
      case 'personalized':
      default:
        query = query.order('rating', { ascending: false });
        break;
    }
    
    const { data } = await query.limit(10);
    return (data || []).map(mapMenuItem);
  } catch {
    return [];
  }
}

// ==================== WALLET ====================
export async function fetchWalletBalance(userId: string): Promise<number> {
  return 0;
}

export async function deductWalletBalance(userId: string, amount: number, orderId: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Wallet not available yet' };
}

// ==================== ORDER TRACKING ====================
export function getOrderProgress(status: OrderStatus): { step: number; total: number; label: string; completed: boolean }[] {
  const steps = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready', label: 'Ready for Pickup' },
    { key: 'completed', label: 'Completed' },
  ];
  
  const currentIndex = steps.findIndex(s => s.key === status);
  return steps.map((step, index) => ({
    step: index + 1,
    total: steps.length,
    label: step.label,
    completed: index <= currentIndex && status !== 'cancelled',
  }));
}

export function getEstimatedTimeRemaining(order: Order): number {
  if (order.status === 'completed' || order.status === 'cancelled') return 0;
  if (!order.ready_at) return 0;
  
  const readyTime = new Date(order.ready_at).getTime();
  const now = Date.now();
  return Math.max(0, Math.round((readyTime - now) / 1000 / 60)); // minutes
}

// ==================== RECEIPT / INVOICE ====================
export function generateReceipt(order: Order): string {
  const lines = [
    'FOODEXA CAMPUS FOOD ORDER',
    '========================',
    `Order ID: ${order.order_id}`,
    `Date: ${formatDateTime(order.created_at)}`,
    `Status: ${order.status.toUpperCase()}`,
    `Payment: ${order.payment_status.toUpperCase()}`,
    '',
    'ITEMS:',
    '------',
  ];
  
  order.items.forEach((item, idx) => {
    lines.push(`${idx + 1}. ${item.name} x${item.quantity} - ${formatINR(item.price * item.quantity)}`);
  });
  
  lines.push('', `Total: ${formatINR(order.total_amount)}`, '');
  
  if (order.pickup_code) lines.push(`Pickup Code: ${order.pickup_code}`);
  if (order.canteen_id) lines.push(`Counter: ${order.canteen_id}`);
  
  lines.push('', 'Thank you for ordering with FOODEXA!');
  return lines.join('\n');
}
