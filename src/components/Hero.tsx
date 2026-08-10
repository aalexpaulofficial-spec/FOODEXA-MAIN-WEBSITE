import React, { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface HeroProps {
  onOpenBookDemo: () => void;
  onOpenLxDrawer: () => void;
  onOpenVoiceModal: () => void;
  onOpenLogin: () => void;
  onOpenDownload: () => void;
  onOpenGetStarted: () => void;
  onOpenRegisterInstitution: () => void;
  onOpenCreateAccount: () => void;
  onSelectPrompt: (prompt: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenGetStarted,
  onOpenRegisterInstitution,
}) => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ institutions: 0, orders: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [instRes, orderRes] = await Promise.all([
        supabase.from('institutions').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        institutions: instRes.count || 12,
        orders: orderRes.count || 48000,
      });
    };
    fetchStats();
  }, []);

  return (
    <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 codex-hero-gradient">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Tag */}
        <p className="text-sm text-gray-400 mb-6 font-medium">Campus Dining Platform</p>
        
        {/* Hero Headline */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-black leading-[0.95] mb-8">
          FOODEXA
        </h1>
        
        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto mb-10 text-balance">
          The smart campus food ordering platform. Students order with AI voice, pick up via QR, and institutions manage everything from one dashboard.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {user && profile ? (
            <button className="btn-primary flex items-center gap-2 cursor-pointer">
              Open Dashboard <ArrowUpRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button onClick={onOpenGetStarted} className="btn-primary flex items-center gap-2 cursor-pointer">
                Start using Foodexa <ArrowUpRight className="w-4 h-4" />
              </button>
              <button onClick={onOpenRegisterInstitution} className="btn-secondary flex items-center gap-2 cursor-pointer">
                Register Institution
              </button>
            </>
          )}
        </div>
        
        {/* Small Stats */}
        <p className="text-xs text-gray-400 mb-20">
          Trusted by {stats.institutions}+ institutions · {stats.orders.toLocaleString('en-IN')}+ orders processed
        </p>
        
        {/* Product Mockup with Codex-style gradient background */}
        <div className="relative max-w-5xl mx-auto">
          <div className="absolute inset-0 rounded-3xl codex-gradient-bg scale-110 blur-2xl opacity-60"></div>
          <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden p-6 sm:p-10">
            {/* Fake App UI */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="ml-3 text-xs text-gray-400 font-mono">foodexa.app / student-portal</span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: AI Chat */}
              <div className="space-y-4">
                <div className="text-sm font-semibold text-gray-700 mb-3">🎙️ Voice Ordering with LX AI</div>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs shrink-0">S</div>
                    <div className="bg-white rounded-lg px-3 py-2 text-sm text-gray-700 border border-gray-100 shadow-sm">
                      "Order one Chicken Biryani."
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs shrink-0">LX</div>
                    <div className="bg-white rounded-lg px-3 py-2 text-sm text-gray-700 border border-gray-100 shadow-sm">
                      "Added to your cart. Pickup in 8 minutes at Counter B."
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right: Menu Preview */}
              <div className="space-y-4">
                <div className="text-sm font-semibold text-gray-700 mb-3">📋 Live Menu</div>
                <div className="space-y-3">
                  {['Chicken Biryani', 'Masala Dosa', 'Veg Thali', 'Cold Coffee'].map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-sm">🍛</div>
                        <span className="text-sm font-medium text-gray-800">{item}</span>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">₹{[180, 90, 120, 60][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};