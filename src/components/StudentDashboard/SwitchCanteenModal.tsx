import React, { useState, useEffect, useRef } from 'react';
import { X, Coffee, Loader2, CheckCircle2, AlertCircle, ArrowRight, Building2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import type { Canteen } from '../../types';

interface SwitchCanteenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (canteen: Canteen) => void;
  currentCanteenId?: string | null;
}

const isCanteenVisible = (canteen: any): boolean => {
  if (!canteen) return false;
  if ('is_active' in canteen) return canteen.is_active !== false;
  if ('available' in canteen) return canteen.available !== false;
  if ('availability' in canteen) return canteen.availability !== false;
  if ('status' in canteen) return !['inactive', 'disabled', 'archived', 'closed'].includes(String(canteen.status || '').toLowerCase());
  return true;
};

export const SwitchCanteenModal: React.FC<SwitchCanteenModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentCanteenId,
}) => {
  const [step, setStep] = useState<'code' | 'canteens'>('code');
  const [institutionCode, setInstitutionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [institutionName, setInstitutionName] = useState('');
  const [institutionCampus, setInstitutionCampus] = useState('');
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep('code');
    setInstitutionCode('');
    setError(null);
    setInstitutionName('');
    setInstitutionCampus('');
    setCanteens([]);
    setSelectingId(null);
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  const handleContinue = async () => {
    const code = institutionCode.trim().toUpperCase();
    if (!code) {
      setError('Please enter an institution code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Find institution by code
      const { data: instData, error: instError } = await supabase
        .from('institutions')
        .select('id, name, institution_name, campus, institution_code, status')
        .eq('institution_code', code)
        .maybeSingle();

      if (instError || !instData) {
        setError('That institution code was not found. Please check and try again.');
        setLoading(false);
        return;
      }

      if (instData.status && instData.status !== 'active') {
        setError('This institution is currently unavailable.');
        setLoading(false);
        return;
      }

      setInstitutionName(instData.institution_name || instData.name || '');
      setInstitutionCampus(instData.campus || '');

      // Step 2: Load active canteens for this institution
      const { data: canteenRows, error: canteenError } = await supabase
        .from('canteens')
        .select('*')
        .eq('institution_id', instData.id)
        .order('name', { ascending: true });

      if (canteenError) {
        console.error('[SwitchCanteen] Canteen fetch error:', canteenError.message);
        setError('Unable to load canteens. Please try again.');
        setLoading(false);
        return;
      }

      const visibleCanteens = (canteenRows || []).filter(isCanteenVisible).map((c: any) => ({
        ...c,
        is_active: c.is_active !== false,
        is_ordering_enabled: c.is_ordering_enabled ?? true,
        prep_time_minutes: Number(c.prep_time_minutes || 10),
        rating: Number(c.rating || 0),
      })) as Canteen[];

      if (visibleCanteens.length === 0) {
        setError('No active canteens available for this institution yet.');
        setLoading(false);
        return;
      }

      setCanteens(visibleCanteens);
      setStep('canteens');
      setLoading(false);
    } catch (err: any) {
      console.error('[SwitchCanteen] Error:', err);
      setError('Unable to connect to FOODEXA right now. Please try again.');
      setLoading(false);
    }
  };

  const handleSelectCanteen = (canteen: Canteen) => {
    setSelectingId(canteen.id);
    setTimeout(() => {
      onSelect(canteen);
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xl p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-lg bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h3 className="text-xl font-bold text-[#1D1D1F]">Switch Canteen</h3>
            <p className="text-xs text-[#86868B] mt-1 leading-relaxed">
              {step === 'code'
                ? 'Enter your institution/campus code to find available canteens.'
                : `Available Canteens`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#F5F5F7] text-[#86868B] hover:bg-[#E8E8ED] hover:text-[#1D1D1F] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {step === 'code' ? (
              <motion.div
                key="code-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-semibold text-[#86868B] mb-1.5 block">Institution Code</label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={institutionCode}
                      onChange={(e) => { setInstitutionCode(e.target.value.toUpperCase()); setError(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && institutionCode.trim()) handleContinue(); }}
                      placeholder="e.g. YAWEH814660"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F7] border-0 text-[#1D1D1F] text-sm font-mono font-bold focus:ring-2 focus:ring-[#0066CC] focus:bg-white transition-all placeholder:text-[#86868B] placeholder:font-normal"
                      disabled={loading}
                    />
                    {loading && (
                      <Loader2 className="w-4 h-4 animate-spin text-black absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 p-3 rounded-xl bg-[#FFF0F0] border border-[#FFD6D6]"
                  >
                    <AlertCircle className="w-4 h-4 text-[#FF3B30] shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-[#FF3B30]">{error}</p>
                  </motion.div>
                )}

                <button
                  onClick={handleContinue}
                  disabled={!institutionCode.trim() || loading}
                  className="w-full py-3.5 rounded-2xl bg-[#1D1D1F] text-white text-sm font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Finding Canteens...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="canteens-step"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Institution context */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F5F5F7] text-xs">
                  <Building2 className="w-3.5 h-3.5 text-[#0066CC] shrink-0" />
                  <span className="text-[#1D1D1F] font-semibold truncate">
                    {institutionName}
                    {institutionCampus && <span className="text-[#86868B] font-normal"> &middot; {institutionCampus}</span>}
                  </span>
                </div>

                {/* Canteen list */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {canteens.map((canteen) => (
                    <button
                      key={canteen.id}
                      onClick={() => handleSelectCanteen(canteen)}
                      disabled={selectingId !== null}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                        selectingId === canteen.id
                          ? 'bg-[#E8F5E9] border-2 border-[#30D158] scale-[0.98]'
                          : 'bg-white border border-[#E2E8F0] hover:bg-[#F5F5F7] hover:border-[#D1D5DB]'
                      } ${currentCanteenId === canteen.id ? 'ring-2 ring-[#0066CC] ring-offset-1' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center shrink-0">
                        <Coffee className="w-5 h-5 text-[#1D1D1F]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#1D1D1F] truncate">{canteen.name}</p>
                          {currentCanteenId === canteen.id && (
                            <span className="px-1.5 py-0.5 bg-[#0066CC] text-white text-[9px] font-bold rounded-md shrink-0">CURRENT</span>
                          )}
                        </div>
                        {canteen.location && (
                          <p className="text-[11px] text-[#86868B] truncate mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {canteen.location}
                          </p>
                        )}
                      </div>
                      {canteen.is_ordering_enabled ? (
                        <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#30D158] text-[10px] font-bold rounded-full shrink-0">
                          Open
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#F5F5F7] text-[#86868B] text-[10px] font-bold rounded-full shrink-0">
                          Closed
                        </span>
                      )}
                      {selectingId === canteen.id && (
                        <CheckCircle2 className="w-5 h-5 text-[#30D158] shrink-0 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Back button */}
                <button
                  onClick={() => { setStep('code'); setError(null); setCanteens([]); }}
                  disabled={selectingId !== null}
                  className="w-full py-3 rounded-2xl border border-[#E2E8F0] bg-[#F5F5F7] text-sm font-bold text-[#1D1D1F] hover:bg-[#E8E8ED] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Use Different Code
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
