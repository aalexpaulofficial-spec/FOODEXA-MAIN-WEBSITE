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

type AccountRole = 'student' | 'faculty' | 'guest';
const accountRoles: AccountRole[] = ['student', 'faculty', 'guest'];
const isAccountRole = (role: string | null): role is AccountRole => !!role && accountRoles.includes(role as AccountRole);

export default function App() {
  const { user, profile, session, isEmailVerified, isPendingOtpVerification, loading: authLoading } = useAuth();
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
  const requestedRole = queryParams.get('role');
  const roleFromQuery = isAccountRole(requestedRole) ? requestedRole : null;

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
      // student, faculty, guest
      setIsStudentPortalOpen(true);
    }
  };

  const getDashboardRoute = (role: UserRole | null): string | null => {
    if (role === 'student') return '/student-dashboard';
    if (role === 'faculty') return '/student-dashboard';
    if (role === 'guest') return '/student-dashboard';
    if (role === 'institution_admin') return '/institution/dashboard';
    if (role === 'kitchen_staff' || role === 'canteen_manager') return '/kitchen/dashboard';
    if (role === 'super_admin') return '/admin/dashboard';
    return null;
  };

  const isDashboardPath = (path: string) =>
    path === '/student-dashboard' || path === '/student/dashboard' ||
    path === '/institution/dashboard' || path === '/kitchen/dashboard' || path === '/admin/dashboard';

  // ── Route-based initialization: open the correct modal based on the URL ──
  // NOTE: We never redirect to '/' during registration or OTP flow.
  // The AuthModal manages OTP step internally — no URL change needed.
  useEffect(() => {
    if (authLoading) return;
    const path = location.pathname;

    if (path === '/create-account') {
      const savedRole = sessionStorage.getItem('foodexa_role');
      const roleToUse = roleFromQuery || savedRole;

      if (isAccountRole(roleToUse)) {
        setIsRoleSelectionOpen(false);
        setSelectedRole(roleToUse);
        setAuthInitialMode('create');
        setIsAuthOpen(true);
      } else {
        setIsRoleSelectionOpen(true);
        setIsAuthOpen(false);
      }
    } else if (path === '/student-login' || path === '/login') {
      setIsRoleSelectionOpen(false);
      setAuthInitialMode('login');
      setIsAuthOpen(true);
    } else if (path === '/institution-login') {
      setIsRoleSelectionOpen(false);
      setAuthInitialMode('login');
      setIsAuthOpen(true);
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
    } else if (isDashboardPath(path)) {
      // On a dashboard path — the session restore effect below handles opening
      // the correct dashboard. We close auth & role modals.
      setIsRoleSelectionOpen(false);
      setIsAuthOpen(false);
    }
  }, [authLoading, location.pathname, location.search, roleFromQuery]);

  // ── Session restore: open the correct dashboard on refresh ──
  // Only fires when auth finishes loading and a verified session exists.
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

    const isOnDashboardPath = isDashboardPath(location.pathname);
    if (isOnDashboardPath && !restoredDashboardRef.current) {
      restoredDashboardRef.current = true;
      openDashboardForProfile(profile);
    }
  }, [authLoading, user, profile, isEmailVerified, location.pathname]);

  // ── Redirect verified+profiled users away from public/auth pages ──
  // Happens ONLY when user is fully logged in AND email is verified AND profile exists
  // AND we are NOT in the middle of an OTP verification flow.
  useEffect(() => {
    if (authLoading) return;
    if (!user || !profile || !isEmailVerified) return;
    if (isPendingOtpVerification) return; // ← GUARD: don't redirect until OTP is done

    const path = location.pathname;
    const dashboardRoute = getDashboardRoute(profile.role);

    const publicPaths = ['/', '/login', '/create-account', '/student-login', '/institution-login'];
    const isPublicOrAuthPath =
      publicPaths.includes(path) ||
      (path.endsWith('/register') && !path.includes('/dashboard'));

    if (isPublicOrAuthPath && dashboardRoute) {
      navigate(dashboardRoute, { replace: true });
    }
  }, [authLoading, user, profile, isEmailVerified, isPendingOtpVerification, location.pathname, navigate]);

  const handleOpenLogin = () => {
    setIsRoleSelectionOpen(false);
    setIsPortalAccessOpen(false);
    setAuthInitialMode('login');
    setIsAuthOpen(true);
    if (location.pathname !== '/login') {
      navigate('/login', { replace: false });
    }
  };

  const handleOpenCreateAccount = (role: AccountRole) => {
    sessionStorage.setItem('foodexa_role', role);
    setSelectedRole(role);
    setAuthInitialMode('create');
    setIsAuthOpen(true);
    setIsPortalAccessOpen(false);
    const registerRoute = `/create-account?role=${role}`;
    if (location.pathname + location.search !== registerRoute) {
      navigate(registerRoute, { replace: false });
    }
  };

  const handleOpenStudentRegister = () => {
    setIsAuthOpen(false);
    setIsPortalAccessOpen(false);
    setIsRoleSelectionOpen(true);
    if (location.pathname !== '/create-account') {
      navigate('/create-account', { replace: false });
    }
  };

  const handleRoleSelected = (role: AccountRole) => {
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

  const isDashboardOpen = isStudentPortalOpen || isInstitutionDashboardOpen || isKitchenDashboardOpen || isSuperAdminDashboardOpen;

  return (
    <div className={`min-h-screen max-w-full overflow-x-hidden bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 ${isDashboardOpen ? 'overflow-hidden' : ''}`}>
      
      {/* Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Main Website Wrapper - Hidden when dashboard is open */}
      <div className={isDashboardOpen ? 'hidden' : 'block'}>
        {/* Scroll Progress Indicator */}
        <ScrollProgress />

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
          navigate('/', { replace: false });
        }}
        onRoleSelected={handleRoleSelected}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          sessionStorage.removeItem('foodexa_role');
          navigate('/', { replace: false });
        }}
        onBack={() => {
          setIsAuthOpen(false);
          setIsRoleSelectionOpen(true);
        }}
        initialMode={authInitialMode}
        selectedRole={selectedRole}
        onLoginSuccess={({ profile: liveProfile }) => {
          setIsAuthOpen(false);
          sessionStorage.removeItem('foodexa_role');
          restoredDashboardRef.current = true;
          openDashboardForProfile(liveProfile);
          const dashRoute = getDashboardRoute(liveProfile.role) || '/student-dashboard';
          navigate(dashRoute, { replace: true });
        }}
      />

      <StudentPortalModal
        isOpen={isStudentPortalOpen}
        onClose={() => {
          setIsStudentPortalOpen(false);
          navigate('/', { replace: false });
        }}
        role={currentUserRole as any}
        triggerToast={addToast}
      />

      <InstitutionDashboardModal
        isOpen={isInstitutionDashboardOpen}
        onClose={() => {
          setIsInstitutionDashboardOpen(false);
          navigate('/', { replace: false });
        }}
      />

      <KitchenDashboardModal
        isOpen={isKitchenDashboardOpen}
        onClose={() => {
          setIsKitchenDashboardOpen(false);
          navigate('/', { replace: false });
        }}
      />

      <SuperAdminDashboardModal
        isOpen={isSuperAdminDashboardOpen}
        onClose={() => {
          setIsSuperAdminDashboardOpen(false);
          navigate('/', { replace: false });
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
