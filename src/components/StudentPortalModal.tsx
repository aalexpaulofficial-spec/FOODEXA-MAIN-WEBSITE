import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowRight, Award, Bell, BookOpen, Building2, CheckCircle2, ChefHat, Clock,
  CreditCard, Heart, Home, Loader2, LogOut, MapPin, QrCode, Receipt, Search, Settings,
  ShoppingBag, Sparkles, Star, Tag, TrendingUp, User, Utensils, X, Zap, Edit3, Save,
  Phone, Mail, Hash, Shield, ChevronRight, Flame, Package, RefreshCw, Filter, Wifi,
  WifiOff, Coffee, Pizza, Sandwich, Salad, ChevronLeft, Check, ShoppingCart, Plus, Minus,
  Gift, Bell as BellIcon, RotateCcw, ArrowUpRight, Activity, Calendar, Timer, Info,
  CheckCircle, XCircle, Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  formatINR, formatDateTime, subscribeOrders, subscribeMenuItems, subscribeAnnouncements,
  subscribeBanners, subscribeMenuCategories, subscribeHomepageSections, subscribeCounters,
  placeOrder, createRazorpayOrder, verifyRazorpayPayment, mapMenuItem,
  fetchUserCart, saveUserCart, fetchBanners, fetchHomepageSections, fetchCounters,
  fetchMenuItems as fetchMenuItemsService, searchMenuItems, filterMenuItems,
  calculateCartTotals, GST_RATE, validateCoupon, applyCouponUsage,
  fetchUserFavorites, toggleFavorite, fetchAIRecommendations, getOrderProgress, getEstimatedTimeRemaining, generateReceipt
} from '../lib/supabase-service';
import type { MenuItem, Order, OrderStatus, NotificationItem, UserRole, CartItem, FoodFilters, CheckoutData } from '../types';

declare global { interface Window { Razorpay: any } }

interface StudentPortalModalProps { isOpen: boolean; onClose: () => void; role?: UserRole; triggerToast?: (title: string, description: string, type?: 'success' | 'warning' | 'info' | 'ai') => void }
type PortalTab = 'home' | 'menu' | 'orders' | 'profile' | 'checkout' | 'payment_success' | 'payment_failed';

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready'];

// ── Utilities ──────────────────────────────────────────────────────────────

const statusLabel = (s: OrderStatus) => {
  const map: Record<OrderStatus, string> = {
    pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing',
    ready: 'Ready for Pickup', completed: 'Completed', cancelled: 'Cancelled',
  };
  return map[s] || s;
};

const statusColor = (s: OrderStatus) => {
  const map: Record<OrderStatus, string> = {
    pending: 'text-amber-300 border-amber-500/40 bg-amber-950/50',
    accepted: 'text-blue-300 border-blue-500/40 bg-blue-950/50',
    preparing: 'text-violet-300 border-violet-500/40 bg-violet-950/50',
    ready: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60',
    completed: 'text-slate-400 border-slate-700 bg-slate-900',
    cancelled: 'text-red-300 border-red-500/40 bg-red-950/50',
  };
  return map[s] || 'text-slate-300 border-slate-700 bg-slate-900';
};

const statusDot = (s: OrderStatus) => {
  const map: Record<OrderStatus, string> = {
    pending: 'bg-amber-400', accepted: 'bg-blue-400', preparing: 'bg-violet-400',
    ready: 'bg-emerald-400', completed: 'bg-slate-400', cancelled: 'bg-red-400',
  };
  return map[s] || 'bg-slate-400';
};

const roleLabel = (role: UserRole | null | undefined) => {
  if (role === 'student') return 'Student';
  if (role === 'faculty') return 'Faculty';
  if (role === 'guest') return 'Guest';
  return 'Member';
};

const roleGradient = (role: UserRole | null | undefined) => {
  if (role === 'student') return 'from-emerald-500 to-teal-500';
  if (role === 'faculty') return 'from-cyan-500 to-blue-500';
  if (role === 'guest') return 'from-amber-500 to-orange-500';
  return 'from-slate-500 to-slate-600';
};

const roleColor = (role: UserRole | null | undefined) => {
  if (role === 'student') return 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60';
  if (role === 'faculty') return 'text-cyan-300 border-cyan-500/40 bg-cyan-950/60';
  if (role === 'guest') return 'text-amber-300 border-amber-500/40 bg-amber-950/60';
  return 'text-slate-300 border-slate-700 bg-slate-900';
};

const formatDate = (d: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const getCategoryEmoji = (cat: string): string => {
  const lower = cat.toLowerCase();
  if (lower.includes('break')) return '🌅';
  if (lower.includes('lunch')) return '🍱';
  if (lower.includes('dinner')) return '🌙';
  if (lower.includes('snack')) return '🍿';
  if (lower.includes('bev') || lower.includes('drink') || lower.includes('coffee')) return '☕';
  if (lower.includes('dessert') || lower.includes('sweet')) return '🍰';
  if (lower.includes('veg')) return '🥗';
  if (lower.includes('non-veg') || lower.includes('chicken') || lower.includes('meat')) return '🍗';
  if (lower.includes('bake') || lower.includes('bread')) return '🥐';
  if (lower.includes('fast') || lower.includes('burger') || lower.includes('pizza')) return '🍔';
  if (lower.includes('rice') || lower.includes('biryani')) return '🍛';
  if (lower.includes('south')) return '🫓';
  return '🍽️';
};

const getCategoryGradient = (idx: number) => {
  const gradients = [
    'from-emerald-600/60 to-teal-700/60 border-emerald-500/30',
    'from-orange-600/60 to-red-700/60 border-orange-500/30',
    'from-violet-600/60 to-purple-700/60 border-violet-500/30',
    'from-pink-600/60 to-rose-700/60 border-pink-500/30',
    'from-cyan-600/60 to-blue-700/60 border-cyan-500/30',
    'from-amber-600/60 to-yellow-700/60 border-amber-500/30',
    'from-indigo-600/60 to-violet-700/60 border-indigo-500/30',
    'from-teal-600/60 to-cyan-700/60 border-teal-500/30',
  ];
  return gradients[idx % gradients.length];
};

const ORDER_STEPS = ['pending', 'accepted', 'preparing', 'ready', 'completed'] as const;
const ORDER_STEP_LABELS = ['Placed', 'Accepted', 'Preparing', 'Ready', 'Done'];
const ORDER_STEP_ICONS = [Package, Check, ChefHat, QrCode, CheckCircle2];

// ── Sub-components ──────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden animate-pulse">
    <div className="h-36 bg-slate-800" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-slate-800 rounded-full w-3/4" />
      <div className="h-2 bg-slate-800 rounded-full w-1/2" />
      <div className="h-7 bg-slate-800 rounded-xl mt-3" />
    </div>
  </div>
);

