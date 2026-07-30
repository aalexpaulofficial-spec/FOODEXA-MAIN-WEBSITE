import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Mic, QrCode, Sparkles, Wallet, Ticket,
  HeartPulse, Utensils, Zap, Salad, ChevronRight, TrendingUp,
} from 'lucide-react';
import type { MenuItem, Order } from '../../types';
import { ActiveLiveOrder } from './ActiveLiveOrder';
import { FoodCard } from './FoodCard';

// ── Banner data ────────────────────────────────────────────────────────────────
const DEFAULT_BANNERS = [
  {
    id: 'specials',
    gradient: 'from-emerald-600 to-teal-700',
    badge: '✨ Daily Specials',
    title: "TODAY'S\nCHEF SPECIAL",
    subtitle: 'Exclusive campus meals curated just for you.',
    emoji: '👨‍🍳',
  },
  {
    id: 'mealpass',
    gradient: 'from-blue-600 to-indigo-700',
    badge: '🎫 Meal Pass Offer',
    title: '50% OFF\nMEAL PASS',
    subtitle: 'Unlock unlimited daily meals at half the price.',
    emoji: '🎫',
  },
  {
    id: 'dietary',
    gradient: 'from-orange-500 to-red-600',
    badge: '💪 Health & Diet',
    title: 'HIGH\nPROTEIN',
    subtitle: 'Fuel your day with our new fitness menu.',
    emoji: '💪',
  },
];

// ── BannerCarousel ─────────────────────────────────────────────────────────────
const BannerCarousel: React.FC<{ dbBanners?: any[] }> = ({ dbBanners }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const banners = DEFAULT_BANNERS;

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, [banners.length]);

  const b = banners[current];

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-md border border-slate-200" style={{ height: '300px' }}>
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${b.gradient} transition-all duration-700`} />
      {/* Decorative orbs */}
      <div className="absolute -right-16 -top-16 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-8">
        <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white mb-4 w-fit tracking-wide">
          {b.badge}
        </span>
        <h3 className="text-4xl sm:text-5xl font-black text-white leading-tight whitespace-pre-line mb-3 drop-shadow-sm">
          {b.title}
        </h3>
        <p className="text-sm text-white/90 leading-relaxed max-w-[65%]">{b.subtitle}</p>
        <div className="absolute right-8 bottom-8 text-8xl select-none drop-shadow-lg opacity-90">{b.emoji}</div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-8 flex items-center gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => { clearInterval(timerRef.current); setCurrent(i); }}
            className={`rounded-full transition-all duration-300 ${i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
};

// ── Quick Stats Cards ──────────────────────────────────────────────────────────
const QuickStatsGrid: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {/* Wallet Balance */}
    <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm flex flex-col justify-between min-h-[120px]">
      <div className="flex justify-between items-start">
        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
          <Wallet className="w-5 h-5 text-emerald-600" />
        </div>
        <button className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors active:scale-95">
          Add Money
        </button>
      </div>
      <div className="mt-3">
        <p className="text-xs font-medium text-slate-500 mb-1">Wallet Balance</p>
        <h4 className="text-2xl font-bold text-slate-900">₹1,240</h4>
      </div>
    </div>

    {/* Meal Pass */}
    <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm flex flex-col justify-between min-h-[120px]">
      <div className="flex justify-between items-start">
        <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
          <Ticket className="w-5 h-5 text-blue-600" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
          Active
        </span>
      </div>
      <div className="mt-3">
        <p className="text-xs font-medium text-slate-500 mb-1">Meal Pass</p>
        <h4 className="text-2xl font-bold text-slate-900">14 <span className="text-base font-medium text-slate-400">Days Left</span></h4>
      </div>
    </div>

    {/* Calories */}
    <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm flex flex-col justify-between min-h-[120px]">
      <div className="flex justify-between items-start">
        <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-100">
          <HeartPulse className="w-5 h-5 text-orange-500" />
        </div>
        {/* Mini progress ring */}
        <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#fed7aa" strokeWidth="4" />
          <circle cx="18" cy="18" r="14" fill="none" stroke="#f97316" strokeWidth="4"
            strokeDasharray={`${(1840 / 2500) * 87.96} 87.96`} strokeLinecap="round" />
        </svg>
      </div>
      <div className="mt-1">
        <p className="text-xs font-medium text-slate-500 mb-1">Daily Calories</p>
        <h4 className="text-2xl font-bold text-slate-900">1,840 <span className="text-base font-medium text-slate-400">/ 2500</span></h4>
      </div>
    </div>
  </div>
);

