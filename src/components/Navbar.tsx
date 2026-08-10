import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, LogOut, Building2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenBookDemo: () => void;
  onOpenLxDrawer: () => void;
  onOpenVoiceModal: () => void;
  onOpenLogin: () => void;
  onOpenDownload: () => void;
  onOpenGetStarted: () => void;
  onOpenInstitutionLogin?: () => void;
  onOpenRegisterInstitution?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBookDemo,
  onOpenGetStarted,
  onOpenLogin,
  onOpenInstitutionLogin,
  onOpenRegisterInstitution
}) => {
  const { user, profile, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const displayName = profile?.full_name || user?.email || 'Guest';
  const displayRole = profile?.role || null;
  const roleLabel = displayRole === 'student' ? 'Student' : displayRole === 'faculty' ? 'Faculty' : displayRole === 'guest' ? 'Guest' : displayRole === 'institution_admin' ? 'Institution Admin' : displayRole === 'kitchen_staff' ? 'Kitchen Staff' : displayRole === 'canteen_manager' ? 'Canteen Manager' : displayRole === 'super_admin' ? 'Super Admin' : 'Role pending';
  
  const navLinks = [
    { label: 'Platform', href: '#platform' },
    { label: 'For Students', href: '#students' },
    { label: 'For Campus', href: '#institutions' },
    { label: 'Analytics', href: '#analytics' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Impact', href: '#impact' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-slate-950/70 backdrop-blur-2xl border-b border-slate-800/50 py-4 shadow-sm' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        <a href="#" className="flex items-center gap-2 group shrink-0">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-400" />
            FOODEXA
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          
          {user ? (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white leading-none">{displayName}</span>
                  <span className="text-[9px] text-slate-400 leading-none mt-0.5">{roleLabel}</span>
                </div>
              </div>
              <button className="px-4 py-2 rounded-full text-xs font-bold text-slate-950 bg-white hover:bg-slate-200 transition-colors cursor-pointer">
                Open Dashboard
              </button>
              <button onClick={() => signOut()} className="p-2 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={onOpenLogin} className="px-4 py-2 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer">
                Student Login
              </button>
              {onOpenInstitutionLogin && (
                <button onClick={onOpenInstitutionLogin} className="px-4 py-2 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer">
                  Institution Login
                </button>
              )}
              <button onClick={onOpenGetStarted} className="px-5 py-2 rounded-full text-xs font-bold text-slate-950 bg-white hover:bg-slate-200 transition-all cursor-pointer">
                Create Account
              </button>
            </div>
          )}
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-slate-950 border-b border-slate-800 p-6 space-y-4 shadow-2xl">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-300">
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            {!user ? (
              <>
                <button onClick={() => { setMobileMenuOpen(false); onOpenGetStarted(); }} className="w-full py-3 rounded-xl bg-white text-slate-950 font-bold text-sm">Create Account</button>
                <button onClick={() => { setMobileMenuOpen(false); onOpenLogin(); }} className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-sm">Student Login</button>
                {onOpenRegisterInstitution && (
                  <button onClick={() => { setMobileMenuOpen(false); onOpenRegisterInstitution(); }} className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-sm">Register Institution</button>
                )}
              </>
            ) : (
              <>
                <button className="w-full py-3 rounded-xl bg-white text-slate-950 font-bold text-sm">Open Dashboard</button>
                <button onClick={() => { setMobileMenuOpen(false); signOut(); }} className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-red-400 font-bold text-sm">Sign Out</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
