import React from 'react';

export const QrPickupSection: React.FC = () => {
  return (
    <section className="py-24 md:py-32 bg-[#f7f7f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Text */}
          <div className="max-w-lg">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-black leading-tight mb-6">
              Contactless pickup with QR
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              When your food is ready, your app generates a secure one-time QR code. The counter staff scans it, you grab your meal, and the order closes automatically.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>Zero queues</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span>Zero confusion</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span>Zero contact</span>
            </div>
          </div>
          
          {/* QR Mockup */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-green-100/60 via-emerald-100/40 to-teal-100/30 scale-105 blur-2xl"></div>
            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg p-8 flex flex-col items-center">
              <div className="w-40 h-40 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center mb-6">
                <div className="grid grid-cols-5 gap-1">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={`w-5 h-5 rounded-sm ${[0,1,4,5,9,10,14,15,19,20,24,2,3,6,8,12,16,18,21,23].includes(i) ? 'bg-black' : 'bg-white'}`}></div>
                  ))}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-800 mb-1">Order #FDX-4821</div>
              <div className="text-xs text-green-600 font-medium">✓ Verified · Counter B</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
