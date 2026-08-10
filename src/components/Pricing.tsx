import React, { useEffect, useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PricingPlan } from '../types';

interface PricingProps {
  onOpenBookDemo: () => void;
  onOpenRegisterInstitution: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onOpenBookDemo, onOpenRegisterInstitution }) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [annual, setAnnual] = useState(true);

  useEffect(() => {
    supabase.from('pricing_plans').select('*').eq('is_active', true).order('order', { ascending: true })
      .then(({ data }) => { if (data && data.length > 0) setPlans(data as PricingPlan[]); });
  }, []);

  const defaultPlans: PricingPlan[] = [
    { id: '1', name: 'Starter Campus', target_user: 'Up to 5,000 Students', monthly_price: 15000, annual_price: 12000, description: 'Essential tools for smaller campuses.', popular: false, features: ['Core Ordering App', '1 Canteen Setup', 'Standard Support', 'Basic Analytics'], cta_label: 'Get Started', currency: '₹', is_active: true, order: 1 },
    { id: '2', name: 'Pro Campus', target_user: 'Up to 15,000 Students', monthly_price: 35000, annual_price: 28000, description: 'Full power of FOODEXA for growing universities.', popular: true, features: ['Unlimited Canteens', 'LX AI Integration', 'Priority Support', 'Advanced Analytics', 'Faculty Module'], cta_label: 'Most Popular', currency: '₹', is_active: true, order: 2 },
    { id: '3', name: 'Enterprise', target_user: 'Unlimited Students', monthly_price: 0, annual_price: 0, description: 'Custom deployment for massive institutions.', popular: false, features: ['Multi-Campus Support', 'Custom Integrations', '24/7 Dedicated Manager', 'White-label Options'], cta_label: 'Contact Sales', currency: '₹', is_active: true, order: 3 },
  ];

  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <section id="pricing" className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Transparent pricing for <br className="hidden sm:block" />
            <span className="text-slate-500">every campus size.</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Students and faculty always use FOODEXA for free. Institutions pay a simple SaaS fee based on campus size and required features.
          </p>
        </div>

        <div className="flex justify-center mb-16">
          <div className="bg-slate-900 border border-slate-800 rounded-full p-1 inline-flex relative">
            <button onClick={() => setAnnual(false)} className={`px-6 py-2 rounded-full text-xs font-bold transition-all relative z-10 ${!annual ? 'text-slate-950' : 'text-slate-400 hover:text-white'}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={`px-6 py-2 rounded-full text-xs font-bold transition-all relative z-10 ${annual ? 'text-slate-950' : 'text-slate-400 hover:text-white'}`}>Annual</button>
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full transition-all duration-300 ${annual ? 'left-[calc(50%+2px)]' : 'left-1'}`} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {displayPlans.map((plan) => (
            <div key={plan.id} className={`bg-slate-900/60 border ${plan.popular ? 'border-emerald-500/50 shadow-2xl shadow-emerald-500/10 scale-105 z-10' : 'border-slate-800'} rounded-[2rem] p-8 relative flex flex-col`}>
              
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-emerald-500 text-slate-950 text-[10px] font-bold rounded-full font-mono uppercase tracking-widest">
                  Recommended
                </div>
              )}
              
              <div className="space-y-2 mb-6">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-xs text-slate-400 h-8">{plan.description}</p>
              </div>
              
              <div className="mb-8">
                {plan.monthly_price === 0 ? (
                  <div className="text-4xl font-extrabold text-white">Custom</div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-500">{plan.currency}</span>
                    <span className="text-5xl font-extrabold text-white tracking-tight">{(annual ? plan.annual_price : plan.monthly_price).toLocaleString('en-IN')}</span>
                    <span className="text-sm text-slate-500 font-medium">/mo</span>
                  </div>
                )}
                {plan.monthly_price > 0 && annual && (
                  <div className="text-xs text-emerald-400 mt-2 font-mono">Billed annually</div>
                )}
              </div>
              
              <button onClick={plan.monthly_price === 0 ? onOpenBookDemo : onOpenRegisterInstitution} className={`w-full py-4 rounded-xl text-sm font-bold transition-all mb-8 flex items-center justify-center gap-2 cursor-pointer ${plan.popular ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg hover:from-emerald-400 hover:to-teal-300' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
                {plan.cta_label}
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <div className="space-y-4 mt-auto">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-4">{plan.target_user}</div>
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                      <Check className={`w-3 h-3 ${plan.popular ? 'text-emerald-400' : 'text-slate-400'}`} />
                    </div>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
              
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};