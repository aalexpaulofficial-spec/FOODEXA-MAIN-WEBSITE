import React, { useState, useEffect } from 'react';
import { Bell, ShoppingCart, Sparkles, School, Clock, Calendar } from 'lucide-react';
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
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  institutionName,
  institutionCode,
  avatarUrl,
  userName,
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

  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 shrink-0 dash-glass-header px-4 sm:px-8 py-3.5 transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">

        {/* Left — Avatar + Greeting */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Avatar */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-600/30 shadow-md"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-sm font-black text-white shadow-md">
                {initials}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
          </div>

          {/* Greeting + Institution */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                {getGreeting()}, {name} <span className="inline-block">👋</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium dash-glass-pill text-blue-700 shadow-sm">
                <School className="w-3 h-3 text-blue-600" />
                {institutionName || 'Campus Portal'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              {institutionCode && (
                <span className="font-medium text-slate-700">{institutionCode}</span>
              )}
              {institutionCode && <span className="text-slate-300">•</span>}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {currentTime}
              </span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="hidden md:flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {currentDate}
              </span>
            </div>
          </div>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* LX AI button — blue→indigo→cyan gradient */}
          <button
            onClick={onOpenLxAI}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-cyan-500/90 text-white text-xs font-semibold shadow-md shadow-blue-500/20 backdrop-blur-md border border-white/30 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-[0.97]"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-200" />
            <span className="hidden sm:inline">Ask LX AI</span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2.5 rounded-2xl dash-glass-pill text-slate-700 hover:text-slate-900 hover:bg-white/90 transition-all shadow-sm focus:outline-none"
          >
            <Bell className="w-5 h-5" />
            {unreadNotif > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {unreadNotif > 9 ? '9+' : unreadNotif}
              </span>
            )}
          </button>

          {/* Cart */}
          <button
            onClick={onOpenCart}
            className="relative p-2.5 rounded-2xl dash-glass-pill text-slate-700 hover:text-slate-900 hover:bg-white/90 transition-all shadow-sm focus:outline-none"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-black text-white ring-1 ring-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
