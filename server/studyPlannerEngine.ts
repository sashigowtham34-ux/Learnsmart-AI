/**
 * Deterministic Study Planner and Recommendation Engine
 *
 * Implements deterministic scheduling with strict constraints:
 * 1. Bounded daily study time (total allocated minutes per day <= student's daily study budget)
 * 2. Multi-day schedule generation towards upcoming examination dates
 * 3. Transparent priority scoring based on weakness (<40%, 40-69%), exam proximity, learning goals, and prerequisites
 * 4. Distinct activity types: learning lessons, practice problem sets, spaced revision, and diagnostic quizzes
 * 5. Handles completed and postponed tasks with rollover
 * 6. Completely decoupled from UI for standalone testing and validation
 */

import { StudentProfile, SubjectData, StudyPlanItem, TopicPerformance, QuizResult } from "./store.js";

export interface PlannerConfig {
  dailyStudyTimeMinutes: number; // e.g., 60, 90, 120
  examDate: string; // ISO format e.g. "2026-11-15"
  examName: string;
  enrolledSubjects: string[];
  learningGoals: string[];
}

export interface DaySchedule {
  date: string; // "YYYY-MM-DD"
  dayLabel: string; // "Today", "Tomorrow", "Thursday, Oct 16", etc.
  totalMinutesScheduled: number;
  availableMinutesBudget: number;
  isFeasible: boolean;
  activities: StudyPlanItem[];
}

export interface PrerequisiteRule {
  topic: string;
  prerequisite: string;
  subject: string;
}

// Curriculum prerequisite graph for engineering subjects
export const PREREQUISITE_RULES: PrerequisiteRule[] = [
  // C Programming
  { topic: "Control Structures & Loops", prerequisite: "Variables, Data Types & Operators", subject: "C Programming" },
  { topic: "Functions, Recursion & Storage Classes", prerequisite: "Control Structures & Loops", subject: "C Programming" },
  { topic: "Arrays & String Manipulation", prerequisite: "Functions, Recursion & Storage Classes", subject: "C Programming" },
  { topic: "Pointers & Dynamic Memory Allocation", prerequisite: "Arrays & String Manipulation", subject: "C Programming" },
  { topic: "Structures, Unions & File I/O", prerequisite: "Pointers & Dynamic Memory Allocation", subject: "C Programming" },

  // Engineering Mathematics
  { topic: "Eigenvalues, Eigenvectors & Cayley-Hamilton", prerequisite: "Matrices, Rank & Linear Systems", subject: "Engineering Mathematics" },
  { topic: "Multiple Integrals: Double & Triple Integrals", prerequisite: "Differential Calculus & Mean Value Theorems", subject: "Engineering Mathematics" },
  { topic: "Vector Calculus: Gradient, Divergence & Curl", prerequisite: "Multiple Integrals: Double & Triple Integrals", subject: "Engineering Mathematics" },

  // Engineering Physics
  { topic: "Lasers & Optical Fiber Communication", prerequisite: "Interference & Diffraction of Light", subject: "Engineering Physics" },
  { topic: "Quantum Mechanics & Schrödinger Wave Equation", prerequisite: "Interference & Diffraction of Light", subject: "Engineering Physics" },
  { topic: "Semiconductors & P-N Junction Physics", prerequisite: "Quantum Mechanics & Schrödinger Wave Equation", subject: "Engineering Physics" },
];

