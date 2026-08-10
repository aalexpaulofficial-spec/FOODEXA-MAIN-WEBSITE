import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, PartyPopper, Clock, Hash, CreditCard, Building2, QrCode, Calendar, MapPin, Download, Star, ArrowRight } from 'lucide-react';
import type { Order } from '../../types';
import { formatINR, formatDateTime } from '../../lib/supabase-service';

interface OrderCompletionScreenProps {
  order: Order;
  institutionName: string;
  onViewReceipt: (order: Order) => void;
  onRateOrder: (order: Order) => void;
  onBackToMenu: () => void;
}

const ConfettiParticle = ({ delay, x, color, key }: { delay: number; x: number; color: string; key?: React.Key }) => (
  <motion.div
    initial={{ y: -20, x, opacity: 1, rotate: 0 }}
    animate={{ y: 600, x: x + (Math.random() - 0.5) * 200, opacity: 0, rotate: Math.random() * 720 - 360 }}
    transition={{ duration: 2.5 + Math.random() * 1.5, delay, ease: 'easeOut' }}
    className="fixed top-0 z-[100] pointer-events-none"
    style={{ left: `${x}vw` }}
  >
    <div className={`w-3 h-3 rounded-sm ${color}`} style={{ transform: `rotate(${Math.random() * 360}deg)` }} />
  </motion.div>
);

const confettiColors = [
  'bg-emerald-400', 'bg-teal-400', 'bg-blue-400', 'bg-violet-400',
  'bg-amber-400', 'bg-rose-400', 'bg-cyan-400', 'bg-pink-400',
];

export const OrderCompletionScreen: React.FC<OrderCompletionScreenProps> = ({
  order,
  institutionName,
  onViewReceipt,
  onRateOrder,
  onBackToMenu,
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    setHasAnimated(true);
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, [hasAnimated]);

  const orderNumber = order.order_number || order.order_id || '';
  const pickupCode = order.pickup_code || order.pickup_token || '';
  const tokenNumber = order.token_number || order.pickup_token || '';
  const paymentMethod = order.payment_method === 'razorpay' ? 'UPI / Razorpay'
    : order.payment_method === 'cash' ? 'Cash at Counter'
    : order.payment_method === 'wallet' ? 'FOODEXA Wallet'
    : order.payment_method || 'N/A';

  return (
    <div className="relative min-h-screen bg-[#1D1D1F] overflow-hidden">
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <>
            {Array.from({ length: 60 }).map((_, i) => (
              <ConfettiParticle
                key={`confetti-${i}`}
                delay={i * 0.04}
                x={Math.random() * 100}
                color={confettiColors[i % confettiColors.length]}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-teal-400/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-md mx-auto px-4 pt-12 pb-8 space-y-6">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-[#1D1D1F] flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={2.5} />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.5 }}
              className="absolute -top-2 -right-2"
            >
              <PartyPopper className="w-10 h-10 text-amber-500" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl font-black text-[#1D1D1F]">Thank You for Ordering!</h1>
          <p className="text-base text-[#6E6E73] font-medium">
            Your order has been successfully collected.
          </p>
          <p className="text-sm text-[#86868B]">
            We hope you enjoyed your meal. <br />
            Thank you for choosing <span className="font-bold text-[#30D158]">FOODEXA</span>.
          </p>
          <p className="text-xs text-[#86868B] font-semibold">Have a wonderful day!</p>
        </motion.div>

        {/* Glassmorphism Success Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 120 }}
          className="rounded-[24px] bg-white/70 backdrop-blur-xl border border-white/60 p-6 shadow-xl shadow-slate-200/50 space-y-5"
        >
          {/* Order Number */}
          <div className="text-center pb-4 border-b border-slate-200/60">
            <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-1">Order Number</p>
            <p className="text-2xl font-black text-[#1D1D1F] tracking-tight">{orderNumber}</p>
          </div>

          {/* Pickup & Token */}
          <div className="grid grid-cols-2 gap-3">
            {pickupCode && (
              <div className="rounded-[16px] bg-[#1D1D1F] border border-blue-200/50 p-4 text-center">
                <QrCode className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Pickup Code</p>
                <p className="text-lg font-black text-blue-700 mt-0.5">{pickupCode}</p>
              </div>
            )}
            {tokenNumber && (
              <div className="rounded-[16px] bg-[#1D1D1F] border border-amber-200/50 p-4 text-center">
                <Hash className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Token Number</p>
                <p className="text-lg font-black text-amber-700 mt-0.5">{tokenNumber}</p>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80">
              <Building2 className="w-4 h-4 text-[#86868B] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#86868B] uppercase">Institution</p>
                <p className="text-sm font-bold text-[#1D1D1F] truncate">{institutionName}</p>
              </div>
            </div>

            {order.counter && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80">
                <MapPin className="w-4 h-4 text-[#86868B] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-[#86868B] uppercase">Canteen / Counter</p>
                  <p className="text-sm font-bold text-[#1D1D1F] truncate">{order.counter}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80">
              <Calendar className="w-4 h-4 text-[#86868B] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#86868B] uppercase">Date & Time</p>
                <p className="text-sm font-bold text-[#1D1D1F]">
                  {order.completed_at ? formatDateTime(order.completed_at) : formatDateTime(order.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80">
              <CreditCard className="w-4 h-4 text-[#86868B] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#86868B] uppercase">Payment</p>
                <p className="text-sm font-bold text-[#1D1D1F]">{paymentMethod}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1D1D1F] border border-emerald-200/50">
              <p className="text-sm font-bold text-[#1D1D1F]">Total Paid</p>
              <p className="text-xl font-black text-emerald-700">{formatINR(order.total_amount)}</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <button
            onClick={() => onRateOrder(order)}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-[16px] bg-[#1D1D1F] text-white font-bold text-sm shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-orange-400 transition-all active:scale-[0.98]"
          >
            <Star className="w-5 h-5" />
            Rate Your Experience
          </button>

          <button
            onClick={() => onViewReceipt(order)}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-[16px] bg-white border border-slate-200 text-[#1D1D1F] font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            <Download className="w-5 h-5 text-[#86868B]" />
            View Tax Invoice
          </button>

          <button
            onClick={onBackToMenu}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-[16px] bg-slate-900 text-white font-bold text-sm shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            Continue Browsing
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};
