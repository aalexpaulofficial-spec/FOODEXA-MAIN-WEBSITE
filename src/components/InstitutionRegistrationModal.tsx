import React, { useState } from 'react';
import { X, CheckCircle2, ArrowRight, Building2, Loader2 } from 'lucide-react';
import type { InstitutionRequestInsert } from '../types';
import { supabase } from '../lib/supabase';

interface InstitutionRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface InstitutionFormData {
  institutionName: string;
  campus: string;
  city: string;
  state: string;
  country: string;
  institutionEmail: string;
  contactPerson: string;
  role: string;
  phoneNumber: string;
  institutionWebsite: string;
  studentPopulation: string;
  foodCourtsCount: string;
  vendorsCount: string;
  message: string;
  termsAgreed: boolean;
}

const INITIAL_FORM: InstitutionFormData = {
  institutionName: '',
  campus: '',
  city: '',
  state: '',
  country: 'India',
  institutionEmail: '',
  contactPerson: '',
  role: 'Institution Administrator',
  phoneNumber: '',
  institutionWebsite: '',
  studentPopulation: '5,000–10,000',
  foodCourtsCount: '2',
  vendorsCount: '8',
  message: '',
  termsAgreed: false,
};

const parseRequiredCount = (value: string, label: string): number => {
  const count = Number.parseInt(value, 10);

  if (!Number.isFinite(count) || count < 1) {
    throw new Error(`${label} must be at least 1.`);
  }

  return count;
};

export const InstitutionRegistrationModal: React.FC<InstitutionRegistrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<InstitutionFormData>(INITIAL_FORM);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAgreed) {
      setError('Please agree to Foodexa Terms & Conditions to proceed.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const institutionRequest: InstitutionRequestInsert = {
        institution_name: formData.institutionName.trim(),
        campus: formData.campus.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        institution_email: formData.institutionEmail.trim(),
        contact_person: formData.contactPerson.trim(),
        role: formData.role,
        phone_number: formData.phoneNumber.trim(),
        institution_website: formData.institutionWebsite.trim(),
        student_population: formData.studentPopulation,
        food_courts: parseRequiredCount(formData.foodCourtsCount, 'Food courts'),
        vendors: parseRequiredCount(formData.vendorsCount, 'Vendors'),
        message: formData.message.trim(),
        status: 'pending',
      };

      const { error: supabaseError } = await supabase
        .from('institution_requests')
        .insert([institutionRequest]);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleClose = () => {
    setSubmitted(false);
    setError(null);
    setFormData(INITIAL_FORM);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gray-50 border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80 text-[11px] font-mono">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Enterprise Partner Onboarding</span>
              </div>
              <h3 className="text-2xl font-extrabold text-black">
                Register Your Institution
              </h3>
              <p className="text-xs text-gray-600">
                Digitize your entire campus food court ecosystem with Foodexa AI &amp; Smart Pickups.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                {error}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Institution Name */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Institution Name <span className="text-black">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  placeholder="e.g. Christ (Deemed to be University)"
                  className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Campus */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Campus <span className="text-black">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.campus}
                  onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                  placeholder="e.g. Kengeri Campus"
                  className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* City */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  City <span className="text-black">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Bengaluru"
                  className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* State */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  State <span className="text-black">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g. Karnataka"
                  className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Country */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Country <span className="text-black">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="India"
                  className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Institution Email */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Institution Email <span className="text-black">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.institutionEmail}
                  onChange={(e) => setFormData({ ...formData, institutionEmail: e.target.value })}
                  placeholder="e.g. admin@christuniversity.in"
                  className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Contact Person <span className="text-black">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="e.g. Alex Paul"
                  className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Role */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Role <span className="text-black">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black focus:outline-none"
                >
                  <option value="Institution Administrator">Institution Administrator</option>
                  <option value="Campus Director">Campus Director</option>
                  <option value="Operations Manager">Operations Manager</option>
                  <option value="Dining Services">Dining Services</option>
                  <option value="Food Court Manager">Food Court Manager</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Phone Number <span className="text-black">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Institution Website */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Institution Website
                </label>
                <input
                  type="url"
                  value={formData.institutionWebsite}
                  onChange={(e) => setFormData({ ...formData, institutionWebsite: e.target.value })}
                  placeholder="e.g. https://christuniversity.in"
                  className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Student Population */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Student Population <span className="text-black">*</span>
                </label>
                <select
                  value={formData.studentPopulation}
                  onChange={(e) => setFormData({ ...formData, studentPopulation: e.target.value })}
                  className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black focus:outline-none"
                >
                  <option value="Below 1,000">Below 1,000</option>
                  <option value="1,000–5,000">1,000–5,000</option>
                  <option value="5,000–10,000">5,000–10,000</option>
                  <option value="10,000–25,000">10,000–25,000</option>
                  <option value="25,000+">25,000+</option>
                </select>
              </div>

              {/* Number of Food Courts & Vendors */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    Food Courts <span className="text-black">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.foodCourtsCount}
                    onChange={(e) => setFormData({ ...formData, foodCourtsCount: e.target.value })}
                    className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-3 py-2.5 text-xs text-black placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    Vendors <span className="text-black">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.vendorsCount}
                    onChange={(e) => setFormData({ ...formData, vendorsCount: e.target.value })}
                    className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-3 py-2.5 text-xs text-black placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                Message / Institution Requirements
              </label>
              <textarea
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe your campus dining layout, goals, or specific requirements..."
                className="w-full bg-white border border-gray-200 focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="agree-terms"
                required
                checked={formData.termsAgreed}
                onChange={(e) => setFormData({ ...formData, termsAgreed: e.target.checked })}
                className="w-4 h-4 rounded bg-white border-gray-200 text-black focus:ring-black"
              />
              <label htmlFor="agree-terms" className="text-xs text-gray-600 cursor-pointer">
                I agree to Foodexa Terms &amp; Conditions and Privacy Policy.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Submitting Registration…</span>
                </>
              ) : (
                <>
                  <span>Submit Registration</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>

          </form>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950 border border-black/50 flex items-center justify-center text-black shadow-xl">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-extrabold text-black">Registration Submitted Successfully.</h3>
            <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
              Our team will review your institution and contact you at <strong className="text-black">{formData.institutionEmail}</strong> to configure your customized campus portal.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:text-black"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
