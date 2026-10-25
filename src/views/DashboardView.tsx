import React, { useState } from "react";
import {
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Info,
  Check,
  TrendingUp,
} from "lucide-react";
import { AppDataStore, StudyPlanItem } from "../services/api";
import { ScoreBadge } from "../components/ScoreBadge";

interface DashboardViewProps {
  data: AppDataStore;
  onNavigate: (tab: string, context?: { subject?: string; topic?: string }) => void;
  onUpdatePlanStatus: (id: string, status: StudyPlanItem["status"]) => void;
  onOpenCreateProfile?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onNavigate,
  onUpdatePlanStatus,
  onOpenCreateProfile,
}) => {
  const [showAlgorithmDetails, setShowAlgorithmDetails] = useState(false);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);

  // Compute summary stats
  const allTopics = data.subjects.flatMap((s) => s.topics);
  const criticalTopics = allTopics.filter((t) => t.status === "critical");
  const weakTopics = allTopics.filter((t) => t.status === "weak");
  const attentionCount = criticalTopics.length + weakTopics.length;

  const totalScoreSum = allTopics.reduce((acc, t) => acc + t.score, 0);
  const overallAvg = allTopics.length > 0 ? Math.round(totalScoreSum / allTopics.length) : 0;

  const todayPlans = data.studyPlan.filter((p) => p.status !== "postponed");
  const completedPlans = todayPlans.filter((p) => p.status === "completed").length;
  const plannedMinutes = todayPlans.reduce((sum, p) => sum + p.estimatedMinutes, 0);
  const completedMinutes = todayPlans
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.estimatedMinutes, 0);

  // Primary critical topic for recommendation spotlight
  const criticalSpotlight = criticalTopics[0] || weakTopics[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Welcome Hero Banner with subtle purple and cyan gradients */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#172033] via-[#141b2d] to-[#1b1c35] text-[#F8FAFC] p-6 sm:p-8 border border-[#293449] shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {data.profile.avatarUrl ? (
              <img
                src={data.profile.avatarUrl}
                alt={data.profile.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-[#8B5CF6]/50 shrink-0 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#6366f1] text-white flex items-center justify-center font-bold text-2xl sm:text-3xl shrink-0 shadow-md">
                {data.profile.name.charAt(0)}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#22D3EE] font-medium tracking-wide">
                <span>{data.profile.semester}</span>
                <span aria-hidden="true" className="text-[#293449]">·</span>
                <span>{data.profile.course}</span>
                {data.profile.rollNumber && (
                  <>
                    <span aria-hidden="true" className="text-[#293449]">·</span>
                    <span className="font-mono text-[#F8FAFC] bg-[#111A2E] px-1.5 py-0.5 rounded border border-[#293449] text-[11px]">
                      ID: {data.profile.rollNumber}
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
                Welcome back, {data.profile.name}!
              </h1>
              <p className="text-sm text-[#B6C2D2] max-w-xl leading-relaxed">
                {data.profile.bio ? (
                  <span>"{data.profile.bio}"</span>
                ) : (
                  <span>"Your Personal AI Tutor — Learn Smarter, Every Day."</span>
                )}
                {" "}Calibrated to prepare you for {data.profile.examName} ({data.profile.targetScoreOrRank || "Target 9.0+ CGPA"}).
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3 shrink-0">
            {onOpenCreateProfile && data.profile.isSampleData && (
              <button
                onClick={onOpenCreateProfile}
                className="px-4 py-2.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-bold shadow-sm glow-purple-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                <span>Create My Profile</span>
              </button>
            )}
            <button
              onClick={() => onNavigate("tutor", { subject: criticalSpotlight?.subjectName, topic: criticalSpotlight?.name })}
              className="px-4 py-2.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-semibold shadow-sm glow-purple-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-[#22D3EE]" />
              <span>Ask AI Tutor</span>
            </button>
            <button
              onClick={() => onNavigate("quizzes")}
              className="px-4 py-2.5 rounded-lg bg-[#111A2E] hover:bg-[#172033] text-[#22D3EE] text-xs font-semibold border border-[#22D3EE]/30 hover:border-[#22D3EE] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Take Assessment</span>
              <ArrowRight className="w-4 h-4 text-[#22D3EE]" />
            </button>
          </div>
        </div>

        {/* Ambient subtle background glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-60 h-60 bg-[#22D3EE]/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#172033] rounded-xl border border-[#293449] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#B6C2D2] font-medium">
            <span>Overall Mastery</span>
            <TrendingUp className="w-4 h-4 text-[#22D3EE]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] font-mono tabular-nums">
              {overallAvg}%
            </span>
            <span className="text-xs text-[#B6C2D2]">across 4 subjects</span>
          </div>
          <div className="mt-2 w-full bg-[#111A2E] rounded-full h-1.5 overflow-hidden border border-[#293449]">
            <div className="bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] h-1.5 rounded-full" style={{ width: `${overallAvg}%` }} />
          </div>
        </div>

        <div className="bg-[#172033] rounded-xl border border-[#293449] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#B6C2D2] font-medium">
            <span>Topics Requiring Practice</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono tabular-nums">
              {attentionCount}
            </span>
            <span className="text-xs text-[#B6C2D2]">scored &lt; 70%</span>
          </div>
          <p className="text-[11px] text-[#B6C2D2]/80 mt-2 truncate">
            {criticalTopics.length} critical gap (&lt;40%), {weakTopics.length} moderate
          </p>
        </div>

        <div className="bg-[#172033] rounded-xl border border-[#293449] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#B6C2D2] font-medium">
            <span>Today's Study Progress</span>
            <Clock className="w-4 h-4 text-[#22D3EE]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] font-mono tabular-nums">
              {completedMinutes}
            </span>
            <span className="text-xs text-[#B6C2D2]">/ {plannedMinutes} mins</span>
          </div>
          <div className="mt-2 w-full bg-[#111A2E] rounded-full h-1.5 overflow-hidden border border-[#293449]">
            <div
              className="bg-[#22D3EE] h-1.5 rounded-full shadow-[0_0_8px_#22D3EE]"
              style={{ width: `${plannedMinutes > 0 ? (completedMinutes / plannedMinutes) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-[#172033] rounded-xl border border-[#293449] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#B6C2D2] font-medium">
            <span>Quizzes Solved</span>
            <CheckCircle className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] font-mono tabular-nums">
              {data.quizHistory.length}
            </span>
            <span className="text-xs text-[#B6C2D2]">attempts</span>
          </div>
          <p className="text-[11px] text-[#B6C2D2]/80 mt-2">
            Last quiz: {data.quizHistory[0]?.subject || "Recent"} ({data.quizHistory[0]?.score || 0}%)
          </p>
        </div>
      </div>

      {/* 3. Critical Weakness Spotlight */}
      {criticalSpotlight && (
        <div className="bg-gradient-to-r from-[#172033] via-[#1c1833] to-[#172033] rounded-xl border border-rose-500/40 p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Priority Learning Gap Identified</span>
                <span className="text-[#293449]">·</span>
                <span className="font-normal text-[#B6C2D2]">{criticalSpotlight.subjectName}</span>
              </div>
              <h2 className="text-lg font-bold text-[#F8FAFC]">
                {criticalSpotlight.name}
              </h2>
              <p className="text-xs text-[#B6C2D2] max-w-2xl leading-relaxed">
                {criticalSpotlight.recommendation}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <span className="text-xs text-[#B6C2D2] block">Recent Assessment</span>
                <ScoreBadge score={criticalSpotlight.score} />
              </div>
              <button
                onClick={() => onNavigate("tutor", { subject: criticalSpotlight.subjectName, topic: criticalSpotlight.name })}
                className="px-3.5 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm glow-purple-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Explain Topic</span>
              </button>
              <button
                onClick={() => onNavigate("quizzes", { subject: criticalSpotlight.subjectName, topic: criticalSpotlight.name })}
                className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
              >
                Practice Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Split Grid: Today's Study Plan + Subject Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Today's Study Plan (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#F8FAFC]">
                Today's Adaptive Study Plan
              </h2>
              <p className="text-xs text-[#B6C2D2]">
                {completedPlans} of {todayPlans.length} tasks completed · {completedMinutes}/{plannedMinutes} mins
              </p>
            </div>
            <button
              onClick={() => onNavigate("planner")}
              className="text-xs font-semibold text-[#22D3EE] hover:text-[#38bdf8] flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Planner</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todayPlans.map((item) => {
              const isDone = item.status === "completed";
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 transition-all duration-150 ${
                    isDone
                      ? "bg-[#111A2E]/70 border-[#293449]/60 opacity-75"
                      : item.priority === "high"
                      ? "bg-[#172033] border-rose-500/40 shadow-xs"
                      : "bg-[#172033] border-[#293449] shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() =>
                          onUpdatePlanStatus(item.id, isDone ? "pending" : "completed")
                        }
                        className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                          isDone
                            ? "bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-[0_0_8px_#8B5CF6]"
                            : "border-[#293449] hover:border-[#8B5CF6] bg-[#111A2E]"
                        }`}
                        title={isDone ? "Mark incomplete" : "Mark as completed"}
                      >
                        {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 text-xs text-[#B6C2D2] mb-0.5">
                          <span className="font-semibold text-[#F8FAFC]">{item.subject}</span>
                          <span aria-hidden="true" className="text-[#293449]">·</span>
                          <span className="capitalize text-[#22D3EE]">{item.type}</span>
                          <span aria-hidden="true" className="text-[#293449]">·</span>
                          <span className="font-mono tabular-nums">{item.estimatedMinutes} mins</span>
                          {item.priority === "high" && (
                            <>
                              <span aria-hidden="true" className="text-[#293449]">·</span>
                              <span className="text-rose-400 font-semibold">Priority</span>
                            </>
                          )}
                        </div>
                        <h3
                          className={`text-sm font-semibold ${
                            isDone ? "line-through text-[#64748B]" : "text-[#F8FAFC]"
                          }`}
                        >
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#B6C2D2] mt-1 leading-relaxed">
                          {item.reason}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isDone && (
                        <button
                          onClick={() =>
                            item.type === "quiz"
                              ? onNavigate("quizzes", { subject: item.subject, topic: item.topic })
                              : onNavigate("tutor", { subject: item.subject, topic: item.topic })
                          }
                          className="px-2.5 py-1 text-xs font-semibold text-[#22D3EE] bg-[#111A2E] hover:bg-[#22D3EE]/15 border border-[#22D3EE]/30 rounded-md transition-colors cursor-pointer"
                        >
                          Start
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Subject-Wise Performance (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-[#F8FAFC]">
              Subject Mastery
            </h2>
            <button
              onClick={() => onNavigate("courses")}
              className="text-xs font-semibold text-[#22D3EE] hover:text-[#38bdf8] flex items-center gap-1 cursor-pointer"
            >
              <span>All Courses</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {data.subjects.map((sub) => {
              const weakSubTopics = sub.topics.filter(
                (t) => t.status === "critical" || t.status === "weak"
              );
              return (
                <div
                  key={sub.id}
                  onClick={() => onNavigate("courses", { subject: sub.name })}
                  className="bg-[#172033] rounded-xl border border-[#293449] p-4 shadow-sm hover:border-[#8B5CF6]/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-[#B6C2D2]/70">{sub.code}</span>
                      <h3 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#22D3EE] transition-colors">
                        {sub.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-[#22D3EE] font-mono tabular-nums">
                        {sub.progressPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 w-full bg-[#111A2E] rounded-full h-1.5 overflow-hidden border border-[#293449]">
                    <div
                      className={`h-1.5 rounded-full ${
                        sub.progressPercent < 60
                          ? "bg-rose-500"
                          : sub.progressPercent < 75
                          ? "bg-amber-500"
                          : "bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]"
                      }`}
                      style={{ width: `${sub.progressPercent}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#B6C2D2]">
                    <span>{sub.topics.length} topics tracked</span>
                    {weakSubTopics.length > 0 ? (
                      <span className="text-amber-400 font-medium">
                        {weakSubTopics.length} weak topic{weakSubTopics.length > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-[#22D3EE] font-medium">Proficient</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Spaced Revision Widget */}
          <div className="bg-[#111A2E] border border-[#293449] text-[#F8FAFC] rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#B6C2D2]">Upcoming Spaced Revision</span>
              <button
                onClick={() => onNavigate("planner")}
                className="text-[#22D3EE] hover:underline text-[11px] cursor-pointer"
              >
                View all ({data.revisionQueue.length})
              </button>
            </div>
            <div className="space-y-2">
              {data.revisionQueue.slice(0, 2).map((rev) => (
                <div
                  key={rev.id}
                  className="bg-[#172033] border border-[#293449] rounded-lg p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5 overflow-hidden pr-2">
                    <p className="font-medium text-[#F8FAFC] truncate">{rev.topicName}</p>
                    <p className="text-[11px] text-[#B6C2D2]">
                      {rev.subjectName} · Due: {rev.dueDate}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate("quizzes", { subject: rev.subjectName, topic: rev.topicName })}
                    className="px-2.5 py-1 rounded bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-[11px] font-semibold shrink-0 cursor-pointer shadow-sm glow-purple-sm"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent Assessments History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#F8FAFC]">
              Recent Quiz Assessments
            </h2>
            <p className="text-xs text-[#B6C2D2]">
              Detailed performance history used by the recommendation engine
            </p>
          </div>
          <button
            onClick={() => onNavigate("quizzes")}
            className="text-xs font-semibold text-[#22D3EE] hover:text-[#38bdf8] flex items-center gap-1 cursor-pointer"
          >
            <span>Take New Quiz</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-[#172033] rounded-xl border border-[#293449] overflow-hidden shadow-sm divide-y divide-[#293449]">
          {data.quizHistory.slice(0, 3).map((quiz) => {
            const isExpanded = expandedQuizId === quiz.id;
            return (
              <div key={quiz.id} className="p-4 transition-colors hover:bg-[#111A2E]/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#B6C2D2]">
                      <span className="font-semibold text-[#F8FAFC]">{quiz.subject}</span>
                      <span aria-hidden="true" className="text-[#293449]">·</span>
                      <span className="text-[#22D3EE]">{quiz.difficulty}</span>
                      <span aria-hidden="true" className="text-[#293449]">·</span>
                      <span>
                        {new Date(quiz.completedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {quiz.isSample && (
                        <>
                          <span aria-hidden="true" className="text-[#293449]">·</span>
                          <span className="text-[#B6C2D2]/60">Sample Record</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[#F8FAFC] mt-0.5">{quiz.title}</h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <ScoreBadge score={quiz.score} />
                    {quiz.questions && quiz.questions.length > 0 && (
                      <button
                        onClick={() => setExpandedQuizId(isExpanded ? null : quiz.id)}
                        className="text-xs font-semibold text-[#22D3EE] hover:underline cursor-pointer"
                      >
                        {isExpanded ? "Hide Mistakes" : "Review Mistakes"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded mistake review */}
                {isExpanded && quiz.questions && (
                  <div className="mt-4 pt-3 border-t border-[#293449] space-y-3 bg-[#111A2E] -mx-4 -mb-4 p-4">
                    <p className="text-xs font-semibold text-[#22D3EE] uppercase tracking-wider">
                      Mistake Analysis & Explanations:
                    </p>
                    {quiz.questions.map((q, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs ${
                          q.isCorrect
                            ? "bg-[#172033] border-[#22D3EE]/30"
                            : "bg-rose-950/40 border-rose-800/50"
                        }`}
                      >
                        <p className="font-semibold text-[#F8FAFC]">
                          Q{idx + 1}: {q.question}
                        </p>
                        <div className="mt-1 space-y-0.5">
                          <p className="text-[#B6C2D2]">
                            Your answer: <span className="font-medium text-[#F8FAFC]">{q.options[q.userAnswer]}</span>
                          </p>
                          {!q.isCorrect && (
                            <p className="text-[#22D3EE] font-medium">
                              Correct answer: {q.options[q.correctAnswer]}
                            </p>
                          )}
                          <p className="text-[#B6C2D2]/80 mt-1 italic">
                            Why: {q.explanation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Transparent Recommendation Algorithm Disclaimer */}
      <div className="bg-[#111A2E] rounded-xl p-4 border border-[#293449] text-xs text-[#B6C2D2] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-[#F8FAFC]">
            <Info className="w-4 h-4 text-[#22D3EE]" />
            <span>Transparent Recommendation Model Disclosure</span>
          </div>
          <button
            onClick={() => setShowAlgorithmDetails(!showAlgorithmDetails)}
            className="text-xs font-medium text-[#22D3EE] hover:underline cursor-pointer"
          >
            {showAlgorithmDetails ? "Hide rules" : "View recommendation rules"}
          </button>
        </div>
        <p className="leading-relaxed">
          Study plan and revision priorities are determined strictly by recent assessment scores, prerequisite relationships, and spaced repetition curves. They serve as configurable academic guidance rather than absolute measurements of learning capability.
        </p>

        {showAlgorithmDetails && (
          <div className="mt-3 pt-3 border-t border-[#293449] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[#F8FAFC]">
            <div className="bg-[#172033] p-3 rounded-lg border border-[#293449]">
              <span className="font-bold text-rose-400 block">Below 40%</span>
              <p className="text-[11px] text-[#B6C2D2] mt-1">
                Critical gap. Automatically schedules fundamental concept review and step-by-step guided lessons.
              </p>
            </div>
            <div className="bg-[#172033] p-3 rounded-lg border border-[#293449]">
              <span className="font-bold text-amber-400 block">40% to 69%</span>
              <p className="text-[11px] text-[#B6C2D2] mt-1">
                Needs practice. Recommends targeted practice questions, debugging, and AI-assisted explanations.
              </p>
            </div>
            <div className="bg-[#172033] p-3 rounded-lg border border-[#293449]">
              <span className="font-bold text-[#22D3EE] block">70% to 84%</span>
              <p className="text-[11px] text-[#B6C2D2] mt-1">
                Proficient. Recommends intermediate problem sets and scheduled spaced-revision checkpoints.
              </p>
            </div>
            <div className="bg-[#172033] p-3 rounded-lg border border-[#293449]">
              <span className="font-bold text-[#c084fc] block">85% and above</span>
              <p className="text-[11px] text-[#B6C2D2] mt-1">
                Mastered. Recommends advanced application synthesis and periodic long-interval maintenance quizzes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
