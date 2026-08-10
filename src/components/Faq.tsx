import React, { useEffect, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
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
    { id: '1', question: 'How do students join FOODEXA?', answer: 'Download the app or visit the website, click "Create Account", select Student, and enter the Institution Code provided by your university.' },
    { id: '2', question: 'Can guests order without an account?', answer: 'Yes. Visitors can scan QR codes at any campus canteen to access the guest menu and place orders without signing up.' },
    { id: '3', question: 'How does QR pickup work?', answer: 'When your order is ready, your app generates a one-time QR code. Show it at the counter — the staff scans it, and you collect your meal.' },
    { id: '4', question: 'How do institutions register?', answer: 'Click "Register Institution" and submit your campus details. Our team reviews the application and sets up your dedicated ecosystem.' },
    { id: '5', question: 'Are payments secure?', answer: 'Yes. We use Razorpay for encrypted payment processing with support for UPI, Cards, NetBanking, and faculty wallets.' },
  ];

  const displayFaqs = faqs.length > 0 ? faqs : defaultFaqs;

  return (
    <section id="faq" className="py-24 md:py-32 bg-[#f7f7f8]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-black mb-4">
            Common questions
          </h2>
        </div>

        <div className="space-y-3">
          {displayFaqs.map((faq) => (
            <div key={faq.id} className={`bg-white rounded-xl border border-gray-100 overflow-hidden transition-all ${openId === faq.id ? 'shadow-sm' : ''}`}>
              <button 
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer"
              >
                <span className="text-sm font-medium text-black pr-4">{faq.question}</span>
                <span className="text-gray-400 shrink-0">
                  {openId === faq.id ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${openId === faq.id ? 'max-h-96 pb-5 px-6' : 'max-h-0 px-6'}`}>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};