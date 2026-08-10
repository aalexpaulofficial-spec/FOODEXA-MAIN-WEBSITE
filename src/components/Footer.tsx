import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-400" />
              <span className="text-xl font-bold tracking-tight text-white">FOODEXA</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              The smart campus food operating system. Connecting students, faculty, and institutions through technology.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4 text-sm">Platform</h4>
            <ul className="space-y-3">
              <li><a href="#students" className="text-sm text-slate-400 hover:text-white transition-colors">For Students</a></li>
              <li><a href="#platform" className="text-sm text-slate-400 hover:text-white transition-colors">For Faculty</a></li>
              <li><a href="#institutions" className="text-sm text-slate-400 hover:text-white transition-colors">For Institutions</a></li>
              <li><a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4 text-sm">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#faq" className="text-sm text-slate-400 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">Documentation <ArrowUpRight className="w-3 h-3" /></a></li>
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">API Status</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4 text-sm">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {currentYear} FOODEXA Technologies. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">Secure by Design</span>
            <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">Privacy First</span>
          </div>
        </div>
        
      </div>
    </footer>
  );
};