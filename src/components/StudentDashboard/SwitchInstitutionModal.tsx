import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Building2, Loader2, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

interface SwitchInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitch: (code: string) => Promise<{ error: string | null }>;
  currentInstitutionName?: string;
}

export const SwitchInstitutionModal: React.FC<SwitchInstitutionModalProps> = ({
  isOpen,
  onClose,
  onSwitch,
  currentInstitutionName,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSwitch = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    const result = await onSwitch(code.trim());

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        onClose();
        setCode('');
        setSuccess(false);
      }, 1800);
    }
  };

  const handleClose = () => {
    setCode('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4" onClick={handleClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-[24px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Switch Institution</h3>
              {currentInstitutionName && (
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Currently: {currentInstitutionName}
                </p>
              )}
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Institution Switched!</h4>
              <p className="text-sm text-slate-500 mt-1">Refreshing your dashboard...</p>
            </motion.div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Institution Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
                  placeholder="e.g. YESHUA339537"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  disabled={loading}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSwitch(); }}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">{error}</p>
                </motion.div>
              )}

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Enter the Institution Code for the institution you want to switch to. Your account, order history, and profile will be preserved.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex gap-3 p-5 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSwitch}
              disabled={loading || !code.trim()}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {loading ? 'Switching...' : 'Switch Institution'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
