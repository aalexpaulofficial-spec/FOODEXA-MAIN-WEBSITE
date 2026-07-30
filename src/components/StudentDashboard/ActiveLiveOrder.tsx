import React, { useState, useEffect } from 'react';
import { Clock, QrCode, Zap, CheckCircle } from 'lucide-react';
import type { Order, OrderStatus } from '../../types';

const statusLabel = (s: OrderStatus): string => {
  const m: Record<OrderStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    preparing: 'Cooking',
    ready: 'Ready for Pickup',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return m[s] || s;
};

const statusColor = (s: OrderStatus): string => {
  const m: Record<OrderStatus, string> = {
    pending: 'text-amber-300 border-amber-500/40 bg-amber-950/50',
    accepted: 'text-blue-300 border-blue-500/40 bg-blue-950/50',
    preparing: 'text-violet-300 border-violet-500/40 bg-violet-950/50',
    ready: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60',
    completed: 'text-slate-400 border-slate-700 bg-slate-900',
    cancelled: 'text-red-300 border-red-500/40 bg-red-950/50',
  };
  return m[s] || 'text-slate-300 border-slate-700 bg-slate-900';
};

const statusDot = (s: OrderStatus): string => {
  const m: Record<OrderStatus, string> = {
    pending: 'bg-amber-400',
    accepted: 'bg-blue-400',
    preparing: 'bg-violet-400',
    ready: 'bg-emerald-400',
    completed: 'bg-slate-400',
    cancelled: 'bg-red-400',
  };
  return m[s] || 'bg-slate-400';
};

const statusPercent = (s: OrderStatus): number => {
  const m: Record<OrderStatus, number> = {
    pending: 10,
    accepted: 30,
    preparing: 60,
    ready: 95,
    completed: 100,
    cancelled: 0,
  };
  return m[s] || 0;
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

  const prepMinutes = (order as any).estimated_prep_time_minutes || 15;
  const progress = Math.min(100, (elapsed / (prepMinutes * 60 * 1000)) * 100);
  const remainingMs = Math.max(0, prepMinutes * 60 * 1000 - elapsed);
  const mins = Math.floor(remainingMs / 60000);
  const secs = Math.floor((remainingMs % 60000) / 1000);

  const stagePercent = statusPercent(order.status);
  const isReady = order.status === 'ready';
  const orderNum = (order as any).order_number || order.order_id?.slice(-8).toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-xl">
      {/* Deep navy/indigo gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1b3a] via-[#1e2050] to-slate-900 rounded-3xl" />
      {/* Subtle blue glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 via-transparent to-cyan-500/8 pointer-events-none rounded-3xl" />
      {/* Glow orbs */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">
                  ⚡ ACTIVE LIVE ORDER
                </h3>
                {/* Paid badge */}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-black text-emerald-300">
                  <CheckCircle className="w-2.5 h-2.5" /> PAID
                </span>
              </div>
              {orderNum && (
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Order #{orderNum}
                </p>
              )}
            </div>
          </div>

          {/* Status + Countdown pill */}
          <div className="flex flex-col items-end gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black ${statusColor(order.status)}`}>
              <span className={`h-1.5 w-1.5 rounded-full inline-block ${statusDot(order.status)} animate-pulse`} />
              {statusLabel(order.status)}
            </span>
            {!isReady && (
              <div className="flex items-center gap-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 px-2.5 py-1">
                <Clock className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] font-mono font-bold text-white">
                  Est. {mins}:{secs.toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Items ordered */}
        <div>
          <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Items Ordered
          </p>
          <p className="text-sm font-bold text-white line-clamp-1">
            {order.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
          </p>
          {order.counter && (
            <p className="text-[10px] text-blue-300 flex items-center gap-1 mt-1">
              📍 {order.counter}
            </p>
          )}
        </div>

        {/* Progress section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-slate-400">
              Stage: <span className="text-blue-300 font-bold">{statusLabel(order.status)}</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {Math.round(stagePercent)}%
            </span>
          </div>
          {/* Glowing progress bar */}
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${stagePercent}%`,
                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                boxShadow: stagePercent > 0 ? '0 0 8px rgba(59, 130, 246, 0.6)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onQrOpen(order)}
            className="flex-1 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs font-bold text-blue-300 hover:bg-blue-500/20 hover:border-blue-400/50 transition-all active:scale-[0.97] flex items-center justify-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            Show QR Pickup
          </button>
          <button
            onClick={() => onTrack(order)}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-xs font-black text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-400 hover:to-cyan-400 transition-all active:scale-[0.97]"
            style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' }}
          >
            Track Live Timeline →
          </button>
        </div>
      </div>
    </div>
  );
};
