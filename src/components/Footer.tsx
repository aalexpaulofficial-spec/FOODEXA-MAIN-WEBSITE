import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#f7f7f8] border-t border-gray-100 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <span className="text-lg font-bold tracking-tight text-black">FOODEXA</span>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              The smart campus food operating system. Connecting students, faculty, and institutions through technology.
            </p>
          </div>
          
          <div>
            <h4 className="text-black font-semibold mb-4 text-sm">Platform</h4>
            <ul className="space-y-3">
              <li><a href="#students" className="text-sm text-gray-400 hover:text-black transition-colors">For Students</a></li>
              <li><a href="#platform" className="text-sm text-gray-400 hover:text-black transition-colors">For Faculty</a></li>
              <li><a href="#institutions" className="text-sm text-gray-400 hover:text-black transition-colors">For Institutions</a></li>
              <li><a href="#pricing" className="text-sm text-gray-400 hover:text-black transition-colors">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-black font-semibold mb-4 text-sm">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#faq" className="text-sm text-gray-400 hover:text-black transition-colors">Help Center</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-black transition-colors flex items-center gap-1">Documentation <ArrowUpRight className="w-3 h-3" /></a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-black transition-colors">API Status</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-black font-semibold mb-4 text-sm">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-gray-400 hover:text-black transition-colors">About</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-black transition-colors">Privacy</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-black transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            © {currentYear} FOODEXA Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};