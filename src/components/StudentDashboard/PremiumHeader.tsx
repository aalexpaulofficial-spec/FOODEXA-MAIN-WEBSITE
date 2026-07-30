import React from 'react';
import { Bell, ShoppingCart, Sparkles, School, Wallet } from 'lucide-react';
import type { UserRole } from '../../types';

interface PremiumHeaderProps {
  institutionName: string;
  institutionCode: string;
  liveRole?: UserRole | null;
  avatarUrl?: string | null;
  userName?: string;
  walletBalance?: number;
  unreadNotif: number;
  cartCount: number;
  onOpenNotifications: () => void;
  onOpenCart: () => void;
  onOpenLxAI?: () => void;
  onClose: () => void;
}

const getGreeting = () => {
  return 'Hello';
};

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  institutionName,
  institutionCode,
  avatarUrl,
  userName,
  walletBalance,
  unreadNotif,
  cartCount,
  onOpenNotifications,
  onOpenCart,
  onOpenLxAI,
}) => {
  const name = userName ? userName.split(' ')[0] : 'Student';
  const initials = userName
    ? userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'S';

  return (
    <header className="sticky top-0 z-40 shrink-0 bg-white border-b border-[#E2E8F0] shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">

        {/* Left — User Greeting + Avatar */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar with active dot */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-black text-white ring-2 ring-white shadow-sm">
                {initials}
              </div>
            )}
            {/* Green online dot */}
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          {/* Greeting Text */}
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900 truncate max-w-[110px] sm:max-w-[180px] leading-tight">
              Hello, {name}!
            </p>
          </div>
        </div>

        {/* Center — Institution Badge */}
        <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">
            <div className="w-4 h-4 rounded-full bg-white border border-emerald-200 flex items-center justify-center text-[9px]">
              <School className="w-2.5 h-2.5 text-emerald-600" />
            </div>
            <span className="truncate max-w-[140px]">{institutionName || 'Campus Portal'}</span>
            {institutionCode && (
              <span className="text-emerald-500 font-mono text-[9px]">· {institutionCode}</span>
            )}
          </div>
          <span className="text-[9px] text-slate-400 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {' · '}
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Right — Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Ask LX AI — vibrant gradient + glow */}
          <button
            onClick={onOpenLxAI}
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-teal-500 transition-all active:scale-[0.97]"
            style={{ boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask LX AI
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 shadow-sm transition-all active:scale-95"
          >
            <Bell className="w-4 h-4" />
            {unreadNotif > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-1 ring-white">
                {unreadNotif > 9 ? '9+' : unreadNotif}
              </span>
            )}
          </button>

          {/* Cart */}
          <button
            onClick={onOpenCart}
            className="relative p-2 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 shadow-sm transition-all active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-black text-white ring-1 ring-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
