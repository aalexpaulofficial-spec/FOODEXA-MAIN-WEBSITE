import React, { useState, useEffect } from 'react';
import {
  Search, Mic, Sparkles, QrCode, X,
  Utensils, Coffee, Sun, Moon, Cookie, GlassWater, IceCream, HeartPulse, Package, Flame, Star, Heart,
  Gift, Zap, ArrowRight, TrendingUp, Clock, Plus, Dumbbell, ShoppingBag, Activity, Users, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MenuItem, Order } from '../../types';
import { ActiveLiveOrder } from './ActiveLiveOrder';
import { FoodCard } from './FoodCard';

const BANNERS = [
  {
    id: 'b1',
    title: 'Skip Long Canteen Queues 🍕',
    subtitle: 'Pre-order on FOODEXA and collect instantly at counter with QR.',
    gradient: 'from-blue-600 via-indigo-600 to-blue-700',
    icon: <QrCode className="w-6 h-6 text-blue-200" />,
    badge: 'Express Pickup',
    actionText: 'Order Now',
  },
  {
    id: 'b2',
    title: 'Healthy Meal AI Recommendations 🥗',
    subtitle: 'Personalized high-protein macro targets curated by LX AI.',
    gradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    icon: <Sparkles className="w-6 h-6 text-emerald-200" />,
    badge: 'Powered by LX AI',
    actionText: 'View Recommendations',
  },
  {
    id: 'b3',
    title: 'CHRIST Festival Offers 🎉',
    subtitle: 'Flat 20% discount across campus food courts with code CHRISTSTUDENT20.',
    gradient: 'from-purple-600 via-indigo-600 to-purple-700',
    icon: <Gift className="w-6 h-6 text-purple-200" />,
    badge: 'Student Deals',
    actionText: 'Claim Discount',
  },
  {
    id: 'b4',
    title: 'Ready in 5 Minutes ⚡',
    subtitle: 'South Canteen Dosa & Sky Cafe Coffee express priority counters active.',
    gradient: 'from-amber-500 via-orange-600 to-amber-600',
    icon: <Zap className="w-6 h-6 text-amber-100" />,
    badge: 'Fast Track',
    actionText: 'Express Menu',
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(c => (c + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const currentBannerData = BANNERS[currentBanner];

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
    <div className="flex-1 overflow-y-auto scroll-smooth pb-64">
      <div className="p-4 space-y-5 max-w-4xl mx-auto">
        
        {/* ── SearchBar (top) ────────────────────────────────────────── */}
        <div className="w-full my-4">
          <div className="relative flex items-center glass-card rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500/50 transition-all shadow-md">
            <div className="pl-4 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meals, drinks, snacks, canteens..."
              className="w-full bg-transparent px-3 py-2.5 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg mr-1">
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 pr-1">
              <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all" title="Voice Search">
                <Mic className="w-5 h-5" />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all" title="AI Smart Search">
                <Sparkles className="w-5 h-5" />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all" title="Scan Food Barcode">
                <QrCode className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── BannerCarousel ────────────────────────────────────────── */}
        <div className="relative w-full overflow-hidden rounded-3xl my-5 shadow-lg shadow-slate-200/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBannerData.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={`p-6 sm:p-8 bg-gradient-to-r ${currentBannerData.gradient} text-white relative overflow-hidden flex flex-col justify-between min-h-[160px] sm:min-h-[180px]`}
            >
              {/* Subtle Background Glow Circles */}
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute right-1/3 -top-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/20 uppercase tracking-wider">
                    {currentBannerData.badge}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white max-w-xl">
                  {currentBannerData.title}
                </h2>
                <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-lg leading-relaxed">
                  {currentBannerData.subtitle}
                </p>
              </div>

              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl sm:text-8xl select-none drop-shadow-lg opacity-80 pointer-events-none"></div>

              <div className="relative z-10 flex items-center justify-between mt-4">
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs sm:text-sm shadow-md hover:bg-slate-100 transition-all hover:scale-105 active:scale-95">
                  {currentBannerData.actionText}
                  <ArrowRight className="w-4 h-4 text-slate-700" />
                </button>

                <div className="flex items-center gap-1.5">
                  {BANNERS.map((_, idx) => (
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

        {/* ── ActiveLiveOrder (CurrentActiveOrderCard) ────────────── */}
        {activeOrders.length > 0 && (
          <ActiveLiveOrder orders={activeOrders} onTrack={onTrackOrder} onQrOpen={onQrOpen} />
        )}

        {/* ── AI Recommendation Card ─────────────────────────── */}
        {menuItems.length > 0 && (() => {
          const recommended = menuItems.find(i => i.popular) || menuItems[0];
          return recommended ? (
            <div className="w-full my-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recommended For You</h3>
                </div>
                <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-0.5 rounded-full">
                  LX AI Curated
                </span>
              </div>

              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-slate-700/60">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
                  <div className="md:col-span-5 relative group">
                    <img
                      src={recommended.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}
                      alt={recommended.name}
                      className="w-full h-48 sm:h-56 md:h-60 rounded-2xl object-cover shadow-lg ring-1 ring-white/10 group-hover:scale-[1.02] transition-all"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                      {recommended.protein_grams || 42}g Protein
                    </div>
                    <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-bold text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {recommended.rating?.toFixed(2) || '4.95'} ({recommended.review_count || 512})
                    </div>
                  </div>

                  <div className="md:col-span-7 flex flex-col justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-2">
                        <span>Based on your class schedule &amp; workout</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">{recommended.name}</h2>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">{recommended.description}</p>

                      <div className="grid grid-cols-3 gap-2 my-4">
                        <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 text-center">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Calories</p>
                          <p className="text-sm font-bold text-amber-300 mt-0.5 flex items-center justify-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-amber-400" />{recommended.calories || 520} kcal
                          </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 text-center">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Protein</p>
                          <p className="text-sm font-bold text-emerald-300 mt-0.5 flex items-center justify-center gap-1">
                            <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />{recommended.protein_grams || 42}g
                          </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 text-center">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Prep Time</p>
                          <p className="text-sm font-bold text-cyan-300 mt-0.5 flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />{recommended.prep_time || 8} mins
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Special Student Price</p>
                        <p className="text-xl font-extrabold text-white">₹{recommended.price}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onAddCart(recommended)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Order Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null;
        })()}

        {/* ── Live Kitchen Monitor ──────────────────────────────── */}
        <div className="w-full my-6 glass-card rounded-3xl p-5 sm:p-6 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Live Kitchen Monitor</h3>
              </div>
              <p className="text-xs text-slate-500">{institutionName} Food Pavilion</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Green — Fast Express
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kitchen Load</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">58%</p>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '58%' }}></div>
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Wait Time</p>
              <p className="text-xl font-extrabold text-blue-600 mt-0.5 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />7 mins
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Express Counters Active</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Orders Preparing</p>
              <p className="text-xl font-extrabold text-amber-600 mt-0.5 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4" />35
              </p>
              <p className="text-[10px] text-slate-400 mt-1">In Cooking Pipeline</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chefs Active</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5 flex items-center justify-center gap-1">
                <Users className="w-4 h-4 text-slate-600" />9
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Full Staff Capacity</p>
            </div>
          </div>
        </div>

        {/* ── Trending Today ─────────────────────────────────────── */}
        {menuItems.length > 0 && (
          <div className="w-full my-6">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Trending Today</h3>
                  <p className="text-xs text-slate-500">Most ordered across {institutionName} campus</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none scroll-smooth">
              {[...menuItems]
                .sort((a, b) => Number(b.popular) - Number(a.popular) || b.rating - a.rating)
                .slice(0, 6)
                .map((item, index) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -4 }}
                    className="min-w-[240px] sm:min-w-[260px] glass-card glass-card-hover rounded-3xl p-3.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative rounded-2xl overflow-hidden h-36 mb-3">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400" />
                          #{index + 1} Trending
                        </div>
                        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-900 flex items-center gap-1 shadow-sm">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {item.rating?.toFixed(1) || '4.5'}
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.canteen_name || 'Campus Canteen'}</p>

                      <div className="flex items-center gap-3 my-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {item.prep_time || 10} mins
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600 font-medium">
                          {item.calories || 350} kcal
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <p className="text-base font-bold text-slate-900">₹{item.price}</p>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onAddCart(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
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

        {/* ── Popular Near You on Campus ─────────────────────────── */}
        {menuItems.length > 0 && (
          <div className="w-full my-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Popular Near You on Campus</h3>
                </div>
                <p className="text-xs text-slate-500">Fastest pickup relative to your current location</p>
              </div>
              <div className="flex items-center gap-1 glass-pill p-1 rounded-2xl">
                <button className="px-3 py-1 rounded-xl text-xs font-semibold bg-white/90 text-slate-900 shadow-sm">Popularity</button>
                <button className="px-3 py-1 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all">Distance</button>
                <button className="px-3 py-1 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all">Prep Time</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...menuItems]
                .sort((a, b) => Number(b.popular) - Number(a.popular) || b.rating - a.rating)
                .slice(0, 4)
                .map((item) => (
                  <motion.div
                    key={`popular-${item.id}`}
                    whileHover={{ scale: 1.01 }}
                    className="glass-card glass-card-hover rounded-2xl p-4 flex items-center gap-4"
                  >
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                      alt={item.name}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        <span className="line-clamp-1">{item.canteen_name || 'Campus Canteen'} • {Math.floor(Math.random() * 250 + 50)}m away</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {item.rating?.toFixed(2) || '4.8'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.prep_time || 5}m
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="font-bold text-slate-900 text-sm">₹{item.price}</p>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onAddCart(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

