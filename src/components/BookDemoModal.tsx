import React, { useState } from 'react';
import { X, CheckCircle2, ArrowRight, Building2, Sparkles } from 'lucide-react';
import { DemoFormData } from '../types';

interface BookDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookDemoModal: React.FC<BookDemoModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<DemoFormData>({
    fullName: '',
    email: '',
    role: '',
    institutionName: '',
    campusStudentCount: '',
    preferredDate: '',
    notes: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Campus Demo</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Schedule a FOODEXA Demo
              </h3>
              <p className="text-xs text-slate-300">
                See how LX AI, smart lockers, and Express Queue Jumping transform campus dining halls.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Institutional / Work Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email address"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="text-xs font-semibold text-slate-300 mb-1 block">Your Role</label>
                 <select
                   value={formData.role}
                   onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                   className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                 >
                   <option value="">Select your role</option>
                   <option value="Institution Administrator">Institution Administrator</option>
                   <option value="Campus Director">Campus Director</option>
                   <option value="Food Court Manager">Food Court Manager</option>
                   <option value="Student Government">Student Government</option>
                 </select>
               </div>

               <div>
                 <label className="text-xs font-semibold text-slate-300 mb-1 block">University / Org Name</label>
                 <input
                   type="text"
                   required
                   value={formData.institutionName}
                   onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                   placeholder="Enter your university or organization name"
                   className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                 />
               </div>
              </div>

               <div>
                 <label className="text-xs font-semibold text-slate-300 mb-1 block">Student Population</label>
                 <select
                   value={formData.campusStudentCount}
                   onChange={(e) => setFormData({ ...formData, campusStudentCount: e.target.value })}
                   className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                 >
                   <option value="">Select student population</option>
                   <option value="Under 5,000 Students">Under 5,000 Students</option>
                   <option value="5,000 – 10,000 Students">5,000 – 10,000 Students</option>
                   <option value="10,000 – 25,000 Students">10,000 – 25,000 Students</option>
                   <option value="25,000+ Students">25,000+ Students</option>
                 </select>
               </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Notes / Specific Requirements</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="We would like to digitize campus food ordering, implement QR pickup, and manage multiple campus food courts with Foodexa."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <span>Confirm Demo Booking</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-white">Demo Request Confirmed!</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Thank you, <strong className="text-white">{formData.fullName}</strong>. A FOODEXA Campus Director will contact you at <strong className="text-emerald-300">{formData.email}</strong> within 24 hours to schedule your live demonstration for Christ University.
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
