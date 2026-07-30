import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, Building2, Clock, Calendar, Wallet } from 'lucide-react';
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
  walletBalance,
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
    <header className="sticky top-0 z-30 glass-header px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Left Greeting & Institution Info */}
        <div className="flex items-center gap-3.5">
          <button 
            onClick={onGoProfile}
            className="relative group focus:outline-none shrink-0"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl object-cover ring-2 ring-blue-600/30 group-hover:ring-blue-600 transition-all shadow-md"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-black text-white shadow-md ring-2 ring-blue-600/30 group-hover:ring-blue-600 transition-all">
                {initials}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 font-sans">
                {greeting}, {name} <span className="inline-block animate-wave">👋</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium glass-pill text-blue-700 shadow-xs">
                <Building2 className="w-3 h-3 text-blue-600" />
                {institutionName || 'Campus Portal'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-0.5">
              {(institutionCampus || institutionCity) && (
                <span className="font-medium text-slate-600">
                  {[institutionCampus, institutionCity].filter(Boolean).join(', ')}
                </span>
              )}
              {(institutionCampus || institutionCity) && <span className="text-slate-300">•</span>}
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {currentTime || '12:21 PM'}
              </span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="hidden md:flex items-center gap-1 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {currentDate}
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Bar (Bell, LX AI, Institution Badge) */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          
          {/* Institution Pill (Mobile) */}
          <div className="sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold glass-pill text-blue-800">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            {institutionCode || institutionName}
          </div>

          <div className="flex items-center gap-2">
            {/* LX AI Quick Trigger */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenLxAI}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-cyan-500/90 text-white text-xs font-semibold shadow-md shadow-blue-500/20 backdrop-blur-md border border-white/30 hover:shadow-lg transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-200" />
              <span className="hidden sm:inline">Ask LX AI</span>
            </motion.button>

            {/* Wallet Balance Pill */}
            {walletBalance !== undefined && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl glass-pill text-slate-900 shadow-sm hover:bg-white/90 transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold leading-tight">Wallet</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">₹{Math.round(walletBalance)}</p>
                </div>
              </motion.button>
            )}

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-2xl glass-pill text-slate-700 hover:text-slate-900 hover:bg-white/90 transition-all shadow-sm focus:outline-none"
            >
              <Bell className="w-5 h-5" />
              {unreadNotif > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadNotif}
                </span>
              )}
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
