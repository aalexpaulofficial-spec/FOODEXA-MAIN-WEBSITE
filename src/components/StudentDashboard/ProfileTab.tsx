import React, { useState } from 'react';
import {
  Building2, MapPin, LogOut, User, Mail, Phone, Shield,
  ChevronRight, FileText, Coffee, Clock, Calendar,
  GraduationCap, Hash, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Profile, InstitutionData, Canteen } from '../../types';

interface ProfileTabProps {
  profile: Profile | null;
  userEmail?: string | null;
  institutionData: InstitutionData | null;
  institutionName: string;
  canteens: Canteen[];
  activeCanteenName?: string | null;
  isVisitor?: boolean;
  onSignOut: () => void;
  onSwitchCanteen?: () => void;
  onSwitchInstitution?: () => void;
  triggerToast?: (title: string, description: string, type?: 'success' | 'warning' | 'info' | 'ai' | 'error') => void;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name && name.trim()) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
  return (email?.[0] || 'S').toUpperCase();
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  userEmail,
  institutionData,
  institutionName,
  canteens,
  activeCanteenName,
  isVisitor,
  onSignOut,
  onSwitchCanteen,
  onSwitchInstitution,
  triggerToast,
}) => {
  const [showCanteenPicker, setShowCanteenPicker] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const displayName = profile?.full_name || (isVisitor ? 'Visitor' : 'Student');
  const displayEmail = profile?.email || userEmail || '';
  const displayInstitution = institutionData?.institution_name || '';
  const displayCampus = institutionData?.campus || '';
  const displayCity = institutionData?.city || '';

  const accountCreated = profile?.created_at || '';

  const hasValue = (val: string | null | undefined): boolean => {
    return !!val && val.trim().length > 0;
  };

  const detailRows: Array<{ label: string; value: string; icon: React.ReactNode }> = [
    ...(hasValue(profile?.full_name) ? [{ label: 'Student Name', value: profile!.full_name!, icon: <User className="w-4 h-4" /> }] : []),
    ...(!isVisitor && hasValue(displayEmail) ? [{ label: 'Email', value: displayEmail, icon: <Mail className="w-4 h-4" /> }] : []),
    ...(hasValue(profile?.phone) ? [{ label: 'Phone', value: profile!.phone!, icon: <Phone className="w-4 h-4" /> }] : []),
    ...(hasValue(displayInstitution) ? [{ label: 'Institution', value: displayInstitution, icon: <Building2 className="w-4 h-4" /> }] : []),
    ...(hasValue(profile?.department) ? [{ label: 'Department', value: profile!.department!, icon: <GraduationCap className="w-4 h-4" /> }] : []),
    ...(hasValue(profile?.programme) ? [{ label: 'Programme', value: profile!.programme!, icon: <GraduationCap className="w-4 h-4" /> }] : []),
    ...(hasValue(profile?.semester) ? [{ label: 'Semester', value: profile!.semester!, icon: <Calendar className="w-4 h-4" /> }] : []),
    ...(hasValue(profile?.campus_block) ? [{ label: 'Campus', value: profile!.campus_block!, icon: <MapPin className="w-4 h-4" /> }] : []),
    ...(!isVisitor && hasValue(profile?.designation) ? [{ label: 'Registration No.', value: profile!.designation!, icon: <Hash className="w-4 h-4" /> }] : []),
    ...(!isVisitor && hasValue(profile?.user_id) ? [{ label: 'Student ID', value: profile!.user_id.slice(-6).toUpperCase(), icon: <Shield className="w-4 h-4" /> }] : []),
    ...(!isVisitor && hasValue(accountCreated) ? [{ label: 'Account Created', value: formatDate(accountCreated), icon: <Clock className="w-4 h-4" /> }] : []),
  ];

  return (
    <div className="w-full my-6 max-w-2xl mx-auto space-y-6 px-4 pb-28 lg:pb-8">
      <AnimatePresence mode="wait">
        <motion.div
          key="profile"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* ── PROFILE HEADER ── */}
          <div className="glass-card dark:glass-card-dark rounded-[24px] p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-200 dark:ring-slate-600 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#1D1D1F] dark:bg-slate-100 flex items-center justify-center text-2xl font-black text-white dark:text-[#1D1D1F] shadow-lg ring-4 ring-slate-200 dark:ring-slate-600">
                  {getInitials(profile?.full_name, profile?.email || userEmail)}
                </div>
              )}
              <div className="text-center space-y-1">
                <h1 className="text-xl font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                  {displayName}
                </h1>
                <p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6] font-medium">
                  {displayEmail}
                </p>
                {(displayInstitution || displayCampus) && (
                  <p className="text-xs text-[#86868B] dark:text-[#86868B] font-medium">
                    {[displayInstitution, displayCampus || displayCity].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── ACCOUNT INFORMATION ── */}
          <div className="glass-card dark:glass-card-dark rounded-[24px] p-6">
            <h2 className="text-[11px] font-bold text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest mb-4">
              Account Information
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {detailRows.map((row) => (
                <div key={row.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="text-[#86868B] dark:text-[#86868B] shrink-0">{row.icon}</span>
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-wider shrink-0">
                      {row.label}
                    </span>
                    <span className="text-sm font-medium text-[#1D1D1F] dark:text-white text-right truncate">
                      {row.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── FOODEXA PLAN ── */}
          <div className="glass-card dark:glass-card-dark rounded-[24px] p-6">
            <h2 className="text-[11px] font-bold text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-widest mb-3">
              FOODEXA Plan
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-[#30D158]/10 dark:bg-[#30D158]/15 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#30D158]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1D1D1F] dark:text-white">Free</p>
                  <p className="text-xs text-[#86868B] dark:text-[#86868B]">&#8377;0 &middot; 1 Month</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#30D158]/10 text-[#30D158] text-[10px] font-bold rounded-full uppercase tracking-wider">
                Active
              </span>
            </div>
          </div>

          {/* ── SWITCH INSTITUTION ── */}
          <button
            onClick={() => onSwitchInstitution?.()}
            className="w-full glass-card dark:glass-card-dark rounded-[24px] p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-[#0071E3]/10 dark:bg-[#0071E3]/15 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#0071E3]" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-[#1D1D1F] dark:text-white">Switch Institution</span>
                {displayInstitution && (
                  <span className="text-[11px] text-[#86868B] dark:text-[#A1A1A6] mt-0.5">Currently: {displayInstitution}</span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#86868B] dark:text-[#86868B] group-hover:text-[#1D1D1F] dark:group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={() => {
              if (onSwitchCanteen) {
                onSwitchCanteen();
              } else {
                setShowCanteenPicker(true);
              }
            }}
            className="w-full glass-card dark:glass-card-dark rounded-[24px] p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-[#0071E3]/10 dark:bg-[#0071E3]/15 flex items-center justify-center">
                <Coffee className="w-5 h-5 text-[#0071E3]" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-[#1D1D1F] dark:text-white">Switch Canteen</span>
                {activeCanteenName && (
                  <span className="text-[11px] text-[#86868B] dark:text-[#A1A1A6] mt-0.5">Currently: {activeCanteenName}</span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#86868B] dark:text-[#86868B] group-hover:text-[#1D1D1F] dark:group-hover:text-white transition-colors" />
          </button>

          {/* ── PRIVACY & POLICY ── */}
          <button
            onClick={() => setShowPrivacy(true)}
            className="w-full glass-card dark:glass-card-dark rounded-[24px] p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#6E6E73] dark:text-[#A1A1A6]" />
              </div>
              <span className="text-sm font-semibold text-[#1D1D1F] dark:text-white">Privacy & Policy</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#86868B] dark:text-[#86868B] group-hover:text-[#1D1D1F] dark:group-hover:text-white transition-colors" />
          </button>

          {/* ── TERMS & SERVICE ── */}
          <button
            onClick={() => setShowTerms(true)}
            className="w-full glass-card dark:glass-card-dark rounded-[24px] p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#6E6E73] dark:text-[#A1A1A6]" />
              </div>
              <span className="text-sm font-semibold text-[#1D1D1F] dark:text-white">Terms & Service</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#86868B] dark:text-[#86868B] group-hover:text-[#1D1D1F] dark:group-hover:text-white transition-colors" />
          </button>

          {/* ── LOG OUT / LEAVE INSTITUTION ── */}
          <button
            onClick={onSignOut}
            className="w-full py-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold rounded-[20px] text-sm flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors border border-red-200/60 dark:border-red-900/40"
          >
            <LogOut className="w-4 h-4" />
            {isVisitor ? 'Leave Institution' : 'Log Out'}
          </button>

          {/* ── SUPPORT ── */}
          <p className="text-center text-xs text-[#86868B] dark:text-[#6E6E73] pt-2 pb-4">
            Support: <a href="mailto:foodexaofficial@gmail.com" className="text-[#0071E3] dark:text-[#2997FF] font-medium hover:underline">foodexaofficial@gmail.com</a>
          </p>
        </motion.div>
      </AnimatePresence>

      {/* ── CANTEEN PICKER MODAL ── */}
      <AnimatePresence>
        {showCanteenPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowCanteenPicker(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-[24px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Switch Canteen</h3>
                <button
                  onClick={() => setShowCanteenPicker(false)}
                  className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  &#x2715;
                </button>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto">
                {canteens.length === 0 ? (
                  <div className="text-center py-10">
                    <Coffee className="w-10 h-10 text-slate-300 dark:text-[#6E6E73] mx-auto mb-3" />
                    <p className="text-sm text-[#86868B] dark:text-[#86868B]">No canteens available for your institution yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {canteens.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          triggerToast?.('Canteen', c.name, 'info');
                          setShowCanteenPicker(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-[16px] text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-[12px] bg-[#0071E3]/10 dark:bg-[#0071E3]/15 flex items-center justify-center shrink-0">
                          <Coffee className="w-5 h-5 text-[#0071E3]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1D1D1F] dark:text-white truncate">{c.name}</p>
                          {c.location && (
                            <p className="text-[11px] text-[#86868B] dark:text-[#86868B] truncate mt-0.5">{c.location}</p>
                          )}
                        </div>
                        {c.is_ordering_enabled && (
                          <span className="px-2 py-0.5 bg-[#30D158]/10 text-[#30D158] text-[10px] font-bold rounded-full shrink-0">
                            Open
                          </span>
                        )}
                        {!c.is_ordering_enabled && (
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[#86868B] text-[10px] font-bold rounded-full shrink-0">
                            Closed
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PRIVACY MODAL ── */}
      <AnimatePresence>
        {showPrivacy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowPrivacy(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-[24px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Privacy Policy</h3>
                <button onClick={() => setShowPrivacy(false)} className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">&#x2715;</button>
              </div>
              <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
                <p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  FOODEXA is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our campus food ordering platform.
                </p>
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">Information We Collect</h4>
                  <p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                    We collect your name, email, phone number, institution details, and order history to provide and improve our campus dining services. We do not sell your personal data to third parties.
                  </p>
                  <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">How We Use Your Information</h4>
                  <p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                    Your information is used to process orders, provide customer support, and improve your campus dining experience. Order data may be shared with your institution&apos;s dining administration for operational purposes.
                  </p>
                  <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">Data Security</h4>
                  <p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                    We implement industry-standard security measures to protect your personal information. Your payment data is processed securely through Razorpay and is never stored on our servers.
                  </p>
                  <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">Contact Us</h4>
                  <p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                    If you have questions about this policy, contact us at{' '}
                    <a href="mailto:foodexaofficial@gmail.com" className="text-[#0071E3] dark:text-[#2997FF] font-medium hover:underline">foodexaofficial@gmail.com</a>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TERMS MODAL ── */}
      <AnimatePresence>
        {showTerms && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowTerms(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-[24px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Terms of Service</h3>
                <button onClick={() => setShowTerms(false)} className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">&#x2715;</button>
              </div>
              <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
                <p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  By using FOODEXA, you agree to the following terms and conditions. Please read them carefully before placing orders on our platform.
                </p>
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">Ordering & Payments</h4>
                  <p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                    All orders placed through FOODEXA are final. Payments are processed securely via Razorpay. FOODEXA acts as an intermediary between you and campus dining providers.
                  </p>
                  <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">User Responsibilities</h4>
                  <p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                    You are responsible for maintaining the confidentiality of your account. You agree to provide accurate information during registration and to only use the platform for lawful purposes.
                  </p>
                  <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">Service Availability</h4>
                  <p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                    FOODEXA reserves the right to modify, suspend, or discontinue any part of the service at any time. Canteen availability and menu items are subject to change without notice.
                  </p>
                  <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">Contact</h4>
                  <p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                    For questions regarding these terms, contact us at{' '}
                    <a href="mailto:foodexaofficial@gmail.com" className="text-[#0071E3] dark:text-[#2997FF] font-medium hover:underline">foodexaofficial@gmail.com</a>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
