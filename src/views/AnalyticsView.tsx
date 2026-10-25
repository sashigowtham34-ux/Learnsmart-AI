import React, { useState } from "react";
import {
  BarChart2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Filter,
} from "lucide-react";
import { AppDataStore } from "../services/api";
import { ScoreBadge } from "../components/ScoreBadge";

interface AnalyticsViewProps {
  data: AppDataStore;
  onNavigate: (tab: string, context?: { subject?: string; topic?: string }) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  data,
  onNavigate,
}) => {
  const [filterSubject, setFilterSubject] = useState<string>("all");

  const allTopics = data.subjects.flatMap((s) => s.topics);
  const critical = allTopics.filter((t) => t.status === "critical");
  const weak = allTopics.filter((t) => t.status === "weak");
  const proficient = allTopics.filter((t) => t.status === "proficient");
  const mastered = allTopics.filter((t) => t.status === "mastered");

  const completedActivities = data.studyPlan.filter((p) => p.status === "completed").length;
  const totalActivities = data.studyPlan.length;

  const filteredTopics = filterSubject === "all"
    ? allTopics
    : allTopics.filter((t) => t.subjectName.toLowerCase() === filterSubject.toLowerCase());

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-[#22D3EE] font-medium">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]"></span>
          <span>Student Diagnostics</span>
          <span aria-hidden="true" className="text-[#293449]">·</span>
          <span>Performance Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] mt-1">
          Progress & Weakness Analytics
        </h1>
        <p className="text-sm text-[#B6C2D2] mt-1">
          Quantitative tracking of concept mastery across subjects, assessment logs, and study-plan execution.
        </p>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#172033] p-5 rounded-xl border border-[#293449] shadow-sm">
          <span className="text-xs text-[#B6C2D2] font-medium block">Total Quizzes Attempted</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] font-mono tabular-nums mt-1 block">
            {data.quizHistory.length}
          </span>
          <span className="text-[11px] text-[#22D3EE] mt-1 block">Validated assessments</span>
        </div>

        <div className="bg-[#172033] p-5 rounded-xl border border-[#293449] shadow-sm">
          <span className="text-xs text-[#B6C2D2] font-medium block">Critical Concept Gaps (&lt;40%)</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono tabular-nums mt-1 block">
            {critical.length}
          </span>
          <span className="text-[11px] text-rose-400 mt-1 block">Immediate focus required</span>
        </div>

        <div className="bg-[#172033] p-5 rounded-xl border border-[#293449] shadow-sm">
          <span className="text-xs text-[#B6C2D2] font-medium block">Proficient / Mastered</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#22D3EE] font-mono tabular-nums mt-1 block">
            {proficient.length + mastered.length}
          </span>
          <span className="text-[11px] text-[#B6C2D2] mt-1 block">Of {allTopics.length} tracked topics</span>
        </div>

        <div className="bg-[#172033] p-5 rounded-xl border border-[#293449] shadow-sm">
          <span className="text-xs text-[#B6C2D2] font-medium block">Study Plan Completion</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#8B5CF6] font-mono tabular-nums mt-1 block">
            {totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0}%
          </span>
          <span className="text-[11px] text-[#B6C2D2] mt-1 block">
            {completedActivities} / {totalActivities} tasks finished
          </span>
        </div>
      </div>

      {/* Split: Subject Comparison Bars + Mastery Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Subject Comparative Chart (7 cols) */}
        <div className="lg:col-span-7 bg-[#172033] rounded-2xl border border-[#293449] p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-[#F8FAFC]">
              Subject Mastery Benchmark
            </h2>
            <p className="text-xs text-[#B6C2D2]">
              Average performance calculated across all assessed units
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {data.subjects.map((sub) => (
              <div key={sub.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#F8FAFC]">{sub.name}</span>
                  <span className="font-mono font-bold text-[#22D3EE] tabular-nums">
                    {sub.progressPercent}%
                  </span>
                </div>
                <div className="w-full bg-[#111A2E] rounded-full h-3 overflow-hidden border border-[#293449]">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      sub.progressPercent < 60
                        ? "bg-rose-500"
                        : sub.progressPercent < 75
                        ? "bg-amber-500"
                        : "bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]"
                    }`}
                    style={{ width: `${sub.progressPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#293449] flex items-center justify-between text-xs text-[#B6C2D2]">
            <span>Engineering College Benchmark: 65%</span>
            <span className="text-[#22D3EE]">Target Goal: 90%</span>
          </div>
        </div>

        {/* Right: Mastery Distribution Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-[#172033] rounded-2xl border border-[#293449] p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-[#F8FAFC]">
              Mastery Tier Distribution
            </h2>
            <p className="text-xs text-[#B6C2D2]">
              Categorization across all syllabus topics
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs">
              <div>
                <span className="font-bold text-rose-300 block">Critical Gap (&lt;40%)</span>
                <span className="text-[11px] text-rose-400">Immediate fundamental review</span>
              </div>
              <span className="text-lg font-bold font-mono text-rose-300 tabular-nums">
                {critical.length}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-950/40 border border-amber-800/40 text-xs">
              <div>
                <span className="font-bold text-amber-300 block">Needs Practice (40%–69%)</span>
                <span className="text-[11px] text-amber-400">Targeted exercises & guided hints</span>
              </div>
              <span className="text-lg font-bold font-mono text-amber-300 tabular-nums">
                {weak.length}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#111A2E] border border-[#22D3EE]/30 text-xs">
              <div>
                <span className="font-bold text-[#22D3EE] block">Proficient (70%–84%)</span>
                <span className="text-[11px] text-[#B6C2D2]">Solid grasp; spaced repetition</span>
              </div>
              <span className="text-lg font-bold font-mono text-[#22D3EE] tabular-nums">
                {proficient.length}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[#111A2E] border border-[#8B5CF6]/40 text-xs">
              <div>
                <span className="font-bold text-[#c084fc] block">Mastered (85%+)</span>
                <span className="text-[11px] text-[#B6C2D2]">Advanced synthesis</span>
              </div>
              <span className="text-lg font-bold font-mono text-[#c084fc] tabular-nums">
                {mastered.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Topic-Wise Detailed Table */}
      <div className="bg-[#172033] rounded-2xl border border-[#293449] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#293449] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#F8FAFC]">
              Topic-by-Topic Performance Ledger
            </h2>
            <p className="text-xs text-[#B6C2D2]">
              Individual assessment records and automated recommendation actions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#B6C2D2] font-medium">Filter Subject:</span>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="text-xs bg-[#111A2E] border border-[#293449] rounded-lg px-2.5 py-1.5 text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
            >
              <option value="all">All Subjects</option>
              {data.subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111A2E] border-b border-[#293449] text-[#B6C2D2] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Topic Name</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Last Assessed</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#293449]">
              {filteredTopics.map((topic) => (
                <tr key={topic.id} className="hover:bg-[#111A2E]/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#F8FAFC] whitespace-nowrap">
                    {topic.subjectName}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#F8FAFC] max-w-xs truncate">
                    {topic.name}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <ScoreBadge score={topic.score} />
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-[#B6C2D2] whitespace-nowrap">
                    {topic.attempts}
                  </td>
                  <td className="py-3 px-4 text-[#B6C2D2]/80 whitespace-nowrap">
                    {topic.lastAssessed}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button
                      onClick={() =>
                        onNavigate("tutor", {
                          subject: topic.subjectName,
                          topic: topic.name,
                        })
                      }
                      className="text-xs font-semibold text-[#22D3EE] hover:underline cursor-pointer"
                    >
                      Study Topic →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-[#172033] rounded-2xl border border-[#293449] p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#F8FAFC]">
          Learning Activity History
        </h2>

        <div className="space-y-3">
          {data.activityLogs.slice(0, 6).map((act) => (
            <div key={act.id} className="flex items-start gap-3 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE] mt-1.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[#F8FAFC] font-medium leading-relaxed">{act.description}</p>
                <span className="text-[11px] text-[#B6C2D2]/70">
                  {new Date(act.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
