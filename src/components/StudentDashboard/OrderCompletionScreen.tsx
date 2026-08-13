import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, PartyPopper, Clock, Hash, CreditCard, Building2, QrCode,
  Calendar, MapPin, Download, Star, ArrowRight, RotateCcw, Receipt,
  Utensils, Smile, Handshake, PackageCheck, Loader2, Send, Leaf
} from 'lucide-react';
import type { Order } from '../../types';
import { formatINR, formatDateTime } from '../../lib/supabase-service';
import { supabase } from '../../lib/supabase';

interface OrderCompletionScreenProps {
  order: Order;
  institutionName: string;
  onViewReceipt: (order: Order) => void;
  onRateOrder: (order: Order) => void;
  onBackToMenu: () => void;
  onOrderAgain?: (order: Order) => void;
}

const ConfettiParticle = ({ delay, x, color }: { delay: number; x: number; color: string; key?: React.Key }) => (
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

const RatingCategories = [
  { key: 'food', label: 'Food Quality', icon: Utensils },
  { key: 'taste', label: 'Taste', icon: Smile },
  { key: 'service', label: 'Service', icon: Handshake },
  { key: 'delivery', label: 'Pickup', icon: PackageCheck },
  { key: 'overall', label: 'Overall', icon: Star },
] as const;

type RatingKey = typeof RatingCategories[number]['key'];

const InlineStarRating = ({ count, onRate, size = 'md' }: { count: number; onRate: (n: number) => void; size?: 'sm' | 'md' | 'lg' }) => {
  const [hovered, setHovered] = useState(0);
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onRate(star)}
          className="transition-transform hover:scale-110 active:scale-95 p-0.5"
        >
          <Star className={`${sizeClasses} transition-colors ${star <= (hovered || count) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
        </button>
      ))}
    </div>
  );
};

export const OrderCompletionScreen: React.FC<OrderCompletionScreenProps> = ({
  order,
  institutionName,
  onViewReceipt,
  onRateOrder,
  onBackToMenu,
  onOrderAgain,
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({ food: 0, taste: 0, service: 0, delivery: 0, overall: 0 });
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingExpanded, setRatingExpanded] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    setHasAnimated(true);
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, [hasAnimated]);

  const orderNumber = order.order_number
    ? `#FX-${String(order.order_number).padStart(4, '0')}`
    : order.order_id || '';
  const pickupCode = order.pickup_code || order.qr_pickup_code || null;
  const tokenNumber = order.token_number || order.pickup_token || null;
  const paymentMethod = order.payment_method === 'razorpay' ? 'UPI / Razorpay'
    : order.payment_method === 'cash' ? 'Cash at Counter'
    : order.payment_method === 'wallet' ? 'FOODEXA Wallet'
    : order.payment_method || 'N/A';

  const handleSubmitRating = async () => {
    if (ratings.overall === 0) return;
    setSubmittingRating(true);
    try {
      const { error } = await supabase.from('order_ratings').insert({
        order_id: order.id,
        user_id: order.student_id || order.user_id,
        food_rating: ratings.food || null,
        taste_rating: ratings.taste || null,
        service_rating: ratings.service || null,
        delivery_rating: ratings.delivery || null,
        overall_rating: ratings.overall,
        review: review.trim() || null,
        created_at: new Date().toISOString(),
      });
      if (error) console.warn('Rating save failed (table may not exist):', error.message);
      setRatingSubmitted(true);
    } catch (err) {
      console.warn('Rating submission error:', err);
      setRatingSubmitted(true);
    }
    setSubmittingRating(false);
  };

  return (
    <div className="relative min-h-0 w-full">
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <>
            {Array.from({ length: 40 }).map((_, i) => (
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

      {/* Content container - centered on desktop, full width on mobile */}
      <div className="w-full max-w-[860px] mx-auto pt-6 sm:pt-10 pb-4 sm:pb-8 space-y-6 sm:space-y-8">

        {/* ── SUCCESS ICON & HEADLINE ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center space-y-3 sm:space-y-4"
        >
          {/* Success icon with subtle glow */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={2.5} />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.5 }}
                className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2"
              >
                <PartyPopper className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500" />
              </motion.div>
            </div>
          </motion.div>

          {/* Headlines */}
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1D1D1F] tracking-tight leading-tight">
              ORDER AGAIN, COME AGAIN
            </h1>
            <p className="text-sm sm:text-base text-[#6E6E73] font-medium">
              Your order has been successfully collected.
            </p>
            <p className="text-xs sm:text-sm text-[#86868B]">
              We hope you enjoyed your meal.
            </p>
            <p className="text-xs sm:text-sm text-[#86868B]">
              Thank you for choosing <span className="font-bold text-[#30D158]">FOODEXA</span>.
            </p>
          </div>
        </motion.div>

        {/* ── ORDER CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 120 }}
          className="rounded-[20px] sm:rounded-[24px] bg-white border border-slate-200/80 shadow-lg shadow-slate-200/40 overflow-hidden"
        >
          {/* Order Number Header */}
          <div className="text-center py-5 sm:py-6 px-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
            <p className="text-[10px] sm:text-[11px] font-bold text-[#86868B] uppercase tracking-widest mb-1">Order Number</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#1D1D1F] tracking-tight">{orderNumber}</p>
          </div>

          {/* Pickup Code & Token */}
          <div className="px-4 sm:px-6 py-4 sm:py-5">
            <div className={`grid gap-3 ${pickupCode && tokenNumber ? 'grid-cols-2' : 'grid-cols-1 max-w-xs mx-auto'}`}>
              {pickupCode ? (
                <div className="rounded-[14px] bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/60 p-3.5 sm:p-4 text-center">
                  <QrCode className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Pickup Code</p>
                  <p className="text-base sm:text-lg font-black text-blue-700 mt-0.5 tracking-wide">{pickupCode}</p>
                </div>
              ) : (
                <div className="rounded-[14px] bg-slate-50 border border-slate-200 p-3.5 sm:p-4 text-center">
                  <QrCode className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pickup Code</p>
                  <p className="text-sm text-slate-400 mt-0.5">Not available</p>
                </div>
              )}
              {tokenNumber ? (
                <div className="rounded-[14px] bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/60 p-3.5 sm:p-4 text-center">
                  <Hash className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Token Number</p>
                  <p className="text-base sm:text-lg font-black text-amber-700 mt-0.5 tracking-wide">{tokenNumber}</p>
                </div>
              ) : (
                <div className="rounded-[14px] bg-slate-50 border border-slate-200 p-3.5 sm:p-4 text-center">
                  <Hash className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Token Number</p>
                  <p className="text-sm text-slate-400 mt-0.5">Not available</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-5 space-y-2.5">
            <DetailRow icon={Building2} label="Institution" value={institutionName} />
            {(order.counter_name || order.counter) && <DetailRow icon={MapPin} label="Counter" value={order.counter_name || order.counter || ''} />}
            {order.canteen_name && <DetailRow icon={MapPin} label="Canteen" value={order.canteen_name} />}
            <DetailRow
              icon={Calendar}
              label="Date & Time"
              value={order.completed_at ? formatDateTime(order.completed_at) : formatDateTime(order.created_at)}
            />
            <DetailRow icon={CreditCard} label="Payment" value={paymentMethod} />

            {/* Total */}
            <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-[14px] bg-[#1D1D1F] mt-1">
              <p className="text-sm font-bold text-white">Total Paid</p>
              <p className="text-lg sm:text-xl font-black text-[#30D158]">{formatINR(order.total_amount)}</p>
            </div>
          </div>

          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-5">
              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-3">Items Ordered</p>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {item.is_veg !== null && item.is_veg !== undefined && (
                          <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${item.is_veg ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                            <Leaf className={`w-2 h-2 ${item.is_veg ? 'text-green-600' : 'text-red-600'}`} />
                          </span>
                        )}
                        <span className="text-xs sm:text-sm font-semibold text-[#1D1D1F] truncate">
                          {item.quantity}x {item.name}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#1D1D1F] shrink-0 ml-3">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── RATE YOUR EXPERIENCE ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {!ratingExpanded && !ratingSubmitted ? (
            <button
              onClick={() => setRatingExpanded(true)}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 sm:py-4 rounded-[16px] bg-white border border-slate-200 text-[#1D1D1F] font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              <Star className="w-5 h-5 text-amber-500" />
              Rate Your Experience
            </button>
          ) : ratingSubmitted ? (
            <div className="w-full flex items-center justify-center gap-2.5 py-3.5 sm:py-4 rounded-[16px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              Thank you for your feedback!
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-[16px] bg-white border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1D1D1F]">Rate Your Experience</h3>
                  <button onClick={() => setRatingExpanded(false)} className="text-xs text-[#86868B] font-medium">Cancel</button>
                </div>
                {RatingCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div key={cat.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-[#F5F5F7] border border-slate-200 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-[#1D1D1F]" />
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-700">{cat.label}</span>
                      </div>
                      <InlineStarRating count={ratings[cat.key]} onRate={(v) => setRatings((prev) => ({ ...prev, [cat.key]: v }))} size="sm" />
                    </div>
                  );
                })}
                <div>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Tell us about your experience (optional)"
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-[#30D158] focus:bg-white outline-none resize-none transition-colors"
                  />
                </div>
                <button
                  onClick={handleSubmitRating}
                  disabled={submittingRating || ratings.overall === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0071E3] text-white font-bold text-sm shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0066CC] transition-all active:scale-[0.98]"
                >
                  {submittingRating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* ── ACTION BUTTONS ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          {/* Order Again - Primary */}
          <button
            onClick={() => onOrderAgain ? onOrderAgain(order) : onBackToMenu()}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 sm:py-4 rounded-[16px] bg-[#1D1D1F] text-white font-bold text-sm shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            <RotateCcw className="w-4.5 h-4.5" />
            ORDER AGAIN
          </button>

          {/* View Tax Invoice */}
          <button
            onClick={() => onViewReceipt(order)}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 sm:py-4 rounded-[16px] bg-white border border-slate-200 text-[#1D1D1F] font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            <Download className="w-4.5 h-4.5 text-[#86868B]" />
            View Tax Invoice
          </button>

          {/* Continue Browsing */}
          <button
            onClick={onBackToMenu}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 sm:py-4 rounded-[16px] bg-slate-100 text-[#1D1D1F] font-bold text-sm hover:bg-slate-200 transition-all active:scale-[0.98]"
          >
            Continue Browsing
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

// ── Detail Row Component ──
const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80">
    <Icon className="w-4 h-4 text-[#86868B] shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">{label}</p>
      <p className="text-xs sm:text-sm font-bold text-[#1D1D1F] truncate">{value}</p>
    </div>
  </div>
);
