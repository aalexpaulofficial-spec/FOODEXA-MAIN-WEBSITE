import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Order, OrderItem, OrderStatus } from '../types';
import { isOrderActive, isOrderPast } from '../lib/orderTimeline';

interface UseSupabaseOrdersOptions {
  userId: string | undefined;
  enabled?: boolean;
}

interface UseSupabaseOrdersReturn {
  orders: Order[];
  activeOrders: Order[];
  pastOrders: Order[];
  loading: boolean;
  error: string | null;
  itemsLoading: boolean;
  itemsError: string | null;
  refresh: () => Promise<void>;
}

function normalizeOrderStatus(status: any): OrderStatus {
  const s = String(status || 'pending').toLowerCase();
  if (['pending', 'order received'].includes(s)) return 'pending';
  if (['accepted', 'confirmed'].includes(s)) return 'confirmed';
  if (['preparing', 'preparation'].includes(s)) return 'preparing';
  if (['ready', 'ready for pickup'].includes(s)) return 'ready';
  if (['completed', 'collected', 'delivered'].includes(s)) return 'completed';
  if (['cancelled', 'canceled'].includes(s)) return 'cancelled';
  return 'pending';
}

function normalizePaymentStatus(status: any): string {
  const s = String(status || 'pending').toLowerCase();
  const validStatuses = ['pending', 'authorized', 'captured', 'paid', 'success', 'failed', 'cancelled', 'refunded'];
  return validStatuses.includes(s) ? s : 'pending';
}

function mapJoinedItems(orderRow: any): OrderItem[] {
  const joinedItems = orderRow.order_items;
  if (Array.isArray(joinedItems) && joinedItems.length > 0) {
    return joinedItems.map((oi: any) => {
      const mi = oi.menu_items;
      // Prefer snapshot data from order_items (copied at order creation time)
      const snapshotName = String(oi.name || '').trim();
      const snapshotPrice = Number(oi.price);
      return {
        id: String(oi.id || ''),
        order_id: String(oi.order_id || ''),
        menu_item_id: String(oi.menu_item_id || ''),
        name: snapshotName || String(mi?.food_name || 'Item'),
        variant: String(mi?.category_name || mi?.food_type || oi.variant || ''),
        quantity: Number(oi.quantity || 1),
        price: !isNaN(snapshotPrice) && snapshotPrice >= 0 ? snapshotPrice : Number(mi?.price || 0),
        image_url: oi.image_url || mi?.image_url || null,
        is_veg: oi.is_veg !== undefined ? oi.is_veg : (mi?.is_veg !== undefined ? mi.is_veg : null),
      };
    });
  }
  const jsonbItems = orderRow.items;
  if (Array.isArray(jsonbItems) && jsonbItems.length > 0) {
    return jsonbItems.map((i: any) => ({
      name: String(i.item_name || i.name || 'Item'),
      variant: String(i.food_type || i.category || i.counter_name || i.variant || ''),
      quantity: Number(i.quantity || i.qty || 1),
      price: Number(i.price || i.amount || 0),
      image_url: i.image_url || null,
      is_veg: i.is_veg !== undefined ? i.is_veg : null,
    }));
  }
  return [];
}

function mapOrderRow(r: any): Order {
  const authUserId = String(r.student_id || r.user_id || '');
  const counterCode = r.counter_code || r.counter_name || r.counter || '';
  
  return {
    id: String(r.id),
    student_id: authUserId,
    user_id: authUserId,
    email: String(r.email || ''),
    customer_name: r.customer_name || null,
    phone: r.phone || null,
    role: ['student', 'faculty', 'guest', 'institution_admin', 'kitchen_staff', 'canteen_manager', 'super_admin'].includes(r.role) ? r.role : null,
    institution_id: r.institution_id || null,
    institution_code: r.institution_code || null,
    canteen_id: r.canteen_id || null,
    counter_id: r.counter_id || null,
    category_id: r.category_id || null,
    order_id: r.order_number ? `#FX-${String(r.order_number).padStart(4, '0')}` : `#FX-${String(r.id).slice(-4).toUpperCase()}`,
    order_number: r.order_number || undefined,
    counter: counterCode,
    counter_name: r._resolved_counter_name || r.counter_name || counterCode || null,
    canteen_name: r._resolved_canteen_name || r.canteen_name || null,
    items: mapJoinedItems(r),
    total_amount: Number(r.total_amount || 0),
    transaction_amount: Number(r.transaction_amount || r.total_amount || 0),
    status: normalizeOrderStatus(r.status),
    order_status: normalizeOrderStatus(r.order_status || r.status || 'pending'),
    payment_status: normalizePaymentStatus(r.payment_status),
    registration_id: r.registration_id || null,
    kitchen_status: r.kitchen_status || undefined,
    counter_status: r.counter_status || undefined,
    pickup_code: r.pickup_code || null,
    pickup_token: r.pickup_token || undefined,
    qr_pickup_code: r.qr_pickup_code || null,
    qr_code: r.qr_code || null,
    qr_code_data: r.qr_code_data || null,
    locker_number: r.locker_number || null,
    notes: r.notes || null,
    created_at: r.created_at || '',
    accepted_at: r.accepted_at || null,
    preparing_at: r.preparing_at || null,
    ready_at: r.ready_at || null,
    completed_at: r.completed_at || null,
    updated_at: r.updated_at || '',
    estimated_ready_at: r.estimated_ready_at || null,
    token_number: r.token_number || r.pickup_token || undefined,
    pickup_pin: r.pickup_pin || null,
    kitchen_queue_status: r.kitchen_status || undefined,
    paid_at: r.paid_at || null,
    payment_method: r.payment_method || null,
    razorpay_order_id: r.razorpay_order_id || null,
    razorpay_payment_id: r.razorpay_payment_id || null,
    razorpay_signature: r.razorpay_signature || null,
    cancel_deadline_at: r.cancel_deadline_at || null,
    pickup_type: r.pickup_type || null,
  };
}

