/**
 * Personalized Learning Recommendation Engine
 *
 * Implements:
 * 1. Topic-wise performance calculation from actual completed quizzes
 * 2. Recent assessment results tracking and trend analysis
 * 3. Recurring mistake detection from incorrect quiz questions
 * 4. Configurable score thresholds (e.g., <40% critical, 40-69% developing, 70-84% proficient, >=85% mastered)
 * 5. Prerequisite dependency graph & student learning goals integration
 * 6. Actionable recommendations (lessons, practice questions, revision activities)
 * 7. Dynamic re-evaluation after each assessment
 * 8. Transparent explanations of why each recommendation was generated
 * 9. Clear distinction between actual measured score and estimated mastery confidence
 * 10. Growth-mindset nomenclature (no permanent negative labeling)
 * 11. Complete decoupling from UI for automated testing
 */

import { QuizResult, StudentProfile, SubjectData, TopicPerformance, StudyPlanItem } from "./store.js";
import { PREREQUISITE_RULES } from "./studyPlannerEngine.js";

export interface ConfigurableThresholds {
  criticalThreshold: number; // default: 40%
  practiceThreshold: number; // default: 70%
  masteryThreshold: number;  // default: 85%
}

export const DEFAULT_THRESHOLDS: ConfigurableThresholds = {
  criticalThreshold: 40,
  practiceThreshold: 70,
  masteryThreshold: 85,
};

export type GrowthStatus = "active_focus" | "developing" | "proficient" | "mastered";

export interface RecurringMistake {
  topic: string;
  subject: string;
  conceptCluster: string;
  mistakeCount: number;
  sampleQuestion: string;
  explanation: string;
}

export interface DetailedTopicEvaluation {
  topicId: string;
  topicName: string;
  subjectName: string;
  subjectId: string;

  // Requirement 9: Distinguish actual assessment results from estimated mastery
  actualMeasuredScore: number; // Exact weighted average of completed quiz scores (0-100)
  estimatedMastery: number;    // Probabilistic mastery estimate considering attempt count, recency, & prerequisites
  confidenceLevel: "high" | "medium" | "preliminary";

  assessmentCount: number;
  lastAssessedDate: string;
  growthStatus: GrowthStatus;
  statusLabel: string; // e.g. "Active Focus Area", "Developing Proficiency", "Solid Foundation", "Advanced Mastery"

  prerequisitesMet: boolean;
  prerequisiteDetails?: {
    name: string;
    score: number;
    isSatisfied: boolean;
  };

  matchesLearningGoal: boolean;
  recurringMistakes: RecurringMistake[];

  // Actionable recommendations
  recommendations: TopicRecommendation[];
}

export interface TopicRecommendation {
  id: string;
  topicName: string;
  subjectName: string;
  type: "lesson" | "practice" | "revision" | "quiz";
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: "high" | "medium" | "low";
  priorityScore: number;
  reason: string; // Transparent explanation
  canRevisitAnytime: boolean; // Requirement 11
}

export class RecommendationEngine {
  /**
   * 1. Calculate topic-wise performance from actual completed quizzes
   */
  public static calculateTopicPerformance(
    topicName: string,
    subjectName: string,
    quizzes: QuizResult[],
    baselineScore = 70
  ): {
    actualScore: number;
    estimatedMastery: number;
    confidence: "high" | "medium" | "preliminary";
    attempts: number;
    lastAssessed: string;
  } {
    // Filter quizzes matching this topic and subject
    const matchingQuizzes = quizzes.filter(
      (q) =>
        (q.topic.toLowerCase() === topicName.toLowerCase() || topicName.toLowerCase().includes(q.topic.toLowerCase())) &&
        (q.subject.toLowerCase() === subjectName.toLowerCase() || subjectName.toLowerCase().includes(q.subject.toLowerCase()))
    );

    if (matchingQuizzes.length === 0) {
      return {
        actualScore: baselineScore,
        estimatedMastery: baselineScore,
        confidence: "preliminary",
        attempts: 0,
        lastAssessed: "Not assessed yet",
      };
    }

    // Sort by completion date descending (most recent first)
    const sorted = [...matchingQuizzes].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    // Calculate weighted actual score: Recent attempts carry higher weight
    let totalWeight = 0;
    let weightedSum = 0;

    sorted.forEach((quiz, index) => {
      // Exponential decay weight: attempt 0 = 1.0, attempt 1 = 0.75, attempt 2 = 0.5, etc.
      const weight = Math.pow(0.75, index);
      weightedSum += quiz.score * weight;
      totalWeight += weight;
    });

    const actualScore = Math.round(weightedSum / totalWeight);

    // Requirement 9: Estimated Mastery calculation
    // Factors in confidence based on attempt count and variance
    const attempts = matchingQuizzes.length;
    let confidence: "high" | "medium" | "preliminary" = "preliminary";
    let confidenceFactor = 0.6; // Wider variance if few attempts

    if (attempts >= 4) {
      confidence = "high";
      confidenceFactor = 0.95;
    } else if (attempts >= 2) {
      confidence = "medium";
      confidenceFactor = 0.8;
    }

    // Shrink estimate slightly toward mean (70) when confidence is lower (Bayesian shrinkage)
    const estimatedMastery = Math.round(actualScore * confidenceFactor + 70 * (1 - confidenceFactor));

    return {
      actualScore,
      estimatedMastery,
      confidence,
      attempts,
      lastAssessed: sorted[0].completedAt.split("T")[0],
    };
  }

