import React from 'react';
import { Shield, Lock, Eye } from 'lucide-react';

export const SecuritySection: React.FC = () => {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-black mb-4">
          Enterprise-grade security
        </h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-16">
          Row Level Security, encrypted payments via Razorpay, and role-based access control protect every transaction.
        </p>
        
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'Row Level Security', desc: 'Every database query is scoped to the authenticated user. Students only see their own orders.' },
            { icon: Lock, title: 'Encrypted Payments', desc: 'Razorpay handles all payment processing with PCI DSS compliance and end-to-end encryption.' },
            { icon: Eye, title: 'Role-Based Access', desc: 'Students, faculty, kitchen staff, and admins each see only what their role permits.' },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-left">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-black mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
