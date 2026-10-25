import React from "react";
import { Sparkles, Menu, X, RotateCcw, Shield, LogIn, LogOut, UserCheck } from "lucide-react";
import { StudentProfile, AuthUser } from "../services/api";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  profile: StudentProfile;
  currentUser: AuthUser | null;
  onResetDemo: () => void;
  onQuickPractice: () => void;
  onOpenAuth: (mode?: "login" | "register") => void;
  onLogout: () => void;
  onOpenSecurityGuide: () => void;
  onOpenCreateProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  profile,
  currentUser,
  onResetDemo,
  onQuickPractice,
  onOpenAuth,
  onLogout,
  onOpenSecurityGuide,
  onOpenCreateProfile,
}) => {
  const navLinks = [
    { id: "dashboard", label: "Dashboard" },
    { id: "courses", label: "My Courses" },
    { id: "tutor", label: "AI Tutor" },
    { id: "quizzes", label: "Practice Quizzes" },
    { id: "planner", label: "Study Planner" },
    { id: "materials", label: "Study Materials" },
    { id: "analytics", label: "Progress Analytics" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B1020]/95 backdrop-blur-md border-b border-[#293449]">
      {/* Top Security & Account Banner */}
      <div className="bg-[#111A2E] text-[#B6C2D2] text-xs py-1.5 px-4 flex items-center justify-between border-b border-[#293449]">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          {currentUser ? (
            <>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]"></span>
              <span className="font-semibold text-[#22D3EE]">Student Profile:</span>
              <span className="text-[#F8FAFC] font-medium">{currentUser.name}</span>
              {currentUser.rollNumber && (
                <span className="text-[#B6C2D2]">({currentUser.rollNumber})</span>
              )}
              <span className="text-[#B6C2D2]/80">· {currentUser.course}</span>
              <span className="hidden md:inline text-[#22D3EE]/80">· Persistent Isolated Database</span>
            </>
          ) : (
            <>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6]"></span>
              <span className="font-medium text-[#F8FAFC]">Demonstration Account:</span>
              <span className="text-[#B6C2D2]">{profile.name} · {profile.course}</span>
              <span className="hidden md:inline text-[#B6C2D2]/70">· Isolated session store</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenCreateProfile}
            title="Create your personal student profile and upload your photo"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#22D3EE] hover:text-white transition-colors cursor-pointer bg-[#172033] hover:bg-[#8B5CF6]/30 px-2.5 py-0.5 rounded-md border border-[#22D3EE]/30"
          >
            <Sparkles className="w-3 h-3 text-[#22D3EE]" />
            <span>Create My Profile</span>
          </button>

          <button
            onClick={onOpenSecurityGuide}
            title="View Database & Security Architecture and Setup Instructions"
            className="inline-flex items-center gap-1 text-[11px] text-[#B6C2D2] hover:text-[#22D3EE] transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span className="hidden sm:inline">DB & Security</span>
          </button>

          {!currentUser && (
            <button
              onClick={onResetDemo}
              title="Reset to initial first-year engineering demo state"
              className="inline-flex items-center gap-1 text-[11px] text-[#B6C2D2] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          )}

          {currentUser ? (
            <button
              onClick={onLogout}
              title="Secure Logout"
              className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth("login")}
              className="inline-flex items-center gap-1 text-[11px] text-[#22D3EE] hover:text-white font-medium transition-colors cursor-pointer"
            >
              <LogIn className="w-3 h-3" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#6366f1] text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:opacity-90 transition-opacity">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#F8FAFC] block leading-tight">
                LearnSmart<span className="text-[#22D3EE]">AI</span>
              </span>
              <span className="text-[11px] text-[#B6C2D2] font-normal hidden sm:block leading-none">
                Your Personal AI Tutor
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (4-5 primary concise single-line links) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#B6C2D2]">
          {navLinks.slice(0, 5).map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 ${
                activeTab === link.id
                  ? "text-[#22D3EE] border-[#22D3EE] font-semibold"
                  : "border-transparent text-[#B6C2D2]"
              }`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => setActiveTab("materials")}
            className={`hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 ${
              activeTab === "materials"
                ? "text-[#22D3EE] border-[#22D3EE] font-semibold"
                : "border-transparent text-[#B6C2D2]"
            }`}
          >
            Materials
          </button>
        </nav>

        {/* Zone 3: Actions & Account */}
        <div className="flex items-center gap-3 shrink-0">
          {/* User profile avatar badge */}
          <button
            onClick={() => setActiveTab("profile")}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[#293449] bg-[#172033] hover:bg-[#111A2E] text-xs text-[#F8FAFC] transition-colors cursor-pointer group"
            title="View & Edit Profile Settings"
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover ring-2 ring-[#8B5CF6]/60 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left leading-tight">
              <span className="font-semibold block max-w-[120px] truncate text-[#F8FAFC]">
                {profile.name}
              </span>
              <span className="text-[10px] text-[#B6C2D2] block max-w-[120px] truncate">
                {profile.rollNumber || (currentUser ? "Student" : "Demo Mode")}
              </span>
            </div>
          </button>

          {!currentUser && (
            <button
              onClick={onOpenCreateProfile}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#8B5CF6] hover:bg-[#7c3aed] rounded-lg transition-colors cursor-pointer shadow-sm glow-purple-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Create Profile</span>
            </button>
          )}

          <button
            onClick={onQuickPractice}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-sm glow-purple-sm active:scale-95"
          >
            Quick Practice
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#B6C2D2] hover:text-[#F8FAFC] hover:bg-[#172033] lg:hidden cursor-pointer"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#293449] bg-[#111A2E] px-4 pt-3 pb-5 space-y-2 shadow-xl animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[#293449]">
            {currentUser ? (
              <button
                onClick={onLogout}
                className="w-full py-2 px-3 text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-800/40 rounded-lg text-center cursor-pointer"
              >
                Sign Out ({currentUser.name})
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth("login");
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-[#22D3EE] bg-[#172033] border border-[#22D3EE]/30 rounded-lg text-center cursor-pointer"
              >
                Sign In / Register
              </button>
            )}

            <button
              onClick={() => {
                onOpenSecurityGuide();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 px-3 text-xs font-semibold text-[#F8FAFC] bg-[#172033] border border-[#293449] rounded-lg text-center cursor-pointer"
            >
              Security Guide
            </button>
          </div>

          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${
                activeTab === link.id
                  ? "bg-[#172033] text-[#22D3EE] font-semibold border border-[#22D3EE]/30"
                  : "text-[#B6C2D2] hover:bg-[#172033] hover:text-[#F8FAFC]"
              }`}
            >
              <span>{link.label}</span>
              {activeTab === link.id && <span className="text-xs text-[#22D3EE]">Active</span>}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
