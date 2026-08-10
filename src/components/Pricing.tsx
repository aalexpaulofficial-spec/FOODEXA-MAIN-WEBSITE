import React, { useEffect, useState } from 'react';
import { Check, ArrowUpRight } from 'lucide-react';
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
    { id: '1', name: 'Starter', target_user: 'Up to 5,000 Students', monthly_price: 15000, annual_price: 12000, description: 'Essential tools for smaller campuses.', popular: false, features: ['Core Ordering App', '1 Canteen Setup', 'Standard Support', 'Basic Analytics'], cta_label: 'Get Started', currency: '₹', is_active: true, order: 1 },
    { id: '2', name: 'Pro', target_user: 'Up to 15,000 Students', monthly_price: 35000, annual_price: 28000, description: 'Full power for growing universities.', popular: true, features: ['Unlimited Canteens', 'LX AI Integration', 'Priority Support', 'Advanced Analytics', 'Faculty Module'], cta_label: 'Most Popular', currency: '₹', is_active: true, order: 2 },
    { id: '3', name: 'Enterprise', target_user: 'Unlimited', monthly_price: 0, annual_price: 0, description: 'Custom deployment for large institutions.', popular: false, features: ['Multi-Campus', 'Custom Integrations', 'Dedicated Manager', 'White-label Options'], cta_label: 'Contact Sales', currency: '₹', is_active: true, order: 3 },
  ];

  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <section id="pricing" className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-black mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Students and faculty use FOODEXA for free. Institutions pay a SaaS fee based on campus size.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-16">
          <div className="bg-gray-100 rounded-full p-1 inline-flex relative">
            <button onClick={() => setAnnual(false)} className={`px-5 py-2 rounded-full text-xs font-medium transition-all relative z-10 cursor-pointer ${!annual ? 'text-black' : 'text-gray-400'}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={`px-5 py-2 rounded-full text-xs font-medium transition-all relative z-10 cursor-pointer ${annual ? 'text-black' : 'text-gray-400'}`}>Annual</button>
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-all duration-300 ${annual ? 'left-[calc(50%+2px)]' : 'left-1'}`} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {displayPlans.map((plan) => (
            <div key={plan.id} className={`rounded-2xl p-8 relative flex flex-col transition-all duration-300 ${plan.popular ? 'bg-black text-white shadow-2xl scale-105 z-10' : 'bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-md'}`}>
              
              <div className="space-y-1 mb-6">
                <h3 className={`text-lg font-semibold ${plan.popular ? 'text-white' : 'text-black'}`}>{plan.name}</h3>
                <p className={`text-xs ${plan.popular ? 'text-gray-400' : 'text-gray-400'}`}>{plan.description}</p>
              </div>
              
              <div className="mb-8">
                {plan.monthly_price === 0 ? (
                  <div className={`text-3xl font-bold ${plan.popular ? 'text-white' : 'text-black'}`}>Custom</div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className={`text-sm ${plan.popular ? 'text-gray-400' : 'text-gray-400'}`}>{plan.currency}</span>
                    <span className={`text-4xl font-bold tracking-tight ${plan.popular ? 'text-white' : 'text-black'}`}>{(annual ? plan.annual_price : plan.monthly_price).toLocaleString('en-IN')}</span>
                    <span className={`text-sm ${plan.popular ? 'text-gray-400' : 'text-gray-400'}`}>/mo</span>
                  </div>
                )}
              </div>
              
              <button onClick={plan.monthly_price === 0 ? onOpenBookDemo : onOpenRegisterInstitution} className={`w-full py-3 rounded-full text-sm font-medium transition-all mb-8 flex items-center justify-center gap-2 cursor-pointer ${plan.popular ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}>
                {plan.cta_label}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              
              <div className="space-y-3 mt-auto">
                <div className={`text-xs font-medium uppercase tracking-wider mb-3 ${plan.popular ? 'text-gray-400' : 'text-gray-400'}`}>{plan.target_user}</div>
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? 'text-gray-400' : 'text-gray-400'}`} />
                    <span className={`text-sm ${plan.popular ? 'text-gray-300' : 'text-gray-600'}`}>{feature}</span>
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