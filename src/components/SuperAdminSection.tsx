import React from 'react';

interface SuperAdminSectionProps {
  onOpenLogin: () => void;
}

export const SuperAdminSection: React.FC<SuperAdminSectionProps> = ({ onOpenLogin }) => {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Text */}
          <div className="max-w-lg">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-black leading-tight mb-6">
              Made for always-on platform management
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Super Admins approve institutions, manage global settings, monitor platform-wide analytics, and handle escalations — all from a centralized control plane.
            </p>
            <button onClick={onOpenLogin} className="btn-secondary flex items-center gap-2 cursor-pointer">
              Admin Login →
            </button>
          </div>
          
          {/* Mockup */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-rose-100/40 via-pink-100/30 to-orange-100/40 scale-105 blur-2xl"></div>
            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-3 text-xs text-gray-400 font-mono">foodexa.app / super-admin</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'IIT Madras', status: 'Active', time: '2d ago' },
                  { label: 'BITS Pilani', status: 'Pending Review', time: 'Just now' },
                  { label: 'VIT Vellore', status: 'Active', time: '5d ago' },
                  { label: 'Anna University', status: 'Active', time: '1w ago' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${item.status === 'Active' ? 'bg-green-400' : 'bg-blue-400'}`}></span>
                      <span className="text-sm font-medium text-gray-800">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${item.status === 'Active' ? 'text-green-600' : 'text-blue-600'}`}>{item.status}</span>
                      <span className="text-xs text-gray-400">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
