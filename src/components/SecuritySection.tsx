import React from 'react';
import { ShieldCheck, Lock, Fingerprint, Database, Check } from 'lucide-react';

export const SecuritySection: React.FC = () => {
  return (
    <section className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enterprise-Grade Security</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
              Secure by design. <br />
              <span className="text-slate-500">Private by default.</span>
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              FOODEXA is built with robust security architecture to protect student data, secure financial transactions, and ensure institutional compliance. We prioritize privacy in every aspect of the platform.
            </p>
            
            <ul className="space-y-4 pt-2">
              {[
                'Secure Supabase Authentication & Row Level Security (RLS)',
                'Strict Institution Code validation for closed-campus access',
                'Role-Based Access Control (RBAC) for dashboards',
                'Encrypted payment processing via Razorpay',
                'Privacy-conscious handling of student dietary profiles'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-300 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <Lock className="w-8 h-8 text-emerald-400" />
              <h4 className="font-bold text-white">Closed Campus</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Only verified members with valid institution codes can join a campus ecosystem.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 translate-y-8">
              <Database className="w-8 h-8 text-emerald-400" />
              <h4 className="font-bold text-white">Data Isolation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Institution data is strictly isolated via Row Level Security in the database.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <Fingerprint className="w-8 h-8 text-emerald-400" />
              <h4 className="font-bold text-white">Secure Auth</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Email OTP verification ensures identities are validated before account creation.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 translate-y-8">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <h4 className="font-bold text-white">Safe Payments</h4>
              <p className="text-xs text-slate-400 leading-relaxed">All payments are tokenized and processed through secure payment gateways.</p>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};
