import React from 'react';
import { Receipt, RotateCcw, FileText, Package, CheckCircle2, XCircle } from 'lucide-react';
import type { Order, OrderStatus, MenuItem } from '../../types';
import { formatINR } from '../../lib/supabase-service';

const formatDate = (d: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const statusLabel = (s: OrderStatus): string => {
  const m: Record<OrderStatus, string> = {
    pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing',
    ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled',
  };
  return m[s] || s;
};

const statusStyle = (s: OrderStatus): string => {
  const m: Record<OrderStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-blue-50 text-blue-700 border-blue-200',
    preparing: 'bg-violet-50 text-violet-700 border-violet-200',
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-slate-100 text-slate-600 border-slate-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
  };
  return m[s] || 'bg-slate-100 text-slate-600 border-slate-200';
};

interface HistoryTabProps {
  pastOrders: Order[];
  menuItems: MenuItem[];
  onReorder: (order: Order) => void;
  onGoExplore: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  pastOrders,
  menuItems,
  onReorder,
  onGoExplore,
}) => {
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
    <div className="flex-1 overflow-y-auto pb-32">
      <div className="p-4 space-y-4 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Order History</h2>
            <p className="text-xs text-slate-500 mt-0.5">{pastOrders.length} past order{pastOrders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Order List */}
        <div className="space-y-3">
          {pastOrders.slice(0, 30).map(order => {
            const isCancelled = order.status === 'cancelled';
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                {/* Card header */}
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {/* Status indicator + counter */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusStyle(order.status)}`}>
                          {order.status === 'completed'
                            ? <CheckCircle2 className="w-3 h-3" />
                            : order.status === 'cancelled'
                              ? <XCircle className="w-3 h-3" />
                              : <Package className="w-3 h-3" />
                          }
                          {statusLabel(order.status)}
                        </span>
                        {order.order_number && (
                          <span className="text-[9px] font-mono text-slate-400">#{order.order_number}</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-900 truncate">{order.counter || 'Campus Counter'}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{formatDate(order.created_at)}</p>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-slate-900">{formatINR(order.total_amount)}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="mt-2.5 space-y-1">
                    {order.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between text-[11px]">
                        <span className="text-slate-600 font-medium truncate">{item.quantity}× {item.name}</span>
                        <span className="text-slate-500 ml-2 shrink-0">{formatINR(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-[10px] text-slate-400">+{order.items.length - 3} more items</p>
                    )}
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="px-4 pb-4 flex gap-2.5">
                  {/* Tax Invoice */}
                  <button
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                    onClick={() => {
                      // Future: generate PDF invoice
                      alert(`Tax Invoice for order #${order.order_number || order.order_id} will be generated.`);
                    }}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Tax Invoice
                  </button>

                  {/* Reorder */}
                  {!isCancelled && (
                    <button
                      onClick={() => onReorder(order)}
                      className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-colors ml-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reorder
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
