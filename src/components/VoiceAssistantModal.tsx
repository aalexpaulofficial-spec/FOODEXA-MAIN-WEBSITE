import React, { useState, useEffect } from 'react';
import { X, Mic, MicOff, Sparkles, CheckCircle2, Search, ShoppingBag, Radio, ArrowRight, Volume2 } from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerToast: (title: string, desc: string, type?: 'success' | 'ai' | 'info') => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'recognized' | 'searching' | 'success';

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onTriggerToast,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [activeCommand, setActiveCommand] = useState<string>('');
  const [transcriptResult, setTranscriptResult] = useState<string>('');
  const [matchedItem, setMatchedItem] = useState<{ name: string; price: string; location: string } | null>(null);

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
      setVoiceState('idle');
      setActiveCommand('');
      setTranscriptResult('');
      setMatchedItem(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateCommand = (command: string) => {
    setActiveCommand(command);
    setVoiceState('listening');

    // State sequence simulation
    setTimeout(() => {
      setVoiceState('processing');
      setTranscriptResult(`"${command}"`);
    }, 1500);

    setTimeout(() => {
      setVoiceState('recognized');
    }, 2800);

    setTimeout(() => {
      setVoiceState('searching');
      if (command.toLowerCase().includes('dosa')) {
        setMatchedItem({ name: 'Crispy Masala Dosa', price: '₹90', location: 'Counter A - South Canteen' });
      } else if (command.toLowerCase().includes('burger')) {
        setMatchedItem({ name: 'Grilled Chicken Burger', price: '₹140', location: 'Counter C - Fast Food Hub' });
      } else if (command.toLowerCase().includes('coffee')) {
        setMatchedItem({ name: 'Iced Cold Coffee', price: '₹70', location: 'Counter B - Cafe Express' });
      } else {
        setMatchedItem({ name: 'Special Combo Thali', price: '₹150', location: 'Main Food Court' });
      }
    }, 4000);

    setTimeout(() => {
      setVoiceState('success');
      onTriggerToast(
        'Voice Command Recognized',
        `LX added "${command}" to your Express Cart!`,
        'ai'
      );
    }, 5200);
  };

  const handleStartListening = () => {
    const randomCommand = exampleCommands[Math.floor(Math.random() * exampleCommands.length)];
    handleSimulateCommand(randomCommand);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LX Voice Intelligence</span>
            <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/60">
              Powered by Google Gemini
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-white">Talk to LX</h3>
          <p className="text-xs text-slate-300">Order food naturally using your voice.</p>
        </div>

        {/* Interactive Microphone Stage */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 text-center space-y-4 relative overflow-hidden">
          
          <div className="relative inline-flex items-center justify-center">
            {/* Outer pulsating rings when active */}
            {(voiceState === 'listening' || voiceState === 'processing') && (
              <>
                <div className="absolute w-28 h-28 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="absolute w-36 h-36 rounded-full bg-teal-500/10 animate-pulse" />
              </>
            )}

            <button
              onClick={handleStartListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl ${
                voiceState === 'listening'
                  ? 'bg-gradient-to-tr from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 scale-110 shadow-emerald-500/50'
                  : voiceState === 'success'
                  ? 'bg-emerald-500 text-slate-950 scale-105'
                  : 'bg-slate-900 border-2 border-emerald-500/50 hover:border-emerald-400 text-emerald-400 hover:scale-105'
              }`}
            >
              <Mic className={`w-8 h-8 ${voiceState === 'listening' ? 'animate-bounce' : ''}`} />
            </button>
          </div>

          {/* Status Label & Waveform Animation */}
          <div className="space-y-2">
            <div className="inline-block px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-semibold text-emerald-300">
              {voiceState === 'idle' && 'Tap mic or select an example below'}
              {voiceState === 'listening' && '🎤 Listening to your voice...'}
              {voiceState === 'processing' && '⚡ Processing speech...'}
              {voiceState === 'recognized' && '✨ Voice recognized!'}
              {voiceState === 'searching' && '🔎 Searching campus menus...'}
              {voiceState === 'success' && '✔ Order added to Express Cart!'}
            </div>

            {/* Waveform graphic while listening/processing */}
            {(voiceState === 'listening' || voiceState === 'processing') && (
              <div className="flex items-center justify-center gap-1.5 h-8 pt-1">
                {[40, 75, 20, 90, 50, 100, 30, 80, 45, 60].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-emerald-500 to-teal-300 rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Recognized text preview */}
            {transcriptResult && (
              <p className="text-xs text-slate-300 font-mono italic bg-slate-900/90 py-1.5 px-3 rounded-xl border border-slate-800 max-w-sm mx-auto">
                {transcriptResult}
              </p>
            )}

            {/* Matched item display */}
            {matchedItem && voiceState === 'success' && (
              <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-2xl p-3 flex items-center justify-between text-left mt-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">
                    Added to Express Pickup
                  </span>
                  <h4 className="text-xs font-bold text-white">{matchedItem.name}</h4>
                  <p className="text-[10px] text-slate-400">{matchedItem.location}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-300 font-mono">{matchedItem.price}</span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Example Commands Clickable List */}
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Try clicking an example voice query:</span>
          </p>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {exampleCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleSimulateCommand(cmd)}
                className="text-left text-[11px] bg-slate-950 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-200 p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
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
