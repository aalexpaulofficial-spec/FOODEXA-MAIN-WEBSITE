import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowRight, Award, Bell, BookOpen, Building2, CheckCircle2, ChefHat, Clock,
  CreditCard, Heart, Home, Loader2, LogOut, MapPin, QrCode, Receipt, Search, Settings,
  ShoppingBag, Sparkles, Star, Tag, TrendingUp, User, Utensils, X, Zap, Edit3, Save,
  Phone, Mail, Hash, Shield, ChevronRight, Flame, Package, RefreshCw, Filter, Wifi,
  WifiOff, Coffee, Pizza, Sandwich, Salad, ChevronLeft, Check, ShoppingCart, Plus, Minus,
  Gift, Bell as BellIcon, RotateCcw, ArrowUpRight, Activity, Calendar, Timer, Info,
  CheckCircle, XCircle, Lock, Trash2, Copy, Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSupabaseOrders } from '../hooks/useSupabaseOrders';
import {
  formatINR, formatDateTime, subscribeMenuItems, subscribeAnnouncements,
  subscribeBanners, subscribeMenuCategories, subscribeCounters, subscribeOrders,
  createOrderAfterPayment, createRazorpayOrder, verifyRazorpayPayment, updateOrderPaymentStatus, getItemAvailability, mapMenuItem, cancelOrder, fetchOrderById,
  fetchMenuItems as fetchMenuItemsService, searchMenuItems, filterMenuItems,
  calculateCartTotals, validateCoupon, applyCouponUsage,
  fetchUserFavorites, toggleFavorite, fetchAIRecommendations, getOrderProgress, getEstimatedTimeRemaining, generateReceipt,
  fetchUserCart, saveUserCart,
  fetchCanteens, subscribeCanteens,
  fetchUserAddresses, subscribeUserAddresses,
  uploadAvatar as uploadAvatarService, removeAvatar as removeAvatarService,
  addUserAddress, updateUserAddress, deleteUserAddress, setDefaultAddress,
  updateDietPreference,
} from '../lib/supabase-service';
import { getTimelineLabel, getTimelineStage, isOrderCancelled, isOrderCompleted, STUDENT_TIMELINE_LABELS, STUDENT_TIMELINE_DESCRIPTIONS } from '../lib/orderTimeline';
import type { MenuItem, Order, OrderStatus, NotificationItem, UserRole, CartItem, FoodFilters, CheckoutData, Canteen, UserAddress, DietPreference } from '../types';
import { PremiumHeader } from './StudentDashboard/PremiumHeader';
import { PremiumBottomNav, PremiumTab } from './StudentDashboard/PremiumBottomNav';
import { ExploreTab } from './StudentDashboard/ExploreTab';
import { NutritionTab } from './StudentDashboard/NutritionTab';
import { AnalyticsTab } from './StudentDashboard/AnalyticsTab';
import { HistoryTab } from './StudentDashboard/HistoryTab';
import { ProfileTab } from './StudentDashboard/ProfileTab';
import { OffersTab } from './StudentDashboard/OffersTab';
import { OrderCompletionScreen } from './StudentDashboard/OrderCompletionScreen';
import { OrderDetailsModal } from './StudentDashboard/OrderDetailsModal';
import { TaxInvoiceModal } from './StudentDashboard/TaxInvoiceModal';
import { OrderRatingModal } from './StudentDashboard/OrderRatingModal';

declare global { interface Window { Razorpay: any } }

interface StudentPortalModalProps { isOpen: boolean; onClose: () => void; role?: UserRole; triggerToast?: (title: string, description: string, type?: 'success' | 'warning' | 'info' | 'ai') => void }
type PortalTab = 'explore' | 'nutrition' | 'analytics' | 'offers' | 'history' | 'profile' | 'checkout' | 'payment_success' | 'payment_failed';

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'accepted', 'preparing', 'cooking', 'quality_check', 'packed', 'ready'];

// ── Utilities ──────────────────────────────────────────────────────────────

const statusLabel = (s: OrderStatus) => {
  const map: Record<OrderStatus, string> = {
    pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing', cooking: 'Cooking', quality_check: 'Quality Check', packed: 'Packed',
    ready: 'Ready for Pickup', completed: 'Completed', cancelled: 'Cancelled',
  };
  return map[s] || s;
};

const statusColor = (s: OrderStatus) => {
  const map: Record<OrderStatus, string> = {
    pending: 'text-amber-300 border-amber-500/40 bg-amber-950/50',
    accepted: 'text-blue-300 border-blue-500/40 bg-blue-950/50',
    preparing: 'text-violet-300 border-violet-500/40 bg-violet-950/50',
    cooking: 'text-orange-300 border-orange-500/40 bg-orange-950/50',
    quality_check: 'text-indigo-300 border-indigo-500/40 bg-indigo-950/50',
    packed: 'text-teal-300 border-teal-500/40 bg-teal-950/50',
    ready: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60',
    completed: 'text-slate-400 border-slate-700 bg-slate-900',
    cancelled: 'text-red-300 border-red-500/40 bg-red-950/50',
  };
  return map[s] || 'text-slate-300 border-slate-700 bg-slate-900';
};

