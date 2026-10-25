import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  Calendar,
  FileText,
  BarChart2,
  Settings,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { AppDataStore } from "../services/api";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  data: AppDataStore;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, data }) => {
  // Count weak topics
  const allTopics = data.subjects.flatMap((s) => s.topics);
  const weakCount = allTopics.filter((t) => t.status === "critical" || t.status === "weak").length;
  const pendingTasks = data.studyPlan.filter((p) => p.status === "pending").length;

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "courses",
      label: "My Courses",
      icon: BookOpen,
      badge: `${data.subjects.length} Subjects`,
      badgeColor: "bg-[#111A2E] text-[#B6C2D2] border border-[#293449]",
    },
    {
      id: "tutor",
      label: "AI Tutor",
      icon: MessageSquare,
      badge: "Gemini 3.8",
      badgeColor: "bg-[#8B5CF6]/20 text-[#c084fc] border border-[#8B5CF6]/30",
    },
    {
      id: "quizzes",
      label: "Practice Quizzes",
      icon: CheckCircle2,
      badge: weakCount > 0 ? `${weakCount} focus` : null,
      badgeColor: "bg-rose-950/60 text-rose-300 border border-rose-800/40 font-semibold",
    },
    {
      id: "planner",
      label: "Study Planner",
      icon: Calendar,
      badge: pendingTasks > 0 ? `${pendingTasks} tasks` : null,
      badgeColor: "bg-amber-950/60 text-amber-300 border border-amber-800/40",
    },
    {
      id: "materials",
      label: "Study Materials",
      icon: FileText,
      badge: null,
    },
    {
      id: "analytics",
      label: "Progress Analytics",
      icon: BarChart2,
      badge: null,
    },
    {
      id: "profile",
      label: "Profile & Settings",
      icon: Settings,
      badge: null,
    },
  ];

  // Calculate days remaining to exam
  const examDate = new Date(data.profile.examDate);
  const now = new Date();
  const diffDays = Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <div className="sticky top-20 space-y-6">
        {/* Navigation list */}
        <div className="bg-[#172033] rounded-xl border border-[#293449] p-2 shadow-sm space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left ${
                  isActive
                    ? "bg-[#111A2E] text-[#F8FAFC] border border-[#8B5CF6]/40 shadow-xs glow-purple-sm"
                    : "text-[#B6C2D2] hover:text-[#F8FAFC] hover:bg-[#111A2E]/60 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#22D3EE]" : "text-[#B6C2D2]"}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? "bg-[#172033] text-[#22D3EE] border border-[#22D3EE]/30"
                        : item.badgeColor || "bg-[#111A2E] text-[#B6C2D2]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Exam Countdown Card */}
        <div className="bg-[#172033] rounded-xl border border-[#293449] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#B6C2D2] uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>Target Milestone</span>
          </div>
          <p className="text-sm font-bold text-[#F8FAFC] leading-snug">
            {data.profile.examName}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#22D3EE] font-mono tabular-nums">
              {diffDays}
            </span>
            <span className="text-xs text-[#B6C2D2] font-medium">days remaining</span>
          </div>
          <p className="text-[11px] text-[#B6C2D2]/80 mt-1">
            Target exam: {new Date(data.profile.examDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {/* Weakness Alert Card */}
        {weakCount > 0 && (
          <div className="bg-[#111A2E] border border-amber-500/30 rounded-xl p-3.5 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-200">
                  {weakCount} Topic{weakCount > 1 ? "s" : ""} Need Attention
                </p>
                <p className="text-[#B6C2D2] text-[11px] mt-0.5 leading-relaxed">
                  Quizzes identified concept gaps below the 70% proficiency threshold.
                </p>
                <button
                  onClick={() => setActiveTab("quizzes")}
                  className="mt-2 text-xs font-semibold text-[#22D3EE] hover:underline cursor-pointer flex items-center gap-1"
                >
                  Start targeted quiz →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