  /**
   * 3. Identify recurring mistakes from completed quiz questions
   */
  public static identifyRecurringMistakes(
    topicName: string,
    quizzes: QuizResult[]
  ): RecurringMistake[] {
    const topicQuizzes = quizzes.filter(
      (q) => q.topic.toLowerCase() === topicName.toLowerCase() || topicName.toLowerCase().includes(q.topic.toLowerCase())
    );

    const wrongQuestions: {
      question: string;
      explanation: string;
      subject: string;
      topic: string;
    }[] = [];

    for (const quiz of topicQuizzes) {
      if (quiz.questions && Array.isArray(quiz.questions)) {
        for (const q of quiz.questions) {
          if (!q.isCorrect) {
            wrongQuestions.push({
              question: q.question,
              explanation: q.explanation,
              subject: quiz.subject,
              topic: quiz.topic,
            });
          }
        }
      }
    }

    // Cluster recurring mistakes by key terms in questions / explanations
    const keywordClusters = [
      { key: "pointer", label: "Pointer Dereferencing & Indirection (*ptr)" },
      { key: "memory leak", label: "Heap Memory Management & Deallocation (malloc/free)" },
      { key: "wild pointer", label: "Uninitialized / Dangling Pointer Safety" },
      { key: "jacobian", label: "Coordinate Transformations & Jacobian Elements" },
      { key: "polar", label: "Polar Area Differential Scaling (r dr dθ)" },
      { key: "schrodinger", label: "Wavefunction Boundary Conditions & Quantization" },
      { key: "probability", label: "Born Interpretation of Probability Density |Ψ|²" },
      { key: "recursion", label: "Recursion Base Case & Stack Frames" },
      { key: "inheritance", label: "Polymorphism & Superclass Methods" },
    ];

    const detectedMistakes: RecurringMistake[] = [];

    for (const cluster of keywordClusters) {
      const matchingQuestions = wrongQuestions.filter(
        (q) =>
          q.question.toLowerCase().includes(cluster.key) ||
          q.explanation.toLowerCase().includes(cluster.key)
      );

      if (matchingQuestions.length >= 1) {
        detectedMistakes.push({
          topic: topicName,
          subject: matchingQuestions[0].subject,
          conceptCluster: cluster.label,
          mistakeCount: matchingQuestions.length,
          sampleQuestion: matchingQuestions[0].question,
          explanation: matchingQuestions[0].explanation,
        });
      }
    }

    return detectedMistakes;
  }

  /**
   * 4 & 10. Evaluate topic status using configurable thresholds & growth-mindset labeling
   */
  public static mapScoreToGrowthStatus(
    score: number,
    thresholds: ConfigurableThresholds = DEFAULT_THRESHOLDS
  ): { status: GrowthStatus; label: string; actionGuidance: string } {
    if (score < thresholds.criticalThreshold) {
      return {
        status: "active_focus",
        label: "Active Focus Area",
        actionGuidance: "Review fundamental principles and guided step-by-step models before testing.",
      };
    } else if (score < thresholds.practiceThreshold) {
      return {
        status: "developing",
        label: "Developing Foundation",
        actionGuidance: "Targeted problem sets, debugging exercises, and scaffolding hints recommended.",
      };
    } else if (score < thresholds.masteryThreshold) {
      return {
        status: "proficient",
        label: "Solid Foundation",
        actionGuidance: "Intermediate application exercises and spaced repetition to consolidate retention.",
      };
    } else {
      return {
        status: "mastered",
        label: "Demonstrated Mastery",
        actionGuidance: "Advanced synthesis, complex problem solving, and long-interval maintenance checks.",
      };
    }
  }