// Include counter_code, payment_status, order_status, paid_at, cancelled_at, cancel_deadline_at, pickup_type
const ORDER_COLUMNS = 'id, student_id, registration_id, email, customer_name, phone, institution_id, canteen_id, counter_id, counter_code, total_amount, transaction_amount, status, order_status, order_number, pickup_code, pickup_type, qr_code, qr_pickup_code, token_number, pickup_token, notes, kitchen_status, counter_status, estimated_ready_at, cancel_deadline_at, payment_status, created_at, accepted_at, preparing_at, ready_at, completed_at, updated_at, paid_at, cancelled_at, cancelled_by, payment_method, razorpay_order_id, razorpay_payment_id, razorpay_signature';
const ORDER_ITEM_COLUMNS = 'id, order_id, menu_item_id, name, variant, quantity, price, image_url, is_veg, created_at, menu_items(id, food_name, food_type, category_name, image_url, is_veg, price)';

export function useSupabaseOrders({ userId, enabled = true }: UseSupabaseOrdersOptions): UseSupabaseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      let orderRows: any[] = [];
      let fetchError: any = null;

      // Strip the "direct_" prefix used by direct session users
      const actualUserId = userId.startsWith('direct_') ? userId.slice(7) : userId;

      // Try fetching by student_id first
      const { data: byStudentId, error: err1 } = await supabase
        .from('orders')
        .select(ORDER_COLUMNS)
        .eq('student_id', actualUserId)
        .order('created_at', { ascending: false });

      if (!err1 && byStudentId && byStudentId.length > 0) {
        orderRows = byStudentId;
      } else {
        // Fallback: fetch by user_id column
        const { data: byUserId, error: err2 } = await supabase
          .from('orders')
          .select(ORDER_COLUMNS)
          .eq('user_id', actualUserId)
          .order('created_at', { ascending: false });

        if (!err2 && byUserId && byUserId.length > 0) {
          orderRows = byUserId;
        } else {
          // Last fallback: fetch all orders and filter client-side by matching student_id
          const { data: allOrders, error: err3 } = await supabase
            .from('orders')
            .select(ORDER_COLUMNS)
            .order('created_at', { ascending: false });

          if (!err3 && allOrders) {
            orderRows = allOrders.filter((row: any) =>
              row.student_id === actualUserId || row.user_id === actualUserId
            );
          } else {
            fetchError = err3 || err2 || err1;
          }
        }
      }

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      const rows = orderRows || [];

      if (rows.length === 0) {
        if (mountedRef.current) {
          setOrders([]);
          setError(null);
        }
        return;
      }

      const orderIds = rows.map((row: any) => String(row.id)).filter(Boolean);
      let orderItems: any[] = [];

      if (orderIds.length > 0) {
        if (mountedRef.current) setItemsLoading(true);
        const { data: itemRows, error: itemsError } = await supabase
          .from('order_items')
          .select(ORDER_ITEM_COLUMNS)
          .in('order_id', orderIds);

        if (mountedRef.current) setItemsLoading(false);

        if (itemsError) {
          console.warn('[useSupabaseOrders] order_items fetch failed:', itemsError.message);
          if (mountedRef.current) setItemsError(itemsError.message);
        } else {
          if (mountedRef.current) setItemsError(null);
          orderItems = itemRows || [];
        }
      }

      const itemsByOrderId = new Map<string, any[]>();
      for (const item of orderItems) {
        const key = String(item.order_id || '');
        if (!key) continue;
        const current = itemsByOrderId.get(key) || [];
        current.push(item);
        itemsByOrderId.set(key, current);
      }

      // Resolve canteen and counter names from DB
      const canteenIds = [...new Set(rows.map((r: any) => r.canteen_id).filter(Boolean))];
      const counterCodes = [...new Set(rows.map((r: any) => r.counter_code || r.counter).filter(Boolean))];

      const canteenNameMap = new Map<string, string>();
      const counterNameMap = new Map<string, string>();

      if (canteenIds.length > 0) {
        const { data: canteenRows } = await supabase
          .from('canteens')
          .select('id, name')
          .in('id', canteenIds);
        for (const c of canteenRows || []) {
          canteenNameMap.set(String(c.id), String(c.name || ''));
        }
      }

      if (counterCodes.length > 0) {
        const { data: counterRows } = await supabase
          .from('counters')
          .select('id, name, code')
          .or(`id.in.(${counterCodes.join(',')}),code.in.(${counterCodes.join(',')})`);
        for (const c of counterRows || []) {
          if (c.id) counterNameMap.set(String(c.id), String(c.name || ''));
          if (c.code) counterNameMap.set(String(c.code), String(c.name || ''));
        }
      }

      if (mountedRef.current) {
        setOrders(
          rows.map((row: any) => {
            const counterKey = row.counter_id || row.counter_code || row.counter || '';
            return mapOrderRow({
              ...row,
              order_items: itemsByOrderId.get(String(row.id)) || [],
              _resolved_canteen_name: canteenNameMap.get(String(row.canteen_id || '')) || null,
              _resolved_counter_name: counterNameMap.get(String(counterKey)) || row.counter_name || row.counter || null,
            });
          })
        );
        setError(null);
      }
    } catch (err: any) {
      if (mountedRef.current) setError(err?.message || 'Failed to fetch orders');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userId]);

  const upsertOrder = useCallback(async (orderId: string) => {
    if (!mountedRef.current) return;
    try {
      const { data: freshRow, error: orderError } = await supabase
        .from('orders')
        .select(ORDER_COLUMNS)
        .eq('id', orderId)
        .single();

      if (orderError || !freshRow) {
        fetchOrders();
        return;
      }

      const { data: itemRows, error: itemsError } = await supabase
        .from('order_items')
        .select(ORDER_ITEM_COLUMNS)
        .eq('order_id', orderId);

      // Resolve canteen and counter names
      let resolvedCanteenName: string | null = null;
      let resolvedCounterName: string | null = null;

      if (freshRow.canteen_id) {
        const { data: canteenRow } = await supabase
          .from('canteens')
          .select('name')
          .eq('id', freshRow.canteen_id)
          .maybeSingle();
        resolvedCanteenName = canteenRow?.name || null;
      }

      const counterKey = freshRow.counter_id || freshRow.counter_code || '';
      if (counterKey) {
        const { data: counterRow } = await supabase
          .from('counters')
          .select('name')
          .or(`id.eq.${counterKey},code.eq.${counterKey}`)
          .maybeSingle();
        resolvedCounterName = counterRow?.name || freshRow.counter_code || null;
      }

      const mapped = mapOrderRow({
        ...freshRow,
        order_items: itemsError ? [] : (itemRows || []),
        _resolved_canteen_name: resolvedCanteenName,
        _resolved_counter_name: resolvedCounterName,
      });

      if (mountedRef.current) {
        setOrders((prev) => {
          const next = prev.filter((o) => o.id !== mapped.id);
          return [mapped, ...next];
        });
      }
    } catch {
      // fallback: refetch all
      fetchOrders();
    }
  }, [fetchOrders]);

  useEffect(() => {
    if (!enabled || !userId) {
      setOrders([]);
      setLoading(false);
      setItemsLoading(false);
      setItemsError(null);
      return;
    }

    setLoading(true);
    fetchOrders();

    let isSettingUp = false;

    const setup = () => {
      if (!userId || !enabled || !mountedRef.current || isSettingUp) return;
      isSettingUp = true;

      // Strip "direct_" prefix for the Realtime filter
      const filterUserId = userId.startsWith('direct_') ? userId.slice(7) : userId;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch { /* ignore */ }
        channelRef.current = null;
      }

      const channelName = `student-orders-${userId}`;

      const handleOrderChange = async () => {
        if (!mountedRef.current) return;
        await fetchOrders();
      };

      const handleOrderItemChange = async () => {
        if (!mountedRef.current) return;
        await fetchOrders();
      };

      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `student_id=eq.${filterUserId}` }, handleOrderChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, handleOrderItemChange)
        .subscribe((status) => {
          if (!mountedRef.current) return;
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            reconnectTimerRef.current = setTimeout(() => {
              reconnectTimerRef.current = null;
              isSettingUp = false;
              if (mountedRef.current && enabled && userId) {
                setup();
              }
            }, 3000);
          } else {
            isSettingUp = false;
          }
        });

      channelRef.current = channel;
    };

    setup();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      isSettingUp = false;
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch { /* ignore */ }
        channelRef.current = null;
      }
    };
  }, [userId, enabled]);

  const refresh = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  const activeOrders = orders.filter(o => isOrderActive(o.status));
  const pastOrders = orders.filter(o => isOrderPast(o.status));

  return { orders, activeOrders, pastOrders, loading, error, itemsLoading, itemsError, refresh };
}
