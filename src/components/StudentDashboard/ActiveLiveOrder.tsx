import React from 'react';
import { Clock, QrCode, CheckCircle2, XCircle, ChevronRight, Zap, MapPin, Hash, Star, User, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Order } from '../../types';
import { getTimelineLabel, getTimelineStage, isOrderCancelled, STUDENT_TIMELINE_LABELS, STUDENT_TIMELINE_DESCRIPTIONS } from '../../lib/orderTimeline';
import { formatINR } from '../../lib/supabase-service';

interface ActiveLiveOrderProps {
  orders: Order[];
  onTrack: (o: Order) => void;
  onQrOpen: (o: Order) => void;
  studentName?: string;
  studentId?: string;
  registrationId?: string;
}

export const ActiveLiveOrder: React.FC<ActiveLiveOrderProps> = ({
  orders,
  onTrack,
  onQrOpen,
  studentName,
  studentId,
  registrationId,
}) => {
  const order = orders[0];
  if (!order) return null;

  const stage = getTimelineStage(order.status);
  const stageLabel = getTimelineLabel(order.status);
  const isCancelled = isOrderCancelled(order.status);
  const isCompleted = order.status === 'completed';
  const isReady = order.status === 'ready';

  const orderNumber = order.order_number
    ? `#FX-${String(order.order_number).padStart(4, '0')}`
    : order.order_id || '';
  const pickupCode = order.pickup_code || order.pickup_token || '';
  const tokenNumber = order.token_number || order.pickup_token || '';
  const estimatedReadyTime = order.estimated_ready_at;
  const counterName = order.counter_name || order.counter || 'Counter';
  const canteenName = order.canteen_name || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full my-6 rounded-[24px] p-5 sm:p-6 text-white shadow-md relative overflow-hidden border"
      style={{
        background: isReady
          ? 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0891b2 100%)'
          : isCancelled
            ? 'linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)'
            : 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #3730a3 100%)',
        borderColor: isReady ? 'rgba(16, 185, 129, 0.3)' : isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)',
      }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-[16px] flex items-center justify-center ${
            isReady ? 'bg-[#30D158]/20 border border-emerald-400/30' : 'bg-blue-500/20 border border-blue-400/30'
          }`}>
            {isReady ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            ) : isCancelled ? (
              <XCircle className="w-5 h-5 text-red-300" />
            ) : (
              <Zap className="w-5 h-5 text-[#0071E3] animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0071E3] uppercase tracking-wider">
                {isReady ? 'Ready for Pickup' : isCancelled ? 'Order Cancelled' : 'Active Live Order'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#30D158]/20 text-emerald-300 border border-emerald-400/30 uppercase">
                {order.payment_status}
              </span>
            </div>
            {orderNumber && (
              <h3 className="text-lg font-bold text-white tracking-tight">
                Order {orderNumber}
              </h3>
            )}
          </div>
        </div>

        {!isCancelled && !isCompleted && (
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-[16px] border border-white/10 flex items-center gap-2 w-fit">
            <Clock className="w-4 h-4 text-[#0071E3] animate-spin" />
            <span className="text-xs text-slate-300">Est. Ready:</span>
            <span className="text-sm font-extrabold text-white">
              {estimatedReadyTime
                ? new Date(estimatedReadyTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                : 'Calculating...'}
            </span>
          </div>
        )}
      </div>

      {/* Items with quantities */}
      <div className="my-4 space-y-2">
        <p className="text-xs text-[#86868B] uppercase font-bold tracking-wider">Items Ordered</p>
        {order.items.length > 0 ? (
          <div className="space-y-1">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-white font-semibold">
                  {item.name} <span className="text-cyan-300 font-bold">x{item.quantity}</span>
                </span>
                <span className="text-white font-bold">{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/60">No items</p>
        )}
      </div>

      {/* Counter & Pickup Info */}
      <div className="my-4 grid grid-cols-2 gap-2">
        <div className="bg-white/10 backdrop-blur-md rounded-[12px] p-3 border border-white/10">
          <p className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Pickup Counter
          </p>
          <p className="text-sm font-extrabold text-white mt-0.5">{counterName}</p>
          {canteenName && <p className="text-[10px] text-white/50 mt-0.5">{canteenName}</p>}
        </div>
        {tokenNumber && (
          <div className="bg-white/10 backdrop-blur-md rounded-[12px] p-3 border border-white/10">
            <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
              <Hash className="w-3 h-3" /> Token Number
            </p>
            <p className="text-sm font-extrabold text-white mt-0.5">{tokenNumber}</p>
          </div>
        )}
        {pickupCode && (
          <div className="bg-white/10 backdrop-blur-md rounded-[12px] p-3 border border-white/10">
            <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
              <QrCode className="w-3 h-3" /> Pickup Code
            </p>
            <p className="text-sm font-extrabold text-white mt-0.5">{pickupCode}</p>
          </div>
        )}
        {studentId && (
          <div className="bg-white/10 backdrop-blur-md rounded-[12px] p-3 border border-white/10">
            <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" /> Student ID
            </p>
            <p className="text-sm font-extrabold text-white mt-0.5">{studentId}</p>
          </div>
        )}
      </div>

      {/* 5-Step Mini Timeline */}
      {!isCancelled && (
        <div className="my-4">
          <div className="flex items-center gap-1">
            {STUDENT_TIMELINE_LABELS.map((label, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                  i < stage ? 'bg-white/20 text-white' :
                  i === stage ? 'bg-white text-[#1D1D1F] shadow-lg' :
                  'bg-white/5 text-white/40'
                }`}>
                  {i < stage ? <CheckCircle2 className="w-3 h-3" /> : <span>{i + 1}</span>}
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < STUDENT_TIMELINE_LABELS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full ${i < stage ? 'bg-white/40' : 'bg-white/10'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Pickup Code Display (when ready) */}
      {isReady && pickupCode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="my-4 bg-white/10 backdrop-blur-md rounded-[16px] p-4 border border-white/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider">Your Pickup Code</p>
              <p className="text-2xl font-black text-white tracking-wider mt-1">{pickupCode}</p>
            </div>
            {tokenNumber && (
              <div className="text-right">
                <p className="text-xs text-amber-300 font-bold uppercase tracking-wider">Token</p>
                <p className="text-xl font-black text-white mt-1">{tokenNumber}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-emerald-200 mt-2">Show this code at {counterName}.</p>
        </motion.div>
      )}

      {/* Status Label */}
      <div className="my-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#0071E3] flex items-center gap-1">
            {isCancelled ? (
              <XCircle className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            {stageLabel}
          </span>
          <span className="font-bold text-white">{formatINR(order.total_amount)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 pt-3 border-t border-white/10 relative z-10">
        <button
          onClick={() => onQrOpen(order)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-[16px] bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all"
        >
          <QrCode className="w-4 h-4 text-[#0071E3]" />
          {isReady ? 'Show Pickup QR' : 'Show QR Pickup'}
        </button>

        <button
          onClick={() => onTrack(order)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-[16px] bg-[#0071E3] hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all"
        >
          <span>Track Live Timeline</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