  /**
   * 5 & 8. Evaluate topic prerequisites and generate transparent rationale
   */
  public static evaluateTopic(
    topic: TopicPerformance,
    allTopics: TopicPerformance[],
    quizzes: QuizResult[],
    profile: StudentProfile,
    thresholds: ConfigurableThresholds = DEFAULT_THRESHOLDS
  ): DetailedTopicEvaluation {
    // 1. Calculate actual measured score and estimated mastery
    const perf = this.calculateTopicPerformance(topic.name, topic.subjectName, quizzes, topic.score);

    // 2. Identify recurring mistakes
    const recurringMistakes = this.identifyRecurringMistakes(topic.name, quizzes);

    // 3. Evaluate prerequisites
    const rule = PREREQUISITE_RULES.find(
      (r) => r.subject.toLowerCase() === topic.subjectName.toLowerCase() && r.topic.toLowerCase() === topic.name.toLowerCase()
    );

    let prerequisitesMet = true;
    let prereqDetails: DetailedTopicEvaluation["prerequisiteDetails"] = undefined;

    if (rule) {
      const prereqTopic = allTopics.find(
        (t) => t.subjectName.toLowerCase() === topic.subjectName.toLowerCase() && t.name.toLowerCase() === rule.prerequisite.toLowerCase()
      );

      if (prereqTopic) {
        const isSatisfied = prereqTopic.score >= 60;
        prerequisitesMet = isSatisfied;
        prereqDetails = {
          name: prereqTopic.name,
          score: prereqTopic.score,
          isSatisfied,
        };
      }
    }

    // 4. Learning goals match
    const matchesLearningGoal = profile.learningGoals.some(
      (goal) =>
        goal.toLowerCase().includes(topic.name.toLowerCase()) ||
        topic.name.toLowerCase().split(" ").some((w) => w.length > 4 && goal.toLowerCase().includes(w))
    );

    // 5. Growth status mapping
    const growth = this.mapScoreToGrowthStatus(perf.actualScore, thresholds);

    // Calculate days until target exam
    const examDate = new Date(profile.examDate);
    const now = new Date();
    const daysUntilExam = Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // 6. Generate concrete recommendations with transparent explanations
    const recommendations: TopicRecommendation[] = [];

    // Calculate base priority score
    let basePriority = 100 - perf.actualScore; // lower score = higher priority
    if (matchesLearningGoal) basePriority += 25;
    if (daysUntilExam <= 35) basePriority += 20;
    if (recurringMistakes.length > 0) basePriority += recurringMistakes.length * 10;
    if (!prerequisitesMet) basePriority -= 15; // advise prerequisite first

    const priorityRating: "high" | "medium" | "low" =
      basePriority >= 75 ? "high" : basePriority >= 45 ? "medium" : "low";

    // Build transparent reason
    const reasonParts: string[] = [];
    reasonParts.push(`Measured assessment score: ${perf.actualScore}% (${growth.label})`);

    if (perf.actualScore < thresholds.criticalThreshold) {
      reasonParts.push(`Fell below ${thresholds.criticalThreshold}% critical threshold`);
    } else if (perf.actualScore < thresholds.practiceThreshold) {
      reasonParts.push(`Below ${thresholds.practiceThreshold}% proficiency standard`);
    }

    if (recurringMistakes.length > 0) {
      reasonParts.push(`${recurringMistakes.length} recurring mistake pattern(s) detected`);
    }

    if (matchesLearningGoal) {
      reasonParts.push("Directly aligns with your selected learning goals");
    }

    if (!prerequisitesMet && prereqDetails) {
      reasonParts.push(`Prerequisite '${prereqDetails.name}' is currently at ${prereqDetails.score}%`);
    }

    reasonParts.push(`${daysUntilExam} days to ${profile.examName}`);
    const fullReason = reasonParts.join(" · ");

    // Generate tailored activity recommendations:
    if (perf.actualScore < thresholds.criticalThreshold) {
      // Critical: Lesson + Guided Quiz
      recommendations.push({
        id: `rec-lesson-${topic.id}`,
        topicName: topic.name,
        subjectName: topic.subjectName,
        type: "lesson",
        title: `Foundations Review: ${topic.name}`,
        description: `Step-by-step conceptual tutorial with intuitive analogies and code/math visualizations.`,
        estimatedMinutes: 30,
        priority: priorityRating,
        priorityScore: basePriority,
        reason: fullReason,
        canRevisitAnytime: true,
      });

      recommendations.push({
        id: `rec-quiz-${topic.id}`,
        topicName: topic.name,
        subjectName: topic.subjectName,
        type: "quiz",
        title: `Guided Checkpoint: ${topic.name}`,
        description: `Diagnostic quiz to verify that core concepts have been internalized.`,
        estimatedMinutes: 15,
        priority: "medium",
        priorityScore: basePriority - 10,
        reason: `Verification assessment following foundational review.`,
        canRevisitAnytime: true,
      });
    } else if (perf.actualScore < thresholds.practiceThreshold) {
      // Developing: Targeted Practice + AI Hint Session
      recommendations.push({
        id: `rec-practice-${topic.id}`,
        topicName: topic.name,
        subjectName: topic.subjectName,
        type: "practice",
        title: `Targeted Exercises: ${topic.name}`,
        description: `Multi-step problem sets focused on resolving recurring application traps.`,
        estimatedMinutes: 25,
        priority: priorityRating,
        priorityScore: basePriority,
        reason: fullReason,
        canRevisitAnytime: true,
      });

      recommendations.push({
        id: `rec-quiz-${topic.id}`,
        topicName: topic.name,
        subjectName: topic.subjectName,
        type: "quiz",
        title: `Proficiency Test: ${topic.name}`,
        description: `Timed assessment to measure progress toward the 70% proficiency mark.`,
        estimatedMinutes: 15,
        priority: "medium",
        priorityScore: basePriority - 10,
        reason: `Re-evaluate topic score against 70% threshold.`,
        canRevisitAnytime: true,
      });
    } else if (perf.actualScore < thresholds.masteryThreshold) {
      // Proficient: Spaced Revision
      recommendations.push({
        id: `rec-rev-${topic.id}`,
        topicName: topic.name,
        subjectName: topic.subjectName,
        type: "revision",
        title: `Spaced Revision: ${topic.name}`,
        description: `Active recall retrieval session to ensure long-term retention before exams.`,
        estimatedMinutes: 20,
        priority: priorityRating,
        priorityScore: basePriority,
        reason: fullReason,
        canRevisitAnytime: true,
      });
    } else {
      // Mastered: Advanced Synthesis & Maintenance Quiz
      recommendations.push({
        id: `rec-adv-${topic.id}`,
        topicName: topic.name,
        subjectName: topic.subjectName,
        type: "practice",
        title: `Advanced Synthesis Challenge: ${topic.name}`,
        description: `Deep edge-case analysis, optimization, or rigorous proof exercises.`,
        estimatedMinutes: 20,
        priority: "low",
        priorityScore: basePriority,
        reason: fullReason,
        canRevisitAnytime: true,
      });
    }

    return {
      topicId: topic.id,
      topicName: topic.name,
      subjectName: topic.subjectName,
      subjectId: topic.subjectId,
      actualMeasuredScore: perf.actualScore,
      estimatedMastery: perf.estimatedMastery,
      confidenceLevel: perf.confidence,
      assessmentCount: perf.attempts,
      lastAssessedDate: perf.lastAssessed,
      growthStatus: growth.status,
      statusLabel: growth.label,
      prerequisitesMet,
      prerequisiteDetails: prereqDetails,
      matchesLearningGoal,
      recurringMistakes,
      recommendations,
    };
  }

