import React from 'react';
import { X, Smartphone, Monitor, Globe, Sparkles, Download, CheckCircle2, ShieldCheck } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const platforms = [
    {
      name: 'Android App',
      category: 'Mobile App',
      status: 'Coming Soon',
      badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
      icon: Smartphone,
      description: 'Official Google Play Store release for Android devices.',
    },
    {
      name: 'iOS App',
      category: 'Mobile App',
      status: 'Coming Soon',
      badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
      icon: Smartphone,
      description: 'Native Apple App Store release for iPhone & iPad.',
    },
    {
      name: 'Windows App',
      category: 'Desktop Client',
      status: 'Coming Soon',
      badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
      icon: Monitor,
      description: 'KDS & Admin terminal application for Windows PCs.',
    },
    {
      name: 'macOS App',
      category: 'Desktop Client',
      status: 'Coming Soon',
      badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
      icon: Monitor,
      description: 'Native Mac desktop companion for university admins & canteens.',
    },
    {
      name: 'PWA Web App',
      category: 'Progressive Web App',
      status: 'Available Soon',
      badgeColor: 'bg-emerald-950/90 text-emerald-300 border-emerald-600/80',
      icon: Globe,
      description: 'Instant zero-install web app for all mobile browsers & campus tablets.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono">
            <Download className="w-3.5 h-3.5" />
            <span>Cross-Platform Ecosystem</span>
          </div>
          <h3 className="text-2xl font-extrabold text-white">Download Foodexa App</h3>
          <p className="text-xs text-slate-300">
            Access Foodexa across all mobile, tablet, desktop, and web environments.
          </p>
        </div>

        {/* Premium Illustration Graphic */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-4 text-center space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
              FX
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400">
              <Monitor className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-300 font-medium">
            Foodexa App for Students, Canteens & University Admins
          </p>
        </div>

        {/* Platform List */}
        <div className="space-y-2.5">
          {platforms.map((platform, idx) => {
            const Icon = platform.icon;
            return (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      {platform.name}
                      <span className="text-[10px] text-slate-500 font-mono font-normal">
                        ({platform.category})
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{platform.description}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-full border font-semibold shrink-0 ${platform.badgeColor}`}
                >
                  {platform.status}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          Close
        </button>

      </div>
    </div>
  );
};
