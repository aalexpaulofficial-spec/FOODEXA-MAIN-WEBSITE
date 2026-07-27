import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Mic, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenBookDemo: () => void;
  onOpenLxDrawer: () => void;
  onOpenVoiceModal: () => void;
  onOpenLogin: () => void;
  onOpenDownload: () => void;
  onOpenGetStarted: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBookDemo,
  onOpenLxDrawer,
  onOpenVoiceModal,
  onOpenLogin,
  onOpenDownload,
  onOpenGetStarted,
}) => {
  const { user, profile, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowProfile(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const displayName = profile?.full_name || user?.email || 'Guest';
  const displayRole = profile?.role || 'guest';
  const roleLabel = displayRole === 'student' ? 'Student' : displayRole === 'faculty' ? 'Faculty' : 'Guest';
  const roleColor = displayRole === 'student' ? 'text-emerald-400' : displayRole === 'faculty' ? 'text-blue-400' : 'text-amber-400';

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
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 py-3 shadow-2xl'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2">
          
          {/* Logo & Brand */}
          <a href="#" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <span className="font-extrabold text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                  FX
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                FOODEXA
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-wider uppercase text-slate-400 font-mono -mt-1">
                Campus Dining AI
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-900/60 border border-slate-800/80 rounded-full px-4 py-1.5 backdrop-blur-md">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-full transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-full transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-extrabold text-[10px]">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-200">{displayName}</span>
                  <span className={`text-[10px] font-mono font-bold ${roleColor}`}>{roleLabel}</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={onOpenLogin}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={onOpenGetStarted}
                  className="relative group inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/35 cursor-pointer shrink-0"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/95 border-b border-slate-800 px-6 py-6 mt-3 space-y-4 backdrop-blur-2xl">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm text-slate-300 hover:text-emerald-400 font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 text-white py-2.5 rounded-xl text-xs font-medium">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-extrabold text-[10px]">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{displayName}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="flex items-center justify-center gap-1.5 bg-slate-900 border border-slate-700 text-white py-2.5 rounded-xl text-xs font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="flex items-center justify-center gap-1.5 bg-slate-900 border border-slate-700 text-white py-2.5 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenVoiceModal();
                  }}
                  className="flex items-center justify-center gap-1.5 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 py-2.5 rounded-xl text-xs font-mono font-bold cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Voice LX
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBookDemo();
                  }}
                  className="flex items-center justify-center gap-1.5 bg-slate-900 border border-slate-700 text-white py-2.5 rounded-xl text-xs font-medium"
                >
                  Book Demo
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenGetStarted();
                  }}
                  className="col-span-2 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 py-2.5 rounded-xl text-xs font-bold"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

