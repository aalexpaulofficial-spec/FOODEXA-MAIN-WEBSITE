import React, { useState } from 'react';
import { Utensils, Heart, Package, XCircle, Check, Plus, Clock, MapPin, Star } from 'lucide-react';
import type { MenuItem } from '../../types';
import { getItemAvailability, formatINR } from '../../lib/supabase-service';

interface FoodCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  onFavorite?: (item: MenuItem) => void;
  isFavorited?: boolean;
  trendingRank?: number;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  item,
  onAdd,
  onFavorite,
  isFavorited = false,
  trendingRank,
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
    <article className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300/60 hover:shadow-xl hover:shadow-blue-900/10 flex flex-col h-full">

      {/* Image Section */}
      <div className="relative h-44 bg-slate-100 overflow-hidden shrink-0">
        {item.image_url && !imgErr ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50">
            <Utensils className="w-10 h-10 text-slate-300" />
          </div>
        )}

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top-left: Veg/Non-veg + Trending badge */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {/* Trending badge */}
          {trendingRank !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 shadow-md px-2 py-0.5 text-[10px] font-black text-white">
              🔥 #{trendingRank} Trending
            </span>
          )}
          {/* Veg / Non-veg */}
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black backdrop-blur-md shadow-sm ${
            isVeg
              ? 'border-emerald-500/30 bg-white/90 text-emerald-600'
              : 'border-red-500/30 bg-white/90 text-red-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {isVeg ? 'VEG' : 'NON-VEG'}
          </span>
        </div>

        {/* Top-right: Bestseller or Favorite */}
        <div className="absolute top-3 right-3">
          {item.popular ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 shadow-md px-2 py-0.5 text-[10px] font-black text-white">
              <Star className="w-2.5 h-2.5 fill-white stroke-none" /> Bestseller
            </span>
          ) : onFavorite ? (
            <button
              onClick={e => { e.stopPropagation(); onFavorite(item); }}
              className="p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm text-slate-400 hover:text-red-500 transition-colors"
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          ) : null}
        </div>

        {/* Bottom-left: Stock alert */}
        {item.stock !== undefined && item.stock <= 20 && item.stock > 0 && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
              <Package className="w-2.5 h-2.5 text-amber-400" />
              Stock: <span className="text-amber-300">{item.stock} left</span>
            </span>
          </div>
        )}

        {/* Bottom-right: Rating */}
        {rating > 0 && (
          <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 shadow-sm px-2 py-1 text-[10px] font-black text-slate-700 backdrop-blur-sm">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Offer label */}
        {item.offer_label && (
          <div className="absolute top-3 left-3 mt-8">
            <span className="inline-flex rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
              {item.offer_label}
            </span>
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
        {/* Title */}
        <h4 className="text-base font-extrabold text-slate-900 line-clamp-1 leading-tight">
          {item.name}
        </h4>

        {/* Description */}
        {item.description && (
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 line-clamp-2 min-h-[32px]">
            {item.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 text-[10px] font-semibold mb-4">
          <span className="inline-flex items-center gap-1 text-teal-600">
            <MapPin className="w-3 h-3" />
            {item.counter_name}
          </span>
          {(item.prep_time || item.prep_time_minutes) && (
            <>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Clock className="w-3 h-3 text-slate-400" />
                {item.prep_time || `${item.prep_time_minutes}m`}
              </span>
            </>
          )}
          {item.calories && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-orange-500">🔥 {item.calories} kcal</span>
            </>
          )}
          {item.protein && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-blue-500">💪 {item.protein}g protein</span>
            </>
          )}
        </div>

        {/* Footer: Price + Add to Cart */}
        <div className="mt-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-lg font-black text-slate-900 tracking-tight">
              {formatINR(item.offer_price || item.price)}
            </span>
            {item.offer_price && item.offer_price < item.price && (
              <span className="ml-1.5 text-[10px] text-slate-400 line-through">
                {formatINR(item.price)}
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={!canAddToCart}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold shadow-sm transition-all duration-200 active:scale-[0.97] ${
              !canAddToCart
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : adding
                  ? 'bg-blue-600 text-white scale-[0.98]'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30'
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
        </div>
      </div>
    </article>
  );
};
