import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, Building2, Clock, Calendar, Hand } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserRole } from '../../types';

interface PremiumHeaderProps {
  institutionName: string;
  institutionCode: string;
  institutionCity?: string;
  institutionCampus?: string;
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
  onGoProfile?: () => void;
}

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  institutionName,
  institutionCode,
  institutionCity,
  institutionCampus,
  avatarUrl,
  userName,
  unreadNotif,
  onOpenNotifications,
  onOpenLxAI,
  onGoProfile,
}) => {
  const name = userName ? userName.split(' ')[0] : 'Student';
  const initials = userName
    ? userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'S';

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('Good Day');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
      const hour = now.getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative z-10 glass-header px-4 sm:px-8 py-4 transition-all">
      {/* Single row: avatar + info on left, actions on right */}
      <div className="flex items-center justify-between gap-3">

        {/* LEFT: Avatar + Greeting + Info */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <button
            onClick={onGoProfile}
            className="relative group focus:outline-none shrink-0"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-[16px] object-cover ring-2 ring-blue-600/30 group-hover:ring-blue-600 transition-all shadow-md"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#1D1D1F] text-base font-black text-white shadow-md ring-2 ring-blue-600/30 group-hover:ring-blue-600 transition-all">
                {initials}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#30D158] rounded-full border-2 border-white shadow-sm"></span>
          </button>

          {/* Text block */}
          <div className="min-w-0">
            {/* Row 1: Greeting + Institution pill */}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-[#1D1D1F] whitespace-nowrap">
                {greeting}, {name} <Hand className="inline-block w-5 h-5 text-[#0071E3] align-[-2px]" />
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold glass-card text-blue-700 whitespace-nowrap">
                <Building2 className="w-3 h-3 text-[#0071E3] shrink-0" />
                {institutionName || institutionCode || 'Campus Portal'}
              </span>
            </div>

            {/* Row 2: Campus, City, Time, Date */}
            <div className="flex items-center gap-1.5 text-xs text-[#86868B] mt-0.5 flex-wrap">
              {(institutionCampus || institutionCity) && (
                <span className="font-medium text-[#6E6E73]">
                  {[institutionCampus, institutionCity].filter(Boolean).join(', ')}
                </span>
              )}
              {(institutionCampus || institutionCity) && <span className="text-slate-300">•</span>}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#0071E3]" />
                {currentTime || '12:21 PM'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#86868B]" />
                {currentDate}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: LX AI + Wallet + Bell — all uniform w-10 h-10 on mobile */}
        <div className="flex items-center gap-2 shrink-0">

          {/* ✨ LX AI */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenLxAI}
            className="w-10 h-10 flex items-center justify-center rounded-[16px] bg-[#1D1D1F] shadow-md shadow-md"
            title="Ask LX AI"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.button>

          {/* 🔔 Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative w-10 h-10 flex items-center justify-center rounded-[16px] bg-white border border-slate-100 text-[#1D1D1F] shadow-sm hover:text-[#1D1D1F] transition-all focus:outline-none"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#0071E3] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {unreadNotif > 0 ? unreadNotif : '0'}
            </span>
          </button>

        </div>

      </div>
    </header>
  );
};
