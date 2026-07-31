import React from 'react';
import { motion } from 'framer-motion';
import { X, Building2, MapPin, Clock, CreditCard, Hash, QrCode, Package, CheckCircle2, XCircle, Calendar, Tag } from 'lucide-react';
import type { Order } from '../../types';
import { formatINR, formatDateTime } from '../../lib/supabase-service';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  institutionName: string;
}

const statusLabel = (s: Order['status']): string => {
  const m: Record<Order['status'], string> = {
    pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing', cooking: 'Cooking',
    quality_check: 'Quality Check', packed: 'Packed', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled',
  };
  return m[s] || s;
};

const statusStyle = (s: Order['status']): string => {
  const m: Record<Order['status'], string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-blue-50 text-blue-700 border-blue-200',
    preparing: 'bg-violet-50 text-violet-700 border-violet-200',
    cooking: 'bg-orange-50 text-orange-700 border-orange-200',
    quality_check: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    packed: 'bg-teal-50 text-teal-700 border-teal-200',
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
  };
  return m[s] || 'bg-slate-100 text-slate-600 border-slate-200';
};

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order, institutionName }) => {
  if (!isOpen) return null;

  const orderNumber = order.order_number || order.order_id || '';
  const pickupCode = order.pickup_code || order.pickup_token || '';
  const tokenNumber = order.token_number || order.pickup_token || '';
  const invoiceNumber = `INV-${orderNumber.replace('#FX-', '').replace('FDX-', '')}`;
  const paymentMethod = order.payment_method === 'razorpay' ? 'UPI / Razorpay'
    : order.payment_method === 'cash' ? 'Cash at Counter'
    : order.payment_method === 'wallet' ? 'FOODEXA Wallet'
    : order.payment_method || 'N/A';

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const convenienceFee = 0;
  const discount = order.total_amount < subtotal ? subtotal - order.total_amount : 0;
  const grandTotal = order.total_amount;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white w-full sm:max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900">Order Details</h2>
            <p className="text-xs text-slate-500 font-medium">{orderNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusStyle(order.status)}`}>
              {order.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : order.status === 'cancelled' ? <XCircle className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
              {statusLabel(order.status)}
            </span>
          </div>

          {/* Institution & Canteen */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Institution</p>
              </div>
              <p className="text-sm font-bold text-slate-900 truncate">{institutionName}</p>
            </div>
            {order.counter && (
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Canteen</p>
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">{order.counter}</p>
              </div>
            )}
          </div>

          {/* Pickup & Token */}
          {(pickupCode || tokenNumber) && (
            <div className="grid grid-cols-2 gap-3">
              {pickupCode && (
                <div className="rounded-xl bg-blue-50 p-3 border border-blue-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <QrCode className="w-3.5 h-3.5 text-blue-400" />
                    <p className="text-[10px] font-bold text-blue-400 uppercase">Pickup Code</p>
                  </div>
                  <p className="text-base font-black text-blue-700">{pickupCode}</p>
                </div>
              )}
              {tokenNumber && (
                <div className="rounded-xl bg-amber-50 p-3 border border-amber-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Hash className="w-3.5 h-3.5 text-amber-400" />
                    <p className="text-[10px] font-bold text-amber-400 uppercase">Token</p>
                  </div>
                  <p className="text-base font-black text-amber-700">{tokenNumber}</p>
                </div>
              )}
            </div>
          )}

          {/* Payment & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Payment</p>
              </div>
              <p className="text-sm font-bold text-slate-900">{paymentMethod}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Completion</p>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {order.completed_at ? formatDateTime(order.completed_at) : formatDateTime(order.created_at)}
              </p>
            </div>
          </div>

          {/* Ordered Items */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Ordered Items ({order.items.length})</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {order.items.length === 0 ? (
                <div className="px-4 py-4 text-center text-sm text-slate-400">No items recorded</div>
              ) : (
                order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {(item as any).image_url ? (
                        <img src={(item as any).image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                      {item.variant && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] text-slate-400 font-medium">{item.variant}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{item.quantity}x</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">{formatINR(item.price)} each</span>
                      </div>
                    </div>
                    <p className="text-sm font-black text-slate-900 shrink-0">{formatINR(item.price * item.quantity)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Kitchen & Counter Status */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Kitchen</p>
              <p className="text-xs font-bold text-slate-900">{order.kitchen_status || order.order_status || '—'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Counter</p>
              <p className="text-xs font-bold text-slate-900">{order.counter_status || '—'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Est. Ready</p>
              <p className="text-xs font-bold text-slate-900">{order.estimated_ready_at ? formatDateTime(order.estimated_ready_at) : '—'}</p>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="rounded-2xl border border-slate-200 p-4 space-y-2.5">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Convenience Fee</span>
              <span className="font-bold text-slate-900">{formatINR(convenienceFee)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Discount</span>
                <span className="font-bold">-{formatINR(discount)}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2.5 flex justify-between">
              <span className="text-base font-bold text-slate-900">Grand Total</span>
              <span className="text-xl font-black text-slate-900">{formatINR(grandTotal)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
