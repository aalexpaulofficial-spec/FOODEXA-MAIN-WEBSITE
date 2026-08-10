import React from 'react';
import { Sparkles, Brain, Search, Activity, Heart, ArrowRight } from 'lucide-react';

interface AiSectionProps {
  onOpenLxDrawer: () => void;
}

export const AiSection: React.FC<AiSectionProps> = ({ onOpenLxDrawer }) => {
  return (
    <section className="py-24 bg-slate-950 relative border-t border-slate-900 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-400 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LX AI Integration</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Meet LX. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">The intelligent layer.</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            FOODEXA isn't just an ordering app. It's powered by LX AI to provide personalized meal recommendations, dietary filtering, and demand insights for vendors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center">
              <Search className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Smart Discovery</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Ask LX "What's good for lunch under ₹150?" and get instant, context-aware recommendations from active vendors on campus.
            </p>
          </div>
          
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center">
              <Heart className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Dietary Assistance</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              LX understands your dietary profile. It filters out allergens, suggests high-protein options after gym, and flags ingredients to keep you safe.
            </p>
          </div>
          
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/40 transition-all space-y-4 md:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center">
              <Activity className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Demand Insights</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              For institutions, LX analyzes order patterns to help vendors prepare for exam rushes, optimize inventory, and reduce food waste.
            </p>
          </div>
          
        </div>

        <div className="text-center">
          <button onClick={onOpenLxDrawer} className="px-8 py-4 rounded-2xl bg-slate-900 border border-indigo-500/50 hover:border-indigo-400 text-indigo-300 hover:text-white font-bold text-sm transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 cursor-pointer">
            <Sparkles className="w-5 h-5" />
            <span>Try LX AI Assistant</span>
          </button>
        </div>
        
      </div>
    </section>
  );
};
