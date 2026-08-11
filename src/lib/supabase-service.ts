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
  Canteen,
  UserAddress,
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

export function getItemAvailability(item: MenuItem): {
  isSoldOut: boolean;
  canAddToCart: boolean;
} {
  // Only block if item is EXPLICITLY archived OR explicitly marked as unavailable
  // Default: always allow adding to cart
  const explicitlyArchived = item.is_archived === true;
  const explicitlyUnavailable = item.is_available === false;

  const canAddToCart = !explicitlyArchived && !explicitlyUnavailable;
  return {
    isSoldOut: !canAddToCart,
    canAddToCart,
  };
}

export function mapMenuItem(row: any): MenuItem {
  // ── Field mapping: Supabase menu_items -> MenuItem ──
  // food_name -> item name
  const name = row.food_name || row.item_name || row.name || null;

  // price -> item price
  const price = Number(row.price || 0);

  // description -> description
  const description = row.description || '';

  // image_url (fallback thumbnail_url) -> image — strip blob: URLs since they're cross-origin
  const rawImageUrl = row.image_url || row.thumbnail_url || null;
  const imageUrl = rawImageUrl && rawImageUrl.startsWith('blob:') ? null : rawImageUrl;

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

  // ── Stock: live database field is public.menu_items.stock ──
  const stock = Number(row.stock ?? 0);

  // ── Live availability fields from public.menu_items ──
  const status = row.status || 'published';
  const available = row.available !== undefined ? Boolean(row.available) : true;
  const availability = row.availability !== undefined ? Boolean(row.availability) : true;
  const isAvailable = row.is_available !== undefined ? Boolean(row.is_available) : true;
  const isArchived = row.is_archived !== undefined ? Boolean(row.is_archived) : false;

  const isPublished =
    row.is_published !== undefined ? Boolean(row.is_published) : true;

  return {
    id: String(row.id),
    name: name ? String(name) : 'Item',
    food_name: row.food_name || null,
    counter: counterName ? String(counterName) : 'Counter',
    counter_name: counterName ? String(counterName) : 'Counter',
    counter_id: row.canteen_id || row.counter_id || null,
    canteen_id: row.canteen_id || null,
    price,
    offer_price: row.offer_price || null,
    offer_label: row.offer_label || null,
    prep_time: prepTimeDisplay,
    rating: Number(row.rating || 0),
    category: category ? String(category) : 'Menu',
    category_id: row.category_id || null,
    image_url: imageUrl,
    description,
    is_available: isAvailable,
    is_published: isPublished && !isArchived,
    status,
    available,
    availability,
    is_archived: isArchived,
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
    stock,
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
const SELECT_ORDER_WITH_ITEMS = '*, order_items(id, order_id, menu_item_id, quantity, price, menu_items(id, food_name, food_type, category_name, image_url, is_veg, price))';

let userAddressesSupported: boolean | null = null;

function isMissingSchemaError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return ['schema cache', 'could not find the table', 'does not exist', 'not found'].some((text) => message.includes(text));
}

function createOrderItemsPayload(orderId: string, items: { id: string; name?: string; variant?: string | null; quantity: number; price: number; subtotal?: number }[]) {
  return items.map((item) => ({
    order_id: orderId,
    menu_item_id: item.id,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal ?? (item.price * item.quantity),
  }));
}

export async function fetchOrders(params: { user_id?: string; institution_id?: string; status?: OrderStatus }): Promise<Order[]> {
  let query = supabase.from('orders').select(SELECT_ORDER_WITH_ITEMS);
  if (params.user_id) query = query.eq('student_id', params.user_id);
  if (params.institution_id) query = query.eq('institution_id', params.institution_id);
  if (params.status) query = query.eq('status', params.status);
  query = query.order('created_at', { ascending: false });
  const { data } = await query;
  return (data || []).map(mapOrder);
}

function resolveOrderItems(row: any): OrderItem[] {
  const joinedItems = row.order_items;
  if (Array.isArray(joinedItems) && joinedItems.length > 0) {
    return joinedItems.map((oi: any) => {
      const mi = oi.menu_items;
      return {
        id: String(oi.id || ''),
        order_id: String(oi.order_id || ''),
        menu_item_id: String(oi.menu_item_id || ''),
        name: String(mi?.food_name || 'Item'),
        variant: String(mi?.category_name || mi?.food_type || ''),
        quantity: Number(oi.quantity || 1),
        price: Number(oi.price || 0),
        image_url: mi?.image_url || null,
        is_veg: mi?.is_veg !== undefined ? mi.is_veg : null,
      };
    });
  }
  return normalizeOrderItems(row.items);
}

export function mapOrder(row: any): Order {
  return {
    id: String(row.id),
    student_id: String(row.student_id || row.user_id || ''),
    user_id: String(row.student_id || row.user_id || ''),
    email: String(row.email || ''),
    customer_name: row.customer_name || null,
    phone: row.phone || null,
    role: ['student', 'faculty', 'guest', 'institution_admin', 'kitchen_staff', 'canteen_manager', 'super_admin'].includes(row.role) ? row.role : null,
    institution_id: row.institution_id || null,
    canteen_id: row.canteen_id || null,
    counter_id: row.counter_id || null,
    category_id: row.category_id || null,
    order_id: row.order_number ? `#FX-${String(row.order_number).padStart(4, '0')}` : `#FX-${String(row.id).slice(-4).toUpperCase()}`,
    order_number: row.order_number || undefined,
    counter: row.counter_name || row.counter || 'Campus Counter',
    items: resolveOrderItems(row),
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
    qr_code_data: row.qr_code_data || null,
    pickup_pin: row.pickup_pin || null,
    locker_number: row.locker_number || null,
    notes: row.notes || null,
    created_at: row.created_at || '',
    accepted_at: row.accepted_at || null,
    preparing_at: row.preparing_at || null,
    ready_at: row.ready_at || null,
    estimated_ready_at: row.estimated_ready_at || null,
    completed_at: row.completed_at || null,
    paid_at: row.paid_at || null,
    updated_at: row.updated_at || row.created_at || '',
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
    variant: String(i.food_type || i.category || i.variant || i.counter_name || ''),
    quantity: Number(i.quantity || i.qty || 1),
    price: Number(i.price || i.amount || 0),
    image_url: i.image_url || null,
    is_veg: i.is_veg !== undefined ? i.is_veg : null,
  }));
  if (typeof items === 'string') {
    try { return normalizeOrderItems(JSON.parse(items)); } catch { return []; }
  }
  return [];
}

