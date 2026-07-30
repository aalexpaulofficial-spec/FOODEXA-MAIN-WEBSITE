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
    pending: 'text-amber-600 bg-amber-50 border-amber-200',
    accepted: 'text-blue-600 bg-blue-50 border-blue-200',
    preparing: 'text-violet-600 bg-violet-50 border-violet-200',
    ready: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    completed: 'text-slate-600 bg-slate-100 border-slate-200',
    cancelled: 'text-red-600 bg-red-50 border-red-200',
  };
  return m[s] || 'text-slate-600 bg-slate-100 border-slate-200';
};

const statusDot = (s: OrderStatus): string => {
  const m: Record<OrderStatus, string> = {
    pending: 'bg-amber-500',
    accepted: 'bg-blue-500',
    preparing: 'bg-violet-500',
    ready: 'bg-emerald-500',
    completed: 'bg-slate-500',
    cancelled: 'bg-red-500',
  };
  return m[s] || 'bg-slate-500';
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
    <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-[#E2E8F0]">
      <div className="relative z-10 p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                  ⚡ ACTIVE LIVE ORDER
                </h3>
                {/* Paid badge */}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">
                  <CheckCircle className="w-2.5 h-2.5" /> PAID
                </span>
              </div>
              {orderNum && (
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
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
              <div className="flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] font-mono font-bold text-slate-700">
                  Est. {mins}:{secs.toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Items ordered */}
        <div>
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Items Ordered
          </p>
          <p className="text-sm font-bold text-slate-900 line-clamp-1">
            {order.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
          </p>
          {order.counter && (
            <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
              📍 {order.counter}
            </p>
          )}
        </div>

        {/* Progress section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-slate-500">
              Stage: <span className="text-emerald-600 font-bold">{statusLabel(order.status)}</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-500">
              {Math.round(stagePercent)}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${stagePercent}%`,
                background: 'linear-gradient(90deg, #10B981, #0D9488)',
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onQrOpen(order)}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5" />
            Show QR Pickup
          </button>
          <button
            onClick={() => onTrack(order)}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all active:scale-[0.97]"
          >
            Track Live Timeline →
          </button>
        </div>
      </div>
    </div>
  );
};
