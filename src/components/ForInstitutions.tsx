import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface ForInstitutionsProps {
  onOpenRegisterInstitution: () => void;
}

export const ForInstitutions: React.FC<ForInstitutionsProps> = ({ onOpenRegisterInstitution }) => {
  return (
    <section id="institutions" className="py-24 md:py-32 bg-[#f7f7f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Mockup */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-100/60 via-indigo-100/40 to-blue-100/30 scale-105 blur-2xl"></div>
            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-3 text-xs text-gray-400 font-mono">foodexa.app / admin-dashboard</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Active Students', value: '4,218' },
                  { label: 'Today\'s Revenue', value: '₹89,400' },
                  { label: 'Avg Wait Time', value: '7 min' },
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="text-lg font-bold text-black">{stat.value}</div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                {['Central Canteen — 142 orders', 'South Block Cafe — 89 orders', 'Library Kiosk — 47 orders'].map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <span className="text-xs text-gray-600">{item}</span>
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Text */}
          <div className="max-w-lg order-1 lg:order-2">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-black leading-tight mb-6">
              Complete campus control from one dashboard
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Universities get a full operating system for campus dining: manage canteens, track revenue, monitor kitchen performance, and onboard vendors — all in real time.
            </p>
            <ul className="space-y-3 mb-8">
              {['Multi-canteen management', 'Revenue & analytics dashboards', 'Vendor onboarding & kitchen tracking', 'Student satisfaction metrics'].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                  </span>
                  <span className="text-gray-600 text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <button onClick={onOpenRegisterInstitution} className="btn-primary flex items-center gap-2 cursor-pointer">
              Register Your Institution <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};