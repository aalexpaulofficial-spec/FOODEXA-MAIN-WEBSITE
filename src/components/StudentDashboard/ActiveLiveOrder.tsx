import React from 'react';
import { Clock, QrCode, CheckCircle2, XCircle, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Order } from '../../types';
import { getTimelineLabel, getTimelineDescription, isOrderCancelled } from '../../lib/orderTimeline';

interface ActiveLiveOrderProps {
  orders: Order[];
  onTrack: (o: Order) => void;
  onQrOpen: (o: Order) => void;
}

export const ActiveLiveOrder: React.FC<ActiveLiveOrderProps> = ({
  orders,
  onTrack,
  onQrOpen,
}) => {
  const order = orders[0];
  if (!order) return null;

  const stageLabel = getTimelineLabel(order.status);
  const isCancelled = isOrderCancelled(order.status);
  const isCompleted = order.status === 'completed';

  const orderNumber = order.order_number || order.order_id?.replace('#FX-', '') || String(order.id).slice(-8).toUpperCase();

  const estimatedReadyTime = order.estimated_ready_at;

  return (
    <div className="w-full my-6 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border border-blue-500/30">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-cyan-300">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Active Live Order</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">
                {order.payment_status}
              </span>
            </div>
            {orderNumber && (
              <h3 className="text-lg font-bold text-white tracking-tight">
                Order #{orderNumber}
              </h3>
            )}
          </div>
        </div>

        {!isCancelled && !isCompleted && (
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 flex items-center gap-2 w-fit">
            <Clock className="w-4 h-4 text-cyan-300 animate-spin" />
            <span className="text-xs text-slate-300">Est. Ready:</span>
            <span className="text-sm font-extrabold text-white">
              {estimatedReadyTime
                ? new Date(estimatedReadyTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                : 'Calculating...'}
            </span>
          </div>
        )}
      </div>

      <div className="my-4 space-y-2">
        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Items Ordered</p>
        <p className="text-sm font-semibold text-white line-clamp-1">
          {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'No items'}
        </p>
        {order.counter && (
          <p className="text-xs text-cyan-200">📍 {order.counter}</p>
        )}
      </div>

      <div className="my-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-cyan-300 flex items-center gap-1">
            {isCancelled ? (
              <XCircle className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            {stageLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Kitchen Status</p>
            <p className="text-sm font-extrabold text-white mt-0.5">{order.kitchen_status || order.status || '—'}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Counter Status</p>
            <p className="text-sm font-extrabold text-white mt-0.5">{order.counter_status || '—'}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Order Status</p>
            <p className="text-sm font-extrabold text-white mt-0.5">{order.order_status || order.status || '—'}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Completion Time</p>
            <p className="text-sm font-extrabold text-white mt-0.5">{order.completed_at ? new Date(order.completed_at).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 pt-3 border-t border-white/10 relative z-10">
        <button
          onClick={() => onQrOpen(order)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all"
        >
          <QrCode className="w-4 h-4 text-cyan-300" />
          Show QR Pickup
        </button>

        <button
          onClick={() => onTrack(order)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all"
        >
          <span>Track Live Timeline</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};