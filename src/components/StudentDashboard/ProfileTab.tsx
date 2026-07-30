import React from 'react';
import {
  User, Mail, Phone, Building2, BookOpen, Calendar, Award, MapPin,
  Edit3, LogOut, ChevronRight, Shield, Wallet, Star, Receipt,
} from 'lucide-react';
import type { UserRole, Profile } from '../../types';
import { formatINR } from '../../lib/supabase-service';

const roleLabel = (role: UserRole | null | undefined) => {
  if (role === 'student') return 'Student';
  if (role === 'faculty') return 'Faculty';
  if (role === 'guest') return 'Guest';
  return 'Member';
};

const roleGradient = (role: UserRole | null | undefined) => {
  if (role === 'student') return 'from-blue-500 to-indigo-600';
  if (role === 'faculty') return 'from-cyan-500 to-blue-500';
  if (role === 'guest') return 'from-amber-500 to-orange-500';
  return 'from-slate-500 to-slate-600';
};

interface ProfileTabProps {
  profile: Profile | null;
  userEmail?: string;
  institutionName: string;
  institutionCode: string;
  liveRole: UserRole | null;
  ordersCount: number;
  favoritesCount: number;
  avatarUrl?: string | null;
  onEditProfile: () => void;
  onSignOut: () => void;
  onLeaveInstitution: () => void;
  onGoHistory: () => void;
}

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon, label, value,
}) => (
  <div className="flex items-center gap-3 px-4 py-3">
    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-xs font-semibold text-slate-900 truncate mt-0.5">{value || '—'}</p>
    </div>
  </div>
);

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  userEmail,
  institutionName,
  institutionCode,
  liveRole,
  ordersCount,
  favoritesCount,
  avatarUrl,
  onEditProfile,
  onSignOut,
  onLeaveInstitution,
  onGoHistory,
}) => {
  const displayName = profile?.full_name || userEmail || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const email = profile?.email || userEmail || '';

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      <div className="p-4 space-y-4 max-w-2xl mx-auto">

        {/* Hero card — dark gradient */}
        <div className="relative overflow-hidden rounded-3xl shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1b3a] via-[#1e2050] to-slate-900" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 via-transparent to-indigo-500/8" />
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 p-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/10 shadow-xl shrink-0"
                />
              ) : (
                <div className={`flex-shrink-0 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${roleGradient(liveRole)} text-2xl font-black text-white shadow-xl ring-4 ring-white/10`}>
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-black text-white truncate leading-tight">{displayName}</h3>
                <p className="text-xs text-blue-300 truncate mt-1">{email}</p>

                {/* Role + institution badges */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-blue-300">
                    <Shield className="w-2.5 h-2.5" />
                    {roleLabel(liveRole)}
                  </span>
                  {institutionCode && (
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[9px] font-mono text-slate-400">
                      {institutionCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: 'Orders', value: ordersCount.toString(), icon: '🛒' },
                { label: 'Favourites', value: favoritesCount.toString(), icon: '❤️' },
                { label: 'Wallet', value: profile?.wallet_balance !== undefined ? formatINR(profile.wallet_balance) : '—', icon: '💳' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                  <p className="text-lg">{s.icon}</p>
                  <p className="text-sm font-black text-white mt-1 truncate">{s.value}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail rows */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
          <DetailRow
            icon={<User className="w-4 h-4 text-blue-500" />}
            label="Full Name"
            value={profile?.full_name || ''}
          />
          <DetailRow
            icon={<Mail className="w-4 h-4 text-violet-500" />}
            label="Email"
            value={email}
          />
          <DetailRow
            icon={<Phone className="w-4 h-4 text-emerald-500" />}
            label="Phone"
            value={profile?.phone || ''}
          />
          <DetailRow
            icon={<Building2 className="w-4 h-4 text-blue-500" />}
            label="Institution"
            value={institutionName}
          />
          <DetailRow
            icon={<BookOpen className="w-4 h-4 text-amber-500" />}
            label="Department"
            value={profile?.department || ''}
          />
          <DetailRow
            icon={<Calendar className="w-4 h-4 text-pink-500" />}
            label="Semester"
            value={profile?.semester || ''}
          />
          <DetailRow
            icon={<Award className="w-4 h-4 text-indigo-500" />}
            label="Programme"
            value={profile?.programme || ''}
          />
          <DetailRow
            icon={<MapPin className="w-4 h-4 text-teal-500" />}
            label="Campus Block"
            value={profile?.campus_block || ''}
          />
        </div>

        {/* Action buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onEditProfile}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Edit3 className="w-4 h-4 text-blue-600" />
            </div>
            Edit Profile
            <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
          </button>

          <button
            onClick={onGoHistory}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4 text-emerald-600" />
            </div>
            Order History
            <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
          </button>

          <button
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            My Favourites
            <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
          </button>

          {institutionCode && (
            <button
              onClick={onLeaveInstitution}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 py-3.5 text-sm font-bold text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all"
            >
              <Building2 className="w-4 h-4" /> Leave Institution
            </button>
          )}

          <button
            onClick={onSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-600 hover:bg-red-100 hover:border-red-300 transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <p className="text-center text-[9px] text-slate-400 pb-2">
          FOODEXA v3.0 · Powered by Supabase · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};
