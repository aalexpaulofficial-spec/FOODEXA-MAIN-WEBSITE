import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface FinalCtaSectionProps {
  onOpenCreateAccount: () => void;
  onOpenLogin: () => void;
  onOpenRegisterInstitution: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onOpenCreateAccount, onOpenRegisterInstitution }) => {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-black mb-6">
          Ready to transform campus dining?
        </h2>
        <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">
          Join the institutions already using FOODEXA to serve thousands of students every day.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={onOpenCreateAccount} className="btn-primary flex items-center gap-2 cursor-pointer">
            Start using Foodexa <ArrowUpRight className="w-4 h-4" />
          </button>
          <button onClick={onOpenRegisterInstitution} className="btn-secondary flex items-center gap-2 cursor-pointer">
            Register Institution
          </button>
        </div>
      </div>
    </section>
  );
};
