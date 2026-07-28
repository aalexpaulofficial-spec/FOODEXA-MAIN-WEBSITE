import React, { useState } from 'react';
import { X, Sparkles, Send, Loader2, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { LXChatMessage } from '../types';


interface LxChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBookDemo: () => void;
}

export const LxChatDrawer: React.FC<LxChatDrawerProps> = ({ isOpen, onClose, onOpenBookDemo }) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<LXChatMessage[]>([
    {
      id: 'drawer-welcome-1',
      sender: 'lx',
      text: "✨ **LX AI Assistant Live:**\n\nAsk me anything! Meal suggestions, campus wait times, dietary filters (high protein, vegan, allergen-free), or how Express Pickup works.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  if (!isOpen) return null;

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: LXChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
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
          prompt: text,
          conversationHistory: messages.map((m) => ({ role: m.sender, content: m.text }))
        }),
      });

      const data = await response.json();
      const lxAnswerText = data.answer || "LX is optimizing campus food queues!";

      const lxMsg: LXChatMessage = {
        id: `lx-${Date.now()}`,
        sender: 'lx',
        text: lxAnswerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, lxMsg]);
    } catch (err) {
      console.error("Error querying LX:", err);
      const errorMsg: LXChatMessage = {
        id: `lx-err-${Date.now()}`,
        sender: 'lx',
        text: "⚠️ **LX is temporarily unavailable.**\n\nPlease try again later or check that the GEMINI_API_KEY is configured on the server.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Ask LX</h3>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-800">
                  FOODEXA AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Campus Dining Assistant</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[ 'Find me high protein meals under ₹300', 'What is the shortest line right now?', 'Start a group cart for my dorm', 'Show me vegan options near Library' ].map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(promptText)}
              disabled={isLoading}
              className="shrink-0 text-[11px] bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-200 px-2.5 py-1 rounded-xl transition-all"
            >
              "{promptText}"
            </button>
          ))}
        </div>

        {/* Chat Stream Messages */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'lx' && (
                <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400 mt-0.5 text-xs">
                  ✨
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none whitespace-pre-line'
                }`}
              >
                {msg.text}
                <div className="text-[9px] text-slate-500 mt-1 font-mono text-right">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-xl w-fit animate-pulse font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>LX is processing...</span>
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputQuery)}
              placeholder="Ask LX: e.g. 'Vegan iced matcha nearby'..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              onClick={() => handleSend(inputQuery)}
              disabled={isLoading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-bold hover:from-emerald-300 disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-slate-950" />
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenBookDemo();
            }}
            className="w-full text-[11px] text-slate-400 hover:text-emerald-300 text-center font-mono hover:underline"
          >
            Want LX at your university? Book a Campus Demo →
          </button>
        </div>

      </div>
    </div>
  );
};
