import React, { useState } from 'react';
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
import { DownloadModal } from './components/DownloadModal';
import { PortalAccessModal } from './components/PortalAccessModal';
import { LxChatDrawer } from './components/LxChatDrawer';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ScrollProgress } from './components/ScrollProgress';
import { Footer } from './components/Footer';
import { Sparkles, Mic } from 'lucide-react';

export default function App() {
  const [isBookDemoOpen, setIsBookDemoOpen] = useState(false);
  const [isInstitutionRegistrationOpen, setIsInstitutionRegistrationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'create'>('login');
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isPortalAccessOpen, setIsPortalAccessOpen] = useState(false);
  const [isLxDrawerOpen, setIsLxDrawerOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isStudentPortalOpen, setIsStudentPortalOpen] = useState(false);
  const [isRoleSelectionOpen, setIsRoleSelectionOpen] = useState(false);
  const [portalData, setPortalData] = useState({
    studentName: 'Alex Paul',
    email: 'alex.paul@christuniversity.in',
    code: 'CHRKNG2026',
  });
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty' | 'guest'>('student');
  const [activePrompt, setActivePrompt] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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

  const handleOpenLogin = () => {
    setIsRoleSelectionOpen(false);
    setIsPortalAccessOpen(false);
    setAuthInitialMode('login');
    setIsAuthOpen(true);
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
  };

  const handleRoleSelected = (role: 'student' | 'faculty' | 'guest') => {
    setIsRoleSelectionOpen(false);
    setAuthInitialMode('create');
    setIsAuthOpen(true);
    // Store selected role for pass to AuthModal
    setSelectedRole(role);
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
        onClose={() => setIsRoleSelectionOpen(false)}
        onRoleSelected={handleRoleSelected}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authInitialMode}
        selectedRole={selectedRole}
        onLoginSuccess={(data) => {
          setPortalData(data);
          setIsStudentPortalOpen(true);
          addToast('Logged in to Campus Portal', `Welcome to CHRIST University (${data.code})`, 'success');
        }}
      />

      <StudentPortalModal
        isOpen={isStudentPortalOpen}
        onClose={() => setIsStudentPortalOpen(false)}
        studentName={portalData.studentName}
        universityEmail={portalData.email}
        institutionCode={portalData.code}
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
