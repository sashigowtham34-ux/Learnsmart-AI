/**
 * Unit Tests for Personalized Learning Recommendation Engine
 *
 * Verifies:
 * 1. Calculation of topic performance from completed quizzes
 * 2. Distinction between actual measured scores and estimated mastery confidence
 * 3. Detection of recurring mistakes from quiz question failures
 * 4. Configurable score thresholds and growth-mindset categorization
 * 5. Consideration of topic prerequisites and student learning goals
 * 6. Dynamic update of recommendations when quiz results change
 * 7. Ability for students to revisit any topic
 */

import {
  RecommendationEngine,
  DEFAULT_THRESHOLDS,
  ConfigurableThresholds,
} from "../recommendationEngine.js";
import { getInitialDemoData, QuizResult } from "../store.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

export function runRecommendationTests() {
  console.log("\n=======================================================");
  console.log("RUNNING PERSONALIZED RECOMMENDATION ENGINE UNIT TESTS");
  console.log("=======================================================\n");

  const baseData = getInitialDemoData();

  // -----------------------------------------------------------------
  // TEST 1: Topic Performance Calculation & Actual vs Estimated Mastery
  // -----------------------------------------------------------------
  console.log("--- TEST 1: Actual Measured Score vs Estimated Mastery ---");

  // In demo data, C Pointers has 1 recent quiz with score 38%
  const pointersPerf = RecommendationEngine.calculateTopicPerformance(
    "Pointers & Dynamic Memory Allocation",
    "C Programming",
    baseData.quizHistory,
    38
  );

  assert(pointersPerf.attempts > 0, "Calculated non-zero attempts from quiz history");
  assert(pointersPerf.actualScore === 38, `Actual measured score matches quiz result: ${pointersPerf.actualScore}%`);
  assert(
    pointersPerf.estimatedMastery !== undefined && typeof pointersPerf.estimatedMastery === "number",
    `Estimated mastery computed: ${pointersPerf.estimatedMastery}%`
  );
  // Estimated mastery has shrinkage factor toward baseline when confidence is preliminary
  assert(
    pointersPerf.estimatedMastery > pointersPerf.actualScore,
    `Estimated mastery (${pointersPerf.estimatedMastery}%) accounts for uncertainty beyond single low attempt`
  );

  // -----------------------------------------------------------------
  // TEST 2: Recurring Mistake Detection
  // -----------------------------------------------------------------
  console.log("\n--- TEST 2: Recurring Mistake Detection ---");
  const mistakes = RecommendationEngine.identifyRecurringMistakes(
    "Pointers & Dynamic Memory Allocation",
    baseData.quizHistory
  );

  assert(mistakes.length > 0, `Identified ${mistakes.length} recurring mistake cluster(s)`);
  const pointerMistake = mistakes.find((m) =>
    m.conceptCluster.toLowerCase().includes("pointer")
  );
  assert(
    pointerMistake !== undefined,
    `Identified concept failure: "${pointerMistake?.conceptCluster}" (${pointerMistake?.mistakeCount} occurrences)`
  );

  // -----------------------------------------------------------------
  // TEST 3: Configurable Score Thresholds
  // -----------------------------------------------------------------
  console.log("\n--- TEST 3: Configurable Score Thresholds ---");
  const scoreToTest = 45; // Under default (critical=40, practice=70), 45 is "developing"

  const defaultEval = RecommendationEngine.mapScoreToGrowthStatus(scoreToTest, DEFAULT_THRESHOLDS);
  assert(
    defaultEval.status === "developing",
    `Score 45% under default thresholds (<40 critical) is: "${defaultEval.label}"`
  );

  // Configure custom stricter threshold: critical=50%
  const customThresholds: ConfigurableThresholds = {
    criticalThreshold: 50,
    practiceThreshold: 75,
    masteryThreshold: 90,
  };
  const customEval = RecommendationEngine.mapScoreToGrowthStatus(scoreToTest, customThresholds);
  assert(
    customEval.status === "active_focus",
    `Score 45% under stricter threshold (<50 critical) adapts to: "${customEval.label}"`
  );

  // -----------------------------------------------------------------
  // TEST 4: Prerequisite Dependencies & Learning Goals
  // -----------------------------------------------------------------
  console.log("\n--- TEST 4: Prerequisites & Learning Goals ---");
  const allTopics = baseData.subjects.flatMap((s) => s.topics);
  const pointersTopic = allTopics.find((t) => t.name.toLowerCase().includes("pointer"))!;

  const evaluation = RecommendationEngine.evaluateTopic(
    pointersTopic,
    allTopics,
    baseData.quizHistory,
    baseData.profile,
    DEFAULT_THRESHOLDS
  );

  assert(evaluation.matchesLearningGoal === true, "Identified alignment with active student learning goals");
  assert(
    evaluation.prerequisiteDetails !== undefined,
    `Checked prerequisite: ${evaluation.prerequisiteDetails?.name} (Score: ${evaluation.prerequisiteDetails?.score}%)`
  );
  assert(
    evaluation.recommendations.some((r) => r.type === "lesson"),
    "Generated foundational review lesson for critical score gap"
  );
  assert(
    Boolean(evaluation.recommendations[0]?.reason.includes("38%")),
    `Transparent explanation includes measured score: "${evaluation.recommendations[0]?.reason}"`
  );

  // -----------------------------------------------------------------
  // TEST 5: Dynamic Re-Evaluation When Quiz Results Change
  // -----------------------------------------------------------------
  console.log("\n--- TEST 5: Dynamic Updating When Quiz Results Change ---");

  // Step 1: Initial state (score 38% -> active_focus -> foundational review lesson)
  const initialEval = RecommendationEngine.evaluateTopic(
    pointersTopic,
    allTopics,
    baseData.quizHistory,
    baseData.profile
  );
  assert(
    initialEval.growthStatus === "active_focus",
    `Initial status with 38% score is "${initialEval.statusLabel}"`
  );
  assert(
    initialEval.recommendations[0].type === "lesson",
    `Initial recommendation is a foundational lesson: "${initialEval.recommendations[0].title}"`
  );

  // Step 2: Student completes a new assessment on Pointers and scores 94%!
  const simulatedNewQuiz: QuizResult = {
    id: "quiz-sim-retake",
    title: "C Pointers Mastery Assessment",
    subject: "C Programming",
    topic: "Pointers & Dynamic Memory Allocation",
    score: 94,
    totalQuestions: 5,
    correctAnswers: 5,
    difficulty: "Advanced",
    completedAt: new Date().toISOString(),
    isSample: false,
    questions: [
      {
        question: "Dereferencing double pointer **pptr",
        options: ["A", "B", "C", "D"],
        userAnswer: 0,
        correctAnswer: 0,
        explanation: "Correctly resolved indirection",
        isCorrect: true,
      },
    ],
  };

  const updatedQuizHistory = [simulatedNewQuiz, ...baseData.quizHistory];

  const updatedTopic = {
    ...pointersTopic,
    score: 94,
  };

  const updatedEval = RecommendationEngine.evaluateTopic(
    updatedTopic,
    allTopics,
    updatedQuizHistory,
    baseData.profile
  );

  assert(
    updatedEval.actualMeasuredScore >= 70,
    `Measured score updated to reflect recent 94% quiz: ${updatedEval.actualMeasuredScore}%`
  );
  assert(
    updatedEval.growthStatus !== "active_focus",
    `Growth status dynamically upgraded from "active_focus" to "${updatedEval.statusLabel}"`
  );
  assert(
    !updatedEval.recommendations.some((r) => r.title.startsWith("Foundations Review")),
    "Emergency foundational review lesson was automatically removed after student demonstrated mastery"
  );
  assert(
    updatedEval.recommendations[0].type === "practice" || updatedEval.recommendations[0].type === "revision",
    `New recommendation dynamically shifted to advanced exercises: "${updatedEval.recommendations[0].title}"`
  );

  // -----------------------------------------------------------------
  // TEST 6: Student Can Revisit Any Topic
  // -----------------------------------------------------------------
  console.log("\n--- TEST 6: Ability to Revisit Any Topic ---");
  const fullEvaluation = RecommendationEngine.evaluateAllTopics(
    baseData.subjects,
    baseData.quizHistory,
    baseData.profile
  );

  assert(
    fullEvaluation.allRecommendations.every((r) => r.canRevisitAnytime === true),
    "All generated recommendations allow students to revisit topics at any time"
  );
  assert(
    fullEvaluation.evaluatedTopics.length === allTopics.length,
    `Evaluated all ${allTopics.length} syllabus topics`
  );

  console.log("\n=======================================================");
  console.log("ALL RECOMMENDATION ENGINE TESTS PASSED WITH 100% SUCCESS! 🎉");
  console.log("=======================================================\n");
}

// Run immediately if executed via CLI
runRecommendationTests();
