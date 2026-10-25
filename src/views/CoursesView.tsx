import React, { useState } from "react";
import {
  BookOpen,
  Sparkles,
  HelpCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Atom,
  Calculator,
  Cpu,
} from "lucide-react";
import { AppDataStore, SubjectData, TopicPerformance } from "../services/api";
import { ScoreBadge } from "../components/ScoreBadge";

interface CoursesViewProps {
  data: AppDataStore;
  initialSubject?: string;
  onNavigate: (tab: string, context?: { subject?: string; topic?: string }) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  data,
  initialSubject,
  onNavigate,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubject
      ? data.subjects.find((s) => s.name.toLowerCase() === initialSubject.toLowerCase())?.id || data.subjects[0].id
      : data.subjects[0].id
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "weak" | "proficient">("all");

  const currentSubject =
    data.subjects.find((s) => s.id === selectedSubjectId) || data.subjects[0];

  // Subject icons
  const subjectIcons: Record<string, React.ReactNode> = {
    "subj-c": <Code2 className="w-5 h-5 text-[#22D3EE]" />,
    "subj-python": <Cpu className="w-5 h-5 text-[#8B5CF6]" />,
    "subj-maths": <Calculator className="w-5 h-5 text-[#38bdf8]" />,
    "subj-physics": <Atom className="w-5 h-5 text-[#c084fc]" />,
  };

  // Subject custom generated artwork
  const subjectImages: Record<string, string> = {
    "subj-c": "/src/assets/images/course_c_programming_1791958435556.jpg",
    "subj-physics": "/src/assets/images/course_physics_quantum_1791958435646.jpg",
  };