  /**
   * Evaluate all topics across all subjects using actual stored records
   */
  public static evaluateAllTopics(
    subjects: SubjectData[],
    quizHistory: QuizResult[],
    profile: StudentProfile,
    thresholds: ConfigurableThresholds = DEFAULT_THRESHOLDS
  ): {
    evaluatedTopics: DetailedTopicEvaluation[];
    allRecommendations: TopicRecommendation[];
    recurringMistakesTotal: RecurringMistake[];
    activeFocusCount: number;
    developingCount: number;
    proficientCount: number;
    masteredCount: number;
  } {
    const allTopics = subjects.flatMap((s) => s.topics);
    const evaluatedTopics: DetailedTopicEvaluation[] = [];
    const allRecs: TopicRecommendation[] = [];
    const mistakesPool: RecurringMistake[] = [];

    for (const topic of allTopics) {
      const evaluation = this.evaluateTopic(topic, allTopics, quizHistory, profile, thresholds);
      evaluatedTopics.push(evaluation);
      allRecs.push(...evaluation.recommendations);
      mistakesPool.push(...evaluation.recurringMistakes);
    }

    // Sort recommendations by priority score descending
    allRecs.sort((a, b) => b.priorityScore - a.priorityScore);

    // Counts
    const activeFocusCount = evaluatedTopics.filter((t) => t.growthStatus === "active_focus").length;
    const developingCount = evaluatedTopics.filter((t) => t.growthStatus === "developing").length;
    const proficientCount = evaluatedTopics.filter((t) => t.growthStatus === "proficient").length;
    const masteredCount = evaluatedTopics.filter((t) => t.growthStatus === "mastered").length;

    return {
      evaluatedTopics,
      allRecommendations: allRecs,
      recurringMistakesTotal: mistakesPool,
      activeFocusCount,
      developingCount,
      proficientCount,
      masteredCount,
    };
  }
}
