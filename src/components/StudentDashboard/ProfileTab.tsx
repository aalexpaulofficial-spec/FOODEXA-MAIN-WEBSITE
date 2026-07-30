import React from 'react';
import {
  User, Mail, Phone, Building2, BookOpen, Calendar, Award, MapPin,
  Edit3, LogOut, ChevronRight, Shield, Star, Receipt,
} from 'lucide-react';
import type { UserRole, Profile } from '../../types';

const roleLabel = (role: UserRole | null | undefined) => {
  if (role === 'student') return 'Student';
  if (role === 'faculty') return 'Faculty';
  if (role === 'guest') return 'Guest';
  return 'Member';
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
  <div className="flex items-center gap-3.5 px-4 py-3.5">
    <div className="w-10 h-10 rounded-2xl bg-blue-50/50 backdrop-blur-md flex items-center justify-center shrink-0 border border-blue-100/50 shadow-sm">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-slate-900 truncate">{value || '—'}</p>
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

        {/* Glassmorphism Hero card */}
        <div className="relative overflow-hidden rounded-3xl shadow-lg border border-slate-200 bg-white/70 backdrop-blur-2xl">
          {/* Subtle gradient background inside the card */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/40 to-cyan-50/80" />
          
          <div className="relative z-10 p-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-20 h-20 rounded-3xl object-cover ring-2 ring-white shadow-xl shrink-0"
                  />
                ) : (
                  <div className={`flex-shrink-0 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 text-2xl font-black text-white shadow-xl ring-2 ring-white`}>
                    {initials}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 truncate tracking-tight">{displayName}</h3>
                <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">{email}</p>

                {/* Role + institution badges */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <span className="inline-flex items-center gap-1 rounded-xl bg-blue-100/80 border border-blue-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700 shadow-sm backdrop-blur-md">
                    <Shield className="w-3 h-3" />
                    {roleLabel(liveRole)}
                  </span>
                  {institutionCode && (
                    <span className="rounded-xl border border-slate-200 bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600 shadow-sm backdrop-blur-md flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {institutionCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row inside the hero card */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              {[
                { label: 'Total Orders', value: ordersCount.toString(), icon: '🛍️', bg: 'bg-indigo-50/80', border: 'border-indigo-100/50' },
                { label: 'Favourites', value: favoritesCount.toString(), icon: '❤️', bg: 'bg-rose-50/80', border: 'border-rose-100/50' },
              ].map(s => (
                <div key={s.label} className={`rounded-2xl ${s.bg} border ${s.border} p-3.5 flex items-center gap-3 backdrop-blur-md shadow-sm`}>
                  <div className="text-2xl bg-white p-2 rounded-xl shadow-sm">{s.icon}</div>
                  <div>
                    <p className="text-lg font-black text-slate-900 truncate">{s.value}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail rows - Glassmorphism list */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/60 backdrop-blur-xl shadow-sm overflow-hidden divide-y divide-slate-100/80">
          <DetailRow
            icon={<User className="w-5 h-5 text-blue-600" />}
            label="Full Name"
            value={profile?.full_name || ''}
          />
          <DetailRow
            icon={<Phone className="w-5 h-5 text-cyan-600" />}
            label="Phone"
            value={profile?.phone || ''}
          />
          <DetailRow
            icon={<Building2 className="w-5 h-5 text-indigo-600" />}
            label="Institution"
            value={institutionName}
          />
          <DetailRow
            icon={<BookOpen className="w-5 h-5 text-violet-600" />}
            label="Department"
            value={profile?.department || ''}
          />
          <DetailRow
            icon={<Calendar className="w-5 h-5 text-emerald-600" />}
            label="Semester"
            value={profile?.semester || ''}
          />
          <DetailRow
            icon={<Award className="w-5 h-5 text-amber-600" />}
            label="Programme"
            value={profile?.programme || ''}
          />
          <DetailRow
            icon={<MapPin className="w-5 h-5 text-rose-600" />}
            label="Campus Block"
            value={profile?.campus_block || ''}
          />
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onEditProfile}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xl px-4 py-4 text-sm font-bold text-slate-800 hover:bg-white hover:border-blue-300 transition-all shadow-sm active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center shrink-0 border border-blue-200/50">
              <Edit3 className="w-5 h-5 text-blue-600" />
            </div>
            Edit Profile
            <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
          </button>

          <button
            onClick={onGoHistory}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xl px-4 py-4 text-sm font-bold text-slate-800 hover:bg-white hover:border-blue-300 transition-all shadow-sm active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-100/50 flex items-center justify-center shrink-0 border border-cyan-200/50">
              <Receipt className="w-5 h-5 text-cyan-600" />
            </div>
            Order History
            <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
          </button>

          <button
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xl px-4 py-4 text-sm font-bold text-slate-800 hover:bg-white hover:border-blue-300 transition-all shadow-sm active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100/50 flex items-center justify-center shrink-0 border border-amber-200/50">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            My Favourites
            <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
          </button>

          {institutionCode && (
            <button
              onClick={onLeaveInstitution}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200/80 bg-rose-50/80 backdrop-blur-xl py-4 text-sm font-bold text-rose-700 hover:bg-rose-100 transition-all shadow-sm active:scale-[0.98]"
            >
              <Building2 className="w-4 h-4" /> Leave Institution
            </button>
          )}

          <button
            onClick={onSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200/80 bg-red-50/80 backdrop-blur-xl py-4 text-sm font-bold text-red-600 hover:bg-red-100 transition-all shadow-sm active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <p className="text-center text-[10px] font-semibold text-slate-400 pt-4 pb-2 uppercase tracking-widest">
          FOODEXA v3.0 · Powered by Supabase
        </p>
      </div>
    </div>
  );
};
