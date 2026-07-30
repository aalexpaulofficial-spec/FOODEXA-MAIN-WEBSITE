import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, QrCode, Sparkles, ChevronRight } from 'lucide-react';
import type { MenuItem, Order } from '../../types';
import { ActiveLiveOrder } from './ActiveLiveOrder';
import { FoodCard } from './FoodCard';

// ── Banner data (static fallback + dynamic override) ──────────────────────────
const DEFAULT_BANNERS = [
  {
    id: 'express',
    gradient: 'from-blue-600 to-indigo-600',
    badge: 'Lightning Fast',
    title: 'EXPRESS\nPICKUP',
    subtitle: 'Skip the queue entirely.',
    emoji: '⚡',
    bgOrb: 'bg-white/10',
  },
  {
    id: 'fasttrack',
    gradient: 'from-orange-500 to-red-500',
    badge: 'Priority Service',
    title: 'FAST\nTRACK',
    subtitle: 'Get your order in under 5 minutes.',
    emoji: '🚀',
    bgOrb: 'bg-white/10',
  },
  {
    id: 'lxai',
    gradient: 'from-emerald-500 to-teal-600',
    badge: 'AI-Powered',
    title: 'POWERED\nBY LX AI',
    subtitle: 'Smart recommendations just for you.',
    emoji: '🤖',
    bgOrb: 'bg-white/10',
  },
];

const CATEGORY_EMOJIS: Record<string, string> = {
  All: '🍽️',
  Breakfast: '🌅',
  Lunch: '🍱',
  Dinner: '🌙',
  Snacks: '🍿',
  Beverages: '☕',
  Desserts: '🍰',
  'South Indian': '🫓',
  Biryani: '🍛',
  'Fast Food': '🍔',
};

// ── BannerCarousel ─────────────────────────────────────────────────────────────
const BannerCarousel: React.FC<{ dbBanners?: any[] }> = ({ dbBanners }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const banners = DEFAULT_BANNERS; // use static banners; db banners can override via future prop

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, [banners.length]);

  const b = banners[current];

  return (
    <div className="relative overflow-hidden rounded-3xl h-48 shadow-lg shadow-blue-900/10">
      {/* Slides container with CSS transition */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${b.gradient} transition-all duration-700`}
      />

      {/* Background orb decoration */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center px-6">
        <div className="w-2/3">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
            {b.badge}
          </span>
          <h3 className="text-2xl font-black text-white mt-1 leading-tight whitespace-pre-line">
            {b.title}
          </h3>
          <p className="text-xs text-white/80 mt-2 leading-relaxed">{b.subtitle}</p>
        </div>
        <div className="ml-auto text-5xl select-none">{b.emoji}</div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-3.5 right-4 flex items-center gap-1.5">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              clearInterval(timerRef.current);
              setCurrent(i);
            }}
            className={`rounded-full transition-all duration-300 ${
              i === current ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'
            }`}
          />
        ))}
      </div>
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

  // Derive categories from menu items + add defaults
  const dynamicCategories = Array.from(new Set(menuItems.map(i => i.category).filter(Boolean)));
  const defaultCats = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages'];
  const allCats = ['All', ...Array.from(new Set([...defaultCats, ...dynamicCategories]))];

  // Trending: top 6 popular items
  const trendingItems = [...menuItems]
    .sort((a, b) => Number(b.popular) - Number(a.popular) || b.rating - a.rating)
    .slice(0, 6);

  // Apply category + veg filter on top of parent's filteredItems
  const displayItems = filteredItems.filter(item => {
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    if (vegFilter === 'veg' && item.is_veg === false) return false;
    if (vegFilter === 'nonVeg' && item.is_veg !== false) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      <div className="p-4 space-y-6 max-w-2xl mx-auto">

        {/* ── Search Bar ──────────────────────────────────────────────────── */}
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search meals, drinks, snacks, canteens..."
            className="w-full rounded-full bg-white border border-slate-200 py-4 pl-12 pr-28 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100/80 shadow-sm transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <button className="p-2 rounded-full hover:bg-slate-100 transition-colors" title="Voice search">
              <Mic className="w-4 h-4 text-slate-400 hover:text-blue-500 transition-colors" />
            </button>
            <button className="p-2 rounded-full hover:bg-slate-100 transition-colors" title="AI search">
              <Sparkles className="w-4 h-4 text-blue-500" />
            </button>
            <button className="p-2 rounded-full hover:bg-slate-100 transition-colors" title="QR scan">
              <QrCode className="w-4 h-4 text-slate-400 hover:text-blue-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* ── Banner Carousel ──────────────────────────────────────────────── */}
        <BannerCarousel dbBanners={dbBanners} />

        {/* ── Active Order Widget ──────────────────────────────────────────── */}
        {activeOrders.length > 0 && (
          <ActiveLiveOrder
            orders={activeOrders}
            onTrack={onTrackOrder}
            onQrOpen={onQrOpen}
          />
        )}

        {/* ── Trending Today ───────────────────────────────────────────────── */}
        {trendingItems.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-4 px-1">
              <div>
                <h2 className="text-lg font-black text-slate-900">Trending Today 🔥</h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Most ordered across {institutionName || 'campus'}
                </p>
              </div>
              <button className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                See all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Horizontal scrollable row */}
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
              {trendingItems.map((item, idx) => (
                <div key={item.id} className="w-[260px] shrink-0 snap-center">
                  <FoodCard
                    item={item}
                    onAdd={onAddCart}
                    onFavorite={onFavorite}
                    isFavorited={favoritedIds?.has(item.id)}
                    trendingRank={idx + 1}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Food Categories & Filters ─────────────────────────────────────── */}
        <section className="pt-2 border-t border-slate-200/60">
          <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
            <div className="min-w-0">
              <h2 className="text-lg font-black text-slate-900">Food Categories</h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Explore items across all {institutionName || 'campus'} canteens
              </p>
            </div>
            {/* Veg / Non-Veg Toggle */}
            <div className="flex gap-1 bg-white rounded-full p-1 border border-slate-200 shadow-sm shrink-0">
              <button
                onClick={() => setVegFilter('ALL')}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
                  vegFilter === 'ALL' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setVegFilter('veg')}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-all flex items-center gap-1 ${
                  vegFilter === 'veg' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" /> 🟢 Veg
              </button>
              <button
                onClick={() => setVegFilter('nonVeg')}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-all flex items-center gap-1 ${
                  vegFilter === 'nonVeg' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" /> 🔴 Non-Veg
              </button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            {allCats.map(cat => {
              const emoji = CATEGORY_EMOJIS[cat] || '🍽️';
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                    active
                      ? 'bg-blue-600 text-white border-transparent shadow-blue-600/30 shadow-md'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {emoji} {cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Today's Campus Menu Grid ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-black text-slate-900">Today's Campus Menu</h2>
            <span className="text-xs text-slate-400 font-medium">
              {displayItems.length} item{displayItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          {displayItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayItems.map(item => (
                <FoodCard
                  key={item.id}
                  item={item}
                  onAdd={onAddCart}
                  onFavorite={onFavorite}
                  isFavorited={favoritedIds?.has(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-500">No items found</p>
              <p className="text-xs text-slate-400 mt-1">Try a different category or search term</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};
