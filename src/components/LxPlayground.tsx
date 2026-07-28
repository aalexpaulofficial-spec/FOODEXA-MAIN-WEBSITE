import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Loader2, RefreshCw, Check, Clock, DollarSign, MapPin, Zap, Flame, ShieldAlert } from 'lucide-react';
import { LXChatMessage } from '../types';


interface LxPlaygroundProps {
  initialPrompt?: string;
  onOpenBookDemo: () => void;
}

export const LxPlayground: React.FC<LxPlaygroundProps> = ({ initialPrompt, onOpenBookDemo }) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<LXChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'lx',
      text: "👋 Hi! I'm **LX**, your official FOODEXA Campus AI Companion.\n\nI can help you discover healthy meals, optimize your food budget under $8, skip 20-minute cafeteria lines, and split group dorm orders.\n\nWhat are you craving or looking for today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  // If initialPrompt was clicked from hero
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      handleSendPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendPrompt = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMsg: LXChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask-lx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText,
          conversationHistory: messages.map((m) => ({ role: m.sender, content: m.text }))
        }),
      });

      const data = await response.json();
      const lxAnswerText = data.answer || "LX is currently re-routing campus prep lines. Please try another query!";

      const lxMsg: LXChatMessage = {
        id: `lx-${Date.now()}`,
        sender: 'lx',
        text: lxAnswerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, lxMsg]);
    } catch (err) {
      console.error("Error querying LX:", err);
      const fallbackMsg: LXChatMessage = {
        id: `lx-err-${Date.now()}`,
        sender: 'lx',
        text: "⚡ **LX Express Insights:**\n\nBased on your query, the best campus match is **Grilled Quinoa & Protein Bowl** @ *Science Quad Bistro* ($7.80, ~3 mins prep). Use FOODEXA Express Pickup to skip the peak 12:30 PM queue!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-reset-${Date.now()}`,
        sender: 'lx',
        text: "👋 Chat reset! Ask LX anything about campus food, wait times, macros, or budget deals.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  return (
    <section id="lx-playground" className="py-20 bg-slate-950 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
            <span>Interactive AI Playground</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">LX</span> — Your Intelligent Campus Dining Companion
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            LX processes real-time cafeteria prep traffic, dietary preferences, class schedule gaps, and student budgets to recommend the ideal campus meal in seconds.
          </p>
        </div>

        {/* Playground Container Card */}
        <div className="max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl relative">
          
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 p-[1px] shadow-md shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">LX Assistant</h3>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800/80 font-mono">
                    Live Demo
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Powered by FOODEXA Campus AI Engine</p>
              </div>
            </div>

            <button
              onClick={handleResetChat}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="py-3 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-800/60">
            <span className="text-[11px] text-slate-400 font-mono shrink-0">Try asking LX:</span>
            {[ 'What can I eat under ₹500 near Science Bldg with 30g+ protein?', 'I need a vegan iced oat matcha + bagel without nuts', 'Which campus canteen has the shortest line right now?', 'Start a group cart for dorm order with 4-way bill split' ].map((promptText, i) => (
              <button
                key={i}
                onClick={() => handleSendPrompt(promptText)}
                disabled={isLoading}
                className="shrink-0 text-xs bg-slate-950/80 hover:bg-emerald-950/80 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Chat Stream Window */}
          <div className="py-6 space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'lx' && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400 mt-1 shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-medium rounded-tr-none shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950/90 text-slate-200 border border-slate-800/90 rounded-tl-none whitespace-pre-line shadow-inner'
                  }`}
                >
                  <div>{msg.text}</div>
                  <div
                    className={`text-[10px] mt-2 font-mono ${
                      msg.sender === 'user' ? 'text-slate-900/80 text-right' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp} • {msg.sender === 'user' ? 'You' : 'LX AI'}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 mt-1">
                    👤
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-2xl w-fit animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span className="font-mono">LX is analyzing campus food prep queues & dietary filters...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt(inputQuery)}
              placeholder="Ask LX: e.g. 'Healthy lunch under $8 near Science Quad'..."
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
            />
            <button
              onClick={() => handleSendPrompt(inputQuery)}
              disabled={isLoading || !inputQuery.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-bold text-xs hover:from-emerald-300 hover:to-teal-200 disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
            >
              <span>Ask LX</span>
              <Send className="w-3.5 h-3.5 text-slate-950" />
            </button>
          </div>

          {/* Bottom Banner */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400">
                <Zap className="w-3 h-3" /> Real-time Kitchen Sync
              </span>
              <span>• Allergen Safety Guards</span>
              <span>• Group Cart Compatible</span>
            </div>
            <button
              onClick={onOpenBookDemo}
              className="text-emerald-400 hover:underline font-mono text-[11px]"
            >
              Bring LX to Your University →
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
