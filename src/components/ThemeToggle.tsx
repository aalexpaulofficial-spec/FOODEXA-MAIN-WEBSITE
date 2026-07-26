import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { id: ThemeMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'light', label: 'Light Mode', icon: Sun },
    { id: 'dark', label: 'Dark Mode', icon: Moon },
    { id: 'system', label: 'System Default', icon: Laptop },
  ];

  const CurrentIcon = resolvedTheme === 'light' ? Sun : Moon;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/50 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center shadow-sm"
        title={`Theme: ${theme.toUpperCase()} (${resolvedTheme} active)`}
        aria-label="Toggle Theme"
      >
        <CurrentIcon className="w-4 h-4 text-emerald-400 transition-transform duration-300 transform hover:scale-110" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-1.5 space-y-0.5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1">
            Appearance
          </div>

          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.id;

            return (
              <button
                key={option.id}
                onClick={() => {
                  setTheme(option.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{option.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
