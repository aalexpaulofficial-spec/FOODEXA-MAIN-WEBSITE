import React from 'react';
import { Tag, Utensils } from 'lucide-react';
import type { MenuItem } from '../../types';
import { FoodCard } from './FoodCard';

interface OffersTabProps {
  offerItems: MenuItem[];
  onAddCart: (item: MenuItem) => void;
  onFavorite: (item: MenuItem) => void;
  favoritedIds?: Set<string>;
  onGoExplore: () => void;
}

export const OffersTab: React.FC<OffersTabProps> = ({
  offerItems,
  onAddCart,
  onFavorite,
  favoritedIds,
  onGoExplore,
}) => {
  return (
    <div className="flex-1 overflow-y-auto pb-32">
      <div className="p-4 space-y-5 max-w-2xl mx-auto">

        {/* Header */}
        <div>
          <h2 className="text-xl font-black text-slate-900">Today's Offers 🎁</h2>
          <p className="text-xs text-slate-500 mt-0.5">Special discounts from campus canteens</p>
        </div>

        {/* Offer items */}
        {offerItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {offerItems.map(item => (
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
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Tag className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-500">No offers available right now</p>
            <p className="text-xs text-slate-400 mt-1 mb-5">Check back later for special deals from canteens</p>
            <button
              onClick={onGoExplore}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/30"
            >
              <Utensils className="w-3.5 h-3.5" />
              Browse All Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
