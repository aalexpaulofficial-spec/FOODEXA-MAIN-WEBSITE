import React, { useState, useEffect } from 'react';
import {
  Building2, MapPin, LogOut, User, Mail, Phone, Edit3, Save, X,
  ChevronRight, Globe, FileText, Shield, Hash, GraduationCap,
  Plus, Trash2, Star, Loader2, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Profile, InstitutionData, UserAddress, Canteen, DietPreference } from '../../types';
import { supabase } from '../../lib/supabase';

interface ProfileTabProps {
  profile: Profile | null;
  userEmail?: string | null;
  institutionData: InstitutionData | null;
  institutionName: string;
  userAddresses: UserAddress[];
  canteens: Canteen[];
  onSignOut: () => void;
  onEditProfileOpen: () => void;
  onAddAddress: (label: string, address: string, isDefault: boolean) => Promise<void>;
  onUpdateAddress: (id: string, label: string, address: string, isDefault: boolean) => Promise<void>;
  onDeleteAddress: (id: string) => Promise<void>;
  onSetDefaultAddress: (id: string) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
  onRemoveAvatar: () => Promise<void>;
  onUpdateDietPreference: (pref: DietPreference) => Promise<void>;
  refreshAddresses: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  onSwitchInstitution: () => void;
  triggerToast?: (title: string, description: string, type?: 'success' | 'warning' | 'info' | 'ai' | 'error') => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  userEmail,
  institutionData,
  institutionName,
  userAddresses,
  canteens,
  onSignOut,
  onEditProfileOpen,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  onUploadAvatar,
  onRemoveAvatar,
  onUpdateDietPreference,
  refreshAddresses,
  refreshProfile,
  onSwitchInstitution,
  triggerToast,
}) => {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const displayName = profile?.full_name || 'Student';
  const displayEmail = profile?.email || userEmail || '';
  const displayInstitution = institutionData?.institution_name || institutionName || '';
  const displayCampus = institutionData?.campus || '';
  const firstLetter = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleAvatarUpload = async (file: File) => {
    setIsUploading(true);
    try {
      await onUploadAvatar(file);
      triggerToast?.('Success', 'Profile picture updated', 'success');
      await refreshProfile();
    } catch (err: any) {
      triggerToast?.('Error', err?.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDietChange = async (pref: DietPreference) => {
    try {
      await onUpdateDietPreference(pref);
      triggerToast?.('Updated', 'Diet preference saved', 'success');
    } catch (err: any) {
      triggerToast?.('Error', err?.message || 'Failed to update diet preference', 'error');
    }
  };

  const currentPref = profile?.diet_preference || 'all';

  const profileFields = [
    { label: 'Student Name', value: profile?.full_name, icon: User },
    { label: 'Email', value: profile?.email || userEmail, icon: Mail },
    { label: 'Phone', value: profile?.phone, icon: Phone },
    { label: 'Institution', value: displayInstitution, icon: Building2 },
    { label: 'Department', value: profile?.department, icon: GraduationCap },
    { label: 'Programme', value: profile?.programme, icon: GraduationCap },
    { label: 'Semester', value: profile?.semester, icon: Calendar },
    { label: 'Campus', value: displayCampus || profile?.campus_block, icon: MapPin },
    { label: 'Student ID', value: profile?.user_id?.slice(-8).toUpperCase(), icon: Shield },
    { label: 'Registration No.', value: profile?.designation, icon: Hash },
  ].filter(f => f.value && String(f.value).trim());

  return (
    <div className="w-full my-6 max-w-4xl mx-auto space-y-5 px-4 pb-32">
      {/* ── Profile Header ── */}
      <div className="glass-card dark:glass-card-dark rounded-[24px] p-6">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-xl font-black text-white shadow-md">
              {firstLetter}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 truncate">{displayName}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{displayEmail}</p>
            {displayInstitution && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5 truncate">
                {displayInstitution}{displayCampus ? ` · ${displayCampus}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={onEditProfileOpen}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Account Information ── */}
      {profileFields.length > 0 && (
        <div className="glass-card dark:glass-card-dark rounded-[24px] p-6">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Account Information</h2>
          <div className="space-y-1">
            {profileFields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.label} className="flex items-center gap-3 py-2.5">
                  <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{field.label}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5 truncate">{String(field.value)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Subscription ── */}
      <div className="glass-card dark:glass-card-dark rounded-[24px] p-6">
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Subscription</h2>
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Current Plan</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Free Plan · ₹0 / month</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-[11px] font-bold border border-emerald-200 dark:border-emerald-900/40">
            Active
          </span>
        </div>
      </div>

      {/* ── Diet Preference ── */}
      <div className="glass-card dark:glass-card-dark rounded-[24px] p-6">
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Diet Preference</h2>
        <div className="grid grid-cols-3 gap-3">
          {([
            { value: 'all' as DietPreference, label: 'All Meals', emoji: '🍽️' },
            { value: 'veg' as DietPreference, label: 'Pure Veg', emoji: '🥦' },
            { value: 'non-veg' as DietPreference, label: 'Non-Veg', emoji: '🍗' },
          ]).map((pref) => (
            <button
              key={pref.value}
              onClick={() => handleDietChange(pref.value)}
              className={`flex flex-col items-center gap-1.5 py-3 px-4 rounded-2xl border-2 transition-all ${
                currentPref === pref.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <span className="text-xl">{pref.emoji}</span>
              <span className="text-xs font-bold">{pref.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Saved Delivery Spots ── */}
      <div className="glass-card dark:glass-card-dark rounded-[24px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Saved Spots</h2>
          <button
            onClick={() => { setEditingAddress(null); setShowAddressModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        {userAddresses.length === 0 ? (
          <div className="text-center py-6">
            <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No saved spots yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {userAddresses.map((address) => (
              <div
                key={address.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{address.label}</p>
                    {address.is_default && (
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-full text-[9px] font-bold">Default</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{address.address}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {!address.is_default && (
                    <button onClick={() => onSetDefaultAddress(address.id)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Set default">
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => { setEditingAddress(address); setShowAddressModal(true); }} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDeleteAddress(address.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer Links ── */}
      <div className="space-y-2 pt-2">
        <a
          href="mailto:foodexaofficial@gmail.com"
          className="flex items-center gap-3 p-4 glass-card dark:glass-card-dark rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Privacy & Policy</span>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto" />
        </a>

        <a
          href="mailto:foodexaofficial@gmail.com"
          className="flex items-center gap-3 p-4 glass-card dark:glass-card-dark rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Terms & Service</span>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto" />
        </a>

        <button
          onClick={onSwitchInstitution}
          className="w-full flex items-center gap-3 p-4 glass-card dark:glass-card-dark rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Building2 className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Switch Institution</span>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto" />
        </button>

        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span className="text-sm font-bold text-red-600 dark:text-red-400">Log Out</span>
        </button>

        <p className="text-center text-[10px] text-slate-300 dark:text-slate-600 pt-2">
          Support: foodexaofficial@gmail.com
        </p>
      </div>

      {/* ── Address Modal ── */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => { setShowAddressModal(false); setEditingAddress(null); }}
        editingAddress={editingAddress}
        onSave={async (label, address, isDefault) => {
          try {
            if (editingAddress) {
              await onUpdateAddress(editingAddress.id, label, address, isDefault);
              triggerToast?.('Updated', 'Delivery spot updated', 'success');
            } else {
              await onAddAddress(label, address, isDefault);
              triggerToast?.('Added', 'Delivery spot saved', 'success');
            }
            await refreshAddresses();
          } catch (err: any) {
            triggerToast?.('Error', err?.message || 'Failed to save address', 'error');
          }
        }}
      />
    </div>
  );
};

// ── Address Modal ──
const AddressModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  editingAddress: UserAddress | null;
  onSave: (label: string, address: string, isDefault: boolean) => Promise<void>;
}> = ({ isOpen, onClose, editingAddress, onSave }) => {
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingAddress) {
      setLabel(editingAddress.label);
      setAddress(editingAddress.address);
      setIsDefault(editingAddress.is_default);
    } else {
      setLabel('');
      setAddress('');
      setIsDefault(false);
    }
  }, [editingAddress]);

  const handleSave = async () => {
    if (!label.trim() || !address.trim()) return;
    setSaving(true);
    try {
      await onSave(label.trim(), address.trim(), isDefault);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-md rounded-[24px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
            {editingAddress ? 'Edit Spot' : 'Add Spot'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Dorm Room, Library"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address or pickup location"
              rows={3}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 outline-none resize-none transition-colors"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Set as default</label>
            <button
              onClick={() => setIsDefault(!isDefault)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isDefault ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDefault ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !label.trim() || !address.trim()} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
