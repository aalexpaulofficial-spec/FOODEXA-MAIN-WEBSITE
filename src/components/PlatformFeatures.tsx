import React, { useState } from 'react';
import { Sparkles, Zap, Users, ShieldCheck, LayoutGrid, CheckCircle2, ArrowRight } from 'lucide-react';
import { PLATFORM_FEATURES } from '../data/foodexaData';

interface PlatformFeaturesProps {
  onOpenBookDemo: () => void;
  onOpenLxDrawer: () => void;
}

export const PlatformFeatures: React.FC<PlatformFeaturesProps> = ({ onOpenBookDemo, onOpenLxDrawer }) => {
  const [selectedFeatureId, setSelectedFeatureId] = useState(PLATFORM_FEATURES[0].id);

  const selectedFeature = PLATFORM_FEATURES.find((f) => f.id === selectedFeatureId) || PLATFORM_FEATURES[0];

  return (
    <section id="platform" className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Integrated Campus Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Speed, Intelligence & Scale</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            From LX AI meal recommendations to temperature-controlled smart lockers, FOODEXA unifies students, university food vendors, and campus dining halls into one seamless platform.
          </p>
        </div>

        {/* Feature Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-10">
          {PLATFORM_FEATURES.map((feat) => {
            const isSelected = feat.id === selectedFeatureId;
            return (
              <button
                key={feat.id}
                onClick={() => setSelectedFeatureId(feat.id)}
                className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {feat.badge}
                  </span>
                </div>
                <div>
                  <h4 className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {feat.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{feat.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Feature Showcase Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 lg:p-10 shadow-2xl backdrop-blur-xl">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Feature Description Left */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-xs font-mono text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{selectedFeature.subtitle}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                {selectedFeature.title}
              </h3>

              <p className="text-slate-300 text-sm leading-relaxed">
                {selectedFeature.description}
              </p>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Key Capabilities</h4>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {selectedFeature.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-300">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                {selectedFeature.id === 'feat-1' ? (
                  <button
                    onClick={onOpenLxDrawer}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Try LX Assistant</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenBookDemo}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center gap-2"
                  >
                    <span>Request Feature Demo</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>
                )}
              </div>
            </div>

            {/* Feature Visual Card Right */}
            <div className="lg:col-span-6">
              <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-inner relative overflow-hidden space-y-4">
                
                {/* Visual Graphic Representation */}
                {selectedFeature.graphicType === 'lx_ai' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">LX Assistant Core Engine</span>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                        Gemini AI Backend
                      </span>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="text-[11px] text-slate-400 font-mono">INPUT: "High protein meal under $8 near Science Hall"</div>
                      <div className="bg-emerald-950/60 p-3 rounded-lg border border-emerald-500/30 text-xs text-emerald-200">
                        ✨ <strong>LX Query Match:</strong> Grilled Quinoa Bowl @ Science Quad Bistro ($7.80, 42g Protein, 3 min prep wait time). Express pickup route assigned to Locker Pod #2.
                      </div>
                    </div>
                  </div>
                )}

                {selectedFeature.graphicType === 'app_mock' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white">Express Queue Jump Ticket</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded-full">
                        Skip 20 Min Wait
                      </span>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-center">
                      <div className="text-2xl font-black font-mono text-emerald-400">PICKUP CODE: #782</div>
                      <p className="text-xs text-slate-300">Walk up to FOODEXA Express Counter • Main Cafeteria</p>
                      <div className="w-full bg-emerald-500/20 text-emerald-300 text-xs py-2 rounded-lg font-mono">
                        Status: Kitchen Finished Prep
                      </div>
                    </div>
                  </div>
                )}

                {selectedFeature.graphicType === 'group_cart' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white">Dorm Room Group Cart #EXA-441</span>
                      <span className="text-[10px] bg-indigo-950 text-indigo-300 font-mono px-2 py-0.5 rounded-full">
                        3 Members Joined
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span>Alex (Dorm 402) • Pepperoni Pizza</span>
                        <span className="font-mono text-emerald-400">$11.50</span>
                      </div>
                      <div className="flex justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span>Sarah (Dorm 402) • Garlic Knots & Soda</span>
                        <span className="font-mono text-emerald-400">$6.25</span>
                      </div>
                      <div className="flex justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span>Leo (Dorm 402) • Caesar Salad</span>
                        <span className="font-mono text-emerald-400">$8.00</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedFeature.graphicType === 'locker' && (
                  <div className="space-y-3 text-center p-2">
                    <div className="inline-flex p-3 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Dual-Zone Climate Locker Station</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Maintains hot meals at 140°F and iced beverages/salads at 38°F with automated UV-C sterilization.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2">
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-orange-400">
                        Heated Slot #12 (142°F)
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-cyan-400">
                        Cooled Slot #05 (37°F)
                      </div>
                    </div>
                  </div>
                )}

                {selectedFeature.graphicType === 'kds' && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                      <span>Kitchen KDS Terminal</span>
                      <span className="text-emerald-400">LX Auto Sorted</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-900 p-3 rounded-xl border border-emerald-500/40 space-y-1">
                        <div className="text-[10px] text-emerald-400 font-mono">ORDER #104 • 1.5 MINS</div>
                        <div className="font-bold text-white">2x Vegan Ramen</div>
                        <div className="text-[10px] text-slate-400">No scallions</div>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-400 font-mono">ORDER #105 • 3.0 MINS</div>
                        <div className="font-bold text-white">1x Spicy Chicken Wrap</div>
                        <div className="text-[10px] text-slate-400">Extra sauce</div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
