import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { LxPlayground } from './components/LxPlayground';
import { MeetLxSection } from './components/MeetLxSection';
import { PlatformFeatures } from './components/PlatformFeatures';
import { ForStudents } from './components/ForStudents';
import { ForInstitutions } from './components/ForInstitutions';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { RoiCalculator } from './components/RoiCalculator';
import { ImpactSustainability } from './components/ImpactSustainability';
import { Pricing } from './components/Pricing';
import { Faq } from './components/Faq';
import { BookDemoModal } from './components/BookDemoModal';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { InstitutionRegistrationModal } from './components/InstitutionRegistrationModal';
import { AuthModal } from './components/AuthModal';
import { StudentPortalModal } from './components/StudentPortalModal';
import { InstitutionDashboardModal } from './components/InstitutionDashboardModal';
import { KitchenDashboardModal } from './components/KitchenDashboardModal';
import { SuperAdminDashboardModal } from './components/SuperAdminDashboardModal';
import { DownloadModal } from './components/DownloadModal';
import { PortalAccessModal } from './components/PortalAccessModal';
import { LxChatDrawer } from './components/LxChatDrawer';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ScrollProgress } from './components/ScrollProgress';
import { Footer } from './components/Footer';
import { Sparkles, Mic } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import type { Profile, UserRole } from './types';

