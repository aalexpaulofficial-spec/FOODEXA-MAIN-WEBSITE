import React, { useState, useEffect } from 'react';
import { X, Mic, Sparkles, ArrowRight, Volume2, Loader2 } from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerToast: (title: string, desc: string, type?: 'success' | 'ai' | 'info') => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onTriggerToast,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exampleCommands = [
    "I want a chicken burger.",
    "Show today's vegetarian meals.",
    "Order one masala dosa.",
    "Add a cold coffee.",
    "Show offers under ₹200.",
    "What is available at Counter B?",
    "Track my current order.",
    "Repeat my previous order.",
  ];

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResponse(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAskLx = async (text: string) => {
    setQuery(text);
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const res = await fetch('/api/ask-lx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'LX is unavailable');
      setResponse(data.answer);
      onTriggerToast('LX Response', 'Your query was answered by LX AI!', 'ai');
    } catch (err: any) {
      setError(err.message || 'Failed to reach LX. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden">
        
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LX Voice Intelligence</span>
            <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/60">
              Powered by Google Gemini
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-white">Talk to LX</h3>
          <p className="text-xs text-slate-300">Ask LX about campus food, orders, or recommendations.</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
          
          <div className="relative inline-flex items-center justify-center">
            <button
              disabled={loading}
              className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl bg-slate-900 border-2 border-emerald-500/50 hover:border-emerald-400 text-emerald-400 hover:scale-105"
            >
              <Mic className="w-8 h-8" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskLx(query)}
              placeholder="Type your question for LX..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none text-center"
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-mono">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>LX is processing your request...</span>
            </div>
          )}

          {response && (
            <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-2xl p-4 text-left mt-2">
              <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">{response}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-950/60 border border-red-500/40 rounded-2xl p-3 text-left mt-2">
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Try an example query:</span>
          </p>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {exampleCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleAskLx(cmd)}
                disabled={loading}
                className="text-left text-[11px] bg-slate-950 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-200 p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between group disabled:opacity-50"
              >
                <span>"{cmd}"</span>
                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          Close Voice Assistant
        </button>

      </div>
    </div>
  );
};