const QRModal = ({ isOpen, onClose, order }: { isOpen: boolean; onClose: () => void; order: Order | null }) => {
  const [countdown, setCountdown] = useState(300); // 5 min
  useEffect(() => {
    if (!isOpen) return;
    setCountdown(300);
    const interval = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || !order) return null;
  const qrValue = order.qr_code_data || order.qr_code || order.pickup_code || order.order_id;
  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-5 shadow-2xl shadow-emerald-950/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Pickup Ready!</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code display */}
        <div className="bg-white rounded-2xl p-5 mx-auto max-w-[220px] shadow-lg">
          <div className="grid grid-cols-7 gap-1 mb-3">
            {Array.from({ length: 49 }).map((_, i) => (
              <div key={i} className={`h-2.5 w-2.5 rounded-sm ${Math.random() > 0.5 ? 'bg-slate-900' : 'bg-white'}`} />
            ))}
          </div>
          <div className="font-mono text-xl font-black text-slate-950 tracking-[0.3em] text-center">{qrValue}</div>
        </div>

        {/* Order info */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-slate-500">{order.order_id}</p>
          <div className="flex items-center justify-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <p className="text-xs font-bold text-white">Counter: <span className="text-emerald-300">{order.counter}</span></p>
          </div>
          {order.locker_number && (
            <div className="flex items-center justify-center gap-2">
              <Hash className="w-3.5 h-3.5 text-cyan-400" />
              <p className="text-xs font-bold text-white">Locker: <span className="text-cyan-300">{order.locker_number}</span></p>
            </div>
          )}
        </div>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 px-4 py-2.5">
          <Timer className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-emerald-300">
            Expires in {mins}:{secs.toString().padStart(2, '0')}
          </span>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors">
          Close
        </button>
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, message, action }: {
  icon: React.ElementType; title: string; message: string;
  action?: { label: string; onClick: () => void }
}) => (
  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
    <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-3">
      <Icon className="w-6 h-6 text-slate-500" />
    </div>
    <h4 className="text-sm font-bold text-slate-200 mb-1">{title}</h4>
    <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">{message}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-950 transition-colors"
      >
        {action.label} <ArrowRight className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

const BannerCarousel = ({ banners }: { banners: any[] }) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;
  const banner = banners[current];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 h-40 sm:h-52">
      {banner.image_url && (
        <img src={banner.image_url} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
      <div className="relative z-10 flex flex-col justify-center h-full p-6 sm:p-8 max-w-lg">
        {banner.title && <h3 className="text-lg sm:text-2xl font-black text-white leading-tight">{banner.title}</h3>}
        {banner.subtitle && <p className="mt-1 text-xs sm:text-sm text-slate-300 line-clamp-2">{banner.subtitle}</p>}
        {banner.cta_label && (
          <button className="mt-3 inline-flex items-center gap-2 w-fit rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-black text-slate-950 shadow-lg shadow-emerald-950/30 hover:from-emerald-400 hover:to-teal-400 transition-all">
            {banner.cta_label} <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${i === current ? 'w-6 bg-emerald-400' : 'w-1.5 bg-slate-600'}`} />
          ))}
        </div>
      )}
    </section>
  );
};

const FoodCard = ({ item, onAdd, onFavorite, isFavorited = false }: {
  key?: React.Key;
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  onFavorite?: (item: MenuItem) => void;
  isFavorited?: boolean;
}) => {
  const [adding, setAdding] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const isVeg = item.is_veg !== false;
  const aiScore = item.ai_popularity_score || item.rating || 0;

  const handleAdd = () => {
    setAdding(true);
    onAdd(item);
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:shadow-xl hover:shadow-slate-950/40">
      {/* Image */}
      <div className="relative h-44 bg-slate-800 overflow-hidden">
        {item.image_url && !imgErr ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-950/30">
            <Utensils className="w-12 h-12 text-slate-700" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges - Top Left */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {item.popular && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-slate-950/90 px-2 py-0.5 text-[9px] font-black text-emerald-300 backdrop-blur-sm">
              <Flame className="w-2.5 h-2.5" /> Popular
            </span>
          )}
          {item.offer_label && (
            <span className="rounded-full border border-amber-500/50 bg-slate-950/90 px-2 py-0.5 text-[9px] font-bold text-amber-300 backdrop-blur-sm">
              {item.offer_label}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black backdrop-blur-sm ${
            isVeg
              ? 'border-emerald-500/50 bg-emerald-950/90 text-emerald-300'
              : 'border-red-500/50 bg-red-950/90 text-red-300'
          }`}>
            {isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
          </span>
        </div>

        {/* Favorite */}
        {onFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite(item); }}
            className="absolute right-3 top-3 p-1.5 rounded-full bg-slate-950/80 backdrop-blur-sm text-slate-400 hover:text-red-400 transition-colors"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-red-400 text-red-400' : ''}`} />
          </button>
        )}

        {/* Rating */}
        {aiScore > 0 && (
          <div className="absolute bottom-2.5 right-3 flex items-center gap-1 rounded-full bg-slate-950/80 px-2 py-0.5 text-[9px] font-bold text-amber-300 backdrop-blur-sm">
            <Star className="w-2.5 h-2.5 fill-amber-300" />{aiScore.toFixed(1)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-extrabold text-white line-clamp-1 leading-tight">{item.name}</h4>
            <div className="shrink-0 text-right">
              {item.offer_price ? (
                <div>
                  <span className="text-xs font-black text-emerald-300">{formatINR(item.offer_price)}</span>
                  <span className="ml-1 text-[9px] text-slate-500 line-through">{formatINR(item.price)}</span>
                </div>
              ) : (
                <span className="text-xs font-black text-emerald-300">{formatINR(item.price)}</span>
              )}
            </div>
          </div>
          {item.description && (
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500 line-clamp-2">{item.description}</p>
          )}
        </div>

        {/* Nutrition row */}
        {(item.calories || item.protein) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {item.calories && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-semibold text-slate-400">
                🔥 {item.calories} kcal
              </span>
            )}
            {item.protein && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-semibold text-slate-400">
                💪 {item.protein}g
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-semibold text-slate-400">
            <Building2 className="w-2 h-2" />{item.counter_name}
          </span>
          {item.category && (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-semibold text-slate-400">
              {item.category}
            </span>
          )}
          {(item.prep_time || item.prep_time_minutes) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-semibold text-slate-400">
              <Clock className="w-2 h-2" />{item.prep_time || `~${item.prep_time_minutes}m`}
            </span>
          )}
          {item.stock_quantity !== undefined && item.stock_quantity <= 5 && item.stock_quantity > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/50 px-2 py-0.5 text-[9px] font-bold text-amber-300">
              <Package className="w-2 h-2" /> {item.stock_quantity} left
            </span>
          )}
        </div>

        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={!item.is_available || (item.stock_quantity !== undefined && item.stock_quantity <= 0)}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold shadow-sm transition-all active:scale-[0.97] ${
            !item.is_available || (item.stock_quantity !== undefined && item.stock_quantity <= 0)
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : adding
                ? 'bg-emerald-500 text-slate-950 scale-[0.98]'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 hover:shadow-emerald-950/40 hover:shadow-md'
          }`}
        >
          {!item.is_available || (item.stock_quantity !== undefined && item.stock_quantity <= 0) ? (
            'Sold Out'
          ) : adding ? (
            <><Check className="w-4 h-4" /> Added!</>
          ) : (
            <><Plus className="w-4 h-4" /> Add to Order</>
          )}
        </button>
      </div>
    </article>
  );
};

const OrderProgressBar = ({ status }: { status: OrderStatus }) => {
  const currentIdx = ORDER_STEPS.indexOf(status as typeof ORDER_STEPS[number]);
  const isCancelled = status === 'cancelled';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {ORDER_STEPS.map((step, i) => {
          const isCompleted = !isCancelled && i < currentIdx;
          const isActive = !isCancelled && i === currentIdx;
          const StepIcon = ORDER_STEP_ICONS[i];
          return (
            <React.Fragment key={step}>
              <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all duration-500 shrink-0 ${
                isCancelled ? 'border-red-500/40 bg-red-950/30' :
                isCompleted ? 'border-emerald-500 bg-emerald-500' :
                isActive ? 'border-emerald-400 bg-emerald-950 shadow-lg shadow-emerald-500/30' :
                'border-slate-700 bg-slate-900'
              }`}>
                <StepIcon className={`w-3 h-3 ${
                  isCancelled ? 'text-red-500' :
                  isCompleted ? 'text-slate-950' :
                  isActive ? 'text-emerald-400' :
                  'text-slate-600'
                }`} />
              </div>
              {i < ORDER_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 rounded-full transition-all duration-700 ${
                  isCancelled ? 'bg-red-500/20' :
                  i < currentIdx ? 'bg-emerald-500' : 'bg-slate-700'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="flex justify-between">
        {ORDER_STEP_LABELS.map((label, i) => (
          <span key={label} className={`text-[8px] font-bold text-center ${
            i === currentIdx && !isCancelled ? 'text-emerald-400' : 'text-slate-600'
          }`} style={{ width: i === 0 || i === ORDER_STEP_LABELS.length - 1 ? 'auto' : '14%', textAlign: 'center' }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────

export const StudentPortalModal: React.FC<StudentPortalModalProps> = ({ isOpen, onClose, role, triggerToast }) => {
  const { user, profile, refreshProfile, signOut, updateProfile, leaveInstitution } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PortalTab>('home');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [homepageSections, setHomepageSections] = useState<any[]>([]);
  const [countersList, setCountersList] = useState<any[]>([]);
  const [institutionName, setInstitutionName] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounter, setSelectedCounter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedVeg, setSelectedVeg] = useState<'ALL' | 'veg' | 'nonVeg'>('ALL');
  const [selectedPriceRange, setSelectedPriceRange] = useState('ALL');
  const [selectedPrepTime, setSelectedPrepTime] = useState('ALL');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price_asc' | 'price_desc' | 'prep_time' | 'rating'>('popular');
  const [showVegFilter, setShowVegFilter] = useState(false);
  const [showNonVeg, setShowNonVeg] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrOrder, setQrOrder] = useState<Order | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '', department: '', semester: '', programme: '', campus_block: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [showLeaveInstitution, setShowLeaveInstitution] = useState(false);
  const [leavingInstitution, setLeavingInstitution] = useState(false);
  const [leaveInstitutionMessage, setLeaveInstitutionMessage] = useState<string | null>(null);
  
  // Checkout States
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'wallet' | 'cash'>('razorpay');
  const [kitchenNotes, setKitchenNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const guard = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s || !s.user?.email_confirmed_at) {
        onClose();
        navigate('/');
      }
    };
    guard();
  }, [isOpen]);

  const liveRole = profile?.role || null;
  const displayName = profile?.full_name || profile?.email || user?.email || 'User';
  const firstLetters = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const firstItemCounter = cart.length > 0 ? cart[0].item.counter_name : '';

  const handleOrderUpdate = useCallback((payload: any) => {
    const newStatus = payload.new?.status;
    if (newStatus && payload.new?.user_id === user?.id) {
      setOrders((prev) => {
        const exists = prev.find((o) => o.id === String(payload.new.id));
        if (exists) {
          return prev.map((o) => o.id === String(payload.new.id) ? {
            ...o, status: newStatus.toLowerCase() as OrderStatus,
            ready_at: payload.new.ready_at || o.ready_at,
            completed_at: payload.new.completed_at || o.completed_at,
            qr_code: payload.new.qr_code || payload.new.qr_code_data || o.qr_code,
            qr_code_data: payload.new.qr_code_data || o.qr_code_data,
            pickup_code: payload.new.pickup_code || o.pickup_code,
          } : o);
        }
        return prev;
      });
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isOpen) return;
    if (!user || !profile) return;
    const load = async () => {
      setLoading(true); setError(null);
      try {
        await refreshProfile();
        const currentProfile = profile;
        const instId = currentProfile?.institution_id;

          // Fetch banners
          const { data: bData } = await supabase.from('banners').select('*').eq('is_active', true).order('order', { ascending: true });
          setBanners((bData || []) as any[]);

          // Fetch homepage sections
          const { data: hsData } = await supabase.from('homepage_sections').select('*').eq('is_active', true).order('display_order', { ascending: true });
          setHomepageSections((hsData || []) as any[]);

          // Fetch counters
          const { data: cData } = await supabase.from('counters').select('*').eq('is_active', true).order('order', { ascending: true });
          setCountersList((cData || []) as any[]);

          // Fetch user favorites
          if (user?.id) {
            const favIds = await fetchUserFavorites(user.id);
            setFavorites(new Set(favIds));
          }

          // Fetch menu items with enhanced params
          const menuResult = await supabase
            .from('menu_items')
            .select('*')
            .eq('is_published', true)
            .order('item_name', { ascending: true });

          if (!menuResult.error) {
            setMenuItems((menuResult.data || []).map(mapMenuItem));
          }

        // Fetch orders only for this user
        if (user?.id) {
          const orderResult = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (!orderResult.error) {
            setOrders((orderResult.data || []).map((r: any) => ({
              id: String(r.id), user_id: String(r.user_id || ''), email: String(r.email || ''),
              role: ['student', 'faculty', 'guest', 'institution_admin', 'kitchen_staff', 'canteen_manager', 'super_admin'].includes(r.role) ? r.role : null,
              institution_id: r.institution_id || null, institution_code: r.institution_code || null,
              counter_id: null, category_id: null,
              order_id: String(r.order_id || r.id), counter: String(r.counter || ''),
              items: Array.isArray(r.items) ? r.items.map((i: any) => ({ name: String(i.item_name || i.name || 'Item'), quantity: Number(i.quantity || 1), price: Number(i.price || 0) })) : [],
              total_amount: Number(r.total_amount || r.total || 0),
              status: (r.status || 'pending').toLowerCase() as OrderStatus,
              payment_status: r.payment_status || 'pending', pickup_code: r.pickup_code || r.qr_code || null,
              qr_code: r.qr_code || null, qr_code_data: r.qr_code_data || null,
              locker_number: r.locker_number || null, created_at: r.created_at || '',
              accepted_at: r.accepted_at || null, preparing_at: r.preparing_at || null,
              ready_at: r.ready_at || null, completed_at: r.completed_at || null, updated_at: r.updated_at || '',
            })));
          }
        }

        // Fetch notifications — silently ignore RLS errors
        const notifResult = await supabase
          .from('notifications')
          .select('id, title, message, created_at, type, read')
          .order('created_at', { ascending: false })
          .limit(50);
        if (!notifResult.error) {
          const notifs = (notifResult.data || []).map((r: any) => ({
            id: String(r.id), title: String(r.title || r.heading || r.subject || 'Update'),
            message: String(r.message || r.body || r.content || ''),
            created_at: r.created_at || '', type: String(r.type || 'announcement'), read: Boolean(r.read || r.is_read),
          }));
          setNotifications(notifs);
          setUnreadNotif(notifs.filter(n => !n.read).length);
        }

        // Fetch institution name from the institutions table
        if (instId) {
          const { data: inst } = await supabase
            .from('institutions')
            .select('institution_name, name, campus, institution_code')
            .eq('id', instId)
            .maybeSingle();
          if (inst) {
            const nameField = inst.institution_name || inst.name || '';
            setInstitutionName(`${nameField}${inst.campus ? ` · ${inst.campus}` : ''}`);
            setInstitutionCode(inst.institution_code || '');
          }
        }

        // Fetch user cart
        if (user?.id) {
          const loadedCart = await fetchUserCart(user.id);
          if (loadedCart.length > 0) {
            setCart(loadedCart);
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load portal data.');
      } finally {
        setLoading(false);
      }
    };
    load();

    const unsubOrders = user?.id ? subscribeOrders(handleOrderUpdate, { user_id: user.id }) : () => {};
    const unsubMenu = subscribeMenuItems((payload: any) => {
      if (payload.eventType === 'INSERT' && payload.new?.is_published !== false) {
        setMenuItems((prev) => { const exists = prev.find((i) => i.id === String(payload.new.id)); return exists ? prev : [...prev, mapMenuItem(payload.new)]; });
      } else if (payload.eventType === 'UPDATE') {
        setMenuItems((prev) => prev.map((i) => i.id === String(payload.new.id) ? { ...i, ...mapMenuItem(payload.new), id: i.id } : i));
      } else if (payload.eventType === 'DELETE') {
        setMenuItems((prev) => prev.filter((i) => i.id !== String(payload.old.id)));
      }
    });
    const unsubNotif = subscribeAnnouncements((payload: any) => {
      if (payload.eventType === 'INSERT') {
        setNotifications((prev) => [{
          id: String(payload.new.id), title: String(payload.new.title || payload.new.heading || 'Update'),
          message: String(payload.new.message || payload.new.body || ''),
          created_at: payload.new.created_at || '', type: String(payload.new.type || 'announcement'), read: false,
        }, ...prev]);
        setUnreadNotif(c => c + 1);
      }
    });
    const unsubBanners = subscribeBanners((payload: any) => {
      if (payload.eventType === 'INSERT' && payload.new?.is_active) {
        setBanners((prev) => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setBanners((prev) => prev.map((b) => b.id === payload.new.id ? payload.new : b).filter((b) => b.is_active));
      } else if (payload.eventType === 'DELETE') {
        setBanners((prev) => prev.filter((b) => b.id !== payload.old.id));
      }
    });
    const unsubCounters = subscribeCounters((payload: any) => {
      if (payload.eventType === 'INSERT' && payload.new?.is_active) {
        setCountersList((prev) => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setCountersList((prev) => prev.map((c) => c.id === payload.new.id ? payload.new : c).filter((c) => c.is_active));
      } else if (payload.eventType === 'DELETE') {
        setCountersList((prev) => prev.filter((c) => c.id !== payload.old.id));
      }
    });

    return () => { unsubOrders(); unsubMenu(); unsubNotif(); unsubBanners(); unsubCounters(); };
  }, [isOpen, profile?.institution_id, refreshProfile, user?.id, handleOrderUpdate]);

  // Sync cart to Supabase when it changes
  useEffect(() => {
    if (user?.id && !loading) {
      const timer = setTimeout(() => {
        saveUserCart(user.id, cart);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cart, user?.id, loading]);

  // Derived data
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    menuItems.forEach((i) => { if (i.category) cats.add(i.category); });
    return Array.from(cats);
  }, [menuItems]);

  const counters = useMemo(() => {
    const grouped = new Map<string, MenuItem[]>();
    menuItems.forEach((item) => grouped.set(item.counter_name, [...(grouped.get(item.counter_name) || []), item]));
    return Array.from(grouped.entries()).map(([name, items]) => ({
      name, items, count: items.length,
      avgRating: items.reduce((s, i) => s + i.rating, 0) / Math.max(items.filter((i) => i.rating > 0).length, 1),
      categories: Array.from(new Set(items.map((i) => i.category))).slice(0, 3),
    }));
  }, [menuItems]);

  const orderItemNames = useMemo(() => new Set(orders.flatMap((o) => o.items.map((i) => i.name))), [orders]);
  const orderedCategories = useMemo(() => new Set(menuItems.filter((i) => orderItemNames.has(i.name)).map((i) => i.category)), [menuItems, orderItemNames]);

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const pastOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));
  const offerItems = menuItems.filter((i) => i.offer_label).slice(0, 8);
  const trendingItems = [...menuItems].sort((a, b) => Number(b.popular) - Number(a.popular) || b.rating - a.rating).slice(0, 10);
  const quickReorderItems = menuItems.filter((i) => orderItemNames.has(i.name)).slice(0, 8);
  const personalizedItems = menuItems.filter((i) => orderedCategories.has(i.category) && !orderItemNames.has(i.name)).slice(0, 8);
  const todaySpecials = menuItems.filter((i) => i.popular).slice(0, 6);
  const favoriteItems = menuItems.filter(i => favorites.has(i.id)).slice(0, 8);

  // Enhanced filtered items with all filters
  const filteredItems = useMemo(() => {
    let result = [...menuItems];
    const q = searchQuery.trim().toLowerCase();

    // Search filter
    if (q) {
      result = result.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.counter_name.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q)
      );
    }

    // Counter filter
    if (selectedCounter !== 'ALL') {
      result = result.filter((i) => i.counter_name === selectedCounter);
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter((i) => i.category === selectedCategory);
    }

    // Veg filter
    if (showVegFilter) {
      result = result.filter((i) => i.is_veg === true);
    }
    if (showNonVeg) {
      result = result.filter((i) => i.is_veg === false);
    }

    // Price range filter
    if (selectedPriceRange !== 'ALL') {
      const [min, max] = selectedPriceRange.split('-').map(Number);
      if (max) {
        result = result.filter((i) => (i.offer_price || i.price) >= min && (i.offer_price || i.price) <= max);
      } else {
        result = result.filter((i) => (i.offer_price || i.price) >= min);
      }
    }

    // Prep time filter
    if (selectedPrepTime !== 'ALL') {
      const maxMinutes = Number(selectedPrepTime);
      result = result.filter((i) => i.prep_time_minutes !== undefined && i.prep_time_minutes <= maxMinutes);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => Number(b.popular) - Number(a.popular) || b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
        break;
      case 'price_asc':
        result.sort((a, b) => (a.offer_price || a.price) - (b.offer_price || b.price));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.offer_price || b.price) - (a.offer_price || a.price));
        break;
      case 'prep_time':
        result.sort((a, b) => (a.prep_time_minutes || Infinity) - (b.prep_time_minutes || Infinity));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [menuItems, searchQuery, selectedCounter, selectedCategory, showVegFilter, showNonVeg, selectedPriceRange, selectedPrepTime, sortBy]);

  const { subtotal: cartSubtotal, gst: cartGST, discount: cartDiscount, grandTotal: cartGrandTotal } = useMemo(() => {
    return calculateCartTotals(cart, couponDiscount);
  }, [cart, couponDiscount]);

  const cartTotal = cartSubtotal;
  const cartCount = cart.reduce((s, e) => s + e.quantity, 0);

  // Cart actions
  const addToCart = (item: MenuItem) => {
    let found = false;
    setCart((prev) => {
      const ex = prev.find((e) => e.item.id === item.id);
      if (ex) {
        found = true;
        return prev.map((e) => e.item.id === item.id ? { ...e, quantity: e.quantity + 1 } : e);
      }
      return [...prev, { item, quantity: 1 }];
    });
    if (triggerToast) {
      triggerToast(found ? 'Updated quantity' : 'Added to cart', `${item.name} · ${formatINR(item.offer_price || item.price)}`, 'success');
    }
  };

  const updateQuantity = (id: string, delta: number) => setCart((prev) =>
    prev.map((e) => e.item.id === id ? { ...e, quantity: e.quantity + delta } : e).filter((e) => e.quantity > 0)
  );

  const toggleFavorite = (item: MenuItem) => setFavorites(prev => {
    const next = new Set(prev);
    next.has(item.id) ? next.delete(item.id) : next.add(item.id);
    return next;
  });

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) { setCouponDiscount(0); setCouponMessage(null); return; }
    setApplyingCoupon(true);
    setCouponMessage(null);
    try {
      const result = await validateCoupon(couponCode, profile?.institution_id || undefined, user?.id);
      if (result.valid) {
        setCouponDiscount(result.discount);
        setCouponMessage(result.type === 'percentage' ? `${result.discount}% discount applied` : `${formatINR(result.discount)} discount applied`);
        if (user?.id) {
          await applyCouponUsage(couponCode, user.id, '');
        }
      } else {
        setCouponDiscount(0);
        setCouponMessage(result.error || 'Invalid coupon');
      }
    } catch {
      setCouponMessage('Coupon validation failed');
    }
    setApplyingCoupon(false);
  };

  // Order placement
  const handlePlaceOrder = async () => {
    if (!user?.id || !profile?.email) { setError('Sign in required.'); return; }
    if (!liveRole) { setError('Profile role missing.'); return; }
    if (!cart.length) return;
    setSubmittingOrder(true); setError(null);
    try {
      const tempOrderId = `FDX-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const itemsForBackend = cart.map((e) => ({ id: e.item.id, name: e.item.name, quantity: e.quantity, price: e.item.offer_price || e.item.price }));
      const razorpayResult = await createRazorpayOrder({
        amount: cartTotal, currency: 'INR', user_id: user.id, email: profile.email,
        phone: profile.phone || undefined, name: profile.full_name || undefined,
        institution_id: profile.institution_id || undefined, order_id: tempOrderId, counter: firstItemCounter,
      });
      if (!razorpayResult.success || !razorpayResult.order_id) {
        setError(razorpayResult.error || 'Failed to initialize payment.'); setSubmittingOrder(false); if (triggerToast) triggerToast('Payment Initialization Failed', razorpayResult.error || 'Please try again.', 'warning'); return;
      }

      const razorpayKeyId = razorpayResult.razorpay_key_id;
      if (!razorpayKeyId) { setError('Payment configuration error.'); setSubmittingOrder(false); return; }

      const options: any = {
        key: razorpayKeyId, amount: razorpayResult.amount, currency: razorpayResult.currency || 'INR',
        name: 'FOODEXA', description: `Campus Order — ${firstItemCounter}`,
        image: 'https://foodexa.com/logo.png',
        order_id: razorpayResult.order_id,
        handler: async function (response: any) {
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;
          try {
            const verifyResult = await verifyRazorpayPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id: user.id, order_id: tempOrderId });
            if (!verifyResult.success) { setError(verifyResult.error || 'Payment verification failed.'); setActiveTab('payment_failed'); setSubmittingOrder(false); if (triggerToast) triggerToast('Payment Verification Failed', verifyResult.error || 'Contact support.', 'warning'); return; }
            const orderResult = await placeOrder({
              user_id: user.id, email: profile.email, role: liveRole, institution_id: profile.institution_id,
               institution_code: institutionCode, counter: firstItemCounter,
              items: itemsForBackend,
              itemsFull: cart.map((e) => ({ id: e.item.id, name: e.item.name, quantity: e.quantity, price: e.item.offer_price || e.item.price, image_url: e.item.image_url, is_veg: e.item.is_veg })),
              total_amount: cartGrandTotal, razorpay_order_id, razorpay_payment_id, razorpay_signature,
            });
            if (orderResult.error) { setError(`Order failed: ${orderResult.error}`); setActiveTab('payment_failed'); setSubmittingOrder(false); if (triggerToast) triggerToast('Order Creation Failed', orderResult.error || 'Contact support.', 'warning'); return; }
            if (orderResult.data) setOrders((prev) => [orderResult.data!, ...prev]);
            setCart([]); setShowCart(false); setCouponDiscount(0); setCouponCode(''); setActiveTab('payment_success'); setSubmittingOrder(false); setError(null);
            if (triggerToast) triggerToast('Order Placed Successfully', `Order ${orderResult.data.order_id} is being prepared.`, 'success');
          } catch (verifyErr: any) {
            setError('Payment completed but verification failed. Contact support.'); setActiveTab('payment_failed'); setSubmittingOrder(false); if (triggerToast) triggerToast('Verification Error', 'Payment completed but order creation failed.', 'warning');
          }
        },
        prefill: { name: profile.full_name || '', email: profile.email || '', contact: profile.phone || '' },
        notes: { institution_id: profile.institution_id || '', order_id: tempOrderId, counter: firstItemCounter },
        theme: { color: '#10b981' },
        modal: { ondismiss: function () { setSubmittingOrder(false); } },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        setError(`Payment failed: ${response?.error?.description || 'Please try again.'}`); setActiveTab('payment_failed'); setSubmittingOrder(false); if (triggerToast) triggerToast('Payment Failed', response?.error?.description || 'Please try again.', 'warning');
      });
      razorpay.open();
    } catch (err: any) {
      setError(err?.message || 'Failed to initiate payment.'); setActiveTab('payment_failed'); setSubmittingOrder(false); if (triggerToast) triggerToast('Payment Error', err?.message || 'Failed to initiate payment.', 'warning');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate('/', { replace: true });
  };

  const handleEditProfile = () => {
    setProfileForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      department: profile?.department || '',
      semester: profile?.semester || '',
      programme: profile?.programme || '',
      campus_block: profile?.campus_block || '',
    });
    setEditingProfile(true);
    setProfileMessage(null);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true); setProfileMessage(null);
    const { error: saveError } = await updateProfile({
      full_name: profileForm.full_name,
      phone: profileForm.phone,
      department: profileForm.department,
      semester: profileForm.semester,
      programme: profileForm.programme,
      campus_block: profileForm.campus_block,
    });
    if (saveError) {
      setProfileMessage(`Unable to update profile. Please try again.`);
    } else {
      setProfileMessage('Profile updated successfully!');
      setEditingProfile(false);
      await refreshProfile();
    }
    setSavingProfile(false);
  };

  const handleLeaveInstitution = async () => {
    setLeavingInstitution(true);
    setLeaveInstitutionMessage(null);
    const { error } = await leaveInstitution();
    if (error) {
      setLeaveInstitutionMessage(error.message || 'Failed to leave institution. Please try again.');
    } else {
      setLeaveInstitutionMessage('Success! You have left your institution. You can join another institution anytime.');
      setInstitutionName('');
      setInstitutionCode('');
      await refreshProfile();
      setTimeout(() => {
        setShowLeaveInstitution(false);
        setLeaveInstitutionMessage(null);
      }, 2000);
    }
    setLeavingInstitution(false);
  };

  const tabs = [
    { id: 'home' as PortalTab, label: 'Discover', icon: Home },
    { id: 'menu' as PortalTab, label: 'Menu', icon: Utensils },
    { id: 'orders' as PortalTab, label: 'Orders', icon: Receipt, badge: activeOrders.length ? String(activeOrders.length) : undefined },
    { id: 'profile' as PortalTab, label: 'Profile', icon: User },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      <QRModal isOpen={!!qrOrder} onClose={() => setQrOrder(null)} order={qrOrder} />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 shrink-0 border-b border-slate-800/70 glass-strong">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          {/* Logo + Institution */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 text-xs font-black text-slate-950 shadow-lg shadow-emerald-950/50">
              FX
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-white">FOODEXA</span>
                <span className={`hidden sm:inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${roleColor(liveRole)}`}>
                  {roleLabel(liveRole)}
                </span>
              </div>
              <p className="truncate text-[10px] text-slate-500 max-w-[150px] sm:max-w-[280px]">
                {institutionName || 'Campus Portal'}
                {institutionCode && <span className="ml-1 text-slate-600"> · {institutionCode}</span>}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Notifications */}
            <button
              onClick={() => { setShowNotifications(!showNotifications); setUnreadNotif(0); }}
              className="relative p-2 rounded-full border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadNotif > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white">
                  {unreadNotif > 9 ? '9+' : unreadNotif}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative p-2 rounded-full border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[9px] font-black text-slate-950">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-full border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Order Banner */}
        {activeOrders.length > 0 && (
          <div
            className="border-t border-emerald-500/20 bg-emerald-950/40 px-4 py-2 cursor-pointer hover:bg-emerald-950/60 transition-colors"
            onClick={() => setActiveTab('orders')}
          >
            <div className="mx-auto max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-300">
                  {activeOrders.length} active order{activeOrders.length > 1 ? 's' : ''} — {statusLabel(activeOrders[0].status)}
                </span>
              </div>
              <span className="text-[9px] text-emerald-500 font-semibold">Track →</span>
            </div>
          </div>
        )}
      </header>

      {/* ── MAIN LAYOUT ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Desktop Sidebar Nav */}
        <aside className="hidden lg:flex flex-col border-r border-slate-800 glass-strong w-56 shrink-0 p-4 gap-1">
          <div className="mb-4 px-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Navigation</p>
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : ''}`} />
                {tab.label}
                {tab.badge && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-slate-950">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="mt-auto pt-4 border-t border-slate-800">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="mx-auto max-w-7xl px-4 py-5 pb-28 lg:pb-8 space-y-6">

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-950/30 p-4">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-red-300">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="p-1 text-red-500 hover:text-red-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                  <h3 className="text-sm font-black text-white flex items-center gap-2"><Bell className="w-4 h-4 text-emerald-400" /> Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                  {notifications.length ? notifications.slice(0, 8).map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-slate-800/40 transition-colors">
                      <p className="text-xs font-bold text-white">{n.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[9px] text-slate-600 mt-1">{formatDateTime(n.created_at)}</p>
                    </div>
                  )) : (
                    <div className="px-4 py-8 text-center text-xs text-slate-500">No notifications yet</div>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              /* Skeleton */
              <div className="space-y-6">
                <div className="h-48 rounded-3xl bg-slate-800 animate-pulse" />
                <div className="flex gap-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-20 flex-1 rounded-2xl bg-slate-800 animate-pulse" />)}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1,2,3,4,5,6,7,8].map(i => <SkeletonCard key={i} />)}
                </div>
              </div>
            ) : (
              <>
                {/* ═══════════════════ HOME TAB ═══════════════════ */}
                {activeTab === 'home' && (
                  <div className="space-y-8">
                    {/* Banner Carousel - Dynamic from Supabase */}
                    {banners.length > 0 && (
                      <BannerCarousel banners={banners} />
                    )}

                    {/* Hero Greeting */}
                    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/60 border border-slate-800 p-6 sm:p-8">
                      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                      <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400 backdrop-blur-sm">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              {roleLabel(liveRole)} Dashboard
                            </div>
                            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                              {getGreeting()},<br />
                              <span className="text-emerald-400">{displayName.split(' ')[0]}</span> 👋
                            </h2>
                            {institutionName && (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Building2 className="w-3.5 h-3.5 text-emerald-500/70" />
                                <span className="text-xs font-semibold">{institutionName}</span>
                                {institutionCode && <span className="text-[10px] text-slate-500 ml-1">· {institutionCode}</span>}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span className="text-[10px]">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          {/* Avatar */}
                          <div className={`flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${roleGradient(liveRole)} text-xl font-black text-white shadow-lg`}>
                            {firstLetters}
                          </div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            onClick={() => { setActiveTab('menu'); setTimeout(() => searchRef.current?.focus(), 200); }}
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-950/30 hover:from-emerald-400 hover:to-teal-400 transition-all active:scale-[0.97]"
                          >
                            <Search className="w-3.5 h-3.5" /> Order Food
                          </button>
                          <button
                            onClick={() => setActiveTab('orders')}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-2.5 text-xs font-black text-slate-200 backdrop-blur-sm hover:bg-slate-800 transition-all"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-400" /> Track Orders
                          </button>
                        </div>
                      </div>
                    </section>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center">
                        <p className="text-2xl font-black text-white">{orders.length}</p>
                        <p className="text-[10px] font-semibold text-slate-500 mt-1">Total Orders</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center">
                        <p className="text-2xl font-black text-emerald-400">{activeOrders.length}</p>
                        <p className="text-[10px] font-semibold text-slate-500 mt-1">Active Now</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center">
                        <p className="text-2xl font-black text-amber-400">{menuItems.length}</p>
                        <p className="text-[10px] font-semibold text-slate-500 mt-1">Menu Items</p>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <section>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-500" />
                        <input
                          value={searchQuery}
                          onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) setActiveTab('menu'); }}
                          placeholder="Search food, counters, categories..."
                          className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
                        />
                      </div>
                    </section>

                    {/* Categories */}
                    {allCategories.length > 0 && (
                      <section className="space-y-3">
                        <h3 className="text-base font-black text-white">Categories</h3>
                        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                          {allCategories.map((cat, idx) => (
                            <button
                              key={cat}
                              onClick={() => { setSelectedCategory(cat); setActiveTab('menu'); }}
                              className={`shrink-0 rounded-2xl border bg-gradient-to-br ${getCategoryGradient(idx)} backdrop-blur-sm px-4 py-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg min-w-[90px]`}
                            >
                              <span className="text-xl block mb-1">{getCategoryEmoji(cat)}</span>
                              <p className="text-[10px] font-black text-white">{cat}</p>
                              <p className="text-[9px] text-slate-300/70">{menuItems.filter((i) => i.category === cat).length} items</p>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Campus Counters */}
                    {counters.length > 0 && (
                      <section className="space-y-3">
                        <h3 className="text-base font-black text-white">Campus Counters</h3>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                          {counters.map((c) => (
                            <button
                              key={c.name}
                              onClick={() => { setSelectedCounter(c.name); setActiveTab('menu'); }}
                              className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-lg group"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-950/80 flex items-center justify-center">
                                  <ChefHat className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className="flex items-center gap-1 text-emerald-400">
                                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span className="text-[9px] font-bold">Open</span>
                                </div>
                              </div>
                              <p className="text-xs font-extrabold text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">{c.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{c.count} items</p>
                              {c.avgRating > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                  <span className="text-[9px] font-bold text-amber-400">{c.avgRating.toFixed(1)}</span>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Active Orders quick view */}
                    {activeOrders.length > 0 && (
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-black text-white flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-400" /> Active Orders
                          </h3>
                          <button onClick={() => setActiveTab('orders')} className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300">
                            View all →
                          </button>
                        </div>
                        <div className="space-y-3">
                          {activeOrders.slice(0, 2).map((order) => (
                            <div
                              key={order.id}
                              className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 cursor-pointer hover:bg-emerald-950/30 transition-colors"
                              onClick={() => setActiveTab('orders')}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="text-[9px] font-mono text-slate-500">{order.order_id}</p>
                                  <p className="text-xs font-bold text-white">{order.counter}</p>
                                </div>
                                <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black flex items-center gap-1 ${statusColor(order.status)}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot(order.status)} animate-pulse`} />
                                  {statusLabel(order.status)}
                                </span>
                              </div>
                              <OrderProgressBar status={order.status} />
                              {order.status === 'ready' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setQrOrder(order); }}
                                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-slate-950 py-2 text-xs font-black hover:bg-emerald-400 transition-colors"
                                >
                                  <QrCode className="w-3.5 h-3.5" /> Show Pickup Code
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Featured Offers */}
                    {offerItems.length > 0 && (
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-black text-white flex items-center gap-2">
                            <Tag className="w-4 h-4 text-amber-400" /> Featured Offers
                          </h3>
                          <button onClick={() => setActiveTab('menu')} className="text-[10px] font-bold text-emerald-400">See all →</button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                          {offerItems.map((item) => (
                            <div key={item.id} className="flex-shrink-0 w-52">
                              <FoodCard item={item} onAdd={addToCart} onFavorite={toggleFavorite} isFavorited={favorites.has(item.id)} />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Trending */}
                    {trendingItems.length > 0 && (
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-black text-white flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-400" /> Trending Now
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                          {trendingItems.slice(0, 8).map((item) => (
                            <FoodCard key={item.id} item={item} onAdd={addToCart} onFavorite={toggleFavorite} isFavorited={favorites.has(item.id)} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Quick Reorder */}
                    {quickReorderItems.length > 0 && (
                      <section className="space-y-3">
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          <RotateCcw className="w-4 h-4 text-cyan-400" /> Reorder Favourites
                        </h3>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                          {quickReorderItems.map((item) => (
                            <FoodCard key={item.id} item={item} onAdd={addToCart} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* AI Picks */}
                    {personalizedItems.length > 0 && (
                      <section className="space-y-3">
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-violet-400" /> Recommended For You
                        </h3>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                          {personalizedItems.map((item) => (
                            <FoodCard key={item.id} item={item} onAdd={addToCart} onFavorite={toggleFavorite} isFavorited={favorites.has(item.id)} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Fast Pickup */}
                    {menuItems.filter((i) => i.prep_time_minutes !== undefined && i.prep_time_minutes <= 10 && i.is_available).length > 0 && (
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-black text-white flex items-center gap-2">
                            <Zap className="w-4 h-4 text-cyan-400" /> Fast Pickup
                          </h3>
                          <button onClick={() => { setActiveTab('menu'); setSortBy('prep_time'); }} className="text-[10px] font-bold text-emerald-400">See all →</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                          {menuItems.filter((i) => i.prep_time_minutes !== undefined && i.prep_time_minutes <= 10 && i.is_available).slice(0, 4).map((item) => (
                            <FoodCard key={item.id} item={item} onAdd={addToCart} onFavorite={toggleFavorite} isFavorited={favorites.has(item.id)} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Healthy Meals */}
                    {menuItems.filter((i) => i.is_healthy || (i.calories !== undefined && i.calories < 300)).length > 0 && (
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-black text-white flex items-center gap-2">
                            <Salad className="w-4 h-4 text-emerald-400" /> Healthy Meals
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                          {menuItems.filter((i) => i.is_healthy || (i.calories !== undefined && i.calories < 300)).slice(0, 4).map((item) => (
                            <FoodCard key={item.id} item={item} onAdd={addToCart} onFavorite={toggleFavorite} isFavorited={favorites.has(item.id)} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Recently Added */}
                    {[...menuItems].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()).slice(0, 4).length > 0 && (
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-black text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-pink-400" /> Recently Added
                          </h3>
                          <button onClick={() => { setActiveTab('menu'); setSortBy('newest'); }} className="text-[10px] font-bold text-emerald-400">See all →</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                          {[...menuItems].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()).slice(0, 4).map((item) => (
                            <FoodCard key={item.id} item={item} onAdd={addToCart} onFavorite={toggleFavorite} isFavorited={favorites.has(item.id)} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Announcements */}
                    {notifications.length > 0 && (
                      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                          <h3 className="text-sm font-black text-white flex items-center gap-2">
                            <Bell className="w-4 h-4 text-emerald-400" /> Campus Updates
                          </h3>
                        </div>
                        <div className="divide-y divide-slate-800">
                          {notifications.slice(0, 4).map((n) => (
                            <div key={n.id} className="px-5 py-3.5 hover:bg-slate-800/40 transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <h4 className="text-xs font-bold text-white">{n.title}</h4>
                                <span className="shrink-0 text-[9px] text-slate-500">{formatDateTime(n.created_at)}</span>
                              </div>
                              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400 line-clamp-2">{n.message}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Empty state */}
                    {menuItems.length === 0 && notifications.length === 0 && counters.length === 0 && (
                      <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/30 p-12 text-center">
                        <Utensils className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                        <h3 className="text-lg font-black text-white">Welcome to FOODEXA!</h3>
                        <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
                          Your campus portal is live. Menu items and announcements added in Supabase will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════════════ MENU TAB ═══════════════════ */}
                {activeTab === 'menu' && (
                  <div className="space-y-5">
                    {/* Search & Filters */}
                    <div className="sticky top-0 -mt-5 pt-5 pb-3 bg-slate-950 z-10 space-y-3">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-500" />
                        <input
                          ref={searchRef}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search meals, counters, or categories..."
                          className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                        />
                      </div>
                      {/* Category filters */}
                      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                        {['ALL', ...allCategories].map((c) => (
                          <button
                            key={c}
                            onClick={() => { setSelectedCategory(c === 'ALL' ? 'ALL' : c); setSelectedCounter('ALL'); }}
                            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                              selectedCategory === c
                                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-950/30'
                                : 'border border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                            }`}
                          >
                            {c === 'ALL' ? `All Items` : `${getCategoryEmoji(c)} ${c}`}
                          </button>
                        ))}
                      </div>
                      {/* Counter filters */}
                      {counters.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                          {['ALL', ...counters.map((c) => c.name)].map((c) => (
                            <button
                              key={c}
                              onClick={() => { setSelectedCounter(c); setSelectedCategory('ALL'); }}
                              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                                selectedCounter === c
                                  ? 'bg-slate-200 text-slate-950'
                                  : 'border border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              {c === 'ALL' ? 'All Counters' : c}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Veg / Non-Veg Toggle */}
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => { setShowVegFilter(!showVegFilter); setShowNonVeg(false); }}
                          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                            showVegFilter
                              ? 'bg-emerald-500 text-slate-950'
                              : 'border border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          🥗 Veg Only
                        </button>
                        <button
                          onClick={() => { setShowNonVeg(!showNonVeg); setShowVegFilter(false); }}
                          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                            showNonVeg
                              ? 'bg-red-500 text-white'
                              : 'border border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          🍗 Non-Veg
                        </button>
                        <select
                          value={selectedPriceRange}
                          onChange={(e) => setSelectedPriceRange(e.target.value)}
                          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold border border-slate-700 bg-slate-900 text-slate-400 outline-none"
                        >
                          <option value="ALL">Any Price</option>
                          <option value="0-50">Under ₹50</option>
                          <option value="50-100">₹50 – ₹100</option>
                          <option value="100-200">₹100 – ₹200</option>
                          <option value="200-99999">₹200+</option>
                        </select>
                        <select
                          value={selectedPrepTime}
                          onChange={(e) => setSelectedPrepTime(e.target.value)}
                          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold border border-slate-700 bg-slate-900 text-slate-400 outline-none"
                        >
                          <option value="ALL">Any Prep Time</option>
                          <option value="5">≤5 min</option>
                          <option value="10">≤10 min</option>
                          <option value="15">≤15 min</option>
                          <option value="20">≤20 min</option>
                        </select>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold border border-slate-700 bg-slate-900 text-slate-400 outline-none"
                        >
                          <option value="popular">Popular</option>
                          <option value="newest">Newest</option>
                          <option value="price_asc">Price Low→High</option>
                          <option value="price_desc">Price High→Low</option>
                          <option value="prep_time">Fastest Prep</option>
                          <option value="rating">Top Rated</option>
                        </select>
                      </div>

                      {/* Results count */}
                      <p className="text-[10px] font-semibold text-slate-500">
                        {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                        {searchQuery && ` for "${searchQuery}"`}
                      </p>
                    </div>

                    {filteredItems.length > 0 ? (
                      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                        {filteredItems.map((item) => (
                          <FoodCard
                            key={item.id}
                            item={item}
                            onAdd={addToCart}
                            onFavorite={toggleFavorite}
                            isFavorited={favorites.has(item.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Search}
                        title="No items found"
                        message={searchQuery ? `No results for "${searchQuery}". Try different keywords.` : 'No menu items available with selected filters.'}
                        action={{ label: 'Clear filters', onClick: () => { setSearchQuery(''); setSelectedCategory('ALL'); setSelectedCounter('ALL'); setShowVegFilter(false); setShowNonVeg(false); setSelectedPriceRange('ALL'); setSelectedPrepTime('ALL'); setSortBy('popular'); } }}
                      />
                    )}
                  </div>
                )}

                {/* ═══════════════════ ORDERS TAB ═══════════════════ */}
                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-black text-white">Your Orders</h2>
                      <span className="text-xs font-semibold text-slate-500">{orders.length} total</span>
                    </div>

                    {/* Active Orders */}
                    {activeOrders.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          Active Orders
                        </h3>
                        {activeOrders.map((order) => (
                          <div key={order.id} className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-emerald-950/20 p-5 space-y-4">
                            {/* Order header */}
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[9px] font-mono text-slate-500 mb-0.5">{order.order_id}</p>
                                <h4 className="text-base font-black text-white">{order.counter}</h4>
                                <p className="text-[10px] text-slate-400">{formatDateTime(order.created_at)}</p>
                              </div>
                              <div className="text-right">
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black ${statusColor(order.status)}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot(order.status)} animate-pulse`} />
                                  {statusLabel(order.status)}
                                </span>
                                <p className="text-sm font-black text-emerald-300 mt-2">{formatINR(order.total_amount)}</p>
                              </div>
                            </div>

                            {/* Progress */}
                            <OrderProgressBar status={order.status} />

                            {/* Items */}
                            <div className="space-y-1.5 border-t border-slate-800 pt-3">
                              {order.items.map((item, i) => (
                                <div key={`${order.id}-${i}`} className="flex justify-between text-xs text-slate-300">
                                  <span className="font-semibold">{item.quantity}× {item.name}</span>
                                  <span className="text-slate-400">{formatINR(item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>

                            {/* QR Pickup */}
                            {order.status === 'ready' && (
                              <button
                                onClick={() => setQrOrder(order)}
                                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/30 hover:from-emerald-400 hover:to-teal-400 transition-all animate-pulse"
                              >
                                <QrCode className="w-4 h-4" /> Show Pickup QR Code
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Past Orders */}
                    {pastOrders.length > 0 ? (
                      <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Order History</h3>
                        <div className="space-y-2">
                          {pastOrders.slice(0, 20).map((order) => (
                            <div key={order.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:bg-slate-900 transition-colors">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[9px] font-mono text-slate-600">{order.order_id}</p>
                                  <p className="text-xs font-bold text-white mt-0.5 truncate">{order.counter}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                    {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                                  </p>
                                </div>
                                <div className="text-right shrink-0 space-y-1">
                                  <p className="text-sm font-black text-white">{formatINR(order.total_amount)}</p>
                                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold inline-block ${statusColor(order.status)}`}>
                                    {statusLabel(order.status)}
                                  </span>
                                  <p className="text-[9px] text-slate-600">{formatDate(order.created_at)}</p>
                                </div>
                              </div>
                              {/* Reorder button */}
                              <button
                                onClick={() => {
                                  order.items.forEach(orderItem => {
                                    const menuItem = menuItems.find(m => m.name === orderItem.name);
                                    if (menuItem) for (let q = 0; q < orderItem.quantity; q++) addToCart(menuItem);
                                  });
                                  setShowCart(true);
                                }}
                                className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/40 py-2 text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                              >
                                <RotateCcw className="w-3 h-3" /> Reorder
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : activeOrders.length === 0 && (
                      <EmptyState
                        icon={Receipt}
                        title="No orders yet"
                        message="Start ordering from the campus menu and your orders will appear here."
                        action={{ label: 'Browse Menu', onClick: () => setActiveTab('menu') }}
                      />
                    )}
                  </div>
                )}

                {/* ═══════════════════ PROFILE TAB ═══════════════════ */}
                {activeTab === 'profile' && (
                  <div className="space-y-5 max-w-2xl mx-auto">
                    {/* Profile hero */}
                    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
                      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-500/8 blur-2xl pointer-events-none" />
                      <div className="flex items-center gap-4">
                        <div className={`flex-shrink-0 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${roleGradient(liveRole)} text-2xl font-black text-white shadow-lg`}>
                          {firstLetters}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl font-black text-white truncate">{displayName}</h3>
                          <p className="text-xs text-emerald-300 truncate mt-0.5">{profile?.email || user?.email}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${roleColor(liveRole)}`}>
                              {roleLabel(liveRole)}
                            </span>
                            {institutionCode && (
                              <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[9px] font-mono text-slate-400">
                                {institutionCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center">
                        <p className="text-xl font-black text-white">{orders.length}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Orders</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center">
                        <p className="text-xl font-black text-amber-400">0</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Points</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center">
                        <p className="text-xl font-black text-emerald-400">{favorites.size}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Favourites</p>
                      </div>
                    </div>

                    {/* Profile details */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 divide-y divide-slate-800 overflow-hidden">
                      {[
                        { icon: User, label: 'Full Name', value: profile?.full_name || '—' },
                        { icon: Mail, label: 'Email', value: profile?.email || user?.email || '—' },
                        { icon: Phone, label: 'Phone', value: profile?.phone || '—' },
                        { icon: Building2, label: 'Institution', value: institutionName || '—' },
                        { icon: BookOpen, label: 'Department', value: profile?.department || '—' },
                        { icon: Calendar, label: 'Semester', value: profile?.semester || '—' },
                        { icon: Award, label: 'Programme', value: profile?.programme || '—' },
                        { icon: MapPin, label: 'Campus Block', value: profile?.campus_block || '—' },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3 px-4 py-3">
                          <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-semibold text-slate-600 uppercase">{label}</p>
                            <p className="text-xs font-semibold text-white truncate">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={handleEditProfile}
                        className="flex w-full items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-emerald-400" />
                        Edit Profile
                        <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
                      </button>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="flex w-full items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                      >
                        <Receipt className="w-4 h-4 text-cyan-400" />
                        Order History
                        <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
                      </button>
                      <button
                        onClick={() => setActiveTab('menu')}
                        className="flex w-full items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                      >
                        <Heart className="w-4 h-4 text-rose-400" />
                        My Favourites
                        <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
                      </button>
                    </div>

                    {/* Leave Institution */}
                    {institutionCode && (
                      <button
                        onClick={() => setShowLeaveInstitution(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-950/20 py-3.5 text-sm font-black text-amber-300 hover:bg-amber-950/40 hover:border-amber-500/50 transition-all"
                      >
                        <Building2 className="w-4 h-4" /> Leave Institution
                      </button>
                    )}

                    {/* Sign Out */}
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-950/20 py-3.5 text-sm font-black text-red-300 hover:bg-red-950/40 hover:border-red-500/50 transition-all"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out Account
                    </button>

                    <p className="text-center text-[9px] text-slate-700">FOODEXA v3.0 · Powered by Supabase · {new Date().getFullYear()}</p>
                  </div>
                )}
                {/* ═══════════════════ CHECKOUT TAB ═══════════════════ */}
                {activeTab === 'checkout' && (
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setActiveTab('menu')} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-2xl font-black text-white">Checkout</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        {/* Order Details */}
                        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                          <h3 className="text-sm font-black text-white flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-400" /> Pickup Details
                          </h3>
                          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800">
                            <p className="text-xs font-bold text-slate-300">{institutionName}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Counter: <span className="font-bold text-white">{firstItemCounter}</span></p>
                            <div className="mt-3 flex items-center gap-2 text-[10px] text-amber-400 font-semibold bg-amber-950/30 w-max px-3 py-1.5 rounded-full border border-amber-500/20">
                              <Clock className="w-3 h-3" /> Ready in ~15 mins
                            </div>
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                          <h3 className="text-sm font-black text-white flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-emerald-400" /> Order Summary
                          </h3>
                          <div className="space-y-3">
                            {cart.map((entry) => (
                              <div key={entry.item.id} className="flex justify-between text-xs">
                                <span className="text-slate-300 font-semibold">{entry.quantity}x {entry.item.name}</span>
                                <span className="text-white font-black">{formatINR((entry.item.offer_price || entry.item.price) * entry.quantity)}</span>
                              </div>
                            ))}
                          </div>
                          
                           <div className="pt-4 border-t border-slate-800 space-y-2">
                             <div className="flex justify-between text-xs text-slate-400">
                               <span>Subtotal</span>
                               <span>{formatINR(cartSubtotal)}</span>
                             </div>
                             {cartDiscount > 0 && (
                               <div className="flex justify-between text-xs text-emerald-400">
                                 <span>Discount</span>
                                 <span>-{formatINR(cartDiscount)}</span>
                               </div>
                             )}
                             <div className="flex justify-between text-xs text-slate-400">
                               <span>Taxes (5% GST)</span>
                               <span>{formatINR(cartGST)}</span>
                             </div>
                             <div className="pt-2 flex justify-between text-lg font-black text-white">
                               <span>Grand Total</span>
                               <span className="text-emerald-400">{formatINR(cartGrandTotal)}</span>
                             </div>
                           </div>
                        </div>

                        {/* Additional */}
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Coupon Code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500/50 outline-none"
                          />
                          <textarea
                            placeholder="Notes for Kitchen (Optional)"
                            value={kitchenNotes}
                            onChange={(e) => setKitchenNotes(e.target.value)}
                            rows={2}
                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500/50 outline-none resize-none"
                          />
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                          <h3 className="text-sm font-black text-white flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-emerald-400" /> Payment Method
                          </h3>
                          <div className="space-y-3">
                            <button
                              onClick={() => setPaymentMethod('razorpay')}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl border ${paymentMethod === 'razorpay' ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800 bg-slate-950 hover:bg-slate-900'} transition-all`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'razorpay' ? 'border-emerald-500' : 'border-slate-600'}`}>
                                  {paymentMethod === 'razorpay' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                </div>
                                <span className="text-sm font-bold text-white">Razorpay (UPI, Cards)</span>
                              </div>
                            </button>
                            
                            <button
                              onClick={() => setPaymentMethod('wallet')}
                              disabled
                              className={`w-full flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-950 opacity-50 cursor-not-allowed`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full border-2 border-slate-700" />
                                <span className="text-sm font-bold text-slate-400">Campus Wallet (Coming Soon)</span>
                              </div>
                            </button>

                            <button
                              onClick={() => setPaymentMethod('cash')}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl border ${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800 bg-slate-950 hover:bg-slate-900'} transition-all`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-emerald-500' : 'border-slate-600'}`}>
                                  {paymentMethod === 'cash' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                </div>
                                <span className="text-sm font-bold text-white">Pay at Counter (Cash)</span>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Pay Button */}
                        <button
                          onClick={handlePlaceOrder}
                          disabled={submittingOrder}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-4 text-base font-black text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50 hover:scale-[1.02] hover:shadow-emerald-500/40 transition-all"
                        >
                          {submittingOrder ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                          {submittingOrder ? 'Processing...' : `Pay ${formatINR(cartGrandTotal)}`}
                        </button>
                        <p className="text-center text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                          <Lock className="w-3 h-3" /> Secure Payment via Razorpay
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAYMENT SUCCESS TAB */}
                {activeTab === 'payment_success' && orders[0] && (
                  <div className="max-w-md mx-auto space-y-6 text-center py-10">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                      <CheckCircle className="w-12 h-12 text-slate-950" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-white">Order Confirmed!</h2>
                      <p className="text-sm text-emerald-400 font-semibold">Your order has been sent to the kitchen.</p>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 text-left">
                      <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                        <span className="text-slate-500 font-bold">Order Number</span>
                        <span className="text-white font-mono font-black">{orders[0].order_id}</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                        <span className="text-slate-500 font-bold">Token Number</span>
                        <span className="text-amber-300 font-black">{orders[0].token_number || 'PENDING'}</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                        <span className="text-slate-500 font-bold">Counter</span>
                        <span className="text-white font-bold">{orders[0].counter}</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                        <span className="text-slate-500 font-bold">Pickup PIN</span>
                        <span className="text-cyan-300 font-black">{orders[0].pickup_code || orders[0].pickup_pin || 'N/A'}</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                        <span className="text-slate-500 font-bold">Est. Wait Time</span>
                        <span className="text-amber-400 font-bold">~{orders[0].estimated_prep_time || 15} mins</span>
                      </div>
                      <div className="pt-4 border-t border-slate-800 space-y-2">
                        <button onClick={() => setActiveTab('orders')} className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-slate-950 py-2.5 text-xs font-black hover:bg-emerald-400 transition-colors">
                          <Activity className="w-3.5 h-3.5" /> Live Order Tracking
                        </button>
                        <button onClick={() => setQrOrder(orders[0])} className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors">
                          <QrCode className="w-3.5 h-3.5" /> Show Pickup QR Code
                        </button>
                        <button onClick={() => {
                          const receipt = generateReceipt(orders[0]);
                          const blob = new Blob([receipt], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `receipt-${orders[0].order_id}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                          if (triggerToast) triggerToast('Receipt Downloaded', `Receipt for ${orders[0].order_id} saved.`, 'success');
                        }} className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors">
                          <Receipt className="w-3.5 h-3.5" /> Download Payment Receipt
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('orders')}
                      className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-4 text-sm font-black text-slate-950 shadow-lg hover:from-emerald-400 hover:to-teal-400 transition-all"
                    >
                      Track Order Live
                    </button>
                  </div>
                )}

                {/* ═══════════════════ PAYMENT FAILED TAB ═══════════════════ */}
                {activeTab === 'payment_failed' && (
                  <div className="max-w-md mx-auto space-y-6 text-center py-10">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/30">
                      <XCircle className="w-12 h-12 text-slate-950" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-white">Payment Failed</h2>
                      <p className="text-sm text-red-400 font-semibold">{error || 'Something went wrong during payment.'}</p>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => { setError(null); setActiveTab('checkout'); }}
                        className="flex-1 rounded-2xl border border-slate-700 bg-slate-800 py-4 text-sm font-black text-white hover:bg-slate-700 transition-all"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => { setError(null); setActiveTab('home'); }}
                        className="flex-1 rounded-2xl border border-slate-800 bg-transparent py-4 text-sm font-black text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* ── CART DRAWER ────────────────────────────────────────────── */}
        {showCart && (
          <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm hidden lg:block" onClick={() => setShowCart(false)} />
        )}
        <aside className={`fixed bottom-0 right-0 top-0 z-50 w-full max-w-sm border-l border-slate-800 bg-slate-950 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${showCart ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-400" /> Cart
              {cartCount > 0 && <span className="text-emerald-400">({cartCount})</span>}
            </h3>
            <button onClick={() => setShowCart(false)} className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {cart.length ? cart.map((entry) => {
              const itemTotal = (entry.item.offer_price || entry.item.price) * entry.quantity;
              return (
              <div key={entry.item.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-3 flex gap-3">
                <div className="w-16 h-16 shrink-0 rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center">
                  {entry.item.image_url ? (
                    <img src={entry.item.image_url} alt={entry.item.name} className="w-full h-full object-cover" onError={() => {}} />
                  ) : (
                    <Utensils className="w-6 h-6 text-slate-700" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-white truncate">{entry.item.name}</p>
                      <p className="text-[9px] text-slate-500 truncate">{entry.item.counter_name}</p>
                    </div>
                    <p className="shrink-0 text-xs font-black text-emerald-300">{formatINR(itemTotal)}</p>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-0.5">{formatINR(entry.item.offer_price || entry.item.price)} each</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(entry.item.id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-white w-6 text-center">{entry.quantity}</span>
                    <button
                      onClick={() => updateQuantity(entry.item.id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              );
            }) : (
              <EmptyState icon={ShoppingCart} title="Cart is empty" message="Add items from the menu to start an order." />
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-slate-800 px-5 py-4 space-y-2 bg-slate-950">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal</span>
                <span>{formatINR(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Counter</span>
                <span className="font-semibold text-white truncate max-w-32 ml-2 text-right">{firstItemCounter || 'Multiple'}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>Discount</span>
                  <span>-{formatINR(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-400">
                <span>GST (5%)</span>
                <span>{formatINR(cartGST)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-1">
                <span>Total</span>
                <span className="text-emerald-400">{formatINR(cartGrandTotal)}</span>
              </div>
              <button
                onClick={() => { setShowCart(false); setActiveTab('checkout'); }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-sm font-black text-slate-950 shadow-lg hover:from-emerald-400 hover:to-teal-400 transition-all"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* ── EDIT PROFILE MODAL ─────────────────────────────────────── */}
      {editingProfile && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/85 backdrop-blur-xl p-4" onClick={() => setEditingProfile(false)}>
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Edit Profile</h3>
              <button onClick={() => setEditingProfile(false)} className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {profileMessage && (
              <div className={`rounded-xl p-3 text-xs font-bold ${profileMessage.includes('success') ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-red-950/60 border border-red-500/40 text-red-300'}`}>
                {profileMessage}
              </div>
            )}
            <div className="space-y-3">
              {[
                { label: 'Full Name', key: 'full_name' as const, placeholder: 'Your full name' },
                { label: 'Phone', key: 'phone' as const, placeholder: '+91 XXXXX XXXXX' },
                { label: 'Department', key: 'department' as const, placeholder: 'e.g. Computer Science' },
                { label: 'Semester', key: 'semester' as const, placeholder: 'e.g. 4' },
                { label: 'Programme', key: 'programme' as const, placeholder: 'e.g. B.Tech' },
                { label: 'Campus Block', key: 'campus_block' as const, placeholder: 'e.g. Block A' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-[10px] font-black text-slate-400 mb-1.5 block uppercase tracking-wide">{label}</label>
                  <input
                    value={profileForm[key]}
                    onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-emerald-500/60 transition-colors"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-black text-slate-950 shadow-lg disabled:opacity-50 transition-all"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── LEAVE INSTITUTION MODAL ──────────────────────────────── */}
      {showLeaveInstitution && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/85 backdrop-blur-xl p-4" onClick={() => { setShowLeaveInstitution(false); setLeaveInstitutionMessage(null); }}>
          <div className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-slate-900 p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-500/40 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-lg font-black text-white">Leave Institution</h3>
              </div>
              <button onClick={() => { setShowLeaveInstitution(false); setLeaveInstitutionMessage(null); }} className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {leaveInstitutionMessage ? (
              <div className={`rounded-xl p-4 text-xs font-bold text-center ${leaveInstitutionMessage.includes('Success') ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-red-950/60 border border-red-500/40 text-red-300'}`}>
                {leaveInstitutionMessage}
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-amber-950/30 border border-amber-500/20 p-4 space-y-2">
                  <p className="text-xs text-amber-200 font-semibold">This will:</p>
                  <ul className="text-[11px] text-amber-300/80 space-y-1.5 ml-4 list-disc">
                    <li>Remove your current institution membership</li>
                    <li>Keep your account active and unchanged</li>
                    <li>Allow you to join another institution with a new code</li>
                  </ul>
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                  Your account, orders, and profile data will be preserved.
                </p>
              </>
            )}

            {!leaveInstitutionMessage && (
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowLeaveInstitution(false); setLeaveInstitutionMessage(null); }}
                  className="flex-1 py-3 rounded-2xl border border-slate-700 bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveInstitution}
                  disabled={leavingInstitution}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {leavingInstitution ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                  {leavingInstitution ? 'Leaving...' : 'Leave Institution'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV (Mobile) ─────────────────────────────────────── */}
      <nav className="sticky bottom-0 z-30 lg:hidden shrink-0 border-t border-slate-800 bg-slate-950/98 backdrop-blur-2xl">
        <div className="flex items-stretch justify-around px-2 py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center gap-0.5 flex-1 py-2 text-[9px] font-bold transition-all ${active ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-emerald-950/60' : ''}`}>
                  <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
                </div>
                <span className={active ? 'text-emerald-400' : ''}>{tab.label}</span>
                {tab.badge && (
                  <span className="absolute top-1 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-black text-slate-950">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
