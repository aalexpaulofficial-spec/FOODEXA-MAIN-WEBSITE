import React, { useEffect, useState } from 'react';
import { Check, Sparkles, ArrowRight, ShieldCheck, HelpCircle, Loader2 } from 'lucide-react';
import { fetchPricingPlans } from '../lib/supabase-service';
import type { PricingPlan } from '../types';

interface PricingProps { onOpenBookDemo: () => void; onOpenLxDrawer: () => void; }

export const Pricing: React.FC<PricingProps> = ({ onOpenBookDemo, onOpenLxDrawer }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPricingPlans().then(setPlans).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <section id="pricing" className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-xs text-emerald-300 font-mono"><span>Transparent Campus Pricing</span></div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Plans for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Every Campus Scale</span></h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">Students always use FOODEXA free. Vendors and universities enjoy transparent, predictable pricing with zero hidden transaction surcharges.</p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs font-semibold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Semester Billing</span>
            <button onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')} className="relative w-12 h-6 bg-slate-900 border border-slate-700 rounded-full p-1 transition-colors cursor-pointer">
              <div className={`w-4 h-4 rounded-full bg-emerald-400 transition-transform ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-white' : 'text-slate-400'}`}>Annual Campus License<span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800 font-mono">Save 20%</span></span>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
        ) : plans.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-16">No pricing plans available. Add pricing_plan rows in Supabase.</div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {plans.map((plan) => {
              const price = billingCycle === 'annual' ? plan.annual_price : plan.monthly_price;
              return (
                <div key={plan.id} className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all ${plan.popular ? 'bg-slate-900 border-2 border-emerald-500/80 shadow-2xl shadow-emerald-500/10' : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700'}`}>
                  {plan.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md">Most Popular Vendor Choice</div>}
                  <div className="space-y-6">
                    <div><h3 className="text-xl font-bold text-white">{plan.name}</h3><p className="text-xs text-slate-400 font-mono mt-0.5">{plan.target_user}</p><p className="text-xs text-slate-300 mt-3 leading-relaxed">{plan.description}</p></div>
                    <div className="pt-4 border-t border-slate-800">
                      <div className="flex items-baseline gap-1"><span className="text-4xl font-extrabold text-white font-mono">{plan.currency === 'INR' ? '₹' : '$'}{price}</span><span className="text-xs text-slate-400 font-mono">{price === 0 ? '' : '/ month'}</span></div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Included Features</h4>
                      <ul className="space-y-2.5">{plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span>{feat}</span></li>
                      ))}</ul>
                    </div>
                  </div>
                  <div className="pt-8">
                    {plan.monthly_price === 0 ? (
                      <button onClick={onOpenLxDrawer} className="w-full py-3 rounded-2xl bg-slate-950 border border-slate-700 hover:border-emerald-500/50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"><Sparkles className="w-4 h-4 text-emerald-400" /><span>{plan.cta_label}</span></button>
                    ) : (
                      <button onClick={onOpenBookDemo} className={`w-full py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${plan.popular ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 hover:from-emerald-300 shadow-md' : 'bg-slate-950 border border-slate-700 hover:border-emerald-500/50 text-white'}`}>
                        <span>{plan.cta_label}</span><ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};