export async function createOrderAfterPayment(params: {
  user_id: string;
  email: string;
  role: UserRole;
  customer_name?: string;
  phone?: string;
  canteen_id?: string;
  notes?: string;
  institution_id: string | null;
  items: { id: string; name: string; variant?: string | null; quantity: number; price: number; subtotal?: number }[];
  itemsFull: { id: string; name: string; variant?: string | null; quantity: number; price: number; subtotal?: number; image_url?: string; is_veg?: boolean }[];
  total_amount: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  payment_method?: string;
  estimated_prep_time_minutes?: number;
}): Promise<{ data: Order | null; error: string | null }> {
  const now = new Date();
  const nowISO = now.toISOString();
  const dateStr = nowISO.slice(0, 10).replace(/-/g, '');

  // Use timestamp-based unique ID to avoid race conditions on order count
  const timestampSeq = Date.now().toString(36).toUpperCase().slice(-6);
  const seqPadded = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');

  const tokenNumber = `TKN-${seqPadded}`;
  const pickupCode = `PICKUP-${seqPadded}`;
  const qrPickupCode = `QR-FDX-${dateStr}-${seqPadded}`;

  const customerName = params.customer_name || params.email?.split('@')[0] || 'Customer';
  const phone = params.phone || '0000000000';
  const prepTimeMinutes = params.estimated_prep_time_minutes || 15;

  const actualInstitutionId = params.institution_id;
  let actualCanteenId = params.canteen_id;

  if (!actualInstitutionId) {
    return { data: null, error: 'You must join an institution before placing an order.' };
  }

  // Resolve canteen_id: try from first item's menu_item, then fall back to first active canteen for the institution
  if (params.itemsFull && params.itemsFull.length > 0) {
    const firstItemId = params.itemsFull[0].id;
    const { data: itemData } = await supabase
      .from('menu_items')
      .select('canteen_id')
      .eq('id', firstItemId)
      .single();
    if (itemData?.canteen_id) actualCanteenId = itemData.canteen_id;
  }

  if (!actualCanteenId) {
    const { data: fallbackCanteen } = await supabase
      .from('canteens')
      .select('id')
      .eq('institution_id', actualInstitutionId)
      .eq('status', 'active')
      .order('name', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (fallbackCanteen?.id) actualCanteenId = fallbackCanteen.id;
  }

  if (!actualCanteenId) {
    return { data: null, error: 'No active canteen found for your institution. Please contact support.' };
  }

  const existingOrderQuery = await supabase
    .from('orders')
    .select(SELECT_ORDER_WITH_ITEMS)
    .or(`razorpay_payment_id.eq.${params.razorpay_payment_id},razorpay_order_id.eq.${params.razorpay_order_id}`)
    .maybeSingle();

  if (existingOrderQuery.data) {
    return { data: mapOrder(existingOrderQuery.data), error: null };
  }

  const orderPayload: Record<string, any> = {
    student_id: params.user_id || null,
    email: params.email,
    customer_name: customerName,
    phone,
    institution_id: actualInstitutionId,
    canteen_id: actualCanteenId,
    total_amount: params.total_amount,
    transaction_amount: params.total_amount,
    status: 'accepted',
    order_status: 'Accepted',
    payment_status: 'paid',
    payment_method: params.payment_method === 'cash' ? 'cash' : 'razorpay',
    order_number: Date.now(),
    pickup_token: tokenNumber,
    pickup_code: pickupCode,
    qr_pickup_code: qrPickupCode,
    token_number: tokenNumber,
    notes: params.notes || null,
    kitchen_status: 'Pending',
    counter_status: 'Incoming',
    estimated_ready_at: new Date(now.getTime() + prepTimeMinutes * 60000).toISOString(),
    created_at: nowISO,
    updated_at: nowISO,
    paid_at: nowISO,
    accepted_at: nowISO,
    razorpay_order_id: params.razorpay_order_id,
    razorpay_payment_id: params.razorpay_payment_id,
    razorpay_signature: params.razorpay_signature,
  };

  const { data: orderData, error: orderError } = await supabase.from('orders').insert([orderPayload]).select('*').single();
  if (orderError || !orderData) {
    console.error('[Supabase] createOrderAfterPayment order insert failed:', orderError?.message, orderError?.code, orderError?.details);
    return { data: null, error: `Order creation failed: ${orderError?.message || 'Unknown error'}` };
  }

  // Insert order_items
  const orderItemsPayload = createOrderItemsPayload(orderData.id, params.itemsFull);
  const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
  if (itemsError) {
    console.error('[Supabase] Failed to create order_items:', itemsError);
  }

  // Insert payments record (best-effort)
  try {
    await supabase.from('payments').insert([{
      order_id: orderData.id,
      razorpay_order_id: params.razorpay_order_id,
      razorpay_payment_id: params.razorpay_payment_id,
      razorpay_signature: params.razorpay_signature,
      amount: params.total_amount,
      currency: 'INR',
      payment_status: 'paid',
      payment_method: 'razorpay',
      created_at: nowISO,
      updated_at: nowISO,
    }]);
  } catch (_) { /* best-effort */ }

  // Insert notifications (best-effort)
  try {
    const notifs: Record<string, any>[] = [];
    notifs.push({ type: 'order_confirmed', title: 'Order Confirmed!', message: 'Your order has been confirmed and is being prepared.', user_id: params.user_id, created_at: nowISO, read: false, order_id: orderData.id });
    if (actualInstitutionId) {
      notifs.push({ type: 'new_order', title: 'New Order Received', message: 'A new order has been placed and payment confirmed.', institution_id: actualInstitutionId, created_at: nowISO, read: false, order_id: orderData.id });
    }
    await supabase.from('notifications').insert(notifs);
  } catch (_) { /* best-effort */ }

  // Re-fetch with joined items to guarantee consistency
  const { data: finalOrder } = await supabase.from('orders').select(SELECT_ORDER_WITH_ITEMS).eq('id', orderData.id).single();
  return { data: mapOrder(finalOrder || orderData), error: null };
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
  items: { id: string; name: string; variant?: string | null; quantity: number; price: number; subtotal?: number }[];
  itemsFull: { id: string; name: string; variant?: string | null; quantity: number; price: number; subtotal?: number }[];
  total_amount: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  payment_method?: string;
  estimated_prep_time_minutes?: number;
}): Promise<{ data: Order | null; error: string | null }> {
  const now = new Date();
  const nowISO = now.toISOString();
  const dateStr = nowISO.slice(0, 10).replace(/-/g, '');

  // Fetch current order count to generate sequential IDs
  const { count: orderCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true });
  const nextSeq = (orderCount || 0) + 1;
  const seqPadded = String(nextSeq).padStart(4, '0');

  const tokenNumber = `TKN-${seqPadded}`;
  const pickupCode = `PICKUP-${seqPadded}`;
  const qrPickupCode = `QR-FDX-${dateStr}-${seqPadded}`;

  const isPaid = Boolean(params.razorpay_payment_id && params.razorpay_signature);
  const customerName = params.customer_name || params.email?.split('@')[0] || 'Customer';
  const phone = params.phone || '0000000000';
  const prepTimeMinutes = params.estimated_prep_time_minutes || 15;

  // CRITICAL FIX: Enforce profiles.institution_id and menu_items.canteen_id
  const actualInstitutionId = params.institution_id;
  let actualCanteenId = params.canteen_id;

  if (!actualInstitutionId) {
    return { data: null, error: 'You must join an institution before placing an order.' };
  }

  if (params.itemsFull && params.itemsFull.length > 0) {
    const firstItemId = params.itemsFull[0].id;
    const { data: itemData, error: itemError } = await supabase
      .from('menu_items')
      .select('canteen_id')
      .eq('id', firstItemId)
      .single();

    if (!itemError && itemData?.canteen_id) {
      actualCanteenId = itemData.canteen_id;
    }
  }

  if (!actualCanteenId) {
    const { data: fallbackCanteen } = await supabase
      .from('canteens')
      .select('id')
      .eq('institution_id', actualInstitutionId)
      .eq('status', 'active')
      .order('name', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (fallbackCanteen?.id) actualCanteenId = fallbackCanteen.id;
  }

  if (!actualCanteenId) {
    return { data: null, error: 'No active canteen found for your institution. Please contact support.' };
  }

  const payload: Record<string, any> = {
    student_id: params.user_id || null,
    email: params.email,
    customer_name: customerName,
    phone: phone,
    institution_id: actualInstitutionId,
    canteen_id: actualCanteenId,
    total_amount: params.total_amount,
    transaction_amount: params.total_amount,
    status: isPaid ? 'accepted' : 'pending',
    order_status: isPaid ? 'Accepted' : 'Pending Payment',
    payment_status: isPaid ? 'paid' : 'pending',
    payment_method: isPaid ? (params.payment_method === 'cash' ? 'cash' : 'razorpay') : 'razorpay',
    order_number: nextSeq,
    pickup_token: tokenNumber,
    pickup_code: pickupCode,
    qr_pickup_code: qrPickupCode,
    token_number: tokenNumber,
    notes: params.notes || null,
    kitchen_status: 'Pending',
    counter_status: 'Incoming',
    estimated_ready_at: new Date(now.getTime() + prepTimeMinutes * 60000).toISOString(),
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

  // Double check the inserted data as requested
  if (!orderData.institution_id || !orderData.canteen_id || !orderData.student_id || !orderData.qr_pickup_code) {
    console.error('[Supabase] CRITICAL: Inserted order has missing required fields!', orderData);
  }

  const orderItemsPayload = createOrderItemsPayload(orderData.id, params.itemsFull);
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
  institution_id?: string | null;
  canteen_id?: string | null;
  student_id?: string;
  total_amount?: number;
  prep_time_minutes?: number;
}): Promise<{ success: boolean; data?: Order | null; error?: string }> {
  const now = new Date().toISOString();
  const prepTime = params.prep_time_minutes || 15;

  // Step A: Update the order row with all payment fields
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'accepted',
      order_status: 'Accepted',
      payment_method: 'razorpay',
      razorpay_order_id: params.razorpay_order_id,
      razorpay_payment_id: params.razorpay_payment_id,
      razorpay_signature: params.razorpay_signature,
      payment_id: params.razorpay_payment_id,
      transaction_id: params.razorpay_order_id,
      transaction_reference: params.razorpay_payment_id,
      paid_at: now,
      accepted_at: now,
      updated_at: now,
      kitchen_status: 'Pending',
      counter_status: 'Incoming',
      estimated_ready_at: new Date(Date.now() + prepTime * 60000).toISOString(),
    })
    .eq('id', params.order_id)
    .select()
    .maybeSingle();

  if (updateError) {
    return { success: false, error: updateError.message || 'Failed to update order after payment.' };
  }

  let finalOrder = updatedOrder;
  if (!finalOrder) {
    console.warn('[Supabase] updateOrderAfterPayment: update returned no rows (RLS?). Fetching order directly.');
    const { data: fetchedOrder } = await supabase.from('orders').select('*').eq('id', params.order_id).maybeSingle();
    finalOrder = fetchedOrder;
    if (!finalOrder) {
      return { success: false, error: 'Order not found after payment.' };
    }
  }

  // Step B: Insert into payments table (best-effort, do not block on failure)
  try {
    const paymentRow: Record<string, any> = {
      order_id: params.order_id,
      razorpay_order_id: params.razorpay_order_id,
      razorpay_payment_id: params.razorpay_payment_id,
      razorpay_signature: params.razorpay_signature,
      amount: params.total_amount || finalOrder.total_amount || 0,
      currency: 'INR',
      payment_status: 'paid',
      payment_method: 'razorpay',
      created_at: now,
      updated_at: now,
    };
    if (params.institution_id) paymentRow.institution_id = params.institution_id;
    if (params.student_id) paymentRow.user_id = params.student_id;
    await supabase.from('payments').insert([paymentRow]);
  } catch (_) { /* best-effort */ }

  // Step C: Insert notifications (best-effort)
  try {
    const notifs: Record<string, any>[] = [];
    const baseNotif = {
      created_at: now,
      read: false,
      order_id: params.order_id,
    };
    if (params.student_id) {
      notifs.push({ ...baseNotif, type: 'order_confirmed', title: 'Order Confirmed!', message: `Your order has been confirmed and is being prepared.`, user_id: params.student_id });
    }
    if (params.institution_id) {
      notifs.push({ ...baseNotif, type: 'new_order', title: 'New Order Received', message: `A new order has been placed and payment confirmed.`, institution_id: params.institution_id });
    }
    if (notifs.length > 0) await supabase.from('notifications').insert(notifs);
  } catch (_) { /* best-effort */ }

  return { success: true, data: mapOrder(finalOrder) };
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase.from('orders').select(SELECT_ORDER_WITH_ITEMS).eq('id', orderId).single();
  if (error || !data) return null;
  return mapOrder(data);
}

