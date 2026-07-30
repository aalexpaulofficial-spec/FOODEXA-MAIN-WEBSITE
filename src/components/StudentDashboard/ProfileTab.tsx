import React, { useState } from 'react';
import { Building2, MapPin, LogOut, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300&h=300',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300&h=300',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300&h=300',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300&h=300'
];

interface ProfileTabProps {
  userEmail: string;
  userName: string;
  institutionName: string;
  institutionCode: string;
  avatarUrl?: string | null;
  onSignOut: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  userEmail,
  userName,
  institutionName,
  institutionCode,
  avatarUrl,
  onSignOut
}) => {
  const [dietaryPref, setDietaryPref] = useState('all');
  const [selectedAvatar, setSelectedAvatar] = useState(avatarUrl || AVATARS[0]);

  const handleAvatarChange = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    // Ideally update Supabase here
  };

  const name = userName || 'Student';
  const initials = userName
    ? userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'S';

  return (
    <div className="w-full my-6 max-w-4xl mx-auto space-y-6 px-4 pb-32">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Identity Profile</h2>
        <p className="text-xs text-slate-500">Verified {institutionName} Student Account</p>
      </div>

      {/* Main Student Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
          <div className="relative group shrink-0">
            {selectedAvatar ? (
              <img
                src={selectedAvatar}
                alt={name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-white/20 shadow-xl"
              />
            ) : (
              <div className="flex w-24 h-24 sm:w-28 sm:h-28 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 text-3xl font-black text-white shadow-xl ring-4 ring-white/20">
                {initials}
              </div>
            )}
          </div>

          <div className="flex-1 w-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-cyan-300 border border-cyan-400/30 mb-2">
              <Building2 className="w-3.5 h-3.5 text-cyan-300" />
              {institutionName}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Email: <span className="font-mono text-cyan-300 font-bold">{userEmail}</span>
            </p>

            <p className="text-xs text-slate-400 mt-0.5">{institutionCode}</p>

            {/* Quick Stats Row (Without Wallet) */}
            <div className="grid grid-cols-2 gap-3 my-5 pt-4 border-t border-white/10 text-center">
              <div className="p-2">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Reward Pts</p>
                <p className="text-base font-extrabold text-amber-400 mt-0.5">250</p>
              </div>

              <div className="p-2">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Total Orders</p>
                <p className="text-base font-extrabold text-cyan-300 mt-0.5">14</p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Avatar Selector */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-slate-300 mb-2 font-semibold">Choose Profile Picture Avatar</p>
          <div className="flex items-center justify-center sm:justify-start gap-3">
            {AVATARS.map((url, idx) => (
              <button
                key={idx}
                onClick={() => handleAvatarChange(url)}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                  selectedAvatar === url ? 'border-cyan-400 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={url} alt="" className="w-10 h-10 object-cover" />
                {selectedAvatar === url && (
                  <span className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="glass-card rounded-3xl p-6 space-y-6">
        
        {/* Dietary Preference */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2.5">Dietary Preference</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['all', 'veg', 'non-veg'] as const).map(pref => (
              <button
                key={pref}
                onClick={() => setDietaryPref(pref)}
                className={`py-3 px-4 rounded-2xl border text-xs font-bold capitalize transition-all ${
                  dietaryPref === pref
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {pref === 'all' ? '🥗 All Meals' : pref === 'veg' ? '🥦 Pure Veg' : '🍗 Non-Veg Included'}
              </button>
            ))}
          </div>
        </div>

        {/* Saved Delivery Spots */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Saved Campus Delivery / Table Spots
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-800">Main Library Block A</span>
              <span className="text-[10px] text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded-full">Default</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-800">Hostel Block C, Room 402</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={onSignOut}
            className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all border border-red-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Securely
          </button>
        </div>

      </div>
    </div>
  );
};
