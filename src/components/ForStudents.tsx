import React, { useState } from 'react';
import { Sparkles, Clock, DollarSign, Heart, Award, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface ForStudentsProps {
  onOpenLxDrawer: () => void;
}

export const ForStudents: React.FC<ForStudentsProps> = ({ onOpenLxDrawer }) => {
  // Calculator state
  const [lunchesPerWeek, setLunchesPerWeek] = useState<number>(5);
  const [avgWaitMins, setAvgWaitMins] = useState<number>(20);

  // Calculations
  const hoursSavedPerSemester = Math.round((lunchesPerWeek * avgWaitMins * 16) / 60);
  const estimatedDollarsSaved = Math.round(lunchesPerWeek * 16 * 2.8); // $2.80 avg saving per meal via deals & points

  return (
    <section id="students" className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
            <Heart className="w-3.5 h-3.5 text-emerald-400" />
            <span>Built for Student Life</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Eat Smarter, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Save Hours</span> & Skip Every Line
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            FOODEXA is 100% free for students. Get personalized meal ideas from LX, pay with your campus card or meal plan, and pick up your food between classes in under 60 seconds.
          </p>
        </div>

        {/* 3 Student Pillar Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/50 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Express Class Pickup</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Order while walking out of lecture. LX calculates your walk time so your food is hot and waiting the second you step into the food court or locker hub.
              </p>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
              <span className="font-mono text-emerald-400">Avg Prep Wait:</span>
              <span className="font-bold text-white">2.5 Minutes</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/50 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Meal Plan & Campus Card Sync</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pay with your University ID card, meal plan swipes, flex dollars, Venmo, or Apple Pay. Earn FOODEXA Perk points on every campus order.
              </p>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
              <span className="font-mono text-indigo-400">Supported:</span>
              <span className="font-bold text-white">CBORD, Transact, TouchNet</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/50 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-950/80 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Dorm Group Carts</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Order late-night pizza, boba, or ramen with your roommates. FOODEXA splits the bill automatically and pools your delivery to the dorm lobby.
              </p>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
              <span className="font-mono text-teal-400">Split Feature:</span>
              <span className="font-bold text-white">Zero Extra Fees</span>
            </div>
          </div>

        </div>

        {/* Interactive Student Savings Calculator */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Controls Left */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive Student Calculator</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                How Much Time & Money Will You Save This Semester?
              </h3>

              {/* Slider 1 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-300">
                  <span>Campus Lunches / Dinners per Week:</span>
                  <span className="text-emerald-400 font-mono font-bold text-base">{lunchesPerWeek} meals</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={14}
                  value={lunchesPerWeek}
                  onChange={(e) => setLunchesPerWeek(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
                />
              </div>

              {/* Slider 2 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-300">
                  <span>Current Average Line Wait Time:</span>
                  <span className="text-emerald-400 font-mono font-bold text-base">{avgWaitMins} mins / order</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={5}
                  value={avgWaitMins}
                  onChange={(e) => setAvgWaitMins(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
                />
              </div>

              <p className="text-xs text-slate-400 italic">
                * Calculated based on a standard 16-week academic semester and FOODEXA average meal deal savings.
              </p>
            </div>

            {/* Results Display Right */}
            <div className="lg:col-span-6 bg-slate-950 rounded-2xl p-6 sm:p-8 border border-slate-800 text-center space-y-6">
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                YOUR SEMESTER SAVINGS WITH FOODEXA
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/30">
                  <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 font-mono">
                    {hoursSavedPerSemester} hrs
                  </div>
                  <div className="text-xs text-slate-300 font-medium mt-1">Study / Free Time Reclaimed</div>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-indigo-500/30">
                  <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300 font-mono">
                    ${estimatedDollarsSaved}
                  </div>
                  <div className="text-xs text-slate-300 font-medium mt-1">Estimated Meal Savings</div>
                </div>
              </div>

              <button
                onClick={onOpenLxDrawer}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Ask LX to Find Deals on Your Campus</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