export async function cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  // Update order to cancelled state
  const { error } = await supabase.from('orders').update({
    status: 'cancelled',
    order_status: 'Cancelled',
    payment_status: 'refund_pending', // Assume manual refund if already paid
    kitchen_status: 'Cancelled',
    counter_status: 'Cancelled',
    updated_at: now
  }).eq('id', orderId);

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
    const menuItemIds = data.map((r: any) => r.menu_item_id).filter(Boolean);
    if (menuItemIds.length === 0) return [];
    const { data: menuItems } = await supabase.from('menu_items').select('*').in('id', menuItemIds);
    const menuMap = new Map((menuItems || []).map((m: any) => [m.id, mapMenuItem(m)]));
    // Silently skip cart items whose menu_item has been deleted
    return data
      .map((r: any) => {
        const item = menuMap.get(r.menu_item_id);
        if (!item) return null;
        return { item, quantity: r.quantity };
      })
      .filter((x): x is { item: MenuItem; quantity: number } => x !== null);
  } catch (err) {
    console.error('[Supabase] fetchUserCart error:', err);
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
    read: Boolean(r.read),
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

// ==================== CANTEENS ====================
export async function fetchCanteens(institutionId?: string): Promise<Canteen[]> {
  try {
    let query = supabase.from('canteens').select('*').order('name', { ascending: true });
    if (institutionId) query = query.eq('institution_id', institutionId);
    const { data, error } = await query;
    if (error) {
      console.error('[Supabase] fetchCanteens error:', error.message);
      return [];
    }
    return (data || [])
      .filter((canteen: any) => {
        if ('is_active' in canteen) return canteen.is_active !== false;
        if ('available' in canteen) return canteen.available !== false;
        if ('availability' in canteen) return canteen.availability !== false;
        if ('status' in canteen) return !['inactive', 'disabled', 'archived', 'closed'].includes(String(canteen.status || '').toLowerCase());
        return true;
      })
      .map((canteen: any) => ({
        ...canteen,
        is_active: canteen.is_active !== false,
        is_ordering_enabled: canteen.is_ordering_enabled ?? canteen.available ?? canteen.availability ?? true,
        prep_time_minutes: Number(canteen.prep_time_minutes || canteen.preparation_time || 10),
        rating: Number(canteen.rating || 0),
      })) as Canteen[];
  } catch (err) {
    console.error('[Supabase] fetchCanteens exception:', err);
    return [];
  }
}

export async function fetchCanteenById(canteenId: string): Promise<Canteen | null> {
  try {
    const { data, error } = await supabase.from('canteens').select('*').eq('id', canteenId).maybeSingle();
    if (error) {
      console.error('[Supabase] fetchCanteenById error:', error.message);
      return null;
    }
    return data as Canteen | null;
  } catch (err) {
    console.error('[Supabase] fetchCanteenById exception:', err);
    return null;
  }
}

// ==================== USER ADDRESSES ====================
export async function fetchUserAddresses(userId: string): Promise<UserAddress[]> {
  if (userAddressesSupported === false) return [];
  try {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      if (isMissingSchemaError(error)) {
        userAddressesSupported = false;
        console.info('[Supabase] Saved delivery spots are not enabled in this project schema.');
      } else {
        console.error('[Supabase] fetchUserAddresses error:', error.message);
      }
      return [];
    }
    userAddressesSupported = true;
    return (data || []) as UserAddress[];
  } catch (err) {
    console.error('[Supabase] fetchUserAddresses exception:', err);
    return [];
  }
}

