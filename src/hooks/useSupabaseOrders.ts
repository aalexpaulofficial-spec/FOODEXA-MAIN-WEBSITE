import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Order, OrderStatus } from '../types';

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
  refresh: () => Promise<void>;
}

function mapOrderRow(r: any): Order {
  return {
    id: String(r.id),
    student_id: String(r.student_id || ''),
    user_id: String(r.student_id || ''),
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
    counter: r.counter_name || (Array.isArray(r.items) && r.items[0]?.food_type) || (Array.isArray(r.items) && r.items[0]?.counter_name) || 'Campus Counter',
    items: Array.isArray(r.items) ? r.items.map((i: any) => ({
      name: String(i.item_name || i.name || 'Item'),
      quantity: Number(i.quantity || 1),
      price: Number(i.price || 0),
    })) : [],
    total_amount: Number(r.total_amount || 0),
    transaction_amount: Number(r.transaction_amount || r.total_amount || 0),
    status: (r.status || 'pending').toLowerCase() as OrderStatus,
    order_status: r.order_status || r.status || 'pending',
    payment_status: r.payment_status || 'pending',
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
  };
}

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'accepted', 'preparing', 'cooking', 'quality_check', 'packed', 'ready'];

export function useSupabaseOrders({ userId, enabled = true }: UseSupabaseOrdersOptions): UseSupabaseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      if (mountedRef.current) {
        setOrders((data || []).map(mapOrderRow));
        setError(null);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message || 'Failed to fetch orders');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled || !userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchOrders();

    const filter = `student_id=eq.${userId}`;
    const channelName = `orders-student-realtime:${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter,
        },
        (payload) => {
          if (!mountedRef.current) return;

          const eventType = payload.eventType;
          const newRow = payload.new as any;
          const oldRow = payload.old as any;

          if (eventType === 'INSERT') {
            const newOrder = mapOrderRow(newRow);
            setOrders((prev) => {
              const exists = prev.find((o) => o.id === newOrder.id);
              if (exists) return prev;
              return [newOrder, ...prev];
            });
          } else if (eventType === 'UPDATE') {
            const updatedOrder = mapOrderRow(newRow);
            setOrders((prev) => {
              const idx = prev.findIndex((o) => o.id === updatedOrder.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updatedOrder;
                return next;
              }
              return [updatedOrder, ...prev];
            });
          } else if (eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== String(oldRow.id)));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setTimeout(() => {
            if (mountedRef.current && channelRef.current === channel) {
              try { supabase.removeChannel(channel); } catch {}
              channelRef.current = null;
            }
          }, 5000);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch {}
        channelRef.current = null;
      }
    };
  }, [userId, enabled, fetchOrders]);

  const refresh = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const pastOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));

  return {
    orders,
    activeOrders,
    pastOrders,
    loading,
    error,
    refresh,
  };
}