export default function App() {
  const { user, profile, session, isEmailVerified, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const restoredDashboardRef = useRef(false);
  const [isBookDemoOpen, setIsBookDemoOpen] = useState(false);
  const [isInstitutionRegistrationOpen, setIsInstitutionRegistrationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'create'>('login');
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isPortalAccessOpen, setIsPortalAccessOpen] = useState(false);
  const [isLxDrawerOpen, setIsLxDrawerOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isStudentPortalOpen, setIsStudentPortalOpen] = useState(false);
  const [isInstitutionDashboardOpen, setIsInstitutionDashboardOpen] = useState(false);
  const [isKitchenDashboardOpen, setIsKitchenDashboardOpen] = useState(false);
  const [isSuperAdminDashboardOpen, setIsSuperAdminDashboardOpen] = useState(false);
  const [isRoleSelectionOpen, setIsRoleSelectionOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty' | 'guest'>('student');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const roleFromQuery = queryParams.get('role') as 'student' | 'faculty' | 'guest' | null;

  const addToast = (title: string, description: string, type: 'success' | 'warning' | 'info' | 'ai' = 'info') => {
    const newToast: ToastMessage = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      type,
      title,
      description,
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

   const closeDashboards = () => {
     setIsStudentPortalOpen(false);
     setIsInstitutionDashboardOpen(false);
     setIsKitchenDashboardOpen(false);
     setIsSuperAdminDashboardOpen(false);
   };

   const openDashboardForProfile = (liveProfile: Profile) => {
     closeDashboards();
     const role = liveProfile.role;
     setCurrentUserRole(role);
     if (role === 'institution_admin') {
       setIsInstitutionDashboardOpen(true);
     } else if (role === 'kitchen_staff' || role === 'canteen_manager') {
       setIsKitchenDashboardOpen(true);
     } else if (role === 'super_admin') {
       setIsSuperAdminDashboardOpen(true);
     } else {
       setIsStudentPortalOpen(true);
     }
   };

// Enforce email verification: redirect unverified users to /verify-otp
// Never redirect away from dashboard paths to prevent race conditions after OTP
    const isDashboardPath = (path: string) =>
      path === '/student-dashboard' || path === '/student/dashboard' ||
      path === '/institution/dashboard' || path === '/kitchen/dashboard' || path === '/admin/dashboard';

    useEffect(() => {
      if (authLoading) return;
      if (!session) return;

      if (!isEmailVerified && !isDashboardPath(location.pathname) && location.pathname !== '/verify-otp' && location.pathname !== '/create-account') {
        navigate('/verify-otp', { replace: true });
      }
    }, [authLoading, session, isEmailVerified, location.pathname, navigate]);

// Redirect authenticated users away from public pages
    useEffect(() => {
      if (authLoading) return;
      if (!user || !profile) return;
      if (!isEmailVerified) return;

      const path = location.pathname;
      const dashboardRoute = getDashboardRoute(profile.role);

      const publicPaths = ['/', '/login', '/create-account', '/student-login', '/institution-login'];
      const isPublicPath = publicPaths.includes(path) || (path.endsWith('/register') && !path.includes('/dashboard'));
      
      if (isPublicPath) {
        if (dashboardRoute) {
          navigate(dashboardRoute, { replace: true });
        }
      } else if (path === '/verify-otp') {
        return;
      } else if (path === '/student-dashboard' || path === '/student/dashboard') {
        return;
      }
    }, [authLoading, user, profile, isEmailVerified, location.pathname, navigate]);

  const getDashboardRoute = (role: UserRole | null): string | null => {
    if (role === 'student') return '/student-dashboard';
    if (role === 'faculty') return '/student-dashboard';
    if (role === 'guest') return '/student-dashboard';
    if (role === 'institution_admin') return '/institution/dashboard';
    if (role === 'kitchen_staff' || role === 'canteen_manager') return '/kitchen/dashboard';
    if (role === 'super_admin') return '/admin/dashboard';
    return null;
  };

   // Route-based initialization: handle URL on mount
   useEffect(() => {
     if (authLoading) return;
     const path = location.pathname;
     const role = roleFromQuery;

     if (path === '/create-account') {
       const savedRole = sessionStorage.getItem('foodexa_role');
       const roleToUse = roleFromQuery || savedRole;

       if (roleToUse && ['student', 'faculty', 'guest'].includes(roleToUse)) {
         setIsRoleSelectionOpen(false);
         setSelectedRole(roleToUse as any);
         setAuthInitialMode('create');
         setIsAuthOpen(true);
       } else {
         setIsRoleSelectionOpen(true);
         setIsAuthOpen(false);
       }
      } else if (path === '/verify-otp') {
        setIsRoleSelectionOpen(false);
        if (!session || isEmailVerified) {
          navigate('/', { replace: true });
        } else {
          setIsAuthOpen(true);
        }
     } else if (path === '/student-login') {
       setIsRoleSelectionOpen(false);
       setAuthInitialMode('login');
       setIsAuthOpen(true);
     } else if (path === '/institution-login') {
       setIsRoleSelectionOpen(false);
       setAuthInitialMode('login');
       setIsAuthOpen(true);
      } else if (path === '/student-dashboard' || path === '/student/dashboard') {
        setIsRoleSelectionOpen(false);
        setIsAuthOpen(false);
        if (!session || !isEmailVerified) {
          navigate('/', { replace: true });
        } else if (!profile && !authLoading) {
          navigate('/', { replace: true });
        }
     } else if (path === '/student/register') {
       setIsRoleSelectionOpen(false);
       setSelectedRole('student');
       setAuthInitialMode('create');
       setIsAuthOpen(true);
     } else if (path === '/faculty/register') {
       setIsRoleSelectionOpen(false);
       setSelectedRole('faculty');
       setAuthInitialMode('create');
       setIsAuthOpen(true);
     } else if (path === '/guest/register') {
       setIsRoleSelectionOpen(false);
       setSelectedRole('guest');
       setAuthInitialMode('create');
       setIsAuthOpen(true);
     } else if (path === '/login') {
       setIsRoleSelectionOpen(false);
       setAuthInitialMode('login');
       setIsAuthOpen(true);
     }
   }, [authLoading, session, isEmailVerified, profile, location.pathname, location.search, roleFromQuery, navigate]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      restoredDashboardRef.current = false;
      setCurrentUserRole(null);
      closeDashboards();
      return;
    }

    if (!isEmailVerified) {
      closeDashboards();
      return;
    }

    if (!profile) return;

    // Only auto-restore dashboard when on a dashboard path or when modals are not visible
    const isOnDashboardPath = isDashboardPath(location.pathname);
    if (isOnDashboardPath && !restoredDashboardRef.current) {
      restoredDashboardRef.current = true;
      openDashboardForProfile(profile);
    }
  }, [authLoading, user, profile, isEmailVerified, isAuthOpen, location.pathname]);

  const handleOpenLogin = () => {
    setIsRoleSelectionOpen(false);
    setIsPortalAccessOpen(false);
    setAuthInitialMode('login');
    setIsAuthOpen(true);
    if (location.pathname !== '/login') {
      navigate('/login', { replace: false });
    }
  };

  const handleOpenCreateAccount = (role: 'student' | 'faculty' | 'guest') => {
    setSelectedRole(role);
    setAuthInitialMode('create');
    setIsAuthOpen(true);
    setIsPortalAccessOpen(false);
  };

  const handleOpenStudentRegister = () => {
    setIsAuthOpen(false);
    setIsPortalAccessOpen(false);
    setIsRoleSelectionOpen(true);
    if (location.pathname !== '/create-account') {
      navigate('/create-account', { replace: false });
    }
  };

  const handleRoleSelected = (role: 'student' | 'faculty' | 'guest') => {
    sessionStorage.setItem('foodexa_role', role);
    setIsRoleSelectionOpen(false);
    setAuthInitialMode('create');
    setIsAuthOpen(true);
    setSelectedRole(role);
    const registerRoute = `/create-account?role=${role}`;
    if (location.pathname + location.search !== registerRoute) {
      navigate(registerRoute, { replace: true });
    }
  };

  const handleSelectPrompt = (promptText: string) => {
    setActivePrompt(promptText);
    addToast('LX Recommendation Selected', `Prompt loaded into LX playground: "${promptText}"`, 'ai');
    const playgroundElem = document.getElementById('lx-playground');
    if (playgroundElem) {
      playgroundElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Scroll Progress Indicator */}
      <ScrollProgress />

      {/* Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Sticky Navigation Bar */}
      <Navbar
        onOpenBookDemo={() => setIsBookDemoOpen(true)}
        onOpenLxDrawer={() => setIsLxDrawerOpen(true)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenLogin={handleOpenLogin}
        onOpenDownload={() => setIsDownloadOpen(true)}
        onOpenGetStarted={handleOpenStudentRegister}
      />

      {/* Main Content Sections */}
      <main>
        <Hero
          onOpenBookDemo={() => setIsBookDemoOpen(true)}
          onOpenLxDrawer={() => setIsLxDrawerOpen(true)}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onOpenLogin={handleOpenLogin}
          onOpenDownload={() => setIsDownloadOpen(true)}
          onOpenGetStarted={handleOpenStudentRegister}
          onOpenRegisterInstitution={() => setIsInstitutionRegistrationOpen(true)}
          onOpenCreateAccount={handleOpenStudentRegister}
          onSelectPrompt={handleSelectPrompt}
        />

        <LxPlayground
          initialPrompt={activePrompt}
          onOpenBookDemo={() => setIsBookDemoOpen(true)}
        />

        {/* Meet LX - AI Experience, Voice Ordering, Context Cards, Feature Grid & Dashboard Preview */}
        <MeetLxSection
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onOpenLxDrawer={() => setIsLxDrawerOpen(true)}
        />

        <PlatformFeatures
          onOpenBookDemo={() => setIsBookDemoOpen(true)}
          onOpenLxDrawer={() => setIsLxDrawerOpen(true)}
        />

        <ForStudents
          onOpenLxDrawer={() => setIsLxDrawerOpen(true)}
        />

        <ForInstitutions
          onOpenBookDemo={() => setIsBookDemoOpen(true)}
          onOpenInstitutionRegister={() => setIsInstitutionRegistrationOpen(true)}
        />

        <AnalyticsDashboard />

        <RoiCalculator
          onOpenBookDemo={() => setIsBookDemoOpen(true)}
        />

        <ImpactSustainability />

        <Pricing
          onOpenBookDemo={() => setIsBookDemoOpen(true)}
          onOpenLxDrawer={() => setIsLxDrawerOpen(true)}
        />

        <Faq />
      </main>

      {/* Footer */}
      <Footer
        onOpenBookDemo={() => setIsBookDemoOpen(true)}
        onOpenLxDrawer={() => setIsLxDrawerOpen(true)}
      />

      {/* Floating Corner Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {/* Floating Mic Button */}
        <button
          onClick={() => setIsVoiceModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 border-2 border-emerald-500 text-emerald-300 font-bold text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
          title="Talk to LX Voice"
        >
          <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">Talk to LX</span>
        </button>

        {/* Floating Ask LX AI Button */}
        <button
          onClick={() => setIsLxDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-emerald-300"
        >
          <Sparkles className="w-4 h-4 text-slate-950 animate-bounce" />
          <span>Ask LX</span>
        </button>
      </div>

      {/* Modals & Slide-over Drawers */}
      <BookDemoModal
        isOpen={isBookDemoOpen}
        onClose={() => {
          setIsBookDemoOpen(false);
          addToast('Demo Booked Successfully', 'A Foodexa campus representative will reach out within 24 hours.', 'success');
        }}
      />

      <InstitutionRegistrationModal
        isOpen={isInstitutionRegistrationOpen}
        onClose={() => {
          setIsInstitutionRegistrationOpen(false);
          addToast('Institution Registration Submitted', 'Your university application is pending admin review.', 'success');
        }}
      />

      <RoleSelectionModal
        isOpen={isRoleSelectionOpen}
        onClose={() => {
          setIsRoleSelectionOpen(false);
          if (location.pathname !== '/') {
            navigate('/', { replace: false });
          }
        }}
        onRoleSelected={handleRoleSelected}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          if (location.pathname !== '/') {
            navigate('/', { replace: false });
          }
        }}
        onBack={() => {
          setIsAuthOpen(false);
          setIsRoleSelectionOpen(true);
        }}
        initialMode={authInitialMode}
        selectedRole={selectedRole}
        onLoginSuccess={({ profile: liveProfile, institution }) => {
          setIsAuthOpen(false);
          restoredDashboardRef.current = true;
          openDashboardForProfile(liveProfile);
          navigate('/student-dashboard', { replace: true });
        }}
      />

      <StudentPortalModal
        isOpen={isStudentPortalOpen}
        onClose={() => {
          setIsStudentPortalOpen(false);
          if (location.pathname !== '/') {
            navigate('/', { replace: false });
          }
        }}
        role={currentUserRole as any}
      />

      <InstitutionDashboardModal
        isOpen={isInstitutionDashboardOpen}
        onClose={() => {
          setIsInstitutionDashboardOpen(false);
          if (location.pathname !== '/') {
            navigate('/', { replace: false });
          }
        }}
      />

      <KitchenDashboardModal
        isOpen={isKitchenDashboardOpen}
        onClose={() => {
          setIsKitchenDashboardOpen(false);
          if (location.pathname !== '/') {
            navigate('/', { replace: false });
          }
        }}
      />

      <SuperAdminDashboardModal
        isOpen={isSuperAdminDashboardOpen}
        onClose={() => {
          setIsSuperAdminDashboardOpen(false);
          if (location.pathname !== '/') {
            navigate('/', { replace: false });
          }
        }}
      />

      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => {
          setIsDownloadOpen(false);
          addToast('Download Link Dispatched', 'Check your device or store link for Foodexa Express App.', 'info');
        }}
      />

      <PortalAccessModal
        isOpen={isPortalAccessOpen}
        onClose={() => setIsPortalAccessOpen(false)}
        onOpenLogin={handleOpenLogin}
        onOpenCreateAccount={handleOpenCreateAccount}
      />

      <LxChatDrawer
        isOpen={isLxDrawerOpen}
        onClose={() => setIsLxDrawerOpen(false)}
        onOpenBookDemo={() => setIsBookDemoOpen(true)}
      />

      {/* LX Voice Assistant Panel */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTriggerToast={(title, desc, type) => addToast(title, desc, type)}
      />

    </div>
  );
}
