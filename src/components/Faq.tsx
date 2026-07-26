import React, { useState } from 'react';
import { ChevronDown, Search, HelpCircle, Sparkles } from 'lucide-react';
import { FAQ_ITEMS } from '../data/foodexaData';

export const Faq: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'students' | 'vendors' | 'universities'>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="faq" className="py-24 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Got Questions? <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">We've Got Answers</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base">
            Everything you need to know about FOODEXA, LX AI assistant, express pickup, and campus integration.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search FAQ: e.g. 'LX', 'Meal Plan', 'Smart Locker'..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/80 rounded-2xl pl-11 pr-4 py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'All Questions' },
              { id: 'students', label: 'For Students' },
              { id: 'vendors', label: 'For Vendors' },
              { id: 'universities', label: 'For Universities' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordions List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
              No matching questions found. Try searching for "LX" or "Queue Jump".
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-bold text-white">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-emerald-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </section>
  );
};
