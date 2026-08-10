import React, { useEffect, useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { FaqItem } from '../types';

export const Faq: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('faq_items').select('*').eq('is_published', true).order('order', { ascending: true })
      .then(({ data }) => { if (data && data.length > 0) setFaqs(data as FaqItem[]); });
  }, []);

  const defaultFaqs = [
    { id: '1', question: 'How do I join my campus on FOODEXA?', answer: 'Download the app or visit the website, click "Create Account", select Student/Faculty, and enter your Institution Code provided by your university. We verify your institution email address to grant access.' },
    { id: '2', question: 'Can guests or parents order food?', answer: 'Yes! Visitors can scan QR codes at participating campus cafes to access the guest menu without needing an institution code.' },
    { id: '3', question: 'How does QR pickup work?', answer: 'Once your order is marked "Ready" by the kitchen, your app generates a secure QR code. Show this code at the pickup counter. The staff scans it, handing you the right meal instantly.' },
    { id: '4', question: 'How do institutions register?', answer: 'Click "Register Institution" and submit your campus details. Our Super Admin team reviews the request and provisions a dedicated ecosystem with a unique Institution Code.' },
    { id: '5', question: 'Is my payment secure?', answer: 'Absolutely. We use Razorpay for enterprise-grade encrypted payment processing. We support UPI, Cards, NetBanking, and authorized faculty allowance wallets.' },
  ];

  const displayFaqs = faqs.length > 0 ? faqs : defaultFaqs;

  return (
    <section id="faq" className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Support</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Common questions.
          </h2>
        </div>

        <div className="space-y-4">
          {displayFaqs.map((faq) => (
            <div key={faq.id} className={`border border-slate-800 rounded-2xl overflow-hidden transition-colors ${openId === faq.id ? 'bg-slate-900/80 border-slate-700' : 'bg-slate-900/30 hover:bg-slate-900/50'}`}>
              <button 
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer"
              >
                <span className="text-base font-bold text-white">{faq.question}</span>
                <span className="ml-4 shrink-0 text-slate-400">
                  {openId === faq.id ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </span>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${openId === faq.id ? 'max-h-96 pb-6 px-6' : 'max-h-0 px-6'}`}>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};