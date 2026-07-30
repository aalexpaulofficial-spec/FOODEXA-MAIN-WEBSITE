import React, { useState } from 'react';
import { Utensils, Heart, Package, XCircle, Check, Plus, Clock, MapPin, Star, Share2, Minus } from 'lucide-react';
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
  const [adding, setAdding] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const isVeg = item.is_veg !== false;
  const { isSoldOut, canAddToCart } = getItemAvailability(item);

  const handleAdd = () => {
    if (!canAddToCart) return;
    setAdding(true);
    onAdd(item);
    setTimeout(() => setAdding(false), 600);
  };

  const rating = item.ai_popularity_score || item.rating || 0;

  return (
    <article className="dash-glass-card rounded-3xl flex flex-col h-full transition-all duration-300 overflow-hidden group">

      {/* Image Section */}
      <div className="relative h-48 bg-slate-100 overflow-hidden shrink-0 rounded-t-3xl">
        {item.image_url && !imgErr ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover group-hover:scale-[1.03] transition-all duration-300"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50">
            <Utensils className="w-10 h-10 text-slate-300" />
          </div>
        )}

        {/* Veg/Non-veg indicator — white pill style */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm border border-slate-200/60">
          <span className={`w-2.5 h-2.5 rounded-full ${isVeg ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-red-500 ring-2 ring-red-200'}`} />
          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
            {isVeg ? 'Veg' : 'Non-Veg'}
          </span>
        </div>

        {/* Trending badge */}
        {trendingRank !== undefined && (
          <div className="absolute top-3 right-12 bg-amber-500 text-white px-2.5 py-0.5 rounded-xl text-[10px] font-bold shadow-sm">
            🔥 #{trendingRank}
          </div>
        )}

        {/* Bestseller badge */}
        {item.popular && (
          <div className="absolute top-3 right-12 bg-amber-500 text-white px-2.5 py-0.5 rounded-xl text-[10px] font-bold shadow-sm">
            ★ Bestseller
          </div>
        )}

        {/* Favorite button */}
        {onFavorite && (
          <button
            onClick={e => { e.stopPropagation(); onFavorite(item); }}
            className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 backdrop-blur-md text-slate-700 hover:text-red-500 transition-all shadow-sm focus:outline-none"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        )}

        {/* Stock counter */}
        {item.stock !== undefined && item.stock <= 20 && item.stock > 0 && (
          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-slate-200 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border border-white/10">
            Stock: <span className="text-emerald-400 font-bold">{item.stock} left</span>
          </div>
        )}

        {/* Rating badge */}
        {rating > 0 && (
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-900 flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
          </div>
        )}

        {/* Sold Out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/50 bg-red-50 px-3 py-1 text-[12px] font-black text-red-600 shadow-sm">
              <XCircle className="w-4 h-4" /> Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title + Share */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">{item.name}</h4>
          <Share2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Location */}
        {item.counter_name && (
          <p className="text-[11px] font-medium text-blue-700 mt-1.5">
            📍 {item.counter_name}
          </p>
        )}

        {/* Macros row */}
        <div className="flex items-center gap-3 my-3 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
          {(item.prep_time || item.prep_time_minutes) && (
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-cyan-600" />
              {item.prep_time || `${item.prep_time_minutes}m`}
            </span>
          )}
          {item.calories && (
            <>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 font-medium">
                🔥 {item.calories} kcal
              </span>
            </>
          )}
          {item.protein && (
            <>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 font-medium">
                💪 {item.protein}g
              </span>
            </>
          )}
        </div>

        {/* Price + Add to Cart */}
        <div className="mt-auto flex items-center justify-between pt-2.5 border-t border-slate-100 gap-3">
          <div>
            <p className="text-xs text-slate-400">Price</p>
            <p className="text-lg font-extrabold text-slate-900">
              {formatINR(item.offer_price || item.price)}
            </p>
            {item.offer_price && item.offer_price < item.price && (
              <span className="text-[10px] text-slate-400 line-through">
                {formatINR(item.price)}
              </span>
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
                className="w-7 h-7 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center shadow-sm hover:bg-blue-700 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!canAddToCart}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-95 ${
                !canAddToCart
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : adding
                    ? 'bg-blue-600 text-white scale-[0.98] shadow-blue-600/20'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:shadow-lg'
              }`}
            >
              {isSoldOut
                ? 'Sold Out'
                : !item.is_available
                  ? 'Unavailable'
                  : adding
                    ? <><Check className="w-4 h-4" /> Added!</>
                    : <><Plus className="w-4 h-4" /> Add to Cart</>
              }
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
