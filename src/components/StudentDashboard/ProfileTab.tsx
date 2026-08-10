import React, { useState, useRef, useEffect } from 'react';
import {
  Building2, MapPin, LogOut, User, Mail, Phone, Edit3, Save, X,
  Camera, Trash2, Check, Plus, ChevronRight, ChevronLeft,
  Settings, Shield, Bell, Globe, FileText, HelpCircle, MessageCircle,
  Flag, Copy, Download, ExternalLink, Info, Upload, ZoomIn, Loader2,
  Home, Hash, GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Profile, InstitutionData, UserAddress, Canteen, DietPreference } from '../../types';
import { uploadAvatar, removeAvatar, updateDietPreference as updateDietPreferenceService } from '../../lib/supabase-service';

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
  triggerToast?: (title: string, description: string, type?: 'success' | 'warning' | 'info' | 'ai' | 'error') => void;
}

type TabView = 'account' | 'settings';

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
  triggerToast,
}) => {
  const [activeView, setActiveView] = useState<TabView>('account');
  const [isUploading, setIsUploading] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

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

  const handleRemoveAvatar = async () => {
    setIsRemovingAvatar(true);
    try {
      await onRemoveAvatar();
      triggerToast?.('Removed', 'Profile picture removed', 'success');
      await refreshProfile();
    } catch (err: any) {
      triggerToast?.('Error', err?.message || 'Failed to remove photo', 'error');
    } finally {
      setIsRemovingAvatar(false);
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

  const getDisplayValue = (val: string | null | undefined, fallback = 'Not set'): string => {
    return val && val.trim() ? val : fallback;
  };

  const DietPreferenceSelector = () => {
    const currentPref = profile?.diet_preference || 'all';
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-slate-200">Diet Preference</h3>
        <div className="grid grid-cols-3 gap-3">
          {([
            { value: 'all' as DietPreference, label: 'All Meals', icon: '🥗' },
            { value: 'veg' as DietPreference, label: 'Pure Veg', icon: '🥦' },
            { value: 'non-veg' as DietPreference, label: 'Non-Veg', icon: '🍗' },
          ]).map((pref) => (
            <button
              key={pref.value}
              onClick={() => handleDietChange(pref.value)}
              className={`flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl border-2 transition-all ${
                currentPref === pref.value
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-[#6E6E73] dark:text-[#86868B] hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-xl">{pref.icon}</span>
              <span className="text-xs font-bold">{pref.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const AccountView = () => (
    <div className="space-y-6 pb-8">
      {/* Profile Picture Section */}
      <div className="glass-card dark:glass-card-dark rounded-[24px] p-6">
        <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-slate-200 mb-4">Profile Picture</h2>
        <div className="flex items-center gap-6">
          <div className="relative group shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile?.full_name || 'Student'}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-100 dark:ring-slate-700 shadow-md"
              />
            ) : (
              <div className="flex w-24 h-24 items-center justify-center rounded-full bg-[#1D1D1F] text-2xl font-black text-white shadow-md ring-4 ring-slate-100 dark:ring-slate-700">
                {profile?.full_name
                  ? profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  : (profile?.email?.[0] || 'S').toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4" />
              {isUploading ? 'Uploading...' : 'Change Photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
                disabled={isUploading}
              />
            </label>
            {profile?.avatar_url && (
              <button
                onClick={handleRemoveAvatar}
                disabled={isRemovingAvatar}
                className="px-4 py-2 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {isRemovingAvatar ? 'Removing...' : 'Remove Photo'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Student Details Section */}
      <div className="glass-card dark:glass-card-dark rounded-[24px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-slate-200">Account Information</h2>
          <button
            onClick={onEditProfileOpen}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-[#1D1D1F] dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 inline mr-1" />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailRow label="Student Name" value={getDisplayValue(profile?.full_name)} icon={<User className="w-4 h-4 text-[#86868B]" />} />
          <DetailRow label="Email" value={getDisplayValue(profile?.email || userEmail)} icon={<Mail className="w-4 h-4 text-[#86868B]" />} />
          <DetailRow label="Phone Number" value={getDisplayValue(profile?.phone)} icon={<Phone className="w-4 h-4 text-[#86868B]" />} />
          <DetailRow label="Institution" value={getDisplayValue(institutionName)} icon={<Building2 className="w-4 h-4 text-[#86868B]" />} />
          <DetailRow label="Department" value={getDisplayValue(profile?.department)} icon={<GraduationCap className="w-4 h-4 text-[#86868B]" />} />
          <DetailRow label="Programme" value={getDisplayValue(profile?.programme)} icon={<GraduationCap className="w-4 h-4 text-[#86868B]" />} />
          <DetailRow label="Semester" value={getDisplayValue(profile?.semester)} icon={<CalendarIcon className="w-4 h-4 text-[#86868B]" />} />
          <DetailRow label="Campus Block" value={getDisplayValue(profile?.campus_block)} icon={<MapPin className="w-4 h-4 text-[#86868B]" />} />
          <DetailRow label="Registration Number" value={getDisplayValue(profile?.designation)} icon={<Hash className="w-4 h-4 text-[#86868B]" />} />
          <DetailRow label="Student ID" value={getDisplayValue(profile?.user_id?.slice(-6).toUpperCase())} icon={<Shield className="w-4 h-4 text-[#86868B]" />} />
        </div>
      </div>

      {/* Diet Preference */}
      <div className="glass-card dark:glass-card-dark rounded-[24px] p-6">
        <DietPreferenceSelector />
      </div>

      {/* Saved Delivery Spots */}
      <DeliverySpotsSection
        addresses={userAddresses}
        onAddAddress={onAddAddress}
        onUpdateAddress={onUpdateAddress}
        onDeleteAddress={onDeleteAddress}
        onSetDefaultAddress={onSetDefaultAddress}
        refreshAddresses={refreshAddresses}
        triggerToast={triggerToast}
      />

      {/* Sign Out */}
      <div className="pt-4">
        <button
          onClick={onSignOut}
          className="w-full py-3.5 bg-red-50 dark:bg-red-950/30 text-red-600 font-bold rounded-[16px] text-sm flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors border border-red-200 dark:border-red-900/40"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  const SettingsView = () => (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setActiveView('account')}
          className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] dark:text-[#86868B] dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-[#1D1D1F] dark:text-slate-200">Settings</h2>
      </div>

      <SettingsGroup
        title="ACCOUNT"
        items={[
          { icon: <User className="w-5 h-5" />, label: 'Personal Information', description: 'Name, phone, email' },
          { icon: <Edit3 className="w-5 h-5" />, label: 'Edit Profile', description: 'Update your details', onClick: onEditProfileOpen },
          { icon: <Shield className="w-5 h-5" />, label: 'Change Password', description: 'Update your password' },
          { icon: <Bell className="w-5 h-5" />, label: 'Notification Preferences', description: 'Push, email, SMS' },
        ]}
      />

      <SettingsGroup
        title="ORDERS"
        items={[
          { icon: <HistoryIcon className="w-5 h-5" />, label: 'Order History', description: 'Past orders' },
          { icon: <ActivityIcon className="w-5 h-5" />, label: 'Active Orders', description: 'Currently preparing' },
          { icon: <MapPin className="w-5 h-5" />, label: 'Saved Addresses', description: 'Delivery / pickup spots', count: userAddresses.length },
          { icon: <HeartIconSolid className="w-5 h-5" />, label: 'Favourite Items', description: 'Your saved favourites' },
        ]}
      />

      <SettingsGroup
        title="SUPPORT"
        items={[
          { icon: <HelpCircle className="w-5 h-5" />, label: 'Help Centre', description: 'FAQs and guides' },
          { icon: <MessageCircle className="w-5 h-5" />, label: 'Contact Support', description: 'Chat or email' },
          { icon: <Flag className="w-5 h-5" />, label: 'Report an Issue', description: 'Something not right?' },
        ]}
      />

      <SettingsGroup
        title="LEGAL"
        items={[
          { icon: <FileText className="w-5 h-5" />, label: 'Terms of Service', description: 'Read our terms' },
          { icon: <FileText className="w-5 h-5" />, label: 'Privacy Policy', description: 'Your privacy rights' },
          { icon: <FileText className="w-5 h-5" />, label: 'Refund Policy', description: 'Our guarantee' },
        ]}
      />

      <SettingsGroup
        title="APP"
        items={[
          { icon: <Info className="w-5 h-5" />, label: 'About FOODEXA', description: 'Version and info' },
          { icon: <Globe className="w-5 h-5" />, label: 'App Version', description: 'Latest' },
        ]}
      />

      <div className="pt-4">
        <button
          onClick={onSignOut}
          className="w-full py-3.5 bg-red-50 dark:bg-red-950/30 text-red-600 font-bold rounded-[16px] text-sm flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors border border-red-200 dark:border-red-900/40"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full my-6 max-w-4xl mx-auto space-y-6 px-4">
      {/* View Switcher */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1D1D1F] dark:text-slate-200">
          {activeView === 'account' ? 'My Account' : 'Settings'}
        </h2>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveView('account')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeView === 'account'
                ? 'bg-white dark:bg-slate-900 text-[#1D1D1F] dark:text-slate-200 shadow-sm'
                : 'text-[#86868B] dark:text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-slate-300'
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveView('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeView === 'settings'
                ? 'bg-white dark:bg-slate-900 text-[#1D1D1F] dark:text-slate-200 shadow-sm'
                : 'text-[#86868B] dark:text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-slate-300'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeView === 'account' ? <AccountView /> : <SettingsView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const DetailRow = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="flex items-center gap-3 py-2.5">
    {icon}
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-[#86868B] dark:text-[#86868B] uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-[#1D1D1F] dark:text-slate-200 mt-0.5 truncate">{value}</p>
    </div>
  </div>
);

const CalendarIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const HistoryIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
const ActivityIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3-3v6l5-3z" /><path d="M14 5l4 7-4 7" /><path d="M6 18h12" /></svg>;
const HeartIconSolid = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.16-.47C6.25 18.87 2 15.3 2 8.5 2 5.42 4.42 3 7.5 3c2.33 0 4.31 1.47 5 3.59C13.19 4.48 15.17 3 17.5 3 20.58 3 23 5.42 23 8.5c0 6.8-4.25 10.37-8.84 12.38L12 21.35z" /></svg>;

interface SettingsGroupProps {
  title: string;
  items: Array<{
    icon: React.ReactNode;
    label: string;
    description?: string;
    onClick?: () => void;
    count?: number;
  }>;
}

const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, items }) => (
  <div className="glass-card dark:glass-card-dark rounded-[24px] p-4">
    <p className="text-[10px] font-bold text-[#86868B] dark:text-[#86868B] uppercase tracking-widest mb-3">{title}</p>
    <div className="space-y-1">
      {items.map((item, idx) => (
        <button
          key={idx}
          onClick={item.onClick}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="text-[#6E6E73] dark:text-[#86868B] shrink-0">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1D1D1F] dark:text-slate-200">{item.label}</p>
              {item.count !== undefined && item.count > 0 && (
                <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-[#1D1D1F] dark:text-slate-300 rounded-full text-[10px] font-bold">
                  {item.count}
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-[11px] text-[#86868B] dark:text-[#86868B] mt-0.5">{item.description}</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-[#6E6E73] shrink-0" />
        </button>
      ))}
    </div>
  </div>
);

// ── Delivery Spots Section ──
interface DeliverySpotsProps {
  addresses: UserAddress[];
  onAddAddress: (label: string, address: string, isDefault: boolean) => Promise<void>;
  onUpdateAddress: (id: string, label: string, address: string, isDefault: boolean) => Promise<void>;
  onDeleteAddress: (id: string) => Promise<void>;
  onSetDefaultAddress: (id: string) => Promise<void>;
  refreshAddresses: () => Promise<void>;
  triggerToast?: (title: string, description: string, type?: 'success' | 'warning' | 'info' | 'ai' | 'error') => void;
}

const DeliverySpotsSection: React.FC<DeliverySpotsProps> = ({
  addresses,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  refreshAddresses,
  triggerToast,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSettingDefault, setIsSettingDefault] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingAddress(null);
    setShowModal(true);
  };

  const handleEdit = (address: UserAddress) => {
    setEditingAddress(address);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await onDeleteAddress(id);
      triggerToast?.('Deleted', 'Delivery spot removed', 'success');
    } catch (err: any) {
      triggerToast?.('Error', err?.message || 'Failed to delete address', 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setIsSettingDefault(id);
    try {
      await onSetDefaultAddress(id);
      triggerToast?.('Updated', 'Default address set', 'success');
    } catch (err: any) {
      triggerToast?.('Error', err?.message || 'Failed to set default', 'error');
    } finally {
      setIsSettingDefault(null);
    }
  };

  return (
    <>
      <div className="glass-card dark:glass-card-dark rounded-[24px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-slate-200">Saved Delivery / Pickup Spots</h2>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Spot
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="w-10 h-10 text-slate-300 dark:text-[#6E6E73] mx-auto mb-3" />
            <p className="text-sm text-[#86868B] dark:text-[#86868B]">No saved spots yet.</p>
            <p className="text-xs text-[#86868B] dark:text-[#86868B] mt-1">Add a delivery or pickup spot to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-[16px] border border-slate-200 dark:border-slate-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-[#1D1D1F] dark:text-slate-200 truncate">{address.label}</p>
                    {address.is_default && (
                      <span className="px-1.5 py-0.25 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#86868B] dark:text-[#86868B] mt-0.5 line-clamp-1">{address.address}</p>
                </div>

                <div className="flex items-center gap-1 ml-2">
                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      disabled={isSettingDefault === address.id}
                      className="p-1.5 text-[#86868B] hover:text-blue-600 dark:text-[#86868B] dark:hover:text-blue-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Set as default"
                    >
                      <StarIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(address)}
                    disabled={isDeleting === address.id}
                    className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] dark:text-[#86868B] dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    disabled={isDeleting === address.id}
                    className="p-1.5 text-[#86868B] hover:text-red-600 dark:text-[#86868B] dark:hover:text-red-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Delete"
                  >
                    {isDeleting === address.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Address Modal */}
      <DeliverySpotModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
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
    </>
  );
};

const StarIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 11 22 11 17 17 20 26 12 21 4 26 7 17 2 11 9 11" /></svg>;

interface DeliverySpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAddress: UserAddress | null;
  onSave: (label: string, address: string, isDefault: boolean) => Promise<void>;
}

const DeliverySpotModal: React.FC<DeliverySpotModalProps> = ({ isOpen, onClose, editingAddress, onSave }) => {
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true);
    try {
      await onSave(label.trim(), address.trim(), isDefault);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-[24px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-black text-[#1D1D1F] dark:text-slate-200">
            {editingAddress ? 'Edit Delivery Spot' : 'Add New Spot'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] dark:text-[#86868B] dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-[#86868B] dark:text-[#86868B] uppercase tracking-wider mb-1 block">
              Spot Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Dorm Room, Library, Gym"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-[#1D1D1F] dark:text-slate-200 placeholder-slate-400 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#86868B] dark:text-[#86868B] uppercase tracking-wider mb-1 block">
              Address / Location
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter the full address or pickup location details"
              rows={3}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-[#1D1D1F] dark:text-slate-200 placeholder-slate-400 focus:border-blue-500 outline-none resize-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <label className="text-sm font-medium text-[#1D1D1F] dark:text-slate-300 cursor-pointer">
              Set as default
            </label>
            <button
              onClick={() => setIsDefault(!isDefault)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isDefault ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDefault ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[#1D1D1F] dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !label.trim() || !address.trim()}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
