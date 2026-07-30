import React, { useState, useEffect } from 'react';
import {
  Search, Mic, Sparkles, QrCode, X, Camera, Check,
  Utensils, Coffee, Sun, Moon, Cookie, GlassWater, IceCream, HeartPulse, Package, Flame, Star, Heart,
  TrendingUp, ChevronRight, Salad
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MenuItem, Order } from '../../types';
import { ActiveLiveOrder } from './ActiveLiveOrder';
import { FoodCard } from './FoodCard';

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

const CATEGORIES = [
  { id: 'All', name: 'All', icon: <Utensils className="w-4 h-4" /> },
  { id: 'Breakfast', name: 'Breakfast', icon: <Sun className="w-4 h-4" /> },
  { id: 'Lunch', name: 'Lunch', icon: <Coffee className="w-4 h-4" /> },
  { id: 'Dinner', name: 'Dinner', icon: <Moon className="w-4 h-4" /> },
  { id: 'Snacks', name: 'Snacks', icon: <Cookie className="w-4 h-4" /> },
  { id: 'Beverages', name: 'Beverages', icon: <GlassWater className="w-4 h-4" /> },
  { id: 'Desserts', name: 'Desserts', icon: <IceCream className="w-4 h-4" /> },
  { id: 'Healthy Meals', name: 'Healthy Meals', icon: <HeartPulse className="w-4 h-4" /> },
  { id: 'Combos', name: 'Combos', icon: <Package className="w-4 h-4" /> },
  { id: 'Today\'s Specials', name: 'Specials', icon: <Flame className="w-4 h-4" /> },
  { id: 'Most Ordered', name: 'Most Ordered', icon: <Star className="w-4 h-4" /> },
  { id: 'Favorites', name: 'Favorites', icon: <Heart className="w-4 h-4" /> },
];

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
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [currentBanner, setCurrentBanner] = useState(0);

  const banners = DEFAULT_BANNERS;

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner(c => (c + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const b = banners[currentBanner];

  const trendingItems = [...menuItems]
    .sort((a, b) => Number(b.popular) - Number(a.popular) || b.rating - a.rating)
    .slice(0, 6);

  const displayItems = filteredItems.filter(item => {
    const isFav = favoritedIds?.has(item.id);
    
    // Category match
    const matchesCat = activeCategory === 'All' ||
      (activeCategory === 'Favorites' && isFav) ||
      (activeCategory === 'Today\'s Specials' && item.popular) || // approximate
      (activeCategory === 'Most Ordered' && item.popular) ||
      item.category?.toLowerCase() === activeCategory.toLowerCase();

    // Dietary match
    const matchesDiet = dietaryFilter === 'all' ||
      (dietaryFilter === 'veg' && item.is_veg !== false) ||
      (dietaryFilter === 'non-veg' && item.is_veg === false);

    return matchesCat && matchesDiet;
  });

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      <div className="p-4 space-y-5 max-w-4xl mx-auto">
        
        {/* ── SearchBar ────────────────────────────────────────────── */}
        <div className="w-full my-4">
          <div className="relative flex items-center glass-card rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500/50 transition-all shadow-md">
            <div className="pl-3.5 text-slate-500">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meals, drinks, snacks, canteens..."
              className="w-full bg-transparent px-3 py-2 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none"
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg mr-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
              <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Voice Search">
                <Mic className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all" title="AI Smart Search">
                <Sparkles className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Scan Food Barcode">
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── BannerCarousel ────────────────────────────────────────── */}
        <div className="relative w-full overflow-hidden rounded-3xl my-5 shadow-lg shadow-slate-200/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={b.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={`p-6 sm:p-8 bg-gradient-to-r ${b.gradient} text-white relative overflow-hidden flex flex-col justify-between min-h-[160px] sm:min-h-[180px]`}
            >
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute right-1/3 -top-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/20 uppercase tracking-wider">
                    {b.badge}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white max-w-xl whitespace-pre-line leading-tight">
                  {b.title}
                </h2>
                <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-lg leading-relaxed">
                  {b.subtitle}
                </p>
              </div>

              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl sm:text-8xl select-none drop-shadow-lg opacity-80 pointer-events-none">{b.emoji}</div>

              <div className="relative z-10 flex items-center justify-between mt-4">
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs sm:text-sm shadow-md hover:bg-slate-100 transition-all hover:scale-105 active:scale-95">
                  Explore Now
                  <ChevronRight className="w-4 h-4 text-slate-700" />
                </button>

                <div className="flex items-center gap-1.5">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBanner(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentBanner ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Categories ────────────────────────────────────────────── */}
        <div className="w-full my-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3.5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Food Categories</h3>
              <p className="text-xs text-slate-500">Explore items across all {institutionName} canteens</p>
            </div>

            <div className="flex items-center glass-pill p-1 rounded-2xl w-fit shadow-xs">
              <button
                onClick={() => setDietaryFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  dietaryFilter === 'all'
                    ? 'bg-white/90 text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              
              <button
                onClick={() => setDietaryFilter('veg')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  dietaryFilter === 'veg'
                    ? 'bg-emerald-600/90 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                Veg Only
              </button>

              <button
                onClick={() => setDietaryFilter('non-veg')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  dietaryFilter === 'non-veg'
                    ? 'bg-red-600/90 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-300"></span>
                Non-Veg
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none scroll-smooth" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-blue-600/90 backdrop-blur-md text-white shadow-md shadow-blue-600/25 border border-white/30'
                      : 'glass-pill text-slate-700 hover:bg-white/90 shadow-sm'
                  }`}
                >
                  <span className={isSelected ? 'text-white' : 'text-slate-500'}>
                    {cat.icon}
                  </span>
                  <span>{cat.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── ActiveLiveOrder (CurrentActiveOrderCard) ──────────────── */}
        {activeOrders.length > 0 && (
          <ActiveLiveOrder orders={activeOrders} onTrack={onTrackOrder} onQrOpen={onQrOpen} />
        )}

        {/* ── FoodMenuGrid ──────────────────────────────────────────── */}
        <div className="w-full my-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Today's Campus Menu</h3>
              <p className="text-xs text-slate-500">
                Showing {displayItems.length} fresh items ready for express pickup
              </p>
            </div>
          </div>

          {displayItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 my-4 shadow-sm">
              <p className="text-slate-400 font-medium text-sm">No food items found matching your filters.</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing your search or switching categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
          )}
        </div>
        
      </div>
    </div>
  );
};
