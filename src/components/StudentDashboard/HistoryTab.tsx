import React, { useState } from 'react';
import { Receipt, RotateCcw, FileText, Package, CheckCircle2, XCircle, Download, X } from 'lucide-react';
import type { Order, OrderStatus, MenuItem } from '../../types';
import { formatINR, generateReceipt } from '../../lib/supabase-service';

const formatDate = (d: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const statusLabel = (s: OrderStatus): string => {
  const m: Record<OrderStatus, string> = {
    pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing',
    ready: 'Ready', completed: 'Completed', cancelled: 'Refunded',
  };
  return m[s] || s;
};

const statusStyle = (s: OrderStatus): string => {
  const m: Record<OrderStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-blue-50 text-blue-700 border-blue-200',
    preparing: 'bg-violet-50 text-violet-700 border-violet-200',
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-blue-50 text-blue-600 border-blue-200',
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
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

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

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Order History</h2>
            <p className="text-xs text-slate-500 mt-0.5">{pastOrders.length} past order{pastOrders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Order List */}
        <div className="space-y-4">
          {pastOrders.slice(0, 30).map(order => {
            const isCancelled = order.status === 'cancelled';
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                {/* Header */}
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

                {/* Items */}
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

                {/* Footer */}
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

      {/* RECEIPT MODAL */}
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
