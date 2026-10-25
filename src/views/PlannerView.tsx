import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  RotateCw,
  Sparkles,
  Info,
  Check,
  ChevronRight,
  Filter,
  Edit3,
  Trash2,
  ShieldCheck,
  Sliders,
  CalendarCheck,
} from "lucide-react";
import {
  AppDataStore,
  StudyPlanItem,
  RevisionItem,
  updateStudyPlanStatus,
  updateRevisionItemStatus,
  addCustomStudyPlanItem,
  editPlanActivity,
  deletePlanActivity,
  regenerateAdaptivePlan,
} from "../services/api";
import { ScoreBadge } from "../components/ScoreBadge";

interface PlannerViewProps {
  data: AppDataStore;
  onNavigate: (tab: string, context?: { subject?: string; topic?: string }) => void;
  onDataRefresh: (updated: AppDataStore) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  data,
  onNavigate,
  onDataRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<"daily" | "multiday" | "revision" | "algorithm">("daily");
  const [filterType, setFilterType] = useState<"all" | "lesson" | "practice" | "revision" | "quiz">("all");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenNotice, setRegenNotice] = useState<string | null>(null);

  // Add Task Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskSubject, setNewTaskSubject] = useState(data.subjects[0]?.name || "C Programming");
  const [newTaskTopic, setNewTaskTopic] = useState("");
  const [newTaskMinutes, setNewTaskMinutes] = useState(25);
  const [newTaskType, setNewTaskType] = useState<StudyPlanItem["type"]>("practice");
  const [newTaskPriority, setNewTaskPriority] = useState<StudyPlanItem["priority"]>("medium");

  // Edit Task Modal state
  const [editingItem, setEditingItem] = useState<StudyPlanItem | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowDateObj = new Date();
  tomorrowDateObj.setDate(tomorrowDateObj.getDate() + 1);
  const tomorrowStr = tomorrowDateObj.toISOString().split("T")[0];

  // Daily budget calculations
  const dailyBudget = data.profile.dailyStudyTimeMinutes || 90;
  const todayTasks = data.studyPlan.filter((p) => p.date === todayStr || (!p.date && p.status !== "postponed"));
  const todayScheduledMinutes = todayTasks
    .filter((p) => p.status !== "postponed")
    .reduce((sum, p) => sum + p.estimatedMinutes, 0);

  const todayCompletedMinutes = todayTasks
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.estimatedMinutes, 0);

  const bufferRemaining = Math.max(0, dailyBudget - todayScheduledMinutes);

  // Group tasks by date for the multi-day timeline
  const multiDayGroups = React.useMemo(() => {
    const groups: Record<string, StudyPlanItem[]> = {};
    for (const item of data.studyPlan) {
      const d = item.date || todayStr;
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    }
    // Sort dates
    return Object.keys(groups)
      .sort()
      .map((dateKey) => {
        const items = groups[dateKey];
        const scheduledMins = items.reduce((sum, i) => sum + i.estimatedMinutes, 0);
        let label = dateKey;
        if (dateKey === todayStr) label = "Today";
        else if (dateKey === tomorrowStr) label = "Tomorrow";
        else {
          const dObj = new Date(dateKey + "T00:00:00");
          label = dObj.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
        }
        return {
          date: dateKey,
          label,
          scheduledMins,
          isFeasible: scheduledMins <= dailyBudget,
          items,
        };
      });
  }, [data.studyPlan, todayStr, tomorrowStr, dailyBudget]);

  const handleUpdatePlan = async (id: string, status: StudyPlanItem["status"]) => {
    try {
      const updated = await updateStudyPlanStatus(id, status);
      onDataRefresh(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRevision = async (id: string, status: RevisionItem["status"]) => {
    try {
      const updated = await updateRevisionItemStatus(id, status);
      onDataRefresh(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setRegenNotice(null);
    try {
      const res = await regenerateAdaptivePlan(7);
      onDataRefresh(res.data);
      setRegenNotice(
        `Generated adaptive schedule: ${res.summary.totalTasks} activities calibrated within your ${dailyBudget}-min daily budget.`
      );
      setTimeout(() => setRegenNotice(null), 5000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const updated = await addCustomStudyPlanItem({
        date: todayStr,
        title: newTaskTitle.trim(),
        subject: newTaskSubject,
        topic: newTaskTopic || newTaskSubject,
        estimatedMinutes: Number(newTaskMinutes) || 25,
        type: newTaskType,
        status: "pending",
        priority: newTaskPriority,
        reason: "User scheduled custom activity",
      });

      onDataRefresh(updated);
      setShowAddModal(false);
      setNewTaskTitle("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const updated = await editPlanActivity(editingItem.id, {
        title: editingItem.title,
        estimatedMinutes: Number(editingItem.estimatedMinutes),
        type: editingItem.type,
        priority: editingItem.priority,
        date: editingItem.date,
      });

      onDataRefresh(updated);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Remove this activity from your study plan?")) return;
    try {
      const updated = await deletePlanActivity(id);
      onDataRefresh(updated);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter items
  const filteredTodayTasks = todayTasks.filter((item) => {
    if (filterType === "all") return true;
    return item.type === filterType;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#22D3EE] font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]"></span>
            <span>Deterministic Scheduling</span>
            <span aria-hidden="true" className="text-[#293449]">·</span>
            <span>Adaptive Knapsack Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] mt-1">
            Personalized Study Planner
          </h1>
          <p className="text-sm text-[#B6C2D2] mt-1">
            Builds feasible daily schedules strictly bounded by your available study time ({dailyBudget} mins/day) and prioritized by exam proximity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="px-3.5 py-2 rounded-xl bg-[#172033] hover:bg-[#111A2E] border border-[#293449] hover:border-[#8B5CF6]/50 text-[#F8FAFC] text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            title="Recalculate feasible schedule using latest quiz scores and study budget"
          >
            <RotateCw className={`w-3.5 h-3.5 text-[#22D3EE] ${isRegenerating ? "animate-spin" : ""}`} />
            <span>{isRegenerating ? "Calculating..." : "Recalculate Schedule"}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-semibold transition-all cursor-pointer shadow-sm glow-purple-sm flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#22D3EE]" />
            <span>Add Activity</span>
          </button>
        </div>
      </div>

      {regenNotice && (
        <div className="p-3.5 rounded-xl bg-[#111A2E] border border-[#22D3EE]/30 text-xs text-[#22D3EE] flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#22D3EE] shrink-0" />
          <span>{regenNotice}</span>
        </div>
      )}

      {/* Daily Study Budget & Feasibility Meter */}
      <div className="bg-[#172033] rounded-2xl border border-[#293449] p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-[#B6C2D2] uppercase tracking-wider block">
            Today's Scheduled Load
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#F8FAFC] font-mono tabular-nums">
              {todayScheduledMinutes}
            </span>
            <span className="text-xs text-[#B6C2D2] font-medium">/ {dailyBudget} mins budget</span>
          </div>
          <p className="text-[11px] text-[#B6C2D2]">
            {todayCompletedMinutes} mins completed ({Math.round(todayScheduledMinutes > 0 ? (todayCompletedMinutes / todayScheduledMinutes) * 100 : 0)}%)
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-[#B6C2D2] uppercase tracking-wider block">
            Feasibility Status
          </span>
          <div className="flex items-center gap-2 mt-1">
            {todayScheduledMinutes <= dailyBudget ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22D3EE] bg-[#111A2E] px-2.5 py-1 rounded-md border border-[#22D3EE]/30">
                <ShieldCheck className="w-4 h-4 text-[#22D3EE]" />
                <span>Feasible (Within Budget)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-800/40">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Over-Budget by {todayScheduledMinutes - dailyBudget}m</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#B6C2D2]">
            Buffer remaining: <strong className="font-mono text-[#22D3EE]">{bufferRemaining} mins</strong>
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-[#B6C2D2] uppercase tracking-wider block">
            Target Exam Countdown
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#22D3EE] font-mono tabular-nums">
              {Math.max(0, Math.ceil((new Date(data.profile.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
            </span>
            <span className="text-xs text-[#B6C2D2] font-medium">days until {data.profile.examName}</span>
          </div>
          <p className="text-[11px] text-[#B6C2D2]">
            Exam Date: {data.profile.examDate}
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-[#293449]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("daily")}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "daily"
                ? "border-[#22D3EE] text-[#22D3EE]"
                : "border-transparent text-[#B6C2D2] hover:text-[#F8FAFC]"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Today's Plan ({todayTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("multiday")}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "multiday"
                ? "border-[#22D3EE] text-[#22D3EE]"
                : "border-transparent text-[#B6C2D2] hover:text-[#F8FAFC]"
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Multi-Day Timeline ({multiDayGroups.length} Days)</span>
          </button>

          <button
            onClick={() => setActiveTab("revision")}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "revision"
                ? "border-[#22D3EE] text-[#22D3EE]"
                : "border-transparent text-[#B6C2D2] hover:text-[#F8FAFC]"
            }`}
          >
            <RotateCw className="w-4 h-4" />
            <span>Spaced Revision ({data.revisionQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("algorithm")}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "algorithm"
                ? "border-[#22D3EE] text-[#22D3EE]"
                : "border-transparent text-[#B6C2D2] hover:text-[#F8FAFC]"
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Deterministic Rules</span>
          </button>
        </div>

        {/* Filter controls on daily view */}
        {activeTab === "daily" && (
          <div className="hidden sm:flex items-center gap-1 pb-2">
            {(["all", "lesson", "practice", "revision", "quiz"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 text-xs rounded-md capitalize font-medium transition-colors cursor-pointer ${
                  filterType === t
                    ? "bg-[#8B5CF6] text-white shadow-xs"
                    : "text-[#B6C2D2] hover:bg-[#111A2E] hover:text-[#F8FAFC]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: TODAY'S DETAILED PLAN */}
      {activeTab === "daily" && (
        <div className="space-y-4">
          <div className="space-y-3">
            {filteredTodayTasks.length === 0 ? (
              <div className="bg-[#172033] rounded-2xl border border-[#293449] p-8 text-center text-[#B6C2D2] text-xs">
                No activities scheduled for today under this filter. Click "Add Activity" or "Recalculate Schedule" to generate tasks.
              </div>
            ) : (
              filteredTodayTasks.map((item) => {
                const isCompleted = item.status === "completed";
                const isPostponed = item.status === "postponed";

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCompleted
                        ? "bg-[#111A2E]/70 border-[#293449] text-[#B6C2D2] opacity-75"
                        : isPostponed
                        ? "bg-[#111A2E] border-amber-500/30 opacity-70"
                        : item.priority === "high"
                        ? "bg-[#172033] border-rose-500/40 shadow-sm"
                        : "bg-[#172033] border-[#293449] shadow-sm"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        {/* Status Checkbox */}
                        <button
                          onClick={() =>
                            handleUpdatePlan(item.id, isCompleted ? "pending" : "completed")
                          }
                          className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors ${
                            isCompleted
                              ? "bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-[0_0_8px_#8B5CF6]"
                              : "border-[#293449] hover:border-[#8B5CF6] bg-[#111A2E]"
                          }`}
                          title={isCompleted ? "Mark pending" : "Mark completed"}
                        >
                          {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-[#B6C2D2]">
                            <span className="font-semibold text-[#F8FAFC]">{item.subject}</span>
                            <span aria-hidden="true" className="text-[#293449]">·</span>
                            <span className="capitalize font-medium text-[#22D3EE]">{item.type}</span>
                            <span aria-hidden="true" className="text-[#293449]">·</span>
                            <span className="font-mono tabular-nums font-semibold text-[#F8FAFC]">
                              {item.estimatedMinutes} mins
                            </span>
                            {item.priority === "high" && (
                              <>
                                <span aria-hidden="true" className="text-[#293449]">·</span>
                                <span className="text-rose-400 font-semibold">High Priority</span>
                              </>
                            )}
                            {isPostponed && (
                              <>
                                <span aria-hidden="true" className="text-[#293449]">·</span>
                                <span className="text-amber-300 font-semibold bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.2 rounded text-[11px]">
                                  Postponed (+1 Day)
                                </span>
                              </>
                            )}
                          </div>

                          <h3
                            className={`text-base font-bold ${
                              isCompleted ? "line-through text-[#64748B]" : "text-[#F8FAFC]"
                            }`}
                          >
                            {item.title}
                          </h3>

                          {/* Transparent Rationale */}
                          <div className="pt-1 flex items-start gap-1.5 text-xs text-[#B6C2D2]">
                            <span className="font-semibold text-[#F8FAFC] shrink-0">Reason:</span>
                            <span className="leading-relaxed">{item.reason}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 rounded-lg text-[#B6C2D2] hover:text-[#F8FAFC] hover:bg-[#111A2E] transition-colors cursor-pointer"
                          title="Edit activity details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {!isCompleted && !isPostponed && (
                          <button
                            onClick={() => handleUpdatePlan(item.id, "postponed")}
                            className="px-2.5 py-1.5 text-xs font-medium text-[#B6C2D2] hover:text-[#F8FAFC] hover:bg-[#111A2E] rounded-lg transition-colors cursor-pointer border border-[#293449]"
                          >
                            Postpone
                          </button>
                        )}

                        {isPostponed && (
                          <button
                            onClick={() => handleUpdatePlan(item.id, "pending")}
                            className="px-2.5 py-1.5 text-xs font-semibold text-[#22D3EE] hover:bg-[#111A2E] rounded-lg transition-colors cursor-pointer border border-[#22D3EE]/30"
                          >
                            Restore Today
                          </button>
                        )}

                        {!isCompleted && (
                          <button
                            onClick={() =>
                              item.type === "quiz"
                                ? onNavigate("quizzes", { subject: item.subject, topic: item.topic })
                                : onNavigate("tutor", { subject: item.subject, topic: item.topic })
                            }
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white transition-all cursor-pointer shadow-sm glow-purple-sm active:scale-95"
                          >
                            {item.type === "quiz" ? "Launch Quiz" : "Study Topic"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-DAY TIMELINE */}
      {activeTab === "multiday" && (
        <div className="space-y-6">
          <div className="bg-[#111A2E] border border-[#22D3EE]/30 rounded-xl p-4 text-xs text-[#22D3EE] space-y-1">
            <p className="font-semibold text-[#F8FAFC]">Deterministic Knapsack Scheduling Model</p>
            <p className="text-[#B6C2D2] leading-relaxed">
              Every day's activities are strictly validated so the total estimated minutes never exceed your configured daily study budget ({dailyBudget} mins). Tasks that do not fit into today are automatically rolled forward to tomorrow.
            </p>
          </div>

          <div className="space-y-6">
            {multiDayGroups.map((dayGroup) => (
              <div key={dayGroup.date} className="bg-[#172033] rounded-2xl border border-[#293449] overflow-hidden shadow-sm">
                {/* Day Header */}
                <div className="p-4 bg-[#111A2E] border-b border-[#293449] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#F8FAFC]">
                      {dayGroup.label}
                    </span>
                    <span className="text-xs text-[#B6C2D2] font-mono">
                      ({dayGroup.date})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-[#B6C2D2]">
                      <strong className="text-[#F8FAFC]">{dayGroup.scheduledMins}</strong> / {dailyBudget} mins
                    </span>
                    {dayGroup.isFeasible ? (
                      <span className="text-[11px] font-semibold text-[#22D3EE] bg-[#172033] px-2 py-0.5 rounded border border-[#22D3EE]/30">
                        Feasible
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                        Over-budget
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Activities */}
                <div className="divide-y divide-[#293449] p-2">
                  {dayGroup.items.map((act) => (
                    <div key={act.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5 overflow-hidden">
                        <div className="flex items-center gap-2 text-[11px] text-[#B6C2D2]">
                          <span className="font-semibold text-[#F8FAFC]">{act.subject}</span>
                          <span aria-hidden="true" className="text-[#293449]">·</span>
                          <span className="capitalize text-[#22D3EE]">{act.type}</span>
                          <span aria-hidden="true" className="text-[#293449]">·</span>
                          <span className="font-mono tabular-nums">{act.estimatedMinutes} mins</span>
                          {act.priority === "high" && (
                            <span className="text-rose-400 font-semibold">Priority</span>
                          )}
                        </div>
                        <p className="font-bold text-[#F8FAFC] truncate">{act.title}</p>
                        <p className="text-[#B6C2D2] text-[11px] truncate">{act.reason}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setEditingItem(act)}
                          className="p-1 rounded text-[#B6C2D2] hover:text-[#F8FAFC] hover:bg-[#111A2E]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            act.type === "quiz"
                              ? onNavigate("quizzes", { subject: act.subject, topic: act.topic })
                              : onNavigate("tutor", { subject: act.subject, topic: act.topic })
                          }
                          className="px-2.5 py-1 rounded bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-semibold text-[11px] shadow-sm glow-purple-sm cursor-pointer"
                        >
                          Launch
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SPACED REVISION QUEUE */}
      {activeTab === "revision" && (
        <div className="space-y-6">
          <div className="bg-[#111A2E] border border-[#22D3EE]/30 rounded-xl p-4 text-xs text-[#22D3EE] space-y-1">
            <p className="font-semibold text-[#F8FAFC]">Ebbinghaus Spaced Repetition Logic</p>
            <p className="text-[#B6C2D2] leading-relaxed">
              When an assessment score is lower than 70%, the revision interval resets to 1–2 days. When marked reviewed, interval doubles (1d → 2d → 4d → 8d → 16d).
            </p>
          </div>

          <div className="bg-[#172033] rounded-2xl border border-[#293449] overflow-hidden shadow-sm divide-y divide-[#293449]">
            {data.revisionQueue.map((item) => (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#B6C2D2]">
                    <span className="font-semibold text-[#F8FAFC]">{item.subjectName}</span>
                    <span aria-hidden="true" className="text-[#293449]">·</span>
                    <span>Interval: {item.intervalDays} days</span>
                    <span aria-hidden="true" className="text-[#293449]">·</span>
                    <span>Due Date: {item.dueDate}</span>
                  </div>

                  <h3 className="text-base font-bold text-[#F8FAFC]">
                    {item.topicName}
                  </h3>

                  <div className="flex items-center gap-2 pt-0.5">
                    <ScoreBadge score={item.score} />
                    <span className="text-xs text-[#B6C2D2]/70">
                      Last reviewed: {item.lastReviewedDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleUpdateRevision(item.id, "needs_practice")}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/40 rounded-lg transition-colors cursor-pointer"
                  >
                    Needs Practice
                  </button>
                  <button
                    onClick={() => handleUpdateRevision(item.id, "postponed")}
                    className="px-3 py-1.5 text-xs text-[#B6C2D2] hover:bg-[#111A2E] border border-[#293449] rounded-lg transition-colors cursor-pointer"
                  >
                    Postpone (+1d)
                  </button>
                  <button
                    onClick={() => handleUpdateRevision(item.id, "completed")}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-[#8B5CF6] hover:bg-[#7c3aed] text-white rounded-lg transition-all cursor-pointer shadow-sm glow-purple-sm active:scale-95"
                  >
                    Mark Reviewed
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DETERMINISTIC RULES DISCLOSURE */}
      {activeTab === "algorithm" && (
        <div className="bg-[#172033] rounded-2xl border border-[#293449] p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#F8FAFC]">
              Deterministic Scheduling Constraints & Formulation
            </h2>
            <p className="text-xs text-[#B6C2D2] mt-1">
              The recommendation engine runs locally on verified deterministic logic. It calculates daily task allocations using a knapsack algorithm that respects student constraints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-[#293449] bg-[#111A2E] space-y-2">
              <span className="font-bold text-[#22D3EE] uppercase tracking-wider block">
                1. Feasible Study Budget Constraint
              </span>
              <p className="text-[#F8FAFC] leading-relaxed font-mono">
                Total Allocated Minutes per Day ≤ Daily Study Time Budget
              </p>
              <p className="text-[#B6C2D2] leading-relaxed">
                The system will never schedule more minutes than the student specifies in their profile ({dailyBudget} mins). If an urgent activity exceeds remaining minutes today, it is scheduled first thing tomorrow.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#293449] bg-[#111A2E] space-y-2">
              <span className="font-bold text-[#8B5CF6] uppercase tracking-wider block">
                2. Multi-Objective Priority Weighting
              </span>
              <p className="text-[#B6C2D2] leading-relaxed">
                Prioritization score blends:
                - Weakness severity: &lt;40% receives +90 urgency; 40–69% receives +65 urgency.
                - Exam proximity: &lt;7 days receives +40 boost.
                - Student goals: Direct goal matches receive +30 boost.
                - Postponed rollover: Postponed tasks receive +120 rollover boost.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#293449] bg-[#111A2E] space-y-2">
              <span className="font-bold text-[#22D3EE] uppercase tracking-wider block">
                3. Activity Mix Balance
              </span>
              <p className="text-[#B6C2D2] leading-relaxed">
                Schedules a healthy pedagogy mix:
                - <strong>Foundational Lessons (30m)</strong> for critical gaps &lt;40%.
                - <strong>Targeted Practice (25m)</strong> for scores 40–69%.
                - <strong>Spaced Revision (20m)</strong> for consolidating scores 70–84%.
                - <strong>Checkpoint Quizzes (15m)</strong> to verify retention.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#293449] bg-[#111A2E] space-y-2">
              <span className="font-bold text-[#8B5CF6] uppercase tracking-wider block">
                4. Prerequisite Dependencies
              </span>
              <p className="text-[#B6C2D2] leading-relaxed">
                If a prerequisite topic has a score &lt; 60% (e.g. Arrays before Pointers), the dependent advanced topic is flagged with an explicit advisory recommending prerequisite review first.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ACTIVITY MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#172033] rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#293449] space-y-4">
            <h3 className="text-base font-bold text-[#F8FAFC]">Edit Study Activity</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#B6C2D2] mb-1">
                  Activity Title
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#B6C2D2] mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min="5"
                    max={dailyBudget}
                    value={editingItem.estimatedMinutes}
                    onChange={(e) => setEditingItem({ ...editingItem, estimatedMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#B6C2D2] mb-1">Target Date</label>
                  <input
                    type="date"
                    value={editingItem.date || todayStr}
                    onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                    className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#B6C2D2] mb-1">Activity Type</label>
                  <select
                    value={editingItem.type}
                    onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as any })}
                    className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  >
                    <option value="lesson">Foundational Lesson</option>
                    <option value="practice">Targeted Practice</option>
                    <option value="revision">Spaced Revision</option>
                    <option value="quiz">Checkpoint Quiz</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#B6C2D2] mb-1">Priority</label>
                  <select
                    value={editingItem.priority}
                    onChange={(e) => setEditingItem({ ...editingItem, priority: e.target.value as any })}
                    className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#293449] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteItem(editingItem.id)}
                  className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Task</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-3 py-1.5 text-[#B6C2D2] hover:text-[#F8FAFC] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-semibold cursor-pointer shadow-sm glow-purple-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#172033] rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#293449] space-y-4">
            <h3 className="text-base font-bold text-[#F8FAFC]">Add Study Activity</h3>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#B6C2D2] mb-1">
                  Activity Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Pointer Arithmetic & Memory Addresses"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] placeholder:text-[#64748b] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#B6C2D2] mb-1">Subject</label>
                  <select
                    value={newTaskSubject}
                    onChange={(e) => {
                      setNewTaskSubject(e.target.value);
                      const sub = data.subjects.find((s) => s.name === e.target.value);
                      if (sub && sub.topics.length > 0) setNewTaskTopic(sub.topics[0].name);
                    }}
                    className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  >
                    {data.subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#B6C2D2] mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min="5"
                    max={dailyBudget}
                    value={newTaskMinutes}
                    onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#B6C2D2] mb-1">Activity Type</label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as any)}
                    className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  >
                    <option value="lesson">Foundational Lesson</option>
                    <option value="practice">Targeted Practice</option>
                    <option value="revision">Spaced Revision</option>
                    <option value="quiz">Checkpoint Quiz</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#B6C2D2] mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-[#111A2E] border border-[#293449] rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#293449] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-[#B6C2D2] hover:text-[#F8FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-semibold cursor-pointer shadow-sm glow-purple-sm active:scale-95"
                >
                  Schedule Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
