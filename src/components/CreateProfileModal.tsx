import React, { useState } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  GraduationCap,
  Building,
  Calendar,
  Clock,
  Globe,
  BookOpen,
  Sparkles,
  Check,
  AlertCircle,
  Hash,
  Award,
  Phone,
  FileText,
  Plus,
} from "lucide-react";
import { ProfilePhotoUploader } from "./ProfilePhotoUploader";
import { createPersonalProfile, AuthUser, AppDataStore } from "../services/api";

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileCreated: (user: AuthUser, data: AppDataStore) => void;
}

const AVAILABLE_SUBJECT_PRESETS = [
  "C Programming",
  "Python Programming",
  "Engineering Mathematics",
  "Engineering Physics",
  "Data Structures & Algorithms",
  "Database Management Systems",
  "Digital Electronics",
  "Discrete Mathematics",
];

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileCreated,
}) => {
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [college, setCollege] = useState("JNTU Institute of Engineering & Technology");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [course, setCourse] = useState("B.Tech Computer Science & Engineering");
  const [academicYear, setAcademicYear] = useState("1st Year");
  const [semester, setSemester] = useState("Semester 1");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [targetScoreOrRank, setTargetScoreOrRank] = useState("Target 9.0+ CGPA");

  // Study goals & exam
  const [examName, setExamName] = useState("B.Tech Semester End Examinations");
  const [examDate, setExamDate] = useState(
    new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [dailyStudyTimeMinutes, setDailyStudyTimeMinutes] = useState(90);
  const [preferredLanguage, setPreferredLanguage] = useState<"English" | "Telugu" | "Bilingual">("English");
  const [explanationLevel, setExplanationLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");

  // Subjects
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    "C Programming",
    "Python Programming",
    "Engineering Mathematics",
    "Engineering Physics",
  ]);
  const [customSubjectInput, setCustomSubjectInput] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const handleAddCustomSubject = () => {
    const trimmed = customSubjectInput.trim();
    if (trimmed && !selectedSubjects.includes(trimmed)) {
      setSelectedSubjects((prev) => [...prev, trimmed]);
      setCustomSubjectInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }
    if (selectedSubjects.length === 0) {
      setErrorMessage("Please select at least one study subject.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createPersonalProfile({
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
        rollNumber: rollNumber.trim(),
        college: college.trim(),
        department: department.trim(),
        course: course.trim(),
        academicYear,
        semester,
        avatarUrl,
        bio: bio.trim(),
        phoneNumber: phoneNumber.trim(),
        targetScoreOrRank,
        examName: examName.trim(),
        examDate,
        dailyStudyTimeMinutes,
        preferredLanguage,
        explanationLevel,
        enrolledSubjects: selectedSubjects,
        learningGoals: [
          `Achieve ${targetScoreOrRank} in ${examName}`,
          `Master core curriculum for ${course}`,
          "Maintain daily spaced revision and active practice quizzes",
        ],
      });

      onProfileCreated(res.user, res.data);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to create personal profile. Please review your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#172033] rounded-2xl max-w-2xl w-full border border-[#293449] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header bar */}
        <div className="bg-[#111A2E] text-[#F8FAFC] px-6 py-4 flex items-center justify-between border-b border-[#293449]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366f1] flex items-center justify-center font-bold shadow-sm glow-purple-sm">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Create Your Personal Profile</h2>
              <p className="text-[11px] text-[#B6C2D2]">
                Provide your personal details, upload your photo, and customize your study curriculum
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#B6C2D2] hover:text-[#F8FAFC] p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs rounded-xl p-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Incomplete Details</span>
                <p className="text-rose-200 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* 1. PROFILE PHOTO UPLOAD */}
          <div className="bg-[#111A2E] border border-[#293449] rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#F8FAFC] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Profile Picture</span>
              </h3>
              <span className="text-[11px] text-[#B6C2D2] font-medium">Upload your personal photo</span>
            </div>

            <ProfilePhotoUploader
              currentAvatarUrl={avatarUrl}
              studentName={name || "Student"}
              onAvatarChange={(newUrl) => setAvatarUrl(newUrl)}
              size="lg"
              showPresets={true}
            />
          </div>

          {/* 2. PERSONAL IDENTITY & COLLEGE DETAILS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#22D3EE] flex items-center gap-2 pb-1 border-b border-[#293449]">
              <User className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Personal & Academic Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-[#B6C2D2]">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sashi Gowtham"
                    className="w-full pl-9 pr-3 py-2 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#B6C2D2]">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. sashi@student.edu"
                    className="w-full pl-9 pr-3 py-2 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#B6C2D2]">
                  Roll Number / Student ID
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 24CSE108"
                    className="w-full pl-9 pr-3 py-2 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#B6C2D2]">
                  Account Password <span className="text-[10px] text-[#B6C2D2]/60 font-normal">(optional, for sign in)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-9 pr-3 py-2 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#B6C2D2]">College / University</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. IIT Madras, JNTU, Osmania University"
                    className="w-full pl-9 pr-3 py-2 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#B6C2D2]">Branch / Major Degree</label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science & Engineering"
                    className="w-full pl-9 pr-3 py-2 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#B6C2D2]">Academic Year</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full py-2 px-3 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] cursor-pointer"
                >
                  <option value="1st Year">1st Year (Freshman)</option>
                  <option value="2nd Year">2nd Year (Sophomore)</option>
                  <option value="3rd Year">3rd Year (Junior)</option>
                  <option value="4th Year">4th Year (Senior)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#B6C2D2]">Current Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full py-2 px-3 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] cursor-pointer"
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

              <div className="sm:col-span-2 space-y-1">
                <label className="block font-semibold text-[#B6C2D2]">Personal Academic Bio & Motto</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Aspiring systems engineer passionate about low-level algorithms and high-throughput systems."
                    className="w-full pl-9 pr-3 py-2 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. TARGET EXAMINATION & STUDY TIME */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#22D3EE] flex items-center gap-2 pb-1 border-b border-[#293449]">
              <Calendar className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Target Examination & Schedule Goals</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-[#B6C2D2]">Target Examination</label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="e.g. End Semester Finals"
                  className="w-full py-2 px-3 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#B6C2D2]">Target Exam Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full py-2 px-3 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#B6C2D2]">Target Grade Goal</label>
                <div className="relative">
                  <Award className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={targetScoreOrRank}
                    onChange={(e) => setTargetScoreOrRank(e.target.value)}
                    placeholder="e.g. Target 9.0+ CGPA"
                    className="w-full pl-9 pr-3 py-2 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-[#B6C2D2]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#22D3EE]" />
                    <span>Daily Study Time</span>
                  </span>
                  <span className="font-mono text-[#22D3EE]">{dailyStudyTimeMinutes} mins/day</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="15"
                  value={dailyStudyTimeMinutes}
                  onChange={(e) => setDailyStudyTimeMinutes(Number(e.target.value))}
                  className="w-full h-2 bg-[#111A2E] border border-[#293449] rounded-lg appearance-none cursor-pointer accent-[#8B5CF6] mt-2"
                />
              </div>
            </div>
          </div>

          {/* 4. ENROLLED SUBJECTS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#22D3EE] flex items-center justify-between pb-1 border-b border-[#293449]">
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Enrolled Focus Subjects</span>
              </span>
              <span className="text-[11px] font-normal text-[#B6C2D2]">
                {selectedSubjects.length} selected
              </span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SUBJECT_PRESETS.map((sub) => {
                const isSelected = selectedSubjects.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubject(sub)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm glow-purple-sm"
                        : "bg-[#111A2E] text-[#B6C2D2] border-[#293449] hover:border-[#22D3EE]/50 hover:text-[#F8FAFC]"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-[#22D3EE]" />}
                    <span>{sub}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom subject addition */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add another subject (e.g. Operating Systems)..."
                value={customSubjectInput}
                onChange={(e) => setCustomSubjectInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomSubject();
                  }
                }}
                className="flex-1 py-1.5 px-3 text-xs bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
              />
              <button
                type="button"
                onClick={handleAddCustomSubject}
                className="px-3 py-1.5 rounded-lg bg-[#111A2E] hover:bg-[#172033] border border-[#293449] text-[#22D3EE] text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* 5. PEDAGOGICAL & LANGUAGE PREFERENCES */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-[#22D3EE] flex items-center gap-2 pb-1 border-b border-[#293449]">
              <Globe className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Explanation & AI Tutor Preferences</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#B6C2D2] mb-1.5">
                  Explanation Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["English", "Telugu", "Bilingual"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setPreferredLanguage(lang)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        preferredLanguage === lang
                          ? "bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-sm glow-purple-sm"
                          : "bg-[#111A2E] border-[#293449] text-[#B6C2D2] hover:text-[#F8FAFC]"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#B6C2D2] mb-1.5">
                  Academic Depth Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExplanationLevel(lvl)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        explanationLevel === lvl
                          ? "bg-[#22D3EE] border-[#22D3EE] text-[#0B1020] font-bold shadow-sm shadow-[#22D3EE]/30"
                          : "bg-[#111A2E] border-[#293449] text-[#B6C2D2] hover:text-[#F8FAFC]"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#293449] flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-[#B6C2D2]/70 text-center sm:text-left">
              Your profile picture and personal records are saved to your secure persistent storage.
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[#293449] text-[#B6C2D2] hover:bg-[#111A2E] hover:text-[#F8FAFC] text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-bold transition-all cursor-pointer shadow-sm glow-purple-sm flex items-center justify-center gap-2 active:scale-95"
              >
                {isSubmitting ? (
                  <span>Saving Profile...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                    <span>Create & Activate Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
