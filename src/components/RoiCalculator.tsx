import React, { useEffect, useState } from 'react';
import { Calculator, Sparkles, TrendingUp, Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RoiCalculatorProps { onOpenBookDemo: () => void; }

export const RoiCalculator: React.FC<RoiCalculatorProps> = ({ onOpenBookDemo }) => {
  const [studentCount, setStudentCount] = useState<number>(12000);
  const [canteenCount, setCanteenCount] = useState<number>(8);
  const [partnerCount, setPartnerCount] = useState(45);

  useEffect(() => {
    (async () => {
      const { count } = await supabase.from('institutions').select('*', { count: 'exact', head: true }).eq('status', 'active');
      if (count !== null) setPartnerCount(count);
    })().catch(() => {});
  }, []);

  const estimatedAnnualVendorRevenueIncrease = Math.round((studentCount * 38) * (canteenCount / 5));
  const estimatedFoodWasteReducedTons = Math.round((studentCount * 0.0028) * canteenCount);
  const totalStudentHoursSavedPerYear = Math.round(studentCount * 18.5);

  return (
    <section className="py-20 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-mono"><Calculator className="w-3.5 h-3.5 text-indigo-400" /><span>University ROI Calculator</span></div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Calculate Your Campus Efficiency Projection</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-300"><span>Total Campus Student Population:</span><span className="text-emerald-400 font-mono font-bold text-base">{studentCount.toLocaleString()} students</span></div>
                  <input type="range" min={2000} max={50000} step={1000} value={studentCount} onChange={(e) => setStudentCount(Number(e.target.value))} className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-950 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-300"><span>Active Campus Dining Outlets / Cafes:</span><span className="text-emerald-400 font-mono font-bold text-base">{canteenCount} outlets</span></div>
                  <input type="range" min={2} max={30} step={1} value={canteenCount} onChange={(e) => setCanteenCount(Number(e.target.value))} className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-950 rounded-lg" />
                </div>
              </div>
              <p className="text-xs text-slate-400">Projections based on FOODEXA deployment benchmark studies across {partnerCount}+ partner universities.</p>
            </div>
            <div className="lg:col-span-6 bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-6 text-center sm:text-left">
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider text-center">ANNUAL CAMPUS IMPACT PROJECTION</h4>
              <div className="space-y-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-emerald-500/30">
                  <div className="text-xs text-slate-400">Campus Vendor Revenue Growth</div>
                  <div className="text-3xl font-black text-emerald-400 font-mono mt-1">+₹{estimatedAnnualVendorRevenueIncrease.toLocaleString('en-IN')} / yr</div>
                  <div className="text-[10px] text-slate-500 mt-1">From higher throughput during peak 45-minute lunch gaps</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900 p-3.5 rounded-2xl border border-teal-500/30"><div className="text-[10px] text-slate-400 font-mono">Perishable Waste Saved</div><div className="text-xl font-bold text-teal-300 font-mono mt-0.5">{estimatedFoodWasteReducedTons} Tons / yr</div></div>
                  <div className="bg-slate-900 p-3.5 rounded-2xl border border-indigo-500/30"><div className="text-[10px] text-slate-400 font-mono">Student Hours Saved</div><div className="text-xl font-bold text-indigo-300 font-mono mt-0.5">{totalStudentHoursSavedPerYear.toLocaleString()} hrs</div></div>
                </div>
              </div>
              <button onClick={onOpenBookDemo} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2"><span>Request Custom Campus Report</span><ArrowRight className="w-4 h-4 text-slate-950" /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};