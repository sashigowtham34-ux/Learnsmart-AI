/**
 * Unit Tests for Deterministic Study Planner Engine
 *
 * Verifies:
 * 1. Daily study budget constraint (never schedules more than available minutes)
 * 2. Prioritization of weak topics (<40% critical score)
 * 3. Dynamic adjustment when quiz performance changes
 * 4. Multi-day schedule feasibility across various examination dates
 * 5. Rollover and scheduling of postponed and completed activities
 */

import { StudyPlannerEngine } from "../studyPlannerEngine.js";
import { getInitialDemoData, TopicPerformance, StudyPlanItem } from "../store.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

export function runPlannerTests() {
  console.log("\n==========================================");
  console.log("RUNNING STUDY PLANNER ENGINE UNIT TESTS");
  console.log("==========================================\n");

  const baseData = getInitialDemoData();

  // ---------------------------------------------------------
  // TEST 1: Daily Study Time Budget Constraint
  // ---------------------------------------------------------
  console.log("--- TEST 1: Daily Study Time Budget Constraint ---");
  const testBudgets = [45, 60, 90, 120, 180];

  for (const budget of testBudgets) {
    const customProfile = { ...baseData.profile, dailyStudyTimeMinutes: budget };
    const schedule = StudyPlannerEngine.generateSchedule({
      subjects: baseData.subjects,
      profile: customProfile,
      existingPlan: [],
      daysCount: 5,
    });

    assert(schedule.days.length > 0, `Schedule generated for budget ${budget}m`);

    for (const day of schedule.days) {
      assert(
        day.totalMinutesScheduled <= budget,
        `Day ${day.date} (${day.dayLabel}) scheduled ${day.totalMinutesScheduled}m <= budget ${budget}m`
      );
      assert(day.isFeasible === true, `Day ${day.date} marked feasible`);
    }
  }

  // ---------------------------------------------------------
  // TEST 2: Prioritizing Critical Weak Topics (<40%)
  // ---------------------------------------------------------
  console.log("\n--- TEST 2: Weak Topic Prioritization ---");
  const scheduleDay1 = StudyPlannerEngine.generateSchedule({
    subjects: baseData.subjects,
    profile: baseData.profile,
    existingPlan: [],
    daysCount: 1,
  });

  const day1Activities = scheduleDay1.days[0].activities;
  assert(day1Activities.length > 0, "Day 1 has scheduled activities");

  // In demo data, C Pointers is at 38% (critical weakness)
  const pointersActivity = day1Activities.find(
    (a) => a.topic.toLowerCase().includes("pointer")
  );
  assert(
    pointersActivity !== undefined,
    "Critical topic (<40% C Pointers) is scheduled on Day 1"
  );
  assert(
    pointersActivity?.priority === "high",
    "Critical topic is given high priority"
  );
  assert(
    Boolean(pointersActivity?.reason?.includes("40%")),
    `Reason clearly mentions score threshold: "${pointersActivity?.reason}"`
  );

  // ---------------------------------------------------------
  // TEST 3: Dynamic Re-Planning When Quiz Performance Changes
  // ---------------------------------------------------------
  console.log("\n--- TEST 3: Dynamic Re-Planning on Quiz Result Change ---");

  // Simulate student taking a quiz on C Pointers and scoring 92% (mastery!)
  const updatedSubjects = JSON.parse(JSON.stringify(baseData.subjects));
  for (const sub of updatedSubjects) {
    for (const t of sub.topics) {
      if (t.name.toLowerCase().includes("pointer")) {
        t.score = 92;
        t.status = "mastered";
      }
    }
  }

  const newSchedule = StudyPlannerEngine.generateSchedule({
    subjects: updatedSubjects,
    profile: baseData.profile,
    existingPlan: [],
    daysCount: 2,
  });

  // Verify that C Pointers foundational lesson is no longer top priority on Day 1
  const day1New = newSchedule.days[0].activities;
  const pointerLesson = day1New.find(
    (a) => a.topic.toLowerCase().includes("pointer") && a.type === "lesson"
  );

  assert(
    pointerLesson === undefined,
    "C Pointers emergency review lesson is removed after student masters it (92%)"
  );

  // Remaining weak topics (score < 70%: e.g. Structures 45%, Multiple Integrals 48%, Quantum 52%, Vector Calculus 58%, OOP 62%, Eigenvalues 68%)
  const weakTopicOnDay1 = day1New.find((a) => {
    const sub = updatedSubjects.find((s: any) => s.name === a.subject);
    const top = sub?.topics.find((t: any) => t.name === a.topic);
    return top && top.score < 70;
  });

  assert(
    weakTopicOnDay1 !== undefined,
    `Remaining weak topic (<70%) prioritized on Day 1: "${weakTopicOnDay1?.topic}" (${weakTopicOnDay1?.title})`
  );

  // ---------------------------------------------------------
  // TEST 4: Postponed Activities Rollover
  // ---------------------------------------------------------
  console.log("\n--- TEST 4: Postponed Task Rollover ---");
  const existingWithPostponed: StudyPlanItem[] = [
    {
      id: "postponed-task-1",
      date: "2026-10-13",
      title: "Urgent Review: Function Call Stack & Recursion",
      subject: "C Programming",
      topic: "Functions, Recursion & Storage Classes",
      estimatedMinutes: 20,
      type: "practice",
      status: "postponed",
      priority: "high",
      reason: "Postponed by student from previous day",
    },
  ];

  const rolloverSchedule = StudyPlannerEngine.generateSchedule({
    subjects: baseData.subjects,
    profile: baseData.profile,
    existingPlan: existingWithPostponed,
    daysCount: 3,
  });

  const day1Items = rolloverSchedule.days[0].activities;
  const rolledOver = day1Items.find((a) => a.id === "postponed-task-1");

  assert(
    rolledOver !== undefined,
    "Postponed activity successfully carried over to Day 1 schedule"
  );
  assert(
    rolloverSchedule.days[0].totalMinutesScheduled <= baseData.profile.dailyStudyTimeMinutes,
    "Day 1 with rollover still respects daily budget"
  );

  // ---------------------------------------------------------
  // TEST 5: Examination Proximity Scaling
  // ---------------------------------------------------------
  console.log("\n--- TEST 5: Examination Proximity Scaling ---");
  // Test with exam in 3 days vs exam in 60 days
  const now = new Date();
  const examSoon = new Date(now);
  examSoon.setDate(now.getDate() + 3);

  const examDistant = new Date(now);
  examDistant.setDate(now.getDate() + 60);

  const profileSoon = { ...baseData.profile, examDate: examSoon.toISOString().split("T")[0] };
  const profileDistant = { ...baseData.profile, examDate: examDistant.toISOString().split("T")[0] };

  const scheduleSoon = StudyPlannerEngine.generateSchedule({
    subjects: baseData.subjects,
    profile: profileSoon,
    existingPlan: [],
    daysCount: 3,
  });

  const scheduleDistant = StudyPlannerEngine.generateSchedule({
    subjects: baseData.subjects,
    profile: profileDistant,
    existingPlan: [],
    daysCount: 3,
  });

  assert(scheduleSoon.days.length <= 4, "Schedule generated up to imminent exam date");
  assert(scheduleDistant.days.length === 3, "Schedule generated for requested window");

  // ---------------------------------------------------------
  // TEST 6: Feasibility Validator
  // ---------------------------------------------------------
  console.log("\n--- TEST 6: Feasibility Validator ---");
  const feasibleActivities: StudyPlanItem[] = [
    {
      id: "1",
      date: "2026-10-14",
      title: "Task 1",
      subject: "C",
      topic: "Pointers",
      estimatedMinutes: 45,
      type: "lesson",
      status: "pending",
      priority: "high",
      reason: "",
    },
    {
      id: "2",
      date: "2026-10-14",
      title: "Task 2",
      subject: "C",
      topic: "Pointers",
      estimatedMinutes: 30,
      type: "practice",
      status: "pending",
      priority: "high",
      reason: "",
    },
  ];

  const validResult = StudyPlannerEngine.validateScheduleFeasibility(feasibleActivities, 90);
  assert(validResult.isValid === true, "Schedule with 75m <= 90m budget is valid");

  const invalidResult = StudyPlannerEngine.validateScheduleFeasibility(feasibleActivities, 60);
  assert(invalidResult.isValid === false, "Schedule with 75m > 60m budget is detected as violation");
  assert(invalidResult.violations[0].excess === 15, "Violation correctly identifies 15m excess");

  console.log("\n==========================================");
  console.log("ALL STUDY PLANNER TESTS PASSED SUCCESSFULLY! 🎉");
  console.log("==========================================\n");
}

// Run immediately if executed via CLI
runPlannerTests();
