import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { AuthModal } from "./components/AuthModal";
import { CreateProfileModal } from "./components/CreateProfileModal";
import { SecurityGuideModal } from "./components/SecurityGuideModal";
import { DashboardView } from "./views/DashboardView";
import { CoursesView } from "./views/CoursesView";
import { AITutorView } from "./views/AITutorView";
import { QuizView } from "./views/QuizView";
import { PlannerView } from "./views/PlannerView";
import { StudyMaterialView } from "./views/StudyMaterialView";
import { AnalyticsView } from "./views/AnalyticsView";
import { ProfileSettingsView } from "./views/ProfileSettingsView";
import {
  AppDataStore,
  AuthUser,
  fetchStoreData,
  checkAuthSession,
  logoutStudent,
  resetDemoStore,
  updateStudyPlanStatus,
} from "./services/api";
import { Sparkles, AlertCircle } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [data, setData] = useState<AppDataStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Authentication & Profile Creation State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [securityGuideOpen, setSecurityGuideOpen] = useState(false);

  // Context passed between tabs (e.g. clicking "Quiz" from course or weakness card)
  const [navContext, setNavContext] = useState<{ subject?: string; topic?: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      // Check if student has an existing valid authenticated session
      const authSession = await checkAuthSession();
      if (authSession) {
        setCurrentUser(authSession.user);
        setData(authSession.data);
      } else {
        setCurrentUser(null);
        const storeData = await fetchStoreData();
        setData(storeData);
      }
    } catch (err: any) {
      console.error(err);
      setLoadError(err.message || "Failed to connect to backend server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (user: AuthUser, studentData: AppDataStore) => {
    setCurrentUser(user);
    setData(studentData);
    setActiveTab("dashboard");
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logoutStudent();
      setCurrentUser(null);
      const demoData = await fetchStoreData();
      setData(demoData);
      setActiveTab("dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountDeleted = async () => {
    try {
      setIsLoading(true);
      setCurrentUser(null);
      const demoData = await fetchStoreData();
      setData(demoData);
      setActiveTab("dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      setIsLoading(true);
      const demo = await resetDemoStore();
      setData(demo);
      setActiveTab("dashboard");
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (tab: string, context?: { subject?: string; topic?: string }) => {
    if (context) {
      setNavContext(context);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdatePlanStatus = async (id: string, status: any) => {
    try {
      const updated = await updateStudyPlanStatus(id, status);
      setData(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#172033] border border-[#293449] text-white flex items-center justify-center mx-auto shadow-md glow-purple-sm">
            <Sparkles className="w-6 h-6 text-[#22D3EE] animate-spin" />
          </div>
          <h1 className="text-base font-bold text-[#F8FAFC]">Loading LearnSmart AI...</h1>
          <p className="text-xs text-[#B6C2D2]">Preparing your futuristic learning environment.</p>
        </div>
      </div>
    );
  }

  if (loadError && !data) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#172033] rounded-2xl border border-rose-500/40 p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-950/60 text-rose-400 flex items-center justify-center mx-auto border border-rose-800/40">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#F8FAFC]">Connection Issue</h2>
          <p className="text-xs text-[#B6C2D2] leading-relaxed">{loadError}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm glow-purple-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#0B1020] flex flex-col text-[#F8FAFC]">
      {/* Top Bar following Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        profile={data.profile}
        currentUser={currentUser}
        onResetDemo={handleResetDemo}
        onQuickPractice={() => handleNavigate("quizzes")}
        onOpenAuth={(mode = "login") => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenSecurityGuide={() => setSecurityGuideOpen(true)}
        onOpenCreateProfile={() => setCreateProfileOpen(true)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} data={data} />

        {/* View Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === "dashboard" && (
            <DashboardView
              data={data}
              onNavigate={handleNavigate}
              onUpdatePlanStatus={handleUpdatePlanStatus}
              onOpenCreateProfile={() => setCreateProfileOpen(true)}
            />
          )}

          {activeTab === "courses" && (
            <CoursesView
              data={data}
              initialSubject={navContext.subject}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === "tutor" && (
            <AITutorView
              data={data}
              initialSubject={navContext.subject}
              initialTopic={navContext.topic}
            />
          )}

          {activeTab === "quizzes" && (
            <QuizView
              data={data}
              initialSubject={navContext.subject}
              initialTopic={navContext.topic}
              onNavigate={handleNavigate}
              onDataRefresh={(updated) => setData(updated)}
            />
          )}

          {activeTab === "planner" && (
            <PlannerView
              data={data}
              onNavigate={handleNavigate}
              onDataRefresh={(updated) => setData(updated)}
            />
          )}

          {activeTab === "materials" && <StudyMaterialView />}

          {activeTab === "analytics" && (
            <AnalyticsView data={data} onNavigate={handleNavigate} />
          )}

          {activeTab === "profile" && (
            <ProfileSettingsView
              data={data}
              onDataRefresh={(updated) => {
                setData(updated);
                if (currentUser) {
                  setCurrentUser((prev) =>
                    prev
                      ? {
                          ...prev,
                          name: updated.profile.name,
                          course: updated.profile.course,
                          college: updated.profile.college,
                          semester: updated.profile.semester,
                          rollNumber: updated.profile.rollNumber,
                          avatarUrl: updated.profile.avatarUrl,
                          bio: updated.profile.bio,
                          targetScoreOrRank: updated.profile.targetScoreOrRank,
                        }
                      : null
                  );
                }
              }}
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenAuth={(mode = "login") => {
                setAuthModalMode(mode);
                setAuthModalOpen(true);
              }}
              onOpenSecurityGuide={() => setSecurityGuideOpen(true)}
              onAccountDeleted={handleAccountDeleted}
              onOpenCreateProfile={() => setCreateProfileOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateProfileModal
        isOpen={createProfileOpen}
        onClose={() => setCreateProfileOpen(false)}
        onProfileCreated={handleAuthSuccess}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
      />

      <SecurityGuideModal
        isOpen={securityGuideOpen}
        onClose={() => setSecurityGuideOpen(false)}
      />

      {/* Clean Futuristic Dark Footer */}
      <footer className="border-t border-[#293449] bg-[#111A2E] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#B6C2D2]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F8FAFC]">LearnSmart AI</span>
            <span>—</span>
            <span>Your Personal AI Tutor · Learn Smarter, Every Day.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#B6C2D2]/80">
            <span className="text-[#22D3EE]">Google Gemini 3.8 Flash Powered</span>
            <span aria-hidden="true" className="text-[#293449]">·</span>
            <span>Deterministic Spaced Repetition</span>
            <span aria-hidden="true" className="text-[#293449]">·</span>
            <span className="text-[#8B5CF6]">Cryptographic Account Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

