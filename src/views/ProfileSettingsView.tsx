import React, { useState } from "react";
import {
  User,
  Settings,
  Shield,
  RotateCcw,
  Check,
  Save,
  Globe,
  Clock,
  BookOpen,
  Calendar,
  AlertTriangle,
  Lock,
  Plus,
  Hash,
  Award,
  FileText,
  Sparkles,
  Phone,
  Building,
  GraduationCap,
} from "lucide-react";
import {
  AppDataStore,
  StudentProfile,
  AuthUser,
  updateProfileSettings,
  resetDemoStore,
  deleteAccountPermanently,
} from "../services/api";
import { ProfilePhotoUploader } from "../components/ProfilePhotoUploader";

interface ProfileSettingsViewProps {
  data: AppDataStore;
  onDataRefresh: (updated: AppDataStore) => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onOpenAuth: (mode?: "login" | "register") => void;
  onOpenSecurityGuide: () => void;
  onAccountDeleted: () => void;
  onOpenCreateProfile?: () => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  data,
  onDataRefresh,
  currentUser,
  onLogout,
  onOpenAuth,
  onOpenSecurityGuide,
  onAccountDeleted,
  onOpenCreateProfile,
}) => {
  const [profile, setProfile] = useState<StudentProfile>(data.profile);
  const [newGoalInput, setNewGoalInput] = useState("");
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      await deleteAccountPermanently();
      setShowDeleteConfirm(false);
      onAccountDeleted();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updated = await updateProfileSettings(profile);
      onDataRefresh(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGoal = () => {
    if (!newGoalInput.trim()) return;
    setProfile((prev) => ({
      ...prev,
      learningGoals: [...prev.learningGoals, newGoalInput.trim()],
    }));
    setNewGoalInput("");
  };

  const handleRemoveGoal = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      learningGoals: prev.learningGoals.filter((_, i) => i !== index),
    }));
  };

  const handleAddSubject = () => {
    const trimmed = newSubjectInput.trim();
    if (trimmed && !profile.enrolledSubjects.includes(trimmed)) {
      setProfile((prev) => ({
        ...prev,
        enrolledSubjects: [...prev.enrolledSubjects, trimmed],
      }));
      setNewSubjectInput("");
    }
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    setProfile((prev) => ({
      ...prev,
      enrolledSubjects: prev.enrolledSubjects.filter((s) => s !== subjectToRemove),
    }));
  };

  const handleConfirmReset = async () => {
    try {
      const demo = await resetDemoStore();
      setProfile(demo.profile);
      onDataRefresh(demo);
      setShowResetConfirm(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl">
      {/* Header with Quick Profile Creation action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#22D3EE] font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]"></span>
            <span>Preferences & Security</span>
            <span aria-hidden="true" className="text-[#293449]">·</span>
            <span>Student Account</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] mt-1">
            Profile & Study Settings
          </h1>
          <p className="text-sm text-[#B6C2D2] mt-1">
            Manage your personal profile, upload your photo, and configure your target examination timetable.
          </p>
        </div>

        {onOpenCreateProfile && (
          <button
            type="button"
            onClick={onOpenCreateProfile}
            className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-bold transition-all cursor-pointer shadow-sm glow-purple-sm flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-[#22D3EE]" />
            <span>Create New Profile</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Photo & Identity Card */}
        <div className="bg-[#172033] rounded-2xl border border-[#293449] p-6 shadow-sm space-y-6">
          <div className="pb-4 border-b border-[#293449]">
            <h2 className="text-base font-bold text-[#F8FAFC] mb-1">Personal Profile Photo</h2>
            <p className="text-xs text-[#B6C2D2] mb-4">
              Upload your own picture or select an academic avatar. Your picture is displayed across your dashboard, AI tutor chats, and student badge.
            </p>

            <ProfilePhotoUploader
              currentAvatarUrl={profile.avatarUrl}
              studentName={profile.name}
              onAvatarChange={(newUrl) => setProfile((prev) => ({ ...prev, avatarUrl: newUrl }))}
              size="lg"
              showPresets={true}
            />
          </div>

          <div>
            <h2 className="text-base font-bold text-[#F8FAFC] mb-3">Academic & Personal Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#B6C2D2] mb-1">
                  Student Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#B6C2D2] mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#B6C2D2] mb-1 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>Roll Number / Student ID</span>
                </label>
                <input
                  type="text"
                  value={profile.rollNumber || ""}
                  onChange={(e) => setProfile({ ...profile, rollNumber: e.target.value })}
                  placeholder="e.g. 24CSE108"
                  className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#B6C2D2] mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>Target CGPA / Academic Goal</span>
                </label>
                <input
                  type="text"
                  value={profile.targetScoreOrRank || ""}
                  onChange={(e) => setProfile({ ...profile, targetScoreOrRank: e.target.value })}
                  placeholder="e.g. Target 9.2+ CGPA"
                  className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#B6C2D2] mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>Degree Program / Major Branch</span>
                </label>
                <input
                  type="text"
                  value={profile.course}
                  onChange={(e) => setProfile({ ...profile, course: e.target.value })}
                  className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#B6C2D2] mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>College / University / Institute</span>
                </label>
                <input
                  type="text"
                  value={profile.college}
                  onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                  className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#B6C2D2] mb-1">Academic Year</label>
                <select
                  value={profile.academicYear || "1st Year"}
                  onChange={(e) => setProfile({ ...profile, academicYear: e.target.value })}
                  className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] cursor-pointer"
                >
                  <option value="1st Year">1st Year (Freshman)</option>
                  <option value="2nd Year">2nd Year (Sophomore)</option>
                  <option value="3rd Year">3rd Year (Junior)</option>
                  <option value="4th Year">4th Year (Senior)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#B6C2D2] mb-1">Current Semester</label>
                <select
                  value={profile.semester}
                  onChange={(e) => setProfile({ ...profile, semester: e.target.value })}
                  className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] cursor-pointer"
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 7">Semester 7</option>
                  <option value="Semester 8">Semester 8</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-[#B6C2D2] mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>Personal Academic Bio & Motto</span>
                </label>
                <input
                  type="text"
                  value={profile.bio || ""}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="e.g. Dedicated to foundational computer science and systems architecture."
                  className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enrolled Subjects Management */}
        <div className="bg-[#172033] rounded-2xl border border-[#293449] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#22D3EE]" />
              <span>Enrolled Curriculum Subjects</span>
            </h2>
            <span className="text-xs text-[#B6C2D2] font-medium">
              {profile.enrolledSubjects.length} subjects
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {profile.enrolledSubjects.map((sub) => (
              <span
                key={sub}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111A2E] text-[#F8FAFC] text-xs font-medium border border-[#293449]"
              >
                <span>{sub}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSubject(sub)}
                  className="hover:text-rose-400 cursor-pointer ml-1 text-[#B6C2D2]"
                  title={`Remove ${sub}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Add another subject (e.g. Discrete Mathematics)..."
              value={newSubjectInput}
              onChange={(e) => setNewSubjectInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubject();
                }
              }}
              className="flex-1 text-xs p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
            />
            <button
              type="button"
              onClick={handleAddSubject}
              className="px-4 py-2.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-semibold cursor-pointer flex items-center gap-1 shadow-sm glow-purple-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        {/* Learning Preferences */}
        <div className="bg-[#172033] rounded-2xl border border-[#293449] p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-[#F8FAFC]">
            Pedagogical & AI Preferences
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Preferred Language */}
            <div>
              <label className="block font-semibold text-[#B6C2D2] mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Default Explanation Language</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["English", "Telugu", "Bilingual"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setProfile({ ...profile, preferredLanguage: lang })}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      profile.preferredLanguage === lang
                        ? "bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-sm glow-purple-sm"
                        : "bg-[#111A2E] border-[#293449] text-[#B6C2D2] hover:text-[#F8FAFC]"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#B6C2D2]/80 mt-1.5">
                Telugu responses formulate engineering explanations using natural script and academic terms.
              </p>
            </div>

            {/* Explanation Difficulty */}
            <div>
              <label className="block font-semibold text-[#B6C2D2] mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Default Academic Explanation Level</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setProfile({ ...profile, explanationLevel: lvl })}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      profile.explanationLevel === lvl
                        ? "bg-[#22D3EE] border-[#22D3EE] text-[#0B1020] font-bold shadow-sm shadow-[#22D3EE]/30"
                        : "bg-[#111A2E] border-[#293449] text-[#B6C2D2] hover:text-[#F8FAFC]"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#B6C2D2]/80 mt-1.5">
                Controls depth of mathematical proofs, memory layout, and real-world analogies.
              </p>
            </div>

            {/* Daily study time slider */}
            <div className="md:col-span-2 pt-2">
              <div className="flex items-center justify-between font-semibold text-[#B6C2D2] mb-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>Available Daily Study Time</span>
                </span>
                <span className="font-mono text-sm text-[#22D3EE]">
                  {profile.dailyStudyTimeMinutes} minutes / day
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="180"
                step="15"
                value={profile.dailyStudyTimeMinutes}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    dailyStudyTimeMinutes: Number(e.target.value),
                  })
                }
                className="w-full h-2 bg-[#111A2E] border border-[#293449] rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]"
              />
              <div className="flex justify-between text-[11px] text-[#B6C2D2]/60 mt-1">
                <span>30 mins (Light)</span>
                <span>90 mins (Standard)</span>
                <span>180 mins (Intensive)</span>
              </div>
            </div>

            {/* Target Exam Date & Name */}
            <div>
              <label className="block font-semibold text-[#B6C2D2] mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Target Examination Name</span>
              </label>
              <input
                type="text"
                value={profile.examName}
                onChange={(e) => setProfile({ ...profile, examName: e.target.value })}
                className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#B6C2D2] mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Target Examination Date</span>
              </label>
              <input
                type="date"
                value={profile.examDate}
                onChange={(e) => setProfile({ ...profile, examDate: e.target.value })}
                className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
              />
            </div>
          </div>
        </div>

        {/* Academic Goals Checklist */}
        <div className="bg-[#172033] rounded-2xl border border-[#293449] p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#F8FAFC]">
            Active Learning Goals & Milestones
          </h2>

          <div className="space-y-2">
            {profile.learningGoals.map((goal, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-[#111A2E] border border-[#293449] text-xs"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22D3EE] shrink-0" />
                  <span className="font-medium text-[#F8FAFC]">{goal}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveGoal(idx)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Add a new academic milestone (e.g. Master Pointer Arithmetic)..."
              value={newGoalInput}
              onChange={(e) => setNewGoalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddGoal();
                }
              }}
              className="flex-1 text-xs p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
            />
            <button
              type="button"
              onClick={handleAddGoal}
              className="px-4 py-2.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-semibold cursor-pointer shadow-sm glow-purple-sm"
            >
              Add Goal
            </button>
          </div>
        </div>

        {/* Save button & feedback */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-semibold transition-all cursor-pointer shadow-sm glow-purple-sm flex items-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4 text-[#22D3EE]" />
              <span>{isSaving ? "Saving..." : "Save Preferences"}</span>
            </button>
            {saveSuccess && (
              <span className="text-xs font-semibold text-[#22D3EE] flex items-center gap-1 animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>Saved successfully!</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg border border-rose-800/40 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Baseline</span>
          </button>
        </div>
      </form>

      {/* Account & Multi-Tenant Database Storage Card */}
      <div className="bg-[#172033] rounded-2xl border border-[#293449] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#22D3EE]" />
            <h2 className="text-base font-bold text-[#F8FAFC]">Student Account & Persistent Database</h2>
          </div>
          <button
            type="button"
            onClick={onOpenSecurityGuide}
            className="text-xs text-[#22D3EE] hover:underline font-semibold cursor-pointer flex items-center gap-1"
          >
            <span>Architecture & Setup Guide</span>
          </button>
        </div>

        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#111A2E] border border-[#293449] space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#293449]">
                <span className="text-[#B6C2D2] font-medium">Account Status</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-[#22D3EE] bg-[#172033] px-2.5 py-0.5 rounded-full border border-[#22D3EE]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]"></span>
                  Active Authenticated Session
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#B6C2D2] pt-1">
                <div>
                  <span className="text-[#B6C2D2]/70 block text-[11px]">Registered Email:</span>
                  <span className="font-semibold text-[#F8FAFC]">{currentUser.email}</span>
                </div>
                <div>
                  <span className="text-[#B6C2D2]/70 block text-[11px]">Student Account ID:</span>
                  <span className="font-mono text-[11px] text-[#22D3EE]">{currentUser.id}</span>
                </div>
                <div>
                  <span className="text-[#B6C2D2]/70 block text-[11px]">Academic Course:</span>
                  <span className="font-semibold text-[#F8FAFC]">{currentUser.course}</span>
                </div>
                <div>
                  <span className="text-[#B6C2D2]/70 block text-[11px]">Enrolled Institution:</span>
                  <span className="font-semibold text-[#F8FAFC]">{currentUser.college}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 rounded-lg bg-[#111A2E] hover:bg-[#111A2E]/80 text-[#B6C2D2] hover:text-[#F8FAFC] border border-[#293449] text-xs font-semibold cursor-pointer transition-colors"
              >
                Sign Out
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-semibold cursor-pointer transition-colors"
              >
                Delete Student Account & Purge Academic Data
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#111A2E] border border-[#22D3EE]/30 space-y-3 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="font-bold text-[#F8FAFC] block">Currently Exploring in Demonstration Mode</span>
                <p className="text-[11px] text-[#B6C2D2] leading-relaxed">
                  You are evaluating LearnSmart AI using the preloaded baseline for <strong>Rahul Sharma (First-Year CSE)</strong>. Create an authenticated account to save your own quiz attempts, topic scores, and adaptive study plans permanently.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenAuth("register")}
                className="px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-bold shrink-0 cursor-pointer shadow-sm glow-purple-sm active:scale-95"
              >
                Create Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Responsible AI & Privacy Disclosure Card */}
      <div className="bg-[#111A2E] text-[#B6C2D2] rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm border border-[#293449]">
        <div className="flex items-center gap-2 text-[#F8FAFC] font-bold text-sm">
          <Shield className="w-5 h-5 text-[#22D3EE]" />
          <span>Responsible AI, Privacy & Academic Governance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#B6C2D2] leading-relaxed pt-2">
          <div className="space-y-1">
            <span className="font-semibold text-[#F8FAFC] block">Credential Security</span>
            <p className="text-[11px] text-[#B6C2D2]/80">
              Passwords are encrypted via salted scrypt. Gemini API keys remain strictly on the backend. No secrets are exposed to client code.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-[#F8FAFC] block">Student Data Isolation</span>
            <p className="text-[11px] text-[#B6C2D2]/80">
              Assessment records and study plan schedules are stored in protected per-student stores. One student's records are never exposed to another student.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-[#F8FAFC] block">No High-Stakes Automation</span>
            <p className="text-[11px] text-[#B6C2D2]/80">
              AI recommendations serve as pedagogical suggestions. The platform never makes automated high-stakes academic determinations or claims to evaluate intrinsic intelligence.
            </p>
          </div>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#172033] rounded-2xl max-w-md w-full p-6 shadow-xl border border-rose-500/40 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Permanently Delete Student Account?</span>
            </div>

            <p className="text-xs text-[#B6C2D2] leading-relaxed">
              This action is irreversible. All your quiz attempts, topic-wise mastery analytics, study plans, and profile settings will be permanently erased from persistent storage.
            </p>

            <div className="pt-3 border-t border-[#293449] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs text-[#B6C2D2] hover:text-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={handleDeleteAccount}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
              >
                {isDeletingAccount ? "Deleting..." : "Permanently Delete Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#172033] rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#293449] space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Reset to Demonstration Baseline?</span>
            </div>

            <p className="text-xs text-[#B6C2D2] leading-relaxed">
              This will restore the initial demonstration state of <strong>Rahul Sharma (First-Year B.Tech CSE)</strong> with the preloaded quiz history (including the 38% C Pointers weakness) and study plan.
            </p>

            <div className="pt-3 border-t border-[#293449] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs text-[#B6C2D2] hover:text-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
