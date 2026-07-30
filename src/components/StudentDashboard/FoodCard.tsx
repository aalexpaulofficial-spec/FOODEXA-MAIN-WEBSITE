import React, { useState } from 'react';
import { Star, Clock, Flame, Dumbbell, Heart, Share2, Plus, Minus, Check, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MenuItem } from '../../types';
import { getItemAvailability, formatINR } from '../../lib/supabase-service';

interface FoodCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  onFavorite?: (item: MenuItem) => void;
  isFavorited?: boolean;
  trendingRank?: number;
  cartQty?: number;
  onUpdateQty?: (item: MenuItem, qty: number) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  item,
  onAdd,
  onFavorite,
  isFavorited = false,
  trendingRank,
  cartQty = 0,
  onUpdateQty,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState(false);
  const isVeg = item.is_veg !== false;
  const { isSoldOut, canAddToCart } = getItemAvailability(item);

  const rating = item.ai_popularity_score || item.rating || 0;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: `Check out ${item.name} at ${item.counter_name} on FOODEXA!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${item.name} - ${formatINR(item.price)} at ${item.counter_name}`);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="glass-card glass-card-hover rounded-3xl p-4 flex flex-col justify-between relative group h-full"
    >
      <div>
        {/* Image & Badges */}
        <div className="relative rounded-2xl overflow-hidden h-48 mb-3.5 bg-slate-100">
          {!imgErr && item.image_url && !item.image_url.startsWith('blob:') ? (
            <img
              src={item.image_url}
              alt={item.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-300"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100">
              <span className="text-slate-300">No Image</span>
            </div>
          )}

          {/* Veg / Non-Veg Indicator */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm border border-slate-200/60">
            <span className={`w-2.5 h-2.5 rounded-full ${isVeg ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-red-500 ring-2 ring-red-200'}`}></span>
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
              {isVeg ? 'Veg' : 'Non-Veg'}
            </span>
          </div>

          {/* Bestseller / Recommended Badge */}
          {item.popular && (
            <div className="absolute top-3 right-12 bg-amber-500 text-white px-2.5 py-0.5 rounded-xl text-[10px] font-bold shadow-sm">
              ★ Bestseller
            </div>
          )}
          {trendingRank !== undefined && !item.popular && (
            <div className="absolute top-3 right-12 bg-amber-500 text-white px-2.5 py-0.5 rounded-xl text-[10px] font-bold shadow-sm">
              🔥 Trending
            </div>
          )}

          {/* Wishlist Button */}
          {onFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onFavorite(item); }}
              className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 backdrop-blur-md text-slate-700 hover:text-red-500 transition-all shadow-sm focus:outline-none"
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          )}

          {/* Live Stock Counter Badge */}
          {item.stock !== undefined && item.stock <= 20 && item.stock > 0 && (
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-slate-200 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border border-white/10">
              Stock: <span className="text-emerald-400 font-bold">{item.stock} left</span>
            </div>
          )}
          {isSoldOut && (
            <div className="absolute bottom-3 left-3 bg-red-900/80 backdrop-blur-md text-slate-200 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border border-white/10">
              <span className="text-red-400 font-bold">Sold Out</span>
            </div>
          )}

          {/* Rating Badge */}
          {rating > 0 && (
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-900 flex items-center gap-1 shadow-sm">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-slate-900 text-base leading-snug">{item.name}</h4>
          <button
            onClick={handleShare}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg shrink-0"
            title="Share Meal"
          >
            {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>

        {item.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {item.counter_name && (
          <p className="text-[11px] font-medium text-blue-700 mt-1">
            📍 {item.counter_name}
          </p>
        )}

        {/* Macros Row */}
        <div className="flex items-center gap-3 my-3 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
          {(item.prep_time || item.prep_time_minutes) && (
            <>
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-cyan-600" />
                {item.prep_time || `${item.prep_time_minutes}m`}
              </span>
              <span className="text-slate-300">•</span>
            </>
          )}
          {item.calories && (
            <>
              <span className="flex items-center gap-1 font-medium">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                {item.calories} kcal
              </span>
              <span className="text-slate-300">•</span>
            </>
          )}
          {item.protein && (
            <span className="flex items-center gap-1 font-medium">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
              {item.protein}g
            </span>
          )}
        </div>
      </div>

      {/* Price & Quantity Selector */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-auto">
        <div>
          <p className="text-xs text-slate-400">Price</p>
          <p className="text-lg font-extrabold text-slate-900">{formatINR(item.offer_price || item.price)}</p>
          {item.offer_price && item.offer_price < item.price && (
            <p className="text-[10px] text-slate-400 line-through">
              {formatINR(item.price)}
            </p>
          )}
        </div>

        {cartQty > 0 && onUpdateQty ? (
          <div className="flex items-center bg-blue-50 border border-blue-200/80 rounded-2xl p-1 gap-2">
            <button
              onClick={() => onUpdateQty(item, cartQty - 1)}
              className="w-7 h-7 bg-white text-blue-700 font-bold rounded-xl flex items-center justify-center shadow-sm hover:bg-blue-100 transition-all"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-extrabold text-blue-900 px-1">{cartQty}</span>
            <button
              onClick={() => onUpdateQty(item, cartQty + 1)}
              disabled={!canAddToCart}
              className={`w-7 h-7 font-bold rounded-xl flex items-center justify-center shadow-sm transition-all ${canAddToCart ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-300 text-white cursor-not-allowed'}`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onAdd(item)}
            disabled={!canAddToCart}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-xs shadow-md transition-all ${
              !canAddToCart
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            {!canAddToCart ? 'Sold Out' : 'Add to Cart'}
          </motion.button>
        )}
      </div>

    </motion.div>
  );
};
