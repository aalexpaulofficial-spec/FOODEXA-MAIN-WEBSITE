import React, { useState } from 'react';
import { Receipt, RotateCcw, FileText, Package, CheckCircle2, XCircle, Eye, Star, MapPin, Clock, Hash, ChevronDown, ChevronUp, Leaf, Building2, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order } from '../../types';
import { formatINR, formatDateTime } from '../../lib/supabase-service';
import { OrderDetailsModal } from './OrderDetailsModal';
import { TaxInvoiceModal } from './TaxInvoiceModal';
import { OrderRatingModal } from './OrderRatingModal';

const statusLabel = (s: Order['status']): string => {
  const m: Record<Order['status'], string> = {
    pending: 'Payment Successful', payment_successful: 'Payment Successful', accepted: 'Accepted', confirmed: 'Confirmed', preparing: 'Preparing', cooking: 'Cooking', quality_check: 'Quality Check', packed: 'Packed',
    ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled',
  };
  return m[s] || s;
};

const statusStyle = (s: Order['status']): string => {
  const m: Record<Order['status'], string> = {
    pending: 'bg-blue-50 text-blue-700 border-blue-200', payment_successful: 'bg-blue-50 text-blue-700 border-blue-200',
    accepted: 'bg-blue-50 text-blue-700 border-blue-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    preparing: 'bg-violet-50 text-violet-700 border-violet-200',
    cooking: 'bg-orange-50 text-orange-700 border-orange-200',
    quality_check: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    packed: 'bg-teal-50 text-teal-700 border-teal-200',
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
  };
  return m[s] || 'bg-slate-100 text-[#6E6E73] border-slate-200';
};

const statusDotColor = (s: Order['status']): string => {
  const m: Record<Order['status'], string> = {
    pending: 'bg-blue-400', payment_successful: 'bg-blue-400', accepted: 'bg-blue-400', confirmed: 'bg-blue-400', preparing: 'bg-violet-400',
    cooking: 'bg-orange-400', quality_check: 'bg-indigo-400', packed: 'bg-teal-400',
    ready: 'bg-emerald-400', completed: 'bg-emerald-500', cancelled: 'bg-red-400',
  };
  return m[s] || 'bg-slate-400';
};

