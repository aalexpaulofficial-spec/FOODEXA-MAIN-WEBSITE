import React from 'react';
import { Compass, HeartPulse, BarChart3, Gift, Clock, User, ShoppingBag } from 'lucide-react';

export type PremiumTab = 'explore' | 'nutrition' | 'analytics' | 'offers' | 'history' | 'profile' | 'payment_success' | 'payment_failed' | 'checkout';

const TABS = [
  { id: 'explore' as PremiumTab, label: 'Explore', icon: Compass },
  { id: 'nutrition' as PremiumTab, label: 'Nutrition', icon: HeartPulse },
  { id: 'analytics' as PremiumTab, label: 'Analytics', icon: BarChart3 },
  { id: 'offers' as PremiumTab, label: 'Offers', icon: Gift },
  { id: 'history' as PremiumTab, label: 'History', icon: Clock },
  { id: 'profile' as PremiumTab, label: 'Profile', icon: User },
];

interface PremiumBottomNavProps {
  activeTab: PremiumTab;
  setActiveTab: (tab: PremiumTab) => void;
  activeOrderCount?: number;
  cartCount?: number;
  onOpenCart?: () => void;
}

export const PremiumBottomNav: React.FC<PremiumBottomNavProps> = ({
  activeTab,
  setActiveTab,
  activeOrderCount = 0,
  cartCount = 0,
  onOpenCart,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pointer-events-none flex flex-col items-center">
      
      {/* Floating Quick Cart Bar (if items in cart) */}
      {cartCount > 0 && onOpenCart && (
        <div className="w-full max-w-md mx-auto mb-2 pointer-events-auto transition-all duration-300">
          <button
            onClick={onOpenCart}
            className="w-full bg-slate-900 text-white rounded-2xl p-3 shadow-xl flex items-center justify-between border border-slate-700/80 backdrop-blur-md active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {cartCount}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">{cartCount} items in cart</p>
                <p className="text-[10px] text-slate-300">Tap to view bill & checkout</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-300">
              <span>View Cart</span>
              <ShoppingBag className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* iOS Style Bottom Tab Bar */}
      <nav className="w-full max-w-lg mx-auto dash-glass-nav rounded-3xl p-1.5 flex items-center justify-around pointer-events-auto ring-1 ring-black/5 shadow-2xl">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          const showBadge = tab.id === 'history' && activeOrderCount > 0;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all relative ${
                active ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {active && (
                <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-2xl -z-10 shadow-sm" />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">
                {tab.label}
              </span>
              {showBadge && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white shadow-sm">
                  {activeOrderCount > 9 ? '9+' : activeOrderCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
