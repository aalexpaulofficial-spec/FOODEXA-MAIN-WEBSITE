import React, { useEffect, useState } from 'react';

export const ScrollProgress: React.FC = () => {
  const [scrollPercentage, setScrollPercentage] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      if (documentHeight > 0) {
        const currentProgress = (window.scrollY / documentHeight) * 100;
        setScrollPercentage(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none bg-slate-950/40">
      <div
        className="h-full bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 transition-all duration-150 ease-out shadow-[0_0_12px_rgba(52,211,153,0.8)]"
        style={{ width: `${scrollPercentage}%` }}
      />
    </div>
  );
};
