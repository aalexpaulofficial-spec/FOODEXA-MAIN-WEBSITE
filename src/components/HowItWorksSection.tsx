import React from 'react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    { num: '01', title: 'Institution Registers', desc: 'University admin submits campus details. Our team provisions the ecosystem with a unique Institution Code.' },
    { num: '02', title: 'Students & Faculty Join', desc: 'Users create accounts with their institution email and start browsing live canteen menus.' },
    { num: '03', title: 'Order & Pay', desc: 'Place orders via the app or LX voice assistant. Pay with UPI, card, or faculty wallet.' },
    { num: '04', title: 'QR Pickup', desc: 'When the order is ready, scan your QR code at the counter. Done in seconds.' },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#f7f7f8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-black mb-4">
            How it works
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            From campus registration to the first QR pickup — in four simple steps.
          </p>
        </div>
        
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-6 pb-10 relative">
              {/* Vertical line */}
              {i < steps.length - 1 && (
                <div className="absolute left-5 top-12 bottom-0 w-px bg-gray-200"></div>
              )}
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0 relative z-10">
                {step.num}
              </div>
              <div className="pt-1.5">
                <h3 className="text-lg font-semibold text-black mb-1">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