export class StudyPlannerEngine {
  /**
   * Calculate priority score for a topic
   */
  public static calculateTopicPriority(
    topic: TopicPerformance,
    daysUntilExam: number,
    learningGoals: string[],
    prerequisitesMet: boolean
  ): {
    score: number;
    urgencyReason: string;
    suggestedActivityType: StudyPlanItem["type"];
    suggestedMinutes: number;
  } {
    let priorityScore = 0;
    const reasons: string[] = [];
    let activityType: StudyPlanItem["type"] = "practice";
    let minutes = 25;

    // 1. Weakness score component (0 to 100)
    // Topics below 40% receive maximum urgency
    if (topic.score < 40) {
      priorityScore += 90;
      reasons.push(`Critical score gap (${topic.score}% < 40%)`);
      activityType = "lesson"; // Foundational review
      minutes = 30;
    } else if (topic.score < 70) {
      priorityScore += 65;
      reasons.push(`Score needs improvement (${topic.score}% < 70%)`);
      activityType = "practice";
      minutes = 25;
    } else if (topic.score < 85) {
      priorityScore += 35;
      reasons.push(`Proficient (${topic.score}%): maintenance revision`);
      activityType = "revision";
      minutes = 20;
    } else {
      priorityScore += 15;
      reasons.push(`Mastered (${topic.score}%): periodic check`);
      activityType = "quiz";
      minutes = 15;
    }

    // 2. Exam proximity component
    if (daysUntilExam <= 7) {
      priorityScore += 40;
      reasons.push(`Exam imminent (${daysUntilExam} days away)`);
    } else if (daysUntilExam <= 30) {
      priorityScore += 25;
      reasons.push(`Exam in ${daysUntilExam} days`);
    } else {
      priorityScore += 10;
    }

    // 3. Learning goals alignment
    const matchesGoal = learningGoals.some(
      (goal) =>
        goal.toLowerCase().includes(topic.name.toLowerCase()) ||
        topic.name.toLowerCase().split(" ").some((w) => w.length > 4 && goal.toLowerCase().includes(w))
    );
    if (matchesGoal) {
      priorityScore += 30;
      reasons.push("Explicitly matches active learning goal");
    }

    // 4. Prerequisite check
    if (!prerequisitesMet) {
      // Deprioritize dependent topic slightly until prerequisite is solidified
      priorityScore -= 20;
      reasons.push("Recommended to solidify prerequisite concepts first");
    }

    return {
      score: Math.max(priorityScore, 5),
      urgencyReason: reasons.join("; "),
      suggestedActivityType: activityType,
      suggestedMinutes: minutes,
    };
  }

  /**
   * Check if prerequisites are met for a given topic
   */
  public static checkPrerequisites(
    topicName: string,
    subjectName: string,
    allTopics: TopicPerformance[]
  ): { met: boolean; prerequisiteName?: string; prerequisiteScore?: number } {
    const rule = PREREQUISITE_RULES.find(
      (r) => r.subject.toLowerCase() === subjectName.toLowerCase() && r.topic.toLowerCase() === topicName.toLowerCase()
    );

    if (!rule) {
      return { met: true };
    }

    const prereqTopic = allTopics.find(
      (t) => t.subjectName.toLowerCase() === subjectName.toLowerCase() && t.name.toLowerCase() === rule.prerequisite.toLowerCase()
    );

    if (!prereqTopic) {
      return { met: true };
    }

    // Prerequisite is considered met if score >= 60%
    const met = prereqTopic.score >= 60;
    return {
      met,
      prerequisiteName: prereqTopic.name,
      prerequisiteScore: prereqTopic.score,
    };
  }

