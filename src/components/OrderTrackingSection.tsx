import React from 'react';
import { CheckCircle2, PackageCheck, Flame, Utensils, QrCode } from 'lucide-react';
import { orderTimelineData } from '../lib/orderTimeline';

export const OrderTrackingSection: React.FC = () => {
  return (
    <section className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Supabase Realtime Sync</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Live Order Tracking. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Down to the second.</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Order status updates are synchronized instantly between the kitchen display system (KDS) and the student's app. Staff only receive tickets after successful payment.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
            
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-6 left-10 right-10 h-1 bg-slate-800 rounded-full z-0">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[60%]" />
            </div>

            {/* Steps */}
            {[
              { label: 'Payment', icon: CheckCircle2, status: 'done' },
              { label: 'Accepted', icon: PackageCheck, status: 'done' },
              { label: 'Preparing', icon: Flame, status: 'active' },
              { label: 'Ready', icon: Utensils, status: 'pending' },
              { label: 'QR Pickup', icon: QrCode, status: 'pending' }
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative z-10 flex flex-row md:flex-col items-center gap-4 md:gap-3 w-full md:w-auto">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${
                    step.status === 'done' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
                    step.status === 'active' ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/40 scale-110' :
                    'bg-slate-900 border-slate-700 text-slate-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="md:text-center">
                    <div className={`text-sm font-bold ${step.status === 'active' ? 'text-white' : 'text-slate-400'}`}>{step.label}</div>
                    {step.status === 'active' && (
                      <div className="text-[10px] text-emerald-400 font-mono mt-1 animate-pulse">In Kitchen...</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-12 bg-slate-950 rounded-2xl border border-slate-800 p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden">
                <div className="text-2xl">🍔</div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Classic Cheeseburger Meal</h4>
                <p className="text-xs text-slate-400">Order #FX-9284 • Main Cafeteria</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Estimated Ready</div>
              <div className="text-lg font-bold text-white font-mono">12:45 PM</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
