import React, { useState } from 'react';
import { Receipt, RotateCcw, FileText, Package, CheckCircle2, XCircle, Eye, ChevronRight, Star, MapPin, Clock, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Order } from '../../types';
import { formatINR, formatDateTime } from '../../lib/supabase-service';
import { OrderDetailsModal } from './OrderDetailsModal';
import { TaxInvoiceModal } from './TaxInvoiceModal';
import { OrderRatingModal } from './OrderRatingModal';

const statusLabel = (s: Order['status']): string => {
  const m: Record<Order['status'], string> = {
    pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing', cooking: 'Cooking', quality_check: 'Quality Check', packed: 'Packed',
    ready: 'Ready', completed: 'Completed', cancelled: 'Refunded',
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
  return m[s] || 'bg-slate-100 text-[#6E6E73] border-slate-200';
};

interface HistoryTabProps {
  pastOrders: Order[];
  onReorder: (order: Order) => void;
  onGoExplore: () => void;
  institutionName: string;
  userId: string;
  triggerToast?: (title: string, description: string, type?: 'success' | 'warning' | 'info') => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  pastOrders,
  onReorder,
  onGoExplore,
  institutionName,
  userId,
  triggerToast,
}) => {
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);

  if (pastOrders.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="p-4 max-w-2xl mx-auto">
          <h2 className="text-xl font-black text-[#1D1D1F] mb-6">Order History</h2>
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-sm font-bold text-[#86868B]">No orders yet</p>
            <p className="text-xs text-[#86868B] mt-1 mb-5">Start ordering from the campus menu</p>
            <button
              onClick={onGoExplore}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/30"
            >
              Browse Menu <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {detailsOrder && (
          <OrderDetailsModal isOpen={true} onClose={() => setDetailsOrder(null)} order={detailsOrder} institutionName={institutionName} />
        )}
        {invoiceOrder && (
          <TaxInvoiceModal isOpen={true} onClose={() => setInvoiceOrder(null)} order={invoiceOrder} institutionName={institutionName} />
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#1D1D1F]">Order History</h2>
            <p className="text-xs text-[#86868B] mt-0.5">{pastOrders.length} past order{pastOrders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="space-y-4">
          {pastOrders.slice(0, 30).map((order, idx) => {
            const isCancelled = order.status === 'cancelled';
            const isCompleted = order.status === 'completed';
            const orderNumber = order.order_number || order.order_id || `#FX-${String(order.id).slice(-4).toUpperCase()}`;
            const pickupCode = order.pickup_code || order.pickup_token || '';
            const tokenNumber = order.token_number || order.pickup_token || '';

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-[16px] border border-slate-200 bg-white shadow-sm overflow-hidden hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                {/* Card Header */}
                <div className="px-4 py-3 flex items-start justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isCompleted ? 'bg-emerald-50 border border-emerald-200' : isCancelled ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-200'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5 text-[#30D158]" /> : isCancelled ? <XCircle className="w-5 h-5 text-red-500" /> : <Package className="w-5 h-5 text-[#86868B]" />}
                    </div>
                    <div>
                      <h3 className="font-black text-[#1D1D1F] text-sm">{orderNumber}</h3>
                      <p className="text-[11px] text-[#86868B] font-medium mt-0.5">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusStyle(order.status)}`}>
                    {statusLabel(order.status)}
                  </span>
                </div>

                {/* Card Body - Items */}
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#86868B]">
                    <MapPin className="w-3 h-3" />
                    <span className="font-medium">{order.counter || institutionName}</span>
                  </div>

                  <div className="space-y-1">
                    {order.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-[#1D1D1F] font-semibold truncate flex-1 pr-2">{item.quantity}x {item.name}</span>
                        <span className="text-[#1D1D1F] font-bold shrink-0">{formatINR(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-[10px] text-[#86868B] font-medium">+{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}</p>
                    )}
                  </div>

                  {/* Pickup & Token */}
                  {(pickupCode || tokenNumber) && (
                    <div className="flex gap-2 mt-1">
                      {pickupCode && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-100">
                          <Hash className="w-2.5 h-2.5" /> {pickupCode}
                        </span>
                      )}
                      {tokenNumber && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-[10px] font-bold text-amber-600 border border-amber-100">
                          Token: {tokenNumber}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Total Paid</p>
                    <p className="text-lg font-black text-[#1D1D1F]">{formatINR(order.total_amount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDetailsOrder(order)}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#1D1D1F] hover:bg-slate-50 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                    <button
                      onClick={() => setInvoiceOrder(order)}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#1D1D1F] hover:bg-slate-50 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> Invoice
                    </button>
                    {isCompleted && (
                      <button
                        onClick={() => setRatingOrder(order)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" /> Rate
                      </button>
                    )}
                    {!isCancelled && (
                      <button
                        onClick={() => onReorder(order)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reorder
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {detailsOrder && (
        <OrderDetailsModal isOpen={true} onClose={() => setDetailsOrder(null)} order={detailsOrder} institutionName={institutionName} />
      )}
      {invoiceOrder && (
        <TaxInvoiceModal isOpen={true} onClose={() => setInvoiceOrder(null)} order={invoiceOrder} institutionName={institutionName} />
      )}
      {ratingOrder && (
        <OrderRatingModal isOpen={true} onClose={() => setRatingOrder(null)} order={ratingOrder} userId={userId} triggerToast={triggerToast} />
      )}
    </div>
  );
};