  /**
   * Generate an adaptive, deterministic multi-day study schedule
   */
  public static generateSchedule(params: {
    subjects: SubjectData[];
    profile: StudentProfile;
    existingPlan: StudyPlanItem[];
    daysCount?: number; // default: 7 days
    referenceDate?: Date; // default: today
  }): {
    days: DaySchedule[];
    allScheduledItems: StudyPlanItem[];
    summary: {
      totalTasks: number;
      totalMinutes: number;
      averageDailyMinutes: number;
      criticalTopicsCovered: number;
    };
  } {
    const { subjects, profile, existingPlan, daysCount = 7, referenceDate = new Date() } = params;

    const dailyBudget = Math.max(30, Math.min(profile.dailyStudyTimeMinutes || 90, 240));
    const examDate = new Date(profile.examDate);
    const daysUntilExam = Math.max(
      1,
      Math.ceil((examDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Extract all topics from enrolled subjects
    const enrolledNames = profile.enrolledSubjects.map((s) => s.toLowerCase());
    const validSubjects = subjects.filter(
      (sub) => enrolledNames.length === 0 || enrolledNames.includes(sub.name.toLowerCase())
    );
    const allTopics = validSubjects.flatMap((s) => s.topics);

    // Find postponed items from existing plan that are not completed
    const postponedItems = existingPlan.filter((p) => p.status === "postponed");

    // Candidate activity pool
    interface CandidateActivity {
      id?: string;
      title: string;
      subject: string;
      topic: string;
      estimatedMinutes: number;
      type: StudyPlanItem["type"];
      priority: StudyPlanItem["priority"];
      reason: string;
      priorityWeight: number;
      isPostponed?: boolean;
    }

    const candidatePool: CandidateActivity[] = [];

    // 1. Re-queue postponed items with highest priority
    for (const item of postponedItems) {
      candidatePool.push({
        id: item.id,
        title: item.title,
        subject: item.subject,
        topic: item.topic,
        estimatedMinutes: item.estimatedMinutes,
        type: item.type,
        priority: "high",
        reason: `Carried over from postponed schedule: ${item.reason}`,
        priorityWeight: 120, // Highest boost
        isPostponed: true,
      });
    }

    // 2. Generate activity candidates for each topic based on weaknesses and goals
    for (const topic of allTopics) {
      const prereq = this.checkPrerequisites(topic.name, topic.subjectName, allTopics);
      const evalResult = this.calculateTopicPriority(
        topic,
        daysUntilExam,
        profile.learningGoals,
        prereq.met
      );

      // Create tailored title based on activity type
      let title = "";
      if (evalResult.suggestedActivityType === "lesson") {
        title = `Foundations & Guided Examples: ${topic.name}`;
      } else if (evalResult.suggestedActivityType === "practice") {
        title = `Targeted Problem Set: ${topic.name}`;
      } else if (evalResult.suggestedActivityType === "revision") {
        title = `Spaced Revision & Concept Recall: ${topic.name}`;
      } else {
        title = `Diagnostic Checkpoint Quiz: ${topic.name}`;
      }

      const priorityRating: StudyPlanItem["priority"] =
        evalResult.score >= 80 ? "high" : evalResult.score >= 50 ? "medium" : "low";

      // Reason string explains clearly why this activity is scheduled
      let detailedReason = evalResult.urgencyReason;
      if (!prereq.met && prereq.prerequisiteName) {
        detailedReason += ` (Note: Prerequisite '${prereq.prerequisiteName}' scored ${prereq.prerequisiteScore}%)`;
      }

      candidatePool.push({
        title,
        subject: topic.subjectName,
        topic: topic.name,
        estimatedMinutes: evalResult.suggestedMinutes,
        type: evalResult.suggestedActivityType,
        priority: priorityRating,
        reason: detailedReason,
        priorityWeight: evalResult.score,
      });

      // If topic is critical (<40%), also add a follow-up checkpoint quiz candidate
      if (topic.score < 40) {
        candidatePool.push({
          title: `Post-Review Checkpoint: ${topic.name}`,
          subject: topic.subjectName,
          topic: topic.name,
          estimatedMinutes: 15,
          type: "quiz",
          priority: "high",
          reason: `Verification assessment after foundational review (${topic.score}% initial score).`,
          priorityWeight: evalResult.score - 5,
        });
      }
    }

    // Sort all candidates by priorityWeight descending
    candidatePool.sort((a, b) => b.priorityWeight - a.priorityWeight);

    // 3. Deterministic Day-by-Day Knapsack Allocation
    // Strict Constraint: Total minutes per day MUST NOT exceed dailyBudget
    const days: DaySchedule[] = [];
    const allScheduledItems: StudyPlanItem[] = [];
    const scheduledTitles = new Set<string>();

    // Include existing completed items from today so we don't over-schedule today!
    const todayStr = referenceDate.toISOString().split("T")[0];
    const todayCompleted = existingPlan.filter(
      (p) => p.date === todayStr && p.status === "completed"
    );

    let candidateIndex = 0;

    for (let dayOffset = 0; dayOffset < daysCount; dayOffset++) {
      const currentDayDate = new Date(referenceDate);
      currentDayDate.setDate(referenceDate.getDate() + dayOffset);
      const dateStr = currentDayDate.toISOString().split("T")[0];

      let dayLabel = "";
      if (dayOffset === 0) dayLabel = "Today";
      else if (dayOffset === 1) dayLabel = "Tomorrow";
      else {
        dayLabel = currentDayDate.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      }

      // Check if day is exam day or beyond
      const isPastExam = currentDayDate > examDate;

      const dayActivities: StudyPlanItem[] = [];
      let minutesUsed = 0;

      // On day 0 (today), count already completed tasks towards budget
      if (dayOffset === 0) {
        for (const done of todayCompleted) {
          minutesUsed += done.estimatedMinutes;
          dayActivities.push(done);
          scheduledTitles.add(done.title);
        }
      }

      // Fill remaining budget for this day with prioritized candidates
      while (candidateIndex < candidatePool.length) {
        const candidate = candidatePool[candidateIndex];

        // Skip if already scheduled
        if (scheduledTitles.has(candidate.title)) {
          candidateIndex++;
          continue;
        }

        // Check if candidate fits in remaining daily budget
        if (minutesUsed + candidate.estimatedMinutes <= dailyBudget) {
          const item: StudyPlanItem = {
            id: candidate.id || `plan-gen-${Date.now()}-${dayOffset}-${dayActivities.length}`,
            date: dateStr,
            title: candidate.title,
            subject: candidate.subject,
            topic: candidate.topic,
            estimatedMinutes: candidate.estimatedMinutes,
            type: candidate.type,
            status: "pending",
            priority: candidate.priority,
            reason: candidate.reason,
          };

          dayActivities.push(item);
          allScheduledItems.push(item);
          scheduledTitles.add(candidate.title);
          minutesUsed += candidate.estimatedMinutes;
          candidateIndex++;
        } else {
          // Can't fit this task today, move to next day unless it's too large for any day
          if (candidate.estimatedMinutes > dailyBudget) {
            // Trim task to fit budget if single task is larger than budget
            candidate.estimatedMinutes = dailyBudget;
          } else {
            // Try next candidate or break to next day
            break;
          }
        }
      }

      days.push({
        date: dateStr,
        dayLabel: isPastExam ? `${dayLabel} (Post-Exam)` : dayLabel,
        totalMinutesScheduled: minutesUsed,
        availableMinutesBudget: dailyBudget,
        isFeasible: minutesUsed <= dailyBudget,
        activities: dayActivities,
      });

      // Stop scheduling if we passed the exam date by 1 day
      if (isPastExam) break;
    }

    const criticalCovered = allTopics.filter((t) => t.score < 40).length;

    return {
      days,
      allScheduledItems,
      summary: {
        totalTasks: allScheduledItems.length,
        totalMinutes: allScheduledItems.reduce((acc, a) => acc + a.estimatedMinutes, 0),
        averageDailyMinutes: Math.round(
          allScheduledItems.reduce((acc, a) => acc + a.estimatedMinutes, 0) / Math.max(1, days.length)
        ),
        criticalTopicsCovered: criticalCovered,
      },
    };
  }

  /**
   * Validate that a proposed schedule complies with daily study budget constraints
   */
  public static validateScheduleFeasibility(
    activities: StudyPlanItem[],
    dailyBudgetMinutes: number
  ): {
    isValid: boolean;
    violations: { date: string; scheduledMinutes: number; allowedBudget: number; excess: number }[];
  } {
    const dayTotals: Record<string, number> = {};

    for (const act of activities) {
      if (act.status !== "postponed") {
        dayTotals[act.date] = (dayTotals[act.date] || 0) + act.estimatedMinutes;
      }
    }

    const violations: { date: string; scheduledMinutes: number; allowedBudget: number; excess: number }[] = [];

    for (const [date, total] of Object.entries(dayTotals)) {
      if (total > dailyBudgetMinutes) {
        violations.push({
          date,
          scheduledMinutes: total,
          allowedBudget: dailyBudgetMinutes,
          excess: total - dailyBudgetMinutes,
        });
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }
}