  // Filter topics
  const filteredTopics = currentSubject.topics.filter((topic) => {
    const matchesSearch =
      topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.recommendation.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "weak") {
      return topic.status === "critical" || topic.status === "weak";
    }
    if (statusFilter === "proficient") {
      return topic.status === "proficient" || topic.status === "mastered";
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-[#22D3EE] font-medium">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]"></span>
          <span>Curriculum</span>
          <span aria-hidden="true" className="text-[#293449]">·</span>
          <span>{data.profile.semester}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] mt-1">
          Enrolled Engineering Courses
        </h1>
        <p className="text-sm text-[#B6C2D2] mt-1">
          Explore syllabus modules, assess your topic-by-topic comprehension, and launch AI-assisted explanations.
        </p>
      </div>

      {/* Course Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.subjects.map((sub) => {
          const isSelected = sub.id === currentSubject.id;
          const weakCount = sub.topics.filter(
            (t) => t.status === "critical" || t.status === "weak"
          ).length;

          return (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                isSelected
                  ? "bg-[#111A2E] border-[#8B5CF6] shadow-sm glow-purple-sm"
                  : "bg-[#172033] border-[#293449] hover:border-[#8B5CF6]/50 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-[#0B1020] border border-[#293449]">
                  {subjectIcons[sub.id] || <BookOpen className="w-5 h-5 text-[#22D3EE]" />}
                </div>
                <span className="text-xs font-bold font-mono text-[#22D3EE]">
                  {sub.progressPercent}%
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#B6C2D2]/70 block">{sub.code}</span>
              <h3 className="text-sm font-bold text-[#F8FAFC] truncate mt-0.5">{sub.name}</h3>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[#B6C2D2]">
                <span>{sub.topics.length} topics</span>
                {weakCount > 0 ? (
                  <span className="text-rose-400 font-medium">{weakCount} weak</span>
                ) : (
                  <span className="text-[#22D3EE] font-medium">Proficient</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Subject Banner & Controls */}
      <div className="bg-[#172033] rounded-2xl border border-[#293449] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#293449] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#B6C2D2]">
              <span className="font-mono text-[#22D3EE]">{currentSubject.code}</span>
              <span aria-hidden="true" className="text-[#293449]">·</span>
              <span>{currentSubject.category}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">
              {currentSubject.name}
            </h2>
            <p className="text-xs text-[#B6C2D2] leading-relaxed">
              {currentSubject.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate("tutor", { subject: currentSubject.name })}
              className="px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-semibold shadow-sm glow-purple-sm transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-[#22D3EE]" />
              <span>Ask Tutor About Subject</span>
            </button>
            <button
              onClick={() => onNavigate("quizzes", { subject: currentSubject.name })}
              className="px-4 py-2 rounded-lg bg-[#111A2E] hover:bg-[#172033] text-[#22D3EE] text-xs font-semibold border border-[#22D3EE]/30 hover:border-[#22D3EE] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Practice Subject Quiz</span>
            </button>
          </div>
        </div>

        {/* Course Visual Banner (if available) */}
        {subjectImages[currentSubject.id] && (
          <div className="relative h-48 sm:h-64 w-full bg-[#0B1020] overflow-hidden border-b border-[#293449]">
            <img
              src={subjectImages[currentSubject.id]}
              alt={currentSubject.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#172033] via-transparent to-transparent flex items-end p-6">
              <span className="text-xs font-medium text-[#22D3EE] bg-[#0B1020]/90 px-3 py-1 rounded-md backdrop-blur border border-[#293449]">
                Core Engineering Module Visual Reference
              </span>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="p-4 bg-[#111A2E] border-b border-[#293449] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#B6C2D2] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topics or concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#172033] border border-[#293449] text-[#F8FAFC] placeholder:text-[#64748b] rounded-lg focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#172033] border border-[#293449] rounded-lg self-stretch sm:self-auto justify-center">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                statusFilter === "all" ? "bg-[#8B5CF6] text-white shadow-xs" : "text-[#B6C2D2] hover:text-[#F8FAFC]"
              }`}
            >
              All ({currentSubject.topics.length})
            </button>
            <button
              onClick={() => setStatusFilter("weak")}
              className={`px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                statusFilter === "weak" ? "bg-rose-950/60 text-rose-300 border border-rose-800/40" : "text-[#B6C2D2] hover:text-rose-400"
              }`}
            >
              Needs Attention (&lt;70%)
            </button>
            <button
              onClick={() => setStatusFilter("proficient")}
              className={`px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                statusFilter === "proficient" ? "bg-[#111A2E] text-[#22D3EE] border border-[#22D3EE]/30" : "text-[#B6C2D2] hover:text-[#22D3EE]"
              }`}
            >
              Proficient (≥70%)
            </button>
          </div>
        </div>

        {/* Topic List */}
        <div className="divide-y divide-[#293449]">
          {filteredTopics.length === 0 ? (
            <div className="p-8 text-center text-[#B6C2D2] text-xs">
              No topics match your search criteria.
            </div>
          ) : (
            filteredTopics.map((topic, index) => {
              const isCritical = topic.status === "critical";
              const isWeak = topic.status === "weak";

              return (
                <div
                  key={topic.id}
                  className={`p-5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isCritical
                      ? "bg-[#172033] hover:bg-[#111A2E] border-l-2 border-l-rose-500"
                      : isWeak
                      ? "bg-[#172033] hover:bg-[#111A2E] border-l-2 border-l-amber-500"
                      : "bg-[#172033] hover:bg-[#111A2E]"
                  }`}
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 text-xs text-[#B6C2D2]">
                      <span className="font-mono text-[#22D3EE]">Unit {index + 1}</span>
                      <span aria-hidden="true" className="text-[#293449]">·</span>
                      <span>Assessed: {topic.lastAssessed}</span>
                      <span aria-hidden="true" className="text-[#293449]">·</span>
                      <span className="font-mono tabular-nums">{topic.attempts} attempts</span>
                    </div>

                    <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                      <span>{topic.name}</span>
                      {isCritical && (
                        <span className="text-[11px] font-semibold text-rose-300 bg-rose-950/60 border border-rose-800/40 px-2 py-0.5 rounded">
                          Critical Gap (&lt;40%)
                        </span>
                      )}
                    </h3>

                    <p className="text-xs text-[#B6C2D2] leading-relaxed">
                      {topic.recommendation}
                    </p>

                    <div className="pt-1 flex items-center gap-2 text-[11px] text-[#B6C2D2]/80">
                      <span className="font-semibold text-[#F8FAFC]">Recommended Action:</span>
                      <span>{topic.recommendedAction}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 self-end lg:self-center">
                    <ScoreBadge score={topic.score} />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onNavigate("tutor", {
                            subject: currentSubject.name,
                            topic: topic.name,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg border border-[#293449] hover:border-[#8B5CF6]/60 bg-[#111A2E] text-[#22D3EE] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                        <span>Explain</span>
                      </button>

                      <button
                        onClick={() =>
                          onNavigate("quizzes", {
                            subject: currentSubject.name,
                            topic: topic.name,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-sm glow-purple-sm active:scale-95"
                      >
                        <span>Quiz</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
