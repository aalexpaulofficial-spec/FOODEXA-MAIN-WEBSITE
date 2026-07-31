import React, { useState, useEffect, useCallback } from 'react';
import { Receipt, RotateCcw, FileText, Package, CheckCircle2, XCircle, Download, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Order, OrderStatus, MenuItem } from '../../types';
import { formatINR, generateReceipt } from '../../lib/supabase-service';

const formatDate = (d: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const statusLabel = (s: OrderStatus): string => {
  const m: Record<OrderStatus, string> = {
    pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing', cooking: 'Cooking', quality_check: 'Quality Check', packed: 'Packed',
    ready: 'Ready', completed: 'Completed', cancelled: 'Refunded',
  };
  return m[s] || s;
};

const statusStyle = (s: OrderStatus): string => {
  const m: Record<OrderStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-blue-50 text-blue-700 border-blue-200',
    preparing: 'bg-violet-50 text-violet-700 border-violet-200',
    cooking: 'bg-orange-50 text-orange-700 border-orange-200',
    quality_check: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    packed: 'bg-teal-50 text-teal-700 border-teal-200',
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-blue-50 text-blue-600 border-blue-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
  };
  return m[s] || 'bg-slate-100 text-slate-600 border-slate-200';
};

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
  };
}

interface HistoryTabProps {
  userId: string | undefined;
  onReorder: (order: Order) => void;
  onGoExplore: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  userId,
  onReorder,
  onGoExplore,
}) => {
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!userId) {
      setPastOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('student_id', userId)
      .in('status', ['completed', 'cancelled'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPastOrders(data.map(mapOrderRow));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="p-4 max-w-2xl mx-auto">
          <h2 className="text-xl font-black text-slate-900 mb-6">Order History</h2>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (pastOrders.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="p-4 max-w-2xl mx-auto">
          <h2 className="text-xl font-black text-slate-900 mb-6">Order History</h2>
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-500">No orders yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-5">Start ordering from the campus menu</p>
            <button
              onClick={onGoExplore}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/30"
            >
              Browse Menu →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-32 relative">
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Order History</h2>
            <p className="text-xs text-slate-500 mt-0.5">{pastOrders.length} past order{pastOrders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="space-y-4">
          {pastOrders.slice(0, 30).map(order => {
            const isCancelled = order.status === 'cancelled';
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">Order {order.order_number || order.order_id || `#FX-${String(order.id).slice(-4).toUpperCase()}`}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{formatDate(order.created_at)} • {order.counter || 'Campus Canteen'}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${statusStyle(order.status)}`}>
                    {order.status === 'completed'
                      ? <CheckCircle2 className="w-3.5 h-3.5" />
                      : order.status === 'cancelled'
                        ? <XCircle className="w-3.5 h-3.5" />
                        : <Package className="w-3.5 h-3.5" />
                    }
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="py-3 border-y border-slate-100 my-3 space-y-1.5">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm font-bold text-slate-700">
                      <span>{item.quantity}x {item.name}</span>
                    </div>
                  ))}
                  {order.items.length === 0 && (
                    <div className="text-sm font-medium text-slate-500 italic">No items recorded</div>
                  )}
                </div>

                <div className="flex items-end justify-between pt-1">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Paid</p>
                    <p className="text-xl font-black text-slate-900">{formatINR(order.total_amount)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReceiptOrder(order)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Tax Invoice
                    </button>
                    {!isCancelled && (
                      <button
                        onClick={() => onReorder(order)}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reorder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {receiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
                <button onClick={() => setReceiptOrder(null)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{receiptOrder.institution_name || 'CHRIST UNIVERSITY'} CANTEEN RECEIPT</h2>
              <h3 className="text-2xl font-black text-slate-900 mb-1">Tax Invoice {receiptOrder.order_number || receiptOrder.order_id || `#FX-${String(receiptOrder.id).slice(-4).toUpperCase()}`}</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">{formatDate(receiptOrder.created_at)}</p>

              <div className="space-y-3 mb-6">
                {receiptOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start text-sm">
                    <span className="font-bold text-slate-700 flex-1 pr-4">{item.quantity}x {item.name}</span>
                    <span className="font-black text-slate-900">{formatINR(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-slate-200 pt-4 pb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-500">
                    Total {receiptOrder.payment_status === 'paid' ? 'Paid' : 'Pending'} (via {
                      receiptOrder.payment_method === 'cash' ? 'Cash' : 
                      receiptOrder.payment_method === 'razorpay' ? 'Razorpay (UPI)' : 
                      'FOODEXA Wallet'
                    })
                  </span>
                  <span className="text-xl font-black text-slate-900">{formatINR(receiptOrder.total_amount)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  const receipt = generateReceipt(receiptOrder);
                  const blob = new Blob([receipt], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `receipt-${receiptOrder.order_number || receiptOrder.order_id}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-lg hover:bg-slate-800 transition-colors flex justify-center items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
