import React, { useState } from 'react';
import {
  Sparkles,
  Mic,
  Brain,
  MapPin,
  Clock,
  Salad,
  Search,
  PackageCheck,
  Gift,
  Flame,
  Utensils,
  GraduationCap,
  TrendingUp,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Send,
  ShoppingBag,
  Zap,
} from 'lucide-react';

interface MeetLxSectionProps {
  onOpenVoiceModal: () => void;
  onOpenLxDrawer: () => void;
}

export const MeetLxSection: React.FC<MeetLxSectionProps> = ({
  onOpenVoiceModal,
  onOpenLxDrawer,
}) => {
  const [activeChatStep, setActiveChatStep] = useState(4);

  // Chat conversation messages
  const conversationMessages = [
    {
      sender: 'student',
      text: "I'm hungry. What's available under ₹150?",
      time: '12:14 PM',
    },
    {
      sender: 'lx',
      text: 'Counter A has Veg Fried Rice for ₹120 and Paneer Wrap for ₹140.',
      time: '12:14 PM',
      highlight: true,
    },
    {
      sender: 'student',
      text: 'Order the Paneer Wrap.',
      time: '12:15 PM',
    },
    {
      sender: 'lx',
      text: 'Done! Your estimated pickup time is 8 minutes at Counter A (Locker Pod #2).',
      time: '12:15 PM',
      orderBadge: 'Paneer Wrap • ₹140 • Ready in 8 mins',
    },
    {
      sender: 'student',
      text: 'Any healthy drinks?',
      time: '12:16 PM',
    },
    {
      sender: 'lx',
      text: 'I recommend Fresh Lime Soda (₹40, 45 kcal) and a Fresh Fruit Bowl (₹60, 110 kcal).',
      time: '12:16 PM',
    },
  ];

  // Context Cards (Requirement 16)
  const contextCards = [
    {
      title: 'LX Recommendation',
      icon: Utensils,
      text: 'Based on your previous orders, you may like Paneer Wrap today.',
      badge: '🍽 Meal Match',
      borderColor: 'border-emerald-500/40',
      glowColor: 'shadow-emerald-500/10',
    },
    {
      title: 'Queue Insight',
      icon: Clock,
      text: 'Counter B currently has a 4-minute wait.',
      badge: '⏱ Live Speed',
      borderColor: 'border-cyan-500/40',
      glowColor: 'shadow-cyan-500/10',
    },
    {
      title: 'Trending',
      icon: Flame,
      text: "Today's most ordered meal is Chicken Fried Rice.",
      badge: '🔥 Campus Top Choice',
      borderColor: 'border-amber-500/40',
      glowColor: 'shadow-amber-500/10',
    },
    {
      title: 'Nutrition',
      icon: Salad,
      text: 'Try a healthier lunch with 650 kcal.',
      badge: '💚 Health Balance',
      borderColor: 'border-teal-500/40',
      glowColor: 'shadow-teal-500/10',
    },
    {
      title: 'Campus Update',
      icon: GraduationCap,
      text: 'Your canteen opens at 8:00 AM tomorrow.',
      badge: '🎓 Official Timing',
      borderColor: 'border-indigo-500/40',
      glowColor: 'shadow-indigo-500/10',
    },
    {
      title: 'Special Offer',
      icon: Gift,
      text: 'Get 10% off on Combo Meals today.',
      badge: '🎁 Student Deal',
      borderColor: 'border-purple-500/40',
      glowColor: 'shadow-purple-500/10',
    },
  ];

  // LX Feature Grid (Requirement 20)
  const lxFeatures = [
    {
      icon: Mic,
      title: 'Voice Ordering',
      description: 'Describe food naturally and let LX place your order.',
      gradient: 'from-emerald-400 to-teal-300',
    },
    {
      icon: Brain,
      title: 'Smart Recommendations',
      description: 'Suggest meals based on preferences and order history.',
      gradient: 'from-teal-300 to-cyan-400',
    },
    {
      icon: MapPin,
      title: 'Campus Awareness',
      description: 'Understand campus counters, timings, and locations.',
      gradient: 'from-cyan-400 to-indigo-400',
    },
    {
      icon: Clock,
      title: 'Queue Prediction',
      description: 'Estimate waiting times before placing an order.',
      gradient: 'from-indigo-400 to-emerald-400',
    },
    {
      icon: Salad,
      title: 'Nutrition Guidance',
      description: 'Display nutrition insights for meals.',
      gradient: 'from-emerald-400 to-amber-300',
    },
    {
      icon: Search,
      title: 'Smart Search',
      description: 'Find meals using natural language.',
      gradient: 'from-teal-300 to-indigo-300',
    },
    {
      icon: PackageCheck,
      title: 'Order Tracking',
      description: 'Track order status in real time.',
      gradient: 'from-cyan-400 to-emerald-300',
    },
    {
      icon: Gift,
      title: 'Personalized Offers',
      description: 'Recommend deals based on ordering patterns.',
      gradient: 'from-amber-300 to-teal-300',
    },
  ];

  return (
    <section id="meet-lx" className="py-24 bg-slate-950 relative border-t border-slate-900 overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-emerald-600/10 via-teal-500/10 to-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-20">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-xs font-mono text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>AI Campus Dining Companion</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 font-semibold">
              Powered by Google Gemini
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Meet LX <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Your Smart Campus Food Assistant
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            LX understands natural conversations, predicts cafeteria rush times, remembers student dietary goals, and places express pickup orders in seconds.
          </p>
        </div>

        {/* 19. LX AI PREVIEW CONVERSATION SECTION */}
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          
          {/* Chat Interface Preview */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 backdrop-blur-xl relative overflow-hidden">
            
            {/* Header of Chat Mockup */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
                  LX
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    LX Assistant
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">Official Foodexa AI • Powered by Google Gemini</p>
                </div>
              </div>

              <button
                onClick={onOpenVoiceModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-xs font-mono transition-all cursor-pointer shadow-sm hover:scale-102"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Try Voice LX</span>
              </button>
            </div>

            {/* Conversation Messages Thread */}
            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-2">
              {conversationMessages.slice(0, activeChatStep + 2).map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1.5 shadow-md ${
                      msg.sender === 'student'
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] opacity-80 font-mono">
                      <span className="font-bold uppercase tracking-wider">
                        {msg.sender === 'student' ? 'Student' : 'LX Assistant'}
                      </span>
                      <span>{msg.time}</span>
                    </div>

                    <p className="text-xs">{msg.text}</p>

                    {msg.orderBadge && (
                      <div className="mt-2 bg-emerald-950 border border-emerald-500/50 rounded-xl p-2 flex items-center justify-between text-emerald-300 font-mono font-bold text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          {msg.orderBadge}
                        </span>
                        <span className="text-[9px] bg-emerald-900 px-2 py-0.5 rounded text-white">
                          PRE-PAID
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input Bar */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="Order the Paneer Wrap and fresh juice..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 focus:outline-none"
              />
              <button
                onClick={onOpenLxDrawer}
                className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 hover:from-emerald-300 transition-all cursor-pointer font-bold flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Right Side Chat Value Callout */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
                Seamless AI Conversations
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Ordering Food as Easy as Messaging a Friend
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Students can type or speak in plain English or local campus lingo. LX understands dietary restrictions, prices, canteen counter workloads, and prep speeds automatically.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Instant Order Placement</h4>
                  <p className="text-[11px] text-slate-400">Skip selecting items manually. LX builds the cart and triggers kitchen prep tickets directly.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="p-2 rounded-xl bg-teal-950 text-teal-400 border border-teal-800">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Hands-Free Voice Orders</h4>
                  <p className="text-[11px] text-slate-400">Speak your order while walking between lectures and pick it up hot at your locker pod.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenLxDrawer}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <span>Launch Interactive LX Assistant</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>

          </div>

        </div>

        {/* 16. LX CONTEXT CARDS SHOWCASE */}
        <div className="space-y-6 pt-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-extrabold text-white">Real-Time LX AI Context Cards</h3>
            <p className="text-xs text-slate-400">Smart contextual nudges displayed across student dashboards and campus screens.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contextCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className={`bg-slate-900/90 border ${card.borderColor} ${card.glowColor} rounded-2xl p-4 space-y-2.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-md relative overflow-hidden`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white">{card.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800">
                      {card.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    "{card.text}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 20. LX FEATURE GRID (8 CARDS) */}
        <div className="space-y-8 pt-10 border-t border-slate-900">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
              Core Intelligence Matrix
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
              8 Powerful Capabilities Built Into LX
            </h3>
            <p className="text-xs text-slate-400">
              Designed specifically for campus cafeterias, dorm logistics, and university food court speeds.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {lxFeatures.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 space-y-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {feat.title}
                  </h4>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 21. DASHBOARD VOICE ORDERING PREVIEW SECTION */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/60 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400">
              <Mic className="w-3.5 h-3.5" />
              <span>Student Dashboard Preview</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Seamless Voice Integration on Student Dashboard
            </h3>
            <p className="text-xs text-slate-300">
              Voice ordering blends natively alongside search bars, active order cards, and express QR pickup widgets.
            </p>
          </div>

          {/* Interactive Mock Dashboard Shell */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 shadow-inner max-w-4xl mx-auto">
            
            {/* Dashboard Search & Mic Header */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  readOnly
                  value="Search canteen, food court, or ask LX..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-12 py-2.5 text-xs text-slate-300 focus:outline-none"
                />
                
                {/* Voice Mic Button */}
                <button
                  onClick={onOpenVoiceModal}
                  className="absolute right-2 top-1.5 p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all cursor-pointer shadow-md flex items-center justify-center gap-1 text-[10px] font-bold"
                  title="Voice Ordering"
                >
                  <Mic className="w-3.5 h-3.5 animate-pulse" />
                  <span className="hidden sm:inline">Voice</span>
                </button>
              </div>

              {/* Floating LX Widget Trigger */}
              <button
                onClick={onOpenLxDrawer}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>LX Widget</span>
              </button>
            </div>

            {/* Dashboard Grid Items */}
            <div className="grid sm:grid-cols-3 gap-4">
              
              {/* Suggested Meals Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Suggested for You</span>
                  <span className="text-[10px] text-emerald-400 font-mono">LX AI</span>
                </div>
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                    🍱
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Paneer Butter Masala</h5>
                    <p className="text-[10px] text-slate-400">Counter A • ₹140</p>
                  </div>
                </div>
              </div>

              {/* Active Order Status */}
              <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Active Order #749
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">2.5 min</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full w-4/5 rounded-full" />
                </div>
                <p className="text-[10px] text-slate-400">Preparing at Science Quad Canteen</p>
              </div>

              {/* QR Pickup Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    Express Pickup Card
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Locker Pod #04 Ready</p>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-1 rounded font-mono font-bold">
                  TAP ID
                </span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
