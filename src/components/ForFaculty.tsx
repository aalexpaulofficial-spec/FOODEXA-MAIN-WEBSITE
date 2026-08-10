import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface ForFacultyProps {
  onOpenCreateAccount: () => void;
}

export const ForFaculty: React.FC<ForFacultyProps> = ({ onOpenCreateAccount }) => {
  return (
    <section className="py-24 md:py-32 bg-[#f7f7f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Mockup first on desktop, reversed */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-100/60 via-orange-100/40 to-rose-100/30 scale-105 blur-2xl"></div>
            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-3 text-xs text-gray-400 font-mono">foodexa.app / faculty</span>
              </div>
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <div className="text-sm font-medium text-gray-800 mb-1">Priority Queue Active</div>
                  <div className="text-xs text-amber-700">Your order moves to the front of the line.</div>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">Department Billing</span>
                    <span className="text-xs text-gray-500 font-mono">CSE Dept</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '62%' }}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">₹18,400 / ₹30,000 monthly budget used</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Text */}
          <div className="max-w-lg order-1 lg:order-2">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-black leading-tight mb-6">
              Designed for faculty convenience
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Priority pickup queues, department-linked billing, and dietary preferences that follow you across every campus canteen.
            </p>
            <button onClick={onOpenCreateAccount} className="btn-primary flex items-center gap-2 cursor-pointer">
              Create Faculty Account <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
