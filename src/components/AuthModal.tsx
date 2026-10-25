import React, { useState } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  GraduationCap,
  Building,
  Calendar,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Hash,
} from "lucide-react";
import {
  registerStudent,
  loginStudent,
  loginDemoStudent,
  AuthUser,
  AppDataStore,
} from "../services/api";
import { ProfilePhotoUploader } from "./ProfilePhotoUploader";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser, data: AppDataStore) => void;
  initialMode?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = "login",
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerCourse, setRegisterCourse] = useState("B.Tech Computer Science & Engineering");
  const [registerCollege, setRegisterCollege] = useState("JNTU Institute of Engineering & Technology");
  const [registerSemester, setRegisterSemester] = useState("Semester 1");
  const [registerRollNumber, setRegisterRollNumber] = useState("");
  const [registerAvatarUrl, setRegisterAvatarUrl] = useState("");

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await loginStudent(loginEmail, loginPassword);
      onAuthSuccess(res.user, res.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await registerStudent({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        course: registerCourse,
        college: registerCollege,
        semester: registerSemester,
        rollNumber: registerRollNumber,
        avatarUrl: registerAvatarUrl,
      });
      onAuthSuccess(res.user, res.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await loginDemoStudent();
      onAuthSuccess(res.user, res.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in as demonstration student.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1020]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#172033] rounded-2xl max-w-lg w-full border border-[#293449] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Top header bar */}
        <div className="bg-[#111A2E] text-[#F8FAFC] px-6 py-4 flex items-center justify-between border-b border-[#293449]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-[#22D3EE]" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight text-[#F8FAFC]">Student Authentication</h2>
              <p className="text-[11px] text-[#B6C2D2]">Secure Academic Portal & Persistent Store</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#B6C2D2] hover:text-[#F8FAFC] p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 border-b border-[#293449] bg-[#111A2E]/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMessage(null);
            }}
            className={`py-3 text-center border-b-2 transition-colors cursor-pointer ${
              mode === "login"
                ? "border-[#8B5CF6] text-[#22D3EE] bg-[#172033] font-bold"
                : "border-transparent text-[#B6C2D2] hover:text-[#F8FAFC]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMessage(null);
            }}
            className={`py-3 text-center border-b-2 transition-colors cursor-pointer ${
              mode === "register"
                ? "border-[#8B5CF6] text-[#22D3EE] bg-[#172033] font-bold"
                : "border-transparent text-[#B6C2D2] hover:text-[#F8FAFC]"
            }`}
          >
            Create Student Account
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Error banner */}
          {errorMessage && (
            <div className="bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs rounded-xl p-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block text-rose-300">Authentication Error</span>
                <p className="text-rose-200/90 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Quick Demo Sign In option */}
          <div className="bg-[#111A2E]/90 border border-[#293449] rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#F8FAFC]">
                <ShieldCheck className="w-4 h-4 text-[#22D3EE]" />
                <span>Instant Evaluation Demo</span>
              </div>
              <p className="text-[11px] text-[#B6C2D2] leading-tight">
                Sign in as <strong className="text-[#F8FAFC]">Rahul Sharma</strong> with preloaded First-Year CSE quiz records & weaknesses.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-[#F8FAFC] text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-sm"
            >
              One-Click Demo
            </button>
          </div>

          {/* LOGIN FORM */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#F8FAFC]">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="student@engg.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#293449] bg-[#111A2E] text-[#F8FAFC] placeholder-[#B6C2D2]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#F8FAFC]">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#293449] bg-[#111A2E] text-[#F8FAFC] placeholder-[#B6C2D2]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-[#F8FAFC] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#8B5CF6]/20"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Student Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTRATION FORM */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Profile Photo Uploader */}
              <div className="bg-[#111A2E]/70 border border-[#293449] rounded-xl p-3">
                <label className="block text-[11px] font-bold text-[#F8FAFC] mb-2">
                  Upload Student Profile Picture
                </label>
                <ProfilePhotoUploader
                  currentAvatarUrl={registerAvatarUrl}
                  studentName={registerName || "Student"}
                  onAvatarChange={(newUrl) => setRegisterAvatarUrl(newUrl)}
                  size="md"
                  showPresets={true}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#F8FAFC]">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="e.g. Ananya Rao"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#293449] bg-[#111A2E] text-[#F8FAFC] placeholder-[#B6C2D2]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#F8FAFC]">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="e.g. ananya@engg.edu"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#293449] bg-[#111A2E] text-[#F8FAFC] placeholder-[#B6C2D2]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#F8FAFC]">Roll Number / Student ID</label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={registerRollNumber}
                      onChange={(e) => setRegisterRollNumber(e.target.value)}
                      placeholder="e.g. 24CSE108"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#293449] bg-[#111A2E] text-[#F8FAFC] placeholder-[#B6C2D2]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#F8FAFC]">
                  Password <span className="text-[10px] text-[#B6C2D2] font-normal">(min 8 characters)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Create secure password"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#293449] bg-[#111A2E] text-[#F8FAFC] placeholder-[#B6C2D2]/50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#F8FAFC]">Course / Major</label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={registerCourse}
                      onChange={(e) => setRegisterCourse(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#293449] bg-[#111A2E] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#F8FAFC]">Semester</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                    <select
                      value={registerSemester}
                      onChange={(e) => setRegisterSemester(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#293449] bg-[#111A2E] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#F8FAFC]">College / Institution</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={registerCollege}
                    onChange={(e) => setRegisterCollege(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#293449] bg-[#111A2E] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-[#F8FAFC] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#8B5CF6]/20 pt-2"
              >
                {isSubmitting ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Privacy Note */}
          <div className="pt-2 border-t border-[#293449] text-[11px] text-[#B6C2D2] text-center leading-normal">
            Passwords are hashed using salted <code className="text-[#22D3EE] font-mono bg-[#111A2E] px-1.5 py-0.5 rounded border border-[#293449]">scrypt</code>. Academic records are isolated to your student account and are never shared across profiles.
          </div>
        </div>
      </div>
    </div>
  );
};