export async function addUserAddress(userId: string, params: {
  label: string;
  address: string;
  institution_id?: string | null;
  is_default?: boolean;
}): Promise<{ success: boolean; error?: string; data?: UserAddress }> {
  if (userAddressesSupported === false) {
    return { success: false, error: 'Saved delivery spots are not available for this institution yet.' };
  }
  try {
    const { label, address, institution_id, is_default = false } = params;
    if (!label.trim() || !address.trim()) {
      return { success: false, error: 'Label and address are required.' };
    }

    if (is_default) {
      await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', userId);
    }

    const { data, error } = await supabase.from('user_addresses').insert({
      user_id: userId,
      label: label.trim(),
      address: address.trim(),
      institution_id: institution_id || null,
      is_default,
    }).select('*').maybeSingle();

    if (error) {
      if (isMissingSchemaError(error)) {
        userAddressesSupported = false;
        return { success: false, error: 'Saved delivery spots are not available for this institution yet.' };
      }
      console.error('[Supabase] addUserAddress error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data: data as UserAddress };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to add address.' };
  }
}

export async function updateUserAddress(addressId: string, params: {
  label?: string;
  address?: string;
  is_default?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  if (userAddressesSupported === false) {
    return { success: false, error: 'Saved delivery spots are not available for this institution yet.' };
  }
  try {
    const updates: Record<string, any> = {};
    if (params.label !== undefined) updates.label = params.label.trim();
    if (params.address !== undefined) updates.address = params.address.trim();
    if (params.is_default !== undefined) updates.is_default = params.is_default;

    const { error } = await supabase.from('user_addresses').update(updates).eq('id', addressId);
    if (error) {
      if (isMissingSchemaError(error)) {
        userAddressesSupported = false;
        return { success: false, error: 'Saved delivery spots are not available for this institution yet.' };
      }
      console.error('[Supabase] updateUserAddress error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update address.' };
  }
}

export async function deleteUserAddress(addressId: string): Promise<{ success: boolean; error?: string }> {
  if (userAddressesSupported === false) {
    return { success: false, error: 'Saved delivery spots are not available for this institution yet.' };
  }
  try {
    const { error } = await supabase.from('user_addresses').delete().eq('id', addressId);
    if (error) {
      if (isMissingSchemaError(error)) {
        userAddressesSupported = false;
        return { success: false, error: 'Saved delivery spots are not available for this institution yet.' };
      }
      console.error('[Supabase] deleteUserAddress error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete address.' };
  }
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<{ success: boolean; error?: string }> {
  if (userAddressesSupported === false) {
    return { success: false, error: 'Saved delivery spots are not available for this institution yet.' };
  }
  try {
    await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', userId);
    const { error } = await supabase.from('user_addresses').update({ is_default: true }).eq('id', addressId);
    if (error) {
      if (isMissingSchemaError(error)) {
        userAddressesSupported = false;
        return { success: false, error: 'Saved delivery spots are not available for this institution yet.' };
      }
      console.error('[Supabase] setDefaultAddress error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to set default address.' };
  }
}

// ==================== DIET PREFERENCE ====================
export async function updateDietPreference(userId: string, preference: 'all' | 'veg' | 'non-veg'): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ diet_preference: preference })
      .eq('user_id', userId);
    if (error) {
      console.error('[Supabase] updateDietPreference error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update diet preference.' };
  }
}

// ==================== AVATAR UPLOAD ====================
export const AVATAR_BUCKET = 'avatars';

export async function uploadAvatar(userId: string, file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from(AVATAR_BUCKET).upload(fileName, file, {
      upsert: true,
      cacheControl: '3600',
    });
    if (error) {
      console.error('[Supabase] uploadAvatar error:', error.message);
      return { success: false, error: error.message };
    }
    const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(data.path);
    const avatarUrl = urlData?.publicUrl || null;
    if (avatarUrl) {
      try {
        await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('user_id', userId);
      } catch (e) {
        console.warn('[Supabase] avatar_url update skipped (column may not exist):', e);
      }
    }
    return { success: true, url: avatarUrl || undefined };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to upload avatar.' };
  }
}

export async function removeAvatar(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('user_id', userId);
      if (error) {
        console.warn('[Supabase] avatar_url clear skipped (column may not exist):', error.message);
      }
    } catch (e) {
      console.warn('[Supabase] avatar_url clear skipped (column may not exist):', e);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to remove avatar.' };
  }
}

// ==================== REALTIME SUBSCRIPTIONS ====================
export function subscribeCanteens(callback: (payload: any) => void, institutionId?: string): () => void {
  let channel: RealtimeChannel;
  if (institutionId) {
    channel = supabase
      .channel(`canteens:institution=${institutionId}`)
      .on('postgres_changes' as any, {
        event: '*', schema: 'public', table: 'canteens',
        filter: `institution_id=eq.${institutionId}`,
      }, callback);
  } else {
    channel = supabase
      .channel('canteens:all')
      .on('postgres_changes' as any, {
        event: '*', schema: 'public', table: 'canteens',
      }, callback);
  }
  channel.subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeUserAddresses(userId: string, callback: (payload: any) => void): () => void {
  if (userAddressesSupported !== true) return () => { };
  const channel = supabase
    .channel(`user_addresses:uid=${userId}`)
    .on('postgres_changes' as any, {
      event: '*', schema: 'public', table: 'user_addresses',
      filter: `user_id=eq.${userId}`,
    }, callback);
  channel.subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
