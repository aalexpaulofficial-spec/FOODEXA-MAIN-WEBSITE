import React from 'react';
import { QrCode, Smartphone, ScanLine, ArrowRight } from 'lucide-react';

export const QrPickupSection: React.FC = () => {
  return (
    <section className="py-24 bg-slate-950 relative border-t border-slate-900 overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
            <div className="relative w-full max-w-sm">
              {/* Phone Mockup */}
              <div className="bg-slate-900 border-[8px] border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl relative z-10">
                <div className="bg-slate-950 p-6 pt-12 space-y-6 min-h-[500px] flex flex-col items-center">
                  
                  <div className="text-center space-y-2">
                    <h4 className="text-white font-bold text-lg">Order Ready!</h4>
                    <p className="text-slate-400 text-xs">Scan at Counter 3 to pickup</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-3xl w-48 h-48 flex items-center justify-center shadow-lg shadow-emerald-500/20 relative group">
                    <QrCode className="w-full h-full text-slate-950" />
                    
                    {/* Scanning Line Animation */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                  </div>
                  
                  <div className="bg-slate-900 w-full rounded-2xl p-4 border border-slate-800 space-y-2 text-center">
                    <div className="text-xs text-slate-400">Order Number</div>
                    <div className="text-2xl font-bold text-white font-mono tracking-widest">#9284</div>
                  </div>
                  
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -right-8 top-20 bg-slate-800/80 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-xl z-20 flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                <ScanLine className="w-5 h-5 text-emerald-400" />
                <div className="text-xs font-bold text-white">Verified!</div>
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2 space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-400 font-mono">
              <QrCode className="w-3.5 h-3.5" />
              <span>Contactless Pickup</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
              Zero lines. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Instant pickup.</span>
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              When your order is ready, you'll receive a secure QR token. Simply scan it at the canteen counter or smart locker pod. Institution staff instantly verify the order via the FOODEXA scanner app, ensuring the right food goes to the right person, every time.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <Smartphone className="w-6 h-6 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Student App</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Generates a unique, time-sensitive QR code the moment food is marked ready.</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <ScanLine className="w-6 h-6 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Vendor Scanner</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Vendors scan the code to instantly verify payment and clear the ticket from the KDS.</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};
