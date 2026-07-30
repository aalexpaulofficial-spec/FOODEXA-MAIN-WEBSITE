import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Download, Building2, Mic, Search, ShoppingBag, Star, Clock, Lock, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { subscribeMenuItems, subscribeBanners, formatINR } from '../lib/supabase-service';
import type { MenuItem, Banner, MenuCategory } from '../types';

interface HeroProps {
  onOpenBookDemo: () => void;
  onOpenLxDrawer: () => void;
  onOpenVoiceModal?: () => void;
  onOpenLogin: () => void;
  onOpenDownload: () => void;
  onOpenGetStarted: () => void;
  onOpenRegisterInstitution?: () => void;
  onOpenCreateAccount?: () => void;
  onSelectPrompt: (promptText: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenBookDemo, onOpenLxDrawer, onOpenVoiceModal, onOpenLogin, onOpenDownload, onOpenGetStarted, onOpenRegisterInstitution, onOpenCreateAccount, onSelectPrompt,
}) => {
  const [stats, setStats] = useState<{ value: string; label: string }[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [institutionName, setInstitutionName] = useState('');
  const [institutionDesc, setInstitutionDesc] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ count: instCount }, { count: orderCount }] = await Promise.all([
          supabase.from('institutions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('orders').select('*', { count: 'exact', head: true }),
        ]);
        setStats([
          { value: `${(instCount || 0)}+`, label: 'Partner Campuses' },
          { value: `${Math.max((orderCount || 0), 1)}+`, label: 'Orders Processed' },
          { value: '4.2 Mins', label: 'Avg Express Pickup' },
          { value: '99.98%', label: 'Uptime Reliability' },
        ]);
      } catch { setStats([]); }
      setLoadingStats(false);
    };
    load();

    const loadMenu = async () => {
      const { data } = await supabase.from('menu_items').select('*').neq('status', 'archived').limit(6).order('rating', { ascending: false });
      setMenuItems((data || []).map((r: any) => ({
        id: String(r.id), name: String(r.food_name || 'Item'), counter: String(r.food_type || ''), counter_name: String(r.food_type || ''),
        price: Number(r.price || 0), offer_price: null, offer_label: null, prep_time: r.prep_time != null ? String(r.prep_time) : null, rating: Number(r.rating || 0),
        category: String(r.food_type || ''), category_id: null, image_url: r.image_url || null, description: String(r.description || ''),
        is_available: true, is_published: true, popular: Boolean(r.is_featured), nutrition: null, institution_id: null,
      })));
      const { data: cats } = await supabase.from('menu_categories').select('name').limit(8);
      setCategories((cats || []).map((c: any) => ({ id: c.id, name: c.name, institution_id: null, is_active: true, order: 0 })));
    };
    loadMenu();

    const loadUni = async () => {
      const { data } = await supabase.from('institutions').select('name, campus, city').eq('status', 'active').limit(1).maybeSingle();
      if (data) {
        setInstitutionName(data.name);
        setInstitutionDesc(`${data.campus || ''}${data.campus && data.city ? ', ' : ''}${data.city || ''} • Official campus food court digitization partner`);
      } else {
        setInstitutionName('CHRIST (Deemed to be University)');
        setInstitutionDesc('Kengeri Campus, Bengaluru • Official campus food court digitization partner');
      }
    };
    loadUni();

    const unsubMenu = subscribeMenuItems((payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        if (payload.new?.status !== 'archived') {
          setMenuItems((prev) => {
            const exists = prev.find((i) => i.id === String(payload.new.id));
            if (exists) return prev.map((i) => i.id === String(payload.new.id) ? { ...i, ...payload.new, price: Number(payload.new.price || 0) } : i);
            return [...prev, { id: String(payload.new.id), name: String(payload.new.food_name || ''), counter: String(payload.new.food_type || ''), counter_name: String(payload.new.food_type || ''), price: Number(payload.new.price || 0), offer_price: null, offer_label: null, prep_time: payload.new.prep_time != null ? String(payload.new.prep_time) : null, rating: Number(payload.new.rating || 0), category: String(payload.new.food_type || ''), category_id: null, image_url: payload.new.image_url || null, description: String(payload.new.description || ''), is_available: true, is_published: true, popular: Boolean(payload.new.is_featured), nutrition: null, institution_id: null }];
          });
        }
      } else if (payload.eventType === 'DELETE') {
        setMenuItems((prev) => prev.filter((i) => i.id !== String(payload.old.id)));
      }
    });
    const unsubBanners = subscribeBanners(() => {
      supabase.from('banners').select('*').eq('is_active', true).then(({ data }) => setBanners((data || []) as Banner[]));
    });

    return () => { unsubMenu(); unsubBanners(); };
  }, []);

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-slate-950">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-emerald-600/10 via-teal-500/10 to-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 shadow-inner">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-300">Official Campus Food Ordering SaaS</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-800 font-semibold">Powered by Google Gemini</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Smart Campus Food Ordering,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Powered by LX AI</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Order food, skip long lines, and manage campus dining with AI voice ordering, instant QR pickup, and real-time kitchen tracking.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <button onClick={onOpenRegisterInstitution || onOpenGetStarted} className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs hover:from-emerald-300 hover:to-cyan-300 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2 cursor-pointer">
                <Building2 className="w-4 h-4 text-slate-950" /><span>Register Your Institution</span><ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
              <button onClick={onOpenCreateAccount || onOpenGetStarted} className="px-6 py-3.5 rounded-2xl bg-slate-900 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer">
                <Sparkles className="w-4 h-4 text-emerald-400" /><span>Create Your Account</span><ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
              <button onClick={onOpenLogin} className="px-5 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-emerald-500/80 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md hover:bg-slate-800/80 cursor-pointer">
                <Lock className="w-4 h-4 text-emerald-400" /><span>Student Login</span>
              </button>
              <a href="https://portal.foodexa.com" target="_blank" rel="noopener noreferrer" className="px-5 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                <Building2 className="w-4 h-4 text-slate-400" /><span>Institution Login</span><ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <button onClick={onOpenBookDemo} className="px-5 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"><span>Book Demo</span></button>
              <button onClick={onOpenVoiceModal || onOpenLxDrawer} className="px-5 py-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                <Mic className="w-4 h-4 text-emerald-400 animate-pulse" /><span>Talk to LX</span>
              </button>
              <button onClick={onOpenDownload} className="px-5 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                <Download className="w-4 h-4 text-slate-400" /><span>Download App</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 text-left space-y-1.5 hover:border-emerald-500/40 transition-colors">
                <div className="text-xl">🎤</div><h3 className="text-xs font-bold text-white">Voice Ordering</h3><p className="text-[11px] text-slate-400 leading-tight">Order meals naturally using AI voice</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 text-left space-y-1.5 hover:border-emerald-500/40 transition-colors">
                <div className="text-xl">📱</div><h3 className="text-xs font-bold text-white">QR Pickup</h3><p className="text-[11px] text-slate-400 leading-tight">Instant contactless locker & counter pickup</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 text-left space-y-1.5 hover:border-emerald-500/40 transition-colors">
                <div className="text-xl">⚡</div><h3 className="text-xs font-bold text-white">Live Tracking</h3><p className="text-[11px] text-slate-400 leading-tight">Real-time prep updates & locker codes</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 text-left space-y-1.5 hover:border-emerald-500/40 transition-colors">
                <div className="text-xl">🤖</div><h3 className="text-xs font-bold text-white">LX Assistant</h3><p className="text-[11px] text-slate-400 leading-tight">Smart meal discovery & dietary filters</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {loadingStats ? (
                <div className="col-span-4 flex justify-center py-2"><Loader2 className="w-5 h-5 animate-spin text-emerald-400" /></div>
              ) : stats.length === 0 ? (
                <div className="col-span-4 text-xs text-slate-500 text-center">Live stats loading...</div>
              ) : (
                stats.map((stat, i) => (
                  <div key={i} className="text-center lg:text-left">
                    <div className="text-xl font-bold text-emerald-400 font-mono">{stat.value}</div>
                    <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="bg-slate-900/95 rounded-3xl p-5 border border-slate-800 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <span className="text-[11px] font-mono text-slate-300 ml-1">foodexa.app / student-portal</span>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-800 font-mono font-semibold">Student Portal Live</span>
              </div>
              <div onClick={onOpenVoiceModal} className="bg-slate-950 border border-emerald-500/50 rounded-2xl p-4 space-y-3 hover:border-emerald-400 transition-all cursor-pointer group shadow-lg shadow-emerald-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-400/50">
                      <Mic className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                      <span className="absolute -inset-0.5 rounded-full bg-emerald-400/20 animate-ping pointer-events-none" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">🎤 Voice Ordering with LX AI</h4>
                      <p className="text-[10px] text-emerald-400 font-mono">Tap to order by voice</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 h-4 px-2 py-1 bg-slate-900 rounded-lg border border-slate-800">
                    {[40, 90, 60, 100, 70, 40].map((h, i) => (
                      <div key={i} className="w-1 bg-emerald-400 rounded-full animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }} />
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="bg-slate-900 p-2.5 rounded-xl text-slate-200 text-[11px] flex items-center gap-2 border border-slate-800">
                    <span className="text-emerald-400 font-bold shrink-0">Student:</span>
                    <span>"Order one Chicken Biryani."</span>
                  </div>
                  <div className="bg-emerald-950/80 p-2.5 rounded-xl text-emerald-200 text-[11px] flex items-center gap-2 border border-emerald-800/80 shadow-inner">
                    <span className="text-emerald-400 font-bold shrink-0">LX:</span>
                    <span>"Added to your cart. Pickup in 8 minutes at Counter B."</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input type="text" readOnly value="Search Biryani, Burgers, Dosa, Juices..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-400 cursor-default" />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
                  <span className="bg-emerald-950 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-800 shrink-0">🔥 Popular</span>
                  {categories.slice(0, 6).map((c) => (
                    <span key={c.id || c.name} className="bg-slate-950 text-slate-300 px-2.5 py-1 rounded-full border border-slate-800 shrink-0">{c.name}</span>
                  ))}
                  {categories.length === 0 && (
                    <span className="bg-slate-950 text-slate-300 px-2.5 py-1 rounded-full border border-slate-800 shrink-0">Loading...</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {menuItems.slice(0, 2).map((item) => (
                  <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 space-y-2 hover:border-emerald-500/40 transition-colors">
                    <div className="relative h-20 rounded-xl overflow-hidden bg-slate-900">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px]">No Image</div>
                      )}
                      <span className="absolute top-1.5 right-1.5 bg-slate-950/80 backdrop-blur-md text-amber-300 px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" /> {item.rating > 0 ? item.rating.toFixed(1) : '4.5'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <h5 className="font-bold text-white text-[11px] truncate max-w-[100px]">{item.name}</h5>
                        <p className="text-[9px] text-slate-400">{item.counter_name}{item.prep_time ? ` • ${item.prep_time}` : ''}</p>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold text-[11px]">{formatINR(item.price)}</span>
                    </div>
                  </div>
                ))}
                {menuItems.length === 0 && (
                  <>
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 space-y-2">
                      <div className="h-20 rounded-xl bg-slate-900 animate-pulse" />
                      <div className="h-4 bg-slate-900 rounded animate-pulse w-3/4" />
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 space-y-2">
                      <div className="h-20 rounded-xl bg-slate-900 animate-pulse" />
                      <div className="h-4 bg-slate-900 rounded animate-pulse w-3/4" />
                    </div>
                  </>
                )}
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400"><ShoppingBag className="w-3.5 h-3.5" /></div>
                    <div>
                      <span className="text-white font-bold text-[11px] block">{menuItems.length > 0 ? `1 Item in Cart` : 'Live Demo'}</span>
                      <span className="text-slate-400 text-[10px]">{menuItems.length > 0 ? `${menuItems[0].name} • ${formatINR(menuItems[0].price)}` : 'Browse live menu items'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800 font-mono font-bold"><ShoppingBag className="w-3 h-3 text-emerald-400" /><span>Ready</span></span>
                  </div>
                </div>
                <div className="space-y-1 pt-1 border-t border-slate-900">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-emerald-400" /><span>Kitchen Prep Progress</span></span>
                    <span className="text-emerald-400 font-bold">Ready in 2.5 mins</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full w-[85%] rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-slate-800/80 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            <span>TRUSTED & DESIGNED FOR CAMPUS DINING</span>
          </div>
          <div className="max-w-xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
            <h3 className="text-base font-bold text-white tracking-tight">{institutionName}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{institutionDesc}</p>
          </div>
        </div>
      </div>
    </section>
  );
};