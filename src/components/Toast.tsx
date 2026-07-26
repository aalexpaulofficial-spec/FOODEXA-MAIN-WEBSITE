import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Sparkles, ShoppingBag, Mic } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info' | 'ai';
  title: string;
  description: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'ai':
        return <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-teal-400 shrink-0" />;
    }
  };

  return (
    <div className="pointer-events-auto bg-slate-900/95 border border-slate-800 shadow-2xl rounded-2xl p-4 flex items-start gap-3 text-white backdrop-blur-xl animate-in slide-in-from-top-5 duration-300 border-l-4 border-l-emerald-400">
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 space-y-0.5">
        <h4 className="text-xs font-bold text-white">{toast.title}</h4>
        <p className="text-[11px] text-slate-300 leading-relaxed">{toast.description}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
