import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PlatformFeatures } from './components/PlatformFeatures';
import { ForStudents } from './components/ForStudents';
import { ForFaculty } from './components/ForFaculty';
import { ForGuests } from './components/ForGuests';
import { ForInstitutions } from './components/ForInstitutions';
import { OrderTrackingSection } from './components/OrderTrackingSection';
import { QrPickupSection } from './components/QrPickupSection';
import { AiSection } from './components/AiSection';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SecuritySection } from './components/SecuritySection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { SuperAdminSection } from './components/SuperAdminSection';
import { Pricing } from './components/Pricing';
import { Faq } from './components/Faq';
import { FinalCtaSection } from './components/FinalCtaSection';
import { BookDemoModal } from './components/BookDemoModal';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { InstitutionRegistrationModal } from './components/InstitutionRegistrationModal';
import { AuthModal } from './components/AuthModal';
import { JoinInstitutionModal } from './components/JoinInstitutionModal';
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
  const { user, profile, session, isEmailVerified, isPendingOtpVerification, loading: authLoading, directSession, isDirectUser } = useAuth();
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
  const [isJoinInstitutionOpen, setIsJoinInstitutionOpen] = useState(false);
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

  // Open student portal for visitor (no-auth) session
  const openVisitorPortal = (role: 'student' | 'faculty' | 'guest') => {
    closeDashboards();
    setCurrentUserRole(role);
    setIsStudentPortalOpen(true);
  };

  const handleJoinInstitution = (institution: { id: string; name: string; campus: string; city: string; institution_code: string }, role: 'student' | 'faculty' | 'guest', profile: any, directSessionInfo: { name: string; role: string; institutionId: string; institutionName: string } | null) => {
    setIsJoinInstitutionOpen(false);
    closeDashboards();
    setCurrentUserRole(role);
    setIsStudentPortalOpen(true);
  };

  const getDashboardRoute = (role: UserRole | null): string | null => {
    if (role === 'student') return '/student-dashboard';
    if (role === 'faculty') return '/student-dashboard';
    if (role === 'guest') return '/student-dashboard';
    if (role === 'institution_admin') return '/institution-dashboard';
    if (role === 'kitchen_staff' || role === 'canteen_manager') return '/kitchen-dashboard';
    if (role === 'super_admin') return '/super-admin-portal';
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

    if (!user && !directSession) {
      restoredDashboardRef.current = false;
      setCurrentUserRole(null);
      closeDashboards();
      return;
    }

    if (user && !isEmailVerified) {
      closeDashboards();
      return;
    }

    if (user && !profile) return;

    const isOnDashboardPath = isDashboardPath(location.pathname);
    if (isOnDashboardPath && !restoredDashboardRef.current) {
      restoredDashboardRef.current = true;
      if (user && profile) {
        openDashboardForProfile(profile);
      } else if (directSession) {
        setCurrentUserRole(directSession.role);
        setIsStudentPortalOpen(true);
      }
    }
  }, [authLoading, user, profile, isEmailVerified, location.pathname, directSession]);

  // ── Redirect verified+profiled users away from public/auth pages ──
  // Happens ONLY when user is fully logged in AND email is verified AND profile exists
  // AND we are NOT in the middle of an OTP verification flow.
  useEffect(() => {
    if (authLoading) return;
    if (!user && !directSession) return;
    if (user && (!profile || !isEmailVerified)) return;
    if (isPendingOtpVerification) return; // ← GUARD: don't redirect until OTP is done

    const path = location.pathname;
    const dashboardRoute = user && profile ? getDashboardRoute(profile.role) : '/student-dashboard';

    const publicPaths = ['/', '/login', '/create-account', '/student-login', '/institution-login'];
    const isPublicOrAuthPath =
      publicPaths.includes(path) ||
      (path.endsWith('/register') && !path.includes('/dashboard'));

    if (isPublicOrAuthPath && dashboardRoute) {
      navigate(dashboardRoute, { replace: true });
    }
  }, [authLoading, user, profile, isEmailVerified, isPendingOtpVerification, location.pathname, navigate, directSession]);

  const handleOpenLogin = () => {
    setIsRoleSelectionOpen(false);
    setIsPortalAccessOpen(false);
    setIsAuthOpen(false);
    setIsJoinInstitutionOpen(true);
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
    setIsRoleSelectionOpen(false);
    setIsJoinInstitutionOpen(true);
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
    <div className={`min-h-screen max-w-full overflow-x-hidden bg-[#fcfcfc] text-black font-sans selection:bg-black selection:text-white ${isDashboardOpen ? 'overflow-hidden' : ''}`}>
      
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

        <PlatformFeatures />

        <ForStudents
          onOpenCreateAccount={handleOpenStudentRegister}
        />

        <ForFaculty 
          onOpenCreateAccount={() => handleOpenCreateAccount('faculty')}
        />

        <ForGuests 
          onOpenCreateAccount={() => handleOpenCreateAccount('guest')}
        />

        <ForInstitutions
          onOpenRegisterInstitution={() => setIsInstitutionRegistrationOpen(true)}
        />

        <OrderTrackingSection />
        
        <QrPickupSection />

        <AiSection 
          onOpenLxDrawer={() => setIsLxDrawerOpen(true)}
        />

        <AnalyticsDashboard />

        <SecuritySection />

        <HowItWorksSection />

        <SuperAdminSection 
          onOpenLogin={handleOpenLogin}
        />

        <Pricing
          onOpenBookDemo={() => setIsBookDemoOpen(true)}
          onOpenRegisterInstitution={() => setIsInstitutionRegistrationOpen(true)}
        />

        <Faq />
        
        <FinalCtaSection 
          onOpenCreateAccount={handleOpenStudentRegister}
          onOpenLogin={handleOpenLogin}
          onOpenRegisterInstitution={() => setIsInstitutionRegistrationOpen(true)}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Corner Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {/* Floating Mic Button */}
        <button
          onClick={() => setIsVoiceModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-white border border-gray-200 text-black font-medium text-xs shadow-lg hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          title="Talk to LX Voice"
        >
          <Mic className="w-4 h-4 text-black animate-pulse" />
          <span className="hidden sm:inline">Talk to LX</span>
        </button>

        {/* Floating Ask LX AI Button */}
        <button
          onClick={() => setIsLxDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-black text-white font-medium text-xs shadow-lg hover:bg-gray-800 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-white" />
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

      <JoinInstitutionModal
        isOpen={isJoinInstitutionOpen}
        onClose={() => {
          setIsJoinInstitutionOpen(false);
        }}
        onJoin={handleJoinInstitution}
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
          if (liveProfile) {
            openDashboardForProfile(liveProfile);
          }
          const dashRoute = getDashboardRoute(liveProfile?.role || null) || '/student-dashboard';
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
