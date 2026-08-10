import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface ForGuestsProps {
  onOpenCreateAccount: () => void;
}

export const ForGuests: React.FC<ForGuestsProps> = ({ onOpenCreateAccount }) => {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Text */}
          <div className="max-w-lg">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-black leading-tight mb-6">
              Guests order without an account
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Visitors, parents, and event attendees can scan a QR code at any campus canteen to browse the menu and place an order — no sign-up needed.
            </p>
            <button onClick={onOpenCreateAccount} className="btn-secondary flex items-center gap-2 cursor-pointer">
              Learn more <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Mockup */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-100/60 via-cyan-100/40 to-blue-100/30 scale-105 blur-2xl"></div>
            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-3 text-xs text-gray-400 font-mono">foodexa.app / guest</span>
              </div>
              <div className="flex flex-col items-center py-6 space-y-4">
                <div className="w-24 h-24 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <span className="text-3xl">📷</span>
                </div>
                <p className="text-sm text-gray-500 text-center">Scan any campus QR code to start ordering</p>
                <div className="w-full max-w-xs bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-center">
                  <div className="text-sm font-medium text-green-700">✓ Menu loaded — Central Canteen</div>
                  <div className="text-xs text-green-600 mt-1">12 items available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
