import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  onOpenBookDemo: () => void;
  onOpenLxDrawer: () => void;
  onOpenVoiceModal: () => void;
  onOpenLogin: () => void;
  onOpenDownload: () => void;
  onOpenGetStarted: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLogin,
  onOpenGetStarted
}) => {
  const { user, profile, directSession } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="text-xl font-bold tracking-tight text-black flex items-center gap-1.5">
            FOODEXA
          </span>
        </div>

        {/* Center Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-8">
          <a href="#students" className="nav-link">For Students</a>
          <a href="#platform" className="nav-link">For Faculty</a>
          <a href="#institutions" className="nav-link">Institutions</a>
          <a href="#analytics" className="nav-link">Analytics</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#faq" className="nav-link">FAQ</a>
        </div>

        {/* Auth CTA */}
        <div className="flex items-center gap-4">
          {(user && profile) || directSession ? (
            <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium text-black">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 overflow-hidden shrink-0">
                {user && profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-bold bg-blue-600">
                    {(user && profile?.full_name?.charAt(0).toUpperCase()) || directSession?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <span className="hidden sm:inline">Dashboard</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
            </button>
          ) : (
            <>
              <button onClick={onOpenLogin} className="hidden sm:flex items-center gap-1.5 nav-link">
                Log in
              </button>
              <button onClick={onOpenGetStarted} className="btn-primary flex items-center gap-1.5">
                Start using Foodexa <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
