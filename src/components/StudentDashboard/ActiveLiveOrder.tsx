import React, { useState, useEffect } from 'react';
import { Clock, QrCode, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Order, OrderStatus } from '../../types';

const STAGES_ORDER = [
  'pending',
  'accepted',
  'preparing',
  'cooking',
  'quality_check',
  'packed',
  'ready',
  'completed'
];

const statusLabel = (s: string): string => {
  const m: Record<string, string> = {
    pending: 'Order Confirmed',
    accepted: 'Kitchen Accepted',
    preparing: 'Preparing',
    cooking: 'Cooking',
    quality_check: 'Quality Check',
    packed: 'Packed & Sealed',
    ready: 'Ready for Pickup',
    completed: 'Collected',
    cancelled: 'Cancelled',
  };
  return m[s] || s;
};

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
  const [elapsed, setElapsed] = useState(0);
  const order = orders[0];

  useEffect(() => {
    if (!order) return;
    const base = order.paid_at
      ? new Date(order.paid_at).getTime()
      : new Date(order.created_at).getTime();
    setElapsed(Date.now() - base);
    const timer = setInterval(() => setElapsed(Date.now() - base), 1000);
    return () => clearInterval(timer);
  }, [order?.paid_at, order?.created_at]);

  if (!order) return null;

  const currentStageIndex = STAGES_ORDER.indexOf(order.status) >= 0 ? STAGES_ORDER.indexOf(order.status) : 0;
  const progressPct = Math.round(((currentStageIndex + 1) / STAGES_ORDER.length) * 100);

  const prepMinutes = (order as any).estimated_prep_time_minutes || 15;
  const remainingMs = Math.max(0, prepMinutes * 60 * 1000 - elapsed);
  const mins = Math.floor(remainingMs / 60000);
  const secs = Math.floor((remainingMs % 60000) / 1000);

  const formatRemaining = () => {
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const orderNum = (order as any).order_number || order.order_id?.slice(-8).toUpperCase();

  return (
    <div className="w-full my-6 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border border-blue-500/30">
      {/* Background Glow */}
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
            {orderNum && (
              <h3 className="text-lg font-bold text-white tracking-tight">
                Order #{orderNum}
              </h3>
            )}
          </div>
        </div>

        {order.status !== 'ready' && order.status !== 'completed' && (
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 flex items-center gap-2 w-fit">
            <Clock className="w-4 h-4 text-cyan-300 animate-spin" />
            <span className="text-xs text-slate-300">Est. Time:</span>
            <span className="text-sm font-extrabold text-white">
              {formatRemaining()}
            </span>
          </div>
        )}
      </div>

      {/* Items Summary */}
      <div className="my-4">
        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Items Ordered</p>
        <p className="text-sm font-semibold text-white line-clamp-1">
          {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
        </p>
        {order.counter && (
          <p className="text-xs text-cyan-200 mt-1">
            📍 {order.counter}
          </p>
        )}
      </div>

      {/* Animated Stage Progress */}
      <div className="my-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-bold text-cyan-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Stage: {statusLabel(order.status)}
          </span>
          <span className="text-slate-400 font-semibold">{progressPct}% Complete</span>
        </div>

        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          ></motion.div>
        </div>
      </div>

      {/* Actions */}
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
