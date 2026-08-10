import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface ForStudentsProps {
  onOpenCreateAccount: () => void;
}

export const ForStudents: React.FC<ForStudentsProps> = ({ onOpenCreateAccount }) => {
  return (
    <section id="students" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Text */}
          <div className="max-w-lg">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-black leading-tight mb-6">
              Built for the student lifestyle
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Order between classes, skip the queue, and pick up with a single QR scan. FOODEXA fits into the 10-minute break you actually have.
            </p>
            <ul className="space-y-4 mb-8">
              {['Browse live menus from every canteen', 'Voice-order through LX AI assistant', 'Track prep status in real time', 'Instant QR code pickup — no waiting'].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  </span>
                  <span className="text-gray-600 text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <button onClick={onOpenCreateAccount} className="btn-primary flex items-center gap-2 cursor-pointer">
              Create Student Account <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Mockup */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100/60 via-purple-100/40 to-pink-100/30 scale-105 blur-2xl"></div>
            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-3 text-xs text-gray-400 font-mono">foodexa.app / my-orders</span>
              </div>
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-800">Chicken Biryani</div>
                    <div className="text-xs text-green-600 font-medium">Ready for Pickup · Counter B</div>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-lg">📱</span>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-800">Masala Dosa</div>
                    <div className="text-xs text-blue-600 font-medium">Preparing · Est. 6 min</div>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-lg">🔥</span>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-800">Cold Coffee</div>
                    <div className="text-xs text-gray-500 font-medium">Completed · 2h ago</div>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-lg">✅</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};