const statusDot = (s: OrderStatus) => {
  const map: Record<OrderStatus, string> = {
    pending: 'bg-amber-400', accepted: 'bg-blue-400', preparing: 'bg-violet-400',
    cooking: 'bg-orange-400', quality_check: 'bg-indigo-400', packed: 'bg-teal-400',
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

declare global { interface Window { Razorpay: any } }

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
  if (!isOpen || !order) return null;
  // Read all QR/pickup values directly from Supabase order record
  const qrValue = order.qr_pickup_code || order.qr_code_data || order.pickup_code || order.pickup_token || order.order_number || order.order_id;
  const counterName = order.counter || 'Campus Counter';

  const downloadQR = () => {
    const img = document.querySelector('#qr-modal-img') as HTMLImageElement;
    if (!img) return;
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `qr-${qrValue}.png`;
    a.click();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(qrValue || '');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4" onClick={onClose}>
      <div
        className="bg-[#DCE1E7] rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-blue-600 text-xs font-bold mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" /> Scan at Counter Scanner
        </div>

        <h3 className="text-2xl font-black text-slate-800 mb-1">Express QR Pickup</h3>
        <p className="text-sm font-medium text-slate-500 mb-6">{counterName}</p>

        <div className="bg-white rounded-2xl p-4 mx-auto max-w-[220px] shadow-lg flex flex-col items-center border-[3px] border-blue-400/50 relative">
          <div className="absolute inset-0 rounded-2xl ring-4 ring-blue-400/20 shadow-[0_0_20px_rgba(59,130,246,0.3)] pointer-events-none" />
          <img 
            id="qr-modal-img"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrValue || '')}`} 
            alt="QR Code" 
            className="w-full h-auto object-contain rounded-lg relative z-10"
          />
        </div>

        <div className="bg-white rounded-2xl p-4 mt-6 text-left shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase">Counter Number</span>
            <span className="text-sm font-black text-slate-900">{counterName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Pickup Code</span>
            <span className="text-base font-black text-blue-600 uppercase">{qrValue}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button onClick={copyCode} className="w-full py-3 bg-white rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2">
            <Copy className="w-4 h-4" /> Copy Code
          </button>
          <button onClick={downloadQR} className="w-full py-3 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Download QR
          </button>
        </div>
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

  // ── Availability logic ──
  // Uses shared utility that matches Institution Dashboard logic
  const { isSoldOut } = getItemAvailability(item);
  const canAddToCart = true; // Always enabled unless explicitly blocked

  const handleAdd = () => {
    if (!canAddToCart) return;
    setAdding(true);
    onAdd(item);
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:shadow-xl hover:shadow-slate-950/40">
      {/* Image */}
      <div className="relative h-44 bg-slate-800 overflow-hidden">
        {item.image_url && !imgErr && !item.image_url.startsWith('blob:') ? (
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
          {item.stock !== undefined && item.stock <= 5 && item.stock > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/50 px-2 py-0.5 text-[9px] font-bold text-amber-300">
              <Package className="w-2 h-2" /> {item.stock} left
            </span>
          )}
        </div>

        {/* Sold Out overlay badge */}
        {isSoldOut && (
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center h-44 bg-slate-950/70 backdrop-blur-sm z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/50 bg-red-950/90 px-3 py-1 text-[10px] font-black text-red-300">
              <XCircle className="w-3 h-3" /> Sold Out
            </span>
          </div>
        )}

        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={!canAddToCart}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold shadow-sm transition-all active:scale-[0.97] ${
            !canAddToCart
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : adding
                ? 'bg-emerald-500 text-slate-950 scale-[0.98]'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 hover:shadow-emerald-950/40 hover:shadow-md'
          }`}
        >
          {!canAddToCart ? (
            'Sold Out'
          ) : adding ? (
            <><Check className="w-4 h-4" /> Added!</>
          ) : (
            <><Plus className="w-4 h-4" /> Add to Cart</>
          )}
        </button>
      </div>
    </article>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────

