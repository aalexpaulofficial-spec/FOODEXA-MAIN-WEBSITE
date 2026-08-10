import React from 'react';

export const OrderTrackingSection: React.FC = () => {
  const steps = [
    { emoji: '💳', label: 'Payment Confirmed', status: 'done' },
    { emoji: '🔥', label: 'Preparing', status: 'done' },
    { emoji: '✅', label: 'Ready for Pickup', status: 'active' },
    { emoji: '📱', label: 'QR Scanned', status: 'pending' },
  ];

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-black mb-4">
          Track every order, live
        </h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-16">
          Students and kitchen staff see the same real-time status. Powered by Supabase Realtime.
        </p>
        
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-100/40 via-purple-100/30 to-pink-100/40 scale-105 blur-2xl"></div>
          <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
              {steps.map((step, i) => (
                <React.Fragment key={i}>
                  <div className={`flex flex-col items-center gap-3 ${step.status === 'pending' ? 'opacity-40' : ''}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${step.status === 'active' ? 'bg-green-50 border-2 border-green-200 ring-4 ring-green-50' : 'bg-gray-50 border border-gray-100'}`}>
                      {step.emoji}
                    </div>
                    <span className={`text-xs font-medium ${step.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>{step.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`hidden sm:block w-16 h-px mx-2 ${i < 2 ? 'bg-green-300' : 'bg-gray-200'}`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
