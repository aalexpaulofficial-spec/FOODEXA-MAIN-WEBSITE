import React from 'react';
import { Utensils, QrCode, Zap, Brain } from 'lucide-react';

export const PlatformFeatures: React.FC = () => {
  const features = [
    { icon: Utensils, title: 'Smart Ordering', desc: 'Browse live menus, customize meals, and pay instantly from your phone.' },
    { icon: QrCode, title: 'QR Pickup', desc: 'Skip the line. Show your QR code at the counter for instant collection.' },
    { icon: Zap, title: 'Real-time Tracking', desc: 'Watch your order move from kitchen to counter with live status updates.' },
    { icon: Brain, title: 'LX AI Assistant', desc: 'Voice-order your meals, get recommendations, and manage your diet.' },
  ];

  return (
    <section id="platform" className="py-24 md:py-32 bg-[#f7f7f8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-black mb-4">
            One platform, everything campus food
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Four core capabilities that transform how your campus handles food.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-gray-700" />
              </div>
              <h3 className="text-base font-semibold text-black mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};