export const StudentPortalModal: React.FC<StudentPortalModalProps> = ({ isOpen, onClose, role, triggerToast }) => {
  const { user, profile, refreshProfile, signOut, updateProfile, leaveInstitution, institutionData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PortalTab>('explore');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [banners, setBanners] = useState<any[]>([]);

  // Supabase Realtime orders — single source of truth
  const { orders, activeOrders, pastOrders, loading: ordersLoading, error: ordersError, refresh: refreshOrders } = useSupabaseOrders({
    userId: user?.id,
    enabled: isOpen && !!user?.id,
  });

  const [countersList, setCountersList] = useState<any[]>([]);
  const [institutionName, setInstitutionName] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [institutionCity, setInstitutionCity] = useState('');
  const [institutionCampus, setInstitutionCampus] = useState('');
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

   // Canteens & Addresses
   const [canteens, setCanteens] = useState<Canteen[]>([]);
   const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);

  // Completion & Detail States
  const [completionOrder, setCompletionOrder] = useState<Order | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);

  // Live Time for countdowns
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

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
  const estimatedPrepTime = cart.length > 0 ? Math.max(...cart.map(c => c.item.prep_time_minutes || 15)) : 15;

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
          const { data: bData } = await supabase.from('banners').select('*').eq('is_active', true).order('display_order', { ascending: true });
          setBanners((bData || []) as any[]);

          // Fetch counters for this institution
          let countersQuery = supabase.from('counters').select('*').eq('status', 'open');
          if (instId) {
            countersQuery = countersQuery.eq('institution_id', instId);
          }
          const { data: cData } = await countersQuery;
          setCountersList((cData || []) as any[]);

         // Fetch user favorites
           if (user?.id) {
             const favIds = await fetchUserFavorites(user.id);
             setFavorites(new Set(favIds));
           }

           // Fetch menu items — only for this student's institution
           let menuQuery = supabase
             .from('menu_items')
             .select('*')
             .order('food_name', { ascending: true });
           if (instId) {
             menuQuery = menuQuery.eq('institution_id', instId);
           }
           const menuResult = await menuQuery;

           if (!menuResult.error) {
             setMenuItems((menuResult.data || []).map(mapMenuItem));
           }

           // Fetch canteens for this institution
           const canteenResult = await fetchCanteens(instId || undefined);
           setCanteens(canteenResult);

           // Fetch user addresses
           if (user?.id) {
             const addresses = await fetchUserAddresses(user.id);
             setUserAddresses(addresses);
           }

        // Fetch notifications — silently ignore RLS errors
        const notifResult = await supabase
          .from('notifications')
          .select('id, title, message, created_at, type, is_read')
          .order('created_at', { ascending: false })
          .limit(50);
        if (!notifResult.error) {
          const notifs = (notifResult.data || []).map((r: any) => ({
            id: String(r.id), title: String(r.title || 'Update'),
            message: String(r.message || ''),
            created_at: r.created_at || '', type: String(r.type || 'announcement'), read: Boolean(r.is_read),
          }));
          setNotifications(notifs);
          setUnreadNotif(notifs.filter(n => !n.read).length);
        }

        // Fetch institution name — prefer AuthContext (already loaded), fallback to direct query
        if (institutionData?.institution_name) {
          const nameField = institutionData.institution_name;
          setInstitutionName(`${nameField}${institutionData.campus ? ` · ${institutionData.campus}` : ''}`);
          setInstitutionCode(institutionData.institution_code || '');
          setInstitutionCampus(institutionData.campus || '');
          setInstitutionCity(institutionData.city || '');
        } else if (instId) {
          const { data: inst } = await supabase
            .from('institutions')
            .select('institution_name, name, campus, city, institution_code')
            .eq('id', instId)
            .maybeSingle();
          if (inst) {
            const nameField = inst.institution_name || inst.name || '';
            setInstitutionName(`${nameField}${inst.campus ? ` · ${inst.campus}` : ''}`);
            setInstitutionCode(inst.institution_code || '');
            setInstitutionCampus(inst.campus || '');
            setInstitutionCity(inst.city || '');
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

    const unsubMenu = subscribeMenuItems((payload: any) => {
      if (payload.eventType === 'INSERT') {
        setMenuItems((prev) => { const exists = prev.find((i) => i.id === String(payload.new.id)); return exists ? prev : [...prev, mapMenuItem(payload.new)]; });
      } else if (payload.eventType === 'UPDATE') {
        setMenuItems((prev) => prev.map((i) => i.id === String(payload.new.id) ? { ...i, ...mapMenuItem(payload.new), id: i.id } : i));
      } else if (payload.eventType === 'DELETE') {
        setMenuItems((prev) => prev.filter((i) => i.id !== String(payload.old.id)));
      }
    }, profile?.institution_id ? { institution_id: profile.institution_id } : undefined);
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

    // Live notification subscription for order status updates
    const unsubOrderNotifs = subscribeOrders((payload: any) => {
      if (!payload?.new || !user?.id) return;
      const record = payload.new;
      if (record.student_id && record.student_id !== user.id) return;

      const statusMap: Record<string, string> = {
        accepted: 'Order Accepted',
        preparing: 'Preparing Your Order',
        cooking: 'Cooking in Progress',
        ready: 'Ready for Pickup',
        completed: 'Order Collected',
        cancelled: 'Order Cancelled',
      };

      const notifTitle = statusMap[record.status] || 'Order Update';
      const notifMsg = record.status === 'ready'
        ? 'Your order is ready! Show your pickup code at the counter.'
        : record.status === 'completed'
          ? 'Your order has been collected. Thank you!'
          : `Order status changed to ${record.status || record.order_status || 'updated'}`;

      setNotifications((prev) => [{
        id: `notif-${Date.now()}`,
        title: notifTitle,
        message: notifMsg,
        created_at: new Date().toISOString(),
        type: 'order_update',
        read: false,
      }, ...prev]);
      setUnreadNotif(c => c + 1);

       // Show toast for real-time order updates
       if (triggerToast && ['accepted', 'preparing', 'ready', 'completed'].includes(record.status)) {
         triggerToast(notifTitle, notifMsg, record.status === 'completed' ? 'success' : 'info');
       }
     }, { user_id: user?.id });

     // Realtime canteens subscription
     const unsubCanteens = subscribeCanteens((payload: any) => {
       const currentInstId = profile?.institution_id;
       if (!currentInstId) return;
       if (payload.eventType === 'INSERT' && payload.new?.institution_id === currentInstId && payload.new?.is_active) {
         setCanteens((prev) => [...prev, payload.new]);
       } else if (payload.eventType === 'UPDATE') {
         setCanteens((prev) => prev.map((c) => c.id === payload.new.id ? payload.new : c));
       } else if (payload.eventType === 'DELETE') {
         setCanteens((prev) => prev.filter((c) => c.id !== payload.old.id));
       }
     }, profile?.institution_id || undefined);

     // Realtime user addresses subscription
     let unsubAddresses: (() => void) | undefined;
     if (user?.id) {
       unsubAddresses = subscribeUserAddresses(user.id, (payload: any) => {
         if (payload.eventType === 'INSERT') {
           setUserAddresses((prev) => [payload.new, ...prev]);
         } else if (payload.eventType === 'UPDATE') {
           setUserAddresses((prev) => prev.map((a) => a.id === payload.new.id ? payload.new : a));
         } else if (payload.eventType === 'DELETE') {
           setUserAddresses((prev) => prev.filter((a) => a.id !== payload.old.id));
         }
       });
     }

     return () => { unsubMenu(); unsubNotif(); unsubBanners(); unsubCounters(); unsubOrderNotifs(); unsubCanteens(); if (unsubAddresses) unsubAddresses(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, profile?.institution_id, user?.id]);

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

  const { subtotal: cartSubtotal, discount: cartDiscount, convenienceFee: cartConvenienceFee, grandTotal: cartGrandTotal } = useMemo(() => {
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

  // ── PRODUCTION PAYMENT FLOW ────────────────────────────────────────────
  // Order is ONLY created in Supabase AFTER payment succeeds.
  // Institution never sees unpaid orders.
  const handlePlaceOrder = async () => {
    if (!user?.id || !profile?.email) { setError('Sign in required.'); return; }
    if (!liveRole) { setError('Profile role missing.'); return; }
    if (!cart.length) return;

    setSubmittingOrder(true); setError(null);

    // Re-fetch institution_id fresh from DB — React state may be stale
    const { data: freshProfileRow, error: profileFetchError } = await supabase
      .from('profiles')
      .select('institution_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileFetchError) {
      const msg = 'Unable to verify your profile. Please try again.';
      setError(msg);
      if (triggerToast) triggerToast('Profile Error', msg, 'warning');
      setSubmittingOrder(false);
      return;
    }

    const liveInstitutionId = freshProfileRow?.institution_id || profile?.institution_id || null;

    if (!liveInstitutionId) {
      const msg = 'You must join an institution before placing an order.';
      setError(msg);
      if (triggerToast) triggerToast('Missing Institution', msg, 'warning');
      setSubmittingOrder(false);
      return;
    }

    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const tempReceiptId = `fdx_temp_${dateStr}_${Date.now()}`;

      const itemsForBackend = cart.map((e) => ({
        id: e.item.id,
        name: e.item.name,
        quantity: e.quantity,
        price: e.item.offer_price || e.item.price,
        subtotal: (e.item.offer_price || e.item.price) * e.quantity,
      }));
       const itemsFull = cart.map((e) => ({
         id: e.item.id,
         name: e.item.name,
         variant: e.item.food_type || e.item.category || e.item.counter_name || null,
         quantity: e.quantity,
         price: e.item.offer_price || e.item.price,
         subtotal: (e.item.offer_price || e.item.price) * e.quantity,
         image_url: e.item.image_url,
         is_veg: e.item.is_veg,
       }));

      // ── STEP 1: Create Razorpay order (NO Supabase write yet) ──────────
      const razorpayResult = await createRazorpayOrder({
        amount: cartGrandTotal,
        currency: 'INR',
        user_id: user.id,
        email: profile.email,
        phone: profile.phone || undefined,
        name: profile.full_name || undefined,
        institution_id: liveInstitutionId,
        order_id: tempReceiptId,
        items: itemsForBackend,
      });

      if (!razorpayResult.success || !razorpayResult.order_id) {
        // DEMO FALLBACK: Simulate successful payment (no DB writes before this)
        const simOrderId = `pay_${Date.now()}`;
        const simPaymentId = `pay_${Date.now()}`;
        const simSignature = `simulated_signature_${Date.now()}`;

        const createResult = await createOrderAfterPayment({
          user_id: user.id,
          email: profile.email,
          role: liveRole,
          customer_name: profile.full_name || user.email?.split('@')[0] || 'Customer',
          phone: profile.phone || '0000000000',
          institution_id: liveInstitutionId,
          canteen_id: cart[0]?.item.canteen_id || cart[0]?.item.counter_id || null,
          items: itemsForBackend,
          itemsFull,
          total_amount: cartGrandTotal,
          razorpay_order_id: simOrderId,
          razorpay_payment_id: simPaymentId,
          razorpay_signature: simSignature,
          payment_method: 'razorpay',
          estimated_prep_time_minutes: estimatedPrepTime,
          notes: kitchenNotes || null,
        });

        if (createResult.error || !createResult.data) {
          setError(createResult.error || 'Failed to create order after payment.');
          setActiveTab('payment_failed');
          setSubmittingOrder(false);
          if (triggerToast) triggerToast('Order Creation Failed', createResult.error || 'Contact support.', 'warning');
          return;
        }

        await refreshOrders();
        setCart([]);
        setShowCart(false);
        setCouponDiscount(0);
        setCouponCode('');
        setActiveTab('payment_success');
        setSubmittingOrder(false);
        if (triggerToast) triggerToast('Payment Successful', 'Order placed successfully.', 'success');
        return;
      }

      const razorpayKeyId = razorpayResult.razorpay_key_id;
      if (!razorpayKeyId) { setError('Payment configuration error.'); setSubmittingOrder(false); return; }

      // ── STEP 2: Open Razorpay checkout (NO Supabase order yet) ─────────
      const options: any = {
        key: razorpayKeyId,
        amount: razorpayResult.amount,
        currency: razorpayResult.currency || 'INR',
        name: 'FOODEXA',
        description: `Campus Order`,
        image: 'https://foodexa.com/logo.png',
        order_id: razorpayResult.order_id,
        handler: async function (response: any) {
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;
          try {
            // ── STEP 3: Server-side verification ────────────────────────
            const verifyResult = await verifyRazorpayPayment({
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              user_id: user.id,
              order_id: tempReceiptId,
            });

            if (!verifyResult.success) {
              // Payment failed — NO order was created in Supabase
              setError(verifyResult.error || 'Payment verification failed.');
              setActiveTab('payment_failed');
              setSubmittingOrder(false);
              if (triggerToast) triggerToast('Payment Verification Failed', verifyResult.error || 'Contact support.', 'warning');
              return;
            }

            // ── STEP 4: Create order + order_items in Supabase ──────────
            // Only now does the institution see the order
            const createResult = await createOrderAfterPayment({
              user_id: user.id,
              email: profile.email,
              role: liveRole,
              customer_name: profile.full_name || user.email?.split('@')[0] || 'Customer',
              phone: profile.phone || '0000000000',
              institution_id: liveInstitutionId,
              canteen_id: cart[0]?.item.canteen_id || cart[0]?.item.counter_id || null,
              items: itemsForBackend,
              itemsFull,
              total_amount: cartGrandTotal,
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              payment_method: 'razorpay',
              estimated_prep_time_minutes: estimatedPrepTime,
              notes: kitchenNotes || null,
            });

            if (createResult.error || !createResult.data) {
              setError(createResult.error || 'Payment succeeded but order creation failed. Contact support.');
              setActiveTab('payment_failed');
              setSubmittingOrder(false);
              if (triggerToast) triggerToast('Order Creation Failed', createResult.error || 'Contact support.', 'warning');
              return;
            }

            // ── STEP 5: Success — refresh and show confirmation ──────────
            await refreshOrders();
            setCart([]);
            setShowCart(false);
            setCouponDiscount(0);
            setCouponCode('');
            setActiveTab('payment_success');
            setSubmittingOrder(false);
            setError(null);
            if (triggerToast) triggerToast('Order Placed!', 'Your order is being prepared.', 'success');

          } catch (verifyErr: any) {
            setError('Payment completed but order creation failed. Contact support.');
            setActiveTab('payment_failed');
            setSubmittingOrder(false);
            if (triggerToast) triggerToast('Verification Error', 'Payment completed but order confirmation failed.', 'warning');
          }
        },
        prefill: {
          name: profile.full_name || '',
          email: profile.email || '',
          contact: profile.phone || '',
        },
        notes: {
          institution_id: liveInstitutionId,
          receipt: tempReceiptId,
        },
        theme: { color: '#10b981' },
        modal: { ondismiss: function () { setSubmittingOrder(false); } },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', async function (response: any) {
        // NO order was created in Supabase — nothing to update
        setError(`Payment failed: ${response?.error?.description || 'Please try again.'}`);
        setActiveTab('payment_failed');
        setSubmittingOrder(false);
        if (triggerToast) triggerToast('Payment Failed', response?.error?.description || 'Please try again.', 'warning');
      });
      razorpay.open();

    } catch (err: any) {
      setError(err?.message || 'Failed to initiate payment.');
      setActiveTab('payment_failed');
      setSubmittingOrder(false);
      if (triggerToast) triggerToast('Payment Error', err?.message || 'Failed to initiate payment.', 'warning');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 text-slate-900 overflow-hidden">
      <QRModal isOpen={!!qrOrder} onClose={() => setQrOrder(null)} order={qrOrder} />

      {/* Order Detail Modals */}
      {detailsOrder && (
        <OrderDetailsModal isOpen={true} onClose={() => setDetailsOrder(null)} order={detailsOrder} institutionName={institutionName} />
      )}
      {invoiceOrder && (
        <TaxInvoiceModal isOpen={true} onClose={() => setInvoiceOrder(null)} order={invoiceOrder} institutionName={institutionName} />
      )}
      {ratingOrder && (
        <OrderRatingModal isOpen={true} onClose={() => setRatingOrder(null)} order={ratingOrder} userId={user?.id || ''} triggerToast={triggerToast} />
      )}

      {/* ── MAIN LAYOUT ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">

        {/* Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth min-w-0">
          <PremiumHeader
            institutionName={institutionName}
            institutionCode={institutionCode}
            institutionCity={institutionCity}
            institutionCampus={institutionCampus}
            liveRole={liveRole}
            avatarUrl={profile?.avatar_url || user?.user_metadata?.avatar_url}
            userName={profile?.full_name || user?.email}
            walletBalance={profile?.wallet_balance}
            unreadNotif={unreadNotif}
            cartCount={cartCount}
            onOpenNotifications={() => { setShowNotifications(!showNotifications); setUnreadNotif(0); }}
            onOpenCart={() => setShowCart(!showCart)}
            onOpenLxAI={() => triggerToast && triggerToast('LX AI', 'AI Assistant coming soon!', 'info')}
            onClose={onClose}
          />
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
              <div className="rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Bell className="w-4 h-4 text-emerald-600" /> Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto bg-white">
                  {notifications.length ? notifications.slice(0, 8).map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                      <p className="text-xs font-bold text-slate-900">{n.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[9px] text-slate-400 mt-1">{formatDateTime(n.created_at)}</p>
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
                {/* ═══════════════════ PREMIUM TABS ═══════════════════ */}
                 {activeTab === 'explore' && (
                  <ExploreTab
                    menuItems={menuItems}
                    filteredItems={filteredItems}
                    activeOrders={activeOrders}
                    onAddCart={(item) => setCart((prev) => { const idx = prev.findIndex(e => e.item.id === item.id); return idx >= 0 ? prev.map((e, i) => i === idx ? { ...e, quantity: e.quantity + 1 } : e) : [...prev, { item, quantity: 1 }]; })}
                    onTrackOrder={() => setActiveTab('payment_success')}
                    onQrOpen={(o) => setQrOrder(o)}
                    onFavorite={(item) => { toggleFavorite(item); triggerToast && triggerToast('Favorited', `${item.name} saved!`, 'success') }}
                    favoritedIds={favorites}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    institutionName={institutionName}
                    dbBanners={banners}
                    canteens={canteens}
                  />
                )}

                {activeTab === 'nutrition' && (
                  <NutritionTab 
                    userName={profile?.full_name}
                    menuItems={menuItems}
                    onAddCart={(item) => setCart((prev) => { const idx = prev.findIndex(e => e.item.id === item.id); return idx >= 0 ? prev.map((e, i) => i === idx ? { ...e, quantity: e.quantity + 1 } : e) : [...prev, { item, quantity: 1 }]; })}
                    onFavorite={(item) => { toggleFavorite(item); triggerToast && triggerToast('Favorited', `${item.name} saved!`, 'success') }}
                    favoritedIds={favorites}
                    setIsLxAiOpen={() => triggerToast && triggerToast('LX AI', 'AI Assistant coming soon!', 'info')}
                  />
                )}

                {activeTab === 'analytics' && (
                  <AnalyticsTab orders={orders} />
                )}

                {activeTab === 'offers' && (
                  <OffersTab 
                    offerItems={offerItems}
                    onAddCart={(item) => setCart((prev) => { const idx = prev.findIndex(e => e.item.id === item.id); return idx >= 0 ? prev.map((e, i) => i === idx ? { ...e, quantity: e.quantity + 1 } : e) : [...prev, { item, quantity: 1 }]; })}
                    onFavorite={(item) => { toggleFavorite(item); triggerToast && triggerToast('Favorited', `${item.name} saved!`, 'success') }}
                    favoritedIds={favorites}
                    onGoExplore={() => setActiveTab('explore')}
                  />
                )}

                {activeTab === 'history' && (
                  <HistoryTab 
                    pastOrders={pastOrders}
                    institutionName={institutionName}
                    userId={user?.id || ''}
                    triggerToast={triggerToast}
                    onReorder={(order) => {
                      order.items.forEach((item) => {
                        // Check if item exists in current menu
                        const menuItem = menuItems.find((m) => m.name === item.name);
                        if (menuItem) {
                          // Check availability
                          const { isSoldOut } = getItemAvailability(menuItem);
                          if (isSoldOut) {
                            triggerToast && triggerToast('Unavailable', `${item.name} is currently unavailable.`, 'warning');
                            return;
                          }
                          setCart((prev) => {
                            const existing = prev.find((e) => e.item.name === item.name);
                            if (existing) {
                              return prev.map((e) => e.item.name === item.name ? { ...e, quantity: e.quantity + item.quantity } : e);
                            }
                            return [...prev, { item: menuItem, quantity: item.quantity }];
                          });
                        } else {
                          triggerToast && triggerToast('Unavailable', `${item.name} is not on the current menu.`, 'warning');
                        }
                      });
                      setActiveTab('explore');
                      triggerToast && triggerToast('Reorder', 'Available items added to cart', 'success');
                    }}
                    onGoExplore={() => setActiveTab('explore')}
                  />
                )}

                {activeTab === 'profile' && (
                  <ProfileTab 
                    profile={profile}
                    userEmail={user?.email}
                    institutionData={institutionData}
                    institutionName={institutionName}
                    userAddresses={userAddresses}
                    canteens={canteens}
                    onSignOut={() => signOut()}
                    onEditProfileOpen={() => setEditingProfile(true)}
                     onAddAddress={async (label, address, isDefault) => {
                       if (!user?.id) return;
                       const result = await addUserAddress(user.id, { label, address, institution_id: profile?.institution_id || null, is_default: isDefault });
                       if (result.success) {
                         const addresses = await fetchUserAddresses(user.id);
                         setUserAddresses(addresses);
                         triggerToast?.('Success', 'Delivery spot added', 'success');
                       } else {
                         triggerToast?.('Error', result.error || 'Failed to add address', 'error');
                       }
                     }}
                     onUpdateAddress={async (id, label, address, isDefault) => {
                       const result = await updateUserAddress(id, { label, address, is_default: isDefault });
                      if (result.success) {
                        if (user?.id) {
                          const addresses = await fetchUserAddresses(user.id);
                          setUserAddresses(addresses);
                        }
                        triggerToast?.('Success', 'Delivery spot updated', 'success');
                      } else {
                        triggerToast?.('Error', result.error || 'Failed to update address', 'error');
                      }
                    }}
                    onDeleteAddress={async (id) => {
                      const result = await deleteUserAddress(id);
                      if (result.success) {
                        if (user?.id) {
                          const addresses = await fetchUserAddresses(user.id);
                          setUserAddresses(addresses);
                        }
                        triggerToast?.('Success', 'Delivery spot removed', 'success');
                      } else {
                        triggerToast?.('Error', result.error || 'Failed to delete address', 'error');
                      }
                    }}
                    onSetDefaultAddress={async (id) => {
                      if (!user?.id) return;
                      const result = await setDefaultAddress(user.id, id);
                      if (result.success) {
                        const addresses = await fetchUserAddresses(user.id);
                        setUserAddresses(addresses);
                        triggerToast?.('Success', 'Default address updated', 'success');
                      } else {
                        triggerToast?.('Error', result.error || 'Failed to set default', 'error');
                      }
                    }}
                    onUploadAvatar={async (file) => {
                      if (!user?.id) throw new Error('Not authenticated');
                      const result = await uploadAvatarService(user.id, file);
                      if (!result.success) throw new Error(result.error || 'Upload failed');
                      await refreshProfile();
                    }}
                    onRemoveAvatar={async () => {
                      if (!user?.id) return;
                      const result = await removeAvatarService(user.id);
                      if (!result.success) throw new Error(result.error || 'Remove failed');
                      await refreshProfile();
                    }}
                    onUpdateDietPreference={async (pref) => {
                      if (!user?.id) return;
                      const result = await updateDietPreference(user.id, pref);
                      if (!result.success) throw new Error(result.error || 'Update failed');
                      await refreshProfile();
                    }}
                    refreshAddresses={async () => {
                      if (user?.id) {
                        const addresses = await fetchUserAddresses(user.id);
                        setUserAddresses(addresses);
                      }
                    }}
                    refreshProfile={refreshProfile}
                    triggerToast={triggerToast}
                  />
                )}

                {/* ═══════════════════ CHECKOUT TAB ═══════════════════ */}
                {activeTab === 'checkout' && (
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setActiveTab('explore')} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-2xl font-black text-white">Checkout</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        {/* Order Details */}
                        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-4 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-600" /> Pickup Details
                          </h3>
                          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                            <p className="text-xs font-bold text-slate-900">{institutionName}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Counter: <span className="font-bold text-slate-900">{firstItemCounter}</span></p>
                            <div className="mt-3 flex items-center gap-2 text-[10px] text-amber-700 font-semibold bg-amber-50 w-max px-3 py-1.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3" /> Ready in ~{estimatedPrepTime} mins
                            </div>
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-4 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-emerald-600" /> Order Summary
                          </h3>
                          <div className="space-y-3">
                            {cart.map((entry) => (
                              <div key={entry.item.id} className="flex justify-between text-xs">
                                <span className="text-slate-700 font-semibold">{entry.quantity}x {entry.item.name}</span>
                                <span className="text-slate-900 font-bold">{formatINR((entry.item.offer_price || entry.item.price) * entry.quantity)}</span>
                              </div>
                            ))}
                          </div>
                          
                            <div className="pt-4 border-t border-slate-100 space-y-2">
                              <div className="flex justify-between text-xs text-slate-500">
                                <span>Subtotal</span>
                                <span>{formatINR(cartSubtotal)}</span>
                              </div>
                               <div className="flex justify-between text-xs text-slate-500">
                                 <span>CONVINENCE FEE</span>
                                 <span>₹0</span>
                               </div>
                               {cartDiscount > 0 && (
                                <div className="flex justify-between text-xs text-emerald-600 font-medium">
                                  <span>Discount</span>
                                  <span>-{formatINR(cartDiscount)}</span>
                                </div>
                              )}
                              <div className="pt-2 flex justify-between text-lg font-black text-slate-900">
                                <span>Total Amount</span>
                                <span className="text-emerald-600">{formatINR(cartGrandTotal)}</span>
                              </div>
                           </div>
                        </div>

                        {/* Additional */}
                        <div className="space-y-3">
                          <div className="relative opacity-60">
                            <input
                              type="text"
                              disabled
                              placeholder="COUPON CODE (E.G. AS26)"
                              className="w-full rounded-full border border-blue-500 bg-white py-4 pl-5 pr-28 text-xs font-bold text-slate-900 placeholder-slate-400 cursor-not-allowed outline-none shadow-sm"
                            />
                            <div className="absolute right-2 top-2 bottom-2 rounded-full bg-slate-900 px-4 flex items-center text-xs font-black text-white cursor-not-allowed shadow-md">
                              Coming Soon
                            </div>
                          </div>
                          <textarea
                            placeholder="Notes for Kitchen (Optional)"
                            value={kitchenNotes}
                            onChange={(e) => setKitchenNotes(e.target.value)}
                            rows={2}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-400 outline-none resize-none shadow-sm transition-colors"
                          />
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div className="space-y-6">
                        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-4 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-emerald-600" /> Payment Method
                          </h3>
                          <div className="space-y-3">
                            <button
                              onClick={() => setPaymentMethod('razorpay')}
                              className={`w-full flex items-center justify-between p-4 rounded-xl border ${paymentMethod === 'razorpay' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'} transition-all`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'razorpay' ? 'border-emerald-500' : 'border-slate-300'}`}>
                                  {paymentMethod === 'razorpay' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                </div>
                                <span className="text-sm font-bold text-slate-900">UPI / Instant Pay (Zero Fee)</span>
                              </div>
                            </button>
                            
                            <button
                              onClick={() => setPaymentMethod('wallet')}
                              disabled
                              className={`w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                                <span className="text-sm font-bold text-slate-500">FOODEXA Wallet (Coming Soon)</span>
                              </div>
                              <span className="text-xs font-black text-emerald-600">Bal: ₹850</span>
                            </button>

                            <button
                              onClick={() => setPaymentMethod('cash')}
                              className={`w-full flex items-center justify-between p-4 rounded-xl border ${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'} transition-all`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-emerald-500' : 'border-slate-300'}`}>
                                  {paymentMethod === 'cash' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                </div>
                                <span className="text-sm font-bold text-slate-900">Pay at Counter (Cash)</span>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Pay Button */}
                        <button
                          onClick={handlePlaceOrder}
                          disabled={submittingOrder}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-base font-black text-white shadow-lg shadow-emerald-500/30 disabled:opacity-50 hover:scale-[1.02] hover:shadow-emerald-500/40 transition-all"
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
                {/* ═══════════════════ LIVE CANTEEN TRACKING ═══════════════════ */}
                 {activeTab === 'payment_success' && (() => {
                   const o = activeOrders[0] || orders.find(ord => ['pending','accepted','preparing','cooking','quality_check','packed','ready','completed'].includes(ord.status)) || orders[0];
                   const stage = getTimelineStage(o?.status);
                   const label = o ? getTimelineLabel(o.status) : 'Order Confirmed';
                   const completed = isOrderCompleted(o?.status);
                   const cancelled = isOrderCancelled(o?.status);

                   // Show premium completion screen when order is collected
                   if (completed && o) {
                     return (
                       <OrderCompletionScreen
                         key={`completion-${o.id}`}
                         order={o}
                         institutionName={institutionName}
                         onViewReceipt={(ord) => { setInvoiceOrder(ord); }}
                         onRateOrder={(ord) => { setRatingOrder(ord); }}
                         onBackToMenu={() => { setActiveTab('explore'); }}
                       />
                     );
                   }

                   // Read pickup code, estimated time, QR from Supabase order (never generate locally)
                   const pickupCode = o?.pickup_code || o?.pickup_token || '';
                   const estimatedReadyAt = o?.estimated_ready_at || null;
                   const orderNumber = o?.order_number || o?.order_id || '';

                   return (
                     <div className="max-w-md mx-auto space-y-4 pb-20">
                       {/* Top Status Card */}
                       <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
                         <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
                         
                         <div className="relative z-10">
                           <div className="flex items-start justify-between mb-4">
                             <div>
                               <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                               <h2 className="text-3xl font-black">{orderNumber}</h2>
                             </div>
                             <div className="text-right">
                               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Pickup Code</p>
                               <p className="text-xl font-black text-emerald-400 tracking-wider">
                                 {pickupCode || 'Generating...'}
                               </p>
                             </div>
                           </div>

                           <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3 border border-white/10">
                             <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
                               <Clock className="w-5 h-5 text-blue-300" />
                             </div>
                             <div>
                               <p className="text-slate-300 text-xs">Estimated Ready Time</p>
                               <p className="font-bold text-white">
                                 {estimatedReadyAt 
                                   ? new Date(estimatedReadyAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                                   : 'Calculating...'}
                               </p>
                             </div>
                           </div>
                         </div>
                       </div>

                       {/* Live Detail Grid */}
                       <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                         <h3 className="font-bold text-slate-900 mb-4">Order Details</h3>
                         <div className="grid grid-cols-2 gap-3 text-xs">
                           <div className="bg-slate-50 rounded-xl p-3">
                             <p className="text-[10px] text-slate-400 font-bold uppercase">Token Number</p>
                             <p className="text-sm font-black text-slate-900 mt-0.5">{o?.token_number || o?.pickup_token || '—'}</p>
                           </div>
                           <div className="bg-slate-50 rounded-xl p-3">
                             <p className="text-[10px] text-slate-400 font-bold uppercase">Kitchen Status</p>
                             <p className="text-sm font-black text-slate-900 mt-0.5">{o?.kitchen_status || '—'}</p>
                           </div>
                           <div className="bg-slate-50 rounded-xl p-3">
                             <p className="text-[10px] text-slate-400 font-bold uppercase">Counter Status</p>
                             <p className="text-sm font-black text-slate-900 mt-0.5">{o?.counter_status || '—'}</p>
                           </div>
                           <div className="bg-slate-50 rounded-xl p-3">
                             <p className="text-[10px] text-slate-400 font-bold uppercase">Order Status</p>
                             <p className="text-sm font-black text-slate-900 mt-0.5">{o?.order_status || o?.status || '—'}</p>
                           </div>
                           <div className="bg-slate-50 rounded-xl p-3">
                             <p className="text-[10px] text-slate-400 font-bold uppercase">Completion Time</p>
                             <p className="text-sm font-black text-slate-900 mt-0.5">{o?.completed_at ? new Date(o.completed_at).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}</p>
                           </div>
                           <div className="bg-slate-50 rounded-xl p-3">
                             <p className="text-[10px] text-slate-400 font-bold uppercase">Items</p>
                             <p className="text-sm font-black text-slate-900 mt-0.5">{o?.items?.length ?? 0} item(s)</p>
                           </div>
                         </div>
                       </div>

                       {/* 4-Step Vertical Tracker driven by DB status (single source of truth) */}
                       <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                         <div className="flex items-center justify-between mb-5">
                           <h3 className="font-bold text-slate-900">Live Timeline</h3>
                           <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                             Live
                           </span>
                         </div>
                         <div className="space-y-0">
                           {STUDENT_TIMELINE_LABELS.map((stepLabel, i) => {
                             const isDone = i < stage;
                             const isActive = i === stage;
                             const isPast = stage === -1;
                             return (
                               <div key={i} className="flex gap-4">
                                 <div className="flex flex-col items-center">
                                   <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 font-bold text-xs transition-all duration-500 z-10 ${
                                     isPast ? 'border-red-500/40 bg-red-950/30' :
                                     isDone ? 'bg-blue-600 border-blue-600 text-white' :
                                     isActive ? 'bg-white border-blue-600 text-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]' :
                                     'bg-white border-slate-200 text-slate-300'
                                   }`}>
                                     {isPast ? <XCircle className="w-4 h-4 text-red-500" /> : isDone ? <Check className="w-4 h-4" /> : i + 1}
                                   </div>
                                   {i < STUDENT_TIMELINE_LABELS.length - 1 && (
                                     <div className={`w-0.5 h-8 my-0.5 rounded-full transition-all duration-700 ${isDone ? 'bg-blue-600' : 'bg-slate-100'}`} />
                                   )}
                                 </div>
                                 <div className={`pt-1 flex-1 min-w-0 ${i < STUDENT_TIMELINE_LABELS.length - 1 ? 'pb-3' : 'pb-0'}`}>
                                   <div className="flex items-center gap-2">
                                     <p className={`text-sm font-bold ${isActive ? 'text-blue-600' : isDone || isPast ? 'text-slate-800' : 'text-slate-400'}`}>{stepLabel}</p>
                                   </div>
                                   <p className={`text-[11px] mt-0.5 ${isActive || isDone ? 'text-slate-500' : 'text-slate-300'}`}>{STUDENT_TIMELINE_DESCRIPTIONS[i]}</p>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       </div>

                       {/* Actions */}
                       <div className="pt-2 space-y-3">
                         {o && (stage >= 2) && (
                           <button onClick={() => setQrOrder(o)} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors">
                             <QrCode className="w-5 h-5" /> Show Pickup QR
                           </button>
                         )}
                         
                         {/* Cancel within 30 seconds */}
                         {(() => {
                           const secs = Math.max(0, 30 - Math.floor((currentTime - new Date(o?.created_at || Date.now()).getTime()) / 1000));
                           if (secs > 0 && !cancelled) return (
                             <div className="text-center mt-2">
                               <button
                                 onClick={async () => {
                                   setSubmittingOrder(true);
                                   const res = await cancelOrder(o!.id);
                                   if (res.success) { triggerToast && triggerToast('Cancelled', 'Order cancelled and refunded.', 'success'); setActiveTab('history'); }
                                   else { triggerToast && triggerToast('Failed', 'Could not cancel.', 'error'); }
                                   setSubmittingOrder(false);
                                 }}
                                 disabled={submittingOrder}
                                 className="text-red-500 font-bold text-xs hover:text-red-600 hover:underline transition-all disabled:opacity-50"
                               >
                                 Cancel Order within {secs} seconds timing
                               </button>
                             </div>
                           );
                           return null;
                         })()}
                       </div>
                     </div>
                   );
                 })()}



                {/* ═══════════════════ PAYMENT FAILED TAB ═══════════════════ */}
                {activeTab === 'payment_failed' && (
                  <div className="max-w-md mx-auto space-y-6 text-center py-10">
                    <div className="w-24 h-24 mx-auto bg-red-50 border border-red-200 rounded-full flex items-center justify-center shadow-lg shadow-red-500/10">
                      <XCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-slate-900">Payment Failed</h2>
                      <p className="text-sm text-red-600 font-semibold">{error || 'Something went wrong during payment.'}</p>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => { setError(null); setActiveTab('checkout'); }}
                        className="flex-1 rounded-2xl border border-slate-300 bg-slate-100 py-4 text-sm font-black text-slate-900 hover:bg-slate-200 transition-all"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => { setError(null); setActiveTab('explore'); }}
                        className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-black text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
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
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
        )}
        <aside className={`fixed bottom-0 right-0 top-0 z-50 w-full max-w-md bg-[#E2E8F0] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${showCart ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-slate-300 bg-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Your Cart</h3>
                <p className="text-xs text-slate-500 font-medium">{cartCount} item types selected</p>
              </div>
            </div>
            <button onClick={() => setShowCart(false)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 bg-[#E2E8F0]">
            
            {/* Cart Items */}
            {cart.length ? (
              <div className="bg-white rounded-3xl p-3 shadow-sm border border-slate-200 space-y-1">
                {cart.map((entry, idx) => (
                  <div key={entry.item.id} className="flex gap-4 p-3 relative group">
                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center">
                      {entry.item.image_url ? (
                        <img src={entry.item.image_url} alt={entry.item.name} className="w-full h-full object-cover" onError={() => {}} />
                      ) : (
                        <Utensils className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-sm font-black text-slate-900 truncate pr-8">{entry.item.name}</p>
                      <p className="text-xs text-slate-500">{formatINR(entry.item.offer_price || entry.item.price)} each</p>
                      <p className="text-[10px] text-blue-600 font-bold mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3 text-red-500" /> {entry.item.counter_name}</p>
                    </div>
                    
                    {/* Quantity controls */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                        <button onClick={() => updateQuantity(entry.item.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center text-xs font-black text-slate-900">{entry.quantity}</span>
                        <button onClick={() => updateQuantity(entry.item.id, 1)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button onClick={() => updateQuantity(entry.item.id, -entry.quantity)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={ShoppingCart} title="Cart is empty" message="Add items to start your order" />
            )}

            {cart.length > 0 && (
              <>
                {/* Coupon Code */}
                <div className="relative opacity-60">
                  <input
                    type="text"
                    disabled
                    placeholder="COUPON CODE (E.G. AS26)"
                    className="w-full rounded-full border border-blue-500 bg-white py-4 pl-5 pr-28 text-xs font-bold text-slate-900 placeholder-slate-400 cursor-not-allowed outline-none shadow-sm"
                  />
                  <button disabled className="absolute right-2 top-2 bottom-2 rounded-full bg-slate-900 px-4 text-xs font-black text-white cursor-not-allowed shadow-md">
                    Coming Soon
                  </button>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-900 px-1">Select Payment Method</h3>
                  
                  {/* FOODEXA Wallet - Disabled */}
                  <label className="flex items-center justify-between p-4 rounded-2xl border border-blue-500/0 bg-[#E2E8F0] shadow-sm cursor-not-allowed opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-400 flex items-center justify-center" />
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-black text-slate-900">FOODEXA Wallet (Coming Soon)</span>
                    </div>
                    <span className="text-xs font-black text-emerald-600">Bal: ₹850</span>
                  </label>

                  {/* UPI / Instant Pay - Selected */}
                  <label onClick={() => setPaymentMethod('razorpay')} className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${paymentMethod === 'razorpay' ? 'border-blue-500 bg-[#E2E8F0]' : 'border-slate-300 bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'razorpay' ? 'border-blue-500' : 'border-slate-300'}`}>
                        {paymentMethod === 'razorpay' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-black text-slate-900">UPI / Instant Pay</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500">Zero Fee</span>
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Sticky Bottom Total */}
          {cart.length > 0 && (
            <div className="bg-[#F1F5F9] px-6 py-5 border-t border-slate-300 space-y-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">{formatINR(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 font-medium border-b border-slate-200 pb-3">
                <span>CONVINENCE FEE</span>
                <span className="font-bold text-slate-900">₹0</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-1">
                <span>Total Amount</span>
                <span className="text-blue-600">{formatINR(cartGrandTotal)}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={submittingOrder}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] py-4 text-sm font-black text-white shadow-xl shadow-blue-500/20 hover:bg-blue-600 transition-all disabled:opacity-50 mt-2"
              >
                {submittingOrder ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {submittingOrder ? 'Processing...' : `Pay ${formatINR(cartGrandTotal)} & Place Order →`}
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* ── EDIT PROFILE MODAL ─────────────────────────────────────── */}
      {editingProfile && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setEditingProfile(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Edit Profile</h3>
              <button onClick={() => setEditingProfile(false)} className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {profileMessage && (
              <div className={`rounded-xl p-3 text-xs font-bold ${profileMessage.includes('success') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
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
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wide">{label}</label>
                  <input
                    value={profileForm[key]}
                    onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500/60 transition-colors"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/30 disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── LEAVE INSTITUTION MODAL ──────────────────────────────── */}
      {showLeaveInstitution && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => { setShowLeaveInstitution(false); setLeaveInstitutionMessage(null); }}>
          <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Leave Institution</h3>
              </div>
              <button onClick={() => { setShowLeaveInstitution(false); setLeaveInstitutionMessage(null); }} className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {leaveInstitutionMessage ? (
              <div className={`rounded-xl p-4 text-xs font-bold text-center ${leaveInstitutionMessage.includes('Success') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {leaveInstitutionMessage}
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
                  <p className="text-xs text-amber-700 font-semibold">This will:</p>
                  <ul className="text-[11px] text-amber-900/80 space-y-1.5 ml-4 list-disc">
                    <li>Remove your current institution membership</li>
                    <li>Keep your account active and unchanged</li>
                    <li>Allow you to join another institution with a new code</li>
                  </ul>
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Your account, orders, and profile data will be preserved.
                </p>
              </>
            )}

            {!leaveInstitutionMessage && (
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowLeaveInstitution(false); setLeaveInstitutionMessage(null); }}
                  className="flex-1 py-3 rounded-xl border border-slate-300 bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveInstitution}
                  disabled={leavingInstitution}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                >
                  {leavingInstitution ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                  {leavingInstitution ? 'Leaving...' : 'Leave Institution'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FLOATING LX AI BUTTON ────────────────────────────────────────── */}
      <button
        onClick={() => triggerToast && triggerToast('LX AI', 'AI Assistant coming soon!', 'ai')}
        className="fixed bottom-24 right-5 z-40 p-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-white/20"
        title="Chat with LX AI Food Assistant"
      >
        <Sparkles className="w-5 h-5 text-cyan-200 animate-spin" />
        <span className="text-xs font-bold hidden sm:inline">Ask LX AI</span>
      </button>

      {/* ── BOTTOM NAV ───────────────────────────────────────────────────── */}
      <PremiumBottomNav
        activeTab={activeTab as PremiumTab}
        setActiveTab={(tab) => setActiveTab(tab as PortalTab)}
        activeOrderCount={activeOrders.length}
        cartCount={cartCount}
        onOpenCart={() => setShowCart(true)}
      />
    </div>
  );
};