// ── Quick Action Grid ──────────────────────────────────────────────────────────
const QuickActions: React.FC = () => {
  const actions = [
    { icon: Utensils, label: 'Order\nFood', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', hover: 'hover:bg-emerald-100' },
    { icon: QrCode, label: 'Scan\nQR Code', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', hover: 'hover:bg-blue-100' },
    { icon: Ticket, label: 'Renew\nPass', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', hover: 'hover:bg-purple-100' },
    { icon: Sparkles, label: 'AI Food\nAssistant', color: 'text-emerald-600', bg: 'bg-gradient-to-br from-emerald-50 to-teal-50', border: 'border-emerald-100', hover: 'hover:from-emerald-100 hover:to-teal-100' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ icon: Icon, label, color, bg, border, hover }) => (
        <button key={label} className={`flex flex-col items-center gap-2 p-3 bg-white border ${border} rounded-2xl shadow-sm ${hover} transition-all active:scale-95 group`}>
          <div className={`w-12 h-12 rounded-xl ${bg} border ${border} flex items-center justify-center transition-colors`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight whitespace-pre-line">{label}</span>
        </button>
      ))}
    </div>
  );
};

// ── ExploreTab Main ────────────────────────────────────────────────────────────

interface ExploreTabProps {
  menuItems: MenuItem[];
  filteredItems: MenuItem[];
  activeOrders: Order[];
  onAddCart: (item: MenuItem) => void;
  onTrackOrder: (o: Order) => void;
  onQrOpen: (o: Order) => void;
  onFavorite: (item: MenuItem) => void;
  favoritedIds?: Set<string>;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  institutionName: string;
  dbBanners?: any[];
}

export const ExploreTab: React.FC<ExploreTabProps> = ({
  menuItems,
  filteredItems,
  activeOrders,
  onAddCart,
  onTrackOrder,
  onQrOpen,
  onFavorite,
  favoritedIds,
  searchQuery,
  setSearchQuery,
  institutionName,
  dbBanners,
}) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [vegFilter, setVegFilter] = useState<'ALL' | 'veg' | 'nonVeg'>('ALL');

  const defaultCats = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
  const dynamicCategories = Array.from(new Set(menuItems.map(i => i.category).filter(Boolean)));
  const allCats = ['All', ...Array.from(new Set([...defaultCats, ...dynamicCategories]))];

  const trendingItems = [...menuItems]
    .sort((a, b) => Number(b.popular) - Number(a.popular) || b.rating - a.rating)
    .slice(0, 6);

  const displayItems = filteredItems.filter(item => {
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    if (vegFilter === 'veg' && item.is_veg === false) return false;
    if (vegFilter === 'nonVeg' && item.is_veg !== false) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto pb-32 bg-[#F8FAFC]">
      <div className="p-4 space-y-5 max-w-4xl mx-auto">

        {/* ── Search Bar ────────────────────────────────────────────────── */}
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-emerald-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search meals, drinks, snacks, canteens..."
            className="w-full rounded-full bg-white border border-[#E2E8F0] py-3.5 pl-12 pr-28 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/80 shadow-sm transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <button className="p-2 rounded-full hover:bg-slate-100 transition-colors" title="Voice search">
              <Mic className="w-4 h-4 text-slate-400 hover:text-emerald-500 transition-colors" />
            </button>
            <button className="p-2 rounded-full hover:bg-slate-100 transition-colors" title="AI search">
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </button>
            <button className="p-2 rounded-full hover:bg-slate-100 transition-colors" title="QR scan">
              <QrCode className="w-4 h-4 text-slate-400 hover:text-emerald-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* ── Banner Carousel ──────────────────────────────────────────── */}
        <BannerCarousel dbBanners={dbBanners} />

        {/* ── Quick Stats Cards ────────────────────────────────────────── */}
        <QuickStatsGrid />

        {/* ── Quick Action Grid ────────────────────────────────────────── */}
        <QuickActions />

        {/* ── Live Order Status & Recent Transactions ───────────────────── */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" /> Live Order & Transactions
            </h2>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Activity</span>
          </div>
          <div className="p-4 space-y-4">
            {activeOrders.length > 0 ? (
              <ActiveLiveOrder orders={activeOrders} onTrack={onTrackOrder} onQrOpen={onQrOpen} />
            ) : (
              <div className="text-center py-4 border border-slate-100 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-500 font-medium">No active orders right now.</p>
              </div>
            )}
            
            {/* Recent Transactions Timeline */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-900 mb-3">Recent Transactions</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Added to Wallet</p>
                      <p className="text-[10px] text-slate-500">Today, 09:41 AM</p>
                    </div>
                  </div>
                  <span className="font-black text-emerald-600">+₹500</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <Ticket className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Meal Pass Renewed</p>
                      <p className="text-[10px] text-slate-500">Yesterday, 08:30 PM</p>
                    </div>
                  </div>
                  <span className="font-black text-slate-900">-₹2,500</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Trending Today ───────────────────────────────────────────── */}
        {trendingItems.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" /> Trending Today
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Most ordered across {institutionName || 'campus'}</p>
              </div>
              <button className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                See all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
              {trendingItems.map((item, idx) => (
                <div key={item.id} className="w-[260px] shrink-0 snap-center">
                  <FoodCard item={item} onAdd={onAddCart} onFavorite={onFavorite} isFavorited={favoritedIds?.has(item.id)} trendingRank={idx + 1} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Today's Mess Menu ────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          {/* Section header */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Today's Mess Menu</h2>
              <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                <button onClick={() => setVegFilter('ALL')} className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all ${vegFilter === 'ALL' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>All</button>
                <button onClick={() => setVegFilter('veg')} className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all flex items-center gap-1 ${vegFilter === 'veg' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" /> Veg
                </button>
                <button onClick={() => setVegFilter('nonVeg')} className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all flex items-center gap-1 ${vegFilter === 'nonVeg' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" /> Non-Veg
                </button>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
              {allCats.map(cat => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                      active
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Food grid */}
          <div className="p-5 bg-slate-50/40">
            {displayItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayItems.map(item => (
                  <FoodCard key={item.id} item={item} onAdd={onAddCart} onFavorite={onFavorite} isFavorited={favoritedIds?.has(item.id)} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Salad className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">No items available</p>
                <p className="text-xs text-slate-400 mt-1">Check back later for {activeCategory}</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};
