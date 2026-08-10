import React from 'react';
import {
  Compass,
  HeartPulse,
  BarChart3,
  Gift,
  Clock,
  User,
  ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';

export type PremiumTab = 'explore' | 'nutrition' | 'analytics' | 'offers' | 'history' | 'profile' | 'payment_success' | 'payment_failed' | 'checkout';

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
  const navItems = [
    { id: 'explore' as PremiumTab, label: 'Explore', icon: <Compass className="w-5 h-5" /> },
    { id: 'nutrition' as PremiumTab, label: 'Nutrition', icon: <HeartPulse className="w-5 h-5" /> },
    { id: 'analytics' as PremiumTab, label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'offers' as PremiumTab, label: 'Offers', icon: <Gift className="w-5 h-5" /> },
    { id: 'history' as PremiumTab, label: 'History', icon: <Clock className="w-5 h-5" /> },
    { id: 'profile' as PremiumTab, label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pointer-events-none">
      
      {/* Floating Quick Cart Bar (if items in cart) */}
      {cartCount > 0 && onOpenCart && (
        <div className="max-w-md mx-auto mb-2 pointer-events-auto">
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenCart}
            className="w-full bg-[#1D1D1F] text-white rounded-[16px] p-3 shadow-md flex items-center justify-between border border-transparent backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0071E3] text-white flex items-center justify-center font-bold text-xs">
                {cartCount}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">{cartCount} items in cart</p>
                <p className="text-[10px] text-slate-300">Tap to view bill & checkout</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-extrabold text-[#0071E3]">
              <span>View Cart</span>
              <ShoppingBag className="w-4 h-4" />
            </div>
          </motion.button>
        </div>
      )}

      {/* iOS Style Bottom Tab Bar */}
      <div className="max-w-lg mx-auto glass-nav bg-white/75 backdrop-blur-2xl border border-white/80 shadow-lg rounded-[24px] p-1.5 flex items-center justify-around pointer-events-auto ring-1 ring-black/5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const showBadge = item.id === 'history' && activeOrderCount > 0;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-[16px] transition-all relative ${
                isActive ? 'text-[#0071E3] font-bold' : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 bg-[#0071E3]/10 backdrop-blur-md border border-transparent rounded-[16px] -z-10 shadow-xs"
                  transition={{ type: 'spring', duration: 0.4 }}
                />
              )}
              {item.icon}
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">
                {item.label}
              </span>
              {showBadge && (
                <span className="absolute top-1 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-[#FF3B30] text-[7px] font-black text-white shadow-sm ring-1 ring-white">
                  {activeOrderCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
