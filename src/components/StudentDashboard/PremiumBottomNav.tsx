import React from 'react';
import { Home, Apple, BarChart2, Gift, Receipt, User } from 'lucide-react';

export type PremiumTab = 'explore' | 'nutrition' | 'analytics' | 'offers' | 'history' | 'profile' | 'payment_success' | 'payment_failed' | 'checkout';

const TABS = [
  { id: 'explore' as PremiumTab, label: 'Explore', icon: Home },
  { id: 'nutrition' as PremiumTab, label: 'Nutrition', icon: Apple },
  { id: 'analytics' as PremiumTab, label: 'Analytics', icon: BarChart2 },
  { id: 'offers' as PremiumTab, label: 'Offers', icon: Gift },
  { id: 'history' as PremiumTab, label: 'History', icon: Receipt },
  { id: 'profile' as PremiumTab, label: 'Profile', icon: User },
];

interface PremiumBottomNavProps {
  activeTab: PremiumTab;
  setActiveTab: (tab: PremiumTab) => void;
  activeOrderCount?: number;
}

export const PremiumBottomNav: React.FC<PremiumBottomNavProps> = ({
  activeTab,
  setActiveTab,
  activeOrderCount = 0,
}) => {
  return (
    <nav
      className="fixed bottom-5 left-1/2 z-50"
      style={{ transform: 'translateX(-50%)' }}
    >
      <div className="flex items-center gap-0.5 bg-white border border-[#E2E8F0] shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-full px-1.5 py-1.5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          const showBadge = tab.id === 'history' && activeOrderCount > 0;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-full transition-all duration-300 min-w-[56px] ${
                active
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              style={active ? { boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)' } : undefined}
            >
              <Icon className={`w-4 h-4 transition-all duration-300 ${active ? 'scale-110' : ''}`} />
              <span className={`text-[8.5px] font-bold leading-none transition-all ${active ? 'text-white' : ''}`}>
                {tab.label}
              </span>
              {showBadge && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[7px] font-black text-white ring-1 ring-white">
                  {activeOrderCount > 9 ? '9+' : activeOrderCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
