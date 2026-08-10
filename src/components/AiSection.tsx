import React from 'react';

interface AiSectionProps {
  onOpenLxDrawer: () => void;
}

export const AiSection: React.FC<AiSectionProps> = ({ onOpenLxDrawer }) => {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Mockup */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-100/60 via-violet-100/40 to-blue-100/30 scale-105 blur-2xl"></div>
            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-3 text-xs text-gray-400 font-mono">LX AI Assistant</span>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs shrink-0">🎤</div>
                    <div className="bg-white rounded-lg px-3 py-2 text-sm text-gray-700 border border-gray-100">
                      "What's low calorie and available right now?"
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-xs shrink-0">LX</div>
                    <div className="bg-white rounded-lg px-3 py-2 text-sm text-gray-700 border border-gray-100">
                      I found 3 options under 400 cal at Central Canteen: Grilled Paneer Wrap (320 cal), Garden Salad Bowl (180 cal), and Fresh Fruit Smoothie (210 cal). Want me to order one?
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  <span>Thought for 2s</span>
                  <span className="text-gray-300">·</span>
                  <span>Analyzed 3 menus</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Text */}
          <div className="max-w-lg order-1 lg:order-2">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-black leading-tight mb-6">
              LX AI understands campus food
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Ask LX anything — dietary filters, allergen checks, menu recommendations, or just say "order my usual." It works with voice or text, powered by Google Gemini.
            </p>
            <button onClick={onOpenLxDrawer} className="btn-primary flex items-center gap-2 cursor-pointer">
              Try LX AI →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