interface HistoryTabProps {
  pastOrders: Order[];
  onReorder: (order: Order) => void;
  onGoExplore: () => void;
  institutionName: string;
  userId: string;
  studentName?: string;
  studentId?: string;
  registrationId?: string;
  itemsLoading?: boolean;
  itemsError?: string;
  onRetryItems?: () => void;
  triggerToast?: (title: string, description: string, type?: 'success' | 'warning' | 'info') => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  pastOrders,
  onReorder,
  onGoExplore,
  institutionName,
  userId,
  studentName,
  studentId,
  registrationId,
  itemsLoading,
  itemsError,
  onRetryItems,
  triggerToast,
}) => {
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  if (pastOrders.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="p-4 max-w-2xl mx-auto">
          <h2 className="text-xl font-black text-[#1D1D1F] mb-6 tracking-tight">Order History</h2>
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-[#1D1D1F]">No orders yet</p>
            <p className="text-xs text-[#86868B] mt-1 mb-5">Your completed FOODEXA orders will appear here.</p>
            <button
              onClick={onGoExplore}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071E3] text-white text-xs font-bold hover:bg-[#0066CC] transition-colors shadow-md shadow-blue-500/20"
            >
              Browse Menu
            </button>
          </div>
        </div>

        {detailsOrder && (
          <OrderDetailsModal isOpen={true} onClose={() => setDetailsOrder(null)} order={detailsOrder} institutionName={institutionName} studentName={studentName} studentId={studentId} registrationId={registrationId} itemsLoading={itemsLoading} itemsError={itemsError} onRetryItems={onRetryItems} />
        )}
        {invoiceOrder && (
          <TaxInvoiceModal isOpen={true} onClose={() => setInvoiceOrder(null)} order={invoiceOrder} institutionName={institutionName} studentName={studentName} studentId={studentId} registrationId={registrationId} itemsLoading={itemsLoading} itemsError={itemsError} onRetryItems={onRetryItems} />
        )}
        {ratingOrder && (
          <OrderRatingModal isOpen={true} onClose={() => setRatingOrder(null)} order={ratingOrder} userId={userId} triggerToast={triggerToast} />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-32 relative">
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#1D1D1F] tracking-tight">Order History</h2>
            <p className="text-xs text-[#86868B] mt-0.5">{pastOrders.length} past order{pastOrders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Orders */}
        <div className="space-y-3">
          {pastOrders.slice(0, 30).map((order, idx) => {
            const isCancelled = order.status === 'cancelled';
            const isCompleted = order.status === 'completed';
            const orderNumber = order.order_number
              ? `#FX-${String(order.order_number).padStart(4, '0')}`
              : order.order_id || `#FX-${String(order.id).slice(-4).toUpperCase()}`;
            const pickupCode = order.pickup_code || order.pickup_token || '';
            const isExpanded = expandedOrder === order.id;

            // Format date and time
            const orderDate = order.created_at ? new Date(order.created_at) : null;
            const dateStr = orderDate ? orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
            const timeStr = orderDate ? orderDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '';
            const completedTime = order.completed_at ? new Date(order.completed_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : null;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="rounded-[16px] border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-all duration-200"
              >
                {/* Card Header */}
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${
                      isCompleted ? 'bg-[#30D158]/10 border border-[#30D158]/20' : isCancelled ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-200'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-[#30D158]" />
                      ) : isCancelled ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <Package className="w-5 h-5 text-[#86868B]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-[#1D1D1F] text-sm tracking-tight">{orderNumber}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusStyle(order.status)}`}>
                          <span className={`w-1 h-1 rounded-full ${statusDotColor(order.status)}`} />
                          {statusLabel(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[11px] text-[#86868B] font-medium">{dateStr}</p>
                        {timeStr && (
                          <>
                            <span className="text-[#86868B]">·</span>
                            <p className="text-[11px] text-[#86868B] font-medium">{timeStr}</p>
                          </>
                        )}
                        {isCompleted && completedTime && (
                          <>
                            <span className="text-[#86868B]">·</span>
                            <p className="text-[11px] text-[#30D158] font-bold">Completed {completedTime}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-base font-black text-[#1D1D1F]">{formatINR(order.total_amount)}</p>
                    {order.payment_status && (
                      <p className="text-[9px] font-bold text-[#30D158] uppercase tracking-wider mt-0.5">{order.payment_status}</p>
                    )}
                  </div>
                </div>

                {/* Items Preview */}
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#86868B] mb-2">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="font-medium truncate">
                      {order.canteen_name || order.counter_name || order.counter || institutionName}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {order.items.slice(0, isExpanded ? order.items.length : 2).map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {item.is_veg !== null && item.is_veg !== undefined && (
                            <span className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${item.is_veg ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                              <Leaf className={`w-2 h-2 ${item.is_veg ? 'text-green-600' : 'text-red-600'}`} />
                            </span>
                          )}
                          <span className="text-[#1D1D1F] font-semibold truncate">{item.quantity}x {item.name}</span>
                        </div>
                        <span className="text-[#1D1D1F] font-bold shrink-0 ml-2">{formatINR(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {order.items.length > 2 && !isExpanded && (
                      <button
                        onClick={() => setExpandedOrder(order.id)}
                        className="flex items-center gap-1 text-[10px] text-[#0071E3] font-bold mt-1 hover:underline"
                      >
                        <ChevronDown className="w-3 h-3" />
                        +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                      </button>
                    )}
                    {isExpanded && order.items.length > 2 && (
                      <button
                        onClick={() => setExpandedOrder(null)}
                        className="flex items-center gap-1 text-[10px] text-[#0071E3] font-bold mt-1 hover:underline"
                      >
                        <ChevronUp className="w-3 h-3" />
                        Show less
                      </button>
                    )}
                  </div>

                  {/* Pickup code & token badges */}
                  {pickupCode && (
                    <div className="flex gap-2 mt-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-[10px] font-bold text-[#0071E3] border border-blue-100">
                        <Hash className="w-2.5 h-2.5" /> {pickupCode}
                      </span>
                      {order.token_number && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-[10px] font-bold text-amber-700 border border-amber-100">
                          Token: {order.token_number}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Cancellation audit */}
                  {isCancelled && (order.cancelled_by || order.cancelled_at) && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-[11px] text-red-600">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium">
                        Cancelled{order.cancelled_by ? ` by ${order.cancelled_by}` : ''}
                        {order.cancelled_at ? ` · ${formatDateTime(order.cancelled_at)}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setDetailsOrder(order)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-[#1D1D1F] hover:bg-slate-50 transition-colors"
                    >
                      <Eye className="w-3 h-3" /> Details
                    </button>
                    <button
                      onClick={() => setInvoiceOrder(order)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-[#1D1D1F] hover:bg-slate-50 transition-colors"
                    >
                      <FileText className="w-3 h-3" /> Invoice
                    </button>
                    {isCompleted && (
                      <button
                        onClick={() => setRatingOrder(order)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-[10px] font-bold text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <Star className="w-3 h-3" /> Rate
                      </button>
                    )}
                  </div>
                  {!isCancelled && (
                    <button
                      onClick={() => onReorder(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0071E3] text-white text-[10px] font-bold hover:bg-[#0066CC] transition-colors shadow-sm shadow-blue-500/20"
                    >
                      <RotateCcw className="w-3 h-3" /> Reorder
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {detailsOrder && (
        <OrderDetailsModal isOpen={true} onClose={() => setDetailsOrder(null)} order={detailsOrder} institutionName={institutionName} studentName={studentName} studentId={studentId} registrationId={registrationId} itemsLoading={itemsLoading} itemsError={itemsError} onRetryItems={onRetryItems} />
      )}
      {invoiceOrder && (
        <TaxInvoiceModal isOpen={true} onClose={() => setInvoiceOrder(null)} order={invoiceOrder} institutionName={institutionName} studentName={studentName} studentId={studentId} registrationId={registrationId} itemsLoading={itemsLoading} itemsError={itemsError} onRetryItems={onRetryItems} />
      )}
      {ratingOrder && (
        <OrderRatingModal isOpen={true} onClose={() => setRatingOrder(null)} order={ratingOrder} userId={userId} triggerToast={triggerToast} />
      )}
    </div>
  );
};
